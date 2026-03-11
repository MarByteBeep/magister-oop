# Testserver

De testserver is een lokale mock van de Magister-API. Hiermee kun je de extensie ontwikkelen en testen zonder ingelogd te zijn op magister.net. De extensie praat in development-modus rechtstreeks met de testserver in plaats van met Magister. **Testen gebeurt dus uitsluitend met fake data:** er gaan geen requests naar Magister en er wordt geen echte leerlingdata gebruikt.

## Vereisten

- In de **projectroot** moet een bestand `.env` staan met de poort van de testserver:

  ```env
  VITE_TESTSERVER_PORT=3000
  ```

  De extensie leest deze variabele bij de build (Vite) en gebruikt `http://localhost:3000` voor API-calls wanneer `import.meta.env.DEV` true is.

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

## Testserver starten

Vanuit de projectroot:

```sh
bun run testserver
```

Dit start de server op de poort uit `.env` (bijv. 3000). In de terminal zie je welke routes er geladen zijn.

De server:

- **Leest** de JSON-bestanden uit `testserver/data/` (via de helpers in `api/utils/helpers.ts`).
- **Serveert** API-endpoints die de Magister-URLs van de extensie nabootsen (leerlingen zoeken, agenda, lockers, foto’s, verantwoordingen, etc.).
- **Staat CORS toe** voor development (o.a. `Access-Control-Allow-Origin: *`).

Zonder eerst `init` te draaien ontbreken de data-bestanden en kunnen requests falen of lege resultaten geven.

## Gebruik in de praktijk

1. **Eenmalig:** in projectroot `.env` aanmaken met `VITE_TESTSERVER_PORT=3000` (of een andere vrije poort).
2. **Eenmalig (of wanneer je schone data wilt):** `cd testserver && bun run init`.
3. **Bij development:** in het ene terminalvenster `bun run testserver`, in het andere `bun run dev` voor de extensie. De extensie bouwt dan met `VITE_TESTSERVER_PORT` en praat in de browser met `http://localhost:3000`.
4. Je opent de extensie (popup/venster) en gebruikt de app zoals normaal; de data komen van de testserver.

In productie (`bun run build`) wordt de testserver-URL niet gebruikt; dan gaat de extensie alleen naar Magister.

## Overzicht commando’s

| Actie              | Commando                          |
|--------------------|-----------------------------------|
| Data genereren     | `cd testserver && bun run init`   |
| Testserver starten | `bun run testserver` (uit root)   |
| Extensie in dev    | `bun run dev` (uit root)          |

## Mapstructuur (testserver)

- `testserver/src/server.ts` — Hoofdserver, route-registratie, CORS.
- `testserver/src/init/init.ts` — Init-script (aanmaken en vullen van `data/`).
- `testserver/src/init/leerling.ts`, `medewerker.ts`, `locker.ts`, `agenda.ts` — Generatoren voor dummy-data.
- `testserver/src/api/` — API-handlers (o.a. `leerlingen/zoeken`, `leerlingen/{id}/afspraken`, `v1/lockers/details`, etc.).
- `testserver/data/` — Ontstaat door init; hier staan de JSON-bestanden en `all_photos/`.
