import React from "react";
import "./works-living.css";

export type HallDomain = "hearth" | "craft" | "mint" | "martial" | "sanctum";
export type BuildingDomain = HallDomain;
export type BuildingMood = "working" | "standing" | "idle" | "scarred";

/**
 * Classifies every Kingdom building type into its architectural hall domain
 * for decorative heraldry. Pure display mapping; no sim logic lives here.
 */
export function getHallDomain(typeId: string): HallDomain {
  switch (typeId) {
    case "lumber_camp":
    case "camp":
    case "sawmill":
    case "quarry":
    case "mason":
      return "craft";
    case "gold_mine":
    case "market":
    case "mint":
      return "mint";
    case "barracks":
    case "stables":
    case "archery_range":
    case "siege_workshop":
    case "watchtower":
    case "walls":
    case "gate":
    case "keep":
      return "martial";
    case "academy":
    case "chapel":
    case "infirmary":
      return "sanctum";
    case "farm":
    case "granary":
    case "cottage":
    default:
      return "hearth";
  }
}

export const getBuildingDomain = getHallDomain;

export interface WorkLivingProps {
  typeId: string;
  scarred: boolean;
  crewed: boolean;
  staffed: boolean;
  lifted?: boolean;
}

export type BuildingLivingProps = WorkLivingProps;

export interface BuildingGlyphDescriptor {
  typeId: string;
  domain: HallDomain;
  mood: BuildingMood;
  stateClass: string;
  flair: string;
  motion: "pulse" | "drift" | "calm";
  lifted: boolean;
  staffed: boolean;
  crewed: boolean;
  scarred: boolean;
}

export function hallFlair(domain: HallDomain, props: WorkLivingProps): string {
  if (props.scarred) return "Siege scarred";
  if (props.crewed && !props.staffed) return "Hall uncrewed";

  if (!props.crewed) {
    switch (domain) {
      case "hearth":
        return "Hearth warm";
      case "martial":
        return "Ward standing";
      case "sanctum":
        return "Sanctum calm";
      default:
        return "Hall standing";
    }
  }

  switch (domain) {
    case "hearth":
      return "Hearth lit";
    case "craft":
      return "Yards busy";
    case "mint":
      return "Coffers brisk";
    case "martial":
      return "Beacon lit";
    case "sanctum":
      return "Sanctum lit";
  }
}

export function resolveBuildingGlyphDescriptor(props: WorkLivingProps): BuildingGlyphDescriptor {
  const { typeId, scarred, crewed, staffed, lifted } = props;
  const domain = getHallDomain(typeId);
  const isLifted = !scarred && Boolean(lifted);

  let mood: BuildingMood;
  let stateClass: string;
  let motion: "pulse" | "drift" | "calm";

  if (scarred) {
    mood = "scarred";
    stateClass = "is-scarred";
    motion = "pulse";
  } else if (crewed) {
    if (staffed) {
      mood = "working";
      stateClass = "is-working";
      motion = isLifted ? "pulse" : "drift";
    } else {
      mood = "idle";
      stateClass = "is-idle";
      motion = "pulse";
    }
  } else {
    mood = "standing";
    stateClass = "is-standing";
    motion = isLifted ? "pulse" : "drift";
  }

  const flair = hallFlair(domain, props);

  return {
    typeId,
    domain,
    mood,
    stateClass,
    flair,
    motion,
    lifted: isLifted,
    staffed,
    crewed,
    scarred,
  };
}

export const resolveWorkGlyphDescriptor = resolveBuildingGlyphDescriptor;

/**
 * Corner-confined ambient hall watermark tucked into the quiet right-hand pocket
 * above the footer action button so it never overlaps status values or buttons.
 * Pure phrasing content (span + svg), pointer-events: none, capped low opacity.
 */
