import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { applyMarshalBonuses, playerMarshal, tryAppointMarshal } from "./marshal.js";
import { stacksFor } from "./resolver.js";

describe("marshal schema", () => {
  it("appoints one player marshal and clears the last", () => {
    const s = createGameState({ seed: 1 });
    const ruler = s.characters.find((c) => c.realmId === "player");
    expect(ruler).toBeTruthy();
    expect(tryAppointMarshal(s, ruler!.id, "line")).toBe(true);
    expect(playerMarshal(s)?.marshalTree).toBe("line");
    expect(tryAppointMarshal(s, ruler!.id, "shock")).toBe(true);
    expect(playerMarshal(s)?.marshalTree).toBe("shock");
    expect(s.characters.filter((c) => c.realmId === "player" && c.marshalTree).length).toBe(1);
  });

  it("rejects unknown characters and unknown trees", () => {
    const s = createGameState({ seed: 1 });
    expect(tryAppointMarshal(s, "nope", "line")).toBe(false);
    expect(tryAppointMarshal(s, s.characters[0].id, "dragon" as never)).toBe(false);
  });

  it("bonus hook is currently identity", () => {
    const s = createGameState({ seed: 1 });
    const stacks = stacksFor(s, "player");
    const after = applyMarshalBonuses(stacks, playerMarshal(s));
    expect(after).toBe(stacks);
  });
});
