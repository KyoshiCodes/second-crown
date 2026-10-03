import React from "react";
import "./lancer-chip.css";

export interface LancerChipProps {
  /** Size in pixels (default: 28) */
  size?: number;
  /** Whether the unit is unlocked and available to drill */
  open?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 28px Lancer Chip:
 * - Iconic heavy shock cavalry chip for the Lancer card in the Army tab.
 * - Powerful mountain warhorse in charging gallop with steel chanfron.
 * - Heavy couched long lance with circular vamplate handguard and gleaming steel point.
 * - Flowing peak-white cloak with alpine frost highlights and mountain brooch clasp.
 * - GUARANTEE: strictly `pointer-events: none` so card buttons and clicks work unobstructed!
 */
export function LancerChip({
  size = 28,
  open = true,
  className = "",
  style,
  title,
}: LancerChipProps) {
  const statusClass = open ? "is-open" : "is-locked";

  return (
    <span
      className={`sc-lancer-chip-wrapper ${statusClass} ${className}`}
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
      title={title ?? (open ? "Lancer" : "Lancer (Locked)")}
      data-lancer-chip
      data-open={open}
    >
      <svg
        viewBox="0 0 28 28"
        width={size}
        height={size}
        className={`sc-lancer-chip ${statusClass}`}
        style={{ pointerEvents: "none", display: "block" }}
      >
        {/* 1. Ground contact shadow */}
        <ellipse cx="14" cy="25.5" rx="10.5" ry="1.8" fill="#000000" fillOpacity="0.32" />

        {/* 2. Mountain warhorse */}
        <g className="sc-lancer-horse">
          {/* Hind legs */}
          <path
            d="M8 20 L6.5 24.2 L5 24.5"
            stroke={open ? "#1e293b" : "#0f172a"}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M10 20 L8.5 24.2 L7.5 24.5"
            stroke={open ? "#334155" : "#1e293b"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="4.5" y="24" width="1.5" height="1" rx="0.3" fill="#020617" />
          <rect x="7" y="24" width="1.5" height="1" rx="0.3" fill="#020617" />

          {/* Forelegs */}
          <path
            d="M18.5 19.5 L20.5 23.5 L22 24"
            stroke={open ? "#1e293b" : "#0f172a"}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M17 19.5 L19 24 L20.5 24.5"
            stroke={open ? "#334155" : "#1e293b"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="21" y="23.5" width="1.5" height="1" rx="0.3" fill="#020617" />
          <rect x="19.5" y="24" width="1.5" height="1" rx="0.3" fill="#020617" />

          {/* Heavy warhorse tail */}
          <path
            d="M7.5 16 C4.5 17.5, 3 20.5, 2 22.5 C3.8 22, 5.5 20, 7.5 18 Z"
            fill={open ? "#0f172a" : "#020617"}
            stroke={open ? "#1e293b" : "#0f172a"}
            strokeWidth="0.4"
          />

          {/* Muscular horse torso */}
          <path
            d="M7 16 C7 14.5, 9 14, 12 14.5 C15 14, 18 14.5, 19 16 C19.5 18.5, 17 21, 14 21 C10 21, 7 19, 7 16 Z"
            fill={open ? "#334155" : "#1e293b"}
            stroke={open ? "#1e293b" : "#0f172a"}
            strokeWidth="0.6"
          />

          {/* Arched warhorse neck & head */}
          <path
            d="M17.5 15.5 L21.5 9 L24.5 10.5 L20.5 18 Z"
            fill={open ? "#334155" : "#1e293b"}
            stroke={open ? "#1e293b" : "#0f172a"}
            strokeWidth="0.5"
          />
          <ellipse
            cx="24.2"
            cy="11"
            rx="2"
            ry="1.5"
            fill={open ? "#334155" : "#1e293b"}
            stroke={open ? "#1e293b" : "#0f172a"}
            strokeWidth="0.4"
          />
          <circle cx="25.5" cy="11.5" r="0.3" fill="#020617" />
          <circle cx="23.5" cy="10.4" r="0.4" fill="#020617" />
          {/* Ears */}
          <polygon points="21.2,7.5 22.6,9.5 20.8,9" fill={open ? "#1e293b" : "#0f172a"} />
          {/* Steel chanfron forehead armor */}
          <polygon
            points="22.2,8.8 24.8,10.2 24.2,11.8 21.8,10.2"
            fill={open ? "#94a3b8" : "#64748b"}
            stroke="#475569"
            strokeWidth="0.3"
          />
          {/* Dark mane */}
          <path
            d="M17.5 14.5 L20.5 8.5 L21.8 11 L19 16 Z"
            fill={open ? "#0f172a" : "#020617"}
            opacity="0.9"
          />
          {/* Bridle */}
          <line x1="22.5" y1="9.5" x2="25" y2="12" stroke="#475569" strokeWidth="0.5" />
        </g>

        {/* 3. Saddle & trappings */}
        <g className="sc-lancer-saddle">
          <rect x="10.5" y="14" width="6.5" height="3" rx="0.6" fill={open ? "#0f172a" : "#020617"} />
          <path d="M11 14.5 C11 13.5, 16 13.5, 16 14.5 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.4" />
          <line x1="13.5" y1="14.5" x2="13.5" y2="19.5" stroke="#94a3b8" strokeWidth="0.6" />
          <rect x="12.8" y="18.5" width="2" height="2.2" rx="0.4" fill="#64748b" />
        </g>

        {/* 4. Peak-white cloak */}
        <g className="sc-lancer-cloak">
          {/* Billowing snow-white mantle */}
          <path
            d="M13.5 8.5 C10 9.5, 5 12, 3.5 16.5 C6.2 16, 9.5 15, 12 14.5 C12.5 12.5, 13 10.5, 13.5 8.5 Z"
            fill={open ? "#f8fafc" : "#94a3b8"}
            stroke={open ? "#cbd5e1" : "#64748b"}
            strokeWidth="0.6"
          />
          {/* Drapery folds */}
          <path
            d="M11 11 C8.2 12.5, 6 14, 4 16"
            stroke={open ? "#cbd5e1" : "#64748b"}
            strokeWidth="0.6"
            fill="none"
          />
          <path
            d="M12.5 13 C10.2 14, 8 15, 6 16.2"
            stroke={open ? "#e2e8f0" : "#71717a"}
            strokeWidth="0.5"
            fill="none"
          />
          {/* Frost white upper rim */}
          <path
            d="M13.5 8.5 C10 9.5, 5 12, 3.5 16.5"
            stroke={open ? "#ffffff" : "#cbd5e1"}
            strokeWidth="0.8"
            fill="none"
          />
          {/* Silver mountain peak brooch */}
          <polygon
            points="13.2,8.4 14,9.6 12.4,9.6"
            fill={open ? "#e2e8f0" : "#94a3b8"}
            stroke="#64748b"
            strokeWidth="0.3"
          />
          <circle cx="13.2" cy="9.2" r="0.3" fill="#38bdf8" />
        </g>

        {/* 5. Armored lancer knight */}
        <g className="sc-lancer-rider">
          <rect x="11.5" y="9" width="4.5" height="5.5" rx="1" fill={open ? "#64748b" : "#475569"} />
          <circle cx="14" cy="7.5" r="2.2" fill="#94a3b8" />
          {/* Visored greathelm with peak ridge */}
          <polygon
            points="12,7.8 14,3.2 16,7.8"
            fill={open ? "#cbd5e1" : "#94a3b8"}
            stroke="#475569"
            strokeWidth="0.4"
          />
          <line x1="14" y1="3.2" x2="14" y2="7.5" stroke="#ffffff" strokeWidth="0.5" />
          <line x1="12.6" y1="6.8" x2="15.4" y2="6.8" stroke="#0f172a" strokeWidth="0.6" />
        </g>

        {/* 6. Heavy long lance */}
        <g className="sc-lancer-lance">
          {/* Heavy long lance shaft */}
          <line
            x1="5"
            y1="15"
            x2="26.5"
            y2="6"
            stroke={open ? "#78350f" : "#451a03"}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Conical vamplate handguard disc */}
          <ellipse
            cx="13.5"
            cy="11.2"
            rx="1.1"
            ry="2.2"
            fill={open ? "#cbd5e1" : "#94a3b8"}
            stroke="#475569"
            strokeWidth="0.4"
          />
          {/* Gauntlet grip */}
          <rect x="12" y="11" width="1.6" height="1.4" rx="0.3" fill="#64748b" />
          {/* Forged diamond lance point */}
          <polygon
            points="28,5.2 25.2,5.2 25.8,7.2"
            fill={open ? "#ffffff" : "#e2e8f0"}
            stroke="#475569"
            strokeWidth="0.4"
          />
          <line x1="25.5" y1="6" x2="27.8" y2="5.3" stroke="#93c5fd" strokeWidth="0.4" />
          {/* Small peak-white pennon */}
          <polygon
            points="25.5,6.5 23.5,8 24.8,6"
            fill={open ? "#f8fafc" : "#cbd5e1"}
            stroke="#94a3b8"
            strokeWidth="0.3"
          />
          <line x1="24.8" y1="6.5" x2="23.8" y2="7.5" stroke="#38bdf8" strokeWidth="0.4" />
        </g>
      </svg>
    </span>
  );
}
