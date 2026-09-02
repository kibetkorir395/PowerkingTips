// pages/Payments/FlutterwavePayments.jsx
import { useContext, useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePrice } from "../../context/PriceContext";
import { useCurrency } from "../../context/CurrencyContext.jsx";
import { useFlutterwave } from "react-flutterwave";
import Swal from "sweetalert2";
import {
  SUBSCRIPTION_PLANS,
  getSubscriptionPeriod,
  getPlanName,
  handleUpgrade,
} from "./paymentUtils";
import "./Payments.scss";

export default function FlutterwavePayments({ setUserData }) {
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

  const handlePlanSelect = (planValue) => {
    setPrice(planValue);
  };

  // Configure Flutterwave payment - moved to top level
  const flutterwaveConfig = useMemo(() => {
    const amountToPay = Math.round(getCurrentConvertedPrice());
    const currency = getCurrencyCode();
    const email = currentUser?.email || "";
    const name = currentUser?.displayName || currentUser?.name || "Customer";

    return {
      public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount: amountToPay,
      currency: currency,
      payment_options: "card,mobilemoney,ussd,banktransfer",
      redirect_url: window.location.href,
      customer: {
        email: email,
        phonenumber: currentUser?.phoneNumber || "",
        name: name,
      },
      customizations: {
        title: "VIP Subscription",
        description: `${getPlanName(price)} VIP Subscription`,
        logo: "https://assets.piedpiper.com/logo.png",
      },
      meta: {
        user_id: currentUser?.uid || currentUser?.email || "anonymous",
        plan: getPlanName(price),
        subscription_type: "vip_subscription",
      },
    };
  }, [currentUser, price, getCurrentConvertedPrice, getCurrencyCode, getPlanName]);

  // Initialize Flutterwave payment hook at top level
  const handleFlutterPayment = useFlutterwave(flutterwaveConfig);

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

    setProcessing(true);

    try {
      handleFlutterPayment({
        callback: (response) => {
          console.log("Payment response:", response);
          
          // Check if payment was successful
          if (response.status === "successful") {
            Swal.fire({
              title: "Payment Successful! 🎉",
              html: `
                <div style="text-align: center;">
                  <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
                  <h3 style="margin: 15px 0;">${getSymbol()} ${Math.round(getCurrentConvertedPrice())} Paid</h3>
                  <p>Your VIP subscription payment was successful!</p>
                  <p style="font-size: 0.85rem; color: #666; margin-top: 10px;">
                    Transaction ID: ${response.transaction_id || response.tx_ref}
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
                paymentMethod: "Flutterwave",
                reference: response.transaction_id || response.tx_ref,
                flutterwave_response: response,
              };
              handleUpgrade(currentUser, transactionData, setUserData);
              setProcessing(false);
            });
          } else if (response.status === "cancelled") {
            Swal.fire({
              title: "Payment Cancelled",
              text: "You cancelled the payment process.",
              icon: "info",
              confirmButtonText: "OK",
            });
            setProcessing(false);
          } else {
            Swal.fire({
              title: "Payment Failed",
              text: response.message || "Payment was not successful. Please try again.",
              icon: "error",
              confirmButtonText: "Try Again",
            });
            setProcessing(false);
          }
        },
        onClose: () => {
          console.log("Payment modal closed");
          setProcessing(false);
        },
      });
    } catch (error) {
      console.error("Flutterwave payment error:", error);
      Swal.fire({
        title: "Payment Error",
        text: error.message || "An error occurred while initializing payment.",
        icon: "error",
        confirmButtonText: "OK",
      });
      setProcessing(false);
    }
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
              <i className="fas fa-credit-card"></i> Pay Now
            </span>
          )}
        </button>
      </div>
    </div>
  );
}