import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

export default function StudentDashboard({ user, onLogout }) {
  const [exams, setExams] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableExams();
    fetchUserStats();
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
    } catch (error) {
      console.error("Error fetching exams:", error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:4000/api/exam/my-submissions/${user._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        calculateStats(data.submissions || []);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setLoading(false);
    }
  };

  const calculateStats = (submissions) => {
    if (submissions.length === 0) {
      setUserStats({ 
        totalExams: 0, 
        avgScore: 0, 
        bestScore: 0,
        recentScore: 0 
      });
      return;
    }

    const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
    const totalQuestions = submissions.reduce(
      (sum, sub) => sum + (sub.answers?.length || 0),
      0
    );
    const avgScore = totalQuestions > 0 ? ((totalScore / totalQuestions) * 100).toFixed(1) : 0;

    setUserStats({
      totalExams: submissions.length,
      avgScore,
      bestScore: Math.max(...submissions.map((s) => s.score || 0)),
      recentScore: submissions[0]?.score || 0,
    });
  };

  const handleStartExam = (examId) => {
    if (
      window.confirm(
        "Ready to start the exam?\n\n⚠️ Important:\n- Ensure you're in a quiet environment\n- Good lighting for camera\n- No tab switching allowed\n- Keep face visible to camera"
      )
    ) {
      navigate(`/exam/${examId}`);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      onLogout();
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <h3>Loading your dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🎓 Student Dashboard</h1>
          <p className="welcome-text">Welcome back, {user.name}!</p>
        </div>
        <div className="header-right">
          <button onClick={() => navigate("/my-results")} className="btn-secondary">
            📊 My Results
          </button>
          <button onClick={handleLogout} className="btn-logout">
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      {userStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-value">{userStats.totalExams}</div>
            <div className="stat-label">Exams Taken</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-value">{userStats.avgScore}%</div>
            <div className="stat-label">Average Score</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{userStats.bestScore}</div>
            <div className="stat-label">Best Score</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{userStats.recentScore}</div>
            <div className="stat-label">Recent Score</div>
          </div>
        </div>
      )}

      {/* Available Exams */}
      <div className="exams-section">
        <h2>📝 Available Exams</h2>

        {exams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No exams available at the moment</p>
            <p className="empty-subtext">Check back later for new exams</p>
          </div>
        ) : (
          <div className="exams-grid">
            {exams.map((exam) => (
              <div key={exam._id} className="exam-card">
                <div className="exam-card-header">
                  <h3>{exam.title}</h3>
                  <span className="exam-badge">Active</span>
                </div>
                
                <div className="exam-details">
                  <div className="exam-detail-item">
                    <span className="detail-icon">❓</span>
                    <span>{exam.questions?.length || 0} Questions</span>
                  </div>
                  <div className="exam-detail-item">
                    <span className="detail-icon">⏱️</span>
                    <span>{exam.durationMins || 30} Minutes</span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartExam(exam._id)}
                  className="btn-start-exam"
                >
                  Start Exam →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="instructions-section">
        <h3>⚠️ Exam Instructions</h3>
        <ul className="instructions-list">
          <li>✓ Your camera will be monitored throughout the exam</li>
          <li>✓ Keep your face visible to the camera at all times</li>
          <li>✓ Do not switch tabs or windows - it will be tracked</li>
          <li>✓ Multiple faces detected will be logged as suspicious activity</li>
          <li>✓ Exam will auto-submit when time expires</li>
          <li>✓ 3 tab switches will result in automatic submission</li>
        </ul>
      </div>
    </div>
  );
}