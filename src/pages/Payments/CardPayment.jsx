import React, { useContext, useEffect, useState} from 'react'
import './Ticket.scss';
import { PriceContext } from '../../PriceContext';
import AppHelmet from '../../components/AppHelmet';
import { PaystackButton } from 'react-paystack';
import { AuthContext } from '../../AuthContext';
import { getUser, updateUser } from '../../firebase';

export default function CardPayment({setUserData}) {
  const {price, setPrice} = useContext(PriceContext)
  const {currentUser} = useContext(AuthContext);
  const [usdCurrency, setUsdCurrency] = useState(2);

  useEffect(() => {
    setUsdCurrency(() => {
      if(price === 250){
        return 2
      } else if (price === 850){
        return 6.5
      } else if (price === 4000){
        return 30
      } else {
        return 80
      }
    })
  }, [price])

  const handleUpgrade = async () => {
    try {
      const currentDate = new Date().toISOString();
      await updateUser(currentUser.email, true, returnPeriod(), currentDate);
      alert('You Have Upgraded To ' + returnPeriod() + " VIP");
      await getUser(currentUser.email, setUserData);
      window.location.pathname = '/tips';
    } catch (error) {
      console.error("Error upgrading user:", error.message);
    }
  };


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

  const componentProps = {
    reference: (new Date()).getTime().toString(),
    email: currentUser.email,
    amount: usdCurrency * 100,
    publicKey: 'pk_live_4681cad26be38334e18464243cecf539bda39c6c',
    currency: "USD",
    metadata: {
      name: currentUser.email,
    },
    text: 'Pay Now',
    onSuccess: (response) => {
      handleUpgrade();
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
        <input name="prices" type="radio" value={250} id="daily" checked={price===250 ? true : false}   onChange={(e) => setPrice(250)}/>
        <label htmlFor="daily">Daily VIP</label>
        <span className="price">$2</span>
      </fieldset>
      <fieldset>
        <input name="prices" type="radio" value={850} id="weekly" checked={price===850 ? true : false}   onChange={(e) => setPrice(850)}/>
        <label htmlFor="weekly">7 Days VIP</label>
        <span className="price">$6.5</span>
      </fieldset>
      <fieldset>
        <input name="prices" type="radio" value={4000} id="monthly" checked={price===4000 ? true : false}   onChange={(e) => setPrice(4000)}/>
        <label htmlFor="monthly">30 Days VIP</label>
        <span className="price">$30</span>
      </fieldset>
      <fieldset>
        <input name="prices" type="radio" value={10000} id="yearly" checked={price===10000 ? true : false}   onChange={(e) => setPrice(10000)}/>
        <label htmlFor="yearly">1 Year VIP</label>
        <span className="price">$80</span>
      </fieldset>
    </form>
      <h4>GET {returnPeriod().toUpperCase()} VIP FOR ${usdCurrency}</h4>
      <PaystackButton {...componentProps} className='btn'/>
    </div>
  )
}
