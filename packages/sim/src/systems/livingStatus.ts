import type { GameState } from "@second-crown/shared";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { D } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";
import { ECONOMY_PRESSURE_HIGH_FILL, ECONOMY_PRESSURE_LOW_FILL } from "../content/livingRealm.js";
import { keepLevel } from "../actions/upgrade.js";
import { livingSwitches } from "./livingRealm.js";
import { storageCap } from "./storage.js";
import { fullStores } from "./storageHint.js";
import { computeIncomePerSecond } from "./economy.js";
import { upkeepPerTick } from "./upkeep.js";
import { RESEARCH, type ResearchId } from "./research.js";
import { DECREES } from "./decree.js";
import { activePlayerMarch } from "./march.js";

/**
 * Living Realm slice 16: compact system status for the HUD. Every function here is a pure
 * read. Some existing helpers (researchDone via the yield math) write a "study finished" flag
 * as a side effect, so those are called on a copy whose `flags` is a fresh object.
 */

/** Same state with its own flags object, so lazy flag writes inside a helper never land. */
function readCopy(state: GameState): GameState {
  return { ...state, flags: { ...state.flags } };
}

// ---------------------------------------------------------------- economy pressure

export type PressureLevel = "low" | "ok" | "high";

export interface EconomyPressure {
  foodPressure: PressureLevel;
  woodPressure: PressureLevel;
  stonePressure: PressureLevel;
  goldPressure: PressureLevel;
  /** Resources whose warehouse is full (storageHint.fullStores), in food, wood, stone, gold order. */
  fullStores: string[];
  /** The larder is bare: the same rule as the map's tired-host check (render isFoodStoresEmptyOrLow). */
  bareFood: boolean;
}

/**
 * Bare larder: no food, or no more than max(5, 50 ticks of army upkeep). Same rule and
 * numbers as `isFoodStoresEmptyOrLow` in packages/render (the sim cannot import render).
 */
export function isBareFood(state: GameState): boolean {
  const food = Number(state.resources.food ?? "0");
  if (!Number.isFinite(food) || food <= 0) return true;
  return food <= Math.max(5, upkeepPerTick(state) * 50);
}

type StoreRes = "food" | "wood" | "stone" | "gold";

/** Net per second the pressure line reads: building income per store; food minus army upkeep. */
function netRates(state: GameState): Record<StoreRes, number> & { foodUpkeep: number } {
  const income = computeIncomePerSecond(readCopy(state));
  const foodUpkeep = upkeepPerTick(state) * TICKS_PER_SECOND;
  const per = (res: StoreRes) => D(income[res] ?? "0").toNumber();
  return { food: per("food") - foodUpkeep, wood: per("wood"), stone: per("stone"), gold: per("gold"), foodUpkeep };
}

/**
 * Shortage pressure per capped store, from stores vs cap and the current net per second
 * (building income; food also pays army upkeep):
 *   high = under ECONOMY_PRESSURE_HIGH_FILL of cap and net <= 0 (food: also whenever the larder is bare),
 *   low  = at or over ECONOMY_PRESSURE_LOW_FILL of cap and net >= 0,
 *   ok   = anything else.
 * Null with living_economy_status off. Yields, trade and caps untouched.
 */
export function economyPressureSnapshot(state: GameState): EconomyPressure | null {
  if (!livingSwitches(state).economyStatus) return null;
  const rates = netRates(state);
  const bareFood = isBareFood(state);
  const level = (res: StoreRes): PressureLevel => {
    if (res === "food" && bareFood) return "high";
    const have = D(state.resources[res] ?? "0").toNumber();
    const cap = storageCap(state, res);
    const fill = cap > 0 ? have / cap : 1;
    const net = rates[res];
    if (fill < ECONOMY_PRESSURE_HIGH_FILL && net <= 0) return "high";
    if (fill >= ECONOMY_PRESSURE_LOW_FILL && net >= 0) return "low";
    return "ok";
  };
  return {
    foodPressure: level("food"),
    woodPressure: level("wood"),
    stonePressure: level("stone"),
    goldPressure: level("gold"),
    fullStores: fullStores(state).map((f) => f.res),
    bareFood,
  };
}

// ---------------------------------------------------------------- economy yields (slice 17)

export interface EconomyYields {
  /** Net food per second: building income minus army upkeep (can be negative). */
  foodPerSec: number;
  woodPerSec: number;
  stonePerSec: number;
  goldPerSec: number;
  /** Army food upkeep per second (already taken out of foodPerSec). */
  foodUpkeep: number;
}

/**
 * Slice 17: the exact net rates economyPressureSnapshot judges by (same netRates helper), so
 * the HUD can print numbers beside the pressure words. Gross food = foodPerSec + foodUpkeep.
 * Null with living_economy_yields off. Yield, upkeep and storage formulas untouched.
 */
export function economyYieldsSnapshot(state: GameState): EconomyYields | null {
  if (!livingSwitches(state).economyYields) return null;
  const r = netRates(state);
  return { foodPerSec: r.food, woodPerSec: r.wood, stonePerSec: r.stone, goldPerSec: r.gold, foodUpkeep: r.foodUpkeep };
}

// ---------------------------------------------------------------- research progress

export interface ResearchActive {
  id: ResearchId;
  name: string;
  ticksLeft: number;
  totalTicks: number;
}

export interface ResearchProgress {
  /** The open study, or null when the lectern is free. */
  active: ResearchActive | null;
  /** Studies known (flagged done, or their finish tick has passed). */
  completedCount: number;
  /** Name of the first study in table order the player could start now (cost aside), or null. */
  nextAvailable: string | null;
}

