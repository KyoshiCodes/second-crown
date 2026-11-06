import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, visionRange } from "@second-crown/sim";
import { VisionPace, VisionPaceGlyphPip, nextVisionChange } from "./VisionPace";

type B = ReturnType<typeof createGameState>["buildings"][number];

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

function site(id: string, typeId: string, completesAtTick: number | null, realmId = "player"): B {
  return { id, typeId, realmId, x: 0, y: 0, level: 1, completesAtTick } as B;
}

describe("VisionPace", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<VisionPace state={undefined} />)).toBe("");
  });

  it("shows the sim range and no change when nothing is queued", () => {
    const s = bare();
    expect(nextVisionChange(s)).toBeNull();
    const html = renderToStaticMarkup(<VisionPace state={s} />);
    expect(html).toContain(`range ${visionRange(s)}`);
    expect(html).toContain("no change queued");
    expect(html).toContain('data-vision="steady"');
    expect(html).toContain("sc-vision-pace-glyph");
  });

  it("names the earliest watchtower under construction", () => {
    const s = bare();
    const t = s.meta.tick;
    s.buildings = [site("a", "watchtower", t + 300), site("b", "watchtower", t + 120), site("c", "farm", t + 10)];
    expect(nextVisionChange(s)).toEqual({ ticks: 120, source: "watchtower" });
    const html = renderToStaticMarkup(<VisionPace state={s} />);
    expect(html).toContain("next change in <strong>12s</strong>: a watchtower finishes");
    expect(html).toContain('data-vision="watchtower"');
    expect(html).toContain('class="sc-vision-pace-aura"');
    expect(html).toContain("is-source-watchtower");
  });

  it("picks Surveying when it lands first and ignores rival towers", () => {
    const s = bare();
    const t = s.meta.tick;
    s.buildings = [site("a", "watchtower", t + 300), site("r", "watchtower", t + 5, "rival")];
    s.flags.research_surveying_until = t + 50;
    expect(nextVisionChange(s)).toEqual({ ticks: 50, source: "surveying" });
    const html = renderToStaticMarkup(<VisionPace state={s} />);
    expect(html).toContain("Surveying study finishes");
    expect(html).toContain("is-source-surveying");
  });

  it("counts a first keep only when the culture grants keep vision", () => {
    const s = bare();
    const t = s.meta.tick;
    s.buildings = [site("k", "keep", t + 80)];
    s.flags.culture = "western";
    expect(nextVisionChange(s)).toBeNull();
    s.flags.culture = "peak";
    expect(nextVisionChange(s)).toEqual({ ticks: 80, source: "keep" });
    const html = renderToStaticMarkup(<VisionPace state={s} />);
    expect(html).toContain("the keep finishes (culture keep vision)");
    expect(html).toContain("is-source-keep");
  });
});

describe("VisionPaceGlyphPip Living Treatment", () => {
  it("renders steady rate glyph with quiet slate horizon eye and no aura", () => {
    const html = renderToStaticMarkup(<VisionPaceGlyphPip rising={false} />);
    expect(html).toContain("sc-vision-pace-glyph-wrap");
    expect(html).toContain("is-steady");
    expect(html).toContain('data-vision="steady"');
    expect(html).toContain('style="width:16px;height:16px;pointer-events:none"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("sc-vision-pace-aura");
    expect(html).not.toContain("sc-vision-pace-star");
  });

  it("renders rising vision glyph with cyan aura, horizon aperture, and apex beacon star", () => {
    const html = renderToStaticMarkup(
      <VisionPaceGlyphPip rising={true} source="watchtower" range={5} />
    );
    expect(html).toContain("is-rising");
    expect(html).toContain("is-source-watchtower");
    expect(html).toContain('data-vision="watchtower"');
    expect(html).toContain('data-source="watchtower"');
    expect(html).toContain('data-range="5"');
    expect(html).toContain('class="sc-vision-pace-aura"');
    expect(html).toContain("sc-vision-pace-star");
  });

  it("renders distinct charges for surveying and keep sources", () => {
    const surveyHtml = renderToStaticMarkup(
      <VisionPaceGlyphPip rising={true} source="surveying" />
    );
    expect(surveyHtml).toContain("is-source-surveying");

    const keepHtml = renderToStaticMarkup(
      <VisionPaceGlyphPip rising={true} source="keep" />
    );
    expect(keepHtml).toContain("is-source-keep");
  });
});

describe("Vision pace styles and CSS isolation", () => {
  it("enforces pointer-events: none !important and provides living keyframes", () => {
    const css = readCssFile("./vision-pace.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-vision-pace-float");
    expect(css).toContain("@keyframes sc-vision-pace-breathe");
    expect(css).toContain("@keyframes sc-vision-pace-twinkle");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("does not leak into theme.css", () => {
    const theme = readCssFile("./theme.css");
    expect(theme).not.toContain("sc-vision-pace");
  });
});
