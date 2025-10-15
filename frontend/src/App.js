import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ExamPage from './components/ExamPage';
import { setAuthToken } from './api';
import './styles.css';


function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const name = localStorage.getItem('name');
    if (t) {
      setAuthToken(t);
      setUser({ name });
    }
  }, []);

  if (user) {
    return (
      <ExamPage
        user={user}
        onLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('name');
          setAuthToken(null);
          setUser(null);
        }}
      />
    );
  }

  return showRegister ? (
    <RegisterPage onRegistered={() => setShowRegister(false)} />
  ) : (
    <div>
      <LoginPage
  onLogin={(token, name) => {
    localStorage.setItem('token', token);
    localStorage.setItem('name', name);
    setAuthToken(token);
    setUser({ name });
  }}
  onShowRegister={() => setShowRegister(true)}
/>

      <p style={{ marginTop: 12 }}>
        Don't have an account?{' '}
        <button onClick={() => setShowRegister(true)}>Register</button>
      </p>
    </div>
  );
}

export default App;
