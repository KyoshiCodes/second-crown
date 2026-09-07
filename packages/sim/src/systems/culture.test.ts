import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { setPlayerCulture, playerCultureId } from "./culture.js";
import { tickWorldPulse } from "./rival.js";
import { ensureBoard } from "./board.js";

describe("cultures and world pulse", () => {
  it("sets a player culture", () => {
    const s = createGameState({ seed: 1 });
    expect(setPlayerCulture(s, "woodland")).toBe(true);
    expect(playerCultureId(s)).toBe("woodland");
    expect(s.realms.find((r) => r.id === "player")?.lifestyle).toBe("Cedar Kin");
  });

  it("every npc crown can own a tile after pulses", () => {
    const s = createGameState({ seed: 2 });
    ensureBoard(s);
    const extras = s.realms.filter((r) => r.id !== "player");
    expect(extras.length).toBeGreaterThan(1);
    for (const tick of [200, 400, 600, 800, 1000]) tickWorldPulse(s, tick);
    const owners = new Set(s.board.provinces.map((p) => p.occupantRealmId).filter(Boolean));
    const acting = extras.filter((r) => owners.has(r.id)).length;
    expect(acting).toBeGreaterThan(1);
  });
});
