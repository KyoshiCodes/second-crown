import React from "react";
import "./leave-seal.css";

export interface LeaveSealPipProps {
  /** Size in pixels (default: 16) */
  size?: number;
  /** Whether to pulse once when the leave confirmation opens */
  pulse?: boolean;
  /** Key incremented each time the confirmation opens so the 1-shot pulse replays */
  pulseKey?: number | string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 16px living wax-seal SVG pip placed next to the Leave button only while
 * the leave confirmation is open. Pulses once when the confirmation opens,
 * with pointer-events: none on the pip and all children.
 */
export function LeaveSealPip({
  size = 16,
  pulse = true,
  pulseKey = 1,
  className = "",
  style,
  title,
}: LeaveSealPipProps) {
  const pulseClass = pulse ? "is-pulsing" : "";
  const classes = ["sc-leave-seal-pip-wrapper", pulseClass, className]
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
      data-leave-seal
      data-pulsing={pulse}
    >
      <span
        key={pulse ? String(pulseKey) : "idle"}
        className="sc-leave-seal-pip-glyph"
        style={{ pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          className="sc-leave-seal-pip"
          style={{ pointerEvents: "none" }}
        >
          {/* Hanging royal crimson ribbon tails */}
          <polygon
            points="5.2,10.8 3.6,15.0 5.6,13.8 6.9,15.0 6.7,10.8"
            fill="#7f1d1d"
            stroke="#450a0a"
            strokeWidth="0.45"
            style={{ pointerEvents: "none" }}
          />
          <polygon
            points="9.3,10.8 9.1,15.0 10.4,13.8 12.4,15.0 10.8,10.8"
            fill="#991b1b"
            stroke="#450a0a"
            strokeWidth="0.45"
            style={{ pointerEvents: "none" }}
          />
          {/* Pressed crimson-amber wax outer rim */}
          <circle
            cx="8"
            cy="7.2"
            r="5.7"
            fill="#991b1b"
            stroke="#450a0a"
            strokeWidth="0.65"
            style={{ pointerEvents: "none" }}
          />
          {/* Inner golden signet matrix ring */}
          <circle
            cx="8"
            cy="7.2"
            r="4.1"
            fill="#dc2626"
            stroke="#fbbf24"
            strokeWidth="0.6"
            style={{ pointerEvents: "none" }}
          />
          {/* Stamped golden postern-arch & parting chevron signet */}
          <path
            d="M5.7 9.3 V 5.9 A 1.7 1.7 0 0 1 9.1 5.9 V 9.3"
            fill="none"
            stroke="#fef08a"
            strokeWidth="0.75"
            strokeLinecap="round"
            style={{ pointerEvents: "none" }}
          />
          <polyline
            points="8.2,6.1 10.2,7.4 8.2,8.7"
            fill="none"
            stroke="#fde68a"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: "none" }}
          />
          {/* Molten wax highlight glint */}
          <circle
            cx="5.6"
            cy="4.7"
            r="0.72"
            fill="#fde68a"
            opacity="0.85"
            style={{ pointerEvents: "none" }}
          />
        </svg>
      </span>
    </span>
  );
}
