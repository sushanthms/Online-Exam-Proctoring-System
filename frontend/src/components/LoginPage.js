import React, { useState } from 'react';
import { authApi } from '../api';
import { useNavigate, Link } from 'react-router-dom'; // ✅ import navigation
import './LoginPage.css';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate(); // ✅ create navigation hook

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const res = await authApi.login({ email, password });
      const { token, name, email: userEmail, _id } = res.data;
      onLogin(token, name, userEmail, _id);
      navigate('/home'); // ✅ redirect after login
    } catch (err) {
      setErr('Login failed. Please check your credentials or register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Online Exam — Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input
          className="login-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <div className="login-error">{err}</div>}
        <button className="login-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="login-footer">
        <p>
          Don’t have an account?{' '}
          <Link to="/register" className="login-link">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
