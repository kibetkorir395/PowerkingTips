import { useState, useCallback } from "react";
import CryptoPayments from "./CryptoPayments";
import PaypalPayments from "./PaypalPayments";
import KoraPayments from "./KoraPayments";
import AppHelmet from "../../components/AppHelmet";
import "./Payments.scss";

export default function Payments({ setUserData }) {
  const [paymentType, setPaymentType] = useState("mpesa");

  const handlePaymentChange = useCallback((e) => {
    setPaymentType(e.target.value);
  }, []);

  const renderPaymentType = useCallback(() => {
    // Add a key to force re-render when payment type changes
    const key = paymentType;
    
    switch (paymentType) {
      case "paypal":
        return <PaypalPayments key={key} setUserData={setUserData} />;
      case "crypto":
        return <CryptoPayments key={key} setUserData={setUserData} />;
      case "mpesa":
        return <KoraPayments key={key} setUserData={setUserData} />;
      default:
        return <KoraPayments key={key} setUserData={setUserData} />;
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
            <label htmlFor="mpesa">Mobile Payments 📲</label>
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
            <label htmlFor="paypal">PayPal 💳</label>
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
            <label htmlFor="crypto">Crypto ₿</label>
          </fieldset>
        </form>
      </div>
      {renderPaymentType()}
    </div>
  );
}