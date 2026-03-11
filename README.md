# Magister OOP

Chrome-extensie voor **Magister** (magister.net) gericht op OOP (onderwijsondersteunend personeel). De extensie opent een apart venster waarmee je leerlingen, bezetting en absenties overzichtelijk kunt bekijken en beheren, met de sessie van je ingelogde Magister-tab.

## Wat doet de extensie?

- **Leerlingen** — Lijst leerlingen met zoeken, filter op opleiding, sorteren op naam/klas/locker/lesuur. Per leerling: rooster (agenda), huidige en volgende les, locker-code; klik op een leerling voor details en acties (o.a. te laat melden).
- **Bezetting** — Bezetting per locatie en lesuur (vandaag), met grafiek en filters. Klik op een cel om te zien welke leerlingen daar les hebben.
- **Absenties** — Overzicht van afwezige leerlingen met reden, lesuur en vak/docent. Filter op opleiding; vernieuwen om de laatste stand op te halen.
- **Medewerkers** en **Terugkomers** — Tabbladen zijn aanwezig maar nog niet uitgewerkt.

De extensie gebruikt de **cookies/sessie van een open Magister-tab**: je moet ergens op magister.net ingelogd zijn. Bij een klik op het extensie-icoon opent een popupvenster met de React-app; API-aanroepen gaan via die actieve Magister-tabs.

## AVG & privacy

De extensie is bewust sober met gegevens:

- **Geen externe servers** — Er zijn geen eigen servers. Alles draait lokaal in je browser; de extensie praat alleen **rechtstreeks** met Magister via hun API (magister.net). Geen tussenliggende diensten, geen doorsturen van leerling- of persoonsdata.
- **Conservatief met API-calls** — Er wordt zuinig omgegaan met aanroepen naar de Magister-API. Waar mogelijk wordt hergebruikt wat al is opgehaald; alleen wat nodig is voor wat je op dat moment doet wordt opgevraagd.
- **Niet-persistente lokale cache** — Om het aantal API-calls te beperken wordt gebruikgemaakt van een lokale cache in **session storage**. Die cache is niet persistent: zodra je de browser of het extensievenster sluit, is hij weg. Binnen een sessie worden eerder opgehaalde antwoorden (bijv. roosters) hergebruikt waar dat kan.
- **Geen leerlingdata in local storage** — Leerlinggegevens (namen, roosters, absenties, enz.) worden **niet** in local storage weggeschreven. Ze bestaan alleen in het geheugen van de extensie en in session storage; na sluiten verdwijnt dat.
- **Local storage alleen voor voorkeuren** — In local storage wordt uitsluitend bewaard wat je zelf kiest: bijvoorbeeld geselecteerde opleidingen (filter) of bezettingslocaties. Geen persoonsgegevens.

Daarmee beperk je het verwerken en bewaren van leerlinggegevens en sluit de extensie beter aan bij AVG-uitgangspunten (minimale gegevensverwerking, geen onnodige persistentie).

## Documentatie

Meer uitleg staat in de map **`docs/`**:

- **[docs/getting-started.md](docs/getting-started.md)** — Setup (clone, install), development en lokaal testen.
- **[docs/build.md](docs/build.md)** — Build-instructies (productiebuild, watch) en de extensie laden in Chrome.
- **[docs/testserver.md](docs/testserver.md)** — Testserver gebruiken (init, fake data, lokaal testen zonder Magister).

## Quick start

Clone, `bun install`, `bun run dev`. Zie **[docs/getting-started.md](docs/getting-started.md)** voor de volledige setup. Voor build en laden in Chrome: **[docs/build.md](docs/build.md)**.

## Projectstructuur

- `public/`: Statische bestanden en `manifest.json`.
- `src/`: React-app (popup), background script, Magister-API en gedeelde code.
- `vite.config.ts`: Vite-configuratie voor de extensie.
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`: TypeScript-configuratie.

## License

GPLv3. Zie [LICENSE](LICENSE) voor de volledige tekst.
