import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RootLayout, { metadata } from "../app/layout.jsx";
import DocPage from "../app/doc/[id]/page.jsx";
import Page from "../app/page.jsx";
import * as prijava from "../app/prijava/route.js";
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

  it("dokument ima naslov, sadržaj i broj riječi", async () => {
    const h = await html(DocPage({ params: Promise.resolve({ id: "demo-1" }) }));
    expect(h).toContain('value="Seminarski rad"');
    expect(h).toContain("Uvod u temu.");
    expect(h).toContain("3 riječi");
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
