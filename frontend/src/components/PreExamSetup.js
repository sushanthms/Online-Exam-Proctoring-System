// frontend/src/components/PreExamSetup.js - IMPROVED WITH DEBUGGING
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useNavigate, useParams } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import "./PreExamSetup.css";

export default function PreExamSetup({ user }) {
  const { examId } = useParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const verificationAttempts = useRef(0);

  const [status, setStatus] = useState("initializing");
  const [message, setMessage] = useState("Initializing system...");
  const [debugInfo, setDebugInfo] = useState([]); // NEW: Debug information
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
  const [startButtonEnabled, setStartButtonEnabled] = useState(false);

  const VERIFICATION_THRESHOLD = 0.6;
  const MIN_ACCEPTABLE_DISTANCE = 0.7;

  // Helper function to add debug logs
  const addDebugLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    setDebugInfo(prev => [...prev.slice(-20), { message: logEntry, type }]);
  };

  useEffect(() => {
    initializePreExam();
    return () => stopCamera();
  }, []);

  const initializePreExam = async () => {
    try {
      setStatus("initializing");
      setMessage("Loading system components...");
      addDebugLog("🚀 Starting initialization", "info");

      // Check if face is registered first
      const faceStatus = await checkFaceRegistrationStatus();
      if (!faceStatus) {
        addDebugLog("❌ Face not registered", "error");
        setStatus("error");
        setMessage("Face not registered. Please register your face first.");
        setTimeout(() => navigate("/face-registration"), 3000);
        return;
      }

      // Load exam details
      await fetchExamDetails();
      
      // Load face-api models with detailed logging
      await loadModels();
      
      // Load registered face descriptor
      await loadRegisteredFace();
      
      // Start camera
      await startCamera();
      
      // Run all checks
      await runAllChecks();
      
      addDebugLog("✅ Initialization complete", "success");
    } catch (error) {
      console.error("Initialization error:", error);
      addDebugLog(`❌ Initialization failed: ${error.message}`, "error");
      setStatus("error");
      setMessage(error.message || "System initialization failed");
    }
  };

  const checkFaceRegistrationStatus = async () => {
    try {
      addDebugLog("🔍 Checking face registration status", "info");
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/auth/face-status", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        addDebugLog(`✅ Face registration status: ${data.isFaceRegistered}`, "success");
        return data.isFaceRegistered;
      }
      addDebugLog("⚠️ Could not verify face registration", "warning");
      return false;
    } catch (error) {
      addDebugLog(`❌ Error checking face registration: ${error.message}`, "error");
      return false;
    }
  };

  const fetchExamDetails = async () => {
    try {
      addDebugLog("📋 Fetching exam details", "info");
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:4000/api/exam/paper/${examId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setExamDetails(data);
        addDebugLog(`✅ Exam loaded: ${data.title}`, "success");
      } else {
        throw new Error("Failed to load exam details");
      }
    } catch (error) {
      addDebugLog(`❌ Failed to fetch exam: ${error.message}`, "error");
      throw new Error("Cannot load exam. Please try again.");
    }
  };

  const loadModels = async () => {
  try {
    updateCheck("camera", "pending", "Loading face detection models...");
    addDebugLog("🔄 Starting model loading", "info");
    
    const MODEL_URL = '/models';
    
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    addDebugLog("✅ Tiny face detector loaded", "success");
    
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    addDebugLog("✅ Face landmarks loaded", "success");
    
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    addDebugLog("✅ Face recognition loaded", "success");
    
    addDebugLog(`✅ All models loaded from: ${MODEL_URL}`, "success");
    setModelsLoaded(true);
  } catch (error) {
    console.error("Model loading error:", error);
    addDebugLog(`❌ Model loading failed: ${error.message}`, "error");
    throw new Error("Failed to load face detection models.");
  }
};

  const loadRegisteredFace = async () => {
    try {
      updateCheck("faceVerification", "pending", "Loading your registered face data...");
      addDebugLog("🔍 Loading registered face descriptor", "info");
      
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:4000/api/auth/face-descriptor",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.faceDescriptor && Array.isArray(data.faceDescriptor) && data.faceDescriptor.length === 128) {
          setRegisteredDescriptor(new Float32Array(data.faceDescriptor));
          addDebugLog("✅ Registered face descriptor loaded", "success");
        } else {
          throw new Error("Invalid face descriptor format");
        }
      } else {
        throw new Error("Face not registered");
      }
    } catch (error) {
      addDebugLog(`❌ Failed to load face descriptor: ${error.message}`, "error");
      updateCheck("faceVerification", "failed", "❌ Face not registered. Please register first.");
      throw new Error("Please register your face before taking exams");
    }
  };

  const startCamera = async () => {
    try {
      updateCheck("camera", "pending", "Starting camera...");
      addDebugLog("📹 Requesting camera access", "info");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            addDebugLog(`✅ Camera started: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`, "success");
            resolve();
          };
        });
        
        updateCheck("camera", "passed", "✅ Camera is working properly");
      }
    } catch (error) {
      console.error("Camera error:", error);
      addDebugLog(`❌ Camera error: ${error.message}`, "error");
      updateCheck("camera", "failed", "❌ Cannot access camera. Please grant permission.");
      throw new Error("Camera access denied. Please enable camera in browser settings.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      addDebugLog("🛑 Camera stopped", "info");
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
    addDebugLog("🔍 Starting verification checks", "info");

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      await checkLighting();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const faceCheckPassed = await checkFaceDetectionAndVerification();
      
      if (!faceCheckPassed) {
        setStatus("incomplete");
        setMessage("⚠️ Please adjust position and lighting for better verification");
        setAllChecksPassed(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      await checkEnvironment();
      
      const allPassed = Object.values(checks).every(
        check => check.status === "passed" || check.status === "warning"
      );
      
      setAllChecksPassed(allPassed && faceCheckPassed);
      
      if (allPassed && faceCheckPassed) {
        setStatus("ready");
        setMessage("✅ All checks passed! Identity verified. You're ready to start the exam.");
        addDebugLog("✅ All verification checks passed", "success");
      } else {
        setStatus("incomplete");
        setMessage("⚠️ Please resolve all issues before proceeding.");
        addDebugLog("⚠️ Some checks failed", "warning");
      }
    } catch (error) {
      console.error("Check error:", error);
      addDebugLog(`❌ Verification error: ${error.message}`, "error");
      setStatus("error");
      setMessage("Error during verification: " + error.message);
    }
  };

  const checkLighting = async () => {
    try {
      updateCheck("lighting", "pending", "Analyzing lighting conditions...");
      addDebugLog("💡 Checking lighting", "info");
      
      if (!videoRef.current) {
        updateCheck("lighting", "failed", "❌ Video not ready");
        addDebugLog("❌ Video element missing for lighting check", "error");
        return;
      }

      // Ensure video has data and non-zero dimensions
      if (videoRef.current.readyState < 2) {
        addDebugLog("⏳ Video not ready for lighting check, retrying shortly", "warning");
        await new Promise(r => setTimeout(r, 200));
      }

      let vw = Math.max(1, videoRef.current.videoWidth || 0);
      let vh = Math.max(1, videoRef.current.videoHeight || 0);
      
      // Limit canvas dimensions to prevent getImageData errors
      const MAX_CANVAS_SIZE = 1024; // Maximum safe size for getImageData
      if (vw > MAX_CANVAS_SIZE || vh > MAX_CANVAS_SIZE) {
        const aspectRatio = vw / vh;
        if (vw > vh) {
          vw = MAX_CANVAS_SIZE;
          vh = Math.round(MAX_CANVAS_SIZE / aspectRatio);
        } else {
          vh = MAX_CANVAS_SIZE;
          vw = Math.round(MAX_CANVAS_SIZE * aspectRatio);
        }
        addDebugLog(`📐 Resized canvas to ${vw}x${vh} to prevent getImageData errors`, "info");
      }
      
      if (vw === 1 && (videoRef.current.videoWidth || 0) === 0) {
        addDebugLog("⚠️ Video width is 0; using minimal canvas size to avoid errors", "warning");
      }
      if (vh === 1 && (videoRef.current.videoHeight || 0) === 0) {
        addDebugLog("⚠️ Video height is 0; using minimal canvas size to avoid errors", "warning");
      }

      const canvas = document.createElement("canvas");
      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        addDebugLog("❌ Unable to get canvas context for lighting check", "error");
        updateCheck("lighting", "warning", "⚠️ Unable to analyze lighting");
        return;
      }
      
      try {
        ctx.drawImage(videoRef.current, 0, 0, vw, vh);
      } catch (e) {
        addDebugLog(`❌ drawImage failed: ${e.message}`, "error");
        updateCheck("lighting", "warning", "⚠️ Unable to analyze lighting");
        return;
      }

      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, vw, vh);
      } catch (e) {
        addDebugLog(`❌ getImageData failed: ${e.message}`, "error");
        updateCheck("lighting", "warning", "⚠️ Unable to analyze lighting");
        return;
      }
      const data = imageData.data;
      
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
      }
      
      const avgBrightness = totalBrightness / (data.length / 4);
      addDebugLog(`💡 Average brightness: ${Math.round(avgBrightness)}/255`, "info");
      
      if (avgBrightness < 50) {
        updateCheck("lighting", "warning", "⚠️ Low lighting detected. Please improve lighting.");
        addDebugLog("⚠️ Low lighting detected", "warning");
      } else if (avgBrightness > 200) {
        updateCheck("lighting", "warning", "⚠️ Very bright. Consider adjusting lighting.");
        addDebugLog("⚠️ Too bright", "warning");
      } else {
        updateCheck("lighting", "passed", `✅ Lighting is good (${Math.round(avgBrightness)}/255)`);
        addDebugLog("✅ Lighting is optimal", "success");
      }
    } catch (error) {
      console.error("Lighting check error:", error);
      addDebugLog(`❌ Lighting check failed: ${error.message}`, "error");
      updateCheck("lighting", "warning", "⚠️ Unable to check lighting");
    }
  };

  const checkFaceDetectionAndVerification = async () => {
    try {
      updateCheck("faceDetection", "pending", "Detecting your face...");
      updateCheck("faceVerification", "pending", "Verifying your identity...");
      addDebugLog("👤 Starting face detection and verification", "info");
      
      if (!videoRef.current || !modelsLoaded || !registeredDescriptor) {
        addDebugLog("❌ Prerequisites not met for face verification", "error");
        updateCheck("faceDetection", "failed", "❌ System not ready");
        updateCheck("faceVerification", "failed", "❌ Cannot verify identity");
        return false;
      }

      let bestMatch = null;
      let bestDistance = Infinity;
      const attempts = 5;
      const validDetections = [];

      for (let i = 0; i < attempts; i++) {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ 
            inputSize: 224,
            scoreThreshold: 0.5
          }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const distance = faceapi.euclideanDistance(
            registeredDescriptor,
            detection.descriptor
          );
          
          validDetections.push({ detection, distance });
          
          if (distance < bestDistance) {
            bestDistance = distance;
            bestMatch = detection;
          }

          addDebugLog(`🔍 Detection ${i + 1}/${attempts}: Distance = ${distance.toFixed(3)}`, "info");
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (validDetections.length === 0) {
        addDebugLog("❌ No face detected in any attempt", "error");
        updateCheck("faceDetection", "failed", "❌ No face detected. Please position yourself in front of camera.");
        updateCheck("faceVerification", "failed", "❌ Cannot verify without face detection.");
        setCurrentFaceMatch(false);
        return false;
      }

      updateCheck("faceDetection", "passed", `✅ Face detected (${validDetections.length}/${attempts})`);
      addDebugLog(`✅ Face detected in ${validDetections.length}/${attempts} attempts`, "success");

      const avgDistance = validDetections.reduce((sum, v) => sum + v.distance, 0) / validDetections.length;
      const similarity = Math.max(0, (1 - avgDistance) * 100);
      
      addDebugLog(`📊 Verification: Distance=${avgDistance.toFixed(3)}, Similarity=${similarity.toFixed(1)}%`, "info");

      if (canvasRef.current && bestMatch) {
        const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
        const resizedDetection = faceapi.resizeResults(bestMatch, dims);
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        if (avgDistance < VERIFICATION_THRESHOLD) {
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 4;
        } else if (avgDistance < MIN_ACCEPTABLE_DISTANCE) {
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 3;
        } else {
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 3;
        }
        
        faceapi.draw.drawDetections(canvasRef.current, resizedDetection);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetection);
      }

      setVerificationScore(similarity.toFixed(1));

      if (avgDistance < VERIFICATION_THRESHOLD) {
        setCurrentFaceMatch(true);
        setStartButtonEnabled(true);
        updateCheck("faceVerification", "passed", `✅ Verified! ${similarity.toFixed(1)}% - ${user.name}`);
        addDebugLog(`✅ Identity verified: ${user.name} (${similarity.toFixed(1)}%)`, "success");
        verificationAttempts.current = 0;
        return true;
      } else if (avgDistance < MIN_ACCEPTABLE_DISTANCE) {
        setCurrentFaceMatch(true);
        updateCheck("faceVerification", "warning", `⚠️ Low confidence: ${similarity.toFixed(1)}%`);
        addDebugLog(`⚠️ Low confidence verification`, "warning");
        verificationAttempts.current = 0;
        return true;
      } else {
        verificationAttempts.current++;
        setCurrentFaceMatch(false);
        const remaining = 3 - verificationAttempts.current;
        updateCheck("faceVerification", "failed", `❌ Failed (${similarity.toFixed(1)}%). ${remaining} attempts left`);
        addDebugLog(`❌ Verification failed: Distance ${avgDistance.toFixed(3)} > ${VERIFICATION_THRESHOLD}`, "error");
        return false;
      }
    } catch (error) {
      console.error("Face verification error:", error);
      addDebugLog(`❌ Verification error: ${error.message}`, "error");
      updateCheck("faceDetection", "failed", "❌ Error during face detection");
      updateCheck("faceVerification", "failed", "❌ Error during verification");
      setCurrentFaceMatch(false);
      return false;
    }
  };

  const checkEnvironment = async () => {
    try {
      updateCheck("environment", "pending", "Checking for multiple people...");
      addDebugLog("🌍 Checking environment", "info");
      
      if (!videoRef.current || !modelsLoaded) {
        updateCheck("environment", "warning", "⚠️ Unable to verify environment");
        return;
      }

      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
      );

      addDebugLog(`🌍 Detected ${detections.length} face(s)`, "info");

      if (detections.length === 0) {
        updateCheck("environment", "warning", "⚠️ No face detected.");
      } else if (detections.length === 1) {
        updateCheck("environment", "passed", "✅ Single person detected.");
        addDebugLog("✅ Environment clear", "success");
      } else {
        updateCheck("environment", "warning", `⚠️ ${detections.length} people detected.`);
        addDebugLog(`⚠️ Multiple faces detected: ${detections.length}`, "warning");
      }
    } catch (error) {
      console.error("Environment check error:", error);
      addDebugLog(`❌ Environment check failed: ${error.message}`, "error");
      updateCheck("environment", "warning", "⚠️ Unable to check environment");
    }
  };

  const handleManualCheck = async () => {
    setIsManualCheck(true);
    setStatus("checking");
    setMessage("Running manual verification...");
    addDebugLog("🔄 Manual re-verification initiated", "info");
    verificationAttempts.current = 0;
    await runAllChecks();
    setIsManualCheck(false);
  };

  function navigateToExam(id) {
    window.location.href = `/exam/${id}`;
  }

  const handleStartExam = () => {
    if (window.confirm(
      `✅ Identity Verified: ${user.name}\n\n` +
      `Match Score: ${verificationScore}%\n\n` +
      `Ready to start?`
    )) {
      addDebugLog("🚀 Starting exam", "success");
      setStatus("navigating");
      stopCamera();
      
      const targetExamId = examId;
      setTimeout(() => navigateToExam(targetExamId), 1000);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Cancel verification?")) {
      addDebugLog("🚫 Verification cancelled", "info");
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
          <div className="header-top">
            <h2>🔒 Identity Verification Required</h2>
            <div className="theme-toggle-container">
              <ThemeToggle />
            </div>
          </div>
          {examDetails && (
            <div className="exam-info">
              <h3>{examDetails.title}</h3>
              <p>
                📝 {examDetails.questions?.length || 0} Questions • 
                ⏱️ {examDetails.durationMins || 30} Minutes • 
                👤 Student: <strong>{user.name}</strong>
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
                    // Limit canvas dimensions to prevent getImageData errors
                    const MAX_CANVAS_SIZE = 1024;
                    let width = videoRef.current.videoWidth;
                    let height = videoRef.current.videoHeight;
                    
                    if (width > MAX_CANVAS_SIZE || height > MAX_CANVAS_SIZE) {
                      const aspectRatio = width / height;
                      if (width > height) {
                        width = MAX_CANVAS_SIZE;
                        height = Math.round(MAX_CANVAS_SIZE / aspectRatio);
                      } else {
                        height = MAX_CANVAS_SIZE;
                        width = Math.round(MAX_CANVAS_SIZE * aspectRatio);
                      }
                      addDebugLog(`📐 Resized detection canvas to ${width}x${height} to prevent errors`, "info");
                    }
                    
                    canvasRef.current.width = width;
                    canvasRef.current.height = height;
                  }
                }}
              />
              <canvas ref={canvasRef} className="detection-canvas" />
              
              {verificationScore > 0 && (
                <div className={`match-overlay ${currentFaceMatch ? 'match' : 'no-match'}`}>
                  {currentFaceMatch ? (
                    <div className="match-success">
                      <span className="match-icon">✅</span>
                      <span className="match-text">Verified</span>
                      <span className="match-score">{verificationScore}%</span>
                    </div>
                  ) : (
                    <div className="match-fail">
                      <span className="match-icon">⚠️</span>
                      <span className="match-text">Retry</span>
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
            
            {/* DEBUG CONSOLE */}
            <details className="debug-section" style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '0.5rem' }}>
                🐛 Debug Console ({debugInfo.length} logs)
              </summary>
              <div style={{ 
                maxHeight: '200px', 
                overflow: 'auto', 
                backgroundColor: '#1a1a1a', 
                color: '#00ff00',
                padding: '0.5rem',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                borderRadius: '4px'
              }}>
                {debugInfo.map((log, idx) => (
                  <div key={idx} style={{ 
                    padding: '2px 0',
                    color: log.type === 'error' ? '#ff4444' : 
                           log.type === 'warning' ? '#ffaa00' : 
                           log.type === 'success' ? '#00ff00' : '#00ff00'
                  }}>
                    {log.message}
                  </div>
                ))}
              </div>
            </details>
          </div>
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
            {isManualCheck ? "🔄 Verifying..." : "🔄 Re-verify"}
          </button>
          
          <button
            onClick={handleStartExam}
            className="btn-start"
            disabled={!startButtonEnabled || status === "checking"}
          >
            ✅ Start Exam
          </button>
        </div>
      </div>
    </div>
  );
}
