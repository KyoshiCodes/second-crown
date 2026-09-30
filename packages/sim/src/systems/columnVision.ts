import type { GameState } from "@second-crown/shared";
import { getProvince, provinceAt } from "./board.js";
import { revealProvince } from "./fog.js";
import { listGathers } from "./gather.js";
import { listMarches } from "./march.js";

const TICKS_PER_STEP = 15;

export function routeTiles(state: GameState, fromId: string, toId: string): string[] {
  const from = getProvince(state, fromId);
  const to = getProvince(state, toId);
  if (!from || !to) return [];
  const ids: string[] = [from.id];
  let x = from.x;
  let y = from.y;
  while (x !== to.x || y !== to.y) {
    if (x !== to.x) x += Math.sign(to.x - x);
    else y += Math.sign(to.y - y);
    const p = provinceAt(state, x, y);
    if (p) ids.push(p.id);
    else break;
  }
  return ids;
}

function revealProgress(state: GameState, fromId: string, toId: string, progress: number): void {
  const path = routeTiles(state, fromId, toId);
  if (path.length === 0) return;
  const p = Math.min(1, Math.max(0, progress));
  const reached = Math.max(1, Math.ceil(p * (path.length - 1) + 1e-9));
  for (let i = 0; i < reached && i < path.length; i++) revealProvince(state, path[i]);
}

export function revealActiveColumns(state: GameState, atTick = state.meta.tick): void {
  for (const m of listMarches(state)) {
    if (m.realmId !== "player") continue;
    const from = getProvince(state, m.fromId);
    const to = getProvince(state, m.toId);
    if (!from || !to) continue;
    const travel = Math.max(1, (Math.abs(from.x - to.x) + Math.abs(from.y - to.y)) * TICKS_PER_STEP);
    const departed = m.departedTick ?? m.arrivesTick - travel;
    const span = Math.max(1, m.arrivesTick - departed);
    revealProgress(state, m.fromId, m.toId, (atTick - departed) / span);
  }
  for (const g of listGathers(state)) {
    if (g.realmId !== "player") continue;
    const span = Math.max(1, g.arrivesTick - g.departedTick);
    const progress = (atTick - g.departedTick) / span;
    if (g.phase === "returning") revealProgress(state, g.toId, g.fromId, progress);
    else revealProgress(state, g.fromId, g.toId, g.phase === "gathering" ? 1 : progress);
  }
}

export const ColumnVisionSystem = {
  nextEventTick(): number | null {
    return null;
  },
  processEventsAt(): void {},
  advanceAnalytic(state: GameState, _fromTick?: number, toTick?: number): void {
    revealActiveColumns(state, toTick ?? state.meta.tick);
  },
  tick(state: GameState): void {
    revealActiveColumns(state, state.meta.tick);
  },
};
