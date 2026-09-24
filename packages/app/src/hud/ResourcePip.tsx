import React from "react";
import { type GameState } from "@second-crown/sim";
import { isFoodStoresEmptyOrLow } from "@second-crown/render";

export type ResourceKind = "food" | "wood" | "stone" | "gold";
export type ResourcePipVariant = "normal" | "slumped" | "stacked";

/**
 * Resolves the visual variant for a resource pip:
 * - Empty food slumps ("slumped").
 * - Full store stacks high ("stacked").
 * - Otherwise standard neat single item ("normal").
 */
export function resolveResourcePipVariant(
  resource: ResourceKind,
  state?: GameState | null,
  isFull?: boolean,
  rawAmount?: string
): ResourcePipVariant {
  if (resource === "food") {
    const isHungry = state ? isFoodStoresEmptyOrLow(state) : Number(rawAmount ?? "0") <= 0;
    if (isHungry) return "slumped";
  }
  if (isFull) return "stacked";
  return "normal";
}

export interface ResourcePipProps {
  resource: ResourceKind;
  variant?: ResourcePipVariant;
  className?: string;
}

/**
 * ResourcePip: 2-3 frame looping animated SVG pip for resource cells.
 * - Food: Grain sack (slumps when empty, stacks high when full).
 * - Wood: Timber log (stacks high when full).
 * - Stone: Cut ashlar block (stacks high when full).
 * - Gold: Minted coin (stacks high when full).
 * GUARANTEE: strictly `pointer-events: none` so clicks never get blocked!
 */
export function ResourcePip({
  resource,
  variant = "normal",
  className = "",
}: ResourcePipProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`sc-pip sc-pip-${resource} sc-pip-${variant} ${className}`}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
      data-resource={resource}
      data-variant={variant}
    >
      {resource === "food" && variant === "slumped" && <GrainSackSlumped />}
      {resource === "food" && variant === "stacked" && <GrainSackStacked />}
      {resource === "food" && variant === "normal" && <GrainSackNormal />}

      {resource === "wood" && variant === "stacked" && <TimberLogStacked />}
      {resource === "wood" && variant !== "stacked" && <TimberLogNormal />}

      {resource === "stone" && variant === "stacked" && <AshlarStacked />}
      {resource === "stone" && variant !== "stacked" && <AshlarNormal />}

      {resource === "gold" && variant === "stacked" && <CoinStacked />}
      {resource === "gold" && variant !== "stacked" && <CoinNormal />}
    </svg>
  );
}

/* =========================================================================
   1. Food: Grain Sack
   ========================================================================= */

