import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { ensureBoard } from "./board.js";
import { LIVING_SWITCH_FLAGS, livingSwitches, setLivingSwitch, friendlyPresenceSnapshot, friendlyRealmIds } from "./livingRealm.js";
import {
  boardFeedbackSnapshot,
  boardInteractionDetailSnapshot,
  courtDetailSnapshot,
  courtStatusSnapshot,
  researchDetailSnapshot,
  researchProgressSnapshot,
} from "./livingStatus.js";
import { RESEARCH, type ResearchId } from "./research.js";
import { DECREES } from "./decree.js";
import { getBuildingType } from "../content/buildings.js";
import {
  BOARD_NEARBY_FRIENDLY_CAP,
  COURT_GUIDANCE_FULL,
  COURT_GUIDANCE_IDLE,
  RESEARCH_NEXT_UNLOCKS_CAP,
} from "../content/livingRealm.js";

const T0 = 20100;

function fresh(seed = 1, starter = false): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: starter });
  s.meta.tick = T0;
  ensureBoard(s);
  s.wars = [];
  s.flags.marches_json = "[]";
  s.flags.gathers_json = "[]";
  for (const k of Object.keys(s.flags)) if (k.startsWith("peace_") || k.startsWith("research_") || k.startsWith("decree_")) delete s.flags[k];
  return s;
}

let n = 0;
function build(s: GameState, typeId: string, level = 1): void {
  n++;
  s.buildings.push({ id: `b19_${n}`, typeId, realmId: "player", level, completesAtTick: null, x: (n % 6) * 3, y: 20 } as GameState["buildings"][number]);
}

const names = (ids: string[]) => ids.map((t) => getBuildingType(t)?.name ?? t).join(" or ");

describe("slice 19 switches", () => {
  it("are on by default and map to their flags", () => {
    const s = fresh();
    expect(LIVING_SWITCH_FLAGS.researchDetail).toBe("living_research_detail");
    expect(LIVING_SWITCH_FLAGS.courtDetail).toBe("living_court_detail");
    expect(LIVING_SWITCH_FLAGS.boardDetail).toBe("living_board_detail");
    const sw = livingSwitches(s);
    expect([sw.researchDetail, sw.courtDetail, sw.boardDetail]).toEqual([true, true, true]);
  });

  it("false returns null", () => {
    const s = fresh();
    expect(researchDetailSnapshot(s)).not.toBeNull();
    expect(courtDetailSnapshot(s)).not.toBeNull();
    expect(boardInteractionDetailSnapshot(s)).not.toBeNull();
    setLivingSwitch(s, "researchDetail", false);
    setLivingSwitch(s, "courtDetail", false);
    setLivingSwitch(s, "boardDetail", false);
    expect(researchDetailSnapshot(s)).toBeNull();
    expect(courtDetailSnapshot(s)).toBeNull();
    expect(boardInteractionDetailSnapshot(s, { selectedProvinceId: s.board.homeProvinceId })).toBeNull();
  });

  it("are independent of the slice 16 switches", () => {
    const s = fresh();
    setLivingSwitch(s, "researchStatus", false);
    setLivingSwitch(s, "courtStatus", false);
    setLivingSwitch(s, "boardFeedback", false);
    expect(researchDetailSnapshot(s)).not.toBeNull();
    expect(courtDetailSnapshot(s)).not.toBeNull();
    expect(boardInteractionDetailSnapshot(s)!.selected).toBeNull();
  });
});

