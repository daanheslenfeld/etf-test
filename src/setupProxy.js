const path = require('path');
const express = require('express');

// Load .env so API functions have SUPABASE_URL, EMAIL_USER, etc.
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * Development proxy - mounts Vercel serverless functions on CRA's dev server.
 * This allows `npm start` to serve both the React app and /api/* endpoints.
 */
module.exports = function (app) {
  // Parse JSON request bodies for all /api routes
  app.use('/api', express.json());

  // Dynamic route: /api/customers/:id  →  api/customers/[id].js
  // Must be registered BEFORE the generic /api/customers route
  app.all('/api/customers/:id', (req, res) => {
    req.query = { ...req.query, id: req.params.id };
    loadHandler('customers/[id]')(req, res);
  });

  // Static routes
  const routes = [
    'register',
    'login',
    'verify',
    'resend-verification',
    'customers',
    'save-portfolio',
    'fetch-etf-prices',
    'simulation-state',
    'update-portfolio-value',
    'update-trading-status',
    'chat-inquiries',
  ];

  for (const route of routes) {
    app.all(`/api/${route}`, (req, res) => {
      loadHandler(route)(req, res);
    });
  }
};

/**
 * Load a Vercel serverless function handler, clearing cache for hot reload.
 */
function loadHandler(name) {
  const filePath = path.join(__dirname, '..', 'api', `${name}.js`);
  try {
    delete require.cache[require.resolve(filePath)];
    return require(filePath);
  } catch (err) {
    console.error(`[setupProxy] Failed to load api/${name}.js:`, err.message);
    return (_req, res) => {
      res.status(500).json({ success: false, message: `API error: ${err.message}` });
    };
  }
}
