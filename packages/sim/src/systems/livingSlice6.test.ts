import { describe, it, expect } from "vitest";
import type { GameState, WarInstance } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { ensureBoard } from "./board.js";
import { tryWhitePeace } from "../actions/war.js";
import {
  LIVING_SWITCH_FLAGS,
  getCultureNews,
  getPendingReplies,
  joinSide,
  joinedWarOutcome,
  latestJoinedWarOutcome,
  livingCounts,
  livingSwitches,
  maybeWhisper,
  setLivingSwitch,
  settleNpcWars,
  tickCorrespondence,
  type CultureNews,
} from "./livingRealm.js";
import { WAR_PHASE_START, WHISPER_PULSES, WHISPER_REPLY_DELAY_TICKS } from "../content/livingRealm.js";

const SEED = 20261126;
/** Pulse 201: a whisper pulse (201 % WHISPER_PULSES === 0). */
const T0 = 20100;
const DELAY = WHISPER_REPLY_DELAY_TICKS;

function fresh(): GameState {
  const s = createGameState({ seed: SEED, now: 1 });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  for (const k of Object.keys(s.flags)) if (k.startsWith("peace_")) delete s.flags[k];
  return s;
}

/** First whisper pulse at or after T0 whose whisper goes to an NPC realm. */
function npcWhisper(s: GameState): CultureNews {
  for (let pulse = T0 / 100; pulse < T0 / 100 + 300; pulse += WHISPER_PULSES) {
    const w = maybeWhisper(s, pulse * 100);
    if (w && w.toRealmId !== "player") return w;
  }
  throw new Error("no NPC-to-NPC whisper found");
}

function run(ticks: number, setup?: (s: GameState) => void): GameState {
  const s = createGameState({ seed: SEED, now: 1 });
  setup?.(s);
  new TickEngine(s).settleTicks(ticks);
  return s;
}

describe("correspondence: switch", () => {
  it("has living_correspondence, on by default", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.correspondence).toBe("living_correspondence");
    expect(livingSwitches(s).correspondence).toBe(true);
  });

  it("off restores one-way whispers: no ids, no queue, no replies", () => {
    const s = run(12_000, (st) => setLivingSwitch(st, "correspondence", false));
    const news = getCultureNews(s);
    expect(news.some((n) => n.kind === "whisper")).toBe(true);
    expect(news.some((n) => n.kind === "reply")).toBe(false);
    expect(news.some((n) => n.id !== undefined || n.replyTo !== undefined)).toBe(false);
    expect(getPendingReplies(s)).toEqual([]);
    expect(livingCounts(s).replies).toBe(0);
  });
});

