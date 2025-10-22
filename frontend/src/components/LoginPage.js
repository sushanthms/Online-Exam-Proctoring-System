import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import "./LoginPage.css";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const res = await authApi.login({ email, password });
      const { token, user } = res.data;
      onLogin(token, user);
      if (user.role === "admin") navigate("/admin/dashboard");
      else navigate("/student/dashboard");
    } catch (err) {
      setErr("Invalid credentials or user not registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>Online Exam</h2>
          <p>Login to continue</p>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <input
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {err && <div className="login-error">{err}</div>}
          <button className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="login-footer">
          <p>
            Don't have an account? <Link className="login-link" to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
