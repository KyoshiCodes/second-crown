import React from "react";
import {
  STATION_PAIR_NOTE_BUILDING,
  STATION_PAIR_NOTE_LEAD,
  STATION_PAIR_NOTE_TWIN,
  stationPairSnapshot,
  type GameState,
  type StationPair,
} from "@second-crown/sim";
import "./work-station-pair.css";

export type StationPairKind = "lead" | "twin" | "building" | "alone";

export interface StationPairView extends StationPair {
  pairKind: StationPairKind;
}

function classifyPairKind(snap: StationPair): StationPairKind {
  if (snap.paired) {
    return snap.note === STATION_PAIR_NOTE_LEAD ? "lead" : "twin";
  }
  if (snap.note === STATION_PAIR_NOTE_BUILDING) return "building";
  return "alone";
}

/**
 * Pure wrapper around `stationPairSnapshot(state, buildingId)` with safe guards
 * so `WorkCard` draws a calm linked-diamond pairing mark when paired.
 */
export function resolveStationPair(
  state: GameState | null | undefined,
  buildingId: string | null | undefined,
): StationPairView | null {
  if (!state?.flags || !Array.isArray(state.buildings) || !buildingId) return null;
  const snap = stationPairSnapshot(state, buildingId);
  if (!snap) return null;
  return {
    ...snap,
    pairKind: classifyPairKind(snap),
  };
}

/**
 * Calm station-pairing indicator for work-station cards in `WorkCard`, reading
 * `stationPairSnapshot`. Draws two linked diamonds when `paired` is true and hides
 * cleanly when `null` or `living_station_pair` is off.
 */
export const WorkStationPairBadge: React.FC<{
  state: GameState | null | undefined;
  buildingId: string;
}> = ({ state, buildingId }) => {
  const v = resolveStationPair(state, buildingId);
  if (!v) return null;

  const isLead = v.pairKind === "lead";
  const isTwin = v.pairKind === "twin";

  return (
    <div
      className={`sc-wpair-row is-${v.pairKind}`}
      data-wpair-paired={v.paired ? "true" : "false"}
      data-wpair-kind={v.pairKind}
    >
      {v.paired ? (
        <span className={`sc-wpair-seal is-${v.pairKind}`}>
          <svg
            className="sc-wpair-link"
            viewBox="0 0 18 10"
            width={18}
            height={10}
            aria-hidden="true"
          >
            <line
              className="sc-wpair-bridge"
              x1="6.4"
              y1="5"
              x2="11.6"
              y2="5"
              stroke="currentColor"
              strokeWidth="1"
            />
            <polygon
              className="sc-wpair-diamond-a"
              points="4,2 6.8,5 4,8 1.2,5"
              fill={isLead ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1"
            />
            <polygon
              className="sc-wpair-diamond-b"
              points="14,2 16.8,5 14,8 11.2,5"
              fill={isTwin ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
          <span>{isLead ? "Paired +2%" : "Paired"}</span>
        </span>
      ) : null}
      <span className="sc-wpair-note">{v.note}</span>
    </div>
  );
};
