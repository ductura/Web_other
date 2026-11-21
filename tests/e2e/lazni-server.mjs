// Fake Institution_server for e2e and local work without the real one. Only
// invented data, kept in memory. Answers /api/v1/documents like the in-memory
// API of the earlier dev-server.mjs, and only with a session cookie "e2e-*".
// Each session has its own copy, so browsers running in parallel do not meet.
import { createHash } from "node:crypto";
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

// student.assignments.get and student.assignment-work.get; the scenario comes
// from the session name: e2e-zadaci-prazno-*, -403-*, -503-*, else the full list.
const KOLEGIJ = "3f0c1d52-8a6e-4c1b-9d5a-1b2c3d4e5f60";
const ZADACI_PUN = {
  courses: [
    {
      id: KOLEGIJ,
      name: "Izmišljeni seminar iz ekologije grada",
      assignments: [
        { id: "a1111111-2222-4333-8444-555555555551", title: "Seminarski rad: kućno kompostiranje", dueAt: "2027-01-15T22:59:00.000Z", noticeFirst: true },
        { id: "a1111111-2222-4333-8444-555555555552", title: "Esej: zeleni krovovi", dueAt: "2027-02-10T22:59:00.000Z", noticeFirst: false },
      ],
    },
    { id: "3f0c1d52-8a6e-4c1b-9d5a-1b2c3d4e5f61", name: "Izmišljeni kolegij bez zadatka", assignments: [] },
  ],
};
const RAD_PUN = {
  assignments: [
    { assignmentId: "a1111111-2222-4333-8444-555555555551", workState: "in_progress" },
    { assignmentId: "a1111111-2222-4333-8444-555555555552", workState: "not_started" },
  ],
};
function zadaci(res, s, put) {
  if (s.startsWith("e2e-zadaci-403-")) return json(res, 403, { error: "forbidden" });
  if (s.startsWith("e2e-zadaci-503-")) return json(res, 503, { error: "unavailable" });
  if (s.startsWith("e2e-zadaci-prazno-")) return json(res, 200, put === "popis" ? { courses: [] } : { assignments: [] });
  return json(res, 200, put === "popis" ? ZADACI_PUN : RAD_PUN);
}

// support.problem-report.post: needs a session and an Origin header, like the real
// route. The reference is derived from the description, so a test can check that
// exactly its text arrived. Session e2e-prijava-429-* gets "too many reports".
async function prijavaProblema(req, res, s) {
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });
  if (!req.headers.origin) return json(res, 403, { error: "origin_missing" });
  if (s.startsWith("e2e-prijava-429-")) return json(res, 429, { error: "too_many_reports" });
  let raw = "";
  for await (const c of req) raw += c;
  let b;
  try {
    b = JSON.parse(raw);
  } catch {
    return json(res, 400, { error: "invalid_json" });
  }
  if (typeof b?.description !== "string" || !b.description || b.appVersion === undefined || b.syncState !== null) {
    return json(res, 422, { error: "invalid_input" });
  }
  return json(res, 201, { reference: `PR-${createHash("sha1").update(b.description).digest("hex").slice(0, 10).toUpperCase()}` });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/__zdravlje") return json(res, 200, { ok: true });
  if (!url.pathname.startsWith("/api/v1/")) return json(res, 404, { error: "not_found" });
  const s = sesija(req);
  if (!s) return json(res, 401, { error: "unauthenticated" });
  if (url.pathname === "/api/v1/student/assignments" && req.method === "GET") return zadaci(res, s, "popis");
  if (url.pathname === "/api/v1/student/assignment-work" && req.method === "GET") return zadaci(res, s, "rad");
  if (url.pathname === "/api/v1/support/problem-report") return prijavaProblema(req, res, s);
  const docs = dokumenti(s);
  if (url.pathname === "/api/v1/documents" && req.method === "GET") return json(res, 200, [...docs.values()]);
  const m = url.pathname.match(/^\/api\/v1\/documents\/([\w-]+)$/);
  const doc = m && docs.get(m[1]);
  if (!doc) return json(res, 404, { error: "not_found" });
  if (req.method === "PUT") {
    let raw = "";
    for await (const c of req) raw += c;
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return json(res, 400, { error: "invalid_json" });
    }
    if (body?.id !== doc.id || typeof body.title !== "string" || typeof body.content !== "string") {
      return json(res, 400, { error: "invalid_document" });
    }
    docs.set(doc.id, { id: doc.id, title: body.title, content: body.content });
  } else if (req.method !== "GET") return json(res, 405, { error: "method_not_allowed" });
  return json(res, 200, docs.get(doc.id));
});

server.listen(PORT, "127.0.0.1", () => console.log(`lažni Institution_server na http://127.0.0.1:${PORT}`));
