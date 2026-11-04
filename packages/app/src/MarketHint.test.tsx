import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, MARKET_OFFERS } from "@second-crown/sim";
import { MarketHint, nextTrade, tradeCostText } from "./MarketHint";

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
  });

  it("falls back to the first offer when nothing is affordable", () => {
    const s = withMarket();
    expect(nextTrade(s)).toEqual({ offer: MARKET_OFFERS[0], ready: false });
    const html = renderToStaticMarkup(<MarketHint state={s} />);
    expect(html).toContain("costs 20 food");
    expect(html).toContain("not enough in stores");
  });

  it("keeps its styles out of theme.css", () => {
    expect(readCssFile("./market-hint.css")).toContain(".sc-market-hint");
    expect(readCssFile("./theme.css")).not.toContain("sc-market-hint");
  });
});
