import React from "react";
import {
  SURFACE_FOG_VEILED,
  SURFACE_KEEP_EMPTY,
  SURFACE_KEEP_HOME,
  SURFACE_KEEP_RIVAL,
  SURFACE_MARCH_ENEMY,
  SURFACE_MARCH_LEAVING,
  SURFACE_MARCH_OWN,
  boardSurfaceSnapshot,
  type GameState,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import "./board-surface.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

export type BoardSurfaceElevKind = "peak" | "hill" | "shore" | "level";
export type BoardSurfaceKeepKind = "home" | "rival" | "empty";
export type BoardSurfaceMarchKind = "enemy" | "own" | "leaving";

export interface BoardSurfaceTileView {
  id: string;
  wx: number;
  wy: number;
  terrain: string;
  elevKind: BoardSurfaceElevKind;
  elevation: string;
  keepKind: BoardSurfaceKeepKind | null;
  keep: string | null;
  marchKind: BoardSurfaceMarchKind | null;
  marches: string | null;
}

export interface BoardSurfaceVeiledView {
  id: string;
  wx: number;
  wy: number;
}

export interface BoardSurfaceView {
  clear: BoardSurfaceTileView[];
  veiled: BoardSurfaceVeiledView[];
}

function classifyElevation(elevation: string): BoardSurfaceElevKind {
  if (elevation === "High peak") return "peak";
  if (elevation === "Rising ground") return "hill";
  if (elevation === "Low shore") return "shore";
  return "level";
}

function classifyKeep(keep: string | null): BoardSurfaceKeepKind | null {
  if (keep === SURFACE_KEEP_HOME) return "home";
  if (keep === SURFACE_KEEP_RIVAL) return "rival";
  if (keep === SURFACE_KEEP_EMPTY) return "empty";
  return null;
}

function classifyMarch(marches: string | null): BoardSurfaceMarchKind | null {
  if (marches === SURFACE_MARCH_ENEMY) return "enemy";
  if (marches === SURFACE_MARCH_OWN) return "own";
  if (marches === SURFACE_MARCH_LEAVING) return "leaving";
  return null;
}

/**
 * Projects `boardSurfaceSnapshot(state, provinceId)` across board provinces for
 * calm terrain, elevation, fog, keep, and march surface marks while strictly keeping
 * veiled tiles fogged (never emitting terrain, keep, or march detail under fog).
 */
export function resolveBoardSurface(
  state: GameState | null | undefined,
): BoardSurfaceView | null {
  if (!state?.board?.provinces?.length || !state.flags || !state.meta) return null;

  const clear: BoardSurfaceTileView[] = [];
  const veiled: BoardSurfaceVeiledView[] = [];

  for (const p of state.board.provinces) {
    const snap = boardSurfaceSnapshot(state, p.id);
    if (!snap) {
      if (clear.length === 0 && veiled.length === 0) return null;
      continue;
    }

    const wx = Number((BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W).toFixed(1));
    const wy = Number((BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain)).toFixed(1));

    if (snap.fog === SURFACE_FOG_VEILED) {
      veiled.push({ id: p.id, wx, wy });
      continue;
    }

    clear.push({
      id: p.id,
      wx,
      wy,
      terrain: snap.terrain,
      elevKind: classifyElevation(snap.elevation),
      elevation: snap.elevation,
      keepKind: classifyKeep(snap.keep),
      keep: snap.keep,
      marchKind: classifyMarch(snap.marches),
      marches: snap.marches,
    });
  }

  if (clear.length === 0 && veiled.length === 0) return null;
  return { clear, veiled };
}

function plinthDiamond(wx: number, wy: number, padX: number, padY: number): string {
  return `${wx},${wy - padY} ${wx + padX},${wy} ${wx},${wy + padY} ${wx - padX},${wy}`;
}

/**
 * Quiet, non-blocking SVG board surface polish from `boardSurfaceSnapshot`.
 */
export const BoardSurfaceLayer: React.FC<{
  state: GameState;
}> = ({ state }) => {
  const v = resolveBoardSurface(state);
  if (!v) return null;

  return (
    <g
      className="sc-bsurf-layer"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {v.clear.map((t) => (
        <g
          key={`bsurf-${t.id}`}
          className="sc-bsurf-tile"
          data-bsurf-tile={t.id}
          data-bsurf-terrain={t.terrain}
          data-bsurf-elev={t.elevKind}
        >
          {t.elevKind === "peak" ? (
            <polyline
              className="sc-bsurf-contour is-peak"
              points={`${t.wx - 8},${t.wy - 2} ${t.wx},${t.wy - 7.5} ${t.wx + 8},${t.wy - 2}`}
            />
          ) : t.elevKind === "hill" ? (
            <path
              className="sc-bsurf-contour is-hill"
              d={`M ${t.wx - 9} ${t.wy + 1.5} Q ${t.wx} ${t.wy - 3.5} ${t.wx + 9} ${t.wy + 1.5}`}
            />
          ) : t.elevKind === "shore" ? (
            <path
              className="sc-bsurf-contour is-shore"
              d={`M ${t.wx - 9.5} ${t.wy + 3.2} Q ${t.wx} ${t.wy + 6} ${t.wx + 9.5} ${t.wy + 3.2}`}
            />
          ) : (
            <polygon
              className="sc-bsurf-contour is-level"
              points={plinthDiamond(t.wx, t.wy, 16, 8)}
            />
          )}

          {t.keepKind ? (
            <polygon
              className={`sc-bsurf-keep is-${t.keepKind}`}
              data-bsurf-keep={t.keepKind}
              points={plinthDiamond(t.wx, t.wy, 11.5, 5.8)}
            />
          ) : null}

          {t.marchKind ? (
            <path
              className={`sc-bsurf-march is-${t.marchKind}`}
              data-bsurf-march={t.marchKind}
              d={`M ${t.wx - 10} ${t.wy - 4.5} Q ${t.wx} ${t.wy - 8.5} ${t.wx + 10} ${t.wy - 4.5}`}
            />
          ) : null}
        </g>
      ))}

      {v.veiled.map((vf) => (
        <polygon
          key={`bsurf-fog-${vf.id}`}
          className="sc-bsurf-veiled"
          data-bsurf-tile={vf.id}
          data-bsurf-fog="veiled"
          points={plinthDiamond(vf.wx, vf.wy, 17, 8.5)}
        />
      ))}
    </g>
  );
};
