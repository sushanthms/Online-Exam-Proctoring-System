import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ResultsPage.css";

export default function ResultsPage({ user }) {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Fetch exam result
        const resultResponse = await fetch(`http://localhost:4000/api/exam/result/${examId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!resultResponse.ok) {
          throw new Error("Failed to fetch exam result");
        }
        
        const resultData = await resultResponse.json();
        setResult(resultData);
        
        // Fetch proctoring violations
        const violationsResponse = await fetch(`http://localhost:4000/api/exam/violations/${examId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!violationsResponse.ok) {
          throw new Error("Failed to fetch violations");
        }
        
        const violationsData = await violationsResponse.json();
        setViolations(violationsData);
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [examId, navigate, user]);

  const getViolationSeverity = (type) => {
    if (type.includes("identity_verification_failed") || type.includes("multiple_faces")) {
      return "critical";
    } else if (type.includes("tab_switch")) {
      return "warning";
    } else {
      return "info";
    }
  };

  const formatViolationType = (type) => {
    switch(type) {
      case "identity_verification_failed":
        return "Identity Verification Failed";
      case "multiple_faces":
        return "Multiple Faces Detected";
      case "tab_switch":
        return "Tab Switching";
      case "no_face":
        return "No Face Detected";
      default:
        return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (loading) {
    return <div className="results-loading">Loading results...</div>;
  }

  return (
    <div className="results-page">
      <div className="results-header">
        <h1>Exam Results</h1>
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>

      {result && (
        <div className="results-container">
          <div className="score-section">
            <h2>Score Summary</h2>
            <div className="score-card">
              <div className="score-value">{result.score}%</div>
              <div className="score-label">
                {result.score >= 70 ? "Passed" : "Failed"}
              </div>
            </div>
            <div className="score-details">
              <div className="detail-item">
                <span>Correct Answers:</span>
                <span>{result.correctAnswers} / {result.totalQuestions}</span>
              </div>
              <div className="detail-item">
                <span>Time Taken:</span>
                <span>{result.timeTaken} minutes</span>
              </div>
              <div className="detail-item">
                <span>Exam Date:</span>
                <span>{new Date(result.submittedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="violations-section">
            <h2>Proctoring Violations</h2>
            {violations.length === 0 ? (
              <div className="no-violations">
                <span className="checkmark">✓</span>
                <p>No proctoring violations detected</p>
              </div>
            ) : (
              <div className="violations-list">
                <div className="violations-summary">
                  <div className="violation-count">
                    <span className="count">{violations.length}</span>
                    <span className="label">Total Violations</span>
                  </div>
                  <div className="violation-types">
                    <div className="type-item">
                      <span className="type-count">
                        {violations.filter(v => getViolationSeverity(v.violationType) === "critical").length}
                      </span>
                      <span className="type-label critical">Critical</span>
                    </div>
                    <div className="type-item">
                      <span className="type-count">
                        {violations.filter(v => getViolationSeverity(v.violationType) === "warning").length}
                      </span>
                      <span className="type-label warning">Warning</span>
                    </div>
                    <div className="type-item">
                      <span className="type-count">
                        {violations.filter(v => getViolationSeverity(v.violationType) === "info").length}
                      </span>
                      <span className="type-label info">Info</span>
                    </div>
                  </div>
                </div>
                
                <div className="violations-table">
                  <div className="table-header">
                    <div className="header-cell">Time</div>
                    <div className="header-cell">Violation Type</div>
                    <div className="header-cell">Details</div>
                  </div>
                  {violations.map((violation, index) => (
                    <div 
                      key={index} 
                      className={`table-row ${getViolationSeverity(violation.violationType)}`}
                    >
                      <div className="cell">
                        {new Date(violation.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="cell">
                        {formatViolationType(violation.violationType)}
                      </div>
                      <div className="cell details">
                        {violation.details}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}