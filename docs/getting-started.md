# Getting Started

Setup en development van de extensie.

## Vereisten

[Node.js](https://nodejs.org/) (18+ of 20+) of [Bun](https://bun.sh/).

## Setup

1. Repository clonen en map openen:

   ```sh
   git clone <repo-url>
   cd extension
   ```

2. Dependencies installeren:

   ```sh
   bun install
   ```

## Development

Start de development server:

```sh
bun run dev
```

Vite bouwt de extensie en houdt bestanden in de gaten.

## Lokaal testen zonder Magister

Gebruik de testserver met dummy-data. Het testen gebeurt dan uitsluitend met fake data; er worden geen calls naar Magister gedaan en geen echte leerlinggegevens gebruikt. Zie **[docs/testserver.md](testserver.md)** voor uitleg over init (data genereren) en het starten van de testserver.

## Volgende stappen

- **Productiebuild en laden in Chrome:** zie **[docs/build.md](build.md)**.
