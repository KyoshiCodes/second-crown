import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import {
  CultureUnitChip,
  CULTURE_UNIQUE_UNITS,
  UNIT_TO_CULTURE,
  isCultureUniqueUnit,
  cultureForUniqueUnit,
} from "./CultureUnitChip";

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

describe("CultureUnitChip (bakeoff/gemini-culture-units)", () => {
  it("exports culture mapping constants and helper functions", () => {
    expect(CULTURE_UNIQUE_UNITS.mist).toBe("ranger");
    expect(CULTURE_UNIQUE_UNITS.glen).toBe("banner");
    expect(CULTURE_UNIQUE_UNITS.salt).toBe("outrider");
    expect(CULTURE_UNIQUE_UNITS.fen).toBe("warden");
    expect(CULTURE_UNIQUE_UNITS.peak).toBe("lancer");

    expect(UNIT_TO_CULTURE.ranger).toBe("mist");
    expect(UNIT_TO_CULTURE.banner).toBe("glen");
    expect(UNIT_TO_CULTURE.outrider).toBe("salt");
    expect(UNIT_TO_CULTURE.warden).toBe("fen");
    expect(UNIT_TO_CULTURE.lancer).toBe("peak");

    expect(isCultureUniqueUnit("ranger")).toBe(true);
    expect(isCultureUniqueUnit("banner")).toBe(true);
    expect(isCultureUniqueUnit("outrider")).toBe(true);
    expect(isCultureUniqueUnit("warden")).toBe(true);
    expect(isCultureUniqueUnit("lancer")).toBe(true);
    expect(isCultureUniqueUnit("spearman")).toBe(false);

    expect(cultureForUniqueUnit("ranger")).toBe("mist");
    expect(cultureForUniqueUnit("lancer")).toBe("peak");
    expect(cultureForUniqueUnit("militia")).toBeNull();
  });

  it("renders distinct 28px living chip for Mist Reach (Ranger)", () => {
    const html = renderToStaticMarkup(<CultureUnitChip cultureId="mist" size={28} open={true} />);
    expect(html).toContain('data-culture-unit-chip="true"');
    expect(html).toContain('data-unit-culture="mist"');
    expect(html).toContain('data-unit="ranger"');
    expect(html).toContain("sc-ranger-chip-wrapper");
    expect(html).toContain("sc-ranger-glow-layer");
    expect(html).toContain("sc-ranger-drift-layer");
    expect(html).toContain("sc-ranger-pulse-layer");
    expect(html).toContain('width="28"');
    expect(html).toContain('height="28"');
  });

  it("renders distinct 28px living chip for Glen Holds (Banner)", () => {
    const html = renderToStaticMarkup(<CultureUnitChip cultureId="glen" size={28} open={true} />);
    expect(html).toContain('data-culture-unit-chip="true"');
    expect(html).toContain('data-unit-culture="glen"');
    expect(html).toContain('data-unit="banner"');
    expect(html).toContain("sc-banner-chip-wrapper");
    expect(html).toContain("sc-banner-glow-layer");
    expect(html).toContain("sc-banner-pennant");
    expect(html).toContain("sc-banner-glint-layer");
    expect(html).toContain("sc-banner-drift-layer");
  });

  it("renders distinct 28px living chip for Salt Reaches (Outrider)", () => {
    const html = renderToStaticMarkup(<CultureUnitChip cultureId="salt" size={28} open={true} />);
    expect(html).toContain('data-culture-unit-chip="true"');
    expect(html).toContain('data-unit-culture="salt"');
    expect(html).toContain('data-unit="outrider"');
    expect(html).toContain("sc-outrider-chip-wrapper");
    expect(html).toContain("sc-outrider-glow-layer");
    expect(html).toContain("sc-outrider-drift-layer");
    expect(html).toContain("sc-outrider-pulse-layer");
  });

  it("renders distinct 28px living chip for Fen Steads (Warden)", () => {
    const html = renderToStaticMarkup(<CultureUnitChip cultureId="fen" size={28} open={true} />);
    expect(html).toContain('data-culture-unit-chip="true"');
    expect(html).toContain('data-unit-culture="fen"');
    expect(html).toContain('data-unit="warden"');
    expect(html).toContain("sc-warden-chip-wrapper");
    expect(html).toContain("sc-warden-glow-layer");
    expect(html).toContain("sc-warden-sway-layer");
    expect(html).toContain("sc-warden-glint-layer");
  });

  it("renders distinct 28px living chip for Peak Holds (Lancer)", () => {
    const html = renderToStaticMarkup(<CultureUnitChip cultureId="peak" size={28} open={true} />);
    expect(html).toContain('data-culture-unit-chip="true"');
    expect(html).toContain('data-unit-culture="peak"');
    expect(html).toContain('data-unit="lancer"');
    expect(html).toContain("sc-lancer-chip-wrapper");
    expect(html).toContain("sc-lancer-glow-layer");
    expect(html).toContain("sc-lancer-drift-layer");
    expect(html).toContain("sc-lancer-glint-layer");
  });

  it("resolves unit by unitId directly", () => {
    const html = renderToStaticMarkup(<CultureUnitChip unitId="lancer" size={28} open={true} />);
    expect(html).toContain('data-unit-culture="peak"');
    expect(html).toContain('data-unit="lancer"');
    expect(html).toContain("sc-lancer-chip-wrapper");
  });

  it("returns null for base cultures without unique units", () => {
    expect(renderToStaticMarkup(<CultureUnitChip cultureId="western" />)).toBe("");
    expect(renderToStaticMarkup(<CultureUnitChip cultureId="woodland" />)).toBe("");
    expect(renderToStaticMarkup(<CultureUnitChip cultureId="desert" />)).toBe("");
    expect(renderToStaticMarkup(<CultureUnitChip cultureId="steppe" />)).toBe("");
    expect(renderToStaticMarkup(<CultureUnitChip cultureId="tide" />)).toBe("");
  });

  it("renders locked state without living open glow when open is false", () => {
    const html = renderToStaticMarkup(<CultureUnitChip cultureId="mist" open={false} />);
    expect(html).toContain("is-locked");
    expect(html).toContain('data-open="false"');
    expect(html).not.toContain("sc-ranger-glow-layer");
  });

  it("enforces pointer-events: none and reduced motion in all chip CSS files", () => {
    const cssFiles = [
      "./ranger-chip.css",
      "./banner-chip.css",
      "./outrider-chip.css",
      "./warden-chip.css",
      "./lancer-chip.css",
      "./culture-unit-chip.css",
    ];

    for (const file of cssFiles) {
      const css = readCssFile(file);
      expect(css).toContain("pointer-events: none !important");
      expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    }
  });
});
