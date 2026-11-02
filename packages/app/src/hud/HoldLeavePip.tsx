import React from "react";
import "./hold-leave-pip.css";

export interface HoldLeavePipProps {
  /** Size in pixels (default: 16) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 16px living leave pip inside the hold leave card.
 * Depicts a sunlit postern gate and departure archway.
 *
 * GUARANTEE: pointer-events: none on the pip and all children!
 */
export function HoldLeavePip({
  size = 16,
  className = "",
  style,
  title,
}: HoldLeavePipProps) {
  const wrapperClass = ["sc-hold-leave-pip-wrapper", className]
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
      data-hold-leave-pip
    >
      <span
        className="sc-hold-leave-pip-glyph"
        style={{ pointerEvents: "none" }}
      >
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          className="sc-hold-leave-pip"
          style={{ pointerEvents: "none" }}
        >
          {/* Outer round stone boundary */}
          <circle
            cx="8"
            cy="8"
            r="6.8"
            fill="#1f1813"
            stroke="#4a3b2c"
            strokeWidth="0.65"
            style={{ pointerEvents: "none" }}
          />

          {/* Arched postern portal cut into stone */}
          <path
            d="M 4.6 13 V 7.2 A 3.4 3.4 0 0 1 11.4 7.2 V 13 Z"
            fill="#0f0c09"
            stroke="#d29922"
            strokeWidth="0.6"
            style={{ pointerEvents: "none" }}
          />

          {/* Distant warm sunlit morning sky through arch */}
          <path
            d="M 5.4 12.6 V 7.4 A 2.6 2.6 0 0 1 10.6 7.4 V 12.6 Z"
            fill="#b45309"
            style={{ pointerEvents: "none" }}
          />

          {/* Distant rising sun & radiant horizon */}
          <circle
            cx="8"
            cy="7.8"
            r="1.8"
            fill="#fde68a"
            style={{ pointerEvents: "none" }}
          />

          {/* Parting golden path leading outward through threshold */}
          <polygon
            points="6.8,12.6 9.2,12.6 8.6,8.6 7.4,8.6"
            fill="#fef08a"
            opacity="0.9"
            style={{ pointerEvents: "none" }}
          />

          {/* Open heavy wooden postern door leaf swung ajar */}
          <polygon
            points="4.6,12.8 3.6,12.2 3.6,6.6 4.6,7.2"
            fill="#78350f"
            stroke="#451a03"
            strokeWidth="0.45"
            style={{ pointerEvents: "none" }}
          />

          {/* Door iron strap hinges */}
          <line
            x1="3.6"
            y1="8.2"
            x2="4.6"
            y2="8.6"
            stroke="#1c1917"
            strokeWidth="0.5"
            style={{ pointerEvents: "none" }}
          />
          <line
            x1="3.6"
            y1="10.8"
            x2="4.6"
            y2="11.2"
            stroke="#1c1917"
            strokeWidth="0.5"
            style={{ pointerEvents: "none" }}
          />

          {/* Keystone in arch summit */}
          <polygon
            points="7.3,3.6 8.7,3.6 8.5,4.8 7.5,4.8"
            fill="#d29922"
            style={{ pointerEvents: "none" }}
          />
        </svg>
      </span>
    </span>
  );
}