function GrainSackNormal() {
  return (
    <>
      {/* Frame 0: Plump resting grain sack */}
      <g className="sc-pip-frame sc-pip-f0" data-frame="0">
        {/* Sack belly */}
        <path
          d="M7 26 C7 19 10 13 14 12 L18 12 C22 13 25 19 25 26 C25 29 7 29 7 26 Z"
          fill="#b48344"
          stroke="#5a3818"
          strokeWidth="1"
        />
        {/* Gathered top lip */}
        <path
          d="M12 7 L14 12 L18 12 L20 7 C18 9 14 9 12 7 Z"
          fill="#c99752"
          stroke="#5a3818"
          strokeWidth="1"
        />
        {/* Twine knot & dangling cord */}
        <ellipse cx="16" cy="12" rx="3.5" ry="1.5" fill="#fef08a" stroke="#854d0e" strokeWidth="0.8" />
        <path d="M17 13 Q19 16 18 19" stroke="#fef08a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        {/* Belly creases & stenciled grain */}
        <path d="M10 21 Q16 24 22 21 M12 25 Q16 27 20 25" stroke="#78491c" strokeWidth="0.8" fill="none" />
        <path d="M16 16 L16 20 M14.5 17.5 L16 19 L17.5 17.5" stroke="#facc15" strokeWidth="1" strokeLinecap="round" />
      </g>

      {/* Frame 1: Subtle upward breath & twine swing */}
      <g className="sc-pip-frame sc-pip-f1" data-frame="1">
        <path
          d="M6.5 25.5 C6.5 18.5 9.5 12.5 14 11.5 L18 11.5 C22.5 12.5 25.5 18.5 25.5 25.5 C25.5 29 6.5 29 6.5 25.5 Z"
          fill="#b48344"
          stroke="#5a3818"
          strokeWidth="1"
        />
        <path
          d="M11.5 6.5 L14 11.5 L18 11.5 L20.5 6.5 C18.5 8.5 13.5 8.5 11.5 6.5 Z"
          fill="#c99752"
          stroke="#5a3818"
          strokeWidth="1"
        />
        <ellipse cx="16" cy="11.5" rx="3.5" ry="1.5" fill="#fef08a" stroke="#854d0e" strokeWidth="0.8" />
        <path d="M17 12.5 Q20 16 20 18.5" stroke="#fef08a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M10 20.5 Q16 23.5 22 20.5 M12 24.5 Q16 26.5 20 24.5" stroke="#78491c" strokeWidth="0.8" fill="none" />
        <path d="M16 15.5 L16 19.5 M14.5 17 L16 18.5 L17.5 17" stroke="#facc15" strokeWidth="1" strokeLinecap="round" />
        {/* Floating grain dust spark */}
        <circle cx="15" cy="5" r="0.9" fill="#fef08a" />
      </g>

      {/* Frame 2: Settling back with shimmer glint */}
      <g className="sc-pip-frame sc-pip-f2" data-frame="2">
        <path
          d="M7 26.5 C7 19.5 10 13.5 14 12.5 L18 12.5 C22 13.5 25 19.5 25 26.5 C25 29.5 7 29.5 7 26.5 Z"
          fill="#b48344"
          stroke="#5a3818"
          strokeWidth="1"
        />
        <path
          d="M12 7.5 L14 12.5 L18 12.5 L20 7.5 C18 9.5 14 9.5 12 7.5 Z"
          fill="#c99752"
          stroke="#5a3818"
          strokeWidth="1"
        />
        <ellipse cx="16" cy="12.5" rx="3.5" ry="1.5" fill="#fef08a" stroke="#854d0e" strokeWidth="0.8" />
        <path d="M16.5 13.5 Q15 16.5 15.5 19" stroke="#fef08a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M10 21.5 Q16 24.5 22 21.5 M12 25.5 Q16 27.5 20 25.5" stroke="#78491c" strokeWidth="0.8" fill="none" />
        <path d="M16 16.5 L16 20.5 M14.5 18 L16 19.5 L17.5 18" stroke="#fef08a" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="16" cy="18" r="1.4" fill="#fffbeb" />
      </g>
    </>
  );
}

function GrainSackSlumped() {
  return (
    <>
      {/* Frame 0: Deflated flattened sack resting in the dirt */}
      <g className="sc-pip-frame sc-pip-f0" data-frame="0">
        <path
          d="M4 27 C5 21 11 20 16 21 C22 21 28 23 28 27 C28 30 4 30 4 27 Z"
          fill="#5c4a38"
          stroke="#332415"
          strokeWidth="1"
        />
        {/* Drooping limp neck leaning sideways */}
        <path d="M5 25 L8 21 L11 22 L9.5 25 Z" fill="#6d5843" stroke="#332415" strokeWidth="0.8" />
        {/* Loose twine in dirt */}
        <path d="M8 22 Q6 26 3 28" stroke="#a38865" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        {/* Flat hungry crease lines */}
        <path d="M10 24 H23 M13 26.5 H21" stroke="#332415" strokeWidth="0.8" />
      </g>

      {/* Frame 1: Tired shudder / compression */}
      <g className="sc-pip-frame sc-pip-f1" data-frame="1">
        <path
          d="M3.5 27.5 C4.5 22 11 21 16 22 C22 22 28.5 24 28.5 27.5 C28.5 30 3.5 30 3.5 27.5 Z"
          fill="#544332"
          stroke="#332415"
          strokeWidth="1"
        />
        <path d="M4.5 25.5 L7.5 22 L10.5 23 L9 25.5 Z" fill="#65513d" stroke="#332415" strokeWidth="0.8" />
        <path d="M7.5 22 Q5.5 26 2.5 28" stroke="#a38865" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <path d="M9.5 24.5 H23.5 M12.5 27 H21.5" stroke="#332415" strokeWidth="0.8" />
        {/* Faint puff of dust */}
        <circle cx="23" cy="22" r="0.7" fill="#887766" opacity="0.6" />
      </g>

      {/* Frame 2: Low limp resting sag */}
      <g className="sc-pip-frame sc-pip-f2" data-frame="2">
        <path
          d="M4 27 C5 21 11 20 16 21 C22 21 28 23 28 27 C28 30 4 30 4 27 Z"
          fill="#5c4a38"
          stroke="#332415"
          strokeWidth="1"
        />
        <path d="M5 25 L8 21 L11 22 L9.5 25 Z" fill="#6d5843" stroke="#332415" strokeWidth="0.8" />
        <path d="M8 22 Q5.5 26.5 3.5 28.5" stroke="#a38865" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <path d="M10 24 H23 M13 26.5 H21" stroke="#332415" strokeWidth="0.8" />
      </g>
    </>
  );
}

