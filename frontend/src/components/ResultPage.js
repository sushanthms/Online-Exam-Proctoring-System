// frontend/src/components/ResultPage.js - ENHANCED VERSION
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ResultPage.css";

export default function ResultPage({ onLogout, isAdmin = false }) {
  const { submissionId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("answers"); // answers, proctoring, timeline
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  const handleGoToDashboard = () => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData?.role === "student") navigate("/student/dashboard");
    else if (userData?.role === "admin") navigate("/admin/dashboard");
    else navigate("/");
  };

  const handleLogoutAndGoHome = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
        
        console.log("📊 Result data:", data);
        
        // Print duration and verification rate for debugging
        const duration = data.duration ? `${formatDuration(data.duration)}` : 
                        (data.examSession?.duration ? `${formatDuration(data.examSession.duration)}` : "N/A");
        const verificationRate = data.verificationRate ? `${data.verificationRate}%` : 
                               (data.proctoringSummary?.avgVerificationScore ? `${data.proctoringSummary.avgVerificationScore}%` : "N/A");
        
        console.log("⏱️ Duration took:", duration);
        console.log("🔐 Verification rate:", verificationRate);
        
        setResult(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching result:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchResult();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="result-loading">
        <div className="loading-spinner"></div>
        <h3>Loading your results...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-error">
        <h3>❌ Error</h3>
        <p>{error}</p>
        <button onClick={handleLogoutAndGoHome} className="result-btn result-btn-primary">
          Go to Login
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-error">
        <h3>No result found</h3>
        <button onClick={handleLogoutAndGoHome} className="result-btn result-btn-primary">
          Go to Login
        </button>
      </div>
    );
  }

  const percentage = ((result.score / result.totalQuestions) * 100).toFixed(1);
  const isPassed = percentage >= 60;

  // Extract proctoring data
  const tabSwitches = result.tabSwitches || [];
  const identityVerifications = result.identityVerifications || [];
  const multipleFaceLogs = result.multipleFaceLogs || [];
  const warnings = result.warnings || [];
  const examSession = result.examSession || {};
  const proctoringSummary = result.proctoringSummary || {};

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Create timeline from all events
  const createTimeline = () => {
    const events = [];

    // Add exam start
    if (examSession.startedAt) {
      events.push({
        time: new Date(examSession.startedAt),
        timeInExam: "00:00",
        type: "start",
        icon: "🚀",
        title: "Exam Started",
        description: "Student began taking the exam",
        severity: "info"
      });
    }

    // Add tab switches
    tabSwitches.forEach(ts => {
      events.push({
        time: new Date(ts.timestamp),
        timeInExam: ts.timeInExam,
        type: "tab_switch",
        icon: "🔄",
        title: "Tab Switch Detected",
        description: ts.warningMessage || "Student switched browser tabs",
        severity: "warning"
      });
    });

    // Add identity verifications (only failures and warnings)
    identityVerifications.forEach(iv => {
      if (iv.status === 'failed' || iv.status === 'no_face') {
        events.push({
          time: new Date(iv.timestamp),
          timeInExam: iv.timeInExam,
          type: "identity",
          icon: iv.status === 'failed' ? "❌" : "⚠️",
          title: iv.status === 'failed' ? "Identity Verification Failed" : "Face Not Detected",
          description: iv.details || `Match: ${iv.confidence}%`,
          severity: iv.status === 'failed' ? "error" : "warning"
        });
      }
    });

    // Add multiple face detections
    multipleFaceLogs.forEach(mf => {
      events.push({
        time: new Date(mf.timestamp),
        timeInExam: mf.timeInExam,
        type: "multiple_faces",
        icon: "👥",
        title: "Multiple Faces Detected",
        description: `${mf.facesDetected} people detected (Duration: ${mf.duration}s)`,
        severity: "warning"
      });
    });

    // Add warnings
    warnings.forEach(w => {
      events.push({
        time: new Date(w.timestamp),
        timeInExam: w.timeInExam,
        type: "warning",
        icon: "⚠️",
        title: w.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: w.message,
        severity: w.severity
      });
    });

    // Add exam submission
    if (examSession.submittedAt) {
      events.push({
        time: new Date(examSession.submittedAt),
        timeInExam: formatDuration(examSession.duration),
        type: "submit",
        icon: examSession.autoSubmitted ? "⚡" : "✅",
        title: examSession.autoSubmitted ? "Auto-Submitted" : "Manually Submitted",
        description: examSession.autoSubmitReason 
          ? `Reason: ${examSession.autoSubmitReason.replace(/_/g, ' ')}`
          : "Student submitted the exam",
        severity: examSession.autoSubmitted ? "warning" : "success"
      });
    }

    // Sort by time
    return events.sort((a, b) => a.time - b.time);
  };

  const timeline = createTimeline();

  return (
    <div className="result-container">
      <div className="result-header">
        <h2>📊 Exam Results & Proctoring Report</h2>
        {isAdmin && (
          <span className="admin-badge">👨‍💼 Admin View</span>
        )}
      </div>

      {/* Score Card */}
      <div className="result-score-card">
        <div className="result-score-display">
          {result.score}/{result.totalQuestions}
        </div>
        <div className="result-score-detail">Questions Answered Correctly</div>
        <div className="result-percentage">{percentage}%</div>
        <div className={`result-pass-badge ${isPassed ? "passed" : "failed"}`}>
          {isPassed ? "✅ Passed" : "❌ Failed"}
        </div>
        
        {examSession.autoSubmitted && (
          <div className="auto-submit-notice">
            ⚡ Auto-submitted: {examSession.autoSubmitReason?.replace(/_/g, ' ')}
          </div>
        )}
      </div>

      {/* Exam Session Info */}
      <div className="exam-session-info">
        <h3>📝 Exam Details</h3>
        <div className="session-info-grid">
          <div className="info-item">
            <span className="info-icon">🏫</span>
            <div>
              <div className="info-label">Exam</div>
              <div className="info-value">{result.examTitle || result.examId}</div>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">👤</span>
            <div>
              <div className="info-label">Student</div>
              <div className="info-value">{result.studentName || result.username || userData?.name || "Unknown"}</div>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">⏱️</span>
            <div>
              <div className="info-label">Duration</div>
              <div className="info-value">
                {examSession.duration ? formatDuration(examSession.duration) : 
                (result.duration ? formatDuration(result.duration) : "N/A")}
              </div>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📅</span>
            <div>
              <div className="info-label">Submitted</div>
              <div className="info-value">
                {examSession.submittedAt ? new Date(examSession.submittedAt).toLocaleString() : 
                (result.submittedAt ? new Date(result.submittedAt).toLocaleString() : "N/A")}
              </div>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🔐</span>
            <div>
              <div className="info-label">Verification Rate</div>
              <div className="info-value">
                {result.verificationRate ? `${result.verificationRate}%` : 
                (proctoringSummary.avgVerificationScore ? `${proctoringSummary.avgVerificationScore}%` : "N/A")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proctoring Summary Stats */}
      <div className="proctoring-summary-stats">
        <h3>📊 Proctoring Summary</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon">🔄</div>
            <div className="summary-value">{proctoringSummary.totalTabSwitches || 0}</div>
            <div className="summary-label">Tab Switches</div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">❌</div>
            <div className="summary-value">{proctoringSummary.totalIdentityFailures || 0}</div>
            <div className="summary-label">Identity Failures</div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">👥</div>
            <div className="summary-value">{proctoringSummary.totalMultipleFaceEvents || 0}</div>
            <div className="summary-label">Multiple Face Events</div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">⚠️</div>
            <div className="summary-value">{proctoringSummary.totalWarnings || 0}</div>
            <div className="summary-label">Total Warnings</div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">✅</div>
            <div className="summary-value">{proctoringSummary.verificationSuccessRate || 100}%</div>
            <div className="summary-label">Verification Rate</div>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="result-tabs">
        <button 
          className={`result-tab ${activeTab === "answers" ? "active" : ""}`}
          onClick={() => setActiveTab("answers")}
        >
          📝 Answers Review
        </button>
        <button 
          className={`result-tab ${activeTab === "proctoring" ? "active" : ""}`}
          onClick={() => setActiveTab("proctoring")}
        >
          🔒 Proctoring Details
        </button>
        <button 
          className={`result-tab ${activeTab === "timeline" ? "active" : ""}`}
          onClick={() => setActiveTab("timeline")}
        >
          📅 Event Timeline
        </button>
      </div>

      {/* Tab Content */}
      <div className="result-tab-content">
        {/* Answers Tab */}
        {activeTab === "answers" && (
          <div className="result-section">
            <h3>📝 Question Review</h3>
            {result.questions.map((q, i) => {
              const userAnswerValue = result.answers && result.answers[i] !== undefined ? result.answers[i] : null;
              const correctValue = result.correctAnswers && result.correctAnswers[i] 
                ? result.correctAnswers[i] 
                : (q.correctOptionValue || (typeof q.correctOption === "number" ? q.options[q.correctOption] : null));

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
                      <span className={`result-answer-value ${isCorrect ? "correct-answer" : "wrong-answer"}`}>
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
        )}

        {/* Proctoring Details Tab */}
        {activeTab === "proctoring" && (
          <div className="result-section">
            {/* Tab Switches */}
            {tabSwitches.length > 0 && (
              <div className="proctoring-detail-section">
                <h4>🔄 Tab Switches ({tabSwitches.length})</h4>
                <div className="proctoring-events-list">
                  {tabSwitches.map((ts, i) => (
                    <div key={i} className="proctoring-event-card warning">
                      <div className="event-header">
                        <span className="event-icon">🔄</span>
                        <span className="event-time">{ts.timeInExam}</span>
                      </div>
                      <div className="event-details">
                        <div className="event-timestamp">
                          {new Date(ts.timestamp).toLocaleString()}
                        </div>
                        <div className="event-message">{ts.warningMessage}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Identity Verifications */}
            {identityVerifications.length > 0 && (
              <div className="proctoring-detail-section">
                <h4>🔐 Identity Verification Events ({identityVerifications.length})</h4>
                <div className="proctoring-events-list">
                  {identityVerifications.map((iv, i) => (
                    <div key={i} className={`proctoring-event-card ${iv.status === 'verified' ? 'success' : 'error'}`}>
                      <div className="event-header">
                        <span className="event-icon">
                          {iv.status === 'verified' ? '✅' : iv.status === 'failed' ? '❌' : '⚠️'}
                        </span>
                        <span className="event-time">{iv.timeInExam}</span>
                        <span className="event-badge">{iv.confidence}% match</span>
                      </div>
                      <div className="event-details">
                        <div className="event-timestamp">
                          {new Date(iv.timestamp).toLocaleString()}
                        </div>
                        <div className="event-message">{iv.details}</div>
                        {iv.matchScore && (
                          <div className="event-meta">Match Score: {iv.matchScore}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multiple Face Detections */}
            {multipleFaceLogs.length > 0 && (
              <div className="proctoring-detail-section">
                <h4>👥 Multiple Face Detections ({multipleFaceLogs.length})</h4>
                <div className="proctoring-events-list">
                  {multipleFaceLogs.map((mf, i) => (
                    <div key={i} className="proctoring-event-card warning">
                      <div className="event-header">
                        <span className="event-icon">👥</span>
                        <span className="event-time">{mf.timeInExam}</span>
                        <span className="event-badge">{mf.facesDetected} faces</span>
                      </div>
                      <div className="event-details">
                        <div className="event-timestamp">
                          {new Date(mf.timestamp).toLocaleString()}
                        </div>
                        <div className="event-message">{mf.details}</div>
                        <div className="event-meta">Duration: {mf.duration} seconds</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="proctoring-detail-section">
                <h4>⚠️ All Warnings ({warnings.length})</h4>
                <div className="proctoring-events-list">
                  {warnings.map((w, i) => (
                    <div key={i} className={`proctoring-event-card ${w.severity}`}>
                      <div className="event-header">
                        <span className="event-icon">⚠️</span>
                        <span className="event-time">{w.timeInExam}</span>
                        <span className={`event-badge severity-${w.severity}`}>{w.severity}</span>
                      </div>
                      <div className="event-details">
                        <div className="event-timestamp">
                          {new Date(w.timestamp).toLocaleString()}
                        </div>
                        <div className="event-message">{w.message}</div>
                        <div className="event-meta">Type: {w.type.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Violations */}
            {tabSwitches.length === 0 && 
             identityVerifications.filter(iv => iv.status !== 'verified').length === 0 && 
             multipleFaceLogs.length === 0 && 
             warnings.length === 0 && (
              <div className="no-violations">
                <div className="no-violations-icon">✅</div>
                <h3>Perfect Exam Session!</h3>
                <p>No proctoring violations detected during this exam.</p>
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="result-section">
            <h3>📅 Complete Event Timeline</h3>
            <div className="timeline-container">
              {timeline.map((event, i) => (
                <div key={i} className={`timeline-event ${event.severity}`}>
                  <div className="timeline-marker">
                    <span className="timeline-icon">{event.icon}</span>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-title">{event.title}</span>
                      <span className="timeline-time">{event.timeInExam}</span>
                    </div>
                    <div className="timeline-description">{event.description}</div>
                    <div className="timeline-timestamp">
                      {event.time.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
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