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

function fields(html: string): string[][] {
  return [...html.matchAll(/sc-hold-status-label">([^<]+)<\/span><(?:code|span) class="sc-hold-status-value[^"]*">([^<]+)</g)].map((m) => [m[1], m[2]]);
}

describe("JoinHoldCard hold status card (wave/hud-hold-status)", () => {
  it("shows realm id (without join-) and tick, no pending field when nothing is pending", () => {
    const html = render(SAMPLE_VIEW);
    expect(html).toContain('aria-label="Hold status"');
    expect(fields(html)).toEqual([
      ["Realm", "oak-hill"],
      ["Tick", "18"],
    ]);
    expect(html).not.toContain("sc-hold-status-pending");
    expect(html).not.toContain("· tick");
  });

  it("shows the pending count when intents are pending", () => {
    const html = render({ ...SAMPLE_VIEW, pending: 3 });
    expect(fields(html)).toEqual([
      ["Realm", "oak-hill"],
      ["Tick", "18"],
      ["Pending", "3"],
    ]);
  });

  it("sits above the action cards and the store cards", () => {
    const html = render(SAMPLE_VIEW);
    const statusAt = html.indexOf('aria-label="Hold status"');
    expect(statusAt).toBeGreaterThan(-1);
    expect(html.indexOf('aria-label="Hold actions"')).toBeGreaterThan(statusAt);
    expect(html.indexOf('aria-label="Hold stores"')).toBeGreaterThan(statusAt);
  });

  it("shows no status card when no hold is joined", () => {
    expect(render(null)).not.toContain("sc-hold-status");
  });

  it("keeps styles in hold-status.css", () => {
    const css = readCssFile("./hold-status.css");
    expect(css).toContain(".sc-hold-status");
    expect(css).toContain("Do not touch theme.css");
  });
});
