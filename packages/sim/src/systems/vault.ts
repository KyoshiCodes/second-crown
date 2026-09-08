import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { keepLevel } from "../actions/upgrade.js";
import { countBuilding } from "../content/buildings.js";

const BASE: Record<string, number> = { food: 40, wood: 30, stone: 20, gold: 8 };

export function vaultProtects(state: GameState, res: string): number {
  const keep = Math.max(1, keepLevel(state));
  const halls = countBuilding(state, "keep") + countBuilding(state, "mint") + countBuilding(state, "granary");
  return (BASE[res] ?? 10) * keep + halls * 8;
}

/** Steal up to `want`, never below the vault floor. Returns amount taken. */
export function takePlunder(state: GameState, res: string, want: number): number {
  const have = D(state.resources[res] ?? "0");
  const floor = D(vaultProtects(state, res));
  const exposed = have.sub(floor);
  if (exposed.lte(0) || want <= 0) return 0;
  const take = exposed.min(want);
  state.resources[res] = toDecimalString(have.sub(take));
  return take.toNumber();
}
