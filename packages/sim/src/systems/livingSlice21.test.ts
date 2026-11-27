import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, livingSwitches, setLivingSwitch } from "./livingRealm.js";
import { courtDetailSnapshot, decreeEffectSummarySnapshot, inspectDetailSnapshot } from "./livingStatus.js";
import { DECREES } from "./decree.js";
import { productionBonus } from "./economy.js";
import { trainCostMultiplier } from "../actions/train.js";
import { giftBonusOpinion } from "../actions/diplomacy.js";
import { nodeStock, nodeStockMax } from "./nodeStock.js";
import { GATHER_NODES } from "./gather.js";
import { settlementName } from "../actions/settlement.js";
import {
  BOARD_NEARBY_RADIUS,
  DECREE_EFFECTS,
  DECREE_SUGGESTIONS,
  DECREE_SUGGEST_SAVE,
  INSPECT_MARCH_CAP,
  INSPECT_NODE_NAMES,
  INSPECT_NOTE_CAMP,
  INSPECT_NOTE_CAP,
  INSPECT_NOTE_DEPLETED,
  INSPECT_NOTE_HOME,
  INSPECT_NOTE_OUTPOST,
  INSPECT_NOTE_RIVAL,
  INSPECT_NOTE_THREAT,
  INSPECT_NOTE_WORKED,
  INSPECT_OUTPOST_CAP,
} from "../content/livingRealm.js";

const T0 = 20100;

function fresh(seed = 1, starter = false): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: starter });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  s.flags.gathers_json = "[]";
  for (const k of Object.keys(s.flags)) if (k.startsWith("decree_") || k.startsWith("node_stock_")) delete s.flags[k];
  return s;
}

function rich(s: GameState): void {
  s.resources.gold = "1000";
  s.resources.food = "1000";
}

function poor(s: GameState): void {
  s.resources.gold = "0";
  s.resources.food = "0";
}

/** Board with only home held, plus a center tile away from edges and home. */
function scene(seed = 1) {
  const s = fresh(seed);
  const home = s.board.homeProvinceId;
  for (const p of s.board.provinces) if (p.id !== home) p.occupantRealmId = null;
  const homeP = s.board.provinces.find((p) => p.id === home)!;
  const center = s.board.provinces.find(
    (p) =>
      p.x >= 3 && p.y >= 3 && p.x < s.board.width - 3 && p.y < s.board.height - 3 &&
      Math.abs(p.x - homeP.x) + Math.abs(p.y - homeP.y) > 6
  )!;
  const at = (dx: number, dy: number) => s.board.provinces.find((p) => p.x === center.x + dx && p.y === center.y + dy)!;
  const npc = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
  return { s, center, at, npc };
}

function march(id: string, realmId: string, fromId: string, toId: string, eta: number, kind = "node") {
  return { id, realmId, fromId, toId, arrivesTick: T0 + eta, kind, levy: 3 };
}

describe("slice 21 switches", () => {
  it("are on by default and map to their flags", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.decreeEffects).toBe("living_decree_effects");
    expect(LIVING_SWITCH_FLAGS.inspectDetail).toBe("living_inspect_detail");
    const sw = livingSwitches(s);
    expect([sw.decreeEffects, sw.inspectDetail]).toEqual([true, true]);
  });

  it("false returns null", () => {
    const s = fresh();
    expect(decreeEffectSummarySnapshot(s)).not.toBeNull();
    expect(inspectDetailSnapshot(s, s.board.homeProvinceId)).not.toBeNull();
    setLivingSwitch(s, "decreeEffects", false);
    setLivingSwitch(s, "inspectDetail", false);
    expect(decreeEffectSummarySnapshot(s)).toBeNull();
    expect(inspectDetailSnapshot(s, s.board.homeProvinceId)).toBeNull();
  });

  it("are independent of the court-detail switch", () => {
    const s = fresh();
    setLivingSwitch(s, "courtDetail", false);
    expect(courtDetailSnapshot(s)).toBeNull();
    expect(decreeEffectSummarySnapshot(s)).not.toBeNull();
  });
});

