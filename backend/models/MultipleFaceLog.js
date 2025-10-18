const mongoose = require("mongoose");

const multipleFaceLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  examId: {
    type: String, // or mongoose.Schema.Types.ObjectId if your exams are stored in DB
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: String, // e.g. "Multiple faces detected during monitoring"
  },
});

module.exports = mongoose.model("MultipleFaceLog", multipleFaceLogSchema);
