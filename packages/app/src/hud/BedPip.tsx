import React from "react";

export interface BedPipProps {
  /** Size in pixels (default: 16) */
  size?: number;
  /** Whether the bed is occupied / in use (adds warm candlelight glow) */
  active?: boolean;
  /** Whether housing is at max capacity / packed */
  full?: boolean;
  /** Whether wounded troops are resting on the cot */
  wounded?: boolean;
  /** Current population (optional for title tooltip) */
  pop?: number;
  /** Current housing bed capacity (optional for title tooltip) */
  cap?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Small Living Bed Pip (Hall room & housing cards):
 * - Medieval timber cot with carved oak posts, linen bolster pillow, and wool quilt.
 * - Reactive living state: candlelight glow when occupied/full, medical cross when wounded.
 * - Strictly pointer-events: none.
 */
export function BedPip({
  size = 16,
  active = false,
  full = false,
  wounded = false,
  pop,
  cap,
  className = "",
  style,
  title,
}: BedPipProps) {
  const isOccupied = active || full;
  const tooltip =
    title ??
    (pop !== undefined && cap !== undefined
      ? `Beds ${pop}/${cap}${full ? " (Housing Full)" : ""}`
      : wounded
        ? "Infirmary Bed (Wounded resting)"
        : isOccupied
          ? "Cottage Bed (Occupied)"
          : "Cottage Bed (Free cot)");

  return (
    <span
      className={`sc-bed-pip-wrapper ${isOccupied ? "is-occupied" : "is-free"} ${full ? "is-full" : ""} ${wounded ? "is-wounded" : ""} ${className}`}
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
        position: "relative",
        ...style,
      }}
      aria-hidden="true"
      title={tooltip}
      data-bed-pip
      data-active={isOccupied}
      data-full={full}
      data-wounded={wounded}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={{ pointerEvents: "none", display: "block" }}
        aria-hidden="true"
      >
        {/* 1. Headboard Back Posts (Dark Carved Oak) */}
        {/* Far head post */}
        <line x1="8.5" y1="4" x2="8.5" y2="14" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="8.5" cy="3.5" r="1.1" fill="#78350f" stroke="#271406" strokeWidth="0.4" />

        {/* Near head post */}
        <line x1="3" y1="7" x2="3" y2="19" stroke="#543007" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="3" cy="6.2" r="1.3" fill="#92400e" stroke="#271406" strokeWidth="0.5" />

        {/* Headboard arch panel */}
        <polygon points="3,8 8.5,5 8.5,12 3,15" fill="#78350f" stroke="#3f220c" strokeWidth="0.5" />

        {/* 2. Bed Base & Side Rails */}
        {/* Far side rail */}
        <line x1="8.5" y1="13" x2="20" y2="9.5" stroke="#451a03" strokeWidth="1.4" />
        {/* Near foot post */}
        <line x1="15.5" y1="15" x2="15.5" y2="22" stroke="#543007" strokeWidth="2" strokeLinecap="round" />
        <circle cx="15.5" cy="14.5" r="1" fill="#92400e" stroke="#271406" strokeWidth="0.4" />
        {/* Far foot post */}
        <line x1="20.5" y1="9" x2="20.5" y2="15" stroke="#451a03" strokeWidth="1.5" strokeLinecap="round" />

        {/* Near side rail */}
        <polygon points="3,17.5 15.5,20.5 15.5,18 3,15" fill="#92400e" stroke="#451a03" strokeWidth="0.5" />

        {/* 3. Straw Mattress / Pallet Surface */}
        <polygon
          points="3.5,14.5 8.5,11.5 20,8.5 15,16.5"
          fill="#d97706"
          stroke="#78350f"
          strokeWidth="0.5"
        />

        {/* 4. Linen Bolster Pillow at the Head */}
        <ellipse
          cx="6.5"
          cy="12.5"
          rx="3.2"
          ry="1.8"
          transform="rotate(-22 6.5 12.5)"
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth="0.5"
        />

        {/* 5. Wool Quilt / Folded Blanket */}
        <polygon
          points="8,15.5 11,10.5 20,8.5 15,17"
          fill={wounded ? "#7f1d1d" : isOccupied ? "#b91c1c" : "#1e40af"}
          stroke={wounded ? "#450a0a" : isOccupied ? "#7f1d1d" : "#1e3a8a"}
          strokeWidth="0.6"
        />
        {/* Folded blanket top fold / sheet trim */}
        <line
          x1="8"
          y1="15.5"
          x2="11"
          y2="10.5"
          stroke="#fde047"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* 6. Reactive Living Detail */}
        {wounded ? (
          /* Red cross medical insignia */
          <g className="sc-bed-cross">
            <line x1="14" y1="12" x2="16.5" y2="13" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="15" y1="11" x2="15.5" y2="14" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="14" y1="12" x2="16.5" y2="13" stroke="#ef4444" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="15" y1="11" x2="15.5" y2="14" stroke="#ef4444" strokeWidth="0.6" strokeLinecap="round" />
          </g>
        ) : isOccupied ? (
          /* Warm bedside candlelight flame */
          <g className="sc-bed-candle-glow">
            {/* Candle holder base */}
            <circle cx="21" cy="18" r="1.6" fill="#ca8a04" stroke="#78350f" strokeWidth="0.4" />
            {/* Candle wax stick */}
            <line x1="21" y1="18" x2="21" y2="15" stroke="#fef08a" strokeWidth="1.2" />
            {/* Flickering flame teardrop */}
            <circle cx="21" cy="13.8" r="1.3" fill="#f97316" />
            <circle cx="21" cy="13.8" r="0.7" fill="#fde047" />
            {/* Tiny night glint */}
            <circle cx="21" cy="13.2" r="0.3" fill="#ffffff" />
          </g>
        ) : (
          /* Tidy vacant star glint */
          <g className="sc-bed-free-star">
            <circle cx="15" cy="13.5" r="0.6" fill="#60a5fa" />
          </g>
        )}
      </svg>
    </span>
  );
}
