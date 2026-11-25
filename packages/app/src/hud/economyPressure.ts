import type { GameState } from "@second-crown/sim";
import { bottlenecks, type BottleneckEntry } from "../CostProjection";
import { projectCost, type CostProjection, type RealmRates } from "../projection";

/** Minimum cost production time (~10 minutes of current net income) to show a calm "Saving" indicator. */
export const SAVING_MIN_SECONDS = 600;

/**
 * True when an unpaid cost still needs waiting and represents >= 10 minutes
 * (SAVING_MIN_SECONDS) of current net income. Display only.
 */
export function isSavingCost(p: CostProjection, minSeconds = SAVING_MIN_SECONDS): boolean {
  return Boolean(p.limiter) && p.waitSeconds > 0 && p.productionSeconds >= minSeconds;
}

/** Convenience wrapper accepting partial resource cost maps (e.g. building types). */
export function isCostSaving(
  cost: Partial<Record<string, string | number | undefined>>,
  rates: RealmRates,
  minSeconds = SAVING_MIN_SECONDS,
): boolean {
  const clean: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(cost)) {
    if (v !== undefined) clean[k] = v;
  }
  return isSavingCost(projectCost(clean, rates), minSeconds);
}

/**
 * Groups current study / Keep bottlenecks by limiting resource name (e.g. "stone", "gold").
 * Deduplicates duplicate target names per resource. Pure, display only.
 */
export function bottleneckResourceMap(state: GameState | undefined): Record<string, BottleneckEntry[]> {
  if (!state) return {};
  const map: Record<string, BottleneckEntry[]> = {};
  for (const entry of bottlenecks(state)) {
    const list = map[entry.res] ?? (map[entry.res] = []);
    if (!list.some((item) => item.target === entry.target)) {
      list.push(entry);
    }
  }
  return map;
}
