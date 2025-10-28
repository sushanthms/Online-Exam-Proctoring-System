// =============================================
// ExamPage.js - Complete and Fixed Version
// =============================================

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

  const [registeredDescriptor, setRegisteredDescriptor] = useState(null);
  const [faceVerificationStatus, setFaceVerificationStatus] = useState("loading");
  const [verificationFailures, setVerificationFailures] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const multipleFaceActive = useRef(false);
  const startTimeRef = useRef(null);
  const isSubmitting = useRef(false);
  const verificationInterval = useRef(null);
  const navigate = useNavigate();

  // ✅ Stop camera utility
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      console.log("🛑 Camera stopped");
    }
  };

  // ✅ Load registered face descriptor
  useEffect(() => {
    loadRegisteredFace();
  }, []);

  const loadRegisteredFace = async () => {
    try {
      console.log("🔄 Loading registered face descriptor...");
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/auth/face-descriptor", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.faceDescriptor && Array.isArray(data.faceDescriptor) && data.faceDescriptor.length === 128) {
          setRegisteredDescriptor(new Float32Array(data.faceDescriptor));
          setFaceVerificationStatus("ready");
          console.log("✅ Face verification system ready!");
        } else {
          alert("Invalid face descriptor. Please re-register your face.");
          navigate("/face-registration");
        }
      } else {
        alert("⚠️ Please register your face before taking exams!");
        navigate("/face-registration");
      }
    } catch (error) {
      console.error("❌ Error loading face descriptor:", error);
      setFaceVerificationStatus("error");
      alert("Failed to load face verification. Please try again.");
    }
  };

  // ✅ Load exam paper & models
  useEffect(() => {
    const loadModelsAndExam = async () => {
      try {
        console.log("🔄 Loading models...");
        const MODEL_URL = process.env.PUBLIC_URL + "/models";

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setModelsLoaded(true);

        const res = await fetch(`http://localhost:4000/api/exam/paper/${examId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();

        if (!data?.questions?.length) throw new Error("No questions in exam");

        setPaper(data);
        setAnswers(new Array(data.questions.length).fill(null));
        setTimeLeft((data.durationMins || 10) * 60);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("❌ Setup failed:", err);
        alert(`Failed to load exam: ${err.message}`);
        navigate("/student/dashboard");
      }
    };

    loadModelsAndExam();
    return () => stopCamera(); // ✅ Cleanup on unmount
  }, [examId, navigate]);

  // ✅ Face verification monitoring
  useEffect(() => {
    if (!paper || !registeredDescriptor || !modelsLoaded) return;

    verificationInterval.current = setInterval(async () => {
      await verifyFaceIdentity();
    }, 5000);

    setTimeout(() => verifyFaceIdentity(), 2000);

    return () => {
      clearInterval(verificationInterval.current);
      console.log("🛑 Stopped face verification");
    };
  }, [paper, registeredDescriptor, modelsLoaded]);

  const verifyFaceIdentity = async () => {
    if (!videoRef.current || !registeredDescriptor) return;

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setLogs(prev => [...prev, `⚠️ No face at ${new Date().toLocaleTimeString()}`]);
        return;
      }

      const distance = faceapi.euclideanDistance(registeredDescriptor, detection.descriptor);
      const isMatch = distance < 0.6;
      const confidence = Math.max(0, 1 - distance);

      if (isMatch) {
        setFaceVerificationStatus("verified");
      } else {
        const newCount = verificationFailures + 1;
        setVerificationFailures(newCount);
        alert(`🚨 Identity mismatch detected! Attempt ${newCount} of 3.`);
        if (newCount >= 3) {
          alert("🚨 Too many mismatches. Auto-submitting exam...");
          handleSubmit();
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
    }
  };

  // ✅ Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) setTabSwitchCount(prev => prev + 1);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // ✅ Tab warning logic
  useEffect(() => {
    if (tabSwitchCount === 2 && !warningShown) {
      alert("⚠️ Warning: You switched tabs! One more switch will auto-submit your exam.");
      setWarningShown(true);
    } else if (tabSwitchCount >= 3) {
      alert("❌ Too many tab switches. Auto-submitting your exam...");
      handleSubmit();
    }
  }, [tabSwitchCount, warningShown]);

  // ✅ Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      alert("⏰ Time’s up! Auto-submitting your exam...");
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // ✅ Multiple face detection
  useEffect(() => {
    if (!paper) return;
    const interval = setInterval(async () => {
      if (!videoRef.current) return;
      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );
        if (detections.length > 1) {
          if (!multipleFaceActive.current) {
            multipleFaceActive.current = true;
            startTimeRef.current = new Date();
            setLogs(prev => [...prev, `Multiple faces detected at ${startTimeRef.current.toLocaleTimeString()}`]);
          }
        } else if (multipleFaceActive.current) {
          multipleFaceActive.current = false;
          const endTime = new Date();
          const duration = Math.round((endTime - startTimeRef.current) / 1000);
          setLogs(prev => [...prev, `Multiple faces ended at ${endTime.toLocaleTimeString()} (${duration}s)`]);
        }
      } catch (err) {
        console.error("Face detection error:", err);
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

  // ✅ Submit handler (corrected)
  const handleSubmit = async () => {
    if (isSubmitting.current) return;
    if (!paper) return alert("Exam not loaded!");

    if (tabSwitchCount < 3 && timeLeft > 0) {
      if (!window.confirm("Are you sure you want to submit?")) return;
    }

    isSubmitting.current = true;

    try {
      const response = await fetch("http://localhost:4000/api/exam/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId: user._id,
          examId,
          answers,
        }),
      });

      if (!response.ok) throw new Error(`Submit failed: ${response.status}`);
      const data = await response.json();

      if (data.submissionId) {
        stopCamera();
        navigate(`/result/${data.submissionId}`);
      } else {
        throw new Error("No submission ID returned");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("❌ Failed to submit exam. Try again.");
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
      <div className="debug-info">
        Models: {modelsLoaded ? "✅" : "❌"} | Descriptor: {registeredDescriptor ? "✅" : "❌"} | Status: {faceVerificationStatus} | Failures: {verificationFailures}/3
      </div>

      <button
        onClick={() => {
          if (window.confirm("Exit exam? Progress will be lost!")) {
            stopCamera();
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
          <div className="exam-progress">
            Question {currentQ + 1} of {paper.questions.length}
          </div>

          <div className="exam-question">
            <h3>
              Q{currentQ + 1}: {question.text}
            </h3>
            <div className="exam-options">
              {question.options.map((opt, idx) => (
                <label
                  key={idx}
                  className={`exam-option-label ${answers[currentQ] === opt ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name={`q${currentQ}`}
                    checked={answers[currentQ] === opt}
                    onChange={() => handleAnswerChange(currentQ, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className="exam-nav-buttons">
            {currentQ > 0 && (
              <button onClick={() => setCurrentQ(currentQ - 1)} className="exam-prev-btn">
                ⬅️ Previous
              </button>
            )}
            {currentQ < paper.questions.length - 1 ? (
              <button onClick={() => setCurrentQ(currentQ + 1)} className="exam-next-btn">
                Next ➡️
              </button>
            ) : (
              <button onClick={handleSubmit} className="exam-submit-btn" disabled={isSubmitting.current}>
                {isSubmitting.current ? "⏳ Submitting..." : "🚀 Submit Exam"}
              </button>
            )}
          </div>
        </div>

        <div className="exam-sidebar">
          <div className="exam-camera-preview">
            <h4>📷 Camera Monitor</h4>
            <video ref={videoRef} autoPlay muted style={{ width: "100%", maxWidth: "300px" }} />
            <p>🎥 Camera Active</p>
          </div>

          <div className="exam-face-logs">
            <h4>👀 Face Detection Logs</h4>
            {logs.length > 0 ? (
              <ul>
                {logs.map((log, i) => (
                  <li key={i}>{log}</li>
                ))}
              </ul>
            ) : (
              <p>✅ No issues detected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
