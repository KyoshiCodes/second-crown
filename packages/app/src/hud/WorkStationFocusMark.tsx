import React from "react";
import {
  STATION_FOCUS_NOTE_BUILDING,
  STATION_FOCUS_NOTE_RESTING,
  STATION_FOCUS_NOTE_UNSTAFFED,
  STATION_FOCUS_NOTE_UPGRADING,
  stationFocusSnapshot,
  type GameState,
  type StationFocus,
} from "@second-crown/sim";
import "./work-station-focus.css";

export type StationFocusKind =
  | "focused"
  | "wait"
  | "resting"
  | "unstaffed"
  | "upgrading"
  | "building";

export interface StationFocusView extends StationFocus {
  focusKind: StationFocusKind;
}

function classifyFocusKind(snap: StationFocus): StationFocusKind {
  if (snap.focused) return "focused";
  if (snap.note === STATION_FOCUS_NOTE_BUILDING) return "building";
  if (snap.note === STATION_FOCUS_NOTE_UPGRADING) return "upgrading";
  if (snap.note === STATION_FOCUS_NOTE_UNSTAFFED) return "unstaffed";
  if (snap.note === STATION_FOCUS_NOTE_RESTING) return "resting";
  return "wait";
}

/**
 * Pure wrapper around `stationFocusSnapshot(state, buildingId)` with safe guards
 * so `WorkCard` draws a thin focus ring and centered diamond when `focused` is active.
 */
export function resolveStationFocus(
  state: GameState | null | undefined,
  buildingId: string | null | undefined,
): StationFocusView | null {
  if (!state?.flags || !Array.isArray(state.buildings) || !buildingId) return null;
  const snap = stationFocusSnapshot(state, buildingId);
  if (!snap) return null;
  return {
    ...snap,
    focusKind: classifyFocusKind(snap),
  };
}

/**
 * Calm high-light focus indicator for work-station cards in `WorkCard`, reading
 * `stationFocusSnapshot`. Draws a thin ring with centered diamond when `focused` is true
 * and hides cleanly when `null` or `living_station_focus` is off.
 */
export const WorkStationFocusBadge: React.FC<{
  state: GameState | null | undefined;
  buildingId: string;
}> = ({ state, buildingId }) => {
  const v = resolveStationFocus(state, buildingId);
  if (!v) return null;

  return (
    <div
      className={`sc-wfoc-row is-${v.focusKind}`}
      data-wfoc-focused={v.focused ? "true" : "false"}
      data-wfoc-kind={v.focusKind}
    >
      {v.focused ? (
        <span className="sc-wfoc-seal is-focused">
          <svg
            className="sc-wfoc-ring"
            viewBox="0 0 12 12"
            width={12}
            height={12}
            aria-hidden="true"
          >
            <circle
              cx="6"
              cy="6"
              r="4.3"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.95"
            />
            <polygon
              points="6,3.4 8.6,6 6,8.6 3.4,6"
              fill="currentColor"
            />
          </svg>
          <span>Focus +1%</span>
        </span>
      ) : null}
      <span className="sc-wfoc-note">{v.note}</span>
    </div>
  );
};
