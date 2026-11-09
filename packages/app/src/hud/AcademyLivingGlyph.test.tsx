import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RESEARCH, createGameState } from "@second-crown/sim";
import {
  AcademyLecternLivingGlyph,
  StudyLivingGlyph,
  StudyLivingUnderlay,
  getResearchDiscipline,
  resolveAcademyLecternLiving,
  resolveStudyLiving,
  ResearchLivingGlyph,
  ResearchLivingUnderlay,
  ResearchTopicLivingGlyph,
  ResearchLecternLivingGlyph,
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

describe("AcademyLivingGlyph — living research glyphs under Academy lectern and Study cards", () => {
  it("maps every RESEARCH topic to its scholarly discipline", () => {
    expect(getResearchDiscipline("husbandry")).toBe("agronomy");
    expect(getResearchDiscipline("forestry")).toBe("agronomy");
    expect(getResearchDiscipline("masonry")).toBe("masonry");
    expect(getResearchDiscipline("logistics")).toBe("cartography");
    expect(getResearchDiscipline("surveying")).toBe("cartography");
    expect(getResearchDiscipline("fieldcraft")).toBe("tactics");
    expect(getResearchDiscipline("drill")).toBe("tactics");
    expect(getResearchDiscipline("screening")).toBe("tactics");
    expect(getResearchDiscipline("horse")).toBe("horsemanship");
    expect(getResearchDiscipline("siege")).toBe("siegecraft");
    expect(getResearchDiscipline("future_topic")).toBe("cartography");
  });

  it("resolves study card living states across studying, open, fast academy, known, and locked", () => {
    expect(resolveStudyLiving({ topicId: "husbandry", status: "studying" })).toEqual({
      topicId: "husbandry",
      discipline: "agronomy",
      status: "studying",
      academyFast: false,
      flair: "Agronomy folio · scribes ink",
    });
    expect(resolveStudyLiving({ topicId: "surveying", status: "open", academyFast: false })).toEqual({
      topicId: "surveying",
      discipline: "cartography",
      status: "open",
      academyFast: false,
      flair: "Astrolabe chart · lectern open",
    });
    expect(resolveStudyLiving({ topicId: "surveying", status: "open", academyFast: true })).toEqual({
      topicId: "surveying",
      discipline: "cartography",
      status: "open",
      academyFast: true,
      flair: "Astrolabe chart · lectern -20%",
    });
    expect(resolveStudyLiving({ topicId: "masonry", status: "known" })).toEqual({
      topicId: "masonry",
      discipline: "masonry",
      status: "known",
      academyFast: false,
      flair: "Ashlar treatise · codified",
    });
    expect(resolveStudyLiving({ topicId: "siege", status: "locked" })).toEqual({
      topicId: "siege",
      discipline: "siegecraft",
      status: "locked",
      academyFast: false,
      flair: "Poliorcetics scroll · hall sealed",
    });
  });

  it("resolves Academy lectern header modes across studying, mastered, academy, and field lectern", () => {
    expect(
      resolveAcademyLecternLiving({ activeName: "Husbandry", knownCount: 2, totalCount: 10, academyCount: 1 }),
    ).toEqual({
      mode: "studying",
      flair: "Lectern lamp lit · studying Husbandry · 2/10 codified",
    });
    expect(resolveAcademyLecternLiving({ knownCount: 10, totalCount: 10, academyCount: 1 })).toEqual({
      mode: "mastered",
      flair: "Academy codex complete · all 10 studies codified",
    });
    expect(resolveAcademyLecternLiving({ knownCount: 3, totalCount: 10, academyCount: 1 })).toEqual({
      mode: "academy",
      flair: "Academy armillary · -20% study pace · 3/10 codified",
    });
    expect(resolveAcademyLecternLiving({ knownCount: 0, totalCount: 10, academyCount: 0 })).toEqual({
      mode: "field",
      flair: "Field lectern · base study pace · 0/10 codified",
    });
  });

  it("renders distinct SVG artwork with glow, drift, and pulse layers across all 10 research topics", () => {
    const topicIds = Object.keys(RESEARCH);
    expect(topicIds.length).toBe(10);

    const svgs = topicIds.map((topicId) => {
      const html = renderToStaticMarkup(<StudyLivingGlyph topicId={topicId} status="open" />);
      expect(html).toContain("sc-academy-glow-layer");
      expect(html).toContain("sc-academy-drift-layer");
      expect(html).toContain("sc-academy-pulse-layer");
      const start = html.indexOf("<svg");
      const end = html.indexOf("</svg>") + 6;
      return html.slice(start, end);
    });
    expect(new Set(svgs).size).toBe(10);
  });

  it("uses phrasing-only markup (<span> + <svg>) and aria-hidden on all decorative components", () => {
    const html = [
      renderToStaticMarkup(<AcademyLecternLivingGlyph knownCount={1} totalCount={10} academyCount={1} />),
      renderToStaticMarkup(<StudyLivingUnderlay topicId="masonry" status="open" academyFast />),
      renderToStaticMarkup(<StudyLivingGlyph topicId="horse" status="studying" />),
    ].join("");

    expect(html).not.toMatch(/<(div|p|section|article|ul|li|dl|button)\b/);
    expect((html.match(/aria-hidden="true"/g) ?? []).length).toBe(3);
  });

  it("mounts AcademyLecternLivingGlyph and per-topic StudyLivingGlyph under StudyLedger in ResearchBar without mutating GameState", () => {
    const state = createGameState({ seed: 42 });
    state.buildings.push({ ...state.buildings[0], id: "b_acad", typeId: "academy", completesAtTick: null });
    state.flags.research_husbandry = 1;
    state.flags.research_forestry_until = state.meta.tick + 60;
    state.flags.research_forestry_total = 144;

    const before = JSON.stringify(state);
    const html = renderToStaticMarkup(<ResearchBar state={state} act={() => {}} />);

    expect(JSON.stringify(state)).toBe(before);
    expect(html).toContain('data-lectern-mode="studying"');
    expect(html).toContain("Lectern lamp lit · studying Forestry · 1/10 codified");
    expect(html).toContain("Agronomy folio · codified");
    expect(html).toContain("Silviculture folio · scribes ink");
    expect(html).toContain("Ashlar treatise · lectern -20%");
    expect((html.match(/data-study-watermark="/g) ?? []).length).toBe(10);
    expect((html.match(/data-study-glyph="/g) ?? []).length).toBe(10);

    // Ensure StudyLivingGlyph sits after the living study rows and before the Study button on an open card
    const masonryStart = html.indexOf('data-study="masonry"');
    const logisticsStart = html.indexOf('data-study="logistics"');
    const masonryCard = html.slice(masonryStart, logisticsStart);
    const ledgerIdx = masonryCard.indexOf("sc-study-living-head");
    const glyphIdx = masonryCard.indexOf("sc-academy-topic-glyph");
    const btnIdx = masonryCard.indexOf("Study masonry (");
    expect(ledgerIdx).toBeGreaterThan(0);
    expect(glyphIdx).toBeGreaterThan(ledgerIdx);
    expect(btnIdx).toBeGreaterThan(glyphIdx);
  });

  it("confines study card watermarks to a low-opacity bottom-right pocket so text never obscures", () => {
    const css = readTextFile("./academy-glyph-living.css");
    expect(css).toMatch(/\.sc-academy-living-underlay\s*\{[^}]*width:\s*30px/s);
    expect(css).toMatch(/\.sc-academy-living-underlay\s*\{[^}]*height:\s*30px/s);
    expect(css).toMatch(/\.sc-academy-living-underlay\s*\{[^}]*right:\s*-2px/s);
    expect(css).toMatch(/\.sc-academy-living-underlay\s*\{[^}]*bottom:\s*-2px/s);
    expect(css).toContain("mask-image: radial-gradient");

    const wrapperOpacities = [
      ...css.matchAll(/\.sc-academy-living-underlay(?:\.[a-z-]+)*\s*\{[^}]*?opacity:\s*([0-9.]+)/gs),
    ].map((m) => Number(m[1]));
    expect(wrapperOpacities.length).toBeGreaterThanOrEqual(4);
    for (const op of wrapperOpacities) {
      expect(op).toBeLessThanOrEqual(0.25);
    }

    for (const kf of ["sc-academy-underlay-drift", "sc-academy-underlay-pulse"]) {
      const block = css.slice(css.indexOf(`@keyframes ${kf}`));
      const end = block.indexOf("\n}\n");
      const kfBody = block.slice(0, end > 0 ? end : 260);
      const kfOpacities = [...kfBody.matchAll(/opacity:\s*([0-9.]+)/g)].map((m) => Number(m[1]));
      expect(kfOpacities.length).toBeGreaterThanOrEqual(2);
      for (const op of kfOpacities) {
        expect(op).toBeLessThanOrEqual(0.55);
      }
    }
  });

  it("enforces pointer-events: none, reduced-motion support, and strict isolation from theme.css", () => {
    const css = readTextFile("./academy-glyph-living.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-academy-glyph-glow");
    expect(css).toContain("@keyframes sc-academy-glyph-drift");
    expect(css).toContain("@keyframes sc-academy-glyph-pulse");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    const themeCss = readTextFile("../theme.css");
    expect(themeCss).not.toContain("sc-academy-living-underlay");
    expect(themeCss).not.toContain("sc-academy-topic-glyph");
    expect(themeCss).not.toContain("sc-academy-lectern-glyph");
  });

  it("exposes ResearchLivingGlyph and ResearchLivingUnderlay aliases with living glow, drift, and pulse layers", () => {
    const glyphHtml = renderToStaticMarkup(<ResearchLivingGlyph topicId="husbandry" status="studying" />);
    expect(glyphHtml).toContain("sc-research-living-glyph");
    expect(glyphHtml).toContain("sc-research-topic-glyph");
    expect(glyphHtml).toContain("sc-research-glow-layer");
    expect(glyphHtml).toContain("sc-research-drift-layer");
    expect(glyphHtml).toContain("sc-research-pulse-layer");
    expect(glyphHtml).toContain('aria-hidden="true"');

    const underlayHtml = renderToStaticMarkup(<ResearchLivingUnderlay topicId="masonry" status="open" />);
    expect(underlayHtml).toContain("sc-research-living-underlay");
    expect(underlayHtml).toContain("sc-research-underlay-svg");
    expect(underlayHtml).toContain('aria-hidden="true"');

    const lecternHtml = renderToStaticMarkup(<ResearchLecternLivingGlyph knownCount={2} totalCount={10} academyCount={1} />);
    expect(lecternHtml).toContain("sc-academy-lectern-glyph");
    expect(lecternHtml).toContain("sc-research-glow-layer");
  });

  it("ResearchBar renders cards with sc-research-living-card and research living decorative layers", () => {
    const state = createGameState({ seed: 42 });
    const html = renderToStaticMarkup(<ResearchBar state={state} act={() => {}} />);
    expect(html).toContain("sc-research-living-card");
    expect(html).toContain("sc-research-living-underlay");
    expect(html).toContain("sc-research-living-glyph");
    expect(html).toContain("sc-research-glow-layer");
  });

  it("strictly isolates research living styles from theme.css and enforces pointer-events: none", () => {
    const academyCss = readTextFile("./academy-glyph-living.css");
    expect(academyCss).toContain(".sc-research-living-underlay");
    expect(academyCss).toContain(".sc-research-living-glyph");
    expect(academyCss).toContain(".sc-research-glow-layer");
    expect(academyCss).toContain("pointer-events: none !important;");

    const softenCss = readTextFile("./living-glyph-soften.css");
    expect(softenCss).toContain(".sc-research-living-underlay");
    expect(softenCss).toContain(".sc-research-glow-layer");

    const themeCss = readTextFile("../theme.css");
    expect(themeCss).not.toContain("sc-research-living-underlay");
    expect(themeCss).not.toContain("sc-research-living-glyph");
    expect(themeCss).not.toContain("sc-research-glow-layer");
  });
});
