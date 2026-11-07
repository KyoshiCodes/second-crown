import React from "react";
import {
  getProvince,
  isProvinceSeen,
  type GameState,
  type Province,
} from "@second-crown/sim";
import { boardStatusAnchor } from "./BoardStatus";
import "./board-living.css";

/** Canvas viewport dimensions from packages/render/src/camera.ts */
export const CANVAS_W = 560;
export const CANVAS_H = 360;

/** Isometric board grid origins and tile radii */
export const BOARD_ORIGIN_X = 236;
export const BOARD_ORIGIN_Y = 56;
export const BOARD_HALF_W = 22;
export const BOARD_HALF_H = 11;

/** Converts board grid coordinates (x, y) to canvas isometric pixel center (wx, wy). */
export function boardGridToWorld(bx: number, by: number): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (bx - by) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (bx + by) * BOARD_HALF_H,
  };
}

/** Palette mapping for living terrain pulses */
export const TERRAIN_PULSE_COLORS: Record<string, { stroke: string; fill: string; aura: string }> = {
  plain: { stroke: "#4ade80", fill: "#22c55e", aura: "rgba(74, 222, 128, 0.45)" },
  sand: { stroke: "#fbbf24", fill: "#d97706", aura: "rgba(251, 191, 36, 0.45)" },
  crag: { stroke: "#94a3b8", fill: "#64748b", aura: "rgba(148, 163, 184, 0.45)" },
  waste: { stroke: "#94a3b8", fill: "#64748b", aura: "rgba(148, 163, 184, 0.45)" },
  shore: { stroke: "#38bdf8", fill: "#0284c7", aura: "rgba(56, 189, 248, 0.45)" },
  peak: { stroke: "#c084fc", fill: "#9333ea", aura: "rgba(192, 132, 252, 0.45)" },
  wood: { stroke: "#a3e635", fill: "#65a30d", aura: "rgba(163, 230, 53, 0.45)" },
  hill: { stroke: "#facc15", fill: "#ca8a04", aura: "rgba(250, 204, 21, 0.45)" },
};

export interface BoardLivingProps {
  state: GameState | undefined;
  selectedId: string | null;
  visible: boolean;
}

/**
 * Living board animations positioned directly under the status overlay:
 * 1. Terrain pulse: living isometric diamond and breathing aura under selected province
 * 2. Keep glow: warm volumetric hearth aura and beacon illumination on player & visible rival holds
 * 3. Soft fog drift: ethereal floating mist veils gently drifting across unseen areas
 * 4. Status overlay tether: subtle atmospheric light line anchoring the status chips to the province
 */
