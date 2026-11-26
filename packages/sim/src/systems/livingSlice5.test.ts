import { describe, it, expect } from "vitest";
import type { GameState, WarInstance } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { serializeState } from "../save/serialize.js";
import { ensureBoard } from "./board.js";
import { getWorldLog } from "./events.js";
import { activeWarFor, tryDeclareWar, tryWhitePeace } from "../actions/war.js";
import {
  LIVING_SWITCH_FLAGS,
  getNpcWarLosses,
  isNpcWar,
  joinSide,
  joinableWars,
  livingSwitches,
  setLivingSwitch,
  settleNpcWars,
  warFightOpen,
  warImagerySnapshot,
  warPhase,
} from "./livingRealm.js";
import { WAR_AFTERMATH_TICKS, WAR_PHASE_START } from "../content/livingRealm.js";

const SEED = 20261126;
const T0 = 20000;
const SKIRMISH = WAR_PHASE_START.skirmish;
const CLASH = WAR_PHASE_START.clash;

function fresh(): GameState {
  const s = createGameState({ seed: SEED, now: 1 });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  for (const k of Object.keys(s.flags)) if (k.startsWith("peace_")) delete s.flags[k];
  return s;
}

function npcPair(s: GameState): [string, string] {
  const ids = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
  expect(ids.length).toBeGreaterThanOrEqual(2);
  return [ids[0], ids[1]];
}

function setUnits(s: GameState, realmId: string, stacks: Record<string, number>): void {
  s.units = s.units.filter((u) => u.realmId !== realmId);
  for (const [typeId, n] of Object.entries(stacks)) {
    s.units.push({ id: `u_${realmId}_${typeId}`, typeId, realmId, count: String(n), armyId: null });
  }
}

function unitsOf(s: GameState, realmId: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const u of s.units) if (u.realmId === realmId) out[u.typeId] = Number(u.count);
  return out;
}

function npcWar(a: string, d: string, startedTick: number): WarInstance {
  return { id: `war_npc_${a}_${d}_${startedTick}`, attackerRealmId: a, defenderRealmId: d, startedTick, status: "active" };
}

/** Fresh state with one NPC war declared at T0 between the first two NPC realms. */
function withNpcWar(): { s: GameState; a: string; d: string; war: WarInstance } {
  const s = fresh();
  const [a, d] = npcPair(s);
  const war = npcWar(a, d, T0);
  s.wars.push(war);
  return { s, a, d, war };
}

// ---------------------------------------------------------------- switch

describe("join NPC war: switch", () => {
  it("has living_join_npc_war, on by default", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.joinNpcWar).toBe("living_join_npc_war");
    expect(livingSwitches(s).joinNpcWar).toBe(true);
  });

  it("off hides the action: no joinable wars, joinSide refuses", () => {
    const { s, war } = withNpcWar();
    setLivingSwitch(s, "joinNpcWar", false);
    expect(s.flags.living_join_npc_war).toBe(false);
    expect(joinableWars(s)).toEqual([]);
    expect(joinSide(s, war.id, "attacker")).toBeNull();
    expect(s.wars).toHaveLength(1);
  });
});

// ---------------------------------------------------------------- joinable list

describe("join NPC war: joinableWars", () => {
  it("lists an active NPC war with both sides, names and phase", () => {
    const { s, a, d, war } = withNpcWar();
    const list = joinableWars(s);
    expect(list).toHaveLength(1);
    const j = list[0];
    expect(j.warId).toBe(war.id);
    expect(j.attackerRealmId).toBe(a);
    expect(j.defenderRealmId).toBe(d);
    expect(j.attackerName).toBe(s.realms.find((r) => r.id === a)!.name);
    expect(j.defenderName).toBe(s.realms.find((r) => r.id === d)!.name);
    expect(j.phase).toBe("columns");
    expect(j.startedTick).toBe(T0);
    expect(j.sides).toEqual({ attacker: true, defender: true });
    s.meta.tick = T0 + SKIRMISH;
    expect(joinableWars(s)[0].phase).toBe("skirmish");
  });

  it("skips ended wars and player wars", () => {
    const { s, a, war } = withNpcWar();
    war.status = "white_peace";
    war.endedTick = T0;
    s.wars.push({ id: "war_p", attackerRealmId: a, defenderRealmId: "player", startedTick: T0, status: "white_peace", endedTick: T0 });
    expect(joinableWars(s)).toEqual([]);
  });

  it("is empty while the player is at war", () => {
    const { s, a } = withNpcWar();
    const [, , third] = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
    expect(tryDeclareWar(s, { attackerRealmId: "player", defenderRealmId: third ?? a })).toBe(true);
    expect(joinableWars(s)).toEqual([]);
  });

  it("closes a side when the player is peace-locked with the realm they would fight", () => {
    const { s, d, war } = withNpcWar();
    s.flags[`peace_player_${d}`] = T0 + 500;
    expect(joinableWars(s)[0].sides).toEqual({ attacker: false, defender: true });
    expect(joinSide(s, war.id, "attacker")).toBeNull();
    expect(joinSide(s, war.id, "defender")).not.toBeNull();
  });

  it("drops a war when both sides are peace-locked", () => {
    const { s, a, d } = withNpcWar();
    s.flags[`peace_player_${d}`] = T0 + 500;
    s.flags[`peace_${a}_player`] = T0 + 500;
    expect(joinableWars(s)).toEqual([]);
  });
});

