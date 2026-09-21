# Lane: Gemini + Claude — Lords Mobile overworld + pixel holds

Branch from current `main`. Do not merge until `npm test` and `npm run build -w @second-crown/app` are green.

## Shared vision

Zoom-out board should read like a 3D kingdom map (raised terrain, hold tokens, marching columns).
Zoom-in hold keeps our pixel buildings, walkers, and unit silhouettes.
Do not replace pixel art with generic 3D city meshes.

## Gemini (packages/render only)

`git diff main -- packages/sim server` must stay empty.

1. Split `packages/render/src/index.ts` into camera / tiles / buildings / tokens files if you touch it.
2. Board-band tiles get a height face (peak/hill/wood/plain/waste/shore).
3. Hold tokens on the board reuse kit keep drawers at miniature scale.
4. Canvas fills the chrome (not a 560px stamp).
5. Fog is a height veil.

## Claude (app chrome + architecture)

Wire `OverworldAtlas` clicks to `selectedProvinceId`.
Keep `toggleCameraBand`.
Do not change TickEngine or `resolveBattle`.

## Already landed on this wave

- Keep charter table includes beds + plots
- `KeepGateCard` on Kingdom
- SVG `OverworldAtlas` on World
- Live canvas also visible on World tab

## Verify

npm test
npm run test -w @second-crown/render
npm run build -w @second-crown/app
Update HANDOFF, CHANGELOG, USER-NOTES, DEV-NOTES.
