# SECOND CROWN — Concept Bible v1.0
### Working title for an idle / kingdom-building / grand-war hybrid

> **Status: LOCKED for pre-production.** This is the design authority for the project and
> the first document any AI agent reads. All forks are resolved. Deviating from this
> document requires an explicit argument and a decision record — not a silent change.
>
> Repo location: `docs/CONCEPT-BIBLE.md`

---

## 0. Locked decisions — read this first

Everything below is settled. §15 explains the reasoning and the risk plan.

| # | Decision | Locked as |
|---|---|---|
| 1 | **Genre** | Idle economy → city building → grand war → prestige, four nested layers |
| 2 | **Premise** | Exiled king rebuilding a realm; prestige reset = the next exile |
| 3 | **Stack** | TypeScript monorepo, Vite, React (UI), PixiJS (map/battle), break_infinity.js, Vitest, GitHub Pages |
| 4 | **Simulation** | Pure, headless, deterministic, seeded, tick-based. Offline settlement ≡ online settlement |
| 5 | **City building** | Free placement, snapped to a tile grid. Occupancy array, not geometry. **Zero citizen agents** |
| 6 | **Themes** | Hybrid — cosmetic, plus exactly one signature perk drawn from a budget-costed shared pool |
| 7 | **Doctrines** | Separate axis, carries the real mechanical variety and its own unlock tree |
| 8 | **Battles** | One resolver, three presentation modes. **Watch mode built first**, resolver unit-tested headless before any animation |
| 9 | **Diplomacy** | Full intrigue in 1.0 scope. Therefore realms are **character-based from 0.1.0** |
| 10 | **Pacing** | Active play multiplies, never unlocks. Fully idle players reach all content |
| 11 | **Art** | Original pixel art, one grid, one master palette. Placeholder-first |
| 12 | **Cost** | 100% free tools, free hosting, CC0 or original assets only |
| 13 | **1.0 content budget** | 2 themes, 3 doctrines, 1 player-laid-out city. Breadth grows after 1.0 |
| 14 | **IP** | Inspired by Realm Grinder and Bannerlord. Copies nothing. No game files ingested, ever |
| 15 | **Title** | *Second Crown*, internal working title. Public title decided pre-launch |

---

## 1. The pitch

**One sentence:**
You are a king who lost everything — dragged from your own throne, hunted, exiled with a
death sentence on your name. In a world of endless war, you begin again with nothing, and
build the realm that will take your crown back.

**Expanded:**
Second Crown is an idle kingdom-builder with a real war layer. You build an economy that
runs whether you're watching or not, shape a kingdom's infrastructure to your own taste,
raise an army out of that economy, and throw it at a living map of rival realms who are
busy fighting each other whether you show up or not. Play it in ten-second check-ins or
three-hour sessions; both are legitimate and both make progress. Your kingdom's *look* —
knights, gunslingers, star-empire, whatever you like — is yours to choose, because power
in this game comes from advancement, not aesthetic.

**Why it works as a hybrid:** Realm Grinder's engine of appeal is exponential growth plus
faction identity plus deep unlock trees. Bannerlord's engine of appeal is *my army, my
composition, my battle.* They bolt together cleanly because an idle economy is exactly
the thing that should be producing an army, and an army is exactly the thing that should
be producing more territory, which produces more economy. That's a closed loop, and it's
a good one.

---

## 2. Technical reality check on Realm Grinder

You asked me to find out what it runs on. Answer, and it matters:

