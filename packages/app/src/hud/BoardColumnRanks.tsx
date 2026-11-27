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

const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

export interface BoardColumnRanksView {
  warId: string;
  column: ColumnMarkId;
  ranks: ColumnRanks;
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
 * Reads `columnMarkSnapshot(state)` (including `.ranks`: 1, 2, or 3) and places calm
 * unit-rank stacks just below each opposing column standard without colliding with
 * `BoardJoinedFormations` or `BoardColumnMarks`.
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
  const ourY = Number(Math.max(20, Math.min(344, p1.wy + (p2.wy - p1.wy) * 0.28 + 9.5)).toFixed(1));
  const theirX = Number(Math.max(44, Math.min(516, p1.wx + (p2.wx - p1.wx) * 0.72)).toFixed(1));
  const theirY = Number(Math.max(20, Math.min(344, p1.wy + (p2.wy - p1.wy) * 0.72 + 9.5)).toFixed(1));

  const allyId = mark.ours.realmIds.find((id) => id !== "player") ?? null;
  const baseDir = p2.wx >= p1.wx ? 1 : -1;
  const isRetreat = mark.column === "falling-back";
  const ourDir = isRetreat ? -baseDir : baseDir;
  const theirDir = isRetreat ? baseDir : -baseDir;

  return {
    warId: mark.warId,
    column: mark.column,
    ranks: mark.ranks,
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
  };
}

/**
 * Quiet, non-blocking SVG overlay showing 1, 2, or 3 unit-rank bars beside each
 * joined-war column standard from `columnMarkSnapshot(state).ranks`. Zero blood/gore.
 */
export const BoardColumnRanks: React.FC<{ state: GameState }> = ({ state }) => {
  const v = resolveBoardColumnRanks(state);
  if (!v) return null;

  const pPal = LIVING_CULTURE_PALETTE[v.playerKit];
  const aPal = v.allyKit ? LIVING_CULTURE_PALETTE[v.allyKit] : null;
  const fPal = LIVING_CULTURE_PALETTE[v.foeKit];
  const indices = Array.from({ length: v.ranks }, (_, i) => i);

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
      >
        {/* Player + ally unit ranks */}
        <g
          className="sc-colrank-group is-ours"
          transform={`translate(${v.ourX}, ${v.ourY})`}
        >
          {indices.map((idx) => {
            const xOff = (v.ourDir > 0 ? -5.5 : 0.5) - idx * 1.4 * v.ourDir;
            const yOff = idx * 2.2;
            const fill = idx === 1 && aPal ? aPal.tunic : idx === 2 ? pPal.trim : pPal.tunic;
            return (
              <rect
                key={`our-rank-${idx}`}
                className={`sc-colrank-mark${idx === 0 ? " is-lead" : ""}`}
                data-rank-side="ours"
                x={Number(xOff.toFixed(1))}
                y={Number(yOff.toFixed(1))}
                width={5}
                height={1.4}
                rx={0.6}
                fill={fill}
                style={{ animationDelay: `${idx * 0.25}s` }}
              />
            );
          })}
        </g>

        {/* Opposing foe unit ranks */}
        <g
          className="sc-colrank-group is-theirs"
          transform={`translate(${v.theirX}, ${v.theirY})`}
        >
          {indices.map((idx) => {
            const xOff = (v.theirDir > 0 ? -5.5 : 0.5) - idx * 1.4 * v.theirDir;
            const yOff = idx * 2.2;
            const fill = idx === 2 ? fPal.trim : fPal.tunic;
            return (
              <rect
                key={`their-rank-${idx}`}
                className={`sc-colrank-mark${idx === 0 ? " is-lead" : ""}`}
                data-rank-side="theirs"
                x={Number(xOff.toFixed(1))}
                y={Number(yOff.toFixed(1))}
                width={5}
                height={1.4}
                rx={0.6}
                fill={fill}
                style={{ animationDelay: `${idx * 0.25 + 0.15}s` }}
              />
            );
          })}
        </g>
      </g>
    </g>
  );
};
