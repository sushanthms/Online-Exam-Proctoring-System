import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ResultPage({ onLogout }) {
  const { submissionId } = useParams();
  const [result, setResult] = useState(null);
  const [faceLogs, setFaceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("No authentication token found. Please login.");
          setLoading(false);
          return;
        }

        // Fetch exam result
        const response = await fetch(
          `http://localhost:4000/api/exam/result/${submissionId}`, 
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch result: ${response.status}`);
        }

        const data = await response.json();
        setResult(data);

        // Fetch face logs only if we have userId and examId
        if (data.userId && data.examId) {
          try {
            const faceRes = await fetch(
              `http://localhost:4000/api/exam/face-logs/${data.userId}/${data.examId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (faceRes.ok) {
              const faceData = await faceRes.json();
              setFaceLogs(faceData.faceLogs || []);
            }
          } catch (faceError) {
            console.warn("Could not fetch face logs:", faceError);
            // Don't fail the whole page if face logs fail
          }
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

  const handleLogoutAndGoHome = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('name');
    
    // Call parent logout function if provided
    if (onLogout) {
      onLogout();
    }
    
    // Show logout message
    alert("✅ You have been logged out successfully!");
    
    // Navigate to login page
    navigate("/");
    
    // Force page reload to clear all state
    window.location.reload();
  };

  // Loading state
  if (loading) {
    return (
      <div className="container" style={{ padding: "2rem", textAlign: "center" }}>
        <h3>Loading your result...</h3>
        <div style={{ marginTop: "1rem" }}>
          <div style={{ 
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #1976d2",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            animation: "spin 1s linear infinite",
            margin: "0 auto"
          }}></div>
        </div>
      </div>
    );
  }

  // Error state
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

  // No result found
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

  return (
    <div className="result-container" style={{ padding: "2rem", maxWidth: "700px", margin: "auto" }}>
      <h2 style={{ color: "#0d47a1", marginBottom: "1rem" }}>📊 Exam Result</h2>
      
      <div style={{ 
        background: "#e3f2fd", 
        padding: "1rem", 
        borderRadius: "8px",
        marginBottom: "2rem" 
      }}>
        <p style={{ fontSize: "1.2rem", margin: "0.5rem 0" }}>
          <strong>Total Score:</strong> {result.score}/{result.totalQuestions}
        </p>
        <p style={{ fontSize: "1.1rem", margin: "0.5rem 0", color: "#1976d2" }}>
          <strong>Percentage:</strong> {((result.score / result.totalQuestions) * 100).toFixed(1)}%
        </p>
      </div>

      <h3 style={{ color: "#0d47a1", marginBottom: "1rem" }}>📝 Question Review</h3>
      
      {result.questions && result.questions.map((q, i) => {
        const userAnswerIndex = result.answers[i];
        const isCorrect = userAnswerIndex === q.correctOption;

        return (
          <div 
            key={i} 
            style={{ 
              marginBottom: "1.5rem",
              padding: "1rem",
              background: isCorrect ? "#e8f5e9" : "#ffebee",
              borderRadius: "8px",
              border: `2px solid ${isCorrect ? "#4caf50" : "#f44336"}`
            }}
          >
            <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
              Q{i + 1}: {q.text}
            </p>
            
            <p style={{ margin: "0.3rem 0" }}>
              <strong>Your Answer:</strong> {
                userAnswerIndex !== null && userAnswerIndex !== undefined 
                  ? q.options[userAnswerIndex] 
                  : "Not Answered"
              }
            </p>
            
            <p style={{ margin: "0.3rem 0" }}>
              <strong>Correct Answer:</strong> {q.options[q.correctOption]}
            </p>
            
            <p style={{ margin: "0.5rem 0 0 0" }}>
              {isCorrect ? (
                <span style={{ color: "green", fontWeight: "bold" }}>✅ Correct</span>
              ) : (
                <span style={{ color: "red", fontWeight: "bold" }}>❌ Wrong</span>
              )}
            </p>
          </div>
        );
      })}

      <div style={{ marginTop: "2rem", padding: "1rem", background: "#fff3e0", borderRadius: "8px" }}>
        <h3 style={{ color: "#e65100", marginBottom: "1rem" }}>
          👀 Proctoring Report - Multiple Face Detection
        </h3>
        
        {faceLogs.length > 0 ? (
          <div>
            <p style={{ color: "#d84315", fontWeight: "bold" }}>
              ⚠️ {faceLogs.length} incident(s) detected
            </p>
            <ul style={{ marginTop: "1rem" }}>
              {faceLogs.map((log, index) => (
                <li key={index} style={{ marginBottom: "0.5rem" }}>
                  <strong>{new Date(log.timestamp).toLocaleString()}</strong>
                  {log.details && ` - ${log.details}`}
                  {log.facesDetected && ` (${log.facesDetected} faces)`}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p style={{ color: "#2e7d32", fontWeight: "bold" }}>
            ✅ No multiple face incidents detected - Great job!
          </p>
        )}
      </div>

      <button
        onClick={handleLogoutAndGoHome}
        style={{
          background: "#1976d2",
          color: "white",
          padding: "0.75rem 1.5rem",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginTop: "2rem",
          fontSize: "1rem",
          fontWeight: "bold",
          width: "100%",
          transition: "background 0.3s ease"
        }}
        onMouseEnter={(e) => e.target.style.background = "#0d47a1"}
        onMouseLeave={(e) => e.target.style.background = "#1976d2"}
      >
        🔓 Logout & Return to Login
      </button>
    </div>
  );
}