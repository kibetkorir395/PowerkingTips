import { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const paypalInitialOptions = {
  "client-id": "AXIggvGGvXozbZhdkvizPLd89nVYW8KoyNlHO0gHx7hjY_Ah_IfgXihUQGf7T2HUUVYx-D5SNncM0CtU",
  currency: "USD",
  intent: "capture",
  components: "buttons",
};

export default function PayPalWrapper({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check if PayPal is already loaded
    const checkPayPal = setInterval(() => {
      if (window.paypal && window.paypal.Buttons) {
        setIsLoading(false);
        clearInterval(checkPayPal);
      }
    }, 500);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      if (isLoading) {
        setHasError(true);
        clearInterval(checkPayPal);
      }
    }, 10000);

    return () => {
      clearInterval(checkPayPal);
      clearTimeout(timeout);
    };
  }, []);

  if (hasError) {
    return (
      <div className="paypal-error">
        <i className="fas fa-exclamation-triangle"></i>
        <h3>PayPal Failed to Load</h3>
        <p>Please refresh the page or try another payment method.</p>
        <button onClick={() => window.location.reload()} className="btn">
          Refresh Page
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="paypal-loading">
        <div className="loader-spinner"></div>
        <p>Loading PayPal...</p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={paypalInitialOptions}>
      {children}
    </PayPalScriptProvider>
  );
}