import { Graphics } from "pixi.js";
import { BOARD_W, BOARD_H, type GameState } from "@second-crown/shared";
import * as sim from "@second-crown/sim";
import { CANVAS_W, CANVAS_H, RIM_SIZE, boardGridToWorld } from "./camera.js";

export type AtmosphereWeather = "clear" | "rain" | "storm" | "snow";
export type DayPhase = "dawn" | "day" | "dusk" | "night";

function readSimExport(name: string): any {
  const mod: Record<string, any> = sim;
  return mod[name];
}

/** Full day cycle length in ticks (reads sim.DAY_CYCLE_TICKS when exported, else 3600-tick fallback). */
export const DAY_CYCLE_TICKS: number =
  typeof readSimExport("DAY_CYCLE_TICKS") === "number"
    ? readSimExport("DAY_CYCLE_TICKS")
    : 3600;

export interface SunMoonPosition {
  kind: "sun" | "moon";
  /** 0 at the eastern horizon, 1 at the western horizon. */
  x: number;
  /** 0 at zenith, 1 at the horizon (screen-down). */
  y: number;
  /** 0 at the horizon, 1 at zenith. */
  elevation: number;
}

export interface DayNightVisuals {
  phase: DayPhase;
  isNight: boolean;
  tintColor: number;
  tintAlpha: number;
  brightnessAlpha: number;
  dayAlpha: number;
  nightAlpha: number;
}

/**
 * Resolves current weather for the atmosphere presentation:
 * - Respects explicit weather flags/properties when provided.
 * - Calls sim's weatherFor(state) if it exists.
 * - Otherwise falls back to season-based resolution.
 */
export function resolveAtmosphereWeather(state?: GameState | null): AtmosphereWeather {
  if (!state) return "clear";

  // Check explicit state flags or weather property first (supports direct test overrides)
  if (typeof (state as any).flags?.weather === "string") {
    const fw = (state as any).flags.weather.toLowerCase().trim();
    if (fw === "clear" || fw === "rain" || fw === "storm" || fw === "snow") return fw;
  }
  if (typeof (state as any).weather === "string") {
    const w = (state as any).weather.toLowerCase().trim();
    if (w === "clear" || w === "rain" || w === "storm" || w === "snow") return w;
  }

  // Check if sim exports weatherFor(state)
  const simModule = sim as Record<string, any>;
  if (typeof simModule["weatherFor"] === "function") {
    try {
      const w = simModule["weatherFor"](state);
      if (w === "clear" || w === "rain" || w === "storm" || w === "snow") return w;
    } catch {
      /* ignore */
    }
  }

  // Season-based fallback
  let season = "Spring";
  if (typeof (state as any).season === "string" && (state as any).season) {
    season = (state as any).season;
  } else if (state.meta && typeof state.meta.tick === "number") {
    try {
      season = sim.currentSeason(state);
    } catch {
      season = "Spring";
    }
  }

  const norm = season.toLowerCase().trim();
  if (norm === "winter") return "snow";
  if (norm === "autumn" || norm === "fall") {
    const tick = state.meta?.tick ?? 0;
    return Math.floor(tick / 200) % 5 === 0 ? "storm" : "rain";
  }
  if (norm === "spring") {
    const tick = state.meta?.tick ?? 0;
    return Math.floor(tick / 400) % 2 === 0 ? "rain" : "clear";
  }
  return "clear";
}

export const weatherForState = resolveAtmosphereWeather;

function fallbackCycleThresholds(cycleTicks: number): {
  dawnEnd: number;
  dayEnd: number;
  duskEnd: number;
} {
  if (cycleTicks === 120) {
    return { dawnEnd: 20, dayEnd: 70, duskEnd: 90 };
  }
  return {
    dawnEnd: Math.floor(cycleTicks * 0.15),
    dayEnd: Math.floor(cycleTicks * 0.55),
    duskEnd: Math.floor(cycleTicks * 0.7),
  };
}

function readExplicitDayPhase(state?: GameState | null): DayPhase | null {
  if (!state) return null;
  const explicit =
    (state as any).dayPhase ??
    (state as any).flags?.dayPhase ??
    (state as any).flags?.day_phase;
  if (typeof explicit === "string") {
    const norm = explicit.toLowerCase().trim();
    if (norm === "dawn" || norm === "day" || norm === "dusk" || norm === "night") {
      return norm;
    }
  }
  return null;
}

