import { Graphics } from "pixi.js";
import type { GameState } from "@second-crown/shared";
import * as sim from "@second-crown/sim";
import { CANVAS_W, CANVAS_H } from "./camera.js";

export type AtmosphereWeather = "clear" | "rain" | "storm" | "snow";
export type DayPhase = "dawn" | "day" | "dusk" | "night";

/** Full day cycle length in ticks for the tick-based fallback (matches sim 120-tick cycle). */
export const DAY_CYCLE_TICKS = 120;

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

/**
 * Resolves the current day phase ("dawn" | "day" | "dusk" | "night"):
 * - Respects explicit dayPhase property or flag if present.
 * - Calls sim's dayPhase(state) if it exists.
 * - Otherwise uses a deterministic 120-tick cycle fallback:
 *   dawn (0-19), day (20-69), dusk (70-89), night (90-119).
 */
export function resolveDayPhase(state?: GameState | null, animPhase: number = 0): DayPhase {
  if (!state) return "day";

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
  if (t < 20) return "dawn";
  if (t < 70) return "day";
  if (t < 90) return "dusk";
  return "night";
}

export const dayPhaseForState = resolveDayPhase;

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
 * Resolves day/night cycle lighting parameters for Dawn, Day, Dusk, and Night:
 * - Dawn: warm gold rising
 * - Day: clear warm
 * - Dusk: amber
 * - Night: cool blue with lower brightness
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
        tintColor: 0x1e3a8a,
        tintAlpha: 0.12,
        brightnessAlpha: 0.22,
        dayAlpha: 0,
        nightAlpha: 0.22,
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

