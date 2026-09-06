import type { GameState, War } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getUnitType } from "../content/units.js";
import type { RngStreams } from "../core/rng.js";

/** Total combat power for a realm's units. */
export function realmPower(state: GameState, realmId: string): number {
  let power = 0;
  for (const u of state.units) {
    if (u.realmId !== realmId) continue;
    const def = getUnitType(u.typeId);
    if (!def) continue;
    power += def.power * D(u.count).toNumber();
  }
  return power;
}

export interface BattleResult {
  winnerId: string;
  loserId: string;
  loot: Record<string, string>;
}

/**
 * Deterministic battle resolution.
 * Winner gets higher effective power after ±15% RNG swing.
 * Loser loses ~40–60% units; winner ~10–20%.
 * Winner loots 15–25% of loser's resources (player or rival).
 */
export function resolveBattle(
  state: GameState,
  war: War,
  rng: RngStreams
): BattleResult {
  const atk = realmPower(state, war.attackerRealmId);
  const def = realmPower(state, war.defenderRealmId);

  const atkSwing = 0.85 + rng.battle() * 0.3;
  const defSwing = 0.85 + rng.battle() * 0.3;
  const attackerWins = atk * atkSwing >= def * defSwing;

  const winnerId = attackerWins ? war.attackerRealmId : war.defenderRealmId;
  const loserId = attackerWins ? war.defenderRealmId : war.attackerRealmId;

  applyCasualties(state, winnerId, 0.1 + rng.battle() * 0.1);
  applyCasualties(state, loserId, 0.4 + rng.battle() * 0.2);

  const lootFrac = 0.15 + rng.battle() * 0.1;
  const loot = plunder(state, winnerId, loserId, lootFrac);

  war.status = attackerWins ? "attacker_won" : "defender_won";

  // Peace lockout: 500 ticks (~50s) before another war between these realms
  state.flags[`peace_${war.attackerRealmId}_${war.defenderRealmId}`] =
    state.meta.tick + 500;

  // Opinion swing
  adjustOpinion(state, winnerId, loserId, -15);
  adjustOpinion(state, loserId, winnerId, -25);

  return { winnerId, loserId, loot };
}

function applyCasualties(state: GameState, realmId: string, fraction: number): void {
  for (const u of state.units) {
    if (u.realmId !== realmId) continue;
    const count = D(u.count);
    const lost = count.mul(fraction).floor();
    const remaining = count.sub(lost);
    u.count = toDecimalString(remaining.lt(0) ? 0 : remaining);
  }
  state.units = state.units.filter((u) => D(u.count).gt(0));
}

function plunder(
  state: GameState,
  winnerId: string,
  loserId: string,
  fraction: number
): Record<string, string> {
  const loot: Record<string, string> = {};
  // Only the player has tracked resources in this phase; rival is treated as a purse
  if (loserId === "player") {
    for (const res of ["gold", "food", "wood", "stone"]) {
      const have = D(state.resources[res] ?? "0");
      const taken = have.mul(fraction).floor();
      if (taken.gt(0)) {
        state.resources[res] = toDecimalString(have.sub(taken));
        loot[res] = toDecimalString(taken);
      }
    }
  } else if (winnerId === "player") {
    // Loot from rival: grant a purse based on rival "wealth" proxy (power * 2)
    const purse = Math.max(10, Math.floor(realmPower(state, loserId) * 2 + 50));
    for (const res of ["gold", "food", "wood", "stone"]) {
      const taken = D(Math.floor(purse * fraction * (res === "gold" ? 0.5 : 1)));
      if (taken.gt(0)) {
        state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").add(taken));
        loot[res] = toDecimalString(taken);
      }
    }
  }
  return loot;
}

function adjustOpinion(
  state: GameState,
  fromRealmId: string,
  toRealmId: string,
  delta: number
): void {
  const fromChar = state.characters.find((c) => c.realmId === fromRealmId && c.role === "ruler");
  const toChar = state.characters.find((c) => c.realmId === toRealmId && c.role === "ruler");
  if (!fromChar || !toChar) return;
  let edge = state.opinions.find((o) => o.from === fromChar.id && o.to === toChar.id);
  if (!edge) {
    edge = { from: fromChar.id, to: toChar.id, value: 0, expiresTick: null };
    state.opinions.push(edge);
  }
  edge.value = Math.max(-100, Math.min(100, edge.value + delta));
}
