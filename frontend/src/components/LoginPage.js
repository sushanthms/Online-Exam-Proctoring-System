import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import "./LoginPage.css";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log('🔐 Attempting login for:', email);

    try {
      const res = await authApi.login({ 
        email: email.trim(), 
        password 
      });
      
      console.log('✅ Login successful:', res.data);
      
      const { token, user } = res.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      onLogin(token, user);
      
      // Navigate based on role
      if (user.role === "admin") {
        console.log('👨‍💼 Navigating to admin dashboard');
        navigate("/admin/dashboard");
      } else {
        console.log('👨‍🎓 Navigating to student dashboard');
        navigate("/student/dashboard");
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      
      let errorMessage = "An error occurred during login";
      
      if (err.response) {
        errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "Cannot connect to server. Please check if the backend is running.";
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>🎓 Online Exam</h2>
          <p>Login to continue</p>
        </div>
        <form onSubmit={handleLogin}>
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <div className="login-error">{error}</div>}
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="login-footer">
          <p>
            Don't have an account? <Link to="/register" className="login-link">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
