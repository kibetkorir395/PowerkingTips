import React, { useContext, useState} from 'react'
import './Ticket.scss';
import { PriceContext } from '../../PriceContext';
import AppHelmet from '../../components/AppHelmet';

export default function CardPayment() {
  const {price, setPrice} = useContext(PriceContext)
  const [url, setUrl]  = useState("https://buymeacoffee.com/kibetkorir/e/337804");

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

  const handleClick = () => {
    window.open(url, '_blank');
  }
  return (
    <div className="pay">
      <AppHelmet title={"Pay"} location={'/pay'}/>
      <form>
      <fieldset>
        <input name="prices" type="radio" value={200} id="daily" checked={price===200 ? true : false}   onChange={(e) => {
          setPrice(200)
          setUrl("https://buymeacoffee.com/kibetkorir/e/337804")
        }}/>
        <label htmlFor="daily">Daily VIP</label>
        <span className="price">KSH 200</span>
      </fieldset>
      <fieldset>
        <input name="prices" type="radio" value={600} id="weekly" checked={price===600 ? true : false}  onChange={(e) => {
          setPrice(600)
          setUrl("https://buymeacoffee.com/kibetkorir/e/337803")
        }}/>
        <label htmlFor="weekly">7 Days VIP</label>
        <span className="price">KSH 600</span>
      </fieldset>
      <fieldset>
        <input name="prices" type="radio" value={3000} id="monthly" checked={price===3000 ? true : false}   onChange={(e) => {
          setPrice(3000)
          setUrl("https://buymeacoffee.com/kibetkorir/e/337805");
        }}/>
        <label htmlFor="monthly">30 Days VIP</label>
        <span className="price">KSH 3000</span>
      </fieldset>
      <fieldset>
        <input name="prices" type="radio" value={7500} id="yearly" checked={price===7500 ? true : false}   onChange={(e) => {
          setPrice(7500)
          setUrl("https://buymeacoffee.com/kibetkorir/e/337807");
        }}/>
        <label htmlFor="yearly">1 Year VIP</label>
        <span className="price">KSH 7500</span>
      </fieldset>
    </form>
    <h4>GET {returnPeriod().toUpperCase()} VIP FOR {price}</h4>
    <span 
          className="btn" id="donate-button"
          onClick={handleClick}
        >PAY NOW</span>
    </div>
  )
}
