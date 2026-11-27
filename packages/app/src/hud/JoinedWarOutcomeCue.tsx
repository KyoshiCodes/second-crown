import React from "react";
import {
  WAR_AFTERMATH_TICKS,
  getProvince,
  latestJoinedWarOutcome,
  type GameState,
  type JoinedWarOutcome,
  type Province,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import "./correspondence-outcome.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

export type JoinedOutcomeTone = "victory" | "defeat" | "peace";

export interface BoardJoinedOutcomePoint {
  warId: string;
  tone: JoinedOutcomeTone;
  label: string;
  line: string;
  allyRealmId: string;
  wx: number;
  wy: number;
  pillW: number;
}

function tileCenter(p: Province): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain),
  };
}

function trimOutcomeLabel(text: string): string {
  const max = 42;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function resolveJoinedOutcomeTone(outcome: JoinedWarOutcome): JoinedOutcomeTone {
  if (outcome.heldField === "player") return "victory";
  if (outcome.heldField === "foe") return "defeat";
  return "peace";
}

/**
 * Defensive pure reader over `@second-crown/sim`'s `latestJoinedWarOutcome(state)`.
 */
export function resolveLatestJoinedOutcome(
  state: GameState | null | undefined,
): JoinedWarOutcome | null {
  if (!state?.wars || !state.meta) return null;
  return latestJoinedWarOutcome(state);
}

/**
 * Short-lived aftermath ribbon anchor on the board for the latest joined war that ended
 * within `WAR_AFTERMATH_TICKS` of `state.meta.tick`.
 */
export function resolveBoardJoinedOutcome(
  state: GameState | null | undefined,
): BoardJoinedOutcomePoint | null {
  if (!state?.board?.provinces || !state.wars || !state.meta) return null;
  const outcome = latestJoinedWarOutcome(state);
  if (!outcome) return null;
  if (state.meta.tick - outcome.endedTick >= WAR_AFTERMATH_TICKS) return null;

  const home = getProvince(state, state.board.homeProvinceId);
  if (!home) return null;

  const { wx: hwx, wy: hwy } = tileCenter(home);
  const wx = Number(Math.max(64, Math.min(496, hwx)).toFixed(1));
  const wy = Number(Math.max(18, Math.min(344, hwy + 16)).toFixed(1));
  const tone = resolveJoinedOutcomeTone(outcome);

  const rawLabel =
    outcome.heldField === "player"
      ? `Field held beside ${outcome.allyName}`
      : outcome.heldField === "foe"
        ? `${outcome.foeName} held the field`
        : outcome.whitePeace
          ? `White peace with ${outcome.foeName}`
          : `War beside ${outcome.allyName} ended`;
  const label = trimOutcomeLabel(rawLabel);
  const pillW = Number(Math.max(58, Math.min(148, label.length * 3.1 + 16)).toFixed(1));

  return {
    warId: outcome.warId,
    tone,
    label,
    line: outcome.line,
    allyRealmId: outcome.allyRealmId,
    wx,
    wy,
    pillW,
  };
}

/**
 * Calm War tab outcome line displayed when a war the player joined via `joinSide` has ended.
 */
export const JoinedWarOutcomeLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const outcome = resolveLatestJoinedOutcome(state);
  if (!outcome) return null;

  const tone = resolveJoinedOutcomeTone(outcome);
  const badgeText =
    tone === "victory" ? "Field held" : tone === "defeat" ? "Foe held" : "White peace";

  let npcSummary: string | null = null;
  if (outcome.npcWar) {
    if (outcome.npcWar.whitePeace) {
      npcSummary = "Their own war also ended in white peace.";
    } else if (outcome.npcWar.heldFieldRealmId) {
      const winnerName =
        state?.realms.find((r) => r.id === outcome.npcWar?.heldFieldRealmId)?.name ??
        outcome.npcWar.heldFieldRealmId;
      npcSummary = `In their own war, ${winnerName} held the field.`;
    }
  }

  return (
    <div
      className={`sc-joined-outcome is-${tone}`}
      role="status"
      data-joined-outcome={outcome.warId}
      data-held-field={outcome.heldField ?? "none"}
      data-white-peace={outcome.whitePeace ? "true" : "false"}
    >
      <div className="sc-joined-outcome-head">
        <span className="sc-joined-outcome-badge">
          <span className="sc-joined-outcome-pip" aria-hidden="true" />
          {badgeText}
        </span>
        <span className="sc-joined-outcome-line">{outcome.line}</span>
      </div>
      {npcSummary ? <span className="sc-joined-outcome-npc">{npcSummary}</span> : null}
    </div>
  );
};

/**
 * Short-lived, non-blocking SVG pill near the player hold summarizing the outcome of a
 * joined war while still inside its aftermath window.
 */
export const BoardJoinedOutcome: React.FC<{ state: GameState }> = ({ state }) => {
  const pt = resolveBoardJoinedOutcome(state);
  if (!pt) return null;

  return (
    <g
      className={`sc-joined-outcome-board is-${pt.tone}`}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
      data-board-joined-outcome={pt.warId}
      data-outcome-tone={pt.tone}
      transform={`translate(${pt.wx}, ${pt.wy})`}
    >
      <rect
        className="sc-outcome-ribbon-bg"
        x={-pt.pillW / 2}
        y={-5.5}
        width={pt.pillW}
        height={10}
        rx={4.8}
      />
      <circle
        className="sc-outcome-ribbon-dot"
        cx={-pt.pillW / 2 + 5.5}
        cy={-0.5}
        r={1.6}
      />
      <text
        className="sc-outcome-ribbon-text"
        x={4}
        y={1.1}
        textAnchor="middle"
      >
        {pt.label}
      </text>
    </g>
  );
};
