import React, { useState } from 'react';
import './Login.scss';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import ForgotPassword from '../../components/ForgotPassword/ForgotPassword';
import { Visibility, VisibilityOff, Google } from '@mui/icons-material';
import GoogleButton from 'react-google-button';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUserData } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await authService.login(email, password);
    
    if (result.success) {
      await refreshUserData();
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    
    const result = await authService.signInWithGoogle();
    
    if (result.success) {
      await refreshUserData();
      navigate('/');
    } else {
      setError(result.error);
    }
    setGoogleLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Welcome Back</h1>
        <p>Login to access your VIP predictions</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || googleLoading}
            />
          </div>

          <div className="input-group password-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || googleLoading}
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={togglePasswordVisibility}
              tabIndex="-1"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-login" disabled={loading || googleLoading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          {/*<button 
            type="button" 
            className="btn-google"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
          >
            <Google />
            <span>{googleLoading ? 'Signing in...' : 'Sign in with Google'}</span>
          <//button>*/}

          <GoogleButton
            style={{width: "100%", borderRadius: "50px"}}
            type="dark"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
          />

          <div className="form-footer">
            <button 
              type="button" 
              className="forgot-password"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot Password?
            </button>
            <Link to="/register" className="register-link">
              Create Account →
            </Link>
          </div>
        </form>
      </div>

      {showForgotPassword && (
        <ForgotPassword 
          onClose={() => setShowForgotPassword(false)}
          onSuccess={() => {
            setShowForgotPassword(false);
            alert('Password reset email sent! Check your inbox.');
          }}
        />
      )}
    </div>
  );
}