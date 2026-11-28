import React from "react";
import {
  STATION_RHYTHM_NOTE_BUILDING,
  STATION_RHYTHM_NOTE_UNSTAFFED,
  STATION_RHYTHM_NOTE_UPGRADING,
  stationRhythmSnapshot,
  type GameState,
  type StationRhythm,
} from "@second-crown/sim";
import "./work-station-rhythm.css";

export type StationRhythmKind =
  | "in-rhythm"
  | "wait"
  | "unstaffed"
  | "upgrading"
  | "building";

export interface StationRhythmView extends StationRhythm {
  rhythmKind: StationRhythmKind;
}

function classifyRhythmKind(snap: StationRhythm): StationRhythmKind {
  if (snap.inRhythm) return "in-rhythm";
  if (snap.note === STATION_RHYTHM_NOTE_BUILDING) return "building";
  if (snap.note === STATION_RHYTHM_NOTE_UPGRADING) return "upgrading";
  if (snap.note === STATION_RHYTHM_NOTE_UNSTAFFED) return "unstaffed";
  return "wait";
}

/**
 * Pure wrapper around `stationRhythmSnapshot(state, buildingId)` with safe guards
 * so `WorkCard` draws linked repeating rhythm dots when `inRhythm` is active.
 */
export function resolveStationRhythm(
  state: GameState | null | undefined,
  buildingId: string | null | undefined,
): StationRhythmView | null {
  if (!state?.flags || !Array.isArray(state.buildings) || !buildingId) return null;
  const snap = stationRhythmSnapshot(state, buildingId);
  if (!snap) return null;
  return {
    ...snap,
    rhythmKind: classifyRhythmKind(snap),
  };
}

/**
 * Calm steady-cadence rhythm badge for work-station cards in `WorkCard`, reading
 * `stationRhythmSnapshot`. Draws three linked repeating dots when `inRhythm` is true
 * and hides cleanly when `null` or `living_station_rhythm` is off.
 */
export const WorkStationRhythmBadge: React.FC<{
  state: GameState | null | undefined;
  buildingId: string;
}> = ({ state, buildingId }) => {
  const v = resolveStationRhythm(state, buildingId);
  if (!v) return null;

  return (
    <div
      className={`sc-wrhy-row is-${v.rhythmKind}`}
      data-wrhy-in-rhythm={v.inRhythm ? "true" : "false"}
      data-wrhy-kind={v.rhythmKind}
    >
      {v.inRhythm ? (
        <span className="sc-wrhy-seal is-in-rhythm">
          <svg
            className="sc-wrhy-pulse"
            viewBox="0 0 22 10"
            width={22}
            height={10}
            aria-hidden="true"
          >
            <line
              x1="4"
              y1="5"
              x2="18"
              y2="5"
              stroke="currentColor"
              strokeWidth="0.9"
              opacity="0.55"
            />
            <circle className="sc-wrhy-dot-1" cx="4" cy="5" r="1.6" fill="currentColor" />
            <circle className="sc-wrhy-dot-2" cx="11" cy="5" r="1.6" fill="currentColor" />
            <circle className="sc-wrhy-dot-3" cx="18" cy="5" r="1.6" fill="currentColor" />
          </svg>
          <span>Rhythm +1%</span>
        </span>
      ) : null}
      <span className="sc-wrhy-note">{v.note}</span>
    </div>
  );
};