function GrainSackStacked() {
  return (
    <>
      {/* Frame 0: High-stacked pyramid of 3 bursting grain sacks */}
      <g className="sc-pip-frame sc-pip-f0" data-frame="0">
        {/* Bottom left sack */}
        <path
          d="M3 26 C3 20 6 15 10 14 L13 14 C17 15 19 20 19 26 C19 29 3 29 3 26 Z"
          fill="#b48344"
          stroke="#5a3818"
          strokeWidth="0.8"
        />
        {/* Bottom right sack */}
        <path
          d="M13 26 C13 20 16 15 20 14 L23 14 C27 15 29 20 29 26 C29 29 13 29 13 26 Z"
          fill="#9e7238"
          stroke="#5a3818"
          strokeWidth="0.8"
        />
        {/* Top perched sack */}
        <path
          d="M8 17 C8 11 11 6 15 5 L17 5 C21 6 24 11 24 17 C24 20 8 20 8 17 Z"
          fill="#c99752"
          stroke="#5a3818"
          strokeWidth="0.9"
        />
        <ellipse cx="16" cy="5" rx="3" ry="1.2" fill="#fef08a" stroke="#854d0e" strokeWidth="0.8" />
        {/* Sprouting golden wheat sheaves */}
        <path
          d="M16 5 L16 1 M13 3 L16 5 L19 3 M14 1.5 L16 3 L18 1.5"
          stroke="#fef08a"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>

      {/* Frame 1: Golden harvest glint on top sheaf */}
      <g className="sc-pip-frame sc-pip-f1" data-frame="1">
        <path
          d="M3 26 C3 20 6 15 10 14 L13 14 C17 15 19 20 19 26 C19 29 3 29 3 26 Z"
          fill="#b48344"
          stroke="#5a3818"
          strokeWidth="0.8"
        />
        <path
          d="M13 26 C13 20 16 15 20 14 L23 14 C27 15 29 20 29 26 C29 29 13 29 13 26 Z"
          fill="#9e7238"
          stroke="#5a3818"
          strokeWidth="0.8"
        />
        <path
          d="M8 16.5 C8 10.5 11 5.5 15 4.5 L17 4.5 C21 5.5 24 10.5 24 16.5 C24 20 8 20 8 16.5 Z"
          fill="#c99752"
          stroke="#5a3818"
          strokeWidth="0.9"
        />
        <ellipse cx="16" cy="4.5" rx="3" ry="1.2" fill="#fef08a" stroke="#854d0e" strokeWidth="0.8" />
        <path
          d="M16 4.5 L16 0.5 M13 2.5 L16 4.5 L19 2.5 M14 1 L16 2.5 L18 1"
          stroke="#fef08a"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        {/* Specular harvest spark */}
        <circle cx="16" cy="1" r="1.4" fill="#ffffff" />
      </g>

      {/* Frame 2: Golden harvest shimmer shifts across sacks */}
      <g className="sc-pip-frame sc-pip-f2" data-frame="2">
        <path
          d="M3 26 C3 20 6 15 10 14 L13 14 C17 15 19 20 19 26 C19 29 3 29 3 26 Z"
          fill="#b48344"
          stroke="#5a3818"
          strokeWidth="0.8"
        />
        <path
          d="M13 26 C13 20 16 15 20 14 L23 14 C27 15 29 20 29 26 C29 29 13 29 13 26 Z"
          fill="#b48344"
          stroke="#5a3818"
          strokeWidth="0.8"
        />
        <path
          d="M8 17 C8 11 11 6 15 5 L17 5 C21 6 24 11 24 17 C24 20 8 20 8 17 Z"
          fill="#c99752"
          stroke="#5a3818"
          strokeWidth="0.9"
        />
        <ellipse cx="16" cy="5" rx="3" ry="1.2" fill="#fef08a" stroke="#854d0e" strokeWidth="0.8" />
        <path
          d="M16 5 L16 1 M13 3 L16 5 L19 3 M14 1.5 L16 3 L18 1.5"
          stroke="#fef08a"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="22" cy="22" r="1.3" fill="#fde047" />
      </g>
    </>
  );
}

