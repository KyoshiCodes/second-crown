import React from "react";
import {
  economyYieldsSnapshot,
  type EconomyYields,
  type GameState,
} from "@second-crown/sim";
import "./economy-yields-status.css";

export interface EconomyYieldEntry {
  res: "food" | "wood" | "stone" | "gold";
  rate: number;
  text: string;
}

const RATE_FIELDS = [
  ["food", "foodPerSec"],
  ["wood", "woodPerSec"],
  ["stone", "stonePerSec"],
  ["gold", "goldPerSec"],
] as const;

function formatSignedRate(rate: number): string {
  const rounded = Number(rate.toFixed(1));
  const absText = Math.abs(rounded) % 1 === 0 ? Math.abs(rounded).toFixed(0) : Math.abs(rounded).toFixed(1);
  return `${rate >= 0 ? "+" : "-"}${absText}/s`;
}

/**
 * Defensive pure reader over `@second-crown/sim`'s `economyYieldsSnapshot(state)`.
 * Returns `null` when `living_economy_yields` is off or state is partial.
 */
export function resolveEconomyYields(
  state: GameState | null | undefined,
): EconomyYields | null {
  if (!state?.resources || !state.flags || !state.meta || !Array.isArray(state.buildings)) {
    return null;
  }
  return economyYieldsSnapshot(state);
}

/** Returns only non-zero per-second resource entries (`|rate| >= 0.005`) to avoid idle clutter. */
export function formatEconomyYieldEntries(yields: EconomyYields): EconomyYieldEntry[] {
  const out: EconomyYieldEntry[] = [];
  for (const [res, field] of RATE_FIELDS) {
    const rate = yields[field];
    if (Math.abs(rate) < 0.005) continue;
    out.push({
      res,
      rate,
      text: `${res} ${formatSignedRate(rate)}`,
    });
  }
  return out;
}

/**
 * Quiet Kingdom sub-line reading `economyYieldsSnapshot(state)` and showing non-zero net
 * per-second rates (`food` net of army upkeep). Hides cleanly when `living_economy_yields` is
 * off or all rates are zero.
 */
export const EconomyYieldsLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const yields = resolveEconomyYields(state);
  if (!yields) return null;

  const entries = formatEconomyYieldEntries(yields);
  if (entries.length === 0) return null;

  const upkeepRounded = Number(yields.foodUpkeep.toFixed(1));
  const upkeepText = upkeepRounded % 1 === 0 ? upkeepRounded.toFixed(0) : upkeepRounded.toFixed(1);

  return (
    <p
      className="sc-yields-line"
      data-yields-food={yields.foodPerSec}
      data-yields-wood={yields.woodPerSec}
      data-yields-stone={yields.stonePerSec}
      data-yields-gold={yields.goldPerSec}
      data-food-upkeep={yields.foodUpkeep}
    >
      <span className="sc-yields-pip" aria-hidden="true" />
      <span className="sc-yields-label">Net /s:</span>
      {entries.map((entry) => (
        <span
          key={entry.res}
          className={`sc-yields-entry ${entry.rate >= 0 ? "is-pos" : "is-neg"}`}
        >
          {entry.text}
        </span>
      ))}
      {yields.foodUpkeep >= 0.005 ? (
        <span className="sc-yields-upkeep">(upkeep -{upkeepText}/s)</span>
      ) : null}
    </p>
  );
};
