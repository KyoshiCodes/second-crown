# Claude — WarRoom + structure

## What changed

- Added `packages/app/src/WarRoom.tsx`: the real War tab component. It composes,
  in one screen meant to be read in about 20 seconds:
  - Diplomacy panel and current odds (`realmPower`).
  - A "Raise 5 militia" levy/train shortcut.
  - A new **Defenses & decrees** status card — read-only text showing whether
    the palisade is up (and for how much longer) and which royal decrees are
    currently active. It reads existing state via a new `warSummary` sim
    helper; it does not add new buttons (fortify/decree actions already live
    on the Crown tab via `DecreesPanel`).
  - The last-battle phase readout (`BattleVisual`, unchanged).
  - Declare war / Fight (resolve) / White Peace controls (unchanged behavior).
- `packages/app/src/tabs/WarTab.tsx` is now a thin wrapper that just renders
  `WarRoom` with the same props it always received from `AppShell`.
- Added `packages/sim/src/actions/war.ts#warSummary` — a tiny, tested helper
  that bundles player power, the active war (if any), fortify ticks
  remaining, and decree ticks remaining into one object. It only reads
  existing state through existing functions (`realmPower`, `fortifyTicksLeft`,
  `decreeUntil`); it introduces no new formulas or balance changes.
- Exported `warSummary` and its `WarSummary` type from `packages/sim/src/index.ts`.
- Added `packages/sim/src/actions/war.test.ts` (2 tests) covering `warSummary`
  on a fresh state and after fortifying, swearing a decree, and declaring war.

## Why

The brief asked for one War tab readable in 20 seconds, keeping existing
`className` hooks so Gemini's theming still applies, and no server or sim
formula changes. Moving the tab body into `WarRoom.tsx` behind a thin
`WarTab.tsx` keeps `AppShell.tsx`'s per-tab wiring untouched, and the new
status card answers "is my kingdom fortified and are any decrees running"
without leaving the tab or duplicating the action buttons that already exist
on the Crown tab.

## What I did NOT touch

- `packages/sim/src/core/tickEngine.ts` — no changes.
- No second combat resolver — `resolveBattle` is still the only fight logic;
  `warSummary` only reads its outputs.
- No server routes, no Discord/Caddy/guest-token changes.
- No crest/theme.css/Pixi restyling — that's Gemini's lane.
- Existing `sc-tab tab-war`, `theme-war`, `sc-realm-card` hooks are preserved;
  `WarRoom` is wrapped in a `sc-tab-war` div so Gemini has a per-tab hook to
  theme, same as the brief asked for.

## Verify

```bash
npm test                              # 48 passed, including the 2 new warSummary tests
npm run build -w @second-crown/app    # builds clean
```
