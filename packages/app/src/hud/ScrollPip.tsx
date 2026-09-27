import React from "react";

export type ScrollPipStatus = "open" | "ready" | "claimed";

export interface ScrollPipProps {
  /** Quest status: "open" (in progress), "ready" (complete, lit!), or "claimed" */
  status?: ScrollPipStatus;
  /** Size in pixels (default: 24) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 24px Scroll Pip:
 * - Medieval unrolled parchment mandate with roller rods, sepia script lines, and signet seal.
 * - In progress ("open"): warm antique vellum parchment with crimson seal.
 * - Ready ("ready"): LIT! Radiant molten gold illumination, incandescent aura, and gleaming sparkle glint.
 * - Claimed ("claimed"): subdued silver-grey archived parchment.
 * GUARANTEE: strictly pointer-events: none so clicks on the quest card are never blocked!
 */
export function ScrollPip({
  status = "open",
  size = 24,
  className = "",
  style,
}: ScrollPipProps) {
  const isReady = status === "ready";
  const litClass = isReady ? "is-lit" : `is-${status}`;

  return (
    <span
      className={`sc-scroll-pip-wrapper ${litClass} ${className}`}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
        ...style,
      }}
      aria-hidden="true"
      data-status={status}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={`sc-scroll-pip ${litClass}`}
        style={{ pointerEvents: "none" }}
        data-status={status}
      >
        {/* 1. Unrolled parchment body */}
        <path
          d="M6 4.5 V19 C6 19.8 6.8 20.5 7.8 20.5 H16.2 C17.2 20.5 18 19.8 18 19 V4.5 Z"
          fill={isReady ? "#fffbeb" : status === "claimed" ? "#e2e8f0" : "#fef3c7"}
          stroke={isReady ? "#b45309" : status === "claimed" ? "#64748b" : "#78531e"}
          strokeWidth="0.8"
        />

        {/* 2. Sepia ink script lines */}
        <line
          x1="8.5"
          y1="8.5"
          x2="15.5"
          y2="8.5"
          stroke={isReady ? "#d97706" : status === "claimed" ? "#94a3b8" : "#92400e"}
          strokeWidth="0.85"
          strokeLinecap="round"
        />
        <line
          x1="8.5"
          y1="11.5"
          x2="14"
          y2="11.5"
          stroke={isReady ? "#d97706" : status === "claimed" ? "#94a3b8" : "#92400e"}
          strokeWidth="0.85"
          strokeLinecap="round"
        />
        <line
          x1="8.5"
          y1="14.5"
          x2="15"
          y2="14.5"
          stroke={isReady ? "#d97706" : status === "claimed" ? "#94a3b8" : "#92400e"}
          strokeWidth="0.85"
          strokeLinecap="round"
        />

        {/* 3. Top scroll roller cylinder & curls */}
        <path
          d="M5 4.5 C5 3.3 6.2 2.6 8 2.6 H16 C17.8 2.6 19 3.3 19 4.5 C19 5.7 17.8 6.4 16 6.4 H8 C6.2 6.4 5 5.7 5 4.5 Z"
          fill={isReady ? "#fbbf24" : status === "claimed" ? "#cbd5e1" : "#d4a359"}
          stroke={isReady ? "#92400e" : status === "claimed" ? "#475569" : "#5a3818"}
          strokeWidth="0.8"
        />
        {/* Left top curl rim */}
        <ellipse
          cx="6"
          cy="4.5"
          rx="1.4"
          ry="1.8"
          fill={isReady ? "#f59e0b" : status === "claimed" ? "#94a3b8" : "#b48344"}
          stroke={isReady ? "#92400e" : status === "claimed" ? "#475569" : "#5a3818"}
          strokeWidth="0.6"
        />
        {/* Right top curl rim */}
        <ellipse
          cx="18"
          cy="4.5"
          rx="1.4"
          ry="1.8"
          fill={isReady ? "#fde047" : status === "claimed" ? "#e2e8f0" : "#fef08a"}
          stroke={isReady ? "#92400e" : status === "claimed" ? "#475569" : "#5a3818"}
          strokeWidth="0.6"
        />

        {/* 4. Bottom scroll roller cylinder & curls */}
        <path
          d="M5 19.5 C5 18.3 6.2 17.6 8 17.6 H16 C17.8 17.6 19 18.3 19 19.5 C19 20.7 17.8 21.4 16 21.4 H8 C6.2 21.4 5 20.7 5 19.5 Z"
          fill={isReady ? "#f59e0b" : status === "claimed" ? "#cbd5e1" : "#b48344"}
          stroke={isReady ? "#92400e" : status === "claimed" ? "#475569" : "#5a3818"}
          strokeWidth="0.8"
        />
        {/* Left bottom curl rim */}
        <ellipse
          cx="6"
          cy="19.5"
          rx="1.4"
          ry="1.8"
          fill={isReady ? "#d97706" : status === "claimed" ? "#94a3b8" : "#854d0e"}
          stroke={isReady ? "#92400e" : status === "claimed" ? "#475569" : "#5a3818"}
          strokeWidth="0.6"
        />
        {/* Right bottom curl rim */}
        <ellipse
          cx="18"
          cy="19.5"
          rx="1.4"
          ry="1.8"
          fill={isReady ? "#fbbf24" : status === "claimed" ? "#e2e8f0" : "#d4a359"}
          stroke={isReady ? "#92400e" : status === "claimed" ? "#475569" : "#5a3818"}
          strokeWidth="0.6"
        />

        {/* 5. Stamped Signet Wax Seal & Ribbon */}
        {/* Ribbon tail */}
        <polygon
          points="12,16.5 11,20 12,19.2 13,20"
          fill={isReady ? "#b45309" : status === "claimed" ? "#64748b" : "#991b1b"}
          stroke={isReady ? "#78350f" : status === "claimed" ? "#475569" : "#5c0a0a"}
          strokeWidth="0.4"
        />
        {/* Wax seal roundel */}
        <circle
          cx="12"
          cy="16.5"
          r="2.2"
          fill={isReady ? "#facc15" : status === "claimed" ? "#94a3b8" : "#dc2626"}
          stroke={isReady ? "#92400e" : status === "claimed" ? "#475569" : "#7f1d1d"}
          strokeWidth="0.6"
        />
        <circle
          cx="12"
          cy="16.5"
          r="1"
          fill={isReady ? "#ffffff" : status === "claimed" ? "#cbd5e1" : "#991b1b"}
        />

        {/* 6. Ready Pip Lit Sparkle Stars */}
        {isReady && (
          <g className="sc-scroll-lit-sparkle">
            {/* Brilliant star sparkle on top right roller apex */}
            <circle cx="17.5" cy="4.5" r="1.3" fill="#ffffff" />
            <path
              d="M17.5 2 V7 M15 4.5 H20"
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            {/* Secondary seal glint */}
            <circle cx="12" cy="16.5" r="1.1" fill="#ffffff" />
            <path
              d="M12 15 V18 M10.5 16.5 H13.5"
              stroke="#ffffff"
              strokeWidth="0.6"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
    </span>
  );
}
