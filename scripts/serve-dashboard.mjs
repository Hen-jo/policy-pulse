import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'web');
const port = Number(process.env.POLICY_PULSE_PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

const server = http.createServer(async (request, response) => {
  const requestPath = request.url === '/' ? '/index.html' : request.url.split('?')[0];
  const filePath = path.resolve(root, `.${requestPath}`);
  if (!filePath.startsWith(root)) {
    response.writeHead(404); response.end('Not found'); return;
  }
  try {
    const body = await fs.readFile(filePath);
    response.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404); response.end('Not found');
  }
});

server.listen(port, () => console.log(`policy-pulse dashboard: http://localhost:${port}`));
