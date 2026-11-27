import React from "react";
import {
  researchProgressSnapshot,
  type GameState,
  type ResearchProgress,
} from "@second-crown/sim";
import "./research-court-status.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `researchProgressSnapshot(state)`.
 * Returns `null` when `living_research_status` is off or state is partial.
 */
export function resolveResearchProgress(
  state: GameState | null | undefined,
): ResearchProgress | null {
  if (!state?.flags || !state.meta || !Array.isArray(state.buildings)) {
    return null;
  }
  return researchProgressSnapshot(state);
}

/**
 * Calm Kingdom tab status line reading `researchProgressSnapshot`: shows the active study,
 * calm progress bar, and ETA when researching, or completed count and next available study.
 */
export const ResearchProgressLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveResearchProgress(state);
  if (!snap) return null;

  const pct = snap.active && snap.active.totalTicks > 0
    ? Math.max(
        4,
        Math.min(
          100,
          Math.round(((snap.active.totalTicks - snap.active.ticksLeft) / snap.active.totalTicks) * 100),
        ),
      )
    : 0;
  const secsLeft = snap.active ? Math.max(0, Math.ceil(snap.active.ticksLeft / 10)) : 0;

  return (
    <p
      className="sc-sys-status-line is-research"
      data-research-completed={snap.completedCount}
      data-research-active={snap.active?.id ?? "none"}
    >
      <span className="sc-sys-pip" aria-hidden="true" />
      {snap.active ? (
        <>
          <span>
            Studying <strong>{snap.active.name}</strong> (~{secsLeft}s left)
          </span>
          <span className="sc-sys-bar" aria-hidden="true">
            <span className="sc-sys-bar-fill" style={{ width: `${pct}%` }} />
          </span>
          <span className="sc-sys-muted">{snap.completedCount} known</span>
        </>
      ) : (
        <>
          <span>
            Research: {snap.completedCount} known
          </span>
          <span className="sc-sys-muted">
            {snap.nextAvailable ? `next: ${snap.nextAvailable}` : "lectern quiet"}
          </span>
        </>
      )}
    </p>
  );
};
