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
