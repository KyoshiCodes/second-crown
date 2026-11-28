import React from "react";
import {
  BUILDING_VARIETY_NOTE_BUILDING,
  BUILDING_VARIETY_NOTE_TOP,
  BUILDING_VARIETY_NOTE_UPGRADING,
  buildingVarietySnapshot,
  type BuildingVariety,
  type GameState,
} from "@second-crown/sim";
import "./building-variety.css";

export type BuildingStyleFamily =
  | "agrarian"
  | "timber"
  | "masonry"
  | "civic"
  | "martial"
  | "common";

export type BuildingVarietyStage = "building" | "upgrading" | "top" | "growing";

export interface BuildingVarietyView extends BuildingVariety {
  styleFamily: BuildingStyleFamily;
  stage: BuildingVarietyStage;
}

function resolveStyleFamily(typeId: string | undefined): BuildingStyleFamily {
  switch (typeId) {
    case "farm":
    case "granary":
      return "agrarian";
    case "lumber_camp":
    case "sawmill":
    case "archery_range":
      return "timber";
    case "quarry":
    case "gold_mine":
    case "mason":
    case "walls":
    case "gate":
    case "watchtower":
      return "masonry";
    case "cottage":
    case "market":
    case "mint":
    case "academy":
    case "chapel":
    case "infirmary":
      return "civic";
    case "barracks":
    case "stables":
    case "siege_workshop":
    case "keep":
      return "martial";
    default:
      return "common";
  }
}

function classifyStage(note: string): BuildingVarietyStage {
  if (note === BUILDING_VARIETY_NOTE_BUILDING) return "building";
  if (note === BUILDING_VARIETY_NOTE_UPGRADING) return "upgrading";
  if (note === BUILDING_VARIETY_NOTE_TOP) return "top";
  return "growing";
}

/**
 * Pure wrapper around `buildingVarietySnapshot(state, buildingId)` with safe guards
 * so callers can enrich building variety and tier architectural details visually.
 */
export function resolveBuildingVariety(
  state: GameState | null | undefined,
  buildingId: string | null | undefined,
): BuildingVarietyView | null {
  if (!state?.flags || !Array.isArray(state.buildings) || !buildingId) return null;
  const snap = buildingVarietySnapshot(state, buildingId);
  if (!snap) return null;
  const b = state.buildings.find((q) => q.id === buildingId);
  return {
    ...snap,
    styleFamily: resolveStyleFamily(b?.typeId),
    stage: classifyStage(snap.note),
  };
}

function familyEmblemPath(family: BuildingStyleFamily): string {
  switch (family) {
    case "agrarian":
      return "M2 9.5 Q6 3 10 9.5 M6 9.5 V3.5";
    case "timber":
      return "M6 2 L2.5 8 H9.5 Z M6 8 V10.5";
    case "masonry":
      return "M2.5 9.5 V4.5 H4.5 V6 H7.5 V4.5 H9.5 V9.5 Z";
    case "civic":
      return "M2 5.5 L6 2.2 L10 5.5 V9.5 H2 Z";
    case "martial":
      return "M3 2.5 H9 V6 Q6 9.5 3 6 Z";
    default:
      return "M2.5 5.5 L6 3 L9.5 5.5 V9.5 H2.5 Z";
  }
}

/**
 * Calm visual building style label and structural tier detail row for `WorkCard`
 * reading `buildingVarietySnapshot`. Hides cleanly when `null`.
 */
export const BuildingVarietyRow: React.FC<{
  state: GameState | null | undefined;
  buildingId: string;
}> = ({ state, buildingId }) => {
  const v = resolveBuildingVariety(state, buildingId);
  if (!v) return null;

  return (
    <div
      className={`sc-bvar-row is-family-${v.styleFamily} is-${v.stage}`}
      data-bvar-variety={v.variety}
      data-bvar-detail={v.tierDetail ?? ""}
      data-bvar-stage={v.stage}
      data-bvar-family={v.styleFamily}
    >
      <span className="sc-bvar-style">
        <svg
          className="sc-bvar-emblem"
          viewBox="0 0 12 12"
          width={12}
          height={12}
          aria-hidden="true"
        >
          <path
            d={familyEmblemPath(v.styleFamily)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{v.variety}</span>
      </span>

      {v.tierDetail ? (
        <span className="sc-bvar-detail">{v.tierDetail}</span>
      ) : null}

      <span className="sc-bvar-note">{v.note}</span>
    </div>
  );
};