/* =========================================================================
   2. Wood: Timber Log
   ========================================================================= */

function TimberLogNormal() {
  return (
    <>
      {/* Frame 0: Felled log with bark grooves and tree rings */}
      <g className="sc-pip-frame sc-pip-f0" data-frame="0">
        <path d="M5 16 L23 16 L23 26 L5 26 Z" fill="#6b4226" stroke="#3d2210" strokeWidth="1" />
        <path d="M5 16 C3 16 3 26 5 26 Z" fill="#58351d" stroke="#3d2210" strokeWidth="1" />
        {/* Cross-section right end */}
        <ellipse cx="23" cy="21" rx="4.5" ry="5" fill="#d4a359" stroke="#3d2210" strokeWidth="1" />
        <ellipse cx="23" cy="21" rx="2.5" ry="3" fill="none" stroke="#966a26" strokeWidth="0.8" />
        <circle cx="23" cy="21" r="0.8" fill="#5a3818" />
        {/* Bark ridges & branch nub */}
        <path d="M7 19 H20 M9 23 H18" stroke="#4a2c16" strokeWidth="0.8" />
        <path d="M12 16 L13 14 L15 16 Z" fill="#58351d" />
      </g>

      {/* Frame 1: Amber sap bead gleams on cross-section */}
      <g className="sc-pip-frame sc-pip-f1" data-frame="1">
        <path d="M5 16 L23 16 L23 26 L5 26 Z" fill="#6b4226" stroke="#3d2210" strokeWidth="1" />
        <path d="M5 16 C3 16 3 26 5 26 Z" fill="#58351d" stroke="#3d2210" strokeWidth="1" />
        <ellipse cx="23" cy="21" rx="4.5" ry="5" fill="#d4a359" stroke="#3d2210" strokeWidth="1" />
        <ellipse cx="23" cy="21" rx="2.5" ry="3" fill="none" stroke="#966a26" strokeWidth="0.8" />
        <circle cx="23" cy="21" r="0.8" fill="#5a3818" />
        <path d="M7 19 H20 M9 23 H18" stroke="#4a2c16" strokeWidth="0.8" />
        <path d="M12 16 L13 14 L15 16 Z" fill="#58351d" />
        {/* Amber resin sap bead */}
        <circle cx="24.5" cy="18.5" r="1.2" fill="#fef08a" />
        <circle cx="24.5" cy="18.5" r="0.5" fill="#ffffff" />
        <circle cx="13" cy="13" r="0.8" fill="#facc15" />
      </g>

      {/* Frame 2: Timber sheen along top bark ridge */}
      <g className="sc-pip-frame sc-pip-f2" data-frame="2">
        <path d="M5 16 L23 16 L23 26 L5 26 Z" fill="#6b4226" stroke="#3d2210" strokeWidth="1" />
        <path d="M5 16 C3 16 3 26 5 26 Z" fill="#58351d" stroke="#3d2210" strokeWidth="1" />
        <ellipse cx="23" cy="21" rx="4.5" ry="5" fill="#d4a359" stroke="#3d2210" strokeWidth="1" />
        <ellipse cx="23" cy="21" rx="2.5" ry="3" fill="none" stroke="#966a26" strokeWidth="0.8" />
        <circle cx="23" cy="21" r="0.8" fill="#5a3818" />
        {/* Sheen line */}
        <path d="M8 17.5 H19" stroke="#966a26" strokeWidth="0.9" />
        <circle cx="23" cy="23" r="1" fill="#fde047" />
      </g>
    </>
  );
}

