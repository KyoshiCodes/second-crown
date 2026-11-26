import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { D } from "../core/decimal.js";
import { canAfford, tryBuild } from "../actions/build.js";
import { canAffordTrain, tryTrain } from "../actions/train.js";
import { getBuildingType } from "../content/buildings.js";
import { canRaiseWork } from "../systems/housing.js";
import { keepLevel, listUpgrades, maxLevelFor, tryUpgrade, upgradeCost } from "../actions/upgrade.js";
import { RESEARCH, researchDone, tryStartResearch, type ResearchId } from "../systems/research.js";
import { storageCap } from "../systems/storage.js";
import { computeIncomePerSecond } from "../systems/economy.js";
import { allOfType, freeSlot, playerUnitCount, queuedCount } from "./playtestHarness.js";
import { raidStage } from "../systems/raidPressure.js";
import type { RaidStageId } from "../content/raids.js";

/**
 * Progression measurement harness. A low-touch "builder" bot plays a fresh realm
 * from the first farm toward Keep III through the public sim actions and reports
 * how long each Keep took, which studies it got and when, what it waited on, and
 * what its stores looked like at each Keep. Measure only: it never edits a table.
 *
 * Deterministic: fixed seed, fixed bot cadence, settleTicks between turns (the
 * same batching offline catch-up uses, which matches tick-by-tick).
 */

export interface ProgressionOptions {
  seed?: number;
  /** Stop after this many ticks even if Keep III never finishes. Default 8 game hours. */
  maxTicks?: number;
  /** Ticks between bot turns. Default 200 (20 s): a player who checks in now and then. */
  turnEvery?: number;
  /** Stop once this Keep level is finished. Default 3. */
  targetKeep?: number;
}

export interface StoreShape {
  label: string;
  tick: number;
  keep: number;
  /** Whole units on hand. */
  stores: Record<string, number>;
  /** Warehouse caps for the four capped stores. */
  caps: Record<string, number>;
  /** Per second, rounded to 0.1. */
  income: Record<string, number>;
  militia: number;
}

export interface Bottleneck {
  /** What the bot was saving for, e.g. "keep II" or "study horse". */
  goal: string;
  /** The store that would take longest to fill, "warehouse <res>" if the cost is over the cap, or "timer". */
  limiter: string;
  ticks: number;
}

export interface ProgressionReport {
  seed: number;
  ticksRun: number;
  turnEvery: number;
  reachedKeep: number;
  /** Tick each Keep level finished, null if it never did. */
  keepAt: Record<1 | 2 | 3, number | null>;
  studies: { id: string; startTick: number; doneTick: number | null }[];
  /** Top waits, longest first. */
  bottlenecks: Bottleneck[];
  shape: StoreShape[];
  raids: {
    total: number;
    held: number;
    breached: number;
    longestBreachRun: number;
    firstTick: number | null;
    /** Raids by the raid stage the hold was in when the bot next looked (content/raids.ts). */
    byStage: Record<RaidStageId, { held: number; breached: number }>;
  };
}

const CAPPED = ["food", "wood", "stone", "gold"] as const;
/** Cap-raising building per store (mirrors systems/storage.ts). */
const CAP_BUILDING: Record<string, string> = { food: "granary", wood: "sawmill", stone: "mason", gold: "mint" };
const PRODUCERS = ["farm", "lumber_camp", "quarry", "gold_mine", "watchtower"];
/** Studies in the order a careful player takes them. Each is tried once its Keep, building and prerequisite allow. */
const STUDY_ORDER: ResearchId[] = ["husbandry", "masonry", "forestry", "drill", "horse", "logistics", "crop_rotation", "quartermastery"];
const MILITIA_BASE = 16;
const MILITIA_PER_KEEP = 4;

function num(v: string | undefined): number {
  return D(v ?? "0").toNumber();
}

function hasAll(state: GameState, cost: Record<string, string>): boolean {
  return Object.entries(cost).every(([r, n]) => num(state.resources[r]) >= num(n));
}

