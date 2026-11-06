import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, MARKET_OFFERS } from "@second-crown/sim";
import { MarketPace, MarketPaceGlyphPip, marketRate, nextMarketChange } from "./MarketPace";

type B = ReturnType<typeof createGameState>["buildings"][number];

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

function bare() {
  const s = createGameState({ seed: 1 });
  s.buildings = [];
  for (const k of Object.keys(s.resources)) s.resources[k] = "0";
  return s;
}

function site(id: string, typeId: string, completesAtTick: number | null, realmId = "player"): B {
  return { id, typeId, realmId, x: 0, y: 0, level: 1, completesAtTick } as B;
}

describe("MarketPace", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<MarketPace state={undefined} />)).toBe("");
  });

  it("shows a closed market and no change when nothing is queued", () => {
    const s = bare();
    expect(nextMarketChange(s)).toBeNull();
    const html = renderToStaticMarkup(<MarketPace state={s} />);
    expect(html).toContain("market closed");
    expect(html).toContain("no change queued");
    expect(html).toContain('data-market="closed"');
    expect(html).toContain("sc-market-pace-glyph");
  });

  it("names the first Market as opening trading and ignores rival works", () => {
    const s = bare();
    const t = s.meta.tick;
    s.buildings = [site("a", "market", t + 300), site("b", "market", t + 80), site("r", "market", t + 5, "rival")];
    expect(nextMarketChange(s)).toEqual({ ticks: 80, source: "first" });
    const html = renderToStaticMarkup(<MarketPace state={s} />);
    expect(html).toContain("next change in <strong>8s</strong>: the first Market finishes (opens trading)");
    expect(html).toContain('data-market="first"');
    expect(html).toContain('class="sc-market-pace-aura"');
    expect(html).toContain("is-source-first");
  });

  it("counts open trades from canTrade once a Market stands", () => {
    const s = bare();
    const t = s.meta.tick;
    s.buildings = [site("m", "market", null), site("n", "market", t + 40)];
    s.resources.food = "20";
    const rate = marketRate(s);
    expect(rate).toEqual({ markets: 1, open: 1, total: MARKET_OFFERS.length });
    const html = renderToStaticMarkup(<MarketPace state={s} />);
    expect(html).toContain(`1 of ${MARKET_OFFERS.length} trades open`);
    expect(html).toContain("another Market finishes");
    expect(html).toContain("is-source-another");
  });

  it("reads steady with a Market and nothing queued", () => {
    const s = bare();
    s.buildings = [site("m", "market", null)];
    const html = renderToStaticMarkup(<MarketPace state={s} />);
    expect(html).toContain(`0 of ${MARKET_OFFERS.length} trades open`);
    expect(html).toContain('data-market="steady"');
    expect(html).toContain("is-steady");
  });
});

describe("MarketPaceGlyphPip Living Treatment", () => {
  it("renders closed state glyph with shuttered stall, padlock, and no aura", () => {
    const html = renderToStaticMarkup(<MarketPaceGlyphPip closed={true} rising={false} />);
    expect(html).toContain("sc-market-pace-glyph-wrap");
    expect(html).toContain("is-closed");
    expect(html).toContain('data-market="closed"');
    expect(html).toContain('data-closed="true"');
    expect(html).toContain('style="width:16px;height:16px;pointer-events:none"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("sc-market-pace-aura");
    expect(html).not.toContain("sc-market-pace-star");
  });

  it("renders steady open state with merchant scale and trade pans", () => {
    const html = renderToStaticMarkup(<MarketPaceGlyphPip closed={false} rising={false} openTrades={3} totalTrades={6} />);
    expect(html).toContain("is-steady");
    expect(html).toContain('data-market="steady"');
    expect(html).toContain('data-open="3"');
    expect(html).toContain('data-total="6"');
    expect(html).not.toContain("sc-market-pace-aura");
  });

  it("renders rising market glyph with amber aura, striped awning, and apex star", () => {
    const html = renderToStaticMarkup(
      <MarketPaceGlyphPip rising={true} source="first" />
    );
    expect(html).toContain("is-rising");
    expect(html).toContain("is-source-first");
    expect(html).toContain('data-market="first"');
    expect(html).toContain('data-source="first"');
    expect(html).toContain('class="sc-market-pace-aura"');
    expect(html).toContain("sc-market-pace-star");
  });

  it("renders multi-market expansion scale when source is another", () => {
    const html = renderToStaticMarkup(
      <MarketPaceGlyphPip rising={true} source="another" />
    );
    expect(html).toContain("is-source-another");
    expect(html).toContain('data-source="another"');
  });
});

describe("Market pace styles and CSS isolation", () => {
  it("enforces pointer-events: none !important and provides living keyframes", () => {
    const css = readCssFile("./market-pace.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-market-pace-float");
    expect(css).toContain("@keyframes sc-market-pace-breathe");
    expect(css).toContain("@keyframes sc-market-pace-twinkle");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("does not leak into theme.css", () => {
    const theme = readCssFile("./theme.css");
    expect(theme).not.toContain("sc-market-pace");
  });
});