/**
 * Living day/night cycle and weather atmosphere effects on the isometric board:
 * - Day phase wash:
 *   - Dawn = warm gold rising (0xfbbf24 wash + eastern 0xf59e0b / 0xfef08a horizon glow)
 *   - Day = clear warm (0xfef08a daylight wash)
 *   - Dusk = amber (0xd97706 amber wash + western 0xf59e0b / 0xb45309 sunset glow)
 *   - Night = cool blue with lower brightness (0x0f172a dimming veil + 0x1e3a8a nocturnal blue wash)
 * - Weather overlays:
 *   - Clear = warm gold tint
 *   - Rain = cool blue tint + small drifting rain streaks
 *   - Storm = darker blue + heavier streaks + occasional lightning flash
 *   - Snow = pale grey tint + small drifting snow dots
 * - Uses only existing board paint paths; pointer-events: none.
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

  // 1. Day / Night Visual Cycle Wash
  switch (cycle.phase) {
    case "dawn": {
      // Warm gold rising wash + eastern horizon sunrise glow
      g.rect(-width, -height, width * 3, height * 3);
      g.fill({ color: 0xfbbf24, alpha: cycle.tintAlpha });

      g.ellipse(width * 0.78, height * 0.28, width * 0.55, height * 0.32);
      g.fill({ color: 0xf59e0b, alpha: 0.08 });

      g.ellipse(width * 0.78, height * 0.24, width * 0.34, height * 0.18);
      g.fill({ color: 0xfef08a, alpha: 0.07 });
      break;
    }

    case "day": {
      // Clear warm daylight wash
      g.rect(-width, -height, width * 3, height * 3);
      g.fill({ color: 0xfef08a, alpha: cycle.tintAlpha });
      break;
    }

    case "dusk": {
      // Soft evening dimming + rich amber sunset wash & western horizon glow
      g.rect(-width, -height, width * 3, height * 3);
      g.fill({ color: 0x0f172a, alpha: cycle.brightnessAlpha });

      g.rect(-width, -height, width * 3, height * 3);
      g.fill({ color: 0xd97706, alpha: cycle.tintAlpha });

      g.ellipse(width * 0.22, height * 0.28, width * 0.55, height * 0.32);
      g.fill({ color: 0xf59e0b, alpha: 0.08 });

      g.ellipse(width * 0.22, height * 0.32, width * 0.36, height * 0.20);
      g.fill({ color: 0xb45309, alpha: 0.06 });
      break;
    }

    case "night": {
      // Lower brightness darkening veil + cool nocturnal blue moonlight tint
      g.rect(-width, -height, width * 3, height * 3);
      g.fill({ color: 0x0f172a, alpha: cycle.brightnessAlpha });

      g.rect(-width, -height, width * 3, height * 3);
      g.fill({ color: 0x1e3a8a, alpha: cycle.tintAlpha });
      break;
    }
  }

  // 2. Weather Tint & Particle Overlay
  switch (weather) {
    case "clear": {
      // Warm gold tint wash & soft sun/starlight haze (subdued during night so nocturnal blue holds)
      const goldAlpha = cycle.isNight ? 0.012 : 0.05;
      const hazeAlpha = cycle.isNight ? 0.01 : 0.03;

      g.rect(-width, -height, width * 3, height * 3);
      g.fill({ color: 0xfde047, alpha: goldAlpha });

      g.ellipse(width * 0.5, height * 0.35, width * 0.6, height * 0.4);
      g.fill({ color: 0xfef08a, alpha: hazeAlpha });

      if (cycle.isNight) {
        // Subtle cool moonlit sheen on clear nights
        g.ellipse(width * 0.68, height * 0.22, width * 0.35, height * 0.22);
        g.fill({ color: 0x93c5fd, alpha: 0.035 });
      }
      break;
    }

    case "rain": {
      // Cool blue tint wash
      g.rect(-width, -height, width * 3, height * 3);
      g.fill({ color: 0x3b82f6, alpha: 0.09 });

      // Small drifting rain streaks (slanted lines falling southeast)
      const count = 48;
      for (let i = 0; i < count; i++) {
        const sx = ((i * 37 + phase * 180) % (width + 100)) - 50;
        const sy = ((i * 53 + phase * 320) % (height + 100)) - 50;
        const len = 7 + (i % 5) * 2;
        g.moveTo(sx, sy);
        g.lineTo(sx - 2.5, sy + len);
        g.stroke({ width: 0.85, color: 0x93c5fd, alpha: 0.45 });
      }
      break;
    }

    case "storm": {
      // Darker blue atmospheric wash
      g.rect(-width, -height, width * 3, height * 3);
      g.fill({ color: 0x0f172a, alpha: 0.20 });

      // Heavier slanted rain streaks
      const count = 80;
      for (let i = 0; i < count; i++) {
        const sx = ((i * 31 + phase * 240) % (width + 120)) - 60;
        const sy = ((i * 47 + phase * 450) % (height + 120)) - 60;
        const len = 12 + (i % 7) * 3;
        g.moveTo(sx, sy);
        g.lineTo(sx - 4.5, sy + len);
        g.stroke({ width: 1.3, color: 0x60a5fa, alpha: 0.60 });
      }

      // Occasional lightning flash
      const flashCycle = (((phase * 1.5 + (state?.meta?.seed ?? 0) * 0.1) % 10) + 10) % 10;
      if (flashCycle > 9.75 || (flashCycle > 9.5 && flashCycle < 9.6)) {
        g.rect(-width, -height, width * 3, height * 3);
        g.fill({ color: 0xe0e7ff, alpha: 0.28 });
      }
      break;
    }

    case "snow": {
      // Pale grey tint wash
      g.rect(-width, -height, width * 3, height * 3);
      g.fill({ color: 0xe2e8f0, alpha: 0.09 });

      // Small drifting snow dots
      const count = 48;
      for (let i = 0; i < count; i++) {
        const sx = ((i * 41 + Math.sin(phase * 1.8 + i) * 12) % (width + 60)) - 30;
        const sy = ((i * 59 + phase * 45) % (height + 60)) - 30;
        const r = 1.0 + (i % 3) * 0.6;
        g.circle(sx, sy, r);
        g.fill({ color: 0xf8fafc, alpha: 0.75 });
        g.circle(sx, sy, r * 1.6);
        g.fill({ color: 0xbae6fd, alpha: 0.25 });
      }
      break;
    }
  }
}
