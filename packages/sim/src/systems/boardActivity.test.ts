import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { seedCitizensFromBuildings, tryIdleCitizen } from "./citizens.js";
import { laborPerTick } from "./labor.js";
import { tryGather, listGathers } from "./gather.js";
import { tryMarchWith } from "./march.js";
import { tryGarrison } from "./garrison.js";
import { plantOutpost } from "./outpost.js";
import { unitActivity, unitActivityAt, workerSnapshot, WORKER_TASK_TAGS } from "./boardActivity.js";

function starter() {
  const s = createGameState({ seed: 1, now: 1, withStarterBuildings: true });
  seedCitizensFromBuildings(s);
  return s;
}

describe("worker snapshot", () => {
  it("lists every player citizen with a post and a task tag", () => {
    const s = starter();
    const snap = workerSnapshot(s);
    expect(snap.posts.filter((p) => p.kind === "citizen")).toHaveLength(s.citizens.filter((c) => c.realmId === "player").length);
    for (const p of snap.posts) expect(WORKER_TASK_TAGS).toContain(p.tag);
    expect(Object.values(snap.counts).reduce((a, b) => a + b, 0)).toBe(snap.posts.length);
    expect(snap.posted).toBeGreaterThan(0);
    const farm = snap.posts.find((p) => p.tag === "farm");
    expect(farm?.tile).not.toBeNull();
    expect(farm?.buildingId).not.toBeNull();
    // Posted farmers are exactly what labor pays for.
    expect(laborPerTick(s).food).toBeCloseTo(snap.counts.farm * 0.1);
  });

  it("an idled citizen reads idle with no tile", () => {
    const s = starter();
    const c = s.citizens.find((x) => x.realmId === "player")!;
    tryIdleCitizen(s, c.id);
    const post = workerSnapshot(s).posts.find((p) => p.id === c.id)!;
    expect(post.tag).toBe("idle");
    expect(post.tile).toBeNull();
  });

  it("a gather crew is march on the road, then the node's task while working", () => {
    const s = createGameState({ seed: 1, now: 0, withStarterBuildings: false });
    s.units = [{ id: "troops", typeId: "militia", realmId: "player", count: "10", armyId: null }];
    s.citizens = [];
    const dest = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId)!;
    dest.node = "quarry";
    dest.occupantRealmId = null;
    expect(tryGather(s, dest.id, { militia: 4 })).toBe(true);
    let crew = workerSnapshot(s).posts.find((p) => p.kind === "crew")!;
    expect(crew).toMatchObject({ tag: "march", job: "quarry", provinceId: dest.id, heads: 4 });
    expect(unitActivityAt(s, dest.id)[0]?.doing).toBe("marching");
    new TickEngine(s).settleTicks(listGathers(s)[0].arrivesTick - s.meta.tick);
    crew = workerSnapshot(s).posts.find((p) => p.kind === "crew")!;
    expect(crew.tag).toBe("quarry");
    expect(unitActivityAt(s, dest.id)[0]?.doing).toBe("gathering");
  });

  it("is read-only and deterministic", () => {
    const s = starter();
    const before = JSON.stringify(s);
    const a = workerSnapshot(s);
    unitActivity(s);
    expect(JSON.stringify(s)).toBe(before);
    expect(workerSnapshot(s)).toEqual(a);
  });
});

describe("unit activity", () => {
  it("tags troops at home, marching, and garrisoned", () => {
    const s = createGameState({ seed: 1 });
    s.units.push({ id: "u_m", typeId: "militia", realmId: "player", count: "20", armyId: null });
    const home = unitActivity(s).find((a) => a.doing === "home")!;
    expect(home.provinceId).toBe(s.board.homeProvinceId);
    expect(home.label).toBe("At the hold");

    const camp = s.board.provinces.find((p) => p.node === "camp")!;
    plantOutpost(s, camp);
    expect(tryGarrison(s, camp.id, { militia: 3 })).toBe(true);
    const target = s.board.provinces.find((p) => p.node === "camp" && p.id !== camp.id && p.occupantRealmId !== "player")!;
    expect(tryMarchWith(s, target.id, { militia: 5 })).toBe(true);

    const acts = unitActivity(s);
    const marching = acts.find((a) => a.doing === "marching")!;
    expect(marching).toMatchObject({ provinceId: target.id, men: 5, label: "Marching" });
    expect(marching.arrivesTick).toBeGreaterThan(s.meta.tick);
    expect(acts.find((a) => a.doing === "garrisoned")).toMatchObject({ provinceId: camp.id, men: 3 });
    expect(home.men).toBeGreaterThan(acts.find((a) => a.doing === "home")!.men);
  });
});