function TimberLogStacked() {
  return (
    <>
      {/* Frame 0: Monumental cord of 5 logs stacked in a pyramid */}
      <g className="sc-pip-frame sc-pip-f0" data-frame="0">
        {/* Bottom 3 logs */}
        <rect x="3" y="21" width="8" height="8" rx="2" fill="#58351d" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="10" cy="25" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />

        <rect x="11" y="21" width="8" height="8" rx="2" fill="#58351d" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="18" cy="25" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />

        <rect x="19" y="21" width="8" height="8" rx="2" fill="#58351d" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="26" cy="25" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />

        {/* Middle 2 logs */}
        <rect x="7" y="13" width="8" height="8" rx="2" fill="#6b4226" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="14.5" cy="17" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />

        <rect x="15" y="13" width="8" height="8" rx="2" fill="#6b4226" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="22.5" cy="17" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />

        {/* Top ridge log */}
        <rect x="11" y="5" width="8" height="8" rx="2" fill="#78491c" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="18.5" cy="9" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />
      </g>

      {/* Frame 1: Amber sap sparkle star on top ridge log */}
      <g className="sc-pip-frame sc-pip-f1" data-frame="1">
        <rect x="3" y="21" width="8" height="8" rx="2" fill="#58351d" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="10" cy="25" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />
        <rect x="11" y="21" width="8" height="8" rx="2" fill="#58351d" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="18" cy="25" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />
        <rect x="19" y="21" width="8" height="8" rx="2" fill="#58351d" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="26" cy="25" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />

        <rect x="7" y="13" width="8" height="8" rx="2" fill="#6b4226" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="14.5" cy="17" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />
        <rect x="15" y="13" width="8" height="8" rx="2" fill="#6b4226" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="22.5" cy="17" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />

        <rect x="11" y="5" width="8" height="8" rx="2" fill="#78491c" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="18.5" cy="9" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />
        {/* Star sparkle */}
        <circle cx="18.5" cy="8" r="1.3" fill="#ffffff" />
        <path d="M18.5 6 V10 M16.5 8 H20.5" stroke="#ffffff" strokeWidth="0.7" />
      </g>

      {/* Frame 2: Golden resin gleam travels across middle log */}
      <g className="sc-pip-frame sc-pip-f2" data-frame="2">
        <rect x="3" y="21" width="8" height="8" rx="2" fill="#58351d" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="10" cy="25" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />
        <rect x="11" y="21" width="8" height="8" rx="2" fill="#58351d" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="18" cy="25" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />
        <rect x="19" y="21" width="8" height="8" rx="2" fill="#58351d" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="26" cy="25" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />

        <rect x="7" y="13" width="8" height="8" rx="2" fill="#6b4226" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="14.5" cy="17" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />
        <rect x="15" y="13" width="8" height="8" rx="2" fill="#6b4226" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="22.5" cy="17" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />

        <rect x="11" y="5" width="8" height="8" rx="2" fill="#78491c" stroke="#3d2210" strokeWidth="0.8" />
        <ellipse cx="18.5" cy="9" rx="2.2" ry="3.5" fill="#d4a359" stroke="#3d2210" strokeWidth="0.8" />
        <circle cx="22.5" cy="16" r="1.3" fill="#fde047" />
      </g>
    </>
  );
}

/* =========================================================================
   3. Stone: Cut Ashlar Block
   ========================================================================= */

