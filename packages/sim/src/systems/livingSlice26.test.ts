import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, livingSwitches, setLivingSwitch } from "./livingRealm.js";
import { boardSurfaceSnapshot, selectionFeedbackSnapshot } from "./livingStatus.js";
import { isProvinceSeen } from "./fog.js";
import {
  SELECTION_NOTE_HOME,
  SELECTION_NOTE_OPEN,
  SELECTION_NOTE_OWN,
  SELECTION_NOTE_RIVAL,
  SELECTION_NOTE_VEILED,
  SURFACE_ELEVATION,
  SURFACE_FOG_CLEAR,
  SURFACE_FOG_VEILED,
  SURFACE_KEEP_EMPTY,
  SURFACE_KEEP_HOME,
  SURFACE_KEEP_RIVAL,
  SURFACE_MARCH_ENEMY,
  SURFACE_MARCH_LEAVING,
  SURFACE_MARCH_OWN,
} from "../content/livingRealm.js";

const T0 = 20100;

function fresh(seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  s.flags.garrisons_json = "[]";
  return s;
}

function home(s: GameState) {
  return s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
}

/** A non-home province, farthest from home (veiled on a fresh board). */
function far(s: GameState) {
  const h = home(s);
  const d = (p: { x: number; y: number }) => Math.abs(p.x - h.x) + Math.abs(p.y - h.y);
  return [...s.board.provinces].sort((a, b) => d(b) - d(a) || (a.id < b.id ? -1 : 1))[0];
}

/** A seen non-home province with no node (neighbour of home). */
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

describe("slice 26 switches", () => {
  it("are on by default and map to their flags", () => {
    expect(LIVING_SWITCH_FLAGS.boardSurface).toBe("living_board_surface");
    expect(LIVING_SWITCH_FLAGS.selectionFeedback).toBe("living_selection_feedback");
    const sw = livingSwitches(fresh());
    expect([sw.boardSurface, sw.selectionFeedback]).toEqual([true, true]);
  });

  it("false returns null, each independently", () => {
    const s = fresh();
    const id = s.board.homeProvinceId;
    expect(boardSurfaceSnapshot(s, id)).not.toBeNull();
    expect(selectionFeedbackSnapshot(s, { selectedProvinceId: id })).not.toBeNull();
    setLivingSwitch(s, "boardSurface", false);
    expect(boardSurfaceSnapshot(s, id)).toBeNull();
    expect(selectionFeedbackSnapshot(s, { selectedProvinceId: id })).not.toBeNull();
    setLivingSwitch(s, "selectionFeedback", false);
    expect(selectionFeedbackSnapshot(s, { selectedProvinceId: id })).toBeNull();
  });
});

