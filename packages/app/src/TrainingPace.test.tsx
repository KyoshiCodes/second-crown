import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, listUnitTypes, trainDurationTicks } from "@second-crown/sim";
import {
  TrainingPace,
  TrainingPaceGlyphPip,
  nextUnitUnlock,
  trainingPace,
  PACE_COUNT,
} from "./TrainingPace";

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

function withBarracks(n: number) {
  const s = bare();
  s.buildings = Array.from({ length: n }, () => ({ typeId: "barracks", completesAtTick: null }) as (typeof s.buildings)[number]);
  return s;
}

const militiaBase = listUnitTypes().find((u) => u.id === "militia")!.trainTicks * PACE_COUNT;

describe("TrainingPace", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<TrainingPace state={undefined} />)).toBe("");
  });

  it("shows base rate and the first locked unit with no barracks or studies", () => {
    const s = bare();
    expect(trainingPace(s)).toEqual({ now: militiaBase, base: militiaBase });
    expect(nextUnitUnlock(s)?.id).toBe("banner");
    const html = renderToStaticMarkup(<TrainingPace state={s} />);
    expect(html).toContain(`${PACE_COUNT} militia in ${Math.ceil(militiaBase / 10)}s`);
    expect(html).toContain("(base rate)");
    expect(html).toContain("Banner");
    expect(html).toContain("Study Drill on Crown");
    expect(html).toContain('data-training="base"');
    expect(html).toContain("sc-training-pace-glyph");
  });

  it("shows the faster sim time when barracks speed drilling", () => {
    const s = withBarracks(2);
    const now = trainDurationTicks(s, "militia", PACE_COUNT);
    expect(now).toBeLessThan(militiaBase);
    const html = renderToStaticMarkup(<TrainingPace state={s} />);
    expect(html).toContain(`${PACE_COUNT} militia in ${Math.ceil(now / 10)}s`);
    expect(html).toContain(`(base ${Math.ceil(militiaBase / 10)}s)`);
    expect(html).toContain('data-training="fast"');
    expect(html).toContain('class="sc-training-pace-aura"');
  });

  it("skips units already opened by a study", () => {
    const s = bare();
    s.flags.research_drill = 1;
    expect(nextUnitUnlock(s)?.id).toBe("warden");
  });

  it("says every unit is unlocked when all studies are done", () => {
    const s = bare();
    for (const id of ["horse", "siege", "fieldcraft", "drill", "screening", "fortification"]) s.flags[`research_${id}`] = 1;
    expect(nextUnitUnlock(s)).toBeNull();
    const html = renderToStaticMarkup(<TrainingPace state={s} />);
    expect(html).toContain("every unit unlocked");
    expect(html).toContain('data-all-unlocked="true"');
  });
});

describe("TrainingPaceGlyphPip Living Treatment", () => {
  it("renders base rate glyph with quiet practice blades and no aura", () => {
    const html = renderToStaticMarkup(<TrainingPaceGlyphPip fast={false} />);
    expect(html).toContain("sc-training-pace-glyph-wrap");
    expect(html).toContain("is-base");
    expect(html).toContain('data-training="base"');
    expect(html).toContain('style="width:16px;height:16px;pointer-events:none"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("sc-training-pace-aura");
    expect(html).not.toContain("sc-training-pace-star");
  });

  it("renders fast training pace glyph with radiant aura, steel blades, and apex clash star", () => {
    const html = renderToStaticMarkup(
      <TrainingPaceGlyphPip fast={true} nextId="banner" />
    );
    expect(html).toContain("is-fast");
    expect(html).toContain('data-training="fast"');
    expect(html).toContain('data-next-id="banner"');
    expect(html).toContain('class="sc-training-pace-aura"');
    expect(html).toContain("sc-training-pace-star");
  });

  it("renders master martial laurel wreath when all units are unlocked", () => {
    const html = renderToStaticMarkup(<TrainingPaceGlyphPip allUnlocked={true} />);
    expect(html).toContain("is-all-unlocked");
    expect(html).toContain('data-all-unlocked="true"');
    expect(html).toContain("sc-training-pace-star");
  });
});

describe("Training pace styles and CSS isolation", () => {
  it("enforces pointer-events: none !important and provides living keyframes", () => {
    const css = readCssFile("./training-pace.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-training-pace-float");
    expect(css).toContain("@keyframes sc-training-pace-breathe");
    expect(css).toContain("@keyframes sc-training-pace-twinkle");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("does not leak into theme.css", () => {
    const theme = readCssFile("./theme.css");
    expect(theme).not.toContain("sc-training-pace");
  });
});
