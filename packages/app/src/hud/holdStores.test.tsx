import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JoinHoldCard } from "../JoinHoldCard";
import type { HoldView } from "../net/hold";

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

const SAMPLE_VIEW: HoldView = {
  realmId: "join-oak-hill",
  tick: 18,
  stores: { food: "1234.9", wood: "40", stone: "0", gold: "7.5" },
  militia: 2,
  training: 1,
  farms: 1,
  cottages: 0,
  lumberCamps: 1,
  stamps: [],
  pending: 0,
};

describe("JoinHoldCard hold store cards (wave/hud-hold-stores)", () => {
  it("shows four store cards with name and whole amount, in order", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    expect(html.match(/class="sc-hold-store-card"/g)?.length).toBe(4);
    const cards = [...html.matchAll(/sc-hold-store-name">([^<]+)<\/span><span class="sc-hold-store-amount">([^<]+)</g)].map((m) => [m[1], m[2]]);
    expect(cards).toEqual([
      ["Food", (1234).toLocaleString()],
      ["Wood", "40"],
      ["Stone", "0"],
      ["Gold", "7"],
    ]);
  });

  it("keeps the militia / farms / cottages / lumber camps line under the cards", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    const storesAt = html.indexOf('aria-label="Hold stores"');
    const worksAt = html.indexOf('aria-label="Hold works"');
    expect(storesAt).toBeGreaterThan(-1);
    expect(worksAt).toBeGreaterThan(storesAt);
    const works = html.slice(worksAt);
    expect(works).toContain("Militia 2 (+1 training)");
    expect(works).toContain("Farms 1");
    expect(works).toContain("Cottages 0");
    expect(works).toContain("Lumber camps 1");
  });

  it("shows no store cards when no hold is joined", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={null} />);
    expect(html).not.toContain("sc-hold-store-card");
  });

  it("keeps styles in hold-stores.css", () => {
    const css = readCssFile("./hold-stores.css");
    expect(css).toContain(".sc-hold-store-card");
    expect(css).toContain("Do not touch theme.css");
  });
});
