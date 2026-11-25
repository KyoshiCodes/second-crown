import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";
import { keepLevel } from "../actions/upgrade.js";
import { addCapped } from "./storage.js";
import { cultureUnitGate, playerCultureKit } from "./cultureUnits.js";

/**
 * Pacing pass 1: tier I minutes (5-6m), Keep II hours (40m-3h), Keep III 8h-1.5d.
 * Ticks are base times; a finished Academy takes 20% off. 36_000 ticks = 1 hour.
 */
export const RESEARCH = {
  husbandry: {
    id: "husbandry",
    name: "Husbandry",
    ticks: 3_000,
    cost: { food: "80", wood: "48" },
    needsAny: ["farm", "granary", "academy"],
    keepMin: 0,
    unlocks: [] as const,
    effect: "Farms and granaries yield more food.",
  },
  forestry: {
    id: "forestry",
    name: "Forestry",
    ticks: 3_000,
    cost: { wood: "80", food: "40" },
    needsAny: ["lumber_camp", "sawmill", "academy"],
    keepMin: 0,
    unlocks: [] as const,
    effect: "Lumber camps and sawmills yield more wood.",
  },
  masonry: {
    id: "masonry",
    name: "Masonry",
    ticks: 3_600,
    cost: { stone: "64", wood: "48" },
    needsAny: ["quarry", "mason", "academy"],
    keepMin: 0,
    unlocks: [] as const,
    effect: "Quarries yield more stone. Finished walls hold +16 HP.",
  },
  logistics: {
    id: "logistics",
    name: "Logistics",
    ticks: 27_000,
    cost: { gold: "300", wood: "160", food: "120" },
    needsAny: ["barracks", "market", "academy"],
    keepMin: 2,
    unlocks: [] as const,
    effect: "One extra column on the board and +50 warehouse space. Needs Keep II.",
  },
  surveying: {
    id: "surveying",
    name: "Surveying",
    ticks: 24_000,
    cost: { gold: "240", wood: "160" },
    needsAny: ["watchtower", "academy"],
    keepMin: 2,
    unlocks: [] as const,
    effect: "Hold vision reaches one tile farther. Needs Keep II.",
  },
  fieldcraft: {
    id: "fieldcraft",
    name: "Fieldcraft",
    ticks: 3_000,
    cost: { food: "80", wood: "48" },
    needsAny: ["archery_range", "academy"],
    keepMin: 0,
    unlocks: ["ranger"],
    effect: "Unlocks rangers. Archers stay open.",
  },
  drill: {
    id: "drill",
    name: "Drill",
    ticks: 3_000,
    cost: { food: "80", wood: "48" },
    needsAny: ["barracks", "academy"],
    keepMin: 0,
    unlocks: ["banner"],
    effect: "Unlocks banners. Spearmen stay open.",
  },
  screening: {
    id: "screening",
    name: "Screening",
    ticks: 3_000,
    cost: { food: "80", wood: "48" },
    needsAny: ["barracks", "academy"],
    keepMin: 0,
    unlocks: ["warden"],
    effect: "Unlocks wardens. Skirmishers stay open.",
  },
  horse: {
    id: "horse",
    name: "Horse lore",
    ticks: 36_000,
    cost: { gold: "320", wood: "200" },
    needsAny: ["academy", "barracks"],
    keepMin: 2,
    unlocks: ["cavalry", "knight", "outrider", "lancer"],
    effect: "Unlocks cavalry, knights, outriders, and lancers. Needs Keep II.",
  },
  siege: {
    id: "siege",
    name: "Siege craft",
    ticks: 288_000,
    cost: { gold: "1750", wood: "1000", stone: "750" },
    needsAny: ["siege_workshop"],
    keepMin: 3,
    unlocks: ["siege"],
    effect: "Unlocks siege engines. Needs Keep III.",
  },
  // Tier II. Each one deepens a tier I study named in `requires`.
  crop_rotation: {
    id: "crop_rotation",
    name: "Crop rotation",
    ticks: 72_000,
    cost: { food: "360", wood: "180", gold: "120" },
    needsAny: ["granary", "academy"],
    keepMin: 2,
    requires: "husbandry",
    unlocks: [] as const,
    effect: "Farms and granaries yield another +25% food. Needs Husbandry and Keep II.",
  },
  timber_framing: {
    id: "timber_framing",
    name: "Timber framing",
    ticks: 72_000,
    cost: { wood: "360", food: "180", gold: "120" },
    needsAny: ["sawmill", "academy"],
    keepMin: 2,
    requires: "forestry",
    unlocks: [] as const,
    effect: "Lumber camps and sawmills yield another +25% wood. Needs Forestry and Keep II.",
  },
  fortification: {
    id: "fortification",
    name: "Fortification",
    ticks: 432_000,
    cost: { stone: "2100", wood: "1200", gold: "900" },
    needsAny: ["mason", "academy"],
    keepMin: 3,
    requires: "masonry",
    unlocks: ["ironclad"],
    effect: "Quarries yield another +25% stone. Finished walls hold another +24 HP. Unlocks ironclads. Needs Masonry and Keep III.",
  },
  supply_trains: {
    id: "supply_trains",
    name: "Supply trains",
    ticks: 1_296_000,
    cost: { gold: "1800", wood: "1500", food: "1200" },
    needsAny: ["market", "academy"],
    keepMin: 3,
    requires: "logistics",
    unlocks: [] as const,
    effect: "One more column on the board (up to the Keep limit) and +100 warehouse space. Needs Logistics and Keep III.",
  },
  cartography: {
    id: "cartography",
    name: "Cartography",
    ticks: 360_000,
    cost: { gold: "1500", wood: "900" },
    needsAny: ["watchtower", "academy"],
    keepMin: 3,
    requires: "surveying",
    unlocks: [] as const,
    effect: "Hold vision reaches one more tile. Scouting costs 4 gold less. Needs Surveying and Keep III.",
  },
  quartermastery: {
    id: "quartermastery",
    name: "Quartermastery",
    ticks: 108_000,
    cost: { food: "300", gold: "270", wood: "180" },
    needsAny: ["barracks", "academy"],
    keepMin: 2,
    requires: "drill",
    unlocks: [] as const,
    effect: "Training costs 8% less. Needs Drill and Keep II.",
  },
} as const;

