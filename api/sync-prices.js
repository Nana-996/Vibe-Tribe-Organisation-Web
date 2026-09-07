const https = require('https');
const http = require('http');
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

// In-memory cache for serverless instance lifetime
let cachedData = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const DEFAULT_AGENT_URL = 'https://www.bigmaxservices.com?ref=AGENT-A8ADA9';
const TMP_STORE_PATH = path.join('/tmp', 'vto-data-store.json');

/**
 * Helper to fetch a URL with redirects and user-agent
 */
function fetchHtml(targetUrl, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(targetUrl);
      const client = urlObj.protocol === 'https:' ? https : http;

      const req = client.get(urlObj, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: timeoutMs
      }, (res) => {
        // Handle HTTP redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, targetUrl).toString();
          return fetchHtml(redirectUrl, timeoutMs).then(resolve).catch(reject);
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP status ${res.statusCode} from source`));
        }

        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve(body));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Fetch timed out'));
      });

      req.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Extract Inertia.js props from HTML
 */
function extractInertiaProps(html) {
  const needle = 'data-page="';
  const idx = html.indexOf(needle);
  if (idx === -1) {
    throw new Error('data-page attribute not found in page HTML');
  }

  const start = idx + needle.length;
  const end = html.indexOf('"', start);
  if (end === -1) {
    throw new Error('Malformed data-page attribute');
  }

  const raw = html.substring(start, end);
  const decoded = raw
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  const parsed = JSON.parse(decoded);
  return parsed.props || {};
}

/**
 * Read current stored bundles to preserve custom badges/descriptions
 */
function getExistingStore() {
  const possiblePaths = [
    TMP_STORE_PATH,
    path.join(process.cwd(), 'vto-data-store.json'),
    path.join(__dirname, '..', 'vto-data-store.json')
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {}
  }

  if (bundledFallback) {
    try {
      return JSON.parse(JSON.stringify(bundledFallback));
    } catch (e) {}
  }

  return null;
}

/**
 * Convert BigMax popularBundles to VTO bundle format
 */
function mapBigMaxBundlesToVTO(popularBundles, existingBundlesMap = {}) {
  const bundles = [];
  let orderIndex = 1;

  popularBundles.forEach(category => {
    const net = (category.network || '').toUpperCase();
    const finalPrices = category.final_prices || {};
    const offerSlug = (category.offer_slug || '').toLowerCase();
    const isAtExpiry = offerSlug.includes('expiry') && !offerSlug.includes('noexpiry');

    // Sort volumes numerically
    const volumes = Object.keys(finalPrices).map(v => parseFloat(v)).sort((a, b) => a - b);

    volumes.forEach(vol => {
      const price = parseFloat(finalPrices[vol] || 0);
      if (price <= 0) return;

      const sizeStr = `${vol} GB`;
      let bundleId = '';
      let defaultValidity = 'Non-Expiry';
      let defaultBadge = '';
      let defaultDesc = '';

      if (net === 'MTN') {
        bundleId = `mtn-${vol}gb`;
        defaultValidity = 'Non-Expiry';
        defaultBadge = vol === 1 ? 'Starter' : vol === 5 ? 'Best Value' : vol === 10 ? 'Popular' : vol === 20 ? 'Executive' : '';
        defaultDesc = 'High-speed internet bundle with non-expiry validity.';
      } else if (net === 'TELECEL') {
        bundleId = `telecel-${vol}gb`;
        defaultValidity = '30 Days';
        defaultBadge = vol === 5 ? 'Popular' : vol === 10 ? 'Best Value' : vol === 25 ? 'Special' : '';
        defaultDesc = 'Reliable high-speed Telecel 4G network bundle.';
      } else if (net === 'AT') {
        if (isAtExpiry) {
          bundleId = `at-exp-${vol}gb`;
          defaultValidity = '30 Days';
          defaultBadge = vol === 2 ? 'Budget Pick' : vol === 5 ? 'Standard' : '';
          defaultDesc = 'Affordable 30-day AT internet bundle.';
        } else {
          bundleId = `at-${vol}gb`;
          defaultValidity = 'Non-Expiry';
          defaultBadge = vol === 20 ? 'Heavy Streamer' : vol === 50 ? 'Mega Deal' : vol === 100 ? 'Ultra Value' : '';
          defaultDesc = 'Unbeatable high volume AT data package with zero expiration.';
        }
      } else {
        bundleId = `${net.toLowerCase()}-${vol}gb`;
        defaultValidity = 'Non-Expiry';
        defaultDesc = `Instant ${net} data crediting.`;
      }

      // Preserve existing custom metadata if available
      const existing = existingBundlesMap[bundleId] || null;

      bundles.push({
        id: bundleId,
        network: net === 'TELECEL' ? 'Telecel' : net === 'MTN' ? 'MTN' : 'AT',
        title: existing && existing.title ? existing.title : `${net === 'TELECEL' ? 'Telecel' : net === 'MTN' ? 'MTN' : 'AT'} ${sizeStr} Data`,
        dataSize: sizeStr,
        validity: existing && existing.validity ? existing.validity : defaultValidity,
        price: price,
        badge: existing && existing.badge !== undefined ? existing.badge : defaultBadge,
        description: existing && existing.description ? existing.description : defaultDesc,
        active: existing && existing.active !== undefined ? existing.active : true,
        order: orderIndex++,
        syncedFrom: 'BigMax Services',
        lastSyncedAt: new Date().toISOString()
      });
    });
  });

  return bundles;
}

/**
 * Main handler for Vercel / Node.js
 */
module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const query = req.query || {};
  const isForce = query.force === 'true' || query.force === '1' || req.method === 'POST';
  const now = Date.now();

  // Return cached result if fresh and not forced
  if (!isForce && cachedData && (now - lastFetchedAt < CACHE_TTL_MS)) {
    res.setHeader('X-Cache-Status', 'HIT');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.status(200).json({
      success: true,
      source: 'cache',
      bundles: cachedData.bundles,
      count: cachedData.bundles.length,
      syncedAt: cachedData.syncedAt,
      ttlRemainingSeconds: Math.round((CACHE_TTL_MS - (now - lastFetchedAt)) / 1000)
    });
  }

  // Determine target referral URL
  const existingStore = getExistingStore();
  let targetUrl = DEFAULT_AGENT_URL;
  if (existingStore && existingStore.settings && existingStore.settings.agentReferralUrl) {
    targetUrl = existingStore.settings.agentReferralUrl;
  }

  try {
    const html = await fetchHtml(targetUrl);
    const props = extractInertiaProps(html);
    const popularBundles = props.popularBundles || [];

    if (!Array.isArray(popularBundles) || popularBundles.length === 0) {
      throw new Error('No popularBundles returned from agent page');
    }

    // Build map of existing bundles for preservation
    const existingMap = {};
    if (existingStore && Array.isArray(existingStore.dataBundles)) {
      existingStore.dataBundles.forEach(b => {
        if (b && b.id) existingMap[b.id] = b;
      });
    }

    const transformedBundles = mapBigMaxBundlesToVTO(popularBundles, existingMap);

    cachedData = {
      bundles: transformedBundles,
      syncedAt: new Date().toISOString()
    };
    lastFetchedAt = now;

    // If store exists, optionally update store file on local disk
    if (existingStore) {
      try {
        existingStore.dataBundles = transformedBundles;
        existingStore.updatedAt = new Date().toISOString();

        const serialized = JSON.stringify(existingStore, null, 2);
        const storePath = path.join(process.cwd(), 'vto-data-store.json');
        if (fs.existsSync(storePath)) {
          fs.writeFileSync(storePath, serialized, 'utf8');
        }
        try { fs.writeFileSync(TMP_STORE_PATH, serialized, 'utf8'); } catch (e) {}
      } catch (writeErr) {
        // Read-only filesystem in serverless environments
      }
    }

    res.setHeader('X-Cache-Status', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.status(200).json({
      success: true,
      source: 'live_fetch',
      agentUrl: targetUrl,
      bundles: transformedBundles,
      count: transformedBundles.length,
      syncedAt: cachedData.syncedAt
    });

  } catch (err) {
    console.error('Agent price sync failed:', err.message);

    // Graceful fallback to existing stored bundles or cachedData
    let fallbackBundles = [];
    if (cachedData && cachedData.bundles) {
      fallbackBundles = cachedData.bundles;
    } else if (existingStore && Array.isArray(existingStore.dataBundles)) {
      fallbackBundles = existingStore.dataBundles;
    }

    res.setHeader('X-Cache-Status', 'FALLBACK');
    return res.status(200).json({
      success: false,
      warning: 'Could not fetch live agent prices. Falling back to stored bundles.',
      error: err.message,
      bundles: fallbackBundles,
      count: fallbackBundles.length,
      syncedAt: (existingStore && existingStore.updatedAt) || new Date().toISOString()
    });
  }
};
