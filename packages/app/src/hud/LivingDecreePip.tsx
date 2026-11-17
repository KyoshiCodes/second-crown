import type { CSSProperties } from "react";
import { DECREES, decreeActive, getProvince, type GameState } from "@second-crown/sim";
import "./living-decree-pip.css";

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

export function countActiveDecrees(state?: GameState | null): number {
  if (!state) return 0;
  let count = 0;
  for (const d of DECREES) {
    if (decreeActive(state, d.id)) {
      count += 1;
    }
  }
  return count;
}

export function firstActiveDecreeId(state?: GameState | null): string | undefined {
  if (!state) return undefined;
  for (const d of DECREES) {
    if (decreeActive(state, d.id)) {
      return d.id;
    }
  }
  return undefined;
}

export interface LivingDecreePipProps {
  active: boolean;
  count?: number;
  decreeId?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function LivingDecreePip({
  active,
  count = 0,
  decreeId,
  size = 14,
  className = "",
  style,
}: LivingDecreePipProps) {
  const stateClass = active ? "is-active" : "is-idle";

  return (
    <span
      className={`sc-living-decree-pip ${stateClass} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
      data-living-decree-pip="true"
      data-decree-active={active ? "true" : "false"}
      data-decree-count={count}
      data-decree-id={decreeId ?? "none"}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className="sc-living-decree-svg"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <radialGradient id="sc-decree-pip-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.72" />
            <stop offset="65%" stopColor="#f59e0b" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </radialGradient>
        </defs>

        {active && (
          <circle
            cx="8"
            cy="8"
            r="7.4"
            fill="url(#sc-decree-pip-grad)"
            className="sc-living-decree-aura"
            style={{ pointerEvents: "none" }}
          />
        )}

        <g className="sc-living-decree-seal" style={{ pointerEvents: "none" }}>
          <polygon
            points="5.8,9.8 4.4,14.8 6.2,13.9 7.6,14.8 7.1,9.8"
            fill={active ? "#b45309" : "#475569"}
            stroke={active ? "#78350f" : "#334155"}
            strokeWidth="0.45"
          />
          <polygon
            points="8.9,9.8 8.4,14.8 9.8,13.9 11.6,14.8 10.2,9.8"
            fill={active ? "#d97706" : "#475569"}
            stroke={active ? "#78350f" : "#334155"}
            strokeWidth="0.45"
          />
          <circle
            cx="8"
            cy="7.4"
            r="4.8"
            fill={active ? "#d97706" : "#475569"}
            stroke={active ? "#fde047" : "#64748b"}
            strokeWidth="0.85"
          />
          <circle
            cx="8"
            cy="7.4"
            r="3.2"
            fill={active ? "#fbbf24" : "#334155"}
            stroke={active ? "#fef08a" : "#94a3b8"}
            strokeWidth="0.5"
          />
          <polygon
            points="6.2,8.8 9.8,8.8 9.8,7.0 8.9,7.6 8,6.1 7.1,7.6 6.2,7.0"
            fill={active ? "#fffbeb" : "#cbd5e1"}
          />
        </g>

        {active && (
          <circle
            cx="8"
            cy="4.3"
            r="0.95"
            fill="#fef08a"
            className="sc-living-decree-flicker"
            style={{ pointerEvents: "none" }}
          />
        )}
      </svg>
    </span>
  );
}

export interface HomeKeepDecreePipProps {
  state: GameState;
}

export function HomeKeepDecreePip({ state }: HomeKeepDecreePipProps) {
  const homeId = state.board?.homeProvinceId;
  if (!homeId) return null;
  const home = getProvince(state, homeId);
  if (!home) return null;

  const count = countActiveDecrees(state);
  const active = count > 0;
  const decreeId = firstActiveDecreeId(state);
  const { wx, wy } = boardGridToWorld(home.x, home.y);
  const cx = wx;
  const cy = wy - 9;

  return (
    <g
      className={`sc-keep-decree-pip ${active ? "is-active" : "is-idle"}`}
      data-home-keep-decree="true"
      data-province-id={homeId}
      data-decree-active={active ? "true" : "false"}
      data-decree-count={count}
      data-decree-id={decreeId ?? "none"}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <radialGradient id="sc-keep-decree-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde047" stopOpacity="0.78" />
          <stop offset="65%" stopColor="#f59e0b" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
        </radialGradient>
      </defs>

      {active && (
        <circle
          cx={cx}
          cy={cy}
          r={6.4}
          fill="url(#sc-keep-decree-grad)"
          className="sc-keep-decree-aura"
          style={{ pointerEvents: "none" }}
        />
      )}

      <g className="sc-keep-decree-seal" style={{ pointerEvents: "none" }}>
        <polygon
          points={`${cx - 1.7},${cy + 2.2} ${cx - 2.4},${cy + 5.1} ${cx - 0.8},${cy + 4.3} ${cx - 0.1},${cy + 5.1} ${cx - 0.4},${cy + 2.2}`}
          fill={active ? "#b45309" : "#475569"}
        />
        <polygon
          points={`${cx + 0.4},${cy + 2.2} ${cx + 0.1},${cy + 5.1} ${cx + 0.8},${cy + 4.3} ${cx + 2.4},${cy + 5.1} ${cx + 1.7},${cy + 2.2}`}
          fill={active ? "#d97706" : "#475569"}
        />
        <circle
          cx={cx}
          cy={cy}
          r={3.5}
          fill={active ? "#d97706" : "#475569"}
          stroke={active ? "#fde047" : "#64748b"}
          strokeWidth="0.75"
        />
        <circle
          cx={cx}
          cy={cy}
          r={2.2}
          fill={active ? "#fbbf24" : "#334155"}
        />
        <circle
          cx={cx}
          cy={cy}
          r={0.85}
          fill={active ? "#fffbeb" : "#cbd5e1"}
        />
      </g>

      {active && (
        <circle
          cx={cx + 2.1}
          cy={cy - 2.3}
          r={0.9}
          fill="#fef08a"
          className="sc-keep-decree-flicker"
          style={{ pointerEvents: "none" }}
        />
      )}
    </g>
  );
}
