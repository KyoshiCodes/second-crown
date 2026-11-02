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

/** The markup of one action card, by its aria-label. */
function card(html: string, label: string): string {
  const start = html.indexOf(`class="sc-hold-action-card`, html.indexOf(`aria-label="Hold actions"`));
  const cards = html.slice(start).split(/(?=<div class="sc-hold-action-card)/);
  const found = cards.find((c) => c.includes(`aria-label="${label}"`));
  if (!found) throw new Error(`no ${label} card`);
  return found;
}

describe("JoinHoldCard action cards (wave/hud-hold-actions)", () => {
  it("shows Train, Build, Stamp, Leave cards in order, each with a label", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    expect(html.match(/class="sc-hold-action-card[ "]/g)?.length).toBe(4);
    const labels = [...html.matchAll(/class="sc-hold-action-label">([^<]+)</g)].map((m) => m[1]);
    expect(labels).toEqual(["Train", "Build", "Stamp", "Leave"]);
  });

  it("puts each existing button in its card; Build keeps all three", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    expect(card(html, "Train")).toContain(">Train militia</button>");
    const build = card(html, "Build");
    expect(build).toContain(">Build farm</button>");
    expect(build).toContain(">Build lumber camp</button>");
    expect(build).toContain(">Build cottage</button>");
    expect(card(html, "Stamp")).toContain(">Stamp</button>");
    expect(card(html, "Leave")).toContain(">Leave</button>");
  });

  it("keeps the leave confirmation inside the Leave card", () => {
    const html = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} initialConfirmLeave={true} />,
    );
    const leave = card(html, "Leave");
    expect(leave).toContain('aria-label="Confirm leave"');
    expect(leave).toContain(">Cancel</button>");
  });

  it("shows no action cards when no hold is joined", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={null} />);
    expect(html).not.toContain("sc-hold-action-card");
  });

  it("keeps styles in hold-actions.css", () => {
    const css = readCssFile("./hold-actions.css");
    expect(css).toContain(".sc-hold-action-card");
    expect(css).toContain("Do not touch theme.css");
  });
});
