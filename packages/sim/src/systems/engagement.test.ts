import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import { tryAppointMarshal } from "./marshal.js";
import { resolveColumnClash, stacksFromForce } from "./engagement.js";

describe("board column clash", () => {
  it("uses column counts, not the home army", () => {
    const s = createGameState({ seed: 3 });
    const home = s.units.find((u) => u.realmId === "player" && u.typeId === "militia");
    if (home) home.count = "40";
    const a = { realmId: "player", levy: 5, force: { militia: 5 } };
    const b = { realmId: "rival", levy: 4, force: { militia: 4 } };
    resolveColumnClash(s, a, b, createRngStreams(3));
    const stillHome = s.units.find((u) => u.realmId === "player" && u.typeId === "militia");
    expect(Number(stillHome?.count ?? 0)).toBeGreaterThanOrEqual(40);
    expect((a.levy ?? 0) + (b.levy ?? 0)).toBeLessThan(9);
  });

  it("Line Hold still applies to player line stacks", () => {
    const s = createGameState({ seed: 4 });
    const ruler = s.characters.find((c) => c.realmId === "player")!;
    tryAppointMarshal(s, ruler.id, "line");
    const stacks = stacksFromForce("player", { militia: 8 });
    const before = stacks[0].defense;
    const { applyMarshalBonuses, playerMarshal } = require("./marshal.js") as typeof import("./marshal.js");
    applyMarshalBonuses(stacks, playerMarshal(s));
    expect(stacks[0].defense).toBeGreaterThan(before);
  });

  it("same seed same winner", () => {
    const run = (seed: number) => {
      const s = createGameState({ seed });
      const a = { realmId: "player", levy: 8, force: { militia: 8 } };
      const b = { realmId: "rival", levy: 8, force: { militia: 8 } };
      return resolveColumnClash(s, a, b, createRngStreams(seed)).attackerWins;
    };
    expect(run(11)).toBe(run(11));
  });
});
