import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { currentSeason, seasonIndex } from "./age.js";
import { addCapped } from "./storage.js";
import { recordCrown } from "./ledger.js";

const BOON: Record<string, { res: string; amount: number }> = {
  Spring: { res: "food", amount: 40 },
  Summer: { res: "wood", amount: 30 },
  Autumn: { res: "gold", amount: 20 },
  Winter: { res: "stone", amount: 24 },
};

export function seasonKey(state: GameState): number {
  return Math.floor(state.meta.tick / 2000);
}

export function seasonClaimed(state: GameState): boolean {
  return Number(state.flags.season_claim_key ?? -1) === seasonKey(state);
}

export function seasonBoonPreview(state: GameState): { season: string; res: string; amount: number } {
  const season = currentSeason(state);
  const b = BOON[season] ?? BOON.Spring;
  return { season, ...b };
}

export function tryClaimSeason(state: GameState): boolean {
  if (seasonClaimed(state)) return false;
  const boon = seasonBoonPreview(state);
  addCapped(state, boon.res, D(boon.amount));
  state.flags.season_claim_key = seasonKey(state);
  state.inputLog.push({
    tick: state.meta.tick,
    type: "season_claim",
    issuerId: "player",
    payload: { season: boon.season, res: boon.res },
  });
  recordCrown(state, "season", `${boon.season} court: +${boon.amount} ${boon.res}.`);
  void seasonIndex;
  return true;
}
