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

  it("scout step advances on any revealed far tile, no Scout column needed", () => {
    const s = createGameState({ seed: 1 });
    s.flags.tutorial_index = 3;
    expect(currentTutorial(s)?.id).toBe("scout");
    expect(tryAdvanceTutorial(s)).toBe(false);
    const far = s.board.provinces.find(
      (p) => p.id !== s.board.homeProvinceId && Math.abs(p.x - 2) + Math.abs(p.y - 2) >= 2
    )!;
    const seen = JSON.parse(String(s.flags.fog_seen)) as string[];
    s.flags.fog_seen = JSON.stringify([...seen, far.id]);
    expect(tryAdvanceTutorial(s)).toBe(true);
    expect(currentTutorial(s)?.id).toBe("train");
  });

  it("scout step text does not demand a paid Scout column", () => {
    const step = TUTORIAL_STEPS.find((x) => x.id === "scout")!;
    expect(step.text).toMatch(/two or more steps/);
    expect(step.text).not.toMatch(/press Scout column/i);
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
