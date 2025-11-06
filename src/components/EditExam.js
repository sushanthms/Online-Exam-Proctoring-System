// frontend/src/components/EditExam.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ExamCreator.css"; // Reuse the same styles as ExamCreator
import "./EditExam.css"; // Additional styles specific to EditExam

export default function EditExam({ user }) {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  // Initialize state with default values
  const [title, setTitle] = useState("");
  const [durationMins, setDurationMins] = useState(30);
  const [questions, setQuestions] = useState([
    {
      text: "",
      imageUrl: "",
      options: ["", "", "", ""],
      correctOption: 0,
    },
  ]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the exam data when component mounts
    const fetchExam = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:4000/api/admin/exam/${examId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch exam");
        }

        const data = await response.json();
        const exam = data.exam;
        
        // Set the form state with the fetched exam data
        setTitle(exam.title);
        setDurationMins(exam.durationMins);
        setQuestions(exam.questions);
        setIsActive(exam.isActive);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching exam:", error);
        setError("Failed to load exam. Please try again.");
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

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

    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      // Clean up and prepare questions data before sending to backend
      const cleanedQuestions = questions.map(q => {
        // Create a new object without imageFile property
        const { imageFile, ...cleanQuestion } = q;
        
        // Ensure imageUrl is properly formatted or null
        if (cleanQuestion.imageUrl) {
          // Check if it's already a valid string
          if (typeof cleanQuestion.imageUrl !== 'string' || 
              (!cleanQuestion.imageUrl.startsWith('data:image/') && 
               !cleanQuestion.imageUrl.startsWith('http'))) {
            cleanQuestion.imageUrl = null;
          }
        }
        
        return cleanQuestion;
      });

      console.log("Sending data to backend:", JSON.stringify({
        title,
        durationMins,
        questions: cleanedQuestions,
        isActive,
      }).substring(0, 200) + "...");

      const response = await fetch(`http://localhost:4000/api/admin/exam/${examId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          durationMins,
          questions: cleanedQuestions,
          isActive,
        }),
      });

      if (response.ok) {
        alert("✅ Exam updated successfully!");
        navigate("/admin/dashboard");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update exam");
        alert("❌ Failed to update exam: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating exam:", error);
      const errorMessage = error.message || "Unknown error";
      setError(`Network error while updating exam: ${errorMessage}`);
      alert(`❌ Error updating exam: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="exam-creator-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <p className="loading-text">Loading exam data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-creator-container">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <div className="error-message">{error}</div>
          <button onClick={() => navigate("/admin/dashboard")} className="btn-back">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-creator-container">
      <div className="exam-creator-header">
        <button onClick={() => navigate("/admin/dashboard")} className="btn-back">
          ← Back to Dashboard
        </button>
        <h1>📝 Edit Exam</h1>
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

          <div className="form-group">
            <label>Exam Status</label>
            <div className="toggle-container">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className={`status-label ${isActive ? "active" : "inactive"}`}>
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
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
              + Add Question
            </button>
          </div>

          {questions.map((question, qIndex) => (
            <div key={qIndex} className="question-card">
              <div className="question-header">
                <h3>Question {qIndex + 1}</h3>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIndex)}
                  className="btn-remove-question"
                >
                  <span className="remove-icon">×</span> Remove
                </button>
              </div>

              <div className="form-group">
                <label>Question Text *</label>
                <textarea
                  value={question.text}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, "text", e.target.value)
                  }
                  className="form-input"
                  placeholder="Enter your question here"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Question Image (Optional)</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          try {
                            // Store image as base64 string
                            const base64String = reader.result;
                            // Limit the size of the base64 string to prevent payload size issues
                            if (base64String.length > 1000000) { // ~1MB limit
                              alert("Image is too large. Please choose a smaller image (less than 1MB).");
                              return;
                            }
                            handleQuestionChange(qIndex, "imageUrl", base64String);
                          } catch (error) {
                            console.error("Error processing image:", error);
                            alert("Error processing image. Please try a different image.");
                          }
                        };
                        reader.onerror = () => {
                          console.error("Error reading file");
                          alert("Error reading file. Please try again.");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="form-input"
                  />
                </div>
                {question.imageUrl && (
                  <div className="image-preview">
                    <img 
                      src={question.imageUrl} 
                      alt="Question" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/400x200?text=Invalid+Image+URL";
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="options-container">
                <label>Options *</label>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="option-row">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={question.correctOption === oIndex}
                      onChange={() => handleCorrectOptionChange(qIndex, oIndex)}
                      className="option-radio"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(qIndex, oIndex, e.target.value)
                      }
                      className="form-input option-input"
                      placeholder={`Option ${oIndex + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"} {saving && <span className="spinner-small"></span>}
          </button>
        </div>
      </form>
    </div>
  );
}