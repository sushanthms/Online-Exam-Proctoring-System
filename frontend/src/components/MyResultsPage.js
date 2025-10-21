import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyResultPage.css";

export default function MyResultsPage({ user }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyResults();
  }, []);

  const fetchMyResults = async () => {
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
        setSubmissions(data.submissions || []);
        calculateStats(data.submissions || []);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching results:", error);
      setLoading(false);
    }
  };

  const calculateStats = (subs) => {
    if (subs.length === 0) return;

    const totalExams = subs.length;
    const totalScore = subs.reduce((sum, sub) => sum + sub.score, 0);
    const totalQuestions = subs.reduce(
      (sum, sub) => sum + sub.answers.length,
      0
    );
    const avgPercentage = ((totalScore / totalQuestions) * 100).toFixed(1);

    setStats({
      totalExams,
      avgPercentage,
      bestScore: Math.max(...subs.map((s) => s.score)),
      recentScore: subs[subs.length - 1]?.score || 0,
    });
  };

  if (loading) {
    return (
      <div className="container glass-container" style={{ textAlign: "center", padding: "3rem" }}>
        <div className="loading-spinner"></div>
        <p style={{ color: "white", marginTop: "1rem" }}>Loading your results...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <div>
          <h1 className="gradient-text">📊 My Performance</h1>
          <p style={{ color: "white" }}>Track your exam history and progress</p>
        </div>
        <button onClick={() => navigate("/home")} className="neon-btn">
          ← Back to Home
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card modern-card">
            <div className="stat-icon">📚</div>
            <div className="stat-value">{stats.totalExams}</div>
            <div className="stat-label">Exams Taken</div>
          </div>

          <div className="stat-card modern-card">
            <div className="stat-icon">📈</div>
            <div className="stat-value">{stats.avgPercentage}%</div>
            <div className="stat-label">Average Score</div>
          </div>

          <div className="stat-card modern-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{stats.bestScore}</div>
            <div className="stat-label">Best Score</div>
          </div>

          <div className="stat-card modern-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{stats.recentScore}</div>
            <div className="stat-label">Recent Score</div>
          </div>
        </div>
      )}

      <div className="section glass-container">
        <h2 style={{ color: "white" }}>📋 Exam History</h2>

        {submissions.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: "3rem" }}>📭</p>
            <p>No exam history found</p>
            <p style={{ fontSize: "0.9rem" }}>Take your first exam to see results here!</p>
            <button 
              onClick={() => navigate("/home")} 
              className="neon-btn" 
              style={{ marginTop: "2rem" }}
            >
              Browse Exams
            </button>
          </div>
        ) : (
          <div className="submissions-list">
            {submissions.map((sub, index) => {
              const percentage = ((sub.score / sub.answers.length) * 100).toFixed(1);
              const isPassed = percentage >= 60;

              return (
                <div key={index} className="submission-card modern-card">
                  <div className="submission-header">
                    <div>
                      <h3>{sub.examId}</h3>
                      <p className="submission-date">
                        {new Date(sub.submittedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className={`status-badge ${isPassed ? "passed" : "failed"}`}>
                      {isPassed ? "✅ Passed" : "❌ Failed"}
                    </div>
                  </div>

                  <div className="submission-body">
                    <div className="score-display">
                      <div className="score-circle">
                        <svg viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="10"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke={isPassed ? "#10b981" : "#ef4444"}
                            strokeWidth="10"
                            strokeDasharray={`${percentage * 2.83} 283`}
                            transform="rotate(-90 50 50)"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="score-text">
                          <span className="percentage">{percentage}%</span>
                          <span className="score-detail">
                            {sub.score}/{sub.answers.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="submission-details">
                      <div className="detail-item">
                        <span className="detail-icon">✅</span>
                        <span>Correct: {sub.score}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">❌</span>
                        <span>Wrong: {sub.answers.length - sub.score}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🔄</span>
                        <span>Tab Switches: {sub.tabSwitches?.length || 0}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">👥</span>
                        <span>Face Alerts: {sub.multipleFaceLogs?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="submission-footer">
                    <button
                      onClick={() => navigate(`/result/${sub._id}`)}
                      className="view-details-btn"
                    >
                      View Detailed Report →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}