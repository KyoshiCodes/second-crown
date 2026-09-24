import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { TUTORIAL_STEPS, currentTutorial, skipTutorial, tryAdvanceTutorial, tutorialDone } from "./tutorial.js";

describe("primer v2", () => {
  it("starts on farm and refuses advance without a farm", () => {
    const s = createGameState({ seed: 1 });
    expect(currentTutorial(s)?.id).toBe("farm");
    expect(tryAdvanceTutorial(s)).toBe(false);
  });

  it("advances farm after a finished farm exists", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push({
      id: "f",
      typeId: "farm",
      realmId: "player",
      x: 2,
      y: 2,
      level: 1,
      completesAtTick: null,
    });
    expect(tryAdvanceTutorial(s)).toBe(true);
    expect(currentTutorial(s)?.id).toBe("cottage");
  });

  it("skip marks the primer done", () => {
    const s = createGameState({ seed: 1 });
    skipTutorial(s);
    expect(tutorialDone(s)).toBe(true);
    expect(currentTutorial(s)).toBeNull();
  });

  it("has nine steps covering hold board army crown", () => {
    expect(TUTORIAL_STEPS.length).toBe(9);
    expect(TUTORIAL_STEPS.map((x) => x.id)).toEqual([
      "farm",
      "cottage",
      "board",
      "scout",
      "train",
      "march",
      "flag",
      "walls",
      "lectern",
    ]);
  });
});
