import React from "react";
import type { StudyStatus } from "./StudyLedger";
import { getResearchDiscipline, type ResearchDiscipline } from "./AcademyLivingGlyph";
import "./research-glyph-advanced.css";

export type ResearchGlyphState = "locked" | "available" | "studying" | "completed";

export interface ResearchGlyphAdvancedProps {
  /** Sim research topic id (e.g. "husbandry", "forestry", "masonry", etc.) */
  topicId?: string;
  /** Explicit state override; otherwise resolved from status / progress / done */
  state?: ResearchGlyphState;
  /** Sim study status ("known" | "studying" | "open" | "locked") */
  status?: StudyStatus;
  /** Research progress (0.0 to 1.0) */
  progress?: number;
  /** Whether the study is complete */
  done?: boolean;
  /** Whether an Academy speed buff (-20%) is active */
  academyFast?: boolean;
  /** Render size in pixels (default 24) */
  size?: number;
  /** Optional custom CSS class name */
  className?: string;
  /** Optional custom inline style */
  style?: React.CSSProperties;
}

/**
 * Resolves the canonical research glyph state from available props.
 */
export function resolveResearchGlyphState(input: {
  status?: StudyStatus;
  state?: ResearchGlyphState;
  progress?: number;
  done?: boolean;
}): ResearchGlyphState {
  if (input.state) return input.state;
  if (input.done || input.status === "known" || (input.progress !== undefined && input.progress >= 1)) {
    return "completed";
  }
  if (input.status === "studying" || (input.progress !== undefined && input.progress > 0 && input.progress < 1)) {
    return "studying";
  }
  if (input.status === "locked") {
    return "locked";
  }
  return "available";
}

/**
 * Reusable living SVG state layer rendered atop research emblems.
 * Provides distinct animated vectors for:
 * - "locked": iron padlock shackle arch, studded body, keyhole, and chain drift
 * - "available": radiant 4-point discovery diamond spark and expanding beacon ripple
 * - "studying": circular ink progress ring, flickering scholar lamp flame, and transcription motes
 * - "completed": master scholar laurel wreath, leaf clusters, and celestial triumph star
 */
export function ResearchStateSvgLayer(props: {
  status?: StudyStatus;
  state?: ResearchGlyphState;
  progress?: number;
}) {
  const glyphState = resolveResearchGlyphState({
    status: props.status,
    state: props.state,
    progress: props.progress,
  });

  if (glyphState === "locked") {
    return (
      <g className="sc-research-state-layer sc-research-state-locked">
        {/* Arched hardened iron padlock shackle */}
        <path
          d="M9 10.5 V6.8 C9 5.2 10.3 3.8 12 3.8 C13.7 3.8 15 5.2 15 6.8 V10.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          className="sc-research-lock-shackle"
        />
        {/* Reinforced iron lock casing */}
        <rect
          x="8.5"
          y="10"
          width="7"
          height="5.5"
          rx="1.1"
          fill="currentColor"
          fillOpacity="0.34"
          stroke="currentColor"
          strokeWidth="1.15"
          className="sc-research-lock-casing"
        />
        {/* Padlock keyhole */}
        <circle cx="12" cy="12" r="0.75" fill="currentColor" className="sc-research-lock-keyhole-rim" />
        <path d="M12 12.4 V13.8" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" className="sc-research-lock-keyhole-stem" />
      </g>
    );
  }

  if (glyphState === "available") {
    return (
      <g className="sc-research-state-layer sc-research-state-available">
        {/* Pulsing beacon radar ripple ring */}
        <circle
          cx="19.5"
          cy="4.5"
          r="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="2 1.4"
          className="sc-research-available-beacon"
        />
        {/* Radiant 4-point discovery diamond spark */}
        <polygon
          points="19.5,2 20.3,3.7 22,4.5 20.3,5.3 19.5,7 18.7,5.3 17,4.5 18.7,3.7"
          fill="currentColor"
          className="sc-research-available-spark"
        />
        <circle cx="19.5" cy="4.5" r="0.75" fill="#ffffff" opacity="0.95" className="sc-research-available-core" />
      </g>
    );
  }

  if (glyphState === "completed") {
    return (
      <g className="sc-research-state-layer sc-research-state-completed">
        {/* Master scholar laurel wreath arc */}
        <path
          d="M3.8 14 C3.8 18.4 7.4 21.4 12 21.4 C16.6 21.4 20.2 18.4 20.2 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          className="sc-research-completed-wreath"
        />
        {/* Laurel wreath leaf berries */}
        <circle cx="4.8" cy="16.2" r="0.85" fill="currentColor" className="sc-research-wreath-leaf" />
        <circle cx="19.2" cy="16.2" r="0.85" fill="currentColor" className="sc-research-wreath-leaf" />
        <circle cx="7.8" cy="20.1" r="0.8" fill="currentColor" className="sc-research-wreath-leaf" />
        <circle cx="16.2" cy="20.1" r="0.8" fill="currentColor" className="sc-research-wreath-leaf" />
        {/* Master celestial knowledge triumph star */}
        <polygon
          points="12,1.2 12.8,3.2 14.8,4 12.8,4.8 12,6.8 11.2,4.8 9.2,4 11.2,3.2"
          fill="currentColor"
          className="sc-research-completed-star"
        />
        <circle cx="12" cy="4" r="0.75" fill="#ffffff" opacity="0.95" className="sc-research-completed-core" />
      </g>
    );
  }

  if (glyphState === "studying") {
    const clampedProgress = Math.min(1, Math.max(0, props.progress ?? 0));
    return (
      <g className="sc-research-state-layer sc-research-state-studying">
        {/* Radial ink progress ring */}
        {props.progress !== undefined ? (
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeDasharray="62.8"
            strokeDashoffset={62.8 * (1 - clampedProgress)}
            className="sc-research-ink-progress-ring"
            opacity="0.88"
          />
        ) : null}
        {/* Flickering scholar lamp flame at apex */}
        <path
          d="M12 2 C13.2 3.6 13.4 5 12 5.8 C10.6 5 10.8 3.6 12 2 Z"
          fill="currentColor"
          className="sc-research-studying-flame"
        />
        <circle cx="12" cy="4" r="0.7" fill="#ffffff" opacity="0.8" className="sc-research-studying-core" />
      </g>
    );
  }

  return null;
}

