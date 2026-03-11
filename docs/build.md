# Build & extensie laden

Instructies voor het bouwen van de extensie en het laden in Chrome.

## Vereisten

- [Node.js](https://nodejs.org/) (18+ of 20+) of [Bun](https://bun.sh/)
- Dependencies geïnstalleerd: `bun install` (uit de projectroot)

## Productiebuild maken

Uit de **projectroot**:

```sh
bun run build
```

Het build-script voert achtereenvolgens uit:

1. `bun test` — tests
2. `bun run check` — Biome check (lint/format)
3. `bunx vite build` — Vite productiebuild

De output komt in de map **`build/`**. Die map bevat de gebouwde extensie (HTML, JS, CSS, manifest, icons, etc.) klaar om in Chrome te laden.

### Build met watch (development)

Om bij codewijzigingen automatisch opnieuw te bouwen:

```sh
bun run build:watch
```

## Extensie laden in Chrome

1. Open Chrome en ga naar `chrome://extensions/`.
2. Zet rechtsboven **Developer mode** aan.
3. Klik op **Load unpacked**.
4. Selecteer de map **`build`** (in de projectroot).

De extensie staat nu geladen. Zorg dat je ergens op magister.net ingelogd bent; de extensie gebruikt die tab voor API-aanroepen (behalve in dev met de testserver).

## Overzicht commando's

| Commando         | Beschrijving                    |
|------------------|----------------------------------|
| `bun run build`  | Productiebuild → map `build/`   |
| `bun run build:watch` | Build met watch (herbouw bij wijzigingen) |
