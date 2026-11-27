import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { LIVING_SWITCH_FLAGS, livingSwitches, realmRelationshipSummary, setLivingSwitch } from "./livingRealm.js";
import { relationshipDetailSnapshot, trainingProgressSnapshot, unitUnlockSnapshot } from "./livingStatus.js";
import { enqueueTraining, listTraining, trainingQueueCap } from "./training.js";
import { unitUnlocked, RESEARCH } from "./research.js";
import { listRosterUnitTypes } from "./cultureUnits.js";
import { getUnitType } from "../content/units.js";
import { giftOffer, opinionOfPlayerFromRealm, tryGiftGold, GIFT_GOLD_COST } from "../actions/diplomacy.js";
import {
  TRAINING_NOTE_FULL,
  TRAINING_NOTE_IDLE,
  UNIT_UNLOCK_CAP,
  UNIT_REQUIRES_FALLBACK,
  RELATIONSHIP_GIFT_OLD,
  RELATIONSHIP_GIFT_RECENT,
  RELATIONSHIP_GIFT_RECENT_TICKS,
  RELATIONSHIP_SUGGEST_CAP,
  RELATIONSHIP_SUGGEST_GIFT,
  RELATIONSHIP_SUGGEST_SAVE,
  RELATIONSHIP_SUGGEST_WAR,
  RELATIONSHIP_WARM_OPINION,
} from "../content/livingRealm.js";

function bare(seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.buildings = [];
  s.citizens = [];
  return s;
}

function yard(s: GameState, done = true) {
  s.buildings.push({ id: `bk${s.buildings.length}`, typeId: "barracks", realmId: "player", x: 2, y: 2, level: 1, completesAtTick: done ? null : 999 } as GameState["buildings"][number]);
}

function setOpinion(s: GameState, value: number) {
  const e = s.opinions.find((o) => o.from === "char_rival" && o.to === "char_player")!;
  e.value = value;
}

describe("slice 23 switches", () => {
  it("are on by default and map to their flags", () => {
    expect(LIVING_SWITCH_FLAGS.trainingProgress).toBe("living_training_progress");
    expect(LIVING_SWITCH_FLAGS.unitUnlocks).toBe("living_unit_unlocks");
    expect(LIVING_SWITCH_FLAGS.relationshipDetail).toBe("living_relationship_detail");
    const sw = livingSwitches(bare());
    expect([sw.trainingProgress, sw.unitUnlocks, sw.relationshipDetail]).toEqual([true, true, true]);
  });

  it("false returns null, each independently", () => {
    const s = bare();
    yard(s);
    expect(trainingProgressSnapshot(s)).not.toBeNull();
    expect(unitUnlockSnapshot(s)).not.toBeNull();
    expect(relationshipDetailSnapshot(s, "rival")).not.toBeNull();
    setLivingSwitch(s, "trainingProgress", false);
    expect(trainingProgressSnapshot(s)).toBeNull();
    expect(unitUnlockSnapshot(s)).not.toBeNull();
    setLivingSwitch(s, "unitUnlocks", false);
    expect(unitUnlockSnapshot(s)).toBeNull();
    expect(relationshipDetailSnapshot(s, "rival")).not.toBeNull();
    setLivingSwitch(s, "relationshipDetail", false);
    expect(relationshipDetailSnapshot(s, "rival")).toBeNull();
  });
});

