import type { GameState } from "@second-crown/shared";
import { resourceLedger } from "./storage.js";

const WAREHOUSE: Record<string, { store: string; label: string }> = {
  food: { store: "granary", label: "Granary" },
  wood: { store: "sawmill", label: "Sawmill" },
  stone: { store: "mason", label: "Mason" },
  gold: { store: "mint", label: "Mint" },
};

export function fullStores(state: GameState): { res: string; warehouse: string; label: string }[] {
  const out: { res: string; warehouse: string; label: string }[] = [];
  for (const res of ["food", "wood", "stone", "gold"]) {
    const line = resourceLedger(state, res);
    if (!line.full) continue;
    const w = WAREHOUSE[res];
    out.push({ res, warehouse: w.store, label: w.label });
  }
  return out;
}
