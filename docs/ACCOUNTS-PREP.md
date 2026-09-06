# Accounts and shared play — prep only

Do not implement a server in the sim package.

## Recommended first backend (when you say go)

- Auth: Discord OAuth (friends already have accounts) **or** email magic link.
- Host: a small worker (Cloudflare Worker / Fly.io) + KV or SQLite.
- What it stores: `userId`, display name, last save blob, optional room id.
- What it does not store: tick-by-tick combat. Clients still run `@second-crown/sim` locally.

## Client changes later

- `packages/app/src/net/client.ts` — login, push/pull save, list room members.
- Keep determinism: a shared room is a **shared seed + shared input log**, not a physics server.
- Spectate = download the same save and replay.

## Discord invite text (copy)

Second Crown playtest (single-player for now):
Open {PAGES_URL}
Put your Discord name in the box at the top.
If it breaks: screenshot + Export save into this channel.

## Decision to make with Kyoshi before coding net

1. Discord OAuth vs anonymous tester names only.
2. Shared room (hard, needs lockstep inputs) vs just cloud saves (easy).
3. Budget: free tier only vs paid VPS.
