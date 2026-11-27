import { describe, it, expect } from "vitest";
import type { GameState, WarInstance } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { tryWhitePeace } from "../actions/war.js";
import { pushWorldLog } from "./events.js";
import { peekCultureOfRealm } from "./culture.js";
import {
  LIVING_SWITCH_FLAGS,
  columnMarkSnapshot,
  friendlyPresenceSnapshot,
  joinSide,
  livingCounts,
  livingSwitches,
  maybeNpcTrade,
  maybeWhisper,
  realmRelationshipSummary,
  replyToWhisper,
  setLivingSwitch,
  settleNpcWars,
  tickCorrespondence,
  type RealmRelationship,
} from "./livingRealm.js";
import { RELATIONSHIP_SUMMARY_CAP, WAR_PHASE_START } from "../content/livingRealm.js";

const T0 = 20100;

function fresh(seed = 1): GameState {
  const s = createGameState({ seed, now: 1 });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  s.flags.gathers_json = "[]";
  s.flags.fog_seen = "[]";
  delete s.flags.culture_news;
  delete s.flags.world_log;
  for (const k of Object.keys(s.flags)) if (k.startsWith("peace_")) delete s.flags[k];
  return s;
}

function npcs(s: GameState): string[] {
  return s.realms.filter((r) => r.id !== "player").map((r) => r.id);
}

function nameOf(s: GameState, id: string): string {
  return s.realms.find((r) => r.id === id)!.name;
}

function row(s: GameState, id: string, at?: number): RealmRelationship | undefined {
  return realmRelationshipSummary(s, at).find((r) => r.realmId === id);
}

function joinWar(s: GameState): { ally: string; foe: string } {
  const [a, d] = npcs(s);
  const npc: WarInstance = { id: `war_npc_${a}_${d}_${T0 - 50}`, attackerRealmId: a, defenderRealmId: d, startedTick: T0 - 50, status: "active" };
  s.wars.push(npc);
  joinSide(s, npc.id, "attacker");
  return { ally: a, foe: d };
}

function seeHoldOf(s: GameState, id: string): void {
  const p = s.board.provinces.find((q) => q.occupantRealmId === id)!;
  s.flags.fog_seen = JSON.stringify([p.id]);
}

function whisperToPlayer(s: GameState, from: string, tick = s.meta.tick): string {
  const id = `wh_${tick}`;
  const list = JSON.parse((s.flags.culture_news as string) || "[]");
  list.push({ tick, kind: "whisper", fromRealmId: from, toRealmId: "player", text: "hi", id });
  s.flags.culture_news = JSON.stringify(list);
  return id;
}

describe("living_relationship_summary switch", () => {
  it("is on by default; false turns it off", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.relationshipSummary).toBe("living_relationship_summary");
    expect(livingSwitches(s).relationshipSummary).toBe(true);
    setLivingSwitch(s, "relationshipSummary", false);
    expect(s.flags.living_relationship_summary).toBe(false);
    expect(livingSwitches(s).relationshipSummary).toBe(false);
  });

  it("flag off returns an empty list", () => {
    const s = fresh();
    joinWar(s);
    expect(realmRelationshipSummary(s).length).toBeGreaterThan(0);
    setLivingSwitch(s, "relationshipSummary", false);
    expect(realmRelationshipSummary(s)).toEqual([]);
  });
});

