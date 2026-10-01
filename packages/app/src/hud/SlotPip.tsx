import React from "react";
import {
  maxMarches,
  listMarches,
  listGathers,
  type GameState,
} from "@second-crown/sim";
import "./slot-pip.css";

export interface SlotPipProps {
  /** True when a column is deployed/out in the field; false when slot is vacant/home */
  filled?: boolean;
  /** Size in pixels (default: 16) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Small stall/post pip (16px default):
 * - Represents a military column stall / hitching muster post.
 * - Empty (at home / vacant slot): Sturdy dormant wooden post and stall crossbar, cold iron ring, quiet camp frame.
 * - Filled (column out on the march): Column standard raised high with red-and-gold swallowtail war pennant,
 *   gleaming gold spearhead finial, warm glowing beacon spark, and active tether.
 * GUARANTEE: strictly pointer-events: none so clicks are never intercepted.
 */
export function SlotPip({
  filled = false,
  size = 16,
  className = "",
  style,
  title,
}: SlotPipProps) {
  const statusClass = filled ? "is-filled" : "is-empty";
  const defaultTitle = filled ? "Column deployed (slot filled)" : "Column at home (slot free)";

  return (
    <span
      className={`sc-slot-pip-wrapper ${statusClass} ${className}`}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
      title={title ?? defaultTitle}
      data-filled={filled}
      data-slot-kind="stall-post"
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className={`sc-slot-pip ${statusClass}`}
        style={{ pointerEvents: "none", display: "block" }}
      >
        {filled ? <FilledStallPostSvg /> : <EmptyStallPostSvg />}
      </svg>
    </span>
  );
}

export const StallSlotPip = SlotPip;

function EmptyStallPostSvg() {
  return (
    <g className="sc-stall-post-empty">
      {/* 1. Base stone footing / threshold */}
      <line x1="2.5" y1="15" x2="13.5" y2="15" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" />

      {/* 2. Side stall upright posts */}
      <line x1="3.5" y1="7" x2="3.5" y2="14.5" stroke="#3b2314" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="12.5" y1="7" x2="12.5" y2="14.5" stroke="#3b2314" strokeWidth="1.1" strokeLinecap="round" />

      {/* 3. Stall crossbar / hitch rail */}
      <line x1="3.5" y1="9.5" x2="12.5" y2="9.5" stroke="#4a2e1b" strokeWidth="1.1" strokeLinecap="round" />

      {/* 4. Center muster post */}
      <rect x="7" y="5.5" width="2" height="9" rx="0.4" fill="#3b2314" stroke="#1f1109" strokeWidth="0.5" />

      {/* 5. Flat timber post cap (dormant, no standard) */}
      <rect x="6.5" y="4.5" width="3" height="1.2" rx="0.4" fill="#4a2e1b" stroke="#1f1109" strokeWidth="0.5" />

      {/* 6. Cold iron hitching ring */}
      <circle cx="4.5" cy="11.5" r="1.2" fill="none" stroke="#475569" strokeWidth="0.8" />
    </g>
  );
}

function FilledStallPostSvg() {
  return (
    <g className="sc-stall-post-filled">
      {/* 1. Base stone foundation */}
      <line x1="2.5" y1="15" x2="13.5" y2="15" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />

      {/* 2. Side stall upright posts */}
      <line x1="3.5" y1="6.5" x2="3.5" y2="14.5" stroke="#78350f" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="12.5" y1="6.5" x2="12.5" y2="14.5" stroke="#78350f" strokeWidth="1.1" strokeLinecap="round" />

      {/* 3. Stall crossbar / hitch rail */}
      <line x1="3.5" y1="9" x2="12.5" y2="9" stroke="#92400e" strokeWidth="1.2" strokeLinecap="round" />

      {/* 4. Center muster post with warm wood highlight */}
      <rect x="7" y="5" width="2" height="9.5" rx="0.4" fill="#78350f" stroke="#3d1d06" strokeWidth="0.5" />
      <line x1="8" y1="5.5" x2="8" y2="14" stroke="#f59e0b" strokeWidth="0.7" />

      {/* 5. Active iron hitching ring with harness strap */}
      <circle cx="4.5" cy="11.5" r="1.3" fill="none" stroke="#f59e0b" strokeWidth="0.8" />
      <line x1="4.5" y1="12.5" x2="5.5" y2="14" stroke="#d97706" strokeWidth="0.7" strokeLinecap="round" />

      {/* 6. Raised banner pole extending upward */}
      <line x1="8" y1="1" x2="8" y2="5" stroke="#d4a359" strokeWidth="1" strokeLinecap="round" />

      {/* 7. Fluttering swallowtail crimson/gold column pennant */}
      <path d="M8 1.8h6.2l-1.8 1.8 1.8 1.8H8V1.8z" fill="#dc2626" stroke="#facc15" strokeWidth="0.5" />
      <line x1="8.5" y1="3.6" x2="11.5" y2="3.6" stroke="#fef08a" strokeWidth="0.5" />

      {/* 8. Gleaming gold spearhead finial */}
      <polygon points="8,0.5 9.3,2.2 6.7,2.2" fill="#facc15" stroke="#b45309" strokeWidth="0.3" />

      {/* 9. Beacon spark / warm torch halo */}
      <circle cx="8" cy="1.6" r="2.4" fill="#f59e0b" opacity="0.3" />
      <circle cx="8" cy="1.6" r="1.2" fill="#fef08a" />
    </g>
  );
}

export interface SlotPipsProps {
  state?: GameState;
  /** Explicit override for filled slots count */
  filled?: number;
  /** Explicit override for max slots count */
  max?: number;
  /** Size for each individual pip (default: 16, compact: 13) */
  size?: number;
  /** Compact presentation (e.g. for tab button) */
  compact?: boolean;
  /** Whether to render the N/max text label (default: true) */
  showLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** Returns the number of currently active player column slots (marches + gathers) */
export function getFilledSlots(state: GameState | undefined): number {
  if (!state) return 0;
  const marches = listMarches(state).filter((m) => m.realmId === "player").length;
  const gathers = listGathers(state).filter((g) => g.realmId === "player").length;
  return marches + gathers;
}

/** Returns the maximum number of column slots for the player realm */
export function getMaxSlots(state: GameState | undefined): number {
  if (!state) return 1;
  return Math.max(1, maxMarches(state));
}

/** Returns { filled, max } column slots */
export function getColumnSlots(state: GameState | undefined): { filled: number; max: number } {
  return {
    filled: getFilledSlots(state),
    max: getMaxSlots(state),
  };
}

/**
 * On War, shows N/max column slots as small stall/post pips (filled = a column out).
 * GUARANTEE: strictly pointer-events: none on all elements.
 */
export function SlotPips({
  state,
  filled: explicitFilled,
  max: explicitMax,
  size,
  compact = false,
  showLabel = true,
  className = "",
  style,
}: SlotPipsProps) {
  const derived = getColumnSlots(state);
  const filled = explicitFilled !== undefined ? explicitFilled : derived.filled;
  const max = explicitMax !== undefined ? explicitMax : derived.max;
  const pipSize = size ?? (compact ? 13 : 16);
  const totalPips = Math.max(max, filled);

  const title = `${filled}/${max} column slots (${filled} out)`;

  return (
    <span
      className={`sc-slot-pips ${compact ? "is-compact" : ""} ${className}`}
      style={{
        pointerEvents: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 3 : 5,
        ...style,
      }}
      title={title}
      data-slot-pips={`${filled}/${max}`}
      data-filled-count={filled}
      data-max-count={max}
    >
      {showLabel && (
        <span
          className="sc-slot-pips-label"
          style={{
            pointerEvents: "none",
            fontSize: compact ? 10.5 : 12,
            fontWeight: 600,
            color: filled >= max ? "#f87171" : "#d4a359",
            opacity: compact ? 0.9 : 1,
            letterSpacing: "0.3px",
            lineHeight: 1,
          }}
        >
          {filled}/{max}
        </span>
      )}
      <span
        className="sc-slot-pips-row"
        style={{
          pointerEvents: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: compact ? 2 : 3,
        }}
      >
        {Array.from({ length: totalPips }).map((_, i) => (
          <SlotPip
            key={i}
            filled={i < filled}
            size={pipSize}
            title={i < filled ? `Slot ${i + 1}: column deployed` : `Slot ${i + 1}: stall vacant`}
          />
        ))}
      </span>
    </span>
  );
}

export const ColumnSlotPips = SlotPips;
