import { Graphics } from "pixi.js";
import type { GameState } from "@second-crown/shared";
import * as sim from "@second-crown/sim";
import { CANVAS_W, CANVAS_H } from "./camera.js";
import type { ThemeVisuals } from "./tiles.js";

export type WeatherKind = "rain" | "snow" | "clear";

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

/**
 * Resolves current weather precipitation from season and holiday identifiers:
 * - "rain": Light rain in autumn-ish wet seasons (Autumn, Harvest, Halloween).
 * - "snow": Light snow in winter seasons (Winter, Midwinter).
 * - "clear": Clear otherwise (Spring, Summer, Easter, Midsummer, default).
 */
export function resolveWeatherKind(season?: string, holiday?: string): WeatherKind {
  const normHoliday = (holiday || "none").trim().toLowerCase();
  const normSeason = (season || "Spring").trim().toLowerCase();

  // Holiday theme overrides
  if (normHoliday === "midwinter") return "snow";
  if (normHoliday === "harvest" || normHoliday === "halloween") return "rain";

  // Base seasonal weather
  if (normSeason === "winter") return "snow";
  if (normSeason === "autumn" || normSeason === "fall") return "rain";

  // Clear otherwise (Spring, Summer, Easter, Midsummer, etc.)
  return "clear";
}

/**
 * Resolves current weather kind using season and holiday state already on the GameState.
 */
export function resolveWeatherFromState(
  state?: GameState | null,
  visuals?: ThemeVisuals | null
): WeatherKind {
  if (visuals?.decorations) {
    const dec = visuals.decorations.toLowerCase();
    if (dec === "winter" || dec === "midwinter") return "snow";
    if (dec === "autumn" || dec === "harvest" || dec === "halloween") return "rain";
  }

  let season = "Spring";
  if (state) {
    if (typeof (state as any).season === "string" && (state as any).season) {
      season = (state as any).season;
    } else if (state.meta && typeof state.meta.tick === "number") {
      try {
        season = sim.currentSeason(state);
      } catch {
        season = "Spring";
      }
    }
  }

  const holiday = (state as any)?.flags?.holiday || (state as any)?.flags?.theme || "none";
  return resolveWeatherKind(season, holiday);
}

/**
 * Generates an initial pool of weather particles distributed across the viewport.
 */
export function createWeatherParticles(
  count: number,
  w: number = CANVAS_W,
  h: number = CANVAS_H
): WeatherParticle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.6,
    vy: 0.5 + Math.random() * 0.8,
    size: 1.2 + Math.random() * 2.2,
    alpha: 0.25 + Math.random() * 0.55,
    phase: Math.random() * Math.PI * 2,
  }));
}

/**
 * Paints weather precipitation particles:
 * - Light rain: delicate slanted droplets/streaks with subtle splash ripples
 * - Light snow: soft crystalline flakes with gentle flutter and drift
 * - Clear: strictly clears the graphics buffer and renders zero precipitation particles
 */
export function paintWeatherParticles(
  g: Graphics,
  weather: WeatherKind,
  particles: WeatherParticle[],
  t: number,
  w: number = CANVAS_W,
  h: number = CANVAS_H
): void {
  g.clear();
  if (weather === "clear" || particles.length === 0) return;

  for (const p of particles) {
    if (weather === "rain") {
      // Light rain: rapid downward fall with gentle diagonal wind slant
      p.y += p.vy * 3.2;
      p.x += p.vx * 1.2 - 0.7;

      if (p.y > h + 15) {
        p.y = -15;
        p.x = Math.random() * (w + 40);
      }
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;

      const len = p.size * 3.2 + 5;
      // Slanted falling raindrop streak
      g.moveTo(p.x, p.y);
      g.lineTo(p.x - 1.4, p.y + len);
      g.stroke({ width: 0.9, color: 0x93c5fd, alpha: p.alpha * 0.60 });

      // Delicate ground splash ripple at lower elevation
      if (p.y > h * 0.75) {
        const progress = (p.y - h * 0.75) / (h * 0.25);
        g.ellipse(p.x - 1.4, p.y + len, 2.0 * progress, 0.8 * progress);
        g.stroke({ width: 0.6, color: 0x60a5fa, alpha: p.alpha * 0.35 * (1 - progress * 0.5) });
      }
    } else if (weather === "snow") {
      // Light snow: soft gentle flutter and graceful drift
      p.y += p.vy * 0.85;
      p.x += p.vx + Math.sin(t * 1.5 + p.phase) * 0.45;

      if (p.y > h + 10) {
        p.y = -10;
        p.x = Math.random() * w;
      }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      // Soft crystalline snowflake with subtle core & soft halo
      g.circle(p.x, p.y, p.size * 0.85);
      g.fill({ color: 0xf8fafc, alpha: p.alpha * 0.85 });
      g.circle(p.x, p.y, p.size * 1.35);
      g.fill({ color: 0xbae6fd, alpha: p.alpha * 0.25 });
    }
  }
}
