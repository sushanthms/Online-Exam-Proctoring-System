const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const ExamPaper = require("../models/ExamPaper");
const Submission = require("../models/Submission");
const { authenticate } = require('./auth'); // IMPORT FROM AUTH

const JWT_SECRET = process.env.JWT_SECRET || "verysecretkey";

// Temporary mock data (used if no data in DB)
let QUESTIONS = [
  { id: 1, q: "What is 2+2?", options: ["2", "3", "4", "5"], ans: 2 },
  { id: 2, q: "Capital of India?", options: ["Delhi", "Mumbai", "Kolkata", "Chennai"], ans: 0 },
  { id: 3, q: "JS stands for?", options: ["JavaScript", "JavaServer", "JustScript", "JQuery"], ans: 0 },
];

let logs = [];

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
          correctOption: q.ans,
        })),
      };
    } else {
      try {
        selectedExam = await ExamPaper.findById(examId);
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
    console.log("Received submission:", req.body);
    console.log("User from token:", req.user);

    const { userId, examId, answers } = req.body;

    if (!examId || !answers) {
      return res.status(400).json({ error: "Missing examId or answers" });
    }

    let examPaper;
    
    if (examId === "EXAM001") {
      examPaper = {
        _id: examId,
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

    let score = 0;
    answers.forEach((answer, index) => {
      if (examPaper.questions[index] && answer === examPaper.questions[index].correctOption) {
        score++;
      }
    });

    console.log("Calculated score:", score);

    const User = require("../models/User");
    const user = await User.findById(req.user.id);

    const submission = new Submission({
      userId: req.user.id,
      username: user ? user.name : "Unknown",
      examId: examId,
      answers: answers,
      score: score,
      submittedAt: new Date(),
    });

    await submission.save();
    console.log("Submission saved:", submission._id);

    res.json({
      message: "Exam submitted successfully!",
      totalQuestions: examPaper.questions.length,
      score: score,
      submissionId: submission._id,
    });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

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
        questions: QUESTIONS.map(q => ({
          text: q.q,
          options: q.options,
          correctOption: q.ans
        }))
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
        questions: QUESTIONS.map(q => ({
          text: q.q,
          options: q.options,
          correctOption: q.ans
        }))
      };
    }

    console.log("Returning result data");

    res.json({
      userId: submission.userId,
      examId: submission.examId,
      score: submission.score,
      totalQuestions: examPaper.questions.length,
      questions: examPaper.questions,
      answers: submission.answers,
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
module.exports = router;