import React, { useEffect, useMemo, useState } from "react";
import { examApi } from "../api";
import "./Leaderboard.css";

export default function Leaderboard({ exams = [], initialExamId = null, limit = 10, title = "🏆 Leaderboard" }) {
  const [selectedExamId, setSelectedExamId] = useState(initialExamId || null);
  const [data, setData] = useState({ leaderboard: [], count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const examOptions = useMemo(() => {
    const opts = [{ value: null, label: "All Exams" }];
    if (Array.isArray(exams)) {
      exams.forEach((e) => opts.push({ value: e._id || e.examId, label: e.title || e.examTitle || String(e._id) }));
    }
    return opts;
  }, [exams]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (selectedExamId) params.examId = selectedExamId;
      params.limit = limit;
      const res = await examApi.getLeaderboard(params);
      setData(res || { leaderboard: [], count: 0 });
    } catch (err) {
      console.error("❌ Leaderboard fetch error:", err);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [selectedExamId, limit]);

  return (
    <div className="leaderboard-card">
      <div className="leaderboard-header">
        <h2>{title}</h2>
        <div className="leaderboard-controls">
          <label htmlFor="lb-exam-select" className="lb-label">Exam:</label>
          <select
            id="lb-exam-select"
            className="lb-select"
            value={selectedExamId || ""}
            onChange={(e) => setSelectedExamId(e.target.value || null)}
          >
            {examOptions.map((opt) => (
              <option key={opt.value || "all"} value={opt.value || ""}>{opt.label}</option>
            ))}
          </select>
          <button className="lb-refresh" onClick={fetchLeaderboard} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="lb-error">{error}</div>}

      <div className="leaderboard-table-container">
        {data.leaderboard.length === 0 ? (
          <div className="lb-empty">No leaderboard data yet</div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Email</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Attempts</th>
                <th>Last Submission</th>
              </tr>
            </thead>
            <tbody>
              {data.leaderboard.map((row, idx) => (
                <tr key={`${row.userId}-${idx}`} className={idx === 0 ? "lb-top" : ""}>
                  <td>{idx + 1}</td>
                  <td>{row.name || "Unknown"}</td>
                  <td>{row.email || "—"}</td>
                  <td>
                    <span className="lb-score">{row.score} / {row.totalQuestions}</span>
                  </td>
                  <td>
                    <span className={`lb-percent ${row.percentage >= 60 ? "pass" : "fail"}`}>{row.percentage}%</span>
                  </td>
                  <td>{row.attempts}</td>
                  <td>{new Date(row.submittedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}