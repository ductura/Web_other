// Popis zadataka studenta: dva čitanja Institution_servera spojena po ID-u.
// student.assignments.get daje kolegije i zadatke, student.assignment-work.get
// stanje rada. Putanje su iz @ductura/contracts 2.9.1 (test ih uspoređuje s njegovim OpenAPI-jem); odgovor se provjerava
// kao u WEB-u (UUID, naslov, noticeFirst), a što ne prođe nije popis.
import { pozoviServer, procitajJson } from "./institution-server.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STANJA = new Set(["not_started", "in_progress", "submitted"]);
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const PUTANJE = { "student.assignments.get": "/student/assignments", "student.assignment-work.get": "/student/assignment-work" };
const putanja = (id) => PUTANJE[id];
const neprazan = (v) => typeof v === "string" && v.length > 0;
const objekt = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

const zadatak = (z) =>
  objekt(z) && typeof z.id === "string" && UUID.test(z.id) && neprazan(z.title) && typeof z.noticeFirst === "boolean" && typeof z.dueAt === "string" && ISO_UTC.test(z.dueAt);

const kolegij = (k) => objekt(k) && typeof k.id === "string" && UUID.test(k.id) && neprazan(k.name) && Array.isArray(k.assignments) && k.assignments.every(zadatak);

/** @returns {Array<object> | null} null when the body is not a valid answer. */
export function provjeriKolegije(tijelo) {
  return objekt(tijelo) && Array.isArray(tijelo.courses) && tijelo.courses.every(kolegij) ? tijelo.courses : null;
}

/** @returns {Map<string, string> | null} lowercase assignment id to work state. */
export function provjeriStanja(tijelo) {
  if (!objekt(tijelo) || !Array.isArray(tijelo.assignments)) return null;
  const stanja = new Map();
  for (const r of tijelo.assignments) {
    if (!objekt(r) || typeof r.assignmentId !== "string" || !UUID.test(r.assignmentId) || !STANJA.has(r.workState)) return null;
    stanja.set(r.assignmentId.toLowerCase(), r.workState);
  }
  return stanja;
}

// "ok" | "odjavljen" | "zabranjeno" | "nedostupan"
async function jednoCitanje(id, kolacic, provjeri) {
  const res = await pozoviServer(putanja(id), { kolacic });
  if (!res) return { vrsta: "nedostupan" };
  if (res.status === 401) return { vrsta: "odjavljen" };
  if (res.status === 403) return { vrsta: "zabranjeno" };
  if (res.status !== 200) return { vrsta: "nedostupan" };
  const podaci = provjeri(await procitajJson(res));
  return podaci ? { vrsta: "ok", podaci } : { vrsta: "nedostupan" };
}

/**
 * @param {string | null} kolacic
 * @returns {Promise<{vrsta: "ready", kolegiji: Array<object>} | {vrsta: "odjavljen" | "zabranjeno" | "nedostupan"}>}
 *   Each assignment carries `stanje` (not_started, in_progress, submitted) or null when the
 *   work read has no row for it: no state is guessed, but the list itself is still shown.
 */
export async function dohvatiZadatke(kolacic) {
  if (!kolacic) return { vrsta: "odjavljen" };
  const [popis, rad] = await Promise.all([
    jednoCitanje("student.assignments.get", kolacic, provjeriKolegije),
    jednoCitanje("student.assignment-work.get", kolacic, provjeriStanja),
  ]);
  for (const stanje of ["odjavljen", "zabranjeno"]) {
    if (popis.vrsta === stanje || rad.vrsta === stanje) return { vrsta: stanje };
  }
  if (popis.vrsta !== "ok") return { vrsta: "nedostupan" };
  const stanja = rad.vrsta === "ok" ? rad.podaci : new Map();
  return {
    vrsta: "ready",
    kolegiji: popis.podaci.map((k) => ({
      ...k,
      assignments: k.assignments.map((z) => ({ ...z, stanje: stanja.get(z.id.toLowerCase()) ?? null })),
    })),
  };
}
