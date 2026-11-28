import React from "react";
import {
  BOARD_SCALE_NOTE_MID,
  BOARD_SCALE_NOTE_SMALL,
  boardScaleSnapshot,
  type BoardScale,
  type GameState,
} from "@second-crown/sim";
import "./board-scale.css";

export type BoardScaleBand = "small" | "mid" | "wide";

export interface BoardScaleView extends BoardScale {
  tiles: number;
  band: BoardScaleBand;
}

function classifyScale(note: string): BoardScaleBand {
  if (note === BOARD_SCALE_NOTE_SMALL) return "small";
  if (note === BOARD_SCALE_NOTE_MID) return "mid";
  return "wide";
}

/**
 * Pure wrapper around `boardScaleSnapshot(state)` exposing tile count and scale
 * band without mutating or resizing the board.
 */
export function resolveBoardScale(
  state: GameState | null | undefined,
): BoardScaleView | null {
  if (!state?.board || !state.flags) return null;
  const snap = boardScaleSnapshot(state);
  if (!snap) return null;
  return {
    ...snap,
    tiles: snap.width * snap.height,
    band: classifyScale(snap.note),
  };
}

/**
 * Subtle cartographic corner brackets around the `560×360` living board SVG
 * reflecting `boardScaleSnapshot` without altering the actual board size.
 */
export const BoardScaleHorizon: React.FC<{
  state: GameState;
}> = ({ state }) => {
  const v = resolveBoardScale(state);
  if (!v) return null;

  return (
    <g
      className={`sc-bscale-frame is-${v.band}`}
      data-bscale-band={v.band}
      data-bscale-dims={`${v.width}x${v.height}`}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <path className="sc-bscale-bracket" d="M 8 20 V 8 H 22" />
      <path className="sc-bscale-bracket" d="M 538 8 H 552 V 20" />
      <path className="sc-bscale-bracket" d="M 8 340 V 352 H 22" />
      <path className="sc-bscale-bracket" d="M 538 352 H 552 V 340" />
    </g>
  );
};

/**
 * Calm top-right HUD note displaying current board dimensions and scale note
 * from `boardScaleSnapshot`. Hides cleanly when `null`.
 */
export const BoardScaleNote: React.FC<{
  state: GameState;
}> = ({ state }) => {
  const v = resolveBoardScale(state);
  if (!v) return null;

  return (
    <div
      className={`sc-bscale-note is-${v.band}`}
      data-bscale-band={v.band}
      data-bscale-dims={`${v.width}x${v.height}`}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <span className="sc-bscale-pip" aria-hidden="true" />
      <span className="sc-bscale-dims">
        {v.width}×{v.height}
      </span>
      <span className="sc-bscale-text">{v.note}</span>
    </div>
  );
};
