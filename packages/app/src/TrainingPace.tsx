import React from "react";
import { listUnitTypes, trainDurationTicks, unitUnlocked, type GameState } from "@second-crown/sim";
import "./training-pace.css";

/** Batch the pace line reports: ten militia, same as the x10 levy button. */
export const PACE_UNIT = "militia";
export const PACE_COUNT = 10;

/** Where each locked unit is opened. Shared with the Army tab unit cards. */
export function lockNote(id: string): string {
  if (id === "cavalry" || id === "knight") return "Study Horse lore on Crown (Keep II).";
  if (id === "siege") return "Study Siege craft on Crown (Keep III + workshop).";
  if (id === "ranger") return "Study Fieldcraft on Crown (Archery Range or Academy).";
  if (id === "banner") return "Study Drill on Crown (Barracks or Academy).";
  if (id === "outrider") return "Study Horse lore on Crown (Keep II).";
  if (id === "warden") return "Study Screening on Crown (Barracks or Academy).";
  if (id === "lancer") return "Study Horse lore on Crown (Keep II).";
  return "";
}

/** Sim ticks to whole seconds (10 ticks per second), same rounding as the unit cards. */
function secs(ticks: number): number {
  return Math.ceil(ticks / 10);
}

/** Current and base drill time for the pace batch, both straight from the sim. Read-only. */
export function trainingPace(state: GameState): { now: number; base: number } {
  const def = listUnitTypes().find((u) => u.id === PACE_UNIT);
  const now = trainDurationTicks(state, PACE_UNIT, PACE_COUNT);
  return { now, base: def ? def.trainTicks * PACE_COUNT : now };
}

/** First unit in roster order that the sim still keeps locked. Read-only. */
export function nextUnitUnlock(state: GameState): { id: string; name: string; note: string } | null {
  const u = listUnitTypes().find((t) => !unitUnlocked(state, t.id));
  return u ? { id: u.id, name: u.name, note: lockNote(u.id) } : null;
}

