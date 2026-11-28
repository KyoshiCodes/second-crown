import React from "react";
import {
  lightingSnapshot,
  type GameState,
  type LightingSnapshot,
} from "@second-crown/sim";
import "./board-lighting-tint.css";

export interface BoardLightingView extends LightingSnapshot {
  phaseOpacity: number;
  weatherOpacity: number;
}

/**
 * Pure wrapper around `lightingSnapshot(state)` with safe guards.
 * Computes calm, non-heavy phase and weather opacities scaled by `intensity`.
 * Returns `null` when the snapshot is null (`living_lighting` off) or state is missing.
 */
export function resolveBoardLighting(
  state: GameState | null | undefined,
): BoardLightingView | null {
  if (!state?.flags) return null;
  const snap = lightingSnapshot(state);
  if (!snap) return null;

  const raw = Number.isFinite(snap.intensity) ? snap.intensity : 0;
  const intensity = Math.min(1, Math.max(0, raw));
  const phaseOpacity = Number((0.04 + intensity * 0.22).toFixed(3));
  const weatherOpacity =
    snap.weatherTint === "clear"
      ? 0
      : Number((0.04 + intensity * 0.14).toFixed(3));

  return {
    timeOfDay: snap.timeOfDay,
    weatherTint: snap.weatherTint,
    intensity,
    phaseOpacity,
    weatherOpacity,
  };
}

/**
 * Calm, non-blocking lighting tint overlay over the current board.
 * Follows `timeOfDay`, `weatherTint`, and `intensity` from `lightingSnapshot(state)`,
 * hiding cleanly when null or when `living_lighting` is switched off.
 */
export const BoardLightingTint: React.FC<{
  state: GameState | null | undefined;
}> = ({ state }) => {
  const v = resolveBoardLighting(state);
  if (!v) return null;

  return (
    <div
      className={`sc-btint-overlay is-phase-${v.timeOfDay} is-weather-${v.weatherTint}`}
      data-btint-phase={v.timeOfDay}
      data-btint-weather={v.weatherTint}
      data-btint-intensity={v.intensity.toFixed(3)}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="sc-btint-phase"
        style={{ opacity: v.phaseOpacity, pointerEvents: "none" }}
      />
      {v.weatherTint !== "clear" && (
        <div
          className="sc-btint-weather"
          style={{ opacity: v.weatherOpacity, pointerEvents: "none" }}
        />
      )}
    </div>
  );
};
