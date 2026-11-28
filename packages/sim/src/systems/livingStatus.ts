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
  TRAINING_NOTE_IDLE,
  TRAINING_NOTE_FULL,
  UNIT_UNLOCK_CAP,
  UNIT_REQUIRES_FALLBACK,
  RELATIONSHIP_GIFT_RECENT,
  RELATIONSHIP_GIFT_OLD,
  RELATIONSHIP_GIFT_RECENT_TICKS,
  RELATIONSHIP_WARM_OPINION,
  RELATIONSHIP_SUGGEST_WAR,
  RELATIONSHIP_SUGGEST_CAP,
  RELATIONSHIP_SUGGEST_GIFT,
  RELATIONSHIP_SUGGEST_SAVE,
  COLUMN_STATUS_CAP,
  COLUMN_NOTE_THREAT,
  COLUMN_NOTE_MORE,
  MARCH_ETA_CAP,
  BATTLE_NOTE_RECENT_TICKS,
  BATTLE_NOTE_WON,
  BATTLE_NOTE_LOST,
  BATTLE_NOTE_OTHERS,
  BATTLE_SUGGEST_WON,
  BATTLE_SUGGEST_LOST,
  CLASH_FORCE_CAP,
  CLASH_OUTCOME_WON,
  CLASH_OUTCOME_LOST,
  CLASH_OUTCOME_OTHERS,
  CLASH_NOTE_COSTLY,
  CLASH_NOTE_CLEAN,
  UNIT_WAITING_CAP,
  SURFACE_ELEVATION,
  SURFACE_ELEVATION_DEFAULT,
  SURFACE_FOG_CLEAR,
  SURFACE_FOG_VEILED,
  SURFACE_KEEP_HOME,
  SURFACE_KEEP_RIVAL,
  SURFACE_KEEP_EMPTY,
  SURFACE_MARCH_ENEMY,
  SURFACE_MARCH_OWN,
  SURFACE_MARCH_LEAVING,
  SELECTION_NOTE_HOME,
  SELECTION_NOTE_VEILED,
  SELECTION_NOTE_OWN,
  SELECTION_NOTE_RIVAL,
  SELECTION_NOTE_OPEN,
  BATTLE_FEEDBACK_NOTE_WON,
  BATTLE_FEEDBACK_NOTE_LOST,
  BATTLE_FEEDBACK_NOTE_OTHERS,
  BATTLE_FEEDBACK_MARK_WON,
  BATTLE_FEEDBACK_MARK_LOST,
  BATTLE_FEEDBACK_MARK_OTHERS,
  POLISH_MARCH_ENEMY,
  POLISH_MARCH_OWN,
  POLISH_MARCH_LEAVING,
  POLISH_KEEP_HOME,
  POLISH_KEEP_RIVAL,
  POLISH_KEEP_EMPTY,
  BUILDING_TIER_LABELS,
  BUILDING_WORK_STATIONS,
  BUILDING_NOTE_BUILDING,
  BUILDING_NOTE_UPGRADING,
  BUILDING_NOTE_NO_STATION,
  BUILDING_NOTE_STAFFED,
  BUILDING_NOTE_UNSTAFFED,
  BOARD_SCALE_SMALL_TILES,
  BOARD_SCALE_MID_TILES,
  BOARD_SCALE_NOTE_SMALL,
  BOARD_SCALE_NOTE_MID,
  BOARD_SCALE_NOTE_WIDE,
  BUILDING_LIFE_TIER_ELEMENTS,
  BUILDING_LIFE_MOTION_SCAFFOLD,
  BUILDING_LIFE_MOTION_HAMMERS,
  BUILDING_LIFE_MOTION_WORK,
  BUILDING_LIFE_NOTE_BUILDING,
  BUILDING_LIFE_NOTE_UPGRADING,
  BUILDING_LIFE_NOTE_NO_STATION,
  BUILDING_LIFE_NOTE_STAFFED,
  BUILDING_LIFE_NOTE_UNSTAFFED,
  WORK_STATION_STAGED,
  WORK_STATION_NOTE_BUILDING,
  WORK_STATION_NOTE_UPGRADING,
  WORK_STATION_NOTE_STAFFED,
  WORK_STATION_NOTE_EMPTY,
  BOARD_BAND_SMALL,
  BOARD_BAND_MID,
  BOARD_BAND_WIDE,
  BOARD_EXPANSION_NOTE_PLANNED,
  BOARD_EXPANSION_NOTE_WIDEST,
  BUILDING_VARIETY,
  BUILDING_VARIETY_DEFAULT,
  BUILDING_VARIETY_TIER_DETAIL,
  BUILDING_VARIETY_NOTE_BUILDING,
  BUILDING_VARIETY_NOTE_UPGRADING,
  BUILDING_VARIETY_NOTE_TOP,
  BUILDING_VARIETY_NOTE_GROWING,
  WORK_STATION_BENEFIT_LABEL,
  WORK_STATION_BENEFIT_NOTE_ACTIVE,
  WORK_STATION_BENEFIT_NOTE_BUILDING,
  WORK_STATION_BENEFIT_NOTE_UPGRADING,
  WORK_STATION_BENEFIT_NOTE_EMPTY,
  ENVIRONMENT_FEATURES,
  ENVIRONMENT_AMBIENT,
  ENVIRONMENT_NOTE,
  WORK_STATION_DEPTH_LABEL,
  WORK_STATION_DEPTH_MIN_LEVEL,
  WORK_STATION_DEPTH_NOTE_ACTIVE,
  WORK_STATION_DEPTH_NOTE_BUILDING,
  WORK_STATION_DEPTH_NOTE_UPGRADING,
  WORK_STATION_DEPTH_NOTE_LOW_TIER,
  WORK_STATION_DEPTH_NOTE_EMPTY,
  WORK_STATION_DEPTH_NOTE_NO_BASE,
  EXTRA_BUILDINGS,
  EXTRA_BUILDING_DETAIL_UPGRADING,
  EXTRA_BUILDING_DETAIL_SMALL,
  EXTRA_BUILDING_DETAIL_FULL,
  EXTRA_BUILDING_FULL_LEVEL,
  EXTRA_BUILDING_NOTE_BUILDING,
  EXTRA_BUILDING_NOTE_UPGRADING,
  EXTRA_BUILDING_NOTE_STANDING,
  ENVIRONMENT_MOOD_OPEN,
  ENVIRONMENT_MOOD_RESTLESS,
  ENVIRONMENT_MOOD_SOFT,
  ENVIRONMENT_MOOD_STILL,
  STATION_PAIR_NOTE_ALONE,
  STATION_PAIR_NOTE_BUILDING,
  STATION_PAIR_NOTE_LEAD,
  STATION_PAIR_NOTE_TWIN,
  COURT_GUIDANCE_IDLE,
  ECONOMY_PRESSURE_HIGH_FILL,
  ECONOMY_PRESSURE_LOW_FILL,
  RESEARCH_NEXT_UNLOCKS_CAP,
  STUDY_EFFECT_CAP,
  STUDY_EFFECTS,
  YIELD_BREAKDOWN_CAP,
} from "../content/livingRealm.js";
import { keepLevel, upgradeJobFor } from "../actions/upgrade.js";
import { friendlyRealmIds, livingSwitches, nameOf, relationshipStanceWith, type RelationshipStance } from "./livingRealm.js";
import { storageCap } from "./storage.js";
import { fullStores } from "./storageHint.js";
import { computeIncomePerSecond, incomeSourcesPerTick, staffBonus, stationPairBonus, stationPairState, workStationBonus, workStationDepthBonus } from "./economy.js";
import { weatherFor } from "./weather.js";
import { currentSeason } from "./age.js";
import { upkeepPerTick } from "./upkeep.js";
import { RESEARCH, academyReady, unitUnlocked, type ResearchId } from "./research.js";
import { DECREES } from "./decree.js";
import { activePlayerMarch, listMarches, type March } from "./march.js";
import { forcePower } from "./column.js";
import { lastBattleStory } from "./lastBattle.js";
import { getWorldLog } from "./events.js";
import { listGarrisons } from "./garrison.js";
import { isProvinceSeen } from "./fog.js";
import { GATHER_NODES, listGathers } from "./gather.js";
import { nodeStock, nodeStockMax } from "./nodeStock.js";
import { listOutposts } from "./outpost.js";
import { settlementName } from "../actions/settlement.js";
import { jobForBuildingType } from "./citizens.js";
import { CITIZEN_JOBS } from "../content/citizens.js";
import { emptyStaffWorks } from "./staffHint.js";
import { listTraining, trainingQueueCap } from "./training.js";
import { hallRoomBuilt } from "./hallBonus.js";
import { getUnitType } from "../content/units.js";
import { listRosterUnitTypes } from "./cultureUnits.js";
import { giftOffer, opinionOfPlayerFromRealm } from "../actions/diplomacy.js";

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

