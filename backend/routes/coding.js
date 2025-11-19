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
    if (req.user && req.user.role === 'admin') {
      return res.json(q);
    }
    const sanitized = q.toObject();
    sanitized.testCases = (sanitized.testCases || []).map(tc => ({
      input: tc.isHidden ? undefined : tc.input,
      expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
      isHidden: !!tc.isHidden
    }));
    res.json(sanitized);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/available', authenticate, async (req, res) => {
  try {
    const list = await CodingQuestion.find().sort({ _id: -1 });
    const sanitized = list.map(q => ({
      _id: q._id,
      title: q.title,
      description: q.description,
      languagesAllowed: q.languagesAllowed,
      testCaseCount: Array.isArray(q.testCases) ? q.testCases.length : 0
    }));
    res.json({ questions: sanitized });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/run', authenticate, async (req, res) => {
  try {
    const { language, code, questionId } = req.body;
    if (!language || !code || !questionId) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    const q = await CodingQuestion.findById(questionId);
    if (!q) return res.status(404).json({ error: 'Question not found' });
    const results = [];
    for (const t of q.testCases) {
      const r = await runner.runCode(language, code, t.input || '');
      const out = (r.stdout || '').trim();
      const exp = (t.expectedOutput || '').trim();
      const passed = out === exp;
      results.push({
        hidden: !!t.isHidden,
        inputShown: t.isHidden ? 'hidden' : (t.input || ''),
        expectedShown: t.isHidden ? 'hidden' : (t.expectedOutput || ''),
        output: out,
        passed
      });
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
