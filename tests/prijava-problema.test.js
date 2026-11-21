import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import openapi from "@ductura/contracts/openapi/v1.json" with { type: "json" };
import { POST, GET } from "../app/api/prijavi-problem/route.js";
import Page from "../app/prijavi-problem/page.jsx";
import PrijavaProblema, { prepoznajPreglednik } from "../src/components/PrijavaProblema.jsx";
import { prijavaProblema as t } from "../src/i18n/prijava-problema.js";

const kolacic = { value: "sesija-test" };
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (n) => (n === "__Host-ductus_session" && kolacic.value ? kolacic : undefined) }) }));
vi.mock("next/navigation", () => ({
  redirect: (url) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  },
}));

const TIJELO = { category: "technical", description: "Gumb Spremi ne reagira.", route: "/doc/[id]", browser: { family: "firefox", major: 130 } };
let pozivi;
let odgovorServera;
beforeEach(() => {
  kolacic.value = "sesija-test";
  pozivi = [];
  odgovorServera = () => Response.json({ reference: "PR-0123456789" }, { status: 201 });
  process.env.INSTITUTION_SERVER_URL = "http://server.test:4000";
  vi.stubGlobal("fetch", async (url, init) => {
    pozivi.push({ url, ...init });
    const o = odgovorServera();
    if (o instanceof Error) throw o;
    return o;
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.INSTITUTION_SERVER_URL;
});

const zahtjev = (tijelo, { zaglavlja = {}, sirovo } = {}) =>
  new Request("https://ductura.test/o/api/prijavi-problem", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: "__Host-ductus_session=sesija-test", origin: "https://ductura.test", "sec-fetch-site": "same-origin", ...zaglavlja },
    body: sirovo ?? JSON.stringify(tijelo),
  });

describe("POST /api/prijavi-problem", () => {
  it("uspjeh: šalje JCS tijelo sa sesijom i Originom, vraća broj prijave", async () => {
    const res = await POST(zahtjev(TIJELO));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ reference: "PR-0123456789" });
    expect(pozivi).toHaveLength(1);
    const p = pozivi[0];
    expect(p.url).toBe("http://server.test:4000/api/v1/support/problem-report");
    expect(p.method).toBe("POST");
    expect(p.headers.cookie).toBe("__Host-ductus_session=sesija-test");
    expect(p.headers.origin).toBe("https://ductura.test");
    expect(p.body).toBe(
      '{"appVersion":"0.2.0","browser":{"family":"firefox","major":130},"category":"technical","description":"Gumb Spremi ne reagira.","route":"/doc/[id]","syncState":null}',
    );
  });

  it("unos izvan sheme daje 422 bez poziva servera", async () => {
    const lose = [
      { ...TIJELO, description: "" },
      { ...TIJELO, description: "x".repeat(1001) },
      { ...TIJELO, description: "\ud800" },
      { ...TIJELO, category: "ostalo" },
      { ...TIJELO, route: "/Doc/x?y=1" },
      { ...TIJELO, browser: { family: "ie", major: 11 } },
      { ...TIJELO, browser: { family: "firefox", major: 1000 } },
      { ...TIJELO, browser: "firefox" },
      { category: "technical" },
    ];
    for (const tijelo of lose) expect((await POST(zahtjev(tijelo))).status, JSON.stringify(tijelo).slice(0, 60)).toBe(422);
    expect((await POST(zahtjev(null, { sirovo: "[]" }))).status).toBe(422);
    expect(pozivi).toEqual([]);
  });

  it("višak polja iz preglednika ne ide serveru", async () => {
    await POST(zahtjev({ ...TIJELO, appVersion: "9.9.9", syncState: "SYNCED", extra: 1 }));
    const poslano = JSON.parse(pozivi[0].body);
    expect(poslano.appVersion).toBe("0.2.0");
    expect(poslano.syncState).toBeNull();
    expect(poslano).not.toHaveProperty("extra");
  });

  it("strani origin 403, bez poziva servera", async () => {
    expect((await POST(zahtjev(TIJELO, { zaglavlja: { "sec-fetch-site": "cross-site" } }))).status).toBe(403);
    expect(pozivi).toEqual([]);
  });

  it("preveliko tijelo 413 prije učitavanja, bez poziva servera", async () => {
    expect((await POST(zahtjev(null, { zaglavlja: { "content-length": "9000" }, sirovo: "{}" }))).status).toBe(413);
    expect((await POST(zahtjev({ ...TIJELO, description: "š".repeat(5000) }))).status).toBe(413);
    expect(pozivi).toEqual([]);
  });

  it("bez sesije 401 bez čitanja tijela i bez poziva servera; krivi tip 415; neispravan JSON 400", async () => {
    expect((await POST(zahtjev(TIJELO, { zaglavlja: { cookie: "" } }))).status).toBe(401);
    expect((await POST(zahtjev(TIJELO, { zaglavlja: { "content-type": "text/plain" } }))).status).toBe(415);
    expect((await POST(zahtjev(null, { sirovo: "{" }))).status).toBe(400);
    expect(pozivi).toEqual([]);
  });

  it("odgovori servera: 401, 403, 422, 429 prenose se; sve ostalo i prekid veze je 502", async () => {
    const stanja = [[401, 401], [403, 403], [422, 422], [429, 429], [503, 502], [500, 502], [201, 502]];
    for (const [server, ocekivano] of stanja) {
      odgovorServera = () => Response.json(server === 201 ? { reference: "x" } : { error: "x" }, { status: server });
      expect((await POST(zahtjev(TIJELO))).status, String(server)).toBe(ocekivano);
    }
    odgovorServera = () => new TypeError("fetch failed");
    expect((await POST(zahtjev(TIJELO))).status).toBe(502);
  });

  it("druge metode 405", async () => {
    expect(GET().status).toBe(405);
  });
});

describe("stranica /prijavi-problem", () => {
  it("bez sesije vodi na prijavu", async () => {
    kolacic.value = null;
    const url = await Page({ searchParams: Promise.resolve({}) }).then(() => null, (e) => e.url);
    expect(url).toBe("/prijava?povratak=%2Fprijavi-problem");
  });

  it("sa sesijom prikazuje obrazac i ne zove server", async () => {
    const h = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ stranica: "/zadaci" }) }));
    expect(h).toContain(t.naslov);
    expect(h).toContain(t.opis);
    expect(h).toContain(t.vrste.course);
    expect(h).toContain(t.posalji);
    expect(pozivi).toEqual([]);
  });

  it("potvrda se prikazuje nakon uspjeha, a obrazac na početku nema nje", () => {
    expect(renderToStaticMarkup(createElement(PrijavaProblema, { izvor: null }))).not.toContain("PR-");
    expect(t.potvrda("PR-0123456789")).toContain("PR-0123456789");
  });
});

describe("preglednik", () => {
  it("zatvoreni skup obitelji", () => {
    expect(prepoznajPreglednik("Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0")).toEqual({ family: "firefox", major: 130 });
    expect(prepoznajPreglednik("Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0")).toEqual({ family: "chromium", major: 129 });
    expect(prepoznajPreglednik("Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15")).toEqual({ family: "safari", major: 17 });
    expect(prepoznajPreglednik("nepoznato")).toEqual({ family: "other", major: null });
  });
});

describe("ugovor 2.9.1", () => {
  it("ruta i operacija odgovaraju OpenAPI-ju paketa", () => {
    expect(openapi.paths["/api/v1/support/problem-report"]?.post?.operationId).toBe("support.problem-report.post");
  });
});
