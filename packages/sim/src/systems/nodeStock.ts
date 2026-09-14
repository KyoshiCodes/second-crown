import type { GameState } from "@second-crown/shared";

const GATHER_NODES = new Set(["woodcut", "quarry", "field"]);

export const NODE_STOCK_MAX: Record<string, number> = {
  woodcut: 120,
  quarry: 90,
  field: 160,
};

function key(id: string): string {
  return `node_stock_${id}`;
}

export function nodeStockMax(node: string): number {
  return NODE_STOCK_MAX[node] ?? 0;
}

export function nodeStock(state: GameState, provinceId: string): number {
  const p = state.board.provinces.find((x) => x.id === provinceId);
  if (!p || !GATHER_NODES.has(p.node)) return 0;
  const raw = state.flags[key(provinceId)];
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(0, raw);
  return nodeStockMax(p.node);
}

export function drainNodeStock(state: GameState, provinceId: string, amount: number): number {
  const have = nodeStock(state, provinceId);
  const take = Math.max(0, Math.min(have, amount));
  state.flags[key(provinceId)] = have - take;
  return take;
}
