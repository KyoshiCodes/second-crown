import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, MARKET_OFFERS } from "@second-crown/sim";
import { MarketHint, MarketGlyphPip, nextTrade, tradeCostText } from "./MarketHint";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: {
      getBuiltinModule?: (id: string) => {
        readFileSync: (path: URL, encoding: string) => string;
      };
    };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function withMarket() {
  const s = createGameState({ seed: 1 });
  s.buildings = [{ typeId: "market", completesAtTick: null } as (typeof s.buildings)[number]];
  for (const k of Object.keys(s.resources)) s.resources[k] = "0";
  return s;
}

describe("tradeCostText", () => {
  it("reads the give side straight from the sim offer table", () => {
    expect(tradeCostText(MARKET_OFFERS[0])).toBe("20 food");
    expect(tradeCostText(MARKET_OFFERS[3])).toBe("8 gold");
  });
});

describe("MarketHint", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<MarketHint state={undefined} />)).toBe("");
  });

  it("asks for a Market when none is built", () => {
    const s = createGameState({ seed: 1 });
    s.buildings = [];
    expect(nextTrade(s)).toBeNull();
    const html = renderToStaticMarkup(<MarketHint state={s} />);
    expect(html).toContain("build a Market");
    expect(html).toContain("is-closed");
    expect(html).toContain('data-market-glyph="closed"');
  });

  it("names the first trade the stores can pay for", () => {
    const s = withMarket();
    s.resources.gold = "8";
    const gold = MARKET_OFFERS.find((o) => o.id === "gold_food")!;
    expect(nextTrade(s)).toEqual({ offer: gold, ready: true });
    const html = renderToStaticMarkup(<MarketHint state={s} />);
    expect(html).toContain(gold.label);
    expect(html).toContain("costs 8 gold");
    expect(html).toContain("is-ready");
    expect(html).not.toContain("not enough in stores");
    expect(html).toContain('data-market-glyph="gold_food"');
    expect(html).toContain('class="sc-market-glyph-aura"');
  });

  it("falls back to the first offer when nothing is affordable", () => {
    const s = withMarket();
    expect(nextTrade(s)).toEqual({ offer: MARKET_OFFERS[0], ready: false });
    const html = renderToStaticMarkup(<MarketHint state={s} />);
    expect(html).toContain("costs 20 food");
    expect(html).toContain("not enough in stores");
    expect(html).toContain('data-market-glyph="food_gold"');
    expect(html).not.toContain("sc-market-glyph-aura");
    expect(html).toContain("is-waiting");
  });
});

describe("MarketGlyphPip Living Treatment", () => {
  it("renders ready state with breathing aura, merchant scales, and apex glint", () => {
    const html = renderToStaticMarkup(<MarketGlyphPip offerId="gold_food" ready={true} />);
    expect(html).toContain('class="sc-market-glyph-aura"');
    expect(html).toContain("sc-market-glyph-star");
    expect(html).toContain("sc-market-glyph-scale");
    expect(html).toContain("is-ready");
    expect(html).toContain('data-ready="true"');
    expect(html).toContain('data-market-glyph="gold_food"');
    expect(html).toContain('style="width:16px;height:16px;pointer-events:none"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("renders waiting state with quiet canopy and no aura", () => {
    const html = renderToStaticMarkup(<MarketGlyphPip offerId="food_gold" ready={false} />);
    expect(html).not.toContain("sc-market-glyph-aura");
    expect(html).not.toContain("sc-market-glyph-star");
    expect(html).toContain("is-waiting");
    expect(html).toContain('data-ready="false"');
    expect(html).toContain('data-market-glyph="food_gold"');
  });

  it("renders closed state with shuttered timber frame and padlock", () => {
    const html = renderToStaticMarkup(<MarketGlyphPip isClosed={true} />);
    expect(html).toContain("is-closed");
    expect(html).toContain('data-market-glyph="closed"');
    expect(html).not.toContain("sc-market-glyph-aura");
  });
});

describe("Market glyph styles and CSS isolation", () => {
  it("enforces pointer-events: none !important and provides living keyframes", () => {
    const css = readCssFile("./market-hint.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-market-glyph-float");
    expect(css).toContain("@keyframes sc-market-glyph-breathe");
    expect(css).toContain("@keyframes sc-market-glyph-balance");
    expect(css).toContain("@keyframes sc-market-glyph-twinkle");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("does not leak into theme.css", () => {
    const theme = readCssFile("./theme.css");
    expect(theme).not.toContain("sc-market-glyph");
    expect(theme).not.toContain("sc-market-hint");
  });
});
