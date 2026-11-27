import React from "react";
import {
  economyYieldBreakdownSnapshot,
  type GameState,
  type YieldBreakdown,
  type YieldSource,
} from "@second-crown/sim";
import "./economy-yield-breakdown.css";

const RESOURCES = ["food", "wood", "stone", "gold"] as const;
type StoreResource = (typeof RESOURCES)[number];

export interface BreakdownGroup {
  res: StoreResource;
  sources: YieldSource[];
}

function formatRate(rate: number): string {
  const rounded = Number(rate.toFixed(1));
  const absText =
    Math.abs(rounded) % 1 === 0 ? Math.abs(rounded).toFixed(0) : Math.abs(rounded).toFixed(1);
  return `+${absText}/s`;
}

/**
 * Defensive pure reader over `@second-crown/sim`'s `economyYieldBreakdownSnapshot(state)`.
 * Returns `null` when state is partial.
 */
export function resolveEconomyYieldBreakdown(
  state: GameState | null | undefined,
): YieldBreakdown | null {
  if (!state?.resources || !state.flags || !state.meta || !Array.isArray(state.buildings)) {
    return null;
  }
  try {
    return economyYieldBreakdownSnapshot(state);
  } catch {
    return null;
  }
}

/**
 * Collapsed-by-default breakdown expander under the Kingdom yields line.
 * Shows top sources per resource when opened; hides cleanly when empty or disabled.
 */
export const EconomyYieldBreakdown: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const breakdown = resolveEconomyYieldBreakdown(state);
  if (!breakdown) return null;

  const activeGroups: BreakdownGroup[] = [];
  let totalSources = 0;
  for (const res of RESOURCES) {
    const sources = breakdown[res];
    if (sources.length > 0) {
      activeGroups.push({ res, sources });
      totalSources += sources.length;
    }
  }

  if (activeGroups.length === 0) return null;

  return (
    <details
      className="sc-yield-breakdown"
      data-breakdown-resources={activeGroups.length}
      data-breakdown-sources={totalSources}
    >
      <summary className="sc-yield-breakdown-toggle">
        <span className="sc-yield-breakdown-pip" aria-hidden="true" />
        <span>Breakdown ({totalSources})</span>
      </summary>
      <div className="sc-yield-breakdown-list">
        {activeGroups.map((group) => (
          <div
            key={group.res}
            className="sc-yield-breakdown-group"
            data-breakdown-res={group.res}
          >
            <span className="sc-yield-breakdown-res">{group.res}</span>
            <span className="sc-yield-breakdown-sources">
              {group.sources.map((src) => (
                <span key={src.id} className="sc-yield-breakdown-source">
                  <span>{src.name}</span>
                  <span className="sc-yield-breakdown-rate">{formatRate(src.perSec)}</span>
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
};