describe("decreeEffectSummarySnapshot", () => {
  it("is null with no court", () => {
    const s = fresh();
    s.characters = s.characters.filter((c) => c.realmId !== "player");
    expect(decreeEffectSummarySnapshot(s)).toBeNull();
  });

  it("has the shape; idle court suggests the first affordable decree", () => {
    const s = fresh();
    rich(s);
    const d = decreeEffectSummarySnapshot(s)!;
    expect(Object.keys(d).sort()).toEqual(["active", "openSlots", "suggestion"]);
    expect(d).toEqual({ active: [], openSlots: DECREES.length, suggestion: DECREE_SUGGESTIONS[DECREES[0].id] });
  });

  it("lists active decrees in DECREES order with fixed effect lines", () => {
    const s = fresh();
    rich(s);
    s.flags.decree_envoys_until = T0 + 10;
    s.flags.decree_muster_until = T0 + 300;
    s.flags.decree_rite_until = T0; // just expired
    const d = decreeEffectSummarySnapshot(s)!;
    expect(d.active).toEqual([
      { id: "muster", name: "Muster the Host", effect: DECREE_EFFECTS.muster },
      { id: "envoys", name: "Send Envoys", effect: DECREE_EFFECTS.envoys },
    ]);
    expect(d.openSlots).toBe(1);
    expect(d.openSlots).toBe(courtDetailSnapshot(s)!.openSlots);
    expect(d.active.map((a) => a.id)).toEqual(courtDetailSnapshot(s)!.active.map((a) => a.id));
    expect(d.suggestion).toBe(DECREE_SUGGESTIONS.rite);
  });

  it("all in force: no open slot, no suggestion, active capped at the real decree count", () => {
    const s = fresh();
    for (const dd of DECREES) s.flags[`decree_${dd.id}_until`] = T0 + 50;
    const d = decreeEffectSummarySnapshot(s)!;
    expect(d.active).toHaveLength(DECREES.length);
    expect(d.openSlots).toBe(0);
    expect(d.suggestion).toBeNull();
  });

  it("open slot but nothing affordable: save suggestion", () => {
    const s = fresh();
    poor(s);
    expect(decreeEffectSummarySnapshot(s)!.suggestion).toBe(DECREE_SUGGEST_SAVE);
  });

  it("suggestion skips a decree the player cannot afford", () => {
    const s = fresh();
    s.resources.gold = "0";
    s.resources.food = "1000";
    expect(decreeEffectSummarySnapshot(s)!.suggestion).toBe(DECREE_SUGGESTIONS.rite);
  });

  it("every decree has an effect and a suggestion line", () => {
    for (const dd of DECREES) {
      expect(typeof DECREE_EFFECTS[dd.id]).toBe("string");
      expect(typeof DECREE_SUGGESTIONS[dd.id]).toBe("string");
    }
  });

  it("effect lines match live decree math", () => {
    const s = fresh();
    const train0 = trainCostMultiplier(s);
    const prod0 = productionBonus(s);
    const gift0 = giftBonusOpinion(s);
    for (const dd of DECREES) s.flags[`decree_${dd.id}_until`] = T0 + 50;
    expect(trainCostMultiplier(s) / train0).toBeCloseTo(0.9, 10);
    expect(DECREE_EFFECTS.muster).toBe("Training costs 10% less");
    expect(productionBonus(s) - prod0).toBe(3);
    expect(DECREE_EFFECTS.rite).toBe("+3 production");
    expect(giftBonusOpinion(s) - gift0).toBe(6);
    expect(DECREE_EFFECTS.envoys).toBe("Gifts earn +6 opinion");
  });
});

