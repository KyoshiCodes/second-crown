import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import { resolveRounds } from "./resolver.js";
import { stacksFromForce } from "./engagement.js";
import { breachRun, homeRaidGap, homeRaidPerType, noteHomeSiegeResult, raidStage } from "./raidPressure.js";
import { HOME_RAID_FIRST_TICK, maybeNpcRaid } from "./raidMarch.js";
import { listMarches } from "./march.js";
import { BREACH_RESPITE_TICKS, RAID_STAGES } from "../content/raids.js";

function addBuilding(s: GameState, typeId: string, x: number, y: number, level = 1): void {
  s.buildings.push({ id: `${typeId}_${x}_${y}`, typeId, realmId: "player", x, y, level, completesAtTick: null });
}

/** Seeds 1..30: how many times the player's home guard holds against a rival column behind `soak` wall HP. */
function holds(col: Record<string, number>, guard: Record<string, number>, soak: number): number {
  let held = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const fight = resolveRounds(stacksFromForce("rival", col), stacksFromForce("player", guard), createRngStreams(seed), soak);
    if (!fight.attackerWins) held++;
  }
  return held;
}

const column = (n: number) => ({ militia: n, spearman: n });
/** One rim wall soaks 12, two soak 24 (march.ts wallHp). */
const ONE_WALL = 12;
const TWO_WALLS = 24;

describe("raid pressure milestones", () => {
  it("picks the stage from finished walls and the Keep", () => {
    const s = createGameState({ seed: 3 });
    expect(raidStage(s).id).toBe("unwalled");
    addBuilding(s, "walls", 0, 3);
    expect(raidStage(s).id).toBe("walled");
    addBuilding(s, "keep", 5, 5, 1);
    expect(raidStage(s).id).toBe("walled");
    s.buildings.find((b) => b.typeId === "keep")!.level = 2;
    expect(raidStage(s).id).toBe("keep2");
    s.buildings.find((b) => b.typeId === "keep")!.level = 3;
    expect(raidStage(s).id).toBe("keep3");
    expect([homeRaidPerType(s), homeRaidGap(s)]).toEqual([8, 3_600]);
  });

  it("a scaffolded wall does not count yet", () => {
    const s = createGameState({ seed: 3 });
    s.buildings.push({ id: "w", typeId: "walls", realmId: "player", x: 0, y: 3, level: 1, completesAtTick: 999 });
    expect(raidStage(s).id).toBe("unwalled");
  });

  it("caps the home-raid column per unit type by stage", () => {
    const s = createGameState({ seed: 1 });
    s.units = s.units.filter((u) => u.realmId !== "rival");
    s.units.push({ realmId: "rival", typeId: "militia", count: "60" }, { realmId: "rival", typeId: "spearman", count: "40" });
    expect(maybeNpcRaid(s, "rival", HOME_RAID_FIRST_TICK)).toBe(true);
    const m = listMarches(s).find((x) => x.realmId === "rival")!;
    expect(m.force).toEqual({ militia: 4, spearman: 4 });
  });

  it("unwalled 4+4 is held by a fresh guard with no wall; walled 6+6 by 20 militia behind one wall", () => {
    expect(holds(column(RAID_STAGES.unwalled.perType), { militia: 16 }, 0)).toBe(30);
    expect(holds(column(RAID_STAGES.walled.perType), { militia: 20 }, ONE_WALL)).toBeGreaterThanOrEqual(15);
    expect(holds(column(RAID_STAGES.walled.perType), { militia: 24 }, ONE_WALL)).toBe(30);
  });

  it("Keep II 7+7: two walls and 24 militia hold, or 20 militia with 6 spearmen", () => {
    const col = column(RAID_STAGES.keep2.perType);
    expect(holds(col, { militia: 24 }, TWO_WALLS)).toBeGreaterThanOrEqual(27);
    expect(holds(col, { militia: 20, spearman: 6 }, ONE_WALL)).toBe(30);
    expect(holds(col, { militia: 20 }, ONE_WALL)).toBe(0);
  });

  it("Keep III 8+8: 28 militia need two walls; four knights let 20 militia hold behind one", () => {
    const col = column(RAID_STAGES.keep3.perType);
    expect(holds(col, { militia: 28 }, TWO_WALLS)).toBeGreaterThanOrEqual(27);
    expect(holds(col, { militia: 20, knight: 4 }, ONE_WALL)).toBe(30);
    expect(holds(col, { militia: 24 }, ONE_WALL)).toBe(0);
  });

  it("an empty hold always falls, so recovery comes from the respite, not the fight", () => {
    expect(holds(column(2), {}, TWO_WALLS)).toBe(0);
  });
});

describe("breach recovery", () => {
  it("a breach adds respite and trims the next column; a held raid resets both", () => {
    const s = createGameState({ seed: 2 });
    addBuilding(s, "walls", 0, 3);
    expect([breachRun(s), homeRaidGap(s), homeRaidPerType(s)]).toEqual([0, 1_500, 6]);
    noteHomeSiegeResult(s, false);
    expect([breachRun(s), homeRaidGap(s), homeRaidPerType(s)]).toEqual([1, 1_500 + BREACH_RESPITE_TICKS[1], 4]);
    noteHomeSiegeResult(s, false);
    expect([breachRun(s), homeRaidGap(s), homeRaidPerType(s)]).toEqual([2, 1_500 + BREACH_RESPITE_TICKS[2], 2]);
    noteHomeSiegeResult(s, false);
    noteHomeSiegeResult(s, false);
    expect([breachRun(s), homeRaidGap(s), homeRaidPerType(s)]).toEqual([4, 1_500 + 36_000, 2]);
    noteHomeSiegeResult(s, true);
    expect([breachRun(s), homeRaidGap(s), homeRaidPerType(s)]).toEqual([0, 1_500, 6]);
  });

  it("the next home raid waits out the respite after a breach", () => {
    const s = createGameState({ seed: 1 });
    expect(maybeNpcRaid(s, "rival", HOME_RAID_FIRST_TICK)).toBe(true);
    s.flags.marches_json = "[]";
    noteHomeSiegeResult(s, false);
    const due = HOME_RAID_FIRST_TICK + RAID_STAGES.unwalled.gap + BREACH_RESPITE_TICKS[1];
    expect(maybeNpcRaid(s, "rival", due - 100)).toBe(false);
    expect(maybeNpcRaid(s, "rival", due)).toBe(true);
    // The breach also trimmed the column: unwalled 4 per type, minus 2.
    expect(listMarches(s).find((m) => m.realmId === "rival")!.force).toMatchObject({ militia: 2 });
  });

  it("older saves with no breach flag read as run 0", () => {
    const s = createGameState({ seed: 4 });
    delete s.flags.home_raid_breach_run;
    expect(breachRun(s)).toBe(0);
    s.flags.home_raid_breach_run = "junk" as unknown as number;
    expect(breachRun(s)).toBe(0);
  });
});
