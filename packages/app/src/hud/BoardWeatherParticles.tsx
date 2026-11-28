import React from "react";
import {
  weatherParticleSnapshot,
  type GameState,
} from "@second-crown/sim";
import "./board-weather-particles.css";

export interface BoardWeatherParticle {
  id: string;
  leftPct: number;
  topPct: number;
  sizePx: number;
  durSec: number;
  delaySec: number;
  opacity: number;
}

export interface BoardWeatherParticlesView {
  kind: "rain" | "mist";
  intensity: number;
  particles: BoardWeatherParticle[];
}

function buildParticles(kind: "rain" | "mist", intensity: number): BoardWeatherParticle[] {
  const count =
    kind === "rain"
      ? Math.max(8, Math.round(intensity * 44))
      : Math.max(4, Math.round(intensity * 18));

  const out: BoardWeatherParticle[] = [];
  for (let i = 0; i < count; i++) {
    // Deterministic distribution across the board viewport without Math.random().
    const u = ((i * 37 + 13) % 97) / 97;
    const v = ((i * 53 + 29) % 89) / 89;
    const w = ((i * 19 + 7) % 31) / 31;

    if (kind === "rain") {
      out.push({
        id: `rain-${i}`,
        leftPct: Number((2 + u * 96).toFixed(2)),
        topPct: Number((-18 + v * 32).toFixed(2)),
        sizePx: Number((10 + w * 9 + intensity * 4).toFixed(1)),
        durSec: Number((0.72 + w * 0.42 - intensity * 0.14).toFixed(2)),
        delaySec: Number((-((i % 11) * 0.13 + w * 0.3)).toFixed(2)),
        opacity: Number((0.26 + w * 0.24 + intensity * 0.18).toFixed(2)),
      });
    } else {
      out.push({
        id: `mist-${i}`,
        leftPct: Number((-10 + u * 104).toFixed(2)),
        topPct: Number((8 + v * 78).toFixed(2)),
        sizePx: Number((74 + w * 68 + intensity * 28).toFixed(1)),
        durSec: Number((10 + w * 6).toFixed(2)),
        delaySec: Number((-((i % 7) * 1.4 + w * 2.1)).toFixed(2)),
        opacity: Number((0.18 + w * 0.14 + intensity * 0.12).toFixed(2)),
      });
    }
  }
  return out;
}

/**
 * Pure wrapper around `weatherParticleSnapshot(state)` with safe guards.
 * Returns `null` when null, `kind === "none"`, intensity <= 0, or `living_weather_particles` is off.
 */
export function resolveBoardWeatherParticles(
  state: GameState | null | undefined,
): BoardWeatherParticlesView | null {
  if (!state?.flags) return null;
  const snap = weatherParticleSnapshot(state);
  if (!snap || snap.kind === "none") return null;
  const raw = Number.isFinite(snap.intensity) ? snap.intensity : 0;
  const intensity = Math.min(1, Math.max(0, raw));
  if (intensity <= 0) return null;
  return {
    kind: snap.kind,
    intensity,
    particles: buildParticles(snap.kind, intensity),
  };
}

/**
 * Light non-blocking weather particle overlay (rain streaks or drifting mist wisps)
 * mounted over the current board. Hides cleanly when null, "none", or flagged off.
 */
export const BoardWeatherParticles: React.FC<{
  state: GameState | null | undefined;
}> = ({ state }) => {
  const v = resolveBoardWeatherParticles(state);
  if (!v) return null;

  return (
    <div
      className={`sc-bwpart-overlay is-${v.kind}${v.intensity >= 0.85 ? " is-heavy" : ""}`}
      data-bwpart-kind={v.kind}
      data-bwpart-intensity={v.intensity.toFixed(2)}
      data-bwpart-count={v.particles.length}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {v.particles.map((p) =>
        v.kind === "rain" ? (
          <span
            key={p.id}
            className="sc-bwpart-drop"
            style={{
              left: `${p.leftPct}%`,
              top: `${p.topPct}%`,
              height: `${p.sizePx}px`,
              opacity: p.opacity,
              animationDuration: `${p.durSec}s`,
              animationDelay: `${p.delaySec}s`,
              pointerEvents: "none",
            }}
          />
        ) : (
          <span
            key={p.id}
            className="sc-bwpart-wisp"
            style={{
              left: `${p.leftPct}%`,
              top: `${p.topPct}%`,
              width: `${p.sizePx}px`,
              height: `${Math.round(p.sizePx * 0.42)}px`,
              opacity: p.opacity,
              animationDuration: `${p.durSec}s`,
              animationDelay: `${p.delaySec}s`,
              pointerEvents: "none",
            }}
          />
        ),
      )}
    </div>
  );
};
