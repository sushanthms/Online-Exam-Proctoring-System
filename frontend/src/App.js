import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ExamPage from './components/ExamPage';
import { setAuthToken } from './api';
import './styles.css';

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  // Load token from localStorage
  useEffect(() => {
    const t = localStorage.getItem('token');
    const name = localStorage.getItem('name');
    if (t) {
      setAuthToken(t);
      setUser({ name });
    }
  }, []);

  // Handle login
  const handleLogin = (token, name) => {
    localStorage.setItem('token', token);
    localStorage.setItem('name', name);
    setAuthToken(token);
    setUser({ name });
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    setAuthToken(null);
    setUser(null);
  };

  // If logged in, show exam page
  if (user) {
    return <ExamPage user={user} onLogout={handleLogout} />;
  }

  // If not logged in, show login/register forms with fade animation
  return (
    <div className="app-container">
      <div className={`form-container ${showRegister ? 'fade-in' : 'fade-out'}`}>
        {showRegister ? (
          <RegisterPage onRegistered={() => setShowRegister(false)} />
        ) : (
          <LoginPage onLogin={handleLogin} onShowRegister={() => setShowRegister(true)} />
        )}
      </div>
    </div>
  );
}

export default App;
