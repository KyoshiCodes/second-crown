import React from "react";
import {
  courtDetailSnapshot,
  type CourtDetail,
  type GameState,
} from "@second-crown/sim";
import "./court-detail.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `courtDetailSnapshot(state)`.
 * Returns `null` with no player court, `living_court_detail` off, or partial state.
 */
export function resolveCourtDetail(
  state: GameState | null | undefined,
): CourtDetail | null {
  if (!state?.flags || !state.meta || !Array.isArray(state.characters)) {
    return null;
  }
  try {
    return courtDetailSnapshot(state);
  } catch {
    return null;
  }
}

/**
 * Quiet sub-line under `<CourtStatusLine>` showing running decrees with ticks left
 * and royal guidance from `courtDetailSnapshot(state)`. Hides cleanly when null.
 */
export const CourtDetailLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveCourtDetail(state);
  if (!snap || (snap.active.length === 0 && !snap.guidance)) return null;

  return (
    <div
      className="sc-court-detail-line"
      data-court-detail-active={snap.active.length}
      data-court-detail-open={snap.openSlots}
    >
      <span className="sc-court-detail-pip" aria-hidden="true" />
      {snap.active.map((d) => {
        const secs = Math.max(0, Math.ceil(d.ticksLeft / 10));
        return (
          <span
            key={d.id}
            className="sc-court-detail-item"
            data-decree-id={d.id}
            data-decree-ticks={d.ticksLeft}
          >
            <span>{d.name}</span>
            <span className="sc-court-detail-ticks">
              ~{secs}s ({d.ticksLeft}t)
            </span>
          </span>
        );
      })}
      {snap.guidance ? (
        <span className="sc-court-detail-guidance">{snap.guidance}</span>
      ) : null}
    </div>
  );
};
