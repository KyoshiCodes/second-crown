# DEV-NOTES — for agents and future you

Last updated: 2026-09-06 | Version: playtest-0.3

## Doc rule (do not skip)

After every meaningful merge to `main` update, in the same change set:

1. `docs/HANDOFF.md` (full rewrite of sections 1–12 if the version moved)
2. `docs/CHANGELOG.md` (newest first)
3. `docs/USER-NOTES.md` (player-facing)
4. `docs/DEV-NOTES.md` (this file — pitfalls, files touched)

Do not wait for a later session. Local-only test branches can skip until merge.

## Pitfalls already paid for

- `engineRef` must be read each tick or New Game keeps the old engine
- Peace flags are per pair `peace_a_b`; do not use one global lock
- Combat tests assume militia food costs without `craft_train`
- `tryFoundGuild` lives in `actions/faction.ts`, not `wave.ts`
- Live site is **one** process: `pm2 restart sc-cloud` on 8787. There is no `sc-game`
- Discord env is on the VM; `pm2 restart` without `--update-env` keeps it
- Pixi map animation is visual-only; do not call RNG from the ticker

## Clash flags

`world_a`, `world_b`, `world_until`, `world_side` on `state.flags`. Resolved in `tickWorldClash` from RivalSystem every 100 ticks.

## Deploy reminder for the owner

Windows: `git pull` + `npm test` + build.  
SSH: same, then `pm2 restart sc-cloud` only.
