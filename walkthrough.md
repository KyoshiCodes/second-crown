# Walkthrough — Gemini Pixel Army Tab & Board Marching Columns (`bakeoff/gemini-army`)

## What changed

1. **Pixel Silhouettes for Unit Icons (`packages/app/src/UnitIcon.tsx`)**:
   - Replaced flat geometric chip portraits with authentic integer-pixel silhouettes in SVG, designed in the exact artistic language of hold walkers, keeps, and fortifications (`shapeRendering: "crispEdges"`).
   - Built-in 2–3 frame marching/idle cadence (`0 -> 1 -> 0 -> 2` via `useUnitCadence`), directional facing (`facing = 1 | -1`), and faction tabard colors.
   - Distinct weapons and gear for all 8 unit types:
     - **Militia**: Spear-less peasant levy in homespun coarse wool (`#854d0e`), rope belt (`#a16207`), cloth coif (`#52525b`), unarmed/cudgel posture.
     - **Spearman**: Steel kettle hat (`#94a3b8` / `#cbd5e1`), royal blue tabard (`#1e40af`), long ash spear with pointed steel spearhead (`#f1f5f9`), and round boss shield (`#1e3a8a` / `#facc15`).
     - **Skirmisher**: Scout green coat (`#15803d`), leather coif (`#5c3818`), throwing javelins with steel barbs (`#cbd5e1`), and arm buckler.
     - **Archer**: Deep forest coat (`#14532d`), feathered cap with quill (`#facc15`), recurve yew longbow (`#854d0e`), taut bowstring, nocked arrow, and back quiver.
     - **Cavalry**: Warhorse mount (`#6b3a19`) with animated galloping legs, leather saddle, reins, and mounted armored lancer with royal blue tunic, steel helm, and pennant.
     - **Knight**: Full steel plate harness (`#cbd5e1`), great helm with visor eye-slit (`#0f172a`), heraldic crimson heater shield (`#b91c1c`) with golden cross (`#facc15`), steel broadsword, and red mantle.
     - **Siege Engine**: Sturdy timber carriage (`#5c3818`), spoked wooden wheels with iron rims, upright A-frame trestle, and throwing beam with counterweight bucket and granite boulder.
     - **Champion**: Radiant gilded plate (`#f59e0b`), winged royal crown helm (`#fde047`), Tyrian purple tabard (`#581c87`), glowing runic broadsword (`#38bdf8`), and flowing crimson cape.

2. **Army Tab Roster & Visuals (`packages/app`)**:
   - `ArmyTab.tsx`: Redesigned the recruitment roster from plain text buttons into rich medieval cards with animated pixel silhouettes, power ratings, training resource costs, and role blurbs. Added dedicated Champion recruitment card with gilded silhouette, custom name input, and hire actions.
   - `ArmyVisual.tsx`: Raised companies in "Your Host" display company commander portraits alongside animated squad formations marching in 2–3 frame cadence with staggered offsets.
   - `ProvinceInspect.tsx`: March column composer displays mini unit pixel icons beside each unit type row.

3. **Board Meeple Reuse for Player Columns (`packages/render`)**:
   - `primaryUnitTypeForMarch(march)`: Pure reader helper exported from `@second-crown/render` resolving the primary unit type for any column based on `march.force` counts and tier priority (champion > siege > knight > cavalry > archer > skirmisher > spearman > militia).
   - `unitPalette(typeId)`: Pure palette/gear configuration helper exported from `@second-crown/render` mapping unit types to matching tabard, armor, weapon, and equipment attributes.
   - `paintBoardMarches`: Marching columns on the regional tabletop board (`zoom <= 0.70`) now reuse the exact same sprites, colors, weapons, and 2–3 frame stride cadence as the Army tab. An archer column looks like an archer on the march; a knight column marches with great helm and heater shield; cavalry trots on a warhorse mount; siege engines roll on spoked wheels.
   - Tabletop hardwood pedestal base, ground shadow, amber route trail, and floating ETA pill badge are fully preserved.
   - Hostile marches strictly preserve their menacing red/iron war meeple with horned helm and glowing crimson visor.

4. **Invariants & Preservations**:
   - `git diff main -- packages/sim server` is 100% empty. No combat math, march formulas, or server endpoints touched.
   - ChromeDock, holidays, dim lanterns, inspect card, primer, and zoom/pan completely preserved.

## Where

- `packages/render/src/index.ts`:
  - Added `primaryUnitTypeForMarch`, `unitPalette`, and `UnitVisualPalette`.
  - Updated `paintBoardMarches` to render player columns with unit-specific animated meeples.
- `packages/render/src/index.test.ts`:
  - Added unit test suite for `primaryUnitTypeForMarch` and `unitPalette`.
- `packages/app/src/UnitIcon.tsx`:
  - Completely rewritten to render authentic integer-pixel SVG silhouettes with 2–3 frame cadence, facing, tabard colors, and weapons.
- `packages/app/src/tabs/ArmyTab.tsx`:
  - Redesigned unit roster and champion cards using `UnitIcon`.
- `packages/app/src/ArmyVisual.tsx`:
  - Display raised companies and squad march formations with `UnitIcon`.
- `packages/app/src/ProvinceInspect.tsx`:
  - Added unit icons to column composition rows.
- Documentation cadence:
  - `docs/HANDOFF.md`, `docs/CHANGELOG.md`, `docs/USER-NOTES.md`, `docs/DEV-NOTES.md`, `walkthrough.md`.

## Verification

- `npm test`: 90/90 sim tests pass.
- `npm run test -w @second-crown/render`: 18/18 render tests pass (14 existing + 4 new).
- `npm run build -w @second-crown/app`: `tsc -b && vite build` passes cleanly.
- `git diff main -- packages/sim server`: verified 100% empty.
