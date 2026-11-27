import { describe, it, expect } from "vitest";
import type { GameState, WarInstance } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import {
  LIVING_SWITCH_FLAGS,
  columnMarkSnapshot,
  friendlyPresenceSnapshot,
  friendlyRoutesSnapshot,
  joinSide,
  livingCounts,
  livingSwitches,
  maybeNpcTrade,
  maybeWhisper,
  realmRelationshipSummary,
  setLivingSwitch,
  settleNpcWars,
  tickCorrespondence,
} from "./livingRealm.js";
import { FRIENDLY_ROUTES_CAP, FRIENDLY_TRADE_WINDOW_TICKS } from "../content/livingRealm.js";

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

/** Peace lock between the player and each realm, so they appear in friendlyPresenceSnapshot. */
function befriend(s: GameState, ...ids: string[]): void {
  for (const id of ids) s.flags[`peace_player_${id}`] = T0 + 500;
}

function peaceBetween(s: GameState, a: string, b: string, until = T0 + 500): void {
  s.flags[`peace_${a}_${b}`] = until;
}

function caravan(s: GameState, from: string, to: string, tick = T0): void {
  const list = JSON.parse((s.flags.culture_news as string) || "[]");
  list.push({ tick, kind: "caravan", fromRealmId: from, toRealmId: to, text: "c" });
  s.flags.culture_news = JSON.stringify(list);
}

/** Player joins an NPC war beside `ally` against `foe`. */
function joinWar(s: GameState, ally: string, foe: string): void {
  const npc: WarInstance = { id: `war_npc_${ally}_${foe}_${T0 - 50}`, attackerRealmId: ally, defenderRealmId: foe, startedTick: T0 - 50, status: "active" };
  s.wars.push(npc);
  joinSide(s, npc.id, "attacker");
}

describe("living_friendly_routes switch", () => {
  it("is on by default; false turns it off", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.friendlyRoutes).toBe("living_friendly_routes");
    expect(livingSwitches(s).friendlyRoutes).toBe(true);
    setLivingSwitch(s, "friendlyRoutes", false);
    expect(s.flags.living_friendly_routes).toBe(false);
    expect(livingSwitches(s).friendlyRoutes).toBe(false);
  });

  it("flag off returns an empty list", () => {
    const s = fresh();
    const [a, b] = npcs(s);
    befriend(s, a, b);
    peaceBetween(s, a, b);
    expect(friendlyRoutesSnapshot(s)).toHaveLength(1);
    setLivingSwitch(s, "friendlyRoutes", false);
    expect(friendlyRoutesSnapshot(s)).toEqual([]);
  });

  it("is empty when board presence is off (no ends listed)", () => {
    const s = fresh();
    const [a, b] = npcs(s);
    befriend(s, a, b);
    peaceBetween(s, a, b);
    setLivingSwitch(s, "boardPresence", false);
    expect(friendlyRoutesSnapshot(s)).toEqual([]);
  });
});

describe("friendlyRoutesSnapshot shape", () => {
  it("is empty with fewer than two friendly realms", () => {
    const s = fresh();
    expect(friendlyRoutesSnapshot(s)).toEqual([]);
    befriend(s, npcs(s)[0]);
    expect(friendlyRoutesSnapshot(s)).toEqual([]);
  });

  it("returns { fromRealmId, toRealmId, kind, strength }, earlier realm first", () => {
    const s = fresh();
    const [a, b] = npcs(s);
    befriend(s, a, b);
    peaceBetween(s, b, a);
    const out = friendlyRoutesSnapshot(s);
    expect(out).toEqual([{ fromRealmId: a, toRealmId: b, kind: "peace", strength: 1 }]);
    expect(Object.keys(out[0]).sort()).toEqual(["fromRealmId", "kind", "strength", "toRealmId"]);
  });

  it("two friends with no reason between them get no route", () => {
    const s = fresh();
    const [a, b] = npcs(s);
    befriend(s, a, b);
    expect(friendlyRoutesSnapshot(s)).toEqual([]);
  });

  it("both ends must be listed in friendlyPresenceSnapshot", () => {
    const s = fresh();
    const [a, b, c] = npcs(s);
    befriend(s, a);
    peaceBetween(s, a, b);
    caravan(s, a, c);
    expect(friendlyRoutesSnapshot(s)).toEqual([]);
    befriend(s, b);
    const ids = new Set(friendlyPresenceSnapshot(s).map((p) => p.realmId));
    for (const r of friendlyRoutesSnapshot(s)) {
      expect(ids.has(r.fromRealmId)).toBe(true);
      expect(ids.has(r.toRealmId)).toBe(true);
    }
    expect(friendlyRoutesSnapshot(s)).toEqual([{ fromRealmId: a, toRealmId: b, kind: "peace", strength: 1 }]);
  });

  it("an expired peace lock gives no route", () => {
    const s = fresh();
    const [a, b] = npcs(s);
    befriend(s, a, b);
    peaceBetween(s, a, b, T0 + 10);
    expect(friendlyRoutesSnapshot(s, T0 + 9)).toHaveLength(1);
    expect(friendlyRoutesSnapshot(s, T0 + 10)).toEqual([]);
  });

  it("never includes the player", () => {
    const s = fresh();
    const ids = npcs(s);
    befriend(s, ...ids);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) peaceBetween(s, ids[i], ids[j]);
    for (const r of friendlyRoutesSnapshot(s)) {
      expect(r.fromRealmId).not.toBe("player");
      expect(r.toRealmId).not.toBe("player");
    }
  });

  it("caps at FRIENDLY_ROUTES_CAP in presence pair order and is deterministic", () => {
    const s = fresh();
    const base = s.realms.find((r) => r.id !== "player")!;
    for (let i = 0; i < 8; i++) s.realms.push({ ...base, id: `extra_${i}`, name: `Extra ${i}` });
    const ids = npcs(s);
    befriend(s, ...ids);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) peaceBetween(s, ids[i], ids[j]);
    const out = friendlyRoutesSnapshot(s);
    expect(out).toHaveLength(FRIENDLY_ROUTES_CAP);
    const ends = friendlyPresenceSnapshot(s).map((p) => p.realmId);
    const expected: string[] = [];
    for (let i = 0; i < ends.length; i++) for (let j = i + 1; j < ends.length; j++) expected.push(`${ends[i]}>${ends[j]}`);
    expect(out.map((r) => `${r.fromRealmId}>${r.toRealmId}`)).toEqual(expected.slice(0, FRIENDLY_ROUTES_CAP));
    expect(friendlyRoutesSnapshot(s)).toEqual(out);
  });
});

