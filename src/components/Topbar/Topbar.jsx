import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { socialLinks } from "../../data/mockData";
import { Telegram, WhatsApp, Facebook, X, Instagram, Bolt } from '@mui/icons-material';
import './Topbar.scss'

export default function Topbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`topbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="topbar-container">
        <div className="topbar-left">
          <Bolt className="live-icon" />
          <span className="live-text">Live Tips Today!</span>
        </div>
        
        <div className="topbar-social">
          <a href={socialLinks.telegramChannel} target="_blank" rel="noopener noreferrer" className="social-icon telegram">
            <Telegram />
          </a>
          <a href={socialLinks.whatsappChannel} target="_blank" rel="noopener noreferrer" className="social-icon whatsapp">
            <WhatsApp />
          </a>
          <a href={socialLinks.facebookPage} target="_blank" rel="noopener noreferrer" className="social-icon facebook">
            <Facebook />
          </a>
          <a href={socialLinks.xPage} target="_blank" rel="noopener noreferrer" className="social-icon twitter">
            <X />
          </a>
          <a href={socialLinks.instagramPage} target="_blank" rel="noopener noreferrer" className="social-icon instagram">
            <Instagram />
          </a>
        </div>
        
        <div className="topbar-right">
          <span className="tips-count">🏆 Daily Tips</span>
        </div>
      </div>
    </div>
  );
}