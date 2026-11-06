import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, RESEARCH } from "@second-crown/sim";
import {
  ResearchPace,
  ResearchPaceGlyphPip,
  activeStudy,
  fastPace,
  nextUnlock,
} from "./ResearchPace";

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

function bare() {
  const s = createGameState({ seed: 1 });
  s.buildings = [];
  for (const k of Object.keys(s.flags)) if (k.startsWith("research_")) delete s.flags[k];
  return s;
}

describe("ResearchPace", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<ResearchPace state={undefined} />)).toBe("");
  });

  it("shows base pace, idle lectern, and the first unit unlock in table order", () => {
    const s = bare();
    expect(fastPace(s)).toBe(false);
    expect(activeStudy(s)).toBeNull();
    expect(nextUnlock(s)).toEqual({ id: "fieldcraft", units: ["Ranger"] });
    const html = renderToStaticMarkup(<ResearchPace state={s} />);
    expect(html).toContain("base pace");
    expect(html).toContain("lectern idle");
    expect(html).toContain("Fieldcraft");
    expect(html).toContain(`(${Math.ceil(RESEARCH.fieldcraft.ticks / 10)}s)`);
    expect(html).toContain('data-pace="base"');
    expect(html).toContain("sc-research-pace-glyph");
  });

  it("reads Academy pace from the sim researchDuration", () => {
    const s = bare();
    s.buildings = [{ typeId: "academy", completesAtTick: null } as (typeof s.buildings)[number]];
    expect(fastPace(s)).toBe(true);
    const html = renderToStaticMarkup(<ResearchPace state={s} />);
    expect(html).toContain("Academy pace");
    expect(html).toContain(`(${Math.ceil(Math.ceil(RESEARCH.fieldcraft.ticks * 0.8) / 10)}s)`);
    expect(html).toContain('class="sc-research-pace-aura"');
  });

  it("shows the running study and skips known unlocks", () => {
    const s = bare();
    s.flags.research_fieldcraft = 1;
    s.flags.research_drill_until = s.meta.tick + 95;
    expect(activeStudy(s)).toEqual({ id: "drill", left: 95 });
    expect(nextUnlock(s)?.id).toBe("drill");
    const html = renderToStaticMarkup(<ResearchPace state={s} />);
    expect(html).toContain("Drill 10s left");
    expect(html).toContain("Banner");
    expect(html).not.toContain("Fieldcraft");
    expect(html).toContain("sc-research-pace-star");
  });

  it("says every unit is unlocked when all unlock studies are known", () => {
    const s = bare();
    for (const id of Object.keys(RESEARCH)) s.flags[`research_${id}`] = 1;
    expect(nextUnlock(s)).toBeNull();
    const html = renderToStaticMarkup(<ResearchPace state={s} />);
    expect(html).toContain("every unit unlocked");
    expect(html).toContain('data-all-unlocked="true"');
  });
});

describe("ResearchPaceGlyphPip Living Treatment", () => {
  it("renders base pace glyph with quiet astrolabe, slate rim, and idle pivot", () => {
    const html = renderToStaticMarkup(<ResearchPaceGlyphPip fast={false} active={false} />);
    expect(html).toContain("sc-research-pace-glyph-wrap");
    expect(html).toContain("is-base");
    expect(html).toContain("is-idle");
    expect(html).toContain('data-pace="base"');
    expect(html).toContain('data-active="false"');
    expect(html).toContain('style="width:16px;height:16px;display:inline-flex;flex-shrink:0;pointer-events:none"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("sc-research-pace-aura");
    expect(html).not.toContain("sc-research-pace-star");
  });

  it("renders fast Academy pace glyph with radiant aura, speed ticks, and active star", () => {
    const html = renderToStaticMarkup(<ResearchPaceGlyphPip fast={true} active={true} unlockId="drill" />);
    expect(html).toContain("is-fast");
    expect(html).toContain("is-active");
    expect(html).toContain('data-pace="academy"');
    expect(html).toContain('data-active="true"');
    expect(html).toContain('data-unlock-id="drill"');
    expect(html).toContain('class="sc-research-pace-aura"');
    expect(html).toContain("sc-research-pace-star");
  });

  it("renders triumphant master astrolabe when all units unlocked", () => {
    const html = renderToStaticMarkup(<ResearchPaceGlyphPip allUnlocked={true} />);
    expect(html).toContain("is-all-unlocked");
    expect(html).toContain('data-all-unlocked="true"');
    expect(html).toContain("sc-research-pace-star");
  });
});

describe("Research pace styles and CSS isolation", () => {
  it("enforces pointer-events: none !important and provides living keyframes", () => {
    const css = readCssFile("./research-pace.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-research-pace-float");
    expect(css).toContain("@keyframes sc-research-pace-breathe");
    expect(css).toContain("@keyframes sc-research-pace-twinkle");
    expect(css).toContain(".sc-research-pace-glyph-wrap.is-active .sc-research-pace-star");
    expect(css).toContain(".sc-research-pace-glyph-wrap.is-all-unlocked .sc-research-pace-star");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("does not leak into theme.css", () => {
    const theme = readCssFile("./theme.css");
    expect(theme).not.toContain("sc-research-pace");
  });
});
