import React from "react";

export interface WallPipProps {
  /** Edge walls completed count (e.g. 0 to 8) */
  rim?: number;
  /** Whether the wall ring is closed */
  closed?: boolean;
  /** Total wall HP */
  hp?: number;
  /** Whether a gate is standing on the rim */
  gate?: boolean;
  /** Size in pixels (default: 20) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Small 20px Wall Pip:
 * - Displays a crenellated ashlar stone curtain wall with battlements, wall-walk terrace,
 *   and central portcullis gate arch.
 * - Dynamic ring jewel / heraldic stud: emerald green (#3fb950) when closed, warm amber (#d29922) when open.
 * - Strictly pointer-events: none.
 */
export function WallPip({
  rim = 0,
  closed = false,
  hp = 0,
  gate = false,
  size = 20,
  className = "",
  style,
}: WallPipProps) {
  const statusColor = closed ? "#3fb950" : rim > 0 ? "#d29922" : "#64748b";

  return (
    <span
      className={`sc-wall-pip-wrapper ${closed ? "is-closed" : "is-open"} ${className}`}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        pointerEvents: "none",
        userSelect: "none",
        verticalAlign: "middle",
        ...style,
      }}
      aria-hidden="true"
      data-wall-pip
      data-closed={closed}
      data-gate={gate}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={{ pointerEvents: "none", display: "block" }}
        aria-hidden="true"
      >
        {/* Ashlar stone curtain wall left flank */}
        <path d="M2 13 L12 17 L12 21 L2 17 Z" fill="#475569" stroke="#1e293b" strokeWidth="0.7" />
        {/* Ashlar stone curtain wall right flank */}
        <path d="M12 17 L22 13 L22 17 L12 21 Z" fill="#64748b" stroke="#1e293b" strokeWidth="0.7" />
        {/* Wall-walk parapet top terrace */}
        <path d="M2 13 L12 9 L22 13 L12 17 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="0.6" />
        {/* Crenellated battlements */}
        <path
          d="M2 11 H4 V13 H7 V11 H10 V13 H12 V11 H14 V13 H17 V11 H20 V13 H22 V11"
          stroke="#334155"
          strokeWidth="0.8"
          fill="none"
        />
        {/* Central gate archway */}
        {gate ? (
          <>
            <path d="M10 16 C10 13.5, 14 13.5, 14 16 V20 L10 19 Z" fill="#0f172a" />
            {/* Portcullis grate bars */}
            <line x1="11" y1="15" x2="11" y2="19.5" stroke="#71717a" strokeWidth="0.5" />
            <line x1="13" y1="15" x2="13" y2="19.5" stroke="#71717a" strokeWidth="0.5" />
            <line x1="10.2" y1="16.5" x2="13.8" y2="16.5" stroke="#71717a" strokeWidth="0.5" />
          </>
        ) : (
          <path d="M10.5 16.5 C10.5 15, 13.5 15, 13.5 16.5 V19.5 L10.5 18.5 Z" fill="#1e293b" />
        )}
        {/* Ring status jewel / crest stud */}
        <circle cx="12" cy="7.5" r="1.6" fill={statusColor} stroke="#0f172a" strokeWidth="0.5" />
        {closed && <circle cx="12" cy="7.5" r="0.7" fill="#ffffff" />}
      </svg>
    </span>
  );
}
