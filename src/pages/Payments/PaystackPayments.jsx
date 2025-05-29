import React, { useContext } from 'react'
import './Ticket.scss';
import { PriceContext } from '../../PriceContext';
import AppHelmet from '../../components/AppHelmet';
import { PaystackButton } from 'react-paystack';
import { AuthContext } from '../../AuthContext';
import { db, getUser, updateUser } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function PaystackPayments({ setUserData }) {
  const { price, setPrice } = useContext(PriceContext)
  const { currentUser } = useContext(AuthContext);

  const handleUpgrade = async () => {
    try {
      const currentDate = new Date().toISOString();
      /*await updateUser(currentUser.email, true, returnPeriod(), currentDate).then(async () => {
        alert('You Have Upgraded To ' + returnPeriod() + " VIP");
      }).then(async () => {
        await getUser(currentUser.email, setUserData);
      }).then(() => {
        //window.location.pathname = '/tips';
      }).catch(() => {

      });*/

      const userDocRef = doc(db, "users", currentUser.email);
      await setDoc(userDocRef, {
        email: currentUser.email,
        username: currentUser.email,
        isPremium: true,
        subscription: returnPeriod(),
        subDate: currentDate
      }, { merge: true }).then(async (response) => {
        alert('You Have Upgraded To ' + returnPeriod() + " VIP");
      }).then(async () => {
        await getUser(currentUser.email, setUserData);
      }).then(async () => {
        window.location.pathname = '/tips';
      }).catch(async (error) => {
        const errorMessage = await error.message;
        alert(errorMessage);
      });
    } catch (error) {
      console.error("Error upgrading user:", error.message);
    }
  };


  const returnPeriod = () => {
    if (price === 200) {
      return 'Daily'
    } else if (price === 600) {
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
    publicKey: 'pk_live_f36eadef9a97cb84ef23ebec889bfc4e458e3a4a',
    currency: "KES",
    metadata: {
      name: currentUser.email,
    },
    text: 'Pay Now',
    onSuccess: (response) => {
      console.log("Payment success response:", response);
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
          <input name="prices" type="radio" value={200} id="daily" checked={price === 200 ? true : false} onChange={(e) => setPrice(200)} />
          <label htmlFor="daily">Daily VIP</label>
          <span className="price">KSH 200</span>
        </fieldset>
        <fieldset>
          <input name="prices" type="radio" value={600} id="weekly" checked={price === 600 ? true : false} onChange={(e) => setPrice(600)} />
          <label htmlFor="weekly">7 Days VIP</label>
          <span className="price">KSH 600</span>
        </fieldset>
        <fieldset>
          <input name="prices" type="radio" value={3000} id="monthly" checked={price === 3000 ? true : false} onChange={(e) => setPrice(3000)} />
          <label htmlFor="monthly">30 Days VIP</label>
          <span className="price">KSH 3000</span>
        </fieldset>
        <fieldset>
          <input name="prices" type="radio" value={8000} id="yearly" checked={price === 8000 ? true : false} onChange={(e) => setPrice(8000)} />
          <label htmlFor="yearly">1 Year VIP</label>
          <span className="price">KSH 8000</span>
        </fieldset>
      </form>
      <h4>GET {returnPeriod().toUpperCase()} VIP FOR {price}</h4>
      <PaystackButton {...componentProps} className='btn' />
    </div>
  )
}
