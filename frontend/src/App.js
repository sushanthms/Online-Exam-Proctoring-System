import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ExamPage from './components/ExamPage';
import ResultPage from './components/ResultPage';
import { setAuthToken } from './api';
import './styles.css';

function App() {
  const [user, setUser] = useState(null);

  // Load token from localStorage
 useEffect(() => {
  const t = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (t && userStr) {
    setAuthToken(t);
    setUser(JSON.parse(userStr));
  }
}, []);


  const handleLogin = (token, name, email, _id) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify({ name, email, _id }));
  setAuthToken(token);
  setUser({ name, email, _id });
};

  const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setAuthToken(null);
  setUser(null);
};

  return (
    <Router>
      <Routes>
        {/* Redirect to exam page if logged in */}
        <Route
  path="/"
  element={
    user ? (
      <Navigate to="/exam" />
    ) : (
      <LoginPage 
        onLogin={handleLogin} 
        onShowRegister={() => window.location.href = '/register'} 
      />
    )
  }
/>
        <Route
          path="/register"
          element={<RegisterPage onRegistered={() => {}} />}
        />
        <Route
          path="/exam"
          element={user ? <ExamPage user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
       <Route
  path="/result/:submissionId"
  element={user ? <ResultPage onLogout={handleLogout} /> : <Navigate to="/" />}
/>
      </Routes>
    </Router>
  );
}

export default App;
