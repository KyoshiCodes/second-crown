import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, RESEARCH } from "@second-crown/sim";
import {
  ResearchInkPip,
  StudyInkPip,
  InkPip,
  ResearchProgressPip,
  ResearchInkDroplets,
  calcResearchProgress,
  resolveInkStage,
  formatInkStatus,
} from "./ResearchInkPip";
import { ResearchBar } from "../ResearchBar";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("ResearchInkPip pure helpers", () => {
  it("calcResearchProgress computes normalized 0..1 completion accurately", () => {
    expect(calcResearchProgress({ done: true })).toBe(1);
    expect(calcResearchProgress({ done: false, ticksLeft: 0 })).toBe(0);
    expect(calcResearchProgress({ done: false, ticksLeft: 30, ticksTotal: 120 })).toBe(0.75);
    expect(calcResearchProgress({ done: false, ticksLeft: 90, duration: 180 })).toBe(0.5);
    expect(calcResearchProgress({ done: false, ticksLeft: 10, ticksTotal: 10 })).toBe(0);
    expect(calcResearchProgress({ done: false, ticksLeft: 0, ticksTotal: 10 })).toBe(0);
    // Boundary clamps
    expect(calcResearchProgress({ done: false, ticksLeft: 200, ticksTotal: 100 })).toBe(0);
  });

  it("resolveInkStage maps progress and status across all stages", () => {
    expect(resolveInkStage(1, "known")).toBe("known");
    expect(resolveInkStage(1, "open")).toBe("known");
    expect(resolveInkStage(0, "locked")).toBe("locked");
    expect(resolveInkStage(0, "open")).toBe("open");
    expect(resolveInkStage(0.15, "studying")).toBe("stage-1");
    expect(resolveInkStage(0.25, "studying")).toBe("stage-1");
    expect(resolveInkStage(0.35, "studying")).toBe("stage-2");
    expect(resolveInkStage(0.5, "studying")).toBe("stage-2");
    expect(resolveInkStage(0.65, "studying")).toBe("stage-3");
    expect(resolveInkStage(0.75, "studying")).toBe("stage-3");
    expect(resolveInkStage(0.9, "studying")).toBe("stage-4");
    expect(resolveInkStage(0.99, "studying")).toBe("stage-4");
  });

  it("formatInkStatus describes current ink well state concisely", () => {
    expect(formatInkStatus(1, "known")).toBe("Mastered · illuminated gold ink");
    expect(formatInkStatus(0, "locked")).toBe("Sealed · dry stone inkpot");
    expect(formatInkStatus(0, "open")).toBe("Open lectern · fresh ink ready");
    expect(formatInkStatus(0.45, "studying")).toBe("Studying · 45% inked");
  });
});

