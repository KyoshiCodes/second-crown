import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HoldStatusPip } from "./HoldStatusPip";
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

function fields(html: string): string[][] {
  return [...html.matchAll(/sc-hold-status-label">([^<]+)<\/span><(?:code|span) class="sc-hold-status-value[^"]*">([^<]+)</g)].map((m) => [m[1], m[2]]);
}

describe("HoldStatusPip and JoinHoldCard status card (bakeoff/gemini-hold-status-pip)", () => {
  it("renders a 16px SVG living status pip with pointer-events: none on wrapper, svg, and children", () => {
    const liveHtml = renderToStaticMarkup(<HoldStatusPip pending={false} />);
    expect(liveHtml).toContain('width="16"');
    expect(liveHtml).toContain('height="16"');
    expect(liveHtml).toContain('viewBox="0 0 16 16"');
    expect(liveHtml).toContain("data-hold-status-pip");
    expect(liveHtml).toContain('data-pending="false"');
    expect(liveHtml).toContain("is-live");
    expect(liveHtml).toContain('aria-hidden="true"');
    expect(liveHtml).toContain("pointer-events:none");

    const pendingHtml = renderToStaticMarkup(<HoldStatusPip pending={true} />);
    expect(pendingHtml).toContain('data-pending="true"');
    expect(pendingHtml).toContain("is-pending");
  });

  it("keeps styles in hold-status-pip.css with pointer-events: none, breathing keyframes, and reduced-motion guard", () => {
    const css = readCssFile("./hold-status-pip.css");
    expect(css).toContain(".sc-hold-status");
    expect(css).toContain(".sc-hold-status-pip-wrapper");
    expect(css).toContain(".sc-hold-status-pip-wrapper *");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("@keyframes sc-hold-status-pip-breathe");
    expect(css).toContain("animation: sc-hold-status-pip-breathe");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("renders HoldStatusPip inside the hold status card alongside Realm and Tick fields", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    expect(html).toContain('aria-label="Hold status"');
    expect(html).toContain("data-hold-status-pip");
    expect(html).toContain("is-live");
    expect(fields(html)).toEqual([
      ["Realm", "oak-hill"],
      ["Tick", "18"],
    ]);
    expect(html).not.toContain("sc-hold-status-pending");
  });

  it("reflects pending status on the pip and displays Pending field when intents are in flight", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={{ ...SAMPLE_VIEW, pending: 3 }} />);
    expect(html).toContain("is-pending");
    expect(fields(html)).toEqual([
      ["Realm", "oak-hill"],
      ["Tick", "18"],
      ["Pending", "3"],
    ]);
  });

  it("sits above the action cards and store cards", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    const statusAt = html.indexOf('aria-label="Hold status"');
    const actionsAt = html.indexOf('aria-label="Hold actions"');
    const storesAt = html.indexOf('aria-label="Hold stores"');
    expect(statusAt).toBeGreaterThan(-1);
    expect(actionsAt).toBeGreaterThan(statusAt);
    expect(storesAt).toBeGreaterThan(actionsAt);
  });

  it("shows no status card or status pip when no hold is joined", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={null} />);
    expect(html).not.toContain("sc-hold-status");
    expect(html).not.toContain("data-hold-status-pip");
  });
});
