# Progress — Second Crown (audit 2026-09-24)

Idle / kingdom-builder / grand-war. Live: `http://129.153.17.72:8787/` · process `sc-cloud` · repo `KyoshiCodes/second-crown` `main`.

Tests on last merge: **216** sim tests, **80+** render tests, app build clean.

## Eras (beginning → now)

1. **Kernel** — 10 Hz deterministic sim, offline catch-up, IndexedDB + cloud save, Discord login stub, Vite/React/Pixi monorepo.
2. **Hold** — buildings, citizens, labor, housing, keep upgrades, pairs, storage, vault.
3. **Host** — train queue, barracks/stables/range/workshop discounts, marshal, food levy, mercs, champion.
4. **Board war** — marches, column clash (column only, not home army), camps, outposts, hold storm, sally, wounded + infirmary treat.
5. **Map economy** — gathers, node stock, scouts, garrisons, incoming raids.
6. **Crown** — lectern studies, Academy −20% new study time, market stalls, decrees.
7. **Presentation** — isometric 12×8 diamonds, culture kits, walkers, meeples (war/gather/scout/garrison/incoming), walls, towers, scars, tired host.
8. **Coaching UI** — Kingdom/Army/War lines so a beginner can see *why* a number moved.

## What is playable today

Build the hold, staff works, trade at Market, study on Crown, raise companies, march columns, plant flags, garrison, gather nodes, scout fog, treat wounded, sally incoming, close an 8-tile wall ring.

## What is not done

True multiplayer battles, player bazaar/auction, guild rallies, deep research tree, hero gear loop, mobile client. See `docs/ROADMAP.md`.
