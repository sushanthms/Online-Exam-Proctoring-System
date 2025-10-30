// frontend/src/components/ExamPage.js - ENHANCED VERSION WITH TIMER CONTROL
import React, { useEffect, useState, useRef } from "react";
import * as faceapi from "face-api.js";
import { useNavigate, useParams } from "react-router-dom";
import "./ExamPage.css";
import "./ProctoringPanel.css";

export default function ExamPage({ user, onLogout }) {
  const { examId } = useParams();
  const videoRef = useRef(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null); // Start as null
  const [timerStarted, setTimerStarted] = useState(false); // NEW
  const [logs, setLogs] = useState([]);
  const [paper, setPaper] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);

  const [registeredDescriptor, setRegisteredDescriptor] = useState(null);
  const [faceVerificationStatus, setFaceVerificationStatus] = useState("loading");
  const [verificationFailures, setVerificationFailures] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [lastVerificationTime, setLastVerificationTime] = useState(Date.now());

  const multipleFaceActive = useRef(false);
  const startTimeRef = useRef(null);
  const isSubmitting = useRef(false);
  const verificationInterval = useRef(null);
  const examStartTime = useRef(null); // NEW
  const navigate = useNavigate();

  // Stop camera utility
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      console.log("🛑 Camera stopped");
    }
  };

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

        setModelsLoaded(true);
        console.log("✅ Models loaded");

        const res = await fetch(`http://localhost:4000/api/exam/paper/${examId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();

        if (!data?.questions?.length) throw new Error("No questions in exam");

        setPaper(data);
        setAnswers(new Array(data.questions.length).fill(null));
        
        // SET TIMER BUT DON'T START IT YET
        setTimeLeft((data.durationMins || 10) * 60);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // START TIMER WHEN VIDEO IS READY
          videoRef.current.onloadedmetadata = () => {
            console.log("📹 Camera ready - Starting timer NOW");
            examStartTime.current = Date.now();
            setTimerStarted(true);
          };
        }
      } catch (err) {
        console.error("❌ Setup failed:", err);
        alert(`Failed to load exam: ${err.message}`);
        navigate("/student/dashboard");
      }
    };

    loadModelsAndExam();
    return () => {
      stopCamera();
      if (verificationInterval.current) {
        clearInterval(verificationInterval.current);
      }
    };
  }, [examId, navigate]);

  // TIMER COUNTDOWN - Only runs when timerStarted is true
  useEffect(() => {
    if (!timerStarted || timeLeft === null) return;

    if (timeLeft <= 0) {
      alert("⏰ Time's up! Auto-submitting your exam...");
      handleSubmit();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, timerStarted]);

  // Face verification monitoring
  useEffect(() => {
    if (!paper || !registeredDescriptor || !modelsLoaded || !timerStarted) return;

    verificationInterval.current = setInterval(async () => {
      await verifyFaceIdentity();
    }, 5000);

    // Initial verification
    setTimeout(() => verifyFaceIdentity(), 2000);

    return () => {
      if (verificationInterval.current) {
        clearInterval(verificationInterval.current);
      }
    };
  }, [paper, registeredDescriptor, modelsLoaded, timerStarted]);

  const verifyFaceIdentity = async () => {
    if (!videoRef.current || !registeredDescriptor) return;

    try {
      // Multiple attempts for more reliable verification
      const attempts = 3;
      let validDetections = [];
      
      for (let i = 0; i < attempts; i++) {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ 
            inputSize: 224,
            scoreThreshold: 0.5
          }))
          .withFaceLandmarks()
          .withFaceDescriptor();
          
        if (detection) {
          validDetections.push(detection);
        }
        
        // Small delay between attempts
        if (i < attempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      const currentTime = Date.now();
      const timeSinceLastVerification = currentTime - lastVerificationTime;

      if (validDetections.length === 0) {
        setLogs(prev => [...prev, `⚠️ No face detected at ${new Date().toLocaleTimeString()}`]);
        setFaceVerificationStatus("warning");
        
        // Log to backend
        await fetch("http://localhost:4000/api/exam/verify-face", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            examId,
            verificationStatus: "no_face",
            details: `No face detected during verification at ${new Date().toLocaleTimeString()}`
          })
        });
        
        return;
      }
      
      // Calculate average distance for more stable verification
      let totalDistance = 0;
      let bestDistance = Infinity;
      
      validDetections.forEach(detection => {
        const distance = faceapi.euclideanDistance(registeredDescriptor, detection.descriptor);
        totalDistance += distance;
        if (distance < bestDistance) {
          bestDistance = distance;
        }
      });
      
      const avgDistance = totalDistance / validDetections.length;
      const similarity = Math.max(0, (1 - avgDistance) * 100);
      
      // Stricter threshold for continuous verification
      const VERIFICATION_THRESHOLD = 0.45;
      const isMatch = avgDistance < VERIFICATION_THRESHOLD;

      console.log(`🔐 Verification: Detections=${validDetections.length}/${attempts}, AvgDistance=${avgDistance.toFixed(3)}, BestDistance=${bestDistance.toFixed(3)}, Similarity=${similarity.toFixed(1)}%, Match=${isMatch}`);

      if (isMatch) {
        setFaceVerificationStatus("verified");
        setVerificationFailures(0);
        
        // Only log successful verifications occasionally to avoid cluttering the log
        if (Math.random() < 0.3) {
          setLogs(prev => [...prev, `✅ Identity verified at ${new Date().toLocaleTimeString()} (${similarity.toFixed(1)}%)`]);
        }
        
        // Log to backend (less frequently)
        if (Math.random() < 0.2) {
          await fetch("http://localhost:4000/api/exam/verify-face", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({
              examId,
              verificationStatus: "verified",
              confidence: similarity,
              details: `Identity verified for ${user.name}`
            })
          });
        }
      } else {
        const newCount = verificationFailures + 1;
        setVerificationFailures(newCount);
        setFaceVerificationStatus("failed");
        
        setLogs(prev => [...prev, `❌ Identity mismatch at ${new Date().toLocaleTimeString()} (${similarity.toFixed(1)}%) - Attempt ${newCount}/3`]);
        
        alert(`🚨 IDENTITY VERIFICATION FAILED!\n\nExpected: ${user.name}\nMatch Score: ${similarity.toFixed(1)}%\n\nAttempt ${newCount} of 3\n\n${newCount >= 3 ? 'Exam will be auto-submitted!' : 'Please ensure you are the registered student.'}`);
        
        // Log to backend
        await fetch("http://localhost:4000/api/exam/verify-face", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            examId,
            verificationStatus: "failed",
            confidence: similarity,
            details: `Identity mismatch detected - Expected: ${user.name}, Attempt: ${newCount}/3`
          })
        });

        if (newCount >= 3) {
          alert("🚨 MAXIMUM VERIFICATION FAILURES REACHED!\n\nYour exam will be auto-submitted due to identity verification failures.");
          handleSubmit();
        }
      }

      setLastVerificationTime(currentTime);
    } catch (error) {
      console.error("Verification error:", error);
      setLogs(prev => [...prev, `⚠️ Verification error at ${new Date().toLocaleTimeString()}`]);
    }
  };

  // Tab switching detection with duration tracking
  useEffect(() => {
    let tabSwitchStartTime = null;
    
    const handleVisibilityChange = () => {
      if (!timerStarted) return;
      
      if (document.hidden) {
        // Tab switched away
        tabSwitchStartTime = new Date();
      } else if (tabSwitchStartTime) {
        // Tab switched back
        const endTime = new Date();
        const duration = Math.round((endTime - tabSwitchStartTime) / 1000);
        const newCount = tabSwitchCount + 1;
        
        setTabSwitchCount(newCount);
        setLogs(prev => [...prev, `⚠️ Tab switch #${newCount} at ${tabSwitchStartTime.toLocaleTimeString()} (Duration: ${duration}s)`]);
        
        // Log to backend
        try {
          const token = localStorage.getItem("token");
          fetch("http://localhost:4000/api/exam/log-violation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              examId,
              violationType: "tab_switch",
              details: `Tab switch #${newCount} (Duration: ${duration}s)`,
              timestamp: new Date().toISOString()
            })
          });
        } catch (error) {
          console.error("Error logging tab switch:", error);
        }
        
        tabSwitchStartTime = null;
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [tabSwitchCount, timerStarted, examId]);

  // Tab warning logic with stricter enforcement
  useEffect(() => {
    if (tabSwitchCount === 1 && !warningShown) {
      alert("⚠️ WARNING: You switched tabs!\n\nThis is your FIRST warning.\n\nTwo more tab switches will AUTO-SUBMIT your exam.\n\nStay focused on the exam page!");
      setWarningShown(true);
    } else if (tabSwitchCount === 2) {
      alert("⚠️ FINAL WARNING: You switched tabs again!\n\nOne more tab switch will AUTO-SUBMIT your exam.\n\nStay focused on the exam page!");
    } else if (tabSwitchCount >= 3) {
      alert("❌ TOO MANY TAB SWITCHES!\n\nYour exam is being auto-submitted due to suspicious activity.");
      
      // Log critical violation
      try {
        const token = localStorage.getItem("token");
        fetch("http://localhost:4000/api/exam/log-violation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            examId,
            violationType: "critical_tab_switch",
            details: `Critical violation: ${tabSwitchCount} tab switches detected. Auto-submitting exam.`,
            timestamp: new Date().toISOString(),
            severity: "critical"
          })
        });
      } catch (error) {
        console.error("Error logging critical violation:", error);
      }
      
      handleSubmit();
    }
  }, [tabSwitchCount, warningShown, examId]);

  // Enhanced multiple face detection with violation logging
  useEffect(() => {
    if (!paper || !timerStarted) return;
    
    const multipleFaceViolationCount = useRef(0);
    const VIOLATION_THRESHOLD = 3; // Auto-submit after 3 violations
    
    const interval = setInterval(async () => {
      if (!videoRef.current) return;
      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            scoreThreshold: 0.6 // Higher threshold for more accurate detection
          })
        );
        
        if (detections.length > 1) {
          if (!multipleFaceActive.current) {
            multipleFaceActive.current = true;
            startTimeRef.current = new Date();
            
            // Increment violation count
            multipleFaceViolationCount.current++;
            
            // Log to UI
            setLogs(prev => [...prev, `👥 VIOLATION: Multiple faces detected (${detections.length} people) at ${startTimeRef.current.toLocaleTimeString()} - #${multipleFaceViolationCount.current}`]);
            
            // Log to backend
            try {
              const token = localStorage.getItem("token");
              fetch("http://localhost:4000/api/exam/log-violation", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  examId,
                  violationType: "multiple_faces",
                  details: `Multiple faces detected (${detections.length} people)`,
                  timestamp: new Date().toISOString(),
                  faceCount: detections.length,
                  violationNumber: multipleFaceViolationCount.current
                })
              });
            } catch (error) {
              console.error("Error logging multiple face violation:", error);
            }
            
            // Alert the user
            alert(`👥 VIOLATION DETECTED: Multiple people (${detections.length}) in camera view!\n\nThis is violation #${multipleFaceViolationCount.current} of ${VIOLATION_THRESHOLD} allowed.\n\nPlease ensure you are alone while taking the exam.`);
            
            // Auto-submit if threshold reached
            if (multipleFaceViolationCount.current >= VIOLATION_THRESHOLD) {
              alert("🚨 CRITICAL VIOLATION: Multiple people detected too many times!\n\nYour exam is being auto-submitted.");
              handleSubmit();
            }
          }
        } else if (multipleFaceActive.current) {
          multipleFaceActive.current = false;
          const endTime = new Date();
          const duration = Math.round((endTime - startTimeRef.current) / 1000);
          setLogs(prev => [...prev, `✅ Multiple faces cleared at ${endTime.toLocaleTimeString()} (Duration: ${duration}s)`]);
          
          // Log resolution to backend
          try {
            const token = localStorage.getItem("token");
            fetch("http://localhost:4000/api/exam/log-violation", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                examId,
                violationType: "multiple_faces_resolved",
                details: `Multiple faces violation resolved after ${duration} seconds`,
                timestamp: new Date().toISOString(),
                duration: duration
              })
            });
          } catch (error) {
            console.error("Error logging violation resolution:", error);
          }
        }
      } catch (err) {
        console.error("Face detection error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paper, timerStarted, examId, handleSubmit]);

  const formatTime = (seconds) => {
    if (seconds === null) return "Loading...";
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  // Submit handler
  const handleSubmit = async () => {
    if (isSubmitting.current) return;
    if (!paper) return alert("Exam not loaded!");

    // Auto-submit scenarios
    const isAutoSubmit = tabSwitchCount >= 3 || timeLeft <= 0 || verificationFailures >= 3;

    if (!isAutoSubmit) {
      if (!window.confirm(
        `Are you sure you want to submit?\n\n` +
        `Time Remaining: ${formatTime(timeLeft)}\n` +
        `Questions Answered: ${answers.filter(a => a !== null).length}/${answers.length}\n\n` +
        `You cannot change your answers after submission.`
      )) {
        return;
      }
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
          tabSwitches: tabSwitchCount,
          verificationFailures,
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
      alert("❌ Failed to submit exam. Please try again.");
      isSubmitting.current = false;
    }
  };

  if (!paper || !paper.questions) {
    return (
      <div className="exam-loading">
        <div className="loading-spinner"></div>
        <h3>Loading exam...</h3>
        <p>Please wait while we prepare your exam environment...</p>
      </div>
    );
  }

  const question = paper.questions[currentQ];

  return (
    <div className="exam-page">
      {/* Timer Status Banner */}
      <div className={`timer-status-banner ${timerStarted ? 'active' : 'waiting'}`}>
        {timerStarted ? (
          <>
            ⏱️ <strong>Timer Started:</strong> Exam in progress
          </>
        ) : (
          <>
            ⏳ <strong>Initializing:</strong> Timer will start when camera is ready...
          </>
        )}
      </div>

      {/* Verification Status Banner */}
      <div className={`verification-banner ${faceVerificationStatus}`}>
        <div className="verification-content">
          {faceVerificationStatus === "verified" && (
            <>
              ✅ <strong>Identity Verified:</strong> {user.name}
            </>
          )}
          {faceVerificationStatus === "failed" && (
            <>
              ❌ <strong>Verification Failed:</strong> {verificationFailures}/3 attempts
            </>
          )}
          {faceVerificationStatus === "warning" && (
            <>
              ⚠️ <strong>Warning:</strong> Face not detected
            </>
          )}
          {faceVerificationStatus === "loading" && (
            <>
              🔄 <strong>Loading:</strong> Preparing verification system...
            </>
          )}
          {faceVerificationStatus === "ready" && (
            <>
              🟢 <strong>Ready:</strong> Verification system active
            </>
          )}
        </div>
      </div>
      
      {/* Proctoring Violations Summary */}
      <div className="proctoring-violations-summary">
        <div className="violation-metric">
          <span className="violation-label">Identity Verification:</span>
          <span className={`violation-value ${verificationFailures > 0 ? 'warning' : 'good'}`}>
            {verificationFailures > 0 ? `${verificationFailures}/3 Failures` : 'Good'}
          </span>
        </div>
        <div className="violation-metric">
          <span className="violation-label">Tab Switching:</span>
          <span className={`violation-value ${tabSwitchCount > 0 ? 'warning' : 'good'}`}>
            {tabSwitchCount > 0 ? `${tabSwitchCount}/3 Switches` : 'None'}
          </span>
        </div>
        <div className="violation-metric">
          <span className="violation-label">Multiple Faces:</span>
          <span className={`violation-value ${multipleFaceActive.current ? 'critical' : 'good'}`}>
            {multipleFaceActive.current ? 'DETECTED!' : 'None'}
          </span>
        </div>
        <div className="logs-container">
          <h4>Proctoring Logs</h4>
          <div className="logs">
            {logs.slice(-8).reverse().map((log, index) => (
              <div key={index} className={`log-entry ${log.includes("VIOLATION") ? "violation-log" : log.includes("⚠️") ? "warning-log" : log.includes("✅") ? "success-log" : ""}`}>{log}</div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          if (window.confirm("Exit exam? Your progress will be lost!")) {
            stopCamera();
            navigate("/student/dashboard");
          }
        }}
        className="exam-back-btn"
      >
        ← Exit Exam
      </button>

      <div className="exam-header">
        <div>
          <h2>{paper.title}</h2>
          <p>Student: <strong>{user.name}</strong></p>
        </div>
        <div className="timer">
          {timerStarted ? (
            <>⏱️ Time: {formatTime(timeLeft)}</>
          ) : (
            <>⏳ Starting...</>
          )}
        </div>
      </div>

      {tabSwitchCount > 0 && (
        <div className="exam-tab-warning">
          ⚠️ <strong>Tab Switches Detected: {tabSwitchCount}/3</strong>
          {tabSwitchCount >= 2 && " - One more will auto-submit!"}
        </div>
      )}

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
            <h4>📷 Live Monitoring</h4>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", maxWidth: "300px", borderRadius: "12px" }} />
            <div className="verification-status">
              {faceVerificationStatus === "verified" && (
                <span className="status-verified">✅ Verified</span>
              )}
              {faceVerificationStatus === "failed" && (
                <span className="status-warning">❌ Failed ({verificationFailures}/3)</span>
              )}
            </div>
          </div>

          <div className="exam-face-logs">
            <h4>📋 Activity Log</h4>
            {logs.length > 0 ? (
              <ul>
                {logs.slice(-10).reverse().map((log, i) => (
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