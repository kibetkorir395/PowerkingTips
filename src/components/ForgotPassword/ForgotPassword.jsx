import React, { useState } from 'react';
import { authService } from '../../services/auth.service';
import './ForgotPassword.scss';

export default function ForgotPassword({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await authService.forgotPassword(email);
    
    if (result.success) {
      setMessage(result.message);
      setTimeout(() => onSuccess?.(), 3000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="forgot-password-modal">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Reset Password</h2>
        <p>Enter your email address and we'll send you a link to reset your password.</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}