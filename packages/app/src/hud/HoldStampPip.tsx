import React from "react";
import "./hold-stamp-pip.css";

export interface HoldStampPipProps {
  /** Size in pixels (default: 16) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 16px living stamp pip inside each hold stamp card.
 * Depicts a royal wax seal impression with golden crown signet.
 *
 * GUARANTEE: pointer-events: none on every pip and all children!
 */
export function HoldStampPip({
  size = 16,
  className = "",
  style,
  title,
}: HoldStampPipProps) {
  const wrapperClass = ["sc-hold-stamp-pip-wrapper", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={wrapperClass}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
      title={title}
      data-hold-stamp-pip
    >
      <span
        className="sc-hold-stamp-pip-glyph"
        style={{ pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          className="sc-hold-stamp-pip"
          style={{ pointerEvents: "none" }}
        >
          {/* Outer organic molten crimson wax edge & pool */}
          <circle cx="3.6" cy="5.6" r="1.6" fill="#991b1b" style={{ pointerEvents: "none" }} />
          <circle cx="12.4" cy="10.4" r="1.5" fill="#991b1b" style={{ pointerEvents: "none" }} />
          <circle
            cx="8"
            cy="8"
            r="6.8"
            fill="#991b1b"
            stroke="#450a0a"
            strokeWidth="0.55"
            style={{ pointerEvents: "none" }}
          />

          {/* Inner pressed wax matrix bed */}
          <circle
            cx="8"
            cy="8"
            r="4.8"
            fill="#dc2626"
            stroke="#fbbf24"
            strokeWidth="0.55"
            style={{ pointerEvents: "none" }}
          />

          {/* Stamped royal signet crown emblem */}
          <polygon
            points="5.4,10.2 10.6,10.2 10.6,7.6 9.4,8.6 8,6.8 6.6,8.6 5.4,7.6"
            fill="#fbbf24"
            style={{ pointerEvents: "none" }}
          />
          <line
            x1="5.7"
            y1="9.6"
            x2="10.3"
            y2="9.6"
            stroke="#fef08a"
            strokeWidth="0.4"
            style={{ pointerEvents: "none" }}
          />
          <circle
            cx="8"
            cy="6.2"
            r="0.45"
            fill="#fef08a"
            style={{ pointerEvents: "none" }}
          />

          {/* Molten wax shine highlight */}
          <circle
            cx="5.8"
            cy="5.2"
            r="0.6"
            fill="#ffffff"
            opacity="0.88"
            style={{ pointerEvents: "none" }}
          />
        </svg>
      </span>
    </span>
  );
}
