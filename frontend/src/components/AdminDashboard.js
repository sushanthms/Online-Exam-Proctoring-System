import React, { useEffect, useState } from "react";

export default function AdminDashboard({ user }) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  // For demo, you can hardcode examId or fetch all submissions from backend
  const examId = "EXAM001"; 
  const userId = user._id; // adjust if admin wants to view multiple users

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await fetch(`/api/exam/submission/${user._id}/${examId}`, {
  headers: {
    Authorization: "Bearer " + localStorage.getItem("token"),
  },
});

        const data = await res.json();
        setSubmission(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [userId, examId]);

  if (loading) return <p>Loading submission...</p>;
  if (!submission) return <p>No submission found for this user/exam.</p>;

  return (
    <div className="container">
      <h2>Admin Dashboard - Exam Report</h2>
      <h3>User: {submission.username}</h3>
      <h3>Exam ID: {submission.examId}</h3>

      <div>
        <h4>Answers</h4>
        <ul>
          {submission.answers.map((a, i) => (
            <li key={i}>
              Q{a.questionId}: Selected Option {a.selectedOption} |{" "}
              {a.correct ? "✅ Correct" : "❌ Wrong"}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4>Tab Switches</h4>
        <ul>
          {submission.tabSwitches.map((t, i) => (
            <li key={i}>{new Date(t.timestamp).toLocaleString()}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4>Multiple Face Events</h4>
        <ul>
          {submission.multipleFaceLogs.map((m, i) => (
            <li key={i}>
              From {new Date(m.startTime).toLocaleTimeString()} to{" "}
              {new Date(m.endTime).toLocaleTimeString()} | Duration: {m.duration}s
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
