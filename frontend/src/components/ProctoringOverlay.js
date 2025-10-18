import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

export default function ProctoringOverlay({ userId }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      startVideo();
    };

    loadModels();
  }, []);

  useEffect(() => {
    const detectFaces = async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;

      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      );

      if (detections.length > 1) {
        console.warn("⚠️ Multiple faces detected:", detections.length);

        // Send log to backend
        fetch("http://localhost:4000/api/proctor/logMultipleFace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            facesDetected: detections.length,
            timestamp: new Date().toISOString(),
          }),
        })
          .then((res) => res.json())
          .then((data) => console.log("Logged multiple face event:", data))
          .catch((err) => console.error("Error logging multiple face:", err));
      }
    };

    const interval = setInterval(detectFaces, 3000); // detect every 3 seconds
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        muted
        width="300"
        height="200"
        style={{ borderRadius: "10px", border: "2px solid #333" }}
      />
    </div>
  );
}
