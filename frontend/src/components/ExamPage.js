import React, { useEffect, useState, useRef } from "react";
import "../styles.css";

export default function ExamPage({ user, onLogout }) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const videoRef = useRef(null); // reference to video element

  // --- Camera setup ---
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }
    startCamera();
  }, []);

  // --- Tab switch detection ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) setTabSwitchCount(prev => prev + 1);
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

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleAutoSubmit = () => {
    alert("Your exam has been auto-submitted!");
    window.location.href = "/";
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
              <label className="option-label"><input type="radio" name="q1" /> Building APIs</label>
              <label className="option-label"><input type="radio" name="q1" /> Managing Databases</label>
              <label className="option-label"><input type="radio" name="q1" /> Building User Interfaces</label>
              <label className="option-label"><input type="radio" name="q1" /> Hosting Websites</label>
            </div>
          </div>

          <button onClick={handleAutoSubmit}>Submit Exam</button>
        </div>

        <div className="camera-preview">
          <video ref={videoRef} autoPlay muted style={{ width: "300px", borderRadius: "8px" }}></video>
          <p>Camera Monitoring Active 🎥</p>
        </div>
      </div>
    </div>
  );
}
