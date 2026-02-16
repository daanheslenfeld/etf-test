import React from 'react';
import ReactDOM from 'react-dom/client';
import BasicETFTest from './App';

// Patch global fetch to include required customer headers on every request
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  options.headers = {
    ...options.headers,
    'X-Customer-ID': '23449846',
    'X-Customer-Email': 'myemail@example.com',
  };
  return originalFetch.call(this, url, options);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BasicETFTest />
  </React.StrictMode>
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}
