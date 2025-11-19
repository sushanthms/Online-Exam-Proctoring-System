const mongoose = require("mongoose");

const TestCaseSchema = new mongoose.Schema({
  input: String,
  expectedOutput: String,
  isHidden: Boolean
});

const CodingQuestionSchema = new mongoose.Schema({
  title: String,
  description: String,
  languagesAllowed: [String],
  testCases: [TestCaseSchema],
  timeLimit: { type: Number, default: 2 }, // seconds
  memoryLimit: { type: Number, default: 256 }, // MB
});

module.exports = mongoose.model("CodingQuestion", CodingQuestionSchema);
