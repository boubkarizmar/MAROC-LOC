const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4173;
const ROOT = process.env.SPA_ROOT || path.join(__dirname, '../frontend/dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  // API requests are not served here
  if (urlPath.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API not served by static SPA server' }));
    return;
  }

  // Asset files (contain hash or explicit extension) must be served from disk
  const hasAssetExt = path.extname(urlPath) !== '';
  const isAsset = hasAssetExt || urlPath.startsWith('/assets/') || urlPath.startsWith('/locales/') || urlPath.startsWith('/images/') || urlPath.startsWith('/video/');

  if (isAsset && hasAssetExt) {
    const filePath = path.join(ROOT, urlPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Cache-Control': urlPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  // Everything else falls back to index.html (client-side routing)
  const indexPath = path.join(ROOT, 'index.html');
  res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
  fs.createReadStream(indexPath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`SPA server running at http://localhost:${PORT}`);
});
