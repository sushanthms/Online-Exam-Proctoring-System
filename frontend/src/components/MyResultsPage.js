import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyResultsPage.css";

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
      <div className="my-results-glass-container my-results-loading">
        <div className="loading-spinner"></div>
        <h3>Loading your results...</h3>
      </div>
    );
  }

   return (
    <div className="my-results-container">
      <div className="my-results-header">
        <div>
          <h1>📊 My Performance</h1>
          <p>Track your exam history and progress</p>
        </div>
        <button onClick={() => navigate("/home")} className="my-results-back-btn">
          ← Back to Home
        </button>
      </div>

      {stats && (
        <div className="my-results-stats-grid">
          <div className="my-results-stat-card">
            <div className="my-results-stat-icon">📚</div>
            <div className="my-results-stat-value">{stats.totalExams}</div>
            <div className="my-results-stat-label">Exams Taken</div>
          </div>

          <div className="my-results-stat-card">
            <div className="my-results-stat-icon">📈</div>
            <div className="my-results-stat-value">{stats.avgPercentage}%</div>
            <div className="my-results-stat-label">Average Score</div>
          </div>

          <div className="my-results-stat-card">
            <div className="my-results-stat-icon">🏆</div>
            <div className="my-results-stat-value">{stats.bestScore}</div>
            <div className="my-results-stat-label">Best Score</div>
          </div>

          <div className="my-results-stat-card">
            <div className="my-results-stat-icon">⭐</div>
            <div className="my-results-stat-value">{stats.recentScore}</div>
            <div className="my-results-stat-label">Recent Score</div>
          </div>
        </div>
      )}

      <div className="my-results-section">
        <h2>📋 Exam History</h2>

        {submissions.length === 0 ? (
          <div className="my-results-empty-state">
            <div className="my-results-empty-icon">📭</div>
            <p>No exam history found</p>
            <p style={{ fontSize: "0.9rem", color: "#999" }}>
              Take your first exam to see results here!
            </p>
            <button onClick={() => navigate("/home")} className="my-results-browse-btn">
              Browse Exams
            </button>
          </div>
        ) : (
          <div className="my-results-submissions-list">
  {submissions.map((sub) => (
    <div
      key={sub._id}
      className="my-results-submission-card"
      onClick={() => navigate(`/result/${sub._id}`)}
    >
      <div className="my-results-submission-title">{sub.examTitle}</div>
      <div className="my-results-submission-info">
        <span>Score: {sub.score}/{sub.answers.length}</span>
        <span>
          Date: {new Date(sub.submittedAt).toLocaleDateString()}{" "}
          {new Date(sub.submittedAt).toLocaleTimeString()}
        </span>
      </div>
      <div className="my-results-view-btn">View Details ➡️</div>
    </div>
  ))}
</div>

        )}
      </div>
    </div>
  );
}