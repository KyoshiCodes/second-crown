import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { addSpoils, flagNum } from "./wave.js";

export const ITEM_TIERS = ["common", "uncommon", "rare", "epic"] as const;

export const ITEMS = [
  { id: "iron_shard", name: "Iron Shard", tier: "common", spoils: "iron" },
  { id: "war_banner", name: "War Banner", tier: "uncommon", spoils: "banners" },
  { id: "ash_relic", name: "Ash Relic", tier: "rare", spoils: "relics" },
  { id: "crown_splinter", name: "Crown Splinter", tier: "epic", spoils: "relics" },
] as const;

export function grantBattleLoot(state: GameState): string[] {
  const log: string[] = [];
  addSpoils(state, 2, 1, 0);
  log.push("iron and a banner from the field");
  const wins = flagNum(state, "wars_won");
  if (wins % 3 === 0) {
    addSpoils(state, 0, 0, 1);
    log.push("an ash relic");
  }
  if (wins % 7 === 0) {
    addSpoils(state, 0, 0, 2);
    log.push("crown splinters");
  }
  return log;
}

export function tryBuyBazaar(state: GameState, item: "iron" | "banners" | "relics"): boolean {
  const price = item === "relics" ? 40 : item === "banners" ? 22 : 14;
  if (D(state.resources.gold ?? "0").lt(price)) return false;
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").sub(price));
  addSpoils(state, item === "iron" ? 2 : 0, item === "banners" ? 2 : 0, item === "relics" ? 1 : 0);
  return true;
}
