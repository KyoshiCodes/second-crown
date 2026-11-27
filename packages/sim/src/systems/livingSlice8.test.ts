import { describe, it, expect } from "vitest";
import type { GameState, WarInstance } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { tryWhitePeace } from "../actions/war.js";
import {
  LIVING_SWITCH_FLAGS,
  columnMarkSnapshot,
  formationSnapshot,
  joinSide,
  livingCounts,
  livingSwitches,
  maybeWhisper,
  setLivingSwitch,
  settleNpcWars,
  type CultureNews,
} from "./livingRealm.js";
import { COLUMN_MARK_IDS, WAR_AFTERMATH_TICKS, WAR_PHASE_START, WHISPER_PULSES } from "../content/livingRealm.js";

const T0 = 20100;

function fresh(seed: number): GameState {
  const s = createGameState({ seed, now: 1 });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  for (const k of Object.keys(s.flags)) if (k.startsWith("peace_")) delete s.flags[k];
  return s;
}

/** Every whisper over `pulses` world pulses from T0. */
function run(s: GameState, pulses: number): CultureNews[] {
  const out: CultureNews[] = [];
  for (let p = T0 / 100; p < T0 / 100 + pulses; p++) {
    const w = maybeWhisper(s, p * 100);
    if (w) out.push(w);
  }
  return out;
}

/** Rounds for every sender to reach every listener once: npcs × listeners, in pulses. */
function fullCycle(s: GameState): number {
  const npcs = s.realms.length - 1;
  return npcs * (s.realms.length - 1) * WHISPER_PULSES;
}

describe("fair whisper rotation: switch", () => {
  it("has living_whisper_fair, on by default", () => {
    const s = fresh(1);
    expect(LIVING_SWITCH_FLAGS.whisperFair).toBe("living_whisper_fair");
    expect(livingSwitches(s).whisperFair).toBe(true);
  });

  it("some seeds never whisper to the player with the old picker (the bug)", () => {
    const stuck = [];
    for (let seed = 1; seed <= 40; seed++) {
      const s = fresh(seed);
      setLivingSwitch(s, "whisperFair", false);
      if (!run(s, 3000).some((w) => w.toRealmId === "player")) stuck.push(seed);
    }
    expect(stuck.length).toBeGreaterThan(0);
  });
});

describe("fair whisper rotation: every seed reaches the player", () => {
  it("every seed whispers to the player within one full cycle", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const s = fresh(seed);
      const got = run(s, fullCycle(s)).filter((w) => w.toRealmId === "player");
      expect(got.length, `seed ${seed}`).toBeGreaterThan(0);
      expect(livingCounts(s).playerWhispers).toBe(got.length);
    }
  });

  it("every NPC whispers to the player once per full cycle (fair, not boosted)", () => {
    for (const seed of [1, 5, 7, 13, 40]) {
      const s = fresh(seed);
      const got = run(s, fullCycle(s)).filter((w) => w.toRealmId === "player");
      const senders = got.map((w) => w.fromRealmId).sort();
      const npcs = s.realms.filter((r) => r.id !== "player").map((r) => r.id).sort();
      expect(senders, `seed ${seed}`).toEqual(npcs);
    }
  });

  it("each sender reaches every listener once per cycle", () => {
    const s = fresh(7);
    const pairs = new Set(run(s, fullCycle(s)).map((w) => `${w.fromRealmId}>${w.toRealmId}`));
    const n = s.realms.length;
    expect(pairs.size).toBe((n - 1) * (n - 1));
  });

  it("does not change cadence or how many whispers go out", () => {
    for (const seed of [1, 6, 22]) {
      const fair = fresh(seed);
      const old = fresh(seed);
      setLivingSwitch(old, "whisperFair", false);
      const a = run(fair, 900);
      const b = run(old, 900);
      expect(a.map((w) => w.tick)).toEqual(b.map((w) => w.tick));
      expect(a.map((w) => w.fromRealmId)).toEqual(b.map((w) => w.fromRealmId));
      for (const w of a) expect(Math.floor(w.tick / 100) % WHISPER_PULSES).toBe(0);
    }
  });

  it("is deterministic", () => {
    const go = () => {
      const s = fresh(11);
      run(s, 600);
      return s.flags.culture_news;
    };
    expect(go()).toBe(go());
  });

  it("off restores the old picker exactly", () => {
    const s = fresh(5);
    setLivingSwitch(s, "whisperFair", false);
    const npcs = s.realms.filter((r) => r.id !== "player");
    for (const w of run(s, 300)) {
      const round = Math.floor(w.tick / 100) / WHISPER_PULSES;
      const listeners = s.realms.filter((r) => r.id !== w.fromRealmId);
      let salt = 0;
      for (let i = 0; i < w.fromRealmId.length; i++) salt = (salt + w.fromRealmId.charCodeAt(i) * (i + 3)) % 997;
      expect(w.fromRealmId).toBe(npcs[(round + s.meta.seed) % npcs.length].id);
      expect(w.toRealmId).toBe(listeners[(round + salt) % listeners.length].id);
    }
  });
});

