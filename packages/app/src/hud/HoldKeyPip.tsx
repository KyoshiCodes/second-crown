import React from "react";
import "./hold-key-pip.css";

export interface HoldKeyPipProps {
  /** Size in pixels (default: 16) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 16px living key pip inside the hold key card.
 * Depicts a golden royal skeleton key with trefoil bow and ward teeth.
 *
 * GUARANTEE: pointer-events: none on every pip and all children!
 */
export function HoldKeyPip({
  size = 16,
  className = "",
  style,
  title,
}: HoldKeyPipProps) {
  const wrapperClass = ["sc-hold-key-pip-wrapper", className]
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
      data-hold-key-pip
    >
      <span
        className="sc-hold-key-pip-glyph"
        style={{ pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          className="sc-hold-key-pip"
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

          {/* Skeleton key trefoil bow */}
          <circle
            cx="8"
            cy="4.8"
            r="2.2"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.1"
            style={{ pointerEvents: "none" }}
          />
          <circle
            cx="8"
            cy="4.8"
            r="0.8"
            fill="#1f1813"
            style={{ pointerEvents: "none" }}
          />

          {/* Key shaft */}
          <line
            x1="8"
            y1="6.8"
            x2="8"
            y2="13.2"
            stroke="#fbbf24"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ pointerEvents: "none" }}
          />

          {/* Collar ring below bow */}
          <line
            x1="6.8"
            y1="7.8"
            x2="9.2"
            y2="7.8"
            stroke="#fef08a"
            strokeWidth="0.65"
            strokeLinecap="round"
            style={{ pointerEvents: "none" }}
          />

          {/* Key ward bit teeth */}
          <line
            x1="8"
            y1="10.5"
            x2="10.5"
            y2="10.5"
            stroke="#fbbf24"
            strokeWidth="1.1"
            strokeLinecap="round"
            style={{ pointerEvents: "none" }}
          />
          <line
            x1="8"
            y1="12.3"
            x2="11.2"
            y2="12.3"
            stroke="#fbbf24"
            strokeWidth="1.1"
            strokeLinecap="round"
            style={{ pointerEvents: "none" }}
          />

          {/* Molten gold shine highlight glint */}
          <circle
            cx="6.6"
            cy="3.8"
            r="0.45"
            fill="#ffffff"
            opacity="0.88"
            style={{ pointerEvents: "none" }}
          />
        </svg>
      </span>
    </span>
  );
}
