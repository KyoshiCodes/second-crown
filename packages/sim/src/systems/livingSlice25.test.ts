import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, livingSwitches, nameOf, setLivingSwitch } from "./livingRealm.js";
import { clashResultSnapshot, unitWaitingSnapshot } from "./livingStatus.js";
import { lastBattleStory, writeLastBattle, type ClashForceRecord } from "./lastBattle.js";
import { recordCrown } from "./ledger.js";
import { resolveBattle } from "./combat.js";
import { resolveColumnClash } from "./engagement.js";
import { getUnitType } from "../content/units.js";
import {
  BATTLE_NOTE_RECENT_TICKS,
  CLASH_FORCE_CAP,
  CLASH_NOTE_CLEAN,
  CLASH_NOTE_COSTLY,
  CLASH_OUTCOME_LOST,
  CLASH_OUTCOME_OTHERS,
  CLASH_OUTCOME_WON,
  UNIT_WAITING_CAP,
} from "../content/livingRealm.js";

const T0 = 20100;

function fresh(seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  s.flags.garrisons_json = "[]";
  delete s.flags.last_battle_json;
  s.flags.world_log = "[]";
  return s;
}

function npcIds(s: GameState): string[] {
  return s.realms.filter((r) => r.id !== "player").map((r) => r.id);
}

function f(side: "attacker" | "defender", realmId: string, strength: number, casualties: number): ClashForceRecord {
  return { side, realmId, strength, casualties };
}

function battle(s: GameState, winnerId: string, loserId: string, forces?: ClashForceRecord[], atTick = s.meta.tick) {
  const now = s.meta.tick;
  s.meta.tick = atTick;
  recordCrown(s, "battle", "test battle");
  writeLastBattle(s, { winnerId, loserId, events: [], phases: [], forces });
  s.meta.tick = now;
}

function march(id: string, realmId: string, toId: string, eta: number, extra: { levy?: number; force?: Record<string, number> } = {}) {
  return { id, realmId, fromId: "x", toId, arrivesTick: T0 + eta, kind: "node", levy: extra.levy ?? 0, force: extra.force };
}

const unitName = (id: string) => getUnitType(id)!.name;

describe("slice 25 switches", () => {
  it("are on by default and map to their flags", () => {
    expect(LIVING_SWITCH_FLAGS.clashResult).toBe("living_clash_result");
    expect(LIVING_SWITCH_FLAGS.unitWaiting).toBe("living_unit_waiting");
    const sw = livingSwitches(fresh());
    expect([sw.clashResult, sw.unitWaiting]).toEqual([true, true]);
  });

  it("false returns null, each independently", () => {
    const s = fresh();
    const [rival] = npcIds(s);
    battle(s, "player", rival, [f("attacker", "player", 10, 1), f("defender", rival, 8, 3)]);
    s.flags.garrisons_json = JSON.stringify([{ provinceId: "p1", force: { militia: 2 } }]);
    expect(clashResultSnapshot(s)).not.toBeNull();
    expect(unitWaitingSnapshot(s)).not.toBeNull();
    setLivingSwitch(s, "clashResult", false);
    expect(clashResultSnapshot(s)).toBeNull();
    expect(unitWaitingSnapshot(s)).not.toBeNull();
    setLivingSwitch(s, "unitWaiting", false);
    expect(unitWaitingSnapshot(s)).toBeNull();
  });
});

