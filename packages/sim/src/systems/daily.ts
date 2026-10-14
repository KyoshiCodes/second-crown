import type { GameState } from "@second-crown/shared";
import { addCapped } from "./storage.js";
import { recordCrown } from "./ledger.js";
import { requireClock } from "../core/clock.js";

const DAY_MS = 86_400_000;

// Every daily call takes `now` from the caller (the app clock). No wall-clock fallback.

export function utcDay(now: number): number {
  return Math.floor(requireClock(now, "utcDay") / DAY_MS);
}

export function dailyClaimed(state: GameState, now: number): boolean {
  return Number(state.flags.daily_claim_day ?? -1) === utcDay(now);
}

export function dailyMsLeft(state: GameState, now: number): number {
  requireClock(now, "dailyMsLeft");
  const last = Number(state.flags.daily_claim_day ?? -1);
  if (last < 0) return 0;
  const next = (last + 1) * DAY_MS;
  return Math.max(0, next - now);
}

export function tryClaimDaily(state: GameState, now: number): boolean {
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
