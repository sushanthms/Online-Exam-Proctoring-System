import React, { useEffect, useState, useRef } from 'react';
import { examApi } from '../api';
import ProctoringOverlay from './ProctoringOverlay';
import '../styles.css'; // Make sure CSS is imported

export default function ExamPage({ user, onLogout }) {
  const [paper, setPaper] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [status, setStatus] = useState('Initializing');
  const [timeLeft, setTimeLeft] = useState(0);
  const videoRef = useRef();

  // fetch exam paper
  useEffect(() => {
    let mounted = true;
    (async () => {
      setStatus('Fetching exam...');
      const data = await examApi.getPaper();
      if (!mounted) return;
      setPaper(data);
      setTimeLeft(data.durationMins * 60);
      setStatus('Ready');
      setAnswers(data.questions.map(q => ({ id: q.id, selected: null })));
    })();
    return () => (mounted = false);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(t0 => Math.max(0, t0 - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  // Auto submit when time reaches 0
  useEffect(() => {
    if (timeLeft === 0 && paper) handleSubmit();
  }, [timeLeft]);

  // Tab switch detection
  useEffect(() => {
    function onBlur() {
      setStatus('Tab switched');
      examApi.sendProctorEvent({ type: 'tab-switch', data: {} });
    }
    function onFocus() {
      setStatus('Focused');
    }
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Webcam start
  useEffect(() => {
    async function startCam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus('Camera active');
      } catch (e) {
        setStatus('Camera error');
      }
    }
    startCam();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Periodic proctor heartbeat
  useEffect(() => {
    const id = setInterval(async () => {
      await examApi.sendProctorEvent({ type: 'heartbeat', data: { status } });
    }, 15000);
    return () => clearInterval(id);
  }, [status]);

  if (!paper) return <div className="container"><h3>Loading exam...</h3></div>;

  function selectOption(qid, idx) {
    setAnswers(prev => prev.map(a => a.id === qid ? { ...a, selected: idx } : a));
  }

  async function handleSubmit() {
    setStatus('Submitting...');
    const resp = await examApi.submit({ examId: paper.examId, answers });
    setStatus(`Submitted. Score: ${resp.score}/${resp.total}`);
  }

  return (
    <div className="container">
      <div className="exam-header">
        <h3>Exam: {paper.examId}</h3>
        <div>
          <span style={{ marginRight: 10 }}>Student: {user.name}</span>
          <button className="btn" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="exam-body">
        <div className="exam-content">
          <div className="timer">Time left: <strong>{Math.floor(timeLeft / 60)}:{('0'+timeLeft%60).slice(-2)}</strong></div>
          {paper.questions.map((q, qi) => (
            <div key={q.id} className="question">
              <div><strong>Q{qi + 1}.</strong> {q.q}</div>
              <div className="options">
                {q.options.map((opt, oi) => (
                  <label key={oi} className="option-label">
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      checked={answers.find(a => a.id === q.id)?.selected === oi}
                      onChange={() => selectOption(q.id, oi)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button className="btn" style={{ marginTop: 12 }} onClick={handleSubmit}>Submit</button>
        </div>

        <div className="camera-preview">
          <video ref={videoRef} autoPlay muted playsInline />
          <ProctoringOverlay status={status} />
        </div>
      </div>
    </div>
  );
}