/**
 * Resolves the current day phase ("dawn" | "day" | "dusk" | "night"):
 * - Respects explicit dayPhase property or flag if present.
 * - Calls sim's dayPhase(state) if it exists.
 * - Otherwise uses a deterministic tick cycle fallback.
 */
export function resolveDayPhase(state?: GameState | null, animPhase: number = 0): DayPhase {
  if (!state) return "day";

  const explicit = readExplicitDayPhase(state);
  if (explicit) return explicit;

  const simModule = sim as Record<string, any>;
  if (typeof simModule["dayPhase"] === "function") {
    try {
      const dp = simModule["dayPhase"](state);
      if (dp === "dawn" || dp === "day" || dp === "dusk" || dp === "night") {
        return dp;
      }
    } catch {
      /* ignore */
    }
  }

  const rawTick =
    typeof state.meta?.tick === "number" ? state.meta.tick : Math.floor(animPhase * 10);
  const t = ((Math.floor(rawTick) % DAY_CYCLE_TICKS) + DAY_CYCLE_TICKS) % DAY_CYCLE_TICKS;
  const { dawnEnd, dayEnd, duskEnd } = fallbackCycleThresholds(DAY_CYCLE_TICKS);
  if (t < dawnEnd) return "dawn";
  if (t < dayEnd) return "day";
  if (t < duskEnd) return "dusk";
  return "night";
}

export const dayPhaseForState = resolveDayPhase;

/**
 * Resolves the sun or moon sky arc position:
 * - Respects explicit sunMoonPosition property or flag if provided.
 * - Respects explicit dayPhase override if set on state.
 * - Calls sim's sunMoonPosition(state) if it exists.
 * - Otherwise computes a smooth half-sine arc from state.meta.tick across DAY_CYCLE_TICKS.
 */
export function resolveSunMoonPosition(
  state?: GameState | null,
  animPhase: number = 0
): SunMoonPosition {
  if (!state) {
    return { kind: "sun", x: 0.5, y: 0, elevation: 1 };
  }

  const explicitPos =
    (state as any).sunMoonPosition ?? (state as any).flags?.sunMoonPosition;
  if (
    explicitPos &&
    (explicitPos.kind === "sun" || explicitPos.kind === "moon") &&
    typeof explicitPos.x === "number" &&
    Number.isFinite(explicitPos.x)
  ) {
    const x = Math.min(1, Math.max(0, explicitPos.x));
    const elevation =
      typeof explicitPos.elevation === "number" && Number.isFinite(explicitPos.elevation)
        ? Math.min(1, Math.max(0, explicitPos.elevation))
        : typeof explicitPos.y === "number" && Number.isFinite(explicitPos.y)
        ? Math.min(1, Math.max(0, 1 - explicitPos.y))
        : Math.sin(Math.PI * x);
    const y =
      typeof explicitPos.y === "number" && Number.isFinite(explicitPos.y)
        ? Math.min(1, Math.max(0, explicitPos.y))
        : 1 - elevation;
    return { kind: explicitPos.kind, x, y, elevation };
  }

  const explicitPhase = readExplicitDayPhase(state);
  if (explicitPhase) {
    const kind: "sun" | "moon" = explicitPhase === "night" ? "moon" : "sun";
    const x =
      explicitPhase === "dawn"
        ? 0.12
        : explicitPhase === "day"
        ? 0.5
        : explicitPhase === "dusk"
        ? 0.88
        : 0.5;
    const elevation = Math.sin(Math.PI * x);
    return { kind, x, y: 1 - elevation, elevation };
  }

  const simModule = sim as Record<string, any>;
  if (typeof simModule["sunMoonPosition"] === "function") {
    try {
      const pos = simModule["sunMoonPosition"](state);
      if (
        pos &&
        (pos.kind === "sun" || pos.kind === "moon") &&
        typeof pos.x === "number" &&
        typeof pos.y === "number"
      ) {
        const x = Math.min(1, Math.max(0, pos.x));
        const y = Math.min(1, Math.max(0, pos.y));
        const elevation =
          typeof pos.elevation === "number" ? Math.min(1, Math.max(0, pos.elevation)) : 1 - y;
        return { kind: pos.kind, x, y, elevation };
      }
    } catch {
      /* ignore */
    }
  }

  const rawTick =
    typeof state.meta?.tick === "number" ? state.meta.tick : Math.floor(animPhase * 10);
  const t = ((Math.floor(rawTick) % DAY_CYCLE_TICKS) + DAY_CYCLE_TICKS) % DAY_CYCLE_TICKS;
  const { duskEnd } = fallbackCycleThresholds(DAY_CYCLE_TICKS);
  const isSun = t < duskEnd;
  const x = isSun
    ? t / Math.max(1, duskEnd)
    : (t - duskEnd) / Math.max(1, DAY_CYCLE_TICKS - duskEnd);
  const clampedX = Math.min(1, Math.max(0, x));
  const elevation = Math.sin(Math.PI * clampedX);
  return {
    kind: isSun ? "sun" : "moon",
    x: clampedX,
    y: 1 - elevation,
    elevation,
  };
}

