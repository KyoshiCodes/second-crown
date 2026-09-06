import type { GameState, War } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getUnitType } from "../content/units.js";
import { countBuilding } from "../content/buildings.js";
import type { RngStreams } from "../core/rng.js";
import { grantVictorySpoils } from "./wave.js";

export function realmPower(state: GameState, realmId: string): number {
  let power = 0;
  for (const u of state.units) {
    if (u.realmId !== realmId) continue;
    const def = getUnitType(u.typeId);
    if (!def) continue;
    power += def.power * D(u.count).toNumber();
  }
  if (realmId === "player") {
    power += countBuilding(state, "watchtower") * 2;
    power += countBuilding(state, "walls") * 4;
  }
  return power;
}
