import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";

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
      <div className="container" style={{ padding: "2rem", textAlign: "center" }}>
        <h3>Loading...</h3>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Header */}
      <div className="home-header">
        <div>
          <h1 style={{ color: "#0d47a1", margin: 0 }}>📚 Online Exam Portal</h1>
          <p style={{ color: "#666", margin: "0.5rem 0 0 0" }}>
            Welcome, <strong>{user?.name || "Student"}</strong>!
          </p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          🔓 Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="home-content">
        {/* Available Exams Section */}
        <div className="section">
          <h2 style={{ color: "#0d47a1", marginBottom: "1rem" }}>
            📝 Available Exams
          </h2>

          {exams.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: "1.1rem", color: "#666" }}>
                No exams available at the moment.
              </p>
              <p style={{ fontSize: "0.9rem", color: "#999" }}>
                Please check back later or contact your instructor.
              </p>
            </div>
          ) : (
            <div className="exams-grid">
              {exams.map((exam) => (
                <div key={exam._id} className="exam-card">
                  <div className="exam-card-header">
                    <h3>{exam.title}</h3>
                    <span className="exam-badge">Available</span>
                  </div>

                  <div className="exam-card-body">
                    <div className="exam-info">
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

                    <div className="exam-instructions">
                      <p style={{ fontSize: "0.9rem", color: "#666" }}>
                        ⚠️ <strong>Important:</strong>
                      </p>
                      <ul style={{ fontSize: "0.85rem", color: "#666", marginLeft: "1.2rem" }}>
                        <li>Webcam monitoring is required</li>
                        <li>Tab switching is tracked</li>
                        <li>Auto-submit after time expires</li>
                      </ul>
                    </div>
                  </div>

                  <div className="exam-card-footer">
                    <button
                      onClick={() => handleStartExam(exam._id)}
                      className="btn-primary"
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
        <div className="section quick-actions">
          <h2 style={{ color: "#0d47a1", marginBottom: "1rem" }}>
            ⚡ Quick Actions
          </h2>

          <div className="actions-grid">
            <div className="action-card" onClick={handleViewResults}>
              <div className="action-icon">📊</div>
              <h3>My Results</h3>
              <p>View your past exam results and performance</p>
            </div>

            <div className="action-card" onClick={() => alert("Coming soon!")}>
              <div className="action-icon">📅</div>
              <h3>Upcoming Exams</h3>
              <p>Check scheduled exams and deadlines</p>
            </div>

            <div className="action-card" onClick={() => alert("Coming soon!")}>
              <div className="action-icon">📖</div>
              <h3>Study Materials</h3>
              <p>Access notes and preparation resources</p>
            </div>

            <div className="action-card" onClick={() => alert("Coming soon!")}>
              <div className="action-icon">❓</div>
              <h3>Help & Support</h3>
              <p>Get assistance and technical support</p>
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="section instructions-section">
          <h2 style={{ color: "#0d47a1", marginBottom: "1rem" }}>
            📋 Exam Guidelines
          </h2>
          <div className="guidelines-box">
            <div className="guideline-item">
              <span className="guideline-icon">🎥</span>
              <div>
                <strong>Webcam Required:</strong> Your camera must be on throughout the exam
              </div>
            </div>
            <div className="guideline-item">
              <span className="guideline-icon">👤</span>
              <div>
                <strong>No Multiple People:</strong> Only you should be visible in the frame
              </div>
            </div>
            <div className="guideline-item">
              <span className="guideline-icon">🖥️</span>
              <div>
                <strong>Stay on Tab:</strong> Switching tabs may result in auto-submission
              </div>
            </div>
            <div className="guideline-item">
              <span className="guideline-icon">⏰</span>
              <div>
                <strong>Time Management:</strong> Exam will auto-submit when time runs out
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}