export const sunMoonPositionForState = resolveSunMoonPosition;

/**
 * Maps a normalized SunMoonPosition onto screen coordinates across the top of the board
 * and its corresponding local lighting point on the isometric tile plane directly beneath.
 */
export function celestialScreenPoint(
  pos: SunMoonPosition,
  width: number = CANVAS_W,
  _height: number = CANVAS_H
): { skyX: number; skyY: number; lightX: number; lightY: number } {
  const minX = Math.max(RIM_SIZE + 76, Math.round(width * 0.17));
  const maxX = Math.min(width - RIM_SIZE - 84, Math.round(width * 0.8));
  const spanX = Math.max(80, maxX - minX);
  const skyX = minX + pos.x * spanX;
  const skyY = RIM_SIZE + 12 + pos.y * 28;

  // Isometric 12x8 board top/bottom envelope at skyX (top apex 236,45; left 60,133; right 500,177; bottom 324,265)
  const clampedBoardX = Math.min(484, Math.max(76, skyX));
  const boardTopY = 45 + Math.abs(clampedBoardX - 236) * 0.5;
  const boardBotY =
    clampedBoardX <= 324
      ? 133 + (clampedBoardX - 60) * 0.5
      : 265 - (clampedBoardX - 324) * 0.5;
  const lightX = clampedBoardX;
  const lightY = boardTopY + Math.max(16, (boardBotY - boardTopY) * 0.42);

  return { skyX, skyY, lightX, lightY };
}

/**
 * Relative wind sway multiplier for trees and banners based on current weather.
 */
export function resolveWindStrength(weather?: AtmosphereWeather | string | null): number {
  if (weather === "storm") return 1.55;
  if (weather === "rain") return 1.25;
  if (weather === "snow") return 1.1;
  return 1.0;
}

/**
 * Resolves day/night cycle lighting parameters for Dawn, Day, Dusk, and Night.
 */
export function resolveDayNightCycle(
  state?: GameState | null,
  animPhase: number = 0
): DayNightVisuals {
  const phase = resolveDayPhase(state, animPhase);
  switch (phase) {
    case "dawn":
      return {
        phase: "dawn",
        isNight: false,
        tintColor: 0xfbbf24,
        tintAlpha: 0.08,
        brightnessAlpha: 0,
        dayAlpha: 0.06,
        nightAlpha: 0,
      };
    case "dusk":
      return {
        phase: "dusk",
        isNight: false,
        tintColor: 0xd97706,
        tintAlpha: 0.11,
        brightnessAlpha: 0.04,
        dayAlpha: 0.03,
        nightAlpha: 0.04,
      };
    case "night":
      return {
        phase: "night",
        isNight: true,
        tintColor: 0x60a5fa,
        tintAlpha: 0.1,
        brightnessAlpha: 0.18,
        dayAlpha: 0,
        nightAlpha: 0.18,
      };
    case "day":
    default:
      return {
        phase: "day",
        isNight: false,
        tintColor: 0xfef08a,
        tintAlpha: 0.045,
        brightnessAlpha: 0,
        dayAlpha: 0.045,
        nightAlpha: 0,
      };
  }
}

