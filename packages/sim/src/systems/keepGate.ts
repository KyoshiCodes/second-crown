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
  marchCap: number;
  /** Beds from Keep alone. Cottages still add +2 beds per cottage level. */
  bedBase: number;
  /** Work plots from Keep alone. Cottages still add +2 plots per cottage level. */
  plotBase: number;
}

/** Same rule as maxLevelFor: other buildings may reach keep+1, floored at 2, capped at 5. */
export const KEEP_GATES: readonly KeepGateRow[] = [
  { keep: 0, otherCap: 2, note: "No keep. Works stop at level 2.", marshal: "Rank 1 only.", trainCap: 2, trainSpeed: 1, storeMult: 1, marchCap: 2, bedBase: 2, plotBase: 2 },
  { keep: 1, otherCap: 2, note: "Keep I. Works still stop at level 2.", marshal: "Rank 1 only.", trainCap: 2, trainSpeed: 1, storeMult: 1, marchCap: 2, bedBase: 5, plotBase: 3 },
  { keep: 2, otherCap: 3, note: "Keep II. Works may reach level 3.", marshal: "Rank 2 unlocks (80 gold).", trainCap: 3, trainSpeed: 0.92, storeMult: 1.2, marchCap: 3, bedBase: 8, plotBase: 4 },
  { keep: 3, otherCap: 4, note: "Keep III. Works may reach level 4.", marshal: "Rank 2 available.", trainCap: 4, trainSpeed: 0.88, storeMult: 1.4, marchCap: 4, bedBase: 11, plotBase: 5 },
  { keep: 4, otherCap: 5, note: "Keep IV. Works may reach level 5.", marshal: "Rank 2 available.", trainCap: 5, trainSpeed: 0.84, storeMult: 1.6, marchCap: 5, bedBase: 14, plotBase: 6 },
  { keep: 5, otherCap: 5, note: "Keep V. Hard cap. Yard still feeds nearby works.", marshal: "Rank 2 available.", trainCap: 5, trainSpeed: 0.8, storeMult: 1.8, marchCap: 5, bedBase: 17, plotBase: 7 },
];

export function keepGateFor(keep: number): KeepGateRow {
  const k = Math.max(0, Math.min(MAX_BUILDING_LEVEL, Math.floor(keep)));
  return KEEP_GATES.find((r) => r.keep === k) ?? KEEP_GATES[0];
}

export function currentKeepGate(state: GameState, realmId = "player"): KeepGateRow {
  return keepGateFor(keepLevel(state, realmId));
}
