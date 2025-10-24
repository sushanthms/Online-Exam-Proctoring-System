const mongoose = require("mongoose");

const faceVerificationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  examId: {
    type: String,
    required: true,
  },
  verificationStatus: {
    type: String,
    enum: ['verified', 'failed', 'no_face', 'multiple_faces'],
    required: true
  },
  confidence: {
    type: Number, // Similarity score (0-1)
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: String
});

module.exports = mongoose.model("FaceVerificationLog", faceVerificationLogSchema);
