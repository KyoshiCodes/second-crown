# Walkthrough — Gemini Academy, Siege Workshop Polish, Research Lectern & Outpost Flags (`bakeoff/gemini-academy`)

## What changed

1. **Distinct Isometric Academy (`packages/render/src/index.ts`)**:
   - Implemented dedicated `case "academy":` in `drawIsometricBuilding`:
     - **Collegiate Ashlar Facade**: Flared ashlar foundation plinth (`0x475569` / `0x334155`), warm limestone sunlit and shaded walls (`0xf1f5f9` / `0x94a3b8`), buttress pilasters, and horizontal carved stringcourse.
     - **Arched Cloister Arcade**: Vaulted interior portal (`0x0f172a`), twin marble columns with capitals, classical triangular pediment, and stone entrance steps.
     - **Gothic Library Casement Windows**: Deep arched windows glowing with warm honey candlelight (`0xfef08a` / `0xfde047`) and diamond mullion grates with subtle animated candle flicker.
     - **Sapphire Slate Roof & Cupola**: Regal sapphire hipped slate roof (`0x1e3a8a`), gilded roof ridge coping, elevated stone observatory cupola with aged verdigris copper dome (`0x0f766e`), and fluttering blue/gold scholar gonfalon (`0x2563eb`).
     - **Rotating Armillary Astrolabe**: Spindle with central brass globe and rotating celestial armillary rings (`Math.sin(phase * 2.8)`).
     - **Forecourt Scholarly Vignette**: Stone reading lectern with an open illuminated leather-bound folio (`0xfef3c7` parchment with script markings), brass celestial globe on tripod stand, and manuscript scroll bins.
     - **Dynamic Scaling & Holidays**: Level boost pips and holiday dressing support.

2. **Polished Siege Workshop (`packages/render/src/index.ts`)**:
   - Replaced generic flat polygon box with a heavy ordnance yard and master engineer's forge:
     - **Workshop Framing**: Heavy oak posts with iron joint bands, rafter canopy, and timber gantry crane derrick with pulley wheel and hoist rope.
     - **Master Engineer's Drafting Desk**: Sheltered workbench with blue vellum blueprint draft (`0x0284c7`) and brass calipers.
     - **Assembled Heavy Trebuchet**: Wheeled carriage frame on four spoked wooden wheels with iron rims, cross-braced A-frame trestles, bronze pivot axle, heavy tapered oak throwing arm angled into the sky, iron-riveted counterweight box with steel rivets, and sling release hook.
     - **Ordnance Supplies**: Chained pyramid of carved granite siege boulders, smoldering ordnance forge hearth with flickering orange/yellow hot coals, iron anvil, and ball-peen hammer.

3. **Scriptorium Lectern / Study Card (`packages/app/src/ResearchBar.tsx` & `theme.css`)**:
   - Replaced two raw `<button>`s with an illuminated medieval study card (`sc-realm-card sc-research-lectern`).
   - **Dynamic Cost Reading**: Extracts resource costs directly from `@second-crown/sim`'s exported `RESEARCH[id].cost`, displaying resource chips with affordability indicators (`canAfford`).
   - **Building Prerequisites**: Displays required building from `RESEARCH[id].needs` (Barracks or Academy for Horse lore; Siege Workshop for Siege craft) with status checks.
   - **Unlocks Display**: Features miniature pixel walker silhouettes from `UnitIcon` next to unit unlock tags (Cavalry & Knight for horse; Siege Engine for siege).
   - **State Handling**:
     - *Mastered*: Golden seal badge (`✓ Mastered · Ready to train`).
     - *Studying*: Active progress bar with percentage and remaining time countdown (`${Math.ceil(left / 10)}s remaining`).
     - *Available*: Action button with clear tooltip and disabled hints if missing resources, building, or if study slot is busy.

4. **Board Outpost / Flag Token on Field Tiles (`packages/render/src/index.ts`)**:
   - Updated `paintBoardProvinces` special realm occupant overlays:
     - `p.id === state.board.homeProvinceId` preserves the grand Player Home Hold gilded royal frame, golden crown emblem, and golden halo pulse.
     - `p.occupantRealmId === "player" && p.id !== state.board.homeProvinceId` (player-occupied field tiles / outposts) renders a dedicated **Outpost / Flag Token**:
       - Royal blue & gold border trim (`0x2563eb` / `0xfacc15`) with 4 brass corner pins.
       - Stone cairn base anchoring a tall wooden flagpole with brass ball finial.
       - Waving royal player swallowtail standard (`0x1e40af` with gold heraldic insignia, animated wind wave).
       - Field bivouac supply cache / tent and bottom "OUTPOST" plaque.

5. **Gather Expedition Pawn Stub (`packages/render/src/index.ts`)**:
   - Implemented `listGathersPresentation` and `paintBoardGathers`:
     - Safely checks for gather expeditions without modifying sim.
     - Stubs route trails and pack-cart gatherer pawns when gathers are present, gracefully skipping when Astra's lane is unmerged.
   - Exported pure helpers `isOutpostProvince` and `listGathersPresentation`.

6. **Automated Unit Tests (`packages/render/src/index.test.ts`)**:
   - Added unit test suite covering `isOutpostProvince` (distinguishing home hold from outposts across player, rival, and unowned tiles).
   - Added unit test suite covering `listGathersPresentation` stubbing behavior.

## Sim & Server Purity

- `git diff main -- packages/sim server` is strictly empty.
- No combat formulas, tick rates, or server routes modified.
- All existing features preserved: zoom/pan, inspect/scout, holidays, dim lanterns, pixel army icons.

## Verification

- `npm test`: 93/93 sim tests pass.
- `npm run test -w @second-crown/render`: 20/20 render tests pass (18 existing + 2 new).
- `npm run build -w @second-crown/app`: `tsc -b && vite build` passes cleanly.
- `git diff main -- packages/sim server`: verified 100% empty.
