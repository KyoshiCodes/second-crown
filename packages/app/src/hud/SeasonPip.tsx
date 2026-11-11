import React from "react";
import type { GameState } from "@second-crown/sim";
import { currentSeason, seasonClaimed, seasonBoonPreview } from "@second-crown/sim";
import "./season-pip.css";

export type SeasonName = "Spring" | "Summer" | "Autumn" | "Winter";

export const SEASONS: readonly SeasonName[] = ["Spring", "Summer", "Autumn", "Winter"] as const;

export const SEASON_COLORS: Record<SeasonName, { primary: string; glow: string; text: string }> = {
  Spring: { primary: "#86efac", glow: "rgba(134, 239, 172, 0.28)", text: "#86efac" },
  Summer: { primary: "#fde047", glow: "rgba(253, 224, 71, 0.32)", text: "#fde68a" },
  Autumn: { primary: "#fdba74", glow: "rgba(253, 186, 116, 0.30)", text: "#fdba74" },
  Winter: { primary: "#bae6fd", glow: "rgba(186, 230, 253, 0.28)", text: "#bae6fd" },
};

export const SEASON_WEATHER: Record<SeasonName, string> = {
  Spring: "Dew & Sprout",
  Summer: "High Sun",
  Autumn: "Harvest Gale",
  Winter: "Frost & Flurry",
};

/**
 * Normalizes any season string to "Spring" | "Summer" | "Autumn" | "Winter".
 */
export function normalizeSeason(season?: string | null): SeasonName {
  if (!season) return "Spring";
  const s = season.trim().toLowerCase();
  if (s.startsWith("sum")) return "Summer";
  if (s.startsWith("aut") || s.startsWith("fall")) return "Autumn";
  if (s.startsWith("win")) return "Winter";
  return "Spring";
}

export interface SeasonPipProps {
  /** Season name ("Spring" | "Summer" | "Autumn" | "Winter" or lowercase) */
  season?: string;
  /** Size in pixels (default: 20) */
  size?: number;
  /** Whether the season court boon was claimed this season */
  claimed?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Living Seasonal Crest / Weather Pip:
 * - Changes iconography and atmospheric animations with the current season:
 *   - Spring: blooming leaf sprout, dewdrop twinkle, drifting pollen/petals.
 *   - Summer: radiating solar crown disc, flare star, rising heat shimmer motes.
 *   - Autumn: harvest oak/maple leaf with acorns, gale motes, amber star twinkle.
 *   - Winter: 6-fold crystalline snowflake, glacial diamond core, snow flurries.
 * - Displays active readiness pulse when the seasonal boon is ready to claim.
 * - Strictly pointer-events: none so clicks and taps are never blocked.
 */
export function SeasonPip({
  season = "Spring",
  size = 20,
  claimed,
  className = "",
  style,
  title,
}: SeasonPipProps) {
  const norm = normalizeSeason(season);
  const tone = SEASON_COLORS[norm];
  const claimClass = claimed !== undefined ? (claimed ? "is-claimed" : "is-ready") : "";
  const defaultTitle = `${norm} · ${SEASON_WEATHER[norm]}`;

  return (
    <span
      className={`sc-season-pip-wrapper season-${norm.toLowerCase()} ${claimClass} ${className}`}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        pointerEvents: "none",
        userSelect: "none",
        flexShrink: 0,
        color: tone.primary,
        ...style,
      }}
      aria-hidden="true"
      data-season-pip="true"
      data-season={norm.toLowerCase()}
      data-claimed={claimed}
      title={title ?? defaultTitle}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className="sc-season-pip-svg"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        {/* Layer 1: Ambient seasonal aura glow */}
        <circle
          className="sc-season-glow-layer"
          cx="12"
          cy="12"
          r="8"
          fill="currentColor"
        />

        {/* Layer 2: Readiness pulse ring when season court is unclaimed */}
        {claimed === false && (
          <circle
            className="sc-season-ready-ring"
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            fill="none"
            strokeWidth="1"
          />
        )}

