import type { GameState } from "@second-crown/shared";
import { RESEARCH, researchDone } from "./research.js";
import { DECREES } from "./decree.js";

/**
 * Timers that change income without any other system noticing: a study finishing
 * (yield, warehouse space) and a decree running out (Harvest Rite). Offline catch-up
 * batches at a flat rate, so it must stop on these ticks to end as live ticks would.
 */
export const TimedEffectsSystem = {
  nextEventTick(state: GameState): number | null {
    const now = state.meta.tick;
    let earliest: number | null = null;
    const consider = (t: number) => {
      if (t > now && (earliest === null || t < earliest)) earliest = t;
    };
    for (const id of Object.keys(RESEARCH)) {
      if (Number(state.flags[`research_${id}`] ?? 0) === 1) continue;
      consider(Number(state.flags[`research_${id}_until`] ?? 0));
    }
    for (const d of DECREES) consider(Number(state.flags[`decree_${d.id}_until`] ?? 0));
    return earliest;
  },

  /** Mark studies whose finish tick has come, so flag readers (warehouse space) agree with researchDone. */
  processEventsAt(state: GameState, _tick: number): void {
    for (const id of Object.keys(RESEARCH)) {
      if (state.flags[`research_${id}_until`] !== undefined) researchDone(state, id);
    }
  },

  /** Batches never cross one of these ticks, so there is nothing to settle in between. */
  advanceAnalytic(_state: GameState, _from: number, _to: number): void {},
};
