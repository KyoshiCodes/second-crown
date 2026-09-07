import type { GameState, Province } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";
import { getUnitType } from "../content/units.js";
import { getProvince, neighbors, provinceAt } from "./board.js";
import { defenseBonus, realmPower, resolveBattle } from "./combat.js";
import { createRngStreams, type RngStreams } from "../core/rng.js";
import { maxMarches } from "./labor.js";

const GRID_W = 16;
const GRID_H = 10;
const TICKS_PER_STEP = 15;
const LEVY = 5;
const RESPAWN = 400;

export interface March {
  id: string;
  realmId: string;
  fromId: string;
  toId: string;
  arrivesTick: number;
  kind: "camp" | "node" | "hold";
  levy: number;
}

interface Respawn {
  id: string;
  tick: number;
  node: Province["node"];
}

export function edgeWallCount(state: GameState, realmId: string): number {
  return state.buildings.filter(
    (b) =>
      b.realmId === realmId &&
      b.typeId === "walls" &&
      b.completesAtTick === null &&
      (b.x === 0 || b.y === 0 || b.x === GRID_W - 1 || b.y === GRID_H - 1)
  ).length;
}

export function hasClosedWallRing(state: GameState, realmId = "player"): boolean {
  return edgeWallCount(state, realmId) >= 8;
}

export function wallHp(state: GameState, realmId = "player"): number {
  const edge = edgeWallCount(state, realmId);
  const inner = Math.max(0, countBuilding(state, "walls") - edge);
  return edge * 12 + inner * 4 + (hasClosedWallRing(state, realmId) ? 20 : 0);
}

export function siegeDefense(state: GameState, realmId: string): number {
  return realmPower(state, realmId) + defenseBonus(state, realmId) + wallHp(state, realmId);
}

function marches(state: GameState): March[] {
  const raw = state.flags["marches_json"];
  if (typeof raw !== "string" || !raw) return [];
  try {
    return JSON.parse(raw) as March[];
  } catch {
    return [];
  }
}

function saveMarches(state: GameState, list: March[]): void {
  state.flags["marches_json"] = JSON.stringify(list);
}

function respawns(state: GameState): Respawn[] {
  const raw = state.flags["respawn_json"];
  if (typeof raw !== "string" || !raw) return [];
  try {
    return JSON.parse(raw) as Respawn[];
  } catch {
    return [];
  }
}

function saveRespawns(state: GameState, list: Respawn[]): void {
  state.flags["respawn_json"] = JSON.stringify(list);
}

function scheduleRespawn(state: GameState, dest: Province): void {
  if (dest.node === "none" || dest.node === "hold") return;
  saveRespawns(state, [...respawns(state), { id: dest.id, tick: state.meta.tick + RESPAWN, node: dest.node }]);
}

export function listMarches(state: GameState): March[] {
  return marches(state);
}

export function activePlayerMarch(state: GameState): March | undefined {
  return marches(state).find((m) => m.realmId === "player");
}

function playerMilitia(state: GameState) {
  return state.units.find((u) => u.realmId === "player" && u.typeId === "militia");
}

function takeLevy(state: GameState): number {
  const u = playerMilitia(state);
  if (!u) return 0;
  const have = D(u.count).toNumber();
  const n = Math.min(LEVY, Math.floor(have));
  if (n < 1) return 0;
  u.count = toDecimalString(D(u.count).sub(n));
  if (D(u.count).lte(0)) state.units = state.units.filter((x) => x !== u);
  return n;
}

function returnLevy(state: GameState, n: number): void {
  if (n <= 0) return;
  const u = playerMilitia(state);
  if (u) u.count = toDecimalString(D(u.count).add(n));
  else {
    state.units.push({
      id: `u_return_${state.meta.tick}`,
      typeId: "militia",
      realmId: "player",
      count: toDecimalString(n),
      armyId: null,
    });
  }
}

function manhattan(a: Province, b: Province): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function tryMarch(state: GameState, destId: string): boolean {
  const mine = marches(state).filter((m) => m.realmId === "player");
  if (mine.length >= maxMarches(state)) return false;
  const dest = getProvince(state, destId);
  const home = getProvince(state, state.board.homeProvinceId);
  if (!dest || !home) return false;
  if (dest.id === home.id) return false;
  const levy = takeLevy(state);
  if (levy < 1) return false;
  const dist = Math.max(1, manhattan(home, dest));
  let kind: March["kind"] = "node";
  if (dest.node === "camp") kind = "camp";
  if (dest.node === "hold") kind = "hold";
  saveMarches(state, [
    ...marches(state),
    {
      id: `m_${state.meta.tick}_${destId}_${mine.length}`,
      realmId: "player",
      fromId: home.id,
      toId: dest.id,
      arrivesTick: state.meta.tick + dist * TICKS_PER_STEP,
      kind,
      levy,
    },
  ]);
  return true;
}

