import React from "react";
import {
  EXTRA_BUILDING_DETAIL_FULL,
  EXTRA_BUILDING_DETAIL_UPGRADING,
  extraBuildingSnapshot,
  type ExtraBuilding,
  type GameState,
} from "@second-crown/sim";
import "./extra-building.css";

export type ExtraBuildingKind =
  | "windmill"
  | "log_pile"
  | "hoist_crane"
  | "silo"
  | "awning_stalls"
  | "bell_tower"
  | "signal_fire"
  | "courtyard_well"
  | "other";

export type ExtraBuildingStage = "building" | "upgrading" | "full" | "small";

export interface ExtraBuildingView extends ExtraBuilding {
  extraKind: ExtraBuildingKind;
  stage: ExtraBuildingStage;
}

function classifyExtraKind(typeId: string | undefined): ExtraBuildingKind {
  switch (typeId) {
    case "farm":
      return "windmill";
    case "lumber_camp":
      return "log_pile";
    case "quarry":
      return "hoist_crane";
    case "granary":
      return "silo";
    case "market":
      return "awning_stalls";
    case "chapel":
      return "bell_tower";
    case "watchtower":
      return "signal_fire";
    case "keep":
      return "courtyard_well";
    default:
      return "other";
  }
}

function classifyExtraStage(detail: string | null): ExtraBuildingStage {
  if (detail === null) return "building";
  if (detail === EXTRA_BUILDING_DETAIL_UPGRADING) return "upgrading";
  if (detail === EXTRA_BUILDING_DETAIL_FULL) return "full";
  return "small";
}

/**
 * Pure wrapper around `extraBuildingSnapshot(state, buildingId)` with safe guards
 * so `WorkCard` renders each companion visual building type distinctly.
 */
export function resolveExtraBuilding(
  state: GameState | null | undefined,
  buildingId: string | null | undefined,
): ExtraBuildingView | null {
  if (!state?.flags || !Array.isArray(state.buildings) || !buildingId) return null;
  const snap = extraBuildingSnapshot(state, buildingId);
  if (!snap) return null;
  const b = state.buildings.find((q) => q.id === buildingId);
  return {
    ...snap,
    extraKind: classifyExtraKind(b?.typeId),
    stage: classifyExtraStage(snap.detail),
  };
}

function renderExtraGlyph(kind: ExtraBuildingKind): React.ReactNode {
  switch (kind) {
    case "windmill":
      return (
        <>
          <path d="M5 12 L6.5 6 H7.5 L9 12 Z" fill="none" stroke="currentColor" strokeWidth="1.05" />
          <g className="sc-xtra-windmill-vanes">
            <line x1="7" y1="2.2" x2="7" y2="9.8" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
            <line x1="3.2" y1="6" x2="10.8" y2="6" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
          </g>
        </>
      );
    case "log_pile":
      return (
        <>
          <circle cx="4.5" cy="10" r="1.4" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="7.2" cy="10" r="1.4" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="9.9" cy="10" r="1.4" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="5.9" cy="7.5" r="1.4" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="8.5" cy="7.5" r="1.4" fill="none" stroke="currentColor" strokeWidth="1" />
        </>
      );
    case "hoist_crane":
      return (
        <>
          <path d="M3.5 12 V3.5 L10.5 5.2" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="9.8" y1="5.2" x2="9.8" y2="9.2" stroke="currentColor" strokeWidth="0.95" />
          <rect x="8.6" y="9.2" width="2.4" height="2" fill="none" stroke="currentColor" strokeWidth="0.95" />
        </>
      );
    case "silo":
      return (
        <>
          <path d="M4.2 6 A2.8 2.4 0 0 1 9.8 6 V11.5 H4.2 Z" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <line x1="4.2" y1="7.5" x2="9.8" y2="7.5" stroke="currentColor" strokeWidth="0.85" />
        </>
      );
    case "awning_stalls":
      return (
        <>
          <path d="M2.5 5.5 L4.5 3.5 H9.5 L11.5 5.5 Z" fill="none" stroke="currentColor" strokeWidth="1.05" strokeLinejoin="round" />
          <path d="M3.5 5.5 V11.5 M7 5.5 V11.5 M10.5 5.5 V11.5 M3.5 9.5 H10.5" fill="none" stroke="currentColor" strokeWidth="0.95" />
        </>
      );
    case "bell_tower":
      return (
        <>
          <path d="M4.5 11.5 V5 L7 2.4 L9.5 5 V11.5 Z" fill="none" stroke="currentColor" strokeWidth="1.05" strokeLinejoin="round" />
          <circle cx="7" cy="6.6" r="1.1" fill="currentColor" />
        </>
      );
    case "signal_fire":
      return (
        <>
          <path d="M4 11.5 L7 8.5 L10 11.5" fill="none" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
          <path className="sc-xtra-flame" d="M7 2.6 Q9 5.2 7.8 7.4 Q7 8.2 6.2 7.4 Q5 5.2 7 2.6 Z" />
        </>
      );
    case "courtyard_well":
      return (
        <>
          <rect x="4" y="8" width="6" height="3.5" rx="0.6" fill="none" stroke="currentColor" strokeWidth="1.05" />
          <path d="M3.5 5 L7 2.8 L10.5 5 M4.8 5 V8 M9.2 5 V8" fill="none" stroke="currentColor" strokeWidth="0.95" strokeLinecap="round" />
        </>
      );
    default:
      return <rect x="4" y="5" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1.05" />;
  }
}

/**
 * Calm companion visual building structure row for `WorkCard` reading `extraBuildingSnapshot`.
 * Hides cleanly when `null` (building types with no extra or `living_extra_buildings` off).
 */
export const ExtraBuildingRow: React.FC<{
  state: GameState | null | undefined;
  buildingId: string;
}> = ({ state, buildingId }) => {
  const v = resolveExtraBuilding(state, buildingId);
  if (!v) return null;

  return (
    <div
      className={`sc-xtra-row is-kind-${v.extraKind} is-${v.stage}`}
      data-xtra-kind={v.extraKind}
      data-xtra-extra={v.extra}
      data-xtra-detail={v.detail ?? ""}
      data-xtra-stage={v.stage}
    >
      <span className="sc-xtra-lead">
        <svg
          className="sc-xtra-glyph"
          viewBox="0 0 14 14"
          width={14}
          height={14}
          aria-hidden="true"
        >
          {renderExtraGlyph(v.extraKind)}
        </svg>
        <span>{v.extra}</span>
      </span>

      {v.detail ? (
        <span className={`sc-xtra-detail is-${v.stage}`}>{v.detail}</span>
      ) : null}

      <span className="sc-xtra-note">{v.note}</span>
    </div>
  );
};
