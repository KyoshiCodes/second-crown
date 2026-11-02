import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HoldActionPip, type HoldActionKind } from "./HoldActionPip";
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

const ACTIONS: HoldActionKind[] = ["train", "build", "stamp", "leave"];

/** The markup of one action card, by its aria-label. */
function card(html: string, label: string): string {
  const start = html.indexOf(`class="sc-hold-action-card`, html.indexOf(`aria-label="Hold actions"`));
  const cards = html.slice(start).split(/(?=<div class="sc-hold-action-card)/);
  const found = cards.find((c) => c.includes(`aria-label="${label}"`));
  if (!found) throw new Error(`no ${label} card`);
  return found;
}

describe("HoldActionPip and JoinHoldCard action cards (bakeoff/gemini-hold-action-pips)", () => {
  it("renders 16px SVG living action pips for train, build, stamp, and leave with pointer-events: none", () => {
    for (const act of ACTIONS) {
      const html = renderToStaticMarkup(<HoldActionPip action={act} />);
      expect(html).toContain('width="16"');
      expect(html).toContain('height="16"');
      expect(html).toContain('viewBox="0 0 16 16"');
      expect(html).toContain(`data-hold-action-pip="${act}"`);
      expect(html).toContain(`data-action="${act}"`);
      expect(html).toContain(`sc-hold-action-pip-${act}`);
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain("pointer-events:none");
    }
  });

  it("keeps styles in hold-action-pip.css with pointer-events: none, breathing keyframes, staggered delays, and reduced-motion guard", () => {
    const css = readCssFile("./hold-action-pip.css");
    expect(css).toContain(".sc-hold-actions");
    expect(css).toContain(".sc-hold-action-card");
    expect(css).toContain(".sc-hold-action-pip-wrapper");
    expect(css).toContain(".sc-hold-action-pip-wrapper *");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("@keyframes sc-hold-action-pip-breathe");
    expect(css).toContain("animation: sc-hold-action-pip-breathe");
    expect(css).toContain(".sc-hold-action-pip-train");
    expect(css).toContain(".sc-hold-action-pip-build");
    expect(css).toContain(".sc-hold-action-pip-stamp");
    expect(css).toContain(".sc-hold-action-pip-leave");
    expect(css).toContain("animation-delay:");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("shows four action cards in order, each with its living pip and label", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    expect(html.match(/class="sc-hold-action-card[ "]/g)?.length).toBe(4);
    for (const act of ACTIONS) {
      expect(html).toContain(`data-hold-action-pip="${act}"`);
    }
    const labels = [...html.matchAll(/class="sc-hold-action-label">([^<]+)</g)].map((m) => m[1]);
    expect(labels).toEqual(["Train", "Build", "Stamp", "Leave"]);
  });

  it("puts each existing button in its action card; Build keeps all three buttons", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    const trainCard = card(html, "Train");
    expect(trainCard).toContain('data-hold-action-pip="train"');
    expect(trainCard).toContain(">Train militia</button>");

    const buildCard = card(html, "Build");
    expect(buildCard).toContain('data-hold-action-pip="build"');
    expect(buildCard).toContain(">Build farm</button>");
    expect(buildCard).toContain(">Build lumber camp</button>");
    expect(buildCard).toContain(">Build cottage</button>");

    const stampCard = card(html, "Stamp");
    expect(stampCard).toContain('data-hold-action-pip="stamp"');
    expect(stampCard).toContain(">Stamp</button>");

    const leaveCard = card(html, "Leave");
    expect(leaveCard).toContain('data-hold-action-pip="leave"');
    expect(leaveCard).toContain(">Leave</button>");
  });

  it("keeps the leave confirmation inside the Leave card", () => {
    const html = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} initialConfirmLeave={true} />,
    );
    const leaveCard = card(html, "Leave");
    expect(leaveCard).toContain('aria-label="Confirm leave"');
    expect(leaveCard).toContain(">Stay</button>");
    expect(leaveCard).toContain('data-hold-action-pip="leave"');
  });

  it("shows no action cards or action pips when no hold is joined", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={null} />);
    expect(html).not.toContain("sc-hold-action-card");
    expect(html).not.toContain("data-hold-action-pip");
  });
});
