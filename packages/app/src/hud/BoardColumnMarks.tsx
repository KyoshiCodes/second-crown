import React from "react";
import {
  columnMarkSnapshot,
  getProvince,
  type ColumnMarkId,
  type GameState,
  type Province,
  type StandardStrength,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import {
  LIVING_CULTURE_PALETTE,
  resolveLivingCultureKit,
  type LivingCultureKit,
} from "./BoardLivingRealm";
import "./column-marks.css";
import "./friendly-presence-standard.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

export const COLUMN_MARK_LABEL: Record<ColumnMarkId, string> = {
  column: "Column",
  "skirmish-line": "Skirmish line",
  "clash-line": "Clash line",
  "falling-back": "Falling back",
};

export interface BoardColumnMarkView {
  warId: string;
  joinedWarId: string;
  column: ColumnMarkId;
  standardStrength: StandardStrength;
  active: boolean;
  label: string;
  playerKit: LivingCultureKit;
  allyKit: LivingCultureKit | null;
  foeKit: LivingCultureKit;
  ourX: number;
  ourY: number;
  theirX: number;
  theirY: number;
  badgeX: number;
  badgeY: number;
  badgeW: number;
  ourDir: number;
  theirDir: number;
}

function tileCenter(p: Province): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (p.x - p.y) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (p.x + p.y) * BOARD_HALF_H - boardTerrainElevation(p.terrain),
  };
}

function findHold(state: GameState, realmId: string): Province | undefined {
  if (realmId === "player") return getProvince(state, state.board.homeProvinceId);
  return state.board.provinces.find(
    (p) => p.node === "hold" && p.occupantRealmId === realmId,
  );
}

/**
 * Projects `columnMarkSnapshot(state)` onto opposing column road positions (28% / 72%
 * between the player and foe holds) plus a quiet phase mark pill offset cleanly below
 * `BoardJoinedFormations`.
 */
export function resolveBoardColumnMark(
  state: GameState | null | undefined,
): BoardColumnMarkView | null {
  if (!state?.board?.provinces || !state.flags || !state.meta || !Array.isArray(state.wars)) {
    return null;
  }

  const mark = columnMarkSnapshot(state);
  if (!mark) return null;

  const foeId = mark.theirs.realmIds[0];
  if (!foeId) return null;

  const ourHold = findHold(state, "player");
  const foeHold = findHold(state, foeId);
  if (!ourHold || !foeHold) return null;

  const p1 = tileCenter(ourHold);
  const p2 = tileCenter(foeHold);
  const ourX = Number(Math.max(44, Math.min(516, p1.wx + (p2.wx - p1.wx) * 0.28)).toFixed(1));
  const ourY = Number(Math.max(20, Math.min(340, p1.wy + (p2.wy - p1.wy) * 0.28 + 4)).toFixed(1));
  const theirX = Number(Math.max(44, Math.min(516, p1.wx + (p2.wx - p1.wx) * 0.72)).toFixed(1));
  const theirY = Number(Math.max(20, Math.min(340, p1.wy + (p2.wy - p1.wy) * 0.72 + 4)).toFixed(1));

  const midX = (p1.wx + p2.wx) * 0.5;
  const midY = (p1.wy + p2.wy) * 0.5;
  const badgeX = Number(Math.max(64, Math.min(496, midX)).toFixed(1));
  const badgeY = Number(Math.max(26, Math.min(344, midY + 27)).toFixed(1));

  const label = COLUMN_MARK_LABEL[mark.column];
  const badgeW = Number(Math.max(40, label.length * 3.1 + 14).toFixed(1));
  const allyId = mark.ours.realmIds.find((id) => id !== "player") ?? null;

  const baseDir = p2.wx >= p1.wx ? 1 : -1;
  const isRetreat = mark.column === "falling-back";
  const ourDir = isRetreat ? -baseDir : baseDir;
  const theirDir = isRetreat ? baseDir : -baseDir;

  return {
    warId: mark.warId,
    joinedWarId: mark.joinedWarId,
    column: mark.column,
    standardStrength: mark.standardStrength ?? 1,
    active: mark.active,
    label,
    playerKit: resolveLivingCultureKit(state, "player"),
    allyKit: allyId ? resolveLivingCultureKit(state, allyId) : null,
    foeKit: resolveLivingCultureKit(state, foeId),
    ourX,
    ourY,
    theirX,
    theirY,
    badgeX,
    badgeY,
    badgeW,
    ourDir,
    theirDir,
  };
}

function standardMetrics(strength: StandardStrength) {
  switch (strength) {
    case 3:
      return { poleTop: -8.6, poleW: 1.15, flagW: 6.0, flagTop: -8.3, flagBot: -4.9 };
    case 2:
      return { poleTop: -7.6, poleW: 1.0, flagW: 5.1, flagTop: -7.3, flagBot: -4.3 };
    default:
      return { poleTop: -6.5, poleW: 0.85, flagW: 4.2, flagTop: -6.2, flagBot: -3.6 };
  }
}