describe("ResearchInkPip component rendering", () => {
  it("renders phrasing-only markup (span and svg) with aria-hidden and data attributes", () => {
    const html = renderToStaticMarkup(
      <ResearchInkPip progress={0.5} status="studying" topicId="forestry" size={24} />,
    );
    expect(html).not.toMatch(/<(div|p|section|article|button|dl)\b/);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-ink-pip="true"');
    expect(html).toContain('data-ink-stage="stage-2"');
    expect(html).toContain('data-progress="50"');
    expect(html).toContain('data-topic="forestry"');
  });

  it("renders distinct ink states across locked, open, studying, and known", () => {
    const lockedHtml = renderToStaticMarkup(<ResearchInkPip progress={0} status="locked" />);
    expect(lockedHtml).toContain("is-locked");
    expect(lockedHtml).toContain("sc-ink-cap-seal");
    expect(lockedHtml).not.toContain("is-writing");

    const openHtml = renderToStaticMarkup(<ResearchInkPip progress={0} status="open" />);
    expect(openHtml).toContain("is-open");
    expect(openHtml).toContain("sc-ink-quill");
    expect(openHtml).not.toContain("is-writing");

    const studyHtml = renderToStaticMarkup(<ResearchInkPip progress={0.6} status="studying" />);
    expect(studyHtml).toContain("is-studying");
    expect(studyHtml).toContain("is-writing");
    expect(studyHtml).toContain("sc-ink-drift-layer");
    expect(studyHtml).toContain("sc-ink-surface-ripple");

    const knownHtml = renderToStaticMarkup(<ResearchInkPip progress={1} status="known" />);
    expect(knownHtml).toContain("is-known");
    expect(knownHtml).toContain("sc-ink-star-glint");
    expect(knownHtml).toContain("sc-ink-gold-core");
  });

  it("exports StudyInkPip, InkPip, and ResearchProgressPip as valid aliases", () => {
    const p1 = renderToStaticMarkup(<StudyInkPip progress={0.8} status="studying" />);
    const p2 = renderToStaticMarkup(<InkPip progress={0.8} status="studying" />);
    const p3 = renderToStaticMarkup(<ResearchProgressPip progress={0.8} status="studying" />);
    expect(p1).toContain('data-ink-stage="stage-4"');
    expect(p2).toContain('data-ink-stage="stage-4"');
    expect(p3).toContain('data-ink-stage="stage-4"');
  });

  it("renders 4-bead ink droplets correctly matching research fractions", () => {
    const drop0 = renderToStaticMarkup(<ResearchInkDroplets progress={0} status="open" />);
    expect((drop0.match(/is-empty/g) ?? []).length).toBe(4);

    const drop1 = renderToStaticMarkup(<ResearchInkDroplets progress={0.15} status="studying" />);
    expect(drop1).toContain('data-drop-index="1" data-drop-state="active"');
    expect(drop1).toContain('data-drop-index="2" data-drop-state="empty"');

    const drop2 = renderToStaticMarkup(<ResearchInkDroplets progress={0.35} status="studying" />);
    expect(drop2).toContain('data-drop-index="1" data-drop-state="filled"');
    expect(drop2).toContain('data-drop-index="2" data-drop-state="active"');

    const drop3 = renderToStaticMarkup(<ResearchInkDroplets progress={0.7} status="studying" />);
    expect(drop3).toContain('data-drop-index="1" data-drop-state="filled"');
    expect(drop3).toContain('data-drop-index="2" data-drop-state="filled"');
    expect(drop3).toContain('data-drop-index="3" data-drop-state="active"');

    const dropFull = renderToStaticMarkup(<ResearchInkDroplets progress={1} status="known" />);
    expect((dropFull.match(/is-filled/g) ?? []).length).toBe(4);
  });
});

describe("ResearchBar living ink pip integration", () => {
  it("mounts living ink badges with dynamic progress on study cards without mutating GameState", () => {
    const state = createGameState({ seed: 7 });
    state.flags.research_husbandry = 1;
    state.flags.research_forestry_until = state.meta.tick + 60;
    state.flags.research_forestry_total = 120; // 50% done

    const before = JSON.stringify(state);
    const html = renderToStaticMarkup(<ResearchBar state={state} act={() => {}} />);

    expect(JSON.stringify(state)).toBe(before);
    expect((html.match(/sc-study-ink-badge/g) ?? []).length).toBe(Object.keys(RESEARCH).length);

    // Forestry is 50% in progress
    const forestryStart = html.indexOf('data-study="forestry"');
    const masonryStart = html.indexOf('data-study="masonry"');
    const forestryCard = html.slice(forestryStart, masonryStart);

    expect(forestryCard).toContain('data-progress="50"');
    expect(forestryCard).toContain('data-ink-stage="stage-2"');
    expect(forestryCard).toContain("is-writing");
    expect(forestryCard).toContain("sc-ink-droplet-track");
    expect(forestryCard).toContain("sc-research-ink-progress-ring");

    // Husbandry is known (100%)
    const husbandryStart = html.indexOf('data-study="husbandry"');
    const husbandryCard = html.slice(husbandryStart, forestryStart);
    expect(husbandryCard).toContain('data-progress="100"');
    expect(husbandryCard).toContain('data-ink-stage="known"');
    expect(husbandryCard).toContain("sc-ink-star-glint");
  });
});

describe("research-ink-pip.css invariants", () => {
  it("enforces pointer-events: none, reduced motion, and isolation from theme.css", () => {
    const css = readTextFile("./research-ink-pip.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("sc-ink-quill-dip");
    expect(css).toContain("sc-ink-ripple-flow");
    expect(css).toContain("sc-ink-glow-pulse");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    const themeCss = readTextFile("../theme.css");
    expect(themeCss).not.toContain("sc-research-ink-pip");
    expect(themeCss).not.toContain("sc-ink-pot");
  });
});
