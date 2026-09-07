# Walkthrough — Gemini Crowns: Distinct NPC Hold Tokens, Culture Tints & World Log Visibility (`bakeoff/gemini-crowns`)

## What changed

1. **Every NPC Hold is a Distinct Token on the Board (`packages/render`)**:
   - **No second board schema**: Reuses existing `state.board.provinces` and `occupantRealmId`.
   - **`realmTokenPalette(realmId)`**: Exported helper mapping each realm to its canonical heraldic fill, accent, border, and banner colors:
     - `rival` (Iron March): Crimson & blackened steel (`0x7f1d1d` / `0xef4444` / `0x1f2937`). Retains spiked battlements.
     - `k_silk` (Silk Road): Royal amethyst purple & gold (`0x581c87` / `0xfacc15` / `0x7e22ce`).
     - `k_ash` (Ash Kingdom): Smoldering obsidian charcoal & fiery orange (`0x292524` / `0xf97316` / `0x44403c`).
     - `k_veil` (Veil Sanctuary): Mystic deep teal & luminous cyan (`0x0f766e` / `0x22d3ee` / `0x115e59`).
     - `k_glass` (Glass Shore): Shimmering seafoam azure & silver-white (`0x0284c7` / `0xe0f2fe` / `0x0369a1`).
     - `k_frost` (Frost Reaches): Glacial arctic navy & frost ice (`0x1e3a8a` / `0x93c5fd` / `0x1e40af`).
     - `k_tide` (Tide Clans): Deep oceanic aqua & copper sand (`0x0d9488` / `0xfbbf24` / `0x0f766e`).
     - `k_ember` (Ember Wastes): Scorched ember rust & flame amber (`0x9a3412` / `0xfb923c` / `0x7c2d12`).
     - `k_bronze` (Bronze Horn): Antique bronze & burnished gold (`0x78350f` / `0xfcd34d` / `0x451a03`).
     - Custom/future realms resolve deterministically via string hashing.
   - **`paintBoardProvinces` Rendering**:
     - Distinct keep silhouette with ashlar stone walls, corner bartizans, stone plinth, and decorative rivets.
     - Animated fluttering realm swallowtail standard and circular heraldic seal on the plinth.
     - Non-hold occupied tiles render a heraldic claim marker flag.
     - Highlight selection rings (`paintBoardHighlight`) reflect the occupant's accent color.
   - Pure helpers exported: `realmTokenPalette`, `REALM_TOKEN_PALETTES`, `isNpcHoldProvince`.

2. **Player Culture Tinting (`packages/render` & `packages/app`)**:
   - Reads `playerCultureId(state)` and `CULTURES` from `@second-crown/sim`.
   - **Crown Marches (`western`)**: Strictly preserves 100% of the original visual art.
   - **Other Cultures**:
     - `cedar` (Cedar Kin): Evergreen forest green tabards (`#166534`), cedar wood trim (`#78350f`), riverstone gray (`#64748b`).
     - `sand` (Sand Banner): Desert sand tabards (`#b45309`), sunbleached acacia timber (`#92400e`), sandstone gold (`#d97706`).
     - `steppe` (Wind Host): Storm cobalt tabards (`#1e40af`), steppe birch wood (`#713f12`), dark shale slate (`#334155`).
     - `islands` (Tide Clans): Deep sea teal tabards (`#0f766e`), driftwood timber (`#451a03`), coastal shell stone (`#475569`).
   - **Hold Visuals (`packages/render`)**:
     - `drawIsometricBuilding`: In `"keep"`, stone walls, bartizans, foundation plinth, lintels, heraldic shield, and royal banner are tinted by the player's active culture.
     - `drawWalkerFrame`: Villager, miner, and guard tunics, tool handles, spear shafts, and guard pennants receive culture tabard/timber/stone tints.
   - **Unit Icons & Army Tab (`packages/app`)**:
     - `UnitIcon.tsx`: Added `CultureContext`. `UnitIcon` defaults to context culture or optional `culture` prop.
     - All 8 unit classes (`militia`, `spearman`, `skirmisher`, `archer`, `cavalry`, `knight`, `siege`, `champion`) tint their clothing, weapons, and shields according to culture palette when non-western.
     - `AppShell.tsx`: Wrapped all tabs in `<CultureContext.Provider value={state ? playerCultureId(state) : "western"}>`. Choosing a new culture via `CulturePicker` dynamically re-tints Army roster cards and visuals immediately.
     - `WarLivingStrip.tsx`: Passes player culture to player sprites and opponent realm culture (`cultureOfRealm(state, enemyRealmId)`) to opposing sprites.

3. **World Log Visibility (`packages/app`)**:
   - **Crown Chronicle in `WorldTab.tsx`**:
     - Elevated to a prominent position at the top of the World tab.
     - Category filter pills with live counts: `All`, `Claims 🚩`, `Trades ⚖️`, `Wars ⚔️`, and `Musters 🛡️`.
     - Distinct badges for event types (`claim`, `trade`, `declare`, `battle`, `raid`, `levy`, `loot`, `faction`), monospace tick indicators (`T{e.tick}`), and golden highlight on the newest dispatch.
     - Scrollable, compact log container.
     - "Holds on the Board" card displaying realm crest color badges matching board tokens, coordinates, and terrain.
   - **Dock Bar Ticker (`ChromeDock.tsx`)**:
     - `useGameEngine.ts` dispatches a `sc-world-dispatch` window event whenever `state.flags.last_world` changes.
     - `ChromeDock.tsx` listens to `sc-world-dispatch` and renders a live, compact ticker (`📜 WORLD: <dispatch>`) in the header bar.
     - Players can monitor foreign realm expansion, trade caravans, and war declarations from any tab without opening DevTools.

4. **Preservations & Sim Purity**:
   - `git diff main -- packages/sim server` is strictly empty.
   - No combat formulas, tick rates, or server endpoints touched.
   - Fully preserved: zoom/pan, camera bands, inspect/gather, holidays, dim lanterns, ChromeDock tools, and audio manager.

## Verification

- `npm test`: 36 test files, 117 tests pass.
- `npm run test -w @second-crown/render`: 24 tests pass (18 existing + 6 new tests for `realmTokenPalette`, `isNpcHoldProvince`, and `culturePalette`).
- `npm run build -w @second-crown/app`: `tsc -b && vite build` completed cleanly.
- `git diff main -- packages/sim server`: 100% empty.

