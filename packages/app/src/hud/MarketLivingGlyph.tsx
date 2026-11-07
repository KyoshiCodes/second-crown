import React from "react";
import "./market-living.css";

export type GoodsKind = "food" | "wood" | "stone" | "gold";

const KNOWN_GOODS: readonly GoodsKind[] = ["food", "wood", "stone", "gold"];

function isGoodsKind(res: string): res is GoodsKind {
  return (KNOWN_GOODS as readonly string[]).includes(res);
}

/**
 * Classifies a market stall by the primary commodity it pays out (`get`),
 * falling back to `give` or `"gold"` so custom offers stay safe.
 */
export function getOfferGoodsKind(offer: {
  give?: Record<string, string>;
  get: Record<string, string>;
}): GoodsKind {
  for (const res of Object.keys(offer.get)) {
    if (isGoodsKind(res)) return res;
  }
  if (offer.give) {
    for (const res of Object.keys(offer.give)) {
      if (isGoodsKind(res)) return res;
    }
  }
  return "gold";
}

export interface MarketLivingProps {
  goods: GoodsKind;
  hasMarket: boolean;
  open: boolean;
  lastLot?: boolean;
}

function stateClassOf(props: MarketLivingProps): string {
  if (!props.hasMarket) return "is-closed";
  if (!props.open) return "is-short";
  if (props.lastLot) return "is-last";
  return "is-open";
}

function openLotFlair(goods: GoodsKind): string {
  switch (goods) {
    case "food":
      return "Grain lot";
    case "wood":
      return "Timber lot";
    case "stone":
      return "Ashlar lot";
    case "gold":
      return "Bullion lot";
  }
}

/**
 * Corner-confined ambient goods watermark tucked into the bottom-right pocket
 * of a Market stall card (opposite the left-aligned Trade button) so it never
 * overlaps or obscures card text.
 * Pure phrasing content (span + svg), pointer-events: none, capped low opacity.
 */
export function MarketLivingUnderlay(props: MarketLivingProps) {
  const { goods } = props;
  const stateClass = stateClassOf(props);

  return (
    <span
      className={`sc-market-living-underlay goods-${goods} ${stateClass}`}
      aria-hidden="true"
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {goods === "food" && (
          <g>
            {/* Tied harvest grain sheaf & chaff mote */}
            <path d="M32 54 V14" strokeWidth="2" />
            <path d="M22 52 C24 38 26 26 18 16" strokeWidth="1.8" />
            <path d="M42 52 C40 38 38 26 46 16" strokeWidth="1.8" />
            {/* Wheat ear kernels */}
            <ellipse cx="32" cy="16" rx="3.5" ry="6" fill="currentColor" fillOpacity="0.18" />
            <ellipse cx="22" cy="22" rx="3" ry="5.5" transform="rotate(-22 22 22)" fill="currentColor" fillOpacity="0.15" />
            <ellipse cx="42" cy="22" rx="3" ry="5.5" transform="rotate(22 42 22)" fill="currentColor" fillOpacity="0.15" />
            {/* Merchant ribbon band */}
            <path d="M23 38 Q32 35 41 38" strokeWidth="2.4" />
            <circle cx="32" cy="37" r="2.2" fill="currentColor" />
          </g>
        )}

        {goods === "wood" && (
          <g>
            {/* Stacked seasoned timber billets & heartwood ring */}
            <circle cx="24" cy="42" r="9" strokeWidth="2" fill="currentColor" fillOpacity="0.12" />
            <circle cx="24" cy="42" r="4" strokeWidth="1.2" />
            <circle cx="42" cy="42" r="9" strokeWidth="2" fill="currentColor" fillOpacity="0.12" />
            <circle cx="42" cy="42" r="4" strokeWidth="1.2" />
            <circle cx="33" cy="26" r="9" strokeWidth="2" fill="currentColor" fillOpacity="0.16" />
            <circle cx="33" cy="26" r="3.5" strokeWidth="1.2" />
            <circle cx="33" cy="26" r="1.3" fill="currentColor" />
          </g>
        )}

        {goods === "stone" && (
          <g>
            {/* Dressed isometric quarry ashlar block & mason plumb star */}
            <polygon
              points="32,12 52,23 52,43 32,54 12,43 12,23"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity="0.12"
            />
            <polyline points="12,23 32,34 52,23" strokeWidth="1.6" />
            <line x1="32" y1="34" x2="32" y2="54" strokeWidth="1.6" />
            <polygon points="32,18 35,23 32,28 29,23" fill="currentColor" fillOpacity="0.35" />
          </g>
        )}

        {goods === "gold" && (
          <g>
            {/* Stacked mint coinage & stamped crown ducat */}
            <ellipse cx="26" cy="44" rx="13" ry="5" strokeWidth="1.6" fill="currentColor" fillOpacity="0.1" />
            <circle cx="36" cy="30" r="14" strokeWidth="2" fill="currentColor" fillOpacity="0.14" />
            <circle cx="36" cy="30" r="9.5" strokeWidth="1.1" strokeDasharray="2.5 2" />
            <polygon
              points="36,22 38,28 44,30 38,32 36,38 34,32 28,30 34,28"
              fill="currentColor"
              fillOpacity="0.45"
            />
          </g>
        )}
      </svg>
    </span>
  );
}

