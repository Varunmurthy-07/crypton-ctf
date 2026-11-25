import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Available to injected scripts (stored XSS challenge, flag 09).
window.__SECRET__ = 'RITCTF{STORED_CROSS_SITE_SCRIPTING}'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
