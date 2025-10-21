import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css'; // ← Import global styles only

createRoot(document.getElementById('root')).render(<App />);