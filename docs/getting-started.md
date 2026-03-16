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

Bij `bun run dev` draait de mock-API mee in dezelfde server; je hebt geen aparte testserver nodig. Eén keer data genereren: `cd testserver && bun run init`. Zie **[docs/testserver.md](testserver.md)** voor details.

## Lint en typecheck

Uit de projectroot:

```sh
bun run check
```

Past format en lint automatisch aan. Voor CI (zonder wijzigingen): `bun run check:ci`. De TypeScript-build controleert de extensie (`tsconfig.app.json`), de Vite-config (`tsconfig.node.json`) en de testserver (`tsconfig.testserver.json`).

## Volgende stappen

- **Productiebuild en laden in Chrome:** zie **[docs/build.md](build.md)**.
