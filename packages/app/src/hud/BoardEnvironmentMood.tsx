import React from "react";
import {
  ENVIRONMENT_MOOD_OPEN,
  ENVIRONMENT_MOOD_RESTLESS,
  ENVIRONMENT_MOOD_SOFT,
  ENVIRONMENT_MOOD_STILL,
  environmentSnapshot,
  type GameState,
} from "@second-crown/sim";
import "./board-environment-mood.css";

export type BoardEnvironmentMoodKind = "restless" | "soft" | "still" | "open";

export interface BoardEnvironmentMoodView {
  mood: string;
  moodKind: BoardEnvironmentMoodKind;
}

function classifyMoodKind(mood: string): BoardEnvironmentMoodKind {
  if (mood === ENVIRONMENT_MOOD_RESTLESS) return "restless";
  if (mood === ENVIRONMENT_MOOD_SOFT) return "soft";
  if (mood === ENVIRONMENT_MOOD_STILL) return "still";
  if (mood === ENVIRONMENT_MOOD_OPEN) return "open";
  return "open";
}

/**
 * Pure wrapper reading `environmentSnapshot(state)?.mood` with safe guards
 * so `BoardLiving` shows a quiet second mood pill near `BoardEnvironmentNote`.
 * Returns `null` when the snapshot or `mood` (`living_environment_depth`) is null.
 */
export function resolveBoardEnvironmentMood(
  state: GameState | null | undefined,
): BoardEnvironmentMoodView | null {
  if (!state?.flags || !Array.isArray(state.board?.provinces)) return null;
  const snap = environmentSnapshot(state);
  if (!snap || !snap.mood) return null;
  return {
    mood: snap.mood,
    moodKind: classifyMoodKind(snap.mood),
  };
}

function renderMoodCrest(kind: BoardEnvironmentMoodKind): React.ReactNode {
  switch (kind) {
    case "restless":
      return <polyline points="5.5,1.5 3.5,5.2 6,5.2 4.2,8.8" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />;
    case "soft":
      return <path d="M2.2 6 Q5 2.5 7.8 6 Q5 7.5 2.2 6 Z" fill="none" stroke="currentColor" strokeWidth="1.05" strokeLinejoin="round" />;
    case "still":
      return <polygon points="5,1.6 8.2,5 5,8.4 1.8,5" fill="none" stroke="currentColor" strokeWidth="1.05" />;
    case "open":
    default:
      return <circle cx="5" cy="5" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.05" />;
  }
}

/**
 * Calm top-right second environment mood pill stacked beneath `BoardEnvironmentNote`,
 * reading `environmentSnapshot(state).mood`. Hides cleanly when `null` or switched off.
 */
export const BoardEnvironmentMoodPill: React.FC<{
  state: GameState | null | undefined;
}> = ({ state }) => {
  const v = resolveBoardEnvironmentMood(state);
  if (!v) return null;

  return (
    <div
      className={`sc-bmood-pill is-${v.moodKind}`}
      data-bmood={v.mood}
      data-bmood-kind={v.moodKind}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <svg
        className="sc-bmood-crest"
        viewBox="0 0 10 10"
        width={10}
        height={10}
        aria-hidden="true"
      >
        {renderMoodCrest(v.moodKind)}
      </svg>
      <span className="sc-bmood-label">{v.mood}</span>
    </div>
  );
};
