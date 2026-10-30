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

describe("JoinHoldCard leave confirmation (wave/hud-hold-leave)", () => {
  it("hides the confirmation until Leave is pressed", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />);
    expect(html).not.toContain("Leave hold");
    expect(html).not.toContain(">Stay<");
    expect(html).toContain(">Leave<");
  });

  it("shows Leave hold? with the realm id and Leave / Stay buttons when open", () => {
    const html = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} initialConfirmLeave={true} />,
    );
    expect(html).toContain('aria-label="Confirm leave"');
    expect(html).toContain("Leave hold <code>oak-hill</code>?");
    expect(html).toContain(">Stay<");
    expect(html.match(/>Leave</g)?.length).toBe(2);
  });

  it("never shows the confirmation when no hold is joined", () => {
    const html = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={[]} initialView={null} initialConfirmLeave={true} />,
    );
    expect(html).not.toContain("Confirm leave");
  });

  it("keeps styles in leave-confirm.css", () => {
    const css = readCssFile("./leave-confirm.css");
    expect(css).toContain(".sc-leave-confirm");
    expect(css).toContain("Do not touch theme.css");
  });
});
