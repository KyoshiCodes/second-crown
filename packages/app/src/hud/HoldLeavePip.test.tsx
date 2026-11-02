import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HoldLeavePip } from "./HoldLeavePip";
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
  tick: 21,
  stores: { food: "50", wood: "40", stone: "0", gold: "0" },
  militia: 0,
  training: 0,
  farms: 1,
  cottages: 0,
  lumberCamps: 1,
  stamps: [],
  pending: 0,
};

describe("HoldLeavePip and JoinHoldCard leave card (bakeoff/gemini-hold-leave-pip)", () => {
  it("renders a 16px living leave SVG pip with pointer-events: none on wrapper, svg, and all children", () => {
    const html = renderToStaticMarkup(<HoldLeavePip />);
    expect(html).toContain('width="16"');
    expect(html).toContain('height="16"');
    expect(html).toContain('viewBox="0 0 16 16"');
    expect(html).toContain("data-hold-leave-pip");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events:none");
    expect(html).toContain("sc-hold-leave-pip-glyph");
  });

  it("keeps styles in hold-leave-pip.css with pointer-events: none, breathing keyframes, and reduced-motion guard", () => {
    const css = readCssFile("./hold-leave-pip.css");
    expect(css).toContain(".sc-hold-leave-card");
    expect(css).toContain(".sc-hold-leave-pip-wrapper");
    expect(css).toContain(".sc-hold-leave-pip-wrapper *");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("@keyframes sc-hold-leave-pip-breathe");
    expect(css).toContain("animation: sc-hold-leave-pip-breathe");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("does not render HoldLeavePip when no hold is joined or when leave confirmation is closed", () => {
    // Unjoined hold
    const unjoinedHtml = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} initialView={null} initialConfirmLeave={true} />,
    );
    expect(unjoinedHtml).not.toContain("data-hold-leave-pip");
    expect(unjoinedHtml).not.toContain("sc-hold-leave-card");

    // Joined hold, leave confirmation closed
    const closedHtml = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} initialConfirmLeave={false} />,
    );
    expect(closedHtml).not.toContain("data-hold-leave-pip");
    expect(closedHtml).not.toContain("sc-hold-leave-card");
  });

  it("renders HoldLeavePip inside the hold leave card when open", () => {
    const openHtml = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} initialConfirmLeave={true} />,
    );

    expect(openHtml).toContain('class="sc-hold-leave-card"');
    expect(openHtml).toContain('aria-label="Confirm leave"');
    expect(openHtml).toContain("data-hold-leave-pip");

    const cardIndex = openHtml.indexOf('class="sc-hold-leave-card"');
    const pipIndex = openHtml.indexOf("sc-hold-leave-pip-wrapper", cardIndex);
    const titleIndex = openHtml.indexOf("sc-hold-leave-title", cardIndex);
    expect(cardIndex).toBeGreaterThan(-1);
    expect(pipIndex).toBeGreaterThan(cardIndex);
    expect(titleIndex).toBeGreaterThan(cardIndex);
  });
});
