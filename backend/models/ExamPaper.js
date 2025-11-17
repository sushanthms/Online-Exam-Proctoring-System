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
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model("ExamPaper", examPaperSchema);