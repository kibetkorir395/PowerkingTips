import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Close, ErrorTwoTone, Verified, Lock, Stars, EmojiEvents, TrendingUp } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './PostDetails.scss'

export default function PostDetail({ data, onClose, hasPremiumAccess: propHasPremiumAccess }) {
  const { isPremium, isAdmin, userData, currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const hasAccess = isAdmin || isPremium || propHasPremiumAccess;

  function formatDate() {
    const date = new Date();
    return date.toLocaleDateString('en-US');
  }

  const isLocked = useCallback(() => {
    if (isAdmin) return false;
    if (!data.premium) return false;
    if (hasAccess) return false;
    
    const today = formatDate();
    const isTodayTip = data.date === today;
    const isPending = data.status !== 'finished';
    
    return data.premium && !hasAccess && isTodayTip && isPending;
  }, [data, hasAccess, isAdmin]);

  const handleClose = (e) => {
    e?.stopPropagation();
    onClose?.();
  };

  const locked = isLocked();

  return (
    <div className="post-detail active">
      <Close className='close' onClick={handleClose} />
      
      <div className="detail-header">
        <div className="header-badge">
          {data.premium && <Stars className="premium-icon" />}
          <img 
            src={data.premium ? "https://i.imgur.com/Qv1WDJq.jpg" : "/logo192.png"} 
            alt="powerking_vip" 
          />
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
              {locked ? "🔒 VIP Content" : data.home}
            </span>
            <span className="team-score">{data.results ? data.results.split('-')[0] : "?"}</span>
          </div>
        </div>
        
        <hr className="divider" />
        
        <div className="match-row">
          <div className="team away-team">
            <span className="team-name">
              {locked ? "🔒 VIP Content" : data.away}
            </span>
            <span className="team-score">{data.results ? data.results.split('-')[1] : "?"}</span>
          </div>
        </div>
      </div>

      <hr className="divider" />

      <div className="pick-container">
        <div className="pick-label">PREDICTION</div>
        <div className="pick-value">
          {locked ? (
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
          {locked ? "Locked" : data.pick}
        </button>
        
        {data.premium && !hasAccess && !isLoading && (
          <Link to={'/pay'} className='btn vip-btn' onClick={() => setIsLoading(true)}>
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

      {locked && (
        <div className="vip-overlay">
          <div className="vip-message">
            <Lock className="vip-lock" />
            <h4>Premium Content</h4>
            <p>Upgrade to VIP to see predictions and tips</p>
            <Link to={'/pay'} className='btn upgrade-btn'>
              <TrendingUp className="btn-icon" />
              Upgrade Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}