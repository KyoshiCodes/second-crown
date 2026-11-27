import { describe, it, expect } from "vitest";
import type { GameState, WarInstance } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { tryWhitePeace } from "../actions/war.js";
import { cultureOfRealm } from "./culture.js";
import {
  LIVING_SWITCH_FLAGS,
  columnMarkSnapshot,
  joinSide,
  livingCounts,
  livingSwitches,
  maybeWhisper,
  nextWhisperHint,
  ranksLabel,
  setLivingSwitch,
  settleNpcWars,
  tickCorrespondence,
  type CultureNews,
} from "./livingRealm.js";
import {
  RANKS_LABEL,
  WAR_PHASE_START,
  WHISPERS,
  WHISPERS_PLAIN,
  WHISPER_REPLIES,
  WHISPER_REPLIES_PLAIN,
  whisperLinesFor,
  whisperReplyLinesFor,
} from "../content/livingRealm.js";

const T0 = 20100;
const NPC_CULTURES = ["western", "woodland", "desert", "steppe", "tide"];

function fresh(seed: number): GameState {
  const s = createGameState({ seed, now: 1 });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  for (const k of Object.keys(s.flags)) if (k.startsWith("peace_")) delete s.flags[k];
  return s;
}

/** Whispers and NPC replies over `pulses` world pulses from T0. */
function run(s: GameState, pulses: number): CultureNews[] {
  const out: CultureNews[] = [];
  for (let p = T0 / 100; p < T0 / 100 + pulses; p++) {
    out.push(...tickCorrespondence(s, p * 100));
    const w = maybeWhisper(s, p * 100);
    if (w) out.push(w);
  }
  return out;
}

function said(n: CultureNews): string {
  return n.text.slice(n.text.indexOf(': "') + 3, -1);
}

/** Index of the line used, in the voiced or plain table of the sender's culture. */
function lineOf(s: GameState, n: CultureNews, voiced: boolean): number {
  const toName = s.realms.find((r) => r.id === n.toRealmId)!.name;
  const culture = cultureOfRealm(s, n.fromRealmId);
  const lines = n.kind === "whisper" ? whisperLinesFor(culture, voiced) : whisperReplyLinesFor(culture, voiced);
  const i = lines.findIndex((l) => l.replace(/\{to\}/g, toName) === said(n));
  expect(i, n.text).toBeGreaterThanOrEqual(0);
  return i;
}

describe("culture voice: switch and tables", () => {
  it("has living_culture_voice, on by default", () => {
    const s = fresh(1);
    expect(LIVING_SWITCH_FLAGS.cultureVoice).toBe("living_culture_voice");
    expect(livingSwitches(s).cultureVoice).toBe(true);
  });

  it("keeps every table at 4 lines, voiced and plain, for all five NPC cultures", () => {
    for (const t of [WHISPERS, WHISPERS_PLAIN, WHISPER_REPLIES, WHISPER_REPLIES_PLAIN]) {
      expect(Object.keys(t).sort()).toEqual([...NPC_CULTURES].sort());
      for (const c of NPC_CULTURES) expect(t[c].length).toBe(4);
    }
  });

  it("voiced lines are new and distinct across cultures", () => {
    for (const [voiced, plain] of [
      [WHISPERS, WHISPERS_PLAIN],
      [WHISPER_REPLIES, WHISPER_REPLIES_PLAIN],
    ] as const) {
      const all = NPC_CULTURES.flatMap((c) => voiced[c]);
      expect(new Set(all).size).toBe(all.length);
      const old = new Set(NPC_CULTURES.flatMap((c) => plain[c]));
      for (const l of all) expect(old.has(l), l).toBe(false);
    }
  });

  it("player-only cultures fall back to western in both voices", () => {
    expect(whisperLinesFor("mist")).toBe(WHISPERS.western);
    expect(whisperLinesFor("mist", false)).toBe(WHISPERS_PLAIN.western);
    expect(whisperReplyLinesFor("peak")).toBe(WHISPER_REPLIES.western);
    expect(whisperReplyLinesFor("peak", false)).toBe(WHISPER_REPLIES_PLAIN.western);
  });
});

