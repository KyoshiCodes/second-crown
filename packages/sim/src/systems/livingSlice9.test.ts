import { describe, it, expect } from "vitest";
import type { GameState, WarInstance } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { tryWhitePeace } from "../actions/war.js";
import { cultureOfRealm } from "./culture.js";
import {
  COLUMN_RANKS,
  LIVING_SWITCH_FLAGS,
  columnMarkSnapshot,
  columnRanks,
  distinctWhisperLines,
  joinSide,
  livingCounts,
  livingSwitches,
  maybeWhisper,
  nextWhisperHint,
  setLivingSwitch,
  settleNpcWars,
  whisperLineIndex,
  type CultureNews,
} from "./livingRealm.js";
import { WAR_PHASE_START, WHISPER_PULSES, whisperLinesFor } from "../content/livingRealm.js";

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

function run(s: GameState, pulses: number): CultureNews[] {
  const out: CultureNews[] = [];
  for (let p = T0 / 100; p < T0 / 100 + pulses; p++) {
    const w = maybeWhisper(s, p * 100);
    if (w) out.push(w);
  }
  return out;
}

/** Which line of the sender's culture table a whisper used. */
function lineOf(s: GameState, w: CultureNews): number {
  const toName = s.realms.find((r) => r.id === w.toRealmId)!.name;
  const said = w.text.slice(w.text.indexOf(': "') + 3, -1);
  const lines = whisperLinesFor(cultureOfRealm(s, w.fromRealmId));
  const i = lines.findIndex((l) => l.replace(/\{to\}/g, toName) === said);
  expect(i, w.text).toBeGreaterThanOrEqual(0);
  return i;
}

function bySender(s: GameState, ws: CultureNews[]): Map<string, number[]> {
  const m = new Map<string, number[]>();
  for (const w of ws) m.set(w.fromRealmId, [...(m.get(w.fromRealmId) ?? []), lineOf(s, w)]);
  return m;
}

/** Keep exactly 4 NPC senders: the old picker then repeats one line per sender (step 4 mod 4). */
function fourNpcs(seed: number): GameState {
  const s = fresh(seed);
  const keep = new Set(["player", ...s.realms.filter((r) => r.id !== "player").slice(0, 4).map((r) => r.id)]);
  s.realms = s.realms.filter((r) => keep.has(r.id));
  expect(s.realms.length).toBe(5);
  return s;
}

describe("whisper variety: switch", () => {
  it("has living_whisper_variety, on by default", () => {
    const s = fresh(1);
    expect(LIVING_SWITCH_FLAGS.whisperVariety).toBe("living_whisper_variety");
    expect(livingSwitches(s).whisperVariety).toBe(true);
  });
});

describe("whisper variety: line index", () => {
  it("every block of n turns says every line once", () => {
    for (const salt of [0, 3, 17, 996]) {
      for (let block = 0; block < 6; block++) {
        const seen = new Set<number>();
        for (let t = block * 4; t < block * 4 + 4; t++) seen.add(whisperLineIndex(t, salt, 4));
        expect(seen.size).toBe(4);
      }
    }
  });

  it("no two successive turns share a line (n = 4)", () => {
    for (const salt of [0, 5, 41]) {
      for (let t = 0; t < 200; t++) expect(whisperLineIndex(t + 1, salt, 4)).not.toBe(whisperLineIndex(t, salt, 4));
    }
  });

  it("shifts by one each block, so listener and line do not lock together", () => {
    // With 4 listeners, turn t and turn t + 4 go to the same listener; the line differs.
    for (let t = 0; t < 40; t++) expect(whisperLineIndex(t + 4, 7, 4)).not.toBe(whisperLineIndex(t, 7, 4));
  });

  it("degenerate tables are safe", () => {
    expect(whisperLineIndex(9, 3, 1)).toBe(0);
    expect(whisperLineIndex(9, 3, 0)).toBe(0);
  });
});

