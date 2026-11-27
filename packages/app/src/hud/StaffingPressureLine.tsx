import React from "react";
import {
  staffingPressureSnapshot,
  type GameState,
  type StaffingPressure,
} from "@second-crown/sim";
import "./staffing-pressure.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `staffingPressureSnapshot(state)`.
 * Returns `null` when both counts are zero, `living_staffing_pressure` is off, or state is partial.
 */
export function resolveStaffingPressure(
  state: GameState | null | undefined,
): StaffingPressure | null {
  if (
    !state?.flags ||
    !Array.isArray(state.citizens) ||
    !Array.isArray(state.buildings)
  ) {
    return null;
  }
  try {
    return staffingPressureSnapshot(state);
  } catch {
    return null;
  }
}

function pressureTone(snap: StaffingPressure): string {
  if (snap.emptyBuildings > 0 && snap.idleVillagers > 0) return "is-assign";
  if (snap.emptyBuildings > 0) return "is-short";
  return "is-spare";
}

/**
 * Quiet Kingdom sub-line showing empty buildings and idle villagers from
 * `staffingPressureSnapshot(state)`. Hides cleanly when both are zero or disabled.
 */
export const StaffingPressureLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveStaffingPressure(state);
  if (!snap) return null;

  const parts: string[] = [];
  if (snap.emptyBuildings > 0) parts.push(`${snap.emptyBuildings} empty`);
  if (snap.idleVillagers > 0) parts.push(`${snap.idleVillagers} idle`);

  return (
    <div
      className="sc-staffing-pressure-line"
      data-staffing-empty={snap.emptyBuildings}
      data-staffing-idle={snap.idleVillagers}
    >
      <span className={`sc-staffing-pip ${pressureTone(snap)}`} aria-hidden="true" />
      <span className="sc-staffing-counts">{parts.join(" · ")}</span>
      {snap.note ? (
        <span className="sc-staffing-note">· {snap.note}</span>
      ) : null}
    </div>
  );
};