/** Done without writing the flag (researchDone writes it lazily). */
function studyKnown(state: GameState, id: string): boolean {
  if (Number(state.flags[`research_${id}`] ?? 0) === 1) return true;
  const until = Number(state.flags[`research_${id}_until`] ?? 0);
  return until > 0 && state.meta.tick >= until;
}

/**
 * The player's lectern: open study, count of known studies, next study that could start.
 * nextAvailable skips known and open studies, and needs the Keep level, the prerequisite
 * and one of the study's buildings; it ignores cost and the one-study-at-a-time lock.
 * Null with living_research_status off. Research pacing and costs untouched.
 */
export function researchProgressSnapshot(state: GameState): ResearchProgress | null {
  if (!livingSwitches(state).researchStatus) return null;
  const ids = Object.keys(RESEARCH) as ResearchId[];
  let active: ResearchActive | null = null;
  let completedCount = 0;
  for (const id of ids) {
    if (studyKnown(state, id)) {
      completedCount++;
      continue;
    }
    const until = Number(state.flags[`research_${id}_until`] ?? 0);
    if (!active && until > state.meta.tick) {
      const total = Number(state.flags[`research_${id}_total`] ?? 0) || RESEARCH[id].ticks;
      active = { id, name: RESEARCH[id].name, ticksLeft: until - state.meta.tick, totalTicks: total };
    }
  }
  const keep = keepLevel(state);
  let nextAvailable: string | null = null;
  for (const id of ids) {
    if (studyKnown(state, id) || active?.id === id) continue;
    const def = RESEARCH[id] as (typeof RESEARCH)[ResearchId] & { requires?: string };
    if (keep < def.keepMin) continue;
    if (def.requires && !studyKnown(state, def.requires)) continue;
    if (!def.needsAny.some((t) => countBuilding(state, t) >= 1)) continue;
    nextAvailable = def.name;
    break;
  }
  return { active, completedCount, nextAvailable };
}

// ---------------------------------------------------------------- court status

export interface CourtDecreeRef {
  id: string;
  name: string;
  startedTick: number;
  active: boolean;
}

export interface CourtStatus {
  /** Ids of running decrees, in DECREES order. */
  activeDecrees: string[];
  /** Decrees that could be sworn now (one of each at a time): DECREES.length - active. */
  openSlots: number;
  /** The decree sworn most recently (from its stored end tick), or null if none ever was. */
  lastDecree: CourtDecreeRef | null;
}

/**
 * Royal decrees at a glance. Null when the player has no court (no player character) or with
 * living_court_status off. lastDecree reads `decree_<id>_until` minus the decree's length;
 * ties go to the earlier entry in DECREES. Decree costs, lengths and effects untouched.
 */
export function courtStatusSnapshot(state: GameState): CourtStatus | null {
  if (!livingSwitches(state).courtStatus) return null;
  if (!state.characters.some((c) => c.realmId === "player")) return null;
  const tick = state.meta.tick;
  const activeDecrees: string[] = [];
  let lastDecree: CourtDecreeRef | null = null;
  for (const d of DECREES) {
    const until = Number(state.flags[`decree_${d.id}_until`] ?? 0);
    if (!until) continue;
    const active = until > tick;
    if (active) activeDecrees.push(d.id);
    const startedTick = until - d.ticks;
    if (!lastDecree || startedTick > lastDecree.startedTick) {
      lastDecree = { id: d.id, name: d.name, startedTick, active };
    }
  }
  return { activeDecrees, openSlots: DECREES.length - activeDecrees.length, lastDecree };
}

// ---------------------------------------------------------------- board feedback

export interface BoardFeedbackProvince {
  id: string;
  x: number;
  y: number;
  node: string;
  ownerRealmId: string | null;
  isHome: boolean;
}

export interface PendingMarch {
  id: string;
  fromId: string;
  toId: string;
  arrivesInTicks: number;
  kind: string;
  purpose: string | null;
}

export interface BoardFeedback {
  selectedProvince: BoardFeedbackProvince | null;
  lastInspected: BoardFeedbackProvince | null;
  pendingMarch: PendingMarch | null;
}

/** What the app currently has selected / last inspected. Selection lives in the app, not the sim. */
export interface BoardView {
  selectedProvinceId?: string | null;
  lastInspectedProvinceId?: string | null;
}

/**
 * Board interaction feedback. Selection is app state, so the app passes the ids it holds;
 * unknown or missing ids give null. pendingMarch is the player's column on the road
 * (activePlayerMarch), or null. Null with living_board_feedback off. Selection and
 * pathfinding untouched.
 */
export function boardFeedbackSnapshot(state: GameState, view: BoardView = {}): BoardFeedback | null {
  if (!livingSwitches(state).boardFeedback) return null;
  const find = (id: string | null | undefined): BoardFeedbackProvince | null => {
    if (!id) return null;
    const p = state.board.provinces.find((q) => q.id === id);
    if (!p) return null;
    return { id: p.id, x: p.x, y: p.y, node: p.node, ownerRealmId: p.occupantRealmId, isHome: p.id === state.board.homeProvinceId };
  };
  const m = activePlayerMarch(state);
  return {
    selectedProvince: find(view.selectedProvinceId),
    lastInspected: find(view.lastInspectedProvinceId),
    pendingMarch: m
      ? {
          id: m.id,
          fromId: m.fromId,
          toId: m.toId,
          arrivesInTicks: Math.max(0, m.arrivesTick - state.meta.tick),
          kind: m.kind,
          purpose: m.purpose ?? null,
        }
      : null,
  };
}
