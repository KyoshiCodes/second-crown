import React from "react";
import "./unit-living.css";

export type UnitFamily = "infantry" | "ranged" | "cavalry" | "command";

export function getUnitFamily(typeId: string): UnitFamily {
  switch (typeId) {
    case "archer":
    case "ranger":
    case "skirmisher":
    case "composite_bowman":
      return "ranged";
    case "scout":
    case "outrider":
    case "knight":
    case "lancer":
    case "cataphract":
    case "horse_archer":
      return "cavalry";
    case "banner":
    case "champion":
    case "marshal":
      return "command";
    case "militia":
    case "spearman":
    case "warden":
    default:
      return "infantry";
  }
}

export interface UnitLivingProps {
  typeId: string;
  open: boolean;
  affordable: boolean;
  drilling?: boolean;
}

/**
 * Ambient background living glyph underlay beneath the unit card contents.
 * Pure phrasing content (span + svg) valid inside a <button>, pointer-events: none,
 * subtle opacity with idle breath, glow, and drilling pulse.
 */
export function UnitLivingUnderlay(props: UnitLivingProps) {
  const { typeId, open, affordable, drilling } = props;
  const family = getUnitFamily(typeId);

  const stateClass = !open
    ? "is-locked"
    : drilling
      ? "is-drilling"
      : affordable
        ? "is-ready"
        : "is-short";

  return (
    <span
      className={`sc-unit-living-underlay family-${family} ${stateClass}`}
      aria-hidden="true"
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {family === "infantry" && (
          <g>
            {/* Crossed infantry spears and center boss */}
            <line x1="12" y1="12" x2="52" y2="52" strokeWidth="2.2" />
            <line x1="52" y1="12" x2="12" y2="52" strokeWidth="2.2" />
            {/* Spearheads */}
            <polygon points="12,12 8,20 16,16" fill="currentColor" fillOpacity="0.4" />
            <polygon points="52,12 56,20 48,16" fill="currentColor" fillOpacity="0.4" />
            {/* Center shield boss */}
            <circle cx="32" cy="32" r="10" strokeWidth="1.8" fill="currentColor" fillOpacity="0.1" />
            <circle cx="32" cy="32" r="3" fill="currentColor" />
          </g>
        )}

        {family === "ranged" && (
          <g>
            {/* Recurve bow and notched arrow */}
            <path d="M18 10 Q42 32 18 54" strokeWidth="2.4" />
            <line x1="18" y1="10" x2="18" y2="54" strokeWidth="1" strokeDasharray="3 2" />
            {/* Arrow */}
            <line x1="14" y1="32" x2="50" y2="32" strokeWidth="2" />
            <polygon points="50,32 44,28 44,36" fill="currentColor" />
            {/* Sighting reticle */}
            <circle cx="48" cy="32" r="8" strokeWidth="1.2" strokeDasharray="2 2" />
          </g>
        )}

        {family === "cavalry" && (
          <g>
            {/* Warhorse horseshoe and courier star */}
            <path
              d="M20 44 C18 24 46 24 44 44"
              strokeWidth="3.2"
              strokeLinecap="square"
            />
            {/* Stud holes */}
            <circle cx="22" cy="38" r="1.5" fill="currentColor" />
            <circle cx="24" cy="28" r="1.5" fill="currentColor" />
            <circle cx="40" cy="28" r="1.5" fill="currentColor" />
            <circle cx="42" cy="38" r="1.5" fill="currentColor" />
            {/* Charging star */}
            <polygon points="32,16 34,22 40,24 34,26 32,32 30,26 24,24 30,22" fill="currentColor" />
          </g>
        )}

        {family === "command" && (
          <g>
            {/* Billowing standard pennant and solar crown */}
            <line x1="16" y1="8" x2="16" y2="56" strokeWidth="2.5" />
            <path
              d="M16 12 Q36 8 48 16 Q36 24 48 32 L16 34 Z"
              strokeWidth="1.8"
              fill="currentColor"
              fillOpacity="0.15"
            />
            <circle cx="16" cy="8" r="3" fill="currentColor" />
            <polygon points="30,20 32,24 36,25 32,27 30,31 29,27 25,25 29,24" fill="currentColor" />
          </g>
        )}
      </svg>
    </span>
  );
}

/**
 * Living unit glyph strip rendered beneath the stacked status rows.
 * High clarity, delicate animated heraldry with idle breath, glow, and drilling pulse.
 * Pure phrasing content (spans only) for button semantics.
 */
export function UnitLivingGlyph(props: UnitLivingProps) {
  const { typeId, open, affordable, drilling } = props;
  const family = getUnitFamily(typeId);

  const stateClass = !open
    ? "is-locked"
    : drilling
      ? "is-drilling"
      : affordable
        ? "is-ready"
        : "is-short";

  return (
    <span
      className={`sc-unit-status-glyph family-${family} ${stateClass}`}
      aria-hidden="true"
    >
      <span className="sc-unit-glyph-icon">
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {family === "infantry" && (
            <g>
              {/* Crossed spears & center pip */}
              <line x1="3" y1="3" x2="17" y2="17" />
              <line x1="17" y1="3" x2="3" y2="17" />
              <circle cx="10" cy="10" r="2" fill="currentColor" className={drilling ? "sc-unit-glyph-sparkle" : undefined} />
            </g>
          )}

          {family === "ranged" && (
            <g>
              {/* Bow and target star */}
              <path d="M5 3 Q13 10 5 17" strokeWidth="1.8" />
              <line x1="5" y1="3" x2="5" y2="17" strokeWidth="0.9" />
              <line x1="4" y1="10" x2="16" y2="10" strokeWidth="1.6" />
              <circle cx="14" cy="10" r="1.5" fill="currentColor" className={drilling ? "sc-unit-glyph-sparkle" : undefined} />
            </g>
          )}

          {family === "cavalry" && (
            <g>
              {/* Horseshoe & star */}
              <path d="M6 14 C5 7 15 7 14 14" strokeWidth="2" />
              <circle cx="10" cy="9" r="1.5" fill="currentColor" className={drilling ? "sc-unit-glyph-sparkle" : undefined} />
              <line x1="10" y1="3" x2="10" y2="6" strokeWidth="1.5" />
            </g>
          )}

          {family === "command" && (
            <g>
              {/* Pennant & crown star */}
              <line x1="5" y1="2" x2="5" y2="18" strokeWidth="2" />
              <path d="M5 3 L15 7 L5 11 Z" fill="currentColor" fillOpacity="0.2" strokeWidth="1.5" />
              <circle cx="10" cy="7" r="1.2" fill="currentColor" className={drilling ? "sc-unit-glyph-sparkle" : undefined} />
            </g>
          )}
        </svg>
      </span>
      <span className="sc-unit-glyph-flair">
        {!open
          ? "Sealed lore"
          : drilling
            ? "Drilling cadre"
            : affordable
              ? "Levy ready"
              : "Stores short"}
      </span>
    </span>
  );
}
