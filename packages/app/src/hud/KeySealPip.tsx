import React from "react";
import "./key-seal.css";

export interface KeySealPipProps {
  /** Size in pixels (default: 16) */
  size?: number;
  /** Whether to pulse once when the hold key is first shown */
  pulse?: boolean;
  /** Optional key (e.g. madeKey) so showing a new hold key plays a single pulse */
  pulseKey?: string | number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 16px living wax-seal SVG pip next to a newly made hold key.
 * Strictly enforces pointer-events: none and pulses once when the key is first shown.
 */
export function KeySealPip({
  size = 16,
  pulse = false,
  pulseKey = "seal",
  className = "",
  style,
  title,
}: KeySealPipProps) {
  const pulseClass = pulse ? "is-pulsing" : "";
  const classes = ["sc-key-seal-pip-wrapper", pulseClass, className]
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
      data-key-seal
      data-pulsing={pulse}
    >
      <span
        key={pulse ? String(pulseKey) : "idle"}
        className="sc-key-seal-pip-glyph"
        style={{ pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          className="sc-key-seal-pip"
          style={{ pointerEvents: "none" }}
        >
          {/* Hanging crimson ribbon tails */}
          <polygon
            points="5.2,10.8 3.6,15.0 5.6,13.8 6.9,15.0 6.7,10.8"
            fill="#991b1b"
            stroke="#450a0a"
            strokeWidth="0.45"
          />
          <polygon
            points="9.3,10.8 9.1,15.0 10.4,13.8 12.4,15.0 10.8,10.8"
            fill="#b91c1c"
            stroke="#450a0a"
            strokeWidth="0.45"
          />
          {/* Pressed royal crimson wax outer rim */}
          <circle cx="8" cy="7.2" r="5.7" fill="#991b1b" stroke="#450a0a" strokeWidth="0.65" />
          {/* Inner signet matrix ring */}
          <circle cx="8" cy="7.2" r="4.1" fill="#dc2626" stroke="#fbbf24" strokeWidth="0.6" />
          {/* Stamped golden hold-key signet emblem */}
          <circle cx="6.5" cy="7.2" r="1.35" fill="none" stroke="#fef08a" strokeWidth="0.85" />
          <line x1="7.8" y1="7.2" x2="10.7" y2="7.2" stroke="#fef08a" strokeWidth="0.85" strokeLinecap="round" />
          <line x1="9.6" y1="7.2" x2="9.6" y2="8.4" stroke="#fef08a" strokeWidth="0.7" strokeLinecap="round" />
          <line x1="10.5" y1="7.2" x2="10.5" y2="8.2" stroke="#fef08a" strokeWidth="0.7" strokeLinecap="round" />
          {/* Molten wax highlight glint */}
          <circle cx="5.6" cy="4.7" r="0.75" fill="#fde68a" opacity="0.85" />
        </svg>
      </span>
    </span>
  );
}
