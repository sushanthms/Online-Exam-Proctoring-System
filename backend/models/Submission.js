// backend/models/Submission.js - ENHANCED VERSION
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true 
  },
  username: { 
    type: String 
  },
  examId: { 
    type: String,
    required: true 
  },
  examTitle: {
    type: String
  },
  answers: {
    type: [String],
    required: true
  },
  correctAnswers: {
    type: [String],
    required: true
  },
  score: {
    type: Number, 
    required: true,
    default: 0
  },
  
  // ===== ENHANCED PROCTORING DATA =====
  
  // Tab Switch Events with detailed timestamps
  tabSwitches: [{
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    timeInExam: {
      type: String // e.g., "5:23" (5 minutes 23 seconds into exam)
    },
    warningMessage: {
      type: String
    }
  }],
  
  // Multiple Face Detection Events
  multipleFaceLogs: [{
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    timeInExam: {
      type: String
    },
    facesDetected: {
      type: Number
    },
    duration: {
      type: Number // Duration in seconds
    },
    details: { 
      type: String 
    }
  }],
  
  // Identity Verification Events (NEW)
  identityVerifications: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    timeInExam: {
      type: String
    },
    status: {
      type: String,
      enum: ['verified', 'failed', 'no_face', 'warning']
    },
    confidence: {
      type: Number, // Match percentage (0-100)
      default: 0
    },
    matchScore: {
      type: Number // Euclidean distance (lower is better)
    },
    details: {
      type: String
    }
  }],
  
  // Warning Events (NEW)
  warnings: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    timeInExam: {
      type: String
    },
    type: {
      type: String,
      enum: ['tab_switch', 'identity_mismatch', 'multiple_faces', 'no_face', 'other']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    message: {
      type: String
    }
  }],
  
  // Exam Session Metadata
  examSession: {
    startedAt: {
      type: Date
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    duration: {
      type: Number // Actual time taken in seconds
    },
    autoSubmitted: {
      type: Boolean,
      default: false
    },
    autoSubmitReason: {
      type: String,
      enum: ['time_expired', 'tab_switches', 'identity_failures', 'manual', null]
    }
  },
  
  // Summary Statistics
  proctoringSummary: {
    totalTabSwitches: {
      type: Number,
      default: 0
    },
    totalIdentityFailures: {
      type: Number,
      default: 0
    },
    totalMultipleFaceEvents: {
      type: Number,
      default: 0
    },
    totalWarnings: {
      type: Number,
      default: 0
    },
    verificationSuccessRate: {
      type: Number, // Percentage of successful verifications
      default: 100
    }
  },
  
  submittedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Virtual for percentage
submissionSchema.virtual('percentage').get(function() {
  if (!this.answers || this.answers.length === 0) return 0;
  return ((this.score / this.answers.length) * 100).toFixed(1);
});

// Virtual for pass/fail
submissionSchema.virtual('isPassed').get(function() {
  return this.percentage >= 60;
});

// Ensure virtuals are included in JSON
submissionSchema.set('toJSON', { virtuals: true });
submissionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Submission", submissionSchema);