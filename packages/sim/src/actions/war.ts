import type { GameState, InputRecord, War } from "@second-crown/shared";
import { resolveBattle, type BattleResult } from "../systems/combat.js";
import type { RngStreams } from "../core/rng.js";
import { noteWar } from "../systems/wave.js";

export interface DeclareWarPayload {
  attackerRealmId: string;
  defenderRealmId: string;
}

function peaceLockedUntil(state: GameState, a: string, b: string): number {
  const k1 = state.flags[`peace_${a}_${b}`];
  const k2 = state.flags[`peace_${b}_${a}`];
  const t1 = typeof k1 === "number" ? k1 : 0;
  const t2 = typeof k2 === "number" ? k2 : 0;
  return Math.max(t1, t2);
}

export function tryDeclareWar(state: GameState, payload: DeclareWarPayload): boolean {
  const { attackerRealmId, defenderRealmId } = payload;
  if (attackerRealmId === defenderRealmId) return false;
  if (!state.realms.some((r) => r.id === attackerRealmId)) return false;
  if (!state.realms.some((r) => r.id === defenderRealmId)) return false;
  if (state.wars.some((w) => w.status === "active")) return false;
  if (state.meta.tick < peaceLockedUntil(state, attackerRealmId, defenderRealmId)) return false;

  const war: War = {
    id: `war_${state.meta.tick}_${state.wars.length}`,
    attackerRealmId,
    defenderRealmId,
    startedTick: state.meta.tick,
    status: "active",
  };
  state.wars.push(war);
  noteWar(state);
  state.inputLog.push({
    tick: state.meta.tick,
    type: "declare_war",
    payload,
    issuerId: attackerRealmId,
  });
  return true;
}

export function tryResolveWar(
  state: GameState,
  rng: RngStreams,
  warId?: string
): { ok: boolean; result?: BattleResult & { warId: string } } {
  const war = warId
    ? state.wars.find((w) => w.id === warId && w.status === "active")
    : state.wars.find((w) => w.status === "active");
  if (!war) return { ok: false };
  const result = resolveBattle(state, war, rng);
  state.inputLog.push({
    tick: state.meta.tick,
    type: "resolve_war",
    payload: { warId: war.id, ...result },
    issuerId: war.attackerRealmId,
  });
  return { ok: true, result: { ...result, warId: war.id } };
}

export function tryWhitePeace(state: GameState): boolean {
  const war = state.wars.find((w) => w.status === "active");
  if (!war) return false;
  war.status = "white_peace";
  state.flags[`peace_${war.attackerRealmId}_${war.defenderRealmId}`] = state.meta.tick + 300;
  state.inputLog.push({
    tick: state.meta.tick,
    type: "white_peace",
    payload: { warId: war.id },
    issuerId: "player",
  } satisfies InputRecord);
  return true;
}

export function peaceTicksRemaining(state: GameState, a = "player", b = "rival"): number {
  const lock = peaceLockedUntil(state, a, b);
  return Math.max(0, lock - state.meta.tick);
}
