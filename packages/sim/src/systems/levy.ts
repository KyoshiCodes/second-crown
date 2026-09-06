import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";

/** Turn food into a small militia levy. Cooldown 200 ticks. */
export function tryFoodLevy(state: GameState): boolean {
  const ready = Number(state.flags.levy_ready ?? 0);
  if (state.meta.tick < ready) return false;
  if (D(state.resources.food ?? "0").lt(20)) return false;
  state.resources.food = toDecimalString(D(state.resources.food ?? "0").sub(20));
  const existing = state.units.find((u) => u.typeId === "militia" && u.realmId === "player" && u.armyId === null);
  if (existing) existing.count = toDecimalString(D(existing.count).add(4));
  else {
    state.units.push({
      id: `levy_${state.meta.tick}`,
      typeId: "militia",
      realmId: "player",
      count: "4",
      armyId: null,
    });
  }
  state.flags.levy_ready = state.meta.tick + 200;
  return true;
}

export function levyTicksLeft(state: GameState): number {
  return Math.max(0, Number(state.flags.levy_ready ?? 0) - state.meta.tick);
}
