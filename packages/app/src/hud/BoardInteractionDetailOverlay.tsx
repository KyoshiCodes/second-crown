import React from "react";
import {
  boardInteractionDetailSnapshot,
  type BoardView,
  type GameState,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import "./board-interaction-detail.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

export interface BoardNearbyFriendlyView {
  wx: number;
  wy: number;
  label: string;
  pillW: number;
  realmIds: string[];
  names: string[];
}

/**
 * Projects `boardInteractionDetailSnapshot(state, view)` into a calm, non-blocking SVG pill
 * naming friendly realms nearby the selected province. Returns `null` when hidden or empty.
 */
export function resolveBoardNearbyFriendly(
  state: GameState | null | undefined,
  view: BoardView = {},
): BoardNearbyFriendlyView | null {
  if (!state?.board?.provinces || !state.flags || !state.meta) return null;

  let snap;
  try {
    snap = boardInteractionDetailSnapshot(state, view);
  } catch {
    return null;
  }
  if (!snap || !snap.selected || snap.nearbyFriendly.length === 0) return null;

  const prov = state.board.provinces.find((p) => p.id === snap.selected!.id);
  if (!prov) return null;

  const wx = Number((BOARD_ORIGIN_X + (prov.x - prov.y) * BOARD_HALF_W).toFixed(1));
  const wy = Number(
    (BOARD_ORIGIN_Y + (prov.x + prov.y) * BOARD_HALF_H - boardTerrainElevation(prov.terrain)).toFixed(1),
  );

  const names = snap.nearbyFriendly.map(
    (id) => state.realms?.find((r) => r.id === id)?.name ?? id,
  );
  const label =
    names.length > 2
      ? `Near: ${names[0]}, ${names[1]} +${names.length - 2}`
      : `Near: ${names.join(", ")}`;
  const pillW = Number(Math.max(38, label.length * 2.85 + 12).toFixed(1));

  return {
    wx,
    wy,
    label,
    pillW,
    realmIds: snap.nearbyFriendly,
    names,
  };
}

/**
 * Quiet, non-blocking SVG mark under a selected province on `<BoardFeedbackLayer>`
 * naming nearby friendly realms from `boardInteractionDetailSnapshot`.
 */
export const BoardNearbyFriendlyMark: React.FC<{
  state: GameState;
  selectedId: string | null;
  lastInspectedId?: string | null;
}> = ({ state, selectedId, lastInspectedId = null }) => {
  const v = resolveBoardNearbyFriendly(state, {
    selectedProvinceId: selectedId,
    lastInspectedProvinceId: lastInspectedId,
  });
  if (!v) return null;

  const labelY = Math.min(346, v.wy + 18);

  return (
    <g
      className="sc-fb-nearby"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
      data-fb-nearby-count={v.realmIds.length}
      data-fb-nearby-realms={v.realmIds.join(",")}
      transform={`translate(${v.wx}, ${labelY})`}
    >
      <rect
        className="sc-fb-nearby-bg"
        x={-v.pillW / 2}
        y={-4.1}
        width={v.pillW}
        height={7.8}
        rx={3.6}
      />
      <circle
        className="sc-fb-nearby-pip"
        cx={-v.pillW / 2 + 4}
        cy={-0.2}
        r={1.3}
      />
      <text
        className="sc-fb-nearby-text"
        x={1.8}
        y={1.1}
        textAnchor="middle"
      >
        {v.label}
      </text>
    </g>
  );
};
