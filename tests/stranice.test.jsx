import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RootLayout, { metadata } from "../app/layout.jsx";
import DocPage from "../app/doc/[id]/page.jsx";
import Page from "../app/page.jsx";
import * as prijava from "../app/prijava/route.js";
import * as dokument from "../app/api/dokumenti/[id]/route.js";
import { hr } from "../src/i18n/hr.js";

const kolacic = { value: "sesija-test" };
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (n) => (n === "__Host-ductus_session" && kolacic.value ? kolacic : undefined) }) }));
vi.mock("next/navigation", () => ({
  redirect: (url) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  },
  useRouter: () => ({ replace() {} }),
}));

const DOCS = [
  { id: "demo-1", title: "Seminarski rad", content: "Uvod u temu." },
  { id: "demo-2", title: "Bilješke s predavanja", content: "" },
];
let pozivi;
let odgovor;
beforeEach(() => {
  kolacic.value = "sesija-test";
  pozivi = [];
  odgovor = null;
  process.env.INSTITUTION_SERVER_URL = "http://server.test:4000/";
  vi.stubGlobal("fetch", async (url, init) => {
    pozivi.push({ url, ...init });
    if (odgovor instanceof Error) throw odgovor;
    if (odgovor) return odgovor;
    const p = new URL(url).pathname;
    if (p === "/api/v1/documents") return Response.json(DOCS);
    const d = DOCS.find((x) => p === `/api/v1/documents/${x.id}`);
    return d ? Response.json(d) : Response.json({ error: "not_found" }, { status: 404 });
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.INSTITUTION_SERVER_URL;
});

const redirectNa = async (p) => p.then(() => null, (e) => e.url);
const html = async (p) => renderToStaticMarkup(await p);

describe("stranice", () => {
  it("layout je na hrvatskom, s trakom Ductura i varijantom Web", () => {
    const h = renderToStaticMarkup(<RootLayout><p /></RootLayout>);
    expect(h).toMatch(/^<html lang="hr"/);
    expect(h).toContain(">Ductura</a><span id=\"variant\">Web</span>");
    expect(metadata.title).toBe("Ductura");
  });

  it("popis čita /api/v1/documents sa sesijom i ništa drugo", async () => {
    const h = await html(Page());
    expect(h).toContain(hr.popis.naslov);
    expect(h).toContain('href="/doc/demo-1"');
    expect(h).toContain("Bilješke s predavanja");
    expect(pozivi.map((p) => p.url)).toEqual(["http://server.test:4000/api/v1/documents"]);
    expect(pozivi[0].headers.cookie).toBe("__Host-ductus_session=sesija-test");
  });

  it("dokument ima naslov, sadržaj, broj riječi i gumb Spremi", async () => {
    const h = await html(DocPage({ params: Promise.resolve({ id: "demo-1" }) }));
    expect(h).toContain('value="Seminarski rad"');
    expect(h).toContain("Uvod u temu.");
    expect(h).toContain("3 riječi");
    expect(h).toContain(hr.dokument.spremi);
    expect(await html(DocPage({ params: Promise.resolve({ id: "nema" }) }))).toContain(hr.dokument.nedostupan);
  });

  it("bez sesije ili uz 401 ide na prijavu; nedostupan server daje poruku", async () => {
    kolacic.value = null;
    expect(await redirectNa(Page())).toBe("/prijava");
    expect(pozivi).toEqual([]);
    kolacic.value = "sesija-test";
    odgovor = Response.json({ error: "unauthenticated" }, { status: 401 });
    expect(await redirectNa(DocPage({ params: Promise.resolve({ id: "demo-1" }) }))).toBe("/prijava?povratak=%2Fdoc%2Fdemo-1");
    odgovor = new TypeError("fetch failed");
    expect(await html(Page())).toContain(hr.greske.nedostupan);
  });
});

describe("GET /o/prijava", () => {
  const cilj = (q) => prijava.GET(new Request(`http://localhost/o/prijava${q}`)).headers.get("location");
  it("šalje na prijavu Institution_servera i vraća samo unutar aplikacije", () => {
    expect(cilj("?povratak=%2Fdoc%2Fdemo-1")).toBe("/api/v1/auth/login?returnTo=%2Fo%2Fdoc%2Fdemo-1");
    expect(cilj("")).toBe("/api/v1/auth/login?returnTo=%2Fo%2F");
    for (const zlo of ["//zlo.test", "/\\zlo.test", "https://zlo.test", "/../admin"]) {
      expect(cilj(`?povratak=${encodeURIComponent(zlo)}`)).toBe("/api/v1/auth/login?returnTo=%2Fo%2F");
    }
  });
});

describe("PUT /o/api/dokumenti/[id]", () => {
  const put = (id, tijelo, zaglavlja = {}) =>
    dokument.PUT(
      new Request(`http://localhost/o/api/dokumenti/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json", "sec-fetch-site": "same-origin", cookie: "x=1; __Host-ductus_session=s1", ...zaglavlja },
        body: typeof tijelo === "string" ? tijelo : JSON.stringify(tijelo),
      }),
      { params: Promise.resolve({ id }) },
    );

  it("prosljeđuje samo naslov i sadržaj, sa sesijom", async () => {
    const res = await put("demo-1", { title: "N", content: "S", visak: 1 });
    expect(res.status).toBe(204);
    expect(pozivi[0].url).toBe("http://server.test:4000/api/v1/documents/demo-1");
    expect(pozivi[0].method).toBe("PUT");
    expect(JSON.parse(pozivi[0].body)).toEqual({ id: "demo-1", title: "N", content: "S" });
    expect(pozivi[0].headers.cookie).toBe("__Host-ductus_session=s1");
  });

  it("odbija bez poziva servera: tuđe podrijetlo, ne-JSON, bez sesije, krivi unos", async () => {
    expect((await put("demo-1", { title: "N", content: "S" }, { "sec-fetch-site": "cross-site" })).status).toBe(403);
    expect((await put("demo-1", { title: "N", content: "S" }, { "content-type": "text/plain" })).status).toBe(415);
    expect((await put("demo-1", { title: "N", content: "S" }, { cookie: "" })).status).toBe(401);
    expect((await put("demo-1", "{")).status).toBe(400);
    expect((await put("demo-1", { title: 1, content: "S" })).status).toBe(400);
    expect((await put("a%2Fb", { title: "N", content: "S" })).status).toBe(404);
    expect(dokument.GET().status).toBe(405);
    expect(pozivi).toEqual([]);
  });

  it("odgovori servera: 401, 404, greška i nedostupnost", async () => {
    for (const [s, ocekivano] of [[401, 401], [404, 404], [500, 502]]) {
      odgovor = Response.json({}, { status: s });
      expect((await put("demo-1", { title: "N", content: "S" })).status).toBe(ocekivano);
    }
    odgovor = new TypeError("fetch failed");
    expect((await put("demo-1", { title: "N", content: "S" })).status).toBe(502);
  });
});
