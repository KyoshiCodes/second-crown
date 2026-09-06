# Astra walkthrough — practice exchange and PvP ledger

Branch: `bakeoff/astra`. Target: `main`. Do not merge automatically.

## What this ships

World now contains a collapsible practice exchange and PvP ledger. Existing
Discord identities can enroll once, list practice items into escrow, buy other
players' listings, and cancel their own. Each transaction records an actor-scoped
request receipt. Retrying an interrupted request returns that receipt without
repeating the transfer. The browser keeps pending requests in session storage.

PvP participants can create, accept, and cancel challenges. Each side locks
client-reported power, last uploaded save tick, and its hash. Accepted challenges
wait for a future resolution design; they never invent a winner or run combat.

The referenced `docs/SPEC-AUCTION-PVP.md` was absent on current main. This PR
writes that spec first and implements the safe foundation it describes.

## Deliberate limits

This is **practice**, not real-item trade or rated PvP. One-time 100 gold and
5 iron are server-owned practice assets; they cannot enter or leave a kingdom
save. Current cloud saves are replaceable client snapshots, so directly removing
items from a save would allow stale uploads to restore sold items. Real transfer
requires a separate ownership/claim architecture described in the spec.

Snapshots are explicitly unverified attestations, not complete validated battle
inputs. No combat or reward endpoint exists. Existing `resolveBattle` is
untouched. No sim runs on the server. There is no second renderer, dependency,
season calendar, or change to game balance.

The bounded JSON ledger supports a single sc-cloud process. Keep its file with
server backups. Capacity is 10,000 receipts and 2,000 listings/challenges; clients
see their open listings plus the latest 100 and their own latest 100 challenges.
A seller can hold at most 10 open listings. Do not discard receipts to make space.

## Try it after reviewing the PR

From this checkout:

```powershell
npm test
npm run build -w @second-crown/app
node --test server/ledger.test.mjs server/ledger-http.test.mjs
```

For a deployed review environment with Discord configured:

1. Sign in with Discord using Cloud. Open World, expand the practice exchange,
   and press Refresh ledger.
2. Join once. Confirm 100 practice gold and 5 iron; kingdom resources stay the same.
3. List 2 iron for a total 20 practice gold. Your practice iron becomes 3.
4. A second Discord account joins and buys. Seller has 120 practice gold; buyer
   has 80 practice gold and 7 iron. Refresh both browsers to see the result.
5. List another item and cancel it; escrow returns once. A second buyer cannot
   purchase a sold/cancelled listing.
6. Both accounts push a cloud save. Copy the opponent ID shown in their ledger,
   create a challenge, then accept from that account. Both snapshots are shown
   as locked with no battle result. A later save upload does not refresh them.
7. If a response is lost, retry the pending request. It retains its ID across
   World-tab remounts and reloads in the same browser tab.

## Verification and scope

- Existing simulation suite: 46 tests passed.
- Ledger suite: 10 tests passed, with transaction and real-HTTP coverage for ownership, escrow,
  competing buyers, malformed input, duplicate requests, restart persistence,
  snapshots, authentication, and unchanged save/guest routes.
- Production TypeScript/Vite build passed. A formatter type error found on the
  first build was corrected before delivery.
- Browser visual review was attempted but could not start: the browser tool's
  Windows sandbox helper failed during initialization. No visual QA claim.
- No changes under `packages/sim`, `packages/render`, or to theme/music layers.
- Only the World-tab import/mount touches an existing UI file, minimizing overlap
  with Gemini. No changes to Claude's War tab.
- Existing uncommitted package.json and untracked package-lock.json were preserved
  and excluded. Generated build metadata was excluded too.
- Nothing was deployed to the live host. No OAuth/Caddy/environment edits.
