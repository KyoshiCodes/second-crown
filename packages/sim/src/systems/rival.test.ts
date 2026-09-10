import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { plantOutpost } from "./outpost.js";
import { listMarches } from "./march.js";
import { maybeContestFlag } from "./rival.js";

describe("rival contest", () => {
  it("sends an NPC column at a player flag", () => {
    const s = createGameState({ seed: 1 });
    const camp = s.board.provinces.find((p) => p.node === "camp")!;
    plantOutpost(s, camp);
    expect(maybeContestFlag(s, "rival", 400)).toBe(true);
    expect(listMarches(s).some((m) => m.realmId === "rival" && m.toId === camp.id)).toBe(true);
  });

  it("skips contest when a peace lock is up", () => {
    const s = createGameState({ seed: 1 });
    const camp = s.board.provinces.find((p) => p.node === "camp")!;
    plantOutpost(s, camp);
    s.flags.peace_rival_player = 10_000;
    expect(maybeContestFlag(s, "rival", 400)).toBe(false);
  });
});
