# DEV-NOTES — for agents and future you

Last updated: 2026-09-06 | Version: playtest-0.3

## Doc rule

Meaningful `main` merge → update HANDOFF, CHANGELOG, USER-NOTES, DEV-NOTES together.

## HTTPS

Bare IPs cannot get a public cert. Playbook: `docs/HTTPS.md`.
Do not point Discord at a self-signed cert. Do not close port 8787 until Caddy health works.

After Caddy works, `PUBLIC_APP_URL` and `DISCORD_REDIRECT` must use `https://129.153.17.72.sslip.io`.

## Units

`packages/sim/src/content/units.ts` + `packages/app/src/UnitIcon.tsx`. Army tab lists `listUnitTypes()` automatically.

## Deploy

`pm2 restart sc-cloud` only. No `sc-game`.
