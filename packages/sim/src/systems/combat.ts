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

/**
 * Deterministic battle resolution.
 * Winner is higher effective power after a small RNG swing (±15%).
 * Loser loses ~40–60% of units; winner loses ~10–20%.
 */
export function resolveBattle(
  state: GameState,
  war: War,
  rng: RngStreams
): { winnerId: string; loserId: string } {
  const atk = realmPower(state, war.attackerRealmId);
  const def = realmPower(state, war.defenderRealmId);

  const atkSwing = 0.85 + rng.battle() * 0.3; // 0.85–1.15
  const defSwing = 0.85 + rng.battle() * 0.3;
  const atkEff = atk * atkSwing;
  const defEff = def * defSwing;

  const attackerWins = atkEff >= defEff;
  const winnerId = attackerWins ? war.attackerRealmId : war.defenderRealmId;
  const loserId = attackerWins ? war.defenderRealmId : war.attackerRealmId;

  applyCasualties(state, winnerId, 0.1 + rng.battle() * 0.1); // 10–20%
  applyCasualties(state, loserId, 0.4 + rng.battle() * 0.2); // 40–60%

  war.status = attackerWins ? "attacker_won" : "defender_won";
  return { winnerId, loserId };
}

function applyCasualties(state: GameState, realmId: string, fraction: number): void {
  for (const u of state.units) {
    if (u.realmId !== realmId) continue;
    const count = D(u.count);
    const lost = count.mul(fraction).floor();
    const remaining = count.sub(lost);
    u.count = toDecimalString(remaining.lt(0) ? 0 : remaining);
  }
  // Drop zero stacks
  state.units = state.units.filter((u) => D(u.count).gt(0));
}
