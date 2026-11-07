import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, MARKET_OFFERS, canTrade } from "@second-crown/sim";
import { StallStatus, stallStatusRows, shortCount } from "./StallStatus";
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

const foodGold = { give: { food: "20" }, get: { gold: "5" } };

describe("stallStatusRows", () => {
  it("stacks give, get, stock in that order", () => {
    const rows = stallStatusRows({ ...foodGold, resources: { food: "143", gold: "42" }, hasMarket: true });
    expect(rows.map((r) => r.kind)).toEqual(["give", "get", "stock"]);
    expect(rows[0]).toMatchObject({ note: "have 143", tone: "calm", fill: 1 });
    expect(rows[0].amounts[0]).toMatchObject({ res: "food", amt: "20", have: 143, short: false });
    expect(rows[1]).toMatchObject({ note: "have 42", tone: "calm" });
    expect(rows[2]).toMatchObject({ note: "x7 in hand", tone: "calm", live: true });
  });

  it("short stores mark give as danger with a partial bar and zero stock", () => {
    const rows = stallStatusRows({ ...foodGold, resources: { food: "5", gold: "0" }, hasMarket: true });
    expect(rows[0]).toMatchObject({ tone: "danger", fill: 0.25 });
    expect(rows[0].amounts[0].short).toBe(true);
    expect(rows[2]).toMatchObject({ note: "Short of stores", tone: "danger" });
    expect(rows[2].live).toBeUndefined();
  });

  it("exactly one trade in hand warns", () => {
    const rows = stallStatusRows({ ...foodGold, resources: { food: "39" }, hasMarket: true });
    expect(rows[2]).toMatchObject({ note: "x1 in hand", tone: "warn" });
  });

  it("no market fogs every row", () => {
    const rows = stallStatusRows({ ...foodGold, resources: { food: "500" }, hasMarket: false });
    expect(rows.map((r) => r.tone)).toEqual(["fog", "fog", "fog"]);
    expect(rows[2].note).toBe("Build a Market");
  });

  it("no state yet fogs and shows no stores", () => {
    const rows = stallStatusRows({ ...foodGold, resources: undefined, hasMarket: false });
    expect(rows[0].note).toBe("");
    expect(rows[0].fill).toBeUndefined();
    expect(rows[2].note).toBe("—");
  });

  it("caps huge stock and survives non-finite stores", () => {
    expect(stallStatusRows({ ...foodGold, resources: { food: "1e9" }, hasMarket: true })[2].note).toBe("x999+ in hand");
    expect(stallStatusRows({ ...foodGold, resources: { food: "1e400" }, hasMarket: true })[2].note).toBe("x999+ in hand");
  });

  it("stock agrees with canTrade for every offer", () => {
    for (const food of ["0", "19", "30", "200"]) {
      const s = withMarket({ food, wood: food, stone: food, gold: food });
      for (const o of MARKET_OFFERS) {
        const rows = stallStatusRows({ give: o.give, get: o.get, resources: s.resources, hasMarket: true });
        const open = rows[2].note.endsWith("in hand");
        expect(open).toBe(canTrade(s, o.id));
      }
    }
  });
});

describe("shortCount", () => {
  it("compacts store counts", () => {
    expect(shortCount(950)).toBe("950");
    expect(shortCount(12_400)).toBe("12K");
    expect(shortCount(3_100)).toBe("3.1K");
    expect(shortCount(3_100_000)).toBe("3.1M");
    expect(shortCount(Infinity)).toBe("999M+");
  });
});

describe("StallStatus and OfferCard", () => {
  it("renders spans with tone classes and resource pips", () => {
    const html = renderToStaticMarkup(
      <StallStatus rows={stallStatusRows({ ...foodGold, resources: { food: "5" }, hasMarket: true })} />,
    );
    expect(html).toContain("sc-stall-status");
    expect(html).toContain("tone-danger");
    expect(html).toContain("+5 gold");
    expect(html).toContain("sc-stall-res-pip");
    expect(html).not.toMatch(/<(div|dl|dt|dd)\b/);
  });

  it("OfferCard keeps the Trade button and its enabled state", () => {
    const o = MARKET_OFFERS[0];
    const rich = renderToStaticMarkup(<OfferCard state={withMarket({ food: "100" })} offer={o} act={() => {}} />);
    expect(rich).toContain("sc-stall-status");
    expect(rich).toContain("is-give");
    expect(rich).toContain("is-get");
    expect(rich).toContain("is-stock");
    expect(rich).toMatch(/<button[^>]*class="sc-offer-btn"[^>]*>Trade<\/button>/);
    expect(rich).not.toMatch(/<button[^>]*disabled/);
    const poor = renderToStaticMarkup(<OfferCard state={withMarket({})} offer={o} act={() => {}} />);
    expect(poor).toMatch(/<button[^>]*disabled/);
    expect(poor).toContain("is-off");
  });
});

describe("stall-status.css", () => {
  it("lives outside theme.css and respects reduced motion", () => {
    const css = readCssFile("./stall-status.css");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain(".sc-stall-status");
    expect(readCssFile("../theme.css")).not.toContain("sc-stall");
  });
});
