# Auction and PvP ledger — Stage B foundation

Status: Astra PR; not deployed. This defines the smallest safe implementation after
`PVP-AUCTION.md` Stage A. It does not enable rated PvP or transfer kingdom spoils.

## Boundary

The existing `/save` is an unverified, replaceable client snapshot. Debiting that
file cannot establish ownership: a second tab, import, or automatic upload could
restore the pre-sale balance. Leave saves, the tick engine, OAuth, guest tokens,
and the existing `resolveBattle` alone. No simulation runs on the server.

Ship a **practice exchange**, explicitly separate from kingdom gold and spoils.
Discord accounts can enroll once for 100 practice gold and 5 practice iron. There
is no reset, deposit, withdrawal, reward, or conversion endpoint. These balances
have no effect on the game or board. Guests may continue using existing cloud
features, but cannot use the ledger. All ledger reads require Discord too.

## Storage and transactions

`DATA_DIR/ledger.json` is version 1, containing accounts, listings, challenges,
and actor-scoped idempotency receipts. Amounts are decimal strings using
`break_infinity.js`, with positive whole-number requests capped at 1e9 (so
practice balances remain far below floating-point precision limits).

One `sc-cloud` process owns this file. Each operation reads the latest file,
validates and mutates a private copy synchronously, fsyncs a temporary file, then
renames it over the ledger. No await occurs inside this transaction. A failed
write never changes the committed ledger. A retry of the same request ID and
payload returns its original receipt; reusing the ID for another payload is a
409. Do not run this JSON implementation with multiple workers or hosts. Move to
a transactional database before doing so. Back up the ledger alongside saves.

The server fails closed for malformed or unsupported ledger files. A bounded
ledger (10,000 receipts, 2,000 listings/challenges each) returns capacity errors
instead of pruning replay protection. This is a small playtest, not an unbounded
market service. Request bodies are limited to 16 KiB; response lists are bounded.

## `/auction`

GET: own balance, own ID, own open listings (maximum 10), and the most recent 100 listings (including settled
ones). POST accepts `requestId` plus one action:

- `enroll`: create the one-time practice account.
- `list`: `item` (`iron`, `banners`, `relics`), `quantity`, `price` (total gold).
  Remove quantity into escrow immediately; require sufficient inventory.
- `buy`: `listingId`. Require open listing, another owner, sufficient gold.
  Transfer buyer gold to seller and escrow to buyer in one durable transaction.
- `cancel`: `listingId`. Only the seller; return escrow once.

No bidding, expiry, fees, or gameplay assets in this stage. Unknown fields are
rejected. There is no endpoint to overwrite accounts or submit balances.

## `/pvp`

GET: only the caller's most recent 100 challenges. POST with `requestId`:

- `challenge`: `opponentId`, `power` decimal string. Both must be distinct
  Discord accounts with cloud saves. Store the challenger power (client-reported,
  **unverified**), tick, and SHA-256 of the last uploaded save.
- `accept`: `challengeId`, `power`. Only the opponent; lock the same snapshot
  fields for them. The record becomes `locked`, awaiting future resolution.
- `cancel`: `challengeId`. Either participant can close an open or locked
  challenge. Final records cannot change. Limit each participant to 10 pending
  challenges, and one pending challenge per pair.

The client uses existing `realmPower` to display/report power. The server does
not derive power, decide a winner, or accept a winner/reward payload. Locked
snapshots never refresh when a save changes. They are attestations, not validated
combat inputs. This stage has no ranking, combat button, casualties, or prizes.

## UI and retry behavior

`AuctionPanel` on World explicitly says practice assets are separate. It provides
enrollment, balances, fixed-price listing, buy/cancel, and challenge/accept/cancel.
Use the existing cloud URL and bearer token. Fetch on opening/refreshing; no tick
polling. Disable controls during requests. Preserve an uncertain POST and its
request ID for an explicit retry; do not silently issue a new transaction.

## Follow-up gates (not implemented)

Real transfers need authenticated inventory issuance and an idempotent claim
protocol that cannot be replayed through `/save`, import, or an old browser tab.
Both saves cannot simply be overwritten as a transaction. Rated matches need
validated combat inputs and a trusted execution/verification design for the
existing `resolveBattle`, with stored outcomes. Running the sim on this server
or comparing power with a second formula is forbidden. Agree that architecture
before enabling either feature. The practice ledger is not advertised as secure
ranked play or a real-item economy.

## Verification

Run `npm test`, `npm run build -w @second-crown/app`, and
`node --test server/ledger.test.mjs server/ledger-http.test.mjs`.
Cover authorization, escrow conservation, insufficient funds, duplicate buys,
request retries/conflicts, restart persistence, malformed requests, snapshot
immutability, and unchanged cloud save/guest routes.
