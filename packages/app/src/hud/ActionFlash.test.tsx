import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ACTION_FLASH_MS,
  ActionFlash,
  ActionFlashChip,
  ActionSparkPip,
  type ActionFlashKind,
} from "./ActionFlash";

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

describe("ActionFlash", () => {
  it("renders nothing until an action succeeds", () => {
    expect(renderToStaticMarkup(<ActionFlash />)).toBe("");
  });

  it.each([
    ["build", "Built"],
    ["train", "Trained"],
    ["trade", "Traded"],
  ] as const)("labels a %s flash", (kind, label) => {
    const html = renderToStaticMarkup(<ActionFlashChip kind={kind} />);
    expect(html).toContain(label);
    expect(html).toContain(`data-action-flash="${kind}"`);
    expect(html).toContain('aria-hidden="true"');
  });

  it("stays brief", () => {
    expect(ACTION_FLASH_MS).toBeGreaterThan(0);
    expect(ACTION_FLASH_MS).toBeLessThanOrEqual(1500);
  });
});

describe("ActionSparkPip and Living Treatment", () => {
  const KINDS: ActionFlashKind[] = ["build", "train", "trade"];

  it.each(KINDS)("renders distinct living spark pip for %s", (kind) => {
    const html = renderToStaticMarkup(<ActionSparkPip kind={kind} size={15} />);
    expect(html).toContain("<svg");
    expect(html).toContain(`data-spark-kind="${kind}"`);
    expect(html).toContain(`is-${kind}`);
    expect(html).toContain('style="pointer-events:none"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("renders distinct vector charges for build, train, and trade", () => {
    const buildHtml = renderToStaticMarkup(<ActionSparkPip kind="build" />);
    const trainHtml = renderToStaticMarkup(<ActionSparkPip kind="train" />);
    const tradeHtml = renderToStaticMarkup(<ActionSparkPip kind="trade" />);

    // Build: forge spark diamond and amber tones
    expect(buildHtml).toContain("#d97706");
    expect(buildHtml).toContain("#fef08a");

    // Train: crossed clash diagonals and martial blade star
    expect(trainHtml).toContain("#ef4444");
    expect(trainHtml).toContain("#fca5a5");

    // Trade: 8-point gold coin spark and sapphire/gold accent
    expect(tradeHtml).toContain("#2563eb");
    expect(tradeHtml).toContain("#fef08a");
  });

  it.each(KINDS)("integrates living halo, shimmer, and motes into %s chip", (kind) => {
    const html = renderToStaticMarkup(<ActionFlashChip kind={kind} />);

    // Radial atmospheric halo
    expect(html).toContain(`class="sc-action-flash-halo is-${kind}"`);

    // Specular diagonal shimmer sweep
    expect(html).toContain('class="sc-action-flash-shimmer"');

    // Glyph container with companion spark pip
    expect(html).toContain('class="sc-action-flash-glyph-wrap"');
    expect(html).toContain(`data-spark-kind="${kind}"`);

    // Micro spark motes
    expect(html).toContain('class="sc-action-flash-sparks"');
    expect(html).toContain("is-top");
    expect(html).toContain("is-bottom");
    expect(html).toContain("is-trail");
  });

  it("enforces strict isolated styles, keyframes, and reduced-motion safety in action-flash.css", () => {
    const css = readCssFile("./action-flash.css");

    // Strict pointer-events safety
    expect(css).toMatch(/\.sc-action-flash[\s\S]*?pointer-events:\s*none\s*!important/);

    // Living keyframes
    expect(css).toContain("@keyframes sc-action-flash-pop");
    expect(css).toContain("@keyframes sc-action-flash-halo-pulse");
    expect(css).toContain("@keyframes sc-action-flash-shimmer-sweep");
    expect(css).toContain("@keyframes sc-action-flash-spark-twinkle");
    expect(css).toContain("@keyframes sc-action-flash-mote-top");
    expect(css).toContain("@keyframes sc-action-flash-mote-bottom");
    expect(css).toContain("@keyframes sc-action-flash-mote-trail");

    // Reduced motion guard
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    // No leakage into theme.css
    const themeCss = readCssFile("../theme.css");
    expect(themeCss).not.toContain("sc-action-flash");
  });
});
