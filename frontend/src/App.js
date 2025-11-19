// frontend/src/App.js - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import PreExamSetup from './components/PreExamSetup'; // NEW
import ExamPage from './components/ExamPage';
import ResultPage from './components/ResultPage';
import ResultsPage from './components/ResultsPage'; // NEW - Enhanced results with proctoring violations
import MyResultsPage from './components/MyResultsPage';
import ExamCreator from './components/ExamCreator';
import EditExam from './components/EditExam';
import FaceRegistration from './components/FaceRegistration';
import Navbar from './components/Navbar';
import { ThemeProvider } from './contexts/ThemeContext';
import { BookmarkProvider } from './contexts/BookmarkContext';
import CodingExamPage from './components/CodingExamPage';
import CodingResultPage from './components/CodingResultPage';
import { setAuthToken } from './api';
import './styles.css';
import './styles/theme.css';

function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
}

function UnauthorizedPage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</h1>
      <h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Access Denied</h2>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        You don't have permission to access this page.
      </p>
      <button 
        onClick={() => window.location.href = '/'}
        style={{
          padding: '0.75rem 2rem',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        Go to Home
      </button>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setAuthToken(token);
        setUser(userData);
      } catch (err) {
        console.error('Error parsing user data:', err);
        handleLogout();
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setAuthToken(token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              user.role === 'admin' ? 
                <Navigate to="/admin/dashboard" replace /> : 
                <Navigate to="/student/dashboard" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        
        <Route 
          path="/register" 
          element={
            user ? 
              <Navigate to="/" replace /> : 
              <RegisterPage />
          } 
        />
        
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Face Registration Route */}
        <Route
          path="/face-registration"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <FaceRegistration 
                user={user} 
                onComplete={() => window.location.href = '/student/dashboard'}
              />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentDashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        
        {/* NEW: Pre-Exam Setup Route */}
        <Route
          path="/pre-exam/:examId"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <PreExamSetup user={user} />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/exam/:examId"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <ExamPage user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coding/:questionId"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <CodingExamPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/result/:submissionId"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <ResultPage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/results/:examId"
          element={
            <ProtectedRoute user={user} allowedRoles={['student', 'admin']}>
              <ResultsPage user={user} />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/my-results"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <MyResultsPage user={user} />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <AdminDashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/create-exam"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <ExamCreator user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/edit-exam/:examId"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <EditExam user={user} />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/submission/:submissionId"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <ResultPage isAdmin={true} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Wrap App with ThemeProvider and BookmarkProvider
export default function AppWithTheme() {
  return (
    <ThemeProvider>
      <BookmarkProvider>
        <App />
      </BookmarkProvider>
    </ThemeProvider>
  );
}