**Realm Grinder is an Adobe AIR application.** Developed by Divine Games, published by
Kongregate, released on Steam June 15 2017 ([Steam store page](https://store.steampowered.com/app/610080/Realm_Grinder/)),
and [SteamDB detects the engine as Adobe AIR](https://steamdb.info/app/610080/info/) — which
is to say it's a Flash/ActionScript game wrapped in a desktop runtime. Steam reviewers
describe it the same way, [an idle game based on Adobe Flash](https://steamcommunity.com/id/pen-chan/recommended/610080/).

**What that means for you:** do not copy this stack. Flash reached end-of-life in 2020,
and AIR is now a third-party-maintained niche runtime. It is a dead end for a new project
in 2026 — no meaningful tutorial ecosystem, no modern tooling, and an AI agent's training
data on ActionScript is thin and stale compared to TypeScript.

**The good news:** the *architecture* of Realm Grinder is completely unremarkable and
trivially reproducible in modern tech. It's a UI-heavy game — nested panels, buttons,
counters, tooltips, tabs — driven by a numeric simulation tick and a very large save
object. There is no 3D, no physics, no complex rendering. Nothing about it needs Flash.
The reason it *was* Flash is that it started as a 2014 Kongregate browser game, and
Flash was how you shipped browser games in 2014.

### The part you need to hear about the Steam files

You proposed uploading a copy of the entire game's files to a GitHub repository for your
agents to reference. **Don't do that.** Three reasons, in order of importance:

1. **It's copyright infringement.** Realm Grinder is Kongregate's property. Redistributing
   its files — public repo or private — is unlawful distribution, and decompiling the SWF
   to extract mechanics is derivative-work territory. A private repo is not a legal shield.
2. **Most AI coding agents will refuse it,** and the ones that don't will produce output
   contaminated by another studio's code and assets. That's a real liability for anything
   you might eventually want to publish or sell.
3. **You'd be reverse-engineering ActionScript you can't use anyway.** The technical
   payload is near zero.

**The legitimate path, which is genuinely better:** play the game and take notes as a
designer. Write down, in your own words, what the *feel* is — how fast the first hour
moves, when the first prestige lands, how many production buildings there are before it
starts to sprawl, what the faction choice actually changes, how the tooltips are worded.
The public Realm Grinder wiki documents its formulas and unlock conditions openly, and
you can reference those numbers as *design targets* while writing your own systems. What
you want from Realm Grinder is its pacing curve and its information design, and both of
those you can extract by playing it with a notebook open. That's not a compromise — it's
how designers actually study games.

Same rule for its pixel art: study it, never trace it, never import it. Your asset
pipeline produces original art (see §11).

---

## 3. Design pillars

Five commitments. When a feature decision is ambiguous, the pillars break the tie.

| Pillar | Meaning | What it forbids |
|---|---|---|
| **Your pace is the right pace** | 30 seconds a day and 3 hours a day are both fully supported playstyles | Timers that punish absence; daily-login-or-lose-streak mechanics |
| **The numbers must always be climbing** | There is always a next threshold, always something ticking upward | Hard walls with no idle path through them |
| **The army is yours** | Composition, doctrine, and battlefield decisions are player expression, not a stat check | Pure auto-resolve with no player input or insight |
| **The world doesn't wait for you** | Rival realms fight, ally, collapse, and grow while you're gone | A static map that only changes when the player acts |
| **Aesthetic is free, power is earned** | Any theme can win; themes never gate strength | Sci-fi being mathematically better than knights |

---

## 4. The loop architecture

Four nested layers. Each one feeds the next, and each has both an active and an idle path.

```
        ┌──────────────────────────────────────────────────────┐
        │  LAYER 4 — LEGACY   (prestige / reset / meta)         │
        │  Spend a fallen run's Claim on permanent advantages   │
        └───────────────────────▲──────────────────────────────┘
                                │ reset & keep Claim
        ┌───────────────────────┴──────────────────────────────┐
        │  LAYER 3 — WAR       (the map, rivals, conquest)      │
        │  Territory won → more land, more tax base, new needs  │
        └───────────────────────▲──────────────────────────────┘
                                │ army
        ┌───────────────────────┴──────────────────────────────┐
        │  LAYER 2 — KINGDOM   (building, infrastructure)       │
        │  Convert resources into capability & unit production  │
        └───────────────────────▲──────────────────────────────┘
                                │ resources
        ┌───────────────────────┴──────────────────────────────┐
        │  LAYER 1 — ECONOMY   (the idle engine)                │
        │  Population, production, gold — ticks with or w/o you │
        └──────────────────────────────────────────────────────┘
```

**The tension that makes it a game:** every resource has at least two hungry mouths.
Gold builds economy *or* pays soldiers. Population works fields *or* fills ranks. Iron
raises walls *or* arms troops. Every choice about war is a choice against growth, and
vice versa. That's the decision space, and it's what stops this from being a spreadsheet
that plays itself.

### Active vs idle, concretely

| Activity | Idle path | Active path | Active advantage |
|---|---|---|---|
| Economy | Buildings produce on tick, offline settled on return | Manual "levy"/"decree" clicks, timed production bonuses | ~1.5–2.5× |
| Kingdom | Queued construction completes offline | Reactive rebuilding, optimal build ordering | Efficiency, not rate |
| Army | Training queues run offline | Manual recruitment surges | ~1.5× |
| War | Campaign orders auto-resolve offline | Watch/command the battle live | ~1.3–1.8× + fewer losses |
| Legacy | — | Prestige timing is a player skill | Meaningful |

The design rule: **active play multiplies, it never unlocks.** An AFK player must be able
to reach every piece of content, just slower. The moment active play gates content, you've
broken pillar one.

---

## 5. The Exiled King — narrative frame

Not a cutscene story. A story told through the systems.

**Act structure, mapped to progression:**

- **The Landing** (early game) — You have a handful of loyalists, no name, no land. A
  minor lord tolerates your presence. Tutorial lives here, diegetically: your advisors
  teach you because you genuinely need teaching.
- **The Foothold** (mid) — You are a real polity. Neighbours notice. First real war,
  first alliance, first betrayal. The realm that exiled you is still far stronger.
- **The Claimant** (late) — You are a great power. Your old kingdom's name starts appearing
  in your intelligence reports. Other realms court you as a counterweight to it.
- **The Return** (endgame of a run) — You march on the throne that was yours. Winning ends
  the run and converts everything into **Claim**, the prestige currency. Losing also ends
  the run, but yields less. Either way: exile again, wiser.

**Why the prestige loop is thematically perfect here:** most idle games have to invent a
justification for resetting. Yours is baked into the premise. Every reset is another
exile, another rebuilding, and your **Legacy** — the permanent meta-progression — is
literally the reputation and knowledge that survives your defeats. Realm Grinder resets
because that's the genre; Second Crown resets because that's the story.

**Usurper as recurring antagonist:** the one persistent NPC across all runs. Gets
stronger each cycle as you do, remembers, taunts you in the intel feed. Cheap to build,
enormously effective.

---

## 6. Resource model

Keep the tier-1 list short. Idle games die of resource bloat.

**Primary (tier 1) — the always-visible bar:**

| Resource | Produced by | Consumed by | Notes |
|---|---|---|---|
| **Gold** | Taxation, trade, markets | Everything | The main exponential axis |
| **Food** | Farms, fisheries, granaries | Population upkeep, army upkeep | Caps army size — a real strategic ceiling |
| **Materials** | Quarries, lumber, mines | Construction, fortification | Gates building tempo |
| **Population** | Housing + food surplus | Workers *and* recruits | The core tension resource |
| **Loyalty** | Order, prosperity, wins | Drained by taxes, defeats, conscription | Low loyalty = unrest, revolt, defection |

**Secondary (tier 2) — appear later, per-system:**
Steel/Ordnance (unit quality), Influence (diplomacy), Intel (espionage), Relics
(rare unlock currency), Command (limits simultaneous campaigns).

**Meta (persists through reset):**
**Claim** (prestige currency) and **Renown** (achievement-linked permanent unlock points).

**Design note on Loyalty:** this is your most interesting resource because it's the one
that punishes greedy optimization. Conscript too hard and the fields empty and the
peasants revolt. It's the mechanism that makes war *cost* something beyond gold, and it's
where your best emergent stories will come from.

---

## 7. The kingdom layer — building

Five asset families, so the player's build order is genuinely a strategy statement.

| Family | Examples | Strategic role |
|---|---|---|
| **Economic** | Farms, markets, mints, trade posts, guilds | Raw exponential growth |
| **Civic** | Housing, granaries, temples, courts, festivals | Population ceiling + Loyalty |
| **Defensive** | Walls, towers, gates, keeps, garrison posts | Survive being attacked; enable turtling |
| **Military production** | Barracks, ranges, stables, foundries, academies | Unit types, quality, training rate |
| **Logistics & command** | Roads, supply depots, war rooms, scout posts | Campaign range, march speed, Command cap |

**Adjacency** is what turns building from a menu into a puzzle. Buildings gain bonuses from
their neighbours (market next to road, farm next to granary, foundry away from housing).
This is where your Mastery appeal lives on the city side — real optimization depth with no
twitch requirement — and it's cheap: a scoring function over a grid.

### DECIDED: free placement, on a snapped tile grid

The player places buildings freely — position, orientation, and layout are theirs. But
placement snaps to a tile grid underneath, and this qualifier is what makes it buildable.

| Free placement, continuous | Free placement, grid-snapped (**chosen**) |
|---|---|
| Arbitrary float positions | Integer tile coordinates |
| Collision needs real geometry | Collision is a 2D occupancy array |
| Adjacency needs distance math | Adjacency is neighbour lookup |
| Saves are fragile and large | Saves are a compact tile map |
| Pixel art misaligns constantly | Pixel art aligns perfectly by construction |

The player experience is nearly identical — they still design their own city, in their own
shape, with roads where they want them. The engineering difficulty drops by roughly an
order of magnitude, and grid alignment is *required* for pixel art to look correct anyway.

**Hard cut, permanently:** no simulated citizens walking the streets, no per-citizen
pathfinding, no individual agent simulation inside the city. Population is a number, not a
crowd. This is the single trap that kills solo city-builders. Buildings may have idle
animations; the city is a diorama, not an ant farm.

**Zoning and adjacency:** computed as a scoring pass over the occupancy grid on placement
and on tick. Roads connect, districts emerge from clustering, pollution/noise/prestige are
radius effects. All of it is cheap grid math, no simulation required.

---

## 8. The war layer — the hard part, and the reason to build this game

This is where most hybrids fail. They either bolt on a fake battle (a dice roll with a
progress bar) or they try to build Bannerlord and drown. Here's the path between.

### What Bannerlord actually does, and what to learn from it

Bannerlord's instant "send troops" auto-resolve is famously crude — community consensus
is that it reduces to damage numbers scaled by the commander's Tactics skill with heavy
RNG, which is why mods exist specifically to make it simulate individual soldiers' HP and
damage properly ([Auto Resolve Rebalanced](https://www.nexusmods.com/mountandblade2bannerlord/mods/3453),
[Simulations Fix](https://www.nexusmods.com/mountandblade2bannerlord/mods/1151)). Players
resent it because outcomes feel arbitrary and elite troops die to bandits.

**The lesson: your auto-resolve must be a real simulation, not a coin flip.** In an idle
game, most battles will be resolved while the player is away. If those results feel
random, the entire war layer feels worthless. This is the single highest-risk design
element in the project.

### The three-tier battle system

One resolver, three presentation modes. **This is the key architectural insight: the
simulation is identical in all three; only the player's window onto it differs.**

| Mode | When | What the player does | Speed |
|---|---|---|---|
| **Report** | Offline / AFK | Nothing — reads a detailed after-action report | Instant |
| **Watch** | Active, casual | Observes the pixel battle unfold, sees the sim's reasoning | Seconds to minutes |
| **Command** | Active, engaged | Issues orders at decision points; gets the best outcomes | Minutes |

Because the resolver is deterministic and seeded, a Report-mode battle and a Watch-mode
battle of the same forces produce the *same* result. The AFK player isn't being cheated
and the active player isn't being handed a different game.

### How the resolver should work

A tick-based lanchester-style engagement model over unit *stacks*, not individuals:

1. Both armies decompose into stacks (100 spearmen, 40 archers, 20 cavalry).
2. Each tick, stacks engage based on formation, terrain, and matchup matrix
   (spears beat cavalry, cavalry beats archers, archers beat spears — plus real modifiers).
3. Morale is tracked per stack and it's the actual win condition. Armies don't die, they
   break. This alone makes results feel intelligible rather than arbitrary.
4. Commander skill, doctrine, and pre-battle choices apply as modifiers.
5. RNG is present but **bounded and seeded** — variance of a few percent, never outcome-flipping.
6. Output is a full event log, which is what feeds all three presentation modes.

That event log is the trick. Report mode summarizes it, Watch mode animates it, Command
mode pauses at flagged decision points inside it. One system, three products.

### Where mastery lives

Since you picked mastery as one of your three appeals, but this genre can't support
twitch: your mastery is **tactical and preparatory**, not mechanical.

- Army composition against a scouted enemy composition
- Doctrine and formation selection
- Terrain and timing of engagement
- Command-mode decisions: commit the reserve, hold the line, feign retreat, focus fire
- Supply and logistics — armies far from depots degrade

That's real, learnable, deep skill expression with zero reflex requirement, and it's
compatible with playing on a phone at a bus stop.

### The living world

Your realm is one entry in a table of 15–30 AI realms, each with resources, armies,
personality traits, and opinions of each other. They run the same simulation you do, at
lower fidelity, on a slower tick. They declare war, ally, betray, expand, and collapse
without you. Some will court you; some will decide you're the threat.

Implementation is cheaper than it sounds — a weighted-utility decision function per realm
evaluated on the world tick, plus the same battle resolver at low fidelity. The expensive
part is *tuning*, not coding. And crucially: since it's all deterministic and tick-based,
world simulation during your absence is the same code path as world simulation while
you're watching.

### DECIDED: full intrigue — which means characters exist from version 0.1.0

Succession, internal factions, plots, spies, and betrayal are in scope for 1.0. This is the
most consequential decision in the document, because **full intrigue cannot be bolted on
later.** Intrigue requires named characters with traits, ambitions, relationships, and
lifespans. A realm modeled as a bag of numbers can never grow an intrigue layer; a realm
modeled as a set of characters can grow one at any time.

**Therefore the schema requirement, effective immediately at 0.1.0:** realms are composed
of characters, not just resources. Even in 0.2.0 — where nothing in the UI shows a single
name — the data model contains rulers, heirs, advisors, and generals with traits and
opinions. The AI reads them for its decisions. The player never sees them until 0.6.0.

This costs very little now and saves a catastrophic rewrite later. It is non-negotiable and
the build prompt enforces it.

**Phasing:**

| Version | Intrigue capability |
|---|---|
| 0.1.0 | Character schema exists; unused by UI |
| 0.5.0 | Generals are characters; commander skill affects battle |
| 0.6.0 | Rulers, opinions, war/peace/alliance, AI personality from traits |
| 0.7.0 | Treaties, tribute, trade agreements, non-aggression pacts |
| 0.8.0 | Your own court: advisors, loyalty, ambition, factions within your realm |
| 0.9.0 | Plots, spies, assassination, succession, rival claims |
| 1.0.0 | Tuned, legible, and explained to the player

---

## 9. Themes and doctrines — identity without balance debt

You want a player to run knights, or cowboys, or a star empire, with none of them being
stronger. This is achievable and it's a genuine differentiator. It has to be designed in
from line one, though — retrofitting it is brutal.

### The mechanism: three orthogonal axes

```
UNIT ROLE        (mechanical)   — Line, Skirmish, Shock, Ranged, Siege, Support
ADVANCEMENT TIER (mechanical)   — T1 … T8, driven purely by progression
THEME SKIN       (cosmetic)     — name, sprite, sound, flavor text
```

A T4 Shock unit is mechanically a T4 Shock unit. Under a Templar theme it's a
"Knight Champion." Under a Frontier theme it's a "Rider Captain." Under a Star theme it's
a "Void Lancer." Same numbers, same role, same counters. Different art, different name,
different feel.

**Stable IDs are non-negotiable.** Internal identifiers (`unit.shock.t4`,
`building.economic.mint`) never change. Themes are lookup tables over those IDs. This is
what lets a player switch themes mid-run without corrupting a save, and it's what lets you
add a theme in a patch without touching game logic.

### Doctrines — where real mechanical variety goes

Realm Grinder's factions genuinely change how you play, and you'll want that. So mechanics
live primarily in a separate axis:

- **Theme** = cosmetics, plus exactly one signature perk (see below).
- **Doctrine** = the mechanical identity (Mercantile, Militant, Faithful, Industrious,
  Diplomatic, Shadow...). Chosen separately, with real trade-offs and its own unlock tree.

### DECIDED: hybrid themes — one signature perk each, drawn from a budgeted pool

You wanted themes to have some bite of their own, and that's fair — a pure skin feels
inert. The rule that keeps it from becoming a balance swamp:

**Every theme gets exactly one signature perk, selected from a pre-vetted perk pool, and
every perk in that pool is costed to the same power budget.**

So you are never balancing Templars against Cowboys against Star Empire. You are balancing
a small library of perk archetypes *once*, and themes draw from it. Adding a theme becomes
a content task (art + names + pick a perk), not a design task.

Example perk pool — each worth the same nominal budget:

| Perk archetype | Effect shape |
|---|---|
| Logistical | +% march speed, -% supply drain |
| Industrious | +% construction speed |
| Martial | +% morale floor in battle |
| Mercantile | +% trade income, -% building cost |
| Zealous | +% Loyalty regeneration |
| Frontier | +% output from newly claimed territory |

Feudal takes Martial, Frontier takes Frontier, Ascendant takes Industrious. Two themes may
share a perk — that's fine and even desirable, because it proves the axes are separate.

**The invariant that must never break:** no theme perk may exceed the budget, and no theme
perk may gate content. A player who picks a theme purely because they like cowboys must
never be mathematically behind. The build prompt states this as a hard rule.

A player can be Templars-with-Mercantile-doctrine or Cowboys-with-Mercantile-doctrine and
play identically. Or Templars-with-Militant and play completely differently from
Templars-with-Mercantile. That's a combinatorial content matrix from two small content
sets — exactly the kind of leverage a solo dev needs.

**Themes at 1.0: two.** **Feudal** (knights, the baseline) and **Frontier** (gunslingers).
**Ascendant** (sci-fi) ships as the 1.1.0 content patch — deliberately, so that adding a
theme post-launch proves the pipeline works. Then one per patch, forever. This is your
evergreen content engine and it costs art, not engineering.

---

## 10. Long-term content — "never able to rush through it"

You said you want content that lasts. That comes from layered systems, not volume of
hand-authored content, because you cannot out-author a studio.

| Mechanism | What it adds | Cost to build |
|---|---|---|
| **Exponential cost curves** | The backbone. Each tier costs more than the last | Trivial |
| **Prestige (Claim)** | Reset for permanent multipliers | Low |
| **Deep prestige (Legacy/Ascension)** | Reset the prestige layer itself, post-1.0 | Low |
| **Doctrine unlock trees** | Each doctrine has its own long tree | Medium |
| **Theme collection** | Unlockable cosmetic packs as reward currency sinks | Art only |
| **Challenge exiles** | Modified rulesets: no-army run, one-district run, hostile-world run | Low, huge value |
| **Achievement → Renown** | Hundreds of small goals feeding permanent points | Low |
| **The living world** | Emergent, infinite, never the same map twice | High (tuning) |
| **Escalating Usurper** | A rival that scales with you, run over run | Low |

The [design-of-waiting principle](https://gamedesign.gg/articles/idle-and-incremental-game-design/) —
that everything you own produces resource and everything next costs more than the last,
scaling exponentially on both sides — is the only math that sustains an idle game
indefinitely. Get that curve right and content longevity is nearly free; get it wrong and
no amount of features saves it.

---

## 11. Art direction

Pixel art, and you're right that it's the correct call — it sidesteps 3D pipelines
entirely and it's the one style where a solo dev with AI help can produce a coherent look.

- **Resolution discipline:** pick one pixel grid (recommend 32×32 for units/buildings,
  16×16 for icons) and never deviate. Mixed pixel densities are the #1 tell of amateur
  pixel art.
- **Palette discipline:** one master palette of ~32 colours, with per-theme accent
  ramps. This is what makes three wildly different themes feel like one game.
- **UI is the real art job.** Realm Grinder is 90% panels, tabs, numbers, and tooltips.
  Your UI legibility matters more than your unit sprites. Budget accordingly.
- **Placeholder-first, always.** Coloured rectangles with labels until a system is proven
  fun. Art is the last step, never the first.
- **Assets must be original or CC0.** Every third-party asset gets logged with source URL
  and license. No exceptions, no "I'll sort it out later."

---

## 12. Stack (locked)

Given: heavy UI, huge numbers, deterministic simulation, offline settlement, pixel 2D,
beginner developer, free hosting, and existing tooling you already have.

### TypeScript + Vite, React for UI, PixiJS for the battle/map view

Architecture in one line: **a pure, headless, deterministic simulation core in plain
TypeScript, with the UI as a thin renderer on top of it.**

```
packages/
  sim/     ← pure TS. No DOM, no React. All game rules, ticks, battle resolver, AI.
  ui/      ← React components. Reads sim state, dispatches intents. Renders nothing itself.
  render/  ← PixiJS canvas for the map and battle views.
  content/ ← JSON/TS data: buildings, units, themes, doctrines, curves. No logic.
  app/     ← Vite shell that wires it together.
```

**Why this is right for you:**

- **You already have TypeScript, React, Vite, Node.** Zero new learning surface for tooling.
- **Idle games are UI applications.** React is the most documented UI technology on earth,
  which matters enormously when your debugging ability is limited and your agents' training
  data is deepest here.
- **The pure `sim` package is the whole ballgame.** Because it's deterministic pure
  functions, you can: unit-test the economy with Vitest, run 10,000 simulated ticks in
  milliseconds for offline catch-up, replay battles from a seed, balance-test by simulating
  a hundred runs headlessly overnight, and later move it to a server unchanged.
- **Big numbers are solved.** [break_infinity.js](https://github.com/Patashu/break_infinity.js)
  handles magnitudes beyond 1e308 with speed prioritized over precision, which is exactly
  the tradeoff idle games need; [break_eternity.js](https://github.com/Patashu/break_eternity.js/)
  extends further if you ever need it. Both are native JS/TS. Use one from day one — never
  ship with native floats and try to migrate later.
- **Free hosting, instantly.** GitHub Pages, no backend, no cost, no accounts. A player
  clicks a link and is playing. For an idle game that is a real distribution advantage.
- **Ships to desktop later.** The same build wraps into Steam via Electron or Tauri
  without rewriting the game.

### The alternative I considered and rejected: Godot 4

Godot is a genuinely good engine and a big-number port exists for it
([break-nihility](https://godotengine.org/asset-library/asset/4359), MIT-licensed, ported
from break_infinity.js). If this were a platformer or an action game I'd say Godot without
hesitating.

I'm rejecting it here because: this game is a dense UI application first and a game second,
and Godot's UI system is far more laborious than React for the hundreds of panels, tabs,
tooltips, and scrolling lists this design needs. Web distribution is also weaker (Godot's
web export is heavy), and GDScript has a thinner AI training corpus than TypeScript. You'd
be fighting the engine for the 80% of this game that is menus.

### Explicitly not needed yet

Docker, Prisma, Ollama, Oracle Cloud, Lightning AI, any backend, any database, any
accounts, any cloud. A single-player idle game is a static bundle plus localStorage.
Adding infrastructure now buys nothing and adds many ways to get stuck. Revisit only if
you later want cloud saves or leaderboards — and even then, note that saves belong in
IndexedDB with an export-to-file button long before they belong in a database.

---

## 13. Scope: what 0.1.0 through 1.0.0 looks like

You chose the long haul, so the prompt will enforce a playable core early. The rule for
every version: **it must be playable and it must be fun to check in on.**

| Version | Milestone | Contains |
|---|---|---|
| **0.1.0** | Skeleton | Repo, docs, CI, deterministic tick loop, one resource, one building, save/load. Ugly. Runs. |
| **0.2.0** | The idle engine | 5 primary resources, ~12 buildings, exponential curves, offline settlement, big-number library. **This is the "is it satisfying?" gate.** |
| **0.3.0** | The kingdom | Free placement on the tile grid, adjacency scoring, all five building families, Loyalty and unrest |
| **0.4.0** | The army | Unit roles and tiers, recruitment, upkeep, Food ceiling, training queues |
| **0.5.0** | First blood, watchable | Battle resolver + **Watch mode** in PixiJS. One rival realm. First war. |
| **0.6.0** | The living world | 15+ AI realms as character-led courts, diplomacy, world tick, realms fighting each other |
| **0.7.0** | Command & treaties | Tactical decision points in battle, Report-mode summaries, treaties/tribute/pacts |
| **0.8.0** | Legacy & court | Prestige, Claim, the Return, unlock trees, the Usurper, your own advisors and internal factions |
| **0.9.0** | Intrigue & identity | Plots, spies, succession, rival claims; theme system with 2 themes, 3 doctrines, art pass, tutorial |
| **1.0.0** | Ship | Balance, accessibility, onboarding, achievements, public release |

**Cut from the MVP, deliberately, and tracked in the backlog:** multiplayer of any kind,
cloud saves, accounts, mobile app builds, simulated citizen agents or city pathfinding,
multiple player-laid-out cities, sieges as a distinct battle type, naval warfare, trade
caravans as physical units, mod support, Steam release, monetization.

**The one gate that matters:** if 0.2.0 isn't compelling to check in on with placeholder
rectangles and no war layer, the design is wrong and no amount of 0.5.0 makes it right.
Stop and fix the curves before proceeding. Everything after 0.2.0 is amplification of
whether that core is satisfying.

---

## 14. The three biggest risks

1. **Auto-resolve feeling arbitrary.** Highest risk in the project. Mitigation: morale-based
   deterministic resolver, seeded RNG with bounded variance, and detailed after-action
   reports that *show the reasoning*. Because you chose Watch mode first, the discipline
   that replaces "Report mode first" is **test coverage**: the resolver ships headless and
   fully unit-tested before a single sprite is animated over it, so the animation is never
   hiding a broken simulation.
2. **Balance across three layers.** Economy, army, and war each need curves, and they
   interact. Mitigation: the headless `sim` package. Write a script that plays the game
   1,000 times unattended and graphs progression. This is why the pure-simulation
   architecture is worth insisting on.
3. **Scope collapse.** This design is large. Mitigation: the version gates above, an
   honest backlog, and the phase-gate protocol in the build prompt.

---

## 15. Locked decisions and the risk plan

All five forks resolved. You chose the most ambitious option available in every case, which
is a legitimate choice for a long-haul project — but the four choices compound, and
compounding ambition is how solo projects die. Each decision is therefore paired with a
specific structural mitigation, and those mitigations are enforced by the build prompt.

| Decision | Chosen | Mitigation that makes it survivable |
|---|---|---|
| Kingdom | Free-placement city builder | Grid-snapped placement; occupancy array, not geometry; **zero citizen agents** |
| Themes | Hybrid — one perk each | Perks drawn from a budget-costed pool balanced once, not per theme |
| Battles | Watch mode first | Resolver still built headless and test-covered first; Watch mode is a replay of its event log |
| Diplomacy | Full intrigue | Character-based realm schema mandated at 0.1.0 so intrigue is never a retrofit |
| Title | Second Crown (working) | Internal name only; public title decided pre-launch after an availability check |

### The honest scope statement

With free placement, full intrigue, and three-mode battles, **1.0.0 is a multi-year
project at hobby pace.** That's not a reason to change course — it's a reason to be precise
about what "done" means along the way. So:

- **0.2.0 is the design verdict.** Placeholder rectangles, no war, no city layout. If
  checking in on it isn't satisfying, the curves are wrong and nothing later fixes that.
- **0.5.0 is your first shareable game.** Economy, city, army, and a watchable battle. This
  is the version you send to friends. Treat it as the real emotional milestone, not 1.0.
- **1.0.0 means the systems are complete,** not that content is exhausted. Themes,
  doctrines, and challenge modes keep growing after 1.0 forever.

### The scope trade, accepted

Something has to give, and it is breadth of content, not depth of systems:

- **Two themes at 1.0, not three.** Feudal and Frontier. Ascendant becomes the 1.1.0
  content patch — and proves the theme pipeline works by being added post-launch.
- **Three doctrines at 1.0, not six.** Mercantile, Militant, Diplomatic.
- **One city map at 1.0.** Your capital. Conquered territory is abstract holdings that feed
  resources, not additional cities you lay out by hand. Multi-city placement is post-1.0.
- **No naval, no sieges-as-distinct-battle-type, no multiplayer, ever, in 1.0.**

That trade is the right one: systems depth is what makes your game distinctive and is
nearly impossible to add later, while content breadth is cheap to add forever once the
pipelines exist.

### Next artifact

The master build prompt, rewritten around this document — see
`Second-Crown-Master-Build-Prompt.md`.
