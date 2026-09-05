const http = require('http');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

function createServer() {
  return http.createServer((req, res) => {
    // Parse URL path and strip query strings / hash
    let reqPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    if (reqPath === '/') reqPath = '/index.html';

    // Route shortcuts
    if (reqPath === '/admin' || reqPath === '/admin/') reqPath = '/admin.html';
    if (reqPath === '/data' || reqPath === '/data/') reqPath = '/data.html';
    if (reqPath === '/success' || reqPath === '/success/') reqPath = '/success.html';

    // Prevent directory traversal
    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(ROOT_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err) {
        // Try appending .html
        if (!path.extname(filePath)) {
          const htmlPath = filePath + '.html';
          if (fs.existsSync(htmlPath)) {
            filePath = htmlPath;
            return serveFile(filePath, res);
          }
        }
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(`
          <!DOCTYPE html>
          <html>
          <head><title>404 - Not Found</title></head>
          <body style="background:#0a1628;color:#e8ecf4;font-family:sans-serif;padding:40px;text-align:center;">
            <h1 style="color:#d4a843;">404 - Page Not Found</h1>
            <p>The requested file was not found on this server.</p>
            <p><a href="/" style="color:#3b82f6;">← Back to Home</a> | <a href="/data.html" style="color:#d4a843;">Data Store</a> | <a href="/admin.html" style="color:#8899b4;">Admin Portal</a></p>
          </body>
          </html>
        `);
      }

      if (stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      serveFile(filePath, res);
    });
  });
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('500 Internal Server Error: ' + err.message);
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  });
}

function startServer(port) {
  const server = createServer();
  server.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 VTO Local Server running successfully!`);
    console.log(`👉 Home:       http://localhost:${port}/`);
    console.log(`👉 Data Store: http://localhost:${port}/data.html`);
    console.log(`👉 Admin Hub:  http://localhost:${port}/admin.html`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(DEFAULT_PORT);
