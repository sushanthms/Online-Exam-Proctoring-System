import React from 'react';

export default function ProctoringOverlay({ status }) {
  return (
    <div className="proctor-overlay">
      <div><strong>Proctoring</strong></div>
      <div style={{fontSize:12, color:'#333'}}>Status: {status}</div>
    </div>
  );
}