describe("realmRelationshipSummary shape and known realms", () => {
  it("is empty when the player knows no realm", () => {
    expect(realmRelationshipSummary(fresh())).toEqual([]);
  });

  it("a seen hold makes a realm known: neutral, no interaction, can declare", () => {
    const s = fresh();
    const [r1] = npcs(s);
    seeHoldOf(s, r1);
    const out = realmRelationshipSummary(s);
    expect(out).toEqual([
      { realmId: r1, name: nameOf(s, r1), culture: peekCultureOfRealm(s, r1), stance: "neutral", lastInteraction: null, nextPossible: "can declare" },
    ]);
    expect(Object.keys(out[0]).sort()).toEqual(["culture", "lastInteraction", "name", "nextPossible", "realmId", "stance"]);
  });

  it("never lists the player", () => {
    const s = fresh();
    s.flags.fog_seen = JSON.stringify(s.board.provinces.map((p) => p.id));
    expect(realmRelationshipSummary(s).some((r) => r.realmId === "player")).toBe(false);
  });

  it("caps at RELATIONSHIP_SUMMARY_CAP in state.realms order", () => {
    const s = fresh();
    const base = s.realms.find((r) => r.id !== "player")!;
    for (let i = 0; i < 12; i++) s.realms.push({ ...base, id: `extra_${i}`, name: `Extra ${i}` });
    for (const id of npcs(s)) s.flags[`peace_player_${id}`] = T0 + 500;
    const out = realmRelationshipSummary(s);
    expect(RELATIONSHIP_SUMMARY_CAP).toBe(8);
    expect(out).toHaveLength(RELATIONSHIP_SUMMARY_CAP);
    expect(out.map((r) => r.realmId)).toEqual(npcs(s).slice(0, RELATIONSHIP_SUMMARY_CAP));
  });

  it("is deterministic and read-only (does not seed fog_seen)", () => {
    const s = fresh();
    joinWar(s);
    delete s.flags.fog_seen;
    const before = JSON.stringify(s);
    const a = realmRelationshipSummary(s);
    const b = realmRelationshipSummary(s);
    expect(JSON.stringify(s)).toBe(before);
    expect(b).toEqual(a);
  });
});

describe("stance mapping (same as friendlyPresenceSnapshot)", () => {
  it("joined war: ally pact, foe war", () => {
    const s = fresh();
    const { ally, foe } = joinWar(s);
    expect(row(s, ally)).toMatchObject({ stance: "pact", lastInteraction: "pact made", nextPossible: "riding together" });
    expect(row(s, foe)).toMatchObject({ stance: "war", lastInteraction: "war started", nextPossible: "fight locked" });
  });

  it("pact and peace agree with friendlyPresenceSnapshot", () => {
    const s = fresh();
    const { ally } = joinWar(s);
    const r3 = npcs(s).find((id) => id !== ally && row(s, id)?.stance !== "war")!;
    s.flags[`peace_${r3}_player`] = T0 + 100;
    const presence = new Map(friendlyPresenceSnapshot(s).map((p) => [p.realmId, p.kind]));
    for (const r of realmRelationshipSummary(s)) {
      if (r.stance === "pact" || r.stance === "peace") expect(presence.get(r.realmId)).toBe(r.stance);
      else expect(presence.has(r.realmId)).toBe(false);
    }
  });

  it("war: fight locked before the clash, can fight once it opens", () => {
    const s = fresh();
    const [r1] = npcs(s);
    s.wars.push({ id: "war_p", attackerRealmId: "player", defenderRealmId: r1, startedTick: T0, status: "active" });
    expect(row(s, r1, T0)).toMatchObject({ stance: "war", nextPossible: "fight locked" });
    expect(row(s, r1, T0 + WAR_PHASE_START.clash)).toMatchObject({ stance: "war", nextPossible: "can fight" });
  });

  it("white peace: peace stance, peace made, peace locked; neutral and can declare once the lock runs out", () => {
    const s = fresh();
    const [r1] = npcs(s);
    s.wars.push({ id: "war_p", attackerRealmId: "player", defenderRealmId: r1, startedTick: T0, status: "active" });
    s.meta.tick = T0 + 10;
    expect(tryWhitePeace(s)).toBe(true);
    expect(row(s, r1)).toMatchObject({ stance: "peace", lastInteraction: "peace made", nextPossible: "peace locked" });
    expect(row(s, r1, T0 + 10 + 300)).toMatchObject({ stance: "neutral", lastInteraction: "peace made", nextPossible: "can declare" });
  });

  it("a won war ends as war ended", () => {
    const s = fresh();
    const [r1] = npcs(s);
    s.wars.push({ id: "war_p", attackerRealmId: "player", defenderRealmId: r1, startedTick: T0, status: "attacker_won", endedTick: T0 + 5 });
    expect(row(s, r1, T0 + 4)?.lastInteraction).toBe("war started");
    expect(row(s, r1, T0 + 5)).toMatchObject({ stance: "neutral", lastInteraction: "war ended", nextPossible: "can declare" });
  });

  it("neutral realm while the player fights elsewhere: nextPossible null", () => {
    const s = fresh();
    const [r1, r2] = npcs(s);
    s.wars.push({ id: "war_p", attackerRealmId: "player", defenderRealmId: r1, startedTick: T0, status: "active" });
    seeHoldOf(s, r2);
    expect(row(s, r2)).toMatchObject({ stance: "neutral", lastInteraction: null, nextPossible: null });
  });

  it("NPC wars the player is not in do not count", () => {
    const s = fresh();
    const [r1, r2] = npcs(s);
    s.wars.push({ id: "war_npc", attackerRealmId: r1, defenderRealmId: r2, startedTick: T0, status: "active" });
    seeHoldOf(s, r1);
    expect(row(s, r1)).toMatchObject({ stance: "neutral", lastInteraction: null, nextPossible: "can declare" });
  });
});

