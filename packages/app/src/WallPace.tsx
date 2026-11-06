import React from "react";
import { buildTicksLeft, listWorksInProgress, wallHp, type GameState } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import "./wall-pace.css";

/** The next queued event that changes hold wall strength. Read-only. */
export interface WallChange {
  /** Sim ticks until it lands. */
  ticks: number;
  /** What lands. */
  source: "walls" | "gate";
}

/**
 * Earliest queued event that feeds `wallHp`: a player wall section or gate under construction.
 * Reads only sim helpers. Ties go walls, then gate.
 */
export function nextWallChange(state: GameState): WallChange | null {
  const found: WallChange[] = [];
  for (const b of listWorksInProgress(state, "player")) {
    if (b.typeId === "walls" || b.typeId === "gate") {
      found.push({ ticks: buildTicksLeft(state, b.id), source: b.typeId });
    }
  }
  if (!found.length) return null;
  return found.reduce((a, b) => (b.ticks < a.ticks || (b.ticks === a.ticks && b.source === "walls" && a.source === "gate") ? b : a));
}

const LABEL: Record<WallChange["source"], string> = {
  walls: "a wall section finishes",
  gate: "the gate finishes",
};

/** Sim ticks to whole seconds, same rounding as the build queue. */
function secs(ticks: number): number {
  return Math.ceil(ticks / TICKS_PER_SECOND);
}

