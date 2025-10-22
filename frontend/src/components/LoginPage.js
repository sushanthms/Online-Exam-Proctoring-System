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
      navigate("/student/dashboard");
    } catch (err) {
      setErr("Invalid credentials or user not registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Online Exam — Login</h2>
      <form onSubmit={handleLogin}>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {err && <p className="error-msg">{err}</p>}
        <button disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
      </form>
      <p>Don't have an account? <Link to="/register">Register here</Link></p>
    </div>
  );
}