describe("correspondence: one reply, after the delay", () => {
  it(`a whisper to an NPC is answered exactly ${DELAY} ticks later, in the replier's voice`, () => {
    const s = fresh();
    const w = npcWhisper(s);
    expect(w.id).toBe(`wh_${w.tick}`);
    expect(getPendingReplies(s)).toEqual([
      { whisperId: w.id, fromRealmId: w.toRealmId, toRealmId: w.fromRealmId, dueTick: w.tick + DELAY },
    ]);
    // Not before the delay.
    expect(tickCorrespondence(s, w.tick + DELAY - 100)).toEqual([]);
    const sent = tickCorrespondence(s, w.tick + DELAY);
    expect(sent).toHaveLength(1);
    const r = sent[0];
    expect(r).toMatchObject({ kind: "reply", tick: w.tick + DELAY, fromRealmId: w.toRealmId, toRealmId: w.fromRealmId, replyTo: w.id });
    expect(r.text).toMatch(/ answers .+: ".+"$/);
    expect(getCultureNews(s).at(-1)).toEqual(r);
  });

  it("one reply per whisper: later pulses send nothing more", () => {
    const s = fresh();
    const w = npcWhisper(s);
    tickCorrespondence(s, w.tick + DELAY);
    expect(tickCorrespondence(s, w.tick + DELAY + 100)).toEqual([]);
    expect(tickCorrespondence(s, w.tick + DELAY * 4)).toEqual([]);
    expect(getCultureNews(s).filter((n) => n.replyTo === w.id)).toHaveLength(1);
    expect(livingCounts(s).replies).toBe(1);
  });

  it("whispers to the player queue no reply (the player is never made to speak)", () => {
    const s = fresh();
    for (let pulse = T0 / 100; pulse < T0 / 100 + 600; pulse += WHISPER_PULSES) {
      const w = maybeWhisper(s, pulse * 100);
      if (w?.toRealmId === "player") expect(getPendingReplies(s).some((p) => p.whisperId === w.id)).toBe(false);
      tickCorrespondence(s, pulse * 100);
    }
    expect(getCultureNews(s).some((n) => n.kind === "reply" && n.fromRealmId === "player")).toBe(false);
  });

  it("in real play: replies fire, each answers a distinct whisper, deterministic", () => {
    const a = run(12_000);
    const b = run(12_000);
    expect(JSON.stringify(getCultureNews(a))).toBe(JSON.stringify(getCultureNews(b)));
    expect(livingCounts(a).replies).toBeGreaterThan(0);
    expect(livingCounts(a).replies).toBe(livingCounts(b).replies);
    const news = getCultureNews(a);
    const replies = news.filter((n) => n.kind === "reply");
    expect(new Set(replies.map((r) => r.replyTo)).size).toBe(replies.length);
    for (const r of replies) {
      const orig = news.find((n) => n.id === r.replyTo);
      if (orig) expect(r.tick - orig.tick).toBe(DELAY);
    }
  });
});

describe("correspondence: no words across war or peace lock", () => {
  function npcWar(a: string, d: string): WarInstance {
    return { id: `war_npc_${a}_${d}_${T0}`, attackerRealmId: a, defenderRealmId: d, startedTick: T0, status: "active" };
  }

  it("a reply due while the pair is at war is dropped, not retried", () => {
    const s = fresh();
    const w = npcWhisper(s);
    s.wars.push(npcWar(w.fromRealmId, w.toRealmId));
    expect(tickCorrespondence(s, w.tick + DELAY)).toEqual([]);
    expect(getPendingReplies(s)).toEqual([]);
    s.wars = [];
    expect(tickCorrespondence(s, w.tick + DELAY + 100)).toEqual([]);
    expect(getCultureNews(s).some((n) => n.kind === "reply")).toBe(false);
  });

  it("a reply due under a peace lock is dropped", () => {
    const s = fresh();
    const w = npcWhisper(s);
    s.flags[`peace_${w.fromRealmId}_${w.toRealmId}`] = w.tick + DELAY + 900;
    expect(tickCorrespondence(s, w.tick + DELAY)).toEqual([]);
    expect(getPendingReplies(s)).toEqual([]);
  });

  it("a whisper never goes to a peace-locked realm while correspondence is on", () => {
    const s = fresh();
    const ids = s.realms.map((r) => r.id);
    for (const x of ids) for (const y of ids) if (x !== y) s.flags[`peace_${x}_${y}`] = T0 + 100_000;
    for (let pulse = T0 / 100; pulse < T0 / 100 + 30; pulse += WHISPER_PULSES) {
      expect(maybeWhisper(s, pulse * 100)).toBeNull();
    }
    // Off: the old filter (war only) is back, so the same locked realm hears whispers.
    setLivingSwitch(s, "correspondence", false);
    expect(maybeWhisper(s, T0)).not.toBeNull();
  });

  it("a whisper never goes to a realm at war with the sender", () => {
    const s = fresh();
    for (let pulse = T0 / 100; pulse < T0 / 100 + 300; pulse += WHISPER_PULSES) {
      const w = maybeWhisper(s, pulse * 100);
      if (!w) continue;
      const atWar = s.wars.some(
        (x) => x.status === "active" && [x.attackerRealmId, x.defenderRealmId].sort().join() === [w.fromRealmId, w.toRealmId].sort().join()
      );
      expect(atWar).toBe(false);
    }
  });
});

