import { Graphics } from "pixi.js";
import type { GameState } from "@second-crown/shared";
import * as sim from "@second-crown/sim";
import { CANVAS_W, CANVAS_H } from "./camera.js";

export type AtmosphereWeather = "clear" | "rain" | "storm" | "snow";

/**
 * Resolves current weather for the atmosphere presentation:
 * - Calls sim's weatherFor(state) if it exists.
 * - Otherwise falls back to season-based resolution (winter -> snow, autumn -> rain/storm, spring -> rain/clear, summer -> clear).
 */
export function resolveAtmosphereWeather(state?: GameState | null): AtmosphereWeather {
  if (!state) return "clear";

  // Check if wave/weather sim function weatherFor exists
  const simModule = sim as Record<string, any>;
  if (typeof simModule["weatherFor"] === "function") {
    try {
      const w = simModule["weatherFor"](state);
      if (w === "clear" || w === "rain" || w === "storm" || w === "snow") return w;
    } catch {
      /* ignore */
    }
  }

  // Check state flags or explicit weather property
  if (typeof (state as any).flags?.weather === "string") {
    const fw = (state as any).flags.weather.toLowerCase();
    if (fw === "clear" || fw === "rain" || fw === "storm" || fw === "snow") return fw;
  }
  if (typeof (state as any).weather === "string") {
    const w = (state as any).weather.toLowerCase();
    if (w === "clear" || w === "rain" || w === "storm" || w === "snow") return w;
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
 * Resolves soft day/night cycle progression from game tick and animation phase:
 * - Day (noon sun): subtle warm ambient glint
 * - Night / twilight: cool midnight navy wash (0x0f172a)
 */
export function resolveDayNightCycle(
  state?: GameState | null,
  phase: number = 0
): { isNight: boolean; dayAlpha: number; nightAlpha: number } {
  const tick = state?.meta?.tick ?? Math.floor(phase * 10);
  // Full 600-tick day/night cycle (60 seconds)
  const progress = (((tick % 600) + 600) % 600) / 600;
  const sin = Math.sin(progress * Math.PI * 2);

  const isNight = sin < 0;
  const dayAlpha = Math.max(0, sin) * 0.05;
  const nightAlpha = Math.max(0, -sin) * 0.12;

  return { isNight, dayAlpha, nightAlpha };
}

/**
 * Living atmosphere effects on the isometric board that read the current weather:
 * - Soft day/night tint and weather overlay.
 * - Clear: warm gold tint.
 * - Rain: cool blue tint + small drifting rain streaks.
 * - Storm: darker blue + heavier streaks + occasional lightning flash.
 * - Snow: pale grey tint + small drifting snow dots.
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
  const { dayAlpha, nightAlpha } = resolveDayNightCycle(state, phase);

  // 1. Soft Day / Night Ambient Wash
  if (nightAlpha > 0.01) {
    g.rect(-width, -height, width * 3, height * 3);
    g.fill({ color: 0x0f172a, alpha: nightAlpha });
  } else if (dayAlpha > 0.01) {
    g.rect(-width, -height, width * 3, height * 3);
    g.fill({ color: 0xfef08a, alpha: dayAlpha });
  }

  // 2. Weather Tint & Particle Overlay
  switch (weather) {
    case "clear": {
      // Warm gold tint wash & soft sun haze
      g.rect(-width, -height, width * 3, height * 3);
      g.fill({ color: 0xfde047, alpha: 0.05 });

      g.ellipse(width * 0.5, height * 0.35, width * 0.6, height * 0.4);
      g.fill({ color: 0xfef08a, alpha: 0.03 });
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
      const cycle = (((phase * 1.5 + (state?.meta?.seed ?? 0) * 0.1) % 10) + 10) % 10;
      if (cycle > 9.75 || (cycle > 9.5 && cycle < 9.6)) {
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