// ---------------------------------------------------------------- training progress (slice 23)

export interface TrainingActive {
  /** Training job id (tr_N). */
  id: string;
  /** Unit name. */
  name: string;
  ticksLeft: number;
  totalTicks: number;
}

export interface TrainingQueued {
  /** Training job id (tr_N). */
  id: string;
  /** Unit name. */
  name: string;
  count: number;
}

export interface TrainingProgress {
  /** The player job under way now (started, not done), or null. */
  active: TrainingActive | null;
  /** Player jobs waiting behind it, start order. */
  queue: TrainingQueued[];
  /** TRAINING_NOTE_IDLE (no jobs), TRAINING_NOTE_FULL (queue at keep cap), else null. */
  note: string | null;
}

/**
 * Slice 23: the player's training yard. Null with no finished player Barracks (the Hall's Yard
 * room) or living_training_progress off. Reads training_json; training math untouched.
 */
export function trainingProgressSnapshot(state: GameState): TrainingProgress | null {
  if (!livingSwitches(state).trainingProgress) return null;
  if (!hallRoomBuilt(state, "yard")) return null;
  const tick = state.meta.tick;
  const jobs = listTraining(state, "player")
    .map((j, i) => ({ j, i }))
    .sort((a, b) => a.j.startedTick - b.j.startedTick || a.i - b.i)
    .map(({ j }) => j);
  const unitName = (typeId: string) => getUnitType(typeId)?.name ?? typeId;
  const head = jobs[0];
  const running = head && head.startedTick <= tick && head.doneTick > tick ? head : null;
  const active: TrainingActive | null = running
    ? {
        id: running.id,
        name: unitName(running.typeId),
        ticksLeft: running.doneTick - tick,
        totalTicks: Math.max(1, running.doneTick - running.startedTick),
      }
    : null;
  const queue = jobs.filter((j) => j !== running).map((j) => ({ id: j.id, name: unitName(j.typeId), count: j.count }));
  let note: string | null = null;
  if (jobs.length === 0) note = TRAINING_NOTE_IDLE;
  else if (jobs.length >= trainingQueueCap(state, "player")) note = TRAINING_NOTE_FULL;
  return { active, queue, note };
}

// ---------------------------------------------------------------- unit unlocks (slice 23)

export interface UnitReady {
  id: string;
  name: string;
}

export interface UnitLocked {
  id: string;
  name: string;
  /** "Needs <study name>." from the study whose RESEARCH.unlocks lists the unit. */
  requires: string;
}

export interface UnitUnlocks {
  /** Roster units the player can train now (unitUnlocked), roster order, cap UNIT_UNLOCK_CAP. */
  ready: UnitReady[];
  /** Roster units still gated, roster order, cap UNIT_UNLOCK_CAP. */
  locked: UnitLocked[];
}

/**
 * Slice 23: what the crown can train and what is still gated. Roster = listRosterUnitTypes
 * (base units, this crown's kit unit, the ironclad). Null with living_unit_unlocks off or an
 * empty roster. Unlock rules untouched (unitUnlocked runs on a read copy).
 */
export function unitUnlockSnapshot(state: GameState): UnitUnlocks | null {
  if (!livingSwitches(state).unitUnlocks) return null;
  const roster = listRosterUnitTypes(state);
  if (roster.length === 0) return null;
  const copy = readCopy(state);
  const ready: UnitReady[] = [];
  const locked: UnitLocked[] = [];
  for (const u of roster) {
    if (unitUnlocked(copy, u.id)) {
      if (ready.length < UNIT_UNLOCK_CAP) ready.push({ id: u.id, name: u.name });
    } else if (locked.length < UNIT_UNLOCK_CAP) {
      const study = Object.values(RESEARCH).find((r) => (r.unlocks as readonly string[]).includes(u.id));
      locked.push({ id: u.id, name: u.name, requires: study ? `Needs ${study.name}.` : UNIT_REQUIRES_FALLBACK });
    }
  }
  return { ready, locked };
}

