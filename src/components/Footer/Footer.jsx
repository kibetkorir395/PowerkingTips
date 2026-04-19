import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socialLinks } from '../../data/mockData';
import { ArrowUpward, Telegram, WhatsApp, Facebook, X, Instagram } from '@mui/icons-material';
import './Footer.scss';

export default function Footer() {
  const { isAdmin, currentUser } = useAuth();

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="footer">
      <div className="social">
        <h2>Follow us</h2>
        <div className="wrapper">
          <a href={socialLinks.telegramChannel} target="_blank" rel="noopener noreferrer" className="telegram">
            <Telegram />
          </a>
          <a href={socialLinks.whatsappChannel} target="_blank" rel="noopener noreferrer" className="whatsapp">
            <WhatsApp />
          </a>
          <a href={socialLinks.facebookPage} target="_blank" rel="noopener noreferrer" className="facebook">
            <Facebook />
          </a>
          <a href={socialLinks.xPage} target="_blank" rel="noopener noreferrer" className="twitter">
            <X />
          </a>
          <a href={socialLinks.instagramPage} target="_blank" rel="noopener noreferrer" className="instagram">
            <Instagram />
          </a>
        </div>
      </div>

      <hr />

      <div className="footer-bottom">
        <p>&copy; PowerKing Tips {new Date().getFullYear()}</p>
        
        <NavLink to="/about#faq" className="footer-link">
          FAQ
        </NavLink>
        
        {!currentUser && (
          <>
            <NavLink to="/login" className="footer-link">
              Login
            </NavLink>
            <NavLink to="/register" className="footer-link">
              Register
            </NavLink>
          </>
        )}
        
        <NavLink to="/pay" className="footer-link">
          Upgrade to VIP
        </NavLink>
        
        {currentUser && (
          <NavLink to={`/profile/${currentUser.email}`} className="footer-link">
            My Profile
          </NavLink>
        )}
        
        {isAdmin && (
          <>
            <NavLink to="/users" className="footer-link">
              Users
            </NavLink>
            <NavLink to="/admin/tips" className="footer-link">
              Add Tip
            </NavLink>
          </>
        )}
        
        <button className="btn-top" onClick={handleScrollToTop} aria-label="Back to top">
          <ArrowUpward />
        </button>
      </div>
    </div>
  );
}