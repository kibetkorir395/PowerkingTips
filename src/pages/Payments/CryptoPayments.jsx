import React, { useEffect, useRef, useState } from 'react'

import NowPaymentsApi from '@nowpaymentsio/nowpayments-api-js'
import { Check, CopyAll } from '@mui/icons-material';

const npApi = new NowPaymentsApi({ apiKey: 'D7YT1YV-PCAM4ZN-HX9W5M1-H02KFCV' })

export default function CryptoPayments() {
  const [currenciesArr, setCurrenciesArr] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("TUSD");
  const addressRef = useRef();
  const [copied, setCopied] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payCurrecy, setPayCurrency] = useState("");
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("");
  const selectRef = useRef();
  const [price, setPrice] = useState(10);

  async function getAddress() {
    const params = {
      price_amount: price,
      price_currency: "usd",
      pay_currency: selectedCurrency.toLowerCase()
    }
    const response = await npApi.createPayment(params)
    setPayAmount(response.pay_amount)
    setPayCurrency(response.pay_currency)
    setAddress(response.pay_address)
    setNetwork(response.network)
  }



  useEffect(() => {
    getAddress()
  }, [selectedCurrency, price])

  function handleCopy(e) {
    e.preventDefault();
    addressRef.current.select();
    addressRef.current.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(addressRef.current.value);
    setCopied(true);
  }


  useEffect(() => {
    async function fetchCurrencies() {
      await fetch("https://api.nowpayments.io/v1/merchant/coins", {
        method: "GET",
        headers: {
          "x-api-key": "K80YG02-W464QP0-QR7E9EZ-QFY3ZGQ"
        }
      }).then(async res => {
        const body = await res.json();
        setCurrenciesArr(body.selectedCurrencies)
      }).catch(error => {
        return error;
      })
    }
    fetchCurrencies()
    getAddress()
  }, [])

  useEffect(() => {
    copied && setTimeout(() => {
      setCopied(!copied);
    }, 1000)
  }, [copied])
  return (
    <div className='crypto'>
      <h2>CRYPTO PAYMENTS</h2>
      <form className='pricing'>
        <fieldset>
          <input name="payment-method" type="radio" value={10} id="10" checked={price === 10} onChange={() => setPrice(10)} />
          <label htmlFor="10">$10</label>
          <span className="sub">Weekly</span>
        </fieldset>
        <fieldset>
          <input name="payment-method" type="radio" value={23} id="23" checked={price === 23} onChange={() => setPrice(23)} />
          <label htmlFor="23">$23</label>
          <span className="sub">Monthly</span>
        </fieldset>
        <fieldset>
          <input name="payment-method" type="radio" value={60} id="60" checked={price === 60} onChange={() => setPrice(60)} />
          <label htmlFor="60">$60</label>
          <span className="sub">Yearly</span>
        </fieldset>
      </form>
      <br />
      <label htmlFor="crypto">SELECT CRYPTO:</label>
      <select name="crypto" id="crypto" value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)} ref={selectRef}>
        {currenciesArr && currenciesArr.map((currency) => (
          <option value={currency} key={currency} defaultValue={currency.toLowerCase() === selectedCurrency.toLowerCase()}>{currency}</option>
        ))}
      </select>
      <p>Deposit Amount: <span>{payAmount && payAmount}  {payCurrecy && payCurrecy.toLocaleUpperCase()}</span></p>
      <p>Address: <span>{address && address}</span></p>
      <p>Network: <span>{network && network.toLocaleUpperCase()}</span></p>
      <form className='copy'>
        <input type='text' placeholder='address' value={
          address ? address : ""
        } disabled ref={addressRef} />
        <button type='submit' name='copy-btn' title='copy address' aria-label="submit" onClick={handleCopy}>
          {
            copied ? <Check /> : <CopyAll />
          }
        </button>
      </form>
    </div>
  )
}
