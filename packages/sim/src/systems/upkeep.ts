import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";

export function armyMouths(state: GameState, realmId = "player"): number {
  return state.units
    .filter((u) => u.realmId === realmId && u.typeId !== "champion")
    .reduce((n, u) => n + D(u.count).toNumber(), 0);
}

/** Food per tick for the standing army. */
export function upkeepPerTick(state: GameState, realmId = "player"): number {
  return armyMouths(state, realmId) * 0.02;
}

export function applyUpkeep(state: GameState, ticks: number): void {
  if (ticks <= 0) return;
  const need = upkeepPerTick(state) * ticks;
  if (need <= 0) return;
  const food = D(state.resources.food ?? "0");
  if (food.gte(need)) {
    state.resources.food = toDecimalString(food.sub(need));
    return;
  }
  state.resources.food = "0";
  const militia = state.units.find((u) => u.realmId === "player" && u.typeId === "militia");
  if (!militia) return;
  const lost = Math.min(1, D(militia.count).toNumber());
  militia.count = toDecimalString(D(militia.count).sub(lost));
  if (D(militia.count).lte(0)) state.units = state.units.filter((u) => u !== militia);
}

export const UpkeepSystem = {
  nextEventTick(): number | null {
    return null;
  },
  processEventsAt(): void {},
  advanceAnalytic(state: GameState, fromTick: number, toTick: number): void {
    applyUpkeep(state, toTick - fromTick);
  },
  tick(state: GameState): void {
    applyUpkeep(state, 1);
  },
};