// ---------------------------------------------------------------- join

describe("join NPC war: joinSide", () => {
  it("joining the attacker opens a player war on the defender, sharing the phase clock", () => {
    const { s, a, d, war } = withNpcWar();
    s.meta.tick = T0 + SKIRMISH;
    const pw = joinSide(s, war.id, "attacker");
    expect(pw).not.toBeNull();
    expect(pw!.attackerRealmId).toBe("player");
    expect(pw!.defenderRealmId).toBe(d);
    expect(pw!.allyRealmId).toBe(a);
    expect(pw!.joinedWarId).toBe(war.id);
    expect(pw!.startedTick).toBe(T0);
    expect(pw!.status).toBe("active");
    expect(isNpcWar(pw!)).toBe(false);
    expect(activeWarFor(s)).toBe(pw);
    expect(warPhase(s, pw!)?.id).toBe(warPhase(s, war)?.id);
    expect(warPhase(s, pw!)?.id).toBe("skirmish");
    expect(s.inputLog.at(-1)).toMatchObject({ type: "join_npc_war", payload: { warId: war.id, side: "attacker" }, issuerId: "player" });
    expect(s.flags.living_npc_wars_joined).toBe(1);
    expect(getWorldLog(s).at(-1)?.text).toContain("rides beside");
    // The NPC war itself is untouched.
    expect(war.status).toBe("active");
    expect(war.attackerRealmId).toBe(a);
    expect(war.defenderRealmId).toBe(d);
  });

  it("joining the defender opens a player war on the attacker", () => {
    const { s, a, d, war } = withNpcWar();
    const pw = joinSide(s, war.id, "defender")!;
    expect(pw.defenderRealmId).toBe(a);
    expect(pw.allyRealmId).toBe(d);
  });

  it("existing rules apply: Fight locked until the clash, White Peace any time", () => {
    const { s, war } = withNpcWar();
    const pw = joinSide(s, war.id, "attacker")!;
    expect(warFightOpen(s, pw)).toBe(false);
    s.meta.tick = T0 + SKIRMISH;
    expect(warFightOpen(s, pw)).toBe(false);
    s.meta.tick = T0 + CLASH;
    expect(warFightOpen(s, pw)).toBe(true);
    expect(tryWhitePeace(s)).toBe(true);
    expect(pw.status).toBe("white_peace");
  });

  it("refuses when the player is already at war", () => {
    const { s, war } = withNpcWar();
    const first = joinSide(s, war.id, "attacker");
    expect(first).not.toBeNull();
    const n = s.wars.length;
    expect(joinSide(s, war.id, "defender")).toBeNull();
    expect(s.wars).toHaveLength(n);
  });

  it("refuses an ended war", () => {
    const { s, war } = withNpcWar();
    s.meta.tick = T0 + CLASH;
    settleNpcWars(s, s.meta.tick);
    expect(war.status).not.toBe("active");
    expect(joinSide(s, war.id, "attacker")).toBeNull();
    expect(joinSide(s, war.id, "defender")).toBeNull();
    expect(activeWarFor(s)).toBeUndefined();
  });

  it("refuses an unknown war, a player war, and an unknown side", () => {
    const { s, a, war } = withNpcWar();
    expect(joinSide(s, "nope", "attacker")).toBeNull();
    s.wars.push({ id: "war_rival", attackerRealmId: a, defenderRealmId: "player", startedTick: T0, status: "white_peace", endedTick: T0 });
    expect(joinSide(s, "war_rival", "attacker")).toBeNull();
    expect(joinSide(s, war.id, "middle" as never)).toBeNull();
    expect(activeWarFor(s)).toBeUndefined();
  });

  it("is deterministic: same state, same join, same save", () => {
    const run = () => {
      const { s, war } = withNpcWar();
      s.meta.tick = T0 + SKIRMISH;
      joinSide(s, war.id, "defender");
      s.meta.tick = T0 + CLASH;
      settleNpcWars(s, s.meta.tick);
      return serializeState(s);
    };
    expect(run()).toBe(run());
  });
});

// ---------------------------------------------------------------- NPC losses skip the player

