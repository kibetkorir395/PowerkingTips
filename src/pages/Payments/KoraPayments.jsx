// components/Payments/KoraPayments.js
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePrice } from "../../context/PriceContext";
import { useCurrency } from "../../context/CurrencyContext.jsx";
import {
  getSubscriptionPeriod,
  getPlanName,
  handleUpgrade,
} from "./paymentUtils";
import Swal from "sweetalert2";

export default function KoraPayments({ setUserData }) {
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
  const [koraLoaded, setKoraLoaded] = useState(false);
  const scriptLoadedRef = useRef(false);

  // Price options in KES (base currency)
  const priceOptions = {
    Daily: 250,
    Weekly: 800,
    Monthly: 2500,
    Yearly: 8000,
  };

  // Subscription plans
  const subscriptionPlans = [
    {
      id: "daily",
      value: 250,
      label: "Daily VIP",
      price: "KSH 250",
      period: "Daily",
    },
    {
      id: "weekly",
      value: 800,
      label: "7 Days VIP",
      price: "KSH 800",
      period: "Weekly",
    },
    {
      id: "monthly",
      value: 2500,
      label: "30 Days VIP",
      price: "KSH 2500",
      period: "Monthly",
    },
    {
      id: "yearly",
      value: 8000,
      label: "1 Year VIP",
      price: "KSH 8000",
      period: "Yearly",
    },
  ];

  // Load Kora script
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const script = document.createElement("script");
    script.src =
      "https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js";
    script.async = true;

    script.onload = () => {
      console.log("Kora script loaded");
      scriptLoadedRef.current = true;
      setTimeout(() => {
        if (window.Korapay) {
          setKoraLoaded(true);
          console.log("Korapay initialized");
        }
      }, 500);
    };

    script.onerror = (err) => {
      console.error("Failed to load Kora script:", err);
    };

    document.head.appendChild(script);
  }, []);

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

  const handlePayment = () => {
    if (!currentUser) {
      Swal.fire({
        title: "Login Required",
        text: "Please login first to continue with payment",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    if (!koraLoaded || !window.Korapay) {
      Swal.fire({
        title: "Loading Payment Gateway",
        text: "Please wait, payment gateway is initializing...",
        icon: "info",
        confirmButtonText: "OK",
      });
      return;
    }

    setProcessing(true);

    const countries = getCountries();
    const countryConfig = countries[selectedCountry];
    const amountToPay = Math.round(getCurrentConvertedPrice());
    const reference = `ref-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const paymentOptions = {
      key: import.meta.env.VITE_KORA_PK_KEY,
      reference: reference,
      amount: amountToPay,
      currency: countryConfig.currency,
      customer: {
        name: currentUser.email?.split("@")[0] || "Customer",
        email: currentUser.email,
      },
      narration: `${getPlanName(price)} VIP Subscription`,
      onClose: () => {
        console.log("Payment modal closed");
        setProcessing(false);
      },
      onSuccess: (data) => {
        console.log("Payment successful:", data);
        const transactionData = {
          type: 'credit',
          amount: getCurrentConvertedPrice(),
          description: `${getPlanName(price)} VIP Subscription`,
          category: 'Subscription',
          currency: getSymbol(),
          paymentMethod: "Mobile",
          reference,
        };
        setProcessing(false);
        handleUpgrade(currentUser, transactionData, setUserData);
      },
      onFailed: (data) => {
        console.error("Payment failed:", data);
        setProcessing(false);
        Swal.fire({
          title: "Payment Failed",
          text: data?.message || "Please try again.",
          icon: "error",
          confirmButtonText: "OK",
        });
      },
    };

    try {
      window.Korapay.initialize(paymentOptions);
    } catch (error) {
      console.error("Kora payment error:", error);
      setProcessing(false);
      Swal.fire({
        title: "Payment Error",
        text: error.message || "Unable to initialize payment. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handlePlanSelect = (planValue) => {
    setPrice(planValue);
  };

  const countries = getCountries();

  return (
    <div className="kora-payment-wrapper">
      {/* Country Selection Section */}
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
          disabled={processing || isLoadingRate || !koraLoaded}
        >
          {processing ? (
            <span>
              <i className="fas fa-spinner fa-spin"></i> PROCESSING...
            </span>
          ) : !koraLoaded ? (
            <span>
              <i className="fas fa-spinner fa-spin"></i> LOADING GATEWAY...
            </span>
          ) : (
            <span>💳 Pay Now</span>
          )}
        </button>
      </div>
    </div>
  );
}