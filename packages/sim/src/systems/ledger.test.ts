import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { tryAppointMarshal } from "./marshal.js";
import { listLedger, recordCrown } from "./ledger.js";

describe("ledger of crowns", () => {
  it("records marshal acts and world notes", () => {
    const s = createGameState({ seed: 1 });
    const ruler = s.characters.find((c) => c.realmId === "player")!;
    tryAppointMarshal(s, ruler.id, "line");
    recordCrown(s, "battle", "Iron March broke at the gate.");
    s.wars.push({
      id: "w1",
      attackerRealmId: "player",
      defenderRealmId: "rival",
      startedTick: 10,
      endedTick: 20,
      status: "attacker_won",
    });
    const rows = listLedger(s);
    expect(rows.some((r) => r.kind === "marshal")).toBe(true);
    expect(rows.some((r) => r.kind === "battle")).toBe(true);
    expect(rows.some((r) => r.kind === "attacker_won")).toBe(true);
  });
});