/**
 * Subtle living goods glyph strip rendered directly beneath the stall status rows,
 * left-aligned with right-corner clearance so it stays crisp and never crowds figures
 * or the Trade button.
 */
export function MarketLivingGlyph(props: MarketLivingProps) {
  const { goods, hasMarket, open, lastLot } = props;
  const stateClass = stateClassOf(props);
  const showGlint = hasMarket && open;

  const flair = !hasMarket
    ? "Stall shuttered"
    : !open
      ? "Stores short"
      : lastLot
        ? "Last lot"
        : openLotFlair(goods);

  return (
    <span
      className={`sc-market-status-glyph goods-${goods} ${stateClass}`}
      aria-hidden="true"
    >
      <span className="sc-market-glyph-icon">
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {goods === "food" && (
            <g>
              {/* Harvest wheat sheaf & golden glint */}
              <path d="M10 17 V5" />
              <path d="M6 16 C7 12 7.5 8.5 5 5.5" />
              <path d="M14 16 C13 12 12.5 8.5 15 5.5" />
              <path d="M6.5 12 Q10 10.8 13.5 12" strokeWidth="1.8" />
              <circle
                cx="10"
                cy="3.5"
                r="1.4"
                fill="currentColor"
                className={showGlint ? "sc-market-glyph-glint" : undefined}
              />
            </g>
          )}

          {goods === "wood" && (
            <g>
              {/* Cordwood log billets & trade spark */}
              <circle cx="7" cy="13.5" r="3.2" fill="currentColor" fillOpacity="0.18" />
              <circle cx="13" cy="13.5" r="3.2" fill="currentColor" fillOpacity="0.18" />
              <circle cx="10" cy="8" r="3.2" fill="currentColor" fillOpacity="0.22" />
              <circle
                cx="15.5"
                cy="4.5"
                r="1.3"
                fill="currentColor"
                className={showGlint ? "sc-market-glyph-glint" : undefined}
              />
            </g>
          )}

          {goods === "stone" && (
            <g>
              {/* Faceted quarry ashlar block & mason spark */}
              <polygon
                points="10,3.5 16,7 16,13.5 10,17 4,13.5 4,7"
                fill="currentColor"
                fillOpacity="0.16"
              />
              <polyline points="4,7 10,10.5 16,7" strokeWidth="1.3" />
              <line x1="10" y1="10.5" x2="10" y2="17" strokeWidth="1.3" />
              <circle
                cx="10"
                cy="6.8"
                r="1.2"
                fill="currentColor"
                className={showGlint ? "sc-market-glyph-glint" : undefined}
              />
            </g>
          )}

          {goods === "gold" && (
            <g>
              {/* Stamped crown ducat & mint star glint */}
              <circle cx="10" cy="10.5" r="6.2" fill="currentColor" fillOpacity="0.18" />
              <circle cx="10" cy="10.5" r="3.8" strokeWidth="1.1" strokeDasharray="1.8 1.5" />
              <polygon
                points="10,7.2 10.9,9.6 13.3,10.5 10.9,11.4 10,13.8 9.1,11.4 6.7,10.5 9.1,9.6"
                fill="currentColor"
                className={showGlint ? "sc-market-glyph-glint" : undefined}
              />
            </g>
          )}
        </svg>
      </span>
      <span className="sc-market-glyph-flair">{flair}</span>
    </span>
  );
}
