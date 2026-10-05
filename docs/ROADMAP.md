# Roadmap

Updated 2026-10-04. Matches `docs/HANDOFF.md`.

## Live now

- Five player cultures, each with one unit: **Mist / Ranger**, **Glen / Banner**, **Salt / Outrider**, **Fen / Warden**, **Peak / Lancer**. Each has its Army-tab chip, its culture keep, and its march meeple.
- First Second Dawn gives +1 militia, +20 food, +10 wood, once (does not stack).
- Already shipped, no longer on the list: People job cards with counts, keep-gate studies and barracks queue, Last battle card, keep room work cards.

## Near-term (next 2–4 pairs)

Keep shipping **one Claude slice + one Gemini slice**. Owner tests locally, Grok merges, Oracle deploy.

- Playtest the five cultures and log balance notes (is each one difference worth picking?)
- Culture picker line that also names each culture's unit (the blurb already names its one difference)
- Fog tile "unseen" copy that matches `visionRange` (Peak's +1 vision included)
- Stop stacking one-line hints; prefer one new verb (button) per wave

## Parked (do not implement)

- Another dawn gift beyond the first-dawn stores
- Real time: server clock, server save, shared hold. Plan in `docs/REALTIME.md` (spec only, not started). Phase 3 would put the sim on the server; owner decision first

## Next systems (need a written spec first)

- Player-to-player rally / guild
- Auction / bazaar beyond `MARKET_OFFERS`
- Research tree past the current lectern set
- Infirmary auto-heal tick (treat is manual today)
- Balance pass on gather vs farm income

## Later

- HTTPS + real Discord OAuth hardening (`docs/HTTPS.md`, `docs/DISCORD-LOGIN.md`)
- Friend playtest pack (`docs/PLAYTEST-FRIENDS.md`)
- Do **not** put the sim on the Oracle server

## Agent split (standing)

| Agent | Folder | Owns | Never |
|---|---|---|---|
| Claude | `C:\Projects\second-crown-claude` | `packages/app`, small `packages/sim` helpers + tests | `packages/render`, `server/` |
| Gemini | `C:\Projects\second-crown-gemini` | `packages/render`, flavor CSS | `packages/sim`, `server/` |
| Grok | — | docs, PRs, merge, briefs | drive-by sim rewrites |
