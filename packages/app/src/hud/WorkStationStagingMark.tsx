import React from "react";
import {
  WORK_STATION_NOTE_BUILDING,
  WORK_STATION_NOTE_UPGRADING,
  workStationStagingSnapshot,
  type GameState,
  type WorkStationStaging,
} from "@second-crown/sim";
import "./work-station-staging.css";

export type WorkStationStagingState =
  | "staged"
  | "empty"
  | "building"
  | "upgrading";

export interface WorkStationStagingView extends WorkStationStaging {
  stationKey: string;
  stagingState: WorkStationStagingState;
}

function classifyStaging(snap: WorkStationStaging): WorkStationStagingState {
  if (snap.staged !== null) return "staged";
  if (snap.note === WORK_STATION_NOTE_BUILDING) return "building";
  if (snap.note === WORK_STATION_NOTE_UPGRADING) return "upgrading";
  return "empty";
}

/**
 * Pure wrapper around `workStationStagingSnapshot(state, buildingId)` with
 * safe guards so buildings without a work station hide cleanly.
 */
export function resolveWorkStationStaging(
  state: GameState | null | undefined,
  buildingId: string | null | undefined,
): WorkStationStagingView | null {
  if (!state?.flags || !Array.isArray(state.buildings) || !buildingId) return null;
  const snap = workStationStagingSnapshot(state, buildingId);
  if (!snap) return null;
  return {
    ...snap,
    stationKey: snap.station.toLowerCase(),
    stagingState: classifyStaging(snap),
  };
}

/**
 * Clear visual-only staging mark and pose badge for buildings that take a
 * citizen worker from `workStationStagingSnapshot`. Hides cleanly when `null`.
 */
export const WorkStationStagingBadge: React.FC<{
  state: GameState | null | undefined;
  buildingId: string;
}> = ({ state, buildingId }) => {
  const v = resolveWorkStationStaging(state, buildingId);
  if (!v) return null;

  return (
    <div
      className={`sc-wstg-row is-${v.stagingState}`}
      data-wstg-station={v.stationKey}
      data-wstg-state={v.stagingState}
      data-wstg-pose={v.staged ?? ""}
    >
      <svg
        className="sc-wstg-pad"
        viewBox="0 0 14 14"
        width={14}
        height={14}
        aria-hidden="true"
      >
        <circle
          cx="7"
          cy="7"
          r="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray={v.stagingState === "staged" ? undefined : "2 1.5"}
          opacity={v.stagingState === "staged" ? 0.9 : 0.6}
        />
        {v.stagingState === "staged" ? (
          <circle
            className="sc-wstg-pad-worker"
            cx="7"
            cy="7"
            r="2.3"
            fill="currentColor"
          />
        ) : (
          <path
            d="M5.2 7 H8.8 M7 5.2 V8.8"
            stroke="currentColor"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity={0.7}
          />
        )}
      </svg>
      <span className="sc-wstg-station">{v.station}</span>
      {v.staged ? <span className="sc-wstg-pose">{v.staged}</span> : null}
      <span className="sc-wstg-note">{v.note}</span>
    </div>
  );
};
