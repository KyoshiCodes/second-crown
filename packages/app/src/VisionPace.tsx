import React from "react";
import {
  buildTicksLeft,
  keepLevel,
  keepVisionCultureBonus,
  listWorksInProgress,
  researchTicksLeft,
  visionRange,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import "./vision-pace.css";

/** The next queued event that changes hold vision. Read-only. */
export interface VisionChange {
  /** Sim ticks until it lands. */
  ticks: number;
  /** What lands. */
  source: "watchtower" | "surveying" | "keep";
}

/**
 * Earliest queued event that feeds `visionRange`: a player watchtower under construction,
 * the Surveying study on the lectern, or a first keep finishing when the culture grants keep vision.
 * Reads only sim helpers. Ties go in that order.
 */
export function nextVisionChange(state: GameState): VisionChange | null {
  const found: VisionChange[] = [];
  for (const b of listWorksInProgress(state, "player")) {
    if (b.typeId === "watchtower") found.push({ ticks: buildTicksLeft(state, b.id), source: "watchtower" });
  }
  const survey = researchTicksLeft(state, "surveying");
  if (survey > 0) found.push({ ticks: survey, source: "surveying" });
  if (keepLevel(state) === 0 && keepVisionCultureBonus(state, "player") > 0) {
    for (const b of listWorksInProgress(state, "player")) {
      if (b.typeId === "keep") found.push({ ticks: buildTicksLeft(state, b.id), source: "keep" });
    }
  }
  if (!found.length) return null;
  return found.reduce((a, b) => (b.ticks < a.ticks ? b : a));
}

const LABEL: Record<VisionChange["source"], string> = {
  watchtower: "a watchtower finishes",
  surveying: "Surveying study finishes",
  keep: "the keep finishes (culture keep vision)",
};

/** Sim ticks to whole seconds, same rounding as the build queue. */
function secs(ticks: number): number {
  return Math.ceil(ticks / TICKS_PER_SECOND);
}

export interface VisionPaceGlyphPipProps {
  rising?: boolean;
  source?: "watchtower" | "surveying" | "keep";
  range?: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Living vision pace glyph:
 * - rising: radiant horizon aperture with sighting pupil, source charge (watchtower battlements, surveying meridian, keep crown), radiant apex beacon star, and breathing cyan aura
 * - steady: calm slate horizon eye with steady iris, reference line, and quiet alignment pips
 */
export function VisionPaceGlyphPip({
  rising = false,
  source,
  range,
  size = 16,
  className = "",
  style,
}: VisionPaceGlyphPipProps) {
  const paceClass = rising ? "is-rising" : "is-steady";
  const sourceClass = source ? ` is-source-${source}` : "";

  return (
    <span
      className={`sc-vision-pace-glyph-wrap ${paceClass}${sourceClass} ${className}`.trim()}
      style={{ width: size, height: size, pointerEvents: "none", ...style }}
      aria-hidden="true"
      data-vision={rising ? (source || "rising") : "steady"}
      data-source={source}
      data-range={range}
    >
      {rising && <span className="sc-vision-pace-aura" aria-hidden="true" />}
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className={`sc-vision-pace-glyph ${paceClass}`}
        style={{ pointerEvents: "none" }}
      >
        {rising ? (
          <>
            {/* Rising Vision: Radiant Horizon Aperture & Scout Beacon */}
            {/* Outer scout eye aperture */}
            <path
              d="M2.2 8.5 C4.2 4.8 11.8 4.8 13.8 8.5 C11.8 12.2 4.2 12.2 2.2 8.5 Z"
              fill="rgba(14, 165, 233, 0.15)"
              stroke="#7dd3fc"
              strokeWidth="0.9"
            />
            {/* Horizon lateral crosshair rays */}
            <line x1="1" y1="8.5" x2="2.6" y2="8.5" stroke="#7dd3fc" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="13.4" y1="8.5" x2="15" y2="8.5" stroke="#7dd3fc" strokeWidth="0.8" strokeLinecap="round" />

            {/* Central glowing pupil iris */}
            <circle cx="8" cy="8.5" r="2.2" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.6" />
            <circle cx="8" cy="8.5" r="1.1" fill="#f0f9ff" />

            {/* Source-specific crest charges */}
            {source === "watchtower" && (
              /* Watchtower battlement crown */
              <path
                d="M5.5 4.2 L5.5 2.8 L6.7 2.8 L6.7 3.4 L9.3 3.4 L9.3 2.8 L10.5 2.8 L10.5 4.2 Z"
                fill="#bae6fd"
                stroke="#0284c7"
                strokeWidth="0.4"
              />
            )}
            {source === "surveying" && (
              /* Surveying sighting cross / compass meridian */
              <>
                <line x1="8" y1="2" x2="8" y2="4.5" stroke="#bae6fd" strokeWidth="0.9" strokeLinecap="round" />
                <line x1="6.8" y1="3.2" x2="9.2" y2="3.2" stroke="#bae6fd" strokeWidth="0.8" strokeLinecap="round" />
              </>
            )}
            {source === "keep" && (
              /* Keep bastion coronet */
              <path
                d="M5.8 4.2 L6.9 2.5 L8 3.5 L9.1 2.5 L10.2 4.2 Z"
                fill="#bae6fd"
                stroke="#0284c7"
                strokeWidth="0.4"
              />
            )}

            {/* Radiant apex beacon star */}
            <polygon
              points="8,0.9 8.6,2.1 9.8,2.4 8.8,3.3 9.1,4.5 8,3.8 6.9,4.5 7.2,3.3 6.2,2.4 7.4,2.1"
              fill="#ffffff"
              stroke="#0284c7"
              strokeWidth="0.3"
              className="sc-vision-pace-star"
            />
          </>
        ) : (
          <>
            {/* Steady Vision: Slate Horizon Eye & Sighting Pips */}
            {/* Quiet horizon eye contour */}
            <path
              d="M2.8 8.5 C4.6 5.8 11.4 5.8 13.2 8.5 C11.4 11.2 4.6 11.2 2.8 8.5 Z"
              fill="none"
              stroke="#64748b"
              strokeWidth="0.9"
            />
            {/* Steady center pupil */}
            <circle cx="8" cy="8.5" r="1.8" fill="#334155" stroke="#64748b" strokeWidth="0.6" />
            <circle cx="8" cy="8.5" r="0.8" fill="#94a3b8" />

            {/* Lateral reference ticks */}
            <line x1="1.4" y1="8.5" x2="2.8" y2="8.5" stroke="#475569" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="13.2" y1="8.5" x2="14.6" y2="8.5" stroke="#475569" strokeWidth="0.8" strokeLinecap="round" />

            {/* Vertical alignment pips */}
            <circle cx="8" cy="3.5" r="0.6" fill="#64748b" />
            <circle cx="8" cy="13.5" r="0.6" fill="#64748b" />
          </>
        )}
      </svg>
    </span>
  );
}

export function VisionPace(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const range = visionRange(state);
  const next = nextVisionChange(state);
  return (
    <p className={`sc-vision-pace${next ? " is-rising" : ""}`} data-vision={next ? next.source : "steady"}>
      <VisionPaceGlyphPip
        rising={Boolean(next)}
        source={next?.source}
        range={range}
      />
      Vision pace · <strong>range {range}</strong>
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
