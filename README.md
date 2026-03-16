# Magister OOP

Chrome-extensie voor **Magister** (magister.net) gericht op OOP (onderwijsondersteunend personeel). De extensie opent een apart venster waarmee je leerlingen, bezetting en absenties overzichtelijk kunt bekijken en beheren, met de sessie van je ingelogde Magister-tab.

## Wat doet de extensie?

- **Leerlingen** — Lijst leerlingen met zoeken, filter op opleiding, sorteren op naam/klas/locker/lesuur. Per leerling: rooster (agenda), huidige en volgende les, locker-code; klik op een leerling voor details en acties (o.a. te laat melden).
- **Bezetting** — Bezetting per locatie en lesuur (vandaag), met grafiek en filters. Klik op een cel om te zien welke leerlingen daar les hebben.
- **Absenties** — Overzicht van afwezige leerlingen met reden, lesuur en vak/docent. Filter op opleiding; vernieuwen om de laatste stand op te halen.
- **Medewerkers** en **Terugkomers** — Tabbladen zijn aanwezig maar nog niet uitgewerkt.

De extensie gebruikt de **cookies/sessie van een open Magister-tab**: je moet ergens op magister.net ingelogd zijn. Bij een klik op het extensie-icoon opent een popupvenster met de React-app; API-aanroepen gaan via die actieve Magister-tabs.

## AVG & privacy

De extensie draait lokaal, heeft geen eigen servers en slaat geen leerlingdata permanent op. Alleen voorkeuren (filters) blijven in local storage. Zie **[docs/privacy.md](docs/privacy.md)** voor de volledige uitleg.

## Documentatie

Meer uitleg staat in de map **`docs/`**:

- **[docs/getting-started.md](docs/getting-started.md)** — Setup (clone, install), development en lokaal testen.
- **[docs/build.md](docs/build.md)** — Build-instructies (productiebuild, watch) en de extensie laden in Chrome.
- **[docs/testserver.md](docs/testserver.md)** — Testserver gebruiken (init, fake data, lokaal testen zonder Magister).
- **[docs/privacy.md](docs/privacy.md)** — Privacy & AVG: hoe de extensie met gegevens omgaat.

## Quick start

Clone, `bun install`, `bun run dev`. Voor dagelijks ontwikkelen volstaat één commando: de dev-server bedient zowel de app als de mock-API op dezelfde poort. Zie **[docs/getting-started.md](docs/getting-started.md)** voor de volledige setup. Voor build en laden in Chrome: **[docs/build.md](docs/build.md)**.

## Projectstructuur

- `public/`: Statische bestanden en `manifest.json`.
- `src/`: React-app (popup), background script, Magister-API en gedeelde code.
- `testserver/`: Mock-API (Hono) voor lokaal testen; bij `bun run dev` geïntegreerd in de Vite-server.
- `vite.config.ts`, `vite-plugin-api.ts`: Vite-configuratie en API-middleware voor dev.
- `tsconfig.json`: Verwijst naar `tsconfig.app.json` (extensie), `tsconfig.node.json` (Vite/config) en `tsconfig.testserver.json` (testserver).

## License

GPLv3. Zie [LICENSE](LICENSE) voor de volledige tekst.
