# Second Crown

An idle / kingdom-builder / grand-war hybrid. You are an exiled king rebuilding a realm from
nothing, in a world that does not wait for you. Prestige resets are framed as the next exile.

Idle economy and unlock depth in the spirit of Realm Grinder. Army building and battle
simulation in the spirit of Mount & Blade II: Bannerlord. Pixel art, 2D, single player, free,
runs in a browser.

**Status: pre-0.1.0.** Design locked, no code yet.

---

## Documentation

| Document | What it is |
|---|---|
| [AGENTS.md](AGENTS.md) | Standing instructions for AI agents. Read first |
| [docs/CONCEPT-BIBLE.md](docs/CONCEPT-BIBLE.md) | The design authority. v1.0, locked |
| [docs/MASTER-PROMPT.md](docs/MASTER-PROMPT.md) | How we work: phases, doc set, conventions |
| [docs/INVARIANTS.md](docs/INVARIANTS.md) | Sixteen non-negotiable rules |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Architecture decision records |
| [docs/HANDOFF.md](docs/HANDOFF.md) | Current state. Read before any session |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Deferred scope |

## Stack

TypeScript monorepo · Vite · React (UI) · PixiJS (map and battle) · break_infinity.js (numbers)
· Vitest · GitHub Pages. No backend, no database, no accounts.

```
packages/sim      pure rules, ticks, battle resolver, AI. headless
packages/content  declarative data only
packages/render   PixiJS views
packages/ui       React components
apps/game         Vite shell
```

## Roadmap

`0.1.0` scaffold · `0.2.0` idle engine **← is it satisfying?** · `0.3.0` city · `0.4.0` army ·
`0.5.0` battles and Watch mode **← first shareable build** · `0.6.0` living world · `0.7.0`
command and treaties · `0.8.0` legacy and court · `0.9.0` intrigue and identity · `1.0.0` ship

A multi-year hobby-pace project, built deliberately.

## Licensing

**Intentionally unlicensed and private.** See ADR-007. Do not add a license file or make this
repository public without the owner's decision.

## Attribution

Inspired by, and copying nothing from, Realm Grinder (Divine Games) and Mount & Blade II:
Bannerlord (TaleWorlds). All assets original or CC0, logged in `docs/ASSET-LICENSES.md`.
