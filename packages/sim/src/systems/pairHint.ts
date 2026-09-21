import type { GameState } from "@second-crown/shared";
import { pairBonus } from "./economy.js";

export const PAIR_MATE: Record<string, string> = {
  farm: "granary",
  lumber_camp: "sawmill",
  quarry: "mason",
  gold_mine: "mint",
  granary: "farm",
  sawmill: "lumber_camp",
  mason: "quarry",
  mint: "gold_mine",
};

export const PAIR_LABEL: Record<string, string> = {
  farm: "Farm",
  granary: "Granary",
  lumber_camp: "Lumber camp",
  sawmill: "Sawmill",
  quarry: "Quarry",
  mason: "Mason",
  gold_mine: "Gold mine",
  mint: "Mint",
};

export function unpairedWorks(state: GameState): { id: string; typeId: string; wants: string }[] {
  const out: { id: string; typeId: string; wants: string }[] = [];
  for (const b of state.buildings) {
    if (b.realmId !== "player" || b.completesAtTick !== null) continue;
    const wants = PAIR_MATE[b.typeId];
    if (!wants) continue;
    if (pairBonus(state, b) <= 1) out.push({ id: b.id, typeId: b.typeId, wants });
  }
  return out;
}
