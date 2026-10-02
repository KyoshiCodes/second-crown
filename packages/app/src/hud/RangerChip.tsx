import React from "react";
import "./ranger-chip.css";

export interface RangerChipProps {
  /** Size in pixels (default: 28) */
  size?: number;
  /** Whether the unit is unlocked and available to train */
  open?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 28px Ranger Chip:
 * - Iconic heraldic ranger silhouette for the Ranger unit card in the Army tab.
 * - Deep ranger cowl / hood with liripipe peak and keen shadowed gaze.
 * - Strung recurve woodland composite longbow with leather grip and nocked arrow.
 * - Flowing, billowing mist-blue cloak with golden leaf brooch clasp and morning mist wisps.
 * - GUARANTEE: strictly `pointer-events: none` so card buttons and clicks work unobstructed!
 */
export function RangerChip({
  size = 28,
  open = true,
  className = "",
  style,
  title,
}: RangerChipProps) {
  const statusClass = open ? "is-open" : "is-locked";

  return (
    <span
      className={`sc-ranger-chip-wrapper ${statusClass} ${className}`}
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
        lineHeight: 1,
        ...style,
      }}
      aria-hidden="true"
      title={title ?? (open ? "Ranger" : "Ranger (Locked)")}
      data-ranger-chip
      data-open={open}
    >
      <svg
        viewBox="0 0 28 28"
        width={size}
        height={size}
        className={`sc-ranger-chip ${statusClass}`}
        style={{ pointerEvents: "none", display: "block" }}
      >
        {/* 1. Ground contact shadow */}
        <ellipse cx="14" cy="25" rx="6.5" ry="1.8" fill="#000000" fillOpacity="0.32" />

        {/* 2. Stealth ranger leather boots */}
        <rect x="11.5" y="21" width="2.2" height="4" rx="0.5" fill="#1e293b" />
        <rect x="14.3" y="21" width="2.2" height="4" rx="0.5" fill="#0f172a" />

        {/* 3. Billowing mist-blue cloak */}
        <g className="sc-ranger-cloak">
          <path
            d="M14 7 C9 9.5, 5.5 14, 5.5 22.5 C8 23.5, 11 23, 14 23.5 C17 23, 20 23.5, 22.5 22.5 C22.5 14, 19 9.5, 14 7 Z"
            fill={open ? "#0284c7" : "#334155"}
            stroke={open ? "#0369a1" : "#1e293b"}
            strokeWidth="0.7"
          />
          {/* Drapery fold lines */}
          <path
            d="M11 11 C10 15, 9.5 19, 8 22"
            stroke={open ? "#0369a1" : "#1e293b"}
            strokeWidth="0.75"
            fill="none"
          />
          <path
            d="M17 11 C18 15, 18.5 19, 20 22"
            stroke={open ? "#0369a1" : "#1e293b"}
            strokeWidth="0.75"
            fill="none"
          />
          {/* Mist-blue highlights on cloak rim and mantle */}
          <path
            d="M5.5 22.5 C5.5 14, 9 9.5, 14 7"
            stroke={open ? "#38bdf8" : "#64748b"}
            strokeWidth="0.8"
            fill="none"
            opacity="0.9"
          />
          <path
            d="M14 7 C19 9.5, 22.5 14, 22.5 22.5"
            stroke={open ? "#7dd3fc" : "#94a3b8"}
            strokeWidth="0.5"
            fill="none"
            opacity="0.75"
          />
        </g>

        {/* 4. Quiver & Fletched arrows slung on back */}
        <g className="sc-ranger-quiver">
          <rect
            x="7.5"
            y="11"
            width="2.5"
            height="8"
            rx="0.6"
            fill={open ? "#78350f" : "#451a03"}
            stroke="#291204"
            strokeWidth="0.4"
            transform="rotate(-15 7.5 11)"
          />
          <line
            x1="8.5"
            y1="11"
            x2="7.5"
            y2="7"
            stroke={open ? "#f8fafc" : "#94a3b8"}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <line
            x1="10.2"
            y1="11"
            x2="9.2"
            y2="6"
            stroke={open ? "#38bdf8" : "#64748b"}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>

