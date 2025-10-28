import mongoose from "mongoose";

const proctorLogSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  data: { type: Object },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("ProctorLog", proctorLogSchema);
