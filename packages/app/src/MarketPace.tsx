import React from "react";
import {
  buildTicksLeft,
  canTrade,
  countBuilding,
  listWorksInProgress,
  MARKET_OFFERS,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import "./market-pace.css";

/** Current market state, straight from the sim. Trade rates are the fixed `MARKET_OFFERS` table. */
export interface MarketRate {
  /** Finished player Markets. */
  markets: number;
  /** Offers `canTrade` allows right now. */
  open: number;
  /** All offers in the table. */
  total: number;
}

/** The next queued event that changes the market. Read-only. */
export interface MarketChange {
  /** Sim ticks until it lands. */
  ticks: number;
  /** "first" opens trading; "another" adds a Market to an open one. */
  source: "first" | "another";
}

export function marketRate(state: GameState): MarketRate {
  return {
    markets: countBuilding(state, "market"),
    open: MARKET_OFFERS.filter((o) => canTrade(state, o.id)).length,
    total: MARKET_OFFERS.length,
  };
}

/** Earliest player Market under construction. Reads only sim helpers. */
export function nextMarketChange(state: GameState): MarketChange | null {
  let ticks: number | null = null;
  for (const b of listWorksInProgress(state, "player")) {
    if (b.typeId !== "market") continue;
    const t = buildTicksLeft(state, b.id);
    if (ticks === null || t < ticks) ticks = t;
  }
  if (ticks === null) return null;
  return { ticks, source: countBuilding(state, "market") < 1 ? "first" : "another" };
}

const LABEL: Record<MarketChange["source"], string> = {
  first: "the first Market finishes (opens trading)",
  another: "another Market finishes",
};

/** Sim ticks to whole seconds, same rounding as the build queue. */
function secs(ticks: number): number {
  return Math.ceil(ticks / TICKS_PER_SECOND);
}

export interface MarketPaceGlyphPipProps {
  rising?: boolean;
  source?: "first" | "another";
  closed?: boolean;
  openTrades?: number;
  totalTrades?: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Living market pace glyph:
 * - rising: golden striped market awning with stall posts, center trade spark/scale, radiant apex star, and breathing amber aura
 * - steady: calm brass and slate merchant scale with balance beam, trade pans, and coin dot
 * - closed: shuttered stall with padlock and quiet iron planks
 */
export function MarketPaceGlyphPip({
  rising = false,
  source,
  closed = false,
  openTrades,
  totalTrades,
  size = 16,
  className = "",
  style,
}: MarketPaceGlyphPipProps) {
  const paceClass = rising ? "is-rising" : closed ? "is-closed" : "is-steady";
  const sourceClass = source ? ` is-source-${source}` : "";

  return (
    <span
      className={`sc-market-pace-glyph-wrap ${paceClass}${sourceClass} ${className}`.trim()}
      style={{ width: size, height: size, pointerEvents: "none", ...style }}
      aria-hidden="true"
      data-market={rising ? (source || "rising") : closed ? "closed" : "steady"}
      data-source={source}
      data-closed={closed ? "true" : "false"}
      data-open={openTrades}
      data-total={totalTrades}
    >
      {rising && <span className="sc-market-pace-aura" aria-hidden="true" />}
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className={`sc-market-pace-glyph ${paceClass}`}
        style={{ pointerEvents: "none" }}
      >
        {rising ? (
          <>
            {/* Rising Market: Golden Awning & Commerce Spark */}
            {/* Awning body */}
            <path
              d="M2.5 5 C2.5 3.8 4 3 8 3 C12 3 13.5 3.8 13.5 5 L14 7 C13.2 7.8 12.2 7.8 11.5 7 C10.8 7.8 9.8 7.8 9 7 C8.2 7.8 7.2 7.8 6.5 7 C5.8 7.8 4.8 7.8 4 7 C3.2 7.8 2.5 7.5 2 7 Z"
              fill="#b45309"
              stroke="#fbbf24"
              strokeWidth="0.8"
            />
            {/* Gold scalloped awning stripes */}
            <path d="M4 5 L4 7 C4.8 7.8 5.8 7.8 6.5 7 L6.5 5" fill="#fef08a" />
            <path d="M9 5 L9 7 C9.8 7.8 10.8 7.8 11.5 7 L11.5 5" fill="#fef08a" />

            {/* Counter ledge */}
            <line x1="2.5" y1="11.8" x2="13.5" y2="11.8" stroke="#fbbf24" strokeWidth="0.9" strokeLinecap="round" />

            {source === "another" ? (
              <>
                {/* Multi-market expansion scale */}
                <line x1="4.5" y1="9.2" x2="11.5" y2="9.2" stroke="#fde047" strokeWidth="0.8" />
                <circle cx="8" cy="9.2" r="0.8" fill="#f59e0b" />
                <path d="M4.5 9.2 L3.8 11.2 C4.5 12 5.5 12 6.2 11.2 Z" fill="#fde047" stroke="#b45309" strokeWidth="0.5" />
                <path d="M11.5 9.2 L10.8 11.2 C11.5 12 12.5 12 13.2 11.2 Z" fill="#fde047" stroke="#b45309" strokeWidth="0.5" />
                <line x1="3" y1="7" x2="3" y2="13.5" stroke="#d97706" strokeWidth="0.9" />
                <line x1="13" y1="7" x2="13" y2="13.5" stroke="#d97706" strokeWidth="0.9" />
              </>
            ) : (
              <>
                {/* First market opening spark */}
                <polygon
                  points="8,8.2 8.6,9.3 9.8,9.6 8.9,10.5 9.2,11.6 8,11 6.8,11.6 7.1,10.5 6.2,9.6 7.4,9.3"
                  fill="#fde047"
                  stroke="#b45309"
                  strokeWidth="0.4"
                />
                <line x1="3.5" y1="7" x2="3.5" y2="13.5" stroke="#d97706" strokeWidth="0.9" />
                <line x1="12.5" y1="7" x2="12.5" y2="13.5" stroke="#d97706" strokeWidth="0.9" />
              </>
            )}

            {/* Radiant apex trade diamond star */}
            <polygon
              points="8,0.8 8.6,2 9.8,2.3 8.8,3.2 9.1,4.4 8,3.7 6.9,4.4 7.2,3.2 6.2,2.3 7.4,2"
              fill="#fffbeb"
              stroke="#d97706"
              strokeWidth="0.3"
              className="sc-market-pace-star"
            />
          </>
        ) : closed ? (
          <>
            {/* Closed Market: Shuttered Stall & Padlock */}
            <rect x="3" y="4.5" width="10" height="9" rx="0.5" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
            <line x1="3" y1="7.5" x2="13" y2="7.5" stroke="#334155" strokeWidth="0.7" />
            <line x1="3" y1="10.5" x2="13" y2="10.5" stroke="#334155" strokeWidth="0.7" />
            {/* Padlock */}
            <rect x="6.8" y="8.4" width="2.4" height="2.2" rx="0.4" fill="#64748b" stroke="#334155" strokeWidth="0.5" />
            <path d="M7.3 8.4 L7.3 7.4 C7.3 6.8 8.7 6.8 8.7 7.4 L8.7 8.4" fill="none" stroke="#64748b" strokeWidth="0.6" />
          </>
        ) : (
          <>
            {/* Steady Open Market: Merchant Scale & Counter */}
            <line x1="3" y1="4.5" x2="13" y2="4.5" stroke="#64748b" strokeWidth="1" strokeLinecap="round" />
            <line x1="8" y1="4.5" x2="8" y2="13.5" stroke="#64748b" strokeWidth="0.9" />
            <line x1="4.5" y1="7.5" x2="11.5" y2="7.5" stroke="#94a3b8" strokeWidth="0.9" strokeLinecap="round" />
            <circle cx="8" cy="7.5" r="0.9" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
            <path d="M4.5 7.5 L4 9.8 C4.8 10.6 5.6 10.6 6.4 9.8 Z" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
            <path d="M11.5 7.5 L10.4 9.8 C11.2 10.6 12 10.6 12.8 9.8 Z" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
            <line x1="3" y1="13.5" x2="13" y2="13.5" stroke="#475569" strokeWidth="1" strokeLinecap="round" />
            <circle cx="5.2" cy="9.5" r="0.5" fill="#fde047" />
          </>
        )}
      </svg>
    </span>
  );
}

export function MarketPace(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const rate = marketRate(state);
  const next = nextMarketChange(state);
  const closed = rate.markets < 1;
  return (
    <p
      className={`sc-market-pace${closed ? " is-closed" : ""}${next ? " is-rising" : ""}`}
      data-market={next ? next.source : closed ? "closed" : "steady"}
    >
      <MarketPaceGlyphPip
        rising={Boolean(next)}
        source={next?.source}
        closed={closed}
        openTrades={rate.open}
        totalTrades={rate.total}
      />
      Market pace ·{" "}
      <strong>{closed ? "market closed" : `${rate.open} of ${rate.total} trades open`}</strong>
      {next ? (
        <>
          {" "}· next change in <strong>{secs(next.ticks)}s</strong>: {LABEL[next.source]}
        </>
      ) : (
        " · no change queued"
      )}
      .
    </p>
  );
}
