import React from "react";
import {
  terrainDepthSnapshot,
  type GameState,
  type TerrainDepthSnapshot,
} from "@second-crown/sim";
import "./board-terrain-depth.css";

export interface BoardTerrainDepthView extends TerrainDepthSnapshot {
  shadowOpacity: number;
  fogOpacity: number;
}

/**
 * Pure wrapper around `terrainDepthSnapshot(state)` with safe guards.
 * Returns `null` when the snapshot is null (`living_terrain_depth` off) or state is missing.
 */
export function resolveBoardTerrainDepth(
  state: GameState | null | undefined,
): BoardTerrainDepthView | null {
  if (!state?.flags || !Array.isArray(state.board?.provinces)) return null;
  const snap = terrainDepthSnapshot(state);
  if (!snap) return null;

  const shadowStrength = Math.min(
    1,
    Math.max(0, Number.isFinite(snap.shadowStrength) ? snap.shadowStrength : 0),
  );
  const fogDensity = Math.min(
    1,
    Math.max(0, Number.isFinite(snap.fogDensity) ? snap.fogDensity : 0),
  );

  return {
    relief: snap.relief,
    shadowStrength,
    fogDensity,
    shadowOpacity: Number((0.04 + shadowStrength * 0.14).toFixed(3)),
    fogOpacity: fogDensity <= 0 ? 0 : Number((0.03 + fogDensity * 0.15).toFixed(3)),
  };
}

/**
 * Thin, non-blocking Dusk/Night/Parchment terrain depth atmosphere overlay.
 * Complements the Pixi board's height faces, ground shadows, and fog veil,
 * hiding cleanly when `terrainDepthSnapshot` is null or `living_terrain_depth` is off.
 */
export const BoardTerrainDepth: React.FC<{
  state: GameState | null | undefined;
}> = ({ state }) => {
  const v = resolveBoardTerrainDepth(state);
  if (!v) return null;

  return (
    <div
      className={`sc-bdepth-overlay is-relief-${v.relief}`}
      data-bdepth-relief={v.relief}
      data-bdepth-shadow={v.shadowStrength.toFixed(3)}
      data-bdepth-fog={v.fogDensity.toFixed(3)}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="sc-bdepth-ground"
        style={{ opacity: v.shadowOpacity, pointerEvents: "none" }}
      />
      {v.fogOpacity > 0 && (
        <div
          className="sc-bdepth-fog"
          style={{ opacity: v.fogOpacity, pointerEvents: "none" }}
        />
      )}
    </div>
  );
};
