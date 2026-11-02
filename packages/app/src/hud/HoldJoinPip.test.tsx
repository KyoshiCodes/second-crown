import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HoldJoinPip } from "./HoldJoinPip";
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
  stores: { food: "50", wood: "40", stone: "0", gold: "0" },
  militia: 0,
  training: 0,
  farms: 1,
  cottages: 0,
  lumberCamps: 1,
  stamps: [],
  pending: 0,
};

describe("HoldJoinPip and JoinHoldCard join card (bakeoff/gemini-hold-join-pip)", () => {
  it("renders a 16px living join SVG pip with pointer-events: none on wrapper, svg, and all children", () => {
    const html = renderToStaticMarkup(<HoldJoinPip />);
    expect(html).toContain('width="16"');
    expect(html).toContain('height="16"');
    expect(html).toContain('viewBox="0 0 16 16"');
    expect(html).toContain("data-hold-join-pip");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events:none");
    expect(html).toContain("sc-hold-join-pip-glyph");
  });

  it("keeps styles in hold-join-pip.css with pointer-events: none, breathing keyframes, and reduced-motion guard", () => {
    const css = readCssFile("./hold-join-pip.css");
    expect(css).toContain(".sc-hold-join-card");
    expect(css).toContain(".sc-hold-join-pip-wrapper");
    expect(css).toContain(".sc-hold-join-pip-wrapper *");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("@keyframes sc-hold-join-pip-breathe");
    expect(css).toContain("animation: sc-hold-join-pip-breathe");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("renders HoldJoinPip inside the hold join card when unjoined", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={null} />);
    const card = html.match(/<div class="sc-hold-join-card"[^>]*>([\s\S]*?)<\/div>/);
    expect(card).not.toBeNull();
    const inner = card![1];
    expect(card![0]).toContain('aria-label="Join hold"');
    expect(inner).toContain("data-hold-join-pip");
    expect(inner).toContain('placeholder="realm id"');
    expect(inner).toContain('placeholder="hold key (blank = new)"');
    expect(inner).toContain(">Realm id<");
    expect(inner).toContain(">Hold key<");
    expect(inner).toMatch(/<button[^>]*>Join<\/button>/);
  });

  it("hides the join card and HoldJoinPip once a hold is joined", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    expect(html).not.toContain("sc-hold-join-card");
    expect(html).not.toContain("data-hold-join-pip");
  });
});