function drawSunSprite(
  g: Graphics,
  skyX: number,
  skyY: number,
  dayPhase: DayPhase,
  weather: AtmosphereWeather,
  animPhase: number
): void {
  const vis =
    weather === "storm" ? 0.5 : weather === "rain" || weather === "snow" ? 0.72 : 1.0;
  const pulse = 1 + Math.sin(animPhase * 2.2) * 0.06;

  const haloOuter =
    dayPhase === "dawn" ? 0xfbbf24 : dayPhase === "dusk" ? 0xd97706 : 0xfde047;
  const haloInner =
    dayPhase === "dawn" ? 0xf59e0b : dayPhase === "dusk" ? 0xb45309 : 0xfef08a;
  const diskColor =
    dayPhase === "dawn" ? 0xfbbf24 : dayPhase === "dusk" ? 0xf59e0b : 0xfacc15;

  // Compact local corona right around the sun sprite (never across the canvas)
  g.circle(skyX, skyY, 13 * pulse);
  g.fill({ color: haloOuter, alpha: 0.14 * vis });
  g.circle(skyX, skyY, 8.5 * pulse);
  g.fill({ color: haloInner, alpha: 0.22 * vis });

  // 8 crisp miniature solar rays
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4 + animPhase * 0.18;
    const r0 = 6.2;
    const r1 = (i % 2 === 0 ? 9.0 : 7.8) * pulse;
    g.moveTo(skyX + Math.cos(ang) * r0, skyY + Math.sin(ang) * r0);
    g.lineTo(skyX + Math.cos(ang) * r1, skyY + Math.sin(ang) * r1);
    g.stroke({ width: 0.9, color: haloOuter, alpha: 0.7 * vis });
  }

  // Solar disk and bright core
  g.circle(skyX, skyY, 5.0);
  g.fill({ color: diskColor, alpha: 0.95 * vis });
  g.circle(skyX, skyY, 3.0);
  g.fill({ color: 0xfef08a, alpha: 0.95 * vis });

  // Small local weather cloud wisp partially veiling the sun in overcast weather
  if (weather !== "clear") {
    const cloudCol = weather === "storm" ? 0x334155 : weather === "snow" ? 0xcbd5e1 : 0x64748b;
    g.ellipse(skyX + 3.5, skyY + 3.2, 6.5, 2.8);
    g.fill({ color: cloudCol, alpha: 0.65 });
    g.circle(skyX + 1.2, skyY + 2.2, 2.8);
    g.fill({ color: cloudCol, alpha: 0.6 });
  }
}

function drawMoonSprite(
  g: Graphics,
  skyX: number,
  skyY: number,
  weather: AtmosphereWeather,
  animPhase: number
): void {
  const vis =
    weather === "storm" ? 0.55 : weather === "rain" || weather === "snow" ? 0.76 : 1.0;
  const breath = 1 + Math.sin(animPhase * 1.6) * 0.05;

  // Soft moonlight glow strictly localized near the moon (not across the whole board)
  g.circle(skyX, skyY, 21 * breath);
  g.fill({ color: 0x60a5fa, alpha: 0.11 * vis });
  g.circle(skyX, skyY, 12.5 * breath);
  g.fill({ color: 0x93c5fd, alpha: 0.18 * vis });

  // Pale silver lunar disk + luminous crescent highlight + subtle craters
  g.circle(skyX, skyY, 5.0);
  g.fill({ color: 0xe2e8f0, alpha: 0.95 * vis });
  g.circle(skyX - 1.0, skyY - 0.6, 3.9);
  g.fill({ color: 0xf8fafc, alpha: 0.95 * vis });
  g.circle(skyX + 1.7, skyY - 0.9, 1.8);
  g.fill({ color: 0x94a3b8, alpha: 0.45 * vis });
  g.circle(skyX + 0.6, skyY + 1.7, 1.0);
  g.fill({ color: 0x94a3b8, alpha: 0.38 * vis });

  // Two tiny companion stars right beside the moon on clear nights
  if (weather === "clear") {
    const twinkle = 0.65 + Math.sin(animPhase * 3.1) * 0.25;
    g.circle(skyX - 13, skyY - 4, 0.85);
    g.fill({ color: 0xe0f2fe, alpha: twinkle });
    g.circle(skyX + 14, skyY + 2.5, 0.75);
    g.fill({ color: 0xbae6fd, alpha: twinkle * 0.85 });
  } else {
    const cloudCol = weather === "storm" ? 0x1e293b : 0x475569;
    g.ellipse(skyX + 3.5, skyY + 3.0, 6.2, 2.6);
    g.fill({ color: cloudCol, alpha: 0.62 });
  }
}