describe("clashResultSnapshot", () => {
  it("is null with no stored battle, or none recent", () => {
    const s = fresh();
    expect(clashResultSnapshot(s)).toBeNull();
    const [rival] = npcIds(s);
    battle(s, "player", rival, [], T0 - BATTLE_NOTE_RECENT_TICKS - 1);
    expect(clashResultSnapshot(s)).toBeNull();
    battle(s, "player", rival, [], T0 - BATTLE_NOTE_RECENT_TICKS);
    expect(clashResultSnapshot(s)).not.toBeNull();
  });

  it("shape: forces { side, name, strength, casualties }, outcome, note", () => {
    const s = fresh();
    const [rival] = npcIds(s);
    battle(s, "player", rival, [f("attacker", "player", 12, 2), f("defender", rival, 9, 5)]);
    expect(clashResultSnapshot(s)).toEqual({
      forces: [
        { side: "attacker", name: nameOf(s, "player"), strength: 12, casualties: 2 },
        { side: "defender", name: nameOf(s, rival), strength: 9, casualties: 5 },
      ],
      outcome: CLASH_OUTCOME_WON,
      note: null,
    });
  });

  it("outcome: won / lost / others; note only when the player fought", () => {
    const s = fresh();
    const [a, b] = npcIds(s);
    battle(s, a, "player", [f("attacker", a, 20, 1), f("defender", "player", 6, 4)]);
    expect(clashResultSnapshot(s)!.outcome).toBe(CLASH_OUTCOME_LOST);
    expect(clashResultSnapshot(s)!.note).toBe(CLASH_NOTE_COSTLY);
    battle(s, "player", a, [f("attacker", "player", 20, 0), f("defender", a, 6, 4)]);
    expect(clashResultSnapshot(s)!.note).toBe(CLASH_NOTE_CLEAN);
    battle(s, a, b, [f("attacker", a, 20, 0), f("defender", b, 6, 4)]);
    expect(clashResultSnapshot(s)).toMatchObject({ outcome: CLASH_OUTCOME_OTHERS, note: null });
  });

  it("battle stored before slice 25 (no forces): empty forces, null note", () => {
    const s = fresh();
    const [rival] = npcIds(s);
    battle(s, "player", rival);
    expect(clashResultSnapshot(s)).toEqual({ forces: [], outcome: CLASH_OUTCOME_WON, note: null });
  });

  it("caps forces at CLASH_FORCE_CAP", () => {
    const s = fresh();
    const [rival] = npcIds(s);
    const many = Array.from({ length: CLASH_FORCE_CAP + 2 }, (_, i) => f(i % 2 ? "defender" : "attacker", rival, i, 0));
    battle(s, "player", rival, many);
    expect(clashResultSnapshot(s)!.forces.length).toBe(CLASH_FORCE_CAP);
  });

  it("a real column clash records both sides' muster power and losses", () => {
    const s = fresh(3);
    const a = { realmId: "player", levy: 6, force: { militia: 6 } };
    const b = { realmId: "rival", levy: 5, force: { militia: 5 } };
    const militia = getUnitType("militia")!.power;
    resolveColumnClash(s, a, b, createRngStreams(3));
    const c = clashResultSnapshot(s)!;
    expect(c.forces.map((x) => [x.side, x.strength])).toEqual([
      ["attacker", 6 * militia],
      ["defender", 5 * militia],
    ]);
    expect(c.forces[0].casualties).toBe(6 - a.levy);
    expect(c.forces[1].casualties).toBe(5 - b.levy);
  });

  it("a real war battle records forces; combat result is unchanged by recording", () => {
    const run = () => {
      const s = fresh(1);
      s.units.push({ id: "u1", typeId: "militia", realmId: "player", count: "8", armyId: null });
      s.units.push({ id: "u2", typeId: "militia", realmId: "rival", count: "2", armyId: null });
      s.wars.push({ id: "w1", attackerRealmId: "player", defenderRealmId: "rival", startedTick: 0, status: "active" });
      const r = resolveBattle(s, s.wars[0], createRngStreams(1));
      return { s, r };
    };
    const { s, r } = run();
    const story = lastBattleStory(s)!;
    expect(story.forces!.map((x) => [x.side, x.realmId, x.strength])).toEqual([
      ["attacker", "player", r.attackerPower],
      ["defender", "rival", r.defenderPower],
    ]);
    const again = run();
    expect(JSON.stringify(again.s)).toBe(JSON.stringify(s));
  });

  it("is read-only and deterministic", () => {
    const s = fresh();
    const [rival] = npcIds(s);
    battle(s, rival, "player", [f("attacker", rival, 7, 1), f("defender", "player", 7, 3)]);
    const before = JSON.stringify(s);
    const one = clashResultSnapshot(s);
    expect(clashResultSnapshot(s)).toEqual(one);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("unitWaitingSnapshot", () => {
  it("is null with no garrisons and no player marches", () => {
    const s = fresh();
    expect(unitWaitingSnapshot(s)).toBeNull();
    s.flags.marches_json = JSON.stringify([march("m1", npcIds(s)[0], "p2", 10, { levy: 3 })]);
    expect(unitWaitingSnapshot(s)).toBeNull();
  });

  it("shape: posted { id, name, location }, waiting { id, name, destination, ticksLeft }", () => {
    const s = fresh();
    s.flags.garrisons_json = JSON.stringify([
      { provinceId: "p9", force: { spearman: 2, militia: 0 } },
      { provinceId: "p3", force: { militia: 4 } },
    ]);
    s.flags.marches_json = JSON.stringify([
      march("m_b", "player", "p5", 30, { force: { spearman: 1 } }),
      march("m_a", "player", "p6", 30, { levy: 3 }),
      march("m_past", "player", "p7", -4, { force: { militia: 2 } }),
    ]);
    expect(unitWaitingSnapshot(s)).toEqual({
      posted: [
        { id: "militia", name: unitName("militia"), location: "p3" },
        { id: "spearman", name: unitName("spearman"), location: "p9" },
      ],
      waiting: [
        { id: "militia", name: unitName("militia"), destination: "p7", ticksLeft: 0 },
        { id: "militia", name: unitName("militia"), destination: "p6", ticksLeft: 30 },
        { id: "spearman", name: unitName("spearman"), destination: "p5", ticksLeft: 30 },
      ],
    });
  });

  it("one list may be empty", () => {
    const s = fresh();
    s.flags.marches_json = JSON.stringify([march("m1", "player", "p2", 5, { levy: 1 })]);
    expect(unitWaitingSnapshot(s)!.posted).toEqual([]);
    s.flags.marches_json = "[]";
    s.flags.garrisons_json = JSON.stringify([{ provinceId: "p1", force: { militia: 1 } }]);
    expect(unitWaitingSnapshot(s)!.waiting).toEqual([]);
  });

  it("caps each list at UNIT_WAITING_CAP", () => {
    const s = fresh();
    const n = UNIT_WAITING_CAP + 3;
    s.flags.garrisons_json = JSON.stringify(Array.from({ length: n }, (_, i) => ({ provinceId: `p${i}`, force: { militia: 1 } })));
    s.flags.marches_json = JSON.stringify(Array.from({ length: n }, (_, i) => march(`m${i}`, "player", "p1", i + 1, { levy: 1 })));
    const w = unitWaitingSnapshot(s)!;
    expect(w.posted.length).toBe(UNIT_WAITING_CAP);
    expect(w.waiting.length).toBe(UNIT_WAITING_CAP);
    expect(w.waiting.map((x) => x.ticksLeft)).toEqual([1, 2, 3, 4, 5]);
  });

  it("is read-only and deterministic", () => {
    const s = fresh();
    s.flags.garrisons_json = JSON.stringify([{ provinceId: "p1", force: { militia: 2 } }]);
    s.flags.marches_json = JSON.stringify([march("m1", "player", "p2", 5, { levy: 1 })]);
    const before = JSON.stringify(s);
    const one = unitWaitingSnapshot(s);
    expect(unitWaitingSnapshot(s)).toEqual(one);
    expect(JSON.stringify(s)).toBe(before);
  });
});
