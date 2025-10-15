import React, { useState } from 'react';
import { authApi } from '../api';
import '../styles.css'; // make sure CSS is imported

export default function LoginPage({ onLogin, onShowRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const res = await authApi.login({ email, password });
      const { token, name } = res.data;
      onLogin(token, name);
    } catch (err) {
      setErr('Login failed. Please check your credentials or register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Online Exam — Login</h2>
      <form onSubmit={handleLogin}>
        <input
          className="input-field"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <div className="error">{err}</div>}
        <button className="btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>
        Don't have an account?{' '}
        <button onClick={onShowRegister} className="link-button">
          Register here
        </button>
      </p>
    </div>
  );
}
