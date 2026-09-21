import type { GameState } from "@second-crown/shared";
import { jobForBuildingType } from "./citizens.js";
import { staffBonus } from "./economy.js";
import { getBuildingType } from "../content/buildings.js";

const SKIP = new Set(["keep", "walls", "gate", "cottage", "house", "watchtower"]);

export function emptyStaffWorks(state: GameState): { id: string; typeId: string; name: string }[] {
  const out: { id: string; typeId: string; name: string }[] = [];
  for (const b of state.buildings) {
    if (b.realmId !== "player" || b.completesAtTick !== null) continue;
    if (SKIP.has(b.typeId)) continue;
    const job = jobForBuildingType(b.typeId);
    if (job === "unassigned") continue;
    if (staffBonus(state, b) > 1) continue;
    out.push({
      id: b.id,
      typeId: b.typeId,
      name: getBuildingType(b.typeId)?.name ?? b.typeId,
    });
  }
  return out;
}
