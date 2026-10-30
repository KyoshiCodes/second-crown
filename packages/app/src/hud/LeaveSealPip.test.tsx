import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LeaveSealPip } from "./LeaveSealPip";
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

describe("LeaveSealPip and JoinHoldCard leave confirmation seal (bakeoff/gemini-leave-seal)", () => {
  it("renders a 16px wax-seal SVG pip with pointer-events: none on the pip and children", () => {
    const html = renderToStaticMarkup(<LeaveSealPip pulse pulseKey={1} />);
    expect(html).toContain('width="16"');
    expect(html).toContain('height="16"');
    expect(html).toContain('viewBox="0 0 16 16"');
    expect(html).toContain('data-leave-seal="true"');
    expect(html).toContain('data-pulsing="true"');
    expect(html).toContain("is-pulsing");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events:none");

    const idleHtml = renderToStaticMarkup(<LeaveSealPip pulse={false} />);
    expect(idleHtml).toContain('data-pulsing="false"');
    expect(idleHtml).not.toContain("is-pulsing");
  });

  it("keeps seal styles in leave-seal.css with pointer-events: none on all children, 1-shot pulse, and reduced-motion guard", () => {
    const css = readCssFile("./leave-seal.css");
    expect(css).toContain(".sc-leave-seal-pip-wrapper");
    expect(css).toContain(".sc-leave-seal-pip-wrapper *");
    expect(css).toContain("pointer-events: none;");
    expect(css).toContain("@keyframes sc-leave-seal-pulse");
    expect(css).toMatch(/animation:\s*sc-leave-seal-pulse\s+[^;]+\s+1;/);
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("does not render LeaveSealPip when no hold is joined or while the leave confirmation is closed", () => {
    // Unjoined hold (even if initialConfirmLeave is passed)
    const unjoinedHtml = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} initialView={null} initialConfirmLeave={true} />,
    );
    expect(unjoinedHtml).not.toContain("data-leave-seal");

    // Joined hold with leave confirmation closed
    const closedHtml = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} initialConfirmLeave={false} />,
    );
    expect(closedHtml).toContain(">Leave</button>");
    expect(closedHtml).not.toContain("data-leave-seal");
    expect(closedHtml).not.toContain('aria-label="Confirm leave"');
  });

  it("renders LeaveSealPip next to the Leave button and pulses once while the leave confirmation is open", () => {
    const openHtml = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} initialConfirmLeave={true} />,
    );

    expect(openHtml).toContain('aria-label="Confirm leave"');
    expect(openHtml).toContain('data-leave-seal="true"');
    expect(openHtml).toContain("is-pulsing");

    const confirmIndex = openHtml.indexOf('aria-label="Confirm leave"');
    const sealIndex = openHtml.indexOf("sc-leave-seal-pip-wrapper", confirmIndex);
    const confirmLeaveBtnIndex = openHtml.indexOf(">Leave</button>", sealIndex);
    expect(confirmIndex).toBeGreaterThan(-1);
    expect(sealIndex).toBeGreaterThan(confirmIndex);
    expect(confirmLeaveBtnIndex).toBeGreaterThan(sealIndex);
  });
});
