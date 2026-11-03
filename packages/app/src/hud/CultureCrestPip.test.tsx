import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CULTURES, createGameState, setPlayerCulture } from "@second-crown/sim";
import { CultureCrestPip } from "./CultureCrestPip";
import { CulturePicker } from "../CulturePicker";

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

describe("CultureCrestPip (bakeoff/gemini-culture)", () => {
  it("renders a distinct crest for all 10 cultures", () => {
    for (const culture of CULTURES) {
      const html = renderToStaticMarkup(<CultureCrestPip cultureId={culture.id} isSelected={false} />);
      expect(html).toContain(`data-culture="${culture.id}"`);
      expect(html).toContain(`id="charge-${culture.id}"`);
      expect(html).toContain('class="sc-culture-crest is-idle "');
      expect(html).toMatch(/style="[^"]*pointer-events:\s*none/);
    }
  });

  it("renders living aura and apex crown glint when selected", () => {
    const htmlPicked = renderToStaticMarkup(<CultureCrestPip cultureId="western" isSelected={true} />);
    expect(htmlPicked).toContain("is-selected");
    expect(htmlPicked).toContain("sc-culture-crest-aura");
    expect(htmlPicked).toContain("sc-culture-crest-glint");

    const htmlIdle = renderToStaticMarkup(<CultureCrestPip cultureId="western" isSelected={false} />);
    expect(htmlIdle).toContain("is-idle");
    expect(htmlIdle).not.toContain("sc-culture-crest-aura");
    expect(htmlIdle).not.toContain("sc-culture-crest-glint");
  });

  it("integrates into CulturePicker without breaking selection or cards", () => {
    const s = createGameState({ seed: 42 });
    setPlayerCulture(s, "woodland");
    const html = renderToStaticMarkup(<CulturePicker state={s} act={() => undefined} />);

    // Renders crest for each culture
    expect(html.match(/data-culture=/g)?.length).toBe(CULTURES.length);
    // Woodland is picked
    expect(html).toContain('data-culture="woodland" data-picked="true"');
    // Desert is idle
    expect(html).toContain('data-culture="desert" data-picked="false"');
  });

  it("isolates styles in culture-picker.css with pointer-events: none, animations, and motion guard", () => {
    const css = readCssFile("./culture-picker.css");

    // Strict pointer-events: none
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain(".sc-culture-crest *");

    // Animations & Keyframes
    expect(css).toContain("@keyframes sc-culture-crest-idle");
    expect(css).toContain("@keyframes sc-culture-crest-float");
    expect(css).toContain("@keyframes sc-culture-crest-pulse");
    expect(css).toContain("@keyframes sc-culture-crest-sparkle");

    // Motion guard
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important");

    // Zero contamination of theme.css
    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-culture-crest");
  });
});
