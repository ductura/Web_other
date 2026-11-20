// Fake Institution_server for e2e and local work without the real one. Only
// invented data, kept in memory. Answers /api/v1/documents like the in-memory
// API of the earlier dev-server.mjs, and only with a session cookie "e2e-*".
// Each session has its own copy, so browsers running in parallel do not meet.
import { createServer } from "node:http";

const PORT = Number(process.env.LAZNI_PORT ?? 4199);
const POCETNI = [
  { id: "demo-1", title: "Seminarski rad", content: "Uvod u temu." },
  { id: "demo-2", title: "Bilješke s predavanja", content: "" },
];
const sesije = new Map();
const dokumenti = (sesija) => {
  if (!sesije.has(sesija)) sesije.set(sesija, new Map(POCETNI.map((d) => [d.id, { ...d }])));
  return sesije.get(sesija);
};

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
};
const sesija = (req) => /(?:^|;\s*)__Host-ductus_session=(e2e-[\w-]{1,64})(?:;|$)/.exec(req.headers.cookie ?? "")?.[1];

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/__zdravlje") return json(res, 200, { ok: true });
  if (!url.pathname.startsWith("/api/v1/")) return json(res, 404, { error: "not_found" });
  const s = sesija(req);
  if (!s) return json(res, 401, { error: "unauthenticated" });
  const docs = dokumenti(s);
  if (url.pathname === "/api/v1/documents" && req.method === "GET") return json(res, 200, [...docs.values()]);
  const m = url.pathname.match(/^\/api\/v1\/documents\/([\w-]+)$/);
  const doc = m && docs.get(m[1]);
  if (!doc) return json(res, 404, { error: "not_found" });
  if (req.method === "PUT") {
    let raw = "";
    for await (const c of req) raw += c;
    const body = JSON.parse(raw || "{}");
    docs.set(doc.id, { ...doc, title: body.title ?? doc.title, content: body.content ?? doc.content });
  } else if (req.method !== "GET") return json(res, 405, { error: "method_not_allowed" });
  return json(res, 200, docs.get(doc.id));
});

server.listen(PORT, "127.0.0.1", () => console.log(`lažni Institution_server na http://127.0.0.1:${PORT}`));
