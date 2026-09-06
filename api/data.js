const fs = require('fs');
const path = require('path');

// Static require guarantees Vercel NFT (Node File Trace) bundles vto-data-store.json
let bundledFallback = null;
try {
  bundledFallback = require('../vto-data-store.json');
} catch (e) {
  try {
    bundledFallback = require('./vto-data-store.json');
  } catch (err) {
    bundledFallback = null;
  }
}

const TMP_STORE_PATH = path.join('/tmp', 'vto-data-store.json');

module.exports = function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const possiblePaths = [
    TMP_STORE_PATH,
    path.join(process.cwd(), 'vto-data-store.json'),
    path.join(__dirname, '..', 'vto-data-store.json')
  ];

  let storePath = possiblePaths.find(p => {
    try { return fs.existsSync(p); } catch (e) { return false; }
  });

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    if (storePath) {
      try {
        const raw = fs.readFileSync(storePath, 'utf8');
        const data = JSON.parse(raw);
        return res.status(200).json(data);
      } catch (err) {
        if (bundledFallback) return res.status(200).json(bundledFallback);
        return res.status(500).json({ error: 'Failed to read data store: ' + err.message });
      }
    } else if (bundledFallback) {
      return res.status(200).json(bundledFallback);
    }
    return res.status(404).json({ error: 'vto-data-store.json not found' });
  }

  // Handle updates
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      let payload = req.body || {};
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch (e) {}
      }

      let currentData = {};
      if (storePath) {
        try {
          currentData = JSON.parse(fs.readFileSync(storePath, 'utf8'));
        } catch (e) {
          currentData = bundledFallback ? JSON.parse(JSON.stringify(bundledFallback)) : {};
        }
      } else if (bundledFallback) {
        currentData = JSON.parse(JSON.stringify(bundledFallback));
      }

      if (payload.services !== undefined) currentData.services = payload.services;
      if (payload.bookings !== undefined) currentData.bookings = payload.bookings;
      if (payload.settings !== undefined) currentData.settings = payload.settings;
      if (payload.portfolio !== undefined) currentData.portfolio = payload.portfolio;
      if (payload.dataBundles !== undefined) currentData.dataBundles = payload.dataBundles;
      currentData.updatedAt = new Date().toISOString();

      const serialized = JSON.stringify(currentData, null, 2);

      // Attempt write to persistent storePath first
      let writeSuccess = false;
      if (storePath && storePath !== TMP_STORE_PATH) {
        try {
          fs.writeFileSync(storePath, serialized, 'utf8');
          writeSuccess = true;
        } catch (writeErr) {
          // Read-only filesystem on serverless
        }
      }

      // Also write to /tmp on serverless so subsequent lambda invocations in the instance retain the data
      try {
        fs.writeFileSync(TMP_STORE_PATH, serialized, 'utf8');
        writeSuccess = true;
      } catch (tmpErr) {
        // Warning if /tmp write fails
      }

      return res.status(200).json({
        success: true,
        persisted: writeSuccess,
        updatedAt: currentData.updatedAt
      });
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON payload: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
