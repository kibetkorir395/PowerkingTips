import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePrice } from '../../context/PriceContext';
import {
  SUBSCRIPTION_PLANS,
  getPlanName,
  handleUpgrade,
} from "./paymentUtils";
import Swal from "sweetalert2";
import { Smartphone, Lock, Shield, CheckCircle, Phone, AttachMoney, AccessTime, CreditCard } from '@mui/icons-material';
import CryptoJS from 'crypto-js';
import './CashiaPaymentsV2.scss';

// Cashia API Configuration
const CASHIA_CONFIG = {
  // Environment URLs
  baseUrl: 'https://pre-prod.cashia.com/api',
  hostedCheckoutUrl: 'https://checkout.stg.cashia.com',
  
  // Merchant Credentials (from environment variables)
  keyId: import.meta.env.VITE_CASHIA_KEY_ID || '',
  secret: import.meta.env.VITE_CASHIA_SECRET || '',
  
  // Callback URLs
  webhookUrl: `${window.location.origin}/api/cashia-webhook`,
  successRedirectUrl: `${window.location.origin}/payment-success`,
  errorRedirectUrl: `${window.location.origin}/payment-error`,
};

export default function CashiaPaymentsV2({ setUserData }) {
  const { price, setPrice } = usePrice();
  const { currentUser } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [showIframe, setShowIframe] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa'); // mpesa, card
  const iframeRef = useRef(null);

  const subscriptionPlans = SUBSCRIPTION_PLANS.shillings;

  // Initialize price
  useEffect(() => {
    setPrice(subscriptionPlans[0].value);
  }, []);

  // Generate HMAC-SHA256 signature
  const generateHmac256 = useCallback((message, secret) => {
    const hash = CryptoJS.HmacSHA256(message, secret);
    return hash.toString(CryptoJS.enc.Hex);
  }, []);

  // Generate body hash using SHA256
  const generateBodyHash = useCallback((body) => {
    const hash = CryptoJS.SHA256(JSON.stringify(body)).toString(CryptoJS.enc.Hex);
    return hash;
  }, []);

  // Generate nonce (minimum 12 characters)
  const generateNonce = useCallback(() => {
    return CryptoJS.lib.WordArray.random(16).toString();
  }, []);

  // Build authentication headers based on Cashia API spec
  const buildAuthHeaders = useCallback(async (method, endpoint, body) => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = generateNonce();
    const bodyHash = generateBodyHash(body);
    
    // Build signing string: host + method + timestamp + nonce + keyId
    const host = CASHIA_CONFIG.baseUrl.replace('https://', '').replace('http://', '');
    const signingString = `${host}${method}${timestamp}${nonce}${CASHIA_CONFIG.keyId}`;
    const signature = generateHmac256(signingString, CASHIA_CONFIG.secret);
    
    return {
      'Content-Type': 'application/json',
      'X-Cashia-Key-ID': CASHIA_CONFIG.keyId,
      'X-Cashia-Timestamp': timestamp,
      'X-Cashia-Signature': signature,
      'X-Cashia-Nonce': nonce,
      'X-Cashia-Hash': bodyHash,
    };
  }, [generateHmac256, generateNonce, generateBodyHash]);

  // Create hosted checkout session
  const createCheckoutSession = useCallback(async () => {
    setProcessing(true);
    
    const newRequestId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    setRequestId(newRequestId);
    
    const sessionData = {
      requestId: newRequestId,
      currency: "KES",
      amount: price,
      webhookUrl: CASHIA_CONFIG.webhookUrl,
      successRedirectUrl: `${CASHIA_CONFIG.successRedirectUrl}?requestId=${newRequestId}`,
      errorRedirectUrl: `${CASHIA_CONFIG.errorRedirectUrl}?requestId=${newRequestId}`,
      orderDetails: [
        {
          name: `${getPlanName(price)} VIP Subscription`,
          quantity: 1,
          description: `VIP Subscription - ${getPlanName(price)}`,
          price: price,
          currency: "KES"
        }
      ],
      deliveryDetails: {
        currency: "KES",
        fee: 0
      }
    };
    
    try {
      const headers = await buildAuthHeaders('POST', '/v1/hosted-checkout', sessionData);
      
      const response = await fetch(`${CASHIA_CONFIG.baseUrl}/v1/hosted-checkout`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(sessionData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.sessionId && data.url) {
        setSessionId(data.sessionId);
        setIframeUrl(data.url);
        setShowIframe(true);
        setPaymentStatus('pending');
        
        // Start polling for payment status
        startPolling(data.sessionId, newRequestId);
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Session creation error:', error);
      Swal.fire({
        title: "Payment Error",
        text: error.message || "Unable to initialize payment. Please try again.",
        icon: "error",
        confirmButtonText: "OK"
      });
    } finally {
      setProcessing(false);
    }
  }, [price, buildAuthHeaders]);

  // Poll payment status
  const startPolling = useCallback((sessionId, requestId) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (60 * 5 seconds)
    
    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        const status = await checkTransactionStatus(requestId);
        
        if (status === 'completed' || status === 'success') {
          clearInterval(pollInterval);
          setPaymentStatus('completed');
          setShowIframe(false);
          
          await handleUpgrade(currentUser, price, setUserData);
          
          Swal.fire({
            title: "Payment Successful! 🎉",
            html: `
              <div style="text-align: center;">
                <div class="payment-success-icon">✅</div>
                <h3 style="margin: 15px 0;">${getPlanName(price)} VIP Activated!</h3>
                <p>Payment of KSH ${price} was successful</p>
              </div>
            `,
            icon: "success",
            confirmButtonText: "Continue",
            confirmButtonColor: "#00ae58"
          }).then(() => {
            window.location.href = "/tips";
          });
        } else if (status === 'failed' || status === 'cancelled') {
          clearInterval(pollInterval);
          setPaymentStatus('failed');
          setShowIframe(false);
          Swal.fire({
            title: "Payment Failed",
            text: "The payment was not completed. Please try again.",
            icon: "error",
            confirmButtonText: "OK"
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setPaymentStatus('timeout');
          setShowIframe(false);
          Swal.fire({
            title: "Payment Timeout",
            text: "Payment confirmation is taking longer than expected. Please check your transaction status later.",
            icon: "warning",
            confirmButtonText: "OK"
          });
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [price, currentUser, setUserData]);

  // Check transaction status using the API
  const checkTransactionStatus = useCallback(async (requestId) => {
    try {
      const headers = await buildAuthHeaders('GET', `/v1/transactions/${requestId}`, {});
      
      const response = await fetch(`${CASHIA_CONFIG.baseUrl}/v1/transactions/${requestId}`, {
        method: 'GET',
        headers: headers
      });
      
      const data = await response.json();
      
      if (data.process && data.process.requestStatus) {
        const status = data.process.requestStatus.toLowerCase();
        
        if (status === 'completed' || status === 'success') {
          return 'completed';
        } else if (status === 'failed' || status === 'declined') {
          return 'failed';
        } else if (status === 'cancelled') {
          return 'cancelled';
        } else if (status === 'pending') {
          return 'pending';
        }
      }
      
      return 'pending';
    } catch (error) {
      console.error('Status check error:', error);
      return 'unknown';
    }
  }, [buildAuthHeaders]);

  // Handle message events from iframe (for payment completion)
  useEffect(() => {
    const handleMessage = (event) => {
      // Validate origin for security
      if (event.origin !== CASHIA_CONFIG.hostedCheckoutUrl) return;
      
      const { type, status, requestId: msgRequestId } = event.data;
      
      if (type === 'payment_complete' && msgRequestId === requestId) {
        if (status === 'success') {
          handleUpgrade(currentUser, price, setUserData).then(() => {
            Swal.fire({
              title: "Payment Successful! 🎉",
              text: `${getPlanName(price)} VIP Activated!`,
              icon: "success",
              confirmButtonText: "Continue"
            }).then(() => {
              window.location.href = "/tips";
            });
          });
        } else if (status === 'error') {
          Swal.fire({
            title: "Payment Failed",
            text: "There was an issue processing your payment.",
            icon: "error",
            confirmButtonText: "OK"
          });
        }
        setShowIframe(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [requestId, currentUser, price, setUserData]);

  const handlePlanSelect = (planValue) => {
    setPrice(planValue);
  };

  const closeIframe = () => {
    setShowIframe(false);
    setPaymentStatus(null);
  };

  return (
    <div className="cashia-v2-payment-wrapper">
      <div className="plan-selector">
        {subscriptionPlans.map((plan) => (
          <label
            key={plan.id}
            className={`plan-option ${price === plan.value ? "active" : ""}`}
          >
            <input
              type="radio"
              name="subscription-plan"
              value={plan.value}
              checked={price === plan.value}
              onChange={() => handlePlanSelect(plan.value)}
            />
            <span className="plan-label">{plan.label}</span>
            <span className="plan-price">{plan.price}</span>
          </label>
        ))}
      </div>

      <div className="cashia-v2-payment">
        <div className="payment-header">
          <Smartphone className="payment-icon" />
          <h3>Cashia Secure Payments</h3>
          <p>Powered by Cashia Payment Gateway</p>
        </div>

        <div className="payment-methods">
          <button
            className={`method-btn ${paymentMethod === 'mpesa' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('mpesa')}
          >
            <Smartphone size={18} />
            M-Pesa
          </button>
          <button
            className={`method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('card')}
          >
            <CreditCard size={18} />
            Card
          </button>
        </div>

        <div className="payment-info-card">
          <div className="info-row">
            <AttachMoney size={18} />
            <span>Amount to Pay:</span>
            <strong>KSH {price}</strong>
          </div>
          <div className="info-row">
            <AccessTime size={18} />
            <span>Service:</span>
            <strong>{getPlanName(price)} VIP Subscription</strong>
          </div>
        </div>

        <div className="payment-features">
          <div className="feature">
            <Shield size={16} />
            <span>256-bit SSL Secure</span>
          </div>
          <div className="feature">
            <Lock size={16} />
            <span>PCI DSS Compliant</span>
          </div>
          <div className="feature">
            <CheckCircle size={16} />
            <span>Instant Confirmation</span>
          </div>
        </div>

        {!showIframe ? (
          <button
            onClick={createCheckoutSession}
            className="pay-now-btn"
            disabled={processing}
          >
            {processing ? (
              <>
                <span className="spinner-small"></span>
                Initializing...
              </>
            ) : (
              `Pay KSH ${price} with ${paymentMethod === 'mpesa' ? 'M-Pesa' : 'Card'}`
            )}
          </button>
        ) : (
          <div className="iframe-container">
            <div className="iframe-header">
              <h4>Complete Your Payment</h4>
              <button className="close-iframe" onClick={closeIframe}>×</button>
            </div>
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              title="Cashia Secure Checkout"
              className="cashia-iframe"
              allow="payment *"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            />
            <p className="iframe-note">
              <Lock size={12} /> Secure payment powered by Cashia
            </p>
          </div>
        )}

        {paymentStatus === 'pending' && !showIframe && (
          <div className="payment-pending">
            <div className="spinner"></div>
            <p>Waiting for payment confirmation...</p>
          </div>
        )}

        <p className="payment-note">
          <Lock size={12} /> Your payment is secure and encrypted
        </p>
      </div>
    </div>
  );
}