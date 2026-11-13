import React from "react";
import { createRngStreams, currentSeason, visionRange, type GameState } from "@second-crown/sim";
import "./weather-line.css";

export type WeatherKind = "clear" | "rain" | "storm" | "snow";
type Season = ReturnType<typeof currentSeason>;

/**
 * Display-only copies of the sim's weather rules. The sim owns them (`systems/weather.ts`) but does
 * not export `weatherFor` or its factor functions from `packages/sim/src/index.ts`, and this slice
 * may not edit the sim. WeatherLine.test.tsx imports the sim's own weather module and checks every
 * table and the roll below against it, so a sim change fails the test instead of quietly showing a
 * wrong sky or a wrong number.
 */

/** Cumulative odds per season. Copy of `ODDS` in `systems/weather.ts`. */
export const WEATHER_ODDS: Record<Season, [WeatherKind, number][]> = {
  Spring: [["clear", 0.5], ["rain", 0.9], ["storm", 1]],
  Summer: [["clear", 0.7], ["rain", 0.8], ["storm", 1]],
  Autumn: [["clear", 0.35], ["rain", 0.8], ["storm", 1]],
  Winter: [["snow", 0.6], ["clear", 0.9], ["storm", 1]],
};

/** One sky per season: the roll is keyed on this. Copy of `seasonKey` in `systems/seasonClaim.ts`. */
export const WEATHER_SEASON_TICKS = 2000;

/** March speed factor. Copy of `SPEED` (`marchSpeedFactor`). */
export const WEATHER_MARCH_SPEED: Record<WeatherKind, number> = { clear: 1, rain: 0.8, storm: 0.6, snow: 1 };
/** Gather haul factor, read when the column gets home. Copy of `GATHER` (`gatherYieldFactor`). */
export const WEATHER_GATHER_YIELD: Record<WeatherKind, number> = { clear: 1, rain: 0.9, storm: 0.75, snow: 1 };
/** Fog thickness: distance from the keep is multiplied by this. Copy of `FOG` (`fogThickness`). */
export const WEATHER_FOG_THICKNESS: Record<WeatherKind, number> = { clear: 1, rain: 1, storm: 1.4, snow: 1.2 };

export const WEATHER_NAMES: Record<WeatherKind, string> = {
  clear: "Clear",
  rain: "Rain",
  storm: "Storm",
  snow: "Snow",
};

/** The sim's current sky. Same roll as `weatherFor` in `systems/weather.ts`. */
export function currentWeather(state: GameState): WeatherKind {
  const key = Math.floor(state.meta.tick / WEATHER_SEASON_TICKS);
  const roll = createRngStreams(state.meta.seed + key).event();
  const table = WEATHER_ODDS[currentSeason(state)] ?? WEATHER_ODDS.Spring;
  for (const [w, upTo] of table) if (roll < upTo) return w;
  return table[table.length - 1][0];
}

/**
 * How many tiles out from the keep the realm sees on its own (not counting scouted tiles or
 * outposts). Same comparison as `isProvinceSeen`: a tile `d` steps away is seen while
 * `d * thickness <= range`.
 */
export function keepSightReach(range: number, thickness: number): number {
  let d = Math.max(0, Math.floor(range));
  while (d > 0 && d * thickness > range) d--;
  return d;
}

export interface WeatherStatus {
  weather: WeatherKind;
  name: string;
  /** Tiles the keep sees out to under this sky. */
  sightReach: number;
  /** Tiles the keep would see out to under a clear sky. */
  sightClearReach: number;
  /** Percent cut from march speed. 0 when marches move at full speed. */
  marchSlowPct: number;
  /** Percent cut from a gather haul that gets home under this sky. */
  gatherPenaltyPct: number;
  sightText: string;
  marchText: string;
  gatherText: string;
  /** True when the sky changes nothing. */
  isCalm: boolean;
}

const tiles = (n: number) => `${n} tile${n === 1 ? "" : "s"}`;

