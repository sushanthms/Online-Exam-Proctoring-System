import React, { useState } from 'react';

export default function AdminCodingCreator() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [languagesAllowed, setLanguagesAllowed] = useState(['javascript']);
  const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '', isHidden: false }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      setMessage('Coding question created');
      setTitle('');
      setDescription('');
      setLanguagesAllowed(['javascript']);
      setTestCases([{ input: '', expectedOutput: '', isHidden: false }]);
    } catch (err) {
      setError('Failed to create coding question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: 900, margin: '0 auto' }}>
      <h2>Create Coding Question</h2>
      <form onSubmit={handleSubmit}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" style={{ width: '100%', marginBottom: 10 }} />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" style={{ width: '100%', height: 120, marginBottom: 10 }} />
        <div style={{ marginBottom: 10 }}>
          <label style={{ marginRight: 10 }}>Languages:</label>
          <label style={{ marginRight: 10 }}><input type="checkbox" checked={languagesAllowed.includes('javascript')} onChange={e => updateLang('javascript', e.target.checked)} /> JavaScript</label>
          <label style={{ marginRight: 10 }}><input type="checkbox" checked={languagesAllowed.includes('python')} onChange={e => updateLang('python', e.target.checked)} /> Python</label>
          <label><input type="checkbox" checked={languagesAllowed.includes('cpp')} onChange={e => updateLang('cpp', e.target.checked)} /> C++</label>
        </div>
        <div>
          <h3>Test Cases</h3>
          {testCases.map((tc, i) => (
            <div key={i} style={{ border: '1px solid #ddd', padding: 10, marginBottom: 10 }}>
              <input value={tc.input} onChange={e => updateTestCase(i, 'input', e.target.value)} placeholder="Input" style={{ width: '100%', marginBottom: 6 }} />
              <input value={tc.expectedOutput} onChange={e => updateTestCase(i, 'expectedOutput', e.target.value)} placeholder="Expected Output" style={{ width: '100%', marginBottom: 6 }} />
              <label><input type="checkbox" checked={tc.isHidden} onChange={e => updateTestCase(i, 'isHidden', e.target.checked)} /> Hidden</label>
              <button type="button" onClick={() => removeTestCase(i)} style={{ marginLeft: 10 }}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={addTestCase}>Add Test Case</button>
        </div>
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
        {message && <div style={{ color: 'green', marginTop: 10 }}>{message}</div>}
        <button type="submit" disabled={loading} style={{ marginTop: 10 }}>{loading ? 'Creating...' : 'Create'}</button>
      </form>
    </div>
  );
}