import { describe, it, expect } from "vitest";
import type { GameState, WarInstance } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { tryWhitePeace } from "../actions/war.js";
import {
  LIVING_SWITCH_FLAGS,
  formationSnapshot,
  getCultureNews,
  getPendingReplies,
  joinSide,
  livingCounts,
  livingSwitches,
  maybeWhisper,
  replyToWhisper,
  replyableWhispers,
  setLivingSwitch,
  settleNpcWars,
  tickCorrespondence,
  type CultureNews,
} from "./livingRealm.js";
import {
  PLAYER_REPLIES,
  WAR_AFTERMATH_TICKS,
  WAR_PHASE_START,
  WHISPER_PULSES,
  WHISPER_REPLY_DELAY_TICKS,
  playerReplyLinesFor,
} from "../content/livingRealm.js";
import { CULTURES } from "../content/cultures.js";

/** Seed 1: the player hears whispers early (some seeds never pick the player as a listener). */
const SEED = 1;
const T0 = 20100;

function fresh(): GameState {
  const s = createGameState({ seed: SEED, now: 1 });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  for (const k of Object.keys(s.flags)) if (k.startsWith("peace_")) delete s.flags[k];
  return s;
}

/** First whisper pulse at or after T0 whose whisper goes to the player; advances meta.tick to it. */
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

const name = (s: GameState, id: string) => s.realms.find((r) => r.id === id)!.name;

describe("player reply: table and switch", () => {
  it("every culture has 3–5 fixed lines", () => {
    for (const c of CULTURES) {
      const lines = PLAYER_REPLIES[c.id];
      expect(lines, c.id).toBeDefined();
      expect(lines.length).toBeGreaterThanOrEqual(3);
      expect(lines.length).toBeLessThanOrEqual(5);
    }
    expect(playerReplyLinesFor("nope")).toBe(PLAYER_REPLIES.western);
  });

  it("has living_player_reply, on by default; off hides and refuses the action", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.playerReply).toBe("living_player_reply");
    expect(livingSwitches(s).playerReply).toBe(true);
    const w = playerWhisper(s);
    setLivingSwitch(s, "playerReply", false);
    expect(replyableWhispers(s)).toEqual([]);
    expect(replyToWhisper(s, w.id, 0)).toBeNull();
    setLivingSwitch(s, "playerReply", true);
    expect(replyableWhispers(s).map((r) => r.whisper.id)).toEqual([w.id]);
  });
});

describe("player reply: one reply per whisper, news shape", () => {
  it("adds one reply with the same shape as an NPC reply, newest in the list", () => {
    const s = fresh();
    const w = playerWhisper(s);
    const lines = replyableWhispers(s)[0].lines;
    expect(lines.length).toBe(playerReplyLinesFor(String(s.flags.culture ?? "western")).length);
    const r = replyToWhisper(s, w.id, 1)!;
    expect(r).toEqual({
      tick: s.meta.tick,
      kind: "reply",
      fromRealmId: "player",
      toRealmId: w.fromRealmId,
      text: `${name(s, "player")} answers ${name(s, w.fromRealmId)}: "${lines[1]}"`,
      replyTo: w.id,
    });
    expect(Object.keys(r).sort()).toEqual(["fromRealmId", "kind", "replyTo", "text", "tick", "toRealmId"]);
    const news = getCultureNews(s);
    expect(news[news.length - 1]).toEqual(r);
    expect(r.text).not.toMatch(/\{to\}/);
    expect(livingCounts(s).playerReplies).toBe(1);
    expect(s.inputLog.at(-1)).toMatchObject({ type: "reply_whisper", payload: { whisperId: w.id, lineIndex: 1 } });
  });

  it("refuses a second reply to the same whisper", () => {
    const s = fresh();
    const w = playerWhisper(s);
    expect(replyToWhisper(s, w.id, 0)).not.toBeNull();
    const before = JSON.stringify(s);
    expect(replyToWhisper(s, w.id, 2)).toBeNull();
    expect(JSON.stringify(s)).toBe(before);
    expect(replyableWhispers(s)).toEqual([]);
  });

  it("never auto-replies: whispers to the player queue no reply and pulses send none", () => {
    const s = fresh();
    const w = playerWhisper(s);
    expect(getPendingReplies(s).some((p) => p.whisperId === w.id)).toBe(false);
    tickCorrespondence(s, w.tick + WHISPER_REPLY_DELAY_TICKS);
    expect(getCultureNews(s).some((n) => n.replyTo === w.id)).toBe(false);
    expect(replyableWhispers(s).map((r) => r.whisper.id)).toContain(w.id);
  });

  it("is deterministic: the same picks give the same news", () => {
    const go = () => {
      const s = fresh();
      const w = playerWhisper(s);
      replyToWhisper(s, w.id, 2);
      return s.flags.culture_news;
    };
    expect(go()).toBe(go());
  });
});

