import React, { useState, useEffect } from "react";
import api from "../api";
import "./CodingTestPage.css";

const LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "cpp", label: "C++" },
];

function CodingTestPage({ examId, questionId }) {
  const [question, setQuestion] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get(`/coding/questions/${questionId}`)
      .then((res) => setQuestion(res.data))
      .catch(() => alert("Failed to load question"));
  }, [questionId]);

  const runCode = async () => {
    setLoading(true);
    try {
      const res = await api.post("/coding/run", {
        language,
        code,
        testCases: question.testCases,
      });
      setOutput(res.data.output);
    } catch (err) {
      setOutput("Error running code");
    }
    setLoading(false);
  };

  const submitSolution = async () => {
    try {
      await api.post("/coding/submit", {
        questionId,
        examId,
        code,
        language,
      });
      alert("Solution submitted!");
    } catch {
      alert("Submission failed");
    }
  };

  if (!question) return <div>Loading...</div>;

  return (
    <div className="coding-test-page">
      <h2>{question.title}</h2>
      <p className="desc">{question.description}</p>

      <label>Choose Language:</label>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        {LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.label}
          </option>
        ))}
      </select>

      <textarea
        className="code-editor"
        placeholder="Write your code here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button className="run-btn" onClick={runCode} disabled={loading}>
        {loading ? "Running..." : "Run Code"}
      </button>

      <h3>Output:</h3>
      <pre className="output">{output}</pre>

      <button className="submit-btn" onClick={submitSolution}>
        Submit Solution
      </button>
    </div>
  );
}

export default CodingTestPage;
