import type { GameState } from "@second-crown/shared";
import { countBuilding } from "../content/buildings.js";

const GRID_W = 16;
const GRID_H = 10;

export function gateOnRim(state: GameState, realmId = "player"): boolean {
  return state.buildings.some(
    (b) =>
      b.realmId === realmId &&
      b.typeId === "gate" &&
      b.completesAtTick === null &&
      (b.x === 0 || b.y === 0 || b.x === GRID_W - 1 || b.y === GRID_H - 1)
  );
}

export function gateHp(state: GameState, realmId = "player"): number {
  if (!gateOnRim(state, realmId)) return 0;
  return 25 + countBuilding(state, "gate") * 5;
}
