import React from "react";
import type { StudyStatus } from "./StudyLedger";
import "./research-ink-pip.css";

export type InkStage =
  | "locked"
  | "open"
  | "stage-1"
  | "stage-2"
  | "stage-3"
  | "stage-4"
  | "known";

export interface ResearchInkPipProps {
  /** Normalized progress from 0.0 (not started) to 1.0 (codified / complete). */
  progress?: number;
  /** Study status from sim state. */
  status?: StudyStatus;
  /** Topic ID for contextual discipline tinting. */
  topicId?: string;
  /** Display size in pixels (default: 20). */
  size?: number;
  /** Whether to render the 4-bead progressive ink droplet indicator (default: false). */
  showDrops?: boolean;
  /** Optional custom CSS class name. */
  className?: string;
  /** Optional custom inline style. */
  style?: React.CSSProperties;
  /** Accessible title override (defaults to auto-generated progress status). */
  title?: string;
}

/**
 * Calculates normalized 0..1 research progress from ticks.
 */
export function calcResearchProgress(options: {
  done?: boolean;
  ticksLeft?: number;
  ticksTotal?: number;
  duration?: number;
}): number {
  const { done, ticksLeft = 0, ticksTotal = 0, duration = 0 } = options;
  if (done) return 1;
  if (ticksLeft <= 0) return 0;
  const total = ticksTotal > 0 ? ticksTotal : duration > 0 ? duration : ticksLeft;
  if (total <= 0) return 0;
  const p = 1 - ticksLeft / total;
  return Math.min(1, Math.max(0, p));
}

/**
 * Maps progress and status to an ink stage.
 */
export function resolveInkStage(progress: number, status?: StudyStatus): InkStage {
  if (status === "known" || progress >= 1) return "known";
  if (status === "locked" && progress <= 0) return "locked";
  if ((status === "open" || status === undefined) && progress <= 0) return "open";
  if (progress <= 0.25) return "stage-1";
  if (progress <= 0.5) return "stage-2";
  if (progress <= 0.75) return "stage-3";
  return "stage-4";
}

/**
 * Returns a concise human-readable description of current ink state.
 */
export function formatInkStatus(progress: number, status?: StudyStatus): string {
  if (status === "known" || progress >= 1) return "Mastered · illuminated gold ink";
  if (status === "locked" && progress <= 0) return "Sealed · dry stone inkpot";
  if ((status === "open" || status === undefined) && progress <= 0) return "Open lectern · fresh ink ready";
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return `Studying · ${pct}% inked`;
}

/**
 * Four progressive ink droplets showing fractional research completion.
 * - Drop 1: 0% - 25%
 * - Drop 2: 25% - 50%
 * - Drop 3: 50% - 75%
 * - Drop 4: 75% - 100%
 */
export function ResearchInkDroplets({
  progress = 0,
  status = "open",
}: {
  progress?: number;
  status?: StudyStatus;
}) {
  const isKnown = status === "known" || progress >= 1;
  const thresholds = [0.25, 0.5, 0.75, 1.0];

  return (
    <span className="sc-ink-droplet-track" aria-hidden="true">
      {thresholds.map((th, idx) => {
        const prevTh = idx === 0 ? 0 : thresholds[idx - 1];
        const isFilled = isKnown || progress >= th;
        const isActive = !isKnown && progress > prevTh && progress < th;
        const dropState = isFilled ? "filled" : isActive ? "active" : "empty";

        return (
          <span
            key={idx}
            className={`sc-ink-drop is-${dropState}`}
            data-drop-index={idx + 1}
            data-drop-state={dropState}
          >
            <svg viewBox="0 0 8 10" className="sc-ink-drop-svg" focusable="false">
              <path
                d="M4 1 C4 1 1 5 1 7.2 C1 8.8 2.3 9.5 4 9.5 C5.7 9.5 7 8.8 7 7.2 C7 5 4 1 4 1 Z"
                className="sc-ink-drop-body"
              />
              {isFilled || isActive ? (
                <circle cx="3" cy="6.5" r="0.8" className="sc-ink-drop-glint" />
              ) : null}
            </svg>
          </span>
        );
      })}
    </span>
  );
}