describe("trainingProgressSnapshot", () => {
  it("is null with no finished Barracks (yard), even with jobs queued", () => {
    const s = bare();
    enqueueTraining(s, "militia", 2, "player");
    expect(trainingProgressSnapshot(s)).toBeNull();
    yard(s, false);
    expect(trainingProgressSnapshot(s)).toBeNull();
    yard(s, true);
    expect(trainingProgressSnapshot(s)).not.toBeNull();
  });

  it("idle yard: no active, empty queue, idle note", () => {
    const s = bare();
    yard(s);
    expect(trainingProgressSnapshot(s)).toEqual({ active: null, queue: [], note: TRAINING_NOTE_IDLE });
  });

  it("active job and queue match training_json; NPC jobs ignored", () => {
    const s = bare();
    yard(s);
    s.meta.tick = 100;
    const a = enqueueTraining(s, "militia", 3, "player")!;
    const b = enqueueTraining(s, "spearman", 2, "player")!;
    enqueueTraining(s, "militia", 5, "rival");
    s.meta.tick = 105;
    const snap = trainingProgressSnapshot(s)!;
    expect(snap.active).toEqual({
      id: a.id,
      name: getUnitType("militia")!.name,
      ticksLeft: a.doneTick - 105,
      totalTicks: a.doneTick - a.startedTick,
    });
    expect(snap.queue).toEqual([{ id: b.id, name: getUnitType("spearman")!.name, count: 2 }]);
    expect(snap.active!.ticksLeft).toBeLessThanOrEqual(snap.active!.totalTicks);
  });

  it("full note when the queue is at the keep cap", () => {
    const s = bare();
    yard(s);
    const cap = trainingQueueCap(s, "player");
    for (let i = 0; i < cap; i++) enqueueTraining(s, "militia", 1, "player");
    expect(listTraining(s, "player").length).toBe(cap);
    const snap = trainingProgressSnapshot(s)!;
    expect(snap.note).toBe(TRAINING_NOTE_FULL);
    expect(snap.queue.length).toBe(cap - 1);
  });

  it("does not write state and is deterministic", () => {
    const s = bare();
    yard(s);
    enqueueTraining(s, "militia", 3, "player");
    const before = JSON.stringify(s);
    const a = trainingProgressSnapshot(s);
    const b = trainingProgressSnapshot(s);
    expect(JSON.stringify(s)).toBe(before);
    expect(a).toEqual(b);
  });
});

describe("unitUnlockSnapshot", () => {
  it("ready and locked agree with unitUnlocked, roster order, capped", () => {
    const s = bare();
    const snap = unitUnlockSnapshot(s)!;
    const roster = listRosterUnitTypes(s);
    const probe = JSON.parse(JSON.stringify(s)) as GameState;
    const ready = roster.filter((u) => unitUnlocked(probe, u.id)).map((u) => u.id);
    const locked = roster.filter((u) => !unitUnlocked(probe, u.id)).map((u) => u.id);
    expect(snap.ready.map((u) => u.id)).toEqual(ready.slice(0, UNIT_UNLOCK_CAP));
    expect(snap.locked.map((u) => u.id)).toEqual(locked.slice(0, UNIT_UNLOCK_CAP));
    expect(snap.ready.length).toBeLessThanOrEqual(UNIT_UNLOCK_CAP);
    expect(snap.locked.length).toBeLessThanOrEqual(UNIT_UNLOCK_CAP);
    for (const u of [...snap.ready, ...snap.locked]) expect(u.name).toBe(getUnitType(u.id)!.name);
  });

  it("every gated roster unit names the study that opens it (no fallback)", () => {
    const s = bare();
    const roster = listRosterUnitTypes(s).filter((u) => !unitUnlocked(s, u.id));
    expect(roster.length).toBeGreaterThan(0);
    for (const u of roster) {
      const study = Object.values(RESEARCH).find((r) => (r.unlocks as readonly string[]).includes(u.id));
      expect(study, u.id).toBeDefined();
      // Finishing that study really opens the unit (pins requires to the rule).
      const t = JSON.parse(JSON.stringify(s)) as GameState;
      t.flags[`research_${study!.id}`] = 1;
      expect(unitUnlocked(t, u.id)).toBe(true);
    }
    for (const l of unitUnlockSnapshot(s)!.locked) {
      expect(l.requires).not.toBe(UNIT_REQUIRES_FALLBACK);
      expect(l.requires).toMatch(/^Needs .+\.$/);
    }
  });

  it("finishing Horse lore moves cavalry to ready", () => {
    const s = bare();
    const before = unitUnlockSnapshot(s)!;
    expect(before.locked.find((u) => u.id === "cavalry")?.requires).toBe(`Needs ${RESEARCH.horse.name}.`);
    s.flags.research_horse = 1;
    const after = unitUnlockSnapshot(s)!;
    expect(after.locked.some((u) => u.id === "cavalry")).toBe(false);
  });

  it("a study finished by time counts without writing the lazy flag", () => {
    const s = bare();
    s.meta.tick = 500;
    s.flags.research_horse_until = 400;
    const before = JSON.stringify(s);
    const snap = unitUnlockSnapshot(s)!;
    expect(snap.locked.some((u) => u.id === "cavalry")).toBe(false);
    expect(JSON.stringify(s)).toBe(before);
    expect(unitUnlockSnapshot(s)).toEqual(snap);
  });
});