/** Reads the current sky and looks up its effect text. No rules here. */
export function weatherStatus(state: GameState): WeatherStatus {
  const weather = currentWeather(state);
  const range = visionRange(state);
  const sightClearReach = keepSightReach(range, 1);
  const sightReach = keepSightReach(range, WEATHER_FOG_THICKNESS[weather]);
  const marchSlowPct = Math.round((1 - WEATHER_MARCH_SPEED[weather]) * 100);
  const gatherPenaltyPct = Math.round((1 - WEATHER_GATHER_YIELD[weather]) * 100);
  return {
    weather,
    name: WEATHER_NAMES[weather],
    sightReach,
    sightClearReach,
    marchSlowPct,
    gatherPenaltyPct,
    sightText:
      sightReach < sightClearReach
        ? `Sight: keep sees ${tiles(sightReach)} out, down from ${sightClearReach}`
        : "Sight: normal",
    marchText: marchSlowPct > 0 ? `Marches: ${marchSlowPct}% slower` : "Marches: normal",
    gatherText: gatherPenaltyPct > 0 ? `Gather hauls: ${gatherPenaltyPct}% less` : "Gather hauls: normal",
    isCalm: sightReach >= sightClearReach && marchSlowPct === 0 && gatherPenaltyPct === 0,
  };
}

/** Small sky icon: sun, rain cloud, storm cloud with a bolt, or snow cloud. Decorative. */
function WeatherIcon(props: { weather: WeatherKind }) {
  const { weather } = props;
  const cloud = "M3.6 8.2a2.4 2.4 0 0 1 .5-4.7 3.1 3.1 0 0 1 5.9.6 2.1 2.1 0 0 1 .3 4.1z";
  return (
    <svg className="sc-weather-line-icon" width={14} height={14} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      {weather === "clear" ? (
        <>
          <circle cx={7} cy={7} r={3} fill="currentColor" />
          <path
            d="M7 0.8v1.8M7 11.4v1.8M0.8 7h1.8M11.4 7h1.8M2.6 2.6l1.3 1.3M10.1 10.1l1.3 1.3M2.6 11.4l1.3-1.3M10.1 3.9l1.3-1.3"
            stroke="currentColor"
            strokeWidth={1.1}
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <path d={cloud} fill="currentColor" />
          {weather === "rain" ? (
            <path d="M4.6 9.8l-.7 2.2M7.2 9.8l-.7 2.2M9.8 9.8l-.7 2.2" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" fill="none" />
          ) : weather === "storm" ? (
            <path d="M7.8 8.8L5.6 11.4h1.8l-1 2.2 2.8-3.2H7.4z" fill="currentColor" />
          ) : (
            <>
              <circle cx={4.4} cy={10.6} r={0.8} fill="currentColor" />
              <circle cx={7.2} cy={12} r={0.8} fill="currentColor" />
              <circle cx={10} cy={10.6} r={0.8} fill="currentColor" />
            </>
          )}
        </>
      )}
    </svg>
  );
}

/**
 * Weather status line: the current sky and what it does to sight, marches and gather hauls.
 * Read-only. Used on the Kingdom tab and on the province inspect card.
 */
export function WeatherLine(props: { state: GameState | undefined; className?: string }) {
  const { state, className = "" } = props;
  if (!state) return null;
  const s = weatherStatus(state);
  return (
    <div
      className={`sc-weather-line is-${s.weather}${s.isCalm ? " is-calm" : ""}${className ? ` ${className}` : ""}`}
      data-weather={s.weather}
      data-sight-reach={s.sightReach}
      data-march-slow-pct={s.marchSlowPct}
      data-gather-penalty-pct={s.gatherPenaltyPct}
    >
      <WeatherIcon weather={s.weather} />
      <span className="sc-weather-line-text">
        <span className="sc-weather-line-label">Weather</span> · <strong>{s.name}</strong> ·{" "}
        <span className={`sc-weather-line-sight${s.sightReach < s.sightClearReach ? " is-hit" : ""}`}>{s.sightText}</span> ·{" "}
        <span className={`sc-weather-line-march${s.marchSlowPct > 0 ? " is-hit" : ""}`}>{s.marchText}</span> ·{" "}
        <span className={`sc-weather-line-gather${s.gatherPenaltyPct > 0 ? " is-hit" : ""}`}>{s.gatherText}</span>
      </span>
    </div>
  );
}