describe("friendlyRoutesSnapshot kind and strength", () => {
  it("peace only: kind peace, strength 1", () => {
    const s = fresh();
    const [a, b] = npcs(s);
    befriend(s, a, b);
    peaceBetween(s, a, b);
    expect(friendlyRoutesSnapshot(s)[0]).toMatchObject({ kind: "peace", strength: 1 });
  });

  it("a recent caravan (either direction): kind trade, strength 2", () => {
    const s = fresh();
    const [a, b] = npcs(s);
    befriend(s, a, b);
    caravan(s, b, a);
    expect(friendlyRoutesSnapshot(s)).toEqual([{ fromRealmId: a, toRealmId: b, kind: "trade", strength: 2 }]);
  });

  it("trade beats peace for kind; peace adds no strength", () => {
    const s = fresh();
    const [a, b] = npcs(s);
    befriend(s, a, b);
    peaceBetween(s, a, b);
    caravan(s, a, b);
    expect(friendlyRoutesSnapshot(s)[0]).toMatchObject({ kind: "trade", strength: 2 });
  });

  it("trade fades after FRIENDLY_TRADE_WINDOW_TICKS", () => {
    const s = fresh();
    const [a, b] = npcs(s);
    befriend(s, a, b);
    s.flags[`peace_player_${a}`] = T0 + 5000;
    s.flags[`peace_player_${b}`] = T0 + 5000;
    caravan(s, a, b, T0);
    expect(friendlyRoutesSnapshot(s, T0 + FRIENDLY_TRADE_WINDOW_TICKS)).toHaveLength(1);
    expect(friendlyRoutesSnapshot(s, T0 + FRIENDLY_TRADE_WINDOW_TICKS + 1)).toEqual([]);
  });

  it("a gather crew on the other's province counts as trade", () => {
    const s = fresh();
    const [a, b] = npcs(s);
    befriend(s, a, b);
    const p = s.board.provinces.find((q) => q.occupantRealmId === b)!;
    s.flags.gathers_json = JSON.stringify([{ realmId: a, toId: p.id }]);
    expect(friendlyRoutesSnapshot(s)[0]).toMatchObject({ fromRealmId: a, toRealmId: b, kind: "trade", strength: 2 });
  });

  it("the player's pact ally and another friend: kind pact, strength 2; with trade, strength 3", () => {
    const s = fresh();
    const [ally, foe, friend] = npcs(s);
    joinWar(s, ally, foe);
    befriend(s, friend);
    const out = friendlyRoutesSnapshot(s);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ kind: "pact", strength: 2 });
    expect([out[0].fromRealmId, out[0].toRealmId].sort()).toEqual([ally, friend].sort());
    caravan(s, friend, ally);
    expect(friendlyRoutesSnapshot(s)[0]).toMatchObject({ kind: "trade", strength: 3 });
  });

  it("realms at war with each other get no route", () => {
    const s = fresh();
    const [a, b] = npcs(s);
    befriend(s, a, b);
    caravan(s, a, b);
    s.wars.push({ id: `war_npc_${a}_${b}_${T0}`, attackerRealmId: a, defenderRealmId: b, startedTick: T0, status: "active" });
    expect(friendlyRoutesSnapshot(s)).toEqual([]);
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
      friendlyRoutesSnapshot(s, at);
      realmRelationshipSummary(s, at);
      friendlyPresenceSnapshot(s, at);
      columnMarkSnapshot(s, at);
    }
    return { trace, counts: livingCounts(s) };
  }

  it("living counts, trades, whispers, wars, flags and resources match with the flag on vs off", () => {
    for (const seed of [1, 7, 42]) {
      const on = fresh(seed);
      const off = fresh(seed);
      for (const s of [on, off]) {
        const [ally, foe, ...rest] = npcs(s);
        joinWar(s, ally, foe);
        befriend(s, ...rest);
      }
      setLivingSwitch(off, "friendlyRoutes", false);
      const a = run(on);
      const b = run(off);
      expect(a.trace).toEqual(b.trace);
      expect(a.counts).toEqual(b.counts);
      expect(on.resources).toEqual(off.resources);
      expect(on.wars).toEqual(off.wars);
      const { living_friendly_routes: _x, ...flagsOff } = off.flags;
      expect(on.flags).toEqual(flagsOff);
    }
  });
});
