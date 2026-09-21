# Overworld hybrid — Lords Mobile camera + pixel holds

Goal: zoom-out world feels like a 3D kingdom map. Zoom-in hold stays our pixel buildings, walkers, and units.

## Two bands (already in AppShell)

- **Hold** — 16×10 isometric yard. Pixel buildings. Do not replace these with 3D meshes.
- **Board** — province atlas. Raised diamond tiles, height by terrain, hold tokens, march traces.

`OverworldAtlas` is the World-tab atlas (SVG, presentation only). The Pixi canvas remains the live Hold/Board editor.

## What Gemini should do next (render package only)

Split `packages/render/src/index.ts` without changing sim.

1. Height-mapped board tiles (hill / forest / waste / water / hold) with a side face so tiles read as 3D.
2. When cameraBand === "board", draw province tokens as miniature pixel keeps using existing kit drawers — not new 3D cities.
3. Widen the canvas stage. Map should fill the chrome, not sit in a 560px postage stamp.
4. Fog as a dark height veil, not a flat grey overlay.
5. Do not add a second combat renderer. Do not retune resolveBattle.

## What Claude should do next

- Extract camera / band / pan from the render godfile.
- Keep `toggleCameraBand` as the only player-facing switch.
- Province click still selects `selectedProvinceId`.

## Invariants

Presentation only. TickEngine, resolveBattle, Discord, Caddy stay untouched on art branches.
