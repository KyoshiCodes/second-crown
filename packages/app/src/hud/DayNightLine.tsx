import React from "react";
import { sunMoonPosition, type GameState } from "@second-crown/sim";
import { resolveBoardLightPhase, type BoardDayPhase } from "../BoardLiving";
import "./day-night-line.css";

/**
 * Display-only copy of the sim's night rule. The sim owns it (`nightWorkFactor` in
 * `systems/dayNight.ts`: a gather column that gets home at night banks 80% of its load) but does
 * not export it. DayNightLine.test.tsx runs real gather columns home through the sim by day and
 * by night, so a sim change fails the test instead of quietly showing a wrong number.
 */
export const NIGHT_GATHER_PENALTY_PCT = 20;

export const DAY_PHASE_NAMES: Record<BoardDayPhase, string> = {
  dawn: "Dawn",
  day: "Day",
  dusk: "Dusk",
  night: "Night",
};

/** The hour never changes vision range or fog in the sim. Only weather and watchtowers do. */
export const DAY_NIGHT_SIGHT_TEXT = "Sight: the same at every hour";

export interface DayNightStatus {
  phase: BoardDayPhase;
  name: string;
  isNight: boolean;
  /** Percent cut from a gather haul that gets home in this phase. 0 unless it is night. */
  gatherPenaltyPct: number;
  workText: string;
  sightText: string;
}

/**
 * Reads the hour and looks up its effect text. No rules here. Night comes from the sim's own
 * `sunMoonPosition` (the moon is up exactly while the night rule applies). Dawn, day and dusk have
 * no rule in the sim, so their names come from the board's existing light phase and always match
 * the sky the board draws.
 */
export function dayNightStatus(state: GameState): DayNightStatus {
  const isNight = sunMoonPosition(state).kind === "moon";
  const light = resolveBoardLightPhase(state);
  const phase: BoardDayPhase = isNight ? "night" : light === "night" ? "day" : light;
  const gatherPenaltyPct = isNight ? NIGHT_GATHER_PENALTY_PCT : 0;
  return {
    phase,
    name: DAY_PHASE_NAMES[phase],
    isNight,
    gatherPenaltyPct,
    workText: isNight
      ? `Gather columns that get home now bring ${NIGHT_GATHER_PENALTY_PCT}% less`
      : "Gather columns bring full loads home",
    sightText: DAY_NIGHT_SIGHT_TEXT,
  };
}

/** Small sun (dawn, day, dusk) or crescent moon (night). Decorative. */
function DayNightIcon(props: { phase: BoardDayPhase }) {
  const { phase } = props;
  return (
    <svg className="sc-day-night-icon" width={14} height={14} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      {phase === "night" ? (
        <path d="M9.6 1.6a5.6 5.6 0 1 0 2.8 8.3 4.6 4.6 0 0 1-2.8-8.3z" fill="currentColor" />
      ) : (
        <>
          <circle cx={7} cy={7} r={phase === "day" ? 3 : 2.4} fill="currentColor" />
          <path
            d="M7 0.8v1.8M7 11.4v1.8M0.8 7h1.8M11.4 7h1.8M2.6 2.6l1.3 1.3M10.1 10.1l1.3 1.3M2.6 11.4l1.3-1.3M10.1 3.9l1.3-1.3"
            stroke="currentColor"
            strokeWidth={1.1}
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
    </svg>
  );
}

/**
 * Day/night status line: the current phase, what it does to work, and what it does to sight.
 * Read-only. Used on the Kingdom tab and on the province inspect card.
 */
export function DayNightLine(props: { state: GameState | undefined; className?: string }) {
  const { state, className = "" } = props;
  if (!state) return null;
  const s = dayNightStatus(state);
  return (
    <div
      className={`sc-day-night is-${s.phase}${className ? ` ${className}` : ""}`}
      data-day-phase={s.phase}
      data-gather-penalty-pct={s.gatherPenaltyPct}
    >
      <DayNightIcon phase={s.phase} />
      <span className="sc-day-night-text">
        <span className="sc-day-night-label">Time of day</span> · <strong>{s.name}</strong> ·{" "}
        <span className="sc-day-night-work">{s.workText}</span> ·{" "}
        <span className="sc-day-night-sight">{s.sightText}</span>
      </span>
    </div>
  );
}
