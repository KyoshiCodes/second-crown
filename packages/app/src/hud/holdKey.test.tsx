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

describe("JoinHoldCard key card (wave/hud-hold-key)", () => {
  it("shows the key and Copy key inside a small key card", () => {
    const madeKey = "k9x2m4p8q1w3r7t5";
    const html = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} initialMadeKey={madeKey} />,
    );
    expect(html).toContain('class="sc-hold-key-card"');
    expect(html).not.toContain("New hold. Key:");
    const cardIndex = html.indexOf("sc-hold-key-card");
    const keyIndex = html.indexOf(`<code class="sc-hold-key-value">${madeKey}</code>`);
    const btnIndex = html.indexOf(">Copy key</button>");
    expect(keyIndex).toBeGreaterThan(cardIndex);
    expect(btnIndex).toBeGreaterThan(keyIndex);
  });

  it("has no key card when the hold was joined with a typed key or not joined", () => {
    expect(
      renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={SAMPLE_VIEW} />),
    ).not.toContain("sc-hold-key-card");
    expect(
      renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={null} initialMadeKey="abc" />),
    ).not.toContain("sc-hold-key-card");
  });

  it("keeps styles in hold-key.css", () => {
    const css = readCssFile("./hold-key.css");
    expect(css).toContain(".sc-hold-key-card");
    expect(css).toContain("Do not touch theme.css");
  });
});
