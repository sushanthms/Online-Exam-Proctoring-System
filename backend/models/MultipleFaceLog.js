const mongoose = require("mongoose");

const multipleFaceLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // in seconds
}, { timestamps: true });

module.exports = mongoose.model("MultipleFaceLog", multipleFaceLogSchema);
