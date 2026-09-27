import React from "react";
import type { LastBattleStory } from "@second-crown/sim";

export type ClashPipVariant =
  | "crossed_blades"
  | "broken_shield"
  | "blades"
  | "shield";

export interface ClashPipProps {
  /** "crossed_blades" (or "blades") on victory/clash; "broken_shield" (or "shield") on defeat */
  variant?: ClashPipVariant;
  /** Size in pixels (default: 28) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Resolves the clash pip variant from a LastBattleStory:
 * - If the player lost (loserId === "player"): "broken_shield"
 * - Otherwise (victory or AI clash): "crossed_blades"
 */
export function resolveClashPipVariant(
  story: LastBattleStory | null | undefined
): "crossed_blades" | "broken_shield" {
  if (!story) return "crossed_blades";
  if (story.loserId === "player") return "broken_shield";
  return "crossed_blades";
}

/**
 * 28px Clash Pip:
 * - Two crossed blades on victory or field clash
 * - A fractured broken shield on player defeat
 * GUARANTEE: strictly pointer-events: none so clicks are never intercepted.
 */
export function ClashPip({
  variant = "crossed_blades",
  size = 28,
  className = "",
  style,
}: ClashPipProps) {
  const isLoss = variant === "broken_shield" || variant === "shield";
  const normVariant = isLoss ? "broken_shield" : "crossed_blades";

  return (
    <span
      className={`sc-clash-pip-wrapper sc-clash-${normVariant}`}
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
    >
      <svg
        viewBox="0 0 28 28"
        width={size}
        height={size}
        className={`sc-clash-pip sc-clash-${normVariant} ${className}`}
        style={{ pointerEvents: "none" }}
        data-variant={normVariant}
      >
        {isLoss ? <BrokenShieldSvg /> : <CrossedBladesSvg />}
      </svg>
    </span>
  );
}

/* =========================================================================
   1. Crossed Blades: Two crossed arming swords with clash spark
   ========================================================================= */

function CrossedBladesSvg() {
  return (
    <g className="sc-clash-crossed-blades">
      {/* Blade 1: SW (hilt) to NE (tip) */}
      <g>
        {/* Pommel */}
        <circle cx="5" cy="23" r="1.8" fill="#d97706" stroke="#78350f" strokeWidth="0.8" />
        {/* Grip */}
        <line x1="5.5" y1="22.5" x2="8.5" y2="19.5" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />
        {/* Crossguard */}
        <line x1="7" y1="18" x2="10.5" y2="21.5" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
        {/* Blade body */}
        <path
          d="M8.5 19.5 L23.5 4.5 L24 5 L9.5 20 Z"
          fill="#f8fafc"
          stroke="#475569"
          strokeWidth="0.6"
        />
        {/* Shaded blade edge */}
        <path
          d="M9 20 L24 5 L23.5 6 L9.5 20.5 Z"
          fill="#94a3b8"
        />
      </g>

      {/* Blade 2: SE (hilt) to NW (tip) */}
      <g>
        {/* Pommel */}
        <circle cx="23" cy="23" r="1.8" fill="#d97706" stroke="#78350f" strokeWidth="0.8" />
        {/* Grip */}
        <line x1="22.5" y1="22.5" x2="19.5" y2="19.5" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />
        {/* Crossguard */}
        <line x1="21" y1="18" x2="17.5" y2="21.5" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
        {/* Blade body */}
        <path
          d="M19.5 19.5 L4.5 4.5 L4 5 L18.5 20 Z"
          fill="#f1f5f9"
          stroke="#475569"
          strokeWidth="0.6"
        />
        {/* Shaded blade edge */}
        <path
          d="M19 20 L4 5 L4.5 6 L18.5 20.5 Z"
          fill="#64748b"
        />
      </g>

      {/* Clash spark center point */}
      <g className="sc-clash-spark">
        <path
          d="M14 10.5 Q14 14 10.5 14 Q14 14 14 17.5 Q14 14 17.5 14 Q14 14 14 10.5 Z"
          fill="#fef08a"
          stroke="#eab308"
          strokeWidth="0.5"
        />
        <circle cx="14" cy="14" r="1.2" fill="#ffffff" />
      </g>
    </g>
  );
}

/* =========================================================================
   2. Broken Shield: Cleaved & fractured kite shield with ember aura
   ========================================================================= */

function BrokenShieldSvg() {
  return (
    <g className="sc-clash-broken-shield">
      {/* Left shield half: tilted slightly left */}
      <g transform="translate(-0.8, -0.5) rotate(-3 13 14)">
        {/* Field */}
        <path
          d="M6 6 L13.5 6 L13 9.5 L14.5 13 L12.5 16.5 L14 20 L13 23.5 C9 20 6 15 6 6 Z"
          fill="#7f1d1d"
          stroke="#450a0a"
          strokeWidth="0.8"
        />
        {/* Iron rim */}
        <path
          d="M6 6 L13.5 6 M6 6 C6 15 9 20 13 23.5"
          fill="none"
          stroke="#64748b"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Rivets */}
        <circle cx="7.5" cy="8" r="0.7" fill="#cbd5e1" />
        <circle cx="7.2" cy="13" r="0.7" fill="#cbd5e1" />
        <circle cx="9" cy="18" r="0.7" fill="#cbd5e1" />
      </g>

      {/* Right shield half: dropped and parted right */}
      <g transform="translate(1.2, 1.2) rotate(4 15 15)">
        {/* Field */}
        <path
          d="M14.5 6 L22 6 C22 15 19 20 15 23.5 L14 20 L15.5 16.5 L13.5 13 L15 9.5 L14.5 6 Z"
          fill="#991b1b"
          stroke="#450a0a"
          strokeWidth="0.8"
        />
        {/* Iron rim */}
        <path
          d="M14.5 6 L22 6 M22 6 C22 15 19 20 15 23.5"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Rivets */}
        <circle cx="20.5" cy="8" r="0.7" fill="#cbd5e1" />
        <circle cx="20.8" cy="13" r="0.7" fill="#cbd5e1" />
        <circle cx="19" cy="18" r="0.7" fill="#cbd5e1" />
      </g>

      {/* Glowing jagged fracture crack between halves */}
      <path
        d="M13 5 L14.5 9.5 L12.5 13.5 L15 17 L13 21 L14 25"
        fill="none"
        stroke="#f87171"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M13.2 8 L14 12 L13 16 L14.2 20"
        fill="none"
        stroke="#fef08a"
        strokeWidth="0.6"
      />

      {/* Chipped splinter embers */}
      <polygon points="12,11 13,10 12.5,12" fill="#ef4444" />
      <polygon points="15.5,14 16.5,15 15.2,16" fill="#f97316" />
      <circle cx="11.5" cy="16.5" r="0.6" fill="#f87171" />
    </g>
  );
}
