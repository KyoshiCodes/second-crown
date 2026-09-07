# Astra map gathering

This PR adds sim-only gathering on bakeoff/astra-gather. UI wiring is deferred to the presentation lane.

## Behavior and API

- tryGather(state, provinceId, force) validates a known, nonnegative integer troop composition, reserves available troops and a march slot, then sends a column to a woodcut, quarry, or field. Empty forces, unavailable troops, enemy occupation, camps and holds are rejected without mutation.
- listGathers(state) returns detached expedition records with outbound/gathering/returning phase, origin/target IDs, force, travel and event ticks, capacity, and current load. Quantities are decimal strings. Input troop counts retain the existing column API's safe-integer number convention.
- tryRecallGather(state, gatherId) starts the return journey with the load already gathered. Recalling again returns false.
- Resources and the original troop types return only at home arrival, once. Existing standing-army food upkeep can consume food on that same tick.
- GatherSystem is appended to the existing SYSTEMS list. No clock, combat resolver, or server sim is introduced.

## Small deterministic choices

| Node | Cargo per troop | Ticks per cargo unit | Full loading ticks per troop |
| --- | --- | --- | --- |
| woodcut | 6 wood | 10 | 60 |
| quarry | 4 stone | 20 | 80 |
| field | 8 food | 5 | 40 |

Node throughput is fixed, so larger columns carry more and occupy the site longer. Travel uses 15 existing sim ticks per Manhattan step in either direction. Outbound recall retraces elapsed travel, with a minimum one-tick return. No cargo accrues on the arrival tick; incomplete cargo units are discarded on recall.

A site is reserved at dispatch, preventing two outbound parties from claiming it; the reservation ends when returning starts. Returning parties still consume a march slot. Regular raids and gathers share maxMarches, checked before troops are removed. This also prevents rejected marches from consuming troops.

Gathering does not deplete nodes, plant outposts, fight, or grant gold. It snapshots node type and capacity. If the node disappears or becomes enemy-owned before arrival, the party returns empty. Once loading starts it finishes or recalls using that snapshot; combat interception and depletion are outside this PR. Existing smash-and-grab raids remain available.

State uses additive gathers_json and gather_serial flags, consistent with existing march storage. Old saves with neither flag mean no expeditions; current saves preserve active journeys. Successful actions record tick-stamped gather/recall_gather inputs. Force keys are sorted for stable serialization. Load derives from elapsed whole ticks rather than repeated additions.

## Verification and limits

- npm test: 104 tests passed, including 11 gather cases covering all node payouts, mixed troop restoration, recall in transit and while loading, reservation, shared slots, invalid orders, vanished targets, scaling, tick/settle equality, and save/reload.
- npm run build -w @second-crown/app: passed.
- git diff main -- packages/app packages/render server: empty.
- tickEngine.ts changes only import/register GatherSystem.

An existing limitation surfaced during testing: UpkeepSystem removes one starving militia per applyUpkeep call, so five single ticks and a five-tick analytic jump can differ (27 militia with no food becomes 22 versus 26). Fractional food arithmetic can also differ by batching. This PR does not rewrite upkeep or the tick engine. Gathering equivalence is tested with upkeep-exempt champions to isolate the new system; global offline equivalence under starvation is not claimed.

Pre-existing package.json and untracked package-lock.json changes are excluded from this PR. Existing historical documentation, including old merge-marker text in DEV-NOTES, is not rewritten. No deployment or merge to main is performed.
