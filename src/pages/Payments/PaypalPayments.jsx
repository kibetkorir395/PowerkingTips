import { useState, useContext, useEffect, useRef } from "react";
import { loadScript } from "@paypal/paypal-js";
import { AuthContext } from "../../AuthContext";
import { PriceContext } from "../../PriceContext";
import {
  SUBSCRIPTION_PLANS,
  getPlanName,
  handleUpgrade,
} from "./paymentUtils";
import Swal from "sweetalert2";
import "./Payments.scss";

export default function PaypalPayments({ setUserData }) {
  const { price, setPrice } = useContext(PriceContext);
  const { currentUser } = useContext(AuthContext);
  const [isPaypalLoaded, setIsPaypalLoaded] = useState(false);
  const [eligiblePaymentMethods, setEligiblePaymentMethods] = useState({
    paypal: true,
    venmo: false,
    paylater: false,
  });
  
  const buttonContainerRef = useRef(null);
  const paypalButtonsRef = useRef(null);
  const venmoButtonsRef = useRef(null);
  const paylaterButtonsRef = useRef(null);

  const subscriptionPlans = SUBSCRIPTION_PLANS.dollars;

  // Initialize price
  useEffect(() => {
    setPrice(subscriptionPlans[0].value);
  }, []);

  // Load PayPal script with multiple components
  useEffect(() => {
    loadScript({
      "client-id": "AXIggvGGvXozbZhdkvizPLd89nVYW8KoyNlHO0gHx7hjY_Ah_IfgXihUQGf7T2HUUVYx-D5SNncM0CtU",
      currency: "USD",
      intent: "capture",
      components: "buttons,venmo,paylater", // Add venmo and paylater components
      "enable-funding": "venmo,paylater", // Enable Venmo and PayLater funding sources
    })
      .then((paypal) => {
        console.log("PayPal loaded successfully", paypal);
        
        // Check which payment methods are available
        const isVenmoAvailable = paypal.FUNDING && paypal.FUNDING.VENMO;
        const isPayLaterAvailable = paypal.FUNDING && paypal.FUNDING.PAYLATER;
        
        setEligiblePaymentMethods({
          paypal: true,
          venmo: isVenmoAvailable,
          paylater: isPayLaterAvailable,
        });
        
        setIsPaypalLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to load PayPal SDK:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to load PayPal. Please refresh the page.",
          icon: "error",
        });
      });
  }, []);

  // Create order function (shared across all payment methods)
  const createOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: price.toFixed(2),
            currency_code: "USD",
          },
          description: `${getPlanName(price)} VIP Subscription`,
        },
      ],
    });
  };

  // On approve function (shared across all payment methods)
  const onApprove = (data, actions) => {
    return actions.order.capture().then((details) => {
      console.log("Payment completed:", details);
      handleUpgrade(currentUser, price, setUserData);
      
      Swal.fire({
        title: "Payment Successful!",
        text: `You've upgraded to ${getPlanName(price)} VIP!`,
        icon: "success",
      });
    });
  };

  // On error function (shared)
  const onError = (err) => {
    console.error("Payment error:", err);
    Swal.fire({
      title: "Payment Failed",
      text: "Please try again.",
      icon: "error",
    });
  };

  // Render PayPal buttons
  useEffect(() => {
    if (!isPaypalLoaded || !buttonContainerRef.current || !window.paypal) {
      return;
    }

    // Clear existing buttons
    if (paypalButtonsRef.current) {
      return;
    }

    // Render PayPal button
    if (eligiblePaymentMethods.paypal) {
      try {
        const paypalButtons = window.paypal.Buttons({
          style: {
            layout: "horizontal",
            color: "gold",
            shape: "pill",
            label: "pay",
          },
          createOrder: createOrder,
          onApprove: onApprove,
          onError: onError,
        });
        
        paypalButtons.render(buttonContainerRef.current);
        paypalButtonsRef.current = paypalButtons;
      } catch (error) {
        console.error("Failed to render PayPal buttons:", error);
      }
    }
  }, [isPaypalLoaded, eligiblePaymentMethods]);

  // Function to render Venmo button separately
  const renderVenmoButton = (containerId) => {
    if (!window.paypal || !eligiblePaymentMethods.venmo) return;
    
    try {
      const venmoButtons = window.paypal.Buttons({
        style: {
          layout: "horizontal",
          color: "blue",
          shape: "pill",
          label: "venmo",
        },
        fundingSource: window.paypal.FUNDING.VENMO,
        createOrder: createOrder,
        onApprove: onApprove,
        onError: onError,
      });
      
      venmoButtons.render(`#${containerId}`);
      venmoButtonsRef.current = venmoButtons;
    } catch (error) {
      console.error("Failed to render Venmo buttons:", error);
    }
  };

  // Function to render PayLater button
  const renderPayLaterButton = (containerId) => {
    if (!window.paypal || !eligiblePaymentMethods.paylater) return;
    
    try {
      const paylaterButtons = window.paypal.Buttons({
        style: {
          layout: "horizontal",
          color: "gold",
          shape: "pill",
          label: "paylater",
        },
        fundingSource: window.paypal.FUNDING.PAYLATER,
        createOrder: createOrder,
        onApprove: onApprove,
        onError: onError,
      });
      
      paylaterButtons.render(`#${containerId}`);
      paylaterButtonsRef.current = paylaterButtons;
    } catch (error) {
      console.error("Failed to render PayLater buttons:", error);
    }
  };

  // Render Venmo and PayLater buttons when eligible
  useEffect(() => {
    if (isPaypalLoaded && eligiblePaymentMethods.venmo) {
      renderVenmoButton("venmo-button-container");
    }
    if (isPaypalLoaded && eligiblePaymentMethods.paylater) {
      renderPayLaterButton("paylater-button-container");
    }
  }, [isPaypalLoaded, eligiblePaymentMethods, price]);

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
        
        {/* PayPal Button */}
        <div className="paypal-buttons-container">
          {!isPaypalLoaded ? (
            <div className="paypal-loading">Loading PayPal...</div>
          ) : (
            <div ref={buttonContainerRef}></div>
          )}
        </div>

        {/* Venmo Button (only if eligible) */}
        {eligiblePaymentMethods.venmo && (
          <div className="venmo-buttons-container" style={{ marginTop: '10px' }}>
            <div id="venmo-button-container"></div>
          </div>
        )}

        {/* PayLater Button (only if eligible) */}
        {eligiblePaymentMethods.paylater && (
          <div className="paylater-buttons-container" style={{ marginTop: '10px' }}>
            <div id="paylater-button-container"></div>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '14px', opacity: 0.8 }}>
          Paying: ${price} for {getPlanName(price)} VIP
        </p>
      </div>
    </div>
  );
}