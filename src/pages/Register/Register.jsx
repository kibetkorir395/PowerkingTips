import React, { useState } from 'react';
import './Register.scss';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { Visibility, VisibilityOff, Google } from '@mui/icons-material';
import GoogleButton from 'react-google-button';
import { LoginButton } from '@telegram-auth/react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');

    const result = await authService.register(email, password, username);
    
    if (result.success) {
      setSuccess('Registration successful! Please check your email for verification.');
      setTimeout(() => navigate('/login'), 3000);
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
      navigate('/');
    } else {
      setError(result.error);
    }
    setGoogleLoading(false);
  };

  // Client-only Telegram authentication
  const handleTelegramAuth = async (authData) => {
    setLoading(true);
    setError('');
    
    try {
      // authData contains: { id, first_name, last_name, username, photo_url, auth_date, hash }
      console.log('Telegram auth data:', authData);
      
      // Create a Firebase user with Telegram data
      const telegramId = authData.id;
      const telegramEmail = authData.username 
        ? `${authData.username}@telegram.user`
        : `telegram_${telegramId}@telegram.user`;
      const telegramUsername = authData.username || 
        `${authData.first_name}${authData.last_name ? `_${authData.last_name}` : ''}`;
      
      // Check if user already exists in Firebase
      const existingUser = await authService.getUserByEmail(telegramEmail);
      
      if (existingUser) {
        // User exists, sign them in
        // Note: You'd need a custom method for this without backend
        setError('Please use the login page to sign in with Telegram');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        // Create new user in Firestore (without Firebase Auth)
        const result = await authService.createTelegramUser({
          email: telegramEmail,
          username: telegramUsername,
          telegramId: telegramId,
          firstName: authData.first_name,
          lastName: authData.last_name,
          photoUrl: authData.photo_url
        });
        
        if (result.success) {
          setSuccess('Telegram account linked! Please login to continue.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError(result.error);
        }
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

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h1>Create Account</h1>
        <p>Join PowerKing Tips for free</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading || googleLoading}
            />
          </div>

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

          <div className="input-group password-group">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading || googleLoading}
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={toggleConfirmPasswordVisibility}
              tabIndex="-1"
            >
              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="btn-register" disabled={loading || googleLoading}>
            {loading ? 'Creating Account...' : 'Register'}
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

          {/* Fixed LoginButton - onAuthCallback must be a FUNCTION, not a string */}
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
            Already have an account? <Link to="/login">Login →</Link>
          </div>
        </form>
      </div>
    </div>
  );
}