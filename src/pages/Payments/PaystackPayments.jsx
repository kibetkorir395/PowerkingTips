import React, { useContext} from 'react'
import './Ticket.scss';
import { PriceContext } from '../../PriceContext';
import AppHelmet from '../../components/AppHelmet';
import { PaystackButton } from 'react-paystack';
import { AuthContext } from '../../AuthContext';
import { updateUser } from '../../firebase';

export default function PaystackPayments() {
  const {price, setPrice} = useContext(PriceContext)
  const {currentUser} = useContext(AuthContext);

  const returnPeriod = () => {
    if(price === 200){
      return 'Daily'
    } else if (price === 600){
      return 'Weekly'
    } else if (price === 3000){
      return 'Monthly'
    } else {
      return 'Yearly'
    }
  }

  const componentProps = {
    reference: (new Date()).getTime().toString(),
    email: currentUser.email,
    amount: price * 100, //Amount is in the country's lowest currency. E.g Kobo, so 20000 kobo = N200
    publicKey: 'pk_live_7bee8807842b6de80db9ff956f02cc6ebe64808f',
    currency: "KES",
    metadata: {
      name: currentUser.email,
    },
    text: 'Pay Now',
    onSuccess: (response) => {
      fetch(`https://api.paystack.co/transaction/verify/${response.reference}`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer sk_live_0b8e33c9b4be8d9af4ce5169cffa29e58ba3c590',
          'Content-Type': 'application/json'
        }
      }).then(res => {

        
        const body = res.json()
        body.then(result => {

          if(result.data.status === "success") {
            let subscription;
            switch (result.data.requested_amount) {
              case 60000:
                subscription = "Weekly"
                break;
              case 300000:
                subscription = "Monthly"
                break;
              case 750000:
                subscription = "Yearly"
                break;
              default:
                subscription = "Daily"
            }
            updateUser(currentUser.email, true, subscription, result.data.paidAt)
            alert('You Have Upgraded To ' + returnPeriod() + " VIP")
            window.location.pathname = '/tips';
          } else {
            return;
          }
        }).catch(error => {
          return;
        });
      }).catch(err =>{
        return err
      })
    },
    onClose: () => {
      //console.log('Payment dialog closed');
      // Handle payment closure here
    },
  };
  return (
    <div className="pay">
      <AppHelmet title={"Pay"} location={'/pay'}/>
      <form>
      <fieldset>
        <input name="prices" type="radio" value={200} id="daily" checked={price===200 ? true : false}   onChange={(e) => setPrice(200)}/>
        <label htmlFor="daily">Daily VIP</label>
        <span className="price">KSH 200</span>
      </fieldset>
      <fieldset>
        <input name="prices" type="radio" value={600} id="weekly" checked={price===600 ? true : false}   onChange={(e) => setPrice(600)}/>
        <label htmlFor="weekly">7 Days VIP</label>
        <span className="price">KSH 600</span>
      </fieldset>
      <fieldset>
        <input name="prices" type="radio" value={3000} id="monthly" checked={price===3000 ? true : false}   onChange={(e) => setPrice(3000)}/>
        <label htmlFor="monthly">30 Days VIP</label>
        <span className="price">KSH 3000</span>
      </fieldset>
      <fieldset>
        <input name="prices" type="radio" value={7500} id="yearly" checked={price===7500 ? true : false}   onChange={(e) => setPrice(7500)}/>
        <label htmlFor="yearly">1 Year VIP</label>
        <span className="price">KSH 7500</span>
      </fieldset>
    </form>
      <h4>GET {returnPeriod().toUpperCase()} VIP FOR {price}</h4>
      <PaystackButton {...componentProps} className='btn'/>
    </div>
  )
}