// ---------------------------------------------------------------- relationship detail (slice 23)

export interface RelationshipDetail {
  /** Their ruler's opinion of the player (-100..100), 0 with no ruler. */
  opinion: number;
  /** Same rule as the World tab summary: war, pact, peace, neutral. */
  stance: RelationshipStance;
  /** RELATIONSHIP_GIFT_RECENT / RELATIONSHIP_GIFT_OLD from the gift input log, else null. */
  lastGift: string | null;
  /** A fixed RELATIONSHIP_SUGGEST_* line, else null. */
  suggestion: string | null;
}

/**
 * Slice 23: one realm's standing with the player. Null for an unknown realm, the player itself,
 * or living_relationship_detail off. Pure read; diplomacy and gift math untouched.
 */
export function relationshipDetailSnapshot(state: GameState, realmId: string): RelationshipDetail | null {
  if (!livingSwitches(state).relationshipDetail) return null;
  if (realmId === "player" || !state.realms.some((r) => r.id === realmId)) return null;
  const tick = state.meta.tick;
  const copy = readCopy(state);
  const opinion = opinionOfPlayerFromRealm(copy, realmId);
  const stance = relationshipStanceWith(copy, realmId, tick);
  let giftTick: number | null = null;
  for (const rec of state.inputLog) {
    if (rec.type !== "gift" || rec.tick > tick) continue;
    const to = (rec.payload as { to?: unknown } | undefined)?.to;
    if (to === realmId && (giftTick === null || rec.tick > giftTick)) giftTick = rec.tick;
  }
  const lastGift =
    giftTick === null ? null : tick - giftTick <= RELATIONSHIP_GIFT_RECENT_TICKS ? RELATIONSHIP_GIFT_RECENT : RELATIONSHIP_GIFT_OLD;
  const offer = giftOffer(copy, realmId);
  let suggestion: string | null = null;
  if (stance === "war") suggestion = RELATIONSHIP_SUGGEST_WAR;
  else if (offer.block === "at_cap") suggestion = RELATIONSHIP_SUGGEST_CAP;
  else if (offer.block !== "no_ruler" && opinion < RELATIONSHIP_WARM_OPINION)
    suggestion = offer.ok ? RELATIONSHIP_SUGGEST_GIFT : RELATIONSHIP_SUGGEST_SAVE;
  return { opinion, stance, lastGift, suggestion };
}

// ---------------------------------------------------------------- column status (slice 24)

export interface ColumnStatusEntry {
  /** March id. */
  id: string;
  /** Realm name of the column's owner. */
  name: string;
  /** March kind: camp, node or hold. */
  kind: March["kind"];
  /** Destination province id. */
  destination: string;
  /** Ticks until arrival, never below 0. */
  ticksLeft: number;
  /** Column power, the sum march arrival uses (forcePower, else levy times militia power). */
  strength: number;
}

export interface ColumnStatus {
  /** Columns on the road, soonest first (id breaks ties), cap COLUMN_STATUS_CAP. */
  columns: ColumnStatusEntry[];
  /** COLUMN_NOTE_THREAT (rival column on a player province), COLUMN_NOTE_MORE (over cap), else null. */
  note: string | null;
}

function marchStrength(m: March): number {
  return m.force ? forcePower(m.force) : (m.levy ?? 0) * (getUnitType("militia")?.power ?? 1);
}