describe("inspectDetailSnapshot", () => {
  it("is null for an unknown province", () => {
    expect(inspectDetailSnapshot(fresh(), "nope")).toBeNull();
    expect(inspectDetailSnapshot(fresh(), "toString")).toBeNull();
  });

  it("home hold: shape, settlement name, home note", () => {
    const s = fresh();
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    const d = inspectDetailSnapshot(s, home.id)!;
    expect(Object.keys(d).sort()).toEqual(["id", "marches", "name", "notes", "outposts", "stock", "terrain"]);
    expect(d.id).toBe(home.id);
    expect(d.name).toBe(settlementName(s));
    expect(d.terrain).toBe(home.terrain);
    expect(d.stock).toBeNull();
    expect(d.notes[0]).toBe(INSPECT_NOTE_HOME);
  });

  it("gather node: stock reuses nodeStock / nodeStockMax / GATHER_NODES; depleted note at zero", () => {
    const { s, center } = scene();
    center.node = "quarry";
    let d = inspectDetailSnapshot(s, center.id)!;
    expect(d.name).toBe(INSPECT_NODE_NAMES.quarry);
    expect(d.stock).toEqual({ resource: GATHER_NODES.quarry.resource, have: nodeStock(s, center.id), max: nodeStockMax("quarry") });
    expect(d.notes).not.toContain(INSPECT_NOTE_DEPLETED);
    s.flags[`node_stock_${center.id}`] = 0;
    d = inspectDetailSnapshot(s, center.id)!;
    expect(d.stock!.have).toBe(0);
    expect(d.notes).toContain(INSPECT_NOTE_DEPLETED);
  });

  it("non-gather node: stock is null", () => {
    const { s, center } = scene();
    center.node = "ruins";
    const d = inspectDetailSnapshot(s, center.id)!;
    expect(d.stock).toBeNull();
    expect(d.name).toBe(INSPECT_NODE_NAMES.ruins);
  });

  it("outposts: any realm within the radius, board order, BoardFeedbackProvince shape, capped", () => {
    const { s, center, at, npc } = scene();
    center.node = "field";
    center.occupantRealmId = "player";
    at(1, 0).occupantRealmId = npc[0];
    at(1, 0).node = "woodcut";
    at(0, BOARD_NEARBY_RADIUS + 1).occupantRealmId = "player"; // too far
    at(0, BOARD_NEARBY_RADIUS + 1).node = "field";
    at(0, -1).occupantRealmId = npc[0];
    at(0, -1).node = "hold"; // a hold is not an outpost
    const d = inspectDetailSnapshot(s, center.id)!;
    const ids = d.outposts.map((o) => o.id);
    const expected = s.board.provinces.filter((p) => p.id === center.id || p.id === at(1, 0).id).map((p) => p.id);
    expect(ids).toEqual(expected);
    const mine = d.outposts.find((o) => o.id === center.id)!;
    expect(mine).toEqual({ id: center.id, x: center.x, y: center.y, node: "field", ownerRealmId: "player", isHome: false });
    expect(d.notes[0]).toBe(INSPECT_NOTE_OUTPOST);

    for (const [dx, dy] of [[-1, 0], [0, 1], [-1, -1], [1, 1]]) {
      at(dx, dy).occupantRealmId = "player";
      at(dx, dy).node = "field";
    }
    expect(inspectDetailSnapshot(s, center.id)!.outposts).toHaveLength(INSPECT_OUTPOST_CAP);
  });

  it("rival tile gets the rival note; camp gets the camp note", () => {
    const { s, center, npc } = scene();
    center.occupantRealmId = npc[0];
    center.node = "camp";
    const d = inspectDetailSnapshot(s, center.id)!;
    expect(d.notes.slice(0, 2)).toEqual([INSPECT_NOTE_RIVAL, INSPECT_NOTE_CAMP]);
    expect(d.name).toBe(INSPECT_NODE_NAMES.camp);
  });

  it("marches: heading here only, soonest first then id, eta never negative, capped; foreign column adds threat", () => {
    const { s, center, at, npc } = scene();
    const home = s.board.homeProvinceId;
    s.flags.marches_json = JSON.stringify([
      march("m_b", "player", home, center.id, 40),
      march("m_a", npc[0], at(2, 0).id, center.id, 40, "hold"),
      march("m_late", "player", home, center.id, 300),
      march("m_past", "player", home, center.id, -5),
      march("m_else", "player", home, at(1, 0).id, 1),
    ]);
    const d = inspectDetailSnapshot(s, center.id)!;
    expect(d.marches).toEqual([
      { id: "m_past", kind: "node", eta: 0 },
      { id: "m_a", kind: "hold", eta: 40 },
      { id: "m_b", kind: "node", eta: 40 },
    ]);
    expect(d.marches.length).toBeLessThanOrEqual(INSPECT_MARCH_CAP);
    expect(d.notes).toContain(INSPECT_NOTE_THREAT);
  });

  it("own marches only: no threat note", () => {
    const { s, center } = scene();
    s.flags.marches_json = JSON.stringify([march("m1", "player", s.board.homeProvinceId, center.id, 10)]);
    expect(inspectDetailSnapshot(s, center.id)!.notes).not.toContain(INSPECT_NOTE_THREAT);
  });

  it("a working crew adds the worked note; a returning one does not", () => {
    const { s, center } = scene();
    center.node = "field";
    const crew = (phase: string) => ({
      id: "g1", realmId: "player", fromId: s.board.homeProvinceId, toId: center.id, node: "field", force: { militia: 2 },
      phase, departedTick: T0 - 10, arrivesTick: T0 - 5, travelTicks: 5, gatherStartedTick: T0 - 5, capacity: "10", load: "0",
    });
    s.flags.gathers_json = JSON.stringify([crew("gathering")]);
    expect(inspectDetailSnapshot(s, center.id)!.notes).toContain(INSPECT_NOTE_WORKED);
    s.flags.gathers_json = JSON.stringify([crew("returning")]);
    expect(inspectDetailSnapshot(s, center.id)!.notes).not.toContain(INSPECT_NOTE_WORKED);
  });

  it("notes are capped in priority order", () => {
    const { s, center, npc } = scene();
    center.occupantRealmId = npc[0];
    center.node = "camp";
    s.flags.marches_json = JSON.stringify([march("m1", npc[1] ?? npc[0], center.id, center.id, 10)]);
    const d = inspectDetailSnapshot(s, center.id)!;
    expect(d.notes).toEqual([INSPECT_NOTE_RIVAL, INSPECT_NOTE_CAMP, INSPECT_NOTE_THREAT]);
    expect(d.notes.length).toBe(INSPECT_NOTE_CAP);
  });
});

describe("slice 21 determinism and purity", () => {
  it("same state gives the same answer and nothing is written", () => {
    const make = () => {
      const s = fresh(3, true);
      s.flags.decree_rite_until = T0 + 20;
      return s;
    };
    const callAll = (s: GameState) => [
      decreeEffectSummarySnapshot(s),
      ...s.board.provinces.slice(0, 40).map((p) => inspectDetailSnapshot(s, p.id)),
    ];
    const s = make();
    const before = JSON.stringify(s);
    const a = callAll(s);
    expect(JSON.stringify(s)).toBe(before);
    expect(callAll(s)).toEqual(a);
    expect(callAll(make())).toEqual(a);
  });
});
