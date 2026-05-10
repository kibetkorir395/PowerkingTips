import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePrice } from "../../context/PriceContext";
import GooglePayButton from "@google-pay/button-react";
import {
  SUBSCRIPTION_PLANS,
  getPlanName,
  getSubscriptionPeriod,
  handleUpgrade,
} from "./paymentUtils";
import Swal from "sweetalert2";
import "./Payments.scss";

export default function GooglePayments({ setUserData }) {
  const { price, setPrice } = usePrice();
  const { currentUser } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("Kenya");
  const [convertedPrices, setConvertedPrices] = useState({
    daily: 250,
    weekly: 800,
    monthly: 2500,
    yearly: 8000,
  });
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [userCountry, setUserCountry] = useState(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [detectionFailed, setDetectionFailed] = useState(false);

  // Country configurations with exchange rates (relative to KES)
  const countries = {
    Kenya: { code: "KE", currency: "KES", flag: "🇰🇪", rate: 1, symbol: "KSH" },
    Nigeria: { code: "NG", currency: "NGN", flag: "🇳🇬", rate: 10.63, symbol: "₦" },
    SouthAfrica: { code: "ZA", currency: "ZAR", flag: "🇿🇦", rate: 0.22, symbol: "R" },
    Ghana: { code: "GH", currency: "GHS", flag: "🇬🇭", rate: 0.06, symbol: "₵" },
    Uganda: { code: "UG", currency: "UGX", flag: "🇺🇬", rate: 1.5, symbol: "USh" },
    Tanzania: { code: "TZ", currency: "TZS", flag: "🇹🇿", rate: 1.15, symbol: "TSh" },
    US: { code: "US", currency: "USD", flag: "🇺🇸", rate: 0.0077, symbol: "$" },
    UK: { code: "GB", currency: "GBP", flag: "🇬🇧", rate: 0.006, symbol: "£" },
  };

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

  // Method 1: Detect using browser's timezone and language
  const detectCountryFromBrowser = () => {
    try {
      // Get timezone (e.g., "Africa/Nairobi")
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Map timezone to country
      const timezoneMap = {
        "Africa/Nairobi": "Kenya",
        "Africa/Lagos": "Nigeria",
        "Africa/Johannesburg": "SouthAfrica",
        "Africa/Accra": "Ghana",
        "Africa/Kampala": "Uganda",
        "Africa/Dar_es_Salaam": "Tanzania",
        "America/New_York": "US",
        "America/Los_Angeles": "US",
        "Europe/London": "UK",
      };
      
      for (const [tz, country] of Object.entries(timezoneMap)) {
        if (timezone.includes(tz) || timezone === tz) {
          return country;
        }
      }
      
      // Check browser language
      const language = navigator.language || navigator.userLanguage;
      const languageMap = {
        "sw": "Kenya",
        "sw-KE": "Kenya",
        "en-KE": "Kenya",
        "en-NG": "Nigeria",
        "en-ZA": "SouthAfrica",
        "en-GH": "Ghana",
        "en-UG": "Uganda",
        "en-TZ": "Tanzania",
        "en-US": "US",
        "en-GB": "UK",
      };
      
      return languageMap[language] || null;
    } catch (error) {
      console.error("Browser detection error:", error);
      return null;
    }
  };

  // Method 2: Detect using freegeoip.app (CORS friendly)
  const detectCountryFromFreeGeoIP = async () => {
    try {
      // Using a CORS-friendly service
      const response = await fetch("https://api.freegeoip.app/json/", {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const countryCode = data.country_code;
        
        // Map country code to our country names
        const codeMap = {
          "KE": "Kenya",
          "NG": "Nigeria",
          "ZA": "SouthAfrica",
          "GH": "Ghana",
          "UG": "Uganda",
          "TZ": "Tanzania",
          "US": "US",
          "GB": "UK",
        };
        
        return codeMap[countryCode] || null;
      }
      return null;
    } catch (error) {
      console.error("FreeGeoIP detection error:", error);
      return null;
    }
  };

  // Method 3: Detect using ip-api.com (no API key required, CORS friendly)
  // Method 3: Detect using ip-api.com (no API key required, CORS friendly)
  const detectCountryFromIPAPI = async () => {
    try {
    // Using the correct URL (ip-api.com, not ipa-pi.com)
    const response = await fetch("https://ip-api.com/json/", {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      const countryCode = data.countryCode;
      
      const codeMap = {
        "KE": "Kenya",
        "NG": "Nigeria",
        "ZA": "SouthAfrica",
        "GH": "Ghana",
        "UG": "Uganda",
        "TZ": "Tanzania",
        "US": "US",
        "GB": "UK",
      };
      
      return codeMap[countryCode] || null;
    }
    return null;
  } catch (error) {
    console.error("IP-API detection error:", error);
    return null;
  }
};

  // Method 4: Get country from localStorage or default to Kenya
  const getStoredCountry = () => {
    const stored = localStorage.getItem("userCountry");
    if (stored && countries[stored]) {
      return stored;
    }
    return null;
  };

  // Save selected country to localStorage
  const saveCountryToStorage = (country) => {
    localStorage.setItem("userCountry", country);
  };

  // Main country detection function with fallbacks
  const detectUserCountry = async () => {
    setDetectionFailed(false);
    
    // First, check localStorage
    const storedCountry = getStoredCountry();
    if (storedCountry) {
      setSelectedCountry(storedCountry);
      setUserCountry(storedCountry);
      return;
    }
    
    // Try FreeGeoIP
    try {
      const freeGeoIPCountry = await detectCountryFromFreeGeoIP();
      if (freeGeoIPCountry && countries[freeGeoIPCountry]) {
        setSelectedCountry(freeGeoIPCountry);
        setUserCountry(freeGeoIPCountry);
        saveCountryToStorage(freeGeoIPCountry);
        return;
      }
    } catch (error) {
      console.log("FreeGeoIP failed, trying next method...");
    }
    
    // Try IP-API
    try {
      const ipAPICountry = await detectCountryFromIPAPI();
      if (ipAPICountry && countries[ipAPICountry]) {
        setSelectedCountry(ipAPICountry);
        setUserCountry(ipAPICountry);
        saveCountryToStorage(ipAPICountry);
        return;
      }
    } catch (error) {
      console.log("IP-API failed, using default...");
    }

        // Try browser-based detection first (fastest, no network)
    const browserCountry = detectCountryFromBrowser();
      if (browserCountry && countries[browserCountry]) {
        setSelectedCountry(browserCountry);
        setUserCountry(browserCountry);
        saveCountryToStorage(browserCountry);
      return;
    }
    
    // Final fallback - use Kenya as default
    setSelectedCountry("Kenya");
    setUserCountry(null);
    setDetectionFailed(true);
  };

  // Convert prices based on selected country
  const convertPricesForCountry = async () => {
    setIsLoadingRate(true);
    try {
      const country = countries[selectedCountry];
      const rate = country.rate;
      const periodToId = {
        Daily: "daily",
        Weekly: "weekly",
        Monthly: "monthly",
        Yearly: "yearly",
      };

      const converted = {};
      for (const [period, amount] of Object.entries(priceOptions)) {
        const id = periodToId[period];
        converted[id] = Math.round(amount * rate);
      }
      setConvertedPrices(converted);
    } catch (error) {
      console.error("Error converting prices:", error);
      setConvertedPrices({
        daily: priceOptions.Daily,
        weekly: priceOptions.Weekly,
        monthly: priceOptions.Monthly,
        yearly: priceOptions.Yearly,
      });
    } finally {
      setIsLoadingRate(false);
    }
  };

  // Update prices when country changes
  useEffect(() => {
    convertPricesForCountry();
  }, [selectedCountry]);

  // Detect user country on component mount
  useEffect(() => {
    detectUserCountry();
  }, []);

  // Get current converted price based on selected plan
  const getCurrentConvertedPrice = () => {
    const period = getSubscriptionPeriod(price).toLowerCase();
    return convertedPrices[period] || price;
  };

  // Get currency symbol for selected country
  const getCurrencySymbol = () => {
    return countries[selectedCountry]?.symbol || "KSH";
  };

  // Get currency code for Google Pay
  const getCurrencyCode = () => {
    return countries[selectedCountry]?.currency || "KES";
  };

  // Get country code for Google Pay
  const getCountryCode = () => {
    const country = countries[selectedCountry];
    switch (selectedCountry) {
      case "Kenya": return "KE";
      case "Nigeria": return "NG";
      case "SouthAfrica": return "ZA";
      case "Ghana": return "GH";
      case "Uganda": return "UG";
      case "Tanzania": return "TZ";
      case "US": return "US";
      case "UK": return "GB";
      default: return "KE";
    }
  };

  // Handle payment authorization (required for callback intents)
  const onPaymentAuthorized = (paymentData) => {
    console.log("Payment authorized:", paymentData);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          transactionState: "SUCCESS",
        });
      }, 500);
    });
  };

  // Handle successful payment
  const handleLoadPaymentData = async (paymentData) => {
    console.log("Payment data:", paymentData);
    setProcessing(true);

    try {
      const transactionData = {
        type : 'credit',
        amount : getCurrentConvertedPrice(),
        description : `${getPlanName(price)} VIP Subscription`,
        category : 'Subscription',
        currency : getCurrencyCode(),
        paymentMethod: "GPay",
        reference: `VIP-${getPlanName(price)}-${Date.now()}`,
      }
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

  // Handle payment cancellation
  const handleCancel = (reason) => {
    console.log("Payment cancelled:", reason);
    Swal.fire({
      title: "Payment Cancelled",
      text: "You cancelled the payment process.",
      icon: "info",
      confirmButtonText: "OK",
    });
  };

  // Handle payment error
  const handleError = (error) => {
    console.error("Google Pay error:", error);
    Swal.fire({
      title: "Payment Error",
      text: error.statusMessage || "Unable to process Google Pay payment. Please try again.",
      icon: "error",
      confirmButtonText: "OK",
    });
  };

  // Handle plan selection
  const handlePlanSelect = (planValue) => {
    setPrice(planValue);
  };

  // Build Google Pay payment request with proper callbacks
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
              gateway: "paypal", //,"example"
              gatewayMerchantId: "R7RTJ82X5S6KY",//"exampleGatewayMerchantId",//
            },
          },
        },
      ],
      merchantInfo: {
        merchantId: "BCR2DN5TU36KB6YI",//"12345678901234567890"
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

  return (
    <div className="google-pay-wrapper">
      {/* Country Selection Section */}
      <div className="country-selector">
        <div
          className="selected-country"
          onClick={() => setShowCountrySelector(!showCountrySelector)}
        >
          <span className="flag">{countries[selectedCountry].flag}</span>
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
                  saveCountryToStorage(country);
                }}
              >
                <span className="flag">{config.flag}</span>
                <span className="country-name">{country}</span>
                <span className="currency">{config.currency}</span>
              </div>
            ))}
          </div>
        )}

        {userCountry && userCountry !== selectedCountry && !detectionFailed && (
          <div className="detected-country">
            🔍 Detected: {userCountry}
            <button onClick={() => {
              setSelectedCountry(userCountry);
              saveCountryToStorage(userCountry);
            }}>
              Use detected
            </button>
          </div>
        )}

        {detectionFailed && (
          <div className="detection-failed">
            🌍 Please select your country for accurate pricing
          </div>
        )}
      </div>

      {/* Subscription Plans Selector */}
      <div className="plan-selector">
        {subscriptionPlans.map((plan) => {
          const convertedPrice = convertedPrices[plan.id] || plan.value;
          const currency = getCurrencySymbol();

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
                  : `${currency} ${Math.round(convertedPrice)}`}
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
            : `${getCurrencySymbol()} ${Math.round(getCurrentConvertedPrice())}`}
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