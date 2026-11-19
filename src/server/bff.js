// Shared rules for the route handlers under app/api.
const NO_STORE = { "Cache-Control": "no-store" };
const MAX_TIJELO = 1024 * 1024;

export const odgovor = (tijelo, status) =>
  new Response(tijelo === null ? null : JSON.stringify(tijelo), {
    status,
    headers: tijelo === null ? NO_STORE : { ...NO_STORE, "content-type": "application/json" },
  });

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
  const tekst = await request.text();
  if (Buffer.byteLength(tekst, "utf8") > MAX_TIJELO) return { odbijeno: odgovor({ greska: "prevelik_zahtjev" }, 413) };
  try {
    return { tijelo: JSON.parse(tekst) };
  } catch {
    return { odbijeno: odgovor({ greska: "neispravan_json" }, 400) };
  }
}

export const nedozvoljeno = (allow) => () =>
  new Response(null, { status: 405, headers: { ...NO_STORE, Allow: allow } });
