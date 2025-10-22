const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('./auth');
const ExamPaper = require('../models/ExamPaper');
const Submission = require('../models/Submission');
const User = require('../models/User');
const MultipleFaceLog = require('../models/MultipleFaceLog');

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(adminOnly);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalExams = await ExamPaper.countDocuments();
    const totalSubmissions = await Submission.countDocuments();
    
    const recentSubmissions = await Submission.find()
      .sort({ submittedAt: -1 })
      .limit(10);

    // Get user details for recent submissions
    const submissionsWithUsers = await Promise.all(
      recentSubmissions.map(async (sub) => {
        const user = await User.findById(sub.userId).select('name email');
        return { ...sub.toObject(), userDetails: user };
      })
    );

    res.json({
      stats: {
        totalUsers,
        totalStudents,
        totalAdmins,
        totalExams,
        totalSubmissions
      },
      recentSubmissions: submissionsWithUsers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all submissions with filters
router.get('/submissions', async (req, res) => {
  try {
    const { examId, userId } = req.query;
    
    let filter = {};
    if (examId) filter.examId = examId;
    if (userId) filter.userId = userId;

    const submissions = await Submission.find(filter)
      .sort({ submittedAt: -1 });

    // Get user details for each submission
    const submissionsWithUsers = await Promise.all(
      submissions.map(async (sub) => {
        const user = await User.findById(sub.userId).select('name email');
        const exam = await ExamPaper.findById(sub.examId).select('title');
        return { 
          ...sub.toObject(), 
          userDetails: user,
          examDetails: exam
        };
      })
    );

    res.json({ submissions: submissionsWithUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get detailed submission with proctoring logs
router.get('/submission/:submissionId', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const user = await User.findById(submission.userId).select('-passwordHash');
    const exam = await ExamPaper.findById(submission.examId);
    const faceLogs = await MultipleFaceLog.find({
      userId: submission.userId,
      examId: submission.examId
    }).sort({ timestamp: 1 });

    res.json({
      submission,
      user,
      exam,
      faceLogs
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new exam
router.post('/exam/create', async (req, res) => {
  try {
    const { title, questions, durationMins } = req.body;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Title and questions required' });
    }

    const exam = new ExamPaper({
      title,
      questions,
      durationMins: durationMins || 30,
      createdBy: req.user.id,
      createdAt: new Date()
    });

    await exam.save();
    res.json({ message: 'Exam created successfully', exam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all exams (for admin)
router.get('/exams', async (req, res) => {
  try {
    const exams = await ExamPaper.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ exams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update exam
router.put('/exam/:examId', async (req, res) => {
  try {
    const { title, questions, durationMins, isActive } = req.body;
    
    const exam = await ExamPaper.findByIdAndUpdate(
      req.params.examId,
      { title, questions, durationMins, isActive },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json({ message: 'Exam updated successfully', exam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete exam
router.delete('/exam/:examId', async (req, res) => {
  try {
    const exam = await ExamPaper.findByIdAndDelete(req.params.examId);
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json({ message: 'Exam deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle user active status
router.patch('/user/:userId/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      user: { _id: user._id, name: user.name, isActive: user.isActive }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get proctoring violations
router.get('/violations', async (req, res) => {
  try {
    const faceLogs = await MultipleFaceLog.find()
      .sort({ timestamp: -1 })
      .limit(100);

    const logsWithUsers = await Promise.all(
      faceLogs.map(async (log) => {
        const user = await User.findById(log.userId).select('name email');
        const exam = await ExamPaper.findById(log.examId).select('title');
        return { 
          ...log.toObject(), 
          user,
          exam
        };
      })
    );

    res.json({ violations: logsWithUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;