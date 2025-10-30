// frontend/src/components/PreExamSetup.js - ENHANCED VERSION
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useNavigate, useParams } from "react-router-dom";
import "./PreExamSetup.css";

export default function PreExamSetup({ user }) {
  const { examId } = useParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const verificationAttempts = useRef(0);

  const [status, setStatus] = useState("initializing");
  const [message, setMessage] = useState("Initializing system...");
  const [checks, setChecks] = useState({
    camera: { status: "pending", message: "Checking camera...", icon: "📷" },
    lighting: { status: "pending", message: "Checking lighting...", icon: "💡" },
    faceDetection: { status: "pending", message: "Detecting face...", icon: "👤" },
    faceVerification: { status: "pending", message: "Verifying identity...", icon: "🔐" },
    environment: { status: "pending", message: "Checking environment...", icon: "🌍" }
  });
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [registeredDescriptor, setRegisteredDescriptor] = useState(null);
  const [allChecksPassed, setAllChecksPassed] = useState(false);
  const [examDetails, setExamDetails] = useState(null);
  const [isManualCheck, setIsManualCheck] = useState(false);
  const [currentFaceMatch, setCurrentFaceMatch] = useState(null);
  const [verificationScore, setVerificationScore] = useState(0);

  useEffect(() => {
    initializePreExam();
    return () => stopCamera();
  }, []);

  const initializePreExam = async () => {
    try {
      setStatus("initializing");
      setMessage("Loading system components...");

      // Check if face is registered first
      const faceStatus = await checkFaceRegistrationStatus();
      if (!faceStatus) {
        setStatus("error");
        setMessage("Face not registered. Please register your face first.");
        setTimeout(() => {
          navigate("/face-registration");
        }, 3000);
        return;
      }

      // Load exam details
      await fetchExamDetails();
      
      // Load face-api models
      await loadModels();
      
      // Load registered face descriptor
      await loadRegisteredFace();
      
      // Start camera
      await startCamera();
      
      // Run all checks
      await runAllChecks();
    } catch (error) {
      console.error("Initialization error:", error);
      setStatus("error");
      setMessage(error.message || "System initialization failed");
    }
  };

  const checkFaceRegistrationStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/auth/face-status", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        return data.isFaceRegistered;
      }
      return false;
    } catch (error) {
      console.error("Error checking face registration:", error);
      return false;
    }
  };

  const fetchExamDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:4000/api/exam/paper/${examId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setExamDetails(data);
      } else {
        throw new Error("Failed to load exam details");
      }
    } catch (error) {
      throw new Error("Cannot load exam. Please try again.");
    }
  };

  const loadModels = async () => {
    try {
      updateCheck("camera", "pending", "Loading face detection models...");
      const MODEL_URL = process.env.PUBLIC_URL + "/models";
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      
      setModelsLoaded(true);
      console.log("✅ Face detection models loaded successfully");
    } catch (error) {
      console.error("Model loading error:", error);
      throw new Error("Failed to load face detection models. Please refresh the page.");
    }
  };

  const loadRegisteredFace = async () => {
    try {
      updateCheck("faceVerification", "pending", "Loading your registered face data...");
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:4000/api/auth/face-descriptor",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.faceDescriptor && Array.isArray(data.faceDescriptor) && data.faceDescriptor.length === 128) {
          setRegisteredDescriptor(new Float32Array(data.faceDescriptor));
          console.log("✅ Registered face data loaded");
        } else {
          throw new Error("Invalid face descriptor format");
        }
      } else {
        throw new Error("Face not registered");
      }
    } catch (error) {
      updateCheck("faceVerification", "failed", "❌ Face not registered. Please register first.");
      throw new Error("Please register your face before taking exams");
    }
  };

  const startCamera = async () => {
    try {
      updateCheck("camera", "pending", "Starting camera...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            resolve();
          };
        });
        
        updateCheck("camera", "passed", "✅ Camera is working properly");
        console.log("✅ Camera started successfully");
      }
    } catch (error) {
      console.error("Camera error:", error);
      updateCheck("camera", "failed", "❌ Cannot access camera. Please grant permission.");
      throw new Error("Camera access denied. Please enable camera in browser settings.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      console.log("🛑 Camera stopped");
    }
  };

  const updateCheck = (checkName, status, message) => {
    setChecks(prev => ({
      ...prev,
      [checkName]: { ...prev[checkName], status, message }
    }));
  };

  const runAllChecks = async () => {
    setStatus("checking");
    setMessage("Running comprehensive pre-exam verification...");

    try {
      // Wait a moment for camera to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check lighting
      await checkLighting();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check face detection and verification (most important)
      const faceCheckPassed = await checkFaceDetectionAndVerification();
      
      if (!faceCheckPassed) {
        setStatus("failed");
        setMessage("❌ Identity verification failed. Cannot proceed with exam.");
        setAllChecksPassed(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check environment
      await checkEnvironment();
      
      // Final verification
      const allPassed = Object.values(checks).every(
        check => check.status === "passed" || check.status === "warning"
      );
      
      setAllChecksPassed(allPassed);
      
      if (allPassed) {
        setStatus("ready");
        setMessage("✅ All checks passed! Identity verified. You're ready to start the exam.");
      } else {
        setStatus("incomplete");
        setMessage("⚠️ Some checks failed. Please resolve all issues before proceeding.");
      }
    } catch (error) {
      console.error("Check error:", error);
      setStatus("error");
      setMessage("Error during verification: " + error.message);
    }
  };

  const checkLighting = async () => {
    try {
      updateCheck("lighting", "pending", "Analyzing lighting conditions...");
      
      if (!videoRef.current) {
        updateCheck("lighting", "failed", "❌ Video not ready");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
      }
      
      const avgBrightness = totalBrightness / (data.length / 4);
      
      if (avgBrightness < 50) {
        updateCheck("lighting", "failed", "❌ Too dark. Please improve lighting conditions.");
      } else if (avgBrightness > 200) {
        updateCheck("lighting", "warning", "⚠️ Too bright. Consider adjusting lighting.");
      } else {
        updateCheck("lighting", "passed", `✅ Lighting is good (${Math.round(avgBrightness)}/255)`);
      }
    } catch (error) {
      console.error("Lighting check error:", error);
      updateCheck("lighting", "failed", "❌ Failed to check lighting");
    }
  };

  const checkFaceDetectionAndVerification = async () => {
    try {
      updateCheck("faceDetection", "pending", "Detecting your face...");
      updateCheck("faceVerification", "pending", "Verifying your identity...");
      
      if (!videoRef.current || !modelsLoaded || !registeredDescriptor) {
        updateCheck("faceDetection", "failed", "❌ System not ready");
        updateCheck("faceVerification", "failed", "❌ Cannot verify identity");
        return false;
      }

      // Multiple attempts for better accuracy
      let bestMatch = null;
      let bestDistance = Infinity;
      const attempts = 3;

      for (let i = 0; i < attempts; i++) {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          if (i === attempts - 1) {
            updateCheck("faceDetection", "failed", "❌ No face detected. Please position yourself clearly.");
            updateCheck("faceVerification", "failed", "❌ Cannot verify without face detection.");
            return false;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }

        // Calculate distance
        const distance = faceapi.euclideanDistance(
          registeredDescriptor,
          detection.descriptor
        );

        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = detection;
        }

        // Draw detection on canvas
        if (canvasRef.current && i === attempts - 1) {
          const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
          const resizedDetection = faceapi.resizeResults(detection, dims);
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Draw with color based on match
          if (bestDistance < 0.6) {
            ctx.strokeStyle = "#10b981"; // Green for match
          } else {
            ctx.strokeStyle = "#ef4444"; // Red for no match
          }
          ctx.lineWidth = 3;
          
          faceapi.draw.drawDetections(canvasRef.current, resizedDetection);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetection);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!bestMatch) {
        updateCheck("faceDetection", "failed", "❌ No face detected after multiple attempts.");
        updateCheck("faceVerification", "failed", "❌ Identity verification failed.");
        return false;
      }

      // Face detected successfully
      updateCheck("faceDetection", "passed", "✅ Face detected successfully");

      // Verify identity
      const similarity = Math.max(0, (1 - bestDistance) * 100);
      setVerificationScore(similarity.toFixed(1));
      setCurrentFaceMatch(bestDistance < 0.6);

      console.log(`Identity verification: Distance=${bestDistance.toFixed(3)}, Similarity=${similarity.toFixed(1)}%`);

      if (bestDistance < 0.6) {
        updateCheck(
          "faceVerification",
          "passed",
          `✅ Identity verified! Match: ${similarity.toFixed(1)}% (${user.name})`
        );
        verificationAttempts.current = 0;
        return true;
      } else {
        verificationAttempts.current++;
        updateCheck(
          "faceVerification",
          "failed",
          `❌ Identity mismatch (${similarity.toFixed(1)}% match). Expected: ${user.name}`
        );
        
        if (verificationAttempts.current >= 3) {
          alert("❌ Identity verification failed multiple times. Please ensure you are the registered student.");
        }
        return false;
      }
    } catch (error) {
      console.error("Face detection/verification error:", error);
      updateCheck("faceDetection", "failed", "❌ Error during face detection");
      updateCheck("faceVerification", "failed", "❌ Error during identity verification");
      return false;
    }
  };

  const checkEnvironment = async () => {
    try {
      updateCheck("environment", "pending", "Checking for multiple people...");
      
      if (!videoRef.current || !modelsLoaded) {
        updateCheck("environment", "warning", "⚠️ Unable to verify environment");
        return;
      }

      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      );

      if (detections.length === 0) {
        updateCheck("environment", "warning", "⚠️ No face detected in frame.");
      } else if (detections.length === 1) {
        updateCheck("environment", "passed", "✅ Single person detected. Environment is clear.");
      } else {
        updateCheck(
          "environment",
          "failed",
          `❌ Multiple people detected (${detections.length}). Ensure you're alone.`
        );
      }
    } catch (error) {
      console.error("Environment check error:", error);
      updateCheck("environment", "warning", "⚠️ Unable to check environment");
    }
  };

  const handleManualCheck = async () => {
    setIsManualCheck(true);
    setStatus("checking");
    setMessage("Running manual verification...");
    verificationAttempts.current = 0;
    await runAllChecks();
    setIsManualCheck(false);
  };

  const handleStartExam = () => {
    if (!allChecksPassed) {
      alert("⚠️ Please resolve all verification issues before starting the exam.");
      return;
    }

    if (!currentFaceMatch) {
      alert("❌ Identity verification failed. You must be the registered student to take this exam.");
      return;
    }

    if (window.confirm(
      `✅ Identity Verified: ${user.name}\n\n` +
      `Match Score: ${verificationScore}%\n\n` +
      `⚠️ Important Reminders:\n` +
      `• Timer will start ONLY when you begin the exam\n` +
      `• Your identity will be verified continuously\n` +
      `• Keep your face visible at all times\n` +
      `• Multiple face detection will be logged\n` +
      `• Tab switching is monitored\n` +
      `• Exam will auto-submit on violations\n\n` +
      `Are you ready to start?`
    )) {
      // Log successful pre-exam verification
      logPreExamVerification();
      
      // Stop camera and navigate to exam
      stopCamera();
      navigate(`/exam/${examId}`);
    }
  };

  const logPreExamVerification = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:4000/api/exam/verify-face", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          examId,
          verificationStatus: "verified",
          confidence: verificationScore,
          details: `Pre-exam verification successful for ${user.name}`
        })
      });
    } catch (error) {
      console.error("Error logging verification:", error);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? You'll need to restart the verification process.")) {
      stopCamera();
      navigate("/student/dashboard");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "passed": return "✅";
      case "failed": return "❌";
      case "warning": return "⚠️";
      case "pending": return "⏳";
      default: return "⏳";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "passed": return "#10b981";
      case "failed": return "#ef4444";
      case "warning": return "#f59e0b";
      case "pending": return "#6b7280";
      default: return "#6b7280";
    }
  };

  return (
    <div className="pre-exam-container">
      <div className="pre-exam-card">
        <div className="pre-exam-header">
          <h2>🔒 Identity Verification Required</h2>
          {examDetails && (
            <div className="exam-info">
              <h3>{examDetails.title}</h3>
              <p>
                📝 {examDetails.questions?.length || 0} Questions • 
                ⏱️ {examDetails.durationMins || 30} Minutes • 
                👤 Registered Student: <strong>{user.name}</strong>
              </p>
            </div>
          )}
        </div>

        <div className="verification-area">
          <div className="camera-section">
            <div className="camera-container">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="camera-video"
                onLoadedMetadata={() => {
                  if (canvasRef.current && videoRef.current) {
                    canvasRef.current.width = videoRef.current.videoWidth;
                    canvasRef.current.height = videoRef.current.videoHeight;
                  }
                }}
              />
              <canvas ref={canvasRef} className="detection-canvas" />
              
              {verificationScore > 0 && (
                <div className={`match-overlay ${currentFaceMatch ? 'match' : 'no-match'}`}>
                  {currentFaceMatch ? (
                    <div className="match-success">
                      <span className="match-icon">✅</span>
                      <span className="match-text">Identity Verified</span>
                      <span className="match-score">{verificationScore}%</span>
                    </div>
                  ) : (
                    <div className="match-fail">
                      <span className="match-icon">❌</span>
                      <span className="match-text">Identity Mismatch</span>
                      <span className="match-score">{verificationScore}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="status-display">
              <div className={`status-indicator ${status}`}></div>
              <p className="status-message">{message}</p>
            </div>
          </div>

          <div className="checks-section">
            <h3>Verification Checklist</h3>
            <div className="checks-list">
              {Object.entries(checks).map(([key, check]) => (
                <div
                  key={key}
                  className={`check-item ${check.status}`}
                  style={{ borderLeftColor: getStatusColor(check.status) }}
                >
                  <span className="check-icon">{check.icon} {getStatusIcon(check.status)}</span>
                  <div className="check-content">
                    <strong>{key.replace(/([A-Z])/g, ' $1').trim()}</strong>
                    <p>{check.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="instructions-box">
          <h4>⚠️ Critical Requirements</h4>
          <ul>
            <li><strong>Face Registration Required:</strong> You must have registered your face before taking exams</li>
            <li><strong>Identity Verification:</strong> Your face will be matched against your registered profile</li>
            <li><strong>Continuous Monitoring:</strong> Identity verification continues throughout the exam</li>
            <li><strong>Single Person Only:</strong> Ensure you are alone in the room</li>
            <li><strong>Good Lighting:</strong> Face must be clearly visible</li>
            <li><strong>Timer Starts After:</strong> Timer begins only after you click "Start Exam" on next page</li>
          </ul>
        </div>

        <div className="action-buttons">
          <button onClick={handleCancel} className="btn-cancel">
            ❌ Cancel
          </button>
          
          <button 
            onClick={handleManualCheck} 
            className="btn-test"
            disabled={status === "checking"}
          >
            {isManualCheck ? "🔄 Verifying..." : "🔄 Re-verify Identity"}
          </button>
          
          <button
            onClick={handleStartExam}
            className="btn-start"
            disabled={!allChecksPassed || !currentFaceMatch || status === "checking"}
          >
            {allChecksPassed && currentFaceMatch ? "✅ Start Exam" : "⚠️ Verification Required"}
          </button>
        </div>

        <div className="verification-info">
          <p className="info-text">
            🛡️ <strong>Security Notice:</strong> All verification attempts are logged. 
            Repeated verification failures may result in account review.
          </p>
        </div>
      </div>
    </div>
  );
}