describe("relationshipDetailSnapshot", () => {
  it("null for unknown realm and for the player", () => {
    const s = bare();
    expect(relationshipDetailSnapshot(s, "nowhere")).toBeNull();
    expect(relationshipDetailSnapshot(s, "player")).toBeNull();
  });

  it("opinion and stance match diplomacy and the summary rule", () => {
    const s = bare();
    const d = relationshipDetailSnapshot(s, "rival")!;
    expect(d.opinion).toBe(opinionOfPlayerFromRealm(s, "rival"));
    expect(d.stance).toBe("neutral");
    expect(d.lastGift).toBeNull();
    s.wars.push({ id: "w1", attackerRealmId: "player", defenderRealmId: "rival", startedTick: 0, status: "active" });
    const w = relationshipDetailSnapshot(s, "rival")!;
    expect(w.stance).toBe("war");
    expect(w.suggestion).toBe(RELATIONSHIP_SUGGEST_WAR);
    const row = realmRelationshipSummary(s).find((r) => r.realmId === "rival");
    if (row) expect(row.stance).toBe(w.stance);
  });

  it("suggests a gift when affordable and opinion is low, saving when short", () => {
    const s = bare();
    setOpinion(s, RELATIONSHIP_WARM_OPINION - 1);
    s.resources.gold = String(GIFT_GOLD_COST);
    expect(giftOffer(s, "rival").ok).toBe(true);
    expect(relationshipDetailSnapshot(s, "rival")!.suggestion).toBe(RELATIONSHIP_SUGGEST_GIFT);
    s.resources.gold = "0";
    expect(relationshipDetailSnapshot(s, "rival")!.suggestion).toBe(RELATIONSHIP_SUGGEST_SAVE);
    setOpinion(s, RELATIONSHIP_WARM_OPINION);
    expect(relationshipDetailSnapshot(s, "rival")!.suggestion).toBeNull();
    setOpinion(s, 100);
    expect(relationshipDetailSnapshot(s, "rival")!.suggestion).toBe(RELATIONSHIP_SUGGEST_CAP);
  });

  it("lastGift reads the gift log: recent, then old", () => {
    const s = bare();
    s.meta.tick = 1000;
    s.resources.gold = "100";
    expect(tryGiftGold(s, GIFT_GOLD_COST, "rival")).toBe(true);
    expect(relationshipDetailSnapshot(s, "rival")!.lastGift).toBe(RELATIONSHIP_GIFT_RECENT);
    s.meta.tick = 1000 + RELATIONSHIP_GIFT_RECENT_TICKS;
    expect(relationshipDetailSnapshot(s, "rival")!.lastGift).toBe(RELATIONSHIP_GIFT_RECENT);
    s.meta.tick = 1001 + RELATIONSHIP_GIFT_RECENT_TICKS;
    expect(relationshipDetailSnapshot(s, "rival")!.lastGift).toBe(RELATIONSHIP_GIFT_OLD);
  });

  it("does not write state and is deterministic", () => {
    const s = bare();
    s.resources.gold = "100";
    tryGiftGold(s, GIFT_GOLD_COST, "rival");
    const before = JSON.stringify(s);
    const a = relationshipDetailSnapshot(s, "rival");
    const b = relationshipDetailSnapshot(s, "rival");
    expect(JSON.stringify(s)).toBe(before);
    expect(a).toEqual(b);
    expect(Object.keys(a!).sort()).toEqual(["lastGift", "opinion", "stance", "suggestion"]);
  });
});
