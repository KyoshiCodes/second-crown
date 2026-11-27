import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, livingSwitches, setLivingSwitch } from "./livingRealm.js";
import { battleFeedbackSnapshot, boardPolishSnapshot, boardSurfaceSnapshot } from "./livingStatus.js";
import { lastBattleStory, writeLastBattle } from "./lastBattle.js";
import { recordCrown } from "./ledger.js";
import { resolveBattle } from "./combat.js";
import { resolveColumnClash } from "./engagement.js";
import { isProvinceSeen } from "./fog.js";
import {
  BATTLE_FEEDBACK_MARK_LOST,
  BATTLE_FEEDBACK_MARK_OTHERS,
  BATTLE_FEEDBACK_MARK_WON,
  BATTLE_FEEDBACK_NOTE_LOST,
  BATTLE_FEEDBACK_NOTE_OTHERS,
  BATTLE_FEEDBACK_NOTE_WON,
  BATTLE_NOTE_RECENT_TICKS,
  POLISH_KEEP_EMPTY,
  POLISH_KEEP_HOME,
  POLISH_KEEP_RIVAL,
  POLISH_MARCH_ENEMY,
  POLISH_MARCH_LEAVING,
  POLISH_MARCH_OWN,
  SURFACE_FOG_CLEAR,
  SURFACE_FOG_VEILED,
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

function battle(s: GameState, winnerId: string, loserId: string, provinceId?: string, atTick = s.meta.tick) {
  const now = s.meta.tick;
  s.meta.tick = atTick;
  recordCrown(s, "battle", "test battle");
  writeLastBattle(s, { winnerId, loserId, events: [], phases: [], provinceId });
  s.meta.tick = now;
}

function home(s: GameState) {
  return s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
}

function far(s: GameState) {
  const h = home(s);
  const d = (p: { x: number; y: number }) => Math.abs(p.x - h.x) + Math.abs(p.y - h.y);
  return [...s.board.provinces].sort((a, b) => d(b) - d(a) || (a.id < b.id ? -1 : 1))[0];
}

function nearOpen(s: GameState) {
  const h = home(s);
  const p = s.board.provinces.find((q) => Math.abs(q.x - h.x) + Math.abs(q.y - h.y) === 1)!;
  p.node = "none";
  p.occupantRealmId = null;
  return p;
}

function march(id: string, realmId: string, fromId: string, toId: string) {
  return { id, realmId, fromId, toId, arrivesTick: T0 + 50, kind: "node", levy: 1 };
}

describe("slice 27 switches", () => {
  it("are on by default and map to their flags", () => {
    expect(LIVING_SWITCH_FLAGS.battleFeedback).toBe("living_battle_feedback");
    expect(LIVING_SWITCH_FLAGS.boardPolish).toBe("living_board_polish");
    const sw = livingSwitches(fresh());
    expect([sw.battleFeedback, sw.boardPolish]).toEqual([true, true]);
  });

  it("false returns null, each independently", () => {
    const s = fresh();
    const id = s.board.homeProvinceId;
    battle(s, "player", "rival", id);
    expect(battleFeedbackSnapshot(s)).not.toBeNull();
    expect(boardPolishSnapshot(s, id)).not.toBeNull();
    setLivingSwitch(s, "battleFeedback", false);
    expect(battleFeedbackSnapshot(s)).toBeNull();
    expect(boardPolishSnapshot(s, id)).not.toBeNull();
    setLivingSwitch(s, "boardPolish", false);
    expect(boardPolishSnapshot(s, id)).toBeNull();
  });
});

describe("battleFeedbackSnapshot", () => {
  it("is null with no stored battle, or none recent", () => {
    const s = fresh();
    expect(battleFeedbackSnapshot(s)).toBeNull();
    battle(s, "player", "rival", s.board.homeProvinceId, T0 - BATTLE_NOTE_RECENT_TICKS - 1);
    expect(battleFeedbackSnapshot(s)).toBeNull();
    battle(s, "player", "rival", s.board.homeProvinceId, T0 - BATTLE_NOTE_RECENT_TICKS);
    expect(battleFeedbackSnapshot(s)).not.toBeNull();
  });

  it("shape: { provinceId, note, mark }", () => {
    const s = fresh();
    const id = s.board.homeProvinceId;
    battle(s, "player", "rival", id);
    expect(battleFeedbackSnapshot(s)).toEqual({ provinceId: id, note: BATTLE_FEEDBACK_NOTE_WON, mark: BATTLE_FEEDBACK_MARK_WON });
  });

  it("won / lost / others", () => {
    const s = fresh();
    const id = s.board.homeProvinceId;
    battle(s, "rival", "player", id);
    expect(battleFeedbackSnapshot(s)).toEqual({ provinceId: id, note: BATTLE_FEEDBACK_NOTE_LOST, mark: BATTLE_FEEDBACK_MARK_LOST });
    battle(s, "a", "b", id);
    expect(battleFeedbackSnapshot(s)).toEqual({ provinceId: id, note: BATTLE_FEEDBACK_NOTE_OTHERS, mark: BATTLE_FEEDBACK_MARK_OTHERS });
  });

  it("provinceId is null with no stored tile or an unknown tile", () => {
    const s = fresh();
    battle(s, "player", "rival");
    expect(battleFeedbackSnapshot(s)!.provinceId).toBeNull();
    battle(s, "player", "rival", "nope");
    expect(battleFeedbackSnapshot(s)!.provinceId).toBeNull();
  });

  it("a column clash records its tile; a realm-level Fight records none", () => {
    const s = fresh();
    const dest = nearOpen(s).id;
    resolveColumnClash(
      s,
      { realmId: "player", toId: dest, levy: 6, force: { militia: 6 } },
      { realmId: "rival", levy: 2, force: { militia: 2 } },
      createRngStreams(1)
    );
    expect(lastBattleStory(s)!.provinceId).toBe(dest);
    expect(battleFeedbackSnapshot(s)!.provinceId).toBe(dest);

    const w = fresh();
    w.units.push({ id: "u1", typeId: "militia", realmId: "player", count: "8", armyId: null });
    w.units.push({ id: "u2", typeId: "militia", realmId: "rival", count: "2", armyId: null });
    w.wars.push({ id: "w1", attackerRealmId: "player", defenderRealmId: "rival", startedTick: 0, status: "active" });
    resolveBattle(w, w.wars[0], createRngStreams(1));
    expect(lastBattleStory(w)!.provinceId).toBeUndefined();
    expect(battleFeedbackSnapshot(w)!.provinceId).toBeNull();
  });

  it("recording the tile leaves the battle result unchanged", () => {
    const run = (provinceId?: string) => {
      const s = fresh();
      s.units.push({ id: "u1", typeId: "militia", realmId: "player", count: "8", armyId: null });
      s.units.push({ id: "u2", typeId: "militia", realmId: "rival", count: "5", armyId: null });
      s.wars.push({ id: "w1", attackerRealmId: "player", defenderRealmId: "rival", startedTick: 0, status: "active" });
      const r = resolveBattle(s, s.wars[0], createRngStreams(3), { provinceId });
      delete s.flags.last_battle_json;
      return { r, s: JSON.stringify(s) };
    };
    expect(run(fresh().board.homeProvinceId)).toEqual(run());
  });

  it("is read-only and deterministic", () => {
    const s = fresh();
    battle(s, "player", "rival", s.board.homeProvinceId);
    const before = JSON.stringify(s);
    const a = battleFeedbackSnapshot(s);
    expect(battleFeedbackSnapshot(s)).toEqual(a);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("boardPolishSnapshot", () => {
  it("is null for an unknown province", () => {
    expect(boardPolishSnapshot(fresh(), "nope")).toBeNull();
  });

  it("shape: home tile { march, keep, fog }", () => {
    const s = fresh();
    expect(boardPolishSnapshot(s, s.board.homeProvinceId)).toEqual({ march: null, keep: POLISH_KEEP_HOME, fog: SURFACE_FOG_CLEAR });
  });

  it("march: foe inbound beats ally inbound beats marching out", () => {
    const s = fresh();
    const p = nearOpen(s);
    const h = s.board.homeProvinceId;
    expect(boardPolishSnapshot(s, p.id)!.march).toBeNull();
    s.flags.marches_json = JSON.stringify([march("m1", "player", p.id, h)]);
    expect(boardPolishSnapshot(s, p.id)!.march).toBe(POLISH_MARCH_LEAVING);
    s.flags.marches_json = JSON.stringify([march("m2", "player", h, p.id)]);
    expect(boardPolishSnapshot(s, p.id)!.march).toBe(POLISH_MARCH_OWN);
    s.flags.marches_json = JSON.stringify([march("m2", "player", h, p.id), march("m3", "rival", "x", p.id)]);
    expect(boardPolishSnapshot(s, p.id)!.march).toBe(POLISH_MARCH_ENEMY);
  });

  it("keep: player hold, rival hold, empty hold, else null", () => {
    const s = fresh();
    const p = nearOpen(s);
    expect(boardPolishSnapshot(s, p.id)!.keep).toBeNull();
    p.node = "hold";
    expect(boardPolishSnapshot(s, p.id)!.keep).toBe(POLISH_KEEP_EMPTY);
    p.occupantRealmId = "rival";
    expect(boardPolishSnapshot(s, p.id)!.keep).toBe(POLISH_KEEP_RIVAL);
    p.occupantRealmId = "player";
    expect(boardPolishSnapshot(s, p.id)!.keep).toBe(POLISH_KEEP_HOME);
  });

  it("fog matches isProvinceSeen and boardSurfaceSnapshot on every tile", () => {
    const s = fresh();
    expect(boardPolishSnapshot(s, far(s).id)!.fog).toBe(SURFACE_FOG_VEILED);
    for (const p of s.board.provinces) {
      const want = isProvinceSeen(s, p.id) ? SURFACE_FOG_CLEAR : SURFACE_FOG_VEILED;
      expect(boardPolishSnapshot(s, p.id)!.fog).toBe(want);
      expect(boardSurfaceSnapshot(s, p.id)!.fog).toBe(want);
    }
  });

  it("is a pure read (no fog_seen write) and deterministic", () => {
    const s = fresh();
    delete s.flags.fog_seen;
    const id = far(s).id;
    const before = JSON.stringify(s);
    const a = boardPolishSnapshot(s, id);
    expect(JSON.stringify(s)).toBe(before);
    expect(boardPolishSnapshot(fresh(), id)).toEqual(a);
  });
});
