import type { GameState } from "@second-crown/shared";

export type DayPhase = "dawn" | "day" | "dusk" | "night";

/** One full day in ticks (6 minutes of game time). Pure tick math, no rng. */
export const DAY_CYCLE_TICKS = 3600;

// Phase ends within the cycle: dawn 0-539 (15%), day 540-1979 (40%), dusk 1980-2519 (15%), night 2520-3599 (30%).
const DAWN_END = 540;
const DAY_END = 1980;
const DUSK_END = 2520;
const PHASES: [DayPhase, number][] = [["dawn", DAWN_END], ["day", DAY_END], ["dusk", DUSK_END], ["night", DAY_CYCLE_TICKS]];

function cycleTick(tick: number): number {
  return ((tick % DAY_CYCLE_TICKS) + DAY_CYCLE_TICKS) % DAY_CYCLE_TICKS;
}

export function dayPhaseAt(tick: number): DayPhase {
  const t = cycleTick(tick);
  for (const [phase, upTo] of PHASES) if (t < upTo) return phase;
  return "night";
}

export function dayPhase(state: GameState): DayPhase {
  return dayPhaseAt(state.meta.tick);
}

export function nightWorkFactor(phase: DayPhase): number {
  return phase === "night" ? 0.8 : 1;
}

export interface SunMoonPosition {
  kind: "sun" | "moon";
  /** 0 at the eastern horizon, 1 at the western horizon. */
  x: number;
  /** 0 at zenith, 1 at the horizon (screen-down, so a render can scale it straight to pixels). */
  y: number;
  /** 0 at the horizon, 1 at zenith. */
  elevation: number;
}

/**
 * Where the sun or moon sits at a tick. The sun rises at the start of dawn and sets at the end of dusk;
 * the moon crosses the sky during night. Each body moves on a smooth half-sine arc. Pure tick math.
 */
export function sunMoonPositionAt(tick: number): SunMoonPosition {
  const t = cycleTick(tick);
  const sun = t < DUSK_END;
  const x = sun ? t / DUSK_END : (t - DUSK_END) / (DAY_CYCLE_TICKS - DUSK_END);
  const elevation = Math.sin(Math.PI * x);
  return { kind: sun ? "sun" : "moon", x, y: 1 - elevation, elevation };
}

export function sunMoonPosition(state: GameState): SunMoonPosition {
  return sunMoonPositionAt(state.meta.tick);
}
