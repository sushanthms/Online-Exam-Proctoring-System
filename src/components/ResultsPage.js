// frontend/src/components/ResultsPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ResultsPage.css';

export default function ResultsPage({ user }) {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [examDetails, setExamDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [examId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch exam details
      const examResponse = await fetch(`http://localhost:4000/api/exam/paper/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!examResponse.ok) throw new Error('Failed to load exam details');
      const examData = await examResponse.json();
      setExamDetails(examData);
      
      // Fetch results
      const resultsResponse = await fetch(`http://localhost:4000/api/exam/results/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!resultsResponse.ok) throw new Error('Failed to load results');
      const resultsData = await resultsResponse.json();
      setResults(resultsData);
      
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (user.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="results-container loading">
        <div className="loading-spinner"></div>
        <p>Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-container error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={handleBack} className="btn-back">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Exam Results</h1>
        {examDetails && <h2>{examDetails.title}</h2>}
        <button onClick={handleBack} className="btn-back">Back to Dashboard</button>
      </div>

      {results.length === 0 ? (
        <div className="no-results">
          <p>No results available for this exam yet.</p>
        </div>
      ) : (
        <div className="results-table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Submission Time</th>
                <th>Proctoring Violations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result._id}>
                  <td>{result.studentName}</td>
                  <td>{result.score} / {result.totalQuestions}</td>
                  <td>{Math.round((result.score / result.totalQuestions) * 100)}%</td>
                  <td>{new Date(result.submittedAt).toLocaleString()}</td>
                  <td>
                    <div className="violation-indicators">
                      {result.tabSwitches > 0 && (
                        <span className="violation-badge" title={`${result.tabSwitches} tab switches detected`}>
                          🔄 {result.tabSwitches}
                        </span>
                      )}
                      {result.faceVerificationFailures > 0 && (
                        <span className="violation-badge" title={`${result.faceVerificationFailures} face verification failures`}>
                          👤❌ {result.faceVerificationFailures}
                        </span>
                      )}
                      {result.multipleFaceDetections > 0 && (
                        <span className="violation-badge" title={`${result.multipleFaceDetections} multiple face detections`}>
                          👥 {result.multipleFaceDetections}
                        </span>
                      )}
                      {result.noFaceDetections > 0 && (
                        <span className="violation-badge" title={`${result.noFaceDetections} periods with no face detected`}>
                          👤❓ {result.noFaceDetections}
                        </span>
                      )}
                      {!result.tabSwitches && !result.faceVerificationFailures && 
                       !result.multipleFaceDetections && !result.noFaceDetections && (
                        <span className="clean-badge">✅ None</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button 
                      onClick={() => navigate(`/result/${result._id}`)}
                      className="btn-view-details"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}