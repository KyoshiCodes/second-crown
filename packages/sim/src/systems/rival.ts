import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { realmPower } from "./combat.js";

/**
 * Rival passive growth + opportunistic counter-declarations.
 */
export const RivalSystem = {
  nextEventTick(_state: GameState): number | null {
    return null;
  },

  advanceAnalytic(state: GameState, fromTick: number, toTick: number): void {
    const start = Math.floor(fromTick / 100) + 1;
    const end = Math.floor(toTick / 100);
    for (let step = start; step <= end; step++) {
      growRivalOnce(state);
      maybeRivalDeclares(state, step * 100);
    }
  },

  processEventsAt(_state: GameState, _tick: number): void {},

  tick(state: GameState): void {
    if (state.meta.tick > 0 && state.meta.tick % 100 === 0) {
      growRivalOnce(state);
      maybeRivalDeclares(state, state.meta.tick);
    }
  },
};

function growRivalOnce(state: GameState): void {
  const losses = state.wars.filter(
    (w) =>
      (w.defenderRealmId === "rival" && w.status === "attacker_won") ||
      (w.attackerRealmId === "rival" && w.status === "defender_won")
  ).length;
  const amount = 1 + Math.min(3, losses);

  const existing = state.units.find(
    (u) => u.realmId === "rival" && u.typeId === "militia" && u.armyId === null
  );
  if (existing) {
    existing.count = toDecimalString(D(existing.count).add(amount));
  } else {
    state.units.push({
      id: `u_rival_${state.meta.tick}`,
      typeId: "militia",
      realmId: "rival",
      count: toDecimalString(amount),
      armyId: null,
    });
  }
}

function peaceLocked(state: GameState): boolean {
  const k1 = state.flags["peace_player_rival"];
  const k2 = state.flags["peace_rival_player"];
  const t1 = typeof k1 === "number" ? k1 : 0;
  const t2 = typeof k2 === "number" ? k2 : 0;
  return state.meta.tick < Math.max(t1, t2);
}

/** If rival is stronger and at peace, they declare war on the player. */
function maybeRivalDeclares(state: GameState, atTick: number): void {
  if (peaceLocked(state)) return;
  if (state.wars.some((w) => w.status === "active")) return;

  const rivalP = realmPower(state, "rival");
  const playerP = realmPower(state, "player");
  if (rivalP < playerP + 5) return; // need a clear edge

  state.wars.push({
    id: `war_rival_${atTick}`,
    attackerRealmId: "rival",
    defenderRealmId: "player",
    startedTick: atTick,
    status: "active",
  });
  state.inputLog.push({
    tick: atTick,
    type: "declare_war",
    payload: { attackerRealmId: "rival", defenderRealmId: "player" },
    issuerId: "rival",
  });
  state.flags["rival_declared"] = atTick;
}