describe("researchDetailSnapshot", () => {
  it("has the shape { active, completed, nextUnlocks }", () => {
    const d = researchDetailSnapshot(fresh(1, true))!;
    expect(Object.keys(d).sort()).toEqual(["active", "completed", "nextUnlocks"]);
    expect(d.nextUnlocks.length).toBeLessThanOrEqual(RESEARCH_NEXT_UNLOCKS_CAP);
    for (const u of d.nextUnlocks) {
      expect(Object.keys(u).sort()).toEqual(["id", "name", "requires"]);
      expect(Array.isArray(u.requires)).toBe(true);
    }
  });

  it("with nothing built: tier I studies one building away, table order, cap 3", () => {
    const s = fresh();
    s.buildings = [];
    const d = researchDetailSnapshot(s)!;
    expect(d.active).toBeNull();
    expect(d.completed).toEqual([]);
    expect(d.nextUnlocks).toEqual([
      { id: "husbandry", name: "Husbandry", requires: [names(RESEARCH.husbandry.needsAny as unknown as string[])] },
      { id: "forestry", name: "Forestry", requires: [names(RESEARCH.forestry.needsAny as unknown as string[])] },
      { id: "masonry", name: "Masonry", requires: [names(RESEARCH.masonry.needsAny as unknown as string[])] },
    ]);
  });

  it("ready studies (no gaps) come before one-gap studies", () => {
    const s = fresh();
    s.buildings = [];
    build(s, "quarry");
    const d = researchDetailSnapshot(s)!;
    expect(d.nextUnlocks[0]).toEqual({ id: "masonry", name: "Masonry", requires: [] });
    expect(d.nextUnlocks.map((u) => u.id)).toEqual(["masonry", "husbandry", "forestry"]);
  });

  it("names a missing prerequisite study; two-gap studies are left out", () => {
    const s = fresh();
    s.buildings = [];
    build(s, "keep", 2);
    build(s, "academy");
    const ids = Object.keys(RESEARCH) as ResearchId[];
    for (const id of ids) if (!["husbandry", "crop_rotation", "siege"].includes(id)) s.flags[`research_${id}`] = 1;
    const d = researchDetailSnapshot(s)!;
    // siege needs Keep III and a siege workshop: two gaps.
    expect(d.nextUnlocks).toEqual([
      { id: "husbandry", name: "Husbandry", requires: [] },
      { id: "crop_rotation", name: "Crop rotation", requires: ["Husbandry"] },
    ]);
    expect(d.completed).toHaveLength(ids.length - 3);
    expect(d.completed.map((c) => c.id)).toEqual(ids.filter((id) => !["husbandry", "crop_rotation", "siege"].includes(id)));
  });

  it("names a missing Keep level", () => {
    const s = fresh();
    s.buildings = [];
    build(s, "academy");
    const ids = Object.keys(RESEARCH) as ResearchId[];
    for (const id of ids) if (id !== "logistics") s.flags[`research_${id}`] = 1;
    expect(researchDetailSnapshot(s)!.nextUnlocks).toEqual([{ id: "logistics", name: "Logistics", requires: ["Keep II"] }]);
  });

  it("active matches researchProgressSnapshot and is not offered again", () => {
    const s = fresh();
    s.buildings = [];
    build(s, "farm");
    s.flags.research_husbandry_until = T0 + 500;
    s.flags.research_husbandry_total = 3000;
    s.flags.research_forestry = 1;
    const d = researchDetailSnapshot(s)!;
    expect(d.active).toEqual(researchProgressSnapshot(s)!.active);
    expect(d.active).toEqual({ id: "husbandry", name: "Husbandry", ticksLeft: 500, totalTicks: 3000 });
    expect(d.completed).toEqual([{ id: "forestry", name: "Forestry" }]);
    expect(d.nextUnlocks.map((u) => u.id)).not.toContain("husbandry");
  });

  it("does not write the lazy study-finished flag", () => {
    const s = fresh();
    s.flags.research_masonry_until = T0 - 1;
    const d = researchDetailSnapshot(s)!;
    expect(d.completed.map((c) => c.id)).toContain("masonry");
    expect(s.flags.research_masonry).toBeUndefined();
  });
});

describe("courtDetailSnapshot", () => {
  it("null with no player character", () => {
    const s = fresh();
    s.characters = s.characters.filter((c) => c.realmId !== "player");
    expect(courtDetailSnapshot(s)).toBeNull();
  });

  it("idle court: no active, all slots open, idle guidance", () => {
    const d = courtDetailSnapshot(fresh())!;
    expect(d).toEqual({ active: [], openSlots: DECREES.length, guidance: COURT_GUIDANCE_IDLE });
  });

  it("lists running decrees with ticks left, in DECREES order; expired ones drop out", () => {
    const s = fresh();
    s.flags.decree_envoys_until = T0 + 40;
    s.flags.decree_muster_until = T0 + 300;
    s.flags.decree_rite_until = T0; // ended this tick
    const d = courtDetailSnapshot(s)!;
    expect(d).toEqual({
      active: [
        { id: "muster", name: "Muster the Host", ticksLeft: 300 },
        { id: "envoys", name: "Send Envoys", ticksLeft: 40 },
      ],
      openSlots: 1,
      guidance: null,
    });
    expect(d.openSlots).toBe(courtStatusSnapshot(s)!.openSlots);
  });

  it("every decree running: zero slots, full guidance", () => {
    const s = fresh();
    for (const dec of DECREES) s.flags[`decree_${dec.id}_until`] = T0 + 10;
    expect(courtDetailSnapshot(s)).toMatchObject({ openSlots: 0, guidance: COURT_GUIDANCE_FULL });
  });
});