        {/* Layer 3: Seasonal atmospheric drift motes */}
        <g className="sc-season-drift-layer">
          {norm === "Spring" && (
            <>
              {/* Floating petals / pollen motes */}
              <circle className="sc-season-mote sc-season-mote-1" cx="6" cy="7" r="0.9" fill="currentColor" />
              <circle className="sc-season-mote sc-season-mote-2" cx="18" cy="8" r="1.1" fill="currentColor" />
              <circle className="sc-season-mote sc-season-mote-3" cx="16" cy="17" r="0.8" fill="currentColor" />
            </>
          )}

          {norm === "Summer" && (
            <>
              {/* Ascending solar dust / shimmer beams */}
              <circle className="sc-season-mote sc-season-mote-1" cx="7" cy="6" r="1" fill="currentColor" />
              <circle className="sc-season-mote sc-season-mote-2" cx="17" cy="5" r="0.9" fill="currentColor" />
              <circle className="sc-season-mote sc-season-mote-3" cx="12" cy="3" r="0.8" fill="currentColor" />
            </>
          )}

          {norm === "Autumn" && (
            <>
              {/* Swirling gale wind and foliage motes */}
              <path
                className="sc-season-wind-streak"
                d="M4 17 Q8 14 12 17 T20 16"
                stroke="currentColor"
                strokeWidth="0.8"
                fill="none"
                opacity="0.6"
              />
              <circle className="sc-season-mote sc-season-mote-1" cx="6" cy="8" r="1" fill="currentColor" />
              <circle className="sc-season-mote sc-season-mote-2" cx="19" cy="9" r="1.2" fill="currentColor" />
            </>
          )}

          {norm === "Winter" && (
            <>
              {/* Drifting crystalline snowflakes */}
              <circle className="sc-season-mote sc-season-mote-1" cx="5" cy="7" r="1" fill="currentColor" />
              <circle className="sc-season-mote sc-season-mote-2" cx="19" cy="6" r="0.8" fill="currentColor" />
              <circle className="sc-season-mote sc-season-mote-3" cx="17" cy="18" r="1.1" fill="currentColor" />
            </>
          )}
        </g>

        {/* Layer 4: Seasonal Crest Heraldic Iconography */}
        <g className="sc-season-art-base">
          {norm === "Spring" && (
            /* Spring: Leafy sprout & blossom */
            <>
              {/* Curved sprout stem */}
              <path
                d="M12 9 C11.5 13 13 16 12 20"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />
              {/* Left unfurling leaf */}
              <path
                d="M12 14.5 C9.5 14 8 12 10 11.5 C11.5 12.5 12 13.5 12 14.5 Z"
                fill="currentColor"
                fillOpacity="0.45"
                stroke="currentColor"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
              {/* Right unfurling leaf */}
              <path
                d="M12 16.5 C14.5 16 16 14 14 13.5 C12.5 14.5 12 15.5 12 16.5 Z"
                fill="currentColor"
                fillOpacity="0.45"
                stroke="currentColor"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
              {/* Blossom head */}
              <circle cx="12" cy="7" r="2.2" fill="currentColor" fillOpacity="0.6" stroke="currentColor" strokeWidth="0.8" />
              {/* Four petal contours */}
              <path d="M12 4 C11 5 11 6 12 7 C13 6 13 5 12 4 Z" fill="currentColor" />
              <path d="M9 7 C10 6 11 6 12 7 C11 8 10 8 9 7 Z" fill="currentColor" />
              <path d="M15 7 C14 6 13 6 12 7 C13 8 14 8 15 7 Z" fill="currentColor" />
            </>
          )}

          {norm === "Summer" && (
            /* Summer: Radiating Solar Disc */
            <>
              {/* High-noon sun disc */}
              <circle cx="12" cy="12" r="4.2" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1" />
              {/* Cardinal rays */}
              <path d="M12 3.5 V5.8 M12 18.2 V20.5 M3.5 12 H5.8 M18.2 12 H20.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              {/* Diagonal flame wave rays */}
              <path d="M6 6 Q7 5 8 7 M18 6 Q17 5 16 7 M6 18 Q7 19 8 17 M18 18 Q17 19 16 17" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
              {/* Inner ring */}
              <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.8" />
            </>
          )}

