import React, { useState } from 'react';
import './Register.scss';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { Visibility, VisibilityOff, Google } from '@mui/icons-material';

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

          <button 
            type="button" 
            className="btn-google"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
          >
            <Google />
            <span>{googleLoading ? 'Signing in...' : 'Sign up with Google'}</span>
          </button>

          <div className="form-footer">
            Already have an account? <Link to="/login">Login →</Link>
          </div>
        </form>
      </div>
    </div>
  );
}