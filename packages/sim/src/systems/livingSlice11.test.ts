import { describe, it, expect } from "vitest";
import type { GameState, WarInstance } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { tryWhitePeace } from "../actions/war.js";
import {
  LIVING_SWITCH_FLAGS,
  columnMarkSnapshot,
  joinSide,
  livingSwitches,
  maybeWhisper,
  nextWhisperHint,
  ranksNote,
  replyToWhisper,
  replyableWhispers,
  setLivingSwitch,
  settleNpcWars,
  type CultureNews,
} from "./livingRealm.js";
import {
  PLAYER_REPLIES,
  PLAYER_REPLIES_PLAIN,
  PLAYER_REPLIES_NPC_ONLY,
  RANKS_NOTE,
  WAR_PHASE_START,
  WHISPER_PULSES,
  playerReplyLinesFor,
} from "../content/livingRealm.js";
import { CULTURES } from "../content/cultures.js";

const T0 = 20100;
const NPC_CULTURES = ["western", "woodland", "desert", "steppe", "tide"];
const PLAYER_ONLY = ["mist", "glen", "salt", "fen", "peak"];

function fresh(seed = 1): GameState {
  const s = createGameState({ seed, now: 1 });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  for (const k of Object.keys(s.flags)) if (k.startsWith("peace_")) delete s.flags[k];
  return s;
}

function playerWhisper(s: GameState): CultureNews & { id: string } {
  for (let pulse = T0 / 100; pulse < T0 / 100 + 600; pulse += WHISPER_PULSES) {
    const w = maybeWhisper(s, pulse * 100);
    if (w && w.toRealmId === "player") {
      s.meta.tick = w.tick + 10;
      return w as CultureNews & { id: string };
    }
  }
  throw new Error("no whisper to the player found");
}

describe("player reply voice: switch and tables", () => {
  it("has living_player_reply_voice, on by default", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.playerReplyVoice).toBe("living_player_reply_voice");
    expect(livingSwitches(s).playerReplyVoice).toBe(true);
    setLivingSwitch(s, "playerReplyVoice", false);
    expect(s.flags.living_player_reply_voice).toBe(false);
  });

  it("every culture has 4 lines in both tables; same keys", () => {
    expect(Object.keys(PLAYER_REPLIES).sort()).toEqual(Object.keys(PLAYER_REPLIES_PLAIN).sort());
    for (const c of CULTURES) {
      expect(PLAYER_REPLIES[c.id], c.id).toHaveLength(4);
      expect(PLAYER_REPLIES_PLAIN[c.id], c.id).toHaveLength(4);
    }
  });

  it("the five NPC cultures are rewritten, distinct and non-empty; player-only cultures unchanged in the slice 11 table", () => {
    for (const c of NPC_CULTURES) {
      const v = PLAYER_REPLIES[c];
      expect(new Set(v).size).toBe(4);
      for (const line of v) {
        expect(line.trim().length).toBeGreaterThan(0);
        expect(PLAYER_REPLIES_PLAIN[c]).not.toContain(line);
      }
    }
    for (const c of PLAYER_ONLY) expect(PLAYER_REPLIES_NPC_ONLY[c]).toEqual(PLAYER_REPLIES_PLAIN[c]);
  });

  it("steppe stays clipped: no line over 40 characters", () => {
    for (const line of PLAYER_REPLIES.steppe) expect(line.length).toBeLessThanOrEqual(40);
  });

  it("playerReplyLinesFor picks the table by flag; unknown culture uses western", () => {
    expect(playerReplyLinesFor("tide")).toBe(PLAYER_REPLIES.tide);
    expect(playerReplyLinesFor("tide", false)).toBe(PLAYER_REPLIES_PLAIN.tide);
    expect(playerReplyLinesFor("nope")).toBe(PLAYER_REPLIES.western);
    expect(playerReplyLinesFor("nope", false)).toBe(PLAYER_REPLIES_PLAIN.western);
  });

  it("replyableWhispers and replyToWhisper use the voiced lines on, plain lines off", () => {
    for (const on of [true, false]) {
      const s = fresh();
      s.flags.culture = "steppe";
      if (!on) setLivingSwitch(s, "playerReplyVoice", false);
      const w = playerWhisper(s);
      const to = s.realms.find((r) => r.id === w.fromRealmId)!.name;
      const table = on ? PLAYER_REPLIES : PLAYER_REPLIES_PLAIN;
      const expected = table.steppe.map((l) => l.replace(/\{to\}/g, to));
      expect(replyableWhispers(s)[0].lines).toEqual(expected);
      const r = replyToWhisper(s, w.id, 3)!;
      expect(r.text.endsWith(`"${expected[3]}"`)).toBe(true);
      expect(replyToWhisper(s, w.id, 0)).toBeNull();
    }
  });

  it("is deterministic", () => {
    const go = () => {
      const s = fresh();
      s.flags.culture = "desert";
      const w = playerWhisper(s);
      replyToWhisper(s, w.id, 2);
      return JSON.stringify(s);
    };
    expect(go()).toBe(go());
  });
});

