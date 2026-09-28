import type { GameState } from "@second-crown/shared";

const GATHER_NODES = new Set(["woodcut", "quarry", "field"]);

export const NODE_STOCK_MAX: Record<string, number> = {
  woodcut: 120,
  quarry: 90,
  field: 160,
};

export const NODE_REGEN_PERIOD = 40;
export const NODE_REGEN_AMOUNT = 1;

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

/** Stock already written to state for this tile, or null if the tile has never been touched. Read-only. */
export function storedNodeStock(state: GameState, provinceId: string): number | null {
  const raw = state.flags[key(provinceId)];
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return Math.max(0, raw);
}

export function drainNodeStock(state: GameState, provinceId: string, amount: number): number {
  const have = nodeStock(state, provinceId);
  const take = Math.max(0, Math.min(have, amount));
  state.flags[key(provinceId)] = have - take;
  return take;
}

function busyTiles(state: GameState): Set<string> {
  const raw = state.flags["gathers_json"];
  const gathers = typeof raw === "string" ? (JSON.parse(raw) as { toId: string; phase: string }[]) : [];
  return new Set(gathers.filter((g) => g.phase !== "returning").map((g) => g.toId));
}

function needsRegen(state: GameState): boolean {
  const busy = busyTiles(state);
  return state.board.provinces.some((p) => {
    if (!GATHER_NODES.has(p.node) || busy.has(p.id)) return false;
    return nodeStock(state, p.id) < nodeStockMax(p.node);
  });
}

export function regenNodes(state: GameState, pulses = 1): void {
  if (pulses <= 0) return;
  const busy = busyTiles(state);
  for (const p of state.board.provinces) {
    if (!GATHER_NODES.has(p.node) || busy.has(p.id)) continue;
    const max = nodeStockMax(p.node);
    const have = nodeStock(state, p.id);
    if (have >= max) continue;
    state.flags[key(p.id)] = Math.min(max, have + pulses * NODE_REGEN_AMOUNT);
  }
}

export const NodeStockSystem = {
  nextEventTick(state: GameState): number | null {
    if (!needsRegen(state)) return null;
    return Math.floor(state.meta.tick / NODE_REGEN_PERIOD) * NODE_REGEN_PERIOD + NODE_REGEN_PERIOD;
  },
  processEventsAt(state: GameState, tick: number): void {
    if (tick % NODE_REGEN_PERIOD !== 0) return;
    regenNodes(state, 1);
  },
  advanceAnalytic(state: GameState, from: number, to: number): void {
    const first = Math.ceil((from + 1) / NODE_REGEN_PERIOD) * NODE_REGEN_PERIOD;
    const last = Math.floor(to / NODE_REGEN_PERIOD) * NODE_REGEN_PERIOD;
    if (last < first) return;
    regenNodes(state, (last - first) / NODE_REGEN_PERIOD + 1);
  },
  tick(): void {},
};
