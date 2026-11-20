// Shared rules for the route handlers under app/api.
const NO_STORE = { "Cache-Control": "no-store" };
const MAX_TIJELO = 1024 * 1024;

export const odgovor = (tijelo, status) =>
  new Response(tijelo === null ? null : JSON.stringify(tijelo), {
    status,
    headers: tijelo === null ? NO_STORE : { ...NO_STORE, "content-type": "application/json" },
  });

/** Body as text, or null as soon as it passes `max` bytes (the rest is never read). */
async function procitajDoGranice(request, max) {
  if (Number(request.headers.get("content-length")) > max) return null;
  if (!request.body) return "";
  const citac = request.body.getReader();
  const dijelovi = [];
  let ukupno = 0;
  for (;;) {
    const { done, value } = await citac.read();
    if (done) break;
    ukupno += value.byteLength;
    if (ukupno > max) {
      await citac.cancel().catch(() => {});
      return null;
    }
    dijelovi.push(value);
  }
  return Buffer.concat(dijelovi).toString("utf8");
}

/**
 * Mutations come only from this app's own pages: JSON (so a cross-site form
 * cannot send one without a preflight) and, where the browser says so, from
 * the same origin.
 * @returns {Promise<{tijelo: unknown} | {odbijeno: Response}>}
 */
export async function procitajMutaciju(request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return { odbijeno: odgovor({ greska: "zabranjeno" }, 403) };
  if (!/^application\/json\s*(;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return { odbijeno: odgovor({ greska: "ocekuje_se_json" }, 415) };
  }
  const tekst = await procitajDoGranice(request, MAX_TIJELO);
  if (tekst === null) return { odbijeno: odgovor({ greska: "prevelik_zahtjev" }, 413) };
  try {
    return { tijelo: JSON.parse(tekst) };
  } catch {
    return { odbijeno: odgovor({ greska: "neispravan_json" }, 400) };
  }
}

export const nedozvoljeno = (allow) => () =>
  new Response(null, { status: 405, headers: { ...NO_STORE, Allow: allow } });