function buildCost(typeId: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [r, n] of Object.entries(getBuildingType(typeId)?.cost ?? {})) out[r] = n ?? "0";
  return out;
}

/** The store that limits a cost: over the cap first, then the longest fill at current income. */
function limiterFor(state: GameState, cost: Record<string, string>): string {
  const income = computeIncomePerSecond(state);
  let worst = "";
  let worstSec = -1;
  for (const [r, n] of Object.entries(cost)) {
    const need = num(n);
    if (need > storageCap(state, r)) return `warehouse ${r}`;
    const short = need - num(state.resources[r]);
    if (short <= 0) continue;
    const rate = num(income[r]);
    const sec = rate > 0 ? short / rate : Number.MAX_SAFE_INTEGER;
    if (sec > worstSec) {
      worstSec = sec;
      worst = r;
    }
  }
  return worst || "none";
}

function shape(state: GameState, label: string): StoreShape {
  const stores: Record<string, number> = {};
  const caps: Record<string, number> = {};
  const income: Record<string, number> = {};
  const inc = computeIncomePerSecond(state);
  for (const r of CAPPED) {
    stores[r] = Math.floor(num(state.resources[r]));
    caps[r] = storageCap(state, r);
    income[r] = Math.round(num(inc[r]) * 10) / 10;
  }
  return { label, tick: state.meta.tick, keep: keepLevel(state), stores, caps, income, militia: playerUnitCount(state, "militia") };
}

function build(state: GameState, typeId: string, rim = false): boolean {
  if (!canAfford(state, typeId)) return false;
  const slot = freeSlot(state, typeId, rim);
  return slot ? tryBuild(state, { typeId, ...slot }) : false;
}

function playerKeep(state: GameState) {
  return state.buildings.find((b) => b.realmId === "player" && b.typeId === "keep");
}

function upgrading(state: GameState, buildingId: string): boolean {
  return listUpgrades(state).some((j) => j.buildingId === buildingId);
}

function studyOpen(state: GameState): boolean {
  return Object.keys(RESEARCH).some((id) => {
    const until = Number(state.flags[`research_${id}_until`] ?? 0);
    return until > state.meta.tick && !researchDone(state, id);
  });
}

interface Wait {
  goal: string;
  limiter: string;
}

/**
 * One bot turn. Walks a fixed priority list; a "saving" step that cannot be paid
 * stops the walk so cheaper steps below it do not eat its stores. Returns what
 * the bot is waiting on, or null if nothing blocked it this turn.
 */
