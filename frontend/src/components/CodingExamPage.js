import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { authApi } from '../api';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

const LANGS = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'cpp', name: 'C++' },
  { id: 'c', name: 'C' },
  { id: 'java', name: 'Java' },
];

export default function CodingExamPage() {
  const { questionId } = useParams();
  const [question, setQuestion] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabSwitches, setTabSwitches] = useState([]);
  const [multipleFaceLogs, setMultipleFaceLogs] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:4000/api/coding/questions/${questionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setQuestion)
      .catch(() => {});
  }, [questionId]);

  useEffect(() => {
    setStartTime(Date.now());
    const onVis = () => {
      const entry = { timestamp: new Date().toISOString(), timeInExam: formatTime() };
      setTabSwitches(prev => [...prev, entry]);
      setWarnings(prev => [...prev, { timestamp: new Date().toISOString(), timeInExam: formatTime(), type: 'tab_switch', severity: 'low', message: 'Tab switch detected' }]);
    };
    document.addEventListener('visibilitychange', () => { if (document.hidden) onVis(); });
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (!active) return;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      intervalRef.current = setInterval(async () => {
        try {
          const detections = await window.faceapi.detectAllFaces(videoRef.current, new window.faceapi.TinyFaceDetectorOptions());
          if (detections && detections.length > 1) {
            const entry = { timestamp: new Date().toISOString(), timeInExam: formatTime(), facesDetected: detections.length, duration: 0, details: `Multiple faces detected (${detections.length})` };
            setMultipleFaceLogs(prev => [...prev, entry]);
            const token = localStorage.getItem('token');
            fetch('http://localhost:4000/api/exam/log-violation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ examId: questionId, violationType: 'multiple_faces', details: entry.details, timestamp: entry.timestamp, faceCount: detections.length })
            }).catch(() => {});
          }
        } catch {}
      }, 2000);
    }).catch(() => {});
    return () => { active = false; clearInterval(intervalRef.current); if (videoRef.current && videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop()); };
  }, [questionId]);

  const formatTime = () => {
    if (!startTime) return '0:00';
    const secs = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const runCode = async () => {
    if (!question) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/coding/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ language, code, questionId })
      });
      const data = await res.json();
      setResults(data.output || []);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:4000/api/coding/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ questionId, examId: questionId, code, language, tabSwitches, multipleFaceLogs, warnings })
    });
    alert('Submitted');
  };

  if (!question) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, padding: 20 }}>
      <div>
        <h2>{question.title}</h2>
        <p>{question.description}</p>
        <div style={{ marginBottom: 10 }}>
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            {LANGS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div style={{ border: '1px solid #ddd' }}>
          <CodeMirror value={code} height="320px" extensions={[javascript()]} onChange={v => setCode(v)} />
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
          <button onClick={runCode} disabled={loading}>{loading ? 'Running...' : 'Run Tests'}</button>
          <button onClick={submit}>Submit</button>
        </div>
        <div style={{ marginTop: 20 }}>
          <h3>Results</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>#</th>
                <th style={{ textAlign: 'left' }}>Input</th>
                <th style={{ textAlign: 'left' }}>Output</th>
                <th style={{ textAlign: 'left' }}>Expected</th>
                <th style={{ textAlign: 'left' }}>Passed</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{String(r.inputShown || '')}</td>
                  <td>{String(r.output || '')}</td>
                  <td>{String(r.expectedShown || '')}</td>
                  <td>{r.passed ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <video ref={videoRef} style={{ width: '100%', borderRadius: 8, background: '#000' }} muted />
        <div style={{ marginTop: 10 }}>
          <div>Tab switches: {tabSwitches.length}</div>
          <div>Multiple face events: {multipleFaceLogs.length}</div>
        </div>
      </div>
    </div>
  );
}