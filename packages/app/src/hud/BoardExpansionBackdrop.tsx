import React from "react";
import {
  BOARD_BAND_MID,
  BOARD_BAND_SMALL,
  BOARD_EXPANSION_NOTE_WIDEST,
  boardExpansionSnapshot,
  type BoardExpansion,
  type GameState,
} from "@second-crown/sim";
import "./board-expansion.css";

export type BoardExpansionStage = "planned" | "widest";
export type BoardExpansionBand = "small" | "mid" | "wide";

export interface BoardExpansionView extends BoardExpansion {
  stage: BoardExpansionStage;
  currentBand: BoardExpansionBand;
}

function classifyBand(band: string): BoardExpansionBand {
  if (band === BOARD_BAND_SMALL) return "small";
  if (band === BOARD_BAND_MID) return "mid";
  return "wide";
}

/**
 * Pure wrapper around `boardExpansionSnapshot(state)` exposing stage and band
 * labels without changing actual board size, pathfinding, or fog.
 */
export function resolveBoardExpansion(
  state: GameState | null | undefined,
): BoardExpansionView | null {
  if (!state?.board || !state.flags) return null;
  const snap = boardExpansionSnapshot(state);
  if (!snap) return null;
  return {
    ...snap,
    stage: snap.note === BOARD_EXPANSION_NOTE_WIDEST ? "widest" : "planned",
    currentBand: classifyBand(snap.current),
  };
}

/**
 * Non-blocking outer frontier arcs on the living board SVG preparing the
 * surrounding environment visually for future expansion without resizing tiles.
 */
export const BoardExpansionRim: React.FC<{
  state: GameState;
}> = ({ state }) => {
  const v = resolveBoardExpansion(state);
  if (!v) return null;

  return (
    <g
      className={`sc-bexp-rim is-${v.stage}`}
      data-bexp-stage={v.stage}
      data-bexp-current={v.current}
      data-bexp-prepared={v.prepared}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <path className="sc-bexp-horizon-arc" d="M 16 28 Q 280 4 544 28" />
      <path className="sc-bexp-horizon-arc" d="M 16 332 Q 280 356 544 332" />
    </g>
  );
};

/**
 * Calm top-right HUD note under `<BoardScaleNote>` displaying current vs
 * prepared expansion bands from `boardExpansionSnapshot`. Hides when `null`.
 */
export const BoardExpansionBadge: React.FC<{
  state: GameState;
}> = ({ state }) => {
  const v = resolveBoardExpansion(state);
  if (!v) return null;

  return (
    <div
      className={`sc-bexp-badge is-${v.stage}`}
      data-bexp-stage={v.stage}
      data-bexp-current={v.current}
      data-bexp-prepared={v.prepared}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <span className="sc-bexp-pip" aria-hidden="true" />
      <span className="sc-bexp-bands">
        {v.stage === "widest" ? v.current : `${v.current} → ${v.prepared}`}
      </span>
      <span className="sc-bexp-note">{v.note}</span>
    </div>
  );
};
