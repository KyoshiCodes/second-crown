import type { GameState, InputRecord, War } from "@second-crown/shared";
import { resolveBattle } from "../systems/combat.js";
import type { RngStreams } from "../core/rng.js";

export interface DeclareWarPayload {
  attackerRealmId: string;
  defenderRealmId: string;
}

export function tryDeclareWar(state: GameState, payload: DeclareWarPayload): boolean {
  const { attackerRealmId, defenderRealmId } = payload;
  if (attackerRealmId === defenderRealmId) return false;
  if (!state.realms.some((r) => r.id === attackerRealmId)) return false;
  if (!state.realms.some((r) => r.id === defenderRealmId)) return false;
  if (state.wars.some((w) => w.status === "active" && (
    (w.attackerRealmId === attackerRealmId && w.defenderRealmId === defenderRealmId) ||
    (w.attackerRealmId === defenderRealmId && w.defenderRealmId === attackerRealmId)
  ))) return false;

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

/** Resolve the first active war involving the player (or a specific war id). */
export function tryResolveWar(
  state: GameState,
  rng: RngStreams,
  warId?: string
): { ok: boolean; result?: { winnerId: string; loserId: string; warId: string } } {
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
