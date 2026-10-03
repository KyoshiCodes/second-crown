import React from "react";
import "./outrider-chip.css";

export interface OutriderChipProps {
  /** Size in pixels (default: 28) */
  size?: number;
  /** Whether the unit is unlocked and available to train */
  open?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 28px Outrider Chip:
 * - Iconic scout cavalry chip for the Outrider card in the Army tab.
 * - Agile scout horse in charging gallop with flowing mane and tail.
 * - Short couched lance with forged leaf point and pennon.
 * - Billowing salt-grey cloak with silver mist highlights fastened by a brooch clasp.
 * - GUARANTEE: strictly `pointer-events: none` so card buttons and clicks work unobstructed!
 */
export function OutriderChip({
  size = 28,
  open = true,
  className = "",
  style,
  title,
}: OutriderChipProps) {
  const statusClass = open ? "is-open" : "is-locked";

  return (
    <span
      className={`sc-outrider-chip-wrapper ${statusClass} ${className}`}
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
      title={title ?? (open ? "Outrider" : "Outrider (Locked)")}
      data-outrider-chip
      data-open={open}
    >
      <svg
        viewBox="0 0 28 28"
        width={size}
        height={size}
        className={`sc-outrider-chip ${statusClass}`}
        style={{ pointerEvents: "none", display: "block" }}
      >
        {/* 1. Ground contact shadow */}
        <ellipse cx="14" cy="25.5" rx="10.5" ry="1.8" fill="#000000" fillOpacity="0.32" />

        {/* 2. Scout horse */}
        <g className="sc-outrider-horse">
          {/* Hind legs */}
          <path
            d="M8 20 L6.5 24.2 L5 24.5"
            stroke={open ? "#475569" : "#334155"}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M10 20 L8.5 24.2 L7.5 24.5"
            stroke={open ? "#64748b" : "#475569"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="4.5" y="24" width="1.5" height="1" rx="0.3" fill="#0f172a" />
          <rect x="7" y="24" width="1.5" height="1" rx="0.3" fill="#0f172a" />

          {/* Forelegs */}
          <path
            d="M18.5 19.5 L20.5 23.5 L22 24"
            stroke={open ? "#475569" : "#334155"}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M17 19.5 L19 24 L20.5 24.5"
            stroke={open ? "#64748b" : "#475569"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="21" y="23.5" width="1.5" height="1" rx="0.3" fill="#0f172a" />
          <rect x="19.5" y="24" width="1.5" height="1" rx="0.3" fill="#0f172a" />

          {/* Flowing horse tail */}
          <path
            d="M7.5 16 C4.5 17.5, 3 20.5, 2 22.5 C3.8 22, 5.5 20, 7.5 18 Z"
            fill={open ? "#334155" : "#1e293b"}
            stroke={open ? "#475569" : "#334155"}
            strokeWidth="0.4"
          />

          {/* Muscular horse torso */}
          <path
            d="M7 16 C7 14.5, 9 14, 12 14.5 C15 14, 18 14.5, 19 16 C19.5 18.5, 17 21, 14 21 C10 21, 7 19, 7 16 Z"
            fill={open ? "#64748b" : "#475569"}
            stroke={open ? "#475569" : "#334155"}
            strokeWidth="0.6"
          />

          {/* Arched scout neck & head */}
          <path
            d="M17.5 15.5 L21.5 9 L24.5 10.5 L20.5 18 Z"
            fill={open ? "#64748b" : "#475569"}
            stroke={open ? "#475569" : "#334155"}
            strokeWidth="0.5"
          />
          <ellipse
            cx="24.2"
            cy="11"
            rx="2"
            ry="1.5"
            fill={open ? "#64748b" : "#475569"}
            stroke={open ? "#475569" : "#334155"}
            strokeWidth="0.4"
          />
          <circle cx="25.5" cy="11.5" r="0.3" fill="#0f172a" />
          <circle cx="23.5" cy="10.4" r="0.4" fill="#0f172a" />
          {/* Ears */}
          <polygon points="21.2,7.5 22.6,9.5 20.8,9" fill={open ? "#475569" : "#334155"} />
          {/* Salt-frosted mane */}
          <path
            d="M17.5 14.5 L20.5 8.5 L21.8 11 L19 16 Z"
            fill={open ? "#cbd5e1" : "#64748b"}
            opacity="0.9"
          />
          {/* Bridle & reins */}
          <line x1="22.5" y1="9.5" x2="25" y2="12" stroke="#1e293b" strokeWidth="0.5" />
          <path d="M24 11.5 C20 14, 16 14, 14 13" stroke="#1e293b" strokeWidth="0.5" fill="none" />
        </g>

        {/* 3. Saddle & trappings */}
        <g className="sc-outrider-saddle">
          <rect x="10.5" y="14" width="6.5" height="3" rx="0.6" fill={open ? "#1e293b" : "#0f172a"} />
          <path d="M11 14.5 C11 13.5, 16 13.5, 16 14.5 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.4" />
          <line x1="13.5" y1="14.5" x2="13.5" y2="19.5" stroke="#94a3b8" strokeWidth="0.6" />
          <rect x="12.8" y="18.5" width="2" height="2.2" rx="0.4" fill="#0f172a" />
        </g>

        {/* 4. Salt-grey cloak */}
        <g className="sc-outrider-cloak">
          {/* Billowing mantle body */}
          <path
            d="M13.5 8.5 C10 9.5, 5.5 12, 4 16.5 C6.5 16, 9.5 15, 12 14.5 C12.5 12.5, 13 10.5, 13.5 8.5 Z"
            fill={open ? "#94a3b8" : "#64748b"}
            stroke={open ? "#475569" : "#334155"}
            strokeWidth="0.6"
          />
          {/* Drapery fold lines */}
          <path
            d="M11 11 C8.5 12.5, 6.5 14, 4.5 16"
            stroke={open ? "#475569" : "#1e293b"}
            strokeWidth="0.6"
            fill="none"
          />
          {/* Sea-salt mist highlights on upper mantle rim */}
          <path
            d="M13.5 8.5 C10 9.5, 5.5 12, 4 16.5"
            stroke={open ? "#cbd5e1" : "#94a3b8"}
            strokeWidth="0.8"
            fill="none"
            opacity="0.9"
          />
          <path
            d="M4 16.5 C6.5 16, 9.5 15, 12 14.5"
            stroke={open ? "#e2e8f0" : "#94a3b8"}
            strokeWidth="0.5"
            fill="none"
            opacity="0.8"
          />
          {/* Salt-silver brooch clasp */}
          <circle cx="13.2" cy="9.2" r="0.9" fill={open ? "#cbd5e1" : "#94a3b8"} stroke="#475569" strokeWidth="0.3" />
          <circle cx="13.2" cy="9.2" r="0.3" fill={open ? "#f8fafc" : "#e2e8f0"} />
        </g>

        {/* 5. Rider & conical iron helm */}
        <g className="sc-outrider-rider">
          <rect x="11.5" y="9" width="4.5" height="5.5" rx="1" fill={open ? "#475569" : "#334155"} />
          <circle cx="14" cy="7.5" r="2.2" fill="#fbcfe8" />
          {/* Conical iron scout helm with nasal bar */}
          <polygon
            points="12,7.8 14,3.2 16,7.8"
            fill={open ? "#94a3b8" : "#64748b"}
            stroke="#475569"
            strokeWidth="0.4"
          />
          <line x1="14" y1="3.2" x2="14" y2="7.5" stroke="#f1f5f9" strokeWidth="0.5" />
          <line x1="14" y1="7.5" x2="14" y2="9.2" stroke="#334155" strokeWidth="0.6" />
        </g>

        {/* 6. Short lance */}
        <g className="sc-outrider-lance">
          {/* Ash short lance shaft */}
          <line
            x1="7.5"
            y1="14"
            x2="25.5"
            y2="6.5"
            stroke={open ? "#78350f" : "#451a03"}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          {/* Handgrip & rider hand */}
          <rect x="12.5" y="11.2" width="2" height="1.2" rx="0.3" fill="#92400e" stroke="#451a03" strokeWidth="0.3" />
          <circle cx="13.5" cy="11.8" r="0.9" fill="#fbcfe8" />
          {/* Forged steel lance point */}
          <polygon
            points="27.5,5.6 24.5,5.8 25.2,7.4"
            fill={open ? "#f1f5f9" : "#cbd5e1"}
            stroke="#475569"
            strokeWidth="0.4"
          />
          <line x1="25" y1="6.5" x2="27.2" y2="5.8" stroke="#ffffff" strokeWidth="0.4" />
          {/* Small salt-silver pennon */}
          <polygon
            points="24.8,6.8 23,8 24.2,6"
            fill={open ? "#cbd5e1" : "#94a3b8"}
            stroke="#64748b"
            strokeWidth="0.3"
          />
        </g>
      </svg>
    </span>
  );
}
