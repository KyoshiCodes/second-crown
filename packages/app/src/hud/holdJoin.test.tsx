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
  stores: { food: "50", wood: "40", stone: "0", gold: "0" },
  militia: 0,
  training: 0,
  farms: 1,
  cottages: 0,
  lumberCamps: 1,
  stamps: [],
  pending: 0,
};

describe("JoinHoldCard join card (wave/hud-hold-join)", () => {
  it("shows the realm id field, hold key field, and Join button inside one join card", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={null} />);
    const card = html.match(/<div class="sc-hold-join-card"[^>]*>([\s\S]*?)<\/div>/);
    expect(card).not.toBeNull();
    const inner = card![1];
    expect(card![0]).toContain('aria-label="Join hold"');
    expect(inner).toContain('placeholder="realm id"');
    expect(inner).toContain('placeholder="hold key (blank = new)"');
    expect(inner).toContain(">Realm id<");
    expect(inner).toContain(">Hold key<");
    expect(inner).toMatch(/<button[^>]*>Join<\/button>/);
  });

  it("disables Join when not signed in", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={false} intentLines={[]} initialView={null} />);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Join<\/button>/);
  });

  it("hides the join card once a hold is joined", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    expect(html).not.toContain("sc-hold-join-card");
    expect(html).not.toContain('placeholder="realm id"');
  });

  it("keeps join card styles in hud/hold-join.css", () => {
    const css = readCssFile("./hold-join.css");
    expect(css).toContain(".sc-hold-join-card");
    expect(css).toContain(".sc-hold-join-input");
  });
});
