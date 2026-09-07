import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { incomingOnHome, maybeNpcRaid, watchtowerWarning } from "./raidMarch.js";
import { listMarches } from "./march.js";

describe("W10 npc raid", () => {
  it("Iron March can be sent at the home hold", () => {
    const s = createGameState({ seed: 1 });
    expect(maybeNpcRaid(s, "rival", 200)).toBe(true);
    expect(listMarches(s).some((m) => m.realmId === "rival")).toBe(true);
    expect(incomingOnHome(s).length).toBe(1);
    expect(watchtowerWarning(s)).toBeUndefined();
    s.buildings.push({
      id: "t",
      typeId: "watchtower",
      realmId: "player",
      x: 0,
      y: 4,
      level: 1,
      completesAtTick: null,
    });
    expect(watchtowerWarning(s)?.realmId).toBe("rival");
  });
});
