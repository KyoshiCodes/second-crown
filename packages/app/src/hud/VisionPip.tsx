import React from "react";

export interface VisionPipProps {
  /** Vision range in tiles */
  range?: number;
  /** Rim watchtowers count */
  towers?: number;
  /** Scout cost in gold */
  cost?: number;
  /** Size in pixels (default: 20) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Small 20px Vision Pip:
 * - Displays a stone watchtower spire with projecting parapet walkway, iron beacon brazier,
 *   and burning beacon flame.
 * - Dynamic radiant vision rays when vision extends beyond base range (towers > 0 or range > 1).
 * - Strictly pointer-events: none.
 */
export function VisionPip({
  range = 1,
  towers = 0,
  cost,
  size = 20,
  className = "",
  style,
}: VisionPipProps) {
  const hasTower = towers > 0 || range > 1;
  const flameColor = hasTower ? "#f59e0b" : "#94a3b8";
  const flameCore = hasTower ? "#fef08a" : "#cbd5e1";

  return (
    <span
      className={`sc-vision-pip-wrapper ${hasTower ? "is-lit" : "is-dim"} ${className}`}
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
      data-vision-pip
      data-range={range}
      data-towers={towers}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={{ pointerEvents: "none", display: "block" }}
        aria-hidden="true"
      >
        {/* Watchtower stone shaft - shaded left */}
        <path d="M8 10 L12 13 L12 21 L8 19 Z" fill="#64748b" stroke="#334155" strokeWidth="0.7" />
        {/* Watchtower stone shaft - sunlit right */}
        <path d="M12 13 L16 10 L16 19 L12 21 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.7" />
        {/* Parapet walkway */}
        <path d="M7 9 L12 11 L17 9 L12 7 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="0.6" />
        <path d="M7 7.5 V9 H17 V7.5" stroke="#334155" strokeWidth="0.8" fill="none" />
        {/* Iron beacon brazier */}
        <path d="M10 6 H14 L13 8 H11 Z" fill="#1e293b" />
        {/* Dancing beacon fire flame / vision beacon */}
        <circle cx="12" cy="5" r={hasTower ? 2.2 : 1.2} fill={flameColor} />
        <circle cx="12" cy="4.5" r={hasTower ? 1.1 : 0.6} fill={flameCore} />
        {hasTower && (
          <>
            {/* Radiating vision glints */}
            <line x1="8" y1="4.5" x2="6.5" y2="4.5" stroke="#fde047" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="16" y1="4.5" x2="17.5" y2="4.5" stroke="#fde047" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="12" y1="1.5" x2="12" y2="2.8" stroke="#fde047" strokeWidth="0.8" strokeLinecap="round" />
          </>
        )}
      </svg>
    </span>
  );
}
