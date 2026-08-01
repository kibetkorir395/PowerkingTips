// pages/Payments/PaystackPaymentsV1.jsx
import { useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePrice } from "../../context/PriceContext";
import { useCurrency } from "../../context/CurrencyContext.jsx";
import Swal from "sweetalert2";
import {
  SUBSCRIPTION_PLANS,
  getSubscriptionPeriod,
  getPlanName,
  handleUpgrade,
  formatPhoneNumber,
  isValidPhoneNumber,
} from "./paymentUtils";
import "./Payments.scss";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_PAYSTACK_API_BASE_URL;

export default function PaystackPaymentsV1({ setUserData }) {
  const { price, setPrice } = usePrice();
  const { currentUser } = useAuth();
  const { 
    selectedCountry, 
    setSelectedCountry,
    showCountrySelector,
    setShowCountrySelector,
    userCountry,
    getSymbol,
    getCurrencyCode,
    getCountries,
    isLoadingRate,
  } = useCurrency();
  
  const [processing, setProcessing] = useState(false);
  const [convertedPrices, setConvertedPrices] = useState({
    daily: 250,
    weekly: 800,
    monthly: 2500,
    yearly: 8000,
  });
  const statusCheckIntervalRef = useRef(null);

  // Price options in KES (base currency)
  const priceOptions = {
    Daily: 250,
    Weekly: 800,
    Monthly: 2500,
    Yearly: 8000,
  };

  // Subscription plans
  const subscriptionPlans = [
    { id: "daily", value: 250, label: "Daily VIP", period: "Daily" },
    { id: "weekly", value: 800, label: "7 Days VIP", period: "Weekly" },
    { id: "monthly", value: 2500, label: "30 Days VIP", period: "Monthly" },
    { id: "yearly", value: 8000, label: "1 Year VIP", period: "Yearly" },
  ];

  // Update converted prices when country changes
  useEffect(() => {
    const countries = getCountries();
    const rate = countries[selectedCountry]?.rate || 1;
    
    setConvertedPrices({
      daily: Math.round(priceOptions.Daily * rate),
      weekly: Math.round(priceOptions.Weekly * rate),
      monthly: Math.round(priceOptions.Monthly * rate),
      yearly: Math.round(priceOptions.Yearly * rate),
    });
  }, [selectedCountry]);

  const getCurrentConvertedPrice = () => {
    const period = getSubscriptionPeriod(price).toLowerCase();
    return convertedPrices[period] || price;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
    };
  }, []);

  const startPaymentPolling = (reference) => {
    let attempts = 0;
    const maxAttempts = 30;

    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
        }
        Swal.fire({
          title: "Payment Timeout",
          html: "⏰ Payment monitoring timeout. Please check your transaction history.",
          icon: "warning",
          confirmButtonText: "OK",
        });
        setProcessing(false);
        return;
      }

      attempts++;

      try {
        const response = await fetch(`${API_BASE_URL}/api/status/${reference}`);
        const data = await response.json();

        if (data.success) {
          if (data.paid) {
            if (statusCheckIntervalRef.current) {
              clearInterval(statusCheckIntervalRef.current);
            }

            Swal.fire({
              title: "Payment Successful! 🎉",
              html: `
                <div style="text-align: center;">
                  <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
                  <h3 style="margin: 15px 0;">${getSymbol()} ${Math.round(getCurrentConvertedPrice())} Paid</h3>
                  <p>Your VIP subscription payment was successful!</p>
                  <p style="font-size: 0.85rem; color: #666; margin-top: 10px;">
                    Reference: ${reference}
                  </p>
                </div>
              `,
              icon: "success",
              confirmButtonText: "Activate Subscription",
            }).then(() => {
              const transactionData = {
                type: 'credit',
                amount: getCurrentConvertedPrice(),
                description: `${getPlanName(price)} VIP Subscription`,
                category: 'Subscription',
                currency: getCurrencyCode(),
                paymentMethod: "Paystack",
                reference: reference,
              };
              handleUpgrade(currentUser, transactionData, setUserData);
            });
            return;
          }

          if (data.can_retry) {
            if (statusCheckIntervalRef.current) {
              clearInterval(statusCheckIntervalRef.current);
            }
            Swal.fire({
              title: "Payment Not Completed",
              html: "⚠️ Payment not completed. You can try again.",
              icon: "warning",
              confirmButtonText: "OK",
            });
            setProcessing(false);
            return;
          }
        }
      } catch (error) {
        console.log("Polling attempt", attempts, "continuing...");
      }
    };

    statusCheckIntervalRef.current = setInterval(checkStatus, 5000);
  };

  const submitOTP = async (reference, otp) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submit-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otp.trim(), reference: reference }),
      });

      const data = await response.json();

      if (data.success) {
        return true;
      } else {
        Swal.showValidationMessage(
          data.message || "Invalid OTP. Please try again."
        );
        return false;
      }
    } catch (error) {
      Swal.showValidationMessage("OTP verification failed. Please try again.");
      return false;
    }
  };

  const initiatePayment = async (phone) => {
    setProcessing(true);

    Swal.fire({
      title: "Initiating Payment",
      html: "Connecting to M-Pesa...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const formattedPhone = formatPhoneNumber(phone);
      const email = currentUser?.email;

      if (!email) {
        throw new Error("User email not found. Please login again.");
      }

      const amountToPay = Math.round(getCurrentConvertedPrice());
      const currency = getCurrencyCode();

      const response = await fetch(`${API_BASE_URL}/api/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          amount: amountToPay,
          phone: formattedPhone,
          userId: currentUser?.email || "anonymous",
          activation_type: "vip_subscription",
          currency: currency,
          country: selectedCountry,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Swal.close();

        if (data.status === "success") {
          Swal.fire({
            title: "Payment Successful! 🎉",
            html: `
              <div style="text-align: center;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
                <h3 style="margin: 15px 0;">${getSymbol()} ${Math.round(getCurrentConvertedPrice())} Paid</h3>
                <p>Your VIP subscription payment was successful!</p>
              </div>
            `,
            icon: "success",
            confirmButtonText: "Activate Subscription",
          }).then(() => {
            const transactionData = {
              type: 'credit',
              amount: getCurrentConvertedPrice(),
              description: `${getPlanName(price)} VIP Subscription`,
              category: 'Subscription',
              currency: getCurrencyCode(),
              paymentMethod: "Paystack",
              reference: data.reference || `ref-${Date.now()}`,
            };
            handleUpgrade(currentUser, transactionData, setUserData);
          });
        } else if (data.requires_authorization) {
          Swal.fire({
            title: "Check Your Phone",
            html: `
              <div style="text-align: center;">
                <i class="fas fa-mobile-alt" style="font-size: 48px; color: #065f46;"></i>
                <h3 style="margin: 15px 0;">Enter M-Pesa PIN</h3>
                <p>Check your phone to authorize payment of <strong>${getSymbol()} ${Math.round(getCurrentConvertedPrice())}</strong></p>
                <p><small>Phone: ${formattedPhone}</small></p>
              </div>
            `,
            icon: "info",
            confirmButtonText: "OK",
          }).then(() => {
            startPaymentPolling(data.reference);
          });
        } else if (data.requires_otp) {
          Swal.fire({
            title: "OTP Required",
            html: "📱 OTP sent! Please check your phone for the authorization code.",
            input: "text",
            inputPlaceholder: "Enter OTP",
            showCancelButton: true,
            confirmButtonText: "Submit OTP",
            cancelButtonText: "Cancel",
            showLoaderOnConfirm: true,
            preConfirm: async (otp) => {
              if (!otp) {
                Swal.showValidationMessage("Please enter the OTP");
                return false;
              }
              return await submitOTP(data.reference, otp);
            },
          }).then((result) => {
            if (result.isConfirmed && result.value) {
              startPaymentPolling(data.reference);
            } else {
              setProcessing(false);
            }
          });
        } else {
          Swal.fire({
            title: "Payment Initiated",
            html: `📱 ${data.message || "Payment processing..."}`,
            icon: "info",
            confirmButtonText: "OK",
          }).then(() => {
            startPaymentPolling(data.reference);
          });
        }
      } else {
        throw new Error(data.message || "Payment initialization failed");
      }
    } catch (error) {
      Swal.close();
      Swal.fire({
        title: "Payment Failed",
        html: `
          <p>${
            error.message || "Unable to process payment. Please try again."
          }</p>
          <p style="font-size: 0.8rem; color: #666; margin-top: 10px;">
            Ensure your phone number is correct and you have sufficient M-Pesa balance.
          </p>
        `,
        icon: "error",
        confirmButtonText: "Try Again",
      });
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!currentUser) {
      Swal.fire({
        title: "Login Required",
        text: "Please login first to continue with payment",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    const { value: phone } = await Swal.fire({
      title: "Enter M-Pesa Phone Number",
      html: `
        <div style="text-align: center; margin-bottom: 15px;">
          <i class="fas fa-mobile-alt" style="font-size: 48px; color: #065f46;"></i>
        </div>
        <p>Accepted formats: 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, +2547XXXXXXXX, 7XXXXXXXX</p>
      `,
      input: "tel",
      inputPlaceholder: "e.g., 0712345678",
      showCancelButton: true,
      confirmButtonText: "Continue",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#059669",
      inputValidator: (value) => {
        if (!value) return "Phone number is required!";
        if (!isValidPhoneNumber(value)) {
          return "Please enter a valid Kenyan phone number";
        }
        return null;
      },
    });

    if (!phone) return;
    await initiatePayment(phone);
  };

  const handlePlanSelect = (planValue) => {
    setPrice(planValue);
  };

  const countries = getCountries();

  return (
    <div className="kora-payment-wrapper">
      {/* Country Selector */}
      <div className="country-selector">
        <div
          className="selected-country"
          onClick={() => setShowCountrySelector(!showCountrySelector)}
        >
          <span className="flag">{countries[selectedCountry]?.flag || "🌍"}</span>
          <span className="country-name">{selectedCountry}</span>
          <span className="dropdown-arrow">
            {showCountrySelector ? "▲" : "▼"}
          </span>
        </div>

        {showCountrySelector && (
          <div className="country-dropdown">
            {Object.entries(countries).map(([country, config]) => (
              <div
                key={country}
                className={`country-option ${
                  selectedCountry === country ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedCountry(country);
                  setShowCountrySelector(false);
                }}
              >
                <span className="flag">{config.flag}</span>
                <span className="country-name">{country}</span>
                <span className="currency">{config.currency}</span>
              </div>
            ))}
          </div>
        )}

        {userCountry && userCountry !== selectedCountry && (
          <div className="detected-country">
            🔍 Detected: {userCountry}
            <button onClick={() => setSelectedCountry(userCountry)}>
              Use detected
            </button>
          </div>
        )}
      </div>

      {/* Plan Selector */}
      <div className="plan-selector">
        {subscriptionPlans.map((plan) => {
          const convertedPrice = convertedPrices[plan.id] || plan.value;
          const currencySymbol = getSymbol();

          return (
            <label
              key={plan.id}
              className={`plan-option ${price === plan.value ? "active" : ""}`}
            >
              <input
                type="radio"
                name="subscription-plan"
                value={plan.value}
                checked={price === plan.value}
                onChange={() => handlePlanSelect(plan.value)}
              />
              <span className="plan-label">{plan.label}</span>
              <span className="plan-price">
                {isLoadingRate
                  ? "Loading..."
                  : `${currencySymbol} ${Math.round(convertedPrice)}`}
              </span>
            </label>
          );
        })}
      </div>

      {/* Payment Section */}
      <div className="kora-payment">
        <h3>
          GET {getPlanName(price).toUpperCase()} VIP FOR{" "}
          {isLoadingRate
            ? "Loading..."
            : `${getSymbol()} ${Math.round(getCurrentConvertedPrice())}`}
        </h3>

        <button
          onClick={handlePayment}
          className="confirm-payment-btn btn"
          disabled={processing || isLoadingRate}
        >
          {processing ? (
            <span>
              <i className="fas fa-spinner fa-spin"></i> PROCESSING...
            </span>
          ) : isLoadingRate ? (
            <span>
              <i className="fas fa-spinner fa-spin"></i> LOADING RATES...
            </span>
          ) : (
            <span>
              <i className="fas fa-mobile-alt"></i> Pay Now
            </span>
          )}
        </button>
      </div>
    </div>
  );
}