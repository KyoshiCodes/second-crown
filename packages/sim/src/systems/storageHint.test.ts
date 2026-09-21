import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { fullStores } from "./storageHint.js";

describe("full store hints", () => {
  it("is empty when nothing is capped", () => {
    const s = createGameState({ seed: 1 });
    s.resources.food = "1";
    s.resources.wood = "1";
    s.resources.stone = "1";
    s.resources.gold = "1";
    expect(fullStores(s)).toHaveLength(0);
  });

  it("names the granary when food is full", () => {
    const s = createGameState({ seed: 1 });
    s.resources.food = "99999";
    const hit = fullStores(s).find((x) => x.res === "food");
    expect(hit?.label).toBe("Granary");
  });
});
