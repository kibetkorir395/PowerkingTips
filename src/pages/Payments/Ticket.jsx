import React, { useContext} from 'react'
import './Ticket.scss';
import { PriceContext } from '../../PriceContext';
import AppHelmet from '../../components/AppHelmet';
import PaystackPop from '@paystack/inline-js'
import { AuthContext } from '../../AuthContext';

export default function Ticket() {
  const {price, setPrice} = useContext(PriceContext)
  const {currentUser} = useContext(AuthContext);

  const returnPeriod = () => {
    if(price === 250){
      return 'Daily'
    } else if (price === 850){
      return 'Weekly'
    } else if (price === 4000){
      return 'Monthly'
    } else {
      return 'Yearly'
    }
  }

  const handleClick = () => {
    const params = JSON.stringify({
        "email": currentUser.email,
        "amount": price * 100,
        "callback_url": "/tips"
    })
    fetch("https://api.paystack.co/transaction/initialize", {
      method: 'POST',
      headers: {
        Authorization: 'Bearer sk_live_0b8e33c9b4be8d9af4ce5169cffa29e58ba3c590',
        'Content-Type': 'application/json'
      },
      body: params
    }).then(res => {
      const body = res.json()
      body.then(result => {
        const accessCode = result.data.access_code;
        const popup = new PaystackPop()
        const data = popup.resumeTransaction(accessCode)
      }).catch(error => {
        return;
      });
    }).catch(err =>{
      return err
    })
  }
  return (
    <div className="pay">
      <AppHelmet title={"Pay"} location={'/pay'}/>
      <form>
      <fieldset>
        <input name="prices" type="radio" value={250} id="daily" checked={price===250 ? true : false}   onChange={(e) => setPrice(250)}/>
        <label htmlFor="daily">Daily VIP</label>
        <span className="price">KSH 250</span>
      </fieldset>
      <fieldset>
        <input name="prices" type="radio" value={850} id="weekly" checked={price===850 ? true : false}   onChange={(e) => setPrice(850)}/>
        <label htmlFor="weekly">7 Days VIP</label>
        <span className="price">KSH 850</span>
      </fieldset>
      <fieldset>
        <input name="prices" type="radio" value={4000} id="monthly" checked={price===4000 ? true : false}   onChange={(e) => setPrice(4000)}/>
        <label htmlFor="monthly">30 Days VIP</label>
        <span className="price">KSH 4000</span>
      </fieldset>
      <fieldset>
        <input name="prices" type="radio" value={10000} id="yearly" checked={price===10000 ? true : false}   onChange={(e) => setPrice(10000)}/>
        <label htmlFor="yearly">1 Year VIP</label>
        <span className="price">KSH 10000</span>
      </fieldset>
    </form>
    <h4>GET {returnPeriod().toUpperCase()} VIP FOR {price}</h4>
    <span
          className="btn" id="donate-button"
          onClick={handleClick}//document.querySelector('.mpesa-modal').classList.toggle('active')}
        >PAY NOW</span>
    </div>
  )
}
