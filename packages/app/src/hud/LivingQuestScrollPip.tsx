import type { CSSProperties } from "react";
import { getProvince, listQuests, type GameState } from "@second-crown/sim";
import "./living-quest-scroll-pip.css";

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

export interface ActiveQuestsSummary {
  active: number;
  ready: number;
  status: "open" | "ready" | "idle";
}

export function summarizeActiveQuests(state?: GameState | null): ActiveQuestsSummary {
  if (!state || !Array.isArray(state.units) || !Array.isArray(state.buildings) || !state.flags) {
    return { active: 0, ready: 0, status: "idle" };
  }
  let active = 0;
  let ready = 0;
  for (const q of listQuests(state)) {
    if (q.claimed) continue;
    active += 1;
    if (q.complete) ready += 1;
  }
  return {
    active,
    ready,
    status: active === 0 ? "idle" : ready > 0 ? "ready" : "open",
  };
}

export interface LivingQuestScrollPipProps {
  active: boolean;
  ready?: boolean;
  count?: number;
  readyCount?: number;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function LivingQuestScrollPip({
  active,
  ready = false,
  count = 0,
  readyCount = 0,
  size = 14,
  className = "",
  style,
}: LivingQuestScrollPipProps) {
  const statusClass = active ? (ready ? "is-active is-ready" : "is-active is-open") : "is-idle";
  const auraInner = ready ? "#fef08a" : "#fde68a";
  const auraOuter = ready ? "#f59e0b" : "#d97706";

  return (
    <span
      className={`sc-living-quest-scroll-pip ${statusClass} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
      data-living-quest-scroll-pip="true"
      data-quest-active={active ? "true" : "false"}
      data-quest-ready={ready ? "true" : "false"}
      data-quest-count={count}
      data-quest-ready-count={readyCount}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className="sc-living-quest-scroll-svg"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <radialGradient id="sc-quest-scroll-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={auraInner} stopOpacity="0.72" />
            <stop offset="65%" stopColor={auraOuter} stopOpacity="0.32" />
            <stop offset="100%" stopColor={auraOuter} stopOpacity="0" />
          </radialGradient>
        </defs>

        {active && (
          <circle
            cx="8"
            cy="8"
            r="7.4"
            fill="url(#sc-quest-scroll-grad)"
            className="sc-living-quest-scroll-aura"
            style={{ pointerEvents: "none" }}
          />
        )}

        <g className="sc-living-quest-scroll-body" style={{ pointerEvents: "none" }}>
          <rect
            x="4.2"
            y="3.4"
            width="7.6"
            height="9.2"
            rx="0.9"
            fill={active ? (ready ? "#fffbeb" : "#fef3c7") : "#cbd5e1"}
            stroke={active ? (ready ? "#b45309" : "#78350f") : "#475569"}
            strokeWidth="0.75"
          />
          <line
            x1="5.8"
            y1="6.3"
            x2="10.2"
            y2="6.3"
            stroke={active ? (ready ? "#d97706" : "#92400e") : "#64748b"}
            strokeWidth="0.7"
            strokeLinecap="round"
          />
          <line
            x1="5.8"
            y1="8.4"
            x2="9.6"
            y2="8.4"
            stroke={active ? (ready ? "#d97706" : "#92400e") : "#64748b"}
            strokeWidth="0.7"
            strokeLinecap="round"
          />
          <rect
            x="3.3"
            y="2.3"
            width="9.4"
            height="1.9"
            rx="0.95"
            fill={active ? (ready ? "#fbbf24" : "#d97706") : "#94a3b8"}
            stroke={active ? "#78350f" : "#475569"}
            strokeWidth="0.65"
          />
          <rect
            x="3.3"
            y="11.6"
            width="9.4"
            height="1.9"
            rx="0.95"
            fill={active ? (ready ? "#f59e0b" : "#b45309") : "#94a3b8"}
            stroke={active ? "#78350f" : "#475569"}
            strokeWidth="0.65"
            className="sc-living-quest-scroll-roller"
          />
          <circle
            cx="8"
            cy="10.4"
            r="1.35"
            fill={active ? (ready ? "#facc15" : "#dc2626") : "#64748b"}
            stroke={active ? (ready ? "#92400e" : "#7f1d1d") : "#334155"}
            strokeWidth="0.5"
          />
        </g>

        {active && (
          <circle
            cx="11.6"
            cy="4.2"
            r="0.9"
            fill={ready ? "#fef08a" : "#fde68a"}
            className="sc-living-quest-scroll-glint"
            style={{ pointerEvents: "none" }}
          />
        )}
      </svg>
    </span>
  );
}

export interface HomeKeepQuestScrollPipProps {
  state: GameState;
}

export function HomeKeepQuestScrollPip({ state }: HomeKeepQuestScrollPipProps) {
  const homeId = state.board?.homeProvinceId;
  if (!homeId) return null;
  const home = getProvince(state, homeId);
  if (!home) return null;

  const summary = summarizeActiveQuests(state);
  const active = summary.active > 0;
  const ready = summary.ready > 0;
  const statusClass = active ? (ready ? "is-active is-ready" : "is-active is-open") : "is-idle";
  const { wx, wy } = boardGridToWorld(home.x, home.y);
  const cx = wx - 13;
  const cy = wy - 22;

  return (
    <g
      className={`sc-keep-quest-scroll-pip ${statusClass}`}
      data-home-keep-quest="true"
      data-province-id={homeId}
      data-quest-active={active ? "true" : "false"}
      data-quest-ready={ready ? "true" : "false"}
      data-quest-count={summary.active}
      data-quest-ready-count={summary.ready}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <radialGradient id="sc-keep-quest-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={ready ? "#fef08a" : "#fde68a"} stopOpacity="0.78" />
          <stop offset="65%" stopColor={ready ? "#f59e0b" : "#d97706"} stopOpacity="0.34" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
        </radialGradient>
      </defs>

      {active && (
        <circle
          cx={cx}
          cy={cy}
          r={6.4}
          fill="url(#sc-keep-quest-grad)"
          className="sc-keep-quest-scroll-aura"
          style={{ pointerEvents: "none" }}
        />
      )}

      <g className="sc-keep-quest-scroll-body" style={{ pointerEvents: "none" }}>
        <rect
          x={cx - 2.6}
          y={cy - 3.2}
          width={5.2}
          height={6.4}
          rx="0.7"
          fill={active ? (ready ? "#fffbeb" : "#fef3c7") : "#cbd5e1"}
          stroke={active ? (ready ? "#b45309" : "#78350f") : "#475569"}
          strokeWidth="0.65"
        />
        <line
          x1={cx - 1.5}
          y1={cy - 1.1}
          x2={cx + 1.5}
          y2={cy - 1.1}
          stroke={active ? (ready ? "#d97706" : "#92400e") : "#64748b"}
          strokeWidth="0.55"
          strokeLinecap="round"
        />
        <line
          x1={cx - 1.5}
          y1={cy + 0.5}
          x2={cx + 1.1}
          y2={cy + 0.5}
          stroke={active ? (ready ? "#d97706" : "#92400e") : "#64748b"}
          strokeWidth="0.55"
          strokeLinecap="round"
        />
        <rect
          x={cx - 3.2}
          y={cy - 3.9}
          width={6.4}
          height={1.3}
          rx="0.65"
          fill={active ? (ready ? "#fbbf24" : "#d97706") : "#94a3b8"}
          stroke={active ? "#78350f" : "#475569"}
          strokeWidth="0.5"
        />
        <rect
          x={cx - 3.2}
          y={cy + 2.4}
          width={6.4}
          height={1.3}
          rx="0.65"
          fill={active ? (ready ? "#f59e0b" : "#b45309") : "#94a3b8"}
          stroke={active ? "#78350f" : "#475569"}
          strokeWidth="0.5"
          className="sc-keep-quest-scroll-roller"
        />
        <circle
          cx={cx}
          cy={cy + 1.8}
          r="0.95"
          fill={active ? (ready ? "#facc15" : "#dc2626") : "#64748b"}
        />
      </g>

      {active && (
        <circle
          cx={cx + 2.2}
          cy={cy - 2.3}
          r={0.85}
          fill={ready ? "#fef08a" : "#fde68a"}
          className="sc-keep-quest-scroll-glint"
          style={{ pointerEvents: "none" }}
        />
      )}
    </g>
  );
}