export function WorkLivingUnderlay(props: WorkLivingProps) {
  const desc = resolveBuildingGlyphDescriptor(props);
  const { domain, stateClass, lifted } = desc;
  const liftedCls = lifted ? " is-lifted" : "";

  return (
    <span
      className={`sc-works-living-underlay domain-${domain} ${stateClass}${liftedCls} sc-building-living-underlay`}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pointerEvents: "none" }}
      >
        {domain === "hearth" && (
          <g>
            {/* Timbered hall gable rafters & warm hearth flame */}
            <polyline points="10,34 32,14 54,34" strokeWidth="2.2" />
            <line x1="16" y1="30" x2="16" y2="52" strokeWidth="1.8" />
            <line x1="48" y1="30" x2="48" y2="52" strokeWidth="1.8" />
            <line x1="12" y1="52" x2="52" y2="52" strokeWidth="1.8" />
            <path
              d="M32 26 C37 33 39 39 32 46 C25 39 27 33 32 26 Z"
              fill="currentColor"
              fillOpacity="0.22"
              strokeWidth="1.7"
            />
            <circle cx="32" cy="39" r="2.2" fill="currentColor" />
          </g>
        )}

        {domain === "craft" && (
          <g>
            {/* Mason keystone arch, joiner square & mill wheel */}
            <path d="M14 52 V32 C14 20 50 20 50 32 V52" strokeWidth="2" />
            <polygon points="27,18 37,18 35,26 29,26" fill="currentColor" fillOpacity="0.24" />
            <circle cx="32" cy="39" r="9" strokeWidth="1.7" fill="currentColor" fillOpacity="0.1" />
            <line x1="32" y1="28" x2="32" y2="50" strokeWidth="1.4" />
            <line x1="21" y1="39" x2="43" y2="39" strokeWidth="1.4" />
            <circle cx="32" cy="39" r="2.4" fill="currentColor" />
          </g>
        )}

        {domain === "mint" && (
          <g>
            {/* Guildhall awning pediment, balance beam & crown bullion */}
            <polygon
              points="10,26 32,14 54,26"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity="0.14"
            />
            <line x1="32" y1="26" x2="32" y2="50" strokeWidth="1.8" />
            <line x1="18" y1="33" x2="46" y2="33" strokeWidth="1.8" />
            <circle cx="20" cy="41" r="4.5" fill="currentColor" fillOpacity="0.16" />
            <circle cx="44" cy="41" r="4.5" fill="currentColor" fillOpacity="0.16" />
            <polygon points="32,45 35,50 32,55 29,50" fill="currentColor" fillOpacity="0.4" />
          </g>
        )}

        {domain === "martial" && (
          <g>
            {/* Crenellated stone parapet, portcullis arch & watch beacon */}
            <path
              d="M12 24 H20 V30 H28 V24 H36 V30 H44 V24 H52 V52 H12 Z"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity="0.12"
            />
            <path d="M25 52 V40 C25 34 39 34 39 40 V52" strokeWidth="1.7" />
            <line x1="32" y1="35" x2="32" y2="52" strokeWidth="1.3" />
            <polygon points="32,12 35,18 32,21 29,18" fill="currentColor" fillOpacity="0.42" />
          </g>
        )}

        {domain === "sanctum" && (
          <g>
            {/* Vaulted lancet sanctuary arch, pillars & scholar star finial */}
            <path
              d="M16 52 V32 Q32 14 48 32 V52"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity="0.12"
            />
            <path d="M23 52 V35 Q32 23 41 35 V52" strokeWidth="1.4" />
            <line x1="12" y1="52" x2="52" y2="52" strokeWidth="1.8" />
            <polygon
              points="32,8 34,13 39,15 34,17 32,22 30,17 25,15 30,13"
              fill="currentColor"
              fillOpacity="0.45"
            />
          </g>
        )}
      </svg>
    </span>
  );
}

export const BuildingLivingUnderlay = WorkLivingUnderlay;

