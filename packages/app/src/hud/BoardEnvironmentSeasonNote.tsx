import React from "react";
import {
  ENVIRONMENT_SEASON_NOTE,
  environmentSnapshot,
  type GameState,
} from "@second-crown/sim";
import "./board-environment-season-note.css";

export type BoardEnvironmentSeasonKind = "spring" | "summer" | "autumn" | "winter";

export interface BoardEnvironmentSeasonNoteView {
  seasonNote: string;
  seasonKind: BoardEnvironmentSeasonKind;
}

function classifySeasonKind(seasonNote: string): BoardEnvironmentSeasonKind {
  if (seasonNote === ENVIRONMENT_SEASON_NOTE.Summer) return "summer";
  if (seasonNote === ENVIRONMENT_SEASON_NOTE.Autumn) return "autumn";
  if (seasonNote === ENVIRONMENT_SEASON_NOTE.Winter) return "winter";
  return "spring";
}

/**
 * Pure wrapper reading `environmentSnapshot(state)?.seasonNote` with safe guards
 * so `BoardLiving` shows a quiet third seasonal mark beneath `BoardEnvironmentMoodPill`.
 * Returns `null` when the snapshot or `seasonNote` (`living_environment_notes`) is null.
 */
export function resolveBoardEnvironmentSeasonNote(
  state: GameState | null | undefined,
): BoardEnvironmentSeasonNoteView | null {
  if (!state?.flags || !Array.isArray(state.board?.provinces)) return null;
  const snap = environmentSnapshot(state);
  if (!snap || !snap.seasonNote) return null;
  return {
    seasonNote: snap.seasonNote,
    seasonKind: classifySeasonKind(snap.seasonNote),
  };
}

function renderSeasonMark(kind: BoardEnvironmentSeasonKind): React.ReactNode {
  switch (kind) {
    case "summer":
      return <circle cx="5" cy="5" r="2.3" fill="currentColor" opacity="0.85" />;
    case "autumn":
      return <path d="M5 1.8 Q7.8 4.4 5 8.2 Q2.2 4.4 5 1.8 Z" fill="none" stroke="currentColor" strokeWidth="1.05" />;
    case "winter":
      return <path d="M5 1.5 V8.5 M2 3.2 L8 6.8 M8 3.2 L2 6.8" fill="none" stroke="currentColor" strokeWidth="0.95" strokeLinecap="round" />;
    case "spring":
    default:
      return <path d="M5 8.4 V3.4 M5 5.4 Q7.2 3.2 7.8 3.6 M5 6.2 Q2.8 4.2 2.4 4.6" fill="none" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />;
  }
}

/**
 * Calm top-right third environment pill stacked beneath `BoardEnvironmentMoodPill`,
 * reading `environmentSnapshot(state).seasonNote`. Hides cleanly when `null` or switched off.
 */
export const BoardEnvironmentSeasonNotePill: React.FC<{
  state: GameState | null | undefined;
}> = ({ state }) => {
  const v = resolveBoardEnvironmentSeasonNote(state);
  if (!v) return null;

  return (
    <div
      className={`sc-bseason-pill is-${v.seasonKind}`}
      data-bseason-note={v.seasonNote}
      data-bseason-kind={v.seasonKind}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <svg
        className="sc-bseason-mark"
        viewBox="0 0 10 10"
        width={10}
        height={10}
        aria-hidden="true"
      >
        {renderSeasonMark(v.seasonKind)}
      </svg>
      <span className="sc-bseason-label">{v.seasonNote}</span>
    </div>
  );
};
