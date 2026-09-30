## 2026-09-30 — render + app / board-only seasonal wash (bakeoff/gemini-season-wash)

- `resolveBoardSeasonWash(state, province?, visuals?)` in `packages/render/src/tokens.ts`:
  - Reads `currentSeason(state)` (and holiday overrides).
  - Winter (`season === "Winter"` or holiday `"midwinter"`): `hasWash: true, washColor: 0xbae6fd, washAlpha: 0.22, kind: "winter-frost"` for all tiles.
  - Harvest (`season === "Autumn"` or holiday `"harvest"`): `hasWash: true, washColor: 0xf59e0b, washAlpha: 0.22, kind: "harvest-gold"` only when `p.terrain === "plain" || p.node === "field"`. Other terrain receives `hasWash: false`.
  - Spring / Summer: `hasWash: false, washColor: null, washAlpha: 0, kind: "none"`.
- `paintBoardProvinces`: applies `resolveBoardSeasonWash`. Winter draws rear/front frost rime strokes and snow dusting flecks. Harvest draws golden rim highlight and wheat glints.
- `OverworldAtlas.tsx`: mounts SVG polygons/polylines matching `resolveBoardSeasonWash` with `pointerEvents: "none"`.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. March speed and farm yield untouched. No `theme.css` changes. Zero conflict markers.

## 2026-09-30 — app / lofi dock stable (wave/lofi-stable)

- Lofi playback never changes `lofiIndex` on failure. Only the player (list, prev, next) or a clean `ended` on unpinned play moves it.
- `lofiPinned` becomes true on any `playLofiTrack` call and is applied as `el.loop` in `playLofi`. There is no unpin besides reload; add one if a "play through" toggle is wanted.
- Retrying a `missing` src needs `lofiSrc = null` (see `retryAfterFailure`), otherwise `playLofi` reuses the errored element and `play()` rejects without reloading.
- `main.tsx` calls `startMusicBed()` on every document click. It deliberately skips `playLofi` while `missing`, so clicks do not hammer a 404.
- In `runBed`, lofi `hush` includes `lofiStatus === "missing"`, so a failed file is silence, not the synth arpeggio.

## 2026-09-30 — app / keep rooms 2D backdrops (bakeoff/gemini-rooms)

- `RoomBackdrop.tsx`: exports `RoomBackdrop`, `ThroneDaisBackdrop`, `WallWalkBackdrop`, and `MuddyYardBackdrop`.
  - Hall: Throne dais (`sc-keepin-backdrop-throne-dais`) featuring 3-tier elevated stone dais platform (`daisStepGrad`), high-backed carved monarch throne with golden finials and royal crimson tufted cushion, overhead draped canopy (`canopyVelvet`), vaulted alcove arch, torch sconces with warm radial glows (`torchGlowLeft`, `torchGlowRight`), and heraldic tapestries.
  - Wall: Wall walk (`sc-keepin-backdrop-wall-walk`) featuring stone battlements (`wallStone`) with merlons and cruciform arrow slits, weathered timber duckboards (`walkwayTimber`), iron tripod braziers with burning coals and rising embers (`brazierGlowLeft`, `brazierGlowRight`), leaning sentry shield, and crossed halberds overlooking a twilight sky (`twilightSky`).
  - Yard: Muddy yard (`sc-keepin-backdrop-muddy-yard`) featuring heavy churned earth (`mudEarth`) with deep curved wheel ruts, standing rainwater puddles with sky reflections (`puddleReflect`), bailey palisade fence, stacked barrels (`barrelWood`) & crates, and soldier training quintain dummy.
- `KeepInterior.tsx`: mounts `<RoomBackdrop room={room} />` in each room tabpanel (`is-hall`, `is-wall`, `is-yard`).
- `keep-interior.css`: scoped styles for `.sc-keepin-backdrop-wrap`, `.sc-keepin-backdrop-art`, `.sc-keepin-backdrop-badge`. Strictly enforces `pointer-events: none !important;` so all plot clicks, facts, tabs, and buttons are unimpeded.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — app / keep rooms (wave/keep-rooms)

- Room is view state in `KeepInterior` (`useState<Room>("hall")`), reset to Hall each time the keep opens because the component unmounts on close. Not in `GameState`, not saved, never passed to the sim.
- Wall and Yard rooms read only: `wallHp`, `edgeWallCount(state, "player")`, `hasClosedWallRing`, `gateOnRim`, `gateHp`, `countBuilding(state, "walls")`, `keepBonus`. Yard rule matches `keepYardWorks` in `ProvinceInspect.tsx`; if one changes, change both.
- Wall room deliberately does not print the ring threshold (8 rim walls lives in `hasClosedWallRing`), so the UI cannot drift from the sim rule.
- Only the Hall room renders the plot grid; taps still go through `tapHoldTile`.

## 2026-09-30 — render + app / supply cart art & load silhouettes (bakeoff/gemini-supply)

- `resolveGatherLoadInfo(item, state?)` in `packages/render/src/tokens.ts`: inspects item and state presentation gathers to classify `stockCount`, `capacity`, `ratio`, `isLoaded`, and `isEmptyReturn`. When `stockCount <= 0` or returning with empty load, `isEmptyReturn` is set to true.
- `drawGatherColumnMeeple` in `packages/render/src/tokens.ts`:
  - Draft yoke: forward arched hardwood yoke beam (`0x92400e`), under-neck iron yoke bow (`0x27272a`), central brass hitch ring (`0xd4a359`), and dual timber draft trace shafts (`0x78350f` / `0x451a03`).
  - Crate stack & load: timber crates (`0xb45309`), iron corner straps (`0x27272a`), diagonal X-braces, bulging burlap sacks, barrels, node cargo (wood logs, stone blocks, gold coffers, grain sheaves), and tie-down ropes (`0xfef08a`).
  - Empty return: bare floorboard lines (`0x543007`), open timber side stakes (`0x27272a`), folded drop cloth (`0xa16207`), and slate empty badge (`0x64748b`).
- `WarChip.tsx` & `ForceCard.tsx`: `CartSvg` updated with forward draft yoke and loaded/empty variants; gather cards in `WarRoom.tsx` compute and pass `loaded` and `empty` props.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. All chips strictly `pointer-events: none !important;`. Zero `<<<<<<<` conflict markers.

## 2026-09-30 — app / HUD captains (wave/hud-captains)

