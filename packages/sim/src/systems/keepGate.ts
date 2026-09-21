import type { GameState } from "@second-crown/shared";
import { keepLevel, MAX_BUILDING_LEVEL } from "../actions/upgrade.js";

export interface KeepGateRow {
  keep: number;
  otherCap: number;
  note: string;
  marshal: string;
}

/** Same rule as maxLevelFor: other buildings may reach keep+1, floored at 2, capped at 5. */
export const KEEP_GATES: readonly KeepGateRow[] = [
  { keep: 0, otherCap: 2, note: "No keep. Works stop at level 2.", marshal: "Rank 1 only." },
  { keep: 1, otherCap: 2, note: "Keep I. Works still stop at level 2.", marshal: "Rank 1 only." },
  { keep: 2, otherCap: 3, note: "Keep II. Works may reach level 3.", marshal: "Rank 2 unlocks (80 gold)." },
  { keep: 3, otherCap: 4, note: "Keep III. Works may reach level 4.", marshal: "Rank 2 available." },
  { keep: 4, otherCap: 5, note: "Keep IV. Works may reach level 5.", marshal: "Rank 2 available." },
  { keep: 5, otherCap: 5, note: "Keep V. Hard cap. Yard still feeds nearby works.", marshal: "Rank 2 available." },
];

export function keepGateFor(keep: number): KeepGateRow {
  const k = Math.max(0, Math.min(MAX_BUILDING_LEVEL, Math.floor(keep)));
  return KEEP_GATES.find((r) => r.keep === k) ?? KEEP_GATES[0];
}

export function currentKeepGate(state: GameState, realmId = "player"): KeepGateRow {
  return keepGateFor(keepLevel(state, realmId));
}
