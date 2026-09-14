import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { plantOutpost } from "./outpost.js";
import { maybeContestFlag } from "./rival.js";
import { incomingOnProvince, incomingOnPlayerFlags } from "./incoming.js";

describe("incoming contest", () => {
  it("lists an NPC column bound for a player flag", () => {
    const s = createGameState({ seed: 1 });
    const camp = s.board.provinces.find((p) => p.node === "camp")!;
    plantOutpost(s, camp);
    expect(maybeContestFlag(s, "rival", 400)).toBe(true);
    const hit = incomingOnProvince(s, camp.id);
    expect(hit?.realmId).toBe("rival");
    expect(incomingOnPlayerFlags(s).some((m) => m.toId === camp.id)).toBe(true);
  });
});
