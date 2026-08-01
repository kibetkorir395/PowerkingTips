import { useState, useEffect, useRef } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";

export default function SafePayPalButtons({ 
  createOrder, 
  onApprove, 
  onError, 
  onCancel,
  disabled,
  style 
}) {
  const [isReady, setIsReady] = useState(false);
  const [localError, setLocalError] = useState(null);
  const retryCount = useRef(0);

  useEffect(() => {
    // Check if PayPal is ready
    const checkReady = setInterval(() => {
      if (window.paypal && window.paypal.Buttons) {
        setIsReady(true);
        clearInterval(checkReady);
      } else if (retryCount.current > 20) {
        setLocalError("PayPal failed to initialize. Please refresh the page.");
        clearInterval(checkReady);
      }
      retryCount.current++;
    }, 500);

    return () => clearInterval(checkReady);
  }, []);

  if (localError) {
    return (
      <div className="paypal-error-message">
        <p>{localError}</p>
        <button onClick={() => window.location.reload()} className="btn-small">
          Retry
        </button>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="paypal-loading-small">
        <div className="small-spinner"></div>
        <span>Initializing PayPal...</span>
      </div>
    );
  }

  return (
    <PayPalButtons
      style={style || {
        layout: "vertical",
        color: "gold",
        shape: "pill",
        label: "paypal",
        height: 40,
      }}
      createOrder={createOrder}
      onApprove={onApprove}
      onError={(err) => {
        console.error("PayPal error:", err);
        setLocalError("Payment error occurred. Please try again.");
        if (onError) onError(err);
      }}
      onCancel={onCancel}
      disabled={disabled}
      forceReRender={[disabled]}
    />
  );
}