import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

export default function HomePage({ user, onLogout }) {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableExams();
  }, []);

  const fetchAvailableExams = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/exam/available", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setExams(data.exams || []);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching exams:", error);
      setLoading(false);
    }
  };

  const handleStartExam = (examId) => {
    navigate(`/exam/${examId}`);
  };

  const handleViewResults = () => {
    navigate("/my-results");
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      onLogout();
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="home-container" style={{ textAlign: "center", paddingTop: "5rem" }}>
        <div className="loading-spinner"></div>
        <h3 style={{ color: "white", marginTop: "1rem" }}>Loading exams...</h3>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Header */}
      <div className="home-header">
        <div>
          <h1>📚 Online Exam Portal</h1>
          <p>
            Welcome, <strong>{user?.name || "Student"}</strong>!
          </p>
        </div>
        <button onClick={handleLogout} className="home-logout-btn">
          🔓 Logout
        </button>
      </div>

      {/* Available Exams Section */}
      <div className="home-section">
        <h2>📝 Available Exams</h2>

        {exams.length === 0 ? (
          <div className="home-empty-state">
            <p style={{ fontSize: "3rem", margin: "1rem 0" }}>📭</p>
            <p>No exams available at the moment.</p>
            <p style={{ fontSize: "0.9rem", color: "#999" }}>
              Please check back later or contact your instructor.
            </p>
          </div>
        ) : (
          <div className="home-exams-grid">
            {exams.map((exam) => (
              <div key={exam._id} className="home-exam-card">
                <div className="home-exam-card-header">
                  <h3>{exam.title}</h3>
                  <span className="home-exam-badge">Available</span>
                </div>

                <div className="home-exam-card-body">
                  <div className="home-exam-info">
                    <p>
                      <strong>📊 Questions:</strong> {exam.questions?.length || 0}
                    </p>
                    <p>
                      <strong>⏱️ Duration:</strong> {exam.durationMins || 30} minutes
                    </p>
                    <p>
                      <strong>📌 Type:</strong> Multiple Choice
                    </p>
                  </div>

                  <div className="home-exam-instructions">
                    <p>
                      <strong>⚠️ Important Instructions:</strong>
                    </p>
                    <ul>
                      <li>
                        <strong>Webcam Required:</strong> Your camera must be on throughout the exam
                      </li>
                      <li>
                        <strong>No Tab Switching:</strong> Switching tabs will trigger warnings
                      </li>
                      <li>
                        <strong>Time Limit:</strong> Auto-submit when time expires
                      </li>
                      <li>
                        <strong>One Attempt:</strong> You can only take this exam once
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="home-exam-card-footer">
                  <button
                    onClick={() => handleStartExam(exam._id)}
                    className="home-start-btn"
                  >
                    🚀 Start Exam
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Section */}
      <div className="home-section">
        <h2>⚡ Quick Actions</h2>

        <div className="home-actions-grid">
          <div className="home-action-card" onClick={handleViewResults}>
            <div className="home-action-icon">📊</div>
            <h3>My Results</h3>
            <p>View your past exam results and performance</p>
          </div>

          <div className="home-action-card" onClick={() => alert("Coming soon!")}>
            <div className="home-action-icon">📅</div>
            <h3>Upcoming Exams</h3>
            <p>Check scheduled exams and deadlines</p>
          </div>

          <div className="home-action-card" onClick={() => alert("Coming soon!")}>
            <div className="home-action-icon">📖</div>
            <h3>Study Materials</h3>
            <p>Access notes and preparation resources</p>
          </div>

          <div className="home-action-card" onClick={() => alert("Coming soon!")}>
            <div className="home-action-icon">❓</div>
            <h3>Help & Support</h3>
            <p>Get assistance and technical support</p>
          </div>
        </div>
      </div>

      {/* Exam Guidelines Section */}
      <div className="home-section">
        <h2>📋 Exam Guidelines</h2>
        
        <div className="home-guidelines-box">
          <div className="home-guideline-item">
            <span className="home-guideline-icon">🎥</span>
            <div>
              <strong>Webcam Required</strong>
              <p>Your camera must be on throughout the exam for proctoring purposes.</p>
            </div>
          </div>

          <div className="home-guideline-item">
            <span className="home-guideline-icon">👤</span>
            <div>
              <strong>No Multiple People</strong>
              <p>Only you should be visible in the camera frame during the exam.</p>
            </div>
          </div>

          <div className="home-guideline-item">
            <span className="home-guideline-icon">🖥️</span>
            <div>
              <strong>Stay on Tab</strong>
              <p>Switching tabs or windows may result in warnings or auto-submission.</p>
            </div>
          </div>

          <div className="home-guideline-item">
            <span className="home-guideline-icon">⏰</span>
            <div>
              <strong>Time Management</strong>
              <p>Exam will automatically submit when the time limit expires.</p>
            </div>
          </div>

          <div className="home-guideline-item">
            <span className="home-guideline-icon">🔒</span>
            <div>
              <strong>Secure Environment</strong>
              <p>Ensure you're in a quiet, private location with stable internet.</p>
            </div>
          </div>

          <div className="home-guideline-item">
            <span className="home-guideline-icon">📱</span>
            <div>
              <strong>No External Devices</strong>
              <p>Keep phones and other devices away during the examination.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}