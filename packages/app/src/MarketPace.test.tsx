import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, MARKET_OFFERS } from "@second-crown/sim";
import { MarketPace, marketRate, nextMarketChange } from "./MarketPace";

type B = ReturnType<typeof createGameState>["buildings"][number];

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
  });

  it("names the first Market as opening trading and ignores rival works", () => {
    const s = bare();
    const t = s.meta.tick;
    s.buildings = [site("a", "market", t + 300), site("b", "market", t + 80), site("r", "market", t + 5, "rival")];
    expect(nextMarketChange(s)).toEqual({ ticks: 80, source: "first" });
    const html = renderToStaticMarkup(<MarketPace state={s} />);
    expect(html).toContain("next change in <strong>8s</strong>: the first Market finishes (opens trading)");
    expect(html).toContain('data-market="first"');
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
  });

  it("reads steady with a Market and nothing queued", () => {
    const s = bare();
    s.buildings = [site("m", "market", null)];
    const html = renderToStaticMarkup(<MarketPace state={s} />);
    expect(html).toContain(`0 of ${MARKET_OFFERS.length} trades open`);
    expect(html).toContain('data-market="steady"');
  });
});
