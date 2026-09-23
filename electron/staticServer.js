const http = require('http');
const fs = require('fs');
const path = require('path');

// The YouTube IFrame Player API communicates with its embedded iframe via
// postMessage, which it validates against the parent page's origin. A
// file:// page has no real origin, so YouTube falls back to a degraded
// mode where the embed loads but playback commands (playVideo, etc.) and
// state-change events don't reliably work. Serving the built app over a
// real (if local-only) HTTP origin instead sidesteps that entirely.
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// Serves `rootDir` on 127.0.0.1 (loopback only, never the local network)
// on an OS-assigned free port. Resolves once it's actually listening.
function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const reqPath = decodeURIComponent(req.url.split('?')[0]);
      const filePath = path.join(rootDir, reqPath === '/' ? '/index.html' : reqPath);

      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end();
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

module.exports = { startStaticServer };
