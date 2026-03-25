import { useContext } from 'react'
import './Ticket.scss';
import { PriceContext } from '../../PriceContext';
import AppHelmet from '../../components/AppHelmet';
import KoraPayment from 'kora-checkout';
import { AuthContext } from '../../AuthContext';
import { db, getUser } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function KoraPayments({ setUserData }) {
  const { price, setPrice } = useContext(PriceContext)
  const { currentUser } = useContext(AuthContext);

  const handleUpgrade = async () => {
    try {
      const currentDate = new Date().toISOString();
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
        window.location.pathname = '/';
      }).catch(async (error) => {
        const errorMessage = await error.message;
        alert(errorMessage);
      });
    } catch (error) {
      console.error("Error upgrading user:", error.message);
    }
  };


  const returnPeriod = () => {
    if (price === 250) {
      return 'Daily'
    } else if (price === 800) {
      return 'Weekly'
    } else if (price === 3000) {
      return 'Monthly'
    } else {
      return 'Yearly'
    }
  }

  const handlePayment = () => {
    const paymentOptions = {
        key: "pk_live_Gu3aUUGAzWj1zeonHdwBAi4oDD9Vc4AViyHWqALp",
        reference: `ref-${Date.now()}`,
        amount: price,
        currency: "GHS",
        customer: {
            name: currentUser.email,
            email: currentUser.email,
        },
        onSuccess: () => {
            handleUpgrade();
        },
        onFailed: (err) => {
            console.error(err.message);
        }
    };

    const payment = new KoraPayment();
    payment.initialize(paymentOptions);
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
          <input name="prices" type="radio" value={800} id="weekly" checked={price === 800 ? true : false} onChange={(e) => setPrice(800)} />
          <label htmlFor="weekly">7 Days VIP</label>
          <span className="price">KSH 800</span>
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
      <button onClick={handlePayment} className="btn">
        Pay Now
    </button>
    </div>
  )
}
