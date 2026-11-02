import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
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

describe("JoinHoldCard hold work cards (wave/hud-hold-works)", () => {
  it("shows one card per work with name and count, in order, with training status on militia", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    expect(html.match(/class="sc-hold-work-card"/g)?.length).toBe(4);
    expect(cardsOf(html)).toEqual([
      ["Militia", "2", "+1 training"],
      ["Farms", "3", null],
      ["Cottages", "0", null],
      ["Lumber camps", "1", null],
    ]);
  });

  it("hides the training status when nothing is training", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={{ ...SAMPLE_VIEW, training: 0 }} />);
    expect(html).not.toContain("sc-hold-work-status");
    expect(cardsOf(html)[0]).toEqual(["Militia", "2", null]);
  });

  it("no longer renders the plain works line", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    expect(html).not.toContain("Militia 2 (+1 training)");
  });

  it("holdWorks maps the view in display order", () => {
    expect(holdWorks(SAMPLE_VIEW).map((w) => w.id)).toEqual(["militia", "farms", "cottages", "lumberCamps"]);
  });

  it("shows no work cards when no hold is joined", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={null} />);
    expect(html).not.toContain("sc-hold-work-card");
    expect(html).not.toContain('aria-label="Hold works"');
  });

  it("keeps styles in hold-works.css", () => {
    const css = readCssFile("./hold-works.css");
    expect(css).toContain(".sc-hold-work-card");
    expect(css).toContain("Do not touch theme.css");
  });
});
