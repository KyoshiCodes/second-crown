import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";

/**
 * Starvation for trained troops (everything but militia and champions).
 * A tick "starves" when the larder cannot cover the army's upkeep. After
 * STARVE_GRACE_TICKS starving ticks in a row, and every STARVE_PULSE_TICKS after,
 * each trained stack deserts STARVE_SHED_FRACTION of its men (at least one).
 * Any fed tick, or no army at all, resets the count. Militia keep their own rule:
 * one deserts on every starving tick.
 */
export const STARVE_FLAG = "starve_ticks";
export const STARVE_GRACE_TICKS = 600;
export const STARVE_PULSE_TICKS = 600;
export const STARVE_SHED_FRACTION = 0.02;

export function armyMouths(state: GameState, realmId = "player"): number {
  return state.units
    .filter((u) => u.realmId === realmId && u.typeId !== "champion")
    .reduce((n, u) => n + D(u.count).toNumber(), 0);
}

/** Food per tick for the standing army. */
export function upkeepPerTick(state: GameState, realmId = "player"): number {
  return armyMouths(state, realmId) * 0.02;
}

/** Starving ticks in a row so far. */
export function starveTicks(state: GameState): number {
  return Number(state.flags[STARVE_FLAG] ?? 0) || 0;
}

/** Trained troops: they eat, and they starve by the pulse rule, not the militia rule. */
export function isTrainedUnit(typeId: string): boolean {
  return typeId !== "militia" && typeId !== "champion";
}

/** Men one stack of `count` deserts on a starvation pulse. */
export function starveShed(count: number): number {
  if (count <= 0) return 0;
  return Math.min(count, Math.max(1, Math.floor(count * STARVE_SHED_FRACTION)));
}

/** Pulses that land on a starving count strictly after `from`, up to and including `to`. */
function pulsesBetween(from: number, to: number): number {
  const count = (n: number) => (n < STARVE_GRACE_TICKS ? 0 : Math.floor((n - STARVE_GRACE_TICKS) / STARVE_PULSE_TICKS) + 1);
  return count(to) - count(from);
}

/** Starving ticks still to go before the next desertion pulse (counting the tick it lands on). */
export function ticksToNextStarveLoss(state: GameState): number {
  const s = starveTicks(state);
  if (s < STARVE_GRACE_TICKS) return STARVE_GRACE_TICKS - s;
  const into = (s - STARVE_GRACE_TICKS) % STARVE_PULSE_TICKS;
  return STARVE_PULSE_TICKS - into;
}

function hasTrained(state: GameState): boolean {
  return state.units.some((u) => u.realmId === "player" && isTrainedUnit(u.typeId) && D(u.count).gt(0));
}

function shedTrained(state: GameState, pulses: number): void {
  for (let p = 0; p < pulses; p++) {
    for (const u of state.units) {
      if (u.realmId !== "player" || !isTrainedUnit(u.typeId)) continue;
      const n = D(u.count).toNumber();
      u.count = toDecimalString(D(u.count).sub(starveShed(n)));
    }
    state.units = state.units.filter((u) => u.realmId !== "player" || !isTrainedUnit(u.typeId) || D(u.count).gt(0));
  }
}

export function applyUpkeep(state: GameState, ticks: number): void {
  if (ticks <= 0) return;
  const need = upkeepPerTick(state) * ticks;
  if (need <= 0) {
    if (starveTicks(state) !== 0) state.flags[STARVE_FLAG] = 0;
    return;
  }
  const food = D(state.resources.food ?? "0");
  if (food.gte(need)) {
    state.resources.food = toDecimalString(food.sub(need));
    if (starveTicks(state) !== 0) state.flags[STARVE_FLAG] = 0;
    return;
  }
  state.resources.food = "0";
  const before = starveTicks(state);
  const after = before + ticks;
  state.flags[STARVE_FLAG] = after;
  const pulses = pulsesBetween(before, after);
  if (pulses > 0) shedTrained(state, pulses);
  const militia = state.units.find((u) => u.realmId === "player" && u.typeId === "militia");
  if (!militia) return;
  const lost = Math.min(1, D(militia.count).toNumber());
  militia.count = toDecimalString(D(militia.count).sub(lost));
  if (D(militia.count).lte(0)) state.units = state.units.filter((u) => u !== militia);
}

export const UpkeepSystem = {
  /** While starving with trained troops, the next desertion pulse. Batches stop there. */
  nextEventTick(state: GameState): number | null {
    if (starveTicks(state) <= 0 || !hasTrained(state)) return null;
    return state.meta.tick + ticksToNextStarveLoss(state);
  },
  processEventsAt(): void {},
  advanceAnalytic(state: GameState, fromTick: number, toTick: number): void {
    applyUpkeep(state, toTick - fromTick);
  },
  tick(state: GameState): void {
    applyUpkeep(state, 1);
  },
};
