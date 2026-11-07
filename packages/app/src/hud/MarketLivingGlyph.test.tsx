import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, MARKET_OFFERS } from "@second-crown/sim";
import {
  MarketLivingGlyph,
  MarketLivingUnderlay,
  getOfferGoodsKind,
  type GoodsKind,
} from "./MarketLivingGlyph";
import { OfferCard } from "./OfferCard";

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

function withMarket(res: Record<string, string>) {
  const s = createGameState({ seed: 1 });
  s.buildings = [{ id: "m", typeId: "market", realmId: "player", x: 0, y: 0, level: 1, completesAtTick: null } as B];
  for (const k of Object.keys(s.resources)) s.resources[k] = "0";
  Object.assign(s.resources, res);
  return s;
}

describe("MarketLivingGlyph and MarketLivingUnderlay", () => {
  it("classifies every market offer by the commodity it pays out", () => {
    expect(getOfferGoodsKind({ give: { food: "20" }, get: { gold: "5" } })).toBe("gold");
    expect(getOfferGoodsKind({ give: { gold: "8" }, get: { food: "25" } })).toBe("food");
    expect(getOfferGoodsKind({ give: { gold: "8" }, get: { wood: "22" } })).toBe("wood");
    expect(getOfferGoodsKind({ give: { wood: "24" }, get: { stone: "16" } })).toBe("stone");
    expect(getOfferGoodsKind({ give: { wood: "10" }, get: { renown: "1" } })).toBe("wood");
    expect(getOfferGoodsKind({ get: { mystery: "1" } })).toBe("gold");

    const seen = new Set(MARKET_OFFERS.map((o) => getOfferGoodsKind(o)));
    expect(seen).toEqual(new Set(["food", "wood", "stone", "gold"]));
  });

  it("renders distinct SVG geometries for food, wood, stone, and gold", () => {
    const kinds: GoodsKind[] = ["food", "wood", "stone", "gold"];
    const underlays = kinds.map((goods) =>
      renderToStaticMarkup(<MarketLivingUnderlay goods={goods} hasMarket={true} open={true} />),
    );
    expect(new Set(underlays).size).toBe(4);

    const badges = kinds.map((goods) =>
      renderToStaticMarkup(<MarketLivingGlyph goods={goods} hasMarket={true} open={true} />),
    );
    expect(new Set(badges).size).toBe(4);
  });

  it("applies goods Lot flairs when open and state flairs for last, short, and closed", () => {
    expect(renderToStaticMarkup(<MarketLivingGlyph goods="food" hasMarket={true} open={true} />)).toContain("Grain lot");
    expect(renderToStaticMarkup(<MarketLivingGlyph goods="wood" hasMarket={true} open={true} />)).toContain("Timber lot");
    expect(renderToStaticMarkup(<MarketLivingGlyph goods="stone" hasMarket={true} open={true} />)).toContain("Ashlar lot");
    expect(renderToStaticMarkup(<MarketLivingGlyph goods="gold" hasMarket={true} open={true} />)).toContain("Bullion lot");

    const lastHtml = renderToStaticMarkup(
      <MarketLivingGlyph goods="gold" hasMarket={true} open={true} lastLot={true} />,
    );
    expect(lastHtml).toContain("is-last");
    expect(lastHtml).toContain("Last lot");
    expect(lastHtml).toContain("sc-market-glyph-glint");

    const shortHtml = renderToStaticMarkup(
      <MarketLivingGlyph goods="gold" hasMarket={true} open={false} />,
    );
    expect(shortHtml).toContain("is-short");
    expect(shortHtml).toContain("Stores short");
    expect(shortHtml).not.toContain("sc-market-glyph-glint");

    const closedHtml = renderToStaticMarkup(
      <MarketLivingGlyph goods="gold" hasMarket={false} open={false} />,
    );
    expect(closedHtml).toContain("is-closed");
    expect(closedHtml).toContain("Stall shuttered");
    expect(closedHtml).not.toContain("sc-market-glyph-glint");
  });

  it("uses phrasing-only markup (span + svg) and marks all decorative layers aria-hidden", () => {
    const u = renderToStaticMarkup(<MarketLivingUnderlay goods="stone" hasMarket={true} open={true} />);
    const g = renderToStaticMarkup(<MarketLivingGlyph goods="stone" hasMarket={true} open={true} />);
    expect(u).toContain('aria-hidden="true"');
    expect(g).toContain('aria-hidden="true"');
    expect(u).not.toMatch(/<(div|dl|dt|dd|p|section|article)\b/);
    expect(g).not.toMatch(/<(div|dl|dt|dd|p|section|article)\b/);
  });

  it("integrates cleanly into OfferCard across open, last-lot, short, and shuttered states", () => {
    const foodGold = MARKET_OFFERS.find((o) => o.id === "food_gold")!;

    const openHtml = renderToStaticMarkup(
      <OfferCard state={withMarket({ food: "120" })} offer={foodGold} act={() => {}} />,
    );
    expect(openHtml).toContain("sc-market-living-underlay goods-gold is-open");
    expect(openHtml).toContain("sc-market-status-glyph goods-gold is-open");
    expect(openHtml).toContain("Bullion lot");
    expect(openHtml).not.toMatch(/<button[^>]*disabled/);

    const lastHtml = renderToStaticMarkup(
      <OfferCard state={withMarket({ food: "25" })} offer={foodGold} act={() => {}} />,
    );
    expect(lastHtml).toContain("is-last");
    expect(lastHtml).toContain("Last lot");
    expect(lastHtml).not.toMatch(/<button[^>]*disabled/);

    const shortHtml = renderToStaticMarkup(
      <OfferCard state={withMarket({ food: "5" })} offer={foodGold} act={() => {}} />,
    );
    expect(shortHtml).toContain("is-short");
    expect(shortHtml).toContain("Stores short");
    expect(shortHtml).toMatch(/<button[^>]*disabled/);

    const noMarketState = createGameState({ seed: 1 });
    noMarketState.buildings = [];
    const shutteredHtml = renderToStaticMarkup(
      <OfferCard state={noMarketState} offer={foodGold} act={() => {}} />,
    );
    expect(shutteredHtml).toContain("is-closed");
    expect(shutteredHtml).toContain("Stall shuttered");
    expect(shutteredHtml).toMatch(/<button[^>]*disabled/);
  });

  it("enforces pointer-events: none, reduced-motion, and style isolation outside theme.css", () => {
    const css = readCssFile("./market-living.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-market-goods-drift");
    expect(css).toContain("@keyframes sc-market-goods-pulse");
    expect(css).toContain("@keyframes sc-market-underlay-drift");
    expect(css).toContain("@keyframes sc-market-underlay-pulse");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    const themeCss = readCssFile("../theme.css");
    expect(themeCss).not.toContain("sc-market-living");
    expect(themeCss).not.toContain("sc-market-status-glyph");
  });

  it("keeps the watermark corner-confined with capped low opacity so card text never obscures", () => {
    const css = readCssFile("./market-living.css");
    expect(css).toContain("width: 34px;");
    expect(css).toContain("height: 34px;");
    expect(css).toContain("right: -2px;");
    expect(css).toContain("bottom: -2px;");
    expect(css).toContain("mask-image: radial-gradient");

    const wrapperOpacities = [
      ...css.matchAll(/\.sc-market-living-underlay(?:\.[a-z-]+)*\s*\{[^}]*?opacity:\s*([0-9.]+);/g),
    ].map((m) => Number(m[1]));
    expect(wrapperOpacities).toEqual([0.26, 0.3, 0.2, 0.12]);
    for (const op of wrapperOpacities) {
      expect(op).toBeLessThanOrEqual(0.35);
    }

    const underlayKf = css.match(/@keyframes sc-market-underlay-(?:drift|pulse)\s*\{[\s\S]*?\n\}/g) ?? [];
    expect(underlayKf.length).toBe(2);
    for (const block of underlayKf) {
      const kfOps = [...block.matchAll(/opacity:\s*([0-9.]+);/g)].map((m) => Number(m[1]));
      expect(kfOps.length).toBeGreaterThan(0);
      for (const op of kfOps) {
        expect(op).toBeLessThan(0.6);
      }
    }
  });

  it("handles undefined state safely as shuttered stall with disabled Trade button", () => {
    const html = renderToStaticMarkup(
      <OfferCard state={undefined} offer={MARKET_OFFERS[0]} act={() => {}} />,
    );
    expect(html).toContain("sc-market-living-underlay goods-gold is-closed");
    expect(html).toContain("sc-market-status-glyph goods-gold is-closed");
    expect(html).toContain("Stall shuttered");
    expect(html).toMatch(/<button[^>]*disabled/);
  });

  it("renders compact 34x34 underlay and 14x14 status badge across all nine market offers", () => {
    const rich = withMarket({ food: "500", wood: "500", stone: "500", gold: "500" });
    for (const o of MARKET_OFFERS) {
      const goods = getOfferGoodsKind(o);
      const html = renderToStaticMarkup(<OfferCard state={rich} offer={o} act={() => {}} />);
      expect(html).toContain(`goods-${goods}`);
      expect(html).toContain('width="34" height="34"');
      expect(html).toContain('width="14" height="14"');
    }
  });

  it("leaves offer-card.css untouched", () => {
    const offerCss = readCssFile("./offer-card.css");
    expect(offerCss).not.toContain("sc-market-living");
    expect(offerCss).not.toContain("sc-market-status-glyph");
  });
});
