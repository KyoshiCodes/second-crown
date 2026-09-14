import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getUnitType } from "../content/units.js";
import { getProvince } from "./board.js";
import { takeForce, returnForce } from "./column.js";
import { maxMarches } from "./labor.js";
import { listMarches } from "./march.js";
import { drainNodeStock, nodeStock } from "./nodeStock.js";

export const GATHER_NODES = {
  woodcut: { resource: "wood", perTroop: 6, ticksPerLoad: 10 },
  quarry: { resource: "stone", perTroop: 4, ticksPerLoad: 20 },
  field: { resource: "food", perTroop: 8, ticksPerLoad: 5 },
} as const;

export interface Gather {
  id: string;
  realmId: string;
  fromId: string;
  toId: string;
  node: keyof typeof GATHER_NODES;
  force: Record<string, number>;
  phase: "outbound" | "gathering" | "returning";
  departedTick: number;
  arrivesTick: number;
  travelTicks: number;
  gatherStartedTick: number;
  capacity: string;
  load: string;
}

function read(state: GameState): Gather[] {
  const raw = state.flags["gathers_json"];
  return typeof raw === "string" ? JSON.parse(raw) as Gather[] : [];
}

function save(state: GameState, gathers: Gather[]): void {
  state.flags["gathers_json"] = JSON.stringify(gathers);
}

/** Load is derived from elapsed whole ticks, avoiding rounding differences in catch-up. */
export function listGathers(state: GameState): Gather[] {
  return read(state).map((g) => ({ ...g, load: g.phase === "gathering"
    ? toDecimalString(D(g.capacity).min(Math.floor(Math.max(0, state.meta.tick - g.gatherStartedTick) / GATHER_NODES[g.node].ticksPerLoad)))
    : g.load }));
}

function npcHomeId(state: GameState, realmId: string): string | null {
  const hold = state.board.provinces.find((p) => p.occupantRealmId === realmId && p.node === "hold");
  if (hold) return hold.id;
  const any = state.board.provinces.find((p) => p.occupantRealmId === realmId);
  return any?.id ?? null;
}

export function tryGather(state: GameState, destId: string, force: Record<string, number>): boolean {
  const dest = getProvince(state, destId);
  const home = getProvince(state, state.board.homeProvinceId);
  if (!dest || !home || dest.id === home.id || !(dest.node in GATHER_NODES)) return false;
  if (dest.occupantRealmId && dest.occupantRealmId !== "player") return false;
  if (nodeStock(state, dest.id) <= 0) return false;
  const gathers = listGathers(state);
  if (gathers.some((g) => g.toId === destId && g.phase !== "returning")) return false;
  const playerBusy =
    gathers.filter((g) => g.realmId === "player").length +
    listMarches(state).filter((m) => m.realmId === "player").length;
  if (playerBusy >= maxMarches(state)) return false;
  const clean: Record<string, number> = {};
  let count = 0;
  for (const id of Object.keys(force).sort()) {
    const n = force[id];
    if (!getUnitType(id) || !Number.isSafeInteger(n) || n < 0) return false;
    if (n > 0) clean[id] = n;
    count += n;
  }
  const node = dest.node as Gather["node"];
  const capacity = D(count).mul(GATHER_NODES[node].perTroop);
  const duration = capacity.mul(GATHER_NODES[node].ticksPerLoad).toNumber();
  const travelTicks = Math.max(1, Math.abs(home.x - dest.x) + Math.abs(home.y - dest.y)) * 15;
  if (!Number.isSafeInteger(state.meta.tick + 2 * travelTicks + duration) || !takeForce(state, clean)) return false;
  const serial = Number(state.flags["gather_serial"] ?? 0) + 1;
  state.flags["gather_serial"] = serial;
  save(state, [...gathers, {
    id: `g_${serial}`, realmId: "player", fromId: home.id, toId: dest.id, node, force: clean,
    phase: "outbound", departedTick: state.meta.tick, arrivesTick: state.meta.tick + travelTicks,
    travelTicks, gatherStartedTick: 0, capacity: toDecimalString(capacity), load: "0",
  }]);
  state.inputLog.push({ tick: state.meta.tick, type: "gather", issuerId: "player", payload: { destId, force: clean } });
  return true;
}

