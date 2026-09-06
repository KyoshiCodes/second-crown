# Walkthrough — tabletop board + fort stubs

## Gemini — Seasons & War Strip (bakeoff/gemini-seasons)
- **Halloween-Class Board Dressing across all holidays & seasons (`packages/render`)**:
  - **Ground scatter**: Midwinter snowdrifts, pine sprigs with red holly berries, ice crystals; Easter painted eggs with patterns, wildflowers, fluttering pale ribbons, clover; Harvest golden sheaves with twine, field pumpkins, apple bushels, fallen leaves; Midsummer sunflowers, solstice flower crowns, chamomile, sun-warmed stone; lighter variants for Spring, Summer, Autumn, Winter.
  - **Light sources & building dressings**: Midwinter contoured snow roofs with hanging icicles, pine wreaths with red bows, warm candlelit windows with flickering golden ground halos, doorstep brass lanterns; Easter climbing flower vines, fluttering pastel ribbons, dawn lamps with golden-lilac halos; Harvest golden wheat bundles, amber oil lamps with deep amber flicker and cast halos, cider casks; Midsummer standing iron bonfire brazier with lively dancing flames and expansive firelight halo, long light sunset roofline highlights, marigold garlands; lighter seasonal dressings for off-holiday seasons.
  - **Iso map light fog / weather**: Multi-palette drifting fog banks in `fogLayer` (frosty winter blizzard vapor, soft pastel dawn mist, golden autumn twilight haze, warm sunset shimmer; Halloween preserved as-is).
- **WarLivingStrip overhaul (`packages/app`)**:
  - Fixed label and portrait overlap with clear vertical hierarchy, dedicated icon frames, and padded badges.
  - Real unit type names only (Militia, Spearman, Archer, Champion, etc.) and true counts, cleanly aggregated by unit type.
  - Eliminated all debug labels: no "Suki", no "Stone Frontier Marker", no "duplicate Cohort".
  - Two distinct sides: player host on left with Royal Standard Bearer; enemy vanguard on right facing left with Host Standard Bearer; central active clash or peaceful border demarcation.
  - Fully readable at 1280px wide.
- **Invariants preserved**: `git diff main -- packages/sim server` verified empty. All 57 tests passing.

## Gemini (PR 8)
Isometric tabletop rim, zoom/pan, denser buildings, walker frames, All Hallows fog/lanterns, War living strip, recorded holiday audio. No sim or server edits.

## Claude (PR 9, already on main)
Keep building, defenseBonus when defending, citizen job+tile stubs. No Pixi/theme edits.
