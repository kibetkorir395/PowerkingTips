import React, { useState, useEffect} from 'react'
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { addPhone } from '../../firebase';
import AppHelmet from '../../components/AppHelmet';
import { Buffers } from '@react-frontend-developer/buffers';
//import {payWithMpesa} from 'all-payments'

export default function Mpesa() {
  const [phoneNumber, setPhoneNumber] = useState();
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const phoneUtil = PhoneNumberUtil.getInstance();
const isPhoneValid = (phone) => {
  try {
    return phoneUtil.isValidNumber(phoneUtil.parseAndKeepRawInput(phone));
  } catch (error) {
    return false;
  }
};

async function getAccessToken() {
  const consumerKey = "A0SZLg9TVzAP1758ZKIkhWKQiuOa7KDg4w5Vh8aGqGFGLtns";
  const consumerSecret = "7ms3yoYqZBxSHCGt41Jup6Hz10WERitL1kqrysHh14TY6GzTktapdaJUTnIQAjox";
  const auth = new Buffers.fromString(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  const response = await fetch("https://pay.pesapal.com/v3/api/Auth/RequestToken", {
    method: "GET",
    headers: {
      "Authorization": `Basic ${auth}`
    }
  });
  
  const data = await response.json();
  return data.access_token;
}

  const handleSubmit = async (event) => {
    event.preventDefault();
    const accessToken = await getAccessToken();
    
    if(!isPhoneValid(phoneNumber)){
      setError("invalid phone number");
      return;
    }


    /*payWithMpesa(phoneNumber, "10", "4139425", 
      "https://powerkingtips.com/tips", 
      "A0SZLg9TVzAP1758ZKIkhWKQiuOa7KDg4w5Vh8aGqGFGLtns",
      "7ms3yoYqZBxSHCGt41Jup6Hz10WERitL1kqrysHh14TY6GzTktapdaJUTnIQAjox",
      "production"
    )*/
  

    //addPhone({phone: phoneNumber, message});
    //setSuccess(`Your Request Has Been Submitted For Approval`)

    async function initiateSTKPush() {
      const accessToken = await getAccessToken();
      const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
      
      // Replace these with your details
      const businessShortCode = "YOUR_SHORTCODE";
      const passkey = "YOUR_PASSKEY";
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = btoa(`${businessShortCode}${passkey}${timestamp}`);
      
      const payload = {
        "BusinessShortCode": businessShortCode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": 1, // Amount to be paid
        "PartyA": "2547XXXXXXXX", // Your phone number with country code
        "PartyB": businessShortCode,
        "PhoneNumber": "2547XXXXXXXX",
        "CallBackURL": "https://powerkingtips.com/tips",
        "AccountReference": "Test123",
        "TransactionDesc": "Payment for testing"
      };
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
    }
    
    // Initiate the STK Push
    //initiateSTKPush();

    
    
  };
  
  useEffect(() => {
    error && setTimeout(() => {
      setError(null);
    }, 3000);

    success && setTimeout(() => {
      setPhoneNumber('')
      setSuccess(null);
      window.location.replace('/tips')
    }, 3000);
  }, [error, success]);
  
  return (
    <div className='paid-page' >
        <AppHelmet title={"Paid"} location={'/paid-submit'}/>
        <form onSubmit={handleSubmit}>
            <h2>BUSINESS 4139425</h2>
            <label htmlFor='name'><h4>PHONE NUMBER:</h4></label>
            <PhoneInput
              defaultCountry='ke'
              value={phoneNumber}
              onChange={phone => setPhoneNumber(phone)}
              hideDropdown
              className='input'
            />
            <label><h4>AMOUNT (KSH):</h4></label>
            <input type="number" name="" id="" value={600} disabled/>
            <button className="btn" type='submit' title='send' aria-label="send">PAY NOW</button>
            {
              error && <h4 className='error'>{error}</h4>
            }
            {
              success && <h4 className='success'>{success}</h4>
            }
        </form>
    </div>
  )
}