function byEta<T extends { id: string; ticksLeft: number }>(a: T, b: T): number {
  return a.ticksLeft - b.ticksLeft || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/**
 * Slice 24: every column on the board (marches_json), soonest first. Null with no columns or
 * living_column_status off. Pure read; column and march math untouched.
 */
export function columnStatusSnapshot(state: GameState): ColumnStatus | null {
  if (!livingSwitches(state).columnStatus) return null;
  const list = listMarches(state);
  if (list.length === 0) return null;
  const tick = state.meta.tick;
  const all = list
    .map((m) => ({
      id: m.id,
      name: nameOf(state, m.realmId),
      kind: m.kind,
      destination: m.toId,
      ticksLeft: Math.max(0, m.arrivesTick - tick),
      strength: marchStrength(m),
    }))
    .sort(byEta);
  const held = new Set(state.board.provinces.filter((p) => p.occupantRealmId === "player").map((p) => p.id));
  held.add(state.board.homeProvinceId);
  let note: string | null = null;
  if (list.some((m) => m.realmId !== "player" && held.has(m.toId))) note = COLUMN_NOTE_THREAT;
  else if (all.length > COLUMN_STATUS_CAP) note = COLUMN_NOTE_MORE;
  return { columns: all.slice(0, COLUMN_STATUS_CAP), note };
}

// ---------------------------------------------------------------- march ETA detail (slice 24)

export interface MarchEtaEntry {
  /** March id. */
  id: string;
  kind: March["kind"];
  /** Ticks until arrival, never below 0. */
  ticksLeft: number;
}

export interface MarchEta {
  /** Marches heading to this province, soonest first, cap MARCH_ETA_CAP. */
  incoming: MarchEtaEntry[];
  /** Marches that set out from this province, soonest first, cap MARCH_ETA_CAP. */
  outgoing: MarchEtaEntry[];
}

/**
 * Slice 24: marches to and from one province. Null for an unknown province or living_march_eta
 * off. Pure read; pathfinding and travel time untouched.
 */
export function marchEtaSnapshot(state: GameState, provinceId: string): MarchEta | null {
  if (!livingSwitches(state).marchEta) return null;
  if (!state.board.provinces.some((p) => p.id === provinceId)) return null;
  const tick = state.meta.tick;
  const list = listMarches(state);
  const pick = (ms: March[]): MarchEtaEntry[] =>
    ms
      .map((m) => ({ id: m.id, kind: m.kind, ticksLeft: Math.max(0, m.arrivesTick - tick) }))
      .sort(byEta)
      .slice(0, MARCH_ETA_CAP);
  return {
    incoming: pick(list.filter((m) => m.toId === provinceId)),
    outgoing: pick(list.filter((m) => m.fromId === provinceId)),
  };
}

// ---------------------------------------------------------------- battle outcome notes (slice 24)

export interface BattleOutcomeNote {
  /** The last battle: tick of the newest "battle" world-log entry and a fixed BATTLE_NOTE_* line. */
  last: { tick: number; text: string } | null;
  /** BATTLE_SUGGEST_WON / BATTLE_SUGGEST_LOST when the player fought, else null. */
  suggestion: string | null;
}

/** Tick of the newest "battle" world-log entry, or null when none is within BATTLE_NOTE_RECENT_TICKS. */
function recentBattleTick(state: GameState): number | null {
  const tick = state.meta.tick;
  let at: number | null = null;
  for (const ev of getWorldLog(state)) {
    if (ev.id === "battle" && ev.tick <= tick && (at === null || ev.tick > at)) at = ev.tick;
  }
  if (at === null || tick - at > BATTLE_NOTE_RECENT_TICKS) return null;
  return at;
}

/**
 * Slice 24: a short note on the last battle (last_battle_json). Null with no stored battle, no
 * "battle" world-log entry within BATTLE_NOTE_RECENT_TICKS, or living_battle_notes off.
 * Pure read; combat math untouched.
 */
export function battleOutcomeNoteSnapshot(state: GameState): BattleOutcomeNote | null {
  if (!livingSwitches(state).battleNotes) return null;
  const story = lastBattleStory(state);
  if (!story) return null;
  const at = recentBattleTick(state);
  if (at === null) return null;
  if (story.winnerId === "player") return { last: { tick: at, text: BATTLE_NOTE_WON }, suggestion: BATTLE_SUGGEST_WON };
  if (story.loserId === "player") return { last: { tick: at, text: BATTLE_NOTE_LOST }, suggestion: BATTLE_SUGGEST_LOST };
  return { last: { tick: at, text: BATTLE_NOTE_OTHERS }, suggestion: null };
}

// ---------------------------------------------------------------- clash result detail (slice 25)

export interface ClashForce {
  side: "attacker" | "defender";
  /** Realm name of that side. */
  name: string;
  /** Power at muster, as the battle used it. */
  strength: number;
  /** Men lost in the clash. */
  casualties: number;
}

export interface ClashResult {
  /** Sides as stored with the battle (attacker first), cap CLASH_FORCE_CAP. Empty for a battle stored before slice 25. */
  forces: ClashForce[];
  /** CLASH_OUTCOME_WON / CLASH_OUTCOME_LOST / CLASH_OUTCOME_OTHERS. */
  outcome: string;
  /** CLASH_NOTE_CLEAN / CLASH_NOTE_COSTLY when the player fought and forces are known, else null. */
  note: string | null;
}

/**
 * Slice 25: the last clash for a clash screen (last_battle_json). Null with no stored battle,
 * no "battle" world-log entry within BATTLE_NOTE_RECENT_TICKS, or living_clash_result off.
 * Pure read; combat math untouched.
 */
export function clashResultSnapshot(state: GameState): ClashResult | null {
  if (!livingSwitches(state).clashResult) return null;
  const story = lastBattleStory(state);
  if (!story) return null;
  if (recentBattleTick(state) === null) return null;
  const stored = Array.isArray(story.forces) ? story.forces : [];
  const forces: ClashForce[] = stored.slice(0, CLASH_FORCE_CAP).map((f) => ({
    side: f.side,
    name: nameOf(state, f.realmId),
    strength: f.strength,
    casualties: f.casualties,
  }));
  const outcome =
    story.winnerId === "player" ? CLASH_OUTCOME_WON : story.loserId === "player" ? CLASH_OUTCOME_LOST : CLASH_OUTCOME_OTHERS;
  let note: string | null = null;
  const mine = stored.find((f) => f.realmId === "player");
  const theirs = stored.find((f) => f.realmId !== "player");
  if (outcome !== CLASH_OUTCOME_OTHERS && mine) {
    if (mine.casualties === 0) note = CLASH_NOTE_CLEAN;
    else if (theirs && mine.casualties > theirs.casualties) note = CLASH_NOTE_COSTLY;
  }
  return { forces, outcome, note };
}

// ---------------------------------------------------------------- unit waiting states (slice 25)

export interface UnitPosted {
  /** Unit type id. */
  id: string;
  /** Unit name. */
  name: string;
  /** Province id of the garrison. */
  location: string;
}

export interface UnitWaiting {
  /** Unit type id. */
  id: string;
  /** Unit name. */
  name: string;
  /** Province id the march is heading to. */
  destination: string;
  /** Ticks until the march arrives, never below 0. */
  ticksLeft: number;
}

export interface UnitWaitingStates {
  /** Unit types standing in a garrison: location then unit id, cap UNIT_WAITING_CAP. */
  posted: UnitPosted[];
  /** Unit types on a player march: soonest first, then march id, then unit id, cap UNIT_WAITING_CAP. */
  waiting: UnitWaiting[];
}

/** Unit type ids with at least one man in a force (levy counts as militia), sorted. */
function forceUnitIds(force?: Record<string, number>, levy = 0): string[] {
  const src = force && Object.keys(force).length > 0 ? force : levy > 0 ? { militia: levy } : {};
  return Object.entries(src)
    .filter(([, n]) => Math.floor(Number(n) || 0) > 0)
    .map(([k]) => k)
    .sort();
}

function cmpStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Slice 25: player units posted in garrisons and units still on the road. Null when both lists
 * are empty or living_unit_waiting off. Pure read; garrison and march rules untouched.
 */
export function unitWaitingSnapshot(state: GameState): UnitWaitingStates | null {
  if (!livingSwitches(state).unitWaiting) return null;
  const unitName = (id: string) => getUnitType(id)?.name ?? id;
  const posted: UnitPosted[] = [];
  for (const g of listGarrisons(state)) {
    for (const id of forceUnitIds(g.force)) posted.push({ id, name: unitName(id), location: g.provinceId });
  }
  posted.sort((a, b) => cmpStr(a.location, b.location) || cmpStr(a.id, b.id));
  const tick = state.meta.tick;
  const rows: { marchId: string; row: UnitWaiting }[] = [];
  for (const m of listMarches(state)) {
    if (m.realmId !== "player") continue;
    const ticksLeft = Math.max(0, m.arrivesTick - tick);
    for (const id of forceUnitIds(m.force, m.levy ?? 0)) {
      rows.push({ marchId: m.id, row: { id, name: unitName(id), destination: m.toId, ticksLeft } });
    }
  }
  rows.sort((a, b) => a.row.ticksLeft - b.row.ticksLeft || cmpStr(a.marchId, b.marchId) || cmpStr(a.row.id, b.row.id));
  if (posted.length === 0 && rows.length === 0) return null;
  return { posted: posted.slice(0, UNIT_WAITING_CAP), waiting: rows.slice(0, UNIT_WAITING_CAP).map((r) => r.row) };
}

// ---------------------------------------------------------------- board surface detail (slice 26)

export interface BoardSurface {
  /** Raw terrain id. */
  terrain: string;
  /** SURFACE_ELEVATION line for the terrain. */
  elevation: string;
  /** SURFACE_FOG_CLEAR / SURFACE_FOG_VEILED (isProvinceSeen). */
  fog: string;
  /** SURFACE_KEEP_* on the home tile or a hold tile, else null. */
  keep: string | null;
  /** SURFACE_MARCH_* when a column is coming to or leaving the tile, else null. */
  marches: string | null;
}

/** isProvinceSeen without its lazy fog_seen write: reads a shallow copy when the flag is missing. */
function seenNoWrite(state: GameState, provinceId: string): boolean {
  if (typeof state.flags.fog_seen === "string" && state.flags.fog_seen) return isProvinceSeen(state, provinceId);
  return isProvinceSeen({ ...state, flags: { ...state.flags } }, provinceId);
}

/**
 * Slice 26: surface detail for one board tile. Null for an unknown id or with
 * living_board_surface off. Pure read; terrain, fog and pathfinding rules untouched.
 */
export function boardSurfaceSnapshot(state: GameState, provinceId: string): BoardSurface | null {
  if (!livingSwitches(state).boardSurface) return null;
  const p = state.board.provinces.find((q) => q.id === provinceId);
  if (!p) return null;
  const elevation = Object.prototype.hasOwnProperty.call(SURFACE_ELEVATION, p.terrain)
    ? SURFACE_ELEVATION[p.terrain]
    : SURFACE_ELEVATION_DEFAULT;
  const fog = seenNoWrite(state, p.id) ? SURFACE_FOG_CLEAR : SURFACE_FOG_VEILED;
  const k = keepKind(state, p);
  const keep = k === "home" ? SURFACE_KEEP_HOME : k === "rival" ? SURFACE_KEEP_RIVAL : k === "empty" ? SURFACE_KEEP_EMPTY : null;
  const m = marchKind(state, p.id);
  const marches = m === "enemy" ? SURFACE_MARCH_ENEMY : m === "own" ? SURFACE_MARCH_OWN : m === "leaving" ? SURFACE_MARCH_LEAVING : null;
  return { terrain: p.terrain, elevation, fog, keep, marches };
}

type KeepKind = "home" | "rival" | "empty" | null;
type MarchKind = "enemy" | "own" | "leaving" | null;

/** Home tile or a player hold: home; another hold: rival / empty; else null. Shared by slices 26 and 27. */
function keepKind(state: GameState, p: { id: string; node?: string; occupantRealmId?: string | null }): KeepKind {
  if (p.id === state.board.homeProvinceId || (p.node === "hold" && p.occupantRealmId === "player")) return "home";
  if (p.node === "hold") return p.occupantRealmId ? "rival" : "empty";
  return null;
}

/** Rival inbound beats player inbound beats a column leaving the tile. Shared by slices 26 and 27. */
function marchKind(state: GameState, provinceId: string): MarchKind {
  const all = listMarches(state);
  const inbound = all.filter((m) => m.toId === provinceId);
  if (inbound.some((m) => m.realmId !== "player")) return "enemy";
  if (inbound.length > 0) return "own";
  if (all.some((m) => m.fromId === provinceId)) return "leaving";
  return null;
}

// ---------------------------------------------------------------- selection feedback (slice 26)

export interface SelectionFeedback {
  /** Selected province id. */
  selected: string;
  /** SELECTION_NOTE_* line. */
  note: string;
}

/**
 * Slice 26: a short note on the selected tile. Selection is app state, so the app passes the
 * id it holds (same BoardView as boardFeedbackSnapshot). Null when nothing (or an unknown id)
 * is selected, or with living_selection_feedback off. Pure read; selection rules untouched.
 * Note priority: home, veiled, held by you, held by another realm, open ground.
 */
export function selectionFeedbackSnapshot(state: GameState, view: BoardView = {}): SelectionFeedback | null {
  if (!livingSwitches(state).selectionFeedback) return null;
  const id = view.selectedProvinceId;
  if (!id) return null;
  const p = state.board.provinces.find((q) => q.id === id);
  if (!p) return null;
  let note: string;
  if (p.id === state.board.homeProvinceId) note = SELECTION_NOTE_HOME;
  else if (!seenNoWrite(state, p.id)) note = SELECTION_NOTE_VEILED;
  else if (p.occupantRealmId === "player") note = SELECTION_NOTE_OWN;
  else if (p.occupantRealmId) note = SELECTION_NOTE_RIVAL;
  else note = SELECTION_NOTE_OPEN;
  return { selected: p.id, note };
}

// ---------------------------------------------------------------- battle feedback (slice 27)

export interface BattleFeedback {
  /** Tile the last battle was fought on, or null when it has no known tile (realm-level Fight, or stored before slice 27). */
  provinceId: string | null;
  /** BATTLE_FEEDBACK_NOTE_* line. */
  note: string;
  /** BATTLE_FEEDBACK_MARK_* (won / lost / clash). */
  mark: string;
}

/**
 * Slice 27: feedback on the last battle (last_battle_json). Null with no stored battle, no
 * "battle" world-log entry within BATTLE_NOTE_RECENT_TICKS, or living_battle_feedback off.
 * Pure read; combat math untouched.
 */
export function battleFeedbackSnapshot(state: GameState): BattleFeedback | null {
  if (!livingSwitches(state).battleFeedback) return null;
  const story = lastBattleStory(state);
  if (!story) return null;
  if (recentBattleTick(state) === null) return null;
  const stored = typeof story.provinceId === "string" ? story.provinceId : null;
  const provinceId = stored && state.board.provinces.some((q) => q.id === stored) ? stored : null;
  if (story.winnerId === "player") return { provinceId, note: BATTLE_FEEDBACK_NOTE_WON, mark: BATTLE_FEEDBACK_MARK_WON };
  if (story.loserId === "player") return { provinceId, note: BATTLE_FEEDBACK_NOTE_LOST, mark: BATTLE_FEEDBACK_MARK_LOST };
  return { provinceId, note: BATTLE_FEEDBACK_NOTE_OTHERS, mark: BATTLE_FEEDBACK_MARK_OTHERS };
}

// ---------------------------------------------------------------- board polish detail (slice 27)

export interface BoardPolish {
  /** POLISH_MARCH_* short label, or null when no column is coming or leaving. */
  march: string | null;
  /** POLISH_KEEP_* short label on the home tile or a hold, else null. */
  keep: string | null;
  /** "clear" / "veiled" (isProvinceSeen, without its lazy fog_seen write). */
  fog: string;
}

/**
 * Slice 27: short board labels for one tile. Null for an unknown id or with
 * living_board_polish off. Pure read; pathfinding and fog rules untouched.
 */
export function boardPolishSnapshot(state: GameState, provinceId: string): BoardPolish | null {
  if (!livingSwitches(state).boardPolish) return null;
  const p = state.board.provinces.find((q) => q.id === provinceId);
  if (!p) return null;
  const m = marchKind(state, p.id);
  const march = m === "enemy" ? POLISH_MARCH_ENEMY : m === "own" ? POLISH_MARCH_OWN : m === "leaving" ? POLISH_MARCH_LEAVING : null;
  const k = keepKind(state, p);
  const keep = k === "home" ? POLISH_KEEP_HOME : k === "rival" ? POLISH_KEEP_RIVAL : k === "empty" ? POLISH_KEEP_EMPTY : null;
  const fog = seenNoWrite(state, p.id) ? SURFACE_FOG_CLEAR : SURFACE_FOG_VEILED;
  return { march, keep, fog };
}

// ---------------------------------------------------------------- building detail (slice 28)

export interface BuildingDetail {
  /** Building type name (getBuildingType), or the raw type id when the type is unknown. */
  name: string;
  /** BUILDING_TIER_LABELS entry for the level (clamped 1..5). */
  tier: string;
  /** A matching worker stands on the tile (staffBonus > 1, the economy's rule). */
  staffed: boolean;
  /** BUILDING_WORK_STATIONS label for the building's citizen job, or null when it takes none. */
  workStation: string | null;
  /** BUILDING_NOTE_* line. */
  note: string;
}

/**
 * Slice 28: detail for one building. Null for an unknown id or with living_building_detail
 * off. Pure read; build, staff and upgrade rules untouched.
 */
export function buildingDetailSnapshot(state: GameState, buildingId: string): BuildingDetail | null {
  if (!livingSwitches(state).buildingDetail) return null;
  const b = state.buildings.find((q) => q.id === buildingId);
  if (!b) return null;
  const name = getBuildingType(b.typeId)?.name ?? b.typeId;
  const r = readBuilding(state, b);
  const tier = BUILDING_TIER_LABELS[r.level];
  const note =
    r.phase === "building" ? BUILDING_NOTE_BUILDING
    : r.phase === "upgrading" ? BUILDING_NOTE_UPGRADING
    : r.phase === "noStation" ? BUILDING_NOTE_NO_STATION
    : r.phase === "staffed" ? BUILDING_NOTE_STAFFED
    : BUILDING_NOTE_UNSTAFFED;
  return { name, tier, staffed: r.staffed, workStation: r.workStation, note };
}

type BuildingPhase = "building" | "upgrading" | "noStation" | "staffed" | "unstaffed";

/**
 * Shared read for slices 28/29: clamped level (1..5), work station label, staffed, and the
 * first-match phase (construction, upgrade, no station, staffed / unstaffed). Pure.
 */
function readBuilding(state: GameState, b: GameState["buildings"][number]) {
  const level = Math.max(1, Math.min(5, Math.floor(Number.isFinite(b.level) ? b.level : 1)));
  const workStation: string | null = BUILDING_WORK_STATIONS[jobForBuildingType(b.typeId)] ?? null;
  const staffed = workStation !== null && staffBonus(state, b) > 1;
  let phase: BuildingPhase;
  if (b.completesAtTick !== null) phase = "building";
  else if (upgradeJobFor(state, b.id)) phase = "upgrading";
  else if (workStation === null) phase = "noStation";
  else phase = staffed ? "staffed" : "unstaffed";
  return { level, workStation, staffed, phase };
}

// ---------------------------------------------------------------- board scale (slice 28)

export interface BoardScale {
  /** state.board.width, as stored. */
  width: number;
  /** state.board.height, as stored. */
  height: number;
  /** BOARD_SCALE_NOTE_* line by tile count. */
  note: string;
}

/**
 * Slice 28: board size with a short note. Null with living_board_scale off or a board with
 * no positive whole width and height. Pure read; board size and pathfinding untouched.
 */
export function boardScaleSnapshot(state: GameState): BoardScale | null {
  if (!livingSwitches(state).boardScale) return null;
  const width = state.board?.width;
  const height = state.board?.height;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) return null;
  const tiles = width * height;
  const note = tiles <= BOARD_SCALE_SMALL_TILES ? BOARD_SCALE_NOTE_SMALL : tiles <= BOARD_SCALE_MID_TILES ? BOARD_SCALE_NOTE_MID : BOARD_SCALE_NOTE_WIDE;
  return { width, height, note };
}