describe("player reply: refuse cases", () => {
  it("unknown whisper, NPC-to-NPC whisper, bad line index", () => {
    const s = fresh();
    const w = playerWhisper(s);
    expect(replyToWhisper(s, "wh_nope", 0)).toBeNull();
    const npcItem = getCultureNews(s).find((n) => n.kind === "whisper" && n.toRealmId !== "player" && n.id);
    if (npcItem?.id) expect(replyToWhisper(s, npcItem.id, 0)).toBeNull();
    const n = replyableWhispers(s)[0].lines.length;
    for (const bad of [-1, n, 1.5, Number.NaN]) expect(replyToWhisper(s, w.id, bad)).toBeNull();
    expect(livingCounts(s).playerReplies).toBe(0);
  });

  it("at war with the sender", () => {
    const s = fresh();
    const w = playerWhisper(s);
    const war: WarInstance = { id: "w_test", attackerRealmId: w.fromRealmId, defenderRealmId: "player", startedTick: s.meta.tick, status: "active" };
    s.wars.push(war);
    expect(replyableWhispers(s)).toEqual([]);
    expect(replyToWhisper(s, w.id, 0)).toBeNull();
  });

  it("under a peace lock with the sender, either direction", () => {
    const s = fresh();
    const w = playerWhisper(s);
    s.flags[`peace_${w.fromRealmId}_player`] = s.meta.tick + 500;
    expect(replyToWhisper(s, w.id, 0)).toBeNull();
    delete s.flags[`peace_${w.fromRealmId}_player`];
    s.flags[`peace_player_${w.fromRealmId}`] = s.meta.tick + 500;
    expect(replyToWhisper(s, w.id, 0)).toBeNull();
    s.meta.tick += 500;
    expect(replyToWhisper(s, w.id, 0)).not.toBeNull();
  });
});

describe("formation snapshot", () => {
  function joined() {
    const s = fresh();
    const [a, d] = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
    const npc: WarInstance = { id: `war_npc_${a}_${d}_${T0}`, attackerRealmId: a, defenderRealmId: d, startedTick: T0, status: "active" };
    s.wars.push(npc);
    const pw = joinSide(s, npc.id, "attacker")!;
    return { s, a, d, npc, pw };
  }

  it("empty without a joined war; NPC wars alone do not show", () => {
    const s = fresh();
    expect(formationSnapshot(s)).toEqual([]);
    const [a, d] = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
    s.wars.push({ id: "war_npc_x", attackerRealmId: a, defenderRealmId: d, startedTick: T0, status: "active" });
    expect(formationSnapshot(s)).toEqual([]);
  });

  it("two sides, phase and formation id: muster → skirmish → clash", () => {
    const { s, a, d, npc, pw } = joined();
    expect(formationSnapshot(s, T0)).toEqual([
      {
        warId: pw.id,
        joinedWarId: npc.id,
        ours: { realmIds: ["player", a], names: [name(s, "player"), name(s, a)] },
        theirs: { realmIds: [d], names: [name(s, d)] },
        phase: "columns",
        formation: "muster",
        active: true,
      },
    ]);
    expect(formationSnapshot(s, T0 + WAR_PHASE_START.skirmish)[0]).toMatchObject({ phase: "skirmish", formation: "skirmish" });
    expect(formationSnapshot(s, T0 + WAR_PHASE_START.clash)[0]).toMatchObject({ phase: "clash", formation: "clash" });
  });

  it("fall-back while the finished war's aftermath shows, then gone", () => {
    const { s } = joined();
    s.meta.tick = T0 + WAR_PHASE_START.clash;
    settleNpcWars(s, s.meta.tick);
    expect(tryWhitePeace(s)).toBe(true);
    expect(formationSnapshot(s)[0]).toMatchObject({ phase: "aftermath", formation: "fall-back", active: false });
    expect(formationSnapshot(s, s.meta.tick + WAR_AFTERMATH_TICKS)).toEqual([]);
  });

  it("is read-only and deterministic", () => {
    const { s } = joined();
    const before = JSON.stringify(s);
    const a = formationSnapshot(s);
    const b = formationSnapshot(s);
    expect(JSON.stringify(s)).toBe(before);
    expect(a).toEqual(b);
  });
});