/**
 * Living inkpot & quill pip that dynamically reflects research progress.
 * As research progresses:
 * - Fluid ink level physically rises within the stoneware inkwell.
 * - Dipping quill feather animates with active writing rhythm.
 * - Scriptorium ink motes and ripples drift from wet parchment.
 * - At completion: transitions to a glowing royal gold illuminated seal.
 */
export function ResearchInkPip({
  progress = 0,
  status,
  topicId,
  size = 20,
  showDrops = false,
  className = "",
  style,
  title,
}: ResearchInkPipProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const stage = resolveInkStage(clampedProgress, status);
  const isStudying = stage.startsWith("stage-");
  const isKnown = stage === "known";
  const isLocked = stage === "locked";
  const pct = Math.round(clampedProgress * 100);
  const statusLabel = title ?? formatInkStatus(clampedProgress, status);

  // SVG ink height inside inkwell reservoir (reservoir runs from y=12 to y=18, height=6)
  // At progress 0: fillHeight = 0.5 (dry residue)
  // At progress 1.0: fillHeight = 6 (full reservoir)
  const reservoirBottom = 18;
  const reservoirMaxHeight = 6.2;
  const fluidHeight = isKnown
    ? reservoirMaxHeight
    : isLocked
      ? 0
      : Math.max(0.6, clampedProgress * reservoirMaxHeight);
  const fluidY = reservoirBottom - fluidHeight;

  return (
    <span
      className={`sc-research-ink-pip sc-ink-pip-wrapper is-${stage}${isStudying ? " is-studying" : ""}${isKnown ? " is-known" : ""}${isLocked ? " is-locked" : ""} ${className}`.trim()}
      aria-hidden="true"
      title={statusLabel}
      data-ink-pip="true"
      data-ink-stage={stage}
      data-progress={pct}
      data-status={status ?? (isKnown ? "known" : isStudying ? "studying" : "open")}
      data-topic={topicId ?? undefined}
      style={{
        ...style,
        width: showDrops ? undefined : size,
        height: size,
      }}
    >
      <span className="sc-ink-pot-container" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 24 24"
          className="sc-ink-pot-svg"
          focusable="false"
          width={size}
          height={size}
        >
          <defs>
            <linearGradient id={`ink-grad-${stage}`} x1="0%" y1="100%" x2="0%" y2="0%">
              {isKnown ? (
                <>
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="60%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fde68a" />
                </>
              ) : isStudying ? (
                <>
                  <stop offset="0%" stopColor="#1e1b4b" />
                  <stop offset="50%" stopColor="#312e81" />
                  <stop offset="100%" stopColor="#6366f1" />
                </>
              ) : isLocked ? (
                <>
                  <stop offset="0%" stopColor="#27272a" />
                  <stop offset="100%" stopColor="#3f3f46" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#18181b" />
                  <stop offset="100%" stopColor="#3f3f46" />
                </>
              )}
            </linearGradient>

            <clipPath id={`ink-well-clip-${stage}`}>
              {/* Internal cavity of the inkpot */}
              <path d="M7.5 12 C7.5 11.5 8.5 11 12 11 C15.5 11 16.5 11.5 16.5 12 L17.5 18 C17.5 19 15.5 19.5 12 19.5 C8.5 19.5 6.5 19 6.5 18 Z" />
            </clipPath>
          </defs>

          {/* Layer 1: Ambient atmospheric breathing aura glow */}
          <circle
            cx="12"
            cy="14"
            r="8.5"
            className="sc-ink-glow-layer"
            opacity={isKnown ? "0.35" : isStudying ? "0.26" : "0.1"}
          />

          {/* Layer 2: Stoneware inkpot vessel body */}
          <g className="sc-ink-pot-body">
            {/* Inkpot base footprint and shadow */}
            <ellipse cx="12" cy="19.2" rx="6.5" ry="1.8" className="sc-ink-pot-shadow" />

            {/* Inkpot ceramic exterior wall */}
            <path
              d="M7 11.5 C7 10.8 8.5 10.2 12 10.2 C15.5 10.2 17 10.8 17 11.5 L18.2 18 C18.2 19.4 15.8 20.2 12 20.2 C8.2 20.2 5.8 19.4 5.8 18 Z"
              className="sc-ink-pot-hull"
            />

            {/* Inkpot neck and flared lip rim */}
            <ellipse cx="12" cy="11.5" rx="5.2" ry="1.6" className="sc-ink-pot-rim" />
            <ellipse cx="12" cy="11.5" rx="4.2" ry="1.2" className="sc-ink-pot-opening" />
          </g>

          {/* Layer 3: Dynamic fluid ink reservoir level */}
          <g clipPath={`url(#ink-well-clip-${stage})`} className="sc-ink-fluid-container">
            <rect
              x="5"
              y={fluidY}
              width="14"
              height={fluidHeight + 2}
              fill={`url(#ink-grad-${stage})`}
              className="sc-ink-fluid-rect"
            />
            {isStudying ? (
              <path
                d={`M6 ${fluidY} Q9 ${fluidY - 0.7} 12 ${fluidY} T18 ${fluidY}`}
                className="sc-ink-surface-ripple"
              />
            ) : null}
          </g>

          {/* Layer 4: Scriptorium goose quill dipped in ink */}
          <g className="sc-ink-quill-group">
            {isLocked ? (
              /* Dry capped seal */
              <path
                d="M9.5 11 L14.5 11 L13 8 L11 8 Z"
                className="sc-ink-cap-seal"
              />
            ) : (
              /* Feather quill with nib resting / dipping in the well */
              <g className={`sc-ink-quill${isStudying ? " is-writing" : ""}`}>
                {/* Slender quill shaft */}
                <path
                  d="M11.5 13.5 L19.5 2.5"
                  className="sc-ink-quill-spine"
                />
                {/* Feather vane vanes */}
                <path
                  d="M19.5 2.5 C17 3.5 14.5 6 13.5 9 C14.5 8.5 16.5 8 18 6.5 C19 5.5 19.5 4 19.5 2.5 Z"
                  className="sc-ink-quill-vane"
                />
                {/* Split nib tip */}
                <polygon
                  points="11,14.5 12,14.5 11.5 12.8"
                  className="sc-ink-quill-nib"
                />
              </g>
            )}
          </g>

          {/* Layer 5: Active writing motes and ink vapor */}
          {isStudying ? (
            <g className="sc-ink-drift-layer">
              <circle cx="10" cy="9" r="0.65" className="sc-ink-mote mote-1" />
              <circle cx="14" cy="8" r="0.5" className="sc-ink-mote mote-2" />
              <circle cx="12" cy="6.5" r="0.6" className="sc-ink-mote mote-3" />
            </g>
          ) : null}

          {/* Layer 6: Scholar star glint & master illumination */}
          <g className="sc-ink-pulse-layer">
            {isKnown ? (
              <>
                <polygon
                  points="19.5,2.5 20.3,4 21.8,4.8 20.3,5.6 19.5,7.1 18.7,5.6 17.2,4.8 18.7,4"
                  className="sc-ink-star-glint"
                />
                <circle cx="12" cy="11.5" r="1.1" className="sc-ink-gold-core" />
              </>
            ) : isStudying ? (
              <circle cx="11.5" cy="13.2" r="0.8" className="sc-ink-wet-glimmer" />
            ) : (
              <circle cx="12" cy="11.5" r="0.75" className="sc-ink-dormant-glint" />
            )}
          </g>
        </svg>
      </span>

      {/* Optional progressive ink droplet beads */}
      {showDrops ? (
        <ResearchInkDroplets progress={clampedProgress} status={status} />
      ) : null}
    </span>
  );
}

export const StudyInkPip = ResearchInkPip;
export const InkPip = ResearchInkPip;
export const ResearchProgressPip = ResearchInkPip;
