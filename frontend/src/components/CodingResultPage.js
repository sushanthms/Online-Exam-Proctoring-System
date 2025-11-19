import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";

export default function CodingResultPage() {
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
  const { submissionId } = useParams();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/api/coding/submission/${submissionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(async (r) => {
      if (!r.ok) throw new Error("Failed to load result");
      const data = await r.json();
      setSub(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [submissionId, API_BASE]);

  if (loading) return <div className="result-loading"><div className="loading-spinner"></div><h3>Loading result...</h3></div>;
  if (!sub) return <div className="result-error"><h3>Error loading</h3><button onClick={() => navigate('/student/dashboard')}>Back</button></div>;

  const total = (sub.testCaseResults || []).length;
  const passed = (sub.testCaseResults || []).filter(r => r.passed).length;

  return (
    <div style={{ padding: 20 }}>
      <h2>Coding Result</h2>
      <div style={{ marginBottom: 10 }}>Language: {sub.language}</div>
      <div style={{ marginBottom: 10 }}>Score: {sub.score}% ({passed}/{total} passed)</div>
      <h3>Your Code</h3>
      <Editor height="250px" language={sub.language === 'cpp' ? 'cpp' : sub.language} value={sub.code} options={{ readOnly: true, minimap: { enabled: false } }} />
      <h3>Test Case Results</h3>
      <div>
        {(sub.testCaseResults || []).map((r, i) => (
          <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div>#{i + 1} {r.passed ? 'OK' : 'FAIL'}</div>
            <div>Input:</div>
            <pre>{r.input}</pre>
            <div>Output:</div>
            <pre>{r.output}</pre>
          </div>
        ))}
      </div>
      <button onClick={() => navigate('/student/dashboard')}>Back to Dashboard</button>
    </div>
  );
}