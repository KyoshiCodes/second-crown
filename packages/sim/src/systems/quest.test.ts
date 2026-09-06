import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { listQuests, tryClaimQuest } from "./quest.js";

describe("quests", () => {
  it("claims chapel quest after building one", () => {
    const s = createGameState({ seed: 8 });
    expect(listQuests(s)[0].complete).toBe(false);
    expect(tryClaimQuest(s, "raise_chapel")).toBe(false);
    s.buildings.push({
      id: "c1",
      typeId: "chapel",
      realmId: "player",
      x: 3,
      y: 3,
      level: 1,
      completesAtTick: null,
    });
    expect(listQuests(s)[0].complete).toBe(true);
    expect(tryClaimQuest(s, "raise_chapel")).toBe(true);
    expect(tryClaimQuest(s, "raise_chapel")).toBe(false);
  });
});
