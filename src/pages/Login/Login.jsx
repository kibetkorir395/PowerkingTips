import { useState, useEffect, useRef } from "react";
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
  const buttonContainerRef = useRef(null);
  const paypalButtonsRef = useRef(null);

  const subscriptionPlans = SUBSCRIPTION_PLANS.dollars;

  // Initialize price
  useEffect(() => {
    setPrice(subscriptionPlans[0].value);
  }, []);

  // Load PayPal script properly
  useEffect(() => {
    // Check if PayPal is already loaded
    if (window.paypal && window.paypal.Buttons) {
      setIsPaypalLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=AXIggvGGvXozbZhdkvizPLd89nVYW8KoyNlHO0gHx7hjY_Ah_IfgXihUQGf7T2HUUVYx-D5SNncM0CtU&currency=USD";
    script.async = true;
    
    script.onload = () => {
      // Small delay to ensure PayPal is fully initialized
      setTimeout(() => {
        if (window.paypal && window.paypal.Buttons) {
          setIsPaypalLoaded(true);
          console.log("PayPal SDK loaded successfully");
        } else {
          console.error("PayPal Buttons not available after script load");
        }
      }, 500);
    };
    
    script.onerror = (error) => {
      console.error("Failed to load PayPal SDK:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load PayPal. Please check your internet connection.",
        icon: "error",
        confirmButtonText: "OK",
      });
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Create order function
  const createOrder = async (data, actions) => {
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
  };

  // On approve function
  const onApprove = async (data, actions) => {
    setIsProcessing(true);
    try {
      const details = await actions.order.capture();
      console.log("Payment completed:", details);
      await handleUpgrade(currentUser, price, setUserData);
      
      Swal.fire({
        title: "Payment Successful! 🎉",
        text: `You've upgraded to ${getPlanName(price)} VIP!`,
        icon: "success",
        confirmButtonText: "Continue",
        confirmButtonColor: "#00ae58",
      });
    } catch (error) {
      console.error("Payment capture error:", error);
      Swal.fire({
        title: "Payment Failed",
        text: "There was an error processing your payment. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // On error function
  const onError = (err) => {
    console.error("PayPal error:", err);
    setIsProcessing(false);
    Swal.fire({
      title: "Payment Error",
      text: "An error occurred with PayPal. Please try again.",
      icon: "error",
      confirmButtonText: "OK",
    });
  };

  // Render PayPal buttons when loaded
  useEffect(() => {
    if (!isPaypalLoaded || !buttonContainerRef.current || isProcessing) {
      return;
    }

    // Clear previous buttons
    if (paypalButtonsRef.current) {
      try {
        paypalButtonsRef.current.close();
      } catch (e) {
        console.log("Error closing previous buttons:", e);
      }
      paypalButtonsRef.current = null;
    }

    // Clear container
    if (buttonContainerRef.current) {
      buttonContainerRef.current.innerHTML = "";
    }

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
        onCancel: () => {
          console.log("Payment cancelled");
          Swal.fire({
            title: "Payment Cancelled",
            text: "You cancelled the payment process.",
            icon: "info",
            confirmButtonText: "OK",
          });
        },
      });
      
      if (buttonContainerRef.current) {
        paypalButtons.render(buttonContainerRef.current);
        paypalButtonsRef.current = paypalButtons;
      }
    } catch (error) {
      console.error("Failed to render PayPal buttons:", error);
    }
  }, [isPaypalLoaded, price, isProcessing]);

  const handlePlanSelect = (planValue) => {
    setPrice(planValue);
  };

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
          {!isPaypalLoaded ? (
            <div className="paypal-loading">
              <div className="loader-spinner"></div>
              <p>Loading PayPal...</p>
            </div>
          ) : (
            <div ref={buttonContainerRef}></div>
          )}
        </div>

        <p className="payment-note">
          Secure payment powered by PayPal
        </p>
      </div>
    </div>
  );
}