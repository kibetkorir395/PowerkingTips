import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { Menu, Close, Person, AdminPanelSettings } from '@mui/icons-material';
import './Navbar.scss';

export default function Navbar() {
  const { currentUser, userData, isAdmin, isPremium, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);
  const menuBtnRef = useRef(null);

  // Handle scroll to close mobile menu and change header style
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
      // Close mobile menu when scrolling
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  // Handle click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if menu is open and click is outside nav and outside menu button
      if (
        mobileMenuOpen &&
        navRef.current &&
        !navRef.current.contains(event.target) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    // Add event listener when menu is open
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [mobileMenuOpen]);

  // Optional: Add a class to body when menu opens
  // In your Navbar component, add this to the existing useEffect:

  useEffect(() => {
    if (mobileMenuOpen) {
        document.body.classList.add('menu-open');
    } else {
        document.body.classList.remove('menu-open');
    }
    
    return () => {
        document.body.classList.remove('menu-open');
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMobileMenuOpen(false);
      navigate('/');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const username = currentUser?.email?.split('@')[0] || userData?.username;

  const handleProfileClick = () => {
    const email = currentUser?.email;
    if (email) {
      navigate(`/profile/${encodeURIComponent(email)}`);
      closeMobileMenu();
    }
  };

  return (
    <header className={`${scrolled ? 'scrolled' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="header-container">
        <NavLink to="/" className="logo" onClick={closeMobileMenu}>
          <img src="/logo192.png" alt="PowerKing Tips" />
          <span className="logo-text">PowerKing Tips</span>
        </NavLink>
        
        <button 
          ref={menuBtnRef}
          className="mobile-menu-btn" 
          onClick={toggleMobileMenu} 
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <Close /> : <Menu />}
        </button>
        
        <nav ref={navRef} className={mobileMenuOpen ? "active" : ""}>
          <NavLink to="/" className="nav-link" onClick={closeMobileMenu}>
            Home
          </NavLink>
          <NavLink to="/tips" className="nav-link" onClick={closeMobileMenu}>
            Tips
          </NavLink>
          <NavLink to="/about" className="nav-link" onClick={closeMobileMenu}>
            About
          </NavLink>
          
          <div className="btn-wrapper">
            {currentUser ? (
              <>
                <div 
                  className="user-greeting" 
                  onClick={handleProfileClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleProfileClick();
                    }
                  }}
                >
                  <Person className="user-icon" />
                  <span>Hi, {username}</span>
                  {isPremium && !loading && <span className="vip-badge" style={{ marginLeft: '5px', fontSize: '12px' }}>⭐</span>}
                </div>
                
                {isAdmin && (
                  <NavLink to="/users" className="btn admin-btn" onClick={closeMobileMenu}>
                    <AdminPanelSettings className="admin-icon" />
                    Users
                  </NavLink>
                )}
                
                {isAdmin && (
                  <NavLink to="/admin/tips" className="btn admin-btn" onClick={closeMobileMenu}>
                    Add Tip
                  </NavLink>
                )}
                
                <button className="btn logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
              <NavLink className="btn login-btn" to="/login" onClick={closeMobileMenu}>
                Log In
              </NavLink>
              <NavLink className="btn login-btn" to="/register" onClick={closeMobileMenu}>
                Regsiter
              </NavLink></>
            )}
          </div>
        </nav>
      </div>
      
      {/* Overlay for mobile menu */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu} />}
    </header>
  );
}