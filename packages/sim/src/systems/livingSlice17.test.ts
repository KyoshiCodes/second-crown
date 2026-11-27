import { describe, it, expect } from "vitest";
import type { GameState, WarInstance } from "@second-crown/shared";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { D } from "../core/decimal.js";
import { ensureBoard } from "./board.js";
import {
  LIVING_SWITCH_FLAGS,
  livingCounts,
  livingSwitches,
  realmRelationshipSummary,
  relationshipHistorySnapshot,
  setLivingSwitch,
} from "./livingRealm.js";
import { boardFeedbackSnapshot, economyPressureSnapshot, economyYieldsSnapshot } from "./livingStatus.js";
import { computeIncomePerSecond } from "./economy.js";
import { upkeepPerTick } from "./upkeep.js";
import { RELATIONSHIP_HISTORY_CAP } from "../content/livingRealm.js";

const T0 = 20100;

function fresh(seed = 1, starter = false): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: starter });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  s.flags.gathers_json = "[]";
  delete s.flags.culture_news;
  delete s.flags.world_log;
  return s;
}

function npcs(s: GameState): string[] {
  return s.realms.filter((r) => r.id !== "player").map((r) => r.id);
}

function nameOf(s: GameState, id: string): string {
  return s.realms.find((r) => r.id === id)!.name;
}

function news(s: GameState, entry: object): void {
  const list = JSON.parse((s.flags.culture_news as string) || "[]");
  list.push(entry);
  s.flags.culture_news = JSON.stringify(list);
}

function whisper(s: GameState, from: string, tick: number, text = `whisper ${tick}`): void {
  news(s, { tick, kind: "whisper", fromRealmId: from, toRealmId: "player", text, id: `wh_${tick}` });
}

function caravan(s: GameState, from: string, tick: number): string {
  const text = `${nameOf(s, from)} trades caravans with your hold.`;
  const list = JSON.parse((s.flags.world_log as string) || "[]");
  list.push({ id: "trade", tick, text });
  s.flags.world_log = JSON.stringify(list);
  return text;
}

describe("slice 17 switches", () => {
  it("are on by default and map to their flags", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.relationshipHistory).toBe("living_relationship_history");
    expect(LIVING_SWITCH_FLAGS.economyYields).toBe("living_economy_yields");
    expect(livingSwitches(s).relationshipHistory).toBe(true);
    expect(livingSwitches(s).economyYields).toBe(true);
  });

  it("false returns empty / null", () => {
    const s = fresh();
    const [r1] = npcs(s);
    whisper(s, r1, T0 - 5);
    expect(relationshipHistorySnapshot(s, r1)).toHaveLength(1);
    expect(economyYieldsSnapshot(s)).not.toBeNull();
    setLivingSwitch(s, "relationshipHistory", false);
    setLivingSwitch(s, "economyYields", false);
    expect(relationshipHistorySnapshot(s, r1)).toEqual([]);
    expect(economyYieldsSnapshot(s)).toBeNull();
  });
});

