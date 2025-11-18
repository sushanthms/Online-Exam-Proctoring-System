import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "./FaceRegistration.css";

export default function FaceRegistration({ user, onComplete }) {
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("initializing");
  const [message, setMessage] = useState("Loading face detection models...");
  const [capturedDescriptor, setCapturedDescriptor] = useState(null);
  const [captureCount, setCaptureCount] = useState(0);
  const detectionInterval = useRef(null);

  useEffect(() => {
    loadModelsAndStartCamera();
    return () => {
      stopCamera();
      if (detectionInterval.current) clearInterval(detectionInterval.current);
    };
  }, []);

  const loadModelsAndStartCamera = async () => {
    try {
      await tf.setBackend("webgl");
      await tf.ready();
      console.log("🎛️ TFJS backend: webgl ready");
      const MODEL_URL = process.env.PUBLIC_URL + "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus("ready");
        setMessage("Position your face in the camera");
      }
    } catch (err) {
      console.error("Error:", err);
      setStatus("error");
      setMessage("Failed to access camera or load models");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const startCapture = async () => {
    setStatus("capturing");
    setMessage("Keep your face steady...");
    setCaptureCount(0);

    const descriptors = [];

    detectionInterval.current = setInterval(async () => {
      if (!videoRef.current) return;

      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          descriptors.push(Array.from(detection.descriptor));
          setCaptureCount(prev => prev + 1);

          // Draw detection on canvas
          if (canvasRef.current) {
            const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
            const resizedDetection = faceapi.resizeResults(detection, dims);
            faceapi.draw.drawDetections(canvasRef.current, resizedDetection);
            faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetection);
          }

          // Capture 5 samples
          if (descriptors.length >= 5) {
            clearInterval(detectionInterval.current);
            
            // Average the descriptors for better accuracy
            const avgDescriptor = averageDescriptors(descriptors);
            setCapturedDescriptor(avgDescriptor);
            setStatus("captured");
            setMessage("Face captured successfully!");
          }
        } else {
          setMessage("No face detected. Please position your face clearly.");
        }
      } catch (error) {
        console.error("Detection error:", error);
      }
    }, 500);
  };

  const averageDescriptors = (descriptors) => {
    const avg = new Array(128).fill(0);
    descriptors.forEach(desc => {
      desc.forEach((val, idx) => {
        avg[idx] += val;
      });
    });
    return avg.map(val => val / descriptors.length);
  };

  const handleRegister = async () => {
    if (!capturedDescriptor) return;

    setStatus("registering");
    setMessage("Registering your face...");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/auth/register-face`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ faceDescriptor: capturedDescriptor }),
      });

      if (response.ok) {
        setStatus("success");
        setMessage("Face registered successfully!");
        stopCamera();
        setTimeout(() => onComplete && onComplete(), 2000);
      } else {
        throw new Error("Registration failed");
      }
    } catch (error) {
      console.error("Error registering face:", error);
      setStatus("error");
      setMessage("Failed to register face. Please try again.");
    }
  };

  const handleRetry = () => {
    setCapturedDescriptor(null);
    setCaptureCount(0);
    setStatus("ready");
    setMessage("Position your face in the camera");
    
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div className="face-registration-container">
      <div className="face-registration-card">
        <h2>📸 Face Registration</h2>
        <p className="subtitle">Register your face for identity verification during exams</p>

        <div className="camera-container">
          <video
            ref={videoRef}
            autoPlay
            muted
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
                  console.log(`📐 Resized face registration canvas to ${width}x${height} to prevent errors`);
                }
                
                canvasRef.current.width = width;
                canvasRef.current.height = height;
              }
            }}
          />
          <canvas ref={canvasRef} className="detection-canvas" />
        </div>

        <div className="status-message">
          <div className={`status-indicator ${status}`}></div>
          <p>{message}</p>
          {status === "capturing" && (
            <p className="capture-progress">Captured: {captureCount}/5</p>
          )}
        </div>

        <div className="instructions">
          <h4>Instructions:</h4>
          <ul>
            <li>✓ Ensure good lighting</li>
            <li>✓ Look directly at the camera</li>
            <li>✓ Remove glasses if possible</li>
            <li>✓ Keep your face centered</li>
            <li>✓ Maintain a neutral expression</li>
          </ul>
        </div>

        <div className="action-buttons">
          {status === "ready" && (
            <button onClick={startCapture} className="btn-primary">
              Start Capture
            </button>
          )}

          {status === "captured" && (
            <>
              <button onClick={handleRegister} className="btn-success">
                ✓ Register Face
              </button>
              <button onClick={handleRetry} className="btn-secondary">
                🔄 Retry
              </button>
            </>
          )}

          {status === "success" && (
            <button className="btn-success" disabled>
              ✓ Registered Successfully
            </button>
          )}

          {status === "error" && (
            <button onClick={handleRetry} className="btn-retry">
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}