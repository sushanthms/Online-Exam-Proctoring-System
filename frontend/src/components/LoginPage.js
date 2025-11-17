// frontend/src/components/LoginPage.js - ENHANCED WITH DEBUGGING
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import "./LoginPage.css";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const navigate = useNavigate();

  const addDebug = (msg, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${type.toUpperCase()}]`, msg);
    setDebugInfo(prev => [...prev, { msg, type, time: timestamp }]);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDebugInfo([]);
    setShowDebug(true);

    addDebug(`🔐 Starting login for: ${email}`, "info");

    // Validate inputs
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      setError("Email is required");
      setLoading(false);
      addDebug("❌ Email validation failed", "error");
      return;
    }

    if (!password) {
      setError("Password is required");
      setLoading(false);
      addDebug("❌ Password validation failed", "error");
      return;
    }

    addDebug(`✉️ Email (trimmed): ${trimmedEmail}`, "info");
    addDebug(`🔑 Password length: ${password.length}`, "info");

    try {
      addDebug("📤 Sending login request to backend...", "info");
      
      const res = await authApi.login({ 
        email: trimmedEmail, 
        password 
      });
      
      addDebug("📥 Response received from backend", "success");
      
      if (!res.data) {
        throw new Error('No data in response');
      }
      
      const { token, user } = res.data;
      
      if (!token) {
        throw new Error('No token in response');
      }
      
      if (!user) {
        throw new Error('No user data in response');
      }
      
      addDebug(`✅ Login successful!`, "success");
      addDebug(`👤 User: ${user.name}`, "success");
      addDebug(`🎭 Role: ${user.role}`, "success");
      addDebug(`🆔 User ID: ${user._id}`, "success");
      
      // Store credentials
      addDebug("💾 Storing credentials...", "info");
      onLogin(token, user);
      
      addDebug("✅ Credentials stored successfully", "success");
      addDebug("🚀 Redirecting to dashboard...", "success");
      
      // Navigate based on role
      setTimeout(() => {
        if (user.role === "admin") {
          addDebug("👨‍💼 Redirecting to admin dashboard", "success");
          navigate("/admin/dashboard", { replace: true });
        } else {
          addDebug("👨‍🎓 Redirecting to student dashboard", "success");
          navigate("/student/dashboard", { replace: true });
        }
      }, 500);
      
    } catch (err) {
      addDebug(`💥 Error occurred: ${err.message}`, "error");
      console.error('❌ Full login error:', err);
      
      let errorMessage = "An error occurred during login";
      
      if (err.response) {
        // Server responded with error
        const status = err.response.status;
        const data = err.response.data;
        
        addDebug(`❌ Server error status: ${status}`, "error");
        addDebug(`📝 Server message: ${data?.message || 'None'}`, "error");
        
        if (status === 401) {
          errorMessage = "❌ Invalid email or password\n\nPlease check:\n• Email is spelled correctly\n• Password is correct\n• Account exists";
          addDebug("⚠️ Authentication failed - Invalid credentials", "error");
        } else if (status === 403) {
          errorMessage = data?.message || "❌ Account is deactivated\n\nPlease contact administrator.";
          addDebug("⚠️ Account access denied", "error");
        } else if (status === 500) {
          errorMessage = "❌ Server error\n\nPlease try again later or contact support.";
          addDebug("⚠️ Internal server error", "error");
        } else {
          errorMessage = data?.message || `❌ Server error (${status})`;
          addDebug(`⚠️ Unexpected status code: ${status}`, "error");
        }
      } else if (err.request) {
        // Request made but no response
        addDebug("❌ No response from server", "error");
        addDebug("🔍 Possible issues:", "error");
        addDebug("  • Backend not running on port 4000", "error");
        addDebug("  • CORS configuration issue", "error");
        addDebug("  • Network connectivity problem", "error");
        
        errorMessage = "❌ Cannot connect to server\n\nPlease check:\n• Backend is running (npm start in backend folder)\n• Backend is on port 4000\n• No firewall blocking connection";
      } else {
        // Error in request setup
        addDebug(`❌ Request setup error: ${err.message}`, "error");
        errorMessage = `❌ ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setDebugInfo([]);
    setShowDebug(true);
    addDebug("🔍 Testing backend connection...", "info");
    
    try {
      addDebug("📡 Sending request to http://localhost:4000/api/health", "info");
      const response = await fetch('http://localhost:4000/api/health');
      
      addDebug(`📥 Response status: ${response.status}`, response.ok ? "success" : "error");
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      addDebug(`✅ Backend status: ${data.status}`, "success");
      addDebug(`🗄️ MongoDB: ${data.mongodb}`, data.mongodb === 'connected' ? "success" : "error");
      addDebug(`⏰ Server time: ${data.timestamp}`, "info");
      
      const message = data.mongodb === 'connected' 
        ? "✅ Backend is working!\n\n✓ Server is reachable\n✓ MongoDB is connected"
        : "⚠️ Backend reachable but MongoDB disconnected";
        
      alert(message);
    } catch (err) {
      addDebug(`❌ Connection test failed: ${err.message}`, "error");
      addDebug("⚠️ Backend appears to be offline", "error");
      alert("❌ Cannot connect to backend\n\nPlease ensure:\n1. Backend is running (cd backend && npm start)\n2. MongoDB is running\n3. No firewall blocking port 4000");
    }
  };

  const clearDebug = () => {
    setDebugInfo([]);
    setShowDebug(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>🎓 Online Exam Proctoring</h2>
          <p>Login to continue</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontSize: '14px',
              color: 'var(--text-primary, #333)'
            }}>
              Email Address
            </label>
            <input
              className="login-input"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontSize: '14px',
              color: 'var(--text-primary, #333)'
            }}>
              Password
            </label>
            <input
              className="login-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength="6"
            />
          </div>
          
          {error && (
            <div className="login-error" style={{ 
              whiteSpace: 'pre-line',
              background: '#fee',
              border: '1px solid #fcc',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '15px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              {error}
            </div>
          )}
          
          <button 
            className="login-btn" 
            type="submit" 
            disabled={loading}
            style={{
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? "⏳ Logging in..." : "🚀 Login"}
          </button>
        </form>
        
        <div className="login-footer">
          <p style={{ marginBottom: '10px' }}>
            Don't have an account? <Link to="/register" className="login-link">Register here</Link>
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={testConnection} 
              type="button"
              style={{
                padding: '8px 16px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#4b5563'}
              onMouseOut={(e) => e.target.style.background = '#6b7280'}
            >
              🔍 Test Connection
            </button>

            {debugInfo.length > 0 && (
              <button 
                onClick={clearDebug} 
                type="button"
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#dc2626'}
                onMouseOut={(e) => e.target.style.background = '#ef4444'}
              >
                🗑️ Clear Debug
              </button>
            )}
          </div>
        </div>

        {/* Debug Console */}
        {showDebug && debugInfo.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <strong style={{ fontSize: '14px' }}>
                🐛 Debug Console ({debugInfo.length} logs)
              </strong>
              <button
                onClick={() => setShowDebug(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ 
              maxHeight: '250px', 
              overflow: 'auto', 
              background: '#1a1a1a', 
              padding: '12px',
              borderRadius: '6px',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '12px',
              lineHeight: '1.6'
            }}>
              {debugInfo.map((log, i) => (
                <div key={i} style={{ 
                  color: log.type === 'error' ? '#ff6b6b' : 
                         log.type === 'success' ? '#51cf66' : 
                         log.type === 'info' ? '#74c0fc' : '#ffffff',
                  padding: '3px 0',
                  borderBottom: i < debugInfo.length - 1 ? '1px solid #333' : 'none'
                }}>
                  <span style={{ color: '#888', marginRight: '8px' }}>
                    [{log.time}]
                  </span>
                  {log.msg}
                </div>
              ))}
            </div>
            <div style={{ 
              marginTop: '10px', 
              fontSize: '11px', 
              color: '#666',
              textAlign: 'center'
            }}>
              💡 Tip: Check browser console (F12) for more details
            </div>
          </div>
        )}

        {/* Quick Help */}
        <details style={{ marginTop: '20px', fontSize: '13px', color: '#666' }}>
          <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
            ❓ Having trouble logging in?
          </summary>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Make sure backend is running (<code>cd backend && npm start</code>)</li>
            <li>Check MongoDB is connected (use Compass or check backend logs)</li>
            <li>Verify your email and password are correct</li>
            <li>Ensure your account exists (try registering first)</li>
            <li>Click "Test Connection" to verify backend is reachable</li>
            <li>Check browser console (F12) for detailed errors</li>
          </ul>
        </details>
      </div>
    </div>
  );
}
