import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, RESEARCH } from "@second-crown/sim";
import {
  nextResearch,
  ResearchHint,
  ResearchGlyphPip,
  researchCostText,
} from "./ResearchHint";

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

function done(state: ReturnType<typeof createGameState>, ...ids: string[]) {
  for (const id of ids) state.flags[`research_${id}`] = 1;
}

describe("researchCostText", () => {
  it("reads costs straight from the sim research table", () => {
    expect(researchCostText("husbandry")).toBe("20 food, 12 wood");
    expect(researchCostText("logistics")).toBe("30 gold, 16 wood, 12 food");
  });
});

describe("ResearchHint", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<ResearchHint state={undefined} />)).toBe("");
  });

  it("names the first unknown study with its cost and missing hall", () => {
    const s = createGameState({ seed: 1 });
    s.buildings = [];
    expect(nextResearch(s)).toEqual({ id: "husbandry", ready: false });
    const html = renderToStaticMarkup(<ResearchHint state={s} />);
    expect(html).toContain(RESEARCH.husbandry.name);
    expect(html).toContain("20 food, 12 wood");
    expect(html).toContain("needs farm or granary or academy");
    expect(html).toContain('data-research-glyph="husbandry"');
    expect(html).toContain('data-ready="false"');
  });

  it("prefers a study whose hall is already built", () => {
    const s = createGameState({ seed: 1 });
    s.buildings = [{ typeId: "quarry", completesAtTick: null } as (typeof s.buildings)[number]];
    expect(nextResearch(s)).toEqual({ id: "masonry", ready: true });
    const html = renderToStaticMarkup(<ResearchHint state={s} />);
    expect(html).toContain("is-ready");
    expect(html).not.toContain("needs");
    expect(html).toContain('data-research-glyph="masonry"');
    expect(html).toContain('data-ready="true"');
    expect(html).toContain('class="sc-research-glyph-aura"');
  });

  it("skips known and underway studies and says when all are known", () => {
    const s = createGameState({ seed: 1 });
    s.buildings = [];
    done(s, "husbandry");
    s.flags["research_forestry_until"] = s.meta.tick + 100;
    expect(nextResearch(s)?.id).toBe("masonry");
    done(s, ...Object.keys(RESEARCH));
    expect(nextResearch(s)).toBeNull();
    const html = renderToStaticMarkup(<ResearchHint state={s} />);
    expect(html).toContain("every study known");
    expect(html).toContain('data-research-glyph="done"');
    expect(html).toContain("is-done");
  });
});

describe("ResearchGlyphPip Living Treatment", () => {
  it("renders ready state with breathing aura, illuminated pages, and knowledge star", () => {
    const html = renderToStaticMarkup(<ResearchGlyphPip ready={true} id="husbandry" />);
    expect(html).toContain('class="sc-research-glyph-aura"');
    expect(html).toContain("sc-research-glyph-star");
    expect(html).toContain('data-ready="true"');
    expect(html).toContain('style="pointer-events:none');
    expect(html).toContain('aria-hidden="true"');
  });

  it("renders locked state with antique parchment and steady styling", () => {
    const html = renderToStaticMarkup(<ResearchGlyphPip ready={false} id="masonry" />);
    expect(html).not.toContain("sc-research-glyph-aura");
    expect(html).toContain("is-locked");
    expect(html).toContain('data-ready="false"');
  });

  it("renders done state with master scholar laurel wreath and grand codex", () => {
    const html = renderToStaticMarkup(<ResearchGlyphPip isDone={true} />);
    expect(html).toContain("is-done");
    expect(html).toContain('data-research-glyph="done"');
    expect(html).toContain("<rect"); // bound grand codex
  });

  it("enforces strict isolated styles, keyframes, and reduced-motion guard in research-hint.css", () => {
    const css = readCssFile("./research-hint.css");

    // Strict pointer-events safety
    expect(css).toMatch(/\.sc-research-glyph-wrap[\s\S]*?pointer-events:\s*none\s*!important/);

    // Living keyframes
    expect(css).toContain("@keyframes sc-research-glyph-breathe");
    expect(css).toContain("@keyframes sc-research-glyph-float");
    expect(css).toContain("@keyframes sc-research-glyph-twinkle");

    // Reduced motion guard
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    // No leakage into theme.css
    const themeCss = readCssFile("./theme.css");
    expect(themeCss).not.toContain("sc-research-hint");
    expect(themeCss).not.toContain("sc-research-glyph");
  });
});
