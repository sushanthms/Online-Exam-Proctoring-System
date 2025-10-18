import React, { useEffect, useState, useRef } from "react";
import * as faceapi from "face-api.js";
import { useNavigate } from "react-router-dom";
import "../styles.css";

export default function ExamPage({ user, onLogout }) {
  const videoRef = useRef(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [logs, setLogs] = useState([]);
  const [paper, setPaper] = useState(null);
  const [answers, setAnswers] = useState([]);
  const multipleFaceActive = useRef(false);
  const startTimeRef = useRef(null);
  const navigate = useNavigate();

  // --- Load exam paper & models ---
  useEffect(() => {
    const loadModelsAndExam = async () => {
      try {
        const MODEL_URL = process.env.PUBLIC_URL + "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

        // Fetch exam paper
       const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:4000/api'}/exam/paper`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
        const data = await res.json();
        console.log("Exam paper fetched:", data);

        if (!data || !data.questions || !data.questions.length) {
          throw new Error("No questions returned from server");
        }

        setPaper(data);
        setAnswers(new Array(data.questions.length).fill(null));

        // Start camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Failed to load exam:", err);
        alert("Failed to load exam. Please check console for details.");
      }
    };

    loadModelsAndExam();
  }, []);

  // --- Tab switch detection ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) setTabSwitchCount((prev) => prev + 1);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (tabSwitchCount === 2 && !warningShown) {
      alert("⚠️ Warning: You switched tabs! One more switch will auto-submit your exam.");
      setWarningShown(true);
    } else if (tabSwitchCount >= 3) {
      alert("❌ You switched tabs too many times. Your exam will be auto-submitted now.");
      handleSubmit();
    }
  }, [tabSwitchCount]);

  // --- Timer countdown ---
  useEffect(() => {
    if (timeLeft <= 0) {
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
          setLogs((prev) => [...prev, `Multiple faces started at ${startTime.toLocaleTimeString()}`]);
        }

        // Send event to backend
        try {
await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:4000/api'}/exam/proctor-event`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              examId: paper.examId || paper._id,
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
  }, [paper]);

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

  // Confirm submission
  const confirmSubmit = window.confirm("Are you sure you want to submit your exam?");
  if (!confirmSubmit) return;

  try {
    console.log("Submitting exam...", {
      userId: user._id,
      examId: paper.examId || paper._id,
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
        examId: paper.examId || paper._id,
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
      // Navigate to result page
      navigate(`/result/${data.submissionId}`);
    } else {
      throw new Error("No submission ID returned");
    }
  } catch (error) {
    console.error("Submit error:", error);
    alert("❌ Failed to submit exam. Please try again or contact support.");
  }
};

  if (!paper || !paper.questions) return <div>Loading exam...</div>;

  return (
    <div className="container exam-page">
      <div className="exam-header">
        <h2>Online Exam Portal</h2>
        <div className="timer">⏱️ Time Left: {formatTime(timeLeft)}</div>
      </div>

      <div className="exam-body">
        <div className="exam-content">
          {paper.questions?.map((q, i) => (
            <div key={i} className="question">
              <h3>Q{i + 1}: {q.text}</h3>
              <div className="options">
                {q.options?.map((opt, idx) => (
                  <label key={idx}>
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
          <button onClick={handleSubmit}>Submit Exam</button>
        </div>

        <div className="camera-preview">
          <video ref={videoRef} autoPlay muted style={{ width: "300px", borderRadius: "8px" }} />
          <p>Camera Monitoring Active 🎥</p>
        </div>

        <div>
          <h3>Face Detection Logs:</h3>
          <ul>
            {logs.map((log, i) => (
              <li key={i}>{log}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
