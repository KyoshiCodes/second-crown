import React from "react";
import {
  BUILDING_NOTE_BUILDING,
  BUILDING_NOTE_NO_STATION,
  BUILDING_NOTE_STAFFED,
  BUILDING_NOTE_UPGRADING,
  buildingDetailSnapshot,
  type BuildingDetail,
  type GameState,
} from "@second-crown/sim";
import "./building-detail.css";

export type BuildingDetailStateKind =
  | "building"
  | "upgrading"
  | "passive"
  | "staffed"
  | "unstaffed";

export type BuildingStationKey =
  | "field"
  | "woodlot"
  | "pit"
  | "stall"
  | "post"
  | "study";

export interface BuildingDetailView extends BuildingDetail {
  tierRank: 1 | 2 | 3 | 4 | 5;
  stateKind: BuildingDetailStateKind;
  stationKey: BuildingStationKey | null;
}

function tierRankOf(tier: string): 1 | 2 | 3 | 4 | 5 {
  if (tier === "Tier V") return 5;
  if (tier === "Tier IV") return 4;
  if (tier === "Tier III") return 3;
  if (tier === "Tier II") return 2;
  return 1;
}

function stateKindOf(note: string): BuildingDetailStateKind {
  if (note === BUILDING_NOTE_BUILDING) return "building";
  if (note === BUILDING_NOTE_UPGRADING) return "upgrading";
  if (note === BUILDING_NOTE_NO_STATION) return "passive";
  if (note === BUILDING_NOTE_STAFFED) return "staffed";
  return "unstaffed";
}

function stationKeyOf(station: string | null): BuildingStationKey | null {
  if (!station) return null;
  const k = station.toLowerCase();
  if (
    k === "field" ||
    k === "woodlot" ||
    k === "pit" ||
    k === "stall" ||
    k === "post" ||
    k === "study"
  ) {
    return k;
  }
  return null;
}

/**
 * Pure wrapper around `buildingDetailSnapshot(state, buildingId)` with safe guards
 * so partial test fixtures never throw and callers can hide cleanly when `null`.
 */
export function resolveBuildingDetail(
  state: GameState | null | undefined,
  buildingId: string | null | undefined,
): BuildingDetailView | null {
  if (!state?.flags || !Array.isArray(state.buildings) || !buildingId) return null;
  const snap = buildingDetailSnapshot(state, buildingId);
  if (!snap) return null;
  return {
    ...snap,
    tierRank: tierRankOf(snap.tier),
    stateKind: stateKindOf(snap.note),
    stationKey: stationKeyOf(snap.workStation),
  };
}

function stationIconPath(key: BuildingStationKey | null): string {
  switch (key) {
    case "field":
      return "M2 8 Q5 4 8 8 M5 8 V3";
    case "woodlot":
      return "M5 2 L2.2 6.8 H7.8 Z M5 6.8 V8.8";
    case "pit":
      return "M2 4 H8 L6.8 8 H3.2 Z";
    case "stall":
      return "M1.8 4 L5 2 L8.2 4 V8 H1.8 Z";
    case "post":
      return "M2.5 2.5 H7.5 V5.2 Q5 7.6 2.5 5.2 Z";
    case "study":
      return "M2 3 Q5 4.2 8 3 V7.8 Q5 6.6 2 7.8 Z";
    default:
      return "M2 5 H8";
  }
}

/**
 * Calm building depth, tier indicator, optional work-station mark, and status note
 * for `WorkCard` from `buildingDetailSnapshot`. Hides cleanly when `null`.
 */
export const BuildingDetailStrip: React.FC<{
  state: GameState | null | undefined;
  buildingId: string;
}> = ({ state, buildingId }) => {
  const v = resolveBuildingDetail(state, buildingId);
  if (!v) return null;

  return (
    <div
      className={`sc-bdet-strip is-tier-${v.tierRank} is-${v.stateKind}`}
      data-bdet-tier={v.tier}
      data-bdet-state={v.stateKind}
      data-bdet-station={v.stationKey ?? ""}
    >
      <span className={`sc-bdet-tier is-tier-${v.tierRank}`}>
        <svg
          className="sc-bdet-tier-svg"
          viewBox="0 0 12 10"
          width={12}
          height={10}
          aria-hidden="true"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <rect
              key={n}
              x={(n - 1) * 2.3 + 0.5}
              y={9 - n * 1.4}
              width={1.6}
              height={n * 1.4}
              rx={0.5}
              fill="currentColor"
              opacity={n <= v.tierRank ? 0.95 : 0.22}
            />
          ))}
        </svg>
        <span>{v.tier}</span>
      </span>

      {v.workStation ? (
        <span
          className={`sc-bdet-station is-${v.stationKey ?? "other"} ${v.staffed ? "is-staffed" : "is-idle"}`}
        >
          <svg
            className="sc-bdet-station-icon"
            viewBox="0 0 10 10"
            width={10}
            height={10}
            aria-hidden="true"
          >
            <path
              d={stationIconPath(v.stationKey)}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{v.workStation}</span>
        </span>
      ) : null}

      <span className="sc-bdet-note">
        <span className="sc-bdet-pip" aria-hidden="true" />
        <span>{v.note}</span>
      </span>
    </div>
  );
};
