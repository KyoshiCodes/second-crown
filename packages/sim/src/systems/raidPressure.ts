import type { GameState } from "@second-crown/shared";
import { countBuilding } from "../content/buildings.js";
import { keepLevel } from "../actions/upgrade.js";
import {
  BREACH_RESPITE_TICKS,
  BREACH_SHRINK_PER_TYPE,
  RAID_MIN_PER_TYPE,
  RAID_STAGES,
  type RaidStage,
} from "../content/raids.js";

/** Flag: how many home raids in a row have breached the hold. Missing = 0 (older saves). */
export const BREACH_RUN_FLAG = "home_raid_breach_run";

/** Which raid stage the player is in. Pure read of finished walls and the Keep. */
export function raidStage(state: GameState): RaidStage {
  const keep = keepLevel(state);
  if (keep >= 3) return RAID_STAGES.keep3;
  if (keep >= 2) return RAID_STAGES.keep2;
  if (countBuilding(state, "walls") >= 1) return RAID_STAGES.walled;
  return RAID_STAGES.unwalled;
}

export function breachRun(state: GameState): number {
  const v = Number(state.flags[BREACH_RUN_FLAG] ?? 0);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

/** Ticks from one home raid's launch to the next: the stage gap plus any breach respite. */
export function homeRaidGap(state: GameState): number {
  const run = breachRun(state);
  const respite = BREACH_RESPITE_TICKS[Math.min(run, BREACH_RESPITE_TICKS.length - 1)] ?? 0;
  return raidStage(state).gap + respite;
}

/** Column cap per unit type for the next home raid. */
export function homeRaidPerType(state: GameState): number {
  return Math.max(RAID_MIN_PER_TYPE, raidStage(state).perType - BREACH_SHRINK_PER_TYPE * breachRun(state));
}

/** Called once a home siege resolves: a hold resets the run, a breach adds one. */
export function noteHomeSiegeResult(state: GameState, held: boolean): void {
  if (held) delete state.flags[BREACH_RUN_FLAG];
  else state.flags[BREACH_RUN_FLAG] = breachRun(state) + 1;
}
