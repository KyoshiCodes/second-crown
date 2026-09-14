import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";
import { addCapped } from "./storage.js";

export const RESEARCH = {
  horse: {
    id: "horse",
    name: "Horse lore",
    ticks: 240,
    cost: { gold: "40", wood: "24" },
    // Prefers a finished Academy; a Barracks still unlocks it so existing testers aren't soft-locked.
    needsAny: ["academy", "barracks"],
    unlocks: ["cavalry", "knight"],
  },
  siege: {
    id: "siege",
    name: "Siege craft",
    ticks: 360,
    cost: { gold: "70", wood: "40", stone: "30" },
    needsAny: ["siege_workshop"],
    unlocks: ["siege"],
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
