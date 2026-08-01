import React, { useState } from 'react';
import './Login.scss';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import ForgotPassword from '../../components/ForgotPassword/ForgotPassword';
import { Visibility, VisibilityOff, Google } from '@mui/icons-material';
import GoogleButton from 'react-google-button';
import { LoginButton } from '@telegram-auth/react';

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

  // Telegram authentication handler
  const handleTelegramAuth = async (authData) => {
    setLoading(true);
    setError('');
    
    try {
      // Create email from Telegram data
      const telegramEmail = authData.username 
        ? `${authData.username}@telegram.user`
        : `telegram_${authData.id}@telegram.user`;
      
      // First, try to login with existing Telegram-linked account
      const result = await authService.loginWithTelegram(telegramEmail, authData);
      
      if (result.success) {
        await refreshUserData();
        navigate('/');
      } else if (result.error === 'User not found') {
        // User doesn't exist - redirect to register with pre-filled data
        setError('Telegram account not linked. Please register first.');
        setTimeout(() => {
          navigate('/register', { 
            state: { 
              telegramData: {
                email: telegramEmail,
                username: authData.username || authData.first_name,
                firstName: authData.first_name,
                lastName: authData.last_name,
                photoUrl: authData.photo_url,
                telegramId: authData.id
              }
            }
          });
        }, 2000);
      } else {
        setError(result.error || 'Telegram login failed');
      }
    } catch (err) {
      console.error('Telegram auth error:', err);
      setError('Telegram authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
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

          <GoogleButton
            style={{width: "100%", borderRadius: "50px"}}
            type="dark"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
          />

          <LoginButton
            botUsername={'powerking_tips_auth_bot'}
            onAuthCallback={handleTelegramAuth}
            buttonSize="large"
            cornerRadius={20}
            showAvatar={true}
            lang="en"
            className="telegram-login-btn"
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