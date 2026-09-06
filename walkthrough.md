# Walkthrough — Gemini Immersion Foundation (bakeoff/gemini-immersion)

## Overview
This lane transforms Second Crown's presentation into a living, breathing pixel hold inspired by Realm Grinder and classic isometric kingdom builders, featuring:
1. **Isometric 2.5D Pixel Hold Map** (`packages/render`): 2:1 isometric diamond grid replacing the flat colored rectangles.
2. **Living Hold Citizens (Walkers)**: 8 presentation-only walker sprites (villager, woodcutter, miner, merchant, guard, scholar) that dynamically stroll between buildings and idle in town squares with walking stride animations and depth-sorting.
3. **Theme Packs System** (`packages/app/src/themes/`): 9 comprehensive theme packs (`halloween`, `midwinter`, `easter`, `harvest`, `midsummer`, `spring`, `summer`, `autumn`, `winter`) controlling atmospheric backgrounds, UI chrome, audio files, and map ambient tints.
4. **Recorded Audio with Synth Fallback**: `audioManager.ts` streams recorded `/audio/<id>.ogg` tracks (including the owner's `packages/app/public/audio/halloween.ogg`), suppressing the synth bed while recorded music plays, and cleanly falling back to the procedural synth bed when files are absent.
5. **Sticky TesterBar**: `zIndex: 100` pins the holiday selector so it never disappears under the map or stages.
6. **Strict Sim & Server Purity**: `git diff main -- packages/sim server` is completely empty.

---

## Key Changes

### 1. Isometric Pixel Hold & Living Walkers (`packages/render/src/index.ts`)
- **Projection & Clicks**: Implemented 2:1 isometric diamond projection (`TILE_W = 40`, `TILE_H = 20`, viewport `560×360`). Exact inverse screen-to-grid mapping ensures clicking diamond tiles accurately triggers build and upgrade callbacks `(0..15, 0..9)`.
- **Terrain & Cobblestones**: Base terrain diamonds with seasonal palettes, a cobblestone road network connecting the hold, and a 3D stone cliff foundation rim along the southern perimeter.
- **Pixel Buildings**: Dedicated isometric pixel art for all 15 building types (`farm`, `lumber_camp`, `quarry`, `mason`, `gold_mine`, `mint`, `granary`, `sawmill`, `market`, `barracks`, `stables`, `archery_range`, `siege_workshop`, `watchtower`, `chapel`, `walls`, and fallback) with shaded facets, construction scaffolding, level upgrade pips (1–5), animated chimney smoke, and holiday decorations (snow caps, jack-o'-lanterns).
- **Living Presentation Walkers**: 8 animated citizens with walking stride cycles, direction flipping, and idle routines. Zero sim tick rules.
- **Atmospheric Particles & Lighting**: Real-time particles for each season and holiday (snowflakes, spectral embers, fireflies, petals, autumn leaves) plus ambient color tinting.
- **Hover Diamond**: Interactive gold ground diamond highlighting the hovered tile.

### 2. Unified Theme Packs System (`packages/app/src/themes/`)
- `types.ts`: `ThemePack`, `ThemeChrome`, and `MapAmbientConfig` types.
- `packs.ts`: 9 complete theme packs (`halloween`, `midwinter`, `easter`, `harvest`, `midsummer`, `spring`, `summer`, `autumn`, `winter`) with rich radial/linear CSS background gradients, tab/badge chrome, and map color profiles.
- `audioManager.ts`: HTML5 audio coordinator that plays `/audio/<id>.ogg` tracks (preserving `halloween.ogg`), suppresses synth melody when recorded music plays, falls back smoothly to procedural synth bed in `music.ts`, and activates battle audio during active wars.

### 3. Application Shell & UI Styling (`packages/app/src/AppShell.tsx`, `TesterBar.tsx`, `theme.css`)
- AppShell synchronizes active pack styling, background gradients, and map ambient colors.
- `theme.css` provides pack classes (`.pack-halloween`, `.pack-midwinter`, etc.) with customized `--theme-accent`, `--theme-border`, and `--theme-card-bg`.
- `TesterBar.tsx` sticky styling upgraded to `zIndex: 100` to remain pinned above the isometric canvas and theme stage.

---

## Verification Results

### Automated Tests
- **Sim Vitest Suite**:
  ```
  npm test
  ✓ 18 passed (18 test files, 48 passed tests)
  ```
- **App & Render Build**:
  ```
  npm run build -w @second-crown/app
  ✓ built in 3.71s (TypeScript typecheck & Vite production bundle green)
  ```
- **Server Ledger Suite**:
  ```
  node --test server/ledger.test.mjs server/ledger-http.test.mjs
  ℹ pass 10, fail 0
  ```
- **Sim & Server Invariant Check**:
  ```
  git diff main -- packages/sim server
  (empty diff — zero edits to packages/sim or server)
  ```
- **Asset Integrity**:
  `packages/app/public/audio/halloween.ogg` verified present and untouched.
