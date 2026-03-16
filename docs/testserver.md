# Testserver

De testserver is een lokale mock van de Magister-API. Hiermee kun je de extensie ontwikkelen en testen zonder ingelogd te zijn op magister.net. **Testen gebeurt uitsluitend met fake data:** er gaan geen requests naar Magister en er wordt geen echte leerlingdata gebruikt. De API-routing draait op [Hono](https://hono.dev/); alle routes staan expliciet in `testserver/src/app.ts`.

## Dev: alles in één commando

Bij **`bun run dev`** draait de mock-API **geïntegreerd** in de Vite dev-server. Je hoeft geen aparte testserver te starten: één proces, één poort. De extensie praat dan met `/api` op dezelfde origin.

## Standalone testserver (optioneel)

Wil je de API apart draaien (bijv. om alleen de endpoints te testen), dan:

- In de **projectroot** een bestand `.env` aanmaken met de poort:

  ```env
  VITE_TESTSERVER_PORT=3000
  ```

- Starten met: **`bun run testserver:standalone`**. De extensie gebruikt in dev nu de geïntegreerde API; voor standalone moet je handmatig de extensie configureren om naar die poort te gaan (of gebruik de geïntegreerde variant).

## Data initialiseren (init)

De testserver leest data uit JSON-bestanden in de map `testserver/data/`. Die map en bestanden bestaan niet standaard; je moet ze eenmalig laten aanmaken met het **init**-script.

### Init uitvoeren

Vanuit de projectroot:

```sh
cd testserver
bun run init
```

Of in één keer:

```sh
bun run --cwd testserver init
```

Het init-script (`testserver/src/init/init.ts`):

1. **Ruimt bestaande data op** — Verwijdert eventuele bestaande `medewerkers.json`, `leerlingen.json`, `lockers.json`, `agenda.json` en de map `all_photos` in `testserver/data/`.
2. **Maakt de datamap aan** — `testserver/data/` en daarin `all_photos/` voor foto’s.
3. **Genereert dummy-medewerkers** — 100 medewerkers met [Faker](https://fakerjs.dev/) (Nederlandse namen, etc.), opgeslagen in `data/medewerkers.json`.
4. **Genereert dummy-leerlingen** — 400 leerlingen (klassen, studies, contactgegevens), opgeslagen in `data/leerlingen.json`.
5. **Genereert agenda’s** — Roosterdata per leerling, opgeslagen in `data/agenda.json`.
6. **Genereert lockers** — Lockernummers en koppeling aan leerlingen, opgeslagen in `data/lockers.json`.

Na init staan in `testserver/data/` onder andere:

- `medewerkers.json`
- `leerlingen.json`
- `agenda.json`
- `lockers.json`
- `all_photos/` (map, voor leerlingfoto’s; foto’s zelf kunnen later door de API worden gegenereerd/geserveerd)

De gegenereerde IDs zijn deterministisch (Faker wordt per ID geseed), zodat je een vaste set testdata hebt.

### Init opnieuw draaien

Je kunt `bun run init` gerust vaker uitvoeren. Het script wist elke keer de bestaande bestanden en genereert opnieuw. Handig als je de structuur van de init-scripts hebt aangepast of een schone set testdata wilt.

## Testserver standalone starten

Vanuit de projectroot:

```sh
bun run testserver:standalone
```

Dit start de Bun-server op de poort uit `.env` (bijv. 3000). Alleen nodig als je de API los van de Vite dev-server wilt draaien.

De server:

- **Leest** de JSON-bestanden uit `testserver/data/` (via de helpers in `api/utils/helpers.ts`).
- **Serveert** API-endpoints die de Magister-URLs van de extensie nabootsen (leerlingen zoeken, agenda, lockers, foto’s, verantwoordingen, etc.).
- **Staat CORS toe** voor development (o.a. `Access-Control-Allow-Origin: *`).

Zonder eerst `init` te draaien ontbreken de data-bestanden en kunnen requests falen of lege resultaten geven.

## Gebruik in de praktijk

1. **Eenmalig (of wanneer je schone data wilt):** `cd testserver && bun run init`.
2. **Development:** alleen **`bun run dev`** — de extensie en de mock-API draaien samen op één poort.
3. Je opent de extensie (popup/venster) en gebruikt de app; de data komen van de geïntegreerde test-API.

Optioneel: voor alleen de API apart, `.env` met `VITE_TESTSERVER_PORT=3000` en `bun run testserver:standalone`.

In productie (`bun run build`) wordt geen testserver gebruikt; dan praat de extensie alleen met Magister.

## Overzicht commando’s

| Actie                    | Commando                            |
|--------------------------|-------------------------------------|
| Data genereren           | `cd testserver && bun run init`     |
| Dev (app + API in één)   | `bun run dev` (uit root)            |
| Alleen testserver (Bun)  | `bun run testserver:standalone`     |

## Mapstructuur (testserver)

- `testserver/src/app.ts` — Hono-app: routing voor alle API-endpoints, CORS en 404. Wordt gebruikt door zowel de Vite-middleware als de standalone Bun-server.
- `testserver/src/server.ts` — Bun-server voor standalone (`bun run testserver:standalone`); roept `app.fetch` aan.
- `testserver/src/init/init.ts` — Init-script (aanmaken en vullen van `data/`).
- `testserver/src/init/leerling.ts`, `medewerker.ts`, `locker.ts`, `agenda.ts` — Generatoren voor dummy-data.
- `testserver/src/api/` — API-handlers per endpoint (o.a. `leerlingen/zoeken`, `leerlingen/{id}/afspraken`, `v1/lockers/details`). Exporteren `GET(req)` of `GET(req, id)`; de routing staat in `app.ts`.
- `testserver/src/api/utils/` — Gedeelde helpers (o.a. `helpers.ts`, `search.ts`, `sleep.ts`).
- `testserver/data/` — Ontstaat door init; hier staan de JSON-bestanden en `all_photos/`.
