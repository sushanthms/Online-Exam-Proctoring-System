const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: String,
  imageUrl: { type: String, default: null },
  options: [String],
  correctOption: Number,
});

const examPaperSchema = new mongoose.Schema({
  title: String,
  questions: [questionSchema],
  durationMins: { type: Number, default: 30 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // In MongoDB, every document has a unique _id field
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  answers: [{
    // For MCQ (existing)
    selectedOption: Number,
    
    // For Coding (new)
    code: String,
    language: String,
    testResults: {
      total: Number,
      passed: Number,
      failed: Number,
      cases: [{
        testCaseNumber: Number,
        passed: Boolean,
        input: String,
        expected: String,
        actual: String,
        hidden: Boolean,
        error: Boolean
      }]
    }
  }],
  
  // Add these proctoring fields if not present
  violations: [{
    type: String,
    description: String,
    timestamp: Date
  }],
  tabSwitchCount: { type: Number, default: 0 },
  multipleFaceCount: { type: Number, default: 0 }
});

module.exports = mongoose.model("ExamPaper", examPaperSchema);