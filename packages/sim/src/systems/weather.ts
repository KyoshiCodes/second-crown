import type { GameState } from "@second-crown/shared";
import { createRngStreams } from "../core/rng.js";
import { currentSeason } from "./age.js";
import { seasonKey } from "./seasonClaim.js";

export type Weather = "clear" | "rain" | "storm" | "snow";

// Cumulative odds per season. One roll per season, so the sky holds until the season turns.
const ODDS: Record<string, [Weather, number][]> = {
  Spring: [["clear", 0.5], ["rain", 0.9], ["storm", 1]],
  Summer: [["clear", 0.7], ["rain", 0.8], ["storm", 1]],
  Autumn: [["clear", 0.35], ["rain", 0.8], ["storm", 1]],
  Winter: [["snow", 0.6], ["clear", 0.9], ["storm", 1]],
};

const SPEED: Record<Weather, number> = { clear: 1, rain: 0.8, storm: 0.6, snow: 1 };
const GATHER: Record<Weather, number> = { clear: 1, rain: 0.9, storm: 0.75, snow: 1 };
// Higher is thicker fog. Vision range is divided by this.
const FOG: Record<Weather, number> = { clear: 1, rain: 1, storm: 1.4, snow: 1.2 };
// Applies to the rebuild timer a siege blow puts on a building.
const BUILDING_DAMAGE: Record<Weather, number> = { clear: 1, rain: 1, storm: 0.5, snow: 1 };

export function weatherFor(state: GameState): Weather {
  const roll = createRngStreams(state.meta.seed + seasonKey(state)).event();
  const table = ODDS[currentSeason(state)] ?? ODDS.Spring;
  for (const [w, upTo] of table) if (roll < upTo) return w;
  return table[table.length - 1][0];
}

export function marchSpeedFactor(weather: Weather): number {
  return SPEED[weather];
}

export function gatherYieldFactor(weather: Weather): number {
  return GATHER[weather];
}

export function fogThickness(weather: Weather): number {
  return FOG[weather];
}

export function buildingDamageFactor(weather: Weather): number {
  return BUILDING_DAMAGE[weather];
}
