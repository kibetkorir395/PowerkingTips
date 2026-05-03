import { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from "../../context/AuthContext";
import { usePrice } from "../../context/PriceContext";
import Swal from "sweetalert2";
import "./Payments.scss";

// PayPal configuration
const paypalOptions = {
  "client-id": "AT-E8-dZV6R5JAeHjr_DG1mivBrJ72h8ZlBt-rAHf6ypsKhg5lfpsRqWSIM5H1Xa58YZYhBbL0wObsw-",
  currency: "USD",
  intent: "capture",
  components: "buttons",
};

export default function PaypalPayments1({ setUserData }) {
  const { price, setPrice } = usePrice();
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  const subscriptionPlans = [
    { id: "daily", value: 2, label: "Daily VIP", price: "$2", period: "Daily" },
    { id: "weekly", value: 7, label: "Weekly VIP", price: "$7", period: "Weekly" },
    { id: "monthly", value: 16, label: "Monthly VIP", price: "$16", period: "Monthly" },
    { id: "yearly", value: 50, label: "Yearly VIP", price: "$50", period: "Yearly" },
  ];

  useEffect(() => {
    setPrice(subscriptionPlans[0].value);
  }, []);

  useEffect(() => {
    const checkScript = setInterval(() => {
      if (window.paypal && window.paypal.Buttons) {
        setIsScriptLoaded(true);
        clearInterval(checkScript);
      }
    }, 500);

    const timeout = setTimeout(() => {
      if (!window.paypal || !window.paypal.Buttons) {
        setScriptError(true);
        clearInterval(checkScript);
      }
    }, 10000);

    return () => {
      clearInterval(checkScript);
      clearTimeout(timeout);
    };
  }, []);

  const getSubscriptionPeriod = () => {
    if (price === 2) return "Daily";
    if (price === 7) return "Weekly";
    if (price === 16) return "Monthly";
    if (price === 50) return "Yearly";
    return "Weekly";
  };

  const handleUpgrade = async () => {
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("../../config/firebase");
      const { userService } = await import("../../services/firestore.service");
      
      const userDocRef = doc(db, "users", currentUser.email);
      await setDoc(userDocRef, {
        email: currentUser.email,
        username: currentUser.email.split('@')[0],
        isPremium: true,
        subscription: getSubscriptionPeriod(),
        subDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      if (setUserData) {
        const updatedUser = await userService.getUser(currentUser.email);
        setUserData(updatedUser);
      }
      return true;
    } catch (error) {
      console.error("Upgrade error:", error);
      throw error;
    }
  };

  const createOrder = async (data, actions) => {
    return actions.order.create({
      purchase_units: [{
        description: `${getSubscriptionPeriod()} VIP Subscription`,
        amount: { value: price.toFixed(2), currency_code: "USD" },
      }],
    });
  };

  const onApprove = async (data, actions) => {
    setIsProcessing(true);
    try {
      const details = await actions.order.capture();
      console.log("Payment completed:", details);
      await handleUpgrade();
      
      await Swal.fire({
        title: "Payment Successful! 🎉",
        html: `
          <div style="text-align: center;">
            <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
            <h3 style="margin: 15px 0;">${getSubscriptionPeriod()} VIP Activated!</h3>
            <p>Amount: $${price}</p>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Continue",
        confirmButtonColor: "#00ae58",
      });
      
      window.location.href = "/";
    } catch (error) {
      Swal.fire({
        title: "Payment Failed",
        text: "Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onError = (err) => {
    console.error("PayPal error:", err);
    setIsProcessing(false);
    Swal.fire({
      title: "Payment Error",
      text: "Please try again.",
      icon: "error",
      confirmButtonText: "OK",
    });
  };

  const onCancel = () => {
    setIsProcessing(false);
    Swal.fire({
      title: "Payment Cancelled",
      text: "You cancelled the payment.",
      icon: "info",
      confirmButtonText: "OK",
    });
  };

  const handlePlanSelect = (planValue) => {
    setPrice(planValue);
  };

  if (!isScriptLoaded && !scriptError) {
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
        <div className="paypal-loading">
          <div className="loader-spinner"></div>
          <p>Loading PayPal...</p>
        </div>
      </div>
    );
  }

  if (scriptError) {
    return (
      <div className="paypal-payment-wrapper">
        <div className="paypal-error">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>PayPal Failed to Load</h3>
          <p>Please refresh the page or try another payment method.</p>
          <button onClick={() => window.location.reload()} className="btn">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={paypalOptions}>
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
          <h3>GET {getSubscriptionPeriod().toUpperCase()} VIP FOR ${price}</h3>
          
          <div className="paypal-buttons-container">
            <PayPalButtons
              style={{
                layout: "vertical",
                color: "gold",
                shape: "pill",
                label: "paypal",
                height: 40,
              }}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={onError}
              onCancel={onCancel}
              disabled={isProcessing}
              forceReRender={[price]}
            />
          </div>

          <p className="payment-note">Secure payment powered by PayPal</p>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}