import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import {
  LIVING_SWITCH_FLAGS,
  getCultureNews,
  lastWhisperSummary,
  livingCounts,
  livingSwitches,
  maybeWhisper,
  replyToWhisper,
  replyableWhispers,
  setLivingSwitch,
  tickCorrespondence,
  type CultureNews,
} from "./livingRealm.js";
import { peekCultureOfRealm } from "./culture.js";
import {
  PLAYER_REPLIES,
  PLAYER_REPLIES_NPC_ONLY,
  PLAYER_REPLIES_PLAIN,
  WHISPER_PULSES,
  playerReplyLinesFor,
} from "../content/livingRealm.js";

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

/** Run whispers and correspondence over many pulses; return the trace and counts. */
function run(s: GameState, pulses = 400): { trace: string[]; counts: ReturnType<typeof livingCounts> } {
  const trace: string[] = [];
  for (let pulse = T0 / 100; pulse < T0 / 100 + pulses; pulse++) {
    const at = pulse * 100;
    const w = maybeWhisper(s, at);
    if (w) trace.push(`w ${w.tick} ${w.fromRealmId}>${w.toRealmId}`);
    for (const r of tickCorrespondence(s, at)) trace.push(`r ${r.tick} ${r.fromRealmId}>${r.toRealmId}`);
  }
  return { trace, counts: livingCounts(s) };
}

describe("player-only reply voice: switch and tables", () => {
  it("has living_player_only_voice, on by default", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.playerOnlyVoice).toBe("living_player_only_voice");
    expect(livingSwitches(s).playerOnlyVoice).toBe(true);
    setLivingSwitch(s, "playerOnlyVoice", false);
    expect(s.flags.living_player_only_voice).toBe(false);
    expect(livingSwitches(s).playerOnlyVoice).toBe(false);
  });

  it("the five player-only cultures are rewritten: 4 distinct non-empty lines, none from the old table", () => {
    for (const c of PLAYER_ONLY) {
      const v = PLAYER_REPLIES[c];
      expect(v, c).toHaveLength(4);
      expect(new Set(v).size).toBe(4);
      for (const line of v) {
        expect(line.trim().length).toBeGreaterThan(0);
        expect(PLAYER_REPLIES_PLAIN[c]).not.toContain(line);
      }
      expect(v.some((l) => l.includes("{to}")), c).toBe(true);
    }
  });

  it("NPC culture lines are untouched by this slice", () => {
    for (const c of NPC_CULTURES) expect(PLAYER_REPLIES[c]).toEqual(PLAYER_REPLIES_NPC_ONLY[c]);
  });

  it("each player-only culture keeps its own imagery", () => {
    const has = (c: string, re: RegExp) => expect(PLAYER_REPLIES[c].some((l) => re.test(l)), c).toBe(true);
    has("mist", /fog|mist|rain/);
    has("glen", /cairn|stone/);
    has("salt", /salt|plank|yard/);
    has("fen", /reed|punt|fen/);
    has("peak", /keep|watch|pass/);
  });

  it("playerReplyLinesFor: on → voiced, player-only off → slice 11 lines, reply voice off → plain", () => {
    for (const c of PLAYER_ONLY) {
      expect(playerReplyLinesFor(c)).toBe(PLAYER_REPLIES[c]);
      expect(playerReplyLinesFor(c, true, false)).toBe(PLAYER_REPLIES_NPC_ONLY[c]);
      expect(playerReplyLinesFor(c, true, false)).toEqual(PLAYER_REPLIES_PLAIN[c]);
      expect(playerReplyLinesFor(c, false)).toBe(PLAYER_REPLIES_PLAIN[c]);
      expect(playerReplyLinesFor(c, false, true)).toBe(PLAYER_REPLIES_PLAIN[c]);
    }
    expect(playerReplyLinesFor("nope", true, false)).toBe(PLAYER_REPLIES.western);
  });

  it("replyableWhispers and replyToWhisper use the new lines on, previous lines off", () => {
    for (const on of [true, false]) {
      const s = fresh();
      s.flags.culture = "fen";
      if (!on) setLivingSwitch(s, "playerOnlyVoice", false);
      const w = playerWhisper(s);
      const to = s.realms.find((r) => r.id === w.fromRealmId)!.name;
      const table = on ? PLAYER_REPLIES : PLAYER_REPLIES_PLAIN;
      const expected = table.fen.map((l) => l.replace(/\{to\}/g, to));
      expect(replyableWhispers(s)[0].lines).toEqual(expected);
      const r = replyToWhisper(s, w.id, 1)!;
      expect(r.text.endsWith(`"${expected[1]}"`)).toBe(true);
      // one-reply rule unchanged
      expect(replyToWhisper(s, w.id, 0)).toBeNull();
    }
  });

  it("whisper cadence, recipients and counts are unchanged by the flag", () => {
    for (const seed of [1, 4, 9]) {
      const a = fresh(seed);
      a.flags.culture = "peak";
      const b = fresh(seed);
      b.flags.culture = "peak";
      setLivingSwitch(b, "playerOnlyVoice", false);
      expect(run(a)).toEqual(run(b));
    }
  });

  it("is deterministic", () => {
    const go = () => {
      const s = fresh();
      s.flags.culture = "glen";
      const w = playerWhisper(s);
      replyToWhisper(s, w.id, 3);
      return JSON.stringify(s);
    };
    expect(go()).toBe(go());
  });
});

describe("lastWhisperSummary", () => {
  it("is null when the player has received no whisper", () => {
    const s = fresh();
    expect(lastWhisperSummary(s)).toBeNull();
  });

  it("returns the newest whisper to the player with the exact shape", () => {
    const s = fresh();
    const w = playerWhisper(s);
    const sum = lastWhisperSummary(s)!;
    expect(Object.keys(sum).sort()).toEqual(["fromCulture", "fromName", "fromRealmId", "text", "tick"]);
    expect(sum).toEqual({
      tick: w.tick,
      fromRealmId: w.fromRealmId,
      fromName: s.realms.find((r) => r.id === w.fromRealmId)!.name,
      fromCulture: peekCultureOfRealm(s, w.fromRealmId),
      text: w.text,
    });
  });

  it("tracks the newest whisper to the player and skips whispers, replies and caravans to others", () => {
    const s = fresh();
    let last: CultureNews | null = null;
    for (let pulse = T0 / 100; pulse < T0 / 100 + 300; pulse++) {
      const w = maybeWhisper(s, pulse * 100);
      tickCorrespondence(s, pulse * 100);
      if (w && w.toRealmId === "player") last = w;
      const sum = lastWhisperSummary(s);
      const inNews = last && getCultureNews(s).some((n) => n.kind === "whisper" && n.tick === last!.tick && n.toRealmId === "player");
      if (inNews) expect(sum!.tick).toBe(last!.tick);
      else expect(sum).toBeNull();
    }
    expect(last).not.toBeNull();
  });

  it("is read-only and works with whispers switched off afterwards", () => {
    const s = fresh();
    playerWhisper(s);
    setLivingSwitch(s, "whispers", false);
    const before = JSON.stringify(s);
    const sum = lastWhisperSummary(s);
    expect(sum).not.toBeNull();
    expect(JSON.stringify(s)).toBe(before);
  });

  it("falls back to the realm id when the sender realm is gone", () => {
    const s = fresh();
    const w = playerWhisper(s);
    s.realms = s.realms.filter((r) => r.id !== w.fromRealmId);
    expect(lastWhisperSummary(s)!.fromName).toBe(w.fromRealmId);
  });
});
