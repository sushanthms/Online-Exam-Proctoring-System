import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ExamCreator.css";

export default function ExamCreator({ user }) {
  const [title, setTitle] = useState("");
  const [durationMins, setDurationMins] = useState(30);
  const [questions, setQuestions] = useState([
    {
      text: "",
      options: ["", "", "", ""],
      correctOption: 0,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        options: ["", "", "", ""],
        correctOption: 0,
      },
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) {
      alert("You must have at least one question");
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCorrectOptionChange = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correctOption = oIndex;
    setQuestions(newQuestions);
  };

  const validateExam = () => {
    if (!title.trim()) {
      alert("Please enter an exam title");
      return false;
    }

    if (durationMins < 1) {
      alert("Duration must be at least 1 minute");
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.text.trim()) {
        alert(`Please enter text for question ${i + 1}`);
        return false;
      }

      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          alert(`Please fill in option ${j + 1} for question ${i + 1}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateExam()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/admin/exam/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          durationMins,
          questions,
        }),
      });

      if (response.ok) {
        alert("✅ Exam created successfully!");
        navigate("/admin/dashboard");
      } else {
        const data = await response.json();
        alert("❌ Failed to create exam: " + data.error);
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      alert("❌ Error creating exam");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="exam-creator-container">
      <div className="exam-creator-header">
        <button onClick={() => navigate("/admin/dashboard")} className="btn-back">
          ← Back to Dashboard
        </button>
        <h1>📝 Create New Exam</h1>
      </div>

      <form onSubmit={handleSubmit} className="exam-creator-form">
        {/* Basic Info */}
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label>Exam Title *</label>
            <input
              type="text"
              placeholder="e.g., JavaScript Fundamentals Quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Duration (minutes) *</label>
            <input
              type="number"
              min="1"
              max="180"
              placeholder="30"
              value={durationMins}
              onChange={(e) => setDurationMins(parseInt(e.target.value))}
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Questions */}
        <div className="form-section">
          <div className="questions-header">
            <h2>Questions ({questions.length})</h2>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="btn-add-question"
            >
              ➕ Add Question
            </button>
          </div>

          {questions.map((question, qIndex) => (
            <div key={qIndex} className="question-card">
              <div className="question-header">
                <h3>Question {qIndex + 1}</h3>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="btn-remove"
                  >
                    🗑️ Remove
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Question Text *</label>
                <textarea
                  placeholder="Enter your question here..."
                  value={question.text}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, "text", e.target.value)
                  }
                  className="form-textarea"
                  rows="3"
                  required
                />
              </div>

              <div className="options-section">
                <label>Options *</label>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="option-row">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={question.correctOption === oIndex}
                      onChange={() => handleCorrectOptionChange(qIndex, oIndex)}
                      className="radio-input"
                    />
                    <input
                      type="text"
                      placeholder={`Option ${oIndex + 1}`}
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(qIndex, oIndex, e.target.value)
                      }
                      className="form-input option-input"
                      required
                    />
                    {question.correctOption === oIndex && (
                      <span className="correct-indicator">✓ Correct</span>
                    )}
                  </div>
                ))}
                <p className="helper-text">
                  💡 Select the radio button to mark the correct answer
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="btn-cancel"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "✓ Create Exam"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ExamCreator.css
/* Add this to a new file: frontend/src/components/ExamCreator.css */