export type ResearchId = keyof typeof RESEARCH;

/**
 * The table before pacing pass 1 (ad830a9). Studies started then carry no paid-cost
 * snapshot; their stored length (base or Academy 80%) or a missing length marks them.
 */
const PRE_PACING: Record<ResearchId, { ticks: number; cost: Record<string, string> }> = {
  husbandry: { ticks: 180, cost: { food: "20", wood: "12" } },
  forestry: { ticks: 180, cost: { wood: "20", food: "10" } },
  masonry: { ticks: 200, cost: { stone: "16", wood: "12" } },
  logistics: { ticks: 220, cost: { gold: "30", wood: "16", food: "12" } },
  surveying: { ticks: 200, cost: { gold: "24", wood: "16" } },
  fieldcraft: { ticks: 180, cost: { food: "20", wood: "12" } },
  drill: { ticks: 180, cost: { food: "20", wood: "12" } },
  screening: { ticks: 180, cost: { food: "20", wood: "12" } },
  horse: { ticks: 240, cost: { gold: "40", wood: "24" } },
  siege: { ticks: 360, cost: { gold: "70", wood: "40", stone: "30" } },
  crop_rotation: { ticks: 280, cost: { food: "60", wood: "30", gold: "20" } },
  timber_framing: { ticks: 280, cost: { wood: "60", food: "30", gold: "20" } },
  fortification: { ticks: 320, cost: { stone: "70", wood: "40", gold: "30" } },
  supply_trains: { ticks: 340, cost: { gold: "60", wood: "50", food: "40" } },
  cartography: { ticks: 300, cost: { gold: "50", wood: "30" } },
  quartermastery: { ticks: 300, cost: { food: "50", gold: "45", wood: "30" } },
};

