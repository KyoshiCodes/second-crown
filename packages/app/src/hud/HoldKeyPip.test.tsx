import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HoldKeyPip } from "./HoldKeyPip";
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

describe("HoldKeyPip and JoinHoldCard key card (bakeoff/gemini-hold-key-pip)", () => {
  it("renders a 16px living key SVG pip with pointer-events: none on wrapper, svg, and all children", () => {
    const html = renderToStaticMarkup(<HoldKeyPip />);
    expect(html).toContain('width="16"');
    expect(html).toContain('height="16"');
    expect(html).toContain('viewBox="0 0 16 16"');
    expect(html).toContain("data-hold-key-pip");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events:none");
    expect(html).toContain("sc-hold-key-pip-glyph");
  });

  it("keeps styles in hold-key-pip.css with pointer-events: none, breathing keyframes, and reduced-motion guard", () => {
    const css = readCssFile("./hold-key-pip.css");
    expect(css).toContain(".sc-hold-key-card");
    expect(css).toContain(".sc-hold-key-pip-wrapper");
    expect(css).toContain(".sc-hold-key-pip-wrapper *");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("@keyframes sc-hold-key-pip-breathe");
    expect(css).toContain("animation: sc-hold-key-pip-breathe");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("does not render HoldKeyPip or key card when unjoined or when joined without a new key", () => {
    // Unjoined
    expect(renderToStaticMarkup(<JoinHoldCard signedIn={true} initialView={null} />)).not.toContain("data-hold-key-pip");

    // Joined existing hold (madeKey is null)
    expect(
      renderToStaticMarkup(<JoinHoldCard signedIn={true} initialView={SAMPLE_VIEW} initialMadeKey={null} />),
    ).not.toContain("data-hold-key-pip");
  });

  it("renders HoldKeyPip inside the hold key card when a new hold key is shown", () => {
    const madeKey = "k9x2m4p8q1w3r7t5";
    const html = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} initialView={SAMPLE_VIEW} initialMadeKey={madeKey} />,
    );

    expect(html).toContain('class="sc-hold-key-card"');
    expect(html).toContain('aria-label="New hold key"');
    expect(html).toContain("data-hold-key-pip");
    expect(html).toContain(madeKey);

    const cardIndex = html.indexOf('class="sc-hold-key-card"');
    const pipIndex = html.indexOf("sc-hold-key-pip-wrapper", cardIndex);
    const keyIndex = html.indexOf(`<code class="sc-hold-key-value">${madeKey}</code>`);
    const btnIndex = html.indexOf(">Copy key</button>");

    expect(cardIndex).toBeGreaterThan(-1);
    expect(pipIndex).toBeGreaterThan(cardIndex);
    expect(keyIndex).toBeGreaterThan(cardIndex);
    expect(btnIndex).toBeGreaterThan(keyIndex);
  });
});
