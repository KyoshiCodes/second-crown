import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { realmPower } from "./combat.js";
import { pushWorldLog } from "./events.js";
import { addSpoils, flagNum } from "./wave.js";

export function activeClash(state: GameState): { a: string; b: string; until: number } | null {
  const a = String(state.flags.world_a || "");
  const b = String(state.flags.world_b || "");
  const until = flagNum(state, "world_until");
  if (!a || !b || state.meta.tick >= until) return null;
  return { a, b, until };
}

export function tryJoinClash(state: GameState, sideId: string): boolean {
  const clash = activeClash(state);
  if (!clash) return false;
  if (sideId !== clash.a && sideId !== clash.b) return false;
  if (state.flags.world_side) return false;
  if (D(state.resources.gold ?? "0").lt(20)) return false;
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").sub(20));
  state.flags.world_side = sideId;
  const name = state.realms.find((r) => r.id === sideId)?.name ?? sideId;
  pushWorldLog(state, "levy", `Your Crown sends a levy to ${name}`);
  return true;
}

export function tickWorldClash(state: GameState, atTick: number): void {
  const until = flagNum(state, "world_until");
  if (until && atTick >= until && state.flags.world_a) {
    resolveClash(state, atTick);
  }
  if (atTick > 0 && atTick % 300 === 0 && !activeClash(state) && !state.flags.world_a) {
    startClash(state, atTick);
  }
}

function startClash(state: GameState, atTick: number): void {
  const npcs = state.realms.filter((r) => r.id !== "player").map((r) => r.id);
  if (npcs.length < 2) return;
  const i = atTick % npcs.length;
  const j = (i + 1 + Math.floor(atTick / 7)) % npcs.length;
  if (npcs[i] === npcs[j]) return;
  state.flags.world_a = npcs[i];
  state.flags.world_b = npcs[j];
  state.flags.world_until = atTick + 80;
  delete state.flags.world_side;
  const na = state.realms.find((r) => r.id === npcs[i])?.name ?? npcs[i];
  const nb = state.realms.find((r) => r.id === npcs[j])?.name ?? npcs[j];
  pushWorldLog(state, "declare", `${na} and ${nb} march on each other`);
}

function resolveClash(state: GameState, atTick: number): void {
  const a = String(state.flags.world_a || "");
  const b = String(state.flags.world_b || "");
  if (!a || !b) return;
  let pa = realmPower(state, a);
  let pb = realmPower(state, b);
  const side = String(state.flags.world_side || "");
  if (side === a) pa += 8;
  if (side === b) pb += 8;
  const winner = pa >= pb ? a : b;
  const loser = winner === a ? b : a;
  const wn = state.realms.find((r) => r.id === winner)?.name ?? winner;
  const ln = state.realms.find((r) => r.id === loser)?.name ?? loser;
  pushWorldLog(state, "battle", `${wn} breaks ${ln} in a foreign war`);
  if (side && side === winner) {
    addSpoils(state, 2, 1, 0);
    pushWorldLog(state, "loot", "Your levy returns with iron and banners");
  } else if (side) {
    pushWorldLog(state, "loot", "Your levy is scattered. No spoils.");
  }
  delete state.flags.world_a;
  delete state.flags.world_b;
  delete state.flags.world_until;
  delete state.flags.world_side;
  void atTick;
}
