import type { GameState } from "@second-crown/shared";

const GRID_W = 16;
const GRID_H = 10;

export interface RimFort {
  x: number;
  y: number;
  kind: "wall" | "gate";
}

function isRimTile(x: number, y: number): boolean {
  return x === 0 || y === 0 || x === GRID_W - 1 || y === GRID_H - 1;
}

/** Index of a rim tile walking the ring clockwise starting at (0,0): top L->R, right T->B, bottom R->L, left B->T. */
function rimWalkIndex(x: number, y: number): number {
  if (y === 0) return x;
  if (x === GRID_W - 1) return 16 + (y - 1);
  if (y === GRID_H - 1) return 25 + (GRID_W - 2 - x);
  return 40 + (GRID_H - 2 - y);
}

/** Finished wall/gate buildings on the hold rim, ordered clockwise from (0,0) so a renderer can stroke a ring. */
export function listRimForts(state: GameState, realmId = "player"): RimFort[] {
  const forts: RimFort[] = [];
  for (const b of state.buildings) {
    if (b.realmId !== realmId) continue;
    if (b.completesAtTick !== null) continue;
    if (!isRimTile(b.x, b.y)) continue;
    if (b.typeId === "walls") forts.push({ x: b.x, y: b.y, kind: "wall" });
    else if (b.typeId === "gate") forts.push({ x: b.x, y: b.y, kind: "gate" });
  }
  forts.sort((a, b) => rimWalkIndex(a.x, a.y) - rimWalkIndex(b.x, b.y));
  return forts;
}
