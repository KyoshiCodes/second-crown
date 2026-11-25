import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Fold, FOLD_CLOSE_MS } from "./Fold";

function readTextFile(relativePath: string): string {
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

function stubStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("Fold visual polish & Compact board focus", () => {
  beforeEach(() => stubStorage());
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it("wraps open fold body in .sc-fold-reveal.is-opening while omitting body when closed", () => {
    const openHtml = renderToStaticMarkup(
      <Fold id="polish-test" title="Standing works" summary="2 works · 1 idle">
        <p>Panel content</p>
      </Fold>,
    );
    expect(openHtml).toContain("sc-fold is-open");
    expect(openHtml).toContain('aria-expanded="true"');
    expect(openHtml).toContain("sc-fold-reveal is-opening");
    expect(openHtml).toContain("sc-fold-body");
    expect(openHtml).toContain("sc-fold-summary");
    expect(openHtml).toContain("2 works · 1 idle");

    stubStorage({ "sc-fold:polish-test": "0" });
    const closedHtml = renderToStaticMarkup(
      <Fold id="polish-test" title="Standing works" summary="2 works · 1 idle">
        <p>Panel content</p>
      </Fold>,
    );
    expect(closedHtml).toContain("sc-fold is-closed");
    expect(closedHtml).toContain('aria-expanded="false"');
    expect(closedHtml).toContain("2 works · 1 idle");
    expect(closedHtml).not.toContain("sc-fold-reveal");
    expect(closedHtml).not.toContain("Panel content");
    expect(FOLD_CLOSE_MS).toBe(180);
  });

  it("defines soft open/close motion, crisp gold-accented folded summary, and Compact focus vignette in dedicated CSS", () => {
    const css = readTextFile("./fold-polish.css");
    const foldTsx = readTextFile("./Fold.tsx");
    const themeCss = readTextFile("../theme.css");

    // Soft open / close motion
    expect(css).toContain("@keyframes sc-fold-open");
    expect(css).toContain("@keyframes sc-fold-close");
    expect(css).toContain(".sc-fold-reveal.is-opening");
    expect(css).toContain(".sc-fold-reveal.is-closing");
    expect(css).toContain("grid-template-rows: 0fr");

    // Cleaner summary text contrast + subtle gold accent when folded
    expect(css).toContain(".sc-fold.is-closed .sc-fold-summary");
    expect(css).toContain("--sc-fold-gold");
    expect(css).toContain("--sc-fold-summary-text");

    // Compact mode board focus glow & vignette
    expect(css).toContain(":root.sc-compact .sc-shell::after");
    expect(css).toContain(":root.sc-compact .sc-map-canvas-container::before");
    expect(css).toContain(":root.sc-compact .sc-map-canvas");
    expect(css).toContain("pointer-events: none !important;");

    // Zero collision with board-music-lighting.css (div::before) or music-reactive.css (div::after)
    expect(css).not.toContain(".sc-map-canvas-container > div::before");
    expect(css).not.toContain(".sc-map-canvas-container > div::after");

    // Theme support + reduced-motion guard
    for (const theme of ["dusk", "night", "parchment"] as const) {
      expect(css).toContain(`:root[data-chrome="${theme}"]`);
    }
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important;");

    // Isolated from theme.css & preserves storage keys
    expect(themeCss).not.toContain(".sc-fold");
    expect(themeCss).not.toContain(".sc-compact");
    expect(foldTsx).toContain('import "./fold-polish.css"');
    expect(foldTsx).toContain("`sc-fold:${id}`");
    expect(foldTsx).toContain("`sc-fold-seen:${id}`");
    expect(foldTsx).toContain('"sc-compact"');
  });
});