          {norm === "Autumn" && (
            /* Autumn: Harvest oak/maple leaf with acorns */
            <>
              {/* Lobed autumn leaf contour */}
              <path
                d="M12 4.5 L13.5 8 L17 7 L15.5 10.5 L19 12 L16 14.5 L17.2 18 L13.5 17 L12 20.5 L10.5 17 L6.8 18 L8 14.5 L5 12 L8.5 10.5 L7 7 L10.5 8 Z"
                fill="currentColor"
                fillOpacity="0.45"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
              />
              {/* Center leaf vein */}
              <path d="M12 6.5 V19.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
              {/* Side leaf veins */}
              <path d="M12 10.5 L15 9 M12 10.5 L9 9 M12 14 L15.5 13 M12 14 L8.5 13" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
            </>
          )}

          {norm === "Winter" && (
            /* Winter: 6-Point Crystalline Snowflake */
            <>
              {/* 3 main crystalline axes */}
              <path d="M12 3.5 V20.5 M4.6 7.7 L19.4 16.3 M4.6 16.3 L19.4 7.7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              {/* Barbed chevron branches */}
              <path d="M10.2 5.5 L12 7.2 L13.8 5.5 M10.2 18.5 L12 16.8 L13.8 18.5" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
              <path d="M6 9.5 L7.8 8.5 L7 10.5 M18 14.5 L16.2 15.5 L17 13.5" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
              <path d="M6 14.5 L7.8 15.5 L7 13.5 M18 9.5 L16.2 8.5 L17 10.5" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
              {/* Faceted ice diamond core */}
              <path d="M12 10.2 L13.8 12 L12 13.8 L10.2 12 Z" fill="currentColor" fillOpacity="0.6" stroke="currentColor" strokeWidth="0.8" />
            </>
          )}
        </g>

        {/* Layer 5: Brilliant Twinkle Star Glint */}
        <g className="sc-season-pulse-layer">
          <path
            className="sc-season-glint-star"
            d="M12 8.5 L12.5 10.5 L14.5 11 L12.5 11.5 L12 13.5 L11.5 11.5 L9.5 11 L11.5 10.5 Z"
            fill="#ffffff"
          />
        </g>
      </svg>
    </span>
  );
}

export const SeasonalCrestPip = SeasonPip;
export const SeasonWeatherPip = SeasonPip;

export interface SeasonStatusLineProps {
  season?: string;
  state?: GameState;
  boon?: { season: string; res: string; amount: number } | null;
  claimed?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Living season status line combining the SeasonPip with seasonal status description or boon preview.
 */
export function SeasonStatusLine({
  season,
  state,
  boon,
  claimed,
  className = "",
  style,
  children,
}: SeasonStatusLineProps) {
  const resolvedSeason = season ?? (boon?.season) ?? (state ? currentSeason(state) : "Spring");
  const isClaimed = claimed ?? (state ? seasonClaimed(state) : undefined);
  const resolvedBoon = boon ?? (state ? seasonBoonPreview(state) : null);
  const norm = normalizeSeason(resolvedSeason);

  return (
    <div
      className={`sc-season-status-line is-${norm.toLowerCase()} ${isClaimed ? "is-claimed" : "is-ready"} ${className}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, ...style }}
      data-season-status-line="true"
      data-season={norm.toLowerCase()}
      data-claimed={isClaimed}
    >
      <SeasonPip season={resolvedSeason} size={16} claimed={isClaimed} />
      <span className="sc-season-status-text">
        {children ?? (
          resolvedBoon
            ? `${resolvedBoon.season}: +${resolvedBoon.amount} ${resolvedBoon.res} once this season.`
            : `${resolvedSeason} in the realm.`
        )}
      </span>
    </div>
  );
}
