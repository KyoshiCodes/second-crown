# Roadmap

Updated 2026-11-10. Matches `docs/HANDOFF.md`.

## Live now

- **Core loop:** build the hold, staff works, trade, study, issue decrees, train, march, plant flags, garrison, gather, scout, treat wounded, sally, answer events, claim quests, deal with rival realms.
- **Cultures:** ten in the picker; five with their own unit and edge (Mist / Ranger, Glen / Banner, Salt / Outrider, Fen / Warden, Peak / Lancer). The picker names each unit and edge.
- **Board:** isometric diamond board with terrain, roads, fog edge, keeps, marches, unit labels, node piles, camps, selection rim, hover tooltip, day/night and weather.
- **Living HUD layers (complete):** living status rows plus living glyphs on resource, building, people, vault, flag / outpost, market, unit, war force / camp, diplomacy, research, decree, event, quest, ledger, atlas province, province node and joined-hold cards. Full table in `HANDOFF.md`.
- **Feedback:** action flash and sound, lo-fi radio, pace lines, hint lines, balance notes panel.
- **Opt-in shared hold:** Join hold card in the Cloud panel (key, train, build, stamps, log).

## Near-term

Keep shipping **one Claude slice + one Gemini slice** where both apply. Owner tests locally, Grok merges, Oracle deploy.

1. **Playtest notes.** Owner plays the live build end to end and logs notes in `USER-NOTES.md`. Feeds the balance pass (culture edges, gather vs farm income).
2. **Board visual pass.** One readability sweep of the diamond board: layer order, contrast under weather and fog, label clutter. No new marks.
3. **Research expansion.** More studies past the current lectern set. Needs a written spec first.
4. **Infirmary auto-heal.** A tick that treats wounded without a click (treat is manual today). Needs a written spec first.
5. **Audio.** Build on the action sound and lo-fi radio: a few more cues and a volume / mute control.
6. **Performance.** Measure first (board frame time, HUD re-renders with all living layers on, chunk sizes), then fix the worst one.

Items 3 and 4 change `packages/sim`: owner approval before work starts.

## Done (moved off the list)

- Culture picker line that names each culture's unit and edge.
- Fog "unseen" copy and fog edge marks on the board.
- One-line hint and pace waves (research, market, decree, age, culture, wall, vision, upkeep, training, academy). No more of these.
- Balance notes panel on the Kingdom tab.
- People job cards, keep-gated studies and barracks queue, Last battle card, keep room work cards.
- Living HUD rows and glyphs on every main card (2026-11).
- Real time phases 1–3 and the opt-in join hold (`docs/REALTIME.md`).

## Parked (do not implement)

- Another dawn gift beyond the first-dawn stores.
- An owner-marked shared realm; more shared-hold intents.
- More living rows, glyphs or hint lines.

## Next systems (need a written spec first)

- Player-to-player rally / guild
- Auction / bazaar beyond `MARKET_OFFERS`

## Later

- HTTPS + real Discord OAuth hardening (`docs/HTTPS.md`, `docs/DISCORD-LOGIN.md`)
- Friend playtest pack (`docs/PLAYTEST-FRIENDS.md`)
- Do **not** put the sim on the Oracle server for solo play

## Agent split (standing)

| Agent | Folder | Owns | Never |
|---|---|---|---|
| Claude | `C:\Projects\second-crown-claude` | `packages/app`, small `packages/sim` helpers + tests | `packages/render`, `server/` |
| Gemini | `C:\Projects\second-crown-gemini` | `packages/render`, flavor CSS | `packages/sim`, `server/` |
| Grok | — | docs, PRs, merge, briefs | drive-by sim rewrites |
