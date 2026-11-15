import type { CSSProperties } from "react";
import { getProvince, type GameState } from "@second-crown/sim";
import "./living-stamp-pip.css";

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

export function countActiveStamps(state?: GameState | null): number {
  const log = state?.inputLog;
  if (!Array.isArray(log)) return 0;
  let count = 0;
  for (const rec of log) {
    if (rec && rec.type === "stamp" && typeof rec.issuerId === "string") {
      count += 1;
    }
  }
  return count;
}

export interface LivingStampPipProps {
  active: boolean;
  count?: number;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function LivingStampPip({
  active,
  count = 0,
  size = 14,
  className = "",
  style,
}: LivingStampPipProps) {
  const stateClass = active ? "is-active" : "is-idle";

  return (
    <span
      className={`sc-living-stamp-pip ${stateClass} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
      data-living-stamp-pip="true"
      data-stamp-active={active ? "true" : "false"}
      data-stamp-count={count}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className="sc-living-stamp-svg"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <radialGradient id="sc-stamp-pip-aura-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.65" />
            <stop offset="65%" stopColor="#dc2626" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
          </radialGradient>
        </defs>

        {active && (
          <circle
            cx="8"
            cy="8"
            r="7.4"
            fill="url(#sc-stamp-pip-aura-grad)"
            className="sc-living-stamp-aura"
            style={{ pointerEvents: "none" }}
          />
        )}

        <g className="sc-living-stamp-seal" style={{ pointerEvents: "none" }}>
          <circle
            cx="8"
            cy="8"
            r="5.2"
            fill={active ? "#991b1b" : "#475569"}
            stroke={active ? "#fbbf24" : "#64748b"}
            strokeWidth="0.9"
          />
          <circle
            cx="8"
            cy="8"
            r="3.4"
            fill={active ? "#dc2626" : "#334155"}
            stroke={active ? "#fde68a" : "#94a3b8"}
            strokeWidth="0.55"
          />
          <polygon
            points="6.1,9.5 9.9,9.5 9.9,7.6 8.9,8.3 8,6.7 7.1,8.3 6.1,7.6"
            fill={active ? "#fef08a" : "#cbd5e1"}
          />
        </g>
      </svg>
    </span>
  );
}

export interface HomeKeepStampPipProps {
  state: GameState;
}

export function HomeKeepStampPip({ state }: HomeKeepStampPipProps) {
  const homeId = state.board?.homeProvinceId;
  if (!homeId) return null;
  const home = getProvince(state, homeId);
  if (!home) return null;

  const count = countActiveStamps(state);
  const active = count > 0;
  const { wx, wy } = boardGridToWorld(home.x, home.y);
  const cx = wx - 11;
  const cy = wy - 14;

  return (
    <g
      className={`sc-keep-stamp-pip ${active ? "is-active" : "is-idle"}`}
      data-home-keep-stamp="true"
      data-province-id={homeId}
      data-stamp-active={active ? "true" : "false"}
      data-stamp-count={count}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <radialGradient id="sc-keep-stamp-aura-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.72" />
          <stop offset="65%" stopColor="#dc2626" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
        </radialGradient>
      </defs>

      {active && (
        <circle
          cx={cx}
          cy={cy}
          r={6.2}
          fill="url(#sc-keep-stamp-aura-grad)"
          className="sc-keep-stamp-aura"
          style={{ pointerEvents: "none" }}
        />
      )}

      <g className="sc-keep-stamp-seal" style={{ pointerEvents: "none" }}>
        <circle
          cx={cx}
          cy={cy}
          r={3.5}
          fill={active ? "#991b1b" : "#475569"}
          stroke={active ? "#fbbf24" : "#64748b"}
          strokeWidth="0.75"
        />
        <circle
          cx={cx}
          cy={cy}
          r={2.2}
          fill={active ? "#dc2626" : "#334155"}
        />
        <circle
          cx={cx}
          cy={cy}
          r={0.85}
          fill={active ? "#fef08a" : "#cbd5e1"}
        />
      </g>
    </g>
  );
}
