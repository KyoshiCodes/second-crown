import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";

export const EVENT_PERIOD = 500;

function hashTick(seed: number, tick: number): number {
  let x = (seed ^ tick * 374761393) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 2246822507) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 3266489909) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

export interface WorldEvent {
  tick: number;
  id: string;
  text: string;
}

function readLog(state: GameState, key = "event_log"): WorldEvent[] {
  const raw = state.flags[key];
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as WorldEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLog(state: GameState, log: WorldEvent[], key = "event_log"): void {
  state.flags[key] = JSON.stringify(log.slice(-24));
}

export function pushWorldLog(state: GameState, id: string, text: string): void {
  const ev: WorldEvent = { tick: state.meta.tick, id, text };
  const log = readLog(state, "world_log");
  log.push(ev);
  writeLog(state, log, "world_log");
  state.flags["last_world"] = text;
}

export function getWorldLog(state: GameState): WorldEvent[] {
  return readLog(state, "world_log");
}

function applyEvent(state: GameState, tick: number): WorldEvent {
  const roll = hashTick(state.meta.seed, tick) % 5;
  let ev: WorldEvent;

  if (roll === 0) {
    state.resources.food = toDecimalString(D(state.resources.food ?? "0").add(25));
    ev = { tick, id: "harvest", text: "Bountiful harvest — +25 food" };
  } else if (roll === 1) {
    state.resources.wood = toDecimalString(D(state.resources.wood ?? "0").add(20));
    ev = { tick, id: "timber", text: "Timber windfall — +20 wood" };
  } else if (roll === 2) {
    const food = D(state.resources.food ?? "0");
    const lost = food.mul(0.05).floor();
    const cap = lost.gt(50) ? D(50) : lost;
    state.resources.food = toDecimalString(food.sub(cap));
    ev = { tick, id: "spoil", text: `Spoilage — lost ${cap.toString()} food` };
  } else if (roll === 3) {
    const rival = state.units.find((u) => u.realmId === "rival" && u.typeId === "militia");
    if (rival) rival.count = toDecimalString(D(rival.count).add(3));
    ev = { tick, id: "levy", text: "Iron March raises a levy — +3 militia" };
    pushWorldLog(state, "levy", "Iron March musters +3 militia");
  } else {
    state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").add(10));
    ev = { tick, id: "tribute", text: "A merchant pays tribute — +10 gold" };
  }

  state.flags["last_event"] = ev.text;
  state.flags["last_event_tick"] = tick;
  const log = readLog(state, "event_log");
  log.push(ev);
  writeLog(state, log, "event_log");
  return ev;
}

export function getEventLog(state: GameState): WorldEvent[] {
  return readLog(state, "event_log");
}

export const EventSystem = {
  nextEventTick(state: GameState): number | null {
    return Math.floor(state.meta.tick / EVENT_PERIOD) * EVENT_PERIOD + EVENT_PERIOD;
  },

  advanceAnalytic(_state: GameState, _from: number, _to: number): void {},

  processEventsAt(state: GameState, tick: number): void {
    if (tick > 0 && tick % EVENT_PERIOD === 0) applyEvent(state, tick);
  },

  tick(_state: GameState): void {},
};
