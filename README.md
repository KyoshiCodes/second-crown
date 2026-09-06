# Second Crown

Deterministic offline-capable idle kingdom game.

## Play locally

```bash
npm install
npm test
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Features

- **Economy** — buildings, income/sec, letter-suffix numbers, offline catch-up
- **Map** — Pixi grid; select a building, click a tile to place
- **Army** — militia / spearman / knight; bulk train ×1/×5/×10
- **War** — declare or be declared on; deterministic battles, loot, peace timer
- **Characters** — traits affect cost and production
- **Prestige** — soft reset at 50K resources for permanent bonuses
- **Saves** — IndexedDB autosave, export/import JSON files

## Tests

```bash
npm test
```

## Deploy (GitHub Pages)

1. Repo **Settings → Pages → Source: GitHub Actions**
2. Push to `main` (workflow: `.github/workflows/deploy-pages.yml`)

Or build locally:

```bash
npm run build -w @second-crown/app
```

Output: `packages/app/dist`

## Stack

TypeScript monorepo · Vite · React · PixiJS · break_infinity.js · Vitest · npm workspaces
