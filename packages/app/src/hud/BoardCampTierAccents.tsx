import React from "react";
import { campTierId, isProvinceSeen, type GameState, type Province } from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import type { CampTierId } from "./CampTierPip";
import "./camp-tier-accents.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

export interface BoardCampTierPoint {
  id: string;
  tierId: CampTierId;
  tone: "safe" | "fair" | "hard";
  shape: "leaf" | "tent" | "palisade";
  wx: number;
  wy: number;
  auraColor: string;
  crestColor: string;
  delaySeconds: number;
}

const TIER_BOARD_STYLE: Record<
  CampTierId,
  { tone: "safe" | "fair" | "hard"; shape: "leaf" | "tent" | "palisade"; auraColor: string; crestColor: string }
> = {
  lean_to: { tone: "safe", shape: "leaf", auraColor: "#6ee7b7", crestColor: "#34d399" },
  camp: { tone: "fair", shape: "tent", auraColor: "#e2b05a", crestColor: "#d49a3a" },
  stockade: { tone: "hard", shape: "palisade", auraColor: "#fb923c", crestColor: "#f97316" },
};

function campCenter(p: Province): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain),
  };
}

/** Deterministic, fog-respecting camp tier markers across revealed unflagged camp tiles. */
export function listBoardCampTierAccents(state: GameState | null | undefined): BoardCampTierPoint[] {
  if (!state?.board?.provinces) return [];
  const out: BoardCampTierPoint[] = [];
  for (const p of state.board.provinces) {
    if (p.node !== "camp" || p.occupantRealmId) continue;
    if (!isProvinceSeen(state, p.id)) continue;
    const tierId = campTierId(state, p);
    if (!tierId) continue;
    const style = TIER_BOARD_STYLE[tierId];
    const { wx, wy } = campCenter(p);
    out.push({
      id: p.id,
      tierId,
      tone: style.tone,
      shape: style.shape,
      wx,
      wy,
      auraColor: style.auraColor,
      crestColor: style.crestColor,
      delaySeconds: Number((((p.x * 5 + p.y * 9) % 9) * 0.35).toFixed(2)),
    });
  }
  return out;
}

/**
 * Quiet non-blocking isometric overlays distinguishing safe starter camps (sage green)
 * from fair camps (warm ochre) and tougher optional stockades (ember-amber + soft ring).
 */
export function BoardCampTierAccents({ state }: { state: GameState }) {
  const camps = listBoardCampTierAccents(state);
  if (camps.length === 0) return null;

  return (
    <g className="sc-board-camp-accents" aria-hidden="true" style={{ pointerEvents: "none" }}>
      {camps.map((c) => {
        const auraPoints = `${c.wx},${c.wy - 7.5} ${c.wx + 15},${c.wy} ${c.wx},${c.wy + 7.5} ${c.wx - 15},${c.wy}`;
        return (
          <g
            key={`camp-tier-${c.id}`}
            className={`sc-board-camp-tier is-${c.tierId} tone-${c.tone}`}
            data-camp-province={c.id}
            data-camp-tier={c.tierId}
            style={{ pointerEvents: "none" }}
          >
            <polygon
              points={auraPoints}
              fill={c.auraColor}
              fillOpacity={c.tierId === "stockade" ? 0.16 : c.tierId === "lean_to" ? 0.14 : 0.1}
              stroke={c.crestColor}
              strokeOpacity={c.tierId === "stockade" ? 0.52 : c.tierId === "lean_to" ? 0.44 : 0.3}
              strokeWidth={c.tierId === "stockade" ? 1 : 0.8}
              className="sc-board-camp-aura"
              style={{ animationDelay: `-${c.delaySeconds}s` }}
            />
            <g className="sc-board-camp-crest" transform={`translate(${c.wx}, ${c.wy - 10.5})`}>
              {c.tierId === "stockade" ? (
                <>
                  <circle
                    cx={0}
                    cy={0}
                    r={4.4}
                    fill="none"
                    stroke={c.crestColor}
                    strokeWidth={0.9}
                    className="sc-board-camp-ring"
                    style={{ animationDelay: `-${c.delaySeconds}s` }}
                  />
                  <polygon
                    points="0,-3.4 3.2,0 0,3.4 -3.2,0"
                    fill="#451a03"
                    stroke={c.crestColor}
                    strokeWidth={1.05}
                  />
                  <circle
                    cx={2.2}
                    cy={-2.6}
                    r={0.85}
                    fill="#fed7aa"
                    className="sc-board-camp-spark"
                    style={{ animationDelay: `-${(c.delaySeconds + 0.6).toFixed(2)}s` }}
                  />
                </>
              ) : c.tierId === "lean_to" ? (
                <>
                  <circle cx={0} cy={0} r={2.8} fill="#064e3b" stroke={c.crestColor} strokeWidth={0.95} />
                  <path
                    d="M-1.2 0.3L0 -1.1L1.2 0.3"
                    fill="none"
                    stroke="#a7f3d0"
                    strokeWidth={0.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              ) : (
                <polygon
                  points="0,-2.7 2.6,1.8 -2.6,1.8"
                  fill="#422006"
                  stroke={c.crestColor}
                  strokeWidth={0.9}
                />
              )}
            </g>
          </g>
        );
      })}
    </g>
  );
}
