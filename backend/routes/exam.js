// exam.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const ExamPaper = require("../models/ExamPaper");
const Submission = require("../models/Submission");
const { authenticate } = require('./auth'); // IMPORT FROM AUTH
const FaceVerificationLog = require("../models/FaceVerificationLog");

const JWT_SECRET = process.env.JWT_SECRET || "verysecretkey";

// Temporary mock data (used if no data in DB)
let QUESTIONS = [
  { id: 1, q: "What is 2+2?", options: ["2", "3", "4", "5"], ans: 2 },
  { id: 2, q: "Capital of India?", options: ["Delhi", "Mumbai", "Kolkata", "Chennai"], ans: 0 },
  { id: 3, q: "JS stands for?", options: ["JavaScript", "JavaServer", "JustScript", "JQuery"], ans: 0 },
];

let logs = [];

// Helper: given a question object (from DB or mock), compute correctOptionIndex and correctOptionValue
function normalizeQuestion(q) {
  // q is expected to have at least: text (or q), options (array), and either correctOption (index) or ans (index) or correctOptionValue (string)
  const options = q.options || q.opts || [];
  let correctIndex = null;
  let correctValue = null;

  // Common naming possibilities
  if (typeof q.correctOption === "number") {
    correctIndex = q.correctOption;
  } else if (typeof q.ans === "number") {
    correctIndex = q.ans;
  }

  // If correctIndex available and options present
  if (Number.isInteger(correctIndex) && options[correctIndex] !== undefined) {
    correctValue = options[correctIndex];
  }

  // If direct correctOptionValue provided (string) use it
  if (!correctValue && typeof q.correctOptionValue === "string") {
    correctValue = q.correctOptionValue;
  } else if (!correctValue && typeof q.correctAnswer === "string") {
    correctValue = q.correctAnswer;
  }

  // Fallback: if correctIndex isn't set but correctValue exists in options, derive index
  if (!Number.isInteger(correctIndex) && correctValue) {
    const idx = options.indexOf(correctValue);
    if (idx >= 0) correctIndex = idx;
  }

  // Final fallback: leave as nulls if we couldn't determine
  return {
    text: q.text || q.q || "",
    options,
    correctOption: Number.isInteger(correctIndex) ? correctIndex : null,
    correctOptionValue: typeof correctValue === "string" ? correctValue : null,
  };
}

// ========== AUTH MIDDLEWARE ==========
function auth(req, res, next) {
  const bearer = req.headers.authorization;
  if (!bearer) return res.status(401).send({ message: "unauthorized" });
  const token = bearer.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).send({ message: "invalid token" });
  }
}

