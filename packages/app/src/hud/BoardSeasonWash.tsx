import type { CSSProperties } from "react";
import {
  currentSeason,
  isProvinceSeen,
  type GameState,
} from "@second-crown/sim";
import "./board-season-wash.css";

export type BoardSeasonKey = "spring" | "summer" | "autumn" | "winter";

export interface SeasonWashDescriptor {
  season: BoardSeasonKey;
  label: string;
  tileFill: string;
  tileStroke: string;
  ambientTop: string;
  ambientBottom: string;
  fogSoftFill: string;
  fogSoftEdge: string;
  fogEdgeOpacity: number;
  tileOpacity: number;
}

const CANVAS_W = 560;
const CANVAS_H = 360;
const BOARD_ORIGIN_X = 236;
const BOARD_ORIGIN_Y = 56;
const BOARD_HALF_W = 22;
const BOARD_HALF_H = 11;

function boardGridToWorld(bx: number, by: number): { wx: number; wy: number } {
  return {
    wx: BOARD_ORIGIN_X + (bx - by) * BOARD_HALF_W,
    wy: BOARD_ORIGIN_Y + (bx + by) * BOARD_HALF_H,
  };
}

function tileDelayStyle(bx: number, by: number): CSSProperties {
  const idx = ((bx * 3 + by * 7) % 11) * 0.45;
  return {
    animationDelay: `-${idx.toFixed(2)}s`,
  };
}

export function normalizeBoardSeason(raw: string): BoardSeasonKey {
  const lower = raw.trim().toLowerCase();
  if (lower === "spring" || lower === "summer" || lower === "autumn" || lower === "winter") {
    return lower;
  }
  if (lower === "fall") return "autumn";
  return "spring";
}

const SEASON_WASH_PALETTE: Record<BoardSeasonKey, SeasonWashDescriptor> = {
  spring: {
    season: "spring",
    label: "Spring Vernal Wash",
    tileFill: "#4ade80",
    tileStroke: "#86efac",
    ambientTop: "#4ade80",
    ambientBottom: "#22c55e",
    fogSoftFill: "#dcfce7",
    fogSoftEdge: "#86efac",
    fogEdgeOpacity: 0.24,
    tileOpacity: 0.14,
  },
  summer: {
    season: "summer",
    label: "Summer Sunlit Gold Wash",
    tileFill: "#fde047",
    tileStroke: "#fef08a",
    ambientTop: "#fde047",
    ambientBottom: "#f59e0b",
    fogSoftFill: "#fef9c3",
    fogSoftEdge: "#fde047",
    fogEdgeOpacity: 0.22,
    tileOpacity: 0.16,
  },
  autumn: {
    season: "autumn",
    label: "Autumn Harvest Amber Wash",
    tileFill: "#f59e0b",
    tileStroke: "#fbbf24",
    ambientTop: "#f59e0b",
    ambientBottom: "#d97706",
    fogSoftFill: "#ffedd5",
    fogSoftEdge: "#fdba74",
    fogEdgeOpacity: 0.24,
    tileOpacity: 0.16,
  },
  winter: {
    season: "winter",
    label: "Winter Cool Frost Wash",
    tileFill: "#bae6fd",
    tileStroke: "#e0f2fe",
    ambientTop: "#bae6fd",
    ambientBottom: "#38bdf8",
    fogSoftFill: "#e0f2fe",
    fogSoftEdge: "#7dd3fc",
    fogEdgeOpacity: 0.28,
    tileOpacity: 0.18,
  },
};

export function resolveSeasonWashDescriptor(state: GameState): SeasonWashDescriptor {
  const seasonKey = normalizeBoardSeason(currentSeason(state));
  return SEASON_WASH_PALETTE[seasonKey];
}

export interface BoardSeasonWashProps {
  state: GameState;
}

export function BoardSeasonWash({ state }: BoardSeasonWashProps) {
  const desc = resolveSeasonWashDescriptor(state);
  const provinces = state.board?.provinces ?? [];
  const seenProvs = provinces.filter((p) => isProvinceSeen(state, p.id));
  const unseenProvs = provinces.filter((p) => !isProvinceSeen(state, p.id));

  const ambientGradId = `sc-board-season-ambient-${desc.season}`;
  const fogGradId = `sc-board-season-fog-${desc.season}`;

  return (
    <g
      className={`sc-board-season-wash is-${desc.season}`}
      data-season={desc.season}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <linearGradient id={ambientGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={desc.ambientTop} stopOpacity="0.11" />
          <stop offset="55%" stopColor={desc.ambientBottom} stopOpacity="0.06" />
          <stop offset="100%" stopColor={desc.ambientBottom} stopOpacity="0.02" />
        </linearGradient>
        <radialGradient id={fogGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={desc.fogSoftFill} stopOpacity={desc.fogEdgeOpacity} />
          <stop offset="65%" stopColor={desc.fogSoftEdge} stopOpacity={desc.fogEdgeOpacity * 0.45} />
          <stop offset="100%" stopColor={desc.fogSoftEdge} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Subtle full-board seasonal atmospheric wash */}
      <rect
        x={0}
        y={0}
        width={CANVAS_W}
        height={CANVAS_H}
        fill={`url(#${ambientGradId})`}
        className="sc-board-season-wash-ambient"
        style={{ pointerEvents: "none" }}
      />

      {/* Per-tile seasonal tint on seen isometric diamonds */}
      {seenProvs.map((p) => {
        const { wx, wy } = boardGridToWorld(p.x, p.y);
        const points = `${wx},${wy - BOARD_HALF_H} ${wx + BOARD_HALF_W},${wy} ${wx},${wy + BOARD_HALF_H} ${wx - BOARD_HALF_W},${wy}`;
        return (
          <polygon
            key={`season-tile-${p.id}`}
            points={points}
            fill={desc.tileFill}
            fillOpacity={desc.tileOpacity}
            stroke={desc.tileStroke}
            strokeOpacity={0.14}
            strokeWidth={0.5}
            className="sc-board-season-wash-tile"
            style={{ ...tileDelayStyle(p.x, p.y), pointerEvents: "none" }}
          />
        );
      })}

      {/* Soft seasonal veil over unseen province fog clusters */}
      {unseenProvs.map((p, idx) => {
        const { wx, wy } = boardGridToWorld(p.x, p.y);
        const isAlt = (idx + p.x + p.y) % 2 === 1;
        return (
          <ellipse
            key={`season-fog-${p.id}`}
            cx={wx}
            cy={wy - 1}
            rx={34}
            ry={17}
            fill={`url(#${fogGradId})`}
            className={`sc-board-season-wash-fog${isAlt ? " is-alt" : ""}`}
            style={{ ...tileDelayStyle(p.x, p.y), pointerEvents: "none" }}
          />
        );
      })}
    </g>
  );
}