// ---------------------------------------------------------------- building life (slice 29)

export interface BuildingLife {
  /** BUILDING_LIFE_TIER_ELEMENTS entry for the level (clamped 1..5); null at Tier I or while being built. */
  tierElements: string | null;
  /** BUILDING_LIFE_MOTION_* (Scaffold / Hammers / Work), or null when nothing moves. */
  motion: string | null;
  /** BUILDING_LIFE_NOTE_* line. */
  note: string;
}

/**
 * Slice 29: visual life cues for one building. Null for an unknown id or with
 * living_building_life off. Same phase order as buildingDetailSnapshot. Pure read; build,
 * staff and upgrade rules untouched.
 */
export function buildingLifeSnapshot(state: GameState, buildingId: string): BuildingLife | null {
  if (!livingSwitches(state).buildingLife) return null;
  const b = state.buildings.find((q) => q.id === buildingId);
  if (!b) return null;
  const r = readBuilding(state, b);
  const tierElements = r.phase === "building" ? null : (BUILDING_LIFE_TIER_ELEMENTS[r.level] ?? null);
  switch (r.phase) {
    case "building":
      return { tierElements, motion: BUILDING_LIFE_MOTION_SCAFFOLD, note: BUILDING_LIFE_NOTE_BUILDING };
    case "upgrading":
      return { tierElements, motion: BUILDING_LIFE_MOTION_HAMMERS, note: BUILDING_LIFE_NOTE_UPGRADING };
    case "noStation":
      return { tierElements, motion: null, note: BUILDING_LIFE_NOTE_NO_STATION };
    case "staffed":
      return { tierElements, motion: BUILDING_LIFE_MOTION_WORK, note: BUILDING_LIFE_NOTE_STAFFED };
    default:
      return { tierElements, motion: null, note: BUILDING_LIFE_NOTE_UNSTAFFED };
  }
}