describe("whisper variety: in play", () => {
  it("each sender cycles through its culture's lines over successive whispers", () => {
    for (const seed of [1, 6, 13]) {
      for (const s of [fresh(seed), fourNpcs(seed)]) {
        const npcs = s.realms.length - 1;
        // turn = how many times this sender has had the floor; lines come in blocks of 4 turns.
        const blocks = new Map<string, number[]>();
        const seq = new Map<string, number[]>();
        for (const w of run(s, 600)) {
          const round = Math.floor(w.tick / 100) / WHISPER_PULSES;
          const block = Math.floor(Math.floor((round + s.meta.seed) / npcs) / 4);
          const k = `${w.fromRealmId}#${block}`;
          blocks.set(k, [...(blocks.get(k) ?? []), lineOf(s, w)]);
          seq.set(w.fromRealmId, [...(seq.get(w.fromRealmId) ?? []), lineOf(s, w)]);
        }
        for (const [k, idx] of blocks) {
          expect(new Set(idx).size, k).toBe(idx.length);
        }
        for (const [from, idx] of seq) {
          expect(idx.length, from).toBeGreaterThanOrEqual(8);
          expect(new Set(idx).size, from).toBe(4);
          for (let i = 1; i < idx.length; i++) expect(idx[i], from).not.toBe(idx[i - 1]);
        }
      }
    }
  });

  it("the player hears different lines from the same sender (listeners = lines)", () => {
    for (const seed of [2, 9]) {
      const s = fourNpcs(seed);
      const toPlayer = run(s, 1800).filter((w) => w.toRealmId === "player");
      for (const [from, idx] of bySender(s, toPlayer)) {
        expect(idx.length, from).toBeGreaterThanOrEqual(4);
        expect(new Set(idx).size, from).toBeGreaterThan(1);
      }
    }
  });

  it("the old picker repeats one line per sender with 4 senders; variety fixes it", () => {
    const old = fourNpcs(3);
    setLivingSwitch(old, "whisperVariety", false);
    for (const idx of bySender(old, run(old, 600)).values()) expect(new Set(idx).size).toBe(1);
    const neu = fourNpcs(3);
    for (const idx of bySender(neu, run(neu, 600)).values()) expect(new Set(idx).size).toBe(4);
  });

  it("does not change who sends, to whom, when, or how many", () => {
    for (const seed of [1, 6, 22]) {
      for (const make of [fresh, fourNpcs]) {
        const a = make(seed);
        const b = make(seed);
        setLivingSwitch(b, "whisperVariety", false);
        const key = (w: CultureNews) => `${w.tick}|${w.fromRealmId}|${w.toRealmId}`;
        expect(run(a, 900).map(key)).toEqual(run(b, 900).map(key));
        expect(livingCounts(a).whispers).toBe(livingCounts(b).whispers);
      }
    }
  });

  it("off restores the old line picker exactly", () => {
    const s = fourNpcs(5);
    setLivingSwitch(s, "whisperVariety", false);
    for (const w of run(s, 300)) {
      const round = Math.floor(w.tick / 100) / WHISPER_PULSES;
      let salt = 0;
      for (let i = 0; i < w.fromRealmId.length; i++) salt = (salt + w.fromRealmId.charCodeAt(i) * (i + 3)) % 997;
      expect(lineOf(s, w)).toBe((round + salt) % whisperLinesFor(cultureOfRealm(s, w.fromRealmId)).length);
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

  it("counts distinct lines said, and variety says more of them", () => {
    const s = fourNpcs(3);
    expect(distinctWhisperLines(s)).toBe(0);
    run(s, 600);
    const old = fourNpcs(3);
    setLivingSwitch(old, "whisperVariety", false);
    run(old, 600);
    expect(livingCounts(s).distinctWhisperLines).toBe(distinctWhisperLines(s));
    expect(distinctWhisperLines(s)).toBeGreaterThan(distinctWhisperLines(old));
  });
});

describe("column ranks", () => {
  it("maps phase to 1, 2, 3, 1", () => {
    expect(columnRanks("columns")).toBe(1);
    expect(columnRanks("skirmish")).toBe(2);
    expect(columnRanks("clash")).toBe(3);
    expect(columnRanks("aftermath")).toBe(1);
    expect(COLUMN_RANKS).toEqual({ column: 1, "skirmish-line": 2, "clash-line": 3, "falling-back": 1 });
  });

  it("columnMarkSnapshot carries ranks through every phase", () => {
    const s = fresh(1);
    const [a, d] = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
    const npc: WarInstance = { id: `war_npc_${a}_${d}_${T0}`, attackerRealmId: a, defenderRealmId: d, startedTick: T0, status: "active" };
    s.wars.push(npc);
    joinSide(s, npc.id, "attacker");
    expect(columnMarkSnapshot(s, T0)).toMatchObject({ column: "column", ranks: 1 });
    expect(columnMarkSnapshot(s, T0 + WAR_PHASE_START.skirmish)).toMatchObject({ column: "skirmish-line", ranks: 2 });
    expect(columnMarkSnapshot(s, T0 + WAR_PHASE_START.clash)).toMatchObject({ column: "clash-line", ranks: 3 });
    s.meta.tick = T0 + WAR_PHASE_START.clash;
    settleNpcWars(s, s.meta.tick);
    expect(tryWhitePeace(s)).toBe(true);
    expect(columnMarkSnapshot(s)).toMatchObject({ column: "falling-back", ranks: 1, active: false });
  });
});

describe("next-whisper hint", () => {
  it("gives the next whisper pulse after now", () => {
    const s = fresh(1);
    expect(nextWhisperHint(s)).toEqual({ tick: T0, nextPulseTick: 20400, secondsApprox: 30 });
    s.meta.tick = 20400;
    expect(nextWhisperHint(s)).toEqual({ tick: 20400, nextPulseTick: 20700, secondsApprox: 30 });
    s.meta.tick = 20695;
    expect(nextWhisperHint(s)).toEqual({ tick: 20695, nextPulseTick: 20700, secondsApprox: 1 });
    s.meta.tick = 0;
    expect(nextWhisperHint(s)!.nextPulseTick).toBe(300);
  });

  it("matches when maybeWhisper actually fires", () => {
    const s = fresh(4);
    const h = nextWhisperHint(s)!;
    for (let t = Math.ceil((h.tick + 1) / 100) * 100; t < h.nextPulseTick; t += 100) expect(maybeWhisper(s, t)).toBeNull();
    expect(maybeWhisper(s, h.nextPulseTick)).not.toBeNull();
  });

  it("null with whispers off or no NPC realm", () => {
    const s = fresh(1);
    setLivingSwitch(s, "whispers", false);
    expect(nextWhisperHint(s)).toBeNull();
    const t = fresh(1);
    t.realms = t.realms.filter((r) => r.id === "player");
    expect(nextWhisperHint(t)).toBeNull();
  });

  it("does not depend on the variety switch", () => {
    const s = fresh(1);
    setLivingSwitch(s, "whisperVariety", false);
    expect(nextWhisperHint(s)).toEqual({ tick: T0, nextPulseTick: 20400, secondsApprox: 30 });
  });

  it("is read-only", () => {
    const s = fresh(1);
    const before = JSON.stringify(s);
    nextWhisperHint(s);
    expect(JSON.stringify(s)).toBe(before);
  });
});
