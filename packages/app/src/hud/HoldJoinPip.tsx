import React from "react";
import "./hold-join-pip.css";

export interface HoldJoinPipProps {
  /** Size in pixels (default: 16) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 16px living join pip inside the hold join card.
 * Depicts two interlocking golden heraldic rings with a radiant center join jewel.
 *
 * GUARANTEE: pointer-events: none on every pip and all children!
 */
export function HoldJoinPip({
  size = 16,
  className = "",
  style,
  title,
}: HoldJoinPipProps) {
  const wrapperClass = ["sc-hold-join-pip-wrapper", className]
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
      data-hold-join-pip
    >
      <span
        className="sc-hold-join-pip-glyph"
        style={{ pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          className="sc-hold-join-pip"
          style={{ pointerEvents: "none" }}
        >
          {/* Outer round medallion frame */}
          <circle
            cx="8"
            cy="8"
            r="6.8"
            fill="#1f1813"
            stroke="#4a3b2c"
            strokeWidth="0.65"
            style={{ pointerEvents: "none" }}
          />

          {/* Left interlocking signet ring (deep amber) */}
          <circle
            cx="6.2"
            cy="8"
            r="3.4"
            fill="none"
            stroke="#d29922"
            strokeWidth="1.2"
            style={{ pointerEvents: "none" }}
          />

          {/* Right interlocking signet ring (bright gold) */}
          <circle
            cx="9.8"
            cy="8"
            r="3.4"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.2"
            style={{ pointerEvents: "none" }}
          />

          {/* Interlocking top weave segment */}
          <path
            d="M 6.8 5.3 A 3.4 3.4 0 0 1 9.0 6.5"
            fill="none"
            stroke="#d29922"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ pointerEvents: "none" }}
          />

          {/* Center radiant bond jewel */}
          <circle
            cx="8"
            cy="8"
            r="0.9"
            fill="#fef08a"
            stroke="#451a03"
            strokeWidth="0.3"
            style={{ pointerEvents: "none" }}
          />

          {/* Ring glint highlights */}
          <circle
            cx="4.8"
            cy="5.8"
            r="0.45"
            fill="#ffffff"
            opacity="0.85"
            style={{ pointerEvents: "none" }}
          />
          <circle
            cx="11.2"
            cy="5.8"
            r="0.45"
            fill="#ffffff"
            opacity="0.85"
            style={{ pointerEvents: "none" }}
          />
        </svg>
      </span>
    </span>
  );
}
