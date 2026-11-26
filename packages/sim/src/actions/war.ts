import type { GameState, InputRecord, War } from "@second-crown/shared";
import { realmPower, resolveBattle, type BattleResult } from "../systems/combat.js";
import type { RngStreams } from "../core/rng.js";
import { noteWar } from "../systems/wave.js";
import { fortifyTicksLeft } from "../systems/court.js";
import { DECREES, decreeUntil } from "../systems/decree.js";

export interface DeclareWarPayload {
  attackerRealmId: string;
  defenderRealmId: string;
}

/** True when `realmId` is the attacker or defender of `war`. */
export function warInvolves(war: War, realmId: string): boolean {
  return war.attackerRealmId === realmId || war.defenderRealmId === realmId;
}

/**
 * The active war `realmId` is fighting, if any. NPC realms also war each other
 * (systems/rival.ts), so "the first active war" is not the player's war.
 */
export function activeWarFor(state: GameState, realmId = "player"): War | undefined {
  return state.wars.find((w) => w.status === "active" && warInvolves(w, realmId));
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
  // The declaring side must not already be at war, and the player is never in two wars.
  // Wars between two other realms do not block (they used to, forever: NPC wars never end).
  if (activeWarFor(state, attackerRealmId)) return false;
  if (defenderRealmId === "player" && activeWarFor(state, "player")) return false;
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
  // A player action: only a war the player is in. Never another realm's war.
  const war = warId
    ? state.wars.find((w) => w.id === warId && w.status === "active" && warInvolves(w, "player"))
    : activeWarFor(state, "player");
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
  const war = activeWarFor(state, "player");
  if (!war) return false;
  war.status = "white_peace";
  war.endedTick = state.meta.tick;
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

export interface WarSummary {
  playerPower: number;
  activeWar: War | undefined;
  fortifyTicksLeft: number;
  decrees: { id: string; name: string; ticksLeft: number }[];
}

/** Read-only rollup for the War tab: power, active war, fortify, decree status. No formula changes. */
export function warSummary(state: GameState): WarSummary {
  return {
    playerPower: realmPower(state, "player"),
    activeWar: activeWarFor(state, "player"),
    fortifyTicksLeft: fortifyTicksLeft(state),
    decrees: DECREES.map((d) => ({ id: d.id, name: d.name, ticksLeft: decreeUntil(state, d.id) })),
  };
}
