import React from 'react';
import { createRoot } from 'react-dom/client';
import BakyaApp from './bakya_App.jsx';
import './bakya_styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BakyaApp />
  </React.StrictMode>,
);
