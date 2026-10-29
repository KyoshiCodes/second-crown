import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import {
  buildingDamageFactor,
  fogThickness,
  gatherYieldFactor,
  marchSpeedFactor,
  weatherFor,
  type Weather,
} from "./weather.js";
import { applySiegeBlow } from "./march.js";
import { isProvinceSeen, visionRange } from "./fog.js";

function stateWith(weather: Weather) {
  for (let seed = 1; seed < 500; seed++) {
    for (const tick of [0, 2000, 4000, 6000]) {
      const s = createGameState({ seed });
      s.meta.tick = tick;
      if (weatherFor(s) === weather) return s;
    }
  }
  throw new Error(`no seed rolls ${weather}`);
}

describe("weather", () => {
  it("clear weather gives factor 1", () => {
    expect(marchSpeedFactor(weatherFor(stateWith("clear")))).toBe(1);
  });

  it("rain gives 0.8", () => {
    expect(marchSpeedFactor(weatherFor(stateWith("rain")))).toBe(0.8);
  });

  it("storm gives 0.6", () => {
    expect(marchSpeedFactor(weatherFor(stateWith("storm")))).toBe(0.6);
  });

  it("snow gives 1", () => {
    expect(marchSpeedFactor(weatherFor(stateWith("snow")))).toBe(1);
  });

  it("is deterministic for the same state seed", () => {
    for (let seed = 1; seed < 20; seed++) {
      const a = createGameState({ seed });
      const b = createGameState({ seed });
      a.meta.tick = b.meta.tick = 4123;
      expect(weatherFor(a)).toBe(weatherFor(b));
      expect(marchSpeedFactor(weatherFor(a))).toBe(marchSpeedFactor(weatherFor(b)));
    }
  });

  it("holds for the whole season", () => {
    const s = createGameState({ seed: 7 });
    s.meta.tick = 2000;
    const w = weatherFor(s);
    s.meta.tick = 3999;
    expect(weatherFor(s)).toBe(w);
  });

  it("gather yield: rain 0.9, storm 0.75, clear and snow 1", () => {
    expect(gatherYieldFactor(weatherFor(stateWith("clear")))).toBe(1);
    expect(gatherYieldFactor(weatherFor(stateWith("rain")))).toBe(0.9);
    expect(gatherYieldFactor(weatherFor(stateWith("storm")))).toBe(0.75);
    expect(gatherYieldFactor(weatherFor(stateWith("snow")))).toBe(1);
  });

  it("fog thickness: storm 1.4, snow 1.2, clear and rain 1", () => {
    expect(fogThickness(weatherFor(stateWith("clear")))).toBe(1);
    expect(fogThickness(weatherFor(stateWith("rain")))).toBe(1);
    expect(fogThickness(weatherFor(stateWith("storm")))).toBe(1.4);
    expect(fogThickness(weatherFor(stateWith("snow")))).toBe(1.2);
  });

  it("building damage: storm 0.5, others 1", () => {
    expect(buildingDamageFactor(weatherFor(stateWith("clear")))).toBe(1);
    expect(buildingDamageFactor(weatherFor(stateWith("rain")))).toBe(1);
    expect(buildingDamageFactor(weatherFor(stateWith("storm")))).toBe(0.5);
    expect(buildingDamageFactor(weatherFor(stateWith("snow")))).toBe(1);
  });

  it("a storm halves how long a siege blow keeps a building unfinished", () => {
    for (const [w, ticks] of [["clear", 40], ["storm", 20]] as const) {
      const s = stateWith(w);
      s.buildings.push({ id: "f", realmId: "player", typeId: "farm", x: 2, y: 3, level: 1, completesAtTick: null } as never);
      expect(applySiegeBlow(s, 10_000, 1)).toBe("farm");
      expect(s.buildings.find((b) => b.id === "f")!.completesAtTick).toBe(s.meta.tick + ticks);
    }
  });

  it("storm fog hides a province that clear sky shows at the edge of vision", () => {
    const clear = stateWith("clear");
    const storm = stateWith("storm");
    const range = visionRange(clear);
    expect(visionRange(storm)).toBe(range);
    const home = clear.board.provinces.find((p) => p.id === clear.board.homeProvinceId)!;
    clear.flags.fog_seen = storm.flags.fog_seen = JSON.stringify([home.id]);
    const edge = clear.board.provinces.find((p) => Math.abs(p.x - home.x) + Math.abs(p.y - home.y) === range)!;
    expect(isProvinceSeen(clear, edge.id)).toBe(true);
    expect(isProvinceSeen(storm, edge.id)).toBe(false);
  });
});
