import type { GameState, War } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getUnitType } from "../content/units.js";
import { countBuilding } from "../content/buildings.js";
import type { RngStreams } from "../core/rng.js";
import { grantVictorySpoils } from "./wave.js";
import { fortifyPower } from "./court.js";

export function realmPower(state: GameState, realmId: string): number {
  let power = 0;
  for (const u of state.units) {
    if (u.realmId !== realmId) continue;
    const def = getUnitType(u.typeId);
    if (!def) continue;
    power += def.power * D(u.count).toNumber();
  }
  if (realmId === "player") {
    power += countBuilding(state, "watchtower") * 2;
    power += countBuilding(state, "walls") * 4;
    power += fortifyPower(state);
  }
  return power;
}

export interface BattlePhase {
  title: string;
  text: string;
}

export interface BattleResult {
  winnerId: string;
  loserId: string;
  loot: Record<string, string>;
  phases: BattlePhase[];
  attackerPower: number;
  defenderPower: number;
  atkSwing: number;
  defSwing: number;
}

export function resolveBattle(state: GameState, war: War, rng: RngStreams): BattleResult {
  const atk = realmPower(state, war.attackerRealmId);
  const def = realmPower(state, war.defenderRealmId);

  const atkSwing = 0.85 + rng.battle() * 0.3;
  const defSwing = 0.85 + rng.battle() * 0.3;
  const attackerWins = atk * atkSwing >= def * defSwing;

  const winnerId = attackerWins ? war.attackerRealmId : war.defenderRealmId;
  const loserId = attackerWins ? war.defenderRealmId : war.attackerRealmId;

  const winFrac = 0.1 + rng.battle() * 0.1;
  const loseFrac = 0.4 + rng.battle() * 0.2;
  applyCasualties(state, winnerId, winFrac);
  applyCasualties(state, loserId, loseFrac);

  const lootFrac = 0.15 + rng.battle() * 0.1;
  const loot = plunder(state, winnerId, loserId, lootFrac);
  if (winnerId === "player") grantVictorySpoils(state);

  war.status = attackerWins ? "attacker_won" : "defender_won";

  state.flags[`peace_${war.attackerRealmId}_${war.defenderRealmId}`] = state.meta.tick + 500;

  adjustOpinion(state, winnerId, loserId, -15);
  adjustOpinion(state, loserId, winnerId, -25);

  const phases: BattlePhase[] = [
    { title: "Muster", text: `Attacker ${atk} power vs defender ${def} power.` },
    { title: "Clash", text: `Fortune multiplies the attack ${atkSwing.toFixed(2)} and the defense ${defSwing.toFixed(2)}.` },
    { title: "Melee", text: attackerWins ? "The attacker's line holds and pushes." : "The defender's line holds and pushes." },
    { title: "Butcher's bill", text: `Winner loses ${Math.round(winFrac * 100)}% of the host. Loser loses ${Math.round(loseFrac * 100)}%.` },
    {
      title: "Spoil",
      text:
        Object.keys(loot).length === 0
          ? "Little was taken from the field."
          : `Loot: ${Object.entries(loot).map(([k, v]) => `${v} ${k}`).join(", ")}.`,
    },
  ];

  return { winnerId, loserId, loot, phases, attackerPower: atk, defenderPower: def, atkSwing, defSwing };
}

function applyCasualties(state: GameState, realmId: string, fraction: number): void {
  for (const u of state.units) {
    if (u.realmId !== realmId) continue;
    const count = D(u.count);
    const lost = count.mul(fraction).floor();
    u.count = toDecimalString(count.sub(lost).lt(0) ? 0 : count.sub(lost));
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
