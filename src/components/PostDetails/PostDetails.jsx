import React, { useContext, useEffect, useState } from 'react'
import './PostDetails.scss';
import Profile from '../../assets/vip.jpg';
import Logo from '../../assets/logo.png';
import { Close, ErrorTwoTone, Verified, Lock, Stars, EmojiEvents } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { PriceContext } from '../../PriceContext';
import { AuthContext } from '../../AuthContext';

export default function PostDetail({ data, userData }) {
  const { setPrice } = useContext(PriceContext);
  const { currentUser } = useContext(AuthContext);
  const [isPremium, setIsPremium] = useState(false);
  var x = window.matchMedia("(min-width: 576px)")
  const [isAdmin, setIsAdmin] = useState(null);

  const handleClick = () => {
    document.querySelector(".post-detail").classList.remove("active")
  }

  useEffect(() => {
    if (currentUser !== null) {
      if (currentUser.email === 'kkibetkkoir@gmail.com' || currentUser.email === 'arovanzgamez@gmail.com') {
        setIsAdmin(true)
        setIsPremium(true)
      } else {
        setIsAdmin(false)
        setIsPremium(userData?.isPremium || false)
      }
    }
  }, [currentUser, userData])

  function formatDate() {
    const date = new Date();
    return date.toLocaleDateString('en-US');
  }

  const isLocked = data.premium && (data.status !== 'finished') && (!isPremium && data.date === formatDate());
  const showLockedContent = isLocked;

  return (
    <div className={`post-detail ${x.matches && "active"}`}>
      <Close className='close' onClick={handleClick} />
      
      <div className="detail-header">
        <div className="header-badge">
          {data.premium && <Stars className="premium-icon" />}
          <img src={data.premium ? Profile : Logo} alt="powerking_vip" />
          {data.premium && <div className="premium-label">VIP</div>}
        </div>
        <h3>{data.date} - {data.time}</h3>
        {data.won && data.won !== 'pending' && (
          <div className={`status-badge ${data.won === 'won' ? 'won' : 'lost'}`}>
            {data.won === 'won' ? <Verified /> : <ErrorTwoTone />}
            <span>{data.won === 'won' ? 'WON' : 'LOST'}</span>
          </div>
        )}
      </div>

      <div className="odds-container">
        <div className="odds-label">ODDS</div>
        <div className="odds-value">{data.odd}</div>
      </div>

      <hr className="divider" />

      <div className="match-details">
        <div className="match-row">
          <div className="team home-team">
            <span className="team-name">
              {showLockedContent ? "🔒 VIP Content" : data.home}
            </span>
            <span className="team-score">{data.results ? data.results.split('-')[0] : "?"}</span>
          </div>
        </div>
        
        <hr className="divider" />
        
        <div className="match-row">
          <div className="team away-team">
            <span className="team-name">
              {showLockedContent ? "🔒 VIP Content" : data.away}
            </span>
            <span className="team-score">{data.results ? data.results.split('-')[1] : "?"}</span>
          </div>
        </div>
      </div>

      <hr className="divider" />

      <div className="pick-container">
        <div className="pick-label">PREDICTION</div>
        <div className="pick-value">
          {showLockedContent ? (
            <div className="locked-content">
              <Lock className="lock-icon" />
              <span>Join VIP to view prediction</span>
            </div>
          ) : (
            <span className="pick-text">💡 {data.pick}</span>
          )}
        </div>
      </div>

      <div className="detail-btn">
        <button className="btn premium-btn" disabled aria-label="premium">
          <EmojiEvents className="btn-icon" />
          {showLockedContent ? "Locked" : data.pick}
        </button>
        
        {(data.premium && !isPremium) && (
          <Link to={'/pay'} className='btn vip-btn' onClick={() => setPrice(850)}>
            <Stars className="btn-icon" />
            GET VIP
            <span className="btn-glow"></span>
          </Link>
        )}

        {isAdmin && (
          <Link to={'/edit'} className='btn edit-btn' state={data}>
            Edit Match
          </Link>
        )}
      </div>

      {showLockedContent && (
        <div className="vip-overlay">
          <div className="vip-message">
            <Lock className="vip-lock" />
            <h4>Premium Content</h4>
            <p>Upgrade to VIP to see predictions and tips</p>
            <Link to={'/pay'} className='btn upgrade-btn' onClick={() => setPrice(850)}>
              Upgrade Now
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}