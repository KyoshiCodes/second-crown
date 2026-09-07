import type { BoardState, GameState, Province, TerrainId } from "@second-crown/shared";
import { BOARD_H, BOARD_W } from "@second-crown/shared";

const TERRAIN: TerrainId[] = ["plain", "wood", "hill", "waste", "shore", "peak"];

function hash(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

export function provinceId(x: number, y: number): string {
  return `p_${x}_${y}`;
}

export function getProvince(state: GameState, id: string): Province | undefined {
  return state.board.provinces.find((p) => p.id === id);
}

export function provinceAt(state: GameState, x: number, y: number): Province | undefined {
  return state.board.provinces.find((p) => p.x === x && p.y === y);
}

export function neighbors(state: GameState, id: string): Province[] {
  const p = getProvince(state, id);
  if (!p) return [];
  const out: Province[] = [];
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    const n = provinceAt(state, p.x + dx, p.y + dy);
    if (n) out.push(n);
  }
  return out;
}

export function emptyBoard(): BoardState {
  return { width: BOARD_W, height: BOARD_H, homeProvinceId: provinceId(2, 2), provinces: [] };
}

export function seedBoard(seed: number): BoardState {
  const homeX = 2;
  const homeY = 2;
  const rivalX = 5;
  const rivalY = 2;
  const provinces: Province[] = [];
  for (let y = 0; y < BOARD_H; y++) {
    for (let x = 0; x < BOARD_W; x++) {
      const h = hash(seed + x * 17 + y * 31);
      const terrain = TERRAIN[h % TERRAIN.length];
      const id = provinceId(x, y);
      let node: Province["node"] = "none";
      let occupant: string | null = null;
      if (x === homeX && y === homeY) {
        node = "hold";
        occupant = "player";
      } else if (x === rivalX && y === rivalY) {
        node = "hold";
        occupant = "rival";
      } else if (h % 11 === 0) node = "camp";
      else if (h % 11 === 1) node = "woodcut";
      else if (h % 11 === 2) node = "quarry";
      else if (h % 11 === 3) node = "field";
      provinces.push({ id, x, y, terrain, node, occupantRealmId: occupant });
    }
  }
  return {
    width: BOARD_W,
    height: BOARD_H,
    homeProvinceId: provinceId(homeX, homeY),
    provinces,
  };
}

export function ensureBoard(state: GameState): void {
  if (!state.board || !Array.isArray(state.board.provinces) || state.board.provinces.length === 0) {
    state.board = seedBoard(state.meta.seed);
  }
}
