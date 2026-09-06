# Next bakeoff — Gemini immersion foundation

Owner wants one large presentation pass, then friends playtest.

## Who

**Gemini / Antigravity** on branch `bakeoff/gemini-immersion` (cut from current `main`).
Claude and Astra stay off this lane.

## Goal

Replace placeholder SVG stages and synth beds with a *theme pack system* other people can drop files into.

Must ship:

1. `packages/app/src/themes/` (or `seasons/packs/`) — one pack per holiday + one per season:
   halloween, midwinter, easter, harvest, midsummer, spring, summer, autumn, winter.
   Each pack: background layer(s), tab/badge chrome, icon set hooks, music url, optional battle url.
2. Backgrounds that fill the viewport and look like a place, not two rectangles. Prefer painted SVG or images under `packages/app/public/themes/<id>/`.
3. Audio: HTMLAudioElement loops from `/audio/<id>.ogg` and `/audio/<id>-battle.ogg` when files exist. Keep synth as fallback. Honor Music mute. Do not bundle copyrighted songs. CC0/CC-BY only; list credits in `public/audio/CREDITS.md`.
4. Keep TesterBar holiday `<select>` sticky and usable on every theme.
5. Do not cover map clicks, Cloud, or Board.
6. Optional motion: CSS/Pixi only. No Unity, no second tick engine.

## Must not

- `packages/sim` and `server/` stay empty vs main.
- No Discord/Caddy/OAuth edits.
- No second `resolveBattle`.

## Verify

```bash
npm test
npm run build -w @second-crown/app
```

Write `walkthrough.md`. PR into `main`. Do not merge.
