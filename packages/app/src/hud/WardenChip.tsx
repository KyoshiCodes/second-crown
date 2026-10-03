import React from "react";
import "./warden-chip.css";

export interface WardenChipProps {
  /** Size in pixels (default: 28) */
  size?: number;
  /** Whether the unit is unlocked and available to drill */
  open?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 28px Warden Chip:
 * - Iconic marsh hold guard chip for the Warden card in the Army tab.
 * - Sturdy short spear with leaf-shaped steel point and reed bindings.
 * - Woven reed and iron-rimmed round boss shield on off-arm.
 * - Layered fen-reed cloak with rush frills and carved bone toggle.
 * - GUARANTEE: strictly `pointer-events: none` so card buttons and clicks work unobstructed!
 */
export function WardenChip({
  size = 28,
  open = true,
  className = "",
  style,
  title,
}: WardenChipProps) {
  const statusClass = open ? "is-open" : "is-locked";

  return (
    <span
      className={`sc-warden-chip-wrapper ${statusClass} ${className}`}
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
      title={title ?? (open ? "Warden" : "Warden (Locked)")}
      data-warden-chip
      data-open={open}
    >
      <svg
        viewBox="0 0 28 28"
        width={size}
        height={size}
        className={`sc-warden-chip ${statusClass}`}
        style={{ pointerEvents: "none", display: "block" }}
      >
        {/* 1. Ground contact shadow */}
        <ellipse cx="14" cy="25" rx="7" ry="1.8" fill="#000000" fillOpacity="0.32" />

        {/* 2. Marsh boots & leggings */}
        <rect x="11" y="21" width="2.4" height="4" rx="0.5" fill="#1c1917" />
        <rect x="14" y="21" width="2.4" height="4" rx="0.5" fill="#292524" />

        {/* 3. Fen-reed cloak */}
        <g className="sc-warden-cloak">
          {/* Base mantle body */}
          <path
            d="M14 7.5 C9 9.5, 5.5 14, 5.5 22.5 C8 23.5, 10.5 23, 14 23.5 C17.5 23, 20 23.5, 22.5 22.5 C22.5 14, 19 9.5, 14 7.5 Z"
            fill={open ? "#365314" : "#27272a"}
            stroke={open ? "#1a2e05" : "#18181b"}
            strokeWidth="0.7"
          />
          {/* Reed thatch / rush fringes */}
          <path
            d="M7 17 L6 23 M9 15 L8.5 22.5 M11 13 L10.5 22"
            stroke={open ? "#65a30d" : "#44403c"}
            strokeWidth="0.75"
            strokeLinecap="round"
          />
          <path
            d="M21 17 L22 23 M19 15 L19.5 22.5 M17 13 L17.5 22"
            stroke={open ? "#65a30d" : "#44403c"}
            strokeWidth="0.75"
            strokeLinecap="round"
          />
          {/* Golden dry reed tips */}
          <path
            d="M6 22 L5.5 23 M8.5 21.5 L8 22.8 M19.5 21.5 L20 22.8 M22 22 L22.5 23"
            stroke={open ? "#eab308" : "#78716c"}
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          {/* Carved bone/horn toggle clasp at collar */}
          <rect
            x="12.5"
            y="11.8"
            width="3"
            height="1.2"
            rx="0.5"
            fill={open ? "#fef08a" : "#a8a29e"}
            stroke="#44403c"
            strokeWidth="0.3"
            transform="rotate(-10 14 12.4)"
          />
          <circle cx="14" cy="12.4" r="0.4" fill="#78350f" />
        </g>

        {/* 4. Warden head & kettle helm */}
        <g className="sc-warden-helm">
          <circle cx="14" cy="11.5" r="2.8" fill="#fbcfe8" />
          <ellipse
            cx="14"
            cy="11"
            rx="4.2"
            ry="1.3"
            fill={open ? "#64748b" : "#475569"}
            stroke="#334155"
            strokeWidth="0.4"
          />
          <path
            d="M11 11 C11 6, 17 6, 17 11 Z"
            fill={open ? "#94a3b8" : "#64748b"}
            stroke="#475569"
            strokeWidth="0.5"
          />
          <line x1="14" y1="6.5" x2="14" y2="10" stroke="#f1f5f9" strokeWidth="0.6" />
          <rect x="13.5" y="10.8" width="1" height="2.2" fill="#334155" />
        </g>

        {/* 5. Round shield on off-arm */}
        <g className="sc-warden-shield">
          {/* Outer reinforced iron rim */}
          <circle
            cx="8.5"
            cy="16.5"
            r="4.8"
            fill={open ? "#3f6212" : "#292524"}
            stroke={open ? "#65a30d" : "#52525b"}
            strokeWidth="0.9"
          />
          {/* Woven reed cross-bands */}
          <line
            x1="4.5"
            y1="16.5"
            x2="12.5"
            y2="16.5"
            stroke={open ? "#a16207" : "#44403c"}
            strokeWidth="0.7"
          />
          <line
            x1="8.5"
            y1="12.5"
            x2="8.5"
            y2="20.5"
            stroke={open ? "#a16207" : "#44403c"}
            strokeWidth="0.7"
          />
          {/* Bronze/iron center boss */}
          <circle
            cx="8.5"
            cy="16.5"
            r="1.6"
            fill={open ? "#facc15" : "#78716c"}
            stroke="#44403c"
            strokeWidth="0.4"
          />
          <circle cx="8.5" cy="16.5" r="0.6" fill="#fef08a" />
        </g>

        {/* 6. Short spear */}
        <g className="sc-warden-spear">
          {/* Marsh-wood shaft */}
          <line
            x1="19.5"
            y1="24.5"
            x2="19.5"
            y2="4.5"
            stroke={open ? "#78350f" : "#44403c"}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Leaf-shaped forged steel spearhead */}
          <polygon
            points="19.5,1.8 17.8,4.5 18.5,6.5 19.5,5.8 20.5,6.5 21.2,4.5"
            fill={open ? "#f1f5f9" : "#a1a1aa"}
            stroke="#475569"
            strokeWidth="0.4"
          />
          <line x1="19.5" y1="2.2" x2="19.5" y2="5.8" stroke="#ffffff" strokeWidth="0.5" />
          {/* Reed/leather binding stop */}
          <rect x="18.5" y="6.2" width="2" height="1.2" rx="0.2" fill={open ? "#ca8a04" : "#52525b"} />
          <line x1="18.2" y1="6.8" x2="20.8" y2="6.8" stroke="#fef08a" strokeWidth="0.5" />
          {/* Guard hand gripping shaft */}
          <rect x="17.8" y="14" width="2.2" height="2" rx="0.5" fill="#44403c" />
          <circle cx="18.9" cy="15" r="0.9" fill="#fbcfe8" />
        </g>
      </svg>
    </span>
  );
}