// ---------------------------------------------------------------- work station staging (slice 29)

export interface WorkStationStaging {
  /** BUILDING_WORK_STATIONS label (Field / Woodlot / Pit / Stall / Post / Study). */
  station: string;
  /** WORK_STATION_STAGED pose when a worker is at a finished, non-upgrading station; else null. */
  staged: string | null;
  /** WORK_STATION_NOTE_* line. */
  note: string;
}

/**
 * Slice 29: what is staged at a building's work station. Null for an unknown id, a building
 * that takes no worker, or with living_work_station_staging off. Pure read; staffing and
 * unit rules untouched.
 */
export function workStationStagingSnapshot(state: GameState, buildingId: string): WorkStationStaging | null {
  if (!livingSwitches(state).workStationStaging) return null;
  const b = state.buildings.find((q) => q.id === buildingId);
  if (!b) return null;
  const r = readBuilding(state, b);
  if (r.workStation === null) return null;
  const station = r.workStation;
  if (r.phase === "building") return { station, staged: null, note: WORK_STATION_NOTE_BUILDING };
  if (r.phase === "upgrading") return { station, staged: null, note: WORK_STATION_NOTE_UPGRADING };
  if (r.phase === "staffed") return { station, staged: WORK_STATION_STAGED[station] ?? null, note: WORK_STATION_NOTE_STAFFED };
  return { station, staged: null, note: WORK_STATION_NOTE_EMPTY };
}

