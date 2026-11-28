import React from "react";
import {
  STATION_CARE_NOTE_BUILDING,
  STATION_CARE_NOTE_RESTING,
  STATION_CARE_NOTE_UPGRADING,
  stationCareSnapshot,
  type GameState,
  type StationCare,
} from "@second-crown/sim";
import "./work-station-care.css";

export type StationCareKind =
  | "cared"
  | "resting"
  | "unstaffed"
  | "upgrading"
  | "building";

export interface StationCareView extends StationCare {
  careKind: StationCareKind;
}

function classifyCareKind(snap: StationCare): StationCareKind {
  if (snap.cared) return "cared";
  if (snap.note === STATION_CARE_NOTE_BUILDING) return "building";
  if (snap.note === STATION_CARE_NOTE_UPGRADING) return "upgrading";
  if (snap.note === STATION_CARE_NOTE_RESTING) return "resting";
  return "unstaffed";
}

/**
 * Pure wrapper around `stationCareSnapshot(state, buildingId)` with safe guards
 * so `WorkCard` draws a thin care heart when `cared` is active.
 */
export function resolveStationCare(
  state: GameState | null | undefined,
  buildingId: string | null | undefined,
): StationCareView | null {
  if (!state?.flags || !Array.isArray(state.buildings) || !buildingId) return null;
  const snap = stationCareSnapshot(state, buildingId);
  if (!snap) return null;
  return {
    ...snap,
    careKind: classifyCareKind(snap),
  };
}

/**
 * Calm station-care indicator for work-station cards in `WorkCard`, reading
 * `stationCareSnapshot`. Draws a thin heart mark when `cared` is true and hides
 * cleanly when `null` or `living_station_care` is off.
 */
export const WorkStationCareBadge: React.FC<{
  state: GameState | null | undefined;
  buildingId: string;
}> = ({ state, buildingId }) => {
  const v = resolveStationCare(state, buildingId);
  if (!v) return null;

  return (
    <div
      className={`sc-wcare-row is-${v.careKind}`}
      data-wcare-cared={v.cared ? "true" : "false"}
      data-wcare-kind={v.careKind}
    >
      {v.cared ? (
        <span className="sc-wcare-seal is-cared">
          <svg
            className="sc-wcare-heart"
            viewBox="0 0 12 12"
            width={12}
            height={12}
            aria-hidden="true"
          >
            <path
              d="M6 9.6 L2.4 6.2 A2.1 2.1 0 0 1 6 3.7 A2.1 2.1 0 0 1 9.6 6.2 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.05"
              strokeLinejoin="round"
            />
          </svg>
          <span>Care +0.5%</span>
        </span>
      ) : null}
      <span className="sc-wcare-note">{v.note}</span>
    </div>
  );
};
