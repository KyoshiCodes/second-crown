import React from "react";
import {
  BATTLE_FEEDBACK_MARK_LOST,
  BATTLE_FEEDBACK_MARK_WON,
  battleFeedbackSnapshot,
  getProvince,
  isProvinceSeen,
  type GameState,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import "./battle-feedback.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

export type BoardBattleMarkKind = "won" | "lost" | "clash";

export interface BoardBattleFeedbackTile {
  id: string;
  wx: number;
  wy: number;
  coord: string;
}

export interface BoardBattleFeedbackView {
  mark: BoardBattleMarkKind;
  note: string;
  provinceId: string | null;
  tile: BoardBattleFeedbackTile | null;
}

function classifyMark(mark: string): BoardBattleMarkKind {
  if (mark === BATTLE_FEEDBACK_MARK_WON) return "won";
  if (mark === BATTLE_FEEDBACK_MARK_LOST) return "lost";
  return "clash";
}

/**
 * Pure wrapper around `battleFeedbackSnapshot(state)` with safe guards and
 * fog-safe tile projection so veiled tiles never reveal battle marks on the map.
 */
export function resolveBoardBattleFeedback(
  state: GameState | null | undefined,
): BoardBattleFeedbackView | null {
  if (!state?.board?.provinces || !state.flags || !state.meta) return null;

  const snap = battleFeedbackSnapshot(state);
  if (!snap) return null;

  const mark = classifyMark(snap.mark);
  let tile: BoardBattleFeedbackTile | null = null;

  if (snap.provinceId) {
    const prov = getProvince(state, snap.provinceId);
    const seen =
      prov &&
      (prov.id === state.board.homeProvinceId || isProvinceSeen(state, prov.id));
    if (prov && seen) {
      tile = {
        id: prov.id,
        wx: Number((BOARD_ORIGIN_X + (prov.x - prov.y) * BOARD_HALF_W).toFixed(1)),
        wy: Number(
          (BOARD_ORIGIN_Y + (prov.x + prov.y) * BOARD_HALF_H - boardTerrainElevation(prov.terrain)).toFixed(1),
        ),
        coord: `${prov.x},${prov.y}`,
      };
    }
  }

  return {
    mark,
    note: snap.note,
    provinceId: snap.provinceId,
    tile,
  };
}

/**
 * Quiet, non-blocking SVG province marker for the most recent seen battle tile
 * from `battleFeedbackSnapshot`. Hides cleanly when `null` or unseen.
 */
export const BoardBattleFeedbackMark: React.FC<{
  state: GameState;
}> = ({ state }) => {
  const v = resolveBoardBattleFeedback(state);
  if (!v || !v.tile) return null;

  const { wx, wy } = v.tile;

  return (
    <g
      className={`sc-bfb-layer is-${v.mark}`}
      data-bfb-mark={v.mark}
      data-bfb-province={v.tile.id}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <ellipse
        className="sc-bfb-ring"
        cx={wx}
        cy={wy}
        rx={14.5}
        ry={7.2}
      />
      {v.mark === "won" ? (
        <path
          className="sc-bfb-emblem"
          d={`M ${wx - 3.2} ${wy - 7.4} L ${wx} ${wy - 10.6} L ${wx + 3.2} ${wy - 7.4}`}
        />
      ) : v.mark === "lost" ? (
        <path
          className="sc-bfb-emblem"
          d={`M ${wx - 2.6} ${wy - 10.2} L ${wx + 2.6} ${wy - 6.8} M ${wx + 2.6} ${wy - 10.2} L ${wx - 2.6} ${wy - 6.8}`}
        />
      ) : (
        <path
          className="sc-bfb-emblem"
          d={`M ${wx - 2.8} ${wy - 8.6} L ${wx + 2.8} ${wy - 8.6} M ${wx} ${wy - 10.6} L ${wx} ${wy - 6.6}`}
        />
      )}
    </g>
  );
};

/**
 * Calm top-left HUD note pill showing `battleFeedbackSnapshot(state).note`
 * (and seen province coords when tied to a tile). Hides completely when `null`.
 */
export const BoardBattleFeedbackNote: React.FC<{
  state: GameState;
}> = ({ state }) => {
  const v = resolveBoardBattleFeedback(state);
  if (!v) return null;

  return (
    <div
      className={`sc-bfb-note-bar is-${v.mark}`}
      data-bfb-note-mark={v.mark}
      data-bfb-note-province={v.tile?.id ?? ""}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <span className="sc-bfb-note-pip" aria-hidden="true" />
      <span className="sc-bfb-note-text">{v.note}</span>
      {v.tile ? (
        <span className="sc-bfb-note-where">@ {v.tile.coord}</span>
      ) : null}
    </div>
  );
};
