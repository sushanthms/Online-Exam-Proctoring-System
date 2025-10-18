const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: String,
  options: [String],
  correctOption: Number, // index of correct option
});

const examPaperSchema = new mongoose.Schema({
  title: String,
  questions: [questionSchema],
});

module.exports = mongoose.model("ExamPaper", examPaperSchema);
