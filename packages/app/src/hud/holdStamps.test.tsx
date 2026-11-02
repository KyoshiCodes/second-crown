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
  stores: { food: "10", wood: "0", stone: "0", gold: "0" },
  militia: 0,
  training: 0,
  farms: 0,
  cottages: 0,
  lumberCamps: 0,
  stamps: [],
  pending: 0,
};

function render(view: HoldView | null): string {
  return renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={view} />);
}

function cards(html: string): string[][] {
  return [...html.matchAll(/sc-hold-stamp-tick">Tick (?:<!-- -->)?(\d+)<\/span><span class="sc-hold-stamp-by">([^<]+)</g)].map((m) => [m[1], m[2]]);
}

describe("JoinHoldCard stamp cards (wave/hud-hold-stamps)", () => {
  it("shows the Stamps heading and an empty line when there are no stamps", () => {
    const html = render(SAMPLE_VIEW);
    expect(html).toContain('aria-label="Hold stamps"');
    expect(html).toContain('sc-hold-stamps-heading">Stamps<');
    expect(html).toContain("No stamps yet.");
    expect(html).not.toContain("sc-hold-stamp-card");
  });

  it("shows one card per stamp with tick and who, newest first, capped at 5", () => {
    const stamps = [1, 2, 3, 4, 5, 6].map((t) => ({ tick: t, by: `p${t}` }));
    const html = render({ ...SAMPLE_VIEW, stamps });
    expect(cards(html)).toEqual([
      ["6", "p6"],
      ["5", "p5"],
      ["4", "p4"],
      ["3", "p3"],
      ["2", "p2"],
    ]);
    expect(html).not.toContain("stamped by");
    expect(html).not.toContain("No stamps yet.");
  });

  it("shows no stamp cards when no hold is joined", () => {
    expect(render(null)).not.toContain("sc-hold-stamps");
  });

  it("keeps styles in hold-stamps.css", () => {
    const css = readCssFile("./hold-stamps.css");
    expect(css).toContain(".sc-hold-stamp-card");
    expect(css).toContain("Do not touch theme.css");
  });
});
