import React, { useEffect, useState } from "react";

export default function SubmissionPage({ user, examId, onBack }) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found. Please login.");

        const res = await fetch(`/api/exam/submission/${user._id}/${examId}`, {
          headers: { Authorization: "Bearer " + token },
        });

        if (!res.ok) throw new Error(`Server returned ${res.status}`);

        const data = await res.json();
        setSubmission(data);
      } catch (err) {
        console.error("Error fetching submission:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [user, examId]);

  if (loading) return <p>Loading submission...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!submission) return <p>No submission found.</p>;

  const correctCount = submission.answers?.filter((a) => a.correct).length || 0;

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h2 style={{ color: "#2c3e50" }}>Exam Submission Details</h2>

      <div style={{ marginTop: "10px" }}>
        <p><strong>Username:</strong> {submission.username}</p>
        <p><strong>Exam ID:</strong> {submission.examId}</p>
        <p><strong>Score:</strong> {correctCount} / {submission.answers?.length}</p>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>🧭 Tab Switches ({submission.tabSwitches?.length || 0})</h3>
        {submission.tabSwitches?.length > 0 ? (
          <ul>
            {submission.tabSwitches.map((t, i) => (
              <li key={i}>{t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : 'Invalid time'}</li>
            ))}
          </ul>
        ) : (
          <p>No tab switches detected ✅</p>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>👀 Multiple Face Detections ({submission.multipleFaceLogs?.length || 0})</h3>
        {submission.multipleFaceLogs?.length > 0 ? (
          <ul>
            {submission.multipleFaceLogs.map((log, i) => (
              <li key={i}>
                {log.startTime ? new Date(log.startTime).toLocaleTimeString() : 'Invalid start time'} -{" "}
                {log.endTime ? new Date(log.endTime).toLocaleTimeString() : 'Invalid end time'} ({log.duration}s)
              </li>
            ))}
          </ul>
        ) : (
          <p>No multiple face detections ✅</p>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>📘 Answers</h3>
        {submission.answers?.length > 0 ? (
          <ul>
            {submission.answers.map((a, i) => (
              <li key={i}>
                Question ID: {a.questionId}, Selected: {a.selectedOption},{" "}
                Correct: {a.correct ? "✅" : "❌"}
              </li>
            ))}
          </ul>
        ) : (
          <p>No answers found.</p>
        )}
      </div>

      <button
        onClick={onBack}
        style={{
          marginTop: 30,
          padding: "10px 20px",
          backgroundColor: "#3498db",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}