// ========== GET AVAILABLE EXAMS (for home page) ==========
router.get("/available", authenticate, async (req, res) => {
  try {
    const exams = await ExamPaper.find().select('title questions durationMins');

    if (!exams || exams.length === 0) {
      return res.json({
        exams: [
          {
            _id: "EXAM001",
            title: "Sample JavaScript Exam",
            durationMins: 10,
            questions: QUESTIONS
          }
        ]
      });
    }

    const examList = exams.map(exam => ({
      _id: exam._id,
      title: exam.title,
      durationMins: exam.durationMins || 30,
      questions: exam.questions
    }));

    res.json({ exams: examList });
  } catch (error) {
    console.error("Error fetching available exams:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== GET SPECIFIC EXAM PAPER BY ID ==========
router.get("/paper/:examId", authenticate, async (req, res) => {
  try {
    const { examId } = req.params;
    console.log("Fetching exam with ID:", examId);

    let selectedExam;

    if (examId === "EXAM001") {
      selectedExam = {
          _id: "EXAM001",
          title: "Sample JavaScript Exam",
          durationMins: 10,
          questions: QUESTIONS.map((q) => ({
            text: q.q,
            options: q.options,
            imageUrl: q.imageUrl || null,
            // NOTE: do NOT reveal correctOptionValue to the client in a real system.
            // The system currently included correctOption; keep as index if needed by front-end.
            correctOption: q.ans,
          })),
        };
    } else {
      try {
        selectedExam = await ExamPaper.findById(examId);
        
        // Ensure we're sending the complete exam data including imageUrl
        if (selectedExam) {
          selectedExam = selectedExam.toObject();
          // Make sure each question includes the imageUrl field
          selectedExam.questions = selectedExam.questions.map(q => ({
            ...q,
            imageUrl: q.imageUrl || null
          }));
        }
      } catch (err) {
        console.error("Error finding exam:", err);
        return res.status(404).json({ error: "Exam not found" });
      }
    }

    if (!selectedExam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    console.log("Exam found:", selectedExam.title);

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }

    const qcopy = JSON.parse(JSON.stringify(selectedExam.questions));
    shuffle(qcopy);
    qcopy.forEach((q) => shuffle(q.options));

    // Important: do not attach the correctOptionValue to the response (keeps answers secret).
    // We'll rely on students sending back option text values; backend can still store the correct text internally.

    res.json({
      examId: selectedExam._id,
      title: selectedExam.title,
      durationMins: selectedExam.durationMins || 10,
      questions: qcopy,
    });
  } catch (error) {
    console.error("Error fetching exam paper:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== OLD PAPER ROUTE (Keep for backward compatibility or remove) ==========
router.get("/paper", authenticate, async (req, res) => {
  try {
    const examPapers = await ExamPaper.find();
    let selectedExam;

    if (examPapers && examPapers.length > 0) {
      selectedExam = examPapers[0];
    } else {
      selectedExam = {
        _id: "EXAM001",
        title: "Sample Exam",
        durationMins: 30,
        questions: QUESTIONS.map((q) => ({
          text: q.q,
          options: q.options,
          correctOption: q.ans,
        })),
      };
    }

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }

    const qcopy = JSON.parse(JSON.stringify(selectedExam.questions));
    shuffle(qcopy);
    qcopy.forEach((q) => shuffle(q.options));

    res.json({
      examId: selectedExam._id,
      durationMins: selectedExam.durationMins || 30,
      questions: qcopy,
    });
  } catch (error) {
    console.error("Error fetching exam paper:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== SUBMIT EXAM ==========
router.post("/submit", authenticate, async (req, res) => {
  try {
    console.log("📥 Received submission:", req.body);

    const { 
      userId, 
      username,
      examId, 
      examTitle,
      answers,
      tabSwitches = [],
      multipleFaceLogs = [],
      identityVerifications = [],
      warnings = [],
      examSession = {},
      proctoringSummary = {}
    } = req.body;

    if (!examId || !answers) {
      return res.status(400).json({ error: "Missing examId or answers" });
    }

    // Load exam paper to get correct answers
    let examPaper;
    if (examId === "EXAM001") {
      examPaper = {
        _id: examId,
        title: "Sample Exam",
        questions: QUESTIONS.map(q => ({
          text: q.q,
          options: q.options,
          correctOption: q.ans
        }))
      };
    } else {
      try {
        examPaper = await ExamPaper.findById(examId);
      } catch (err) {
        examPaper = null;
      }
    }

    if (!examPaper) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Normalize questions and calculate score
    const normalizedQuestions = (examPaper.questions || []).map(q => {
      const nq = normalizeQuestion(q);
      if (!nq.correctOptionValue && nq.correctOption !== null && nq.options[nq.correctOption]) {
        nq.correctOptionValue = nq.options[nq.correctOption];
      }
      return nq;
    });

    let score = 0;
    const correctAnswersArray = [];

    answers.forEach((answer, index) => {
      const q = normalizedQuestions[index];
      if (!q) {
        correctAnswersArray.push("");
        return;
      }
      
      const studentAnswerValue = answer;
      const correctValue = q.correctOptionValue;
      correctAnswersArray.push(correctValue || "");

      if (!correctValue) {
        console.warn(`No correct value for question ${index}`);
        return;
      }

      if (String(studentAnswerValue || "").trim() === String(correctValue || "").trim()) {
        score++;
      }
    });

    console.log("📊 Calculated score:", score, "/", normalizedQuestions.length);

    // Get user info
    const User = require("../models/User");
    const user = await User.findById(req.user.id);

    // Create submission with ALL data
    const submission = new Submission({
      userId: req.user.id,
      username: username || (user ? user.name : "Unknown"),
      examId: examId,
      examTitle: examTitle || examPaper.title,
      answers: answers,
      correctAnswers: correctAnswersArray,
      score: score,
      
      // Enhanced proctoring data
      tabSwitches: tabSwitches.map(ts => ({
        timestamp: new Date(ts.timestamp),
        timeInExam: ts.timeInExam,
        warningMessage: ts.warningMessage
      })),
      
      multipleFaceLogs: multipleFaceLogs.map(mf => ({
        timestamp: new Date(mf.timestamp),
        timeInExam: mf.timeInExam,
        facesDetected: mf.facesDetected,
        duration: mf.duration,
        details: mf.details
      })),
      
      identityVerifications: identityVerifications.map(iv => ({
        timestamp: new Date(iv.timestamp),
        timeInExam: iv.timeInExam,
        status: iv.status,
        confidence: iv.confidence,
        matchScore: iv.matchScore,
        details: iv.details
      })),
      
      warnings: warnings.map(w => ({
        timestamp: new Date(w.timestamp),
        timeInExam: w.timeInExam,
        type: w.type,
        severity: w.severity,
        message: w.message
      })),
      
      examSession: {
        startedAt: examSession.startedAt ? new Date(examSession.startedAt) : new Date(),
        submittedAt: examSession.submittedAt ? new Date(examSession.submittedAt) : new Date(),
        duration: examSession.duration || 0,
        autoSubmitted: examSession.autoSubmitted || false,
        autoSubmitReason: examSession.autoSubmitReason || null
      },
      
      proctoringSummary: {
        totalTabSwitches: proctoringSummary.totalTabSwitches || tabSwitches.length,
        totalIdentityFailures: proctoringSummary.totalIdentityFailures || 0,
        totalMultipleFaceEvents: proctoringSummary.totalMultipleFaceEvents || multipleFaceLogs.length,
        totalWarnings: proctoringSummary.totalWarnings || warnings.length,
        verificationSuccessRate: proctoringSummary.verificationSuccessRate || 100
      },
      
      submittedAt: new Date(),
    });

    await submission.save();
    console.log("✅ Submission saved with complete data:", submission._id);

    res.json({
      message: "Exam submitted successfully!",
      totalQuestions: normalizedQuestions.length,
      score: score,
      submissionId: submission._id,
      proctoringSummary: submission.proctoringSummary
    });
  } catch (err) {
    console.error("❌ Submit error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Helper function (if not already present)
function normalizeQuestion(q) {
  const options = q.options || q.opts || [];
  let correctIndex = null;
  let correctValue = null;

  if (typeof q.correctOption === "number") {
    correctIndex = q.correctOption;
  } else if (typeof q.ans === "number") {
    correctIndex = q.ans;
  }

  if (Number.isInteger(correctIndex) && options[correctIndex] !== undefined) {
    correctValue = options[correctIndex];
  }

  if (!correctValue && typeof q.correctOptionValue === "string") {
    correctValue = q.correctOptionValue;
  } else if (!correctValue && typeof q.correctAnswer === "string") {
    correctValue = q.correctAnswer;
  }

  if (!Number.isInteger(correctIndex) && correctValue) {
    const idx = options.indexOf(correctValue);
    if (idx >= 0) correctIndex = idx;
  }

  return {
    text: q.text || q.q || "",
    options,
    correctOption: Number.isInteger(correctIndex) ? correctIndex : null,
    correctOptionValue: typeof correctValue === "string" ? correctValue : null,
  };
}

// ========== GET RESULT BY SUBMISSION ID ==========
router.get("/result/:submissionId", authenticate, async (req, res) => {
  try {
    console.log("Fetching result for submission:", req.params.submissionId);

    const submission = await Submission.findById(req.params.submissionId);

    if (!submission) {
      console.log("Submission not found");
      return res.status(404).json({ error: "Submission not found" });
    }

    console.log("Submission found:", submission);

    let examPaper;

    if (submission.examId === "EXAM001") {
      examPaper = {
        _id: submission.examId,
        questions: QUESTIONS.map((q) => ({
          text: q.q,
          options: q.options,
          correctOption: q.ans,
        })),
      };
    } else {
      try {
        examPaper = await ExamPaper.findById(submission.examId);
      } catch (err) {
        examPaper = null;
      }
    }

    if (!examPaper) {
      console.log("Using mock exam data for result");
      examPaper = {
        _id: submission.examId,
        questions: QUESTIONS.map((q) => ({
          text: q.q,
          options: q.options,
          correctOption: q.ans,
        })),
      };
    }

    // Normalize questions for display
    const normalizedQuestions = (examPaper.questions || []).map((q) => {
      const nq = normalizeQuestion(q);
      if (nq.correctOption === null && nq.correctOptionValue) {
        const idx = nq.options.indexOf(nq.correctOptionValue);
        if (idx >= 0) nq.correctOption = idx;
      }
      return nq;
    });

    console.log("Returning result data");

    // ✅ Include current submission's multipleFaceLogs in the result
    res.json({
      userId: submission.userId,
      examId: submission.examId,
      score: submission.score,
      totalQuestions: normalizedQuestions.length,
      questions: normalizedQuestions,
      answers: submission.answers,
      multipleFaceLogs: submission.multipleFaceLogs || [], // ✅ Added
    });
  } catch (err) {
    console.error("Result fetch error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});


// ========== PROCTORING EVENTS ==========
const MultipleFaceLog = require("../models/MultipleFaceLog");

router.post("/proctor-event", authenticate, async (req, res) => {
  try {
    const { examId, type, data } = req.body;

    if (type === "multiple-face") {
      await MultipleFaceLog.create({
        userId: req.user.id,
        examId,
        details: data?.message || "Multiple faces detected",
      });
    }

    logs.push({
      user: req.user.email,
      type,
      data,
      examId,
      ts: new Date(),
    });

    res.send({ ok: true });
  } catch (error) {
    console.error("Error logging proctor event:", error);
    res.status(500).json({ error: "Failed to log proctoring event" });
  }
});

router.get("/face-logs/:userId/:examId", authenticate, async (req, res) => {
  try {
    const { userId, examId } = req.params;

    const logs = await MultipleFaceLog.find({ userId, examId })
      .sort({ timestamp: 1 })
      .lean();

    res.json({ faceLogs: logs });
  } catch (err) {
    console.error("Error fetching face logs:", err);
    res.status(500).json({ error: "Failed to fetch face logs" });
  }
});

router.get("/logs", authenticate, (req, res) => {
  res.send({ logs });
});

// ========== GET USER'S SUBMISSIONS ==========
router.get("/my-submissions/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own data
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const submissions = await Submission.find({ userId })
      .sort({ submittedAt: -1 })
      .lean();

    res.json({ submissions });
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/verify-face", authenticate, async (req, res) => {
  try {
    const { examId, verificationStatus, confidence, details } = req.body;

    const log = new FaceVerificationLog({
      userId: req.user.id,
      examId,
      verificationStatus,
      confidence: confidence || 0,
      details: details || '',
      timestamp: new Date()
    });

    await log.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Error logging face verification:", error);
    res.status(500).json({ error: "Failed to log verification" });
  }
});

// Get face verification logs for a specific exam
router.get("/face-verification-logs/:userId/:examId", authenticate, async (req, res) => {
  try {
    const { userId, examId } = req.params;

    // Check if user is requesting their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const logs = await FaceVerificationLog.find({ userId, examId })
      .sort({ timestamp: 1 })
      .lean();

    res.json({ verificationLogs: logs });
  } catch (err) {
    console.error("Error fetching verification logs:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});
router.get('/test-verification-logs', authenticate, async (req, res) => {
  try {
    const FaceVerificationLog = require('../models/FaceVerificationLog');
    
    // Get all logs
    const logs = await FaceVerificationLog.find().limit(10);
    
    // Get count
    const count = await FaceVerificationLog.countDocuments();
    
    res.json({
      totalLogs: count,
      recentLogs: logs,
      collectionExists: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Error accessing logs',
      error: err.message 
    });
  }
});
module.exports = router;
