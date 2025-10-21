  import React, { useState, useEffect } from 'react';
  import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
  import LoginPage from './components/LoginPage';
  import RegisterPage from './components/RegisterPage';
  import HomePage from './components/HomePage';
  import ExamPage from './components/ExamPage';
  import ResultPage from './components/ResultPage';
  import MyResultsPage from './components/MyResultsPage';
  import AdminDashboard from "./components/AdminDashboard";
  import { setAuthToken } from './api';
  import './styles.css';

  function App() {
    const [user, setUser] = useState(null);

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
      localStorage.removeItem('name');
      setAuthToken(null);
      setUser(null);
    };

    return (
      <Router>
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/home" /> : <LoginPage onLogin={handleLogin} />}
          />

          <Route
            path="/register"
            element={<RegisterPage onRegistered={() => {}} />}
          />

          <Route
            path="/home"
            element={user ? <HomePage user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/exam/:examId"
            element={user ? <ExamPage user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/result/:submissionId"
            element={user ? <ResultPage onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/my-results"
            element={user ? <MyResultsPage user={user} /> : <Navigate to="/" />}
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    );
  }

  export default App;