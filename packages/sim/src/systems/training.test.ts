import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TickEngine } from "../core/tickEngine.js";
import { tryTrain } from "../actions/train.js";
import { listTraining, trainDurationTicks } from "./training.js";

describe("training queue", () => {
  it("spends resources now and delivers troops when the queue finishes", () => {
    const s = createGameState({ seed: 1 });
    s.resources.food = "100";
    s.resources.wood = "100";
    expect(tryTrain(s, { typeId: "militia", count: 2 })).toBe(true);
    expect(s.units.find((u) => u.typeId === "militia")).toBeUndefined();
    const jobs = listTraining(s);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].count).toBe(2);
    const wait = trainDurationTicks(s, "militia", 2);
    expect(wait).toBeGreaterThan(1);
    new TickEngine(s).settleTicks(wait);
    expect(Number(s.units.find((u) => u.typeId === "militia")?.count ?? 0)).toBe(2);
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
});
