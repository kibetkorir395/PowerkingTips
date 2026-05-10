import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePrice } from "../../context/PriceContext";
import {
  SUBSCRIPTION_PLANS,
  getPlanName,
  handleUpgrade,
} from "./paymentUtils";
import Swal from "sweetalert2";
import "./Payments.scss";

export default function PaypalPayments({ setUserData }) {
  const { price, setPrice } = usePrice();
  const { currentUser } = useAuth();
  const [isPaypalLoaded, setIsPaypalLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const buttonContainerRef = useRef(null);
  const paypalButtonsRef = useRef(null);
  const scriptRef = useRef(null);

  const subscriptionPlans = SUBSCRIPTION_PLANS.dollars;

  // Initialize price
  useEffect(() => {
    setPrice(subscriptionPlans[0].value);
  }, []);

  // Cleanup function for PayPal buttons
  const cleanupPayPalButtons = useCallback(() => {
    if (paypalButtonsRef.current) {
      try {
        paypalButtonsRef.current.close();
      } catch (e) {
        console.log("Error closing PayPal buttons:", e);
      }
      paypalButtonsRef.current = null;
    }
    if (buttonContainerRef.current) {
      buttonContainerRef.current.innerHTML = "";
    }
  }, []);

  // Load PayPal script
  const loadPayPalScript = useCallback(() => {
    // Remove existing script if any
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }

    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=AT-E8-dZV6R5JAeHjr_DG1mivBrJ72h8ZlBt-rAHf6ypsKhg5lfpsRqWSIM5H1Xa58YZYhBbL0wObsw-&currency=USD&components=buttons";
    script.async = true;
    
    script.onload = () => {
      // Wait for PayPal to be fully initialized
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.paypal && window.paypal.Buttons) {
          clearInterval(checkInterval);
          setIsPaypalLoaded(true);
          setLoadError(false);
          console.log("PayPal SDK loaded successfully");
        } else if (attempts > 20) {
          clearInterval(checkInterval);
          setLoadError(true);
          console.error("PayPal Buttons not available after timeout");
        }
      }, 250);
    };
    
    script.onerror = (error) => {
      console.error("Failed to load PayPal SDK:", error);
      setLoadError(true);
      Swal.fire({
        title: "Error",
        text: "Failed to load PayPal. Please check your internet connection.",
        icon: "error",
        confirmButtonText: "OK",
      });
    };
    
    document.body.appendChild(script);
    scriptRef.current = script;
  }, []);

  // Load script on mount
  useEffect(() => {
    loadPayPalScript();
    
    return () => {
      // Cleanup on unmount
      if (scriptRef.current) {
        scriptRef.current.remove();
      }
      cleanupPayPalButtons();
    };
  }, [loadPayPalScript, cleanupPayPalButtons]);

  // Create order function
  const createOrder = useCallback(async (data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          description: `${getPlanName(price)} VIP Subscription`,
          amount: {
            value: price.toFixed(2),
            currency_code: "USD",
          },
        },
      ],
    });
  }, [price]);

  // On approve function
  const onApprove = useCallback(async (data, actions) => {
    setIsProcessing(true);
    try {
      const details = await actions.order.capture();
      console.log("Payment completed:", details);

      const transactionData = {
        type : 'credit',
        amount : price,
        description : `${getPlanName(price)} VIP Subscription`,
        category : 'Subscription',
        currency : 'usd',
        paymentMethod: "PayPal",
        reference: `VIP-${getPlanName(price)}-${Date.now()}`,
      }
      
      await handleUpgrade(currentUser, transactionData, setUserData);
    } catch (error) {
      console.error("Payment capture error:", error);
      Swal.fire({
        title: "Payment Failed",
        text: error.message || "There was an error processing your payment. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#d33",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [currentUser, price, setUserData]);

  // On error function
  const onError = useCallback((err) => {
    console.error("PayPal error:", err);
    setIsProcessing(false);
    Swal.fire({
      title: "Payment Error",
      text: "An error occurred with PayPal. Please try again.",
      icon: "error",
      confirmButtonText: "OK",
      confirmButtonColor: "#d33",
    });
  }, []);

  // On cancel function
  const onCancel = useCallback(() => {
    console.log("Payment cancelled");
    setIsProcessing(false);
    Swal.fire({
      title: "Payment Cancelled",
      text: "You cancelled the payment process.",
      icon: "info",
      confirmButtonText: "OK",
      confirmButtonColor: "#00ae58",
    });
  }, []);

  // Render PayPal buttons when loaded
  useEffect(() => {
    if (!isPaypalLoaded || !buttonContainerRef.current || isProcessing) {
      return;
    }

    // Cleanup existing buttons
    cleanupPayPalButtons();

    // Create new buttons
    try {
      const paypalButtons = window.paypal.Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "pill",
          label: "paypal",
          height: 40,
        },
        createOrder: createOrder,
        onApprove: onApprove,
        onError: onError,
        onCancel: onCancel,
      });
      
      if (buttonContainerRef.current) {
        paypalButtons.render(buttonContainerRef.current);
        paypalButtonsRef.current = paypalButtons;
      }
    } catch (error) {
      console.error("Failed to render PayPal buttons:", error);
      setLoadError(true);
    }
  }, [isPaypalLoaded, price, isProcessing, createOrder, onApprove, onError, onCancel, cleanupPayPalButtons]);

  // Handle retry
  const handleRetry = () => {
    setLoadError(false);
    setIsPaypalLoaded(false);
    setRetryCount(prev => prev + 1);
    cleanupPayPalButtons();
    loadPayPalScript();
  };

  const handlePlanSelect = (planValue) => {
    setPrice(planValue);
  };

  // Show loading state while script is loading
  if (!isPaypalLoaded && !loadError) {
    return (
      <div className="paypal-payment-wrapper">
        <div className="plan-selector">
          {subscriptionPlans.map((plan) => (
            <label key={plan.id} className="plan-option">
              <span className="plan-label">{plan.label}</span>
              <span className="plan-price">{plan.price}</span>
            </label>
          ))}
        </div>
        <div className="paypal-loading-state">
          <div className="loader-spinner"></div>
          <p>Loading PayPal...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (loadError) {
    return (
      <div className="paypal-payment-wrapper">
        <div className="plan-selector">
          {subscriptionPlans.map((plan) => (
            <label key={plan.id} className="plan-option">
              <span className="plan-label">{plan.label}</span>
              <span className="plan-price">{plan.price}</span>
            </label>
          ))}
        </div>
        <div className="paypal-error-state">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>PayPal Failed to Load</h3>
          <p>Please check your internet connection and try again.</p>
          <button onClick={handleRetry} className="btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="paypal-payment-wrapper">
      <div className="plan-selector">
        {subscriptionPlans.map((plan) => (
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
            <span className="plan-price">{plan.price}</span>
          </label>
        ))}
      </div>

      <div className="paypal-payment">
        <h3>
          GET {getPlanName(price).toUpperCase()} VIP FOR ${price}
        </h3>
        
        <div className="paypal-buttons-container">
          <div ref={buttonContainerRef}></div>
        </div>

        <p className="payment-note">
          <i className="fas fa-lock"></i> Secure payment powered by PayPal
        </p>
      </div>
    </div>
  );
}