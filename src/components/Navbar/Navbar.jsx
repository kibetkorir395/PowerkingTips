import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <header className={`${scrolled ? 'scrolled' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="header-container">
        <NavLink to="/" className="logo" onClick={closeMobileMenu}>
          <img src="/logo192.png" alt="PowerKing Tips" />
          <span className="logo-text">PowerKing Tips</span>
        </NavLink>
        
        <button className="mobile-menu-btn" onClick={toggleMobileMenu} aria-label="Menu">
          {mobileMenuOpen ? <Close /> : <Menu />}
        </button>
        
        <nav className={mobileMenuOpen ? "active" : ""}>
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
                <div className="user-greeting">
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
              <NavLink className="btn login-btn" to="/login" onClick={closeMobileMenu}>
                Log In
              </NavLink>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}