- `captainName(id)` in `packages/app/src/hud/captainName.ts` is pure and display-only: FNV-1a over the id string, `% CAPTAINS.length`. Not sim state, not saved; do not read it from the sim.
- Reordering or resizing `CAPTAINS` renames every force on screen. Append-only is not enough either (the modulus changes), so treat the list as fixed once players have seen it.
- Used for `March.id` (scout, hostile) and `Gather.id`. Garrisons have only `provinceId`, so no captain; add one only if garrisons gain a real id.

## 2026-09-30 — server + app / save lock (wave/save-lock)

- `gateSave(raw, prev, elapsedMs, replace = false)`. Conflict cases throw `SaveGateError(409, NEWER_HOLD, true)`: `prev.meta.version > next.meta.version`; `next.tick < prev.tick` unless `replace` and the tick fits the fresh-game window; input log shorter than or diverging from the stored one. Other 409s (faster than real time, back-dated, state change without time) stay `conflict: false`: those are cheat checks, not stale copies.
- `/save` handler: on `e.conflict`, returns `{ error, conflict: true, save: <stored file as string> }`. `replace` comes from the `?replace=1` query (no new CORS headers).
- Client: `pushSave` throws `CloudConflictError(message, save)`. `CloudPanel.push()` catches it and sets `newer`; **Load cloud** writes `newer` (or a fresh `pullSave`) to IndexedDB and reloads. **Keep this game** confirms and pushes with `replace`.
- Load cloud reloads right after the IndexedDB write; the pagehide auto-push then sends the cloud save back unchanged, which the gate accepts.

## 2026-09-30 — app / keep interior (wave/keep-interior)