export function BoardLiving({ state, selectedId, visible }: BoardLivingProps) {
  if (!visible || !state) return null;

  const provinces = state.board?.provinces ?? [];
  const homeId = state.board?.homeProvinceId;

  // Selected province for terrain pulse
  const selProv = selectedId ? getProvince(state, selectedId) : null;
  const selSeen = selProv ? (selProv.id === homeId || isProvinceSeen(state, selProv.id)) : false;
  const selCoords = selProv ? boardGridToWorld(selProv.x, selProv.y) : null;
  const terrainColors = selProv ? (TERRAIN_PULSE_COLORS[selProv.terrain] ?? TERRAIN_PULSE_COLORS.plain) : null;

  // Holds for keep glow (home keep + seen realm keeps)
  const holds: Array<{ id: string; p: Province; isPlayer: boolean; wx: number; wy: number }> = [];
  for (const p of provinces) {
    const isPlayer = p.id === homeId;
    const isSeen = isPlayer || isProvinceSeen(state, p.id);
    if (!isSeen) continue;
    if (isPlayer || p.occupantRealmId) {
      const { wx, wy } = boardGridToWorld(p.x, p.y);
      holds.push({ id: p.id, p, isPlayer, wx, wy });
    }
  }

  // Unseen provinces for soft fog drift clusters
  const unseenProvs = provinces.filter((p) => p.id !== homeId && !isProvinceSeen(state, p.id));
  const fogClusters: Array<{ key: string; cx: number; cy: number; isAlt: boolean }> = [];
  // Sample up to 6 distinct fog cluster points across unseen territories
  for (let i = 0; i < unseenProvs.length && fogClusters.length < 6; i += Math.max(1, Math.floor(unseenProvs.length / 6))) {
    const p = unseenProvs[i];
    const { wx, wy } = boardGridToWorld(p.x, p.y);
    fogClusters.push({
      key: `fog-${p.id}`,
      cx: wx,
      cy: wy,
      isAlt: fogClusters.length % 2 === 1,
    });
  }

  // Anchor coords for status overlay tether
  const anchor = selProv && selCoords ? boardStatusAnchor(state, selProv.id) : null;
  const tetherTargetX = anchor ? (anchor.side === "left" ? 28 : CANVAS_W - 28) : 0;
  const tetherTargetY = anchor ? (anchor.topPct / 100) * CANVAS_H : 0;

  return (
    <div
      className="sc-board-living"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
      data-testid="sc-board-living"
    >
      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="sc-board-living-svg"
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          {/* Radial hearth gradients for keep glow */}
          <radialGradient id="sc-board-hearth-gold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
            <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sc-board-hearth-rival" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.8" />
            <stop offset="45%" stopColor="#ef4444" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sc-board-beacon-ray-gold" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sc-board-beacon-ray-rival" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fca5a5" stopOpacity="0" />
          </linearGradient>

          {/* Fog puff gradient */}
          <radialGradient id="sc-board-fog-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#94a3b8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#475569" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Soft Fog Drift Layer (under keeps and status) */}
        {fogClusters.length > 0 && (
          <g className="sc-board-living-fog" style={{ pointerEvents: "none" }}>
            {fogClusters.map((fc) => (
              <g
                key={fc.key}
                className={`sc-board-fog-cloud${fc.isAlt ? " is-alt" : ""}`}
                style={{ pointerEvents: "none" }}
              >
                <ellipse
                  cx={fc.cx}
                  cy={fc.cy}
                  rx={32}
                  ry={16}
                  fill="url(#sc-board-fog-grad)"
                  className="sc-board-fog-puff"
                />
                <ellipse
                  cx={fc.cx + 8}
                  cy={fc.cy - 3}
                  rx={22}
                  ry={11}
                  fill="url(#sc-board-fog-grad)"
                  className="sc-board-fog-puff"
                />
              </g>
            ))}
          </g>
        )}

        {/* 2. Terrain Pulse Layer (for selected province) */}
        {selProv && selCoords && terrainColors && (
          <g
            className="sc-board-living-terrain sc-board-terrain-group"
            data-terrain={selProv.terrain}
            style={{ pointerEvents: "none" }}
          >
            {/* Breathing terrain aura */}
            <ellipse
              cx={selCoords.wx}
              cy={selCoords.wy}
              rx={28}
              ry={14}
              fill={terrainColors.aura}
              className="sc-board-terrain-aura"
            />
            {/* Expanding resonance ripple */}
            <ellipse
              cx={selCoords.wx}
              cy={selCoords.wy}
              rx={32}
              ry={16}
              fill="none"
              stroke={terrainColors.stroke}
              strokeWidth="0.85"
              strokeDasharray="3 2"
              className="sc-board-terrain-ring"
            />
            {/* Pulsing isometric diamond contour */}
            <polygon
              points={`${selCoords.wx},${selCoords.wy - BOARD_HALF_H} ${selCoords.wx + BOARD_HALF_W},${selCoords.wy} ${selCoords.wx},${selCoords.wy + BOARD_HALF_H} ${selCoords.wx - BOARD_HALF_W},${selCoords.wy}`}
              fill={terrainColors.fill}
              stroke={terrainColors.stroke}
              strokeWidth="1.2"
              className="sc-board-terrain-diamond"
            />
          </g>
        )}

        {/* 3. Keep Glow Layer (volumetric hearth and beacon illumination) */}
        {holds.length > 0 && (
          <g className="sc-board-living-keeps" style={{ pointerEvents: "none" }}>
            {holds.map((h) => (
              <g
                key={`keep-${h.id}`}
                className={`sc-board-keep-group ${h.isPlayer ? "is-player" : "is-rival"}`}
                style={{ pointerEvents: "none" }}
              >
                {/* Volumetric hearth breathing aura */}
                <ellipse
                  cx={h.wx}
                  cy={h.wy - 3}
                  rx={24}
                  ry={13}
                  fill={h.isPlayer ? "url(#sc-board-hearth-gold)" : "url(#sc-board-hearth-rival)"}
                  className="sc-board-keep-hearth-glow"
                />
                {/* Upward beacon ray flare */}
                <polygon
                  points={`${h.wx - 3.5},${h.wy - 4} ${h.wx},${h.wy - 20} ${h.wx + 3.5},${h.wy - 4}`}
                  fill={h.isPlayer ? "url(#sc-board-beacon-ray-gold)" : "url(#sc-board-beacon-ray-rival)"}
                  className="sc-board-keep-beacon-ray"
                />
                {/* Radiant hearth core spark */}
                <circle
                  cx={h.wx}
                  cy={h.wy - 5}
                  r={2.2}
                  fill={h.isPlayer ? "#fef08a" : "#fca5a5"}
                  className="sc-board-keep-light"
                />
              </g>
            ))}
          </g>
        )}

        {/* 4. Atmospheric Status Overlay Tether (connects selected tile to status stack) */}
        {selProv && selCoords && anchor && (
          <g className="sc-board-living-status-tether" style={{ pointerEvents: "none" }}>
            <line
              x1={selCoords.wx}
              y1={selCoords.wy}
              x2={tetherTargetX}
              y2={tetherTargetY}
              stroke="#fbbf24"
              strokeWidth="0.8"
              strokeDasharray="2 3"
              strokeOpacity="0.45"
              className="sc-board-status-tether"
            />
            {/* Soft ambient anchor glow under the status stack */}
            <circle
              cx={tetherTargetX}
              cy={tetherTargetY}
              r={14}
              fill="rgba(250, 204, 21, 0.18)"
              className="sc-board-status-tether"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
