// frontend/src/App.js - RBAC and routing
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ExamPage from "./components/ExamPage";
import ResultPage from "./components/ResultPage";
import MyResultsPage from "./components/MyResultsPage";
import ExamCreator from "./components/ExamCreator";
import { setAuthToken } from "./api";
import "./styles.css";

// ProtectedRoute for role-based access
function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

// Unauthorized page
function UnauthorizedPage() {
  return (
    <div className="unauthorized-page">
      <h1>🚫</h1>
      <h2>Access Denied</h2>
      <p>You don't have permission to access this page.</p>
      <button onClick={() => (window.location.href = "/")}>Go to Home</button>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setAuthToken(token);
        setUser(userData);
      } catch (err) {
        console.error("Error parsing user data:", err);
        handleLogout();
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setAuthToken(token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
    setUser(null);
  };

  if (loading)
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            user ? (
              user.role === "admin" ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/student/dashboard" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<ProtectedRoute user={user} allowedRoles={["student"]}><StudentDashboard user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/exam/:examId" element={<ProtectedRoute user={user} allowedRoles={["student"]}><ExamPage user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/result/:submissionId" element={<ProtectedRoute user={user} allowedRoles={["student"]}><ResultPage onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/my-results" element={<ProtectedRoute user={user} allowedRoles={["student"]}><MyResultsPage user={user} /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute user={user} allowedRoles={["admin"]}><AdminDashboard user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/admin/create-exam" element={<ProtectedRoute user={user} allowedRoles={["admin"]}><ExamCreator user={user} /></ProtectedRoute>} />
        <Route path="/admin/submission/:submissionId" element={<ProtectedRoute user={user} allowedRoles={["admin"]}><ResultPage isAdmin={true} onLogout={handleLogout} /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
