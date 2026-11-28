import React from "react";
import {
  POLISH_KEEP_EMPTY,
  POLISH_KEEP_HOME,
  POLISH_KEEP_RIVAL,
  POLISH_MARCH_ENEMY,
  POLISH_MARCH_LEAVING,
  POLISH_MARCH_OWN,
  SURFACE_FOG_VEILED,
  boardPolishSnapshot,
  type GameState,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import "./board-polish.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

export type BoardPolishKeepKind = "home" | "rival" | "empty";
export type BoardPolishMarchKind = "enemy" | "own" | "leaving";

export interface BoardPolishKeepItem {
  id: string;
  wx: number;
  wy: number;
  kind: BoardPolishKeepKind;
  label: string;
  pillW: number;
}

export interface BoardPolishMarchItem {
  id: string;
  wx: number;
  wy: number;
  kind: BoardPolishMarchKind;
  label: string;
  pillW: number;
}

export interface BoardPolishFogItem {
  id: string;
  wx: number;
  wy: number;
}

export interface BoardPolishView {
  keeps: BoardPolishKeepItem[];
  marches: BoardPolishMarchItem[];
  fog: BoardPolishFogItem[];
}

function classifyKeep(keep: string | null): BoardPolishKeepKind | null {
  if (keep === POLISH_KEEP_HOME) return "home";
  if (keep === POLISH_KEEP_RIVAL) return "rival";
  if (keep === POLISH_KEEP_EMPTY) return "empty";
  return null;
}

function classifyMarch(march: string | null): BoardPolishMarchKind | null {
  if (march === POLISH_MARCH_ENEMY) return "enemy";
  if (march === POLISH_MARCH_OWN) return "own";
  if (march === POLISH_MARCH_LEAVING) return "leaving";
  return null;
}

/**
 * Projects `boardPolishSnapshot(state, provinceId)` across all board provinces
 * into non-blocking march, keep, and veiled-fog polish items. Veiled tiles never
 * reveal keep or march items so fog secrecy stays intact.
 */
export function resolveBoardPolish(
  state: GameState | null | undefined,
): BoardPolishView | null {
  if (!state?.board?.provinces?.length || !state.flags || !state.meta) return null;

  const keeps: BoardPolishKeepItem[] = [];
  const marches: BoardPolishMarchItem[] = [];
  const fog: BoardPolishFogItem[] = [];

  for (const p of state.board.provinces) {
    const snap = boardPolishSnapshot(state, p.id);
    if (!snap) {
      if (keeps.length === 0 && marches.length === 0 && fog.length === 0) return null;
      continue;
    }

    const wx = Number((BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W).toFixed(1));
    const wy = Number((BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain)).toFixed(1));

    if (snap.fog === SURFACE_FOG_VEILED) {
      fog.push({ id: p.id, wx, wy });
      continue;
    }

    const keepKind = classifyKeep(snap.keep);
    if (keepKind && snap.keep) {
      keeps.push({
        id: p.id,
        wx,
        wy,
        kind: keepKind,
        label: snap.keep,
        pillW: Number(Math.max(30, snap.keep.length * 2.55 + 8).toFixed(1)),
      });
    }

    const marchKind = classifyMarch(snap.march);
    if (marchKind && snap.march) {
      marches.push({
        id: p.id,
        wx,
        wy,
        kind: marchKind,
        label: snap.march,
        pillW: Number(Math.max(32, snap.march.length * 2.55 + 8).toFixed(1)),
      });
    }
  }

  if (keeps.length === 0 && marches.length === 0 && fog.length === 0) return null;
  return { keeps, marches, fog };
}

/**
 * Quiet, non-blocking SVG board polish layer refining march, keep, and fog cues
 * from `boardPolishSnapshot`. Hides completely when `living_board_polish` is `false`.
 */
export const BoardPolishLayer: React.FC<{
  state: GameState;
}> = ({ state }) => {
  const v = resolveBoardPolish(state);
  if (!v) return null;

  return (
    <g
      className="sc-bpol-layer"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {v.fog.map((f) => (
        <g
          key={`bpol-fog-${f.id}`}
          className="sc-bpol-fog"
          data-bpol-tile={f.id}
          data-bpol-fog="veiled"
        >
          <path
            className="sc-bpol-fog-veil"
            d={`M ${f.wx - 9.5} ${f.wy + 1.2} Q ${f.wx} ${f.wy - 2.6} ${f.wx + 9.5} ${f.wy + 1.2}`}
          />
          <polyline
            className="sc-bpol-fog-edge"
            points={`${f.wx - 13},${f.wy} ${f.wx},${f.wy + 6.5} ${f.wx + 13},${f.wy}`}
          />
        </g>
      ))}

      {v.keeps.map((k) => (
        <g
          key={`bpol-keep-${k.id}`}
          className={`sc-bpol-keep is-${k.kind}`}
          data-bpol-tile={k.id}
          data-bpol-keep={k.kind}
        >
          <path
            className="sc-bpol-keep-crest"
            d={`M ${k.wx - 4} ${k.wy - 4.5} L ${k.wx - 4} ${k.wy - 7} L ${k.wx - 1.5} ${k.wy - 5.5} L ${k.wx} ${k.wy - 7.8} L ${k.wx + 1.5} ${k.wy - 5.5} L ${k.wx + 4} ${k.wy - 7} L ${k.wx + 4} ${k.wy - 4.5}`}
          />
          <g transform={`translate(${k.wx}, ${k.wy + 9.5})`}>
            <rect
              className="sc-bpol-pill-bg"
              x={-k.pillW / 2}
              y={-3.4}
              width={k.pillW}
              height={6.6}
              rx={3.2}
            />
            <text
              className="sc-bpol-pill-text"
              x={0}
              y={1.1}
              textAnchor="middle"
            >
              {k.label}
            </text>
          </g>
        </g>
      ))}

      {v.marches.map((m) => (
        <g
          key={`bpol-march-${m.id}`}
          className={`sc-bpol-march is-${m.kind}`}
          data-bpol-tile={m.id}
          data-bpol-march={m.kind}
        >
          <path
            className="sc-bpol-march-chevron"
            d={
              m.kind === "leaving"
                ? `M ${m.wx + 4.5} ${m.wy - 5.8} L ${m.wx + 8} ${m.wy - 7.6} L ${m.wx + 4.5} ${m.wy - 9.4}`
                : `M ${m.wx - 8} ${m.wy - 5.8} L ${m.wx - 4.5} ${m.wy - 7.6} L ${m.wx - 8} ${m.wy - 9.4}`
            }
          />
          <g transform={`translate(${m.wx}, ${Math.max(11, m.wy - 11.8)})`}>
            <rect
              className="sc-bpol-pill-bg"
              x={-m.pillW / 2}
              y={-3.4}
              width={m.pillW}
              height={6.6}
              rx={3.2}
            />
            <text
              className="sc-bpol-pill-text"
              x={0}
              y={1.1}
              textAnchor="middle"
            >
              {m.label}
            </text>
          </g>
        </g>
      ))}
    </g>
  );
};
