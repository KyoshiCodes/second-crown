import React from "react";

export interface WaxSealPipProps {
  /** Whether the royal decree or craft is currently active / owned (when true, seal is lit!) */
  active?: boolean;
  /** Size in pixels (default: 24) */
  size?: number;
  /** Optional decree ID to specialize emblem ("muster", "rite", "envoys") */
  decreeId?: string;
  /** Optional craft ID to specialize emblem ("harvest_charm", "drill_manual", "silk_seal", "steel_bit", "war_horn") */
  craftId?: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 24px Wax-Seal Pip:
 * - Circular stamped royal wax seal with hanging ribbons and signet crown emblem.
 * - Inactive state: deep crimson pressed wax with matrix indent.
 * - Active state: LIT! Warm golden molten wax with radiant core and flame glint.
 * GUARANTEE: strictly pointer-events: none so clicks are never blocked!
 */
export function WaxSealPip({
  active = false,
  size = 24,
  decreeId,
  craftId,
  className = "",
  style,
  title,
}: WaxSealPipProps) {
  const litClass = active ? "is-lit" : "is-dormant";
  const decreeClass = decreeId ? `sc-decree-seal-${decreeId}` : "";
  const craftClass = craftId ? `sc-craft-seal sc-craft-seal-${craftId}` : "";

  return (
    <span
      className={`sc-wax-seal-pip-wrapper ${litClass} ${decreeClass} ${craftClass} ${className}`}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
      title={title}
      data-wax-seal
      data-active={active}
      data-craft={craftId}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={`sc-wax-seal-pip ${litClass} ${className}`}
        style={{ pointerEvents: "none" }}
        data-active={active}
        data-decree={decreeId}
        data-craft={craftId}
      >
        {/* 1. Hanging royal ribbon tails underneath seal */}
        {active ? (
          <g className="sc-wax-ribbons">
            <polygon
              points="8.5,15 6,22.5 9,20.5 11,22.5 10.5,15"
              fill="#b45309"
              stroke="#78350f"
              strokeWidth="0.5"
            />
            <polygon
              points="13.5,15 13,22.5 15,20.5 18,22.5 15.5,15"
              fill="#d97706"
              stroke="#92400e"
              strokeWidth="0.5"
            />
          </g>
        ) : (
          <g className="sc-wax-ribbons">
            <polygon
              points="8.5,15 6,22.5 9,20.5 11,22.5 10.5,15"
              fill="#7f1d1d"
              stroke="#450a0a"
              strokeWidth="0.5"
            />
            <polygon
              points="13.5,15 13,22.5 15,20.5 18,22.5 15.5,15"
              fill="#991b1b"
              stroke="#450a0a"
              strokeWidth="0.5"
            />
          </g>
        )}

        {/* 2. Poured wax puddle: organic scalloped matrix rim */}
        <path
          d="M12 2 C14 2 15.5 2.6 17 3.5 C18.5 4.3 19.6 5.5 20.4 7 C21.2 8.5 21.5 10.2 21.3 11.8 C21 13.5 20 15 18.8 16.2 C17.4 17.5 15.7 18.3 14 18.6 C12.7 18.8 11.3 18.8 10 18.6 C8.3 18.3 6.6 17.5 5.2 16.2 C4 15 3 13.5 2.7 11.8 C2.5 10.2 2.8 8.5 3.6 7 C4.4 5.5 5.5 4.3 7 3.5 C8.5 2.6 10 2 12 2 Z"
          fill={active ? "#d97706" : "#991b1b"}
          stroke={active ? "#92400e" : "#5c0a0a"}
          strokeWidth="0.8"
        />

        {/* 3. Stamped outer ridge */}
        <circle
          cx="12"
          cy="10.5"
          r="7.5"
          fill={active ? "#f59e0b" : "#b91c1c"}
          stroke={active ? "#b45309" : "#450a0a"}
          strokeWidth="0.8"
        />

        {/* 4. Inner pressed matrix depression */}
        <circle
          cx="12"
          cy="10.5"
          r="6.2"
          fill={active ? "#fbbf24" : "#7f1d1d"}
        />

        {/* 5. Matrix beaded milled border */}
        <circle
          cx="12"
          cy="10.5"
          r="5.3"
          fill="none"
          stroke={active ? "#fef08a" : "#450a0a"}
          strokeWidth="0.6"
          strokeDasharray="1.2 1.2"
        />

        {/* 6. Central Royal Seal Sigil */}
        {decreeId === "rite" ? (
          /* Harvest Rite: Royal Wheat Sheaf Sigil */
          <g className="sc-wax-sigil-rite">
            <path
              d="M12 14.5 L12 6.8 M9.5 9.5 L12 12 L14.5 9.5 M10 7.8 L12 10.2 L14 7.8"
              fill="none"
              stroke={active ? "#ffffff" : "#450a0a"}
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <circle cx="12" cy="6.6" r="0.8" fill={active ? "#ffffff" : "#450a0a"} />
          </g>
        ) : decreeId === "muster" ? (
          /* Muster the Host: Crown with Crossed Blades */
          <g className="sc-wax-sigil-muster">
            {/* Small crossed swords behind coronet */}
            <path
              d="M8.5 8.5 L15.5 13.5 M15.5 8.5 L8.5 13.5"
              stroke={active ? "#fef08a" : "#450a0a"}
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            {/* Crown Base */}
            <path
              d="M9 12.8 L15 12.8 L14.6 13.8 L9.4 13.8 Z"
              fill={active ? "#ffffff" : "#450a0a"}
            />
            {/* Crown Points */}
            <path
              d="M9 12.6 L8.6 9.8 L10.3 11.2 L12 8.5 L13.7 11.2 L15.4 9.8 L15 12.6 Z"
              fill={active ? "#fffbeb" : "#450a0a"}
              stroke={active ? "#92400e" : "none"}
              strokeWidth={active ? 0.4 : 0}
            />
          </g>
        ) : (
          /* Royal Crown (Default / Envoys) */
          <g className="sc-wax-sigil-crown">
            {/* Crown Base */}
            <path
              d="M8.5 13 L15.5 13 L15 14 L9 14 Z"
              fill={active ? "#ffffff" : "#450a0a"}
            />
            {/* Crown Points */}
            <path
              d="M8.5 12.8 L8.2 9.5 L10.2 11 L12 8 L13.8 11 L15.8 9.5 L15.5 12.8 Z"
              fill={active ? "#fffbeb" : "#450a0a"}
              stroke={active ? "#92400e" : "none"}
              strokeWidth={active ? 0.4 : 0}
            />
            {/* Pearls on peaks */}
            <circle cx="8.2" cy="9.2" r="0.65" fill={active ? "#ffffff" : "#450a0a"} />
            <circle cx="12" cy="7.7" r="0.75" fill={active ? "#ffffff" : "#450a0a"} />
            <circle cx="15.8" cy="9.2" r="0.65" fill={active ? "#ffffff" : "#450a0a"} />
            {/* Center jewel */}
            <circle cx="12" cy="12" r="0.75" fill={active ? "#ffffff" : "#7f1d1d"} />
          </g>
        )}

        {/* 7. Active Seal Lit Sparkle Glint */}
        {active && (
          <g className="sc-wax-lit-sparkle">
            {/* Brilliant star sparkle on central sigil peak */}
            <circle cx="12" cy="7.5" r="1.3" fill="#ffffff" />
            <path
              d="M12 5.2 V9.8 M9.7 7.5 H14.3"
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            {/* Upper rim specular glint */}
            <circle cx="16.5" cy="5.2" r="0.85" fill="#fef08a" />
          </g>
        )}
      </svg>
    </span>
  );
}
