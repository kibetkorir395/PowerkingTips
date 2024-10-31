import { useState } from 'react';
import './Ticket.scss';
import { PayPalButtons, PayPalScriptProvider} from "@paypal/react-paypal-js";
import Qr from '../../assets/paypal_btn.png';

export default function PaypalPayment() {
  const [price, setPrice ] = useState(5);


const returnPeriod = () => {
  if(price === 2){
    return 'Daily'
  } else if (price === 5){
    return 'Weekly'
  } else {
    return 'Monthly'
  }
}
  // A generic button that takes fundingSource as a prop, allowing multiple buttons
  const PaymentButton = () => {
    return (
      <PayPalButtons
        //fundingSource={fundingSource}
        style={{ 
          color: "gold", 
          label: "pay" 
        }}
        createOrder={(data, actions) => {
          if (!price) return;
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: price,
                  breakdown: {
                    item_total: {
                      currency_code: "USD",
                      value: price
                    }
                  }
                },
                items: [
                  {
                    name: returnPeriod() + " VIP",
                    description: "Payment of $ " + {price} + " for " + returnPeriod() + " VIP",
                    quantity: "1",
                    unit_amount: {
                      currency_code: "USD",
                      value: price
                    },
                    category: "DONATION"
                  }
                ]
              }
            ]
          });
        }}
        onError={(err) => console.error(err)}
      />
    );
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId: "AXIggvGGvXozbZhdkvizPLd89nVYW8KoyNlHO0gHx7hjY_Ah_IfgXihUQGf7T2HUUVYx-D5SNncM0CtU",
        components: "buttons",
        currency: "USD",
        environment: "production"
      }}
    >
      <div className="pay">
        <form>
          <fieldset>
            <input
              name="prices"
              type="radio"
              value={2}
              id="daily"
              checked={price === 2}
              onChange={() => setPrice(2)}
            />
            <label htmlFor="daily">Daily VIP</label>
            <span className="price">$ 2</span>
          </fieldset>
          <fieldset>
            <input
              name="prices"
              type="radio"
              value={5}
              id="weekly"
              checked={price === 5}
              onChange={() => setPrice(5)}
            />
            <label htmlFor="weekly">7 Days VIP</label>
            <span className="price">$ 5</span>
          </fieldset>
          <fieldset>
            <input
              name="prices"
              type="radio"
              value={25}
              id="monthly"
              checked={price === 25}
              onChange={() => setPrice(25)}
            />
            <label htmlFor="monthly">30 Days VIP</label>
            <span className="price">$ 25</span>
          </fieldset>
        </form>

        <div className="paypal-wrapper">
          <PaymentButton />
          <img src={Qr} alt="PayPal QR code"/>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
