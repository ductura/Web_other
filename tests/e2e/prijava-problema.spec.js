// /prijavi-problem u svakom pregledniku nad lažnim Institution_serverom (izmišljeni podaci).
import { createHash } from "node:crypto";
import { test as base, expect } from "@playwright/test";

const test = base.extend({
  scenarij: ["", { option: true }],
  sesija: [true, { option: true }],
  page: async ({ page, context, baseURL, scenarij, sesija }, use, info) => {
    if (sesija) {
      const { hostname } = new URL(baseURL);
      await context.addCookies([
        { name: "__Host-ductus_session", value: `e2e-prijava-${scenarij}${info.testId}`, domain: hostname, path: "/", secure: true, httpOnly: true, sameSite: "Lax" },
      ]);
    }
    await use(page);
  },
});

const referenca = (opis) => `PR-${createHash("sha1").update(opis).digest("hex").slice(0, 10).toUpperCase()}`;

test("prijava stiže lažnom serveru i prikazuje se broj prijave", async ({ page }, info) => {
  const opis = `Gumb Spremi ne reagira (${info.project.name}).`;
  await page.goto("/o/prijavi-problem?stranica=/zadaci");
  await expect(page.getByRole("heading", { name: "Prijavi problem", level: 1 })).toBeVisible();
  await page.getByLabel("Vrsta problema").selectOption("account");
  await page.getByLabel("Opis problema").fill(opis);
  await page.getByRole("button", { name: "Pošalji prijavu" }).click();
  await expect(page.getByRole("status")).toContainText(`Broj prijave: ${referenca(opis)}`);
  await page.getByRole("button", { name: "Nova prijava" }).click();
  await expect(page.getByLabel("Opis problema")).toHaveValue("");
});

test.describe("previše prijava", () => {
  test.use({ scenarij: "429-" });
  test("tekst ostaje i prikazuje se poruka", async ({ page }) => {
    await page.goto("/o/prijavi-problem");
    await page.getByLabel("Opis problema").fill("Neki problem.");
    await page.getByRole("button", { name: "Pošalji prijavu" }).click();
    await expect(page.getByText("Poslali ste previše prijava.")).toBeVisible();
    await expect(page.locator("p[role=alert]")).toContainText("previše prijava");
    await expect(page.getByLabel("Opis problema")).toHaveValue("Neki problem.");
  });
});

test.describe("bez sesije", () => {
  test.use({ sesija: false });
  test("vodi na prijavu", async ({ page }) => {
    const odgovori = [];
    page.on("response", (r) => odgovori.push(r.url()));
    await page.goto("/o/prijavi-problem", { waitUntil: "commit" }).catch(() => {});
    await expect.poll(() => odgovori.some((u) => /\/o\/prijava\?povratak=%2Fprijavi-problem/.test(u))).toBe(true);
  });
});
