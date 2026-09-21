import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { tryTrain } from "../actions/train.js";
import { listTraining, trainDurationTicks, trainingQueueCap, tryCancelTraining } from "./training.js";
import { D } from "../core/decimal.js";

function playerMilitia(state: ReturnType<typeof createGameState>) {
  return state.units.find((u) => u.typeId === "militia" && u.realmId === "player");
}

function keepAt(s: ReturnType<typeof createGameState>, level: number) {
  const keep = s.buildings.find((b) => b.typeId === "keep" && b.realmId === "player");
  if (keep) {
    keep.level = level;
    keep.completesAtTick = null;
  } else {
    s.buildings.push({
      id: "keep_t",
      typeId: "keep",
      realmId: "player",
      x: 3,
      y: 3,
      level,
      completesAtTick: null,
    });
  }
}

describe("training queue", () => {
  it("spends resources now and delivers troops when the queue finishes", () => {
    const s = createGameState({ seed: 1 });
    s.resources.food = "100";
    s.resources.wood = "100";
    expect(playerMilitia(s)).toBeUndefined();
    expect(tryTrain(s, { typeId: "militia", count: 2 })).toBe(true);
    expect(playerMilitia(s)).toBeUndefined();
    const jobs = listTraining(s);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].count).toBe(2);
    const wait = trainDurationTicks(s, "militia", 2);
    expect(wait).toBeGreaterThan(1);
    new TickEngine(s).settleTicks(wait);
    expect(Number(playerMilitia(s)?.count ?? 0)).toBe(2);
    expect(listTraining(s)).toHaveLength(0);
  });

  it("stacks a second job after the first finishes", () => {
    const s = createGameState({ seed: 2 });
    s.resources.food = "200";
    s.resources.wood = "200";
    tryTrain(s, { typeId: "militia", count: 1 });
    tryTrain(s, { typeId: "militia", count: 1 });
    expect(listTraining(s)).toHaveLength(2);
    expect(listTraining(s)[1].startedTick).toBe(listTraining(s)[0].doneTick);
  });

  it("cancels a waiting job and refunds the full cost", () => {
    const s = createGameState({ seed: 3 });
    s.resources.food = "100";
    s.resources.wood = "100";
    tryTrain(s, { typeId: "militia", count: 1 });
    tryTrain(s, { typeId: "militia", count: 1 });
    const waiting = listTraining(s)[1];
    expect(tryCancelTraining(s, waiting.id)).toBe(true);
    expect(listTraining(s)).toHaveLength(1);
    expect(D(s.resources.food).eq(96)).toBe(true);
    expect(D(s.resources.wood).eq(99)).toBe(true);
    expect(playerMilitia(s)).toBeUndefined();
  });

  it("Keep I stops at two drills; Keep II opens a third and drills faster", () => {
    const s = createGameState({ seed: 4 });
    s.resources.food = "400";
    s.resources.wood = "400";
    expect(trainingQueueCap(s)).toBe(2);
    const slow = trainDurationTicks(s, "militia", 1);
    expect(tryTrain(s, { typeId: "militia", count: 1 })).toBe(true);
    expect(tryTrain(s, { typeId: "militia", count: 1 })).toBe(true);
    expect(tryTrain(s, { typeId: "militia", count: 1 })).toBe(false);
    keepAt(s, 2);
    expect(trainingQueueCap(s)).toBe(3);
    expect(trainDurationTicks(s, "militia", 1)).toBeLessThan(slow);
    expect(tryTrain(s, { typeId: "militia", count: 1 })).toBe(true);
    expect(listTraining(s)).toHaveLength(3);
  });
});
