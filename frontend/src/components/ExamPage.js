import React, { useEffect, useState, useRef } from "react";
import * as faceapi from "face-api.js";
import { useNavigate, useParams } from "react-router-dom";
import "../styles.css";

export default function ExamPage({ user, onLogout }) {
  const { examId } = useParams(); // Get examId from URL
  const videoRef = useRef(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [logs, setLogs] = useState([]);
  const [paper, setPaper] = useState(null);
  const [answers, setAnswers] = useState([]);
  const multipleFaceActive = useRef(false);
  const startTimeRef = useRef(null);
  const navigate = useNavigate();

  // Add to ExamPage.js component
const [currentQuestion, setCurrentQuestion] = useState(0);
const [showSummary, setShowSummary] = useState(false);

// Add progress calculation
const answeredCount = answers.filter(a => a !== null).length;
const progressPercentage = (answeredCount / (paper?.questions?.length || 1)) * 100;

// Add navigation functions
const goToQuestion = (index) => {
  setCurrentQuestion(index);
  setShowSummary(false);
};

const nextQuestion = () => {
  if (currentQuestion < paper.questions.length - 1) {
    setCurrentQuestion(currentQuestion + 1);
  } else {
    setShowSummary(true);
  }
};

const previousQuestion = () => {
  if (currentQuestion > 0) {
    setCurrentQuestion(currentQuestion - 1);
  }
  setShowSummary(false);
};
  // --- Load exam paper & models ---
  useEffect(() => {
    const loadModelsAndExam = async () => {
      try {
        const MODEL_URL = process.env.PUBLIC_URL + "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

        // Fetch specific exam paper using examId
        const res = await fetch(
          `http://localhost:4000/api/exam/paper/${examId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );

        if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
        const data = await res.json();
        console.log("Exam paper fetched:", data);

        if (!data || !data.questions || !data.questions.length) {
          throw new Error("No questions returned from server");
        }

        setPaper(data);
        setAnswers(new Array(data.questions.length).fill(null));
        setTimeLeft((data.durationMins || 10) * 60); // Set duration from exam

        // Start camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Failed to load exam:", err);
        alert("Failed to load exam. Returning to home.");
        navigate("/home");
      }
    };

    loadModelsAndExam();
  }, [examId, navigate]);

  // --- Tab switch detection ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // --- Tab switch warnings and auto-submit ---
  useEffect(() => {
    if (tabSwitchCount === 2 && !warningShown) {
      alert("⚠️ Warning: You switched tabs! One more switch will auto-submit your exam.");
      setWarningShown(true);
    } else if (tabSwitchCount >= 3) {
      alert("❌ You switched tabs too many times. Your exam will be auto-submitted now.");
      handleSubmit();
    }
  }, [tabSwitchCount, warningShown]);

  // --- Timer countdown ---
  useEffect(() => {
    if (timeLeft <= 0) {
      alert("⏰ Time's up! Your exam will be auto-submitted.");
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // --- Multiple face detection ---
  useEffect(() => {
    if (!paper) return;

    const interval = setInterval(async () => {
      if (!videoRef.current) return;

      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      );

      if (detections.length > 1) {
        if (!multipleFaceActive.current) {
          multipleFaceActive.current = true;
          const startTime = new Date();
          startTimeRef.current = startTime;
          setLogs((prev) => [
            ...prev,
            `Multiple faces started at ${startTime.toLocaleTimeString()}`
          ]);
        }

        // Send event to backend
        try {
          await fetch("http://localhost:4000/api/exam/proctor-event", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              examId: examId,
              type: "multiple-face",
              data: { message: `Detected ${detections.length} faces` },
            }),
          });
        } catch (err) {
          console.error("Error sending multiple face log:", err);
        }
      } else if (multipleFaceActive.current) {
        multipleFaceActive.current = false;
        const endTime = new Date();
        const duration = Math.round((endTime - startTimeRef.current) / 1000);
        setLogs((prev) => [
          ...prev,
          `Multiple faces ended at ${endTime.toLocaleTimeString()} (Duration: ${duration}s)`,
        ]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paper, examId]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!paper) {
      alert("Exam data not loaded!");
      return;
    }

    // Prevent multiple submissions
    if (handleSubmit.isSubmitting) return;
    handleSubmit.isSubmitting = true;

    const confirmSubmit = window.confirm("Are you sure you want to submit your exam?");
    if (!confirmSubmit) {
      handleSubmit.isSubmitting = false;
      return;
    }

    try {
      console.log("Submitting exam...", {
        userId: user._id,
        examId: examId,
        answers: answers
      });

      const response = await fetch("http://localhost:4000/api/exam/submit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          userId: user._id,
          examId: examId,
          answers: answers,
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Submit failed:", errorText);
        throw new Error(`Submit failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Submit response:", data);

      if (data.submissionId) {
        alert("✅ Exam submitted successfully!");
        navigate(`/result/${data.submissionId}`);
      } else {
        throw new Error("No submission ID returned");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("❌ Failed to submit exam. Please try again or contact support.");
      handleSubmit.isSubmitting = false;
    }
  };

  if (!paper || !paper.questions) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "3rem" }}>
        <h3>Loading exam...</h3>
        <p>Please wait while we prepare your exam.</p>
      </div>
    );
  }

  return (
    <div className="container exam-page">
      {/* Back button */}
      <button 
        onClick={() => {
          if (window.confirm("Are you sure you want to exit? Your progress will be lost!")) {
            navigate("/home");
          }
        }}
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          background: "#f44336",
          color: "white",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "600",
          zIndex: 1000
        }}
      >
        ← Back to Home
      </button>

      <div className="exam-header">
        <h2>📝 {paper.title || "Online Exam"}</h2>
        <div className="timer">⏱️ Time Left: {formatTime(timeLeft)}</div>
      </div>

// Add this inside your ExamPage return statement, after the header

<div className="progress-section">
  <div className="progress-bar-container">
    <div 
      className="progress-bar-fill" 
      style={{ width: `${progressPercentage}%` }}
    >
      <span className="progress-text">
        {answeredCount}/{paper.questions.length} Answered
      </span>
    </div>
  </div>
  
  <div className="question-navigator">
    <h4>Question Navigator</h4>
    <div className="question-grid">
      {paper.questions.map((_, index) => (
        <button
          key={index}
          className={`question-dot ${answers[index] !== null ? 'answered' : ''} ${currentQuestion === index ? 'active' : ''}`}
          onClick={() => goToQuestion(index)}
        >
          {index + 1}
        </button>
      ))}
    </div>
  </div>
</div>


      <div className="exam-body">
        <div className="exam-content">
          <div style={{ marginBottom: "1rem", color: "#666" }}>
            <p><strong>Instructions:</strong> Select one answer for each question</p>
            <p style={{ color: "#f44336", fontWeight: "bold" }}>
              Tab Switches: {tabSwitchCount}/3 
              {tabSwitchCount >= 2 && " ⚠️ Warning!"}
            </p>
          </div>

          {paper.questions?.map((q, i) => (
            <div key={i} className="question">
              <h3>Q{i + 1}: {q.text}</h3>
              <div className="options">
                {q.options?.map((opt, idx) => (
                  <label key={idx} className="option-label">
                    <input
                      type="radio"
                      name={`q${i}`}
                      checked={answers[i] === idx}
                      onChange={() => handleAnswerChange(i, idx)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
          
          <button 
            onClick={handleSubmit}
            style={{
              marginTop: "2rem",
              width: "100%",
              padding: "1rem",
              fontSize: "1.1rem"
            }}
          >
            🚀 Submit Exam
          </button>
        </div>

        <div className="sidebar">
          <div className="camera-preview">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              style={{ 
                width: "100%", 
                maxWidth: "300px",
                borderRadius: "8px",
                border: "2px solid #1976d2"
              }} 
            />
            <p style={{ marginTop: "0.5rem", fontWeight: "600" }}>
              🎥 Camera Monitoring Active
            </p>
          </div>

          <div style={{ marginTop: "2rem" }}>
            <h3 style={{ color: "#0d47a1" }}>👀 Face Detection Logs:</h3>
            {logs.length > 0 ? (
              <ul style={{ 
                maxHeight: "200px", 
                overflowY: "auto",
                padding: "1rem",
                background: "#fff3e0",
                borderRadius: "8px"
              }}>
                {logs.map((log, i) => (
                  <li key={i} style={{ marginBottom: "0.5rem", color: "#e65100" }}>
                    {log}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "#4caf50", fontWeight: "600" }}>
                ✅ No issues detected
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}