export interface WallPaceGlyphPipProps {
  rising?: boolean;
  source?: "walls" | "gate";
  hp?: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Living wall pace glyph:
 * - rising: fortified golden stone rampart / gatehouse with crenellated merlons, mortar courses, radiant apex star, and breathing amber aura
 * - steady: calm slate stone curtain wall with quiet merlons, mortar joints, and center anchor pip
 */
export function WallPaceGlyphPip({
  rising = false,
  source,
  hp,
  size = 16,
  className = "",
  style,
}: WallPaceGlyphPipProps) {
  const paceClass = rising ? "is-rising" : "is-steady";
  const sourceClass = source ? ` is-source-${source}` : "";

  return (
    <span
      className={`sc-wall-pace-glyph-wrap ${paceClass}${sourceClass} ${className}`.trim()}
      style={{ width: size, height: size, pointerEvents: "none", ...style }}
      aria-hidden="true"
      data-wall={rising ? (source || "rising") : "steady"}
      data-source={source}
      data-hp={hp}
    >
      {rising && <span className="sc-wall-pace-aura" aria-hidden="true" />}
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className={`sc-wall-pace-glyph ${paceClass}`}
        style={{ pointerEvents: "none" }}
      >
        {rising ? (
          <>
            {/* Rising Wall: Fortified Golden Rampart / Gatehouse */}
            {/* Stone masonry foundation course */}
            <rect x="2" y="11.5" width="12" height="3" rx="0.5" fill="#78350f" stroke="#fbbf24" strokeWidth="0.8" />
            <line x1="8" y1="11.5" x2="8" y2="14.5" stroke="#fbbf24" strokeWidth="0.6" />

            {source === "gate" ? (
              <>
                {/* Gatehouse architecture */}
                {/* Left gate tower */}
                <rect x="2.5" y="4.5" width="3.5" height="7" rx="0.5" fill="#b45309" stroke="#fbbf24" strokeWidth="0.8" />
                <rect x="2.5" y="3.2" width="1.8" height="1.5" rx="0.3" fill="#fef08a" stroke="#b45309" strokeWidth="0.4" />
                {/* Right gate tower */}
                <rect x="10" y="4.5" width="3.5" height="7" rx="0.5" fill="#b45309" stroke="#fbbf24" strokeWidth="0.8" />
                <rect x="11.7" y="3.2" width="1.8" height="1.5" rx="0.3" fill="#fef08a" stroke="#b45309" strokeWidth="0.4" />

                {/* Central arched portal with portcullis */}
                <path d="M5.5 11.5 L5.5 7.5 C5.5 5.8 10.5 5.8 10.5 7.5 L10.5 11.5 Z" fill="#451a03" stroke="#fde047" strokeWidth="0.7" />
                <line x1="7.2" y1="6.8" x2="7.2" y2="11.5" stroke="#fde047" strokeWidth="0.6" />
                <line x1="8.8" y1="6.8" x2="8.8" y2="11.5" stroke="#fde047" strokeWidth="0.6" />
                <line x1="5.5" y1="9" x2="10.5" y2="9" stroke="#fde047" strokeWidth="0.6" />
              </>
            ) : (
              <>
                {/* Curtain wall architecture */}
                <rect x="2.5" y="5.5" width="11" height="6" rx="0.5" fill="#b45309" stroke="#fbbf24" strokeWidth="0.8" />
                {/* Mortar joints */}
                <line x1="2.5" y1="8.5" x2="13.5" y2="8.5" stroke="#fbbf24" strokeWidth="0.6" />
                <line x1="6.2" y1="5.5" x2="6.2" y2="8.5" stroke="#fbbf24" strokeWidth="0.6" />
                <line x1="9.8" y1="5.5" x2="9.8" y2="8.5" stroke="#fbbf24" strokeWidth="0.6" />
                <line x1="8" y1="8.5" x2="8" y2="11.5" stroke="#fbbf24" strokeWidth="0.6" />

                {/* 3 Crenellated merlons */}
                <rect x="2.5" y="3.6" width="2.4" height="2" rx="0.3" fill="#fef08a" stroke="#b45309" strokeWidth="0.5" />
                <rect x="6.8" y="3.6" width="2.4" height="2" rx="0.3" fill="#fef08a" stroke="#b45309" strokeWidth="0.5" />
                <rect x="11.1" y="3.6" width="2.4" height="2" rx="0.3" fill="#fef08a" stroke="#b45309" strokeWidth="0.5" />

                {/* Arrow slit embrasure */}
                <line x1="8" y1="9.2" x2="8" y2="10.8" stroke="#fef08a" strokeWidth="0.8" strokeLinecap="round" />
              </>
            )}

            {/* Radiant apex fortification diamond star */}
            <polygon
              points="8,0.8 8.6,2 9.8,2.3 8.8,3.2 9.1,4.4 8,3.7 6.9,4.4 7.2,3.2 6.2,2.3 7.4,2"
              fill="#fffbeb"
              stroke="#d97706"
              strokeWidth="0.3"
              className="sc-wall-pace-star"
            />
          </>
        ) : (
          <>
            {/* Steady Wall: Slate Stone Curtain Wall */}
            <rect x="2" y="11.5" width="12" height="3" rx="0.5" fill="#334155" stroke="#64748b" strokeWidth="0.8" />
            <rect x="2.5" y="6" width="11" height="5.5" rx="0.4" fill="#475569" stroke="#64748b" strokeWidth="0.8" />

            {/* Stone course lines */}
            <line x1="2.5" y1="8.8" x2="13.5" y2="8.8" stroke="#334155" strokeWidth="0.6" />
            <line x1="6.5" y1="6" x2="6.5" y2="8.8" stroke="#334155" strokeWidth="0.6" />
            <line x1="9.5" y1="6" x2="9.5" y2="8.8" stroke="#334155" strokeWidth="0.6" />

            {/* 3 quiet merlons */}
            <rect x="2.5" y="4.2" width="2.4" height="2" rx="0.3" fill="#64748b" stroke="#334155" strokeWidth="0.5" />
            <rect x="6.8" y="4.2" width="2.4" height="2" rx="0.3" fill="#64748b" stroke="#334155" strokeWidth="0.5" />
            <rect x="11.1" y="4.2" width="2.4" height="2" rx="0.3" fill="#64748b" stroke="#334155" strokeWidth="0.5" />

            {/* Center anchor pip */}
            <circle cx="8" cy="10" r="0.7" fill="#94a3b8" />
          </>
        )}
      </svg>
    </span>
  );
}

export function WallPace(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const hp = wallHp(state, "player");
  const next = nextWallChange(state);
  return (
    <p className={`sc-wall-pace${next ? " is-rising" : ""}`} data-wall={next ? next.source : "steady"}>
      <WallPaceGlyphPip
        rising={Boolean(next)}
        source={next?.source}
        hp={hp}
      />
      Wall pace · <strong>wall HP {hp}</strong>
      {next ? (
        <>
          {" "}· next change in <strong>{secs(next.ticks)}s</strong>: {LABEL[next.source]}
        </>
      ) : (
        " · no change queued"
      )}
      .
    </p>
  );
}
