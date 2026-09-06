# HANDOFF

Last updated: 2026-09-06 | playtest-0.8 | Gemini seasons & war strip branch `bakeoff/gemini-seasons`.

Live: https://129.153.17.72.sslip.io/

Current branch: `bakeoff/gemini-seasons` (PR into main).
Features delivered:
- Halloween-class board dressing across all holidays and seasons in `packages/render`:
  - Rich procedural ground scatter: Midwinter snowdrifts, pine boughs with holly, frost crystals; Easter painted eggs, wildflowers, fluttering pale ribbons; Harvest wheat sheaves with twine, pumpkins, apple bushels; Midsummer sunflowers, solstice flower crowns, chamomile; lighter seasonal variants for Spring, Summer, Autumn, Winter; Halloween preserved as-is.
  - Building dressings & light sources: Midwinter snow roofs with hanging icicles, pine wreaths with red bows, warm candlelit windows with golden halos, brass lanterns; Easter climbing flower vines, fluttering pastel ribbons, dawn lamps with golden-lilac halos; Harvest golden wheat bundles, amber oil lamps with deep flickering amber halos, cider barrels; Midsummer standing solstice brazier with dancing bonfire flames and expansive firelight halo, long light sunset highlights and marigold garlands; lighter seasonal dressings for off-holiday seasons.
  - Light fog / weather on the iso map: Multi-palette drifting fog banks in `fogLayer` (frosty winter vapor, soft dawn mist, golden harvest haze, warm midsummer shimmer; Halloween preserved as-is).
- WarLivingStrip overhaul in `packages/app`:
  - No overlapping labels or portraits; clear vertical hierarchy and padding.
  - Real unit type names (Militia, Spearman, Champion, etc.) and counts only.
  - Removed all leftover debug labels (no Suki, no Stone Frontier Marker, no duplicate Cohorts).
  - Two distinct sides: player left, foe right, with directional marching standard bearers and real enemy units.
  - Crisp and fully legible at 1280px wide.
- Preserved ChromeDock, zoom/pan, tile clicks, recorded audio loops (`/audio/*.ogg`), and strict zero diff against `main` for `packages/sim` and `server`.

Deploy: cd ~/second-crown && git pull && npm test && npm run build -w @second-crown/app && pm2 restart sc-cloud