/**
 * Generic scholar codex emblem when no specific topicId is provided.
 */
function GenericCodexSvg() {
  return (
    <>
      <circle className="sc-academy-glow-layer sc-research-glow-layer" cx="12" cy="12" r="7.8" fill="currentColor" opacity="0.18" />
      <g className="sc-academy-drift-layer sc-research-drift-layer">
        <path
          d="M4.6 7.4 C7.4 6.6 10.2 7.2 12 8.6 C13.8 7.2 16.6 6.6 19.4 7.4 V16.4 C16.6 15.6 13.8 16.2 12 17.6 C10.2 16.2 7.4 15.6 4.6 16.4 Z"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <path d="M12 8.6 V17.6 M8.6 19.8 H15.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      <g className="sc-academy-pulse-layer sc-research-pulse-layer">
        <circle cx="12" cy="4.8" r="1.2" fill="currentColor" />
      </g>
    </>
  );
}

/**
 * Living Advanced Research Glyph (24px default or customizable).
 * Displays rich, animated vector states:
 * - Locked: iron padlock shackle, lock casing, keyhole, and metallic vigilance breathing
 * - Available: radiant discovery spark, expanding beacon wave, welcoming inquiry pulse
 * - Studying: circular ink progress ring, flickering scholar lamp flame, and warm amber glow
 * - Completed: master scholar laurel wreath, celestial star of triumph, and sovereign golden corona
 *
 * GUARANTEE: strictly phrasing-only markup (<span> + <svg>), aria-hidden="true",
 * and pointer-events: none on all decorative layers.
 */
export function ResearchGlyphAdvanced(props: ResearchGlyphAdvancedProps) {
  const {
    topicId,
    state: explicitState,
    status,
    progress,
    done,
    academyFast = false,
    size = 24,
    className = "",
    style,
  } = props;

  const glyphState = resolveResearchGlyphState({
    status,
    state: explicitState,
    progress,
    done,
  });

  const discipline: ResearchDiscipline | undefined = topicId ? getResearchDiscipline(topicId) : undefined;
  const pct = progress !== undefined ? Math.round(Math.min(1, Math.max(0, progress)) * 100) : undefined;

  return (
    <span
      className={`sc-research-glyph-advanced is-${glyphState} state-${glyphState}${academyFast ? " is-fast" : ""}${discipline ? ` discipline-${discipline}` : ""} ${className}`.trim()}
      aria-hidden="true"
      data-research-state={glyphState}
      data-research-topic={topicId ?? undefined}
      data-progress={pct}
      style={{
        width: size,
        height: size,
        ...style,
      }}
    >
      {/* Layer 1: Atmospheric ambient aura */}
      <span className="sc-research-advanced-aura" aria-hidden="true" />

      {/* Layer 2 & 3: Living SVG emblem + state vector heraldry */}
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className="sc-research-advanced-svg"
        focusable="false"
      >
        <GenericCodexSvg />
        <ResearchStateSvgLayer status={status} state={glyphState} progress={progress} />
      </svg>
    </span>
  );
}

export const ResearchAdvancedGlyph = ResearchGlyphAdvanced;
export const LivingResearchGlyph = ResearchGlyphAdvanced;
