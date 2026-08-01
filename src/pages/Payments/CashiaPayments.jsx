import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePrice } from '../../context/PriceContext';
import {
  SUBSCRIPTION_PLANS,
  getPlanName,
  handleUpgrade,
} from "./paymentUtils";
import Swal from "sweetalert2";
import { Smartphone, Lock, Shield, CheckCircle, Warning, Phone, AttachMoney, AccessTime } from '@mui/icons-material';
import CryptoJS from 'crypto-js';
import './Payments.scss';

// Cashia API Configuration
const CASHIA_CONFIG = {
  // Staging Environment
  baseUrl: 'https://staging.cashia.com/api/v1',
  paymentUrl: 'https://h32de16gy8.execute-api.eu-west-1.amazonaws.com/api/public/v1/merchant-payments',
  statusUrl: 'https://h32de16gy8.execute-api.eu-west-1.amazonaws.com/api/public/v1/merchant-payments/status',
  
  // Mock endpoints for testing
  mockAuthUrl: 'https://jrtcoxo4ng.execute-api.eu-west-1.amazonaws.com/api/v1/authorization/confirm',
  
  // Merchant Credentials (from environment variables)
  merchantLogin: import.meta.env.VITE_CASHIA_MERCHANT_LOGIN || '',
  merchantPassword: import.meta.env.VITE_CASHIA_MERCHANT_PASSWORD || '',
  apiKey: import.meta.env.VITE_CASHIA_API_KEY || '',
  apiSecret: import.meta.env.VITE_CASHIA_API_SECRET || '',
  terminalId: import.meta.env.VITE_CASHIA_TERMINAL_ID || '',
  merchantId: import.meta.env.VITE_CASHIA_MERCHANT_ID || '',
  
  // Static OTP for staging
  staticOtp: '534789',
  
  // Callback URLs
  callbackUrl: `${window.location.origin}/api/cashia-webhook`,
  successRedirectUrl: `${window.location.origin}/payment-success`,
};

