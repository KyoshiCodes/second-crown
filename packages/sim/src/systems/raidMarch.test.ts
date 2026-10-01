import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { HOME_RAID_FIRST_TICK, HOME_RAID_GAP, incomingOnHome, maybeNpcRaid, watchtowerWarning } from "./raidMarch.js";
import { listMarches } from "./march.js";

describe("W10 npc raid", () => {
  it("Iron March can be sent at the home hold", () => {
    const s = createGameState({ seed: 1 });
    expect(maybeNpcRaid(s, "rival", 200)).toBe(false);
    expect(maybeNpcRaid(s, "rival", HOME_RAID_FIRST_TICK)).toBe(true);
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

  it("waits for the first-raid tick, then spaces raids by the gap", () => {
    const s = createGameState({ seed: 1 });
    expect(maybeNpcRaid(s, "rival", HOME_RAID_FIRST_TICK - 500)).toBe(false);
    expect(maybeNpcRaid(s, "rival", HOME_RAID_FIRST_TICK)).toBe(true);
    s.flags.marches_json = "[]";
    expect(maybeNpcRaid(s, "rival", HOME_RAID_FIRST_TICK + 500)).toBe(false);
    expect(maybeNpcRaid(s, "rival", HOME_RAID_FIRST_TICK + HOME_RAID_GAP - 100)).toBe(false);
    expect(maybeNpcRaid(s, "rival", HOME_RAID_FIRST_TICK + HOME_RAID_GAP)).toBe(true);
  });
});