describe("join NPC war: player wars skip NPC losses", () => {
  it("the NPC war settles and takes its losses; the player's war and units are untouched", () => {
    const { s, a, d, war } = withNpcWar();
    setUnits(s, a, { militia: 50 });
    setUnits(s, d, { militia: 50 });
    setUnits(s, "player", { militia: 50 });
    const pw = joinSide(s, war.id, "attacker")!;
    s.meta.tick = T0 + CLASH;
    const settled = settleNpcWars(s, s.meta.tick);
    expect(settled).toEqual([war]);
    expect(war.status).not.toBe("active");
    expect(pw.status).toBe("active");
    expect(unitsOf(s, "player")).toEqual({ militia: 50 });
    const losses = getNpcWarLosses(s);
    expect(losses.map((l) => l.warId)).toEqual([war.id]);
    expect(losses.some((l) => l.warId === pw.id)).toBe(false);
    // Equal power: white peace, both NPC sides lose their share.
    expect(unitsOf(s, a).militia).toBeLessThan(50);
    expect(unitsOf(s, d).militia).toBeLessThan(50);
  });

  it("settleNpcWars never settles the joined player war, even long after the clash", () => {
    const { s, war } = withNpcWar();
    const pw = joinSide(s, war.id, "defender")!;
    s.meta.tick = T0 + CLASH * 10;
    settleNpcWars(s, s.meta.tick);
    settleNpcWars(s, s.meta.tick + 100);
    expect(pw.status).toBe("active");
    expect(getNpcWarLosses(s).some((l) => l.warId === pw.id)).toBe(false);
  });
});

// ---------------------------------------------------------------- war imagery

describe("war imagery snapshot", () => {
  it("shows each active war's sides, phase and banner through the phases", () => {
    const { s, a, d, war } = withNpcWar();
    const an = s.realms.find((r) => r.id === a)!.name;
    const dn = s.realms.find((r) => r.id === d)!.name;
    let snap = warImagerySnapshot(s);
    expect(snap).toHaveLength(1);
    expect(snap[0]).toEqual({
      warId: war.id,
      attackerRealmId: a,
      attackerName: an,
      defenderRealmId: d,
      defenderName: dn,
      phase: "columns",
      active: true,
      player: false,
      allyRealmId: null,
      banner: `${an} musters against ${dn}`,
    });
    s.meta.tick = T0 + SKIRMISH;
    snap = warImagerySnapshot(s);
    expect(snap[0].phase).toBe("skirmish");
    expect(snap[0].banner).toBe(`${an} skirmishes with ${dn}`);
    s.meta.tick = T0 + CLASH;
    snap = warImagerySnapshot(s);
    expect(snap[0].phase).toBe("clash");
    expect(snap[0].banner).toBe(`${an} clashes with ${dn}`);
  });

  it("shows the falling-back banner during the aftermath, then drops the war", () => {
    const { s, a, d, war } = withNpcWar();
    const an = s.realms.find((r) => r.id === a)!.name;
    const dn = s.realms.find((r) => r.id === d)!.name;
    war.status = "attacker_won";
    war.endedTick = T0 + CLASH;
    s.meta.tick = T0 + CLASH;
    let snap = warImagerySnapshot(s);
    expect(snap[0]).toMatchObject({ phase: "aftermath", active: false, banner: `${dn} falls back from ${an}` });
    war.status = "defender_won";
    expect(warImagerySnapshot(s)[0].banner).toBe(`${an} falls back from ${dn}`);
    war.status = "white_peace";
    expect(warImagerySnapshot(s)[0].banner).toBe(`${an} and ${dn} fall back`);
    s.meta.tick = T0 + CLASH + WAR_AFTERMATH_TICKS;
    snap = warImagerySnapshot(s);
    expect(snap).toEqual([]);
  });

  it("marks the player's joined war and names the ally in its banner", () => {
    const { s, a, d, war } = withNpcWar();
    const an = s.realms.find((r) => r.id === a)!.name;
    const dn = s.realms.find((r) => r.id === d)!.name;
    const pn = s.realms.find((r) => r.id === "player")!.name;
    const pw = joinSide(s, war.id, "attacker")!;
    const snap = warImagerySnapshot(s);
    expect(snap.map((e) => e.warId)).toEqual([war.id, pw.id]);
    const mine = snap[1];
    expect(mine.player).toBe(true);
    expect(mine.allyRealmId).toBe(a);
    expect(mine.phase).toBe("columns");
    expect(mine.banner).toBe(`${pn} and ${an} muster against ${dn}`);
  });

  it("leaves out sieges", () => {
    const { s, a } = withNpcWar();
    s.wars.push({ id: `w_siege_${T0}`, attackerRealmId: a, defenderRealmId: "player", startedTick: T0, status: "active" });
    expect(warImagerySnapshot(s).some((e) => e.warId.startsWith("w_siege_"))).toBe(false);
  });

  it("is read-only", () => {
    const { s, war } = withNpcWar();
    joinSide(s, war.id, "defender");
    s.meta.tick = T0 + SKIRMISH;
    const before = serializeState(s);
    warImagerySnapshot(s);
    joinableWars(s);
    expect(serializeState(s)).toBe(before);
  });
});
