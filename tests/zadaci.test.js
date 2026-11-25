import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Page from "../app/zadaci/page.jsx";
import { hr } from "../src/i18n/hr.js";
import openapi from "@ductura/contracts/openapi/v1.json" with { type: "json" };
import { PUTANJE, dohvatiZadatke, provjeriKolegije, provjeriStanja } from "../src/server/zadaci.js";

const kolacic = { value: "sesija-test" };
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (n) => (n === "__Host-ductus_session" && kolacic.value ? kolacic : undefined) }) }));
vi.mock("next/navigation", () => ({
  redirect: (url) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  },
}));

const A1 = "a1111111-2222-4333-8444-555555555551";
const A2 = "A1111111-2222-4333-8444-555555555552"; // upper case on one side, lower case on the other
const POPIS = {
  courses: [
    {
      id: "3f0c1d52-8a6e-4c1b-9d5a-1b2c3d4e5f60",
      name: "Izmišljeni seminar",
      assignments: [
        { id: A1, title: "Seminarski rad: kompost", dueAt: "2027-01-15T22:59:00.000Z", noticeFirst: true },
        { id: A2, title: "Esej: zeleni krovovi", dueAt: "2027-02-10T22:59:00.000Z", noticeFirst: false },
      ],
    },
    { id: "3f0c1d52-8a6e-4c1b-9d5a-1b2c3d4e5f61", name: "Kolegij bez zadatka", assignments: [] },
  ],
};
const RAD = {
  assignments: [
    { assignmentId: A1, workState: "submitted" },
    { assignmentId: A2.toLowerCase(), workState: "not_started" },
  ],
};

let pozivi;
let odgovori; // path -> Response | Error
beforeEach(() => {
  kolacic.value = "sesija-test";
  pozivi = [];
  odgovori = { "/api/v1/student/assignments": () => Response.json(POPIS), "/api/v1/student/assignment-work": () => Response.json(RAD) };
  process.env.INSTITUTION_SERVER_URL = "http://server.test:4000";
  vi.stubGlobal("fetch", async (url, init) => {
    pozivi.push({ url, ...init });
    const o = odgovori[new URL(url).pathname]();
    if (o instanceof Error) throw o;
    return o;
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.INSTITUTION_SERVER_URL;
});

const html = async (p) => renderToStaticMarkup(await p);
const redirectNa = async (p) => p.then(() => null, (e) => e.url);
const pogodi = (a, b) => {
  odgovori["/api/v1/student/assignments"] = a;
  odgovori["/api/v1/student/assignment-work"] = b;
};
const greska = (status) => () => Response.json({ error: "x" }, { status });

describe("/zadaci", () => {
  it("prikazuje kolegije, zadatke, rok, stanje rada i ulaz u rad; čita samo dvije rute sa sesijom", async () => {
    const h = await html(Page());
    expect(h).toContain(hr.zadaci.naslov);
    expect(h).toContain("Izmišljeni seminar");
    expect(h).toContain(`href="/rad/${A1}"`);
    expect(h).toContain(hr.zadaci.stanje.submitted);
    expect(h).toContain(hr.zadaci.stanje.not_started); // joined across letter case
    expect(h).toContain(hr.zadaci.obavijestPrvo);
    expect(h).toContain("2027");
    expect(h).toContain(hr.zadaci.kolegijBezZadatka);
    expect(pozivi.map((p) => new URL(p.url).pathname).sort()).toEqual(["/api/v1/student/assignment-work", "/api/v1/student/assignments"]);
    expect(pozivi.every((p) => p.headers.cookie === "__Host-ductus_session=sesija-test")).toBe(true);
  });

  it("prazan popis", async () => {
    pogodi(() => Response.json({ courses: [] }), () => Response.json({ assignments: [] }));
    expect(await html(Page())).toContain(hr.zadaci.prazno);
  });

  it("401 vodi na prijavu, i bez sesije bez poziva servera", async () => {
    pogodi(greska(401), greska(401));
    expect(await redirectNa(Page())).toBe("/prijava?povratak=%2Fzadaci");
    pozivi = [];
    kolacic.value = null;
    expect(await redirectNa(Page())).toBe("/prijava?povratak=%2Fzadaci");
    expect(pozivi).toEqual([]);
  });

  it("403 daje poruku o pristupu, 503 i prekid veze poruku o nedostupnosti", async () => {
    pogodi(greska(403), greska(403));
    expect(await html(Page())).toContain(hr.zadaci.nemaPristupa);
    pogodi(greska(503), greska(503));
    expect(await html(Page())).toContain(hr.greske.nedostupan);
    pogodi(() => new TypeError("fetch failed"), () => Response.json(RAD));
    expect(await html(Page())).toContain(hr.greske.nedostupan);
  });

  it("bez stanja rada popis ostaje, ali se stanje ne izmišlja", async () => {
    pogodi(() => Response.json(POPIS), greska(503));
    const h = await html(Page());
    expect(h).toContain("Seminarski rad: kompost");
    expect(h).not.toContain(hr.zadaci.stanje.submitted);
    expect(h).not.toContain(hr.zadaci.stanje.not_started);
  });
});

describe("ugovor 2.9.1", () => {
  it("putanje odgovaraju OpenAPI-ju paketa", () => {
    for (const [id, p] of Object.entries(PUTANJE)) expect(openapi.paths[`/api/v1${p}`]?.get?.operationId).toBe(id);
  });
});

describe("provjera odgovora", () => {
  const z = (promjena) => ({ courses: [{ ...POPIS.courses[0], assignments: [{ ...POPIS.courses[0].assignments[0], ...promjena }] }] });
  it("odbija neispravan UUID, prazan naslov, noticeFirst koji nije boolean i krivi rok", () => {
    expect(provjeriKolegije(POPIS)).not.toBeNull();
    for (const loše of [{ id: "nije-uuid" }, { title: "" }, { noticeFirst: "da" }, { dueAt: "sutra" }]) {
      expect(provjeriKolegije(z(loše))).toBeNull();
    }
    expect(provjeriKolegije({ courses: "x" })).toBeNull();
    expect(provjeriKolegije(null)).toBeNull();
  });
  it("stanja: samo poznata stanja i UUID", () => {
    expect(provjeriStanja(RAD).get(A2.toLowerCase())).toBe("not_started");
    expect(provjeriStanja({ assignments: [{ assignmentId: A1, workState: "gotovo" }] })).toBeNull();
    expect(provjeriStanja({ assignments: [{ assignmentId: "x", workState: "submitted" }] })).toBeNull();
  });
  it("neispravan odgovor servera je nedostupnost, ne popis", async () => {
    pogodi(() => Response.json(z({ id: "x" })), () => Response.json(RAD));
    expect((await dohvatiZadatke("k")).vrsta).toBe("nedostupan");
  });
});
