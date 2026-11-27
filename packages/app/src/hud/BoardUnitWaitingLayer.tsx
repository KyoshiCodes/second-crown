import React from "react";
import {
  getProvince,
  isProvinceSeen,
  unitWaitingSnapshot,
  type GameState,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import "./unit-waiting-board.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

export interface BoardPostedMark {
  provinceId: string;
  wx: number;
  wy: number;
  unitIds: string[];
  names: string[];
  label: string;
  labelW: number;
}

export interface BoardWaitingMark {
  provinceId: string;
  wx: number;
  wy: number;
  unitIds: string[];
  names: string[];
  ticksLeft: number;
  label: string;
  labelW: number;
}

export interface BoardUnitWaitingView {
  posted: BoardPostedMark[];
  waiting: BoardWaitingMark[];
}

function coordOf(state: GameState, provinceId: string): { wx: number; wy: number } | null {
  const p = getProvince(state, provinceId);
  if (!p) return null;
  return {
    wx: Number((BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W).toFixed(1)),
    wy: Number((BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain)).toFixed(1)),
  };
}

function diamondPoints(wx: number, wy: number, pad = 2.0): string {
  const hw = BOARD_HALF_W + pad;
  const hh = BOARD_HALF_H + pad * 0.5;
  return `${wx},${wy - hh} ${wx + hw},${wy} ${wx},${wy + hh} ${wx - hw},${wy}`;
}

/**
 * Projects `unitWaitingSnapshot(state)` onto seen isometric board provinces so
 * posted garrisons and waiting/marching unit destinations are clearly readable
 * without leaking unseen tiles under fog.
 */
export function resolveBoardUnitWaiting(
  state: GameState | null | undefined,
): BoardUnitWaitingView | null {
  if (!state?.board?.provinces || !state.flags || !state.meta) return null;

  const snap = unitWaitingSnapshot(state);
  if (!snap) return null;

  const homeId = state.board.homeProvinceId;
  const isVisible = (provinceId: string) => provinceId === homeId || isProvinceSeen(state, provinceId);

  const postedByProv = new Map<string, { unitIds: string[]; names: string[] }>();
  for (const row of snap.posted) {
    if (!isVisible(row.location)) continue;
    const prev = postedByProv.get(row.location);
    if (prev) {
      if (!prev.unitIds.includes(row.id)) {
        prev.unitIds.push(row.id);
        prev.names.push(row.name);
      }
    } else {
      postedByProv.set(row.location, { unitIds: [row.id], names: [row.name] });
    }
  }

  const posted: BoardPostedMark[] = [];
  for (const [provinceId, info] of postedByProv) {
    const pt = coordOf(state, provinceId);
    if (!pt) continue;
    const label = `Posted · ${info.names[0]}${info.names.length > 1 ? ` +${info.names.length - 1}` : ""}`;
    posted.push({
      provinceId,
      wx: pt.wx,
      wy: pt.wy,
      unitIds: info.unitIds,
      names: info.names,
      label,
      labelW: Number(Math.max(30, label.length * 2.85 + 8).toFixed(1)),
    });
  }

  const waitingByDest = new Map<string, { unitIds: string[]; names: string[]; ticksLeft: number }>();
  for (const row of snap.waiting) {
    if (!isVisible(row.destination)) continue;
    const prev = waitingByDest.get(row.destination);
    if (prev) {
      if (!prev.unitIds.includes(row.id)) {
        prev.unitIds.push(row.id);
        prev.names.push(row.name);
      }
      prev.ticksLeft = Math.min(prev.ticksLeft, row.ticksLeft);
    } else {
      waitingByDest.set(row.destination, {
        unitIds: [row.id],
        names: [row.name],
        ticksLeft: row.ticksLeft,
      });
    }
  }

  const waiting: BoardWaitingMark[] = [];
  for (const [provinceId, info] of waitingByDest) {
    const pt = coordOf(state, provinceId);
    if (!pt) continue;
    const etaSec = Math.max(0, Math.ceil(info.ticksLeft / 10));
    const verb = info.ticksLeft > 0 ? "Marching" : "Waiting";
    const label = `${verb} · ${info.names[0]}${info.names.length > 1 ? ` +${info.names.length - 1}` : ""} · ~${etaSec}s`;
    waiting.push({
      provinceId,
      wx: pt.wx,
      wy: pt.wy,
      unitIds: info.unitIds,
      names: info.names,
      ticksLeft: info.ticksLeft,
      label,
      labelW: Number(Math.max(36, label.length * 2.8 + 8).toFixed(1)),
    });
  }

  if (posted.length === 0 && waiting.length === 0) return null;
  return { posted, waiting };
}

/**
 * Quiet, non-blocking SVG overlay on the living board highlighting posted
 * garrisons and waiting/marching unit destinations from `unitWaitingSnapshot`.
 */
export const BoardUnitWaitingLayer: React.FC<{
  state: GameState;
}> = ({ state }) => {
  const v = resolveBoardUnitWaiting(state);
  if (!v) return null;

  return (
    <g
      className="sc-uw-board-layer"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {v.posted.map((m) => (
        <g
          key={`uw-post-${m.provinceId}`}
          className="sc-uw-posted-mark"
          data-uw-state="posted"
          data-uw-province={m.provinceId}
        >
          <polygon
            className="sc-uw-posted-rim"
            points={diamondPoints(m.wx, m.wy, 1.5)}
          />
          <path
            className="sc-uw-posted-pip"
            d={`M ${m.wx - 11} ${m.wy - 9.2} L ${m.wx - 8.4} ${m.wy - 8.2} L ${m.wx - 8.4} ${m.wy - 5.9} Q ${m.wx - 11} ${m.wy - 4.3} ${m.wx - 13.6} ${m.wy - 5.9} L ${m.wx - 13.6} ${m.wy - 8.2} Z`}
          />
          <g transform={`translate(${m.wx}, ${m.wy + 12.5})`}>
            <rect
              className="sc-uw-posted-pill-bg"
              x={-m.labelW / 2}
              y={-3.8}
              width={m.labelW}
              height={7.4}
              rx={3.5}
            />
            <text
              className="sc-uw-posted-pill-text"
              x={0}
              y={1.1}
              textAnchor="middle"
            >
              {m.label}
            </text>
          </g>
        </g>
      ))}

      {v.waiting.map((m) => (
        <g
          key={`uw-wait-${m.provinceId}`}
          className="sc-uw-waiting-mark"
          data-uw-state="waiting"
          data-uw-province={m.provinceId}
          data-uw-ticks={m.ticksLeft}
        >
          <ellipse
            className="sc-uw-waiting-rim"
            cx={m.wx}
            cy={m.wy}
            rx={15.5}
            ry={7.6}
          />
          <polygon
            className="sc-uw-waiting-pip"
            points={`${m.wx + 11},${m.wy - 9.2} ${m.wx + 13.4},${m.wy - 6.8} ${m.wx + 11},${m.wy - 4.4} ${m.wx + 8.6},${m.wy - 6.8}`}
          />
          <g transform={`translate(${m.wx}, ${Math.max(12, m.wy - 14)})`}>
            <rect
              className="sc-uw-waiting-pill-bg"
              x={-m.labelW / 2}
              y={-3.8}
              width={m.labelW}
              height={7.4}
              rx={3.5}
            />
            <text
              className="sc-uw-waiting-pill-text"
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
