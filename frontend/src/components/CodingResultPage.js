import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './CodingResultPage.css';

const CodingResultPage = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    // Check if results were passed via navigation state
    if (location.state?.results) {
      setResults(location.state.results);
      setLoading(false);
    } else {
      fetchResults();
    }
  }, [submissionId]);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/submission/${submissionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
      alert('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionExpansion = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your results...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="error-container">
        <h2>Results not found</h2>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Go to Dashboard
        </button>
      </div>
    );
  }

  const calculateTotalScore = () => {
    let totalPassed = 0;
    let totalTests = 0;
    
    results.answers.forEach(answer => {
      if (answer.testResults) {
        totalPassed += answer.testResults.passed;
        totalTests += answer.testResults.total;
      }
    });
    
    return {
      passed: totalPassed,
      total: totalTests,
      percentage: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0
    };
  };

  const score = calculateTotalScore();
  const passThreshold = 60;
  const isPassed = parseFloat(score.percentage) >= passThreshold;

  return (
    <div className="coding-result-container">
      {/* Header */}
      <div className="result-header">
        <div className="header-content">
          <h1>{results.examTitle}</h1>
          <p className="submission-date">
            Submitted: {new Date(results.submittedAt).toLocaleString()}
          </p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back to Dashboard
        </button>
      </div>

      {/* Score Card */}
      <div className="score-card">
        <div className="score-main">
          <div className={`score-circle ${isPassed ? 'pass' : 'fail'}`}>
            <div className="score-percentage">
              {score.percentage}%
            </div>
            <div className="score-label">Overall Score</div>
          </div>
          
          <div className="score-details">
            <div className="score-stat">
              <div className="stat-value">{score.passed}</div>
              <div className="stat-label">Tests Passed</div>
            </div>
            <div className="score-stat">
              <div className="stat-value">{score.total - score.passed}</div>
              <div className="stat-label">Tests Failed</div>
            </div>
            <div className="score-stat">
              <div className="stat-value">{score.total}</div>
              <div className="stat-label">Total Tests</div>
            </div>
          </div>
        </div>

        <div className={`result-badge ${isPassed ? 'pass' : 'fail'}`}>
          {isPassed ? (
            <>
              <span className="badge-icon">✓</span>
              <span>PASSED</span>
            </>
          ) : (
            <>
              <span className="badge-icon">✗</span>
              <span>FAILED</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="result-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          Questions ({results.answers.length})
        </button>
        <button
          className={`tab ${activeTab === 'violations' ? 'active' : ''}`}
          onClick={() => setActiveTab('violations')}
        >
          Proctoring ({results.violations?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="overview-grid">
              <div className="overview-card">
                <h3>Exam Information</h3>
                <div className="info-row">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">{results.duration} minutes</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Questions:</span>
                  <span className="info-value">{results.answers.length}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className={`info-value ${isPassed ? 'success' : 'danger'}`}>
                    {isPassed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>

              <div className="overview-card">
                <h3>Performance Summary</h3>
                {results.answers.map((answer, idx) => {
                  const qScore = answer.testResults ? 
                    ((answer.testResults.passed / answer.testResults.total) * 100).toFixed(0) : 0;
                  return (
                    <div key={idx} className="performance-row">
                      <span>Question {idx + 1}</span>
                      <div className="performance-bar">
                        <div 
                          className="performance-fill" 
                          style={{ width: `${qScore}%` }}
                        ></div>
                      </div>
                      <span className="performance-score">{qScore}%</span>
                    </div>
                  );
                })}
              </div>

              <div className="overview-card">
                <h3>Proctoring Summary</h3>
                <div className="info-row">
                  <span className="info-label">Tab Switches:</span>
                  <span className={`info-value ${results.tabSwitchCount > 0 ? 'warning' : 'success'}`}>
                    {results.tabSwitchCount}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Multiple Faces:</span>
                  <span className={`info-value ${results.multipleFaceCount > 0 ? 'warning' : 'success'}`}>
                    {results.multipleFaceCount}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Total Violations:</span>
                  <span className={`info-value ${results.violations?.length > 0 ? 'danger' : 'success'}`}>
                    {results.violations?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="questions-section">
            {results.answers.map((answer, idx) => {
              const question = results.questions?.[idx];
              const testResults = answer.testResults;
              const isExpanded = expandedQuestion === idx;
              
              return (
                <div key={idx} className="question-card">
                  <div 
                    className="question-header"
                    onClick={() => toggleQuestionExpansion(idx)}
                  >
                    <div className="question-title">
                      <h3>Question {idx + 1}</h3>
                      {question && <p>{question.title}</p>}
                    </div>
                    
                    <div className="question-score">
                      {testResults ? (
                        <>
                          <span className="score-passed">{testResults.passed}</span>
                          /
                          <span className="score-total">{testResults.total}</span>
                          <span className="score-label">tests passed</span>
                        </>
                      ) : (
                        <span className="no-submission">Not submitted</span>
                      )}
                    </div>
                    
                    <button className="expand-btn">
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="question-details">
                      {/* Code Submission */}
                      <div className="code-section">
                        <h4>Your Code ({answer.language}):</h4>
                        <pre className="code-display">
                          <code>{answer.code || 'No code submitted'}</code>
                        </pre>
                      </div>

                      {/* Test Results */}
                      {testResults && (
                        <div className="test-results-section">
                          <h4>Test Results:</h4>
                          <div className="test-summary">
                            <div className="summary-stat success">
                              <span className="stat-icon">✓</span>
                              <span className="stat-number">{testResults.passed}</span>
                              <span className="stat-text">Passed</span>
                            </div>
                            <div className="summary-stat danger">
                              <span className="stat-icon">✗</span>
                              <span className="stat-number">{testResults.failed}</span>
                              <span className="stat-text">Failed</span>
                            </div>
                            <div className="summary-stat info">
                              <span className="stat-icon">Σ</span>
                              <span className="stat-number">{testResults.total}</span>
                              <span className="stat-text">Total</span>
                            </div>
                          </div>

                          <div className="test-cases-list">
                            {testResults.cases.map((testCase, tcIdx) => (
                              <div 
                                key={tcIdx} 
                                className={`test-case ${testCase.passed ? 'passed' : 'failed'}`}
                              >
                                <div className="test-case-header">
                                  <span className="test-case-number">
                                    Test Case {testCase.testCaseNumber}
                                  </span>
                                  <span className={`test-case-status ${testCase.passed ? 'pass' : 'fail'}`}>
                                    {testCase.passed ? '✓ Passed' : '✗ Failed'}
                                  </span>
                                </div>
                                
                                {!testCase.hidden && (
                                  <div className="test-case-details">
                                    <div className="test-detail">
                                      <strong>Input:</strong>
                                      <pre>{testCase.input}</pre>
                                    </div>
                                    <div className="test-detail">
                                      <strong>Expected Output:</strong>
                                      <pre>{testCase.expected}</pre>
                                    </div>
                                    <div className="test-detail">
                                      <strong>Your Output:</strong>
                                      <pre className={testCase.passed ? 'correct' : 'incorrect'}>
                                        {testCase.actual}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                                
                                {testCase.hidden && (
                                  <div className="test-case-hidden">
                                    <p>This is a hidden test case</p>
                                    <p className={testCase.passed ? 'success' : 'danger'}>
                                      Status: {testCase.passed ? 'Passed ✓' : 'Failed ✗'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Violations Tab */}
        {activeTab === 'violations' && (
          <div className="violations-section">
            {(!results.violations || results.violations.length === 0) ? (
              <div className="no-violations">
                <span className="success-icon">✓</span>
                <h3>No Violations Detected</h3>
                <p>Great job! You completed the exam without any proctoring violations.</p>
              </div>
            ) : (
              <div className="violations-list">
                <div className="violations-summary">
                  <h3>Total Violations: {results.violations.length}</h3>
                  <p>The following violations were detected during your exam:</p>
                </div>
                
                {results.violations.map((violation, idx) => (
                  <div key={idx} className={`violation-card ${violation.type.toLowerCase()}`}>
                    <div className="violation-header">
                      <span className="violation-type">{violation.type.replace('_', ' ')}</span>
                      <span className="violation-time">
                        {new Date(violation.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="violation-description">{violation.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="result-footer">
        <button onClick={() => navigate('/dashboard')} className="btn-secondary">
          Return to Dashboard
        </button>
        <button onClick={() => window.print()} className="btn-primary">
          Print Results
        </button>
      </div>
    </div>
  );
};

export default CodingResultPage;