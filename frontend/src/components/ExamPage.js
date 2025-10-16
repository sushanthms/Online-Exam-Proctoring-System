import React, { useEffect, useState, useRef } from "react";
import * as faceapi from "face-api.js";
import "../styles.css";

export default function ExamPage({ user, onLogout }) {
  const videoRef = useRef(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [logs, setLogs] = useState([]);
  const multipleFaceActive = useRef(false); // track if multiple face detection is active
  const startTimeRef = useRef(null); // start time of multiple faces

  // --- Camera setup ---
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      startVideo();
    };

    const startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch((err) => console.error("Camera error:", err));
    };

    loadModels();
  }, []);

  // --- Tab switch detection ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) setTabSwitchCount((prev) => prev + 1);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // --- Handle warning / auto-submit ---
  useEffect(() => {
    if (tabSwitchCount === 2 && !warningShown) {
      alert("⚠️ Warning: You switched tabs! One more switch will auto-submit your exam.");
      setWarningShown(true);
    } else if (tabSwitchCount >= 3) {
      alert("❌ You switched tabs too many times. Your exam will be auto-submitted now.");
      handleAutoSubmit();
    }
  }, [tabSwitchCount]);

  // --- Timer countdown ---
  useEffect(() => {
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // --- Multiple face detection ---
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!videoRef.current) return;

      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      );

      if (detections.length > 1) {
        // Multiple faces detected
        if (!multipleFaceActive.current) {
          multipleFaceActive.current = true;
          const startTime = new Date();
          startTimeRef.current = startTime;
          setLogs((prev) => [...prev, `Multiple faces started at ${startTime.toLocaleTimeString()}`]);
        }
      } else {
        // No multiple faces
        if (multipleFaceActive.current) {
          multipleFaceActive.current = false;
          const endTime = new Date();
          const duration = Math.round((endTime - startTimeRef.current) / 1000);
          setLogs((prev) => [
            ...prev,
            `Multiple faces ended at ${endTime.toLocaleTimeString()} (Duration: ${duration}s)`
          ]);

          // Send log to backend
          fetch("/api/logMultipleFace", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user._id,
              username: user.name,
              startTime: startTimeRef.current,
              endTime,
              duration,
            }),
          }).catch((err) => console.error("Error sending multiple face log:", err));
        }
      }
    }, 2000); // check every 2 seconds

    return () => clearInterval(interval);
  }, [user]);

  const handleAutoSubmit = () => {
    alert("Your exam has been auto-submitted!");
    window.location.href = "/";
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div className="container exam-page">
      <div className="exam-header">
        <h2>Online Exam Portal</h2>
        <div className="timer">⏱️ Time Left: {formatTime(timeLeft)}</div>
      </div>

      <div className="exam-body">
        <div className="exam-content">
          <div className="question">
            <h3>Question 1:</h3>
            <p>What is the primary function of React.js?</p>
            <div className="options">
              <label><input type="radio" name="q1" /> Building APIs</label>
              <label><input type="radio" name="q1" /> Managing Databases</label>
              <label><input type="radio" name="q1" /> Building User Interfaces</label>
              <label><input type="radio" name="q1" /> Hosting Websites</label>
            </div>
          </div>
          <button onClick={handleAutoSubmit}>Submit Exam</button>
        </div>

        <div className="camera-preview">
          <video
            ref={videoRef}
            autoPlay
            muted
            style={{ width: "300px", borderRadius: "8px" }}
          ></video>
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
