import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HoldStorePip, type HoldStoreResource } from "./HoldStorePip";
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

const RESOURCES: HoldStoreResource[] = ["food", "wood", "stone", "gold"];

describe("HoldStorePip and JoinHoldCard store cards (bakeoff/gemini-hold-pips)", () => {
  it("renders 16px SVG living resource pips for food, wood, stone, and gold with pointer-events: none", () => {
    for (const res of RESOURCES) {
      const html = renderToStaticMarkup(<HoldStorePip resource={res} />);
      expect(html).toContain('width="16"');
      expect(html).toContain('height="16"');
      expect(html).toContain('viewBox="0 0 16 16"');
      expect(html).toContain(`data-hold-store-pip="${res}"`);
      expect(html).toContain(`data-resource="${res}"`);
      expect(html).toContain(`sc-hold-store-pip-${res}`);
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain("pointer-events:none");
    }
  });

  it("keeps styles in hold-store-pip.css with pointer-events: none, breathing keyframes, staggered delays, and reduced-motion guard", () => {
    const css = readCssFile("./hold-store-pip.css");
    expect(css).toContain(".sc-hold-stores");
    expect(css).toContain(".sc-hold-store-card");
    expect(css).toContain(".sc-hold-store-pip-wrapper");
    expect(css).toContain(".sc-hold-store-pip-wrapper *");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("@keyframes sc-hold-pip-breathe");
    expect(css).toContain("animation: sc-hold-pip-breathe");
    expect(css).toContain(".sc-hold-store-pip-food");
    expect(css).toContain(".sc-hold-store-pip-wood");
    expect(css).toContain(".sc-hold-store-pip-stone");
    expect(css).toContain(".sc-hold-store-pip-gold");
    expect(css).toContain("animation-delay:");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("shows four store cards with living pips, names, and whole amounts in display order", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    expect(html.match(/class="sc-hold-store-card"/g)?.length).toBe(4);
    for (const res of RESOURCES) {
      expect(html).toContain(`data-hold-store-pip="${res}"`);
    }

    // Verify regex contract with name immediately preceding amount
    const cards = [...html.matchAll(/sc-hold-store-name">([^<]+)<\/span><span class="sc-hold-store-amount">([^<]+)/g)].map((m) => [m[1], m[2]]);
    expect(cards).toEqual([
      ["Food", (1234).toLocaleString()],
      ["Wood", "40"],
      ["Stone", "0"],
      ["Gold", "7"],
    ]);
  });

  it("keeps the militia / farms / cottages / lumber camps line under the store cards", () => {
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

  it("shows no store cards or pips when no hold is joined", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={null} />);
    expect(html).not.toContain("sc-hold-store-card");
    expect(html).not.toContain("data-hold-store-pip");
  });
});
