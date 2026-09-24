# Roadmap

## Now (playtest-ready)

Keep shipping **one Claude slice + one Gemini slice**. Owner tests locally, Grok merges, Oracle deploy.

Near-term (next 2–4 pairs):

- People tab job counts that match labor line
- Last-battle kind labels (column / camp / hold / sally)
- Keep-gate checklist that matches `keepGateFor`
- Fog tile "unseen" copy that matches `visionRange`
- Stop stacking one-line hints; prefer one new verb (button) per wave

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

| Agent | Owns | Never |
|---|---|---|
| Claude | `packages/app`, small `packages/sim` helpers + tests | `packages/render`, `server/` |
| Gemini | `packages/render`, flavor CSS | `packages/sim`, `server/` |
| Grok | docs, PRs, merge, briefs | drive-by sim rewrites |
