const express = require("express");
const router = express.Router();
const { authenticate, adminOnly } = require("./auth");
const CodingQuestion = require("../models/CodingQuestion");
const CodingSubmission = require("../models/CodingSubmission");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

async function runCode(language, code, input) {
  const baseDir = path.join(os.tmpdir(), "proctor-code");
  try { fs.mkdirSync(baseDir, { recursive: true }); } catch {}
  const id = `${Date.now()}-${Math.floor(Math.random()*100000)}`;
  const folder = path.join(baseDir, id);
  fs.mkdirSync(folder, { recursive: true });

  let file;
  let cmd;

  if (language === "python") {
    file = path.join(folder, "solution.py");
    fs.writeFileSync(file, code);
    const py = process.platform === "win32" ? "python" : "python3";
    cmd = `${py} "${file}"`;
  } else if (language === "cpp") {
    file = path.join(folder, "solution.cpp");
    fs.writeFileSync(file, code);
    const out = path.join(folder, process.platform === "win32" ? "a.exe" : "a.out");
    cmd = `g++ "${file}" -o "${out}" && "${out}"`;
  } else if (language === "javascript") {
    file = path.join(folder, "solution.js");
    fs.writeFileSync(file, code);
    cmd = `node "${file}"`;
  } else {
    return { stdout: "", stderr: `Unsupported language: ${language}` };
  }

  return new Promise((resolve) => {
    const child = exec(cmd, { timeout: 7000 }, (err, stdout, stderr) => {
      resolve({ stdout, stderr: stderr || (err ? err.message : "") });
      // best-effort cleanup
      try { fs.rmSync(folder, { recursive: true, force: true }); } catch {}
    });
    if (input && typeof input === "string") {
      try { child.stdin.write(input); child.stdin.end(); } catch {}
    }
  });
}

router.post("/create", adminOnly, async (req, res) => {
  try {
    const { title, description, languagesAllowed, testCases, timeLimit, memoryLimit } = req.body;
    const question = await CodingQuestion.create({
      title,
      description,
      languagesAllowed: languagesAllowed || ["javascript", "python", "cpp"],
      testCases: (testCases || []).map(tc => ({
        input: tc.input || "",
        expectedOutput: tc.expectedOutput || "",
        isHidden: !!tc.isHidden
      })),
      timeLimit: timeLimit || 2,
      memoryLimit: memoryLimit || 256
    });
    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/questions", authenticate, async (req, res) => {
  try {
    const questions = await CodingQuestion.find().lean();
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/questions/:id", authenticate, async (req, res) => {
  try {
    const question = await CodingQuestion.findById(req.params.id).lean();
    if (!question) return res.status(404).json({ error: "Question not found" });
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/run", authenticate, async (req, res) => {
  try {
    const { code, language, testCases } = req.body;
    if (!code || !language) return res.status(400).json({ error: "Code and language are required" });
    const input = Array.isArray(testCases) && testCases.length > 0 ? (testCases[0].input || "") : "";
    const result = await runCode(language, code, input);
    if (result.stderr) return res.status(400).json({ success: false, error: result.stderr });
    res.json({ success: true, output: (result.stdout || "").trim(), input: input || "No input provided" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/test", authenticate, async (req, res) => {
  try {
    const { code, language, testCases } = req.body;
    if (!code || !language || !Array.isArray(testCases)) return res.status(400).json({ error: "Code, language, and test cases are required" });
    const results = { total: testCases.length, passed: 0, failed: 0, cases: [] };
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      try {
        const run = await runCode(language, code, tc.input || "");
        const actual = (run.stdout || "").trim();
        const expected = (tc.expectedOutput || "").trim();
        const passed = actual === expected;
        if (passed) results.passed++; else results.failed++;
        results.cases.push({
          testCaseNumber: i + 1,
          passed,
          input: tc.isHidden ? "Hidden" : (tc.input || ""),
          expected: tc.isHidden ? "Hidden" : expected,
          actual: tc.isHidden ? (passed ? "Correct" : "Incorrect") : actual,
          hidden: !!tc.isHidden
        });
      } catch (e) {
        results.failed++;
        results.cases.push({
          testCaseNumber: i + 1,
          passed: false,
          input: tc.isHidden ? "Hidden" : (tc.input || ""),
          expected: tc.isHidden ? "Hidden" : (tc.expectedOutput || ""),
          actual: e.message,
          error: true,
          hidden: !!tc.isHidden
        });
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/submit", authenticate, async (req, res) => {
  try {
    const { code, language, questionId, testCases } = req.body;
    if (!code || !language || !questionId || !Array.isArray(testCases)) return res.status(400).json({ error: "Code, language, question ID, and test cases are required" });
    let passed = 0;
    for (const tc of testCases) {
      try {
        const run = await runCode(language, code, tc.input || "");
        if ((run.stdout || "").trim() === (tc.expectedOutput || "").trim()) passed++;
      } catch {}
    }
    const total = testCases.length;
    const submission = await CodingSubmission.create({
      userId: req.user.id,
      questionId,
      language,
      code,
      status: "evaluated",
      testCaseResults: [],
      score: Math.round((passed / total) * 100)
    });
    res.json({ success: true, questionId, totalTests: total, passedTests: passed, failedTests: total - passed, scorePercentage: ((passed / total) * 100).toFixed(2), submissionId: submission._id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;