describe("last interaction and next possible", () => {
  it("whisper to the player: whisper, can reply; after the reply: reply", () => {
    const s = fresh();
    const [r1] = npcs(s);
    const id = whisperToPlayer(s, r1);
    expect(row(s, r1)).toMatchObject({ stance: "neutral", lastInteraction: "whisper", nextPossible: "can reply" });
    s.meta.tick = T0 + 5;
    expect(replyToWhisper(s, id, 0)).not.toBeNull();
    expect(row(s, r1)).toMatchObject({ lastInteraction: "reply", nextPossible: "can declare" });
  });

  it("a caravan with the player in the world log: trade", () => {
    const s = fresh();
    const [r1] = npcs(s);
    pushWorldLog(s, "trade", `${nameOf(s, r1)} trades caravans with ${nameOf(s, "player")}`);
    expect(row(s, r1)).toMatchObject({ lastInteraction: "trade" });
  });

  it("newest event wins; events after atTick are ignored", () => {
    const s = fresh();
    const [r1] = npcs(s);
    whisperToPlayer(s, r1, T0);
    s.meta.tick = T0 + 20;
    pushWorldLog(s, "trade", `${nameOf(s, r1)} trades caravans with ${nameOf(s, "player")}`);
    expect(row(s, r1, T0 + 20)?.lastInteraction).toBe("trade");
    expect(row(s, r1, T0 + 19)?.lastInteraction).toBe("whisper");
  });

  it("whispers and caravans between NPC realms are not the player's", () => {
    const s = fresh();
    const [r1, r2] = npcs(s);
    s.flags.culture_news = JSON.stringify([
      { tick: T0, kind: "whisper", fromRealmId: r1, toRealmId: r2, text: "x", id: `wh_${T0}` },
      { tick: T0, kind: "caravan", fromRealmId: r1, toRealmId: r2, text: "y" },
    ]);
    expect(realmRelationshipSummary(s)).toEqual([]);
  });
});

describe("no existing counts change", () => {
  function run(s: GameState): { trace: string[]; counts: ReturnType<typeof livingCounts> } {
    const trace: string[] = [];
    for (let pulse = T0 / 100; pulse < T0 / 100 + 300; pulse++) {
      const at = pulse * 100;
      s.meta.tick = at;
      for (const r of s.realms) if (r.id !== "player") {
        const p = maybeNpcTrade(s, r.id, at);
        if (p) trace.push(`t ${at} ${r.id}>${p}`);
      }
      const w = maybeWhisper(s, at);
      if (w) trace.push(`w ${w.tick} ${w.fromRealmId}>${w.toRealmId}`);
      for (const r of tickCorrespondence(s, at)) trace.push(`r ${r.tick} ${r.fromRealmId}>${r.toRealmId}`);
      settleNpcWars(s, at);
      realmRelationshipSummary(s, at);
      friendlyPresenceSnapshot(s, at);
      columnMarkSnapshot(s, at);
    }
    return { trace, counts: livingCounts(s) };
  }

  it("living counts, trades, whispers, wars and resources match with the flag on vs off", () => {
    for (const seed of [1, 7, 42]) {
      const on = fresh(seed);
      const off = fresh(seed);
      joinWar(on);
      joinWar(off);
      setLivingSwitch(off, "relationshipSummary", false);
      const a = run(on);
      const b = run(off);
      expect(a.trace).toEqual(b.trace);
      expect(a.counts).toEqual(b.counts);
      expect(on.resources).toEqual(off.resources);
      expect(on.wars).toEqual(off.wars);
    }
  });
});