describe("fair whisper rotation: no message during war or peace lock", () => {
  it("never whispers to the player from a realm at war with them", () => {
    const s = fresh(13);
    const foe = s.realms.find((r) => r.id !== "player")!.id;
    const war: WarInstance = { id: "w_test", attackerRealmId: foe, defenderRealmId: "player", startedTick: T0, status: "active" };
    s.wars.push(war);
    const got = run(s, fullCycle(s) * 2);
    expect(got.some((w) => w.fromRealmId === foe && w.toRealmId === "player")).toBe(false);
    expect(got.some((w) => w.toRealmId === "player")).toBe(true);
  });

  it("never whispers across a peace lock, either direction", () => {
    const s = fresh(13);
    const [x, y] = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
    s.flags[`peace_${x}_player`] = T0 + 1_000_000;
    s.flags[`peace_player_${y}`] = T0 + 1_000_000;
    const got = run(s, fullCycle(s) * 2);
    for (const w of got) {
      const pair = [w.fromRealmId, w.toRealmId];
      expect(pair.includes("player") && (pair.includes(x) || pair.includes(y))).toBe(false);
    }
    expect(got.some((w) => w.toRealmId === "player")).toBe(true);
  });
});

describe("column-mark snapshot", () => {
  function joined() {
    const s = fresh(1);
    const [a, d] = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
    const npc: WarInstance = { id: `war_npc_${a}_${d}_${T0}`, attackerRealmId: a, defenderRealmId: d, startedTick: T0, status: "active" };
    s.wars.push(npc);
    const pw = joinSide(s, npc.id, "attacker")!;
    return { s, a, d, npc, pw };
  }
  const name = (s: GameState, id: string) => s.realms.find((r) => r.id === id)!.name;

  it("null without a joined war; NPC wars alone do not show", () => {
    const s = fresh(1);
    expect(columnMarkSnapshot(s)).toBeNull();
    const [a, d] = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
    s.wars.push({ id: "war_npc_x", attackerRealmId: a, defenderRealmId: d, startedTick: T0, status: "active" });
    expect(columnMarkSnapshot(s)).toBeNull();
  });

  it("two sides, phase and column id: column → skirmish-line → clash-line", () => {
    const { s, a, d, npc, pw } = joined();
    expect(columnMarkSnapshot(s, T0)).toEqual({
      warId: pw.id,
      joinedWarId: npc.id,
      ours: { realmIds: ["player", a], names: [name(s, "player"), name(s, a)] },
      theirs: { realmIds: [d], names: [name(s, d)] },
      phase: "columns",
      column: "column",
      ranks: 1,
      ranksLabel: "one rank",
      ranksNote: "column",
      active: true,
    });
    expect(columnMarkSnapshot(s, T0 + WAR_PHASE_START.skirmish)).toMatchObject({ phase: "skirmish", column: "skirmish-line" });
    expect(columnMarkSnapshot(s, T0 + WAR_PHASE_START.clash)).toMatchObject({ phase: "clash", column: "clash-line" });
    expect(COLUMN_MARK_IDS).toEqual(["column", "skirmish-line", "clash-line", "falling-back"]);
  });

  it("phase matches formationSnapshot (no timing change)", () => {
    const { s } = joined();
    for (const t of [T0, T0 + WAR_PHASE_START.skirmish - 1, T0 + WAR_PHASE_START.skirmish, T0 + WAR_PHASE_START.clash]) {
      expect(columnMarkSnapshot(s, t)!.phase).toBe(formationSnapshot(s, t)[0].phase);
    }
  });

  it("falling-back while the finished war's aftermath shows, then null", () => {
    const { s } = joined();
    s.meta.tick = T0 + WAR_PHASE_START.clash;
    settleNpcWars(s, s.meta.tick);
    expect(tryWhitePeace(s)).toBe(true);
    expect(columnMarkSnapshot(s)).toMatchObject({ phase: "aftermath", column: "falling-back", active: false });
    expect(columnMarkSnapshot(s, s.meta.tick + WAR_AFTERMATH_TICKS)).toBeNull();
  });

  it("is read-only and deterministic", () => {
    const { s } = joined();
    const before = JSON.stringify(s);
    const a = columnMarkSnapshot(s);
    const b = columnMarkSnapshot(s);
    expect(JSON.stringify(s)).toBe(before);
    expect(a).toEqual(b);
  });
});