export function tryNpcGather(state: GameState, realmId: string): boolean {
  if (realmId === "player") return false;
  const fromId = npcHomeId(state, realmId);
  if (!fromId) return false;
  const home = getProvince(state, fromId);
  if (!home) return false;
  const dest = state.board.provinces.find(
    (p) =>
      p.id !== fromId &&
      p.node in GATHER_NODES &&
      (!p.occupantRealmId || p.occupantRealmId === realmId) &&
      nodeStock(state, p.id) > 0
  );
  if (!dest) return false;
  const gathers = listGathers(state);
  if (gathers.some((g) => g.toId === dest.id && g.phase !== "returning")) return false;
  if (gathers.some((g) => g.realmId === realmId && g.phase !== "returning")) return false;
  const node = dest.node as Gather["node"];
  const force = { militia: 3 };
  const capacity = D(3).mul(GATHER_NODES[node].perTroop);
  const travelTicks = Math.max(1, Math.abs(home.x - dest.x) + Math.abs(home.y - dest.y)) * 15;
  const serial = Number(state.flags["gather_serial"] ?? 0) + 1;
  state.flags["gather_serial"] = serial;
  save(state, [...gathers, {
    id: `g_${serial}`, realmId, fromId, toId: dest.id, node, force,
    phase: "outbound", departedTick: state.meta.tick, arrivesTick: state.meta.tick + travelTicks,
    travelTicks, gatherStartedTick: 0, capacity: toDecimalString(capacity), load: "0",
  }]);
  return true;
}

function returnHome(g: Gather, tick: number): void {
  const travel = g.phase === "outbound" ? Math.max(1, tick - g.departedTick) : g.travelTicks;
  g.phase = "returning";
  g.departedTick = tick;
  g.arrivesTick = tick + travel;
}

export function tryRecallGather(state: GameState, id: string): boolean {
  const gathers = listGathers(state);
  const g = gathers.find((entry) => entry.id === id);
  if (!g || g.phase === "returning" || g.realmId !== "player") return false;
  if (g.phase === "gathering") drainNodeStock(state, g.toId, Number(g.load));
  returnHome(g, state.meta.tick);
  save(state, gathers);
  state.inputLog.push({ tick: state.meta.tick, type: "recall_gather", issuerId: "player", payload: { id } });
  return true;
}

export const GatherSystem = {
  nextEventTick(state: GameState): number | null {
    const gathers = read(state);
    return gathers.length ? Math.min(...gathers.map((g) => g.arrivesTick)) : null;
  },
  processEventsAt(state: GameState, tick: number): void {
    const gathers = listGathers(state);
    if (!gathers.some((g) => g.arrivesTick === tick)) return;
    const remaining: Gather[] = [];
    for (const g of gathers) {
      if (g.arrivesTick === tick) {
        if (g.phase === "returning") {
          if (g.realmId === "player") {
            const res = GATHER_NODES[g.node].resource;
            state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").add(g.load));
            returnForce(state, g.force);
          }
          continue;
        }
        if (g.phase === "gathering") {
          g.load = g.capacity;
          drainNodeStock(state, g.toId, Number(g.load));
          returnHome(g, tick);
        } else {
          const dest = getProvince(state, g.toId);
          const left = nodeStock(state, g.toId);
          const friendly = !dest?.occupantRealmId || dest.occupantRealmId === g.realmId || dest.occupantRealmId === "player" && g.realmId === "player";
          if (dest?.node === g.node && friendly && left > 0) {
            if (D(g.capacity).gt(left)) g.capacity = toDecimalString(left);
            g.phase = "gathering";
            g.gatherStartedTick = tick;
            g.arrivesTick = tick + D(g.capacity).mul(GATHER_NODES[g.node].ticksPerLoad).toNumber();
          } else {
            returnHome(g, tick);
          }
        }
      }
      remaining.push(g);
    }
    save(state, remaining);
  },
  advanceAnalytic(): void {},
  tick(): void {},
};
