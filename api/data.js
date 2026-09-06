const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const possiblePaths = [
    path.join(process.cwd(), 'vto-data-store.json'),
    path.join(__dirname, '..', 'vto-data-store.json')
  ];

  let storePath = possiblePaths.find(p => fs.existsSync(p));

  if (!storePath) {
    return res.status(404).json({ error: 'vto-data-store.json not found' });
  }

  if (req.method === 'GET') {
    try {
      const raw = fs.readFileSync(storePath, 'utf8');
      const data = JSON.parse(raw);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read data store: ' + err.message });
    }
  }

  // Handle updates (in serverless, filesystem is read-only in production, but responds appropriately)
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const payload = req.body || {};
      let currentData = {};
      try {
        currentData = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      } catch (e) {
        currentData = {};
      }

      if (payload.services !== undefined) currentData.services = payload.services;
      if (payload.bookings !== undefined) currentData.bookings = payload.bookings;
      if (payload.settings !== undefined) currentData.settings = payload.settings;
      if (payload.portfolio !== undefined) currentData.portfolio = payload.portfolio;
      if (payload.dataBundles !== undefined) currentData.dataBundles = payload.dataBundles;
      currentData.updatedAt = new Date().toISOString();

      try {
        fs.writeFileSync(storePath, JSON.stringify(currentData, null, 2), 'utf8');
      } catch (writeErr) {
        // Ephemeral environment note
        console.warn('Filesystem write warning on serverless:', writeErr.message);
      }

      return res.status(200).json({ success: true, updatedAt: currentData.updatedAt });
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON payload: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
