import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, livingSwitches, nameOf, setLivingSwitch } from "./livingRealm.js";
import { battleOutcomeNoteSnapshot, columnStatusSnapshot, marchEtaSnapshot } from "./livingStatus.js";
import { listMarches, tryNpcMarch } from "./march.js";
import { forcePower } from "./column.js";
import { writeLastBattle } from "./lastBattle.js";
import { recordCrown } from "./ledger.js";
import { getUnitType } from "../content/units.js";
import {
  BATTLE_NOTE_LOST,
  BATTLE_NOTE_OTHERS,
  BATTLE_NOTE_RECENT_TICKS,
  BATTLE_NOTE_WON,
  BATTLE_SUGGEST_LOST,
  BATTLE_SUGGEST_WON,
  COLUMN_NOTE_MORE,
  COLUMN_NOTE_THREAT,
  COLUMN_STATUS_CAP,
  MARCH_ETA_CAP,
} from "../content/livingRealm.js";

const T0 = 20100;

function fresh(seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  s.flags.gathers_json = "[]";
  delete s.flags.last_battle_json;
  s.flags.world_log = "[]";
  return s;
}

/** Board with only home held, plus a center tile away from edges and home. */
function scene(seed = 1) {
  const s = fresh(seed);
  const home = s.board.homeProvinceId;
  for (const p of s.board.provinces) if (p.id !== home) p.occupantRealmId = null;
  const homeP = s.board.provinces.find((p) => p.id === home)!;
  const center = s.board.provinces.find(
    (p) =>
      p.x >= 3 && p.y >= 3 && p.x < s.board.width - 3 && p.y < s.board.height - 3 &&
      Math.abs(p.x - homeP.x) + Math.abs(p.y - homeP.y) > 6
  )!;
  const at = (dx: number, dy: number) => s.board.provinces.find((p) => p.x === center.x + dx && p.y === center.y + dy)!;
  const npc = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
  return { s, home, center, at, npc };
}

function march(
  id: string,
  realmId: string,
  fromId: string,
  toId: string,
  eta: number,
  extra: { kind?: string; levy?: number; force?: Record<string, number> } = {}
) {
  return { id, realmId, fromId, toId, arrivesTick: T0 + eta, kind: extra.kind ?? "node", levy: extra.levy ?? 3, force: extra.force };
}

function battle(s: GameState, winnerId: string, loserId: string, atTick = s.meta.tick) {
  const now = s.meta.tick;
  s.meta.tick = atTick;
  recordCrown(s, "battle", "test battle");
  writeLastBattle(s, { winnerId, loserId, events: [], phases: [] });
  s.meta.tick = now;
}

describe("slice 24 switches", () => {
  it("are on by default and map to their flags", () => {
    expect(LIVING_SWITCH_FLAGS.columnStatus).toBe("living_column_status");
    expect(LIVING_SWITCH_FLAGS.marchEta).toBe("living_march_eta");
    expect(LIVING_SWITCH_FLAGS.battleNotes).toBe("living_battle_notes");
    const sw = livingSwitches(fresh());
    expect([sw.columnStatus, sw.marchEta, sw.battleNotes]).toEqual([true, true, true]);
  });

  it("false returns null, each independently", () => {
    const { s, home, center, npc } = scene();
    s.flags.marches_json = JSON.stringify([march("m1", npc[0], center.id, home, 10)]);
    battle(s, "player", npc[0]);
    expect(columnStatusSnapshot(s)).not.toBeNull();
    expect(marchEtaSnapshot(s, home)).not.toBeNull();
    expect(battleOutcomeNoteSnapshot(s)).not.toBeNull();
    setLivingSwitch(s, "columnStatus", false);
    expect(columnStatusSnapshot(s)).toBeNull();
    expect(marchEtaSnapshot(s, home)).not.toBeNull();
    setLivingSwitch(s, "marchEta", false);
    expect(marchEtaSnapshot(s, home)).toBeNull();
    expect(battleOutcomeNoteSnapshot(s)).not.toBeNull();
    setLivingSwitch(s, "battleNotes", false);
    expect(battleOutcomeNoteSnapshot(s)).toBeNull();
  });
});

