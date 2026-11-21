// /zadaci u svakom pregledniku nad lažnim Institution_serverom (izmišljeni podaci).
import { test as base, expect } from "@playwright/test";

const test = base.extend({
  scenarij: ["", { option: true }],
  page: async ({ page, context, baseURL, scenarij }, use, info) => {
    const { hostname } = new URL(baseURL);
    await context.addCookies([
      { name: "__Host-ductus_session", value: `e2e-zadaci-${scenarij}${info.testId}`, domain: hostname, path: "/", secure: true, httpOnly: true, sameSite: "Lax" },
    ]);
    await use(page);
  },
});

test("popis kolegija i zadataka sa stanjem rada i ulazom u rad", async ({ page }) => {
  await page.goto("/o/zadaci");
  await expect(page.getByRole("heading", { name: "Moji zadaci", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Izmišljeni seminar iz ekologije grada" })).toBeVisible();
  const prvi = page.getByRole("listitem").filter({ hasText: "Seminarski rad: kućno kompostiranje" });
  await expect(prvi.getByText("Rad je u tijeku")).toBeVisible();
  await expect(prvi.getByText("Prije rada pročitajte obavijest.")).toBeVisible();
  await expect(prvi.getByRole("link", { name: "Seminarski rad: kućno kompostiranje" })).toHaveAttribute("href", /^\/rad\/a1111111-/);
  await expect(page.getByRole("listitem").filter({ hasText: "Esej: zeleni krovovi" }).getByText("Rad nije započet")).toBeVisible();
  await expect(page.getByText("Za ovaj kolegij nema zadataka.")).toBeVisible();
});

test.describe("prazan popis", () => {
  test.use({ scenarij: "prazno-" });
  test("kaže da nema zadataka", async ({ page }) => {
    await page.goto("/o/zadaci");
    await expect(page.getByText("Još nemate kolegija ni zadataka.")).toBeVisible();
  });
});

test.describe("poslužitelj nedostupan", () => {
  test.use({ scenarij: "503-" });
  test("daje poruku i nudi ponovni pokušaj", async ({ page }) => {
    await page.goto("/o/zadaci");
    await expect(page.locator("main").getByRole("alert")).toContainText("Poslužitelj trenutačno ne odgovara");
    await expect(page.getByRole("link", { name: "Pokušaj ponovno" })).toBeVisible();
  });
});

test.describe("račun bez pristupa", () => {
  test.use({ scenarij: "403-" });
  test("daje poruku o pristupu", async ({ page }) => {
    await page.goto("/o/zadaci");
    await expect(page.locator("main").getByRole("alert")).toContainText("nije dostupan ovom računu");
  });
});

base("bez sesije preglednik ide na prijavu", async ({ page }) => {
  await page.goto("/o/zadaci");
  await expect(page).toHaveURL(/\/api\/v1\/auth\/login\?returnTo=%2Fo%2Fzadaci$/);
});
