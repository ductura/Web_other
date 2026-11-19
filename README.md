# Ductura / web-other

Frontend za Firefox, Safari, Edge, Operu i ostale preglednike na računalu. Next.js (App Router) na Node.js, u JavaScriptu.

## Podaci

- Aplikacija se poslužuje pod `/o` (`basePath`, D-306 t. 1).
- Podatke čita samo preko Institution_servera `/api/v1`, na poslužitelju (stranice i `app/api/`), na adresi iz `INSTITUTION_SERVER_URL` (zadano http://127.0.0.1:4000). Preglednik ga ne zove za podatke, a baza se nikad ne čita izravno.
- Prenosi se samo kolačić sesije `__Host-ductus_session`. Bez sesije preglednik ide na `/api/v1/auth/login?returnTo=...` (prijava samo preko AAI@EduHr, D-09).

| Stranica | Što radi | Institution_server |
| --- | --- | --- |
| `/o/` | Moji dokumenti | `GET /api/v1/documents` |
| `/o/doc/[id]` | naslov, sadržaj, broj riječi | `GET /api/v1/documents/{id}` |

Stare poveznice `/#/doc/<id>` otvaraju isti dokument.

## Funkcionalna provjera

Isti dokument otvara se u svakom od tih preglednika, a navigacija radi i nakon osvježavanja.
Pokriva je `tests/e2e/open-and-navigate.spec.js` u Firefoxu, Safariju (WebKit), Edgeu i Chromiumu, nad produkcijskim buildom i lažnim Institution_serverom (`tests/e2e/lazni-server.mjs`, samo izmišljeni podaci).
Opera nema vlastiti Playwright kanal; dijeli Chromium jezgru, a ručno se provjerava prije izdanja.

## Pokretanje

```bash
pnpm install
LAZNI_PORT=4000 pnpm fake-server   # bez pravog Institution_servera
pnpm dev                           # http://localhost:5173/o
pnpm test                          # vitest: pomoćne funkcije i stranice
pnpm build
pnpm exec playwright install firefox webkit chromium
pnpm test:functional
```

Lokalno lažni server traži kolačić `__Host-ductus_session=e2e-<bilo što>`; pravi tok prijave ide kroz edge proxy (ugovor Ductus#2028 c.6993786629).
