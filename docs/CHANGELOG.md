# CHANGELOG

Newest first.

## 2026-09-06 — Gemini Tabletop Board Presentation (`bakeoff/gemini-board`)

- **Tabletop Board & Hardwood Rim**: Recessed isometric board framed in beveled polished dark walnut with antique brass corner brackets, steel rivets, and inner drop shadow.
- **Zoom & Pan Controls (No Rotate)**: Free-form camera navigation with smooth mouse wheel zooming, pointer click-and-drag panning with velocity bounds, and on-screen `[+]`, `[-]`, `[⟲]` buttons. Strict separation between drag and click preserves 100% building click accuracy.
- **Denser Pixel Architecture**: Multi-structure vignettes across all building types (wells, crop patches, woodpile cords, stone terraces, cranes, ore carts, silos, spinning waterwheels, multi-stall bazaars, training dummies).
- **2–3 Frame Walker Sprites**: Discrete 2-3 frame walking and idle cadence (pass, left step, right step) across 6 citizen roles with integer pixel tool/weapon animations.
- **All Hallows Atmosphere**: Creeping low mist and fog banks rolling over cobblestones, jack-o'-lanterns with organic flickering witchfire glow, and gothic folklore backdrop (no Disney likenesses).
- **War Tab Living Pixel Unit Strip**: Real-time tactical army line visualizer displaying player companies, animated waving royal standard bearer, enemy cohorts, and power balance meter. Presentation-only with zero combat simulation changes.
- **Recorded Audio Playback**: Recorded audio loops (`/audio/halloween.ogg`, `/audio/easter.ogg`, `/audio/midwinter.ogg`) play on user interaction with smooth procedural synth fallback.
- **Preserved Sim/Server Purity & ChromeDock**: Zero diff on `packages/sim` and `server`. Sticky ChromeDock tools and holiday switcher intact.

## 2026-09-06 — Gemini immersion foundation (isometric pixel hold, living walkers, theme packs)

- **Isometric Pixel Hold**: 2:1 isometric diamond grid in `packages/render` replacing flat 2D grid. Retains identical 16×10 tile click contract for placing/upgrading buildings.
- **Detailed Pixel Buildings**: Silhouettes for all 15 building types + fallback with construction scaffolding, level upgrade frames (1–5), chimney smoke, and seasonal trims.
- **Living Presentation Walkers**: 8 animated pixel citizens (villagers, woodcutters, miners, merchants, sentries, scholars) with walking strides and idle routines roaming between buildings. Zero sim tick rules.
- **Theme Packs System**: 9 complete packs in `packages/app/src/themes/` (halloween, midwinter, easter, harvest, midsummer, spring, summer, autumn, winter) with dedicated CSS atmospheric backgrounds, chrome, and ambient lighting.
- **Audio Manager**: Recorded audio first (`/audio/<id>.ogg`) with seamless procedural synth fallback and active battle support. Preserves owner's `halloween.ogg`.
- **Sticky TesterBar**: TesterBar pinned at `zIndex: 100` for instant holiday switching.
- **Sim & Server Purity**: `git diff main -- packages/sim server` verified empty.

## 2026-09-06 — Holiday stage + sticky tester bar

- Illustrated holiday stages (not used on plain seasons).
- TesterBar pinned so Holiday overlay stays visible.
- Recorded loop hook `/audio/<id>.ogg` with synth fallback.

## 2026-09-06 — Bakeoff merge: WarRoom, seasons, practice ledger

- Claude WarRoom, Gemini weather/audio/chips, Astra practice exchange.

## 2026-09-06 — HTTPS live + specialist buildings

- `https://129.153.17.72.sslip.io/`
