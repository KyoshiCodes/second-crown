import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { realmPower } from "./combat.js";
import { addSpoils } from "./wave.js";

export function raidTicksLeft(state: GameState): number {
  return Math.max(0, Number(state.flags.raid_ready ?? 0) - state.meta.tick);
}

/** Spend stores to strike the refugee horde. Reward scales with your power. */
export function tryStrikeHorde(state: GameState): boolean {
  if (raidTicksLeft(state) > 0) return false;
  if (D(state.resources.food ?? "0").lt(20) || D(state.resources.gold ?? "0").lt(10)) return false;
  state.resources.food = toDecimalString(D(state.resources.food ?? "0").sub(20));
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").sub(10));
  const p = realmPower(state, "player");
  const iron = 2 + Math.min(6, Math.floor(p / 40));
  const banners = 1 + Math.min(4, Math.floor(p / 60));
  const relics = p >= 80 ? 2 : p >= 40 ? 1 : 0;
  addSpoils(state, iron, banners, relics);
  state.flags.raid_ready = state.meta.tick + 500;
  state.flags.raid_last_iron = iron;
  state.flags.raid_last_banners = banners;
  state.flags.raid_last_relics = relics;
  return true;
}
