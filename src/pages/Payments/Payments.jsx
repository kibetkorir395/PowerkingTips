import { useEffect, useState, useCallback, Component } from "react";
import CryptoPayments from "./CryptoPayments";
import PaypalPayments from "./PaypalPayments";
import GooglePayments from "./GooglePayments";
import KoraPaymentsV1 from "./KoraPaymentsV1";
import PaystackPaymentsV1 from "./PaystackPaymentsV1";
import CashiaPaymentsV2 from "./CashiaPaymentsV2";
import FlutterwavePayments from "./FlutterwavePayments";
import AppHelmet from "../../components/AppHelmet";
import "./Payments.scss";
import Swal from "sweetalert2";
import CashiaLogo from '../../assets/cashia-logo.png';
import GoogleLogo from '../../assets/GPay_Acceptance_Mark_800.png';
import { useCurrency } from "../../context/CurrencyContext";
import { useAuth } from '../../context/AuthContext';
import {handleUpgrade} from "./paymentUtils";

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

export default function Payments() {
  const [paymentType, setPaymentType] = useState("mpesa");
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
  const { currentUser, isAdmin, refreshUserData } = useAuth();
  const [transactionData, setTransactionData] = useState(null);

  const handlePaymentChange = useCallback((e) => {
    setPaymentType(e.target.value);
  }, []);


  useEffect(() => {
    transactionData && handleUpgrade(currentUser, transactionData)
      .then((updatedData) => {
        // If the function returned null due to the login validation error
        if (!updatedData) return; 
  
        // 1. Set the data in the calling file
        //setUserData(updatedData);
        refreshUserData();
  
        // 2. Call your success Swal alert
        Swal.fire({
          title: "Success!",
          text: "Your account has been upgraded.",
          icon: "success",
          onclose: window.location.href = "/"
        });
      })
      .catch((error) => {
        // Handles any network or server errors thrown by the function
        Swal.fire({
          title: "Server Error",
          text: "Something went wrong processing your request.",
          icon: "error"
        });
      });
  }, [transactionData]);

  const renderPaymentType = useCallback(() => {
    switch (paymentType) {
      case "paypal":
        return (
          <ErrorBoundary key="paypal">
            <PaypalPayments setTransactionData={setTransactionData} />
          </ErrorBoundary>
        );
      case "crypto":
        return (
          <ErrorBoundary key="crypto">
            <CryptoPayments setTransactionData={setTransactionData}/>
          </ErrorBoundary>
        );
      case "googlepay":
        return (
          <ErrorBoundary key="googlepay">
            <GooglePayments setTransactionData={setTransactionData}/>
          </ErrorBoundary>
        );
      case "mpesa":
        return (
          <ErrorBoundary key="mpesa">
            <KoraPaymentsV1 setTransactionData={setTransactionData}/>{/*getCurrencyCode() === "KES" ? <PaystackPaymentsV1 setTransactionData={setTransactionData}/> : (getCurrencyCode() === "NGN" ? <KoraPaymentsV1 setTransactionData={setTransactionData}/> : <FlutterwavePayments setTransactionData={setTransactionData}/>)*/}
          </ErrorBoundary>
        );
      case "cashia":
        return (
          <ErrorBoundary key="cashia">
            <CashiaPaymentsV2 setTransactionData={setTransactionData}/>
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary key="default">
            <KoraPaymentsV1 setTransactionData={setTransactionData}/>{/*getCurrencyCode() === "KES" ? <PaystackPaymentsV1 setTransactionData={setTransactionData}/> : (getCurrencyCode() === "NGN" ? <KoraPaymentsV1 setTransactionData={setTransactionData}/> : <FlutterwavePayments setTransactionData={setTransactionData}/>)*/}
          </ErrorBoundary>
        );
    }
  }, [paymentType]);

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
            <label htmlFor="mpesa"><div className="icons8-mpesa"></div> <img width="20" height="20" src="https://img.icons8.com/nolan/64/airtel.png" alt="airtel"/> Mobile/Card/Bank</label>
          </fieldset>
          {/*<fieldset>
            <input
              name="payment-method"
              type="radio"
              value="cashia"
              id="cashia"
              checked={paymentType === "cashia"}
              onChange={handlePaymentChange}
            />
            <label htmlFor="cashia">
              <img 
                src={CashiaLogo} 
                alt="Cashia Payments" 
                width="20" 
                height="20" 
                style={{ marginRight: "4px", verticalAlign: "middle"}}
              />
              <span className="cashia-label">Cashia</span>
            </label>
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
            <label htmlFor="paypal"><div className="icons8-paypal-logo"/>PayPal</label>
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
          </fieldset>*/} 
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