- `useGameEngine.tapHoldTile(x, y)` is the single hold-tile action path (cancel build → cancel upgrade → upgrade → place `selectedBuildRef`). `map.onTileClick(tapHoldTile)`; `KeepInterior` gets it as `onTap`. Change build/tap behaviour there, not in the component.
- `KeepInterior.tsx` mirrors `HOLD_W = 16` / `HOLD_H = 10` from `packages/sim/src/actions/build.ts` (not exported). If the hold size changes, update both.
- Keep-yard highlight uses `keepBonus(state, b) > 1` (same test as the inspect card's "Keep yard" line). Chip staffed = `staffBonus > 1`, like `WorkCard`.
- Open state lives in `AppShell` (`keepOpen`), rendered only while `tab === "kingdom"`. Styles: `keep-interior.css`, classes `sc-keepin*` and `sc-inspect-enter-keep`.

## 2026-09-29 — server / save gate (wave/security-gate)

- The client cannot set resources. `server/savegate.mjs` `gateSave(raw, prevSave, elapsedMs)` runs on every `PUT /save` in `server/index.mjs`; throws `SaveGateError(status, message)`, and the handler returns that as `{ error }`. Nothing is written on a throw.
- `parseSave`: whole `GameState` shape required (all top-level objects/arrays), `meta.version` 1..`SAVE_VERSION`, integer `meta.tick`, resources and unit counts as number strings, input log entries with `tick <= meta.tick`.
- Against the previous accepted save: tick advance bounded by server wall time since the last accepted push (`saveAt` on the user record, file mtime for older records) at the fastest client speed plus a small clock slack; input log append-only and not back-dated; no resource/building/unit change at the same tick unless the input log grew; a lower tick is accepted only as a new game.
- Mirrored constants (`SAVE_VERSION`, `TICKS_PER_SECOND`, `MAX_SPEED`) are asserted against `packages/shared` and `HudControls.tsx` in `savegate.test.mjs`. If you add a faster speed button or bump the save version, update `savegate.mjs`.
- Some sim actions change resources without logging to `inputLog` (invariant 3 gap). A paused-game push after one of them is refused until time moves. Logging those actions would remove the false refusals.
- Run server tests: `cd server && node --test savegate.test.mjs ledger.test.mjs ledger-http.test.mjs` (root `npm test` only covers `packages/sim`).
- Full cost checking of each action would need the sim on the server, which DECISIONS.md rules out; changing that is an owner decision.

## 2026-09-29 — app / music mode + lofi (wave/lofi-radio)

- `packages/app/src/music.ts`: `mode: "off" | "lofi" | "bed"` (key `sc-music`, default `off`; old `sc-music-muted` is no longer read). Internal `muted` = mode off. `isMusicMuted()` now means "Realm bed silent" (mode !== bed) so `audioManager` pauses holiday/battle recordings in Lofi too.
- `setMusicMode` persists, clears timers, starts/stops lofi, reruns the bed and fires `window` event `sc-music-change`. `setMusicMuted(bool)` kept as a toggle between off and the last non-off mode.
- Lofi player: one `HTMLAudioElement`, `LOFI_TRACKS` = `LOFI_FILES` (hand-listed filenames, code-point order) mapped through `encodeURIComponent` (names have spaces, commas, parens). Holiday `.ogg`s excluded. Not looped per file; `ended` advances the index mod length. `error` skips to the next; after every file fails in a row it gives up and `runBed` plays the `LOFI` synth pattern (0.7s step, sine, no battle pulse). While a file is `playing`, the synth hushes.
- Change detection uses a private `lofiSrc` (not `el.src.endsWith`, which breaks on percent-encoded names).
- To add tracks: drop a CC0/CC-BY `.ogg` into `packages/app/public/audio/`, add its exact filename to `LOFI_FILES` in sorted position, credit it in `CREDITS.md`, rebuild. There is no directory scan at runtime. Note `19`/`23` (Clouds) and `20`/`21` (Busted Jazz) share titles but are different files.
- Track API in `music.ts`: `getLofiIndex`, `playLofiTrack(i)` (wraps, resets error count, plays only in lofi mode), `nextLofiTrack`, `prevLofiTrack`, `lofiTrackName(i)` (strips `NN HoliznaCC0 - ` and `.mp3`/`.ogg`). `playLofi` fires `window` event `sc-lofi-track` whenever the src changes (manual pick, ended, or 404 skip).
- `MusicDock.tsx` renders private `LofiDock` (hook `useLofiIndex`) after the mode select when mode is lofi. List rows are numbered because `19`/`23` and `20`/`21` share titles. Styles: `packages/app/src/lofi-dock.css` (chrome-btn tokens only, no theme.css edits).
- `MusicDock.tsx` (`MusicDock`, `useMusicMode`) mounted in `ChromeDock.tsx` before `<ThemeDock />`; `HudControls.tsx` reads the same hook.
- `audioManager.setMuted` now only calls `setMusicMuted`; the pause/resume body moved to private `applyMuted`, driven by the `sc-music-change` listener registered in `init()`.

## 2026-09-29 — sim / primer v3 text (wave/primer-v3)

- `TUTORIAL_STEPS` in `packages/sim/src/systems/tutorial.ts`: text rewritten only. Ids pinned by `tutorial.test.ts` kept. `tryAdvanceTutorial` untouched.
- `PrimerTab` gains `"world"`; `TAB_HINT` in `TutorialBanner.tsx` gains `world` and the board hint now says the inspect card lives on the Kingdom tab (it only renders there, see `AppShell.tsx`).
- `march` step tab moved army → board: the Column box and "Send raid column" live on the inspect card, not Army.
- Not covered: quests (`QuestPanel.tsx` unmounted), People as its own tab (it is a section of Kingdom), market stalls (MarketPanel says stalls are not live yet).

## 2026-09-30 — render / seasonal weather precipitation particles (bakeoff/gemini-weather)

- `resolveWeatherKind` & `resolveWeatherFromState` in `packages/render/src/weather.ts`:
  - Determines precipitation mode from state season and holiday:
    - `"rain"`: Autumn seasons (`"autumn"`, `"fall"`) and wet holidays (`"harvest"`, `"halloween"`).
    - `"snow"`: Winter season (`"winter"`) and winter holiday (`"midwinter"`).
    - `"clear"`: All other seasons/holidays (`"spring"`, `"summer"`, `"easter"`, `"midsummer"`, etc.).
  - Re-exported in `packages/render/src/index.ts`.
- `paintWeatherParticles` & `createWeatherParticles` in `packages/render/src/weather.ts`:
  - Rain: slanted falling streaks (`lineTo(p.x - 1.4, p.y + len)`), `0x93c5fd` at alpha 0.6, with subtle ground splash ripples (`0x60a5fa`) near the bottom of the viewport.
  - Snow: gentle downward drift with sinusoidal flutter (`Math.sin(t * 1.5 + p.phase) * 0.45`), crystalline white core (`0xf8fafc`) and cyan halo (`0xbae6fd`).
  - Clear: executes `g.clear()` and returns immediately without emitting draw calls.
  - Interactive safety: both `particlesGraphic.eventMode = "none"` (hold view) and `boardWeatherGraphic.eventMode = "none"` (board view) ensure Pixi pointer events are never captured.
- `packages/app/src/seasons/WeatherOverlay.tsx`:
  - Canvas 2D precipitation updated to use `resolveWeatherKind(season, holiday)`:
    - Rain in autumn-ish wet seasons, snow in winter, clear (count = 0) otherwise.
    - Inline style and `.sc-weather-container, .sc-weather-container * { pointer-events: none !important; user-select: none !important; }` in `packages/app/src/theme.css` ensure clicks always penetrate through to interactive UI and tiles.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-29 — render / tiles that are march destinations get faint ring (bakeoff/gemini-dest)

- `buildMarchDestinationMap` & `getTileMarchDestination` in `packages/render/src/tokens.ts`:
  - Scans active marches in `listMarches(state)` and gathers in `listGathersPresentation(state)`:
    - Hostile enemy columns (`realmId !== "player"` or `isIncomingMarch(m, state)`) mapping to `m.toId` are tagged `"hostile"`.
    - Player columns (`realmId === "player"`) mapping to `m.toId` are tagged `"player"`.
    - Outbound gathers map to `g.toId`; returning gathers map to home `fromId`.
    - Hostile enemy destinations take alert priority when both factions march toward the same province.
  - Exported and re-exported in `packages/render/src/index.ts`.
- `paintBoardDestinationRing` in `packages/render/src/tokens.ts`:
  - Renders a faint, animated ring around the perimeter of destination tiles:
    - Player gold palette: `0xf59e0b` (ring), `0xd97706` (glow), `0xfde047` (shimmer & pips).
    - Hostile red palette: `0xef4444` (ring), `0xdc2626` (glow), `0xfca5a5` (shimmer & pips).
    - Tabletop ground ring at `wy` with soft atmospheric glow (`alpha: 0.25 - 0.55`).
    - Elevated plateau ring at `cy` (`wy - elev`) with rear-facet sunlit shimmer.
    - Subtle cardinal corner bracket pips on the 4 diamond vertices.
    - Animated breathing pulse driven by `Math.sin(phase * 3 + p.x * 2 + p.y) * 0.12`.
    - Distinct from the thick, high-opacity gold player selection rim (`paintBoardSelectionRim`).
  - Exported and re-exported in `packages/render/src/index.ts`.
- `paintBoardProvinces` in `packages/render/src/tokens.ts`:
  - Builds `marchDestMap = buildMarchDestinationMap(state)` once per frame.
  - Renders `paintBoardDestinationRing` for both unseen (fog cloud veil) and seen tiles.
  - Rendered at step 6.5 after relief art and structures, immediately preceding step 7 selection rim.
- `OverworldAtlas` in `packages/app/src/OverworldAtlas.tsx` & `theme.css`:
  - Evaluates `destKind = getTileMarchDestination(state, p.id)` per province.
  - Renders `<g className="sc-atlas-dest-ring" pointerEvents="none">` with diamond ground/plateau strokes and corner pips.
  - Added `.sc-atlas-dest-ring` with `pointer-events: none !important;` in `theme.css`.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-29 — render / rival home keeps show realm crest above keep (bakeoff/gemini-capitals)

- `drawRealmCrestAboveKeep` in `packages/render/src/tokens.ts`:
  - Implements a finely-rendered heraldic escutcheon shield floating above keep pinnacles (`cx`, `cy - 23.5`):
    - Ground drop shadow on keep / air (`0x050403`, alpha 0.65).
    - Escutcheon rim plaque (`pal.plaqueColor`, `pal.borderColor`).
    - Inner shield field filled with `pal.pennantColor` and subtle accent inner border (`pal.accentColor`, alpha 0.5).
    - Faction-specific heraldic charge / sigil:
      - `rival` (Iron March): Crossed blades (`0xf4f4f5`), crimson boss rivet (`0xef4444`), gold stud (`0xfef08a`).
      - `k_silk` (Silk Coast): Golden anchor (`0xf1c40f`, `0xfef08a`) with bezier nautical curve.
      - `k_ash` (Ash Nomads): Steppe arrowhead (`0xe67e22`, `0x7c2d12`, `0xfde047`).
      - `k_veil` (Veil Theocracy): Radiant 8-pointed star (`0xffffff`, `0xa78bfa`, `0x7c3aed`).
      - `k_glass` (Glass Cities): Faceted cyan prism diamond (`0x06b6d4`, `0x38bdf8`, `0xffffff`).
      - `k_frost` (Frost Holds): Six-pointed snowflake crystal (`0xffffff`, `0x7dd3fc`).
      - `k_tide` (Tide Princes): Twin bezier ocean surf waves (`0x2dd4bf`, `0x5eead4`).
      - `k_ember` (Ember Concord): Rising flame comet (`0xea580c`, `0xf97316`, `0xfef08a`).
      - `k_bronze` (Bronze League): Classical bronze arch & anvil (`0xfbbf24`, `0xfde68a`).
      - default: Chevron & realm stud (`pal.accentColor`, `pal.studColor`).
    - Finial crown stud atop the shield apex (`pal.studColor`, `pal.borderColor`, `0xffffff`).
    - Breathing glint at upper-left corner driven by `Math.sin(phase * 3 + cx)`.
  - Exported and re-exported in `packages/render/src/index.ts`.
- `drawMiniatureKeep` in `packages/render/src/tokens.ts`:
  - When `!isHome && realmPal && realmPal.realmId !== "player"`, calls `drawRealmCrestAboveKeep(g, cx, cy, realmPal, phase)`.
  - When `isHome === true`, renders the player's majestic sovereign golden coronet (`0xfacc15`, `0xfde047`) and gilded royal frame; `drawRealmCrestAboveKeep` is NOT called (player home is unchanged).
- `OverworldAtlas` in `packages/app/src/OverworldAtlas.tsx` & `theme.css`:
  - Added `<MiniRealmCrest>` SVG component with matching shield geometry, faction colors, and charges.
  - Passes `occupantRealmId={p.occupantRealmId}` to `MiniKeep`.
  - When `!home && occupantRealmId && occupantRealmId !== "player"`, renders `<MiniRealmCrest>` above the keep.
  - Wrapped with `.sc-atlas-realm-crest` and `pointer-events: none !important;` in `theme.css` so atlas clicks cleanly fall through.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-29 — render / light seasonal and holiday tint on board tiles (bakeoff/gemini-season-tint)

- `getThemeVisuals` in `packages/render/src/buildings.ts`:
  - Normalized case matching for season (`spring`, `summer`, `autumn`, `winter`) and holiday (`halloween`, `midwinter`, `easter`, `harvest`, `midsummer`).
  - Configured seasonal tints:
    - Spring: `0x86efac` (spring green, alpha 0.10)
    - Summer: `0xfef08a` (summer sunbeam, alpha 0.10)
    - Autumn: `0xf59e0b` (autumn gold, alpha 0.14)
    - Winter: `0xbae6fd` (winter cool frost cyan, alpha 0.14)
    - Holidays: Halloween (`0x581c87`, alpha 0.18), Midwinter (`0x38bdf8`, alpha 0.16), Easter (`0xc084fc`, alpha 0.12), Harvest (`0xf59e0b`, alpha 0.16), Midsummer (`0xfde047`, alpha 0.14).
- `resolveBoardThemeVisuals` & `resolveBoardSeasonTint` in `packages/render/src/tokens.ts`:
  - Exported helper functions for resolving `ThemeVisuals` and `BoardSeasonTint` from `state` (via `currentSeason` or `state.season`) and active flags/theme overrides.
  - Re-exported from `packages/render/src/index.ts`.
- `paintTileHeightFace` in `packages/render/src/tiles.ts`:
  - Accepts optional `theme?: ThemeVisuals | null`.
  - Glazes front-left cliff face (`theme.tintAlpha * 0.55`) and front-right cliff face (`theme.tintAlpha * 0.40`) with `theme.tintColor`.
- `paintBoardProvinces` in `packages/render/src/tokens.ts`:
  - Accepts optional `visuals?: ThemeVisuals | null`.
  - Passes `theme` to `paintTileHeightFace`.
  - Glazes `topDiamond` with `theme.tintColor` and `theme.tintAlpha` directly above base `pal.fill` and before drawing relief artwork, highlights, borders, and meeples, preserving full terrain visibility.
- `OverworldAtlas` in `packages/app/src/OverworldAtlas.tsx`:
  - Resolves `seasonTint` via `currentSeason(state)` and `detectCurrentHoliday()`.
  - Glazes seen tile cliffs and top diamond with `pointerEvents: "none"`.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-29 — render / tiny seconds badge on board march meeples (bakeoff/gemini-eta)

- `drawMarchEtaBadge` in `packages/render/src/tokens.ts`:
  - Implements a compact floating seconds badge (`w = 10 + 4 * text.length`, `h = 9`) above board march meeples with drop shadow (`alpha: 0.45`), dark container pill (`0x090d16`), status pip (golden hourglass or hostile crimson skull), and 3x5 bitmap pixel font.
  - Pixel font defined via `MARCH_ETA_GLYPHS_3X5` (3-bit masks for digits 0-9 and 's'), eliminating DOM font dependencies and guaranteeing full determinism across headless tests and WebGL.
  - Dynamically offsets with the marching stride and head bob (`pawnY - 28 - bob`).
- `paintBoardMarches` in `packages/render/src/tokens.ts`:
  - Calculates `secs = Math.ceil(ticksLeft / 10)` when `typeof m.arrivesTick === "number"`.
  - Displays `drawMarchEtaBadge` for all active march types with arrival times: scout columns (`0x38bdf8`), gather columns (`0x22c55e`), garrison detachments (`0x3b82f6`), player war columns (`pal.accentColor`), and hostile warbands (`0xdc2626`).
- `drawRedWarbandMeeple` in `packages/render/src/tokens.ts`:
  - Accepts optional `secs?: number`. When provided, calls `drawMarchEtaBadge` with hostile hazard pip and crimson border; preserves fallback behavior when `secs` is omitted.
- `paintBoardGathers` in `packages/render/src/tokens.ts`:
  - When `typeof g.arrivesTick === "number"`, renders `drawMarchEtaBadge(pawnsG, pawnX, pawnY, secs, 0x22c55e, bob)`.
- `boardPawnsLayer.eventMode = "none"` in `packages/render/src/index.ts`:
  - Sets Pixi v8 `eventMode = "none"` on `boardPawnsLayer` to guarantee march meeples and badges are non-interactive and never block pointer events.
- `OverworldAtlas` in `packages/app/src/OverworldAtlas.tsx` & `theme.css`:
  - Renders SVG `<g className="sc-atlas-march-eta-badge" style={{ pointerEvents: "none" }}>` with `{secs}s`.
  - Added `.sc-atlas-march-eta-badge` with `pointer-events: none !important;` in `theme.css`.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-29 — render / cloud veil on unseen tiles (bakeoff/gemini-fog)

- `paintFogHeightVeil` in `packages/render/src/tiles.ts`:
  - Rebuilt with multi-tiered volumetric cumulus lobes, diffused floating aerial shadow at `wy + 4`, cool celestial azure mist stratum (`0x38bdf8`, `0xdbeafe`), sunlit white crests (`0xffffff`), curving vapor wisps, and antique brass 8-point compass rose with golden star eye (`0xd4a359`, `0xfef08a`).
  - Distinguishes unseen tiles from peak rock facets and snowcaps through soft circular lobe geometry, floating elevation hover (`wy - 8 + bob`), and cyan-azure ethereal mist base.
- `paintBoardProvinces` in `packages/render/src/tokens.ts`:
  - Checks `isProvinceSeen(state, p.id)`: unseen tiles render `paintFogHeightVeil(g, b, p, phase)` and skip terrain/node rendering, while seen tiles stay clear.
- `OverworldAtlas` in `packages/app/src/OverworldAtlas.tsx`:
  - Added `<MiniCloudVeil>` component and evaluated `isProvinceSeen(state, p.id)`.
  - Unseen tiles render `<MiniCloudVeil>` over subtle click target, while seen tiles render full terrain, lift cliffs, and nodes.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-28 — render / keep-yard annexes and scaffolding (bakeoff/gemini-yard)

- `listKeepYardBuildings(state?: GameState | null, realmId = "player"): KeepYardBuildingInfo[]`:
  - Exported from `packages/render/src/tokens.ts` and re-exported by `packages/render/src/index.ts`.
  - Finds the player keep (`typeId === "keep"`) and checks candidate buildings with Manhattan distance `|dx| + |dy| === 1`.
  - Maps to slots: `west` (dx = -1, dy = 0), `south` (dx = 0, dy = 1), `east` (dx = 1, dy = 0), `north` (dx = 0, dy = -1).
  - Fallback logic supports test mocks / flags (`keepYard`).
- `drawKeepYardAnnex(g: Graphics, cx: number, cy: number, info: KeepYardBuildingInfo, kit: CultureKit, phase: number)`:
  - Renders isometric annexes or timber scaffolding at appropriate slot offsets:
    - `south`: `cx - 11.5, cy + 2.8`
    - `east`: `cx + 11.5, cy + 2.8`
    - `west`: `cx - 11.5, cy - 3.8`
    - `north`: `cx + 11.5, cy - 3.8`
  - Unfinished: timber standards, ledger beams, diagonal X-braces, work platform, hoist with suspended block.
  - Finished: plinth, sunlit/shaded isometric facets, gabled roof / military parapet, warm hearth glow (`0xfef08a`), courtyard cargo props.
- `drawMiniatureKeep`:
  - Accepts optional `options?: MiniatureKeepOptions`.
  - Splits yard into `rearAnnexes` (`west`, `north`) and `frontAnnexes` (`south`, `east`).
  - Paints rear annexes before keep body and front annexes after keep body.
- `paintBoardProvinces`:
  - Passes `{ state }` to `drawMiniatureKeep` for player home province.
- `packages/app/src/OverworldAtlas.tsx`:
  - Added `MiniYardBuilding` and updated `MiniKeep` to render SVG annexes and scaffolding in rear/front depth.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-28 — render / hold gatehouse open vs shut doors (bakeoff/gemini-gate)

- `isWallRingClosed(state?: GameState | null, realmId = "player"): boolean`:
  - Exported from `packages/render/src/buildings.ts` and re-exported by `packages/render/src/index.ts`.
  - Checks `state.flags.isRingClosed` / `state.isRingClosed` flag overrides if present.
  - Calls `sim.hasClosedWallRing(state, realmId)` (or fallback counts on mocks: `>= 8` edge walls and `gateOnRim`).
- `BuildingDrawOptions`:
  - Added optional property `isRingClosed?: boolean`.
- `drawIsometricBuilding`:
  - Evaluates `isRingClosed = Boolean(options?.isRingClosed ?? (options?.state ? isWallRingClosed(options.state) : false))`.
  - In `case "gate"`:
    - Passes `isRingClosed` to `drawGateCulture(..., isWallDamaged, isRingClosed)` for Cedar, Sand, Steppe, and Islands.
    - In Western gate branch: when `isRim && isRingClosed`, renders shut double doors with vertical plank seam, blackened iron hinge straps, rivets, heavy iron drop bar, and lowered portcullis. When `isRim && !isRingClosed`, renders open doorway with inward-swung door leaves against stone jambs, cobblestone threshold pavers, interior amber lantern glow (`0xfbbf24`), and raised portcullis.
- `paintBuildings` in `packages/render/src/index.ts`:
  - Computes `const isRingClosed = isWallRingClosed(state);` and passes it in `buildingOptions`.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-28 — render / damaged rim wall scars & missing merlons (bakeoff/gemini-wall-scar)

- `getWallHpStatus(state?: GameState | null)` & `isWallHpLow(state?: GameState | null)`:
  - Exported from `packages/render/src/buildings.ts` and `packages/render/src/index.ts`.
  - Inspects `state.wallHp` (supports number or `{ cur, max }` object), `state.wall_hp`, or `state.flags.wallHp` / `wall_hp` / `wallHpCur` / `wall_hp_cur`.
  - If `wallHp` is not found, returns `{ hasWallHp: false, cur: 100, max: 100, ratio: 1.0, isLow: false }`.
  - Determines nominal baseline (~96–146) from active rim walls / gates or explicit `maxHp`.
  - Threshold: `isLow = cur <= 0 || ratio < 0.60`.
- `drawCurtainSpan`:
  - Added `isDamaged: boolean = false, gx: number = 0, gy: number = 0`.
  - When `isDamaged`: renders deep dark fissure lines (`colors.arrowSlitCol`) down curtain face, branch stress cracks, sunlit coping catch edges (`colors.merlonCopingCol`), and fallen stone chips at plinth base.
  - Parapet crenellation merlons: deterministic PRNG based on `(gx * 17 + gy * 31 + i * 13)`. If `rand < 0.45`, merlon is missing (crumbled mortar stump at lip); if `0.45 <= rand < 0.70`, merlon is chipped to partial height; otherwise intact.
- `drawRimWallCurtain` & `drawGatehouseCurtainWings`:
  - Added `isDamaged: boolean = false`.
  - Corner bastions: shears front center merlon to mortar stump, chips left merlon, and draws vertical stress crack down the tower face with plinth rubble.
  - Pilaster buttresses: draws diagonal stress fracture across pilaster body.
  - Terminating / starting spans and gatehouse curtain wings pass `isDamaged` into `drawCurtainSpan`.
- `drawIsometricBuilding`:
  - Added optional 11th parameter `options?: BuildingDrawOptions` (`{ isWallLow?, isDamaged?, wallHpRatio?, state? }`).
  - Automatically computes `isWallDamaged` and passes to `drawRimWallCurtain` and `drawGateCulture` / `drawGatehouseCurtainWings`.
- `paintBuildings` in `packages/render/src/index.ts`:
  - Queries `getWallHpStatus(state)` once per pass and feeds `buildingOptions` to `drawIsometricBuilding`.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-28 — board / camps and outposts tent + flag (bakeoff/gemini-camps)

- `drawCampTentAndFlag(g, cx, cy, kit, cult, phase, isPlayer, options)` & `drawPlayerCampTentAndFlag(g, cx, cy, kit, cult, phase, options)`:
  - Tabletop board encampment renderer in `packages/render/src/tokens.ts`.
  - Dual ground contact shadows under tent footprint and flagpole base.
  - Left and right guy ropes with timber pegs (`0x78350f`) anchored into the turf.
  - Pitched pavilion ridge tent (or steppe felt yurt) with shaded/sunlit dual faces, apex ridgepole, faction valance trim, arched entrance flap, and warm multi-ring amber/white lantern glow (`0xf59e0b`, `0xfef08a`, `0xffffff`).
  - Elevated hardwood flagpole (`cx + 5.5`, from `cy + 5.5` to `cy - 15`) with iron base bracket, finial sphere (and culture plumes: cedar, steppe, islands), and animated waving swallowtail banner with chevron charge.
- `paintBoardProvinces`:
  - `case "camp":` calls `drawCampTentAndFlag(g, cx, cy, "western", undefined, phase, false, { flagColor: campPal?.pennantColor })` for non-player camps, replacing the old red triangle.
  - Player outposts (`p.occupantRealmId === "player"` and `!isHome`) call `drawPlayerCampTentAndFlag(g, cx, cy, kit, cult, phase, { node: p.node, flagColor: playerTabardCol })` when `!garrison.posted`, replacing the bare marker stake with the clear tent + flag.
- `OverworldAtlas.tsx`:
  - Adds `<MiniCamp cx={cx} cy={cy} isPlayer={...} flagColor={...} />` SVG component with `style={{ pointerEvents: "none" }}`.
  - Rendered on diamond for `p.node === "camp"` or `(occupant === "player" && p.id !== homeId)`.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-28 — board / node-piles on diamond (bakeoff/gemini-node-piles)

- `getNodeStockInfo`: Returns `{ stock, max, ratio, hasStock: stock > 0 }`. Detects whether a province has remaining node stock or is depleted/empty.
- `drawResourceNode`: Station landmark rendered on left (`cx - 5`), small stock pile drawn on right of the diamond (`cx + 5, cy + 1`) ONLY when `hasStock && ratio > 0`. Empty nodes (`stock <= 0`) draw only the station landmark, keeping the empty node as it is without a pile.
- `drawNodeStockPile`: Removed red flashing dot on depleted state; empty nodes retain clean ground footprint when inspected or drawn directly.
- `OverworldAtlas.tsx`: Renders `<MiniLogs>`, `<MiniSacks>`, and `<MiniBlocks>` SVG components directly on the diamond for provinces with positive stock (`nodeStock(state, p.id) > 0`). Empty or non-gather nodes remain as standard circular markers.
- Invariants: Sim and server unchanged (`git diff main -- packages/sim server` strictly empty). Hit-test and camera math (`camera.ts`) 100% untouched. Zero `<<<<<<<` conflict markers.

## 2026-09-28 — hud-ledger / quill-pip & ledger cards (bakeoff/gemini-ledger)

- `QuillPip.tsx`: 16–20px vector pip (`size = 18`, `viewBox="0 0 20 20"`). Renders detailed feather quill (rachis spine, barb notches, calamus shaft, nib point, split line) and faceted stone inkpot with liquid ink and droplet.
- Dynamic ink coloring via `resolveInkColors(kind)`: maps `"war"`/`"defeat"` to `#dc2626`, `"victory"`/`"truce"` to `#d97706`, `"marshal"` to `#6366f1`, and default chronicle entries to `#0284c7`.
- Strict invariant: `pointer-events: none` on wrapper `span`, `<svg>`, and nested elements.
- `LedgerCard.tsx`: Dedicated card component in `packages/app/src/hud/`, mounted by `LedgerPanel.tsx`.
- Styles strictly in `packages/app/src/hud/ledger-card.css`. `theme.css` was NOT edited.
- Invariants: Sim unchanged; `listLedger` used as-is. Zero `<<<<<<<` conflict markers.

## 2026-09-28 — hud-ledger / ledger cards

- `LedgerPanel.tsx`: list is `ul.sc-ledger-card-list` of `li.sc-ledger-card` with `.sc-ledger-card-time` and `.sc-ledger-card-text`; empty state `.sc-ledger-card-empty`.
- Class prefix is `sc-ledger-card-*` because `sc-ledger-cell/name/tag/amount/cap/rate` already belong to the resource HUD in `theme.css` / `resource-pip.css`.
- `listLedger` output and keys used as-is. Styles in `packages/app/src/hud/ledger-card.css`, imported from `LedgerPanel.tsx`; uses `--chrome-btn-*` tokens.

## 2026-09-27 — board / select-rim & ground-ring

- `paintBoardSelectionRim(g, bx, by, state, phase)`: Renders clearer gold rim and ground ring on board provinces:
  - Tabletop Ground Ring: At ground level `wy`, draws multi-layered gold diamond (`0xfacc15`, `0xb45309`, `0xfef08a`) with 4 cardinal corner bracket studs (`1.8px`).
  - Vertical Cliff Struts: For elevated tiles (`elev > 0`), corner cliff struts descend from `cy` to `wy` with bottom front rim.
  - Radiant Top Rim: Surrounds the top plateau at `cy` with a double gold rim (`2.2px` `0xfacc15`, `3px` `0xd97706`), sunlit facet glint, and 4 corner diamond bracket glints.
  - Subtle breathing animation pulse modulated with `phase`.
- Dedicated `boardSelectionLayer` in `boardContainer`: Placed above `boardProvincesLayer` and below routes/pawns.
- `MapRenderer`: Exposes `setSelectedProvince(provinceId: string | null)` and `getSelectedProvince()`. Synchronized via `useGameEngine.ts` `useEffect` on `selectedProvinceId` and passed in `sync(s, selectedId)`.
- `OverworldAtlas.tsx`: Renders `.sc-atlas-select-rim` with base ground ring at `cy + lift`, top gold rim, and corner bracket studs (`pointerEvents="none"`).
- Invariants: Hit-test math (`hitTestProvince` in `camera.ts`) and camera geometry (`boardGridToWorld`, `boardWorldToGrid`, `bandForZoom`, `ZOOM_THRESHOLD`) remain 100% untouched. Sim and server remain completely unchanged.

## 2026-09-27 — hud-events / omen-pip

- `OmenPip.tsx`: 24px omen pip (`size = 24`, `viewBox="0 0 24 24"`) with three medieval portent variants: `comet`, `raven`, `harvest`.
  - `comet`: layered blazing fire trails (`#ea580c`, `#f97316`, `#facc15`, `#fef08a`), drifting astral dust embers, hot core nucleus, and star cross glint.
  - `raven`: perched raven silhouette (`#0f172a`, `#1e293b`), sharp beak, piercing glowing eye (`#38bdf8`), and crest glint on a twilight perch.
  - `harvest`: bound golden wheat sheaf (`#ca8a04`), crimson tie ribbon (`#b91c1c`), alternating ripe grains (`#fde047`, `#facc15`), awn whiskers, and solar sparkle.
  - `resolveOmenVariant(eventId?: string, text?: string)` helper categorizes sim events (harvest/timber -> harvest, spoil/levy -> raven, tribute/celestial -> comet).
  - Wrapper (`.sc-omen-pip-wrapper`), SVG, and all child paths unconditionally enforce `pointer-events: none !important;` so that card clicks and choice buttons are never intercepted.
- `EventCard.tsx`: Mounts `OmenPip` at `size={24}` inside `.sc-event-title-group`. Displays event title, body text (parsed via `splitEventText`), tick badge (`tX`), and optional interactive choice buttons.
- Invariants: Sim unchanged; `WorldEvent`, `formatLetterSuffix`, and `miraRemark` used as-is. Styles isolated entirely to `packages/app/src/hud/event-card.css`; `theme.css` was NOT edited. Zero `<<<<<<<` conflict markers.

## 2026-09-27 — hud-quests / scroll-pip

- `ScrollPip.tsx`: 24px parchment mandate scroll pip (`size = 24`, `viewBox="0 0 24 24"`). Displays unrolled parchment sheet, wooden roller rod curls, sepia script lines, and a wax signet seal.
  - When `status === "ready"`: the pip is LIT! Applies radiant golden vellum (`#fffbeb`, `#fbbf24`), four-pointed star glint on the roller apex, amber signet sparkle, and gentle flame glow flicker (`@keyframes sc-scroll-lit-flame`).
  - When `status === "open"`: displays warm antique vellum (`#fef3c7`).
  - When `status === "claimed"`: displays archived silver-grey vellum (`#e2e8f0`).
  - Wrapper (`.sc-scroll-pip-wrapper`), SVG, and all child paths unconditionally enforce `pointer-events: none !important;` so that Claim buttons and card clicks are never intercepted.
- `QuestCard.tsx`: Mounts `ScrollPip` at `size={24}` inside `.sc-quest-title-group`. Displays hint, 0/1 progress bar, and a Claim button when complete and ready.
- Invariants: Sim unchanged; `listQuests` and `tryClaimQuest` used as-is. Styles isolated entirely to `packages/app/src/hud/quest-card.css`; `theme.css` was NOT edited. Zero conflict markers.

## 2026-09-27 — hud-diplo / realm-crest-pip

- `RealmCrestPip.tsx`: 28px realm crest pip integrating the existing heraldic `Crest` (`size = 28`, `width: 28px; height: 28px;`).
  - When `isColder` or `stance === "hostile" || stance === "war"`: the crest is colder, applying `saturate(0.5) hue-rotate(185deg) brightness(0.9)` with an icy cyan drop-shadow (`rgba(56, 189, 248, 0.75)`) and a subtle frost contour overlay (`.sc-realm-crest-frost`).
  - Peaceful / neutral stances show warm heraldic tones (emerald radiance for friendly, azure for truce, warm amber for wary).
  - Wrapper (`.sc-realm-crest-wrapper`), SVG, and all child paths unconditionally enforce `pointer-events: none !important;` so that Declare war and Gift gold buttons never get intercepted.
- `RealmCard.tsx`: Mounts `RealmCrestPip` at `size={28}` inside `.sc-realm-dip-title-group`. Displays stance badge (with truce countdown), opinion line (reads `opinionOfPlayerFromRealm`), and power comparison with favored/unfavored coloring.
- Invariants: Sim unchanged; `opinionOfPlayerFromRealm`, `peaceTicksRemaining`, `realmPower`, and `tryDeclareWar` used as-is. `git diff main -- packages/sim server` strictly empty.

## 2026-09-27 — hud-decrees / wax-seal-pip

- `WaxSealPip.tsx`: 24px stamped wax-seal pip (`size = 24`, `viewBox="0 0 24 24"`). Displays scalloped matrix pool, hanging ribbon tails, and stamped royal crown matrix sigil (with specialized emblems for "muster", "rite", "envoys" or default royal coronet).
  - When `active === true`, the seal is lit: applies warm molten gold tones (`#d97706`, `#f59e0b`, `#fbbf24`), four-pointed star glint on the crown peak, and living flame flicker (`@keyframes sc-wax-flame`).
  - When dormant, renders deep crimson pressed wax (`#991b1b` / `#7f1d1d`).
  - Wrapper (`.sc-wax-seal-pip-wrapper`), SVG, and all child paths unconditionally enforce `pointer-events: none !important;` so that card clicks and Issue actions are never obstructed.
- `DecreeCard.tsx`: Mounts `WaxSealPip` at `size={24}` within `.sc-decree-title-group`. Displays cost row using 16px `ResourcePip`s (`.sc-pip.sc-decree-pip`), active countdown (`Math.ceil(left / 10)}s left`), and Issue button ("Already active" when in effect).
- Invariants: Sim unchanged; `DECREES`, `tryDecree`, `decreeUntil`, and `decreeActive` used as-is. `git diff main -- packages/sim server` must be 100% empty.

## 2026-09-27 — hud-battle / clash-pip

- `ClashPip.tsx`: 28px clash pip renders `crossed_blades` (victory or general clash) or `broken_shield` (defeat when `story.loserId === "player"`). All wrappers, SVGs, and paths strictly enforce `pointer-events: none !important;` so that card clicks and details expansion never get blocked.
- `BattleCard.tsx`: Integrates `ClashPip` at `size={28}` in `.sc-battle-title-group`. Displays verdict (Victory, Defeat, or rival winner), field combat report, Butcher's bill phase when present, and folds detailed blow-by-blow events inside `<details>`.
- Invariants: Sim unchanged; `writeLastBattle` and `LastBattleStory` shape completely untouched.

## 2026-09-27 — hud-market / offer cards

- `OfferCard.tsx` renders from the `TradeOffer` shape (`give` / `get` records); `label` is no longer shown. Adding an offer to `MARKET_OFFERS` needs no UI change.
- Enabled state is `canTrade(state, id)` only, so UI and sim agree. The red "short" hint is display-only (Number compare), never gates the button.
- Reuses `ResourcePip` at 18px via `.sc-pip.sc-offer-pip`; non-pip resources fall back to text.

## 2026-09-24 — war-chips / force-cards

- `WarChip.tsx`: 24px tactical war chips (warband, cloak, cart, tent) must unconditionally enforce `pointer-events: none !important;` in SVG styles, wrapper elements (`.sc-war-chip-wrapper`), and CSS so that Sally, Recall, and atlas interaction clicks are never intercepted.
- `ForceCard.tsx`: Military force cards (`.sc-force-card`) mount `WarChip` inside `.sc-force-title-group`. Formats ETA as `"posted"` if ticks/seconds undefined, or `${seconds}s` if moving, matching existing time display conventions.
- Glow filters: `.sc-war-chip-warband` / `.sc-war-chip-hostile` applies red drop shadow (`rgba(239, 68, 68, 0.7)`), `.sc-war-chip-cloak` / `.sc-war-chip-scout` applies cyan drop shadow, `.sc-war-chip-cart` / `.sc-war-chip-gather` applies amber drop shadow, and `.sc-war-chip-tent` / `.sc-war-chip-garrison` applies emerald green drop shadow.

## 2026-09-24 — people-cards / walker role pips

- `WalkerPip.tsx`: 24px walker role pips (hoe, axe, pick, coin) must unconditionally set `pointer-events: none !important;` in SVG styles, wrapper styles, and CSS to guarantee worker assignment selects and "Idle" buttons on `JobCard` receive clicks without obstruction.
- Two-frame walking animation runs on CSS keyframes (`steps(1)`) cycling `.sc-walker-f0` and `.sc-walker-f1` over 0.7s, avoiding React re-render thrashing.
- Sitting idle pose (`.is-sitting`) displays `.sc-walker-sit` and hides walking frames, giving unassigned villagers a calm resting appearance on hay bales, pine logs, or ashlar blocks.

## 2026-09-24 — army-cards / culture-kit chips

- `UnitCard.tsx`: All culture-kit unit art and `.sc-unit-art-wrapper` elements unconditionally set `pointer-events: none !important;` so that training buttons, hover tooltips, and click events are never blocked by SVG art.
- Locked unit cards apply `.is-locked` with `filter: grayscale(1)`, `opacity: 0.55`, and disabled button state (`disabled={!open || !affordable}`), while still allowing hover inspection of lock requirements.

## 2026-09-24 — hud-works / hall-chips

- `HallChip.tsx`: Isometric 24px building chips must unconditionally set `pointer-events: none !important;` in SVG styles, wrapper styles, and CSS to guarantee Demolish and Repair buttons on `WorkCard` receive clicks without obstruction.
- `isScarred(b)`: Distinguishes siege scars from freshly queued building scaffolding. Fresh builds finish at `meta.tick + def.buildTicks`, whereas siege damage sets `completesAtTick` to `blowTick + 40`.

## 2026-09-24 — resource-strip / pips

- Resource pips (`ResourcePip.tsx`): All pips and container wrappers unconditionally set `pointer-events: none !important;` so that parent cell hover/tooltip (`title`) and click events are never intercepted.
- Discrete 3-frame looping uses CSS stepped keyframes (`step-end`) on `<g className="sc-pip-f0|1|2">`, avoiding React render thrashing.
- Empty food detection in the HUD uses `isFoodStoresEmptyOrLow(state)` from `@second-crown/render`, matching the exact logic that slumps militia meeples on the hold.
- Full store detection uses `line?.full` from `resourceLedger(state, r)`, switching the pip to `variant="stacked"` with `@keyframes sc-pip-stacked-glow`.

## 2026-09-24 — hud-chrome

- Chrome palette lives on `<html data-chrome>`, separate from the body `theme-<tab>` classes and the season/holiday packs. Add new chrome colors as `--chrome-*` vars in all three blocks of `theme.css`.
- The global `button` rule is element-only on purpose: any class or inline style overrides it. Inline `background` also overrides the disabled background, but the opacity still applies.
- Atlas drag only calls `setPointerCapture` after 6px of travel. Capturing on pointerdown would retarget the click to the `<svg>` and break province selection.
- Atlas SVG has `touch-action: none`, so on phones a swipe over the atlas pans it instead of scrolling the page.
- localStorage keys: `sc-chrome` (palette) is not `sc-chrome-open` (tools drawer).

## 2026-09-24

- Inhabited HUD overlays (`InhabitedOverlay`, `@keyframes sc-candle-flicker` pseudo-elements) must unconditionally set `pointer-events: none` and leave interior controls at `z-index: 1` or higher so mouse hit-testing and drag events are never blocked.
- Do not restyle global `input` or `select` elements to white or bright colors; preserve the dark HUD aesthetic.
- Docs audit branch adds ROADMAP, refreshes PROGRESS/HANDOFF/USER-NOTES, seeds `docs/obsidian/`.
- CHANGELOG still has old Gemini entries with stray `+` prefixes from conflicted merges. Do not spend a wave deleting history; prepend clean entries.
- Gemini + Claude both editing the four docs = rebase conflict every pair. Prefer Gemini skip docs or only touch USER-NOTES flavor.
- `tryTreatWounded` does not require an Infirmary building (tests cover treat without one). UI still tells you to raise a hall so beds exist.
- `trainCostMultiplier()` without `typeId` is barracks+global only. Stables/range/workshop apply only when `typeId` is passed.
- Repair button label "8 stone" is hardcoded in the app; cost lives in `ward.ts` `REPAIR_STONE`.
- Watchtowers: `rimWatchtowers` is rim-only. `visionRange` counts rim towers twice plus other finished towers plus survey research.
