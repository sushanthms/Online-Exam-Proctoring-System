const express = require("express");
const router = express.Router();
const MultipleFaceLog = require("../models/MultipleFaceLog");

// POST: Log multiple face detection event
router.post("/logMultipleFace", async (req, res) => {
  try {
    const { userId, facesDetected, timestamp } = req.body;
    const newLog = new MultipleFaceLog({
      userId,
      facesDetected,
      timestamp: timestamp || new Date(),
    });
    await newLog.save();
    res.json({ message: "Multiple face event logged", log: newLog });
  } catch (error) {
    console.error("Error saving log:", error);
    res.status(500).json({ error: "Server error while saving log" });
  }
});

module.exports = router;

