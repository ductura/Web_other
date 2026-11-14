// Funkcionalna provjera: isti dokument otvara se u svakom pregledniku,
// a navigacija radi i nakon osvježavanja.
import { test, expect } from '@playwright/test';

test('dokument se otvara, navigacija radi i nakon osvježavanja', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Moji dokumenti' })).toBeVisible();

  await page.getByRole('link', { name: 'Seminarski rad' }).click();
  await expect(page).toHaveURL(/#\/doc\/demo-1$/);
  await expect(page.getByLabel('Naslov')).toHaveValue('Seminarski rad');

  await page.reload();
  await expect(page.getByLabel('Naslov')).toHaveValue('Seminarski rad');

  await page.getByRole('link', { name: 'Ductura' }).click();
  await expect(page.getByRole('heading', { name: 'Moji dokumenti' })).toBeVisible();
  await page.getByRole('link', { name: 'Bilješke s predavanja' }).click();
  await expect(page.getByLabel('Naslov')).toHaveValue('Bilješke s predavanja');

  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Moji dokumenti' })).toBeVisible();
  await page.goForward();
  await expect(page.getByLabel('Naslov')).toHaveValue('Bilješke s predavanja');
});
