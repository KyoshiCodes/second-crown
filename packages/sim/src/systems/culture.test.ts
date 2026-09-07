import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { setPlayerCulture, playerCultureId } from "./culture.js";
import { tickWorldPulse } from "./rival.js";

describe("cultures and world pulse", () => {
  it("sets a player culture", () => {
    const s = createGameState({ seed: 1 });
    expect(setPlayerCulture(s, "woodland")).toBe(true);
    expect(playerCultureId(s)).toBe("woodland");
    expect(s.realms.find((r) => r.id === "player")?.lifestyle).toBe("Cedar Kin");
  });

  it("npc pulse can claim a node", () => {
    const s = createGameState({ seed: 2 });
    const before = s.board.provinces.filter((p) => p.occupantRealmId && p.occupantRealmId !== "player").length;
    tickWorldPulse(s, 100);
    const after = s.board.provinces.filter((p) => p.occupantRealmId && p.occupantRealmId !== "player").length;
    expect(after).toBeGreaterThanOrEqual(before);
  });
});
