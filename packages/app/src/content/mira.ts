import type { GameState } from "@second-crown/sim";
import { isShielded, activeClash, flagNum } from "@second-crown/sim";

export function miraRemark(state: GameState | undefined, lastEvent: string): string {
  if (!state) return "Mira waits by the ledger.";
  if (state.wars.some((w) => w.status === "active")) {
    return "The horns are up. Keep a reserve of food if the line breaks.";
  }
  if (isShielded(state)) {
    return "The veil is paid. Use the quiet to plant, not to sleep on the walls.";
  }
  const clash = activeClash(state);
  if (clash) {
    return "Two foreign hosts bleed each other. A cheap levy now can buy cheap iron later.";
  }
  if (flagNum(state, "wars_won") >= 1 && lastEvent.toLowerCase().includes("win")) {
    return "Victory spoils well. Craft before you feast the whole purse away.";
  }
  if (lastEvent.includes("harvest") || lastEvent.includes("food")) {
    return "Grain in the pit is a quiet kind of spear.";
  }
  if (lastEvent.includes("wood") || lastEvent.includes("Timber")) {
    return "Stack it dry. Towers eat timber faster than farms eat rain.";
  }
  if (lastEvent.includes("gold") || lastEvent.includes("tribute")) {
    return "Coin invites both markets and knives. Spend it on walls or on friends.";
  }
  if (lastEvent.includes("Spoilage")) {
    return "I warned the stewards. Build a granary before the next warm week.";
  }
  return "The realm holds. Tell me when you want the ugly advice.";
}
