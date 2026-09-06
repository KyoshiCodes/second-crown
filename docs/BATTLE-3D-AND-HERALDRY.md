# Battle playback and painted heraldry — implementation map

This is the plan. Nothing here changes combat math. The sim stays the source of truth.

## Invariants that stay locked

- Winner, loot, and casualties are decided only in `@second-crown/sim`.
- Playback is a **replay** of an already-resolved `BattleResult`.
- Same seed + same inputs = same film. No extra RNG in the renderer.
- Offline catch-up does not play films; it only stores the result for later playback.

## Phase 1 — what is in the game now

- Crest badges (color + glyph per realm).
- Army company cards with repeating glyphs.
- CSS battlefield strip after Fight.
- Tab-themed backgrounds and short UI tones.

## Phase 2 — painted heraldry (2D, Pixi)

1. `packages/render/src/heraldry.ts`
   - Input: `{ realmId, seed, palette }`.
   - Output: a canvas/texture: field + ordinary + charge.
   - Charges picked from a small catalog (lion, tower, wave, star, sun).
   - Colors from a locked palette so saves never drift.
2. Draw the shield on the map corner and next to World Status names.
3. Store nothing extra in the save; regenerate from `realmId + world seed`.

## Phase 3 — battlefield stage (still 2D)

1. `BattleStage` Pixi scene: two lanes, ground strip, banners.
2. Spawn N sprites per unit type from `BattleResult` snapshot taken **before** resolve.
3. Playback clock is display-only (`requestAnimationFrame`).
4. On finish, freeze on the winner banner already computed by sim.

Suggested snapshot shape:

```ts
interface BattleFilm {
  seed: number;
  attackerId: string;
  defenderId: string;
  winnerId: string;
  lines: { realmId: string; typeId: string; count: number }[];
  loot: Record<string, string>;
}
```

## Phase 4 — 3D playback (optional later)

Do **not** put Three.js in `sim`. Keep it in `packages/render` or a new `packages/battle3d`.

1. Low-poly companies (capsules / banners), not individual soldiers at 2,000 count.
2. Instanced meshes. Camera dollies from above-left to the clash line.
3. Animation clips: idle, advance, clash, rout.
4. Duration capped (~8s). Skip button always available.
5. GitHub Pages budget: one extra ~200kb gzip chunk is acceptable; a 20mb asset pack is not.

## What we will not do in Phase 4

- Re-roll hits in the renderer.
- Physics that can change the winner.
- Voice acting or streamed music (hosting and copyright).
- Per-soldier pathfinding.

## Audio plan

- Keep the current Web Audio stingers.
- Later: looped bed per tab (kingdom pastoral, war drones) using tiny generated pads or CC0 loops in `packages/app/public/audio/`.
- Mute toggle in the header. Default on, persist in `localStorage` only (not the sim save).
