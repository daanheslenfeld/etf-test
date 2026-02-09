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

  // ========== Online User Tracking (in-memory, persists in CRA dev server) ==========
  const _onlineUsers = {};

  app.post('/api/heartbeat', (req, res) => {
    const { customerId, email, name } = req.body;
    if (!customerId) return res.status(200).json({ success: true });
    _onlineUsers[customerId] = { email: email || '', name: name || '', lastSeen: Date.now() };
    res.status(200).json({ success: true });
  });

  app.get('/api/admin/online-users', async (req, res) => {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      const now = Date.now();
      const FIVE_MINUTES = 5 * 60 * 1000;

      const onlineNow = [];
      for (const [id, info] of Object.entries(_onlineUsers)) {
        if (now - info.lastSeen < FIVE_MINUTES) {
          onlineNow.push({
            id: parseInt(id), email: info.email, name: info.name,
            last_seen_at: new Date(info.lastSeen).toISOString(),
            seconds_ago: Math.floor((now - info.lastSeen) / 1000),
          });
        }
      }
      onlineNow.sort((a, b) => b.last_seen_at.localeCompare(a.last_seen_at));

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayLogins } = await supabase
        .from('login_log')
        .select('customer_id, email, created_at')
        .eq('success', true)
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      const seenEmails = new Set();
      const onlineToday = [];
      for (const log of (todayLogins || [])) {
        if (log.email && !seenEmails.has(log.email)) {
          seenEmails.add(log.email);
          onlineToday.push({ email: log.email, customer_id: log.customer_id, last_login_at: log.created_at });
        }
      }

      res.status(200).json({
        success: true,
        online_now: onlineNow, online_now_count: onlineNow.length,
        online_today: onlineToday, online_today_count: onlineToday.length,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch online users' });
    }
  });

  // Clean up stale heartbeats every 10 minutes
  setInterval(() => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const id of Object.keys(_onlineUsers)) {
      if (_onlineUsers[id].lastSeen < cutoff) delete _onlineUsers[id];
    }
  }, 10 * 60 * 1000);

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
    'log-login',
    'login-log',
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
