const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const FRONTEND_DIR = path.join(__dirname, 'frontend');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.cjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.csv': 'text/plain; charset=utf-8',
  '.d.ts': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(urlObj.pathname);

  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ type: 'bridge_status', state: 'ready', ws_port: 8080, symbols: [] }));
    return;
  }

  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const filePath = path.join(FRONTEND_DIR, pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + pathname);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  const targetUrl = `http://localhost:${PORT}/?engine=v5`;
  console.log(`====================================================`);
  console.log(`Trading Terminal v5 (86 Drawing Tools) is running!`);
  console.log(`URL: ${targetUrl}`);
  console.log(`====================================================`);

  // Open default browser on Windows
  exec(`start "" "${targetUrl}"`, (err) => {
    if (err) {
      console.log(`Please open your browser to: ${targetUrl}`);
    }
  });
});
