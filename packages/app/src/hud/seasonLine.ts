import { currentSeason, type GameState } from "@second-crown/sim";

/**
 * Inspect line for the current season. Reads the existing season helper only;
 * no sim math. The card shows it on seen tiles only.
 */
export function seasonLine(state: GameState): string {
  return `Season · ${currentSeason(state).toLowerCase()}`;
}