describe("next-whisper hint: fromName contract", () => {
  it("fromName is the sender realm's display name whenever fromRealmId is set", () => {
    for (const seed of [1, 2, 4, 9, 22, 31]) {
      const s = fresh(seed);
      for (let k = 0; k < 10; k++) {
        const h = nextWhisperHint(s)!;
        if (h.fromRealmId !== null) {
          expect(h.fromName).toBe(s.realms.find((r) => r.id === h.fromRealmId)!.name);
        } else {
          expect(h.fromName).toBeNull();
        }
        s.meta.tick = h.nextPulseTick;
      }
    }
  });

  it("fromName is null exactly when fromRealmId is null", () => {
    const s = fresh(1);
    const npc = s.realms.find((r) => r.id !== "player")!;
    s.realms = s.realms.filter((r) => r.id === "player" || r.id === npc.id);
    const war: WarInstance = { id: `war_${npc.id}_${T0}`, attackerRealmId: npc.id, defenderRealmId: "player", startedTick: T0, status: "active" };
    s.wars.push(war);
    const h = nextWhisperHint(s)!;
    expect(h.fromRealmId).toBeNull();
    expect(h.fromName).toBeNull();
  });
});

describe("ranks note", () => {
  it("maps phases to one word", () => {
    expect(RANKS_NOTE).toEqual({ columns: "column", skirmish: "skirmish", clash: "clash", aftermath: "falling-back" });
    expect(ranksNote("columns")).toBe("column");
    expect(ranksNote("skirmish")).toBe("skirmish");
    expect(ranksNote("clash")).toBe("clash");
    expect(ranksNote("aftermath")).toBe("falling-back");
  });

  it("columnMarkSnapshot carries ranksNote from the phase; phase timing unchanged", () => {
    const s = fresh(1);
    const [a, d] = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
    const npc: WarInstance = { id: `war_npc_${a}_${d}_${T0}`, attackerRealmId: a, defenderRealmId: d, startedTick: T0, status: "active" };
    s.wars.push(npc);
    joinSide(s, npc.id, "attacker");
    expect(columnMarkSnapshot(s, T0)).toMatchObject({ phase: "columns", ranksNote: "column" });
    expect(columnMarkSnapshot(s, T0 + WAR_PHASE_START.skirmish - 1)).toMatchObject({ phase: "columns", ranksNote: "column" });
    expect(columnMarkSnapshot(s, T0 + WAR_PHASE_START.skirmish)).toMatchObject({ phase: "skirmish", ranksNote: "skirmish" });
    expect(columnMarkSnapshot(s, T0 + WAR_PHASE_START.clash)).toMatchObject({ phase: "clash", ranksNote: "clash" });
    s.meta.tick = T0 + WAR_PHASE_START.clash;
    settleNpcWars(s, s.meta.tick);
    expect(tryWhitePeace(s)).toBe(true);
    const m = columnMarkSnapshot(s)!;
    expect(m).toMatchObject({ phase: "aftermath", ranksNote: "falling-back", active: false });
  });

  it("is read-only", () => {
    const s = fresh(1);
    const [a, d] = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
    s.wars.push({ id: `war_npc_${a}_${d}_${T0}`, attackerRealmId: a, defenderRealmId: d, startedTick: T0, status: "active" });
    joinSide(s, s.wars[0].id, "attacker");
    const before = JSON.stringify(s);
    columnMarkSnapshot(s, T0 + WAR_PHASE_START.clash);
    expect(JSON.stringify(s)).toBe(before);
  });
});
