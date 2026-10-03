import React from "react";
import "./banner-chip.css";

export interface BannerChipProps {
  /** Size in pixels (default: 28) */
  size?: number;
  /** Whether the unit is unlocked and available to drill */
  open?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 28px Banner Chip:
 * - Iconic heraldic banner unit chip for the Banner card in the Army tab.
 * - Tall ash wood spear with leaf-shaped steel spearhead.
 * - Small heraldic swallowtail pennant streaming from below the spearhead.
 * - Billowing glen-green cloak fastened by a stone/bronze ring clasp.
 * - GUARANTEE: strictly `pointer-events: none` so card buttons and clicks work unobstructed!
 */
export function BannerChip({
  size = 28,
  open = true,
  className = "",
  style,
  title,
}: BannerChipProps) {
  const statusClass = open ? "is-open" : "is-locked";

  return (
    <span
      className={`sc-banner-chip-wrapper ${statusClass} ${className}`}
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
      title={title ?? (open ? "Banner" : "Banner (Locked)")}
      data-banner-chip
      data-open={open}
    >
      <svg
        viewBox="0 0 28 28"
        width={size}
        height={size}
        className={`sc-banner-chip ${statusClass}`}
        style={{ pointerEvents: "none", display: "block" }}
      >
        {/* 1. Ground contact shadow */}
        <ellipse cx="13.5" cy="25" rx="6.5" ry="1.8" fill="#000000" fillOpacity="0.32" />

        {/* 2. Highland leather boots & greaves */}
        <rect x="11" y="21" width="2.2" height="4" rx="0.5" fill="#1e293b" />
        <rect x="13.8" y="21" width="2.2" height="4" rx="0.5" fill="#0f172a" />

        {/* 3. Glen-green cloak */}
        <g className="sc-banner-cloak">
          {/* Billowing mantle body */}
          <path
            d="M13.5 7.5 C9 9.5, 5.5 14, 5.5 22.5 C8 23.5, 10.5 23, 13.5 23.5 C16.5 23, 19 23.5, 21.5 22.5 C21.5 14, 18 9.5, 13.5 7.5 Z"
            fill={open ? "#4d7c0f" : "#3f4a36"}
            stroke={open ? "#365314" : "#1e293b"}
            strokeWidth="0.7"
          />
          {/* Drapery fold lines */}
          <path
            d="M10.5 11.5 C9.5 15, 9 19, 7.5 22"
            stroke={open ? "#365314" : "#1e293b"}
            strokeWidth="0.75"
            fill="none"
          />
          <path
            d="M16 11.5 C17 15, 17.5 19, 19 22"
            stroke={open ? "#365314" : "#1e293b"}
            strokeWidth="0.75"
            fill="none"
          />
          {/* Glen-green moss highlights on mantle rim */}
          <path
            d="M5.5 22.5 C5.5 14, 9 9.5, 13.5 7.5"
            stroke={open ? "#84cc16" : "#52525b"}
            strokeWidth="0.8"
            fill="none"
            opacity="0.9"
          />
          <path
            d="M13.5 7.5 C18 9.5, 21.5 14, 21.5 22.5"
            stroke={open ? "#65a30d" : "#71717a"}
            strokeWidth="0.5"
            fill="none"
            opacity="0.75"
          />
          {/* Highland stone/bronze ring brooch at collar */}
          <circle cx="13.5" cy="12.8" r="1.1" fill={open ? "#78716c" : "#52525b"} stroke="#44403c" strokeWidth="0.4" />
          <circle cx="13.5" cy="12.8" r="0.4" fill={open ? "#facc15" : "#a1a1aa"} />
        </g>

        {/* 4. Steel helmet & head */}
        <g className="sc-banner-helm">
          {/* Iron nasal kettle helm */}
          <ellipse cx="13.5" cy="11.5" rx="3.8" ry="1.2" fill={open ? "#64748b" : "#52525b"} stroke="#334155" strokeWidth="0.4" />
          <path
            d="M11 11.5 C11 6.5, 16 6.5, 16 11.5 Z"
            fill={open ? "#94a3b8" : "#71717a"}
            stroke="#475569"
            strokeWidth="0.5"
          />
          <rect x="13" y="11" width="1" height="2.5" fill="#334155" />
          <circle cx="12.2" cy="11.8" r="0.4" fill="#0f172a" />
          <circle cx="14.8" cy="11.8" r="0.4" fill="#0f172a" />
          <line x1="13.5" y1="7" x2="13.5" y2="10" stroke="#f1f5f9" strokeWidth="0.6" />
        </g>

        {/* 5. Highland targe shield on off-arm */}
        <g className="sc-banner-shield">
          <ellipse cx="9" cy="16.5" rx="3.2" ry="4" fill={open ? "#365314" : "#27272a"} stroke={open ? "#a16207" : "#475569"} strokeWidth="0.8" />
          <circle cx="9" cy="16.5" r="1.1" fill={open ? "#facc15" : "#78716c"} />
        </g>

        {/* 6. Tall spear shaft & leaf spearhead */}
        <g className="sc-banner-spear">
          {/* Ash spear shaft */}
          <line
            x1="18.5"
            y1="24.5"
            x2="18.5"
            y2="3.5"
            stroke={open ? "#78350f" : "#44403c"}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* Forged steel spearhead */}
          <polygon
            points="18.5,1.2 17,3.6 17.6,5.6 18.5,4.8 19.4,5.6 20,3.6"
            fill={open ? "#f1f5f9" : "#a1a1aa"}
            stroke="#475569"
            strokeWidth="0.4"
          />
          <line x1="18.5" y1="1.6" x2="18.5" y2="4.8" stroke="#ffffff" strokeWidth="0.5" />
          {/* Spear cross-stop / collar */}
          <rect x="17.5" y="5.2" width="2" height="0.9" rx="0.2" fill="#64748b" />
        </g>

        {/* 7. Small flying heraldic pennant */}
        <g className="sc-banner-pennant">
          {/* Flying swallowtail pennant */}
          <path
            d="M18.5 5.8 L26 6.8 L23.8 8.8 L26 10.8 L18.5 11.8 Z"
            fill={open ? "#facc15" : "#78716c"}
            stroke={open ? "#b45309" : "#44403c"}
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
          {/* Heraldic stripe down the pennant */}
          <path
            d="M18.5 8.8 L23.8 8.8"
            stroke={open ? "#dc2626" : "#475569"}
            strokeWidth="1"
          />
          {/* Fastening ties at spear shaft */}
          <line x1="18" y1="6.5" x2="19" y2="6.5" stroke="#fef08a" strokeWidth="0.7" />
          <line x1="18" y1="11.2" x2="19" y2="11.2" stroke="#fef08a" strokeWidth="0.7" />
        </g>
      </svg>
    </span>
  );
}
