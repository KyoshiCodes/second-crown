import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import type { GameState } from "@second-crown/shared";
import {
  applyUpkeep,
  armyMouths,
  upkeepPerTick,
  starveShed,
  starveTicks,
  STARVE_GRACE_TICKS,
  STARVE_PULSE_TICKS,
} from "./upkeep.js";
import { D } from "../core/decimal.js";
import { TickEngine } from "../core/tickEngine.js";

describe("W16 upkeep", () => {
  it("charges food for standing troops", () => {
    const s = createGameState({ seed: 1 });
    s.units.push({ id: "m", typeId: "militia", realmId: "player", count: "10", armyId: null });
    s.resources.food = "5";
    expect(armyMouths(s)).toBe(10);
    expect(upkeepPerTick(s)).toBeCloseTo(0.2);
    applyUpkeep(s, 10);
    expect(D(s.resources.food).toNumber()).toBeCloseTo(3);
  });

  it("deserts one militia when the larder is empty", () => {
    const s = createGameState({ seed: 1 });
    s.units.push({ id: "m", typeId: "militia", realmId: "player", count: "4", armyId: null });
    s.resources.food = "0";
    applyUpkeep(s, 1);
    expect(D(s.units.find((u) => u.id === "m")?.count ?? "0").toNumber()).toBe(3);
  });
});

describe("trained troops starve by pulses", () => {
  function camp(food: string): GameState {
    const s = createGameState({ seed: 1 });
    s.units = s.units.filter((u) => u.realmId !== "player");
    s.units.push({ id: "sp", typeId: "spearman", realmId: "player", count: "200", armyId: null });
    s.units.push({ id: "kn", typeId: "knight", realmId: "player", count: "10", armyId: null });
    s.resources.food = food;
    return s;
  }
  const count = (s: GameState, id: string) => D(s.units.find((u) => u.id === id)?.count ?? "0").toNumber();
  const starve = (s: GameState, n: number) => {
    for (let i = 0; i < n; i++) applyUpkeep(s, 1);
  };

  it("loses nothing while food covers upkeep", () => {
    const s = camp("1000000");
    starve(s, STARVE_GRACE_TICKS + STARVE_PULSE_TICKS * 5);
    expect(count(s, "sp")).toBe(200);
    expect(count(s, "kn")).toBe(10);
    expect(starveTicks(s)).toBe(0);
  });

  it("loses nothing during the grace window, then 2% (at least one) per stack on the pulse", () => {
    const s = camp("0");
    starve(s, STARVE_GRACE_TICKS - 1);
    expect(count(s, "sp")).toBe(200);
    expect(count(s, "kn")).toBe(10);
    starve(s, 1);
    expect(count(s, "sp")).toBe(196);
    expect(count(s, "kn")).toBe(9);
    starve(s, STARVE_PULSE_TICKS - 1);
    expect(count(s, "sp")).toBe(196);
    starve(s, 1);
    expect(count(s, "sp")).toBe(193);
    expect(count(s, "kn")).toBe(8);
  });

  it("a fed tick resets the count and losses stop; the grace window starts over", () => {
    const s = camp("0");
    starve(s, STARVE_GRACE_TICKS);
    expect(count(s, "sp")).toBe(196);
    s.resources.food = "1000000";
    starve(s, STARVE_PULSE_TICKS * 3);
    expect(starveTicks(s)).toBe(0);
    expect(count(s, "sp")).toBe(196);
    s.resources.food = "0";
    starve(s, STARVE_GRACE_TICKS - 1);
    expect(count(s, "sp")).toBe(196);
  });

  it("leaves militia on their old one-per-tick rule and champions untouched", () => {
    const s = camp("0");
    s.units.push({ id: "m", typeId: "militia", realmId: "player", count: "1000", armyId: null });
    s.units.push({ id: "ch", typeId: "champion", realmId: "player", count: "1", armyId: null });
    starve(s, STARVE_GRACE_TICKS);
    expect(count(s, "m")).toBe(1000 - STARVE_GRACE_TICKS);
    expect(count(s, "ch")).toBe(1);
    expect(count(s, "sp")).toBe(196);
  });

  it("caps the shed at 2% with a floor of one, and removes an emptied stack", () => {
    expect(starveShed(1000)).toBe(20);
    expect(starveShed(49)).toBe(1);
    expect(starveShed(1)).toBe(1);
    expect(starveShed(0)).toBe(0);
    const s = camp("0");
    s.units.find((u) => u.id === "kn")!.count = "1";
    starve(s, STARVE_GRACE_TICKS);
    expect(s.units.some((u) => u.id === "kn")).toBe(false);
  });

  it("is the same when ticked one by one or settled in a batch", () => {
    const a = camp("0");
    const b = structuredClone(a);
    const n = STARVE_GRACE_TICKS + STARVE_PULSE_TICKS * 3 + 17;
    new TickEngine(a).tickMany(n);
    new TickEngine(b).settleTicks(n);
    expect(count(b, "sp")).toBe(count(a, "sp"));
    expect(count(b, "kn")).toBe(count(a, "kn"));
    expect(starveTicks(b)).toBe(starveTicks(a));
    expect(count(a, "sp")).toBeLessThan(200);
  });
});
