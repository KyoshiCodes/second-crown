import type { GameState, Province } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";
import { getProvince, neighbors, provinceAt } from "./board.js";
import { defenseBonus, realmPower, resolveBattle } from "./combat.js";
import type { RngStreams } from "../core/rng.js";

const GRID_W = 16;
const GRID_H = 10;
const TICKS_PER_STEP = 15;

export interface March {
  id: string;
  realmId: string;
  fromId: string;
  toId: string;
  arrivesTick: number;
  kind: "camp" | "node" | "hold";
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

/** A closed ring is eight or more finished wall segments on the hold rim. */
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

export function listMarches(state: GameState): March[] {
  return marches(state);
}

export function activePlayerMarch(state: GameState): March | undefined {
  return marches(state).find((m) => m.realmId === "player");
}

function manhattan(a: Province, b: Province): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function tryMarch(state: GameState, destId: string): boolean {
  if (activePlayerMarch(state)) return false;
  const dest = getProvince(state, destId);
  const home = getProvince(state, state.board.homeProvinceId);
  if (!dest || !home) return false;
  if (dest.id === home.id) return false;
  const dist = Math.max(1, manhattan(home, dest));
  let kind: March["kind"] = "node";
  if (dest.node === "camp") kind = "camp";
  if (dest.node === "hold") kind = "hold";
  const march: March = {
    id: `m_${state.meta.tick}_${destId}`,
    realmId: "player",
    fromId: home.id,
    toId: dest.id,
    arrivesTick: state.meta.tick + dist * TICKS_PER_STEP,
    kind,
  };
  saveMarches(state, [...marches(state), march]);
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
  if (!dest) return "March lost.";
  if (march.kind === "camp" || dest.node === "camp") {
    const mine = realmPower(state, "player");
    if (mine >= 6) {
      state.resources.wood = toDecimalString(D(state.resources.wood ?? "0").add(20));
      dest.node = "none";
      return "Camp broken. +20 wood.";
    }
    return "The camp holds.";
  }
  if (march.kind === "node") {
    if (dest.node === "woodcut") {
      state.resources.wood = toDecimalString(D(state.resources.wood ?? "0").add(12));
      return "Woodcutting party returns +12 wood.";
    }
    if (dest.node === "quarry") {
      state.resources.stone = toDecimalString(D(state.resources.stone ?? "0").add(12));
      return "Quarry party returns +12 stone.";
    }
    if (dest.node === "field") {
      state.resources.food = toDecimalString(D(state.resources.food ?? "0").add(12));
      return "Foragers return +12 food.";
    }
    return "Empty province.";
  }
  if (dest.occupantRealmId && dest.occupantRealmId !== "player") {
    const war = {
      id: `w_march_${state.meta.tick}`,
      attackerRealmId: "player",
      defenderRealmId: dest.occupantRealmId,
      startedTick: state.meta.tick,
      status: "active" as const,
    };
    state.wars.push(war);
    const result = resolveBattle(state, war, rng);
    return result.winnerId === "player" ? "Hold stormed." : "The hold stands.";
  }
  return "March arrived.";
}

/** Incoming strike on the player's hold (used by tests and later AI). */
export function applySiegeBlow(state: GameState, attackerPower: number, defenderScore: number): string | null {
  if (attackerPower <= defenderScore * 1.35) return null;
  return damageHoldBuilding(state);
}

export const MarchSystem = {
  nextEventTick(state: GameState): number | null {
    const list = marches(state);
    if (list.length === 0) return null;
    return Math.min(...list.map((m) => m.arrivesTick));
  },
  processEventsAt(state: GameState, tick: number): void {
    const due = marches(state).filter((m) => m.arrivesTick === tick);
    if (due.length === 0) return;
    const rest = marches(state).filter((m) => m.arrivesTick !== tick);
    saveMarches(state, rest);
    for (const m of due) {
      resolveMarchArrival(state, m, {
        battle: () => 0.5,
        world: () => 0.5,
        loot: () => 0.5,
      } as RngStreams);
    }
  },
  advanceAnalytic(): void {},
  tick(): void {},
};

export { provinceAt, neighbors };
