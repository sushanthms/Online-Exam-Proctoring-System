// ResultPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ResultPage.css";

export default function ResultPage({ onLogout }) {
  const { submissionId } = useParams();
  const [result, setResult] = useState(null);
  const [faceLogs, setFaceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- Handler: Go to Dashboard ---
  const handleGoToDashboard = () => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData?.role === "student") navigate("/student/dashboard");
    else if (userData?.role === "admin") navigate("/admin/dashboard");
    else navigate("/");
  };

  // --- Handler: Logout ---
  const handleLogoutAndGoHome = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("name");

    if (onLogout) onLogout();
    alert("✅ You have been logged out successfully!");
    navigate("/");
    window.location.reload();
  };

 useEffect(() => {
  const fetchResult = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:4000/api/exam/result/${submissionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error(`Failed to fetch result: ${response.status}`);
      const data = await response.json();
      setResult(data);

      // ✅ Get face logs from current submission directly
      if (data.multipleFaceLogs && data.multipleFaceLogs.length > 0) {
        setFaceLogs(data.multipleFaceLogs);
      } else {
        setFaceLogs([]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching result:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  fetchResult();
}, [submissionId]);


  // --- Render loading ---
  if (loading) {
    return (
      <div className="result-loading">
        <div className="loading-spinner"></div>
        <h3>Loading your results...</h3>
      </div>
    );
  }

  // --- Render error ---
  if (error) {
    return (
      <div className="container" style={{ padding: "2rem", textAlign: "center" }}>
        <h3 style={{ color: "red" }}>❌ Error</h3>
        <p>{error}</p>
        <button onClick={handleLogoutAndGoHome} className="btn">
          Go to Login
        </button>
      </div>
    );
  }

  // --- Render no result ---
  if (!result) {
    return (
      <div className="container" style={{ padding: "2rem", textAlign: "center" }}>
        <h3>No result found</h3>
        <button onClick={handleLogoutAndGoHome} className="btn">
          Go to Login
        </button>
      </div>
    );
  }

  // --- Render success ---
  const percentage = ((result.score / result.totalQuestions) * 100).toFixed(1);
  const isPassed = percentage >= 60;

  return (
    <div className="result-container">
      <div className="result-header">
        <h2>📊 Exam Results</h2>
      </div>

      <div className="result-score-card">
        <div className="result-score-display">
          {result.score}/{result.totalQuestions}
        </div>
        <div className="result-score-detail">Questions Answered</div>
        <div className="result-percentage">{percentage}%</div>
        <div className={`result-pass-badge ${isPassed ? "passed" : "failed"}`}>
          {isPassed ? "✅ Passed" : "❌ Failed"}
        </div>
      </div>

      <div className="result-section">
        <h3>📝 Question Review</h3>
        {result.questions.map((q, i) => {
          // result.answers contains option TEXT values (or null)
          const userAnswerValue = result.answers && result.answers[i] !== undefined ? result.answers[i] : null;
          const correctValue = q.correctOptionValue || (typeof q.correctOption === "number" ? q.options[q.correctOption] : null);

          const isCorrect = String(userAnswerValue || "").trim() === String(correctValue || "").trim();

          return (
            <div
              key={i}
              className={`result-question-item ${isCorrect ? "correct" : "incorrect"}`}
            >
              <div className="result-question-number">Question {i + 1}</div>
              <div className="result-question-text">{q.text}</div>

              <div className="result-answer-row">
                <div className="result-answer-item">
                  <span className="result-answer-label">Your Answer:</span>
                  <span
                    className={`result-answer-value ${
                      isCorrect ? "correct-answer" : "wrong-answer"
                    }`}
                  >
                    {userAnswerValue || "Not Answered"}
                  </span>
                </div>

                <div className="result-answer-item">
                  <span className="result-answer-label">Correct Answer:</span>
                  <span className="result-answer-value correct-answer">
                    {correctValue || "Not Available"}
                  </span>
                </div>
              </div>

              <span className="result-status-icon">{isCorrect ? "✅" : "❌"}</span>
            </div>
          );
        })}
      </div>

      {faceLogs.length > 0 && (
        <div className="result-proctoring-section">
          <h3>👀 Proctoring Report</h3>
          <ul className="result-face-logs-list">
            {faceLogs.map((log, index) => (
              <li key={index} className="result-face-log-item">
                <span className="result-face-log-time">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
                {" - Multiple faces detected"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="result-actions">
        <button
          onClick={handleGoToDashboard}
          className="result-btn result-btn-secondary"
        >
          🏠 Return to Dashboard
        </button>

        <button
          onClick={handleLogoutAndGoHome}
          className="result-btn result-btn-primary"
        >
          🔓 Logout & Return to Login
        </button>
      </div>
    </div>
  );
}