function builderTurn(state: GameState, studies: ProgressionReport["studies"]): Wait | null {
  const keep = keepLevel(state);
  const keepB = playerKeep(state);

  // 1. Beds and plots: a cottage whenever work plots are full.
  if (!canRaiseWork(state) && allOfType(state, "cottage") < 3 + keep * 2) build(state, "cottage");

  // 2. Starter works.
  for (const [typeId, n] of [["farm", 3], ["lumber_camp", 2], ["quarry", 2]] as const) {
    if (allOfType(state, typeId) < n && canRaiseWork(state)) {
      if (!build(state, typeId)) return { goal: `build ${typeId}`, limiter: limiterFor(state, buildCost(typeId)) };
    }
  }

  // 3. Home guard: militia scale with the Keep, four at a time.
  const militia = playerUnitCount(state, "militia") + queuedCount(state, "militia");
  if (militia < MILITIA_BASE + keep * MILITIA_PER_KEEP && canAffordTrain(state, "militia", 4)) {
    tryTrain(state, { typeId: "militia", count: 4 });
  }

  // 4. One rim wall and a watchtower (the early gold source).
  if (allOfType(state, "walls") < 1 && !build(state, "walls", true)) return { goal: "build walls", limiter: limiterFor(state, buildCost("walls")) };
  if (allOfType(state, "watchtower") < 1 && !build(state, "watchtower", freeSlot(state, "watchtower", true) !== null)) {
    return { goal: "build watchtower", limiter: limiterFor(state, buildCost("watchtower")) };
  }

  // 5. Cheap studies whenever the lectern is free (never blocks).
  if (!studyOpen(state)) {
    for (const id of STUDY_ORDER) {
      if (researchDone(state, id)) continue;
      if (tryStartResearch(state, id)) {
        studies.push({ id, startTick: state.meta.tick, doneTick: null });
        break;
      }
    }
  }

  // 6. The Keep itself.
  if (!keepB) {
    if (!build(state, "keep")) return { goal: "keep I", limiter: limiterFor(state, buildCost("keep")) };
    return null;
  }
  if (keepB.completesAtTick !== null) return { goal: "keep I", limiter: "timer" };

  // 7. Support works the Keep II studies and gold need.
  if (allOfType(state, "gold_mine") < 1 && canRaiseWork(state) && !build(state, "gold_mine")) {
    return { goal: "build gold_mine", limiter: limiterFor(state, buildCost("gold_mine")) };
  }
  if (allOfType(state, "barracks") < 1 && !build(state, "barracks")) return { goal: "build barracks", limiter: limiterFor(state, buildCost("barracks")) };

  // 8. Keep upgrade: save for it; raise a storehouse first if a cost is over the cap.
  let keepWait: Wait | null = null;
  if (upgrading(state, keepB.id)) {
    keepWait = { goal: `keep ${roman(keep + 1)}`, limiter: "timer" };
  } else {
    const cost = upgradeCost(state, keepB.id);
    if (cost) {
      for (const [r, n] of Object.entries(cost)) {
        if (num(n) > storageCap(state, r) && allOfType(state, CAP_BUILDING[r]) < 3) {
          if (!build(state, CAP_BUILDING[r])) return { goal: `build ${CAP_BUILDING[r]}`, limiter: limiterFor(state, buildCost(CAP_BUILDING[r])) };
        }
      }
      if (!(hasAll(state, cost) && tryUpgrade(state, keepB.id))) {
        return { goal: `keep ${roman(keep + 1)}`, limiter: limiterFor(state, cost) };
      }
      keepWait = { goal: `keep ${roman(keep + 1)}`, limiter: "timer" };
    }
  }

  // 9. While the Keep timer runs: lift producers to the Keep's cap, cheapest first.
  const producers = state.buildings
    .filter((b) => b.realmId === "player" && PRODUCERS.includes(b.typeId) && b.completesAtTick === null && !upgrading(state, b.id))
    .filter((b) => b.level < maxLevelFor(state, b.typeId))
    .sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));
  for (const b of producers) {
    const cost = upgradeCost(state, b.id);
    if (cost && hasAll(state, cost)) tryUpgrade(state, b.id);
  }
  return keepWait;
}

function roman(n: number): string {
  return ["0", "I", "II", "III", "IV", "V"][n] ?? String(n);
}