export function tryNpcMarch(state: GameState, realmId: string, destId: string): boolean {
  if (realmId === "player") return false;
  if (marches(state).some((m) => m.realmId === realmId)) return false;
  const dest = getProvince(state, destId);
  const from = state.board.provinces.find((p) => p.occupantRealmId === realmId && p.node === "hold");
  if (!dest || !from) return false;
  const dist = Math.max(1, manhattan(from, dest));
  saveMarches(state, [
    ...marches(state),
    {
      id: `m_${realmId}_${state.meta.tick}`,
      realmId,
      fromId: from.id,
      toId: dest.id,
      arrivesTick: state.meta.tick + dist * TICKS_PER_STEP,
      kind: dest.node === "hold" ? "hold" : dest.node === "camp" ? "camp" : "node",
      levy: 8,
    },
  ]);
  return true;
}

function damageHoldBuilding(state: GameState): string | null {
  const target = state.buildings.find(
    (b) => b.realmId === "player" && b.typeId !== "keep" && b.completesAtTick === null
  );
  if (!target) return null;
  target.completesAtTick = state.meta.tick + 40;
  return target.typeId;
}

export function resolveMarchArrival(state: GameState, march: March, rng: RngStreams): string {
  const dest = getProvince(state, march.toId);
  const levy = march.levy ?? 0;
  const pwr = levy * (getUnitType("militia")?.power ?? 1);
  if (!dest) {
    if (march.realmId === "player") returnLevy(state, levy);
    return "March lost.";
  }
  if (march.realmId !== "player" && dest.id === state.board.homeProvinceId) {
    const def = siegeDefense(state, "player");
    applySiegeBlow(state, pwr + realmPower(state, march.realmId), def);
    const war = {
      id: `w_siege_${state.meta.tick}`,
      attackerRealmId: march.realmId,
      defenderRealmId: "player",
      startedTick: state.meta.tick,
      status: "active" as const,
    };
    state.wars.push(war);
    const result = resolveBattle(state, war, rng);
    return result.winnerId === "player" ? "Siege broken." : "The hold is breached.";
  }
  if (march.kind === "camp" || dest.node === "camp") {
    if (pwr >= 4) {
      scheduleRespawn(state, dest);
      dest.node = "none";
      if (march.realmId === "player") {
        state.resources.wood = toDecimalString(D(state.resources.wood ?? "0").add(20));
        returnLevy(state, levy);
      }
      return "Camp broken. +20 wood.";
    }
    if (march.realmId === "player") returnLevy(state, Math.max(0, levy - 2));
    return "The camp holds. Two did not return.";
  }
  if (march.kind === "node") {
    const node = dest.node;
    if (node === "woodcut" || node === "quarry" || node === "field") {
      scheduleRespawn(state, dest);
      dest.node = "none";
    }
    if (march.realmId === "player") {
      returnLevy(state, levy);
      if (node === "woodcut") {
        state.resources.wood = toDecimalString(D(state.resources.wood ?? "0").add(12));
        return "Woodcutting party returns +12 wood.";
      }
      if (node === "quarry") {
        state.resources.stone = toDecimalString(D(state.resources.stone ?? "0").add(12));
        return "Quarry party returns +12 stone.";
      }
      if (node === "field") {
        state.resources.food = toDecimalString(D(state.resources.food ?? "0").add(12));
        return "Foragers return +12 food.";
      }
    }
    return "Empty province.";
  }
  if (dest.occupantRealmId && dest.occupantRealmId !== march.realmId) {
    const war = {
      id: `w_march_${state.meta.tick}`,
      attackerRealmId: march.realmId,
      defenderRealmId: dest.occupantRealmId,
      startedTick: state.meta.tick,
      status: "active" as const,
    };
    state.wars.push(war);
    const result = resolveBattle(state, war, rng);
    if (march.realmId === "player") {
      returnLevy(state, result.winnerId === "player" ? levy : Math.max(0, Math.floor(levy * 0.4)));
    }
    return result.winnerId === march.realmId ? "Hold stormed." : "The hold stands.";
  }
  if (march.realmId === "player") returnLevy(state, levy);
  return "March arrived.";
}

export function applySiegeBlow(state: GameState, attackerPower: number, defenderScore: number): string | null {
  if (attackerPower <= defenderScore * 1.35) return null;
  return damageHoldBuilding(state);
}

export const MarchSystem = {
  nextEventTick(state: GameState): number | null {
    const list = [...marches(state).map((m) => m.arrivesTick), ...respawns(state).map((r) => r.tick)];
    if (list.length === 0) return null;
    return Math.min(...list);
  },
  processEventsAt(state: GameState, tick: number): void {
    const dueR = respawns(state).filter((r) => r.tick === tick);
    if (dueR.length) {
      saveRespawns(state, respawns(state).filter((r) => r.tick !== tick));
      for (const r of dueR) {
        const p = getProvince(state, r.id);
        if (p && p.node === "none" && !p.occupantRealmId) p.node = r.node;
      }
    }
    const due = marches(state).filter((m) => m.arrivesTick === tick);
    if (due.length === 0) return;
    saveMarches(state, marches(state).filter((m) => m.arrivesTick !== tick));
    const rng = createRngStreams(state.meta.seed + tick);
    for (const m of due) resolveMarchArrival(state, m, rng);
  },
  advanceAnalytic(): void {},
  tick(): void {},
};

export { provinceAt, neighbors };
