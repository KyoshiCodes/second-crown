import React from "react";
import {
  researchProgressDetailSnapshot,
  type GameState,
  type ResearchProgressDetail,
} from "@second-crown/sim";
import "./research-progress-detail.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `researchProgressDetailSnapshot(state)`.
 * Returns `null` when idle, `living_research_progress` is off, or state is partial.
 */
export function resolveResearchProgressDetail(
  state: GameState | null | undefined,
): ResearchProgressDetail | null {
  if (!state?.flags || !state.meta) {
    return null;
  }
  try {
    return researchProgressDetailSnapshot(state);
  } catch {
    return null;
  }
}

/**
 * Calm thin progress bar and percent note for an active study under `<ResearchProgressLine>`.
 * Hides cleanly when idle or `living_research_progress` is off.
 */
export const ResearchProgressDetailBar: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveResearchProgressDetail(state);
  if (!snap) return null;

  const secsLeft = Math.max(0, Math.ceil(snap.ticksLeft / 10));

  return (
    <div
      className="sc-rpd-row"
      data-rpd-id={snap.activeId}
      data-rpd-percent={snap.percent}
      data-rpd-ticks-left={snap.ticksLeft}
      data-rpd-total-ticks={snap.totalTicks}
    >
      <span className="sc-rpd-pip" aria-hidden="true" />
      <span className="sc-rpd-name">{snap.name}</span>
      <span className="sc-rpd-track" aria-hidden="true">
        <span className="sc-rpd-fill" style={{ width: `${snap.percent}%` }} />
      </span>
      <span className="sc-rpd-pct">{snap.percent}%</span>
      <span className="sc-rpd-eta">(~{secsLeft}s)</span>
    </div>
  );
};
