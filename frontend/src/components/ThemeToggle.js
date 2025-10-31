import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleDarkMode} 
      title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {darkMode ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;