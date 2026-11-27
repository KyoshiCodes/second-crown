import React from "react";
import {
  columnMarkSnapshot,
  getProvince,
  type ColumnMarkId,
  type ColumnRanks,
  type GameState,
  type Province,
} from "@second-crown/sim";
import { boardTerrainElevation } from "./BoardRoads";
import {
  LIVING_CULTURE_PALETTE,
  resolveLivingCultureKit,
  type LivingCultureKit,
} from "./BoardLivingRealm";
import "./column-ranks-whisper-hint.css";
import "./voice-rank-accents.css";
import "./realm-tag-ranks-note.css";

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

export interface BoardColumnRanksView {
  warId: string;
  column: ColumnMarkId;
  ranks: ColumnRanks;
  ranksLabel: string;
  ranksNote: string;
  active: boolean;
  playerKit: LivingCultureKit;
  allyKit: LivingCultureKit | null;
  foeKit: LivingCultureKit;
  ourX: number;
  ourY: number;
  theirX: number;
  theirY: number;
  ourDir: number;
  theirDir: number;
  noteX: number;
  noteY: number;
  noteW: number;
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
 * Reads `columnMarkSnapshot(state)` (`.ranks` and `.ranksLabel`) and positions
 * clearer unit-rank stacks and a small rank-count note cleanly away from
 * `BoardJoinedFormations` and `BoardColumnMarks`.
 */
export function resolveBoardColumnRanks(
  state: GameState | null | undefined,
): BoardColumnRanksView | null {
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
  const ourY = Number(Math.max(20, Math.min(340, p1.wy + (p2.wy - p1.wy) * 0.28 + 9.5)).toFixed(1));
  const theirX = Number(Math.max(44, Math.min(516, p1.wx + (p2.wx - p1.wx) * 0.72)).toFixed(1));
  const theirY = Number(Math.max(20, Math.min(340, p1.wy + (p2.wy - p1.wy) * 0.72 + 9.5)).toFixed(1));

  const midX = (p1.wx + p2.wx) * 0.5;
  const midY = (p1.wy + p2.wy) * 0.5;
  const ranksNote = mark.ranksNote ?? "";
  const combinedLabel = ranksNote ? `${mark.ranksLabel} · ${ranksNote}` : mark.ranksLabel;
  const noteX = Number(Math.max(64, Math.min(496, midX)).toFixed(1));
  const noteY = Number(Math.max(30, Math.min(348, midY + 38)).toFixed(1));
  const noteW = Number(Math.max(48, combinedLabel.length * 2.9 + 14).toFixed(1));

  const allyId = mark.ours.realmIds.find((id) => id !== "player") ?? null;
  const baseDir = p2.wx >= p1.wx ? 1 : -1;
  const isRetreat = mark.column === "falling-back";
  const ourDir = isRetreat ? -baseDir : baseDir;
  const theirDir = isRetreat ? baseDir : -baseDir;

  return {
    warId: mark.warId,
    column: mark.column,
    ranks: mark.ranks,
    ranksLabel: mark.ranksLabel,
    ranksNote,
    active: mark.active,
    playerKit: resolveLivingCultureKit(state, "player"),
    allyKit: allyId ? resolveLivingCultureKit(state, allyId) : null,
    foeKit: resolveLivingCultureKit(state, foeId),
    ourX,
    ourY,
    theirX,
    theirY,
    ourDir,
    theirDir,
    noteX,
    noteY,
    noteW,
  };
}

function buildRankBars(ranks: ColumnRanks, dir: number) {
  const barW = 6.8;
  const barH = 1.9;
  const stepY = 2.6;
  const bars = Array.from({ length: ranks }, (_, idx) => {
    const x = Number(((dir > 0 ? -7.2 : 0.4) - idx * 1.3 * dir).toFixed(1));
    const y = Number((idx * stepY).toFixed(1));
    return { idx, x, y, width: barW, height: barH };
  });
  const minX = Number((Math.min(...bars.map((b) => b.x)) - 1.2).toFixed(1));
  const maxX = Number((Math.max(...bars.map((b) => b.x + barW)) + 1.2).toFixed(1));
  const plateW = Number((maxX - minX).toFixed(1));
  const plateY = -1.1;
  const plateH = Number(((ranks - 1) * stepY + barH + 2.2).toFixed(1));
  return { bars, plateX: minX, plateY, plateW, plateH };
}

/**
 * Quiet, non-blocking SVG overlay showing stronger 1, 2, or 3 unit-rank bars on a
 * subtle backing plate beside each joined-war column standard plus `ranksLabel`. Zero blood/gore.
 */
export const BoardColumnRanks: React.FC<{ state: GameState }> = ({ state }) => {
  const v = resolveBoardColumnRanks(state);
  if (!v) return null;

  const pPal = LIVING_CULTURE_PALETTE[v.playerKit];
  const aPal = v.allyKit ? LIVING_CULTURE_PALETTE[v.allyKit] : null;
  const fPal = LIVING_CULTURE_PALETTE[v.foeKit];

  const ours = buildRankBars(v.ranks, v.ourDir);
  const theirs = buildRankBars(v.ranks, v.theirDir);
  const ourLead = ours.bars[0];
  const theirLead = theirs.bars[0];

  return (
    <g
      className="sc-colrank-layer"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <g
        className={`sc-colrank-entry is-rank-${v.column}`}
        data-column-ranks-war={v.warId}
        data-column-ranks={v.ranks}
        data-column-ranks-phase={v.column}
        data-ranks-label={v.ranksLabel}
        data-ranks-note={v.ranksNote || undefined}
      >
        {/* Player + ally stronger unit rank stack */}
        <g
          className="sc-colrank-group is-ours"
          transform={`translate(${v.ourX}, ${v.ourY})`}
        >
          <rect
            className="sc-colrank-plate"
            x={ours.plateX}
            y={ours.plateY}
            width={ours.plateW}
            height={ours.plateH}
            rx={1.5}
          />
          {ours.bars.map((b) => {
            const fill = b.idx === 1 && aPal ? aPal.tunic : b.idx === 2 ? pPal.trim : pPal.tunic;
            return (
              <rect
                key={`our-rank-${b.idx}`}
                className={`sc-colrank-mark is-strong${b.idx === 0 ? " is-lead" : ""}`}
                data-rank-side="ours"
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                rx={0.75}
                fill={fill}
                style={{ animationDelay: `${b.idx * 0.25}s` }}
              />
            );
          })}
          {ourLead ? (
            <>
              <line
                className="sc-colrank-bevel"
                x1={Number((ourLead.x + 0.6).toFixed(1))}
                y1={Number((ourLead.y + 0.45).toFixed(1))}
                x2={Number((ourLead.x + ourLead.width - 0.6).toFixed(1))}
                y2={Number((ourLead.y + 0.45).toFixed(1))}
              />
              <circle
                className="sc-colrank-pip"
                cx={Number((v.ourDir > 0 ? ourLead.x + ourLead.width + 0.9 : ourLead.x - 0.9).toFixed(1))}
                cy={Number((ourLead.y + ourLead.height / 2).toFixed(1))}
                r={0.65}
                fill={pPal.trim}
              />
            </>
          ) : null}
        </g>

        {/* Opposing foe stronger unit rank stack */}
        <g
          className="sc-colrank-group is-theirs"
          transform={`translate(${v.theirX}, ${v.theirY})`}
        >
          <rect
            className="sc-colrank-plate"
            x={theirs.plateX}
            y={theirs.plateY}
            width={theirs.plateW}
            height={theirs.plateH}
            rx={1.5}
          />
          {theirs.bars.map((b) => {
            const fill = b.idx === 2 ? fPal.trim : fPal.tunic;
            return (
              <rect
                key={`their-rank-${b.idx}`}
                className={`sc-colrank-mark is-strong${b.idx === 0 ? " is-lead" : ""}`}
                data-rank-side="theirs"
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                rx={0.75}
                fill={fill}
                style={{ animationDelay: `${b.idx * 0.25 + 0.15}s` }}
              />
            );
          })}
          {theirLead ? (
            <>
              <line
                className="sc-colrank-bevel"
                x1={Number((theirLead.x + 0.6).toFixed(1))}
                y1={Number((theirLead.y + 0.45).toFixed(1))}
                x2={Number((theirLead.x + theirLead.width - 0.6).toFixed(1))}
                y2={Number((theirLead.y + 0.45).toFixed(1))}
              />
              <circle
                className="sc-colrank-pip"
                cx={Number((v.theirDir > 0 ? theirLead.x + theirLead.width + 0.9 : theirLead.x - 0.9).toFixed(1))}
                cy={Number((theirLead.y + theirLead.height / 2).toFixed(1))}
                r={0.65}
                fill={fPal.trim}
              />
            </>
          ) : null}
        </g>

        {/* Quiet rank count + phase companion note pill below column badge */}
        <g
          className="sc-colrank-note"
          transform={`translate(${v.noteX}, ${v.noteY})`}
        >
          <rect
            className="sc-colrank-note-bg"
            x={-v.noteW / 2}
            y={-4.2}
            width={v.noteW}
            height={8}
            rx={3.8}
          />
          <text
            className="sc-colrank-note-text"
            x={0}
            y={1.2}
            textAnchor="middle"
          >
            <tspan className="sc-colrank-note-label">{v.ranksLabel}</tspan>
            {v.ranksNote ? (
              <>
                <tspan className="sc-colrank-note-sep"> · </tspan>
                <tspan className="sc-colrank-note-phase">{v.ranksNote}</tspan>
              </>
            ) : null}
          </text>
        </g>
      </g>
    </g>
  );
};
