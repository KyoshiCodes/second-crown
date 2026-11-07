import React from "react";
import type { ForceTone } from "./ForceCard";
import "./war-living.css";

/**
 * Living war glyphs under War Room force cards: warbands, cloaks, carts, and tents.
 * Purely decorative display layer: reads existing ForceCard props without sim mutations or new math,
 * confines watermarks to a low-opacity bottom-right pocket, and enforces pointer-events: none.
 */

export type WarForceEmblem = "warband" | "cloak" | "cart" | "tent";

export interface WarLivingGlyphProps {
  tone: ForceTone;
  riskTone?: string;
  moving?: boolean;
  loaded?: boolean;
  empty?: boolean;
}

export interface WarForceLivingDescriptor {
  emblem: WarForceEmblem;
  isDanger: boolean;
  moving: boolean;
  flair: string;
}

/** Maps a War Room ForceTone or chip kind to its canonical living emblem. */
export function getWarForceEmblem(tone: ForceTone | string): WarForceEmblem {
  switch (tone) {
    case "hostile":
    case "warband":
      return "warband";
    case "scout":
    case "cloak":
      return "cloak";
    case "gather":
    case "cart":
      return "cart";
    case "garrison":
    case "tent":
      return "tent";
    default:
      return "warband";
  }
}

/** Pure resolver for a War Room force card's living emblem, danger flag, and readable flair. */
export function resolveWarForceLiving(props: WarLivingGlyphProps): WarForceLivingDescriptor {
  const { tone, riskTone, moving = false, loaded, empty } = props;
  const emblem = getWarForceEmblem(tone);
  const isDanger = riskTone === "danger" || emblem === "warband";

  let flair: string;
  switch (emblem) {
    case "warband":
      flair = moving ? "Warband march" : "Warband host";
      break;
    case "cloak":
      flair = moving ? "Cloak outrider" : "Cloak watch";
      break;
    case "cart":
      flair = loaded ? "Cart laden" : empty ? "Cart empty" : "Supply cart";
      break;
    case "tent":
      flair = isDanger ? "Tent under threat" : "Pavilion tent";
      break;
  }

  return { emblem, isDanger, moving, flair };
}

function EmblemBadgeSvg({
  emblem,
  loaded,
  empty,
}: {
  emblem: WarForceEmblem;
  loaded?: boolean;
  empty?: boolean;
}) {
  switch (emblem) {
    case "warband":
      return (
        <svg className="sc-war-glyph-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <ellipse className="sc-war-glow-layer" cx="8" cy="12.2" rx="5.8" ry="2.4" fill="currentColor" fillOpacity="0.24" />
          {/* Horned iron warband helm & surcoat */}
          <g className="sc-war-drift-layer">
            <path
              d="M5.2 7.2C3.3 6.2 2.8 4.4 3.8 3.2C4.4 4.5 5.1 5.3 6.1 5.7M10.8 7.2C12.7 6.2 13.2 4.4 12.2 3.2C11.6 4.5 10.9 5.3 9.9 5.7"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M5.2 8.2C5.2 5.9 6.4 4.8 8 4.8C9.6 4.8 10.8 5.9 10.8 8.2V10.6H5.2V8.2Z"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="currentColor"
              fillOpacity="0.16"
            />
            <path d="M4.6 13.6L5.4 10.6H10.6L11.4 13.6" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {/* Spiked morningstar & visor glint */}
          <g className="sc-war-pulse-layer">
            <path d="M6.4 8.2H9.6M8 8.2V10.2" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
            <circle cx="13" cy="9.6" r="1.45" fill="currentColor" fillOpacity="0.82" />
            <path d="M13 7.3V11.9M10.7 9.6H15.3" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
          </g>
        </svg>
      );

    case "cloak":
      return (
        <svg className="sc-war-glyph-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <ellipse className="sc-war-glow-layer" cx="8" cy="12" rx="5.6" ry="2.2" fill="currentColor" fillOpacity="0.22" />
          {/* Hooded reconnaissance stealth cloak & billowing mantle */}
          <g className="sc-war-drift-layer">
            <path
              d="M8 2.6C6.1 2.6 4.9 4.2 4.8 6.3L3.2 13.2C5.6 12.4 7.3 12.7 8.8 13.5C10.3 12.8 11.6 12.5 12.8 13L11.1 6.3C11 4.2 9.9 2.6 8 2.6Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
              fill="currentColor"
              fillOpacity="0.15"
            />
            <path d="M6.4 5.8C6.9 4.8 9.1 4.8 9.6 5.8" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
          </g>
          {/* Moonlit cloak brooch clasp & brass spyglass */}
          <g className="sc-war-pulse-layer">
            <circle cx="8" cy="7.6" r="1.05" fill="currentColor" />
            <path d="M9.6 9.8L13.6 8.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="13.8" cy="8.1" r="0.85" fill="currentColor" />
          </g>
        </svg>
      );

    case "cart":
      return (
        <svg className="sc-war-glyph-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <ellipse className="sc-war-glow-layer" cx="8" cy="13" rx="5.8" ry="2" fill="currentColor" fillOpacity="0.22" />
          {/* Timber cargo wagon bed, draft yoke & spoked wheel */}
          <g className="sc-war-drift-layer">
            <path
              d="M2.4 7.6H11.4L10.6 10.8H3.2L2.4 7.6ZM11.4 9.2L14.3 8.1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="currentColor"
              fillOpacity="0.14"
            />
            <circle cx="6.8" cy="12" r="2.3" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.12" />
            <circle cx="6.8" cy="12" r="0.7" fill="currentColor" />
          </g>
          {/* Cargo grain sacks & crates (laden vs bare rail) */}
          <g className="sc-war-pulse-layer">
            {empty ? (
              <path d="M3.8 6.4H9.8" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" strokeLinecap="round" />
            ) : (
              <>
                <rect
                  x="3.6"
                  y="4.8"
                  width="3.2"
                  height="2.7"
                  rx="0.5"
                  stroke="currentColor"
                  strokeWidth="1.05"
                  fill="currentColor"
                  fillOpacity={loaded ? "0.32" : "0.16"}
                />
                <path
                  d="M7.4 7.5C7.4 5.6 8.4 4.6 9.4 4.6C10.4 4.6 10.9 5.7 10.8 7.5"
                  stroke="currentColor"
                  strokeWidth="1.05"
                  fill="currentColor"
                  fillOpacity={loaded ? "0.32" : "0.16"}
                />
              </>
            )}
          </g>
        </svg>
      );

    case "tent":
      return (
        <svg className="sc-war-glyph-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <ellipse className="sc-war-glow-layer" cx="8" cy="12.8" rx="5.8" ry="2.1" fill="currentColor" fillOpacity="0.22" />
          {/* Pavilion ridgepole military tent & leaning spear */}
          <g className="sc-war-drift-layer">
            <path
              d="M2.4 13L8 4.4L13.6 13H2.4Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
              fill="currentColor"
              fillOpacity="0.15"
            />
            <path d="M8 4.4V13M6.1 13L8 9.2L9.9 13" stroke="currentColor" strokeWidth="1.05" strokeLinejoin="round" />
            <path d="M13.6 13L14.4 5.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </g>
          {/* Ridgepole pennant & warm camp hearth lantern */}
          <g className="sc-war-pulse-layer">
            <path d="M8 4.4V2.1L11.1 3.1L8 4.1" fill="currentColor" fillOpacity="0.82" />
            <circle cx="8" cy="11.5" r="0.95" fill="currentColor" />
          </g>
        </svg>
      );
  }
}

