// Razvojni poslužitelj: statične datoteke + memorijski oponašatelj Ductura/server API-ja.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const docs = new Map([
  ['demo-1', { id: 'demo-1', title: 'Seminarski rad', content: 'Uvod u temu.' }],
  ['demo-2', { id: 'demo-2', title: 'Bilješke s predavanja', content: '' }],
]);

const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/documents') return json(res, 200, [...docs.values()]);
  const m = url.pathname.match(/^\/api\/documents\/([\w-]+)$/);
  if (m) {
    const doc = docs.get(m[1]);
    if (!doc) return json(res, 404, { error: 'Nije pronađeno' });
    if (req.method === 'PUT') {
      let raw = ''; for await (const c of req) raw += c;
      const body = JSON.parse(raw || '{}');
      docs.set(doc.id, { ...doc, title: body.title ?? doc.title, content: body.content ?? doc.content });
    }
    return json(res, 200, docs.get(doc.id));
  }
  const path = normalize(url.pathname === '/' ? '/index.html' : url.pathname);
  try {
    const file = await readFile(join(root, path));
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
    res.end(file);
  } catch { res.writeHead(404).end(); }
});

const port = Number(process.env.PORT ?? 5173);
server.listen(port, () => console.log(`Ductura (dev) na http://localhost:${port}`));
