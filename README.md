# Ductura / web-other

Frontend za Firefox, Safari, Edge, Operu i ostale preglednike na računalu.

## Funkcionalna provjera

Isti dokument otvara se u svakom od tih preglednika, a navigacija radi i nakon osvježavanja.
Pokriva je `e2e/open-and-navigate.spec.js` u Firefoxu, Safariju (WebKit), Edgeu i Chromiumu.
Opera nema vlastiti Playwright kanal; dijeli Chromium jezgru, a ručno se provjerava prije izdanja.

## Pokretanje

```bash
npm install
npm run dev                 # http://localhost:5173 s memorijskim API-jem
npm run test:helpers
npx playwright install firefox webkit chromium
npm run test:functional
```
