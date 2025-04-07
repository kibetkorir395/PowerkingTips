import React, { useContext, useEffect, useState } from 'react'
import './Ticket.scss';
import { PriceContext } from '../../PriceContext';
import AppHelmet from '../../components/AppHelmet';
import { PaystackButton } from 'react-paystack';
import { AuthContext } from '../../AuthContext';
import { getUser, updateUser } from '../../firebase';

export default function CardPayment({ setUserData }) {
  const { price, setPrice } = useContext(PriceContext)
  const { currentUser } = useContext(AuthContext);
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
    if (price === 250) {
      return 'Daily'
    } else if (price === 750) {
      return 'Weekly'
    } else if (price === 3000) {
      return 'Monthly'
    } else {
      return 'Yearly'
    }
  }

  const componentProps = {
    reference: (new Date()).getTime().toString(),
    email: currentUser.email,
    amount: price * 100,
    publicKey: 'pk_live_362b1c5a898c1cbcc3997049f738136211f625bf',
    currency: "KES",
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
      <AppHelmet title={"Pay"} location={'/pay'} />
      <form>
        <fieldset>
          <input name="prices" type="radio" value={250} id="daily" checked={price === 250 ? true : false} onChange={(e) => setPrice(250)} />
          <label htmlFor="daily">Daily VIP</label>
          <span className="price">KSH 250</span>
        </fieldset>
        <fieldset>
          <input name="prices" type="radio" value={750} id="weekly" checked={price === 750 ? true : false} onChange={(e) => setPrice(750)} />
          <label htmlFor="weekly">7 Days VIP</label>
          <span className="price">KSH 750</span>
        </fieldset>
        <fieldset>
          <input name="prices" type="radio" value={3000} id="monthly" checked={price === 3000 ? true : false} onChange={(e) => setPrice(3000)} />
          <label htmlFor="monthly">30 Days VIP</label>
          <span className="price">KSH 3000</span>
        </fieldset>
        <fieldset>
          <input name="prices" type="radio" value={10000} id="yearly" checked={price === 10000 ? true : false} onChange={(e) => setPrice(10000)} />
          <label htmlFor="yearly">1 Year VIP</label>
          <span className="price">KSH 10000</span>
        </fieldset>
      </form>
      <h4>GET {returnPeriod().toUpperCase()} VIP FOR KSH {price}</h4>
      <PaystackButton {...componentProps} className='btn' />
    </div>
  )
}
