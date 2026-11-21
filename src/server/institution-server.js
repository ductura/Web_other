// The only way this app reaches Institution_server. Runs on the server (route
// handlers and server components); the browser never calls it for data and
// nothing reads the database. Only the session cookie set by Institution_server
// after AAI@EduHr login (ugovor c.6993786629 §3) is passed through.
import { BASE_PATH } from "../lib/putanje.js";

export const KOLACIC = "__Host-ductus_session";
const ZADANI_URL = "http://127.0.0.1:4000";
const ROK_MS = 5_000;

export const serverUrl = () => (process.env.INSTITUTION_SERVER_URL || ZADANI_URL).replace(/\/+$/, "");

/** Where the browser goes when the session is missing; the edge serves /api/v1. */
export const prijavaUrl = (povratak) => `/api/v1/auth/login?returnTo=${encodeURIComponent(povratak)}`;

/** Only a path inside this app (e.g. "/doc/x") comes back with BASE_PATH; anything else is the list. */
export function povratakUnutarAplikacije(vrijednost) {
  const p = typeof vrijednost === "string" ? vrijednost : "";
  return /^\/(?![/\\])[\w\-./%]*$/.test(p) && !p.includes("..") ? `${BASE_PATH}${p}` : `${BASE_PATH}/`;
}

/** Value of the session cookie from a Cookie header, or null. */
export function izvuciKolacic(cookieHeader) {
  for (const dio of String(cookieHeader ?? "").split(";")) {
    const i = dio.indexOf("=");
    if (i < 0 || dio.slice(0, i).trim() !== KOLACIC) continue;
    return valjanKolacic(dio.slice(i + 1).trim());
  }
  return null;
}

export const valjanKolacic = (v) => (typeof v === "string" && /^[!#-+\--:<-[\]-~]{1,4096}$/.test(v) ? v : null);

/**
 * @param {string} putanja path under /api/v1, e.g. "/documents"
 * @param {{method?: string, tijelo?: unknown, kolacic?: string | null, origin?: string | null}} [opcije]
 *   `origin` is forwarded as the Origin header for routes that check it.
 * @returns {Promise<Response | null>} null when the server cannot be reached in time.
 */
export async function pozoviServer(putanja, { method = "GET", tijelo, kolacic, origin } = {}) {
  const headers = { accept: "application/json" };
  if (kolacic) headers.cookie = `${KOLACIC}=${kolacic}`;
  if (origin) headers.origin = origin;
  if (tijelo !== undefined) headers["content-type"] = "application/json";
  try {
    return await fetch(`${serverUrl()}/api/v1${putanja}`, {
      method,
      headers,
      body: tijelo === undefined ? undefined : JSON.stringify(tijelo),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(ROK_MS),
    });
  } catch {
    return null;
  }
}

/** JSON body of an answer, or null when it is not JSON. */
export async function procitajJson(odgovor) {
  try {
    return await odgovor.json();
  } catch {
    return null;
  }
}