export function runProgression(options: ProgressionOptions = {}): ProgressionReport {
  const seed = options.seed ?? 20260930;
  const maxTicks = options.maxTicks ?? 8 * 36_000;
  const turnEvery = options.turnEvery ?? 200;
  const targetKeep = options.targetKeep ?? 3;

  // Same start as the app's freshState and the playtest bot.
  const state = createGameState({ seed, now: 1, withStarterBuildings: true });
  state.resources.wood = "40";
  state.resources.food = "50";
  const engine = new TickEngine(state);

  const keepAt: ProgressionReport["keepAt"] = { 1: null, 2: null, 3: null };
  const studies: ProgressionReport["studies"] = [];
  const waits = new Map<string, Bottleneck>();
  const shapes: StoreShape[] = [shape(state, "start")];
  const byStage: ProgressionReport["raids"]["byStage"] = {
    unwalled: { held: 0, breached: 0 },
    walled: { held: 0, breached: 0 },
    keep2: { held: 0, breached: 0 },
    keep3: { held: 0, breached: 0 },
  };
  const isSiege = (w: GameState["wars"][number]) => w.id.startsWith("w_siege_") && w.defenderRealmId === "player";
  let siegesSeen = 0;

  while (state.meta.tick < maxTicks) {
    const wait = builderTurn(state, studies);
    if (wait) {
      const key = `${wait.goal}|${wait.limiter}`;
      const row = waits.get(key) ?? { goal: wait.goal, limiter: wait.limiter, ticks: 0 };
      row.ticks += turnEvery;
      waits.set(key, row);
    }
    engine.settleTicks(Math.min(turnEvery, maxTicks - state.meta.tick));

    const sieges = state.wars.filter(isSiege);
    for (const w of sieges.slice(siegesSeen)) byStage[raidStage(state).id][w.status === "defender_won" ? "held" : "breached"] += 1;
    siegesSeen = sieges.length;
    for (const s of studies) if (s.doneTick === null && researchDone(state, s.id)) s.doneTick = state.meta.tick;
    const k = keepLevel(state);
    for (let lv = 1; lv <= Math.min(3, k); lv++) {
      const key = lv as 1 | 2 | 3;
      if (keepAt[key] === null) {
        keepAt[key] = state.meta.tick;
        shapes.push(shape(state, `keep ${roman(lv)}`));
      }
    }
    if (k >= targetKeep) break;
  }
  shapes.push(shape(state, "end"));

  const sieges = state.wars.filter(isSiege);
  let run = 0;
  let longest = 0;
  for (const w of sieges) {
    run = w.status === "defender_won" ? 0 : run + 1;
    longest = Math.max(longest, run);
  }

  return {
    seed,
    ticksRun: state.meta.tick,
    turnEvery,
    reachedKeep: keepLevel(state),
    keepAt,
    studies,
    bottlenecks: [...waits.values()].sort((a, b) => b.ticks - a.ticks || a.goal.localeCompare(b.goal)).slice(0, 6),
    shape: shapes,
    raids: {
      total: sieges.length,
      held: sieges.filter((w) => w.status === "defender_won").length,
      breached: sieges.filter((w) => w.status !== "defender_won").length,
      longestBreachRun: longest,
      firstTick: sieges[0]?.startedTick ?? null,
      byStage,
    },
  };
}

function clock(ticks: number | null): string {
  if (ticks === null) return "—";
  const m = Math.floor(ticks / 600);
  return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m` : `${m}m`;
}

/** Short, stable text report. No timestamps: the same sim gives the same lines. */
export function progressionText(r: ProgressionReport): string {
  const out: string[] = [];
  out.push(`Progression (seed ${r.seed}, bot turn every ${r.turnEvery} ticks): reached Keep ${roman(r.reachedKeep)} in ${clock(r.ticksRun)}.`);
  out.push(`Keep: I ${clock(r.keepAt[1])} · II ${clock(r.keepAt[2])} · III ${clock(r.keepAt[3])}`);
  out.push(`Studies: ${r.studies.map((s) => `${s.id} ${clock(s.doneTick)}`).join(", ") || "none"}`);
  out.push(`Waits: ${r.bottlenecks.map((b) => `${b.goal} on ${b.limiter} ${clock(b.ticks)}`).join("; ") || "none"}`);
  for (const s of r.shape) {
    const st = CAPPED.map((k) => `${k} ${s.stores[k]}/${s.caps[k]} (+${s.income[k]}/s)`).join(", ");
    out.push(`At ${s.label} (${clock(s.tick)}): ${st}; militia ${s.militia}`);
  }
  out.push(
    `Raids: ${r.raids.total} on the hold, ${r.raids.held} held, ${r.raids.breached} breached, longest breach run ${r.raids.longestBreachRun}.`
  );
  const stages = Object.entries(r.raids.byStage)
    .filter(([, v]) => v.held + v.breached > 0)
    .map(([k, v]) => `${k} ${v.held} held / ${v.breached} breached`);
  if (stages.length) out.push(`Raids by stage: ${stages.join(", ")}.`);
  return out.join("\n");
}
