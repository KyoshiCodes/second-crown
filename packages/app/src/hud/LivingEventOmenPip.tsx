import type { CSSProperties } from "react";
import { EVENT_PERIOD, getEventLog, getProvince, type GameState, type WorldEvent } from "@second-crown/sim";
import {
  resolveOmenVariant,
  resolveSpecificEventType,
  type OmenVariant,
  type SpecificEventType,
} from "./OmenPip";
import "./living-omen-pip.css";

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

export interface ActiveOmenPalette {
  variant: OmenVariant;
  specificType: SpecificEventType;
  coreFill: string;
  ringStroke: string;
  innerFill: string;
  auraInner: string;
  auraOuter: string;
  sparkFill: string;
}

const PALETTES: Record<SpecificEventType, Omit<ActiveOmenPalette, "variant" | "specificType">> = {
  harvest: {
    coreFill: "#ca8a04",
    ringStroke: "#fde047",
    innerFill: "#fef08a",
    auraInner: "#fde047",
    auraOuter: "#d97706",
    sparkFill: "#fffbeb",
  },
  timber: {
    coreFill: "#4d7c0f",
    ringStroke: "#bef264",
    innerFill: "#d9f99d",
    auraInner: "#a3e635",
    auraOuter: "#3f6212",
    sparkFill: "#ecfccb",
  },
  spoil: {
    coreFill: "#991b1b",
    ringStroke: "#f87171",
    innerFill: "#fecaca",
    auraInner: "#ef4444",
    auraOuter: "#7f1d1d",
    sparkFill: "#fee2e2",
  },
  levy: {
    coreFill: "#4338ca",
    ringStroke: "#a5b4fc",
    innerFill: "#e0e7ff",
    auraInner: "#818cf8",
    auraOuter: "#3730a3",
    sparkFill: "#eef2ff",
  },
  tribute: {
    coreFill: "#0369a1",
    ringStroke: "#fde047",
    innerFill: "#bae6fd",
    auraInner: "#38bdf8",
    auraOuter: "#d97706",
    sparkFill: "#fef9c3",
  },
  other: {
    coreFill: "#1e40af",
    ringStroke: "#93c5fd",
    innerFill: "#dbeafe",
    auraInner: "#60a5fa",
    auraOuter: "#b45309",
    sparkFill: "#fef08a",
  },
};

export function activePeriodEvent(state?: GameState | null): WorldEvent | null {
  if (!state) return null;
  const periodStart = Math.floor(state.meta.tick / EVENT_PERIOD) * EVENT_PERIOD;
  if (periodStart <= 0) return null;
  const log = getEventLog(state);
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].tick === periodStart) return log[i];
  }
  const flagTick = Number(state.flags["last_event_tick"] ?? 0);
  const flagText = state.flags["last_event"];
  if (flagTick === periodStart && typeof flagText === "string" && flagText) {
    return { tick: flagTick, id: "latest", text: flagText };
  }
  return null;
}

export function resolveActiveOmenPalette(eventId?: string, text?: string): ActiveOmenPalette {
  const variant = resolveOmenVariant(eventId, text);
  const specificType = resolveSpecificEventType(eventId, text);
  return {
    variant,
    specificType,
    ...PALETTES[specificType],
  };
}

