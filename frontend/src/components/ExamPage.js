import React, { useEffect, useState, useRef } from "react";
import * as faceapi from "face-api.js";
import { useNavigate, useParams } from "react-router-dom";
import "./ExamPage.css";

export default function ExamPage({ user, onLogout }) {
  const { examId } = useParams();
  const videoRef = useRef(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [logs, setLogs] = useState([]);
  const [paper, setPaper] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const multipleFaceActive = useRef(false);
  const startTimeRef = useRef(null);
  const isSubmitting = useRef(false);
  const navigate = useNavigate();

  // --- Load exam paper & models ---
  useEffect(() => {
    const loadModelsAndExam = async () => {
      try {
        const MODEL_URL = process.env.PUBLIC_URL + "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

        const res = await fetch(`http://localhost:4000/api/exam/paper/${examId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
        const data = await res.json();

        if (!data || !data.questions || !data.questions.length) {
          throw new Error("No questions returned from server");
        }

        setPaper(data);
        setAnswers(new Array(data.questions.length).fill(null));
        setTimeLeft((data.durationMins || 10) * 60);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Failed to load exam:", err);
        alert("Failed to load exam. Returning to dashboard.");
        if (user?.role === "student") navigate("/student/dashboard");
        else if (user?.role === "admin") navigate("/admin/dashboard");
        else navigate("/");
      }
    };

    loadModelsAndExam();
  }, [examId, navigate, user]);

  // --- Tab switch detection ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) setTabSwitchCount((prev) => prev + 1);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // --- Tab switch warnings ---
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
      try {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());

        if (detections.length > 1) {
          if (!multipleFaceActive.current) {
            multipleFaceActive.current = true;
            startTimeRef.current = new Date();
            setLogs((prev) => [...prev, `Multiple faces started at ${startTimeRef.current.toLocaleTimeString()}`]);
          }

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
        } else if (multipleFaceActive.current) {
          multipleFaceActive.current = false;
          const endTime = new Date();
          const duration = Math.round((endTime - startTimeRef.current) / 1000);
          setLogs((prev) => [...prev, `Multiple faces ended at ${endTime.toLocaleTimeString()} (Duration: ${duration}s)`]);
        }
      } catch (error) {
        console.error("Face detection error:", error);
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
    if (isSubmitting.current) return;
    if (!paper) { alert("Exam data not loaded!"); return; }

    if (tabSwitchCount < 3 && timeLeft > 0) {
      if (!window.confirm("Are you sure you want to submit your exam?")) return;
    }

    isSubmitting.current = true;

    try {
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

      if (!response.ok) throw new Error(`Submit failed: ${response.status}`);
      const data = await response.json();

      if (data.submissionId) navigate(`/result/${data.submissionId}`);
      else throw new Error("No submission ID returned");
    } catch (error) {
      console.error("Submit error:", error);
      alert("❌ Failed to submit exam. Please try again.");
      isSubmitting.current = false;
    }
  };

  if (!paper || !paper.questions) {
    return (
      <div className="exam-loading">
        <h3>Loading exam...</h3>
        <p>Please wait while we prepare your exam.</p>
      </div>
    );
  }

  const question = paper.questions[currentQ];

  return (
    <div className="exam-page">
      <button 
        onClick={() => {
          if (window.confirm("Are you sure you want to exit? Your progress will be lost!")) {
            if (user.role === "student") navigate("/student/dashboard");
            else if (user.role === "admin") navigate("/admin/dashboard");
            else navigate("/");
          }
        }}
        className="exam-back-btn"
      >
        ← Back to Dashboard
      </button>

      <div className="exam-body">
        <div className="exam-main-content">
          {/* Progress Indicator */}
          <div className="exam-progress">
            Question {currentQ + 1} of {paper.questions.length}
          </div>

          <div className="exam-question">
            <h3>Q{currentQ + 1}: {question.text}</h3>
            <div className="exam-options">
              {question.options.map((opt, idx) => (
                <label 
                  key={idx} 
                  className={`exam-option-label ${answers[currentQ] === idx ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={`q${currentQ}`}
                    checked={answers[currentQ] === idx}
                    onChange={() => handleAnswerChange(currentQ, idx)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className="exam-nav-buttons">
            {currentQ > 0 && (
              <button onClick={() => setCurrentQ(currentQ - 1)} className="exam-prev-btn">⬅️ Previous</button>
            )}
            {currentQ < paper.questions.length - 1 ? (
              <button onClick={() => setCurrentQ(currentQ + 1)} className="exam-next-btn">Next ➡️</button>
            ) : (
              <button onClick={handleSubmit} className="exam-submit-btn" disabled={isSubmitting.current}>
                {isSubmitting.current ? '⏳ Submitting...' : '🚀 Submit Exam'}
              </button>
            )}
          </div>
        </div>

        <div className="exam-sidebar">
          <div className="exam-camera-preview">
            <h4>📷 Camera Monitor</h4>
            <video ref={videoRef} autoPlay muted style={{ width: "100%", maxWidth: "300px" }} />
            <p className="exam-camera-status">🎥 Camera Active</p>
          </div>

          <div className="exam-face-logs">
            <h4>👀 Face Detection Logs</h4>
            {logs.length > 0 ? (
              <ul>
                {logs.map((log, i) => <li key={i}>{log}</li>)}
              </ul>
            ) : (
              <p className="exam-face-logs-empty">✅ No issues detected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
