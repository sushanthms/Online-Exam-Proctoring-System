import React, { useState } from "react";
import { authApi } from "../api";

export default function RegisterPage({ onRegistered }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // default role
  const [secretKey, setSecretKey] = useState(""); // for admin
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      // Send role and secretKey along with user info
      const res = await authApi.register({ name, email, password, role, secretKey });
      setMessage(res.data.message);
      if (onRegistered) onRegistered();
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>

        {role === "admin" && (
          <input
            type="password"
            placeholder="Admin Secret Key"
            value={secretKey}
            onChange={e => setSecretKey(e.target.value)}
          />
        )}

        <button disabled={loading}>{loading ? "Registering..." : "Register"}</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