export interface LivingEventOmenPipProps {
  active: boolean;
  eventId?: string;
  text?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function LivingEventOmenPip({
  active,
  eventId,
  text,
  size = 14,
  className = "",
  style,
}: LivingEventOmenPipProps) {
  const palette = resolveActiveOmenPalette(eventId, text);
  const stateClass = active ? "is-active" : "is-idle";

  return (
    <span
      className={`sc-living-event-omen-pip ${stateClass} is-omen-${palette.variant} is-type-${palette.specificType} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
      data-living-event-omen-pip="true"
      data-event-active={active ? "true" : "false"}
      data-event-id={active ? (eventId ?? "latest") : "none"}
      data-omen-variant={palette.variant}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className="sc-living-event-omen-svg"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <radialGradient id="sc-event-omen-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.auraInner} stopOpacity="0.72" />
            <stop offset="65%" stopColor={palette.auraOuter} stopOpacity="0.32" />
            <stop offset="100%" stopColor={palette.auraOuter} stopOpacity="0" />
          </radialGradient>
        </defs>

        {active && (
          <circle
            cx="8"
            cy="8"
            r="7.4"
            fill="url(#sc-event-omen-grad)"
            className="sc-living-event-omen-aura"
            style={{ pointerEvents: "none" }}
          />
        )}

        <g className="sc-living-event-omen-body" style={{ pointerEvents: "none" }}>
          <circle
            cx="8"
            cy="8"
            r="4.9"
            fill={active ? palette.coreFill : "#334155"}
            stroke={active ? palette.ringStroke : "#64748b"}
            strokeWidth="0.9"
          />
          <circle
            cx="8"
            cy="8"
            r="3.2"
            fill={active ? "#0f172a" : "#1e293b"}
            stroke={active ? palette.innerFill : "#94a3b8"}
            strokeWidth="0.45"
          />
          {palette.variant === "harvest" ? (
            <polygon
              points="8,5.1 9.9,8 8,10.9 6.1,8"
              fill={active ? palette.innerFill : "#cbd5e1"}
            />
          ) : palette.variant === "raven" ? (
            <path
              d="M5.4 9.5 C6.5 6.4 9.4 5.7 10.7 6.8 C9.1 7.3 8.1 8.4 7.7 10.3 Z"
              fill={active ? palette.innerFill : "#cbd5e1"}
            />
          ) : (
            <polygon
              points="8,5.0 8.8,7.2 11.0,8.0 8.8,8.8 8,11.0 7.2,8.8 5.0,8.0 7.2,7.2"
              fill={active ? palette.innerFill : "#cbd5e1"}
            />
          )}
        </g>

        {active && (
          <circle
            cx="11.4"
            cy="4.4"
            r="0.95"
            fill={palette.sparkFill}
            className="sc-living-event-omen-spark"
            style={{ pointerEvents: "none" }}
          />
        )}
      </svg>
    </span>
  );
}

export interface HomeKeepOmenPipProps {
  state: GameState;
}

export function HomeKeepOmenPip({ state }: HomeKeepOmenPipProps) {
  const homeId = state.board?.homeProvinceId;
  if (!homeId) return null;
  const home = getProvince(state, homeId);
  if (!home) return null;

  const ev = activePeriodEvent(state);
  const active = ev !== null;
  const palette = resolveActiveOmenPalette(ev?.id, ev?.text);
  const { wx, wy } = boardGridToWorld(home.x, home.y);
  const cx = wx + 13;
  const cy = wy - 22;

  return (
    <g
      className={`sc-keep-omen-pip ${active ? "is-active" : "is-idle"} is-omen-${palette.variant} is-type-${palette.specificType}`}
      data-home-keep-omen="true"
      data-province-id={homeId}
      data-event-active={active ? "true" : "false"}
      data-event-id={ev?.id ?? "none"}
      data-omen-variant={palette.variant}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <radialGradient id="sc-keep-omen-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.auraInner} stopOpacity="0.78" />
          <stop offset="65%" stopColor={palette.auraOuter} stopOpacity="0.34" />
          <stop offset="100%" stopColor={palette.auraOuter} stopOpacity="0" />
        </radialGradient>
      </defs>

      {active && (
        <circle
          cx={cx}
          cy={cy}
          r={6.4}
          fill="url(#sc-keep-omen-grad)"
          className="sc-keep-omen-aura"
          style={{ pointerEvents: "none" }}
        />
      )}

      <g className="sc-keep-omen-body" style={{ pointerEvents: "none" }}>
        <circle
          cx={cx}
          cy={cy}
          r={3.4}
          fill={active ? palette.coreFill : "#334155"}
          stroke={active ? palette.ringStroke : "#64748b"}
          strokeWidth="0.75"
        />
        <circle
          cx={cx}
          cy={cy}
          r={2.1}
          fill={active ? "#0f172a" : "#1e293b"}
        />
        <polygon
          points={`${cx},${cy - 1.5} ${cx + 1.1},${cy} ${cx},${cy + 1.5} ${cx - 1.1},${cy}`}
          fill={active ? palette.innerFill : "#cbd5e1"}
        />
      </g>

      {active && (
        <circle
          cx={cx + 2.2}
          cy={cy - 2.2}
          r={0.9}
          fill={palette.sparkFill}
          className="sc-keep-omen-spark"
          style={{ pointerEvents: "none" }}
        />
      )}
    </g>
  );
}
