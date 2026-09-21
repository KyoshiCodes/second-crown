import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import { createRngStreams } from "../core/rng.js";
import { applyMarshalBonuses, playerMarshal, tryAppointMarshal } from "./marshal.js";
import { resolveColumnClash, resolveHoldStorm, stacksFromForce } from "./engagement.js";
import { listOutposts } from "./outpost.js";
import { woundedCount } from "./ward.js";

function giveHomeMilitia(s: ReturnType<typeof createGameState>, count: string) {
  const u = s.units.find((x) => x.realmId === "player" && x.typeId === "militia");
  if (u) u.count = count;
  else s.units.push({ id: "u_militia_home", typeId: "militia", realmId: "player", count, armyId: null });
}

describe("board column clash", () => {
  it("uses column counts, not the home army", () => {
    const s = createGameState({ seed: 3 });
    giveHomeMilitia(s, "40");
    const a = { realmId: "player", levy: 5, force: { militia: 5 } };
    const b = { realmId: "rival", levy: 4, force: { militia: 4 } };
    resolveColumnClash(s, a, b, createRngStreams(3));
    const stillHome = s.units.find((u) => u.realmId === "player" && u.typeId === "militia");
    expect(Number(stillHome?.count ?? 0)).toBeGreaterThanOrEqual(40);
    expect((a.levy ?? 0) + (b.levy ?? 0)).toBeLessThan(9);
  });

  it("Line Hold still applies to player line stacks", () => {
    const s = createGameState({ seed: 4 });
    const ruler = s.characters.find((c) => c.realmId === "player")!;
    tryAppointMarshal(s, ruler.id, "line");
    const stacks = stacksFromForce("player", { militia: 8 });
    const before = stacks[0].defense;
    applyMarshalBonuses(stacks, playerMarshal(s));
    expect(stacks[0].defense).toBeGreaterThan(before);
  });

  it("same seed same winner", () => {
    const run = (seed: number) => {
      const s = createGameState({ seed });
      const a = { realmId: "player", levy: 8, force: { militia: 8 } };
      const b = { realmId: "rival", levy: 8, force: { militia: 8 } };
      return resolveColumnClash(s, a, b, createRngStreams(seed)).attackerWins;
    };
    expect(run(11)).toBe(run(11));
  });

  it("storming a rival field plants a player flag", () => {
    const s = createGameState({ seed: 6 });
    giveHomeMilitia(s, "0");
    const dest = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId && p.node !== "hold")!;
    dest.occupantRealmId = "rival";
    dest.node = "field";
    const col = { realmId: "player", levy: 16, force: { militia: 16 } };
    const outcome = resolveHoldStorm(s, col, dest, createRngStreams(6));
    expect(outcome).toBe("stormed");
    expect(dest.occupantRealmId).toBe("player");
    expect(listOutposts(s).some((p) => p.id === dest.id)).toBe(true);
  });

  it("player losses from a column fight go to the ward", () => {
    const s = createGameState({ seed: 8 });
    s.buildings.push({
      id: "inf1",
      typeId: "infirmary",
      realmId: "player",
      x: 2,
      y: 2,
      level: 1,
      completesAtTick: null,
    });
    const a = { realmId: "player", levy: 3, force: { militia: 3 } };
    const b = { realmId: "rival", levy: 20, force: { militia: 20 } };
    resolveColumnClash(s, a, b, createRngStreams(8));
    expect(woundedCount(s)).toBeGreaterThan(0);
  });
});
