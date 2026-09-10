import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import { plantOutpost, listOutposts, outpostTithePerTick, applyOutpostTithe } from "./outpost.js";
import { currentTutorial, skipTutorial, tryAdvanceTutorial } from "./tutorial.js";
import { resolveMarchArrival } from "./march.js";
import { D } from "../core/decimal.js";

describe("W18 outpost and tutorial", () => {
  it("plants a flag on a cleared camp tile", () => {
    const s = createGameState({ seed: 1 });
    const camp = s.board.provinces.find((p) => p.node === "camp")!;
    expect(plantOutpost(s, camp)).toBe(true);
    expect(listOutposts(s).some((p) => p.id === camp.id)).toBe(true);
  });

  it("skips the primer", () => {
    const s = createGameState({ seed: 1 });
    expect(currentTutorial(s)?.id).toBe("farm");
    skipTutorial(s);
    expect(currentTutorial(s)).toBeNull();
  });

  it("advances farm after a finished farm exists", () => {
    const s = createGameState({ seed: 1 });
    expect(tryAdvanceTutorial(s)).toBe(false);
    s.buildings.push({
      id: "f",
      typeId: "farm",
      realmId: "player",
      x: 3,
      y: 3,
      level: 1,
      completesAtTick: null,
    });
    expect(tryAdvanceTutorial(s)).toBe(true);
    expect(currentTutorial(s)?.id).toBe("board");
  });

  it("raid arrival plants a player flag", () => {
    const s = createGameState({ seed: 1 });
    const camp = s.board.provinces.find((p) => p.node === "camp")!;
    const home = s.board.homeProvinceId;
    const msg = resolveMarchArrival(
      s,
      {
        id: "m_test",
        realmId: "player",
        fromId: home,
        toId: camp.id,
        arrivesTick: s.meta.tick,
        kind: "camp",
        levy: 5,
      },
      createRngStreams(1)
    );
    expect(msg).toMatch(/Flag planted/);
    expect(listOutposts(s).some((p) => p.id === camp.id)).toBe(true);
  });

  it("flagged field drips a food tithe", () => {
    const s = createGameState({ seed: 1 });
    const camp = s.board.provinces.find((p) => p.node === "camp")!;
    plantOutpost(s, camp);
    const before = D(s.resources.food);
    applyOutpostTithe(s, 100);
    expect(D(s.resources.food).gt(before)).toBe(true);
    expect(outpostTithePerTick(s).food).toBeGreaterThan(0);
  });
});