function renderColumnPhaseGlyph(column: ColumnMarkId, color: string) {
  switch (column) {
    case "column":
      return (
        <line x1={-3} y1={0} x2={3} y2={0} stroke={color} strokeWidth={1.1} strokeLinecap="round" />
      );
    case "skirmish-line":
      return (
        <g>
          <line x1={-3.5} y1={-0.8} x2={-0.6} y2={-0.8} stroke={color} strokeWidth={1} strokeLinecap="round" />
          <line x1={0.6} y1={0.8} x2={3.5} y2={0.8} stroke={color} strokeWidth={1} strokeLinecap="round" />
        </g>
      );
    case "clash-line":
      return (
        <rect x={-3} y={-1.2} width={6} height={2.4} rx={0.8} fill={color} />
      );
    case "falling-back":
      return (
        <g opacity={0.8}>
          <polyline points="-0.8,-1.5 -3.2,0 -0.8,1.5" fill="none" stroke={color} strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="0.8,-1.5 3.2,0 0.8,1.5" fill="none" stroke={color} strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
  }
}

/**
 * Quiet, non-blocking SVG column marks for the player's joined war (`columnMarkSnapshot`),
 * showing opposing marching column standards and a compact phase mark pill (`column`,
 * `skirmish-line`, `clash-line`, `falling-back`). Zero blood or gore.
 */
export const BoardColumnMarks: React.FC<{ state: GameState }> = ({ state }) => {
  const v = resolveBoardColumnMark(state);
  if (!v) return null;

  const pPal = LIVING_CULTURE_PALETTE[v.playerKit];
  const aPal = v.allyKit ? LIVING_CULTURE_PALETTE[v.allyKit] : null;
  const fPal = LIVING_CULTURE_PALETTE[v.foeKit];

  const glyphColor =
    v.column === "clash-line"
      ? "#facc15"
      : v.column === "skirmish-line"
        ? "#fbbf24"
        : v.column === "falling-back"
          ? "#cbd5e1"
          : pPal.accent;

  const m = standardMetrics(v.standardStrength);
  const flagMid = Number(((m.flagTop + m.flagBot) * 0.5).toFixed(1));

  return (
    <g
      className="sc-colmark-layer"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <g
        className={`sc-colmark-entry is-col-${v.column} is-strength-${v.standardStrength}`}
        data-column-mark={v.warId}
        data-column-phase={v.column}
        data-standard-strength={v.standardStrength}
        data-column-active={v.active ? "true" : "false"}
      >
        <line
          className="sc-colmark-road"
          x1={v.ourX}
          y1={v.ourY}
          x2={v.theirX}
          y2={v.theirY}
        />

        {/* Our column standard + trailing rank pips (scaled upward by standardStrength) */}
        <g
          className="sc-colmark-column is-ours"
          transform={`translate(${v.ourX}, ${v.ourY})`}
        >
          {v.standardStrength === 3 ? (
            <circle className="sc-colmark-standard-halo" cx={1.4 * v.ourDir} cy={-4.6} r={5.4} />
          ) : null}
          <line x1={0} y1={1} x2={0} y2={m.poleTop} stroke={pPal.trim} strokeWidth={m.poleW} />
          <polygon
            points={`0,${m.flagTop} ${m.flagW * v.ourDir},${flagMid} 0,${m.flagBot}`}
            fill={pPal.tunic}
            stroke={pPal.trim}
            strokeWidth={0.45}
          />
          {v.standardStrength >= 2 ? (
            <circle
              className="sc-colmark-finial"
              cx={0}
              cy={Number((m.poleTop - 0.5).toFixed(1))}
              r={v.standardStrength === 3 ? 0.95 : 0.75}
              fill={pPal.trim}
            />
          ) : null}
          <circle className="sc-colmark-dot" cx={-2.6 * v.ourDir} cy={1} r={0.95} fill={pPal.tunic} />
          <circle
            className="sc-colmark-dot"
            cx={-5.2 * v.ourDir}
            cy={1}
            r={0.95}
            fill={aPal ? aPal.tunic : pPal.tunic}
          />
          <circle className="sc-colmark-dot" cx={-7.8 * v.ourDir} cy={1} r={0.85} fill={pPal.trim} />
        </g>

        {/* Opposing column standard + trailing rank pips (scaled upward by standardStrength) */}
        <g
          className="sc-colmark-column is-theirs"
          transform={`translate(${v.theirX}, ${v.theirY})`}
        >
          {v.standardStrength === 3 ? (
            <circle className="sc-colmark-standard-halo" cx={1.4 * v.theirDir} cy={-4.6} r={5.4} />
          ) : null}
          <line x1={0} y1={1} x2={0} y2={m.poleTop} stroke={fPal.trim} strokeWidth={m.poleW} />
          <polygon
            points={`0,${m.flagTop} ${m.flagW * v.theirDir},${flagMid} 0,${m.flagBot}`}
            fill={fPal.tunic}
            stroke={fPal.trim}
            strokeWidth={0.45}
          />
          {v.standardStrength >= 2 ? (
            <circle
              className="sc-colmark-finial"
              cx={0}
              cy={Number((m.poleTop - 0.5).toFixed(1))}
              r={v.standardStrength === 3 ? 0.95 : 0.75}
              fill={fPal.trim}
            />
          ) : null}
          <circle className="sc-colmark-dot" cx={-2.6 * v.theirDir} cy={1} r={0.95} fill={fPal.tunic} />
          <circle className="sc-colmark-dot" cx={-5.2 * v.theirDir} cy={1} r={0.95} fill={fPal.trim} />
          <circle className="sc-colmark-dot" cx={-7.8 * v.theirDir} cy={1} r={0.85} fill={fPal.tunic} />
        </g>

        {/* Short calm phase mark badge */}
        <g
          className="sc-colmark-badge"
          transform={`translate(${v.badgeX}, ${v.badgeY})`}
        >
          <rect
            className="sc-colmark-badge-bg"
            x={-v.badgeW / 2}
            y={-4.5}
            width={v.badgeW}
            height={8.5}
            rx={4}
          />
          <g transform={`translate(${-v.badgeW / 2 + 6}, -0.2)`}>
            {renderColumnPhaseGlyph(v.column, glyphColor)}
          </g>
          <text
            className="sc-colmark-badge-text"
            x={4}
            y={1.2}
            textAnchor="middle"
          >
            {v.label}
          </text>
        </g>
      </g>
    </g>
  );
};
