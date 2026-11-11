import React from "react";
import "./infirmary-heal-living.css";

export interface BandagePipProps {
  /** Size in pixels (default: 16) */
  size?: number;
  /** Whether the Infirmary is actively healing wounded troops (adds living emerald glow & pulse) */
  active?: boolean;
  /** Whether there are wounded troops resting / recovering */
  wounded?: boolean;
  /** Additional CSS class names */
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Living Bandage Pip & Wounded Unit Chip:
 * - Medieval field-dressing linen bandage crossed over a soothing herbal poultice.
 * - Reactive living state: verdant emerald glow layer, rotating dashed aura ring,
 *   and rising restorative motes when the Infirmary is actively healing.
 * - Calm red/amber cross when wounded are resting without an active heal cycle.
 * - Strictly pointer-events: none !important so clicks on unit cards and buttons are never blocked.
 */
export function BandagePip({
  size = 16,
  active = false,
  wounded = true,
  className = "",
  style,
  title,
}: BandagePipProps) {
  const isHealing = active && wounded;
  const tooltip =
    title ??
    (isHealing
      ? "Infirmary active · soothing herbal bandages & healing glow"
      : wounded
        ? "Wounded troops · field bandages applied"
        : "Field dressing cot");

  return (
    <span
      className={`sc-bandage-pip ${isHealing ? "is-healing" : "is-calm"} ${wounded ? "has-wounded" : "is-idle"} ${className}`}
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
      data-bandage-pip
      data-healing={isHealing}
      data-wounded={wounded}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={{ pointerEvents: "none", display: "block", overflow: "visible" }}
        aria-hidden="true"
        focusable="false"
      >
        {/* 1. Living Atmospheric Heal Glow (Active Infirmary) */}
        {isHealing ? (
          <>
            <circle
              className="sc-heal-glow-layer"
              cx="12"
              cy="12"
              r="8.5"
              fill="#34d399"
              opacity="0.28"
            />
            <circle
              className="sc-heal-aura-ring"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="#86efac"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
            <g className="sc-heal-drift-layer">
              <circle cx="8.5" cy="6.5" r="0.9" fill="#86efac" opacity="0.8" />
              <circle cx="15.5" cy="5.8" r="0.75" fill="#a7f3d0" opacity="0.75" />
              <circle cx="12" cy="4" r="0.65" fill="#6ee7b7" opacity="0.7" />
            </g>
          </>
        ) : null}

        {/* 2. Crossed Linen Field Bandages */}
        <g className="sc-heal-bandage-base">
          {/* Under-strip: diagonal wrapped linen tape */}
          <rect
            x="4.2"
            y="9.6"
            width="15.6"
            height="4.8"
            rx="1.4"
            transform="rotate(-45 12 12)"
            fill="#fef3c7"
            stroke="#b45309"
            strokeWidth="0.8"
          />
          {/* Over-strip: diagonal crossed linen tape */}
          <rect
            x="4.2"
            y="9.6"
            width="15.6"
            height="4.8"
            rx="1.4"
            transform="rotate(45 12 12)"
            fill="#fffbeb"
            stroke="#b45309"
            strokeWidth="0.8"
          />
          {/* Bandage seam stitching */}
          <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" stroke="#d97706" strokeWidth="0.5" strokeDasharray="1.2 1" />
          <line x1="15.5" y1="8.5" x2="8.5" y2="15.5" stroke="#d97706" strokeWidth="0.5" strokeDasharray="1.2 1" />
        </g>

        {/* 3. Center Restorative Cross Symbol */}
        <g className="sc-heal-pulse-layer">
          {isHealing ? (
            /* Verdant emerald healing balm cross */
            <>
              <circle cx="12" cy="12" r="3.6" fill="#065f46" opacity="0.85" />
              <path
                d="M12 9.5 V14.5 M9.5 12 H14.5"
                stroke="#86efac"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="0.9" fill="#ecfdf5" />
            </>
          ) : wounded ? (
            /* Red cross of the wounded */
            <>
              <circle cx="12" cy="12" r="3.4" fill="#7f1d1d" opacity="0.85" />
              <path
                d="M12 9.6 V14.4 M9.6 12 H14.4"
                stroke="#fca5a5"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </>
          ) : (
            /* Idle linen knot */
            <circle cx="12" cy="12" r="1.5" fill="#b45309" opacity="0.7" />
          )}
        </g>
      </svg>
    </span>
  );
}

export const WoundedChip = BandagePip;
export const WoundedUnitChip = BandagePip;
