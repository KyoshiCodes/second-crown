import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LeaveMarkPip } from "./LeaveMarkPip";
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
  tick: 15,
  stores: { food: "50", wood: "40", stone: "0", gold: "0" },
  militia: 0,
  training: 0,
  farms: 1,
  cottages: 0,
  lumberCamps: 1,
  stamps: [],
  pending: 0,
};

describe("LeaveMarkPip and JoinHoldCard Leave button placement (bakeoff/gemini-leave-mark)", () => {
  it("renders a 16px door/exit SVG pip with pointer-events: none", () => {
    const html = renderToStaticMarkup(<LeaveMarkPip />);
    expect(html).toContain('width="16"');
    expect(html).toContain('height="16"');
    expect(html).toContain('viewBox="0 0 16 16"');
    expect(html).toContain('data-leave-mark="true"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events:none");
  });

  it("keeps pip styles isolated in leave-mark.css with pointer-events: none and reduced-motion guard", () => {
    const css = readCssFile("./leave-mark.css");
    expect(css).toContain(".sc-leave-mark-pip-wrapper");
    expect(css).toContain("pointer-events: none;");
    expect(css).toContain("@keyframes sc-leave-mark-glow");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("does not render LeaveMarkPip when no hold is joined", () => {
    const unjoinedHtml = renderToStaticMarkup(<JoinHoldCard signedIn={true} />);
    expect(unjoinedHtml).not.toContain("data-leave-mark");
    expect(unjoinedHtml).not.toContain(">Leave</button>");
  });

  it("places LeaveMarkPip to the left of the Leave button when a hold is joined", () => {
    const joinedHtml = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} initialView={SAMPLE_VIEW} />,
    );

    expect(joinedHtml).toContain('data-leave-mark="true"');
    expect(joinedHtml).toContain(">Leave</button>");

    const stampBtnIndex = joinedHtml.indexOf(">Stamp</button>");
    const pipIndex = joinedHtml.indexOf("sc-leave-mark-pip-wrapper");
    const leaveBtnIndex = joinedHtml.indexOf(">Leave</button>");
    expect(stampBtnIndex).toBeGreaterThan(-1);
    expect(pipIndex).toBeGreaterThan(stampBtnIndex);
    expect(leaveBtnIndex).toBeGreaterThan(pipIndex);
  });
});
