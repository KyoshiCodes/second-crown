import type { GameState } from "@second-crown/shared";
import { D } from "../core/decimal.js";
import { getUnitType, type UnitRole } from "../content/units.js";
import { matchupModifier } from "../content/matchup.js";
import type { RngStreams } from "../core/rng.js";

export interface BattleEvent {
  round: number;
  kind: "open" | "hit" | "break" | "end";
  text: string;
}

export interface Stack {
  realmId: string;
  typeId: string;
  count: number;
  hp: number;
  morale: number;
  role: UnitRole;
  attack: number;
  defense: number;
  hpEach: number;
}

const BREAK_AT = 30;
const MAX_ROUNDS = 12;

export function stacksFor(state: GameState, realmId: string): Stack[] {
  const out: Stack[] = [];
  for (const u of state.units) {
    if (u.realmId !== realmId) continue;
    const def = getUnitType(u.typeId);
    if (!def) continue;
    const count = Math.max(0, Math.floor(D(u.count).toNumber()));
    if (count <= 0) continue;
    out.push({
      realmId,
      typeId: u.typeId,
      count,
      hp: count * def.hp,
      morale: 100,
      role: def.role,
      attack: def.attack,
      defense: def.defense,
      hpEach: def.hp,
    });
  }
  return out;
}

function living(side: Stack[]): Stack[] {
  return side.filter((s) => s.count > 0 && s.hp > 0 && s.morale >= BREAK_AT);
}

function armyMorale(side: Stack[]): number {
  const live = living(side);
  if (live.length === 0) return 0;
  const w = live.reduce((a, s) => a + s.morale * s.count, 0);
  const n = live.reduce((a, s) => a + s.count, 0);
  return n <= 0 ? 0 : w / n;
}

function pickTarget(attacker: Stack, foes: Stack[], roll: number): Stack {
  const live = living(foes);
  const preferred = live.filter((f) => matchupModifier(attacker.role, f.role) > 1);
  const pool = preferred.length > 0 ? preferred : live;
  return pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))] ?? live[0];
}

/** `wallSoak`: damage the defender's walls absorb before blows reach the defending stacks. */
export function resolveRounds(
  atk: Stack[],
  def: Stack[],
  rng: RngStreams,
  wallSoak = 0
): { attackerWins: boolean; events: BattleEvent[]; rounds: number } {
  const events: BattleEvent[] = [{ round: 0, kind: "open", text: "Lines close." }];
  if (living(atk).length === 0 && living(def).length === 0) {
    events.push({ round: 0, kind: "end", text: "No hosts on the field." });
    return { attackerWins: false, events, rounds: 0 };
  }
  if (living(atk).length === 0) {
    events.push({ round: 0, kind: "end", text: "The attacker has no host." });
    return { attackerWins: false, events, rounds: 0 };
  }
  if (living(def).length === 0) {
    events.push({ round: 0, kind: "end", text: "The defender has no host." });
    return { attackerWins: true, events, rounds: 0 };
  }

  let wall = Math.max(0, wallSoak);
  let rounds = 0;
  for (let r = 1; r <= MAX_ROUNDS; r++) {
    rounds = r;
    const order = [...living(atk), ...living(def)].sort((a, b) => b.attack + b.hpEach - (a.attack + a.hpEach));
    for (const s of order) {
      if (s.count <= 0 || s.hp <= 0) continue;
      const foes = s.realmId === atk[0]?.realmId ? def : atk;
      const liveFoes = living(foes);
      if (liveFoes.length === 0) break;
      const target = pickTarget(s, foes, rng.battle());
      if (!target) continue;
      const swing = 0.95 + rng.battle() * 0.1;
      const match = matchupModifier(s.role, target.role);
      const raw = s.attack * s.count * match * swing;
      const soak = Math.max(1, target.defense * Math.max(1, target.count) * 0.35);
      let dmg = Math.max(1, raw / soak) * 4;
      if (wall > 0 && foes === def) {
        const taken = Math.min(wall, dmg);
        wall -= taken;
        dmg -= taken;
        if (wall <= 0) events.push({ round: r, kind: "hit", text: "The walls give way." });
        if (dmg <= 0) continue;
      }
      const before = target.count;
      target.hp = Math.max(0, target.hp - dmg);
      target.count = target.hpEach > 0 ? Math.ceil(target.hp / target.hpEach) : 0;
      if (target.count < before) {
        const lost = before - target.count;
        target.morale = Math.max(0, target.morale - lost * 8);
        events.push({
          round: r,
          kind: "hit",
          text: `${s.typeId} hit ${target.typeId} (${lost} down).`,
        });
      }
    }
    const am = armyMorale(atk);
    const dm = armyMorale(def);
    if (dm < BREAK_AT || living(def).length === 0) {
      events.push({ round: r, kind: "break", text: "The defender's line breaks." });
      return { attackerWins: true, events, rounds };
    }
    if (am < BREAK_AT || living(atk).length === 0) {
      events.push({ round: r, kind: "break", text: "The attacker's line breaks." });
      return { attackerWins: false, events, rounds };
    }
  }
  const attackerWins = armyMorale(atk) >= armyMorale(def);
  events.push({
    round: rounds,
    kind: "end",
    text: attackerWins ? "The attacker holds the field." : "The defender holds the field.",
  });
  return { attackerWins, events, rounds };
}

export function writeStacks(state: GameState, stacks: Stack[]): void {
  for (const s of stacks) {
    const u = state.units.find((x) => x.realmId === s.realmId && x.typeId === s.typeId);
    if (u) u.count = String(Math.max(0, s.count));
  }
  state.units = state.units.filter((u) => D(u.count).gt(0));
}
