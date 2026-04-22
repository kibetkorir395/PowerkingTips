import { useState, useCallback, Component } from "react";
import CryptoPayments from "./CryptoPayments";
import PaypalPayments from "./PaypalPayments";
import GooglePayments from "./GooglePayments";
import KoraPayments from "./KoraPayments";
import AppHelmet from "../../components/AppHelmet";
import "./Payments.scss";
import GoogleLogo from '../../assets/GPay_Acceptance_Mark_800.png';

// Simple Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Payment component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="payment-error-boundary">
          <i className="fas fa-exclamation-circle"></i>
          <h3>Something went wrong</h3>
          <p>Please try refreshing the page or select another payment method.</p>
          <button onClick={() => window.location.reload()} className="btn">
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Payments({ setUserData }) {
  const [paymentType, setPaymentType] = useState("mpesa");

  const handlePaymentChange = useCallback((e) => {
    setPaymentType(e.target.value);
  }, []);

  const renderPaymentType = useCallback(() => {
    switch (paymentType) {
      case "paypal":
        return (
          <ErrorBoundary key="paypal">
            <PaypalPayments setUserData={setUserData} />
          </ErrorBoundary>
        );
      case "crypto":
        return (
          <ErrorBoundary key="crypto">
            <CryptoPayments setUserData={setUserData} />
          </ErrorBoundary>
        );
      case "googlepay":
        return (
          <ErrorBoundary key="googlepay">
            <GooglePayments setUserData={setUserData} />
          </ErrorBoundary>
        );
      case "mpesa":
        return (
          <ErrorBoundary key="mpesa">
            <KoraPayments setUserData={setUserData} />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary key="default">
            <KoraPayments setUserData={setUserData} />
          </ErrorBoundary>
        );
    }
  }, [paymentType, setUserData]);

  return (
    <div className="payments">
      <AppHelmet title={"Pay"} location={"/pay"} />
      <div className="wrapper">
        <h2>Select Payment Method</h2>
        <form className="method">
          <fieldset>
            <input
              name="payment-method"
              type="radio"
              value="mpesa"
              id="mpesa"
              checked={paymentType === "mpesa"}
              onChange={handlePaymentChange}
            />
            <label htmlFor="mpesa"><div class="icons8-mpesa"></div> <img width="20" height="20" src="https://img.icons8.com/nolan/64/airtel.png" alt="airtel"/> Mobile </label>
          </fieldset>
          <fieldset>
            <input
              name="payment-method"
              type="radio"
              value="paypal"
              id="paypal"
              checked={paymentType === "paypal"}
              onChange={handlePaymentChange}
            />
            <label htmlFor="paypal"><div class="icons8-paypal-logo"/>PayPal</label>
          </fieldset>
          <fieldset>
            <input
              name="payment-method"
              type="radio"
              value="googlepay"
              id="googlepay"
              checked={paymentType === "googlepay"}
              onChange={handlePaymentChange}
            />
            <label htmlFor="googlepay">
              <img 
                src={GoogleLogo} 
                alt="Google Pay" 
                width="40" 
                height="20" 
                style={{ marginRight: "4px", verticalAlign: "middle"}}
              />
              <span className="google-label">Google Pay</span>
            </label>
          </fieldset>
          <fieldset>
            <input
              name="payment-method"
              type="radio"
              value="crypto"
              id="crypto"
              checked={paymentType === "crypto"}
              onChange={handlePaymentChange}
            />
            <label htmlFor="crypto"><div className="icons8-tether"></div> Crypto</label>
          </fieldset>
        </form>
      </div>
      {renderPaymentType()}
    </div>
  );
}