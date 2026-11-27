import React from "react";
import {
  courtStatusSnapshot,
  type CourtStatus,
  type GameState,
} from "@second-crown/sim";
import "./research-court-status.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `courtStatusSnapshot(state)`.
 * Returns `null` with no player court, `living_court_status` off, or partial state.
 */
export function resolveCourtStatus(
  state: GameState | null | undefined,
): CourtStatus | null {
  if (!state?.flags || !state.meta || !Array.isArray(state.characters)) {
    return null;
  }
  return courtStatusSnapshot(state);
}

/**
 * Compact Kingdom tab status line reading `courtStatusSnapshot`: displays running decrees,
 * open decree slots, and the most recently sworn decree when present.
 */
export const CourtStatusLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveCourtStatus(state);
  if (!snap) return null;

  return (
    <p
      className="sc-sys-status-line is-court"
      data-court-active={snap.activeDecrees.length}
      data-court-open={snap.openSlots}
    >
      <span className="sc-sys-pip" aria-hidden="true" />
      <span>
        Court: {snap.activeDecrees.length} active · {snap.openSlots} open
      </span>
      {snap.lastDecree ? (
        <span className="sc-sys-muted">
          · last: {snap.lastDecree.name}{snap.lastDecree.active ? " (active)" : ""}
        </span>
      ) : null}
    </p>
  );
};
