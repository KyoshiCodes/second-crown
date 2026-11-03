import React from "react";
import { getCulture } from "@second-crown/sim";

export interface CultureCrestPipProps {
  /** The culture identifier (e.g. "western", "woodland", "desert", "steppe", "tide", "mist", "glen", "salt", "fen", "peak") */
  cultureId: string;
  /** Whether this culture is currently selected/active */
  isSelected?: boolean;
  /** Size in pixels (default: 26) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

function CultureCharge(props: { cultureId: string }) {
  const { cultureId } = props;

  switch (cultureId) {
    case "western":
      // Crown Marches: heater shield with royal coronet and cruciform steel sword
      return (
        <g id="charge-western">
          <path d="M12 7 V18" stroke="#f8fafc" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M9 10.5 H15" stroke="#facc15" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="12" cy="18.5" r="0.9" fill="#facc15" />
          <path d="M9 7 L10.5 8.5 L12 6 L13.5 8.5 L15 7" fill="none" stroke="#facc15" strokeWidth="0.9" strokeLinejoin="round" />
          <circle cx="12" cy="10.5" r="0.75" fill="#3b82f6" />
        </g>
      );

    case "woodland":
      // Cedar Kin: sacred split-cedar pine and lobed leaf
      return (
        <g id="charge-woodland">
          <path
            d="M12 6 L14.8 9.5 H13.2 L15.8 13 H13.5 L16.5 16.8 H7.5 L10.5 13 H8.2 L10.8 9.5 H9.2 Z"
            fill="#15803d"
            stroke="#052e16"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          <rect x="11" y="16.8" width="2" height="2.2" fill="#854d0e" />
          <circle cx="12" cy="6" r="0.9" fill="#4ade80" />
        </g>
      );

    case "desert":
      // Sand Banner: radiant solar sunburst and desert crescent
      return (
        <g id="charge-desert">
          <circle cx="12" cy="12" r="3" fill="#f59e0b" stroke="#78350f" strokeWidth="0.7" />
          <path
            d="M12 6.5 V4.8 M12 17.5 V19.2 M6.5 12 H4.8 M17.5 12 H19.2 M8.2 8.2 L7 7 M15.8 15.8 L17 17 M15.8 8.2 L17 7 M8.2 15.8 L7 17"
            stroke="#fde047"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <path d="M12 9.2 A2.8 2.8 0 0 0 12 14.8 A2 2 0 0 1 12 9.2" fill="#fef08a" />
        </g>
      );

    case "steppe":
      // Wind Host: composite recurve bow and crimson horsehair plume
      return (
        <g id="charge-steppe">
          <path d="M7.5 8.5 Q12 12.5 16.5 8.5" fill="none" stroke="#e11d48" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M7.5 8.5 L12 15 L16.5 8.5" stroke="#e2e8f0" strokeWidth="0.6" strokeDasharray="1.2 1.2" />
          <path d="M12 6 V18" stroke="#9f1239" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M12 8 Q15.5 10 12 13" fill="#fb7185" opacity="0.9" />
          <circle cx="12" cy="6" r="0.9" fill="#fef08a" />
        </g>
      );

    case "tide":
      // Tide Clans: curled breaker wave and sea-triton fork
      return (
        <g id="charge-tide">
          <path d="M6 14.2 Q9 10.5 12 13.2 Q15 10.5 18 14.2" fill="none" stroke="#06b6d4" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 8 V15.5 M9.5 9.5 V12 H14.5 V9.5" fill="none" stroke="#38bdf8" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="18" r="1.1" fill="#f8fafc" stroke="#0e7490" strokeWidth="0.6" />
        </g>
      );

    case "mist":
      // Mist Reach: swirling mist shroud and woodland ranger arrow
      return (
        <g id="charge-mist">
          <path d="M7 11.2 Q12 7.5 17 11.2" stroke="#94a3b8" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M8 15 Q12 17.8 16 14.2" stroke="#cbd5e1" strokeWidth="1.0" fill="none" strokeLinecap="round" />
          <path d="M12 6 V17 M10 8 L12 6 L14 8 M10 15.5 L12 17 L14 15.5" stroke="#86efac" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="11.5" r="1.1" fill="#4ade80" />
        </g>
      );

    case "glen":
      // Glen Holds: stone crag hold and chivalric banner standard
      return (
        <g id="charge-glen">
          <path d="M7 17.5 L10 13 L12 14.8 L14.8 11.2 L17 17.5 Z" fill="#44403c" stroke="#78716c" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M11 6.8 V16.5" stroke="#a3e635" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M11 6.8 L16 9.2 L11 11.8 Z" fill="#65a30d" stroke="#365314" strokeWidth="0.7" strokeLinejoin="round" />
        </g>
      );

    case "salt":
      // Salt Reaches: faceted salt diamond and couched lance
      return (
        <g id="charge-salt">
          <path d="M12 7 L16 12 L12 17 L8 12 Z" fill="#f1f5f9" stroke="#0284c7" strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M12 7 V17 M8 12 H16" stroke="#38bdf8" strokeWidth="0.6" />
          <path d="M6.5 17.5 L17.5 6.5" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round" />
          <polygon points="16,7.5 17.5,6.5 16.5,8" fill="#38bdf8" />
        </g>
      );

    case "fen":
      // Fen Steads: water-reed sheaf and warden marsh spearhead
      return (
        <g id="charge-fen">
          <path d="M8 17.5 Q9.2 12 10.2 7 M16 17.5 Q14.8 12 13.8 7 M12 17.5 V6" stroke="#65a30d" strokeWidth="1.1" fill="none" strokeLinecap="round" />
          <path d="M10.2 9 L12 5.2 L13.8 9 L12 10.8 Z" fill="#84cc16" stroke="#1a2e05" strokeWidth="0.7" strokeLinejoin="round" />
          <circle cx="12" cy="15" r="1.2" fill="#facc15" />
        </g>
      );

    case "peak":
      // Peak Holds: snow pinnacle and watchtower beacon flame
      return (
        <g id="charge-peak">
          <path d="M6.5 17.8 L12 8.2 L17.5 17.8 Z" fill="#334155" stroke="#64748b" strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M10 13.2 L12 8.2 L14 13.2 L13 12.2 L12 13.2 L11 12.2 Z" fill="#f8fafc" />
          <path d="M12 4.8 Q13.2 6.5 12 8 Q10.8 6.5 12 4.8" fill="#f97316" stroke="#ea580c" strokeWidth="0.6" />
          <circle cx="12" cy="4.2" r="0.7" fill="#fef08a" />
        </g>
      );

    default:
      return null;
  }
}

/**
 * Living Culture Crest Pip:
 * - Renders a distinct, detailed heraldic crest for each of the 10 cultures.
 * - Shows an animated breathing aura and radiant crown glint when active/selected.
 * - GUARANTEE: pointer-events: none !important on all overlay and svg elements.
 */
export function CultureCrestPip({
  cultureId,
  isSelected = false,
  size = 26,
  className = "",
  style,
}: CultureCrestPipProps) {
  const culture = getCulture(cultureId);
  const tabard = culture.palette.tabard;
  const pickedClass = isSelected ? "is-selected" : "is-idle";

  return (
    <span
      className={`sc-culture-crest ${pickedClass} ${className}`}
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
      data-culture={cultureId}
      data-picked={isSelected}
    >
      {/* Living breathing glow aura when selected */}
      {isSelected && (
        <span
          className="sc-culture-crest-aura"
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${tabard}44 0%, transparent 72%)`,
            pointerEvents: "none",
          }}
        />
      )}

      <svg
        className="sc-culture-crest-svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={{
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <defs>
          <filter id={`crest-shadow-${cultureId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1" floodColor="#000000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Shield drop shadow & body */}
        <path
          d="M12 2.5 L19.5 5.5 V12.5 C19.5 17.5 16.2 20.8 12 22 C7.8 20.8 4.5 17.5 4.5 12.5 V5.5 Z"
          fill="#0b0f17"
          stroke={isSelected ? "#f59e0b" : tabard}
          strokeWidth={isSelected ? "1.4" : "1.0"}
          strokeLinejoin="round"
          filter={`url(#crest-shadow-${cultureId})`}
          style={{ pointerEvents: "none" }}
        />

        {/* Inner heraldic field texture */}
        <path
          d="M12 3.8 L18.2 6.2 V12.2 C18.2 16.5 15.5 19.3 12 20.5 C8.5 19.3 5.8 16.5 5.8 12.2 V6.2 Z"
          fill={tabard}
          opacity={isSelected ? "0.32" : "0.22"}
          style={{ pointerEvents: "none" }}
        />

        {/* Heraldic charge art */}
        <CultureCharge cultureId={cultureId} />

        {/* Living apex crown star / glint when selected */}
        {isSelected ? (
          <g className="sc-culture-crest-glint" style={{ pointerEvents: "none" }}>
            <circle cx="12" cy="2.2" r="1.3" fill="#fef08a" />
            <path d="M12 0.6 V3.8 M10.4 2.2 H13.6" stroke="#facc15" strokeWidth="0.6" strokeLinecap="round" />
          </g>
        ) : null}
      </svg>
    </span>
  );
}