/**
 * Deterministic target landing point on the 12x8 isometric tile plane and sky start Y above the board.
 */
function weatherDropTarget(
  index: number,
  windDx: number
): { startX: number; startY: number; landX: number; landY: number } {
  const u = (((index * 0.61803398875 + 0.17) % 1) + 1) % 1;
  const v = (((index * 0.38196601125 + 0.23 + (index % 5) * 0.09) % 1) + 1) % 1;
  const bx = 0.45 + u * (BOARD_W - 1.9);
  const by = 0.45 + v * (BOARD_H - 1.9);
  const { wx: landX, wy: landY } = boardGridToWorld(bx, by);
  const startX = landX - windDx;
  const boardTopAtStart = 45 + Math.abs(startX - 236) * 0.5;
  const startY = Math.max(RIM_SIZE + 5, boardTopAtStart - 24 - (index % 4) * 4);
  return { startX, startY, landX, landY };
}

/**
 * Draws a visible moving sun or moon across the top of the board, soft local lighting
 * under the sun/moon, and sparse weather particles that start above the board and fall
 * onto the isometric tile plane. Never draws full-canvas color washes.
 */
export function drawAtmosphere(
  state: GameState | null | undefined,
  g: Graphics,
  phase: number = 0,
  width: number = CANVAS_W,
  height: number = CANVAS_H
): void {
  if (!g) return;

  // pointer-events: none semantics
  if ("eventMode" in g) {
    (g as any).eventMode = "none";
  }

  g.clear();

  const weather = resolveAtmosphereWeather(state);
  const cycle = resolveDayNightCycle(state, phase);
  const pos = resolveSunMoonPosition(state, phase);
  const { skyX, skyY, lightX, lightY } = celestialScreenPoint(pos, width, height);

  const weatherDim =
    weather === "storm" ? 0.55 : weather === "rain" || weather === "snow" ? 0.78 : 1.0;

  // 1. Soft Local Lighting on the Board Directly Under the Sun or Moon (no full-board wash)
  if (pos.kind === "sun") {
    const outerWarm =
      cycle.phase === "dawn" ? 0xfbbf24 : cycle.phase === "dusk" ? 0xd97706 : 0xfde047;
    const innerWarm =
      cycle.phase === "dawn" ? 0xf59e0b : cycle.phase === "dusk" ? 0xf59e0b : 0xfef08a;
    g.ellipse(lightX, lightY, 42, 19);
    g.fill({ color: outerWarm, alpha: 0.095 * weatherDim });
    g.ellipse(lightX, lightY, 23, 10.5);
    g.fill({ color: innerWarm, alpha: 0.075 * weatherDim });
  } else {
    // Small cool glow under the moon at night
    g.ellipse(lightX, lightY, 38, 17);
    g.fill({ color: 0x60a5fa, alpha: 0.085 * weatherDim });
    g.ellipse(lightX, lightY, 20, 9);
    g.fill({ color: 0x93c5fd, alpha: 0.075 * weatherDim });
  }

  // 2. Sparse Weather Particles Starting Above the Board and Landing on the Tile Plane
  switch (weather) {
    case "clear":
      break;

    case "rain": {
      const count = 16;
      const windDx = -8;
      for (let i = 0; i < count; i++) {
        const { startX, startY, landX, landY } = weatherDropTarget(i, windDx);
        const progress = (((phase * 0.85 + i * (1 / count) * 1.7) % 1) + 1) % 1;
        if (progress < 0.88) {
          const t = progress / 0.88;
          const px = startX + (landX - startX) * t;
          const py = startY + (landY - startY) * t;
          const len = 6 + (i % 3) * 1.5;
          g.moveTo(px, py);
          g.lineTo(px - 1.8, Math.min(landY, py + len));
          g.stroke({ width: 0.85, color: 0x93c5fd, alpha: 0.48 });
        } else {
          // Tiny raindrop splash landing on the isometric tile
          const ripple = (progress - 0.88) / 0.12;
          g.ellipse(landX, landY, 1.6 + ripple * 1.8, 0.8 + ripple * 0.8);
          g.fill({ color: 0xbae6fd, alpha: 0.38 * (1 - ripple * 0.6) });
        }
      }
      break;
    }

    case "storm": {
      const count = 24;
      const windDx = -15;
      for (let i = 0; i < count; i++) {
        const { startX, startY, landX, landY } = weatherDropTarget(i, windDx);
        const progress = (((phase * 1.35 + i * (1 / count) * 1.9) % 1) + 1) % 1;
        if (progress < 0.86) {
          const t = progress / 0.86;
          const px = startX + (landX - startX) * t;
          const py = startY + (landY - startY) * t;
          const len = 8.5 + (i % 4) * 2;
          g.moveTo(px, py);
          g.lineTo(px - 3.2, Math.min(landY, py + len));
          g.stroke({ width: 1.15, color: 0x60a5fa, alpha: 0.58 });
        } else {
          const ripple = (progress - 0.86) / 0.14;
          g.ellipse(landX, landY, 2.0 + ripple * 2.2, 0.9 + ripple * 1.0);
          g.fill({ color: 0x93c5fd, alpha: 0.45 * (1 - ripple * 0.5) });
        }
      }

      // Occasional localized sky-to-board lightning bolt (never a full-canvas wash)
      const flashCycle = (((phase * 1.5 + (state?.meta?.seed ?? 0) * 0.1) % 10) + 10) % 10;
      if (flashCycle > 9.75 || (flashCycle > 9.5 && flashCycle < 9.6)) {
        const strikeTile = boardGridToWorld(5.5, 2.5);
        const bx0 = strikeTile.wx + 8;
        const by0 = RIM_SIZE + 8;
        const bx1 = strikeTile.wx;
        const by1 = strikeTile.wy - 4;
        const midY = (by0 + by1) * 0.5;

        g.ellipse(bx1, by1, 24, 11);
        g.fill({ color: 0xe0e7ff, alpha: 0.22 });

        g.moveTo(bx0, by0);
        g.lineTo(bx0 - 6, midY - 4);
        g.lineTo(bx0 - 1, midY + 2);
        g.lineTo(bx1, by1);
        g.stroke({ width: 1.6, color: 0xe0e7ff, alpha: 0.88 });
      }
      break;
    }

    case "snow": {
      const count = 16;
      for (let i = 0; i < count; i++) {
        const { startY, landX, landY } = weatherDropTarget(i, 0);
        const progress = (((phase * 0.28 + i * (1 / count) * 1.3) % 1) + 1) % 1;
        if (progress < 0.88) {
          const t = progress / 0.88;
          const flutter = Math.sin(phase * 1.8 + i * 1.7) * 3.2 * (1 - t * 0.5);
          const px = landX + flutter;
          const py = startY + (landY - startY) * t;
          const r = 1.1 + (i % 3) * 0.45;
          g.circle(px, py, r * 1.5);
          g.fill({ color: 0xbae6fd, alpha: 0.24 });
          g.circle(px, py, r);
          g.fill({ color: 0xf8fafc, alpha: 0.78 });
        } else {
          // Soft snow fleck settling onto the isometric tile
          const settle = (progress - 0.88) / 0.12;
          g.ellipse(landX, landY, 1.8, 0.85);
          g.fill({ color: 0xf8fafc, alpha: 0.65 * (1 - settle * 0.5) });
        }
      }
      break;
    }
  }

  // 3. Moving Sun or Moon Sprite Across the Top of the Board
  if (pos.kind === "sun") {
    drawSunSprite(g, skyX, skyY, cycle.phase, weather, phase);
  } else {
    drawMoonSprite(g, skyX, skyY, weather, phase);
  }
}