/**
 * What the player paid for an in-flight study, and the length it was started with.
 * New studies store both. An older save falls back to the table it was started under.
 */
export function researchPaid(state: GameState, id: ResearchId): { paid: Record<string, string>; total: number } {
  const def = RESEARCH[id];
  const storedTotal = Number(state.flags[`research_${id}_total`] ?? 0);
  const stored = state.flags[`research_${id}_paid`];
  if (stored && typeof stored === "object" && !Array.isArray(stored)) {
    return { paid: { ...(stored as Record<string, string>) }, total: storedTotal || def.ticks };
  }
  const old = PRE_PACING[id];
  if (storedTotal === 0) return { paid: { ...old.cost }, total: old.ticks };
  if (storedTotal === old.ticks || storedTotal === Math.ceil(old.ticks * 0.8)) {
    return { paid: { ...old.cost }, total: storedTotal };
  }
  return { paid: { ...def.cost }, total: storedTotal };
}

/** The tier I study a tier II study builds on, or null for a tier I study. */
export function researchRequires(id: string): ResearchId | null {
  const def = RESEARCH[id as ResearchId] as { requires?: ResearchId } | undefined;
  return def?.requires ?? null;
}

/** 1 for the first lectern set, 2 for a study that builds on one of them. */
export function researchTier(id: string): 1 | 2 {
  return researchRequires(id) ? 2 : 1;
}

/** True when the study has no prerequisite, or its prerequisite is known. */
export function researchPrereqReady(state: GameState, id: string): boolean {
  const need = researchRequires(id);
  return need === null || researchDone(state, need);
}

function anyStudyOpen(state: GameState): boolean {
  for (const id of Object.keys(RESEARCH)) {
    if (!researchDone(state, id) && researchTicksLeft(state, id) > 0) return true;
  }
  return false;
}

function academyReady(state: GameState): boolean {
  return countBuilding(state, "academy") >= 1;
}

/** A finished Academy shortens every new study by 20%. In-progress studies are unaffected. */
export function researchDuration(state: GameState, id: ResearchId): number {
  const def = RESEARCH[id];
  return academyReady(state) ? Math.ceil(def.ticks * 0.8) : def.ticks;
}

export function researchKeepMin(id: string): number {
  const def = RESEARCH[id as ResearchId];
  return def?.keepMin ?? 0;
}

export function researchKeepReady(state: GameState, id: string): boolean {
  return keepLevel(state) >= researchKeepMin(id);
}

export function researchDone(state: GameState, id: string): boolean {
  if (Number(state.flags[`research_${id}`] ?? 0) === 1) return true;
  const until = Number(state.flags[`research_${id}_until`] ?? 0);
  if (until > 0 && state.meta.tick >= until) {
    state.flags[`research_${id}`] = 1;
    return true;
  }
  return false;
}

export function researchTicksLeft(state: GameState, id: string): number {
  if (Number(state.flags[`research_${id}`] ?? 0) === 1) return 0;
  const until = Number(state.flags[`research_${id}_until`] ?? 0);
  if (!until) return 0;
  if (state.meta.tick >= until) {
    state.flags[`research_${id}`] = 1;
    return 0;
  }
  return until - state.meta.tick;
}

export function unitUnlocked(state: GameState, typeId: string): boolean {
  const gate = cultureUnitGate(typeId);
  if (gate) return gate.kit ? playerCultureKit(state) === gate.kit : researchDone(state, gate.research);
  if (typeId === "cavalry" || typeId === "knight" || typeId === "outrider" || typeId === "lancer") return researchDone(state, "horse");
  if (typeId === "siege") return researchDone(state, "siege");
  if (typeId === "ranger") return researchDone(state, "fieldcraft");
  if (typeId === "banner") return researchDone(state, "drill");
  if (typeId === "warden") return researchDone(state, "screening");
  return true;
}

