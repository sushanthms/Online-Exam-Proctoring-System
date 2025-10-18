const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,  // ✅ Correct type
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
  answers: [
    {
      type: Number  // ✅ Simple and matches your submit route
    }
  ],
  score: {         // ✅ ADDED: Missing field
    type: Number, 
    required: true,
    default: 0
  },
  tabSwitches: [
    {
      timestamp: { 
        type: Date, 
        default: Date.now 
      }
    }
  ],
  multipleFaceLogs: [
    {
      timestamp: { 
        type: Date, 
        default: Date.now 
      },
      details: { 
        type: String 
      },
      facesDetected: {
        type: Number
      }
    }
  ],
  submittedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Submission", submissionSchema);