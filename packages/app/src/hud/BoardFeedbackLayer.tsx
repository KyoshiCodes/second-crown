import React from "react";
import {
  boardFeedbackSnapshot,
  type BoardView,
  type GameState,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import { BoardNearbyFriendlyMark } from "./BoardInteractionDetailOverlay";
import "./board-feedback-status.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

export interface BoardFeedbackView {
  selected: { id: string; wx: number; wy: number; label: string; labelW: number } | null;
  inspected: { id: string; wx: number; wy: number } | null;
  march: {
    id: string;
    fx: number;
    fy: number;
    tx: number;
    ty: number;
    pillX: number;
    pillY: number;
    pillW: number;
    label: string;
  } | null;
}

function coordOf(state: GameState, provinceId: string): { wx: number; wy: number } | null {
  const p = state.board.provinces.find((q) => q.id === provinceId);
  if (!p) return null;
  return {
    wx: Number((BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W).toFixed(1)),
    wy: Number((BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain)).toFixed(1)),
  };
}

function diamondPoints(wx: number, wy: number, pad = 2.5): string {
  const hw = BOARD_HALF_W + pad;
  const hh = BOARD_HALF_H + pad * 0.5;
  return `${wx},${wy - hh} ${wx + hw},${wy} ${wx},${wy + hh} ${wx - hw},${wy}`;
}

/**
 * Projects `boardFeedbackSnapshot(state, view)` into non-blocking SVG coordinates for
 * the selected province, last inspected province, and active pending march.
 */
export function resolveBoardFeedback(
  state: GameState | null | undefined,
  view: BoardView = {},
): BoardFeedbackView | null {
  if (!state?.board?.provinces || !state.flags || !state.meta) return null;

  const snap = boardFeedbackSnapshot(state, view);
  if (!snap) return null;
  if (!snap.selectedProvince && !snap.lastInspected && !snap.pendingMarch) return null;

  let selected: BoardFeedbackView["selected"] = null;
  if (snap.selectedProvince) {
    const pt = coordOf(state, snap.selectedProvince.id);
    if (pt) {
      const label = snap.selectedProvince.isHome
        ? "Home"
        : snap.selectedProvince.node !== "none"
          ? `${snap.selectedProvince.node} (${snap.selectedProvince.x},${snap.selectedProvince.y})`
          : `${snap.selectedProvince.x},${snap.selectedProvince.y}`;
      selected = {
        id: snap.selectedProvince.id,
        wx: pt.wx,
        wy: pt.wy,
        label,
        labelW: Number(Math.max(26, label.length * 3.1 + 10).toFixed(1)),
      };
    }
  }

  let inspected: BoardFeedbackView["inspected"] = null;
  if (snap.lastInspected && snap.lastInspected.id !== snap.selectedProvince?.id) {
    const pt = coordOf(state, snap.lastInspected.id);
    if (pt) inspected = { id: snap.lastInspected.id, wx: pt.wx, wy: pt.wy };
  }

  let march: BoardFeedbackView["march"] = null;
  if (snap.pendingMarch) {
    const fromPt = coordOf(state, snap.pendingMarch.fromId);
    const toPt = coordOf(state, snap.pendingMarch.toId);
    if (fromPt && toPt) {
      const secs = Math.max(0, Math.ceil(snap.pendingMarch.arrivesInTicks / 10));
      const tag = snap.pendingMarch.purpose ?? snap.pendingMarch.kind;
      const label = `${tag} · ~${secs}s`;
      march = {
        id: snap.pendingMarch.id,
        fx: fromPt.wx,
        fy: fromPt.wy,
        tx: toPt.wx,
        ty: toPt.wy,
        pillX: Number(Math.max(50, Math.min(510, (fromPt.wx + toPt.wx) * 0.5)).toFixed(1)),
        pillY: Number(Math.max(24, Math.min(340, (fromPt.wy + toPt.wy) * 0.5 - 8)).toFixed(1)),
        pillW: Number(Math.max(38, label.length * 3.0 + 10).toFixed(1)),
        label,
      };
    }
  }

  if (!selected && !inspected && !march) return null;
  return { selected, inspected, march };
}

/**
 * Quiet, non-blocking SVG overlay showing selection feedback, last-inspected dashed rim,
 * and pending march ETA trail from `boardFeedbackSnapshot`. `pointer-events: none`.
 */
export const BoardFeedbackLayer: React.FC<{
  state: GameState;
  selectedId: string | null;
  lastInspectedId?: string | null;
}> = ({ state, selectedId, lastInspectedId = null }) => {
  const v = resolveBoardFeedback(state, {
    selectedProvinceId: selectedId,
    lastInspectedProvinceId: lastInspectedId,
  });
  if (!v) return null;

  return (
    <g
      className="sc-fb-layer"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {v.inspected ? (
        <polygon
          className="sc-fb-inspected-rim"
          data-fb-inspected={v.inspected.id}
          points={diamondPoints(v.inspected.wx, v.inspected.wy, 1.8)}
        />
      ) : null}

      {v.selected ? (
        <g className="sc-fb-selected" data-fb-selected={v.selected.id}>
          <polygon
            className="sc-fb-selected-rim"
            points={diamondPoints(v.selected.wx, v.selected.wy, 2.6)}
          />
          <g transform={`translate(${v.selected.wx}, ${Math.max(14, v.selected.wy - 16)})`}>
            <rect
              className="sc-fb-label-bg"
              x={-v.selected.labelW / 2}
              y={-4.2}
              width={v.selected.labelW}
              height={8}
              rx={3.8}
            />
            <text
              className="sc-fb-label-text"
              x={0}
              y={1.2}
              textAnchor="middle"
            >
              {v.selected.label}
            </text>
          </g>
        </g>
      ) : null}

      <BoardNearbyFriendlyMark
        state={state}
        selectedId={selectedId}
        lastInspectedId={lastInspectedId}
      />

      {v.march ? (
        <g className="sc-fb-march" data-fb-march={v.march.id}>
          <line
            className="sc-fb-march-path"
            x1={v.march.fx}
            y1={v.march.fy}
            x2={v.march.tx}
            y2={v.march.ty}
          />
          <g transform={`translate(${v.march.pillX}, ${v.march.pillY})`}>
            <rect
              className="sc-fb-march-pill-bg"
              x={-v.march.pillW / 2}
              y={-4.2}
              width={v.march.pillW}
              height={8}
              rx={3.8}
            />
            <text
              className="sc-fb-march-pill-text"
              x={0}
              y={1.2}
              textAnchor="middle"
            >
              {v.march.label}
            </text>
          </g>
        </g>
      ) : null}
    </g>
  );
};
