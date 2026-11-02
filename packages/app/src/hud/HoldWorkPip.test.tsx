import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HoldWorkPip, type HoldWorkKind } from "./HoldWorkPip";
import { JoinHoldCard, holdWorks } from "../JoinHoldCard";
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
  stores: { food: "10", wood: "40", stone: "0", gold: "7.5" },
  militia: 2,
  training: 1,
  farms: 3,
  cottages: 0,
  lumberCamps: 1,
  stamps: [],
  pending: 0,
};

function cardsOf(html: string): [string, string, string | null][] {
  const works = html.slice(html.indexOf('aria-label="Hold works"'));
  return [...works.matchAll(/sc-hold-work-name">([^<]+)<\/span><span class="sc-hold-work-count">([^<]+)<\/span>(?:<span class="sc-hold-work-status">([^<]+)<\/span>)?/g)]
    .map((m) => [m[1], m[2], m[3] ?? null]);
}

describe("HoldWorkPip and JoinHoldCard work cards (bakeoff/gemini-hold-work-pips)", () => {
  const WORK_KINDS: HoldWorkKind[] = ["militia", "farms", "cottages", "lumberCamps"];

  it.each(WORK_KINDS)(
    "renders a 16px SVG living work pip for %s with pointer-events: none on wrapper, svg, and all children",
    (kind) => {
      const html = renderToStaticMarkup(<HoldWorkPip work={kind} />);
      expect(html).toContain('width="16"');
      expect(html).toContain('height="16"');
      expect(html).toContain('viewBox="0 0 16 16"');
      expect(html).toContain(`data-hold-work-pip="${kind}"`);
      expect(html).toContain(`data-work="${kind}"`);
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain("pointer-events:none");
      expect(html).toContain("sc-hold-work-pip-glyph");
    },
  );

  it("keeps styles in hold-work-pip.css with pointer-events: none, breathing keyframes, staggered delays, and reduced-motion guard", () => {
    const css = readCssFile("./hold-work-pip.css");
    expect(css).toContain(".sc-hold-works");
    expect(css).toContain(".sc-hold-work-card");
    expect(css).toContain(".sc-hold-work-pip-wrapper");
    expect(css).toContain(".sc-hold-work-pip-wrapper *");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("@keyframes sc-hold-work-pip-breathe");
    expect(css).toContain("animation: sc-hold-work-pip-breathe");
    expect(css).toContain('data-work="militia"');
    expect(css).toContain('data-work="farms"');
    expect(css).toContain('data-work="cottages"');
    expect(css).toContain('data-work="lumberCamps"');
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("renders a 16px living work pip inside each of the four hold work cards in order", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    expect(html.match(/class="sc-hold-work-card"/g)?.length).toBe(4);
    expect(cardsOf(html)).toEqual([
      ["Militia", "2", "+1 training"],
      ["Farms", "3", null],
      ["Cottages", "0", null],
      ["Lumber camps", "1", null],
    ]);

    for (const kind of WORK_KINDS) {
      expect(html).toContain(`data-hold-work-pip="${kind}"`);
    }

    const pipMatches = [...html.matchAll(/data-hold-work-pip/g)];
    expect(pipMatches).toHaveLength(4);
  });

  it("holdWorks maps the view in display order", () => {
    expect(holdWorks(SAMPLE_VIEW).map((w) => w.id)).toEqual(["militia", "farms", "cottages", "lumberCamps"]);
  });

  it("shows no work cards or pips when no hold is joined", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={null} />);
    expect(html).not.toContain("sc-hold-work-card");
    expect(html).not.toContain("data-hold-work-pip");
  });
});
