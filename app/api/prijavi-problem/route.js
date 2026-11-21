// POST /o/api/prijavi-problem -> Institution_server POST /api/v1/support/problem-report
// (support.problem-report.post, @ductura/contracts 2.9.1). Same-origin JSON, body
// limited before it is read, input checked with validateInput before anything is sent.
import { validateInput } from "@ductura/contracts";
import pkg from "../../../package.json" with { type: "json" };
import { izvuciKolacic, pozoviServer, procitajJson } from "../../../src/server/institution-server.js";
import { nedozvoljeno, odgovor, procitajMutaciju } from "../../../src/server/bff.js";

export const dynamic = "force-dynamic";

const MAX_TIJELO = 8 * 1024; // the server's own limit for this route
const REFERENCA = /^PR-[0-9A-F]{10}$/;
const obicno = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** Keys in code point order, no whitespace: the JCS form the server asks for. */
function tijeloServera(t) {
  const b = obicno(t.browser) ? t.browser : {};
  return {
    appVersion: pkg.version,
    browser: { family: b.family, major: b.major },
    category: t.category,
    description: t.description,
    route: t.route ?? null,
    syncState: null,
  };
}

export async function POST(request) {
  // Without a session the body is never read.
  const kolacic = izvuciKolacic(request.headers.get("cookie"));
  if (!kolacic) return odgovor({ greska: "nije_prijavljen" }, 401);
  const m = await procitajMutaciju(request, MAX_TIJELO);
  if (m.odbijeno) return m.odbijeno;

  const tijelo = tijeloServera(obicno(m.tijelo) ? m.tijelo : {});
  if (!validateInput("support.problem-report.post", "body", tijelo)) return odgovor({ greska: "neispravan_unos" }, 422);

  const res = await pozoviServer("/support/problem-report", {
    method: "POST",
    tijelo,
    kolacic,
    origin: request.headers.get("origin"),
  });
  if (!res) return odgovor({ greska: "nedostupan" }, 502);
  if (res.status === 201) {
    const j = await procitajJson(res);
    return REFERENCA.test(j?.reference ?? "") ? odgovor({ reference: j.reference }, 201) : odgovor({ greska: "nedostupan" }, 502);
  }
  if (res.status === 401) return odgovor({ greska: "nije_prijavljen" }, 401);
  if (res.status === 403) return odgovor({ greska: "zabranjeno" }, 403);
  if (res.status === 422) return odgovor({ greska: "neispravan_unos" }, 422);
  if (res.status === 429) return odgovor({ greska: "previse_prijava" }, 429);
  return odgovor({ greska: "nedostupan" }, 502);
}

export const GET = nedozvoljeno("POST");
export { GET as PUT, GET as PATCH, GET as DELETE };
