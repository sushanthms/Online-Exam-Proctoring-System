import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Leaderboard from "./Leaderboard";
import "./AdminDashboard.css";

export default function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [violations, setViolations] = useState([]);
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    description: "",
    languagesAllowed: "javascript,python,cpp",
    testCases: [{ input: "", expectedOutput: "" }]
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch stats
      const statsRes = await fetch("http://localhost:4000/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
        setRecentSubmissions(data.recentSubmissions || []);
      }

      // Fetch users
      const usersRes = await fetch("http://localhost:4000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      // Fetch exams
      const examsRes = await fetch("http://localhost:4000/api/admin/exams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (examsRes.ok) {
        const data = await examsRes.json();
        setExams(data.exams || []);
      }

      // Fetch violations
      const violationsRes = await fetch("http://localhost:4000/api/admin/violations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (violationsRes.ok) {
        const data = await violationsRes.json();
        setViolations(data.violations || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const fetchCodingQuestions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:4000/api/coding/questions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCodingQuestions(data.questions || []);
      }
    } catch (err) {
      console.error("Error loading coding questions:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "coding") {
      fetchCodingQuestions();
    }
  }, [activeTab]);

  const addTestCaseRow = () => {
    setNewQuestion(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: "", expectedOutput: "" }]
    }));
  };

  const updateTestCase = (index, field, value) => {
    setNewQuestion(prev => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) => i === index ? { ...tc, [field]: value } : tc)
    }));
  };

  const handleCreateCodingQuestion = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: newQuestion.title,
        description: newQuestion.description,
        languagesAllowed: newQuestion.languagesAllowed.split(',').map(s => s.trim()).filter(Boolean),
        testCases: newQuestion.testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isHidden: false }))
      };
      const res = await fetch("http://localhost:4000/api/coding/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Coding question created successfully");
        setNewQuestion({ title: "", description: "", languagesAllowed: "javascript,python,cpp", testCases: [{ input: "", expectedOutput: "" }] });
        fetchCodingQuestions();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to create coding question");
      }
    } catch (err) {
      console.error("Create coding question error:", err);
      alert("Server error while creating coding question");
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:4000/api/admin/user/${userId}/toggle-status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        alert("User status updated");
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:4000/api/admin/exam/${examId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        alert("Exam deleted successfully");
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
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
        <h3>Loading admin dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Navbar */}
      <Navbar user={user} onLogout={onLogout} />

      {/* Stats Overview */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
            <div className="stat-breakdown">
              {stats.totalStudents} Students | {stats.totalAdmins} Admins
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-value">{stats.totalExams}</div>
            <div className="stat-label">Total Exams</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.totalSubmissions}</div>
            <div className="stat-label">Submissions</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-value">{violations.length}</div>
            <div className="stat-label">Violations</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={activeTab === "overview" ? "tab-active" : "tab"}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={activeTab === "users" ? "tab-active" : "tab"}
          onClick={() => setActiveTab("users")}
        >
          👥 Users
        </button>
        <button
          className={activeTab === "exams" ? "tab-active" : "tab"}
          onClick={() => setActiveTab("exams")}
        >
          📝 Exams
        </button>
        <button
          className={activeTab === "submissions" ? "tab-active" : "tab"}
          onClick={() => setActiveTab("submissions")}
        >
          📋 Submissions
        </button>
        <button
          className={activeTab === "violations" ? "tab-active" : "tab"}
          onClick={() => setActiveTab("violations")}
        >
          ⚠️ Violations
        </button>
        <button
          className={activeTab === "coding" ? "tab-active" : "tab"}
          onClick={() => setActiveTab("coding")}
        >
          💻 Coding
        </button>
      </div>

      {/* Tab Content */}
      <div className="admin-content">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="overview-section">
            <div className="section-header">
              <h2>Recent Submissions</h2>
              <button
                onClick={() => setActiveTab("submissions")}
                className="btn-view-all"
              >
                View All →
              </button>
            </div>

            {recentSubmissions.length === 0 ? (
              <p className="empty-text">No submissions yet</p>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Exam ID</th>
                      <th>Score</th>
                      <th>Integrity</th>
                      <th>Submitted At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSubmissions.map((sub) => (
                      <tr key={sub._id}>
                        <td>{sub.userDetails?.name || sub.username}</td>
                        <td>{sub.examId}</td>
                        <td>
                          <span className="score-badge">
                            {sub.score || 0} / {sub.answers?.length || 0}
                          </span>
                        </td>
                        <td>
                          <span className={`percentage-badge ${sub.integrityScore >= 80 ? 'pass' : sub.integrityScore >= 60 ? 'warn' : 'fail'}`}>
                            {typeof sub.integrityScore === 'number' ? `${sub.integrityScore}` : 'N/A'}
                          </span>
                        </td>
                        <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                        <td>
                          <button
                            onClick={() => navigate(`/admin/submission/${sub._id}`)}
                            className="btn-view"
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

            {/* Leaderboard */}
            <Leaderboard exams={exams} title="🏆 Leaderboard (All/By Exam)" />

            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button
                  onClick={() => navigate("/admin/create-exam")}
                  className="btn-action"
                >
                  ➕ Create New Exam
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className="btn-action"
                >
                  👥 Manage Users
                </button>
                <button
                  onClick={() => setActiveTab("violations")}
                  className="btn-action"
                >
                  ⚠️ View Violations
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="users-section">
            <div className="section-header">
              <h2>All Users</h2>
              <span className="count-badge">{users.length} total</span>
            </div>

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge ${u.role}`}>
                          {u.role === "admin" ? "👨‍💼 Admin" : "👨‍🎓 Student"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${u.isActive ? "active" : "inactive"}`}>
                          {u.isActive ? "✅ Active" : "❌ Inactive"}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleString()
                          : "Never"}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleUserStatus(u._id)}
                          className="btn-toggle"
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Exams Tab */}
        {activeTab === "exams" && (
          <div className="exams-section">
            <div className="section-header">
              <h2>All Exams</h2>
              <button
                onClick={() => navigate("/admin/create-exam")}
                className="btn-primary"
              >
                ➕ Create New Exam
              </button>
            </div>

            {exams.length === 0 ? (
              <div className="empty-state">
                <p>No exams created yet</p>
                <button
                  onClick={() => navigate("/admin/create-exam")}
                  className="btn-primary"
                >
                  Create First Exam
                </button>
              </div>
            ) : (
              <div className="exams-grid">
                {exams.map((exam) => (
                  <div key={exam._id} className="exam-card">
                    <div className="exam-card-header">
                      <h3>{exam.title}</h3>
                      <span className={`exam-status ${exam.isActive ? "active" : "inactive"}`}>
                        {exam.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="exam-details">
                      <p>📝 {exam.questions?.length || 0} Questions</p>
                      <p>⏱️ {exam.durationMins} Minutes</p>
                      <p>📅 Created: {new Date(exam.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="exam-actions">
                      <button
                        onClick={() => navigate(`/admin/edit-exam/${exam._id}`)}
                        className="btn-edit"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteExam(exam._id)}
                        className="btn-delete"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === "submissions" && (
          <div className="submissions-section">
            <div className="section-header">
              <h2>All Submissions</h2>
              <button
                onClick={() => navigate("/admin/submissions")}
                className="btn-secondary"
              >
                Advanced View →
              </button>
            </div>

            {recentSubmissions.length === 0 ? (
              <p className="empty-text">No submissions yet</p>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Exam ID</th>
                      <th>Score</th>
                      <th>Integrity</th>
                      <th>Percentage</th>
                      <th>Submitted At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSubmissions.map((sub) => {
                      const percentage = sub.answers?.length
                        ? ((sub.score / sub.answers.length) * 100).toFixed(1)
                        : 0;
                      return (
                        <tr key={sub._id}>
                          <td>{sub.userDetails?.name || sub.username}</td>
                          <td>{sub.userDetails?.email || "N/A"}</td>
                          <td>{sub.examId}</td>
                          <td>
                            {sub.score || 0} / {sub.answers?.length || 0}
                          </td>
                          <td>
                            <span className={`percentage-badge ${sub.integrityScore >= 80 ? 'pass' : sub.integrityScore >= 60 ? 'warn' : 'fail'}`}>
                              {typeof sub.integrityScore === 'number' ? `${sub.integrityScore}` : 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={`percentage-badge ${percentage >= 60 ? "pass" : "fail"}`}>
                              {percentage}%
                            </span>
                          </td>
                          <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                          <td>
                            <button
                              onClick={() => navigate(`/admin/submission/${sub._id}`)}
                              className="btn-view"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Violations Tab */}
        {activeTab === "violations" && (
          <div className="violations-section">
            <div className="section-header">
              <h2>Proctoring Violations</h2>
              <span className="count-badge">{violations.length} total</span>
            </div>

            {violations.length === 0 ? (
              <p className="empty-text">No violations detected</p>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Exam</th>
                      <th>Type</th>
                      <th>Details</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {violations.map((v) => (
                      <tr key={v._id} className="violation-row">
                        <td>{v.user?.name || "Unknown"}</td>
                        <td>{v.user?.email || "N/A"}</td>
                        <td>{v.exam?.title || v.examId}</td>
                        <td>
                          <span className="violation-badge">
                            👥 Multiple Faces
                          </span>
                        </td>
                        <td>{v.details || "Multiple faces detected"}</td>
                        <td>{new Date(v.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "coding" && (
          <div className="coding-section">
            <div className="section-header">
              <h2>Coding Questions</h2>
              <span className="count-badge">{codingQuestions.length} total</span>
            </div>

            <div className="create-coding-form">
              <h3>Create New Coding Question</h3>
              <div className="form-row">
                <label>Title</label>
                <input value={newQuestion.title} onChange={e => setNewQuestion({ ...newQuestion, title: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Description</label>
                <textarea value={newQuestion.description} onChange={e => setNewQuestion({ ...newQuestion, description: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Languages (comma separated)</label>
                <input value={newQuestion.languagesAllowed} onChange={e => setNewQuestion({ ...newQuestion, languagesAllowed: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Test Cases</label>
                {newQuestion.testCases.map((tc, i) => (
                  <div key={i} className="testcase-row">
                    <input placeholder="Input" value={tc.input} onChange={e => updateTestCase(i, 'input', e.target.value)} />
                    <input placeholder="Expected Output" value={tc.expectedOutput} onChange={e => updateTestCase(i, 'expectedOutput', e.target.value)} />
                  </div>
                ))}
                <button className="btn-secondary" onClick={addTestCaseRow}>+ Add Test Case</button>
              </div>
              <button className="btn-primary" onClick={handleCreateCodingQuestion}>Create Coding Question</button>
            </div>

            <div className="table-container" style={{ marginTop: '20px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Languages</th>
                    <th>Tests</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codingQuestions.map(q => (
                    <tr key={q._id}>
                      <td>{q.title}</td>
                      <td>{(q.languagesAllowed || []).join(', ')}</td>
                      <td>{(q.testCases || []).length}</td>
                      <td>
                        <button className="btn-view" onClick={() => navigate(`/coding/${q._id}`)}>Open</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}