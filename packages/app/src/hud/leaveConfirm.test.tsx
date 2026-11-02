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

describe("JoinHoldCard leave card (wave/hud-hold-leave)", () => {
  it("hides the confirmation until Leave is pressed", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    expect(html).not.toContain("Leave hold");
    expect(html).not.toContain("sc-hold-leave-card");
    expect(html).not.toContain(">Confirm leave<");
    expect(html).not.toContain(">Cancel<");
    expect(html).toContain(">Leave</button>");
  });

  it("shows a leave card with the warning and Confirm leave / Cancel when open", () => {
    const html = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} initialConfirmLeave={true} />,
    );
    expect(html).toContain('aria-label="Confirm leave"');
    expect(html).toContain("Leave hold <code>oak-hill</code>?");
    expect(html).toContain('class="sc-hold-leave-card"');
    expect(html).toContain("The hold keeps running. To join again you need the realm id and its key.");
    expect(html).toMatch(/<button[^>]*>Confirm leave<\/button>/);
    expect(html).toMatch(/<button[^>]*>Cancel<\/button>/);
    // The Leave button that opens the card stays.
    expect(html.match(/<button[^>]*>Leave<\/button>/g)?.length).toBe(1);
  });

  it("never shows the confirmation when no hold is joined", () => {
    const html = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={[]} initialView={null} initialConfirmLeave={true} />,
    );
    expect(html).not.toContain("Confirm leave");
  });

  it("keeps styles in hold-leave.css", () => {
    const css = readCssFile("./hold-leave.css");
    expect(css).toContain(".sc-hold-leave-card");
    expect(css).toContain("Do not touch theme.css");
  });
});
