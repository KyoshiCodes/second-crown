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
  columnRanks,
  friendlyPresenceSnapshot,
  joinSide,
  livingCounts,
  livingSwitches,
  maybeNpcTrade,
  maybeWhisper,
  setLivingSwitch,
  settleNpcWars,
  standardStrength,
  tickCorrespondence,
} from "./livingRealm.js";
import {
  FRIENDLY_PRESENCE_CAP,
  FRIENDLY_TRADE_WINDOW_TICKS,
  STANDARD_STRENGTH,
  WAR_PHASE_IDS,
  WAR_PHASE_START,
} from "../content/livingRealm.js";

const T0 = 20100;

function fresh(seed = 1): GameState {
  const s = createGameState({ seed, now: 1 });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  s.flags.gathers_json = "[]";
  for (const k of Object.keys(s.flags)) if (k.startsWith("peace_")) delete s.flags[k];
  return s;
}

function npcs(s: GameState): string[] {
  return s.realms.filter((r) => r.id !== "player").map((r) => r.id);
}

function joinWar(s: GameState): { ally: string; foe: string } {
  const [a, d] = npcs(s);
  const npc: WarInstance = { id: `war_npc_${a}_${d}_${T0}`, attackerRealmId: a, defenderRealmId: d, startedTick: T0, status: "active" };
  s.wars.push(npc);
  joinSide(s, npc.id, "attacker");
  return { ally: a, foe: d };
}

function peaceWith(s: GameState, realmId: string, ticks = 500): void {
  s.flags[`peace_player_${realmId}`] = s.meta.tick + ticks;
}

describe("living_board_presence switch", () => {
  it("is on by default; false turns it off", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.boardPresence).toBe("living_board_presence");
    expect(livingSwitches(s).boardPresence).toBe(true);
    setLivingSwitch(s, "boardPresence", false);
    expect(s.flags.living_board_presence).toBe(false);
    expect(livingSwitches(s).boardPresence).toBe(false);
  });
});

describe("friendlyPresenceSnapshot", () => {
  it("is empty with no peace, pact or trade", () => {
    expect(friendlyPresenceSnapshot(fresh())).toEqual([]);
  });

  it("lists a realm under a running peace lock (either key order), with name and culture", () => {
    const s = fresh();
    const [r1, r2] = npcs(s);
    peaceWith(s, r1);
    s.flags[`peace_${r2}_player`] = s.meta.tick + 50;
    const out = friendlyPresenceSnapshot(s);
    expect(out).toEqual([
      { realmId: r1, name: s.realms.find((r) => r.id === r1)!.name, culture: peekCultureOfRealm(s, r1), kind: "peace" },
      { realmId: r2, name: s.realms.find((r) => r.id === r2)!.name, culture: peekCultureOfRealm(s, r2), kind: "peace" },
    ]);
    for (const p of out) expect(Object.keys(p).sort()).toEqual(["culture", "kind", "name", "realmId"]);
  });

  it("drops a realm once its peace lock runs out", () => {
    const s = fresh();
    const [r1] = npcs(s);
    peaceWith(s, r1, 10);
    expect(friendlyPresenceSnapshot(s, T0 + 9)).toHaveLength(1);
    expect(friendlyPresenceSnapshot(s, T0 + 10)).toEqual([]);
  });

  it("the ally of the player's joined war is a pact; the foe is not listed", () => {
    const s = fresh();
    const { ally, foe } = joinWar(s);
    const out = friendlyPresenceSnapshot(s);
    expect(out.map((p) => [p.realmId, p.kind])).toEqual([[ally, "pact"]]);
    expect(out.some((p) => p.realmId === foe)).toBe(false);
  });

  it("a realm at war with the player is never listed, even with a stale peace key", () => {
    const s = fresh();
    const [r1] = npcs(s);
    peaceWith(s, r1);
    s.wars.push({ id: `war_player_${r1}`, attackerRealmId: "player", defenderRealmId: r1, startedTick: T0, status: "active" });
    expect(friendlyPresenceSnapshot(s)).toEqual([]);
  });

  it("trade: a player gather crew on the realm's province", () => {
    const s = fresh();
    const [r1] = npcs(s);
    peaceWith(s, r1);
    const prov = s.board.provinces.find((p) => p.occupantRealmId === r1)!;
    s.flags.gathers_json = JSON.stringify([{ id: "g1", realmId: "player", toId: prov.id }]);
    expect(friendlyPresenceSnapshot(s)[0]).toMatchObject({ realmId: r1, kind: "trade" });
  });

  it("trade: the realm's gather crew on a player province", () => {
    const s = fresh();
    const [r1] = npcs(s);
    peaceWith(s, r1);
    const prov = s.board.provinces.find((p) => p.occupantRealmId === "player")!;
    s.flags.gathers_json = JSON.stringify([{ id: "g1", realmId: r1, toId: prov.id }]);
    expect(friendlyPresenceSnapshot(s)[0]).toMatchObject({ realmId: r1, kind: "trade" });
  });

  it("trade: a recent caravan with the player, within the window only", () => {
    const s = fresh();
    const { ally } = joinWar(s);
    const name = s.realms.find((r) => r.id === ally)!.name;
    pushWorldLog(s, "trade", `${name} trades caravans with ${s.realms.find((r) => r.id === "player")!.name}`);
    expect(friendlyPresenceSnapshot(s, T0)[0]).toMatchObject({ realmId: ally, kind: "trade" });
    expect(friendlyPresenceSnapshot(s, T0 + FRIENDLY_TRADE_WINDOW_TICKS)[0].kind).toBe("trade");
    expect(friendlyPresenceSnapshot(s, T0 + FRIENDLY_TRADE_WINDOW_TICKS + 1)[0].kind).toBe("pact");
  });

  it("trade alone (no peace or pact) does not list a realm", () => {
    const s = fresh();
    const [r1] = npcs(s);
    const prov = s.board.provinces.find((p) => p.occupantRealmId === r1)!;
    s.flags.gathers_json = JSON.stringify([{ id: "g1", realmId: "player", toId: prov.id }]);
    expect(friendlyPresenceSnapshot(s)).toEqual([]);
  });

  it("caps at FRIENDLY_PRESENCE_CAP in state.realms order", () => {
    const s = fresh();
    const base = s.realms.find((r) => r.id !== "player")!;
    for (let i = 0; i < 10; i++) s.realms.push({ ...base, id: `extra_${i}`, name: `Extra ${i}` });
    for (const id of npcs(s)) peaceWith(s, id);
    const out = friendlyPresenceSnapshot(s);
    expect(FRIENDLY_PRESENCE_CAP).toBe(6);
    expect(out).toHaveLength(FRIENDLY_PRESENCE_CAP);
    expect(out.map((p) => p.realmId)).toEqual(npcs(s).slice(0, FRIENDLY_PRESENCE_CAP));
  });

  it("is deterministic and read-only", () => {
    const s = fresh();
    joinWar(s);
    peaceWith(s, npcs(s)[2] ?? npcs(s)[0]);
    const before = JSON.stringify(s);
    const a = friendlyPresenceSnapshot(s);
    const b = friendlyPresenceSnapshot(s);
    expect(JSON.stringify(s)).toBe(before);
    expect(b).toEqual(a);
  });

  it("flag off returns an empty list", () => {
    const s = fresh();
    joinWar(s);
    setLivingSwitch(s, "boardPresence", false);
    expect(friendlyPresenceSnapshot(s)).toEqual([]);
  });
});

