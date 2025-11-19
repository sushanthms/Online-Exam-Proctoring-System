import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminCodingCreator() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [languagesAllowed, setLanguagesAllowed] = useState(['javascript']);
  const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '', isHidden: false }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [createdQuestion, setCreatedQuestion] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lastCreatedCodingQuestion');
      const savedMsg = localStorage.getItem('lastCreatedCodingMessage');
      if (saved) setCreatedQuestion(JSON.parse(saved));
      if (savedMsg) setMessage(savedMsg);
    } catch {}
  }, []);

  const updateLang = (lang, checked) => {
    if (checked) setLanguagesAllowed(prev => Array.from(new Set([...prev, lang])));
    else setLanguagesAllowed(prev => prev.filter(l => l !== lang));
  };

  const addTestCase = () => {
    setTestCases(prev => [...prev, { input: '', expectedOutput: '', isHidden: false }]);
  };

  const updateTestCase = (i, field, value) => {
    setTestCases(prev => prev.map((tc, idx) => idx === i ? { ...tc, [field]: value } : tc));
  };

  const removeTestCase = (i) => {
    setTestCases(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/admin/coding/create-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, languagesAllowed, testCases })
      });
      if (!res.ok) throw new Error('Create failed');
      const data = await res.json();
      const q = data.question || data;
      setCreatedQuestion(q);
      setMessage('✅ Coding question created successfully');
      try {
        localStorage.setItem('lastCreatedCodingQuestion', JSON.stringify(q));
        localStorage.setItem('lastCreatedCodingMessage', '✅ Coding question created successfully');
      } catch {}
    } catch (err) {
      setError('Failed to create coding question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="exam-creator-container">
      <div className="exam-creator-header">
        <h1>Create Coding Question</h1>
      </div>

      <form className="exam-creator-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-group">
            <label>Title</label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter title" />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Write a short description" rows={6} />
          </div>

          <div className="form-group">
            <label>Languages</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <label><input type="checkbox" checked={languagesAllowed.includes('javascript')} onChange={e => updateLang('javascript', e.target.checked)} /> JavaScript</label>
              <label><input type="checkbox" checked={languagesAllowed.includes('python')} onChange={e => updateLang('python', e.target.checked)} /> Python</label>
              <label><input type="checkbox" checked={languagesAllowed.includes('c')} onChange={e => updateLang('c', e.target.checked)} /> C</label>
              <label><input type="checkbox" checked={languagesAllowed.includes('cpp')} onChange={e => updateLang('cpp', e.target.checked)} /> C++</label>
              <label><input type="checkbox" checked={languagesAllowed.includes('java')} onChange={e => updateLang('java', e.target.checked)} /> Java</label>
            </div>
            <div className="helper-text">Select the languages students can use</div>
          </div>
        </div>

        <div className="form-section">
          <div className="questions-header">
            <h2>Test Cases</h2>
            <button type="button" className="btn-add-question" onClick={addTestCase}>Add Test Case</button>
          </div>

          {testCases.map((tc, i) => (
            <div key={i} className="question-card">
              <div className="question-header">
                <h3>Case {i + 1}</h3>
                <button type="button" className="btn-remove" onClick={() => removeTestCase(i)}>Remove</button>
              </div>

              <div className="form-group">
                <label>Input</label>
                <textarea className="form-textarea" value={tc.input} onChange={e => updateTestCase(i, 'input', e.target.value)} rows={3} placeholder="Provide input text passed to stdin" />
              </div>

              <div className="form-group">
                <label>Expected Output</label>
                <textarea className="form-textarea" value={tc.expectedOutput} onChange={e => updateTestCase(i, 'expectedOutput', e.target.value)} rows={3} placeholder="Exact output expected" />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label style={{ margin: 0 }}>Hidden</label>
                <input type="checkbox" checked={tc.isHidden} onChange={e => updateTestCase(i, 'isHidden', e.target.checked)} />
                <span className="helper-text">Hidden cases are not shown to students</span>
              </div>
            </div>
          ))}
        </div>

        {error && <div style={{ color: '#b91c1c', marginBottom: '1rem' }}>{error}</div>}
        {message && (
          <div style={{
            marginTop: '1rem',
            padding: '12px 14px',
            border: '1px solid #d1fae5',
            background: '#ecfdf5',
            color: '#065f46',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{message}</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn-back" onClick={() => navigate('/admin/dashboard')}>Go Back</button>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
        </div>
      </form>

      {createdQuestion && (
        <div className="form-section" style={{ marginTop: '1.5rem' }}>
          <h2>Created Question</h2>
          <div className="question-card">
            <div className="question-header">
              <h3>{createdQuestion.title}</h3>
            </div>
            <div className="form-group">
              <label>Description</label>
              <div className="helper-text" style={{ whiteSpace: 'pre-wrap' }}>{createdQuestion.description}</div>
            </div>
            <div className="form-group">
              <label>Languages Allowed</label>
              <div className="helper-text">{(createdQuestion.languagesAllowed || []).join(', ')}</div>
            </div>
            <div className="form-group">
              <label>Test Cases</label>
              <div>
                {(createdQuestion.testCases || []).map((tc, i) => (
                  <div key={i} style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Case {i + 1} {tc.isHidden ? '(hidden)' : ''}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div className="helper-text" style={{ marginBottom: 4 }}>Input</div>
                        <pre style={{ background: '#f9fafb', padding: 10, borderRadius: 6, margin: 0 }}>{tc.isHidden ? 'hidden' : (tc.input || '')}</pre>
                      </div>
                      <div>
                        <div className="helper-text" style={{ marginBottom: 4 }}>Expected Output</div>
                        <pre style={{ background: '#f9fafb', padding: 10, borderRadius: 6, margin: 0 }}>{tc.isHidden ? 'hidden' : (tc.expectedOutput || '')}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}