describe("joined-war outcome", () => {
  function joined(side: "attacker" | "defender" = "attacker") {
    const s = fresh();
    const [a, d] = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
    const npc: WarInstance = { id: `war_npc_${a}_${d}_${T0}`, attackerRealmId: a, defenderRealmId: d, startedTick: T0, status: "active" };
    s.wars.push(npc);
    const pw = joinSide(s, npc.id, side)!;
    expect(pw).not.toBeNull();
    return { s, a, d, npc, pw };
  }

  it("null while active, for unknown ids, and for wars that were not joined", () => {
    const { s, pw, npc } = joined();
    expect(joinedWarOutcome(s, pw.id)).toBeNull();
    expect(joinedWarOutcome(s, "nope")).toBeNull();
    npc.status = "attacker_won";
    expect(joinedWarOutcome(s, npc.id)).toBeNull();
    expect(latestJoinedWarOutcome(s)).toBeNull();
  });

  it("player holds the field: full shape", () => {
    const { s, a, d, npc, pw } = joined("attacker");
    pw.status = "attacker_won";
    pw.endedTick = T0 + 400;
    const o = joinedWarOutcome(s, pw.id)!;
    const name = (id: string) => s.realms.find((r) => r.id === id)!.name;
    expect(o).toEqual({
      warId: pw.id,
      joinedWarId: npc.id,
      allyRealmId: a,
      allyName: name(a),
      foeRealmId: d,
      foeName: name(d),
      endedTick: T0 + 400,
      status: "attacker_won",
      heldField: "player",
      heldFieldRealmId: "player",
      heldFieldName: name("player"),
      whitePeace: false,
      npcWar: null,
      playerTookNpcLossShare: false,
      line: `${name("player")} and ${name(a)} hold the field against ${name(d)}. Your side took no NPC war losses.`,
    });
    expect(latestJoinedWarOutcome(s)).toEqual(o);
  });

  it("foe holds the field", () => {
    const { s, d, pw } = joined("defender");
    pw.status = "defender_won";
    pw.endedTick = T0 + 400;
    const o = joinedWarOutcome(s, pw.id)!;
    expect(o.heldField).toBe("foe");
    expect(o.foeRealmId).toBe(s.wars[0].attackerRealmId);
    expect(o.allyRealmId).toBe(d);
    expect(o.heldFieldRealmId).toBe(o.foeRealmId);
    expect(o.whitePeace).toBe(false);
  });

  it("white peace via the player's own action, with the NPC war's own result alongside", () => {
    const { s, npc, pw } = joined();
    s.meta.tick = T0 + WAR_PHASE_START.clash;
    settleNpcWars(s, s.meta.tick);
    expect(npc.status).not.toBe("active");
    expect(tryWhitePeace(s)).toBe(true);
    const o = joinedWarOutcome(s, pw.id)!;
    expect(o.status).toBe("white_peace");
    expect(o.whitePeace).toBe(true);
    expect(o.heldField).toBeNull();
    expect(o.heldFieldRealmId).toBeNull();
    expect(o.npcWar).toEqual({
      status: npc.status,
      heldFieldRealmId: npc.status === "attacker_won" ? npc.attackerRealmId : npc.status === "defender_won" ? npc.defenderRealmId : null,
      whitePeace: npc.status === "white_peace",
    });
    expect(o.playerTookNpcLossShare).toBe(false);
    expect(o.line).toMatch(/part in white peace\. Your side took no NPC war losses\.$/);
  });

  it("is read-only: building it changes nothing", () => {
    const { s, pw } = joined();
    pw.status = "attacker_won";
    pw.endedTick = T0 + 400;
    const before = JSON.stringify(s);
    joinedWarOutcome(s, pw.id);
    latestJoinedWarOutcome(s);
    expect(JSON.stringify(s)).toBe(before);
  });
});
