import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { applyMarshalBonuses, playerMarshal, tryAppointMarshal } from "./marshal.js";
import { stacksFor } from "./resolver.js";

function give(s: ReturnType<typeof createGameState>, typeId: string, count = "8") {
  const u = s.units.find((x) => x.realmId === "player" && x.typeId === typeId);
  if (u) u.count = count;
  else s.units.push({ id: `u_${typeId}`, typeId, realmId: "player", count, armyId: null });
}

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

  it("Line Hold raises line defense and opening morale", () => {
    const s = createGameState({ seed: 1 });
    const ruler = s.characters.find((c) => c.realmId === "player")!;
    tryAppointMarshal(s, ruler.id, "line");
    give(s, "militia");
    const stacks = stacksFor(s, "player");
    const line = stacks.find((x) => x.role === "line" || x.typeId === "militia");
    expect(line).toBeTruthy();
    const def0 = line!.defense;
    const mor0 = line!.morale;
    applyMarshalBonuses(stacks, playerMarshal(s));
    expect(line!.defense).toBeGreaterThan(def0);
    expect(line!.morale).toBeGreaterThan(mor0);
  });

  it("Shock Charge and Ranged Volley raise attack", () => {
    const s = createGameState({ seed: 1 });
    const ruler = s.characters.find((c) => c.realmId === "player")!;
    give(s, "cavalry");
    give(s, "archer");
    tryAppointMarshal(s, ruler.id, "shock");
    const shockStacks = stacksFor(s, "player");
    const cav = shockStacks.find((x) => x.typeId === "cavalry")!;
    const atk0 = cav.attack;
    applyMarshalBonuses(shockStacks, playerMarshal(s));
    expect(cav.attack).toBeGreaterThan(atk0);

    tryAppointMarshal(s, ruler.id, "ranged");
    const rangeStacks = stacksFor(s, "player");
    const bow = rangeStacks.find((x) => x.typeId === "archer")!;
    const bow0 = bow.attack;
    applyMarshalBonuses(rangeStacks, playerMarshal(s));
    expect(bow.attack).toBeGreaterThan(bow0);
  });
});