describe("columnMarkSnapshot.standardStrength", () => {
  it("maps phase like ranks: columns 1, skirmish 2, clash 3, aftermath 1", () => {
    expect(STANDARD_STRENGTH).toEqual({ columns: 1, skirmish: 2, clash: 3, aftermath: 1 });
    for (const ph of WAR_PHASE_IDS) expect(standardStrength(ph)).toBe(columnRanks(ph));
  });

  it("follows the joined war's phase; phase timing unchanged", () => {
    const s = fresh();
    joinWar(s);
    expect(columnMarkSnapshot(s, T0)).toMatchObject({ phase: "columns", standardStrength: 1 });
    expect(columnMarkSnapshot(s, T0 + WAR_PHASE_START.skirmish - 1)).toMatchObject({ phase: "columns", standardStrength: 1 });
    expect(columnMarkSnapshot(s, T0 + WAR_PHASE_START.skirmish)).toMatchObject({ phase: "skirmish", standardStrength: 2 });
    expect(columnMarkSnapshot(s, T0 + WAR_PHASE_START.clash)).toMatchObject({ phase: "clash", standardStrength: 3 });
    s.meta.tick = T0 + WAR_PHASE_START.clash;
    settleNpcWars(s, s.meta.tick);
    expect(tryWhitePeace(s)).toBe(true);
    expect(columnMarkSnapshot(s)).toMatchObject({ phase: "aftermath", standardStrength: 1, active: false });
  });

  it("flag off: standardStrength 1 in every phase; other fields unchanged", () => {
    const s = fresh();
    joinWar(s);
    const on = columnMarkSnapshot(s, T0 + WAR_PHASE_START.clash)!;
    setLivingSwitch(s, "boardPresence", false);
    const off = columnMarkSnapshot(s, T0 + WAR_PHASE_START.clash)!;
    expect(off.standardStrength).toBe(1);
    expect({ ...off, standardStrength: on.standardStrength }).toEqual(on);
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
      friendlyPresenceSnapshot(s, at);
      columnMarkSnapshot(s, at);
    }
    return { trace, counts: livingCounts(s) };
  }

  it("living counts, trades and whispers match with the flag on vs off", () => {
    for (const seed of [1, 7, 42]) {
      const on = fresh(seed);
      const off = fresh(seed);
      setLivingSwitch(off, "boardPresence", false);
      const a = run(on);
      const b = run(off);
      expect(a.trace).toEqual(b.trace);
      expect(a.counts).toEqual(b.counts);
      expect(on.resources).toEqual(off.resources);
    }
  });
});
