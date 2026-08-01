// components/Payments/GooglePayments.js
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePrice } from "../../context/PriceContext";
import { useCurrency } from "../../context/CurrencyContext.jsx";
import GooglePayButton from "@google-pay/button-react";
import {
  getPlanName,
  getSubscriptionPeriod,
  handleUpgrade,
} from "./paymentUtils";
import Swal from "sweetalert2";
import "./Payments.scss";

export default function GooglePayments({ setUserData }) {
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

  // Base price options in KES
  const priceOptions = {
    Daily: 250,
    Weekly: 800,
    Monthly: 2500,
    Yearly: 8000,
  };

  // Subscription plans display
  const subscriptionPlans = [
    { id: "daily", value: 250, label: "Daily VIP", period: "Daily" },
    { id: "weekly", value: 800, label: "Weekly VIP", period: "Weekly" },
    { id: "monthly", value: 2500, label: "Monthly VIP", period: "Monthly" },
    { id: "yearly", value: 8000, label: "Yearly VIP", period: "Yearly" },
  ];

  // Initialize price
  useEffect(() => {
    setPrice(subscriptionPlans[0].value);
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

  const getCountryCode = () => {
    const countries = getCountries();
    return countries[selectedCountry]?.code || "KE";
  };

  const onPaymentAuthorized = (paymentData) => {
    console.log("Payment authorized:", paymentData);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ transactionState: "SUCCESS" });
      }, 500);
    });
  };

  const handleLoadPaymentData = async (paymentData) => {
    console.log("Payment data:", paymentData);
    setProcessing(true);

    try {
      const transactionData = {
        type: 'credit',
        amount: getCurrentConvertedPrice(),
        description: `${getPlanName(price)} VIP Subscription`,
        category: 'Subscription',
        currency: getCurrencyCode(),
        paymentMethod: "GPay",
        reference: `VIP-${getPlanName(price)}-${Date.now()}`,
      };
      await handleUpgrade(currentUser, transactionData, setUserData);
    } catch (error) {
      console.error("Upgrade error:", error);
      Swal.fire({
        title: "Error",
        text: "Payment was successful but upgrade failed. Please contact support.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = (reason) => {
    console.log("Payment cancelled:", reason);
    Swal.fire({
      title: "Payment Cancelled",
      text: "You cancelled the payment process.",
      icon: "info",
      confirmButtonText: "OK",
    });
  };

  const handleError = (error) => {
    console.error("Google Pay error:", error);
    Swal.fire({
      title: "Payment Error",
      text: error.statusMessage || "Unable to process Google Pay payment. Please try again.",
      icon: "error",
      confirmButtonText: "OK",
    });
  };

  const handlePlanSelect = (planValue) => {
    setPrice(planValue);
  };

  const getPaymentRequest = () => {
    const amountToPay = getCurrentConvertedPrice();
    const currency = getCurrencyCode();
    const countryCode = getCountryCode();

    return {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: "CARD",
          parameters: {
            allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
            allowedCardNetworks: ["MASTERCARD", "VISA", "AMEX", "DISCOVER", "JCB"],
          },
          tokenizationSpecification: {
            type: "PAYMENT_GATEWAY",
            parameters: {
              gateway: "paypal",
              gatewayMerchantId: "R7RTJ82X5S6KY",
            },
          },
        },
      ],
      merchantInfo: {
        merchantId: "BCR2DN5TU36KB6YI",
        merchantName: "Powerking Tips",
      },
      transactionInfo: {
        totalPriceStatus: "FINAL",
        totalPriceLabel: "Total",
        totalPrice: amountToPay.toFixed(2),
        currencyCode: currency,
        countryCode: countryCode,
      },
      callbackIntents: ["PAYMENT_AUTHORIZATION"],
      emailRequired: true,
      shippingAddressRequired: false,
    };
  };

  const countries = getCountries();

  return (
    <div className="google-pay-wrapper">
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

      {/* Subscription Plans Selector */}
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

      {/* Google Pay Button */}
      <div className="google-pay">
        <h3>
          GET {getPlanName(price).toUpperCase()} VIP FOR{" "}
          {isLoadingRate
            ? "Loading..."
            : `${getSymbol()} ${Math.round(getCurrentConvertedPrice())}`}
        </h3>

        {!processing && !isLoadingRate && (
          <GooglePayButton
            environment="PRODUCTION"
            buttonColor="black"
            buttonType="subscribe"
            buttonSizeMode="static"
            buttonRadius={8}
            buttonLocale="en"
            paymentRequest={getPaymentRequest()}
            onLoadPaymentData={handleLoadPaymentData}
            onPaymentAuthorized={onPaymentAuthorized}
            onCancel={handleCancel}
            onError={handleError}
            className="google-pay-btn"
          />
        )}

        {(processing || isLoadingRate) && (
          <div className="processing-indicator">
            <i className="fas fa-spinner fa-spin"></i>{" "}
            {isLoadingRate ? "LOADING RATES..." : "PROCESSING PAYMENT..."}
          </div>
        )}
      </div>
    </div>
  );
}