export interface TrainingPaceGlyphPipProps {
  fast?: boolean;
  nextId?: string;
  allUnlocked?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Living training pace glyph:
 * - fast: crossed steel drill blades with speed cardinal ticks, golden pommels, radiant martial star, and breathing emerald aura
 * - base: calm iron and bronze training blades with slate drill ring and center pivot
 * - allUnlocked: master martial laurel wreath with gilded victory blades and triumphant emerald star
 */
export function TrainingPaceGlyphPip({
  fast = false,
  nextId,
  allUnlocked = false,
  size = 16,
  className = "",
  style,
}: TrainingPaceGlyphPipProps) {
  const paceClass = fast ? "is-fast" : "is-base";
  const unlockedClass = allUnlocked ? " is-all-unlocked" : "";

  return (
    <span
      className={`sc-training-pace-glyph-wrap ${paceClass}${unlockedClass} ${className}`.trim()}
      style={{ width: size, height: size, pointerEvents: "none", ...style }}
      aria-hidden="true"
      data-training={fast ? "fast" : "base"}
      data-all-unlocked={allUnlocked ? "true" : "false"}
      data-next-id={nextId}
    >
      {fast && <span className="sc-training-pace-aura" aria-hidden="true" />}
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className={`sc-training-pace-glyph ${paceClass}`}
        style={{ pointerEvents: "none" }}
      >
        {allUnlocked ? (
          <>
            {/* Master Martial Laurel Wreath & Victory Blades */}
            <path
              d="M2.8 8.5 C2.8 11.8 5.2 13.5 8 13.5 C10.8 13.5 13.2 11.8 13.2 8.5"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
            {/* Crossed gilded victory blades */}
            <line x1="4.2" y1="11.8" x2="11.8" y2="4.2" stroke="#fef08a" strokeWidth="1.1" strokeLinecap="round" />
            <line x1="11.8" y1="11.8" x2="4.2" y2="4.2" stroke="#fef08a" strokeWidth="1.1" strokeLinecap="round" />
            <circle cx="8" cy="8" r="1.3" fill="#86efac" stroke="#166534" strokeWidth="0.5" />

            {/* Triumphant emerald star */}
            <polygon
              points="8,1 8.8,2.2 10,2.5 8.9,3.4 9.2,4.6 8,3.9 6.8,4.6 7.1,3.4 6,2.5 7.2,2.2"
              fill="#86efac"
              className="sc-training-pace-star"
            />
          </>
        ) : fast ? (
          <>
            {/* Fast Pace: Accelerated Barracks Drilling */}
            {/* Outer drill ring */}
            <circle
              cx="8"
              cy="8"
              r="6.2"
              fill="none"
              stroke="#86efac"
              strokeWidth="0.8"
              strokeDasharray="2.5 1.2"
            />

            {/* Crossed steel drill blades */}
            <line x1="4" y1="12" x2="12" y2="4" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="5.2" y1="9.6" x2="6.4" y2="10.8" stroke="#fbbf24" strokeWidth="1.1" strokeLinecap="round" />
            <circle cx="3.5" cy="12.5" r="0.8" fill="#fbbf24" />

            <line x1="12" y1="12" x2="4" y2="4" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="10.8" y1="9.6" x2="9.6" y2="10.8" stroke="#fbbf24" strokeWidth="1.1" strokeLinecap="round" />
            <circle cx="12.5" cy="12.5" r="0.8" fill="#fbbf24" />

            {/* Center clash boss */}
            <circle cx="8" cy="8" r="1.5" fill="#15803d" stroke="#86efac" strokeWidth="0.6" />

            {/* Apex clash diamond star */}
            <polygon
              points="8,1.2 8.7,2.5 10,2.8 8.9,3.8 9.2,5 8,4.2 6.8,5 7.1,3.8 6,2.8 7.3,2.5"
              fill="#ffffff"
              className="sc-training-pace-star"
            />

            {/* 4 Cardinal speed drill ticks */}
            <line x1="8" y1="1.2" x2="8" y2="2.6" stroke="#86efac" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="14.8" y1="8" x2="13.4" y2="8" stroke="#86efac" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="8" y1="14.8" x2="8" y2="13.4" stroke="#86efac" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="1.2" y1="8" x2="2.6" y2="8" stroke="#86efac" strokeWidth="0.8" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Base Pace: Standard Militia Drilling */}
            {/* Outer slate drill ring */}
            <circle
              cx="8"
              cy="8"
              r="6"
              fill="none"
              stroke="#64748b"
              strokeWidth="0.85"
            />

            {/* Crossed practice blades */}
            <line x1="4.5" y1="11.5" x2="11.5" y2="4.5" stroke="#94a3b8" strokeWidth="1.1" strokeLinecap="round" />
            <line x1="5.6" y1="9.4" x2="6.6" y2="10.4" stroke="#78350f" strokeWidth="1" strokeLinecap="round" />
            <circle cx="4" cy="12" r="0.7" fill="#78350f" />

            <line x1="11.5" y1="11.5" x2="4.5" y2="4.5" stroke="#64748b" strokeWidth="1.1" strokeLinecap="round" />
            <line x1="10.4" y1="9.4" x2="9.4" y2="10.4" stroke="#78350f" strokeWidth="1" strokeLinecap="round" />
            <circle cx="12" cy="12" r="0.7" fill="#78350f" />

            {/* Center practice pivot */}
            <circle cx="8" cy="8" r="1.2" fill="#334155" stroke="#64748b" strokeWidth="0.6" />

            {/* 4 Coordinate pips */}
            <circle cx="8" cy="2" r="0.6" fill="#64748b" />
            <circle cx="14" cy="8" r="0.6" fill="#64748b" />
            <circle cx="8" cy="14" r="0.6" fill="#64748b" />
            <circle cx="2" cy="8" r="0.6" fill="#64748b" />
          </>
        )}
      </svg>
    </span>
  );
}

export function TrainingPace(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const { now, base } = trainingPace(state);
  const fast = now < base;
  const next = nextUnitUnlock(state);
  return (
    <p className={`sc-training-pace${fast ? " is-fast" : ""}`} data-training={fast ? "fast" : "base"}>
      <TrainingPaceGlyphPip
        fast={fast}
        nextId={next?.id}
        allUnlocked={!next}
      />
      Training · <strong>{PACE_COUNT} militia in {secs(now)}s</strong>
      {fast ? ` (base ${secs(base)}s)` : " (base rate)"}
      {next ? (
        <>
          {" "}· next unit <strong>{next.name}</strong>
          {next.note ? ` · ${next.note.replace(/\.$/, "")}` : ""}
        </>
      ) : (
        " · every unit unlocked"
      )}
      .
    </p>
  );
}
