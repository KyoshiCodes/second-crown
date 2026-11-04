import React from "react";
import { canTrade, countBuilding, MARKET_OFFERS, type GameState } from "@second-crown/sim";
import "./market-hint.css";

type Offer = (typeof MARKET_OFFERS)[number];

export interface MarketGlyphPipProps {
  offerId?: string;
  ready?: boolean;
  isClosed?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Living merchant market glyph:
 * - ready: merchant trade stall with striped awning, swaying golden balance scales, coins, and breathing aura
 * - waiting: steady bronze scales awaiting trade stores under market canopy
 * - closed: shuttered market stall with padlock awaiting Market construction
 */
export function MarketGlyphPip({
  offerId,
  ready = false,
  isClosed = false,
  size = 16,
  className = "",
  style,
}: MarketGlyphPipProps) {
  const statusClass = isClosed ? "is-closed" : ready ? "is-ready" : "is-waiting";
  return (
    <span
      className={`sc-market-glyph-wrap ${statusClass} ${offerId ? `is-${offerId}` : ""} ${className}`.trim()}
      style={{ width: size, height: size, pointerEvents: "none", ...style }}
      aria-hidden="true"
      data-market-glyph={isClosed ? "closed" : offerId ?? "market"}
      data-ready={ready ? "true" : "false"}
    >
      {ready && <span className="sc-market-glyph-aura" aria-hidden="true" />}
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className={`sc-market-glyph ${statusClass}`}
        style={{ pointerEvents: "none" }}
      >
        {isClosed ? (
          <>
            {/* Shuttered Market Stall: Timber framework */}
            <path
              d="M3.5 13.5 L3.5 6 M12.5 13.5 L12.5 6 M2.5 13.5 L13.5 13.5"
              stroke="#475569"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
            {/* Shuttered closed awning */}
            <path
              d="M2.5 5.5 L8 3 L13.5 5.5 L8 7 Z"
              fill="#334155"
              stroke="#1e293b"
              strokeWidth="0.6"
            />
            {/* Padlock on shutter */}
            <rect
              x="6.8"
              y="8.5"
              width="2.4"
              height="2.2"
              rx="0.4"
              fill="#94a3b8"
              stroke="#475569"
              strokeWidth="0.4"
            />
            <path
              d="M7.3 8.5 V7.6 C7.3 7 8.7 7 8.7 7.6 V8.5"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="0.5"
            />
          </>
        ) : ready ? (
          <>
            {/* Striped Canopy Awning */}
            <path
              d="M2.2 4.8 L8 2.2 L13.8 4.8 L8 6.2 Z"
              fill="#dc2626"
              stroke="#991b1b"
              strokeWidth="0.5"
            />
            {/* Gold awning stripes */}
            <path d="M5.2 4.6 L7 3.2 L7.8 5.4 L6 6 Z" fill="#facc15" />
            <path d="M10.8 4.6 L9 3.2 L8.2 5.4 L10 6 Z" fill="#facc15" />

            {/* Merchant Scales Pillar & Base */}
            <path
              d="M8 6 L8 13.5 M5.5 13.5 L10.5 13.5"
              stroke="#b45309"
              strokeWidth="1"
              strokeLinecap="round"
            />

            {/* Swaying Balance Scale Group */}
            <g className="sc-market-glyph-scale">
              {/* Balance Crossbeam */}
              <path
                d="M3.6 7.5 L12.4 7.5"
                stroke="#f59e0b"
                strokeWidth="0.9"
                strokeLinecap="round"
              />
              {/* Fulcrum Pivot */}
              <circle cx="8" cy="7.5" r="0.9" fill="#fef08a" />

              {/* Left Pan (give) */}
              <path
                d="M3.6 7.5 L2.6 10.5 M3.6 7.5 L4.6 10.5"
                stroke="#d97706"
                strokeWidth="0.5"
              />
              <path
                d="M2.1 10.5 C2.1 11.6 5.1 11.6 5.1 10.5 Z"
                fill="#fbbf24"
                stroke="#b45309"
                strokeWidth="0.5"
              />
              <circle cx="3.6" cy="10" r="0.8" fill="#fef08a" />

              {/* Right Pan (get) */}
              <path
                d="M12.4 7.5 L11.4 10.5 M12.4 7.5 L13.4 10.5"
                stroke="#d97706"
                strokeWidth="0.5"
              />
              <path
                d="M10.9 10.5 C10.9 11.6 13.9 11.6 13.9 10.5 Z"
                fill="#fbbf24"
                stroke="#b45309"
                strokeWidth="0.5"
              />
              <circle cx="12.4" cy="10" r="0.8" fill="#60a5fa" />
            </g>

            {/* Apex Trade Star / Coin Glint */}
            <path
              d="M8 1.2 L8.6 2.4 L9.8 3 L8.6 3.6 L8 4.8 L7.4 3.6 L6.2 3 L7.4 2.4 Z"
              fill="#ffffff"
              className="sc-market-glyph-star"
            />
          </>
        ) : (
          <>
            {/* Waiting for Stores: Quiet Awning */}
            <path
              d="M2.5 5.2 L8 2.6 L13.5 5.2 L8 6.5 Z"
              fill="#b45309"
              stroke="#78350f"
              strokeWidth="0.5"
            />
            {/* Steady Pillar & Base */}
            <path
              d="M8 6.2 L8 13.5 M5.8 13.5 L10.2 13.5"
              stroke="#64748b"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
            {/* Slightly tilted beam awaiting stores */}
            <path
              d="M3.8 8 L12.2 7"
              stroke="#94a3b8"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <circle cx="8" cy="7.5" r="0.8" fill="#cbd5e1" />

            {/* Left Pan */}
            <path
              d="M3.8 8 L3 10.8 M3.8 8 L4.6 10.8"
              stroke="#64748b"
              strokeWidth="0.5"
            />
            <path
              d="M2.4 10.8 C2.4 11.6 5.2 11.6 5.2 10.8 Z"
              fill="#64748b"
              stroke="#475569"
              strokeWidth="0.4"
            />

            {/* Right Pan */}
            <path
              d="M12.2 7 L11.4 9.8 M12.2 7 L13 9.8"
              stroke="#64748b"
              strokeWidth="0.5"
            />
            <path
              d="M10.8 9.8 C10.8 10.6 13.6 10.6 13.6 9.8 Z"
              fill="#94a3b8"
              stroke="#64748b"
              strokeWidth="0.4"
            />
          </>
        )}
      </svg>
    </span>
  );
}

/** What a trade costs, exactly as the sim table lists its give side, e.g. "20 food". */
export function tradeCostText(offer: Offer): string {
  return Object.entries(offer.give)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ");
}

/**
 * Next trade to point at: the first offer in table order that the sim says can
 * be made now (`canTrade`). If none can, the first offer, marked not ready.
 * Null when there is no Market yet. Read-only.
 */
export function nextTrade(state: GameState): { offer: Offer; ready: boolean } | null {
  if (countBuilding(state, "market") < 1) return null;
  const ready = MARKET_OFFERS.find((o) => canTrade(state, o.id));
  if (ready) return { offer: ready, ready: true };
  return MARKET_OFFERS.length ? { offer: MARKET_OFFERS[0], ready: false } : null;
}

export function MarketHint(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const next = nextTrade(state);
  if (!next) {
    return (
      <p className="sc-market-hint is-closed">
        <MarketGlyphPip isClosed={true} ready={false} />
        Next trade · build a Market to open trading.
      </p>
    );
  }
  const { offer, ready } = next;
  return (
    <p className={`sc-market-hint${ready ? " is-ready" : ""}`} data-offer={offer.id}>
      <MarketGlyphPip offerId={offer.id} ready={ready} isClosed={false} />
      Next trade · <strong>{offer.label}</strong> · costs {tradeCostText(offer)}
      {ready ? "" : " · not enough in stores"}. Trade in the Market below.
    </p>
  );
}
