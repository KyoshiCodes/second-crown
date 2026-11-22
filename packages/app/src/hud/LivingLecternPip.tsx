import type { CSSProperties } from "react";
import { RESEARCH, getProvince, researchDone, researchTicksLeft, type GameState, type ResearchId } from "@second-crown/sim";
import "./living-lectern-pip.css";

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

export interface ActiveStudySummary {
  active: boolean;
  studyId: string | null;
  activeCount: number;
  knownCount: number;
  totalCount: number;
}

export function summarizeActiveStudy(state?: GameState | null): ActiveStudySummary {
  const ids = Object.keys(RESEARCH) as ResearchId[];
  if (!state || !state.flags || !state.meta) {
    return { active: false, studyId: null, activeCount: 0, knownCount: 0, totalCount: ids.length };
  }
  let activeCount = 0;
  let knownCount = 0;
  let studyId: string | null = null;
  for (const id of ids) {
    if (researchTicksLeft(state, id) > 0) {
      activeCount += 1;
      if (studyId === null) studyId = id;
    } else if (researchDone(state, id)) {
      knownCount += 1;
    }
  }
  return {
    active: activeCount > 0,
    studyId,
    activeCount,
    knownCount,
    totalCount: ids.length,
  };
}

export interface LivingLecternPipProps {
  active: boolean;
  studyId?: string | null;
  activeCount?: number;
  knownCount?: number;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function LivingLecternPip({
  active,
  studyId = null,
  activeCount = 0,
  knownCount = 0,
  size = 14,
  className = "",
  style,
}: LivingLecternPipProps) {
  const stateClass = active ? "is-active" : "is-idle";

  return (
    <span
      className={`sc-living-lectern-pip ${stateClass} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
      data-living-lectern-pip="true"
      data-lectern-active={active ? "true" : "false"}
      data-study-id={studyId ?? "none"}
      data-active-studies={activeCount}
      data-known-studies={knownCount}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className="sc-living-lectern-svg"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <radialGradient id="sc-lectern-pip-grad" cx="50%" cy="45%" r="52%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.76" />
            <stop offset="58%" stopColor="#8b5cf6" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
          </radialGradient>
        </defs>

        {active && (
          <circle
            cx="8"
            cy="8"
            r="7.4"
            fill="url(#sc-lectern-pip-grad)"
            className="sc-living-lectern-aura"
            style={{ pointerEvents: "none" }}
          />
        )}

        <g className="sc-living-lectern-body" style={{ pointerEvents: "none" }}>
          {/* Wooden lectern stem and base */}
          <line
            x1="8"
            y1="10.2"
            x2="8"
            y2="13.8"
            stroke={active ? "#b45309" : "#475569"}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <line
            x1="5.2"
            y1="13.8"
            x2="10.8"
            y2="13.8"
            stroke={active ? "#92400e" : "#475569"}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Left folio page */}
          <path
            d="M3.0 5.4 L8.0 4.6 L8.0 10.6 L3.0 9.8 Z"
            fill={active ? "#fef3c7" : "#cbd5e1"}
            stroke={active ? "#b45309" : "#475569"}
            strokeWidth="0.7"
            strokeLinejoin="round"
          />
          {/* Right folio page */}
          <path
            d="M8.0 4.6 L13.0 5.4 L13.0 9.8 L8.0 10.6 Z"
            fill={active ? "#fffbeb" : "#e2e8f0"}
            stroke={active ? "#b45309" : "#475569"}
            strokeWidth="0.7"
            strokeLinejoin="round"
          />
          {/* Spine & subtle ink lines */}
          <line x1="8" y1="4.6" x2="8" y2="10.6" stroke={active ? "#92400e" : "#64748b"} strokeWidth="0.65" />
          <line x1="4.2" y1="6.7" x2="6.9" y2="6.3" stroke={active ? "#92400e" : "#64748b"} strokeWidth="0.5" strokeLinecap="round" />
          <line x1="4.2" y1="8.2" x2="6.9" y2="7.8" stroke={active ? "#92400e" : "#64748b"} strokeWidth="0.5" strokeLinecap="round" />
          <line x1="9.1" y1="6.3" x2="11.8" y2="6.7" stroke={active ? "#d97706" : "#64748b"} strokeWidth="0.5" strokeLinecap="round" />
          {active && (
            <path
              d="M8.0 4.8 L12.2 5.4 L12.2 9.4 L8.0 10.2 Z"
              fill="#fef08a"
              fillOpacity="0.88"
              stroke="#d97706"
              strokeWidth="0.55"
              strokeLinejoin="round"
              className="sc-living-lectern-page"
              style={{ pointerEvents: "none" }}
            />
          )}
        </g>

        {active && (
          <circle
            cx="8"
            cy="3.1"
            r="0.9"
            fill="#fef08a"
            className="sc-living-lectern-spark"
            style={{ pointerEvents: "none" }}
          />
        )}
      </svg>
    </span>
  );
}

export interface HomeKeepLecternPipProps {
  state: GameState;
}

export function HomeKeepLecternPip({ state }: HomeKeepLecternPipProps) {
  const homeId = state.board?.homeProvinceId;
  if (!homeId) return null;
  const home = getProvince(state, homeId);
  if (!home) return null;

  const summary = summarizeActiveStudy(state);
  const { active } = summary;
  const { wx, wy } = boardGridToWorld(home.x, home.y);
  const cx = wx - 11;
  const cy = wy - 6;

  return (
    <g
      className={`sc-keep-lectern-pip ${active ? "is-active" : "is-idle"}`}
      data-home-keep-lectern="true"
      data-province-id={homeId}
      data-lectern-active={active ? "true" : "false"}
      data-study-id={summary.studyId ?? "none"}
      data-active-studies={summary.activeCount}
      data-known-studies={summary.knownCount}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <radialGradient id="sc-keep-lectern-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde047" stopOpacity="0.82" />
          <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
        </radialGradient>
      </defs>

      {active && (
        <circle
          cx={cx}
          cy={cy}
          r={6.4}
          fill="url(#sc-keep-lectern-grad)"
          className="sc-keep-lectern-aura"
          style={{ pointerEvents: "none" }}
        />
      )}

      <g className="sc-keep-lectern-body" style={{ pointerEvents: "none" }}>
        <line
          x1={cx}
          y1={cy + 1.6}
          x2={cx}
          y2={cy + 4.1}
          stroke={active ? "#b45309" : "#475569"}
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        <line
          x1={cx - 1.9}
          y1={cy + 4.1}
          x2={cx + 1.9}
          y2={cy + 4.1}
          stroke={active ? "#92400e" : "#475569"}
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - 3.6} ${cy - 1.6} L ${cx} ${cy - 2.3} L ${cx} ${cy + 1.9} L ${cx - 3.6} ${cy + 1.3} Z`}
          fill={active ? "#fef3c7" : "#cbd5e1"}
          stroke={active ? "#b45309" : "#475569"}
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
        <path
          d={`M ${cx} ${cy - 2.3} L ${cx + 3.6} ${cy - 1.6} L ${cx + 3.6} ${cy + 1.3} L ${cx} ${cy + 1.9} Z`}
          fill={active ? "#fffbeb" : "#e2e8f0"}
          stroke={active ? "#b45309" : "#475569"}
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
        {active && (
          <path
            d={`M ${cx} ${cy - 2.1} L ${cx + 3.1} ${cy - 1.5} L ${cx + 3.1} ${cy + 1.1} L ${cx} ${cy + 1.7} Z`}
            fill="#fef08a"
            fillOpacity="0.88"
            stroke="#d97706"
            strokeWidth="0.45"
            strokeLinejoin="round"
            className="sc-keep-lectern-page"
            style={{ pointerEvents: "none" }}
          />
        )}
      </g>

      {active && (
        <circle
          cx={cx}
          cy={cy - 3.4}
          r={0.85}
          fill="#fef08a"
          className="sc-keep-lectern-spark"
          style={{ pointerEvents: "none" }}
        />
      )}
    </g>
  );
}
