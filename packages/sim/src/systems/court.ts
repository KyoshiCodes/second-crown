import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";

export function tryBanquet(state: GameState): boolean {
  const ready = Number(state.flags.banquet_ready ?? 0);
  if (state.meta.tick < ready) return false;
  if (D(state.resources.food ?? "0").lt(25) || D(state.resources.gold ?? "0").lt(10)) return false;
  state.resources.food = toDecimalString(D(state.resources.food ?? "0").sub(25));
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").sub(10));
  for (const o of state.opinions) {
    if (o.to === "char_player" || o.from === "char_player") {
      o.value = Math.max(-100, Math.min(100, o.value + 5));
    }
  }
  state.flags.banquet_ready = state.meta.tick + 400;
  return true;
}

export function banquetTicksLeft(state: GameState): number {
  return Math.max(0, Number(state.flags.banquet_ready ?? 0) - state.meta.tick);
}

export function tryFortify(state: GameState): boolean {
  if (Number(state.flags.fortify_until ?? 0) > state.meta.tick) return false;
  if (D(state.resources.stone ?? "0").lt(20)) return false;
  state.resources.stone = toDecimalString(D(state.resources.stone ?? "0").sub(20));
  state.flags.fortify_until = state.meta.tick + 400;
  return true;
}

export function fortifyTicksLeft(state: GameState): number {
  return Math.max(0, Number(state.flags.fortify_until ?? 0) - state.meta.tick);
}

export function fortifyPower(state: GameState): number {
  return fortifyTicksLeft(state) > 0 ? 6 : 0;
}
