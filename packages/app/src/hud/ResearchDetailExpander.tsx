import React from "react";
import {
  researchDetailSnapshot,
  type GameState,
  type ResearchDetail,
} from "@second-crown/sim";
import "./research-detail.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `researchDetailSnapshot(state)`.
 * Returns `null` when `living_research_detail` is off or state is partial.
 */
export function resolveResearchDetail(
  state: GameState | null | undefined,
): ResearchDetail | null {
  if (!state?.flags || !state.meta || !Array.isArray(state.buildings)) {
    return null;
  }
  try {
    return researchDetailSnapshot(state);
  } catch {
    return null;
  }
}

/**
 * Calm collapsed-by-default next-unlocks expander under `<ResearchProgressLine>`.
 * Hides cleanly when `nextUnlocks` is empty or `living_research_detail` is off.
 */
export const ResearchDetailExpander: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveResearchDetail(state);
  if (!snap || snap.nextUnlocks.length === 0) return null;

  return (
    <details
      className="sc-research-detail"
      data-research-unlocks={snap.nextUnlocks.length}
      data-research-known-detail={snap.completed.length}
    >
      <summary className="sc-research-detail-toggle">
        <span className="sc-research-detail-pip" aria-hidden="true" />
        <span>Next unlocks ({snap.nextUnlocks.length})</span>
      </summary>
      <div className="sc-research-detail-list">
        {snap.nextUnlocks.map((u) => {
          const ready = u.requires.length === 0;
          return (
            <div
              key={u.id}
              className="sc-research-detail-item"
              data-unlock-id={u.id}
              data-unlock-ready={ready ? "true" : "false"}
            >
              <span className="sc-research-detail-name">{u.name}</span>
              <span
                className={`sc-research-detail-gate${ready ? " is-ready" : ""}`}
              >
                {ready ? "ready" : `needs ${u.requires.join(", ")}`}
              </span>
            </div>
          );
        })}
      </div>
    </details>
  );
};
