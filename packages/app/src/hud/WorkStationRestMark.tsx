import React from "react";
import {
  STATION_REST_NOTE_BUILDING,
  STATION_REST_NOTE_FRESH,
  stationRestSnapshot,
  type GameState,
  type StationRest,
} from "@second-crown/sim";
import "./work-station-rest.css";

export type StationRestKind = "resting" | "fresh" | "working" | "building";

export interface StationRestView extends StationRest {
  restKind: StationRestKind;
}

function classifyRestKind(snap: StationRest): StationRestKind {
  if (snap.resting) return "resting";
  if (snap.note === STATION_REST_NOTE_FRESH) return "fresh";
  if (snap.note === STATION_REST_NOTE_BUILDING) return "building";
  return "working";
}

/**
 * Pure wrapper around `stationRestSnapshot(state, buildingId)` with safe guards
 * so `WorkCard` draws a quiet dim crescent mark during night rest.
 */
export function resolveStationRest(
  state: GameState | null | undefined,
  buildingId: string | null | undefined,
): StationRestView | null {
  if (!state?.flags || !Array.isArray(state.buildings) || !buildingId) return null;
  const snap = stationRestSnapshot(state, buildingId);
  if (!snap) return null;
  return {
    ...snap,
    restKind: classifyRestKind(snap),
  };
}

/**
 * Calm night-rest & dawn-fresh indicator for work-station cards in `WorkCard`, reading
 * `stationRestSnapshot`. Draws a dim crescent when `resting` is true and hides
 * cleanly when `null` or `living_station_rest` is off.
 */
export const WorkStationRestBadge: React.FC<{
  state: GameState | null | undefined;
  buildingId: string;
}> = ({ state, buildingId }) => {
  const v = resolveStationRest(state, buildingId);
  if (!v) return null;

  return (
    <div
      className={`sc-wrest-row is-${v.restKind}`}
      data-wrest-resting={v.resting ? "true" : "false"}
      data-wrest-kind={v.restKind}
    >
      {v.resting ? (
        <span className="sc-wrest-seal is-resting">
          <svg
            className="sc-wrest-crescent"
            viewBox="0 0 12 12"
            width={12}
            height={12}
            aria-hidden="true"
          >
            <path
              d="M7.6 2.1 A4.1 4.1 0 1 0 10.2 8.7 A3.3 3.3 0 1 1 7.6 2.1 Z"
              fill="currentColor"
              opacity="0.88"
            />
          </svg>
          <span>Resting</span>
        </span>
      ) : v.restKind === "fresh" ? (
        <span className="sc-wrest-seal is-fresh">
          <span className="sc-wrest-pip" aria-hidden="true" />
          <span>Fresh +2%</span>
        </span>
      ) : null}
      <span className="sc-wrest-note">{v.note}</span>
    </div>
  );
};
