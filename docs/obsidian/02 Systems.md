# Systems

- [[Combat]] — `resolveRounds`, column clash, storm, sally
- [[Economy]] — income, pairs, labor, storage, vault, market
- [[Research]] — lectern, research tree, Academy 0.8× new ticks
- [[Army]] — queue, unlocks, upkeep, starvation, treat wounded, infirmary auto-heal
- [[Board]] — marches, gathers, scouts, garrisons, fog
- [[Hold]] — walls 8 rim, gate HP inside wall HP, watchtowers
- [[Living Realm]] — read-only sim snapshots plus app presentation, each behind a `living_*` flag

## Living Realm layers (all live)

- NPC realms: board activity, clash lock, flag contests, war losses, raid timing
- Player in NPC wars: join a side, war imagery, outcomes, column marks and ranks
- Voice: culture correspondence, whispers, player replies, last-whisper summary
- Relations: relationship summary, relationship history, friendly presence, friendly routes
- Status (16): economy pressure, research, court, board feedback lines
- Economy (17–18): yields line, yield breakdown, storage pressure
- Research (19–20): research detail, progress bar, study previews, Academy note
- Court (19, 21): court detail, decree effects
- Inspect (17, 21): last-inspected tracking, inspect Detail group (stock, outposts, marches, notes)

## Current living layers

Live app presentation pieces wired onto the sim snapshots (all read-only, non-blocking, and gated behind their `living_*` flags):

- **Kingdom — economy:** store pressure line (`EconomyPressureLine`), non-`ok` storage fill/status sub-line (`StoragePressureDetailLine`), net per-second yields (`EconomyYieldsLine`), and collapsed **Breakdown** yield-source expander (`EconomyYieldBreakdown`).
- **Kingdom — research:** lectern progress line (`ResearchProgressLine`), thin active-study progress bar (`ResearchProgressDetailBar`), Academy status/bonus note (`AcademyFeedbackLine`), and collapsed **Next unlocks** expander with optional study-effect previews (`ResearchDetailExpander`).
- **Kingdom — court:** court status line (`CourtStatusLine`), active-decree countdowns and guidance (`CourtDetailLine`), and active-decree effect summary with readiness/save suggestion (`DecreeEffectSummaryLine`).
- **Inspect card (`ProvinceInspect`):** seen-only **Detail** section (`InspectDetailSection`) showing gather-node stock and fill bar, nearby outposts, inbound marches with ETA, and short notes (hidden under fog).
- **World tab:** next-whisper timing/sender hint (`NextWhisperHintLine`), last-whisper summary (`LastWhisperSummaryLine`), and Known Realms relationship summary with collapsed **Recent** history expanders (`RealmRelationshipCard`).
- **Board overlays (`BoardLiving`):** non-blocking selection, last-inspected dashed rim, pending march ETA, and nearby-friendly pill (`BoardFeedbackLayer` / `BoardNearbyFriendlyMark`), friendly hold presence and route arcs (`BoardFriendlyPresence`, `BoardFriendlyRoutes`), and joined-war formations, column standards, and unit ranks (`BoardJoinedFormations`, `BoardColumnMarks`, `BoardColumnRanks`).
- **Presentation invariants:** each layer uses dedicated CSS files (`theme.css` untouched), Dusk / Night / Parchment theme tokens, `prefers-reduced-motion` support, `pointer-events: none` on decorative/board marks, and clean hiding when empty, unseen, or disabled.
