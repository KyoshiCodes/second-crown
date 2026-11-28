import React from "react";
import { BOARD_H, BOARD_W } from "@second-crown/shared";
import { boardCameraFit } from "@second-crown/render";
import type { GameState } from "@second-crown/sim";
import "./board-wide-env.css";

export interface BoardViewportFit {
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  isWide: boolean;
}

/**
 * Computes calm, centered SVG fit parameters matching `packages/render`'s
 * `boardCameraFit` so the 16x10 board and all overlays frame without clipping.
 */
export function resolveBoardViewportFit(
  state: GameState | null | undefined,
): BoardViewportFit {
  const width =
    typeof state?.board?.width === "number" && Number.isInteger(state.board.width) && state.board.width > 0
      ? state.board.width
      : BOARD_W;
  const height =
    typeof state?.board?.height === "number" && Number.isInteger(state.board.height) && state.board.height > 0
      ? state.board.height
      : BOARD_H;
  const fit = boardCameraFit(width, height);
  return {
    scale: fit.scale,
    offsetX: fit.offsetX,
    offsetY: fit.offsetY,
    width,
    height,
    isWide: width * height > 120,
  };
}

/**
 * Quiet perimeter frontier mist & compass reference marks framing the
 * settled 16x10 expanse inside `BoardLiving`. Purely visual, `pointer-events: none`.
 */
export const BoardWideEnvironment: React.FC<{
  state: GameState;
}> = ({ state }) => {
  const fit = resolveBoardViewportFit(state);

  return (
    <g
      className={`sc-bwenv-layer${fit.isWide ? " is-wide" : ""}`}
      data-bwenv-dims={`${fit.width}x${fit.height}`}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <ellipse className="sc-bwenv-mist" cx={48} cy={190} rx={52} ry={84} />
      <ellipse className="sc-bwenv-mist" cx={512} cy={190} rx={52} ry={84} />
      <ellipse className="sc-bwenv-mist" cx={280} cy={342} rx={170} ry={22} />
      <path className="sc-bwenv-horizon" d="M 30 318 Q 280 344 530 318" />
      <path
        className="sc-bwenv-compass-mark"
        d="M 526 24 L 529 31 L 526 38 L 523 31 Z M 519 31 L 533 31"
      />
    </g>
  );
};
