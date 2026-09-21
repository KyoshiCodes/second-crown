# Second Crown — what exists now

Play: https://129.153.17.72.sslip.io/
Updated: 2026-09-21

This is the living player note. Older bakeoff logs stay in CHANGELOG.md.

## How to play in one page

1. Pick a Crown style on the Crown tab (Western, Cedar, Sand, Steppe, Islands).
2. Build on the hold (zoom in). Walls and the gate only go on the rim.
3. Zoom out to the board. Scout fog tiles, gather nodes, plant flags, garrison them.
4. Staff citizens on work tiles. Cluster same buildings. Pair farms with granaries. Park producers on the Keep edge. Put Barracks on the Keep edge to train cheaper.
5. Train through the queue. Research at the Academy. Treat wounded at the Infirmary.
6. Discord login and cloud save are live. Guest recovery codes keep a slot.

## From zero to now (meaningful beats)

- Deterministic idle sim: TypeScript monorepo, 10 Hz ticks, break_infinity numbers, offline catch-up, GitHub Pages then Oracle + Caddy HTTPS + Discord OAuth.
- Hold + board camera: 16×10 isometric turf, 12×8 province board, zoom/pan, hardwood rim, holiday dressings, recorded holiday audio.
- War and map: marches, camps, node stock, gather carts, garrisons, incoming warnings, rim walls, siege HP, scouts, fog, NPC crowns that claim and fight.
- Economy: warehouse caps, slower raids, academy research, training queues, timed upgrades, labor from posted workers, adjacency / pair / keep-yard bonuses.
- Cultures: five kits with distinct buildings, walkers, and unit silhouettes.
- Cloud testers: HTTPS at the sslip.io host, Discord sign-in, autosave.

## Ascent plan (Lords Mobile / Rise of Kingdoms depth)

See `docs/ASCENT.md`.

- **R1 shipped:** every unit now has attack, defense, hp, speed, role, and tier. Line > shock > ranged > line is data only. Fights still use the old power roll until R3.
- **Next:** R2 harness (1,000 seeded fights), then R3 round/morale resolver behind the same `resolveBattle` name.