function AshlarNormal() {
  return (
    <>
      {/* Frame 0: Isometric dressed ashlar block */}
      <g className="sc-pip-frame sc-pip-f0" data-frame="0">
        <path d="M16 11 L25 16 L16 21 L7 16 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.9" />
        <path d="M7 16 L16 21 L16 28 L7 23 Z" fill="#475569" stroke="#334155" strokeWidth="0.9" />
        <path d="M16 21 L25 16 L25 23 L16 28 Z" fill="#64748b" stroke="#334155" strokeWidth="0.9" />
        {/* Chiseled margin & mason's mark */}
        <path d="M16 12.5 L23 16.5 L16 20 M16 21 L16 27" stroke="#cbd5e1" strokeWidth="0.6" fill="none" />
        <path d="M19 23 L21 21 L23 23" stroke="#334155" strokeWidth="0.8" fill="none" />
      </g>

      {/* Frame 1: Chisel edge specular glint at corner apex */}
      <g className="sc-pip-frame sc-pip-f1" data-frame="1">
        <path d="M16 11 L25 16 L16 21 L7 16 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.9" />
        <path d="M7 16 L16 21 L16 28 L7 23 Z" fill="#475569" stroke="#334155" strokeWidth="0.9" />
        <path d="M16 21 L25 16 L25 23 L16 28 Z" fill="#64748b" stroke="#334155" strokeWidth="0.9" />
        <path d="M16 12.5 L23 16.5 L16 20 M16 21 L16 27" stroke="#cbd5e1" strokeWidth="0.6" fill="none" />
        <path d="M19 23 L21 21 L23 23" stroke="#334155" strokeWidth="0.8" fill="none" />
        {/* Corner glint */}
        <circle cx="16" cy="11" r="1.3" fill="#ffffff" />
        <path d="M16 9 V13 M14 11 H18" stroke="#ffffff" strokeWidth="0.6" />
      </g>

      {/* Frame 2: Crystalline mineral spark on lit facet */}
      <g className="sc-pip-frame sc-pip-f2" data-frame="2">
        <path d="M16 11 L25 16 L16 21 L7 16 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.9" />
        <path d="M7 16 L16 21 L16 28 L7 23 Z" fill="#475569" stroke="#334155" strokeWidth="0.9" />
        <path d="M16 21 L25 16 L25 23 L16 28 Z" fill="#64748b" stroke="#334155" strokeWidth="0.9" />
        <path d="M16 12.5 L23 16.5 L16 20 M16 21 L16 27" stroke="#cbd5e1" strokeWidth="0.6" fill="none" />
        <path d="M19 23 L21 21 L23 23" stroke="#334155" strokeWidth="0.8" fill="none" />
        <circle cx="21" cy="20" r="1.1" fill="#f1f5f9" />
      </g>
    </>
  );
}