describe("relationshipHistorySnapshot", () => {
  it("is empty with no records, for the player, and for an unknown realm", () => {
    const s = fresh();
    const [r1] = npcs(s);
    expect(relationshipHistorySnapshot(s, r1)).toEqual([]);
    expect(relationshipHistorySnapshot(s, "player")).toEqual([]);
    expect(relationshipHistorySnapshot(s, "no_such_realm")).toEqual([]);
  });

  it("entries are { tick, kind, text } with the record's own text", () => {
    const s = fresh();
    const [r1] = npcs(s);
    whisper(s, r1, T0 - 30, "The river is high this year.");
    const trade = caravan(s, r1, T0 - 20);
    news(s, { tick: T0 - 10, kind: "reply", fromRealmId: "player", toRealmId: r1, text: "We hear you.", replyTo: `wh_${T0 - 30}` });
    expect(relationshipHistorySnapshot(s, r1)).toEqual([
      { tick: T0 - 10, kind: "reply", text: "We hear you." },
      { tick: T0 - 20, kind: "trade", text: trade },
      { tick: T0 - 30, kind: "whisper", text: "The river is high this year." },
    ]);
  });

  it("caps at 4, newest first", () => {
    const s = fresh();
    const [r1] = npcs(s);
    for (let i = 1; i <= 7; i++) whisper(s, r1, T0 - 100 + i * 10);
    const h = relationshipHistorySnapshot(s, r1);
    expect(RELATIONSHIP_HISTORY_CAP).toBe(4);
    expect(h).toHaveLength(4);
    expect(h.map((e) => e.tick)).toEqual([T0 - 30, T0 - 40, T0 - 50, T0 - 60]);
  });

  it("only counts records with the player and that realm", () => {
    const s = fresh();
    const [r1, r2] = npcs(s);
    whisper(s, r2, T0 - 5);
    news(s, { tick: T0 - 4, kind: "whisper", fromRealmId: r1, toRealmId: r2, text: "not ours" });
    news(s, { tick: T0 - 3, kind: "caravan", fromRealmId: r1, toRealmId: "player", text: "caravan news" });
    caravan(s, r2, T0 - 2);
    expect(relationshipHistorySnapshot(s, r1)).toEqual([]);
  });

  it("wars: started, ended, peace made, pact made, with fixed lines naming the realm", () => {
    const s = fresh();
    const [r1, r2, r3] = npcs(s);
    s.wars.push({ id: "war_a", attackerRealmId: "player", defenderRealmId: r1, startedTick: T0 - 50, status: "attacker_won", endedTick: T0 - 40 });
    s.wars.push({ id: "war_b", attackerRealmId: r1, defenderRealmId: "player", startedTick: T0 - 30, status: "white_peace", endedTick: T0 - 20 });
    const joined: WarInstance = {
      id: `war_join_${T0 - 10}_x`,
      attackerRealmId: "player",
      defenderRealmId: r3,
      startedTick: T0 - 500,
      status: "active",
      joinedWarId: "war_npc",
      allyRealmId: r2,
    };
    s.wars.push(joined);
    const n1 = nameOf(s, r1);
    expect(relationshipHistorySnapshot(s, r1)).toEqual([
      { tick: T0 - 20, kind: "peace made", text: `Peace made with ${n1}.` },
      { tick: T0 - 30, kind: "war started", text: `War with ${n1} began.` },
      { tick: T0 - 40, kind: "war ended", text: `War with ${n1} ended.` },
      { tick: T0 - 50, kind: "war started", text: `War with ${n1} began.` },
    ]);
    expect(relationshipHistorySnapshot(s, r2)).toEqual([{ tick: T0 - 10, kind: "pact made", text: `Rode to war beside ${nameOf(s, r2)}.` }]);
    // Join tick from the id, not the NPC war's startedTick.
    expect(relationshipHistorySnapshot(s, r3)[0]).toEqual({ tick: T0 - 10, kind: "war started", text: `War with ${nameOf(s, r3)} began.` });
  });

  it("same-tick ties go by the lastInteraction rank, and entry 0 always matches lastInteraction", () => {
    const s = fresh();
    const [r1] = npcs(s);
    whisper(s, r1, T0 - 10);
    caravan(s, r1, T0 - 10);
    s.wars.push({ id: "war_a", attackerRealmId: "player", defenderRealmId: r1, startedTick: T0 - 10, status: "active" });
    const h = relationshipHistorySnapshot(s, r1);
    expect(h.map((e) => e.kind)).toEqual(["war started", "trade", "whisper"]);
    const row = realmRelationshipSummary(s).find((r) => r.realmId === r1)!;
    expect(row.lastInteraction).toBe(h[0].kind);
  });

  it("ignores records after atTick", () => {
    const s = fresh();
    const [r1] = npcs(s);
    whisper(s, r1, T0 - 10);
    whisper(s, r1, T0 + 10);
    expect(relationshipHistorySnapshot(s, r1).map((e) => e.tick)).toEqual([T0 - 10]);
    expect(relationshipHistorySnapshot(s, r1, T0 + 10).map((e) => e.tick)).toEqual([T0 + 10, T0 - 10]);
  });

  it("is deterministic and never writes state", () => {
    const s = fresh();
    const [r1] = npcs(s);
    whisper(s, r1, T0 - 10);
    caravan(s, r1, T0 - 5);
    const before = JSON.stringify(s);
    const a = relationshipHistorySnapshot(s, r1);
    const b = relationshipHistorySnapshot(s, r1);
    expect(a).toEqual(b);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("economyYieldsSnapshot", () => {
  it("has the five numeric fields", () => {
    const y = economyYieldsSnapshot(fresh(1, true))!;
    expect(Object.keys(y).sort()).toEqual(["foodPerSec", "foodUpkeep", "goldPerSec", "stonePerSec", "woodPerSec"]);
    for (const v of Object.values(y)) expect(Number.isFinite(v)).toBe(true);
  });

  it("is zero with no buildings and no army", () => {
    const s = fresh();
    s.buildings = [];
    s.units = [];
    s.citizens = [];
    expect(economyYieldsSnapshot(s)).toEqual({ foodPerSec: 0, woodPerSec: 0, stonePerSec: 0, goldPerSec: 0, foodUpkeep: 0 });
  });

  it("matches income per second, with food net of army upkeep", () => {
    for (const seed of [1, 2, 3]) {
      const s = fresh(seed, true);
      const income = computeIncomePerSecond({ ...s, flags: { ...s.flags } });
      const upkeep = upkeepPerTick(s) * TICKS_PER_SECOND;
      const y = economyYieldsSnapshot(s)!;
      expect(y.foodUpkeep).toBe(upkeep);
      expect(y.foodPerSec).toBe(D(income.food ?? "0").toNumber() - upkeep);
      expect(y.woodPerSec).toBe(D(income.wood ?? "0").toNumber());
      expect(y.stonePerSec).toBe(D(income.stone ?? "0").toNumber());
      expect(y.goldPerSec).toBe(D(income.gold ?? "0").toNumber());
    }
  });

  it("is the same net the pressure line judges by (empty store: high iff net <= 0)", () => {
    for (const seed of [1, 2, 3]) {
      const s = fresh(seed, true);
      for (const res of ["wood", "stone", "gold"] as const) s.resources[res] = "0";
      const y = economyYieldsSnapshot(s)!;
      const p = economyPressureSnapshot(s)!;
      expect(p.woodPressure === "high").toBe(y.woodPerSec <= 0);
      expect(p.stonePressure === "high").toBe(y.stonePerSec <= 0);
      expect(p.goldPressure === "high").toBe(y.goldPerSec <= 0);
    }
  });

  it("never writes state", () => {
    const s = fresh(1, true);
    const before = JSON.stringify(s);
    economyYieldsSnapshot(s);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("last inspected (app-tracked)", () => {
  it("boardFeedbackSnapshot already takes the optional view with lastInspectedProvinceId", () => {
    const s = fresh();
    const p = s.board.provinces[0];
    expect(boardFeedbackSnapshot(s)!.lastInspected).toBeNull();
    expect(boardFeedbackSnapshot(s, { lastInspectedProvinceId: p.id })!.lastInspected?.id).toBe(p.id);
    expect(boardFeedbackSnapshot(s, { lastInspectedProvinceId: "nope" })!.lastInspected).toBeNull();
  });
});

describe("slice 17 changes no simulation", () => {
  it("600 ticks with snapshots called vs flags off give identical worlds", () => {
    for (const seed of [1, 2, 3]) {
      const a = createGameState({ seed, now: 1, withStarterBuildings: true });
      const b = createGameState({ seed, now: 1, withStarterBuildings: true });
      setLivingSwitch(b, "relationshipHistory", false);
      setLivingSwitch(b, "economyYields", false);
      const ea = new TickEngine(a);
      const eb = new TickEngine(b);
      for (let t = 0; t < 600; t++) {
        ea.tick();
        eb.tick();
        if (t % 20 === 0) {
          economyYieldsSnapshot(a);
          for (const id of npcs(a)) relationshipHistorySnapshot(a, id);
        }
      }
      expect(livingCounts(a)).toEqual(livingCounts(b));
      expect(a.resources).toEqual(b.resources);
      expect(a.units).toEqual(b.units);
      expect(a.wars).toEqual(b.wars);
      const strip = (f: GameState["flags"]) => {
        const c = { ...f };
        delete c.living_relationship_history;
        delete c.living_economy_yields;
        return c;
      };
      expect(strip(a.flags)).toEqual(strip(b.flags));
    }
  });
});
