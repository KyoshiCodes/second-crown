import type { GameState } from "@second-crown/shared";
import { countBuilding } from "../content/buildings.js";
import { realmPower, defenseBonus } from "./combat.js";
import { applySiegeBlow, wallHp } from "./march.js";

export interface SiegeReport {
  wallsDown: boolean;
  yardHeld: boolean;
  keepHeld: boolean;
  scarred: string | null;
}

export function yardPower(state: GameState, realmId: string): number {
  return realmPower(state, realmId) + defenseBonus(state, realmId);
}

export function keepPower(state: GameState, realmId: string): number {
  return countBuilding(state, "keep") * 8;
}

/** Wall first, then yard, then keep. Scars only if walls fall. */
export function resolveSiegeHold(state: GameState, attackerPower: number, defenderId = "player"): SiegeReport {
  const walls = wallHp(state, defenderId);
  const wallsDown = attackerPower > walls;
  if (!wallsDown) {
    return { wallsDown: false, yardHeld: true, keepHeld: true, scarred: null };
  }
  const yard = yardPower(state, defenderId);
  const yardHeld = attackerPower <= yard * 1.15;
  const keepHeld = attackerPower <= yard + keepPower(state, defenderId);
  const scarred = applySiegeBlow(state, attackerPower, walls + yard * 0.5);
  return { wallsDown: true, yardHeld, keepHeld, scarred };
}
