import React from "react";
import "./copy-flash.css";

/** Duration in milliseconds that CopyFlashPip stays visible after a successful copy. */
export const COPY_FLASH_MS = 1400;

/**
 * Starts a bounded timer that hides the copy flash after `ms` milliseconds,
 * returning a cancel callback for unmount, re-copy, or leaving the hold.
 */
export function startCopyFlashTimer(
  onHide: () => void,
  ms: number = COPY_FLASH_MS,
): () => void {
  const id = globalThis.setTimeout(onHide, ms);
  return () => globalThis.clearTimeout(id);
}

export interface CopyFlashPipProps {
  /** Size in pixels (default: 16) */
  size?: number;
  /** Optional monotonic key so consecutive copies replay the flash cleanly */
  flashKey?: number | string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 16px living SVG flash / check pip placed to the left of the Copy button.
 * Appears briefly after a successful key copy, then hides.
 * Strictly enforces pointer-events: none so button clicks are never intercepted.
 */
export function CopyFlashPip({
  size = 16,
  flashKey = 1,
  className = "",
  style,
  title,
}: CopyFlashPipProps) {
  const classes = ["sc-copy-flash-pip-wrapper", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
      title={title}
      data-copy-flash
    >
      <span
        key={String(flashKey)}
        className="sc-copy-flash-pip-glyph"
        style={{ pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          className="sc-copy-flash-pip"
          style={{ pointerEvents: "none" }}
        >
          {/* Radiant golden starburst flash rays */}
          <line x1="8" y1="0.8" x2="8" y2="2.6" stroke="#fde68a" strokeWidth="1" strokeLinecap="round" />
          <line x1="8" y1="13.4" x2="8" y2="15.2" stroke="#fde68a" strokeWidth="1" strokeLinecap="round" />
          <line x1="0.8" y1="8" x2="2.6" y2="8" stroke="#fde68a" strokeWidth="1" strokeLinecap="round" />
          <line x1="13.4" y1="8" x2="15.2" y2="8" stroke="#fde68a" strokeWidth="1" strokeLinecap="round" />
          {/* Warm emerald-gold confirmation roundel */}
          <circle cx="8" cy="8" r="5.3" fill="#064e3b" stroke="#fbbf24" strokeWidth="0.9" />
          <circle cx="8" cy="8" r="4.1" fill="#059669" opacity="0.9" />
          {/* Crisp parchment-gold check mark */}
          <polyline
            points="5.4,8.2 7.2,10.1 10.8,6.1"
            fill="none"
            stroke="#fef9c3"
            strokeWidth="1.45"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </span>
  );
}
