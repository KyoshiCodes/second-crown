import React from "react";
import {
  WORK_STATION_BENEFIT_NOTE_BUILDING,
  WORK_STATION_BENEFIT_NOTE_UPGRADING,
  workStationBenefitSnapshot,
  type GameState,
  type WorkStationBenefit,
} from "@second-crown/sim";
import "./work-station-benefit.css";

export type WorkStationBenefitState =
  | "active"
  | "building"
  | "upgrading"
  | "inactive";

export interface WorkStationBenefitView extends WorkStationBenefit {
  stateKind: WorkStationBenefitState;
}

function classifyBenefitState(snap: WorkStationBenefit): WorkStationBenefitState {
  if (snap.active) return "active";
  if (snap.note === WORK_STATION_BENEFIT_NOTE_BUILDING) return "building";
  if (snap.note === WORK_STATION_BENEFIT_NOTE_UPGRADING) return "upgrading";
  return "inactive";
}

/**
 * Pure wrapper around `workStationBenefitSnapshot(state, buildingId)` with safe guards
 * so callers show when the +5% passive work-station bonus is active or paused.
 */
export function resolveWorkStationBenefit(
  state: GameState | null | undefined,
  buildingId: string | null | undefined,
): WorkStationBenefitView | null {
  if (!state?.flags || !Array.isArray(state.buildings) || !buildingId) return null;
  const snap = workStationBenefitSnapshot(state, buildingId);
  if (!snap) return null;
  return {
    ...snap,
    stateKind: classifyBenefitState(snap),
  };
}

/**
 * Calm passive benefit seal and note for station buildings in `WorkCard`,
 * reading `workStationBenefitSnapshot`. Hides cleanly when `null`.
 */
export const WorkStationBenefitBadge: React.FC<{
  state: GameState | null | undefined;
  buildingId: string;
}> = ({ state, buildingId }) => {
  const v = resolveWorkStationBenefit(state, buildingId);
  if (!v) return null;

  return (
    <div
      className={`sc-wben-row is-${v.stateKind}`}
      data-wben-active={v.active ? "true" : "false"}
      data-wben-state={v.stateKind}
    >
      <span className={`sc-wben-seal is-${v.stateKind}`}>
        <span className="sc-wben-pip" aria-hidden="true" />
        <span>{v.benefit}</span>
      </span>
      <span className="sc-wben-note">{v.note}</span>
    </div>
  );
};