describe("boardSurfaceSnapshot", () => {
  it("is null for an unknown province", () => {
    expect(boardSurfaceSnapshot(fresh(), "nope")).toBeNull();
  });

  it("shape: home tile { terrain, elevation, fog, keep, marches }", () => {
    const s = fresh();
    const h = home(s);
    expect(boardSurfaceSnapshot(s, h.id)).toEqual({
      terrain: h.terrain,
      elevation: SURFACE_ELEVATION[h.terrain],
      fog: SURFACE_FOG_CLEAR,
      keep: SURFACE_KEEP_HOME,
      marches: null,
    });
  });

  it("elevation is a fixed line per terrain", () => {
    const s = fresh();
    const p = nearOpen(s);
    for (const t of ["peak", "hill", "shore", "plain", "wood", "waste"] as const) {
      p.terrain = t;
      expect(boardSurfaceSnapshot(s, p.id)!.elevation).toBe(SURFACE_ELEVATION[t]);
    }
    expect(SURFACE_ELEVATION.peak).not.toBe(SURFACE_ELEVATION.plain);
  });

  it("fog: veiled far away, clear once seen", () => {
    const s = fresh();
    const p = far(s);
    expect(boardSurfaceSnapshot(s, p.id)!.fog).toBe(SURFACE_FOG_VEILED);
    s.flags.fog_seen = JSON.stringify([p.id]);
    expect(boardSurfaceSnapshot(s, p.id)!.fog).toBe(SURFACE_FOG_CLEAR);
  });

  it("keep: home / player hold, rival hold, empty hold, else null", () => {
    const s = fresh();
    const p = nearOpen(s);
    expect(boardSurfaceSnapshot(s, p.id)!.keep).toBeNull();
    p.node = "hold";
    expect(boardSurfaceSnapshot(s, p.id)!.keep).toBe(SURFACE_KEEP_EMPTY);
    p.occupantRealmId = "rival";
    expect(boardSurfaceSnapshot(s, p.id)!.keep).toBe(SURFACE_KEEP_RIVAL);
    p.occupantRealmId = "player";
    expect(boardSurfaceSnapshot(s, p.id)!.keep).toBe(SURFACE_KEEP_HOME);
  });

  it("marches: enemy inbound beats own inbound beats leaving", () => {
    const s = fresh();
    const p = nearOpen(s);
    const h = s.board.homeProvinceId;
    s.flags.marches_json = JSON.stringify([march("m1", "player", p.id, h)]);
    expect(boardSurfaceSnapshot(s, p.id)!.marches).toBe(SURFACE_MARCH_LEAVING);
    s.flags.marches_json = JSON.stringify([march("m2", "player", h, p.id)]);
    expect(boardSurfaceSnapshot(s, p.id)!.marches).toBe(SURFACE_MARCH_OWN);
    s.flags.marches_json = JSON.stringify([march("m2", "player", h, p.id), march("m3", "rival", "x", p.id)]);
    expect(boardSurfaceSnapshot(s, p.id)!.marches).toBe(SURFACE_MARCH_ENEMY);
  });

  it("is a pure read (no fog_seen write) and deterministic", () => {
    const s = fresh();
    delete s.flags.fog_seen;
    const before = JSON.stringify(s);
    const a = boardSurfaceSnapshot(s, far(s).id);
    expect(JSON.stringify(s)).toBe(before);
    expect(boardSurfaceSnapshot(s, far(s).id)).toEqual(a);
    expect(boardSurfaceSnapshot(fresh(), far(fresh()).id)).toEqual(a);
  });

  it("matches isProvinceSeen for every tile", () => {
    const s = fresh();
    for (const p of s.board.provinces) {
      const want = isProvinceSeen(s, p.id) ? SURFACE_FOG_CLEAR : SURFACE_FOG_VEILED;
      expect(boardSurfaceSnapshot(s, p.id)!.fog).toBe(want);
    }
  });
});

describe("selectionFeedbackSnapshot", () => {
  it("is null when nothing or an unknown id is selected", () => {
    const s = fresh();
    expect(selectionFeedbackSnapshot(s)).toBeNull();
    expect(selectionFeedbackSnapshot(s, { selectedProvinceId: null })).toBeNull();
    expect(selectionFeedbackSnapshot(s, { selectedProvinceId: "nope" })).toBeNull();
  });

  it("shape: { selected, note }", () => {
    const s = fresh();
    const id = s.board.homeProvinceId;
    expect(selectionFeedbackSnapshot(s, { selectedProvinceId: id })).toEqual({ selected: id, note: SELECTION_NOTE_HOME });
  });

  it("note: home, veiled, own, rival, open", () => {
    const s = fresh();
    const veiled = far(s);
    veiled.occupantRealmId = "rival"; // fog beats "held by another realm"
    expect(selectionFeedbackSnapshot(s, { selectedProvinceId: veiled.id })!.note).toBe(SELECTION_NOTE_VEILED);
    const p = nearOpen(s);
    const note = () => selectionFeedbackSnapshot(s, { selectedProvinceId: p.id })!.note;
    expect(note()).toBe(SELECTION_NOTE_OPEN);
    p.occupantRealmId = "rival";
    expect(note()).toBe(SELECTION_NOTE_RIVAL);
    p.occupantRealmId = "player";
    expect(note()).toBe(SELECTION_NOTE_OWN);
  });

  it("is a pure read and deterministic", () => {
    const s = fresh();
    delete s.flags.fog_seen;
    const id = far(s).id;
    const before = JSON.stringify(s);
    const a = selectionFeedbackSnapshot(s, { selectedProvinceId: id });
    expect(JSON.stringify(s)).toBe(before);
    expect(selectionFeedbackSnapshot(fresh(), { selectedProvinceId: id })).toEqual(a);
  });
});
