import React from "react";
import { DECREES, decreeActive, type GameState } from "@second-crown/sim";
import "./decree-hint.css";

type Decree = (typeof DECREES)[number];

export interface DecreeSealPipProps {
  decreeId?: string;
  ready?: boolean;
  isDone?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Living royal decree seal:
 * - ready: warm molten golden-vermilion wax seal with breathing aura, decree signet emblem, and twinkling glint
 * - locked: deep carmine pressed wax seal with indented matrix and steady ribbons
 * - done: imperial triumph crown seal with master scholar laurels
 */
export function DecreeSealPip({
  decreeId,
  ready = false,
  isDone = false,
  size = 16,
  className = "",
  style,
}: DecreeSealPipProps) {
  const statusClass = isDone ? "is-done" : ready ? "is-ready" : "is-locked";
  return (
    <span
      className={`sc-decree-seal-wrap ${statusClass} ${decreeId ? `is-${decreeId}` : ""} ${className}`.trim()}
      style={{ width: size, height: size, pointerEvents: "none", ...style }}
      aria-hidden="true"
      data-decree-seal={decreeId ?? (isDone ? "done" : "hint")}
      data-ready={ready ? "true" : "false"}
    >
      {ready && <span className="sc-decree-seal-aura" aria-hidden="true" />}
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className={`sc-decree-seal ${statusClass}`}
        style={{ pointerEvents: "none" }}
      >
        {/* Hanging royal ribbon tails underneath seal */}
        <g className="sc-decree-seal-ribbons">
          <polygon
            points="5.5,10 4,15.5 6,14.5 7.5,15.5 7,10"
            fill={ready || isDone ? "#b45309" : "#7f1d1d"}
            stroke={ready || isDone ? "#78350f" : "#450a0a"}
            strokeWidth="0.5"
          />
          <polygon
            points="9,10 8.5,15.5 10,14.5 12,15.5 10.5,10"
            fill={ready || isDone ? "#d97706" : "#991b1b"}
            stroke={ready || isDone ? "#92400e" : "#450a0a"}
            strokeWidth="0.5"
          />
        </g>

        {/* Poured wax puddle: organic scalloped matrix rim */}
        <path
          d="M8 2 C9.2 2 10.1 2.4 11 3 C11.9 3.6 12.5 4.4 13 5.3 C13.5 6.2 13.6 7.2 13.5 8.2 C13.3 9.2 12.8 10.1 12.1 10.8 C11.3 11.6 10.3 12.1 9.3 12.4 C8.4 12.5 7.6 12.5 6.7 12.4 C5.7 12.1 4.7 11.6 3.9 10.8 C3.2 10.1 2.7 9.2 2.5 8.2 C2.4 7.2 2.5 6.2 3 5.3 C3.5 4.4 4.1 3.6 5 3 C5.9 2.4 6.8 2 8 2 Z"
          fill={ready || isDone ? "#d97706" : "#991b1b"}
          stroke={ready || isDone ? "#92400e" : "#5c0a0a"}
          strokeWidth="0.6"
        />

        {/* Stamped outer circular ridge */}
        <circle
          cx="8"
          cy="7.5"
          r="5"
          fill={ready || isDone ? "#f59e0b" : "#b91c1c"}
          stroke={ready || isDone ? "#b45309" : "#450a0a"}
          strokeWidth="0.6"
        />

        {/* Inner pressed matrix depression */}
        <circle
          cx="8"
          cy="7.5"
          r="4.2"
          fill={ready || isDone ? "#fbbf24" : "#7f1d1d"}
        />

        {/* Milled beaded matrix border */}
        <circle
          cx="8"
          cy="7.5"
          r="3.6"
          fill="none"
          stroke={ready || isDone ? "#b45309" : "#5c0a0a"}
          strokeWidth="0.4"
          strokeDasharray="0.8,0.8"
        />

        {/* Central Signet Charge */}
        {isDone ? (
          <>
            {/* Imperial Crown Triumph Signet */}
            <path
              d="M5.5 9.2 L6 6.2 L8 7.5 L10 6.2 L10.5 9.2 Z"
              fill="#fffbeb"
              stroke="#b45309"
              strokeWidth="0.5"
            />
            <circle cx="8" cy="5.8" r="0.7" fill="#fef08a" />
          </>
        ) : decreeId === "muster" ? (
          <>
            {/* Crossed Martial Blades */}
            <path
              d="M5.5 5.2 L10.5 9.8 M5.2 6.2 L6.2 5.2"
              stroke={ready ? "#ffffff" : "#fca5a5"}
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <path
              d="M10.5 5.2 L5.5 9.8 M10.8 6.2 L9.8 5.2"
              stroke={ready ? "#ffffff" : "#fca5a5"}
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </>
        ) : decreeId === "rite" ? (
          <>
            {/* Golden Harvest Wheat Sheaf */}
            <path
              d="M8 10.2 L8 5 M6.2 5.8 C6.8 6.6 8 7.2 8 7.2 M9.8 5.8 C9.2 6.6 8 7.2 8 7.2 M6.8 4.5 C7.4 5.2 8 5.8 8 5.8 M9.2 4.5 C8.6 5.2 8 5.8 8 5.8 M8 4 L8 5"
              stroke={ready ? "#ffffff" : "#fef08a"}
              strokeWidth="1.0"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : decreeId === "envoys" ? (
          <>
            {/* Diplomatic Parchment Treaty Scroll */}
            <rect
              x="5.6"
              y="5.8"
              width="4.8"
              height="3.4"
              rx="0.6"
              fill={ready ? "#fffbeb" : "#f8fafc"}
              stroke={ready ? "#b45309" : "#475569"}
              strokeWidth="0.6"
            />
            <path
              d="M7.2 5.8 L7.2 9.2 M8.8 5.8 L8.8 9.2"
              stroke={ready ? "#b45309" : "#64748b"}
              strokeWidth="0.5"
            />
          </>
        ) : (
          <>
            {/* Royal Crown Signet */}
            <path
              d="M5.8 9 L6.2 6.4 L8 7.6 L9.8 6.4 L10.2 9 Z"
              fill={ready ? "#fffbeb" : "#fca5a5"}
              stroke={ready ? "#b45309" : "#450a0a"}
              strokeWidth="0.5"
            />
          </>
        )}

        {/* Apex Wax Glint / Star */}
        {ready && (
          <path
            d="M8 1.8 L8.5 2.8 L9.5 3.3 L8.5 3.8 L8 4.8 L7.5 3.8 L6.5 3.3 L7.5 2.8 Z"
            fill="#ffffff"
            className="sc-decree-seal-star"
          />
        )}
      </svg>
    </span>
  );
}

/** Cost exactly as the sim table lists it, e.g. "40 gold". */
export function decreeCostText(decree: Decree): string {
  return Object.entries(decree.cost)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ");
}

function affordable(state: GameState, decree: Decree): boolean {
  // Same stock check as DecreeCard: compare stores against listed cost. No new rules.
  return Object.entries(decree.cost).every(([res, amt]) => Number(state.resources[res] ?? "0") >= Number(amt));
}

/**
 * Next decree to point at: the first one in table order that is not active,
 * preferring one the stores can cover now. Read-only.
 */
export function nextDecree(state: GameState): { decree: Decree; ready: boolean } | null {
  const open = DECREES.filter((d) => !decreeActive(state, d.id));
  const ready = open.find((d) => affordable(state, d));
  if (ready) return { decree: ready, ready: true };
  return open.length ? { decree: open[0], ready: false } : null;
}

export function DecreeHint(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const next = nextDecree(state);
  if (!next) {
    return (
      <p className="sc-decree-hint is-done">
        <DecreeSealPip isDone ready={false} />
        Next decree · every decree already sworn.
      </p>
    );
  }
  const { decree, ready } = next;
  return (
    <p className={`sc-decree-hint${ready ? " is-ready" : ""}`} data-decree={decree.id}>
      <DecreeSealPip decreeId={decree.id} ready={ready} />
      Next decree · <strong>{decree.name}</strong> · {decreeCostText(decree)}
      {ready ? "" : " · not enough in stores"}. Swear it on the Crown tab.
    </p>
  );
}
