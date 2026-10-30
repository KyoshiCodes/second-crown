import React from "react";
import "./leave-mark.css";

export interface LeaveMarkPipProps {
  /** Size in pixels (default: 16) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 16px living SVG door / exit mark placed beside the shared-hold Leave button.
 * Strictly enforces pointer-events: none so button clicks are never intercepted.
 */
export function LeaveMarkPip({
  size = 16,
  className = "",
  style,
  title,
}: LeaveMarkPipProps) {
  const classes = ["sc-leave-mark-pip-wrapper", className]
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
      data-leave-mark
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className="sc-leave-mark-pip"
        style={{ pointerEvents: "none" }}
      >
        {/* Stone threshold & arched postern doorway */}
        <path
          d="M2.2 14.2 V 5.4 A 4.0 4.0 0 0 1 10.2 5.4 V 14.2 Z"
          fill="#1f1610"
          stroke="#a88b61"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        {/* Partially open oak door leaf */}
        <polygon
          points="2.8,13.6 2.8,5.5 6.8,4.3 6.8,12.5"
          fill="#92400e"
          stroke="#451a03"
          strokeWidth="0.55"
          strokeLinejoin="round"
        />
        {/* Brass door ring */}
        <circle cx="5.5" cy="8.8" r="0.6" fill="#fbbf24" />
        {/* Living golden return/exit arrow stepping out of the doorway */}
        <g className="sc-leave-mark-arrow">
          <line
            x1="8.0"
            y1="8.8"
            x2="14.0"
            y2="8.8"
            stroke="#fbbf24"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          <polyline
            points="11.6,6.5 14.2,8.8 11.6,11.1"
            fill="none"
            stroke="#fef08a"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </span>
  );
}
