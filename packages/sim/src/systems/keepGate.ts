import type { GameState } from "@second-crown/shared";
import { keepLevel, MAX_BUILDING_LEVEL } from "../actions/upgrade.js";

export interface KeepGateRow {
  keep: number;
  otherCap: number;
  note: string;
  marshal: string;
  trainCap: number;
  trainSpeed: number;
  storeMult: number;
}

/** Same rule as maxLevelFor: other buildings may reach keep+1, floored at 2, capped at 5. */
export const KEEP_GATES: readonly KeepGateRow[] = [
  { keep: 0, otherCap: 2, note: "No keep. Works stop at level 2.", marshal: "Rank 1 only.", trainCap: 2, trainSpeed: 1, storeMult: 1 },
  { keep: 1, otherCap: 2, note: "Keep I. Works still stop at level 2.", marshal: "Rank 1 only.", trainCap: 2, trainSpeed: 1, storeMult: 1 },
  { keep: 2, otherCap: 3, note: "Keep II. Works may reach level 3.", marshal: "Rank 2 unlocks (80 gold).", trainCap: 3, trainSpeed: 0.92, storeMult: 1.2 },
  { keep: 3, otherCap: 4, note: "Keep III. Works may reach level 4.", marshal: "Rank 2 available.", trainCap: 4, trainSpeed: 0.88, storeMult: 1.4 },
  { keep: 4, otherCap: 5, note: "Keep IV. Works may reach level 5.", marshal: "Rank 2 available.", trainCap: 5, trainSpeed: 0.84, storeMult: 1.6 },
  { keep: 5, otherCap: 5, note: "Keep V. Hard cap. Yard still feeds nearby works.", marshal: "Rank 2 available.", trainCap: 5, trainSpeed: 0.8, storeMult: 1.8 },
];

export function keepGateFor(keep: number): KeepGateRow {
  const k = Math.max(0, Math.min(MAX_BUILDING_LEVEL, Math.floor(keep)));
  return KEEP_GATES.find((r) => r.keep === k) ?? KEEP_GATES[0];
}

export function currentKeepGate(state: GameState, realmId = "player"): KeepGateRow {
  return keepGateFor(keepLevel(state, realmId));
}
