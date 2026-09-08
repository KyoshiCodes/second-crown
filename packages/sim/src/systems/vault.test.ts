import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { takePlunder, vaultProtects } from "./vault.js";

describe("vault", () => {
  it("will not drain below the protected floor", () => {
    const s = createGameState({ seed: 1 });
    s.resources.food = "80";
    const floor = vaultProtects(s, "food");
    const took = takePlunder(s, "food", 10_000);
    expect(took).toBeGreaterThan(0);
    expect(Number(s.resources.food)).toBe(floor);
  });
});
