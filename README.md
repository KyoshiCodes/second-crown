# Second Crown

Deterministic offline-capable idle kingdom game.

## Play locally

```bash
npm install
npm test
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## What’s implemented

- **Economy** — farms, camps, mines, income/sec, letter-suffix numbers
- **Build** — spend resources, construction timers, Pixi grid map
- **Army** — train militia / spearmen / knights
- **War** — declare war on Iron March, fight a deterministic battle (seeded RNG)
- **Characters & realms** — player crown, rival Lord Varric, advisor stub
- **Save / offline** — IndexedDB autosave + catch-up on reload

## Tests

```bash
npm test
```

Includes Invariant 2 (offline == online) and combat determinism checks.

## Deploy to GitHub Pages

```bash
npm run build -w @second-crown/app
```

Publish `packages/app/dist` as the Pages root (or wire a GH Action). `base: './'` is already set.

## Stack

TypeScript monorepo · Vite · React · PixiJS · break_infinity.js · Vitest · npm workspaces
