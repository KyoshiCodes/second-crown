import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ascendThreshold, createGameState, formatLetterSuffix } from "@second-crown/sim";
import { AgeLine, AgeGlyphPip } from "./AgeLine";

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

describe("AgeLine", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<AgeLine state={undefined} />)).toBe("");
  });

  it("shows the current dawn and the sim's next-age threshold", () => {
    const s = createGameState({ seed: 1 });
    const html = renderToStaticMarkup(<AgeLine state={s} />);
    expect(html).toContain('data-dawn="0"');
    expect(html).toContain("Dawn 0");
    expect(html).toContain(`next age at ${formatLetterSuffix(ascendThreshold(s))} total resources`);
    expect(html).toContain('data-ready="false"');
    expect(html).toContain('data-age-glyph="dawn-0"');
    expect(html).toContain("is-waiting");
  });

  it("follows prestige_level and marks ready when the sim says so", () => {
    const s = createGameState({ seed: 1 });
    s.flags["prestige_level"] = 2;
    s.resources = { gold: String(ascendThreshold(s)), food: "0", wood: "0", stone: "0" };
    const html = renderToStaticMarkup(<AgeLine state={s} />);
    expect(html).toContain("Dawn 2");
    expect(html).toContain(formatLetterSuffix(ascendThreshold(s)));
    expect(html).toContain('data-ready="true"');
    expect(html).toContain("ascend from the Crown tab");
    expect(html).toContain("is-ready");
    expect(html).toContain('class="sc-age-glyph-aura"');
    expect(html).toContain("sc-age-glyph-star");
  });
});

describe("AgeGlyphPip Living Treatment", () => {
  it("renders ready state with breathing aura, solar rays, and apex star", () => {
    const html = renderToStaticMarkup(<AgeGlyphPip ready={true} dawn={1} />);
    expect(html).toContain('class="sc-age-glyph-aura"');
    expect(html).toContain("sc-age-glyph-star");
    expect(html).toContain("sc-age-glyph-rays");
    expect(html).toContain('data-ready="true"');
    expect(html).toContain('data-age-glyph="dawn-1"');
    expect(html).toContain('style="width:16px;height:16px;pointer-events:none"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("renders waiting state with serene dawn and no aura", () => {
    const html = renderToStaticMarkup(<AgeGlyphPip ready={false} dawn={0} />);
    expect(html).not.toContain("sc-age-glyph-aura");
    expect(html).not.toContain("sc-age-glyph-star");
    expect(html).toContain("is-waiting");
    expect(html).toContain('data-ready="false"');
    expect(html).toContain('data-age-glyph="dawn-0"');
  });

  it("renders shared state with enduring stone monolith and celestial sapphire disc", () => {
    const html = renderToStaticMarkup(<AgeGlyphPip shared={true} dawn={0} />);
    expect(html).toContain("is-shared");
    expect(html).toContain('data-age-glyph="shared"');
    expect(html).not.toContain("sc-age-glyph-aura");
  });
});

describe("Age glyph styles and CSS isolation", () => {
  it("enforces pointer-events: none !important and provides living keyframes", () => {
    const css = readCssFile("./age-line.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-age-glyph-float");
    expect(css).toContain("@keyframes sc-age-glyph-breathe");
    expect(css).toContain("@keyframes sc-age-glyph-twinkle");
    expect(css).toContain("@keyframes sc-age-glyph-rays");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("does not leak into theme.css", () => {
    const theme = readCssFile("./theme.css");
    expect(theme).not.toContain("sc-age-glyph");
    expect(theme).not.toContain("sc-age-line");
  });
});
