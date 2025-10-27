// ExamPage.js
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
  const [answers, setAnswers] = useState([]); // will store option text values (strings)
  const [currentQ, setCurrentQ] = useState(0);

  const [registeredDescriptor, setRegisteredDescriptor] = useState(null);
  const [faceVerificationStatus, setFaceVerificationStatus] = useState("loading");
  const [verificationFailures, setVerificationFailures] = useState(0);
  const [lastVerificationTime, setLastVerificationTime] = useState(Date.now());
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const multipleFaceActive = useRef(false);
  const startTimeRef = useRef(null);
  const isSubmitting = useRef(false);
  const verificationInterval = useRef(null);
  const navigate = useNavigate();

  // Load registered face descriptor
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

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Received face descriptor, length:", data.faceDescriptor?.length);

        if (data.faceDescriptor && Array.isArray(data.faceDescriptor) && data.faceDescriptor.length === 128) {
          setRegisteredDescriptor(new Float32Array(data.faceDescriptor));
          setFaceVerificationStatus("ready");
          console.log("✅ Face verification system ready!");
        } else {
          console.error("❌ Invalid descriptor format or length");
          alert("Invalid face descriptor. Please re-register your face.");
          navigate("/face-registration");
        }
      } else {
        const errorData = await response.json();
        console.error("❌ Error:", errorData);
        alert("⚠️ Please register your face before taking exams!");
        navigate("/face-registration");
      }
    } catch (error) {
      console.error("❌ Error loading face descriptor:", error);
      setFaceVerificationStatus("error");
      alert("Failed to load face verification. Please try again.");
    }
  };

  // Load exam paper & models
  useEffect(() => {
    const loadModelsAndExam = async () => {
      try {
        console.log("🔄 Loading face detection models...");
        const MODEL_URL = process.env.PUBLIC_URL + "/models";

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        console.log("✅ Models loaded:");
        console.log("   - TinyFaceDetector:", faceapi.nets.tinyFaceDetector.isLoaded);
        console.log("   - FaceLandmark68:", faceapi.nets.faceLandmark68Net.isLoaded);
        console.log("   - FaceRecognition:", faceapi.nets.faceRecognitionNet.isLoaded);

        setModelsLoaded(true);

        const res = await fetch(`http://localhost:4000/api/exam/paper/${examId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();

        if (!data?.questions?.length) {
          throw new Error("No questions in exam");
        }

        setPaper(data);
        // Initialize answers array with nulls (we will store option text values)
        setAnswers(new Array(data.questions.length).fill(null));
        setTimeLeft((data.durationMins || 10) * 60);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log("✅ Camera started");
        }
      } catch (err) {
        console.error("❌ Setup failed:", err);
        alert(`Failed to load exam: ${err.message}`);
        navigate("/student/dashboard");
      }
    };

    loadModelsAndExam();
  }, [examId, navigate]);

  // Face Verification - Continuous monitoring
  useEffect(() => {
    if (!paper || !registeredDescriptor || !modelsLoaded) {
      console.log("⏳ Waiting for:", {
        paper: !!paper,
        registeredDescriptor: !!registeredDescriptor,
        modelsLoaded
      });
      return;
    }

    console.log("🚀 Starting face verification monitoring...");

    verificationInterval.current = setInterval(async () => {
      await verifyFaceIdentity();
    }, 5000); // Every 5 seconds

    // Initial verification
    setTimeout(() => verifyFaceIdentity(), 2000);

    return () => {
      if (verificationInterval.current) {
        clearInterval(verificationInterval.current);
        console.log("🛑 Stopped face verification");
      }
    };
  }, [paper, registeredDescriptor, modelsLoaded]);

  const verifyFaceIdentity = async () => {
    if (!videoRef.current || !registeredDescriptor) {
      console.warn("⚠️ Cannot verify - missing video or descriptor");
      return;
    }

    console.log("🔍 Verifying face identity...");

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        console.warn("⚠️ No face detected");
        logVerification("no_face", 0, "No face in frame");
        setLogs((prev) => [...prev, `⚠️ No face at ${new Date().toLocaleTimeString()}`]);
        return;
      }

      const distance = faceapi.euclideanDistance(registeredDescriptor, detection.descriptor);
      const threshold = 0.6;
      const isMatch = distance < threshold;
      const confidence = Math.max(0, 1 - distance);

      console.log("📊 Verification result:");
      console.log("   Distance:", distance.toFixed(4));
      console.log("   Threshold:", threshold);
      console.log("   Match:", isMatch);
      console.log("   Confidence:", (confidence * 100).toFixed(1) + "%");

      if (isMatch) {
        console.log("✅ VERIFIED");
        logVerification("verified", confidence, `Verified (d=${distance.toFixed(3)})`);
        setFaceVerificationStatus("verified");
        setLastVerificationTime(Date.now());
      } else {
        console.error("🚨 MISMATCH!");
        const newCount = verificationFailures + 1;
        setVerificationFailures(newCount);

        logVerification("failed", confidence, `Mismatch (d=${distance.toFixed(3)})`);

        setLogs((prev) => [
          ...prev,
          `🚨 MISMATCH #${newCount} at ${new Date().toLocaleTimeString()}`
        ]);

        alert(`🚨 IDENTITY MISMATCH DETECTED!\n\nThis is attempt ${newCount} of 3.\nDistance: ${distance.toFixed(3)}\nThreshold: ${threshold}\n\nPlease ensure you are the registered user!`);

        if (newCount >= 3) {
          alert("🚨 3 identity verification failures!\n\nExam will be auto-submitted.");
          handleSubmit();
        }
      }

    } catch (error) {
      console.error("❌ Verification error:", error);
    }
  };

  const logVerification = async (status, confidence, details) => {
    try {
      console.log("📝 Logging:", status, details);

      const response = await fetch("http://localhost:4000/api/exam/verify-face", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          examId,
          verificationStatus: status,
          confidence,
          details,
        }),
      });

      if (response.ok) {
        console.log("✅ Logged to database");
      } else {
        console.error("❌ Log failed:", await response.text());
      }
    } catch (error) {
      console.error("❌ Log error:", error);
    }
  };

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

  // store option TEXT (value) instead of index
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
          answers: answers, // array of option text values
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
      {/* Add debug info (remove in production) */}
      <div style={{ background: '#f0f0f0', padding: '10px', fontSize: '12px', marginBottom: '10px' }}>
        DEBUG: Models: {modelsLoaded ? '✓' : '✗'} |
        Descriptor: {registeredDescriptor ? '✓' : '✗'} |
        Status: {faceVerificationStatus} |
        Failures: {verificationFailures}/3
      </div>

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
          <div className="exam-progress">
            Question {currentQ + 1} of {paper.questions.length}
          </div>

          <div className="exam-question">
            <h3>Q{currentQ + 1}: {question.text}</h3>
            <div className="exam-options">
              {question.options.map((opt, idx) => (
                <label
                  key={idx}
                  className={`exam-option-label ${answers[currentQ] === opt ? 'selected' : ''}`}
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