// ---------------------------------------------------------------- board expansion prep (slice 29)

export interface BoardExpansion {
  /** BOARD_BAND_* for today's board (same tile-count bands as boardScaleSnapshot). */
  current: string;
  /** BOARD_BAND_* for the next band up; the wide band names itself. */
  prepared: string;
  /** BOARD_EXPANSION_NOTE_* line. */
  note: string;
}

/**
 * Slice 29: board expansion prep. Names the current band and the next one. Null with
 * living_board_expansion off or a board with no positive whole width and height. Pure read;
 * board size, pathfinding and fog untouched. Nothing is actually expanded.
 */
export function boardExpansionSnapshot(state: GameState): BoardExpansion | null {
  if (!livingSwitches(state).boardExpansion) return null;
  const width = state.board?.width;
  const height = state.board?.height;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) return null;
  const tiles = width * height;
  if (tiles <= BOARD_SCALE_SMALL_TILES) return { current: BOARD_BAND_SMALL, prepared: BOARD_BAND_MID, note: BOARD_EXPANSION_NOTE_PLANNED };
  if (tiles <= BOARD_SCALE_MID_TILES) return { current: BOARD_BAND_MID, prepared: BOARD_BAND_WIDE, note: BOARD_EXPANSION_NOTE_PLANNED };
  return { current: BOARD_BAND_WIDE, prepared: BOARD_BAND_WIDE, note: BOARD_EXPANSION_NOTE_WIDEST };
}

// ---------------------------------------------------------------- building variety (slice 30)

export interface BuildingVariety {
  /** BUILDING_VARIETY label for the type, or BUILDING_VARIETY_DEFAULT. */
  variety: string;
  /** BUILDING_VARIETY_TIER_DETAIL entry for the level (clamped 1..5); null at Tier I or while being built. */
  tierDetail: string | null;
  /** BUILDING_VARIETY_NOTE_* line. */
  note: string;
}

/**
 * Slice 30: style label and tier detail for one building. Null for an unknown id or with
 * living_building_variety off. Pure read; build costs and upgrade rules untouched.
 */
export function buildingVarietySnapshot(state: GameState, buildingId: string): BuildingVariety | null {
  if (!livingSwitches(state).buildingVariety) return null;
  const b = state.buildings.find((q) => q.id === buildingId);
  if (!b) return null;
  const r = readBuilding(state, b);
  const variety = BUILDING_VARIETY[b.typeId] ?? BUILDING_VARIETY_DEFAULT;
  const tierDetail = r.phase === "building" ? null : (BUILDING_VARIETY_TIER_DETAIL[r.level] ?? null);
  const note =
    r.phase === "building" ? BUILDING_VARIETY_NOTE_BUILDING
    : r.phase === "upgrading" ? BUILDING_VARIETY_NOTE_UPGRADING
    : r.level >= 5 ? BUILDING_VARIETY_NOTE_TOP
    : BUILDING_VARIETY_NOTE_GROWING;
  return { variety, tierDetail, note };
}

// ---------------------------------------------------------------- work station benefit (slice 30)

export interface WorkStationBenefit {
  /** WORK_STATION_BENEFIT_LABEL ("+5% output"). */
  benefit: string;
  /** True when the economy applies the bonus to this building (workStationBonus > 1). */
  active: boolean;
  /** WORK_STATION_BENEFIT_NOTE_* line. */
  note: string;
}

/**
 * Slice 30: the passive work-station bonus for one building. Null for an unknown id, a
 * building that takes no worker, or with living_work_station_benefit off (which also turns
 * the bonus itself off). `active` reads the same rule the economy uses.
 */
export function workStationBenefitSnapshot(state: GameState, buildingId: string): WorkStationBenefit | null {
  if (!livingSwitches(state).workStationBenefit) return null;
  const b = state.buildings.find((q) => q.id === buildingId);
  if (!b) return null;
  const r = readBuilding(state, b);
  if (r.workStation === null) return null;
  const active = workStationBonus(state, b) > 1;
  const note =
    r.phase === "building" ? WORK_STATION_BENEFIT_NOTE_BUILDING
    : r.phase === "upgrading" ? WORK_STATION_BENEFIT_NOTE_UPGRADING
    : active ? WORK_STATION_BENEFIT_NOTE_ACTIVE
    : WORK_STATION_BENEFIT_NOTE_EMPTY;
  return { benefit: WORK_STATION_BENEFIT_LABEL, active, note };
}

// ---------------------------------------------------------------- environment (slice 31)

export interface Environment {
  /** ENVIRONMENT_FEATURES label for the board's most common terrain (ties: key order). */
  features: string;
  /** ENVIRONMENT_AMBIENT label for today's weather. */
  ambient: string;
  /** ENVIRONMENT_NOTE line for the season. */
  note: string;
  /** Slice 32: ENVIRONMENT_MOOD_* from weather and season; null with living_environment_depth off. */
  mood: string | null;
}

