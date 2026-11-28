import React from "react";
import {
  WORK_STATION_DEPTH_NOTE_BUILDING,
  WORK_STATION_DEPTH_NOTE_LOW_TIER,
  WORK_STATION_DEPTH_NOTE_NO_BASE,
  WORK_STATION_DEPTH_NOTE_UPGRADING,
  workStationDepthSnapshot,
  type GameState,
  type WorkStationDepth,
} from "@second-crown/sim";
import "./work-station-depth.css";

export type WorkStationDepthState =
  | "active"
  | "low-tier"
  | "building"
  | "upgrading"
  | "no-base"
  | "inactive";

export interface WorkStationDepthView extends WorkStationDepth {
  stateKind: WorkStationDepthState;
}

function classifyDepthState(snap: WorkStationDepth): WorkStationDepthState {
  if (snap.active) return "active";
  if (snap.note === WORK_STATION_DEPTH_NOTE_LOW_TIER) return "low-tier";
  if (snap.note === WORK_STATION_DEPTH_NOTE_BUILDING) return "building";
  if (snap.note === WORK_STATION_DEPTH_NOTE_UPGRADING) return "upgrading";
  if (snap.note === WORK_STATION_DEPTH_NOTE_NO_BASE) return "no-base";
  return "inactive";
}

/**
 * Pure wrapper around `workStationDepthSnapshot(state, buildingId)` with safe guards
 * so `WorkCard` shows the clear second mark when the Tier II+ seasoned bonus is active.
 */
export function resolveWorkStationDepth(
  state: GameState | null | undefined,
  buildingId: string | null | undefined,
): WorkStationDepthView | null {
  if (!state?.flags || !Array.isArray(state.buildings) || !buildingId) return null;
  const snap = workStationDepthSnapshot(state, buildingId);
  if (!snap) return null;
  return {
    ...snap,
    stateKind: classifyDepthState(snap),
  };
}

/**
 * Calm second-mark seal and note for seasoned Tier II+ station buildings in `WorkCard`,
 * reading `workStationDepthSnapshot`. Hides cleanly when `null`.
 */
export const WorkStationDepthBadge: React.FC<{
  state: GameState | null | undefined;
  buildingId: string;
}> = ({ state, buildingId }) => {
  const v = resolveWorkStationDepth(state, buildingId);
  if (!v) return null;

  return (
    <div
      className={`sc-wdep-row is-${v.stateKind}`}
      data-wdep-active={v.active ? "true" : "false"}
      data-wdep-state={v.stateKind}
    >
      <span className={`sc-wdep-seal is-${v.stateKind}`}>
        <span className="sc-wdep-mark" aria-hidden="true">
          <span className="sc-wdep-pip is-first" />
          <span className="sc-wdep-pip is-second" />
        </span>
        <span>{v.depth}</span>
      </span>
      <span className="sc-wdep-note">{v.note}</span>
    </div>
  );
};
