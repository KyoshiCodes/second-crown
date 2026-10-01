import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import { getUnitType } from "../content/units.js";
import { resolveRounds, type Stack } from "./resolver.js";
import { resolveBattle } from "./combat.js";

function stack(realmId: string, typeId: string, count: number): Stack {
  const d = getUnitType(typeId)!;
  return { realmId, typeId, count, hp: count * d.hp, morale: 100, role: d.role, attack: d.attack, defense: d.defense, hpEach: d.hp };
}

function column(): Stack[] {
  return [stack("rival", "militia", 6), stack("rival", "spearman", 6)];
}

describe("raid mercy", () => {
  it("one rim wall's soak lets 20 militia hold against a 12-levy", () => {
    expect(resolveRounds(column(), [stack("player", "militia", 20)], createRngStreams(1), 0).attackerWins).toBe(true);
    expect(resolveRounds(column(), [stack("player", "militia", 20)], createRngStreams(1), 12).attackerWins).toBe(false);
  });

  it("a home siege fights the marching column, not the rival's whole realm", () => {
    const s = createGameState({ seed: 1 });
    s.units = [
      { realmId: "rival", typeId: "militia", count: "100" },
      { realmId: "rival", typeId: "spearman", count: "50" },
      { realmId: "player", typeId: "militia", count: "26" },
    ] as typeof s.units;
    const war = { id: "w", attackerRealmId: "rival", defenderRealmId: "player", startedTick: 0, status: "active" as const };
    const r = resolveBattle(s, war, createRngStreams(1), { wallSoak: 12, attackerForce: { militia: 6, spearman: 6 } });
    expect(r.winnerId).toBe("player");
    const rival = (t: string) => Number(s.units.find((u) => u.realmId === "rival" && u.typeId === t)?.count ?? 0);
    // Only the column bled; the realm's home host is untouched beyond the column's losses.
    expect(rival("militia")).toBeGreaterThanOrEqual(94);
    expect(rival("spearman")).toBeGreaterThanOrEqual(44);
    expect(rival("militia") + rival("spearman")).toBeLessThan(150);
  });
});