describe("columnStatusSnapshot", () => {
  it("is null with no columns", () => {
    expect(columnStatusSnapshot(fresh())).toBeNull();
  });

  it("shape: id, realm name, kind, destination, ticksLeft, strength; soonest first, id breaks ties, never negative", () => {
    const { s, home, center, at, npc } = scene();
    s.flags.marches_json = JSON.stringify([
      march("m_b", "player", home, center.id, 40, { force: { spearman: 2, militia: 1 } }),
      march("m_a", npc[0], at(2, 0).id, center.id, 40, { kind: "hold", levy: 4 }),
      march("m_past", "player", home, at(1, 0).id, -5, { kind: "camp", levy: 5 }),
    ]);
    const c = columnStatusSnapshot(s)!;
    const militia = getUnitType("militia")!.power;
    expect(c.columns).toEqual([
      { id: "m_past", name: nameOf(s, "player"), kind: "camp", destination: at(1, 0).id, ticksLeft: 0, strength: 5 * militia },
      { id: "m_a", name: nameOf(s, npc[0]), kind: "hold", destination: center.id, ticksLeft: 40, strength: 4 * militia },
      { id: "m_b", name: nameOf(s, "player"), kind: "node", destination: center.id, ticksLeft: 40, strength: forcePower({ spearman: 2, militia: 1 }) },
    ]);
    expect(c.note).toBeNull();
  });

  it("caps at COLUMN_STATUS_CAP with the more note", () => {
    const { s, home, center } = scene();
    const list = Array.from({ length: COLUMN_STATUS_CAP + 2 }, (_, i) => march(`m${i}`, "player", home, center.id, 10 + i));
    s.flags.marches_json = JSON.stringify(list);
    const c = columnStatusSnapshot(s)!;
    expect(c.columns.length).toBe(COLUMN_STATUS_CAP);
    expect(c.columns.map((x) => x.id)).toEqual(list.slice(0, COLUMN_STATUS_CAP).map((m) => m.id));
    expect(c.note).toBe(COLUMN_NOTE_MORE);
    s.flags.marches_json = JSON.stringify(list.slice(0, COLUMN_STATUS_CAP));
    expect(columnStatusSnapshot(s)!.note).toBeNull();
  });

  it("threat note when a rival column heads to home or a player province; outranks more", () => {
    const { s, home, center, at, npc } = scene();
    s.flags.marches_json = JSON.stringify([march("m1", npc[0], center.id, at(1, 0).id, 10)]);
    expect(columnStatusSnapshot(s)!.note).toBeNull();
    at(1, 0).occupantRealmId = "player";
    expect(columnStatusSnapshot(s)!.note).toBe(COLUMN_NOTE_THREAT);
    at(1, 0).occupantRealmId = null;
    const many = Array.from({ length: COLUMN_STATUS_CAP + 1 }, (_, i) => march(`p${i}`, "player", home, center.id, 10));
    s.flags.marches_json = JSON.stringify([...many, march("m2", npc[0], center.id, home, 99)]);
    expect(columnStatusSnapshot(s)!.note).toBe(COLUMN_NOTE_THREAT);
  });

  it("reads a real NPC column", () => {
    const { s, home, npc } = scene();
    const realm = npc.find((r) => {
      const hold = s.board.provinces.find((p) => p.node === "hold" && p.id !== home);
      if (hold) hold.occupantRealmId = r;
      return tryNpcMarch(s, r, home);
    })!;
    const m = listMarches(s)[0];
    const c = columnStatusSnapshot(s)!;
    expect(c.columns).toEqual([
      { id: m.id, name: nameOf(s, realm), kind: m.kind, destination: home, ticksLeft: m.arrivesTick - T0, strength: forcePower(m.force!) },
    ]);
    expect(c.note).toBe(COLUMN_NOTE_THREAT);
  });
});