describe("boardInteractionDetailSnapshot", () => {
  /** Board with only the home province held, and three NPC realm ids to place. */
  function boardScene() {
    const s = fresh();
    for (const p of s.board.provinces) if (p.id !== s.board.homeProvinceId) p.occupantRealmId = null;
    const npc = s.realms.filter((r) => r.id !== "player").map((r) => r.id);
    const center = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId && p.x >= 2 && p.y >= 2 && p.x < s.board.width - 2 && p.y < s.board.height - 2)!;
    const at = (dx: number, dy: number) => s.board.provinces.find((p) => p.x === center.x + dx && p.y === center.y + dy)!;
    return { s, npc, center, at };
  }

  it("has the shape and matches boardFeedbackSnapshot for the shared fields", () => {
    const s = fresh();
    const to = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId)!.id;
    s.flags.marches_json = JSON.stringify([
      { id: "m1", realmId: "player", fromId: s.board.homeProvinceId, toId: to, arrivesTick: T0 + 90, kind: "node", levy: 5 },
    ]);
    const view = { selectedProvinceId: to, lastInspectedProvinceId: s.board.homeProvinceId };
    const d = boardInteractionDetailSnapshot(s, view)!;
    expect(Object.keys(d).sort()).toEqual(["lastInspected", "nearbyFriendly", "pendingMarch", "selected"]);
    const fb = boardFeedbackSnapshot(s, view)!;
    expect(d.selected).toEqual(fb.selectedProvince);
    expect(d.lastInspected).toEqual(fb.lastInspected);
    expect(d.pendingMarch).toEqual(fb.pendingMarch);
    expect(d.pendingMarch!.arrivesInTicks).toBe(90);
  });

  it("no view: nulls and no nearby list", () => {
    expect(boardInteractionDetailSnapshot(fresh())).toEqual({ selected: null, lastInspected: null, pendingMarch: null, nearbyFriendly: [] });
  });

  it("unknown selection: null and no nearby list", () => {
    const d = boardInteractionDetailSnapshot(fresh(), { selectedProvinceId: "nope" })!;
    expect(d.selected).toBeNull();
    expect(d.nearbyFriendly).toEqual([]);
  });

  it("lists friendly realms within 2 steps; skips far, unfriendly and at-war realms", () => {
    const { s, npc, center, at } = boardScene();
    const [near, far, neutral, foe] = npc;
    for (const r of [near, far, foe]) s.flags[`peace_player_${r}`] = T0 + 500;
    at(1, 1).occupantRealmId = near; // 2 steps
    at(2, 1).occupantRealmId = far; // 3 steps
    at(0, 1).occupantRealmId = neutral; // near, but no peace or pact
    at(-1, 0).occupantRealmId = foe; // near, peace key, but at war
    s.wars = [{ id: "w1", attackerRealmId: "player", defenderRealmId: foe, startedTick: T0, status: "active" }];
    const d = boardInteractionDetailSnapshot(s, { selectedProvinceId: center.id })!;
    expect(d.nearbyFriendly).toEqual([near]);
  });

  it("follows state.realms order and caps at 3", () => {
    const { s, npc, center, at } = boardScene();
    const spots = [at(0, 0), at(1, 0), at(0, 1), at(-1, 0), at(0, -1)];
    const used = npc.slice(0, Math.min(npc.length, spots.length));
    used.forEach((r, i) => {
      s.flags[`peace_${r}_player`] = T0 + 100;
      spots[spots.length - 1 - i].occupantRealmId = r;
    });
    const d = boardInteractionDetailSnapshot(s, { selectedProvinceId: center.id })!;
    expect(d.nearbyFriendly).toEqual(friendlyRealmIds(s).filter((id) => used.includes(id)).slice(0, BOARD_NEARBY_FRIENDLY_CAP));
    expect(d.nearbyFriendly.length).toBe(Math.min(used.length, BOARD_NEARBY_FRIENDLY_CAP));
  });

  it("friendly rule matches friendlyPresenceSnapshot", () => {
    const { s, npc } = boardScene();
    s.flags[`peace_player_${npc[0]}`] = T0 + 100;
    s.flags[`peace_player_${npc[1]}`] = T0 - 1; // expired
    expect(friendlyRealmIds(s)).toEqual(friendlyPresenceSnapshot(s).map((f) => f.realmId));
  });
});

describe("read-only and deterministic", () => {
  it("same state in, same output out; state unchanged", () => {
    const make = () => {
      const s = fresh(3, true);
      s.flags.research_husbandry_until = T0 - 1;
      s.flags.decree_rite_until = T0 + 20;
      return s;
    };
    const callAll = (s: GameState) => [researchDetailSnapshot(s), courtDetailSnapshot(s), boardInteractionDetailSnapshot(s, { selectedProvinceId: s.board.homeProvinceId })];
    const s = make();
    const before = JSON.stringify(s);
    const a = callAll(s);
    expect(JSON.stringify(s)).toBe(before);
    expect(callAll(s)).toEqual(a);
    expect(callAll(make())).toEqual(a);
  });
});
