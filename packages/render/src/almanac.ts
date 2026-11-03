import type { Graphics } from "pixi.js";
import type { GameState } from "@second-crown/shared";
import {
  BOARD_WEATHER_GLYPH_X,
  BOARD_WEATHER_GLYPH_Y,
  BOARD_WEATHER_GLYPH_W,
  drawBoardWeatherEmblem,
  resolveAtmosphereWeather,
  resolveDayPhase,
  type AtmosphereWeather,
  type DayPhase,
} from "./atmosphere.js";
import { drawSeasonMark, resolveBoardSeasonMark, type SeasonMarkKind } from "./tokens.js";

// ---------------------------------------------------------------------------
// Clearer weather and seasonal markers (wave/board-weather)
// A small almanac plaque in the empty top-left corner of the diamond board: the
// current weather on top (sun or moon when clear) and the current season below.
// It sits on its own board layer above weather, fog, roads, marches, keeps, units,
// piles, camps, effects, the select rim and hover, on a steady dark ink plaque with a
// season-coloured rim, so it reads in snow, storm dim, night and fog alike.
// Render only: reads weather, day phase and season the board already reads.
// ---------------------------------------------------------------------------

/** Dark ink under the almanac plaque. Steady: it never pulses. */
export const BOARD_ALMANAC_INK = 0x0b0f17;
export const BOARD_ALMANAC_INK_ALPHA = 0.84;
/** Plaque box: same top-left corner as the old weather glyph, two slots tall. */
export const BOARD_ALMANAC_X = BOARD_WEATHER_GLYPH_X;
export const BOARD_ALMANAC_Y = BOARD_WEATHER_GLYPH_Y;
export const BOARD_ALMANAC_W = BOARD_WEATHER_GLYPH_W;
export const BOARD_ALMANAC_SLOT_H = 20;
export const BOARD_ALMANAC_H = BOARD_ALMANAC_SLOT_H * 2;
export const BOARD_ALMANAC_RIM_WIDTH = 1.2;
export const BOARD_ALMANAC_RIM_ALPHA = 0.9;
/** Light season rims so the plaque edge lifts off a dark storm / night table. */
export const BOARD_ALMANAC_SEASON_RIMS: Record<SeasonMarkKind, number> = {
  spring: 0x86efac,
  summer: 0xfcd34d,
  autumn: 0xfdba74,
  winter: 0xbae6fd,
};

export interface BoardAlmanacReading {
  weather: AtmosphereWeather;
  season: SeasonMarkKind;
  dayPhase: DayPhase;
}

/** What the almanac shows for this state. Pure. Null when there is no state. */
export function resolveBoardAlmanac(
  state: GameState | null | undefined,
  phase: number = 0
): BoardAlmanacReading | null {
  if (!state) return null;
  return {
    weather: resolveAtmosphereWeather(state),
    season: resolveBoardSeasonMark(state),
    dayPhase: resolveDayPhase(state, phase),
  };
}

/** Clear-sky emblem: a small sun by day / dawn / dusk, a crescent moon at night. */
export function drawBoardClearSkyEmblem(
  g: Graphics,
  cx: number,
  cy: number,
  dayPhase: DayPhase,
  phase: number = 0
): void {
  if (!g) return;
  if (dayPhase === "night") {
    g.circle(cx, cy, 4.6);
    g.fill({ color: 0xe0e7ff, alpha: 0.95 });
    // Cut the crescent with the plaque ink
    g.circle(cx + 2.1, cy - 1.2, 4.0);
    g.fill({ color: BOARD_ALMANAC_INK, alpha: 1 });
    g.circle(cx + 3.6, cy + 2.6, 0.7);
    g.fill({ color: 0xf8fafc, alpha: 0.9 });
    return;
  }
  const col = dayPhase === "day" ? 0xfacc15 : 0xf59e0b;
  const spin = phase * 0.6;
  for (let i = 0; i < 8; i++) {
    const a = spin + (i * Math.PI) / 4;
    g.moveTo(cx + Math.cos(a) * 4.4, cy + Math.sin(a) * 4.4);
    g.lineTo(cx + Math.cos(a) * 6.6, cy + Math.sin(a) * 6.6);
    g.stroke({ width: 1.1, color: col, alpha: 0.95 });
  }
  g.circle(cx, cy, 3.4);
  g.fill({ color: col, alpha: 1 });
  g.circle(cx - 0.8, cy - 0.8, 1.3);
  g.fill({ color: 0xfef9c3, alpha: 0.9 });
}

/**
 * Paints the almanac plaque (weather over season) in the top-left board corner.
 * Clears first. Draws nothing without a state. Non-interactive.
 */
export function paintBoardAlmanac(
  g: Graphics,
  state: GameState | null | undefined,
  phase: number = 0
): void {
  if (!g) return;
  g.clear();
  if ("eventMode" in g) {
    (g as any).eventMode = "none";
  }
  const reading = resolveBoardAlmanac(state, phase);
  if (!reading) return;

  const x = BOARD_ALMANAC_X;
  const y = BOARD_ALMANAC_Y;
  const w = BOARD_ALMANAC_W;
  const h = BOARD_ALMANAC_H;
  const cx = x + w / 2;
  const rim = BOARD_ALMANAC_SEASON_RIMS[reading.season];

  // 1. Soft drop shadow, steady ink plaque, season rim
  g.roundRect(x + 1, y + 1.5, w, h, 5);
  g.fill({ color: 0x000000, alpha: 0.35 });
  g.roundRect(x, y, w, h, 5);
  g.fill({ color: BOARD_ALMANAC_INK, alpha: BOARD_ALMANAC_INK_ALPHA });
  g.roundRect(x, y, w, h, 5);
  g.stroke({ width: BOARD_ALMANAC_RIM_WIDTH, color: rim, alpha: BOARD_ALMANAC_RIM_ALPHA });

  // 2. Thin divider between the weather slot and the season slot
  const midY = y + BOARD_ALMANAC_SLOT_H;
  g.moveTo(x + 4, midY);
  g.lineTo(x + w - 4, midY);
  g.stroke({ width: 0.8, color: rim, alpha: 0.45 });

  // 3. Weather slot (sun / moon when clear)
  if (reading.weather === "clear") {
    drawBoardClearSkyEmblem(g, cx, y + BOARD_ALMANAC_SLOT_H / 2, reading.dayPhase, phase);
  } else {
    drawBoardWeatherEmblem(g, reading.weather, cx, y + 6, phase);
  }

  // 4. Season slot (the same season pip the home tile carries)
  drawSeasonMark(g, cx, midY + BOARD_ALMANAC_SLOT_H / 2, reading.season, phase);
}
