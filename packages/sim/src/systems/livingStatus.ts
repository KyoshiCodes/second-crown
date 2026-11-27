import type { CitizenJobId, GameState } from "@second-crown/shared";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { D } from "../core/decimal.js";
import { countBuilding, getBuildingType } from "../content/buildings.js";
import {
  ACADEMY_NOTE_BUILDING,
  ACADEMY_NOTE_EARLY,
  ACADEMY_NOTE_IDLE,
  BOARD_NEARBY_FRIENDLY_CAP,
  BOARD_NEARBY_RADIUS,
  COURT_GUIDANCE_FULL,
  DECREE_EFFECTS,
  DECREE_SUGGESTIONS,
  DECREE_SUGGEST_SAVE,
  INSPECT_MARCH_CAP,
  INSPECT_NODE_NAMES,
  INSPECT_NOTE_CAMP,
  INSPECT_NOTE_CAP,
  INSPECT_NOTE_DEPLETED,
  INSPECT_NOTE_HOME,
  INSPECT_NOTE_OUTPOST,
  INSPECT_NOTE_RIVAL,
  INSPECT_NOTE_THREAT,
  INSPECT_NOTE_WORKED,
  INSPECT_OUTPOST_CAP,
  JOB_SUMMARY_BUILDING_CAP,
  STAFFING_NOTE_ASSIGN,
  STAFFING_NOTE_SHORT,
  STAFFING_NOTE_SPARE,
  COURT_GUIDANCE_IDLE,
  ECONOMY_PRESSURE_HIGH_FILL,
  ECONOMY_PRESSURE_LOW_FILL,
  RESEARCH_NEXT_UNLOCKS_CAP,
  STUDY_EFFECT_CAP,
  STUDY_EFFECTS,
  YIELD_BREAKDOWN_CAP,
} from "../content/livingRealm.js";
import { keepLevel } from "../actions/upgrade.js";
import { friendlyRealmIds, livingSwitches } from "./livingRealm.js";
import { storageCap } from "./storage.js";
import { fullStores } from "./storageHint.js";
import { computeIncomePerSecond, incomeSourcesPerTick, staffBonus } from "./economy.js";
import { upkeepPerTick } from "./upkeep.js";
import { RESEARCH, academyReady, type ResearchId } from "./research.js";
import { DECREES } from "./decree.js";
import { activePlayerMarch, listMarches } from "./march.js";
import { GATHER_NODES, listGathers } from "./gather.js";
import { nodeStock, nodeStockMax } from "./nodeStock.js";
import { listOutposts } from "./outpost.js";
import { settlementName } from "../actions/settlement.js";
import { jobForBuildingType } from "./citizens.js";
import { CITIZEN_JOBS } from "../content/citizens.js";
import { emptyStaffWorks } from "./staffHint.js";

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

const STORES: StoreRes[] = ["food", "wood", "stone", "gold"];

/** Stores over cap, as a fraction (1 when the cap is 0). */
function storeFill(state: GameState, res: StoreRes): number {
  const have = D(state.resources[res] ?? "0").toNumber();
  const cap = storageCap(state, res);
  return cap > 0 ? have / cap : 1;
}