function AshlarStacked() {
  return (
    <>
      {/* Frame 0: Stepped fortress masonry pier stacked high */}
      <g className="sc-pip-frame sc-pip-f0" data-frame="0">
        {/* Base foundation course */}
        <path d="M16 19 L28 23 L16 27 L4 23 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.8" />
        <path d="M4 23 L16 27 L16 30 L4 26 Z" fill="#475569" stroke="#334155" strokeWidth="0.8" />
        <path d="M16 27 L28 23 L28 26 L16 30 Z" fill="#64748b" stroke="#334155" strokeWidth="0.8" />

        {/* Mid-tier course */}
        <path d="M16 11 L25 15 L16 19 L7 15 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="0.8" />
        <path d="M7 15 L16 19 L16 24 L7 20 Z" fill="#64748b" stroke="#334155" strokeWidth="0.8" />
        <path d="M16 19 L25 15 L25 20 L16 24 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.8" />

        {/* Capstone ashlar block */}
        <path d="M16 4 L22 7 L16 10 L10 7 Z" fill="#f1f5f9" stroke="#334155" strokeWidth="0.8" />
        <path d="M10 7 L16 10 L16 14 L10 11 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.8" />
        <path d="M16 10 L22 7 L22 11 L16 14 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="0.8" />
      </g>

      {/* Frame 1: Four-point star sparkle on capstone */}
      <g className="sc-pip-frame sc-pip-f1" data-frame="1">
        <path d="M16 19 L28 23 L16 27 L4 23 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.8" />
        <path d="M4 23 L16 27 L16 30 L4 26 Z" fill="#475569" stroke="#334155" strokeWidth="0.8" />
        <path d="M16 27 L28 23 L28 26 L16 30 Z" fill="#64748b" stroke="#334155" strokeWidth="0.8" />

        <path d="M16 11 L25 15 L16 19 L7 15 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="0.8" />
        <path d="M7 15 L16 19 L16 24 L7 20 Z" fill="#64748b" stroke="#334155" strokeWidth="0.8" />
        <path d="M16 19 L25 15 L25 20 L16 24 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.8" />

        <path d="M16 4 L22 7 L16 10 L10 7 Z" fill="#f1f5f9" stroke="#334155" strokeWidth="0.8" />
        <path d="M10 7 L16 10 L16 14 L10 11 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.8" />
        <path d="M16 10 L22 7 L22 11 L16 14 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="0.8" />
        {/* Star sparkle */}
        <circle cx="16" cy="4" r="1.4" fill="#ffffff" />
        <path d="M16 2 V6 M14 4 H18" stroke="#ffffff" strokeWidth="0.8" />
      </g>

      {/* Frame 2: Specular glint on plinth course */}
      <g className="sc-pip-frame sc-pip-f2" data-frame="2">
        <path d="M16 19 L28 23 L16 27 L4 23 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.8" />
        <path d="M4 23 L16 27 L16 30 L4 26 Z" fill="#475569" stroke="#334155" strokeWidth="0.8" />
        <path d="M16 27 L28 23 L28 26 L16 30 Z" fill="#64748b" stroke="#334155" strokeWidth="0.8" />

        <path d="M16 11 L25 15 L16 19 L7 15 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="0.8" />
        <path d="M7 15 L16 19 L16 24 L7 20 Z" fill="#64748b" stroke="#334155" strokeWidth="0.8" />
        <path d="M16 19 L25 15 L25 20 L16 24 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.8" />

        <path d="M16 4 L22 7 L16 10 L10 7 Z" fill="#f1f5f9" stroke="#334155" strokeWidth="0.8" />
        <path d="M10 7 L16 10 L16 14 L10 11 Z" fill="#94a3b8" stroke="#334155" strokeWidth="0.8" />
        <path d="M16 10 L22 7 L22 11 L16 14 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="0.8" />
        <circle cx="21" cy="18" r="1.3" fill="#ffffff" />
      </g>
    </>
  );
}

/* =========================================================================
   4. Gold: Minted Royal Coin
   ========================================================================= */

function CoinNormal() {
  return (
    <>
      {/* Frame 0: Minted gold sovereign with crown imprint */}
      <g className="sc-pip-frame sc-pip-f0" data-frame="0">
        {/* Coin depth rim */}
        <path
          d="M7 18 C7 23 25 23 25 18 L25 22 C25 27 7 27 7 22 Z"
          fill="#b45309"
          stroke="#78350f"
          strokeWidth="0.9"
        />
        {/* Coin top face */}
        <ellipse cx="16" cy="18" rx="9" ry="6.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
        {/* Inner reeded border */}
        <ellipse
          cx="16"
          cy="18"
          rx="7.2"
          ry="5"
          fill="#fbbf24"
          stroke="#d97706"
          strokeWidth="0.6"
          strokeDasharray="1.5 1.5"
        />
        {/* Crown stamp */}
        <path
          d="M12 19.5 L13 17 L14.5 18.5 L16 16 L17.5 18.5 L19 17 L20 19.5 Z"
          fill="#78350f"
        />
      </g>

      {/* Frame 1: Specular sparkle star on crown peak */}
      <g className="sc-pip-frame sc-pip-f1" data-frame="1">
        <path
          d="M7 18 C7 23 25 23 25 18 L25 22 C25 27 7 27 7 22 Z"
          fill="#b45309"
          stroke="#78350f"
          strokeWidth="0.9"
        />
        <ellipse cx="16" cy="18" rx="9" ry="6.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
        <ellipse
          cx="16"
          cy="18"
          rx="7.2"
          ry="5"
          fill="#fbbf24"
          stroke="#d97706"
          strokeWidth="0.6"
          strokeDasharray="1.5 1.5"
        />
        <path
          d="M12 19.5 L13 17 L14.5 18.5 L16 16 L17.5 18.5 L19 17 L20 19.5 Z"
          fill="#78350f"
        />
        {/* Sparkle */}
        <circle cx="16" cy="16" r="1.4" fill="#ffffff" />
        <path d="M16 13.5 V18.5 M13.5 16 H18.5" stroke="#ffffff" strokeWidth="0.8" />
      </g>

      {/* Frame 2: Edge lustre glint circling around milled rim */}
      <g className="sc-pip-frame sc-pip-f2" data-frame="2">
        <path
          d="M7 18 C7 23 25 23 25 18 L25 22 C25 27 7 27 7 22 Z"
          fill="#b45309"
          stroke="#78350f"
          strokeWidth="0.9"
        />
        <ellipse cx="16" cy="18" rx="9" ry="6.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
        <ellipse
          cx="16"
          cy="18"
          rx="7.2"
          ry="5"
          fill="#fbbf24"
          stroke="#d97706"
          strokeWidth="0.6"
          strokeDasharray="1.5 1.5"
        />
        <path
          d="M12 19.5 L13 17 L14.5 18.5 L16 16 L17.5 18.5 L19 17 L20 19.5 Z"
          fill="#78350f"
        />
        <circle cx="22" cy="19.5" r="1.2" fill="#fef08a" />
      </g>
    </>
  );
}

