const express = require("express");
const router = express.Router();
const MultipleFaceLog = require("../models/MultipleFaceLog");

// POST log
router.post("/logMultipleFace", async (req, res) => {
  try {
    const { userId, username, startTime, endTime, duration } = req.body;
    const log = await MultipleFaceLog.create({ userId, username, startTime, endTime, duration });
    res.status(200).json({ message: "Multiple face log saved", log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all logs (optional)
router.get("/getMultipleFaceLogs", async (req, res) => {
  try {
    const logs = await MultipleFaceLog.find().sort({ startTime: -1 });
    res.status(200).json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