describe("culture voice: in play", () => {
  it("whispers and replies use the voiced tables when on, the plain ones when off", () => {
    const on = fresh(3);
    const off = fresh(3);
    setLivingSwitch(off, "cultureVoice", false);
    const a = run(on, 600);
    const b = run(off, 600);
    expect(a.some((n) => n.kind === "reply")).toBe(true);
    for (const n of a) lineOf(on, n, true);
    for (const n of b) lineOf(off, n, false);
  });

  it("does not change cadence, senders, listeners, line index, or counts", () => {
    for (const seed of [1, 6, 22]) {
      const a = fresh(seed);
      const b = fresh(seed);
      setLivingSwitch(b, "cultureVoice", false);
      const ra = run(a, 900);
      const rb = run(b, 900);
      const key = (s: GameState, voiced: boolean) => (n: CultureNews) =>
        `${n.kind}|${n.tick}|${n.fromRealmId}|${n.toRealmId}|${lineOf(s, n, voiced)}`;
      expect(ra.map(key(a, true))).toEqual(rb.map(key(b, false)));
      const ca = livingCounts(a);
      const cb = livingCounts(b);
      expect(ca.whispers).toBe(cb.whispers);
      expect(ca.replies).toBe(cb.replies);
      expect(ca.playerWhispers).toBe(cb.playerWhispers);
      expect(ca.distinctWhisperLines).toBe(cb.distinctWhisperLines);
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
});

describe("next-whisper hint: from tag", () => {
  it("names the sender maybeWhisper then uses", () => {
    for (const seed of [1, 4, 9, 22]) {
      const s = fresh(seed);
      for (let k = 0; k < 8; k++) {
        const h = nextWhisperHint(s)!;
        expect(h.fromRealmId).not.toBeNull();
        const w = maybeWhisper(s, h.nextPulseTick)!;
        expect(w.fromRealmId).toBe(h.fromRealmId);
        expect(h.fromName).toBe(s.realms.find((r) => r.id === w.fromRealmId)!.name);
        expect(h.fromCulture).toBe(cultureOfRealm(s, w.fromRealmId));
        s.meta.tick = h.nextPulseTick;
      }
    }
  });

  it("keeps the timing fields", () => {
    const s = fresh(1);
    expect(nextWhisperHint(s)).toMatchObject({ tick: T0, nextPulseTick: 20400, secondsApprox: 30 });
  });

  it("nulls the sender, keeps the seconds, when the sender has no listener", () => {
    const s = fresh(1);
    const npc = s.realms.find((r) => r.id !== "player")!;
    s.realms = s.realms.filter((r) => r.id === "player" || r.id === npc.id);
    const war: WarInstance = { id: `war_${npc.id}_${T0}`, attackerRealmId: npc.id, defenderRealmId: "player", startedTick: T0, status: "active" };
    s.wars.push(war);
    const h = nextWhisperHint(s)!;
    expect(h).toEqual({ tick: T0, nextPulseTick: 20400, secondsApprox: 30, fromRealmId: null, fromName: null, fromCulture: null });
    expect(maybeWhisper(s, h.nextPulseTick)).toBeNull();
  });

  it("is read-only, even for an NPC whose culture flag is not yet seeded", () => {
    const s = fresh(1);
    for (const k of Object.keys(s.flags)) if (k.startsWith("culture_")) delete s.flags[k];
    const before = JSON.stringify(s);
    const h = nextWhisperHint(s)!;
    expect(JSON.stringify(s)).toBe(before);
    expect(h.fromCulture).toBe(cultureOfRealm(s, h.fromRealmId!));
  });

  it("still null with whispers off", () => {
    const s = fresh(1);
    setLivingSwitch(s, "whispers", false);
    expect(nextWhisperHint(s)).toBeNull();
  });
});

describe("rank note", () => {
  it("maps 1, 2, 3 to one rank, two ranks, three ranks", () => {
    expect(ranksLabel(1)).toBe("one rank");
    expect(ranksLabel(2)).toBe("two ranks");
    expect(ranksLabel(3)).toBe("three ranks");
    expect(RANKS_LABEL).toEqual({ 1: "one rank", 2: "two ranks", 3: "three ranks" });
  });

  it("columnMarkSnapshot carries ranksLabel from ranks, phase timing unchanged", () => {
    const s = fresh(1);
    const [a, d] = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
    const npc: WarInstance = { id: `war_npc_${a}_${d}_${T0}`, attackerRealmId: a, defenderRealmId: d, startedTick: T0, status: "active" };
    s.wars.push(npc);
    joinSide(s, npc.id, "attacker");
    expect(columnMarkSnapshot(s, T0)).toMatchObject({ column: "column", ranks: 1, ranksLabel: "one rank" });
    expect(columnMarkSnapshot(s, T0 + WAR_PHASE_START.skirmish - 1)).toMatchObject({ ranks: 1, ranksLabel: "one rank" });
    expect(columnMarkSnapshot(s, T0 + WAR_PHASE_START.skirmish)).toMatchObject({ ranks: 2, ranksLabel: "two ranks" });
    expect(columnMarkSnapshot(s, T0 + WAR_PHASE_START.clash)).toMatchObject({ ranks: 3, ranksLabel: "three ranks" });
    s.meta.tick = T0 + WAR_PHASE_START.clash;
    settleNpcWars(s, s.meta.tick);
    expect(tryWhitePeace(s)).toBe(true);
    const m = columnMarkSnapshot(s)!;
    expect(m).toMatchObject({ column: "falling-back", ranks: 1, ranksLabel: "one rank", active: false });
    expect(m.ranksLabel).toBe(ranksLabel(m.ranks));
  });
});