/** Extra per-tick yield fraction for one resource after the matching study. */
export function researchYield(state: GameState, res: string): number {
  if (res === "food") {
    return (researchDone(state, "husbandry") ? 0.12 : 0) + (researchDone(state, "crop_rotation") ? 0.25 : 0);
  }
  if (res === "wood") {
    return (researchDone(state, "forestry") ? 0.12 : 0) + (researchDone(state, "timber_framing") ? 0.25 : 0);
  }
  if (res === "stone") {
    return (researchDone(state, "masonry") ? 0.12 : 0) + (researchDone(state, "fortification") ? 0.25 : 0);
  }
  if (res === "gold" && researchDone(state, "logistics")) return 0.15;
  return 0;
}

export function masonryWallBonus(state: GameState): number {
  return (researchDone(state, "masonry") ? 16 : 0) + (researchDone(state, "fortification") ? 24 : 0);
}

export function logisticsCapBonus(state: GameState): number {
  return researchDone(state, "logistics") ? 50 : 0;
}

export function surveyingVisionBonus(state: GameState): number {
  return (researchDone(state, "surveying") ? 1 : 0) + (researchDone(state, "cartography") ? 1 : 0);
}

/** Gold taken off every scouting fee once Cartography is known. */
export function cartographyScoutDiscount(state: GameState): number {
  return researchDone(state, "cartography") ? 4 : 0;
}

/** Extra board columns from Supply trains (still clamped by the Keep's column limit). */
export function supplyTrainsColumnBonus(state: GameState): number {
  return researchDone(state, "supply_trains") ? 1 : 0;
}

/** Training cost multiplier from Quartermastery. */
export function quartermasteryTrainMult(state: GameState): number {
  return researchDone(state, "quartermastery") ? 0.92 : 1;
}

export function tryStartResearch(state: GameState, id: ResearchId): boolean {
  const def = RESEARCH[id];
  if (!def) return false;
  if (researchDone(state, id)) return false;
  if (anyStudyOpen(state)) return false;
  if (!researchKeepReady(state, id)) return false;
  if (!researchPrereqReady(state, id)) return false;
  if (!def.needsAny.some((typeId) => countBuilding(state, typeId) >= 1)) return false;
  for (const [res, cost] of Object.entries(def.cost)) {
    if (D(state.resources[res] ?? "0").lt(cost)) return false;
  }
  for (const [res, cost] of Object.entries(def.cost)) {
    state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").sub(cost));
  }
  const duration = researchDuration(state, id);
  state.flags[`research_${id}_until`] = state.meta.tick + duration;
  state.flags[`research_${id}_total`] = duration;
  state.flags[`research_${id}_paid`] = { ...def.cost };
  state.inputLog.push({ tick: state.meta.tick, type: "research", issuerId: "player", payload: { id } });
  return true;
}

/** Refunds the unused fraction of what was paid at start (not today's price) and frees the lectern. */
export function tryCancelResearch(state: GameState, id: ResearchId): boolean {
  const def = RESEARCH[id];
  if (!def) return false;
  if (researchDone(state, id)) return false;
  const left = researchTicksLeft(state, id);
  if (left <= 0) return false;
  const { paid, total } = researchPaid(state, id);
  const frac = total > 0 ? Math.min(1, left / total) : 0;
  for (const [res, cost] of Object.entries(paid)) {
    addCapped(state, res, D(cost).mul(frac));
  }
  delete state.flags[`research_${id}_until`];
  delete state.flags[`research_${id}_total`];
  delete state.flags[`research_${id}_paid`];
  state.inputLog.push({ tick: state.meta.tick, type: "cancel_research", issuerId: "player", payload: { id } });
  return true;
}