function BuildingGlyphSvgPaths(props: { domain: HallDomain; showGlint?: boolean }) {
  const { domain, showGlint } = props;

  switch (domain) {
    case "hearth":
      return (
        <g>
          {/* Hall gable & hearth flame */}
          <polyline points="3,10 10,4 17,10" />
          <path
            d="M10 8.5 C12.2 11 12.6 13.5 10 16 C7.4 13.5 7.8 11 10 8.5 Z"
            fill="currentColor"
            fillOpacity="0.24"
          />
          <circle
            cx="10"
            cy="13"
            r="1.2"
            fill="currentColor"
            className={showGlint ? "sc-works-glyph-glint sc-building-glyph-glint" : undefined}
          />
        </g>
      );

    case "craft":
      return (
        <g>
          {/* Keystone arch & mill wheel */}
          <path d="M4,16.5 V10 C4,5.5 16,5.5 16,10 V16.5" />
          <circle cx="10" cy="12" r="3" fill="currentColor" fillOpacity="0.18" />
          <circle
            cx="10"
            cy="4"
            r="1.2"
            fill="currentColor"
            className={showGlint ? "sc-works-glyph-glint sc-building-glyph-glint" : undefined}
          />
        </g>
      );

    case "mint":
      return (
        <g>
          {/* Guild pediment & balance scales */}
          <polygon points="3,8 10,3.5 17,8" fill="currentColor" fillOpacity="0.18" />
          <line x1="10" y1="8" x2="10" y2="16.5" />
          <line x1="5" y1="11.5" x2="15" y2="11.5" />
          <circle
            cx="10"
            cy="15.5"
            r="1.3"
            fill="currentColor"
            className={showGlint ? "sc-works-glyph-glint sc-building-glyph-glint" : undefined}
          />
        </g>
      );

    case "martial":
      return (
        <g>
          {/* Rampart merlons & watchtower beacon */}
          <path
            d="M3.5,8 H6.5 V10.5 H9 V8 H11 V10.5 H13.5 V8 H16.5 V16.5 H3.5 Z"
            fill="currentColor"
            fillOpacity="0.16"
          />
          <circle
            cx="10"
            cy="4.2"
            r="1.3"
            fill="currentColor"
            className={showGlint ? "sc-works-glyph-glint sc-building-glyph-glint" : undefined}
          />
        </g>
      );

    case "sanctum":
      return (
        <g>
          {/* Pointed lancet arch & scholar star */}
          <path
            d="M4.5,16.5 V10.5 Q10,4.5 15.5,10.5 V16.5"
            fill="currentColor"
            fillOpacity="0.16"
          />
          <line x1="3.5" y1="16.5" x2="16.5" y2="16.5" />
          <circle
            cx="10"
            cy="3.8"
            r="1.3"
            fill="currentColor"
            className={showGlint ? "sc-works-glyph-glint sc-building-glyph-glint" : undefined}
          />
        </g>
      );
  }
}

/**
 * Subtle living building / hall glyph strip rendered directly beneath the stacked WorkStatus rows,
 * left-aligned with right-pocket clearance so it stays readable and never fights chrome.
 */
export function WorkLivingGlyph(props: WorkLivingProps) {
  const desc = resolveBuildingGlyphDescriptor(props);
  const { domain, stateClass, flair, motion, lifted, staffed, crewed, scarred } = desc;
  const liftedCls = lifted ? " is-lifted" : "";
  const showGlint = !scarred && (staffed || (!crewed && lifted));
  const motionClass =
    motion === "pulse"
      ? "sc-building-pulse-layer sc-works-pulse-layer"
      : motion === "drift"
      ? "sc-building-drift-layer sc-works-drift-layer"
      : "";

  return (
    <span
      className={`sc-works-status-glyph domain-${domain} ${stateClass}${liftedCls} sc-building-status-glyph sc-building-living-glyph`}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <span className="sc-works-glyph-icon sc-building-glyph-icon" style={{ pointerEvents: "none" }}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`sc-building-glyph-svg sc-works-glyph-svg ${motionClass}`}
          style={{ pointerEvents: "none" }}
        >
          <g className="sc-building-glow-layer sc-works-glow-layer" style={{ pointerEvents: "none" }}>
            <BuildingGlyphSvgPaths domain={domain} showGlint={showGlint} />
          </g>
          <BuildingGlyphSvgPaths domain={domain} showGlint={showGlint} />
        </svg>
      </span>
      <span className="sc-works-glyph-flair sc-building-glyph-flair">{flair}</span>
    </span>
  );
}

export const BuildingLivingGlyph = WorkLivingGlyph;
