import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HoldStampPip } from "./HoldStampPip";
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

function cards(html: string): string[][] {
  return [...html.matchAll(/sc-hold-stamp-tick">Tick (?:<!-- -->)?(\d+)<\/span><span class="sc-hold-stamp-by">([^<]+)</g)].map((m) => [m[1], m[2]]);
}

describe("HoldStampPip and JoinHoldCard stamp cards (bakeoff/gemini-hold-stamp-pip)", () => {
  it("renders a 16px SVG living stamp pip with pointer-events: none on wrapper, svg, and children", () => {
    const html = renderToStaticMarkup(<HoldStampPip />);
    expect(html).toContain('width="16"');
    expect(html).toContain('height="16"');
    expect(html).toContain('viewBox="0 0 16 16"');
    expect(html).toContain("data-hold-stamp-pip");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events:none");
    expect(html).toContain("sc-hold-stamp-pip-glyph");
  });

  it("keeps styles in hold-stamp-pip.css with pointer-events: none, breathing keyframes, and reduced-motion guard", () => {
    const css = readCssFile("./hold-stamp-pip.css");
    expect(css).toContain(".sc-hold-stamps");
    expect(css).toContain(".sc-hold-stamp-card");
    expect(css).toContain(".sc-hold-stamp-pip-wrapper");
    expect(css).toContain(".sc-hold-stamp-pip-wrapper *");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("@keyframes sc-hold-stamp-pip-breathe");
    expect(css).toContain("animation: sc-hold-stamp-pip-breathe");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("shows the Stamps heading and an empty line without pips when there are no stamps", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    expect(html).toContain('aria-label="Hold stamps"');
    expect(html).toContain('sc-hold-stamps-heading">Stamps<');
    expect(html).toContain("No stamps yet.");
    expect(html).not.toContain("sc-hold-stamp-card");
    expect(html).not.toContain("data-hold-stamp-pip");
  });

  it("renders a 16px living stamp pip inside each hold stamp card, newest first, capped at 5", () => {
    const stamps = [1, 2, 3, 4, 5, 6].map((t) => ({ tick: t, by: `p${t}` }));
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={{ ...SAMPLE_VIEW, stamps }} />);
    expect(cards(html)).toEqual([
      ["6", "p6"],
      ["5", "p5"],
      ["4", "p4"],
      ["3", "p3"],
      ["2", "p2"],
    ]);

    const pipMatches = [...html.matchAll(/data-hold-stamp-pip/g)];
    expect(pipMatches).toHaveLength(5);

    const cardMatches = [...html.matchAll(/<div class="sc-hold-stamp-card">/g)];
    expect(cardMatches).toHaveLength(5);
  });

  it("shows no stamp cards or stamp pips when no hold is joined", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={null} />);
    expect(html).not.toContain("sc-hold-stamps");
    expect(html).not.toContain("data-hold-stamp-pip");
  });
});
