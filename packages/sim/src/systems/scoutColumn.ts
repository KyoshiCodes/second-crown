import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getProvince } from "./board.js";
import { takeForce } from "./column.js";
import { isProvinceSeen, scoutCost } from "./fog.js";
import { listGathers } from "./gather.js";
import { listMarches, tryRecallMarch, type March } from "./march.js";
import { maxMarches } from "./labor.js";
import { marchTicks } from "./age.js";

function save(state: GameState, list: March[]): void {
  state.flags["marches_json"] = JSON.stringify(list);
}

function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function pickScoutForce(state: GameState): Record<string, number> | null {
  const ski = state.units.find((u) => u.realmId === "player" && u.typeId === "skirmisher");
  if (ski && D(ski.count).gte(1)) return { skirmisher: 1 };
  const mil = state.units.find((u) => u.realmId === "player" && u.typeId === "militia");
  if (mil && D(mil.count).gte(1)) return { militia: 1 };
  return null;
}

export function tryDispatchScout(state: GameState, destId: string): boolean {
  if (isProvinceSeen(state, destId)) return false;
  const dest = getProvince(state, destId);
  const home = getProvince(state, state.board.homeProvinceId);
  if (!dest || !home || dest.id === home.id) return false;
  const mine = listMarches(state).filter((m) => m.realmId === "player");
  if (mine.length + listGathers(state).length >= maxMarches(state)) return false;
  if (mine.some((m) => m.purpose === "scout" && m.toId === destId)) return false;
  const cost = scoutCost(state);
  if (D(state.resources.gold ?? "0").lt(cost)) return false;
  const force = pickScoutForce(state);
  if (!force) return false;
  if (!takeForce(state, force)) return false;
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").sub(cost));
  const dist = Math.max(1, manhattan(home.x, home.y, dest.x, dest.y));
  const levy = Object.values(force).reduce((a, b) => a + b, 0);
  save(state, [
    ...listMarches(state),
    {
      id: `m_scout_${state.meta.tick}_${dest.id}`,
      realmId: "player",
      fromId: home.id,
      toId: dest.id,
      departedTick: state.meta.tick,
      arrivesTick: state.meta.tick + marchTicks(state, dist),
      kind: dest.node === "hold" ? "hold" : dest.node === "camp" ? "camp" : "node",
      levy,
      force,
      purpose: "scout",
    },
  ]);
  state.inputLog.push({ tick: state.meta.tick, type: "dispatch_scout", payload: { destId, force, cost } });
  return true;
}

export function tryRecallScout(state: GameState): boolean {
  const m = listMarches(state).find((x) => x.realmId === "player" && x.purpose === "scout");
  if (!m) return false;
  return tryRecallMarch(state);
}
