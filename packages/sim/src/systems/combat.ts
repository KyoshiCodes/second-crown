import type { GameState, War } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { getUnitType } from "../content/units.js";
import { countBuilding } from "../content/buildings.js";
import type { RngStreams } from "../core/rng.js";
import { grantVictorySpoils, flagNum } from "./wave.js";
import { fortifyPower } from "./court.js";
import { absorbBattleCasualties } from "./ward.js";
import { takePlunder } from "./vault.js";
import { masonryWallBonus } from "./research.js";
import { resolveRounds, stacksFor, writeStacks, type BattleEvent } from "./resolver.js";
import { applyMarshalBonuses, playerMarshal } from "./marshal.js";
import { recordCrown } from "./ledger.js";

export type { BattleEvent };

export function fortificationPower(state: GameState, realmId: string): number {
  if (realmId !== "player") return 0;
  return (
    countBuilding(state, "watchtower") * 2 +
    countBuilding(state, "walls") * 4 +
    countBuilding(state, "keep") * 8 +
    fortifyPower(state) +
    masonryWallBonus(state)
  );
}

export function defenseBonus(state: GameState, realmId: string): number {
  if (realmId !== "player") return 0;
  return countBuilding(state, "keep") * 8 + masonryWallBonus(state);
}

export function realmPower(state: GameState, realmId: string): number {
  let power = 0;
  for (const u of state.units) {
    if (u.realmId !== realmId) continue;
    const def = getUnitType(u.typeId);
    if (!def) continue;
    power += def.power * D(u.count).toNumber();
  }
  power += fortificationPower(state, realmId);
  if (realmId === "player") {
    power += flagNum(state, "craft_fort") * 3;
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
  events?: BattleEvent[];
}

function countRealm(state: GameState, realmId: string): number {
  return state.units
    .filter((u) => u.realmId === realmId)
    .reduce((n, u) => n + D(u.count).toNumber(), 0);
}

function realmName(state: GameState, id: string): string {
  return state.realms.find((r) => r.id === id)?.name ?? id;
}

export function resolveBattle(state: GameState, war: War, rng: RngStreams): BattleResult {
  const atk = realmPower(state, war.attackerRealmId);
  const def = realmPower(state, war.defenderRealmId) + defenseBonus(state, war.defenderRealmId);

  const beforePlayer = countRealm(state, "player");
  const atkStacks = stacksFor(state, war.attackerRealmId);
  const defStacks = stacksFor(state, war.defenderRealmId);
  const marshal = playerMarshal(state);
  if (war.attackerRealmId === "player") applyMarshalBonuses(atkStacks, marshal);
  if (war.defenderRealmId === "player") applyMarshalBonuses(defStacks, marshal);
  const fought = resolveRounds(atkStacks, defStacks, rng);
  writeStacks(state, [...atkStacks, ...defStacks]);

  const attackerWins = fought.attackerWins;
  const winnerId = attackerWins ? war.attackerRealmId : war.defenderRealmId;
  const loserId = attackerWins ? war.defenderRealmId : war.attackerRealmId;

  const lostPlayer = Math.max(0, beforePlayer - countRealm(state, "player"));
  if (lostPlayer > 0) {
    absorbBattleCasualties(state, lostPlayer, winnerId === "player" ? "winner" : "loser");
  }

  const lootFrac = 0.15 + rng.battle() * 0.1;
  const loot = plunder(state, winnerId, loserId, lootFrac);
  if (winnerId === "player") grantVictorySpoils(state);

  war.status = attackerWins ? "attacker_won" : "defender_won";
  war.endedTick = state.meta.tick;
  recordCrown(
    state,
    "battle",
    `${realmName(state, winnerId)} held the field against ${realmName(state, loserId)}.`
  );

  state.flags[`peace_${war.attackerRealmId}_${war.defenderRealmId}`] = state.meta.tick + 500;

  adjustOpinion(state, winnerId, loserId, -15);
  adjustOpinion(state, loserId, winnerId, -25);

  const phases: BattlePhase[] = [
    { title: "Muster", text: `Attacker ${atk} power vs defender ${def} power.` },
    { title: "Clash", text: fought.events[0]?.text ?? "Lines close." },
    {
      title: "Melee",
      text: attackerWins ? "The attacker's line holds and pushes." : "The defender's line holds and pushes.",
    },
    { title: "Butcher's bill", text: `${fought.rounds} rounds. Fallen go to beds first.` },
    {
      title: "Spoil",
      text:
        Object.keys(loot).length === 0
          ? "Little was taken from the field."
          : `Loot: ${Object.entries(loot).map(([k, v]) => `${v} ${k}`).join(", ")}.`,
    },
  ];

  return {
    winnerId,
    loserId,
    loot,
    phases,
    attackerPower: atk,
    defenderPower: def,
    atkSwing: 1,
    defSwing: 1,
    events: fought.events,
  };
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
      const want = have.mul(fraction).floor().toNumber();
      const taken = takePlunder(state, res, want);
      if (taken > 0) loot[res] = toDecimalString(taken);
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
