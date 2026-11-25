// Funkcionalna provjera: isti dokument otvara se u svakom pregledniku,
// a navigacija radi i nakon osvježavanja.
import { test as base, expect } from "@playwright/test";

// Sesiju inače postavlja Institution_server nakon prijave preko AAI@EduHr;
// ovdje je izmišljena vrijednost po pregledniku koju prihvaća samo lažni server.
const test = base.extend({
  page: async ({ page, context, baseURL }, use, info) => {
    const { hostname } = new URL(baseURL);
    await context.addCookies([
      { name: "__Host-ductus_session", value: `e2e-${info.testId}`, domain: hostname, path: "/", secure: true, httpOnly: true, sameSite: "Lax" },
    ]);
    await use(page);
  },
});

test("dokument se otvara, navigacija radi i nakon osvježavanja", async ({ page }) => {
  await page.goto("/o/");
  await expect(page.getByRole("heading", { name: "Moji dokumenti" })).toBeVisible();

  await page.getByRole("link", { name: "Seminarski rad" }).click();
  await expect(page).toHaveURL(/\/o\/doc\/demo-1$/);
  await expect(page.getByLabel("Naslov")).toHaveValue("Seminarski rad");
  await expect(page.getByLabel("Sadržaj")).toHaveValue("Uvod u temu.");
  await expect(page.getByText("Za spremanje je potrebna internetska veza.", { exact: false })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Naslov")).toHaveValue("Seminarski rad");

  await page.getByRole("link", { name: "Ductura" }).click();
  await expect(page.getByRole("heading", { name: "Moji dokumenti" })).toBeVisible();
  await page.getByRole("link", { name: "Bilješke s predavanja" }).click();
  await expect(page.getByLabel("Naslov")).toHaveValue("Bilješke s predavanja");

  await page.goBack();
  await expect(page.getByRole("heading", { name: "Moji dokumenti" })).toBeVisible();
  await page.goForward();
  await expect(page.getByLabel("Naslov")).toHaveValue("Bilješke s predavanja");
});

test("stara poveznica #/doc/<id> otvara isti dokument", async ({ page }) => {
  for (const stara of ["/#/doc/demo-1", "/o/#/doc/demo-1"]) {
    await page.goto(stara);
    await expect(page).toHaveURL(/\/o\/doc\/demo-1$/);
    await expect(page.getByLabel("Naslov")).toHaveValue("Seminarski rad");
  }
});

test("izmjena se sprema na poslužitelj i ostaje nakon osvježavanja", async ({ page }, info) => {
  const tekst = `Bilješka iz preglednika ${info.project.name}`;
  await page.goto("/o/doc/demo-2");
  await page.getByLabel("Sadržaj").fill(tekst);
  await expect(page.getByText("4 riječi")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Spremljeno na poslužitelju");
  await page.reload();
  await expect(page.getByLabel("Sadržaj")).toHaveValue(tekst);
});

test("uzastopne izmjene čekaju odgovor prije novog spremanja", async ({ page }) => {
  const spremanje = "**/o/api/dokumenti/demo-2";
  const prviOdgovor = Promise.withResolvers();
  await page.route(spremanje, async (route) => {
    await prviOdgovor.promise;
    await route.continue();
  }, { times: 1 });

  await page.goto("/o/doc/demo-2");
  const sadrzaj = page.getByLabel("Sadržaj");
  const status = page.getByRole("status");
  try {
    const prviZahtjev = page.waitForRequest(spremanje);
    await sadrzaj.fill("Prva rečenica.");
    await page.getByRole("button", { name: "Spremi" }).click();
    await prviZahtjev;
    await expect(status).toHaveText("Spremanje…");

    await sadrzaj.fill("Ovo je noviji tekst.");
    await page.getByRole("button", { name: "Spremi" }).click();
    await expect(status).toHaveText("Nespremljene izmjene");
  } finally {
    prviOdgovor.resolve();
  }
  await expect(status).toHaveText("Spremljeno na poslužitelju");
  await page.reload();
  await expect(sadrzaj).toHaveValue("Ovo je noviji tekst.");
});

test("greška čuva tekst u uređivaču i Spremi omogućuje novi pokušaj", async ({ page }) => {
  await page.route("**/o/api/dokumenti/demo-2", (route) => route.fulfill({ status: 502 }), { times: 1 });
  await page.goto("/o/doc/demo-2");
  const sadrzaj = page.getByLabel("Sadržaj");
  const status = page.getByRole("status");
  const spremi = page.getByRole("button", { name: "Spremi" });
  await sadrzaj.fill("Tekst ostaje nakon greške.");
  await spremi.click();
  await expect(status).toHaveText("Greška pri spremanju. Pokušajte ponovno gumbom Spremi.");
  await expect(sadrzaj).toHaveValue("Tekst ostaje nakon greške.");
  await spremi.click();
  await expect(status).toHaveText("Spremljeno na poslužitelju");
  await page.reload();
  await expect(sadrzaj).toHaveValue("Tekst ostaje nakon greške.");
});

base("bez sesije preglednik ide na prijavu preko Institution_servera", async ({ page }) => {
  await page.goto("/o/doc/demo-1");
  await expect(page).toHaveURL(/\/api\/v1\/auth\/login\?returnTo=%2Fo%2Fdoc%2Fdemo-1$/);
});