/** The one low/ok/high rule, shared by economyPressureSnapshot and storagePressureDetailSnapshot. */
function pressureLevel(res: StoreRes, fill: number, net: number, bareFood: boolean): PressureLevel {
  if (res === "food" && bareFood) return "high";
  if (fill < ECONOMY_PRESSURE_HIGH_FILL && net <= 0) return "high";
  if (fill >= ECONOMY_PRESSURE_LOW_FILL && net >= 0) return "low";
  return "ok";
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
  const level = (res: StoreRes): PressureLevel => pressureLevel(res, storeFill(state, res), rates[res], bareFood);
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

// ---------------------------------------------------------------- yield breakdown (slice 18)

export interface YieldSource {
  /** Building type id, or "trade_routes", "outpost_tithe", "labor". */
  id: string;
  name: string;
  perSec: number;
}

export type YieldBreakdown = Record<StoreRes, YieldSource[]>;

/**
 * Slice 18: who makes each resource. Gross income only (army upkeep is a drain, not a source,
 * so food sources sum to foodPerSec + foodUpkeep). Buildings are grouped by type; trade routes,
 * outpost tithe and labor are one source each. Only sources with perSec > 0, highest first
 * (ties by id), at most YIELD_BREAKDOWN_CAP per resource. Uncapped, each list sums to the
 * matching economyYieldsSnapshot rate. With living_yield_breakdown off, all four lists are
 * empty. Yield formulas untouched.
 */
export function economyYieldBreakdownSnapshot(state: GameState): YieldBreakdown {
  const out: YieldBreakdown = { food: [], wood: [], stone: [], gold: [] };
  if (!livingSwitches(state).yieldBreakdown) return out;
  for (const src of incomeSourcesPerTick(readCopy(state))) {
    if (!(STORES as string[]).includes(src.res)) continue;
    const perSec = src.perTick.mul(TICKS_PER_SECOND).toNumber();
    if (!(perSec > 0)) continue;
    out[src.res as StoreRes].push({ id: src.id, name: src.name, perSec });
  }
  for (const res of STORES) {
    out[res].sort((a, b) => b.perSec - a.perSec || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    out[res] = out[res].slice(0, YIELD_BREAKDOWN_CAP);
  }
  return out;
}

// ---------------------------------------------------------------- storage pressure detail (slice 18)

export interface StoragePressureDetail {
  resource: StoreRes;
  /** Stores over cap, 0-100 (100 when the cap is 0; can pass 100 if stores sit over cap). */
  percentFull: number;
  /** The same net economyPressureSnapshot judges by (food net of army upkeep). */
  netPerSec: number;
  /** Same low/ok/high as economyPressureSnapshot's matching field. */
  status: PressureLevel;
}

/**
 * Slice 18: the numbers behind each pressure word, in food, wood, stone, gold order. Same fill,
 * net and rule as economyPressureSnapshot. Empty with living_storage_detail off.
 * Caps and yields untouched.
 */
export function storagePressureDetailSnapshot(state: GameState): StoragePressureDetail[] {
  if (!livingSwitches(state).storageDetail) return [];
  const rates = netRates(state);
  const bareFood = isBareFood(state);
  return STORES.map((res) => {
    const fill = storeFill(state, res);
    return { resource: res, percentFull: fill * 100, netPerSec: rates[res], status: pressureLevel(res, fill, rates[res], bareFood) };
  });
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
  return boardFeedbackCore(state, view);
}

/** boardFeedbackSnapshot without its switch; shared with boardInteractionDetailSnapshot. */
function boardFeedbackCore(state: GameState, view: BoardView): BoardFeedback {
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

// ---------------------------------------------------------------- research detail (slice 19)

export interface ResearchRef {
  id: ResearchId;
  name: string;
}

export interface ResearchUnlock {
  id: ResearchId;
  name: string;
  /** What is still missing, in plain words ("Keep II", a study name, "Farm or Granary"). Empty: could start now (cost aside). */
  requires: string[];
}

export interface ResearchDetail {
  /** Same as researchProgressSnapshot.active. */
  active: ResearchActive | null;
  /** Known studies, in table order. */
  completed: ResearchRef[];
  /** Studies at most one gate away, fewest gaps first then table order, at most RESEARCH_NEXT_UNLOCKS_CAP. */
  nextUnlocks: ResearchUnlock[];
}

const ROMAN = ["", "I", "II", "III", "IV", "V"];

/** Gates a study still lacks: Keep level, prerequisite study, one of its buildings. Cost and the one-at-a-time lock ignored. */
function missingGates(state: GameState, id: ResearchId, keep: number): string[] {
  const def = RESEARCH[id] as (typeof RESEARCH)[ResearchId] & { requires?: ResearchId };
  const out: string[] = [];
  if (keep < def.keepMin) out.push(`Keep ${ROMAN[def.keepMin] ?? def.keepMin}`);
  if (def.requires && !studyKnown(state, def.requires)) out.push(RESEARCH[def.requires].name);
  if (!def.needsAny.some((t) => countBuilding(state, t) >= 1)) {
    out.push(def.needsAny.map((t) => getBuildingType(t)?.name ?? t).join(" or "));
  }
  return out;
}

/**
 * Slice 19: the lectern in more detail. active matches researchProgressSnapshot; completed lists
 * known studies; nextUnlocks lists unknown, not-open studies missing at most one gate (same gates
 * as nextAvailable), fewest gaps first, ties in table order, capped. Null with
 * living_research_detail off. Research pacing, costs and gates untouched.
 */
export function researchDetailSnapshot(state: GameState): ResearchDetail | null {
  if (!livingSwitches(state).researchDetail) return null;
  const ids = Object.keys(RESEARCH) as ResearchId[];
  const tick = state.meta.tick;
  let active: ResearchActive | null = null;
  const completed: ResearchRef[] = [];
  for (const id of ids) {
    if (studyKnown(state, id)) {
      completed.push({ id, name: RESEARCH[id].name });
      continue;
    }
    const until = Number(state.flags[`research_${id}_until`] ?? 0);
    if (!active && until > tick) {
      const total = Number(state.flags[`research_${id}_total`] ?? 0) || RESEARCH[id].ticks;
      active = { id, name: RESEARCH[id].name, ticksLeft: until - tick, totalTicks: total };
    }
  }
  const keep = keepLevel(state);
  const candidates: (ResearchUnlock & { order: number })[] = [];
  ids.forEach((id, order) => {
    if (studyKnown(state, id) || active?.id === id) return;
    const requires = missingGates(state, id, keep);
    if (requires.length <= 1) candidates.push({ id, name: RESEARCH[id].name, requires, order });
  });
  candidates.sort((a, b) => a.requires.length - b.requires.length || a.order - b.order);
  const nextUnlocks = candidates.slice(0, RESEARCH_NEXT_UNLOCKS_CAP).map(({ id, name, requires }) => ({ id, name, requires }));
  return { active, completed, nextUnlocks };
}

// ---------------------------------------------------------------- court detail (slice 19)

export interface CourtActiveDecree {
  id: string;
  name: string;
  ticksLeft: number;
}

export interface CourtDetail {
  /** Running decrees, in DECREES order. */
  active: CourtActiveDecree[];
  /** Same as courtStatusSnapshot.openSlots. */
  openSlots: number;
  /** COURT_GUIDANCE_IDLE with none in force, COURT_GUIDANCE_FULL with all in force, else null. */
  guidance: string | null;
}

/**
 * Slice 19: running decrees with time left. Null when the player has no court (no player
 * character) or with living_court_detail off. Decree costs, lengths and effects untouched.
 */
export function courtDetailSnapshot(state: GameState): CourtDetail | null {
  if (!livingSwitches(state).courtDetail) return null;
  if (!state.characters.some((c) => c.realmId === "player")) return null;
  const tick = state.meta.tick;
  const active: CourtActiveDecree[] = [];
  for (const d of DECREES) {
    const until = Number(state.flags[`decree_${d.id}_until`] ?? 0);
    if (until > tick) active.push({ id: d.id, name: d.name, ticksLeft: until - tick });
  }
  const openSlots = DECREES.length - active.length;
  const guidance = active.length === 0 ? COURT_GUIDANCE_IDLE : openSlots === 0 ? COURT_GUIDANCE_FULL : null;
  return { active, openSlots, guidance };
}

// ---------------------------------------------------------------- board interaction detail (slice 19)

export interface BoardInteractionDetail {
  selected: BoardFeedbackProvince | null;
  lastInspected: BoardFeedbackProvince | null;
  pendingMarch: PendingMarch | null;
  /** Friendly realms (friendlyPresenceSnapshot's rule) holding a province within BOARD_NEARBY_RADIUS steps of selected. state.realms order, capped. */
  nearbyFriendly: string[];
}

/**
 * Slice 19: board feedback plus who is friendly nearby. selected / lastInspected / pendingMarch
 * read exactly as boardFeedbackSnapshot (its own switch aside). nearbyFriendly is empty with no
 * selection. Null with living_board_detail off. Selection, presence and pathfinding untouched.
 */
export function boardInteractionDetailSnapshot(state: GameState, view: BoardView = {}): BoardInteractionDetail | null {
  if (!livingSwitches(state).boardDetail) return null;
  const fb = boardFeedbackCore(state, view);
  const sel = fb.selectedProvince;
  let nearbyFriendly: string[] = [];
  if (sel) {
    const near = new Set<string>();
    for (const p of state.board.provinces) {
      if (p.occupantRealmId && Math.abs(p.x - sel.x) + Math.abs(p.y - sel.y) <= BOARD_NEARBY_RADIUS) near.add(p.occupantRealmId);
    }
    nearbyFriendly = friendlyRealmIds(state).filter((id) => near.has(id)).slice(0, BOARD_NEARBY_FRIENDLY_CAP);
  }
  return { selected: sel, lastInspected: fb.lastInspected, pendingMarch: fb.pendingMarch, nearbyFriendly };
}

// ---------------------------------------------------------------- research progress detail (slice 20)

export interface ResearchProgressDetail {
  activeId: ResearchId;
  name: string;
  /** Whole percent done, 0-100 (floored, clamped). */
  percent: number;
  ticksLeft: number;
  totalTicks: number;
}

/** The open study, same scan as researchProgressSnapshot (first unknown study in table order whose finish tick is ahead). */
function openStudy(state: GameState): ResearchActive | null {
  const tick = state.meta.tick;
  for (const id of Object.keys(RESEARCH) as ResearchId[]) {
    if (studyKnown(state, id)) continue;
    const until = Number(state.flags[`research_${id}_until`] ?? 0);
    if (until > tick) {
      const total = Number(state.flags[`research_${id}_total`] ?? 0) || RESEARCH[id].ticks;
      return { id, name: RESEARCH[id].name, ticksLeft: until - tick, totalTicks: total };
    }
  }
  return null;
}

/**
 * Slice 20: the open study as a progress bar. Null when nothing is being studied or with
 * living_research_progress off. ticksLeft / totalTicks match researchProgressSnapshot.active.
 * Pacing untouched.
 */
export function researchProgressDetailSnapshot(state: GameState): ResearchProgressDetail | null {
  if (!livingSwitches(state).researchProgress) return null;
  const a = openStudy(state);
  if (!a) return null;
  const raw = a.totalTicks > 0 ? ((a.totalTicks - a.ticksLeft) / a.totalTicks) * 100 : 0;
  const percent = Math.max(0, Math.min(100, Math.floor(raw)));
  return { activeId: a.id, name: a.name, percent, ticksLeft: a.ticksLeft, totalTicks: a.totalTicks };
}

// ---------------------------------------------------------------- study effect preview (slice 20)

export interface StudyEffectPreview {
  id: ResearchId;
  name: string;
  /** Plain-language outcomes from STUDY_EFFECTS, at most STUDY_EFFECT_CAP. */
  effects: string[];
}

/**
 * Slice 20: what a study does once known. Null for an unknown id or with living_study_preview
 * off. Effects come from the fixed STUDY_EFFECTS table (mirrors live code). Pure read.
 */
export function studyEffectPreviewSnapshot(state: GameState, studyId: string): StudyEffectPreview | null {
  if (!livingSwitches(state).studyPreview) return null;
  if (!Object.prototype.hasOwnProperty.call(RESEARCH, studyId)) return null;
  const id = studyId as ResearchId;
  return { id, name: RESEARCH[id].name, effects: (STUDY_EFFECTS[id] ?? []).slice(0, STUDY_EFFECT_CAP) };
}

// ---------------------------------------------------------------- academy feedback (slice 20)

export interface AcademyFeedback {
  /** The player has a finished Academy. */
  built: boolean;
  /** A finished player Academy has staff (staffBonus > 1). The Academy takes no citizen job today, so this reads false. */
  staffed: boolean;
  /** The 20% study-length bonus applies to new studies (academyReady, researchDuration's rule). */
  bonusActive: boolean;
  /** ACADEMY_NOTE_BUILDING / ACADEMY_NOTE_IDLE / ACADEMY_NOTE_EARLY, else null. */
  note: string | null;
}

/**
 * Slice 20: Academy status. Null when the player has no Academy (finished or underway) or with
 * living_academy_feedback off. bonusActive reads academyReady, the same rule researchDuration
 * uses. Academy math untouched.
 */
export function academyFeedbackSnapshot(state: GameState): AcademyFeedback | null {
  if (!livingSwitches(state).academyFeedback) return null;
  const mine = state.buildings.filter((b) => b.realmId === "player" && b.typeId === "academy");
  if (mine.length === 0) return null;
  const done = mine.filter((b) => b.completesAtTick === null);
  const built = done.length > 0;
  const staffed = done.some((b) => staffBonus(state, b) > 1);
  const bonusActive = academyReady(state);
  let note: string | null = null;
  if (!built) note = ACADEMY_NOTE_BUILDING;
  else {
    const a = openStudy(state);
    if (!a) note = ACADEMY_NOTE_IDLE;
    else if (bonusActive && a.totalTicks === RESEARCH[a.id].ticks) note = ACADEMY_NOTE_EARLY;
  }
  return { built, staffed, bonusActive, note };
}

// ---------------------------------------------------------------- decree effect summary (slice 21)

export interface DecreeEffect {
  id: string;
  name: string;
  /** Fixed DECREE_EFFECTS line. */
  effect: string;
}

export interface DecreeEffectSummary {
  /** Decrees in force, DECREES order, never more than DECREES.length. */
  active: DecreeEffect[];
  /** Same as courtDetailSnapshot.openSlots. */
  openSlots: number;
  /** First open, affordable decree's DECREE_SUGGESTIONS line; DECREE_SUGGEST_SAVE if none is affordable; null when every decree is in force. */
  suggestion: string | null;
}

/**
 * Slice 21: running decrees with what they do. Null with no court (no player character) or with
 * living_decree_effects off. Same active scan as courtDetailSnapshot. Decree math untouched.
 */
export function decreeEffectSummarySnapshot(state: GameState): DecreeEffectSummary | null {
  if (!livingSwitches(state).decreeEffects) return null;
  if (!state.characters.some((c) => c.realmId === "player")) return null;
  const tick = state.meta.tick;
  const active: DecreeEffect[] = [];
  let suggestion: string | null = null;
  let anyOpen = false;
  for (const d of DECREES) {
    const until = Number(state.flags[`decree_${d.id}_until`] ?? 0);
    if (until > tick) {
      active.push({ id: d.id, name: d.name, effect: DECREE_EFFECTS[d.id] ?? d.blurb });
      continue;
    }
    anyOpen = true;
    const affordable = Object.entries(d.cost).every(([res, amt]) => D(state.resources[res] ?? "0").gte(D(amt)));
    if (affordable && suggestion === null) suggestion = DECREE_SUGGESTIONS[d.id] ?? null;
  }
  if (anyOpen && suggestion === null) suggestion = DECREE_SUGGEST_SAVE;
  const capped = active.slice(0, DECREES.length);
  return { active: capped, openSlots: DECREES.length - capped.length, suggestion };
}

// ---------------------------------------------------------------- inspect detail (slice 21)

export interface InspectStock {
  /** GATHER_NODES[node].resource. */
  resource: string;
  /** nodeStock. */
  have: number;
  /** nodeStockMax. */
  max: number;
}

export interface InspectMarch {
  id: string;
  /** March kind ("camp" | "node" | "hold"), as boardFeedbackSnapshot.pendingMarch.kind. */
  kind: string;
  /** Ticks until arrival, never negative. */
  eta: number;
}

export interface InspectDetail {
  id: string;
  /** settlementName on the home hold, else INSPECT_NODE_NAMES[node]. */
  name: string;
  /** Raw terrain id. */
  terrain: string;
  /** Gather nodes only, else null. */
  stock: InspectStock | null;
  /** Outposts (listOutposts, any realm) on or within BOARD_NEARBY_RADIUS of the tile, board order, capped. BoardFeedbackProvince shape. */
  outposts: BoardFeedbackProvince[];
  /** Marches (any realm) heading to the tile, soonest first then id, capped. */
  marches: InspectMarch[];
  /** Fixed INSPECT_NOTE_* lines in priority order, capped. */
  notes: string[];
}

/**
 * Slice 21: richer inspect card data for one province. Null for an unknown id or with
 * living_inspect_detail off. Fog is not applied here (the app already gates unseen tiles).
 * Pure read: no lazy flag writes. Pathfinding and inspect rules untouched.
 */
export function inspectDetailSnapshot(state: GameState, provinceId: string): InspectDetail | null {
  if (!livingSwitches(state).inspectDetail) return null;
  const p = state.board.provinces.find((q) => q.id === provinceId);
  if (!p) return null;
  const homeId = state.board.homeProvinceId;
  const isHome = p.id === homeId;
  const tick = state.meta.tick;

  const gatherDef = Object.prototype.hasOwnProperty.call(GATHER_NODES, p.node)
    ? GATHER_NODES[p.node as keyof typeof GATHER_NODES]
    : null;
  const stock: InspectStock | null = gatherDef
    ? { resource: gatherDef.resource, have: nodeStock(state, p.id), max: nodeStockMax(p.node) }
    : null;

  const realms = new Set<string>();
  for (const q of state.board.provinces) if (q.occupantRealmId) realms.add(q.occupantRealmId);
  const outpostIds = new Set<string>();
  for (const r of realms) for (const o of listOutposts(state, r)) outpostIds.add(o.id);
  const outposts: BoardFeedbackProvince[] = state.board.provinces
    .filter((q) => outpostIds.has(q.id) && Math.abs(q.x - p.x) + Math.abs(q.y - p.y) <= BOARD_NEARBY_RADIUS)
    .slice(0, INSPECT_OUTPOST_CAP)
    .map((q) => ({ id: q.id, x: q.x, y: q.y, node: q.node, ownerRealmId: q.occupantRealmId, isHome: q.id === homeId }));

  const inbound = listMarches(state).filter((m) => m.toId === p.id);
  const marches: InspectMarch[] = inbound
    .map((m) => ({ id: m.id, kind: m.kind, eta: Math.max(0, m.arrivesTick - tick) }))
    .sort((a, b) => a.eta - b.eta || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, INSPECT_MARCH_CAP);

  const notes: string[] = [];
  if (isHome) notes.push(INSPECT_NOTE_HOME);
  else if (p.occupantRealmId === "player" && outpostIds.has(p.id)) notes.push(INSPECT_NOTE_OUTPOST);
  else if (p.occupantRealmId && p.occupantRealmId !== "player") notes.push(INSPECT_NOTE_RIVAL);
  if (p.node === "camp") notes.push(INSPECT_NOTE_CAMP);
  if (inbound.some((m) => m.realmId !== "player")) notes.push(INSPECT_NOTE_THREAT);
  if (listGathers(state).some((g) => g.toId === p.id && g.phase !== "returning")) notes.push(INSPECT_NOTE_WORKED);
  if (stock && stock.have <= 0) notes.push(INSPECT_NOTE_DEPLETED);

  return {
    id: p.id,
    name: isHome ? settlementName(state) : INSPECT_NODE_NAMES[p.node] ?? p.node,
    terrain: p.terrain,
    stock,
    outposts,
    marches,
    notes: notes.slice(0, INSPECT_NOTE_CAP),
  };
}

// ---------------------------------------------------------------- job summary (slice 22)

export interface JobBuilding {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface JobSummaryEntry {
  id: CitizenJobId;
  name: string;
  /** Player citizens holding this job. */
  count: number;
  /** Finished player works that take this job (jobForBuildingType), board order, cap JOB_SUMMARY_BUILDING_CAP. */
  buildings: JobBuilding[];
}

export interface JobSummary {
  /** Player citizens with no trade ("unassigned"). */
  idle: number;
  /** Real jobs (CITIZEN_JOBS order, "unassigned" excluded) with a worker or a finished work; never more than the job count. */
  byJob: JobSummaryEntry[];
}

/**
 * Slice 22: who does what. Null with no player citizens or living_job_summary off.
 * Pure read; assignment rules untouched.
 */
export function jobSummarySnapshot(state: GameState): JobSummary | null {
  if (!livingSwitches(state).jobSummary) return null;
  const people = state.citizens.filter((c) => c.realmId === "player");
  if (people.length === 0) return null;
  const works = state.buildings.filter((b) => b.realmId === "player" && b.completesAtTick === null);
  const byJob: JobSummaryEntry[] = [];
  for (const job of Object.values(CITIZEN_JOBS)) {
    if (job.id === "unassigned") continue;
    const count = people.filter((c) => c.job === job.id).length;
    const all = works.filter((b) => jobForBuildingType(b.typeId) === job.id);
    if (count === 0 && all.length === 0) continue;
    byJob.push({
      id: job.id,
      name: job.name,
      count,
      buildings: all.slice(0, JOB_SUMMARY_BUILDING_CAP).map((b) => ({
        id: b.id,
        name: getBuildingType(b.typeId)?.name ?? b.typeId,
        x: b.x,
        y: b.y,
      })),
    });
  }
  return { idle: people.filter((c) => c.job === "unassigned").length, byJob };
}

// ---------------------------------------------------------------- staffing pressure (slice 22)

export interface StaffingPressure {
  /** Finished player works with no matching worker on their tile (emptyStaffWorks, the staff hint's rule). */
  emptyBuildings: number;
  /** Player citizens with no trade. */
  idleVillagers: number;
  /** STAFFING_NOTE_ASSIGN / STAFFING_NOTE_SHORT / STAFFING_NOTE_SPARE, else null. */
  note: string | null;
}

/**
 * Slice 22: empty works vs idle hands. Null when both are zero or living_staffing_pressure is
 * off. Pure read; citizen and staff math untouched.
 */
export function staffingPressureSnapshot(state: GameState): StaffingPressure | null {
  if (!livingSwitches(state).staffingPressure) return null;
  const emptyBuildings = emptyStaffWorks(state).length;
  const idleVillagers = state.citizens.filter((c) => c.realmId === "player" && c.job === "unassigned").length;
  if (emptyBuildings === 0 && idleVillagers === 0) return null;
  let note: string | null = null;
  if (emptyBuildings > 0 && idleVillagers > 0) note = STAFFING_NOTE_ASSIGN;
  else if (emptyBuildings > 0) note = STAFFING_NOTE_SHORT;
  else note = STAFFING_NOTE_SPARE;
  return { emptyBuildings, idleVillagers, note };
}
