import React from "react";
import "./dawn-seal.css";

export interface DawnSealPipProps {
  /** Whether the Second Dawn has risen (player has ascended, ach_ascend completed) */
  active?: boolean;
  /** Size in pixels (default: 28) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 28px Dawn Seal Pip:
 * - Stamped royal solar wax seal celebrating the Second Dawn.
 * - Features dual hanging amber silk ribbons with swallowtail ends.
 * - Scalloped poured wax seal disk with raised bezel and beaded signet matrix rim.
 * - Stamped sigil: radiant Second Dawn sun rising above the horizon line with morning rays,
 *   crowned by the Second Crown crest and morning star glint.
 * - Dormant state: deep antique slate/bronze seal awaiting ascension.
 * - Risen/active state: glorious molten gold solar seal with radiant aura.
 * GUARANTEE: strictly pointer-events: none so clicks and cards are never blocked.
 */
export function DawnSealPip({
  active = false,
  size = 28,
  className = "",
  style,
  title,
}: DawnSealPipProps) {
  const statusClass = active ? "is-risen is-active" : "is-dormant";

  return (
    <span
      className={`sc-dawn-seal-wrapper ${statusClass} ${className}`}
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
      title={title ?? (active ? "Second Dawn Risen" : "Second Dawn")}
      data-dawn-seal
      data-active={active}
      data-risen={active}
    >
      <svg
        viewBox="0 0 28 28"
        width={size}
        height={size}
        className={`sc-dawn-seal ${statusClass}`}
        style={{ pointerEvents: "none", display: "block" }}
      >
        {/* 1. Hanging silk ceremonial ribbons */}
        <g className="sc-dawn-ribbons">
          {/* Left ribbon */}
          <polygon
            points="9.5,17 7,27 10.5,24.5 13,27 12,17"
            fill={active ? "#d97706" : "#475569"}
            stroke={active ? "#92400e" : "#1e293b"}
            strokeWidth="0.5"
          />
          <line
            x1="10.75"
            y1="17"
            x2="10.5"
            y2="24.5"
            stroke={active ? "#b45309" : "#334155"}
            strokeWidth="0.4"
          />
          {/* Right ribbon */}
          <polygon
            points="16,17 15,27 17.5,24.5 21,27 18.5,17"
            fill={active ? "#f59e0b" : "#334155"}
            stroke={active ? "#b45309" : "#0f172a"}
            strokeWidth="0.5"
          />
          <line
            x1="17.25"
            y1="17"
            x2="17.5"
            y2="24.5"
            stroke={active ? "#d97706" : "#1e293b"}
            strokeWidth="0.4"
          />
        </g>

        {/* 2. Poured scalloped wax puddle */}
        <path
          d="M14,2 C16.6,2 18.8,2.7 20.6,4.1 C22.4,5.5 23.6,7.3 24.3,9.4 C25,11.5 25,13.6 24.3,15.6 C23.6,17.7 22.2,19.4 20.4,20.6 C18.6,21.8 16.4,22.5 14,22.5 C11.6,22.5 9.4,21.8 7.6,20.6 C5.8,19.4 4.4,17.7 3.7,15.6 C3,13.6 3,11.5 3.7,9.4 C4.4,7.3 5.6,5.5 7.4,4.1 C9.2,2.7 11.4,2 14,2 Z"
          fill={active ? "#d97706" : "#334155"}
          stroke={active ? "#92400e" : "#1e293b"}
          strokeWidth="0.8"
        />

        {/* 3. Outer golden bezel ring */}
        <circle
          cx="14"
          cy="12.2"
          r="8.8"
          fill={active ? "#f59e0b" : "#475569"}
          stroke={active ? "#b45309" : "#1e293b"}
          strokeWidth="0.8"
        />

        {/* 4. Pressed honey/dusk matrix bed */}
        <circle
          cx="14"
          cy="12.2"
          r="7.4"
          fill={active ? "#fbbf24" : "#1e293b"}
          stroke={active ? "#d97706" : "#0f172a"}
          strokeWidth="0.5"
        />

        {/* 5. Pearled milled signet rim */}
        <circle
          cx="14"
          cy="12.2"
          r="6.5"
          fill="none"
          stroke={active ? "#fef08a" : "#64748b"}
          strokeWidth="0.6"
          strokeDasharray="1.2 1.2"
        />

        {/* 6. Stamped Sigil: Second Dawn rising sun & horizon */}
        <g className="sc-dawn-sigil">
          {/* Horizon morning contour */}
          <path
            d="M8.2 13.8 C10.5 13.2 13 13.6 14 13.6 C15 13.6 17.5 13.2 19.8 13.8"
            fill="none"
            stroke={active ? "#b45309" : "#475569"}
            strokeWidth="0.6"
            strokeLinecap="round"
          />
          {/* Ground/water lines below horizon */}
          <line
            x1="9.6"
            y1="15.2"
            x2="18.4"
            y2="15.2"
            stroke={active ? "#d97706" : "#334155"}
            strokeWidth="0.5"
            strokeDasharray="1.2 0.8"
          />
          <line
            x1="11.2"
            y1="16.5"
            x2="16.8"
            y2="16.5"
            stroke={active ? "#b45309" : "#1e293b"}
            strokeWidth="0.5"
          />

          {/* Celestial sunburst rays */}
          <g className="sc-dawn-rays">
            {/* Center vertical ray */}
            <line
              x1="14"
              y1="10.0"
              x2="14"
              y2="7.0"
              stroke={active ? "#ffffff" : "#64748b"}
              strokeWidth="0.75"
              strokeLinecap="round"
            />
            {/* Upper diagonal rays */}
            <line
              x1="12.2"
              y1="10.8"
              x2="10.2"
              y2="8.4"
              stroke={active ? "#fef08a" : "#64748b"}
              strokeWidth="0.65"
              strokeLinecap="round"
            />
            <line
              x1="15.8"
              y1="10.8"
              x2="17.8"
              y2="8.4"
              stroke={active ? "#fef08a" : "#64748b"}
              strokeWidth="0.65"
              strokeLinecap="round"
            />
            {/* Wide side rays */}
            <line
              x1="11.0"
              y1="12.0"
              x2="8.8"
              y2="10.8"
              stroke={active ? "#fef08a" : "#475569"}
              strokeWidth="0.55"
              strokeLinecap="round"
            />
            <line
              x1="17.0"
              y1="12.0"
              x2="19.2"
              y2="10.8"
              stroke={active ? "#fef08a" : "#475569"}
              strokeWidth="0.55"
              strokeLinecap="round"
            />
            {/* Intermediate rays */}
            <line
              x1="13.0"
              y1="10.2"
              x2="12.0"
              y2="7.8"
              stroke={active ? "#fef08a" : "#475569"}
              strokeWidth="0.5"
              strokeLinecap="round"
            />
            <line
              x1="15.0"
              y1="10.2"
              x2="16.0"
              y2="7.8"
              stroke={active ? "#fef08a" : "#475569"}
              strokeWidth="0.5"
              strokeLinecap="round"
            />
          </g>

          {/* Semicircular rising dawn sun */}
          <path
            d="M10.8 13.6 A3.2 3.2 0 0 1 17.2 13.6 Z"
            fill={active ? "#ffffff" : "#94a3b8"}
            stroke={active ? "#f59e0b" : "#475569"}
            strokeWidth="0.4"
          />
          {/* Inner solar core */}
          <path
            d="M12.2 13.6 A1.8 1.8 0 0 1 15.8 13.6 Z"
            fill={active ? "#fef08a" : "#cbd5e1"}
          />

          {/* Second Crown crest coronating the dawn */}
          <path
            d="M12.2 9.8 L15.8 9.8 L15.8 8.4 L15.0 9.2 L14.0 6.8 L13.0 9.2 L12.2 8.4 Z"
            fill={active ? "#fef08a" : "#cbd5e1"}
            stroke={active ? "#b45309" : "#334155"}
            strokeWidth="0.4"
            strokeLinejoin="round"
          />
          {/* Crown jewel point */}
          <circle
            cx="14.0"
            cy="6.8"
            r="0.45"
            fill={active ? "#ffffff" : "#f1f5f9"}
          />

          {/* Morning star / dawn glint */}
          <g className="sc-dawn-glint">
            <circle
              cx="18.5"
              cy="6.2"
              r="0.75"
              fill={active ? "#ffffff" : "#94a3b8"}
            />
            <path
              d="M18.5 4.6 V7.8 M16.9 6.2 H20.1"
              stroke={active ? "#ffffff" : "#94a3b8"}
              strokeWidth="0.55"
              strokeLinecap="round"
            />
            <circle
              cx="9.2"
              cy="7.0"
              r="0.45"
              fill={active ? "#fef08a" : "#64748b"}
            />
          </g>
        </g>
      </svg>
    </span>
  );
}
