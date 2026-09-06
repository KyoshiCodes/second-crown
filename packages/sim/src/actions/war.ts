import type { GameState, InputRecord, War } from "@second-crown/shared";
import { resolveBattle, type BattleResult } from "../systems/combat.js";
import type { RngStreams } from "../core/rng.js";

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

  if (
    state.wars.some(
      (w) =>
        w.status === "active" &&
        ((w.attackerRealmId === attackerRealmId && w.defenderRealmId === defenderRealmId) ||
          (w.attackerRealmId === defenderRealmId && w.defenderRealmId === attackerRealmId))
    )
  ) {
    return false;
  }

  const lock = peaceLockedUntil(state, attackerRealmId, defenderRealmId);
  if (state.meta.tick < lock) return false;

  const war: War = {
    id: `war_${state.meta.tick}_${state.wars.length}`,
    attackerRealmId,
    defenderRealmId,
    startedTick: state.meta.tick,
    status: "active",
  };
  state.wars.push(war);

  const record: InputRecord = {
    tick: state.meta.tick,
    type: "declare_war",
    payload,
    issuerId: attackerRealmId,
  };
  state.inputLog.push(record);
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

  const record: InputRecord = {
    tick: state.meta.tick,
    type: "resolve_war",
    payload: { warId: war.id, ...result },
    issuerId: war.attackerRealmId,
  };
  state.inputLog.push(record);

  return { ok: true, result: { ...result, warId: war.id } };
}

/** Ticks remaining before war can be declared again between player and rival. */
export function peaceTicksRemaining(state: GameState): number {
  const lock = peaceLockedUntil(state, "player", "rival");
  return Math.max(0, lock - state.meta.tick);
}
