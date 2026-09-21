import type { GameState } from "@second-crown/shared";
import { addCapped } from "./storage.js";
import { recordCrown } from "./ledger.js";

const DAY_MS = 86_400_000;

export function utcDay(now = Date.now()): number {
  return Math.floor(now / DAY_MS);
}

export function dailyClaimed(state: GameState, now = Date.now()): boolean {
  return Number(state.flags.daily_claim_day ?? -1) === utcDay(now);
}

export function dailyMsLeft(state: GameState, now = Date.now()): number {
  const last = Number(state.flags.daily_claim_day ?? -1);
  if (last < 0) return 0;
  const next = (last + 1) * DAY_MS;
  return Math.max(0, next - now);
}

export function tryClaimDaily(state: GameState, now = Date.now()): boolean {
  if (dailyClaimed(state, now)) return false;
  addCapped(state, "gold", 12);
  addCapped(state, "food", 20);
  state.flags.daily_claim_day = utcDay(now);
  state.inputLog.push({
    tick: state.meta.tick,
    type: "daily_claim",
    issuerId: "player",
    payload: { day: utcDay(now) },
  });
  recordCrown(state, "daily", "Daily court: +12 gold, +20 food.");
  return true;
}
