const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'verysecretkey';

// In-memory mock DB for exam questions and logs (for prototype)
let QUESTIONS = [
  { id: 1, q: "What is 2+2?", options: ["2","3","4","5"], ans: 2 },
  { id: 2, q: "Capital of India?", options: ["Delhi","Mumbai","Kolkata","Chennai"], ans: 0 },
  { id: 3, q: "JS stands for?", options: ["JavaScript","JavaServer","JustScript","JQuery"], ans: 0 }
];

let logs = [];

// auth middleware
function auth(req, res, next){
  const bearer = req.headers.authorization;
  if(!bearer) return res.status(401).send({message: 'unauth'});
  const token = bearer.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) { return res.status(401).send({message:'invalid token'}); }
}

// Get exam (shuffled per request)
router.get('/paper', auth, (req, res) => {
  // Basic shuffle: for prototype we shuffle options & order
  function shuffleArray(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } }
  const qcopy = JSON.parse(JSON.stringify(QUESTIONS));
  shuffleArray(qcopy);
  qcopy.forEach(q => shuffleArray(q.options));
  res.send({ examId: 'EXAM001', durationMins: 30, questions: qcopy });
});

// Submit answers
router.post('/submit', auth, (req, res) => {
  const { examId, answers } = req.body;
  // auto grade MCQ
  let score = 0;
  for (const answered of answers){
    const q = QUESTIONS.find(x => x.id === answered.id);
    if(q && q.options[answered.selected] && q.ans === answered.selected) score++;
  }
  // store log (in real system: DB)
  logs.push({ user: req.user.email, examId, score, timestamp: new Date() });
  res.send({ score, total: QUESTIONS.length });
});

// Endpoint to accept proctoring events (tab switch, face missing, object detected)
router.post('/proctor-event', auth, (req, res) => {
  const event = { user: req.user.email, type: req.body.type, data: req.body.data, ts: new Date() };
  logs.push(event);
  // for demo, return ack
  res.send({ ok: true });
});

router.get('/logs', auth, (req, res) => {
  res.send({ logs });
});

module.exports = router;