function WatermarkEmblemMotif({ emblem, empty }: { emblem: WarForceEmblem; empty?: boolean }) {
  switch (emblem) {
    case "warband":
      return (
        <>
          <path
            d="M11 16C7.5 14 6.5 10.5 8.5 8C9.8 10.5 11 12 13 12.8M23 16C26.5 14 27.5 10.5 25.5 8C24.2 10.5 23 12 21 12.8"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path d="M11 18C11 13.5 13.6 11.2 17 11.2C20.4 11.2 23 13.5 23 18V23H11V18Z" stroke="currentColor" strokeWidth="1.35" />
          <path d="M9.5 29L11.2 23H22.8L24.5 29" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="27.5" cy="20.5" r="2.6" stroke="currentColor" strokeWidth="1.25" />
          <path d="M27.5 16.5V24.5M23.5 20.5H31.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
        </>
      );
    case "cloak":
      return (
        <>
          <path
            d="M18 7.5C14.2 7.5 11.8 10.8 11.5 15L8.5 28.5C13.2 27 16.8 27.6 19.6 29C22.4 27.8 25.2 27.2 27.8 28.2L24.5 15C24.2 10.8 21.8 7.5 18 7.5Z"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
          <circle cx="18" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
          <path d="M20.8 21.8L29.2 18.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </>
      );
    case "cart":
      return (
        <>
          <path d="M7.5 17.5H24.5L23 23.8H9.2L7.5 17.5ZM24.5 20.6L30.5 18.4" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="16" cy="26.2" r="4.2" stroke="currentColor" strokeWidth="1.35" />
          <circle cx="16" cy="26.2" r="1.2" fill="currentColor" />
          {!empty ? (
            <path d="M10 17.4V12.4H16V17.4M17.5 17.4C17.5 13.6 19.5 11.8 21.4 11.8C23.2 11.8 24.2 13.8 24 17.4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          ) : null}
        </>
      );
    case "tent":
      return (
        <>
          <path d="M7.5 28.5L18.5 11L29.5 28.5H7.5Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
          <path d="M18.5 11V28.5M14.8 28.5L18.5 21L22.2 28.5" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" />
          <path d="M18.5 11V6.8L24.5 8.6L18.5 10.4" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" />
        </>
      );
  }
}

/**
 * Corner-confined ambient living war watermark tucked into the bottom-right pocket of ForceCard.
 */
export function WarLivingUnderlay(props: WarLivingGlyphProps) {
  const { empty } = props;
  const { emblem, isDanger, moving } = resolveWarForceLiving(props);
  const classes = [
    "sc-war-living-underlay",
    `is-${props.tone}`,
    `emblem-${emblem}`,
    moving ? "is-moving" : "",
    isDanger ? "is-danger" : "",
    empty ? "is-empty" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} aria-hidden="true" data-war-underlay={emblem}>
      <svg className="sc-war-living-watermark" viewBox="0 0 34 34" fill="none" aria-hidden="true" focusable="false">
        <WatermarkEmblemMotif emblem={emblem} empty={empty} />
      </svg>
    </span>
  );
}

/**
 * Living war glyph strip rendered under ForceLedger and ForceStatus on War Room force cards.
 */
export function WarLivingGlyph(props: WarLivingGlyphProps) {
  const { loaded, empty } = props;
  const { emblem, isDanger, moving, flair } = resolveWarForceLiving(props);
  const classes = [
    "sc-war-status-glyph",
    `is-${props.tone}`,
    `emblem-${emblem}`,
    moving ? "is-moving" : "",
    isDanger ? "is-danger" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} aria-hidden="true" data-war-emblem={emblem}>
      <span className="sc-war-glyph-icon">
        <EmblemBadgeSvg emblem={emblem} loaded={loaded} empty={empty} />
      </span>
      <span className="sc-war-glyph-flair">{flair}</span>
    </span>
  );
}
