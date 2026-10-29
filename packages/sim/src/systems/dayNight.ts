import type { GameState } from "@second-crown/shared";

export type DayPhase = "dawn" | "day" | "dusk" | "night";

/** One full day in ticks. Pure tick math, no rng. */
export const DAY_CYCLE_TICKS = 120;

// Phase starts within the cycle: dawn 0-19, day 20-69, dusk 70-89, night 90-119.
const PHASES: [DayPhase, number][] = [["dawn", 20], ["day", 70], ["dusk", 90], ["night", DAY_CYCLE_TICKS]];

export function dayPhaseAt(tick: number): DayPhase {
  const t = ((tick % DAY_CYCLE_TICKS) + DAY_CYCLE_TICKS) % DAY_CYCLE_TICKS;
  for (const [phase, upTo] of PHASES) if (t < upTo) return phase;
  return "night";
}

export function dayPhase(state: GameState): DayPhase {
  return dayPhaseAt(state.meta.tick);
}

export function nightWorkFactor(phase: DayPhase): number {
  return phase === "night" ? 0.8 : 1;
}
