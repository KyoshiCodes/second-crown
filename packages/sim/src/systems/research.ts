import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";
import { addCapped } from "./storage.js";

export const RESEARCH = {
  husbandry: {
    id: "husbandry",
    name: "Husbandry",
    ticks: 180,
    cost: { food: "20", wood: "12" },
    needsAny: ["farm", "granary", "academy"],
    unlocks: [] as const,
    effect: "Farms and granaries yield more food.",
  },
  forestry: {
    id: "forestry",
    name: "Forestry",
    ticks: 180,
    cost: { wood: "20", food: "10" },
    needsAny: ["lumber_camp", "sawmill", "academy"],
    unlocks: [] as const,
    effect: "Lumber camps and sawmills yield more wood.",
  },
  masonry: {
    id: "masonry",
    name: "Masonry",
    ticks: 200,
    cost: { stone: "16", wood: "12" },
    needsAny: ["quarry", "mason", "academy"],
    unlocks: [] as const,
    effect: "Quarries yield more stone. Finished walls hold +16 HP.",
  },
  logistics: {
    id: "logistics",
    name: "Logistics",
    ticks: 220,
    cost: { gold: "30", wood: "16", food: "12" },
    needsAny: ["barracks", "market", "academy"],
    unlocks: [] as const,
    effect: "One extra column on the board and +50 warehouse space.",
  },
  horse: {
    id: "horse",
    name: "Horse lore",
    ticks: 240,
    cost: { gold: "40", wood: "24" },
    needsAny: ["academy", "barracks"],
    unlocks: ["cavalry", "knight"],
    effect: "Unlocks cavalry and knights.",
  },
  siege: {
    id: "siege",
    name: "Siege craft",
    ticks: 360,
    cost: { gold: "70", wood: "40", stone: "30" },
    needsAny: ["siege_workshop"],
    unlocks: ["siege"],
    effect: "Unlocks siege engines.",
  },
} as const;

function anyStudyOpen(state: GameState): boolean {
  for (const id of Object.keys(RESEARCH)) {
    if (!researchDone(state, id) && researchTicksLeft(state, id) > 0) return true;
  }
  return false;
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
  if (typeId === "cavalry" || typeId === "knight") return researchDone(state, "horse");
  if (typeId === "siege") return researchDone(state, "siege");
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

export function tryStartResearch(state: GameState, id: keyof typeof RESEARCH): boolean {
  const def = RESEARCH[id];
  if (!def) return false;
  if (researchDone(state, id)) return false;
  if (anyStudyOpen(state)) return false;
  if (!def.needsAny.some((typeId) => countBuilding(state, typeId) >= 1)) return false;
  for (const [res, cost] of Object.entries(def.cost)) {
    if (D(state.resources[res] ?? "0").lt(cost)) return false;
  }
  for (const [res, cost] of Object.entries(def.cost)) {
    state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").sub(cost));
  }
  state.flags[`research_${id}_until`] = state.meta.tick + def.ticks;
  state.inputLog.push({ tick: state.meta.tick, type: "research", issuerId: "player", payload: { id } });
  return true;
}

/** Refunds the unused fraction of the study cost and frees the lectern. */
export function tryCancelResearch(state: GameState, id: keyof typeof RESEARCH): boolean {
  const def = RESEARCH[id];
  if (!def) return false;
  if (researchDone(state, id)) return false;
  const left = researchTicksLeft(state, id);
  if (left <= 0) return false;
  const frac = left / def.ticks;
  for (const [res, cost] of Object.entries(def.cost)) {
    addCapped(state, res, D(cost).mul(frac));
  }
  delete state.flags[`research_${id}_until`];
  state.inputLog.push({ tick: state.meta.tick, type: "cancel_research", issuerId: "player", payload: { id } });
  return true;
}