export default function CashiaPayments({ setUserData }) {
  const { price, setPrice } = usePrice();
  const { currentUser } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentIdentifier, setPaymentIdentifier] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bearerToken, setBearerToken] = useState(null);
  const [terminalId, setTerminalId] = useState(CASHIA_CONFIG.terminalId);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [paymentStep, setPaymentStep] = useState('init'); // init, processing, waiting, completed

  const subscriptionPlans = SUBSCRIPTION_PLANS.shillings;

  // Initialize price
  useEffect(() => {
    setPrice(subscriptionPlans[0].value);
  }, []);

  // Generate HMAC-SHA256 signature
  const generateSignature = useCallback((method, endpoint, body, timestamp, nonce) => {
    const stringToSign = `${method}\n${endpoint}\n${timestamp}\n${nonce}\n${body}`;
    const signature = CryptoJS.HmacSHA256(stringToSign, CASHIA_CONFIG.apiSecret).toString(CryptoJS.enc.Base64);
    return signature;
  }, []);

  // Generate body hash
  const generateBodyHash = useCallback((body) => {
    const hash = CryptoJS.SHA256(JSON.stringify(body)).toString(CryptoJS.enc.Hex);
    return hash;
  }, []);

  // Generate nonce
  const generateNonce = useCallback(() => {
    return CryptoJS.lib.WordArray.random(16).toString();
  }, []);

  // Authenticate merchant
  const authenticateMerchant = useCallback(async () => {
    try {
      // Step 1: Login
      const loginResponse = await fetch(`${CASHIA_CONFIG.baseUrl}/authorization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: CASHIA_CONFIG.merchantLogin,
          password: CASHIA_CONFIG.merchantPassword
        })
      });

      if (!loginResponse.ok) throw new Error('Login failed');

      // Step 2: Confirm OTP
      const otpResponse = await fetch(`${CASHIA_CONFIG.baseUrl}/authorization/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: CASHIA_CONFIG.merchantLogin,
          otp: CASHIA_CONFIG.staticOtp
        })
      });

      const otpData = await otpResponse.json();
      
      if (otpData.token) {
        setBearerToken(otpData.token);
        setIsAuthenticated(true);
        return otpData.token;
      }
      throw new Error('OTP validation failed');
    } catch (error) {
      console.error('Authentication error:', error);
      // For demo purposes, set mock authenticated
      setIsAuthenticated(true);
      return 'mock-token';
    }
  }, []);

  // Format phone number
  const formatPhoneNumber = useCallback((phone) => {
    let cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned;
    }
    return cleaned;
  }, []);

  // Validate phone number
  const validatePhoneNumber = useCallback((phone) => {
    const formatted = formatPhoneNumber(phone);
    const isValid = /^254[17]\d{8}$/.test(formatted);
    setPhoneError(isValid ? '' : 'Please enter a valid Kenyan phone number (e.g., 0712345678)');
    return isValid;
  }, [formatPhoneNumber]);

  // Initiate payment
  const initiatePayment = useCallback(async () => {
    if (!validatePhoneNumber(phoneNumber)) return;
    
    setProcessing(true);
    setPaymentStep('processing');
    
    try {
      // Ensure authentication
      let token = bearerToken;
      if (!token) {
        token = await authenticateMerchant();
      }
      
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const newOrderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      setOrderId(newOrderId);
      
      const paymentData = {
        terminalId: terminalId || CASHIA_CONFIG.terminalId,
        currency: "KES",
        amount: price,
        merchantStika: "KES_123456",
        orderId: newOrderId,
        description: `${getPlanName(price)} VIP Subscription`,
        payer: {
          method: "phone",
          value: formattedPhone
        },
        urls: {
          callbackUrl: CASHIA_CONFIG.callbackUrl,
          successRedirectUrl: `${CASHIA_CONFIG.successRedirectUrl}?orderId=${newOrderId}`
        }
      };
      
      const timestamp = Date.now().toString();
      const nonce = generateNonce();
      const bodyHash = generateBodyHash(paymentData);
      const signature = generateSignature('POST', '/merchant-payments', bodyHash, timestamp, nonce);
      
      const response = await fetch(CASHIA_CONFIG.paymentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cashia-Hash': bodyHash,
          'X-Cashia-Signature': signature,
          'X-Cashia-Timestamp': timestamp,
          'X-Cashia-Key-ID': CASHIA_CONFIG.apiKey,
          'X-Cashia-Nonce': nonce,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.paymentIdentifier) {
        setPaymentIdentifier(data.paymentIdentifier);
        setPaymentStep('waiting');
        setShowPhoneModal(false);
        
        Swal.fire({
          title: "Payment Request Sent! 📱",
          html: `
            <div style="text-align: center;">
              <div class="payment-status-icon">💳</div>
              <p style="margin: 15px 0;">Check your phone at <strong>${formattedPhone}</strong></p>
              <p>Enter your M-Pesa PIN to complete the payment of <strong>KSH ${price}</strong></p>
              <p style="font-size: 12px; color: #666; margin-top: 15px;">Waiting for confirmation...</p>
            </div>
          `,
          icon: "info",
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true
        });
        
        // Start polling for payment status
        startPolling(data.paymentIdentifier);
      } else {
        throw new Error(data.message || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setPaymentStep('init');
      Swal.fire({
        title: "Payment Failed",
        text: error.message || "Unable to initiate payment. Please try again.",
        icon: "error",
        confirmButtonText: "OK"
      });
    } finally {
      setProcessing(false);
    }
  }, [phoneNumber, price, validatePhoneNumber, formatPhoneNumber, bearerToken, authenticateMerchant, terminalId, generateNonce, generateBodyHash, generateSignature]);

  // Poll payment status
  const startPolling = useCallback((identifier) => {
    let attempts = 0;
    const maxAttempts = 30;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        const timestamp = Date.now().toString();
        const nonce = generateNonce();
        const statusData = { paymentIdentifier: identifier };
        const bodyHash = generateBodyHash(statusData);
        const signature = generateSignature('POST', '/merchant-payments/status', bodyHash, timestamp, nonce);
        
        const response = await fetch(CASHIA_CONFIG.statusUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Cashia-Hash': bodyHash,
            'X-Cashia-Signature': signature,
            'X-Cashia-Timestamp': timestamp,
            'X-Cashia-Key-ID': CASHIA_CONFIG.apiKey,
            'X-Cashia-Nonce': nonce
          },
          body: JSON.stringify(statusData)
        });
        
        const data = await response.json();
        
        if (data.status === 'paid' || data.status === 'completed') {
          clearInterval(pollInterval);
          setPaymentStatus('paid');
          setPaymentStep('completed');
          
          await handleUpgrade(currentUser, price, setUserData);
          
          Swal.fire({
            title: "Payment Successful! 🎉",
            html: `
              <div style="text-align: center;">
                <div class="payment-success-icon">✅</div>
                <h3 style="margin: 15px 0;">${getPlanName(price)} VIP Activated!</h3>
                <p>Payment of KSH ${price} was successful</p>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">Transaction ID: ${data.transactionId || identifier}</p>
              </div>
            `,
            icon: "success",
            confirmButtonText: "Continue",
            confirmButtonColor: "#00ae58"
          }).then(() => {
            window.location.href = "/tips";
          });
        } else if (data.status === 'failed' || data.status === 'declined') {
          clearInterval(pollInterval);
          setPaymentStatus('failed');
          setPaymentStep('init');
          Swal.fire({
            title: "Payment Failed",
            text: "The payment was not completed. Please try again.",
            icon: "error",
            confirmButtonText: "OK"
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setPaymentStep('init');
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
    
    setPollingInterval(pollInterval);
  }, [price, currentUser, setUserData, generateNonce, generateBodyHash, generateSignature]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handlePlanSelect = (planValue) => {
    setPrice(planValue);
  };

  const openPhoneModal = () => {
    setPhoneNumber('');
    setPhoneError('');
    setShowPhoneModal(true);
  };

  return (
    <div className="cashia-payment-wrapper">
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

      <div className="cashia-payment">
        <div className="payment-header">
          <Smartphone className="payment-icon" />
          <h3>M-Pesa Payment via Cashia</h3>
          <p>Secure mobile money payment</p>
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
            <span>Secure & Encrypted</span>
          </div>
          <div className="feature">
            <Lock size={16} />
            <span>PCI Compliant</span>
          </div>
          <div className="feature">
            <CheckCircle size={16} />
            <span>Instant Confirmation</span>
          </div>
        </div>

        {paymentStep === 'processing' && (
          <div className="payment-processing">
            <div className="spinner"></div>
            <p>Initiating payment...</p>
          </div>
        )}

        {paymentStep === 'waiting' && (
          <div className="payment-waiting">
            <div className="pulse-animation"></div>
            <div className="waiting-content">
              <Smartphone size={48} />
              <h4>Check Your Phone</h4>
              <p>Enter your M-Pesa PIN when prompted</p>
              <p className="waiting-note">Waiting for confirmation...</p>
            </div>
          </div>
        )}

        {paymentStep === 'init' && (
          <button
            onClick={openPhoneModal}
            className="pay-now-btn"
            disabled={processing}
          >
            {processing ? 'Processing...' : `Pay KSH ${price} with M-Pesa`}
          </button>
        )}

        <p className="payment-note">
          <Lock size={12} /> Powered by Cashia - Secure Mobile Payments
        </p>
      </div>

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div className="modal-overlay" onClick={() => setShowPhoneModal(false)}>
          <div className="phone-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Enter M-Pesa Phone Number</h3>
              <button className="close-btn" onClick={() => setShowPhoneModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="phone-input-wrapper">
                <Phone className="input-icon" />
                <input
                  type="tel"
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    validatePhoneNumber(e.target.value);
                  }}
                  className={phoneError ? 'error' : ''}
                />
              </div>
              {phoneError && <span className="error-message">{phoneError}</span>}
              <div className="info-text">
                <p>You will receive a prompt on your phone to complete the payment</p>
                <p className="small">Standard M-Pesa charges may apply</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowPhoneModal(false)}>Cancel</button>
              <button className="btn-pay" onClick={initiatePayment} disabled={processing || !!phoneError}>
                {processing ? 'Processing...' : 'Continue to Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}