import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { KeySealPip } from "./KeySealPip";
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
  tick: 12,
  stores: { food: "50", wood: "40", stone: "0", gold: "0" },
  militia: 0,
  training: 0,
  farms: 1,
  cottages: 0,
  lumberCamps: 1,
  stamps: [],
  pending: 0,
};

describe("KeySealPip and JoinHoldCard key placement (bakeoff/gemini-key-seal)", () => {
  it("renders a 16px wax-seal SVG pip with pointer-events: none and optional one-shot pulse", () => {
    const idleHtml = renderToStaticMarkup(<KeySealPip />);
    expect(idleHtml).toContain('width="16"');
    expect(idleHtml).toContain('height="16"');
    expect(idleHtml).toContain('viewBox="0 0 16 16"');
    expect(idleHtml).toContain('data-key-seal="true"');
    expect(idleHtml).toContain('data-pulsing="false"');
    expect(idleHtml).toContain('aria-hidden="true"');
    expect(idleHtml).toContain("pointer-events:none");
    expect(idleHtml).not.toContain("is-pulsing");

    const pulseHtml = renderToStaticMarkup(<KeySealPip pulse pulseKey="k9x2m4p8q1w3r7t5" />);
    expect(pulseHtml).toContain('width="16"');
    expect(pulseHtml).toContain('height="16"');
    expect(pulseHtml).toContain('data-pulsing="true"');
    expect(pulseHtml).toContain("is-pulsing");
    expect(pulseHtml).toContain("pointer-events:none");
  });

  it("keeps seal styles isolated in key-seal.css with pointer-events: none, 1-shot pulse, and reduced-motion guard", () => {
    const css = readCssFile("./key-seal.css");
    expect(css).toContain(".sc-key-seal-pip-wrapper");
    expect(css).toContain("pointer-events: none;");
    expect(css).toContain("@keyframes sc-key-seal-pulse");
    expect(css).toMatch(/animation:\s*sc-key-seal-pulse\s+[^;]+\s+1;/);
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("does not render KeySealPip when the hold key is not visible", () => {
    // Not joined yet
    const unjoinedHtml = renderToStaticMarkup(<JoinHoldCard signedIn={true} />);
    expect(unjoinedHtml).not.toContain("data-key-seal");
    expect(unjoinedHtml).not.toContain('aria-label="New hold key"');

    // Joined an existing hold with a typed key (madeKey === null)
    const joinedNoKeyHtml = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} initialView={SAMPLE_VIEW} initialMadeKey={null} />,
    );
    expect(joinedNoKeyHtml).not.toContain("data-key-seal");
    expect(joinedNoKeyHtml).not.toContain('aria-label="New hold key"');
  });

  it("places KeySealPip to the left of the hold key and pulses once when the key is visible", () => {
    const madeKey = "k9x2m4p8q1w3r7t5";
    const visibleKeyHtml = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} initialView={SAMPLE_VIEW} initialMadeKey={madeKey} />,
    );

    expect(visibleKeyHtml).toContain('aria-label="New hold key"');
    expect(visibleKeyHtml).toContain('data-key-seal="true"');
    expect(visibleKeyHtml).toContain("is-pulsing");
    expect(visibleKeyHtml).toContain(madeKey);

    const sealIndex = visibleKeyHtml.indexOf("sc-key-seal-pip-wrapper");
    const keyIndex = visibleKeyHtml.indexOf(`>${madeKey}</code>`);
    expect(sealIndex).toBeGreaterThan(-1);
    expect(keyIndex).toBeGreaterThan(sealIndex);
  });
});
