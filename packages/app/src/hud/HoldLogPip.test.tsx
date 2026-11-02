import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HoldLogPip, resolveLogIntent } from "./HoldLogPip";
import { JoinHoldCard } from "../JoinHoldCard";

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

describe("HoldLogPip and hold log card integration (bakeoff/gemini-hold-log-pips)", () => {
  it("resolves log intent types from intent strings correctly", () => {
    expect(resolveLogIntent("train militia")).toBe("train");
    expect(resolveLogIntent("militia")).toBe("train");
    expect(resolveLogIntent("build farm")).toBe("farm");
    expect(resolveLogIntent("build cottage")).toBe("cottage");
    expect(resolveLogIntent("build lumber camp")).toBe("lumber");
    expect(resolveLogIntent("stamp")).toBe("stamp");
    expect(resolveLogIntent("arbitrary action")).toBe("default");
    expect(resolveLogIntent(undefined)).toBe("default");
  });

  it("renders a 16px SVG pip with strict pointer-events: none on wrapper, SVG, and children", () => {
    const intents = ["train", "farm", "cottage", "lumber", "stamp", "default"] as const;

    for (const intent of intents) {
      const html = renderToStaticMarkup(<HoldLogPip intent={intent} />);

      expect(html).toContain('class="sc-hold-log-pip-wrapper');
      expect(html).toContain(`sc-hold-log-pip-${intent}`);
      expect(html).toContain('data-hold-log-pip="');
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('width="16"');
      expect(html).toContain('height="16"');
      expect(html).toContain('viewBox="0 0 16 16"');

      // pointer-events: none on wrapper
      expect(html).toMatch(/style="[^"]*pointer-events:\s*none/);

      // Verify no children enable pointer events
      expect(html).not.toMatch(/pointer-events:\s*auto/);
    }
  });

  it("keeps styles in hud/hold-log-pip.css with breathing keyframes, pointer-events: none, and reduced-motion guard", () => {
    const css = readCssFile("./hold-log-pip.css");

    // Pointer-events enforcement
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain(".sc-hold-log-pip-wrapper *");

    // Living breathing animation
    expect(css).toContain("@keyframes sc-hold-log-pip-breathe");
    expect(css).toContain("animation: sc-hold-log-pip-breathe");

    // Reduced motion media query guard
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important");

    // theme.css isolation
    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-hold-log-pip");
  });

  it("renders living HoldLogPip inside each hold log card in JoinHoldCard", () => {
    const html = renderToStaticMarkup(
      <JoinHoldCard
        signedIn={true}
        intentLines={["Tick 9: train militia", "Tick 7: build farm", "Tick 5: stamp"]}
      />,
    );

    // Three hold log cards with their respective pips
    const pips = [...html.matchAll(/data-hold-log-pip="([^"]+)"/g)].map((m) => m[1]);
    expect(pips).toEqual(["train", "farm", "stamp"]);

    // Pip precedes the tick and text inside each card
    const cardHtmls = [...html.matchAll(/<div class="sc-hold-log-card">([\s\S]*?)<\/div>/g)].map(
      (m) => m[1],
    );
    expect(cardHtmls.length).toBe(3);

    for (const card of cardHtmls) {
      const pipIdx = card.indexOf("sc-hold-log-pip-wrapper");
      const textIdx = card.indexOf("sc-hold-log-text");
      expect(pipIdx).toBeGreaterThan(-1);
      expect(textIdx).toBeGreaterThan(pipIdx);
    }
  });

  it("renders no log cards or pips when no intents are recorded", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} />);
    expect(html).not.toContain("data-hold-log-pip");
    expect(html).not.toContain("sc-hold-log-card");
  });
});