function CoinStacked() {
  return (
    <>
      {/* Frame 0: Twin towering treasury coin stacks */}
      <g className="sc-pip-frame sc-pip-f0" data-frame="0">
        {/* Left coin stack (5 coins) */}
        <rect x="6" y="14" width="9" height="14" rx="2" fill="#d97706" stroke="#78350f" strokeWidth="0.8" />
        <ellipse cx="10.5" cy="14" rx="4.5" ry="2" fill="#fbbf24" stroke="#78350f" strokeWidth="0.8" />

        {/* Right coin stack (6 coins, taller) */}
        <rect x="16" y="6" width="10" height="22" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
        <ellipse cx="21" cy="6" rx="5" ry="2.2" fill="#fde047" stroke="#78350f" strokeWidth="0.8" />

        {/* Front loose coins */}
        <ellipse cx="14" cy="26" rx="4" ry="2" fill="#fbbf24" stroke="#78350f" strokeWidth="0.7" />
      </g>

      {/* Frame 1: Radiant starburst flash on highest right coin */}
      <g className="sc-pip-frame sc-pip-f1" data-frame="1">
        <rect x="6" y="14" width="9" height="14" rx="2" fill="#d97706" stroke="#78350f" strokeWidth="0.8" />
        <ellipse cx="10.5" cy="14" rx="4.5" ry="2" fill="#fbbf24" stroke="#78350f" strokeWidth="0.8" />

        <rect x="16" y="6" width="10" height="22" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
        <ellipse cx="21" cy="6" rx="5" ry="2.2" fill="#fde047" stroke="#78350f" strokeWidth="0.8" />

        <ellipse cx="14" cy="26" rx="4" ry="2" fill="#fbbf24" stroke="#78350f" strokeWidth="0.7" />
        {/* Brilliant flash */}
        <circle cx="21" cy="5.5" r="1.5" fill="#ffffff" />
        <path d="M21 3 V8 M18.5 5.5 H23.5" stroke="#ffffff" strokeWidth="0.8" />
      </g>

      {/* Frame 2: Golden lustre glint sweeps across left stack & base */}
      <g className="sc-pip-frame sc-pip-f2" data-frame="2">
        <rect x="6" y="14" width="9" height="14" rx="2" fill="#d97706" stroke="#78350f" strokeWidth="0.8" />
        <ellipse cx="10.5" cy="14" rx="4.5" ry="2" fill="#fbbf24" stroke="#78350f" strokeWidth="0.8" />

        <rect x="16" y="6" width="10" height="22" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
        <ellipse cx="21" cy="6" rx="5" ry="2.2" fill="#fde047" stroke="#78350f" strokeWidth="0.8" />

        <ellipse cx="14" cy="26" rx="4" ry="2" fill="#fef08a" stroke="#78350f" strokeWidth="0.7" />
        <circle cx="10.5" cy="13.5" r="1.2" fill="#ffffff" />
      </g>
    </>
  );
}
