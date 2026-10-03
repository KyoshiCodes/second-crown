import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";
import { keepLevel } from "../actions/upgrade.js";
import { addCapped } from "./storage.js";

export const RESEARCH = {
  husbandry: {
    id: "husbandry",
    name: "Husbandry",
    ticks: 180,
    cost: { food: "20", wood: "12" },
    needsAny: ["farm", "granary", "academy"],
    keepMin: 0,
    unlocks: [] as const,
    effect: "Farms and granaries yield more food.",
  },
  forestry: {
    id: "forestry",
    name: "Forestry",
    ticks: 180,
    cost: { wood: "20", food: "10" },
    needsAny: ["lumber_camp", "sawmill", "academy"],
    keepMin: 0,
    unlocks: [] as const,
    effect: "Lumber camps and sawmills yield more wood.",
  },
  masonry: {
    id: "masonry",
    name: "Masonry",
    ticks: 200,
    cost: { stone: "16", wood: "12" },
    needsAny: ["quarry", "mason", "academy"],
    keepMin: 0,
    unlocks: [] as const,
    effect: "Quarries yield more stone. Finished walls hold +16 HP.",
  },
  logistics: {
    id: "logistics",
    name: "Logistics",
    ticks: 220,
    cost: { gold: "30", wood: "16", food: "12" },
    needsAny: ["barracks", "market", "academy"],
    keepMin: 2,
    unlocks: [] as const,
    effect: "One extra column on the board and +50 warehouse space. Needs Keep II.",
  },
  surveying: {
    id: "surveying",
    name: "Surveying",
    ticks: 200,
    cost: { gold: "24", wood: "16" },
    needsAny: ["watchtower", "academy"],
    keepMin: 2,
    unlocks: [] as const,
    effect: "Hold vision reaches one tile farther. Needs Keep II.",
  },
  fieldcraft: {
    id: "fieldcraft",
    name: "Fieldcraft",
    ticks: 180,
    cost: { food: "20", wood: "12" },
    needsAny: ["archery_range", "academy"],
    keepMin: 0,
    unlocks: ["ranger"],
    effect: "Unlocks rangers. Archers stay open.",
  },
  drill: {
    id: "drill",
    name: "Drill",
    ticks: 180,
    cost: { food: "20", wood: "12" },
    needsAny: ["barracks", "academy"],
    keepMin: 0,
    unlocks: ["banner"],
    effect: "Unlocks banners. Spearmen stay open.",
  },
  screening: {
    id: "screening",
    name: "Screening",
    ticks: 180,
    cost: { food: "20", wood: "12" },
    needsAny: ["barracks", "academy"],
    keepMin: 0,
    unlocks: ["warden"],
    effect: "Unlocks wardens. Skirmishers stay open.",
  },
  horse: {
    id: "horse",
    name: "Horse lore",
    ticks: 240,
    cost: { gold: "40", wood: "24" },
    needsAny: ["academy", "barracks"],
    keepMin: 2,
    unlocks: ["cavalry", "knight", "outrider"],
    effect: "Unlocks cavalry, knights, and outriders. Needs Keep II.",
  },
  siege: {
    id: "siege",
    name: "Siege craft",
    ticks: 360,
    cost: { gold: "70", wood: "40", stone: "30" },
    needsAny: ["siege_workshop"],
    keepMin: 3,
    unlocks: ["siege"],
    effect: "Unlocks siege engines. Needs Keep III.",
  },
} as const;

export type ResearchId = keyof typeof RESEARCH;

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
  if (typeId === "cavalry" || typeId === "knight" || typeId === "outrider") return researchDone(state, "horse");
  if (typeId === "siege") return researchDone(state, "siege");
  if (typeId === "ranger") return researchDone(state, "fieldcraft");
  if (typeId === "banner") return researchDone(state, "drill");
  if (typeId === "warden") return researchDone(state, "screening");
  return true;
}

/** Extra per-tick yield fraction for one resource after the matching study. */
export function researchYield(state: GameState, res: string): number {
  if (res === "food" && researchDone(state, "husbandry")) return 0.12;
  if (res === "wood" && researchDone(state, "forestry")) return 0.12;
  if (res === "stone" && researchDone(state, "masonry")) return 0.12;
  if (res === "gold" && researchDone(state, "logistics")) return 0.08;
  return 0;
}

export function masonryWallBonus(state: GameState): number {
  return researchDone(state, "masonry") ? 16 : 0;
}

export function logisticsCapBonus(state: GameState): number {
  return researchDone(state, "logistics") ? 50 : 0;
}

export function surveyingVisionBonus(state: GameState): number {
  return researchDone(state, "surveying") ? 1 : 0;
}

export function tryStartResearch(state: GameState, id: ResearchId): boolean {
  const def = RESEARCH[id];
  if (!def) return false;
  if (researchDone(state, id)) return false;
  if (anyStudyOpen(state)) return false;
  if (!researchKeepReady(state, id)) return false;
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
  state.inputLog.push({ tick: state.meta.tick, type: "research", issuerId: "player", payload: { id } });
  return true;
}

/** Refunds the unused fraction of the study cost and frees the lectern. */
export function tryCancelResearch(state: GameState, id: ResearchId): boolean {
  const def = RESEARCH[id];
  if (!def) return false;
  if (researchDone(state, id)) return false;
  const left = researchTicksLeft(state, id);
  if (left <= 0) return false;
  const total = Number(state.flags[`research_${id}_total`] ?? def.ticks);
  const frac = left / total;
  for (const [res, cost] of Object.entries(def.cost)) {
    addCapped(state, res, D(cost).mul(frac));
  }
  delete state.flags[`research_${id}_until`];
  delete state.flags[`research_${id}_total`];
  state.inputLog.push({ tick: state.meta.tick, type: "cancel_research", issuerId: "player", payload: { id } });
  return true;
}
