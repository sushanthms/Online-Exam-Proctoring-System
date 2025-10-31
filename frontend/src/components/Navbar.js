import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      onLogout();
      navigate("/");
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>{user?.role === 'admin' ? '⚙️ Admin Dashboard' : '🎓 Student Dashboard'}</h1>
        <p className="welcome-text">Welcome, {user?.name}</p>
      </div>
      <div className="navbar-actions">
        <button 
          onClick={toggleDarkMode} 
          className="theme-toggle-btn"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        <button onClick={handleLogout} className="btn-logout">
          🚪 Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;