const mongoose = require("mongoose");

const CodeSubmissionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  questionId: mongoose.Schema.Types.ObjectId,
  language: String,
  code: String,
  status: String,
  testCaseResults: [{ input: String, output: String, passed: Boolean }],
  score: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CodeSubmission", CodeSubmissionSchema);
