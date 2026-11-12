import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RESEARCH, createGameState } from "@second-crown/sim";
import {
  ResearchGlyphAdvanced,
  ResearchStateSvgLayer,
  resolveResearchGlyphState,
  type ResearchGlyphState,
} from "./ResearchGlyphAdvanced";
import {
  StudyLivingGlyph,
  StudyLivingUnderlay,
} from "./AcademyLivingGlyph";
import { ResearchBar } from "../ResearchBar";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("ResearchGlyphAdvanced — living research glyphs with locked, available, and completed states", () => {
  it("resolves canonical glyph state accurately across status, progress, and done flags", () => {
    // Locked
    expect(resolveResearchGlyphState({ status: "locked" })).toBe("locked");

    // Available (open / ready to study)
    expect(resolveResearchGlyphState({ status: "open" })).toBe("available");
    expect(resolveResearchGlyphState({})).toBe("available");

    // Studying (active research)
    expect(resolveResearchGlyphState({ status: "studying" })).toBe("studying");
    expect(resolveResearchGlyphState({ progress: 0.45 })).toBe("studying");

    // Completed (mastered / codified)
    expect(resolveResearchGlyphState({ status: "known" })).toBe("completed");
    expect(resolveResearchGlyphState({ done: true })).toBe("completed");
    expect(resolveResearchGlyphState({ progress: 1.0 })).toBe("completed");

    // Explicit state overrides
    const explicitStates: ResearchGlyphState[] = ["locked", "available", "studying", "completed"];
    for (const st of explicitStates) {
      expect(resolveResearchGlyphState({ state: st, status: "locked" })).toBe(st);
    }
  });

  it("renders locked state with cold iron shackle, lock body, keyhole, and breathing aura", () => {
    const html = renderToStaticMarkup(
      <ResearchGlyphAdvanced topicId="fortification" status="locked" size={24} />
    );

    expect(html).toContain('data-research-state="locked"');
    expect(html).toContain("is-locked");
    expect(html).toContain("sc-research-advanced-aura");
    expect(html).toContain("sc-research-lock-shackle");
    expect(html).toContain("sc-research-lock-casing");
    expect(html).toContain("sc-research-lock-keyhole-rim");
    expect(html).toContain("sc-research-lock-keyhole-stem");
    expect(html).toContain('aria-hidden="true"');
  });

  it("renders available state with discovery spark, beacon ripple, and welcoming aura", () => {
    const html = renderToStaticMarkup(
      <ResearchGlyphAdvanced topicId="crop_rotation" status="open" academyFast={true} size={24} />
    );

    expect(html).toContain('data-research-state="available"');
    expect(html).toContain("is-available");
    expect(html).toContain("is-fast");
    expect(html).toContain("sc-research-advanced-aura");
    expect(html).toContain("sc-research-available-spark");
    expect(html).toContain("sc-research-available-beacon");
    expect(html).toContain("sc-research-available-core");
    expect(html).toContain('aria-hidden="true"');
  });

  it("renders studying state with active progress ring, scholar lamp flame, and amber aura", () => {
    const html = renderToStaticMarkup(
      <ResearchGlyphAdvanced topicId="timber_framing" status="studying" progress={0.65} size={24} />
    );

    expect(html).toContain('data-research-state="studying"');
    expect(html).toContain("is-studying");
    expect(html).toContain('data-progress="65"');
    expect(html).toContain("sc-research-advanced-aura");
    expect(html).toContain("sc-research-ink-progress-ring");
    expect(html).toContain("sc-research-studying-flame");
    expect(html).toContain("sc-research-studying-core");
    expect(html).toContain('aria-hidden="true"');
  });

  it("renders completed state with master scholar laurel wreath, leaf berries, and celestial triumph star", () => {
    const html = renderToStaticMarkup(
      <ResearchGlyphAdvanced topicId="husbandry" status="known" size={24} />
    );

    expect(html).toContain('data-research-state="completed"');
    expect(html).toContain("is-completed");
    expect(html).toContain("sc-research-advanced-aura");
    expect(html).toContain("sc-research-completed-wreath");
    expect(html).toContain("sc-research-wreath-leaf");
    expect(html).toContain("sc-research-completed-star");
    expect(html).toContain("sc-research-completed-core");
    expect(html).toContain('aria-hidden="true"');
  });

  it("upgrades StudyLivingGlyph with living state heraldry across locked, available, and completed states", () => {
    // Locked study glyph
    const lockedHtml = renderToStaticMarkup(<StudyLivingGlyph topicId="siege" status="locked" />);
    expect(lockedHtml).toContain('data-study-state="locked"');
    expect(lockedHtml).toContain("is-locked");
    expect(lockedHtml).toContain("sc-research-lock-shackle");
    expect(lockedHtml).toContain("sc-research-lock-casing");

    // Available study glyph
    const availHtml = renderToStaticMarkup(<StudyLivingGlyph topicId="forestry" status="open" />);
    expect(availHtml).toContain('data-study-state="available"');
    expect(availHtml).toContain("is-available");
    expect(availHtml).toContain("sc-research-available-spark");
    expect(availHtml).toContain("sc-research-available-beacon");

    // Completed study glyph
    const completeHtml = renderToStaticMarkup(<StudyLivingGlyph topicId="masonry" status="known" />);
    expect(completeHtml).toContain('data-study-state="completed"');
    expect(completeHtml).toContain("is-completed");
    expect(completeHtml).toContain("sc-research-completed-wreath");
    expect(completeHtml).toContain("sc-research-completed-star");

    // Studying study glyph with progress ring
    const studyHtml = renderToStaticMarkup(<StudyLivingGlyph topicId="horse" status="studying" progress={0.4} />);
    expect(studyHtml).toContain('data-study-state="studying"');
    expect(studyHtml).toContain("is-studying");
    expect(studyHtml).toContain("sc-research-ink-progress-ring");
    expect(studyHtml).toContain("sc-research-studying-flame");
  });

  it("upgrades StudyLivingUnderlay with living state heraldry watermark", () => {
    const underlayLocked = renderToStaticMarkup(<StudyLivingUnderlay topicId="siege" status="locked" />);
    expect(underlayLocked).toContain('data-study-state="locked"');
    expect(underlayLocked).toContain("sc-research-lock-shackle");

    const underlayAvail = renderToStaticMarkup(<StudyLivingUnderlay topicId="forestry" status="open" />);
    expect(underlayAvail).toContain('data-study-state="available"');
    expect(underlayAvail).toContain("sc-research-available-spark");

    const underlayKnown = renderToStaticMarkup(<StudyLivingUnderlay topicId="masonry" status="known" />);
    expect(underlayKnown).toContain('data-study-state="completed"');
    expect(underlayKnown).toContain("sc-research-completed-wreath");
  });

  it("strictly uses phrasing-only HTML markup (<span> + <svg>) and aria-hidden on all components", () => {
    const html = [
      renderToStaticMarkup(<ResearchGlyphAdvanced topicId="husbandry" status="open" />),
      renderToStaticMarkup(<ResearchGlyphAdvanced topicId="masonry" status="locked" />),
      renderToStaticMarkup(<ResearchGlyphAdvanced topicId="cartography" status="known" />),
      renderToStaticMarkup(<ResearchGlyphAdvanced topicId="drill" status="studying" progress={0.5} />),
    ].join("");

    expect(html).not.toMatch(/<(div|p|section|article|ul|li|dl|button)\b/);
    expect((html.match(/aria-hidden="true"/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });

  it("mounts research cards with data-study-state and living vector glyphs in ResearchBar", () => {
    const state = createGameState({ seed: 42 });
    state.buildings.push({ ...state.buildings[0], id: "b_acad", typeId: "academy", completesAtTick: null });
    state.flags.research_husbandry = 1;
    state.flags.research_forestry_until = state.meta.tick + 60;
    state.flags.research_forestry_total = 144;

    const html = renderToStaticMarkup(<ResearchBar state={state} act={() => {}} />);

    // Husbandry is completed
    expect(html).toContain('data-study="husbandry"');
    expect(html).toContain('data-study-state="completed"');

    // Forestry is studying
    expect(html).toContain('data-study="forestry"');
    expect(html).toContain('data-study-state="studying"');

    // Other studies are available or locked
    expect(html).toContain('data-study-state="available"');
    expect(html).toContain('data-study-state="locked"');

    // Living vector elements present in the cards
    expect(html).toContain("sc-research-lock-shackle");
    expect(html).toContain("sc-research-available-spark");
    expect(html).toContain("sc-research-completed-star");
  });

  it("enforces pointer-events: none, living keyframes, and reduced-motion guard in research-glyph-advanced.css", () => {
    const css = readTextFile("./research-glyph-advanced.css");

    // Strict pointer-events safety
    expect(css).toMatch(/\.sc-research-glyph-advanced[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-research-state-layer[\s\S]*?pointer-events:\s*none\s*!important/);

    // Living keyframe definitions
    expect(css).toContain("@keyframes sc-research-adv-lock-breathe");
    expect(css).toContain("@keyframes sc-research-adv-lock-rattle");
    expect(css).toContain("@keyframes sc-research-adv-avail-aura");
    expect(css).toContain("@keyframes sc-research-adv-beacon-wave");
    expect(css).toContain("@keyframes sc-research-adv-spark-twinkle");
    expect(css).toContain("@keyframes sc-research-adv-study-aura");
    expect(css).toContain("@keyframes sc-research-adv-flame-flicker");
    expect(css).toContain("@keyframes sc-research-adv-ring-pulse");
    expect(css).toContain("@keyframes sc-research-adv-complete-aura");
    expect(css).toContain("@keyframes sc-research-adv-triumph-star");
    expect(css).toContain("@keyframes sc-research-adv-wreath-breathe");

    // Reduced motion guard
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    // Strict isolation from theme.css
    const themeCss = readTextFile("../theme.css");
    expect(themeCss).not.toContain("sc-research-glyph-advanced");
    expect(themeCss).not.toContain("sc-research-state-layer");
    expect(themeCss).not.toContain("sc-research-lock-shackle");
  });
});
