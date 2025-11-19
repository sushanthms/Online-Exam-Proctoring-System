const express = require('express');
const router = express.Router();
const { authenticate } = require('./auth');
const CodingQuestion = require('../models/CodingQuestion');
const CodeSubmission = require('../models/CodingSubmission');
const runner = require('../utils/codeRunner');

router.get('/questions/:id', authenticate, async (req, res) => {
  try {
    const q = await CodingQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ error: 'Not found' });
    res.json(q);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/run', authenticate, async (req, res) => {
  try {
    const { language, code, testCases } = req.body;
    if (!language || !code || !Array.isArray(testCases)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    const results = [];
    for (const t of testCases) {
      const r = await runner.runCode(language, code, t.input || '');
      const out = (r.stdout || '').trim();
      const exp = (t.expectedOutput || '').trim();
      results.push({ input: t.input || '', output: out, passed: out === exp });
    }
    res.json({ output: results });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/submit', authenticate, async (req, res) => {
  try {
    const { questionId, examId, code, language } = req.body;
    const q = await CodingQuestion.findById(questionId);
    if (!q) return res.status(404).json({ error: 'Question not found' });
    const results = [];
    let passed = 0;
    for (const t of q.testCases) {
      const r = await runner.runCode(language, code, t.input || '');
      const out = (r.stdout || '').trim();
      const exp = (t.expectedOutput || '').trim();
      const ok = out === exp;
      if (ok) passed += 1;
      results.push({ input: t.input || '', output: out, passed: ok });
    }
    const sub = new CodeSubmission({
      userId: req.user.id,
      questionId,
      language,
      code,
      status: 'submitted',
      testCaseResults: results,
      score: passed,
    });
    await sub.save();
    res.json({ message: 'Submitted', score: passed });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