describe("marchEtaSnapshot", () => {
  it("is null for an unknown province; empty lists for a quiet one", () => {
    const { s, center } = scene();
    expect(marchEtaSnapshot(s, "nowhere")).toBeNull();
    expect(marchEtaSnapshot(s, center.id)).toEqual({ incoming: [], outgoing: [] });
  });

  it("splits incoming and outgoing, soonest first then id, never negative, cap MARCH_ETA_CAP each", () => {
    const { s, home, center, at, npc } = scene();
    s.flags.marches_json = JSON.stringify([
      march("in_b", "player", home, center.id, 40),
      march("in_a", npc[0], at(2, 0).id, center.id, 40, { kind: "hold" }),
      march("in_late", "player", home, center.id, 300),
      march("in_past", "player", home, center.id, -5, { kind: "camp" }),
      march("out_1", npc[0], center.id, at(1, 0).id, 20),
      march("else", "player", home, at(1, 0).id, 1),
    ]);
    const e = marchEtaSnapshot(s, center.id)!;
    expect(e.incoming).toEqual([
      { id: "in_past", kind: "camp", ticksLeft: 0 },
      { id: "in_a", kind: "hold", ticksLeft: 40 },
      { id: "in_b", kind: "node", ticksLeft: 40 },
    ]);
    expect(e.incoming.length).toBe(MARCH_ETA_CAP);
    expect(e.outgoing).toEqual([{ id: "out_1", kind: "node", ticksLeft: 20 }]);
    const h = marchEtaSnapshot(s, home)!;
    expect(h.incoming).toEqual([]);
    expect(h.outgoing.map((x) => x.id)).toEqual(["in_past", "else", "in_b"]);
    expect(h.outgoing.length).toBe(MARCH_ETA_CAP);
  });
});

describe("battleOutcomeNoteSnapshot", () => {
  it("is null with no stored battle", () => {
    expect(battleOutcomeNoteSnapshot(fresh())).toBeNull();
  });

  it("player won / lost / not there", () => {
    const { s, npc } = scene();
    battle(s, "player", npc[0], T0 - 100);
    expect(battleOutcomeNoteSnapshot(s)).toEqual({ last: { tick: T0 - 100, text: BATTLE_NOTE_WON }, suggestion: BATTLE_SUGGEST_WON });
    battle(s, npc[0], "player", T0 - 50);
    expect(battleOutcomeNoteSnapshot(s)).toEqual({ last: { tick: T0 - 50, text: BATTLE_NOTE_LOST }, suggestion: BATTLE_SUGGEST_LOST });
    battle(s, npc[0], npc[1] ?? npc[0], T0);
    expect(battleOutcomeNoteSnapshot(s)).toEqual({ last: { tick: T0, text: BATTLE_NOTE_OTHERS }, suggestion: null });
  });

  it("null once the battle is older than BATTLE_NOTE_RECENT_TICKS, or with no battle log entry", () => {
    const { s, npc } = scene();
    battle(s, "player", npc[0], T0 - BATTLE_NOTE_RECENT_TICKS);
    expect(battleOutcomeNoteSnapshot(s)).not.toBeNull();
    s.meta.tick = T0 + 1;
    expect(battleOutcomeNoteSnapshot(s)).toBeNull();
    s.meta.tick = T0;
    s.flags.world_log = "[]";
    expect(battleOutcomeNoteSnapshot(s)).toBeNull();
  });
});

describe("slice 24 read-only and deterministic", () => {
  it("no writes; same input gives same output", () => {
    const { s, home, center, npc } = scene();
    s.flags.marches_json = JSON.stringify([
      march("m1", npc[0], center.id, home, 10),
      march("m2", "player", home, center.id, 30, { force: { militia: 2 } }),
    ]);
    battle(s, "player", npc[0], T0 - 10);
    const before = JSON.stringify(s);
    const a = [columnStatusSnapshot(s), marchEtaSnapshot(s, center.id), marchEtaSnapshot(s, home), battleOutcomeNoteSnapshot(s)];
    expect(JSON.stringify(s)).toBe(before);
    const t = JSON.parse(before) as GameState;
    const b = [columnStatusSnapshot(t), marchEtaSnapshot(t, center.id), marchEtaSnapshot(t, home), battleOutcomeNoteSnapshot(t)];
    expect(b).toEqual(a);
  });
});
