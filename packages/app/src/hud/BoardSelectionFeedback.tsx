import React from "react";
import {
  SELECTION_NOTE_HOME,
  SELECTION_NOTE_OWN,
  SELECTION_NOTE_RIVAL,
  SELECTION_NOTE_VEILED,
  SURFACE_FOG_CLEAR,
  boardSurfaceSnapshot,
  getProvince,
  selectionFeedbackSnapshot,
  type BoardView,
  type GameState,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import "./selection-feedback.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

export type BoardSelectionTone = "home" | "veiled" | "own" | "rival" | "open";

export interface BoardSelectionFeedbackView {
  selectedId: string;
  wx: number;
  wy: number;
  tone: BoardSelectionTone;
  note: string;
  surfaceSummary: string | null;
}

function toneForNote(note: string): BoardSelectionTone {
  if (note === SELECTION_NOTE_HOME) return "home";
  if (note === SELECTION_NOTE_VEILED) return "veiled";
  if (note === SELECTION_NOTE_OWN) return "own";
  if (note === SELECTION_NOTE_RIVAL) return "rival";
  return "open";
}

/**
 * Pure wrapper around `selectionFeedbackSnapshot(state, view)` combined with
 * fog-safe optional surface context from `boardSurfaceSnapshot(state, selected)`.
 */
export function resolveSelectionFeedback(
  state: GameState | null | undefined,
  view: BoardView = {},
): BoardSelectionFeedbackView | null {
  if (!state?.board?.provinces || !state.flags || !state.meta) return null;

  const snap = selectionFeedbackSnapshot(state, view);
  if (!snap) return null;

  const prov = getProvince(state, snap.selected);
  if (!prov) return null;

  const wx = Number((BOARD_ORIGIN_X + (prov.x - prov.y) * BOARD_HALF_W).toFixed(1));
  const wy = Number((BOARD_ORIGIN_Y + (prov.x + prov.y) * BOARD_HALF_H - boardTerrainElevation(prov.terrain)).toFixed(1));

  const surf = boardSurfaceSnapshot(state, snap.selected);
  const surfaceSummary =
    surf && surf.fog === SURFACE_FOG_CLEAR
      ? [surf.elevation, surf.keep, surf.marches].filter(Boolean).join(" · ") || null
      : null;

  return {
    selectedId: snap.selected,
    wx,
    wy,
    tone: toneForNote(snap.note),
    note: snap.note,
    surfaceSummary,
  };
}

function diamondPoints(wx: number, wy: number, padX: number, padY: number): string {
  return `${wx},${wy - padY} ${wx + padX},${wy} ${wx},${wy + padY} ${wx - padX},${wy}`;
}

/**
 * Calm, non-blocking SVG selection mark around the currently selected tile.
 * Hides cleanly when `selectionFeedbackSnapshot` returns `null`.
 */
export const BoardSelectionFeedbackMark: React.FC<{
  state: GameState;
  selectedId: string | null;
}> = ({ state, selectedId }) => {
  const v = resolveSelectionFeedback(state, { selectedProvinceId: selectedId });
  if (!v) return null;

  const hw = BOARD_HALF_W + 4;
  const hh = BOARD_HALF_H + 2;

  return (
    <g
      className={`sc-sel-fb-layer is-${v.tone}`}
      data-sel-fb-id={v.selectedId}
      data-sel-fb-tone={v.tone}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <polygon
        className="sc-sel-fb-halo"
        points={diamondPoints(v.wx, v.wy, hw + 1.8, hh + 0.9)}
      />
      <polygon
        className="sc-sel-fb-rim"
        points={diamondPoints(v.wx, v.wy, hw - 0.8, hh - 0.4)}
      />
      <path
        className="sc-sel-fb-corners"
        d={[
          `M ${v.wx - 3.6} ${v.wy - hh + 1.8} L ${v.wx} ${v.wy - hh} L ${v.wx + 3.6} ${v.wy - hh + 1.8}`,
          `M ${v.wx + hw - 3.6} ${v.wy - 1.8} L ${v.wx + hw} ${v.wy} L ${v.wx + hw - 3.6} ${v.wy + 1.8}`,
          `M ${v.wx - 3.6} ${v.wy + hh - 1.8} L ${v.wx} ${v.wy + hh} L ${v.wx + 3.6} ${v.wy + hh - 1.8}`,
          `M ${v.wx - hw + 3.6} ${v.wy - 1.8} L ${v.wx - hw} ${v.wy} L ${v.wx - hw + 3.6} ${v.wy + 1.8}`,
        ].join(" ")}
      />
    </g>
  );
};

/**
 * Calm, non-blocking HUD note strip at the bottom-left of the board viewport
 * displaying the exact line from `selectionFeedbackSnapshot` (plus clear-tile
 * elevation/keep/march summary when available). Hides when `null`.
 */
export const BoardSelectionFeedbackNote: React.FC<{
  state: GameState;
  selectedId: string | null;
}> = ({ state, selectedId }) => {
  const v = resolveSelectionFeedback(state, { selectedProvinceId: selectedId });
  if (!v) return null;

  return (
    <div
      className={`sc-sel-fb-note-bar is-${v.tone}`}
      data-sel-fb-note-id={v.selectedId}
      data-sel-fb-tone={v.tone}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <span className="sc-sel-fb-note-pip" aria-hidden="true" />
      <span className="sc-sel-fb-note-text">{v.note}</span>
      {v.surfaceSummary ? (
        <span className="sc-sel-fb-surface-detail">· {v.surfaceSummary}</span>
      ) : null}
    </div>
  );
};
