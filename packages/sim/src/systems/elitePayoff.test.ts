import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import { resolveRounds } from "./resolver.js";
import { resolveCampRaid, stacksFromForce } from "./engagement.js";
import { campTierId } from "./camp.js";
import { CAMP_TIERS } from "../content/camps.js";
import { RAID_STAGES } from "../content/raids.js";
import { roleMatchupNote, unitPayoffNote } from "../content/unitPayoff.js";

/**
 * Where cavalry, knights and siege actually matter. Each case pins one clause of
 * the payoff notes in content/unitPayoff.ts. Combat formulas are untouched.
 */
const SEEDS = 30;

function wins(atk: Record<string, number>, def: Record<string, number>, soak = 0): number {
  let n = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    if (resolveRounds(stacksFromForce("player", atk), stacksFromForce("foe", def), createRngStreams(seed), soak).attackerWins) n++;
  }
  return n;
}

function holds(col: Record<string, number>, guard: Record<string, number>, soak: number): number {
  let n = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    if (!resolveRounds(stacksFromForce("rival", col), stacksFromForce("player", guard), createRngStreams(seed), soak).attackerWins) n++;
  }
  return n;
}

const stockade = CAMP_TIERS.stockade;
/** Stockade fight as engagement.ts runs it: a Siege Engine in the column drops the palisade. */
const atStockade = (force: Record<string, number>) =>
  wins(force, stockade.guard!, (force.siege ?? 0) > 0 ? 0 : stockade.palisade);

describe("elite payoff: ordinary camps", () => {
  it("any elite clears an ordinary camp guard, but so do 5 militia: elites are not needed there", () => {
    const guard = { militia: 3 };
    expect(wins({ militia: 5 }, guard)).toBe(SEEDS);
    expect(wins({ cavalry: 3 }, guard)).toBe(SEEDS);
    expect(wins({ knight: 2 }, guard)).toBe(SEEDS);
  });
});

describe("elite payoff: the bandit stockade", () => {
  it("militia alone cannot take it, even 24 strong", () => {
    expect(atStockade({ militia: 24 })).toBe(0);
  });

  it("siege: one engine turns a 24-militia loss into a win (palisade ignored)", () => {
    expect(atStockade({ militia: 24, siege: 1 })).toBeGreaterThanOrEqual(26);
  });

  it("siege: five knights fail behind the palisade and win with one engine", () => {
    expect(atStockade({ knight: 5 })).toBe(0);
    expect(atStockade({ knight: 5, siege: 1 })).toBe(SEEDS);
  });

  it("knights: six take it outright, palisade and all", () => {
    expect(atStockade({ knight: 6 })).toBeGreaterThanOrEqual(29);
  });

  it("cavalry: a spear line stops them; paired with spearmen they win", () => {
    expect(atStockade({ cavalry: 8 })).toBeLessThanOrEqual(2);
    expect(atStockade({ cavalry: 8, spearman: 6 })).toBe(SEEDS);
  });

  it("the live camp raid agrees: siege in the column breaks a stockade the same column cannot", () => {
    const s: GameState = createGameState({ seed: 1 });
    const stock = s.board.provinces.find((p) => campTierId(s, p) === "stockade")!;
    let plain = 0;
    let sieged = 0;
    for (let i = 0; i < 10; i++) {
      if (resolveCampRaid(s, { realmId: "player", levy: 24, force: { militia: 24 } }, stock, createRngStreams(300 + i)) === "win") plain++;
      if (resolveCampRaid(s, { realmId: "player", levy: 25, force: { militia: 24, siege: 1 } }, stock, createRngStreams(300 + i)) === "win") sieged++;
    }
    expect(plain).toBe(0);
    expect(sieged).toBeGreaterThanOrEqual(6);
  });
});

describe("elite payoff: columns and raids", () => {
  it("cavalry ride down an archer screen that 16 militia or 6 spearmen cannot break", () => {
    const screen = { archer: 8, militia: 4 };
    expect(wins({ cavalry: 6 }, screen)).toBe(SEEDS);
    expect(wins({ militia: 16 }, screen)).toBe(0);
    expect(wins({ spearman: 6 }, screen)).toBe(0);
  });

  it("knights: four beside 20 militia hold a Keep III raid that 24 militia lose", () => {
    const col = { militia: RAID_STAGES.keep3.perType, spearman: RAID_STAGES.keep3.perType };
    expect(holds(col, { militia: 20, knight: 4 }, 12)).toBe(SEEDS);
    expect(holds(col, { militia: 24 }, 12)).toBe(0);
  });

  it("cavalry are the wrong answer to a spear raid: four horse do not save 16 militia", () => {
    const col = { militia: RAID_STAGES.keep3.perType, spearman: RAID_STAGES.keep3.perType };
    expect(holds(col, { militia: 16, cavalry: 4 }, 12)).toBe(0);
  });
});

describe("elite payoff notes", () => {
  it("reads the matchup half from the matchup table", () => {
    expect(roleMatchupNote("shock")).toBe("Strong vs archers ×1.4, skirmishers ×1.25 · weak vs line ×0.6");
    expect(roleMatchupNote("siege")).toBe("Strong vs line ×1.25 · weak vs horse ×0.7, archers ×0.8");
  });

  it("gives the exact notes for cavalry, knights and siege", () => {
    expect(unitPayoffNote("cavalry")).toBe(
      "Strong vs archers ×1.4, skirmishers ×1.25 · weak vs line ×0.6. Rides down archer screens; a spear line stops it."
    );
    expect(unitPayoffNote("knight")).toBe(
      "Strong vs archers ×1.4, skirmishers ×1.25 · weak vs line ×0.6. Six take the bandit stockade; four steady a home guard."
    );
    expect(unitPayoffNote("siege")).toBe(
      "Strong vs line ×1.25 · weak vs horse ×0.7, archers ×0.8. Ignores camp palisades: one turns a stockade loss into a win."
    );
  });

  it("other elites get the matchup half only; ordinary units get no note", () => {
    expect(unitPayoffNote("lancer")).toBe("Strong vs archers ×1.4, skirmishers ×1.25 · weak vs line ×0.6.");
    expect(unitPayoffNote("ironclad")).toBe("Strong vs horse ×1.4, skirmishers ×1.15 · weak vs archers ×0.6.");
    expect(unitPayoffNote("militia")).toBeNull();
    expect(unitPayoffNote("spearman")).toBeNull();
    expect(unitPayoffNote("nope")).toBeNull();
  });
});
