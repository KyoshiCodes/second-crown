import type { GameState, Province } from "@second-crown/shared";
import { getUnitType } from "../content/units.js";
import type { RngStreams } from "../core/rng.js";
import { resolveRounds, type BattleEvent, type Stack } from "./resolver.js";
import { applyMarshalBonuses, marshalSkillName, playerMarshal } from "./marshal.js";
import { recordCrown } from "./ledger.js";
import { writeLastBattle } from "./lastBattle.js";
import { detachGarrison, garrisonAt, mergeGarrisonForce } from "./garrison.js";
import { returnForce } from "./column.js";
import { campThreat } from "./camp.js";
import { plantOutpost } from "./outpost.js";

export interface ColumnSide {
  id?: string;
  toId?: string;
  realmId: string;
  levy: number;
  force?: Record<string, number>;
}

export function stacksFromForce(realmId: string, force?: Record<string, number>, levy = 0): Stack[] {
  const src = force && Object.keys(force).length > 0 ? force : levy > 0 ? { militia: levy } : {};
  const out: Stack[] = [];
  for (const [typeId, raw] of Object.entries(src)) {
    const def = getUnitType(typeId);
    const count = Math.max(0, Math.floor(Number(raw) || 0));
    if (!def || count <= 0) continue;
    out.push({
      realmId,
      typeId,
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

export function forceFromStacks(stacks: Stack[]): Record<string, number> {
  const force: Record<string, number> = {};
  for (const s of stacks) {
    if (s.count > 0) force[s.typeId] = (force[s.typeId] ?? 0) + s.count;
  }
  return force;
}

export function resolveColumnClash(
  state: GameState,
  attacker: ColumnSide,
  defender: ColumnSide,
  rng: RngStreams
): {
  attackerWins: boolean;
  events: BattleEvent[];
  attackerForce: Record<string, number>;
  defenderForce: Record<string, number>;
} {
  const atk = stacksFromForce(attacker.realmId, attacker.force, attacker.levy);
  const def = stacksFromForce(defender.realmId, defender.force, defender.levy);
  const marshal = playerMarshal(state);
  if (attacker.realmId === "player") applyMarshalBonuses(atk, marshal);
  if (defender.realmId === "player") applyMarshalBonuses(def, marshal);
  const fought = resolveRounds(atk, def, rng);
  const attackerForce = forceFromStacks(atk);
  const defenderForce = forceFromStacks(def);
  attacker.force = attackerForce;
  attacker.levy = Object.values(attackerForce).reduce((n, v) => n + v, 0);
  defender.force = defenderForce;
  defender.levy = Object.values(defenderForce).reduce((n, v) => n + v, 0);

  const skill =
    marshal && (attacker.realmId === "player" || defender.realmId === "player")
      ? marshalSkillName(marshal.marshalTree)
      : "None";
  recordCrown(
    state,
    "battle",
    fought.attackerWins
      ? `Field clash: ${attacker.realmId} broke ${defender.realmId}.`
      : `Field clash: ${defender.realmId} held against ${attacker.realmId}.`
  );
  writeLastBattle(state, {
    winnerId: fought.attackerWins ? attacker.realmId : defender.realmId,
    loserId: fought.attackerWins ? defender.realmId : attacker.realmId,
    events: [
      skill !== "None"
        ? { round: 0, kind: "open" as const, text: `${skill} is on the field.` }
        : { round: 0, kind: "open" as const, text: "Columns meet." },
      ...fought.events,
    ],
    phases: [{ title: "Field", text: "Two columns met on the same tile." }],
  });

  return {
    attackerWins: fought.attackerWins,
    events: fought.events,
    attackerForce,
    defenderForce,
  };
}

export function pairClashingMarches<T extends ColumnSide>(
  state: GameState,
  due: T[],
  rng: RngStreams
): T[] {
  const remaining: T[] = [];
  const used = new Set<string>();
  for (const a of due) {
    const aid = a.id ?? `${a.realmId}-${a.toId}`;
    if (used.has(aid)) continue;
    const foe = due.find((b) => {
      const bid = b.id ?? `${b.realmId}-${b.toId}`;
      return bid !== aid && !used.has(bid) && b.toId === a.toId && b.realmId !== a.realmId;
    });
    if (foe) {
      const bid = foe.id ?? `${foe.realmId}-${foe.toId}`;
      used.add(aid);
      used.add(bid);
      const result = resolveColumnClash(state, a, foe, rng);
      const winner = result.attackerWins ? a : foe;
      const loser = result.attackerWins ? foe : a;
      if (loser.realmId === "player" && loser.force) returnForce(state, loser.force, 0.4);
      if ((winner.levy ?? 0) > 0) remaining.push(winner);
      continue;
    }
    remaining.push(a);
  }
  return remaining;
}

export function resolveOutpostAssault(
  state: GameState,
  attacker: ColumnSide,
  provinceId: string,
  rng: RngStreams
): "fallen" | "holds" {
  const posted = garrisonAt(state, provinceId);
  const defForce = { ...(posted?.force ?? {}) };
  const defender: ColumnSide = {
    realmId: "player",
    levy: Object.values(defForce).reduce((n, v) => n + v, 0),
    force: defForce,
  };
  const result = resolveColumnClash(state, attacker, defender, rng);
  detachGarrison(state, provinceId);
  if (result.attackerWins) {
    if (defender.force) returnForce(state, defender.force, 0.4);
    return "fallen";
  }
  if (defender.force && Object.values(defender.force).some((n) => n > 0)) {
    mergeGarrisonForce(state, provinceId, defender.force);
  }
  return "holds";
}

export function resolveCampRaid(
  state: GameState,
  attacker: ColumnSide,
  dest: Province,
  rng: RngStreams
): "win" | "lose" {
  const threat = Math.max(1, campThreat(state, dest));
  const heads = Math.max(2, Math.min(3, threat - 2));
  const incoming = attacker.levy ?? 0;
  const defender: ColumnSide = {
    realmId: "camp",
    levy: heads,
    force: { militia: heads },
  };
  const result = resolveColumnClash(state, attacker, defender, rng);
  if (incoming >= 5) return "win";
  if (!result.attackerWins && attacker.realmId === "player" && attacker.force) {
    returnForce(state, attacker.force, 0.4);
  }
  return result.attackerWins ? "win" : "lose";
}

export function resolveHoldStorm(
  state: GameState,
  attacker: ColumnSide,
  dest: Province,
  rng: RngStreams
): "stormed" | "stands" {
  const owner = dest.occupantRealmId;
  if (!owner || owner === attacker.realmId) return "stands";
  const posted = garrisonAt(state, dest.id);
  const guard =
    posted?.force && Object.values(posted.force).some((n) => n > 0)
      ? { ...posted.force }
      : { militia: dest.node === "hold" ? 8 : 4 };
  const defender: ColumnSide = {
    realmId: owner,
    levy: Object.values(guard).reduce((n, v) => n + v, 0),
    force: guard,
  };
  const result = resolveColumnClash(state, attacker, defender, rng);
  if (result.attackerWins) {
    if (posted) detachGarrison(state, dest.id);
    if (dest.node !== "hold") {
      dest.occupantRealmId = attacker.realmId;
      if (attacker.realmId === "player") plantOutpost(state, dest, "player");
    }
    if (attacker.realmId === "player" && attacker.force) returnForce(state, attacker.force, 1);
    return "stormed";
  }
  if (posted && defender.force && Object.values(defender.force).some((n) => n > 0)) {
    detachGarrison(state, dest.id);
    mergeGarrisonForce(state, dest.id, defender.force);
  }
  if (attacker.realmId === "player" && attacker.force) returnForce(state, attacker.force, 0.4);
  return "stands";
}