        {/* 5. Deep ranger cowl / hood & shadowed eyes */}
        <g className="sc-ranger-hood">
          <path
            d="M10 10.5 C10 5, 18 5, 18 10.5 C18 13.5, 10 13.5, 10 10.5 Z"
            fill={open ? "#0369a1" : "#1e293b"}
            stroke={open ? "#075985" : "#0f172a"}
            strokeWidth="0.6"
          />
          {/* Liripipe peak at crest of hood */}
          <polygon
            points="12,6.5 14,2.8 16,6.5"
            fill={open ? "#0284c7" : "#1e293b"}
            stroke={open ? "#0369a1" : "#0f172a"}
            strokeWidth="0.4"
          />
          {/* Shrouded face shadow */}
          <ellipse cx="14" cy="10.2" rx="2.8" ry="2.2" fill="#0f172a" />
          {/* Keen ranger eyes gleaming in the shadow */}
          <circle cx="12.6" cy="10" r="0.55" fill={open ? "#38bdf8" : "#94a3b8"} />
          <circle cx="15.4" cy="10" r="0.55" fill={open ? "#38bdf8" : "#94a3b8"} />
        </g>

        {/* 6. Golden leaf brooch / cloak clasp */}
        <g className="sc-ranger-clasp">
          <polygon
            points="14,11.8 15.2,13 14,14.2 12.8,13"
            fill={open ? "#facc15" : "#94a3b8"}
            stroke={open ? "#b45309" : "#475569"}
            strokeWidth="0.4"
          />
          <circle cx="14" cy="13" r="0.4" fill={open ? "#ffffff" : "#cbd5e1"} />
        </g>

        {/* 7. Recurve woodland longbow & nocked arrow */}
        <g className="sc-ranger-bow">
          {/* Bow stave */}
          <path
            d="M20 4.5 Q24.5 14 20 23.5"
            stroke={open ? "#854d0e" : "#57534e"}
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Bow tips / horn nocks */}
          <path
            d="M20 4.5 Q19 3.5 18.5 4"
            stroke={open ? "#fef08a" : "#a8a29e"}
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M20 23.5 Q19 24.5 18.5 24"
            stroke={open ? "#fef08a" : "#a8a29e"}
            strokeWidth="1.2"
            fill="none"
          />
          {/* Bowstring */}
          <line
            x1="18.8"
            y1="4"
            x2="18.8"
            y2="24"
            stroke={open ? "#f8fafc" : "#78716c"}
            strokeWidth="0.7"
          />
          {/* Leather grip */}
          <rect
            x="21.5"
            y="13"
            width="1.8"
            height="2"
            rx="0.3"
            fill={open ? "#78350f" : "#44403c"}
          />
          {/* Nocked arrow */}
          <line
            x1="13.5"
            y1="14"
            x2="23.5"
            y2="14"
            stroke={open ? "#f8fafc" : "#94a3b8"}
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <polygon
            points="23.5,13.1 25.8,14 23.5,14.9"
            fill={open ? "#cbd5e1" : "#71717a"}
          />
          <line
            x1="13.8"
            y1="13.2"
            x2="15.2"
            y2="14"
            stroke={open ? "#38bdf8" : "#71717a"}
            strokeWidth="0.8"
          />
          <line
            x1="13.8"
            y1="14.8"
            x2="15.2"
            y2="14"
            stroke={open ? "#38bdf8" : "#71717a"}
            strokeWidth="0.8"
          />
        </g>

        {/* 8. Morning mist wisps */}
        <path
          d="M6 24.5 Q10 23.5 14 24.5 Q18 25.5 22 24.5"
          stroke={open ? "#bae6fd" : "#64748b"}
          strokeWidth="0.8"
          fill="none"
          opacity={open ? "0.6" : "0.3"}
        />
      </svg>
    </span>
  );
}