/**
 * Slice 31: a short read of the land, the air and the season. Null with living_environment
 * off or a board with no tiles. Pure read; pathfinding, fog and weather rules untouched.
 */
export function environmentSnapshot(state: GameState): Environment | null {
  if (!livingSwitches(state).environment) return null;
  const provinces = state.board?.provinces;
  if (!Array.isArray(provinces) || provinces.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const p of provinces) counts[p.terrain] = (counts[p.terrain] ?? 0) + 1;
  let best: string | null = null;
  for (const t of Object.keys(ENVIRONMENT_FEATURES)) {
    if ((counts[t] ?? 0) > 0 && (best === null || counts[t] > counts[best])) best = t;
  }
  const features = best === null ? ENVIRONMENT_FEATURES.plain : ENVIRONMENT_FEATURES[best];
  const weather = weatherFor(state);
  const season = currentSeason(state);
  const ambient = ENVIRONMENT_AMBIENT[weather] ?? ENVIRONMENT_AMBIENT.clear;
  const note = ENVIRONMENT_NOTE[season] ?? ENVIRONMENT_NOTE.Spring;
  const mood = livingSwitches(state).environmentDepth ? environmentMood(weather, season) : null;
  return { features, ambient, note, mood };
}

/** Slice 32: fixed mood line. Storm: restless; rain or snow: soft; clear Winter: still; else open. */
export function environmentMood(weather: string, season: string): string {
  if (weather === "storm") return ENVIRONMENT_MOOD_RESTLESS;
  if (weather === "rain" || weather === "snow") return ENVIRONMENT_MOOD_SOFT;
  if (season === "Winter") return ENVIRONMENT_MOOD_STILL;
  return ENVIRONMENT_MOOD_OPEN;
}

// ---------------------------------------------------------------- work station depth (slice 31)

export interface WorkStationDepth {
  /** WORK_STATION_DEPTH_LABEL ("+3% at Tier II"). */
  depth: string;
  /** True when the economy applies the depth bonus to this building (workStationDepthBonus > 1). */
  active: boolean;
  /** WORK_STATION_DEPTH_NOTE_* line. */
  note: string;
}

/**
 * Slice 31: the seasoned-station bonus for one building. Null for an unknown id, a building
 * that takes no worker, or with living_work_station_depth off (which also turns this bonus
 * off; the slice 30 +5% stays). `active` reads the same rule the economy uses.
 */
export function workStationDepthSnapshot(state: GameState, buildingId: string): WorkStationDepth | null {
  if (!livingSwitches(state).workStationDepth) return null;
  const b = state.buildings.find((q) => q.id === buildingId);
  if (!b) return null;
  const r = readBuilding(state, b);
  if (r.workStation === null) return null;
  const active = workStationDepthBonus(state, b) > 1;
  const note =
    r.phase === "building" ? WORK_STATION_DEPTH_NOTE_BUILDING
    : r.phase === "upgrading" ? WORK_STATION_DEPTH_NOTE_UPGRADING
    : r.phase !== "staffed" ? WORK_STATION_DEPTH_NOTE_EMPTY
    : active ? WORK_STATION_DEPTH_NOTE_ACTIVE
    : workStationBonus(state, b) <= 1 ? WORK_STATION_DEPTH_NOTE_NO_BASE
    : r.level < WORK_STATION_DEPTH_MIN_LEVEL ? WORK_STATION_DEPTH_NOTE_LOW_TIER
    : WORK_STATION_DEPTH_NOTE_EMPTY;
  return { depth: WORK_STATION_DEPTH_LABEL, active, note };
}

// ---------------------------------------------------------------- extra buildings (slice 31)

export interface ExtraBuilding {
  /** EXTRA_BUILDINGS label for the type. */
  extra: string;
  /** EXTRA_BUILDING_DETAIL_*; null while the main building is still being built. */
  detail: string | null;
  /** EXTRA_BUILDING_NOTE_* line. */
  note: string;
}

/**
 * Slice 31: the extra visual structure beside one building. Null for an unknown id, a type
 * not in EXTRA_BUILDINGS, or with living_extra_buildings off. Visual only: no cost, no
 * output, no new building type.
 */
export function extraBuildingSnapshot(state: GameState, buildingId: string): ExtraBuilding | null {
  if (!livingSwitches(state).extraBuildings) return null;
  const b = state.buildings.find((q) => q.id === buildingId);
  if (!b) return null;
  const extra = EXTRA_BUILDINGS[b.typeId];
  if (extra === undefined) return null;
  const r = readBuilding(state, b);
  if (r.phase === "building") return { extra, detail: null, note: EXTRA_BUILDING_NOTE_BUILDING };
  if (r.phase === "upgrading") return { extra, detail: EXTRA_BUILDING_DETAIL_UPGRADING, note: EXTRA_BUILDING_NOTE_UPGRADING };
  const detail = r.level >= EXTRA_BUILDING_FULL_LEVEL ? EXTRA_BUILDING_DETAIL_FULL : EXTRA_BUILDING_DETAIL_SMALL;
  return { extra, detail, note: EXTRA_BUILDING_NOTE_STANDING };
}

// ---------------------------------------------------------------- station pairing (slice 32)

export interface StationPair {
  /** True when this station and another of the same type in the same realm are both finished. */
  paired: boolean;
  /** STATION_PAIR_NOTE_* line. */
  note: string;
}

/**
 * Slice 32: whether a station has a same-type twin. Null for an unknown id, a building that
 * takes no worker, or with living_station_pair off (which also turns the +2% off). The lead
 * (first finished in build order) carries the bonus; the note says which one.
 */
export function stationPairSnapshot(state: GameState, buildingId: string): StationPair | null {
  if (!livingSwitches(state).stationPair) return null;
  const b = state.buildings.find((q) => q.id === buildingId);
  if (!b) return null;
  if (readBuilding(state, b).workStation === null) return null;
  if (b.completesAtTick !== null) return { paired: false, note: STATION_PAIR_NOTE_BUILDING };
  if (!stationPairState(state, b).paired) return { paired: false, note: STATION_PAIR_NOTE_ALONE };
  return { paired: true, note: stationPairBonus(state, b) > 1 ? STATION_PAIR_NOTE_LEAD : STATION_PAIR_NOTE_TWIN };
}
