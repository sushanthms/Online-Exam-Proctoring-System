import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api";
import "./RegisterPage.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [adminSecretKey, setAdminSecretKey] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (role === "admin" && !adminSecretKey.trim()) {
      setError("Admin secret key is required for admin registration");
      setLoading(false);
      return;
    }

    try {
      const payload = { 
        name, 
        email, 
        password, 
        role 
      };

      if (role === "admin") {
        payload.adminSecretKey = adminSecretKey;
      }

      const res = await authApi.register(payload);
      setMessage(res.data.message || "Registration successful!");
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2 className="register-header">📝 Create Account</h2>
        
        <form className="register-form" onSubmit={handleRegister}>
          <input
            className="register-input"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          
          <input
            className="register-input"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          
          <input
            className="register-input"
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <input
            className="register-input"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />

          <select
            className="register-input"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="student">👨‍🎓 Student</option>
            <option value="admin">👨‍💼 Admin</option>
          </select>

          {role === "admin" && (
            <div className="admin-key-section">
              <input
                className="register-input"
                type="password"
                placeholder="🔑 Admin Secret Key"
                value={adminSecretKey}
                onChange={e => setAdminSecretKey(e.target.value)}
                required
              />
              <p className="helper-text">
                ⚠️ Admin secret key is required to create an admin account
              </p>
            </div>
          )}

          {error && <div className="register-error">{error}</div>}
          {message && <div className="register-success">{message}</div>}

          <button className="register-btn" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account? 
            <button 
              onClick={() => navigate("/")}
              className="link-button"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}