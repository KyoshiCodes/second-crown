import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UnitLivingGlyph, UnitLivingUnderlay, getUnitFamily } from "./UnitLivingGlyph";
import { UnitCard } from "./UnitCard";
import { unitStatusRows } from "./UnitStatus";

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

function extractBlock(css: string, header: string): string {
  const idx = css.indexOf(header);
  if (idx < 0) return "";
  const open = css.indexOf("{", idx);
  if (open < 0) return "";
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return "";
}

describe("getUnitFamily", () => {
  it("classifies units into infantry, ranged, cavalry, and command", () => {
    expect(getUnitFamily("militia")).toBe("infantry");
    expect(getUnitFamily("spearman")).toBe("infantry");
    expect(getUnitFamily("warden")).toBe("infantry");

    expect(getUnitFamily("archer")).toBe("ranged");
    expect(getUnitFamily("ranger")).toBe("ranged");
    expect(getUnitFamily("skirmisher")).toBe("ranged");

    expect(getUnitFamily("scout")).toBe("cavalry");
    expect(getUnitFamily("knight")).toBe("cavalry");
    expect(getUnitFamily("lancer")).toBe("cavalry");
    expect(getUnitFamily("outrider")).toBe("cavalry");

    expect(getUnitFamily("banner")).toBe("command");
    expect(getUnitFamily("champion")).toBe("command");
  });
});

describe("UnitLivingUnderlay", () => {
  it("renders underlay for all families with aria-hidden and phrasing content only", () => {
    for (const typeId of ["spearman", "archer", "lancer", "banner"]) {
      const html = renderToStaticMarkup(
        <UnitLivingUnderlay typeId={typeId} open={true} affordable={true} />,
      );
      expect(html).toContain("sc-unit-living-underlay");
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain("<svg");
      expect(html).toContain('width="34"');
      expect(html).toContain('height="34"');
      expect(html).not.toMatch(/<(div|dl|dt|dd|p)\b/);
    }
  });

  it("applies correct state classes for locked, drilling, ready, and short", () => {
    const locked = renderToStaticMarkup(
      <UnitLivingUnderlay typeId="militia" open={false} affordable={false} />,
    );
    expect(locked).toContain("is-locked");

    const drilling = renderToStaticMarkup(
      <UnitLivingUnderlay typeId="militia" open={true} affordable={true} drilling={true} />,
    );
    expect(drilling).toContain("is-drilling");

    const ready = renderToStaticMarkup(
      <UnitLivingUnderlay typeId="militia" open={true} affordable={true} drilling={false} />,
    );
    expect(ready).toContain("is-ready");

    const short = renderToStaticMarkup(
      <UnitLivingUnderlay typeId="militia" open={true} affordable={false} drilling={false} />,
    );
    expect(short).toContain("is-short");
  });
});

describe("UnitLivingGlyph", () => {
  it("renders living unit glyph with heraldic flairs and compact 14px badge", () => {
    const locked = renderToStaticMarkup(
      <UnitLivingGlyph typeId="archer" open={false} affordable={false} />,
    );
    expect(locked).toContain("Sealed lore");
    expect(locked).toContain("is-locked");
    expect(locked).toContain('width="14"');
    expect(locked).not.toMatch(/<(div|dl|dt|dd|p)\b/);

    const drilling = renderToStaticMarkup(
      <UnitLivingGlyph typeId="lancer" open={true} affordable={true} drilling={true} />,
    );
    expect(drilling).toContain("Drilling cadre");
    expect(drilling).toContain("is-drilling");
    expect(drilling).toContain("sc-unit-glyph-sparkle");

    const ready = renderToStaticMarkup(
      <UnitLivingGlyph typeId="spearman" open={true} affordable={true} />,
    );
    expect(ready).toContain("Levy ready");
    expect(ready).toContain("is-ready");

    const short = renderToStaticMarkup(
      <UnitLivingGlyph typeId="banner" open={true} affordable={false} />,
    );
    expect(short).toContain("Stores short");
    expect(short).toContain("is-short");
  });
});

describe("UnitCard integration with living unit glyphs", () => {
  const baseStatus = unitStatusRows({
    power: 2,
    powerMax: 10,
    home: 5,
    away: 0,
    costText: "10 food",
    ticks: 40,
    qty: 1,
    open: true,
    lock: "",
    affordable: true,
    queueFull: false,
    drilling: 0,
  });

  it("renders both underlay and living glyph when status rows are present", () => {
    const html = renderToStaticMarkup(
      <UnitCard
        typeId="spearman"
        name="Spearman"
        power={2}
        cost={{ food: 10 }}
        ticks={40}
        open={true}
        lock=""
        affordable={true}
        onTrain={() => {}}
        status={baseStatus}
      />,
    );
    expect(html).toContain("sc-unit-living-underlay");
    expect(html).toContain("sc-unit-status-glyph");
    expect(html).toContain("Levy ready");
    // Crucial: inside <button>, no block tags allowed
    expect(html).not.toMatch(/<(div|dl|dt|dd|p)\b/);
  });

  it("renders underlay but omits status glyph when no status rows are present", () => {
    const html = renderToStaticMarkup(
      <UnitCard
        typeId="spearman"
        name="Spearman"
        power={2}
        cost={{ food: 10 }}
        ticks={40}
        open={true}
        lock=""
        affordable={true}
        onTrain={() => {}}
      />,
    );
    expect(html).toContain("sc-unit-living-underlay");
    expect(html).not.toContain("sc-unit-status-glyph");
    expect(html).not.toMatch(/<(div|dl|dt|dd|p)\b/);
  });
});

describe("unit-living.css isolation, contrast softening & accessibility", () => {
  it("theme.css is untouched and does not contain unit-living classes", () => {
    const themeCss = readCssFile("../theme.css");
    expect(themeCss).not.toContain("sc-unit-living");
    expect(themeCss).not.toContain("sc-unit-status-glyph");
    expect(themeCss).not.toContain("sc-unit-idle-breath");
  });

  it("unit-living.css includes reduced-motion guard and pointer-events: none", () => {
    const css = readCssFile("./unit-living.css");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain("@keyframes sc-unit-idle-breath");
    expect(css).toContain("@keyframes sc-unit-drilling-pulse");
  });

  it("confines underlay to a non-overlapping bottom-right corner pocket with radial mask", () => {
    const css = readCssFile("./unit-living.css");
    const underlayRule = extractBlock(css, ".sc-unit-living-underlay {");
    expect(underlayRule).not.toContain("inset: 0");
    expect(underlayRule).toContain("right: -2px");
    expect(underlayRule).toContain("bottom: -2px");
    expect(underlayRule).toContain("width: 34px");
    expect(underlayRule).toContain("height: 34px");
    expect(underlayRule).toContain("mask-image: radial-gradient");

    const stripRule = extractBlock(css, ".sc-unit-status-glyph {");
    expect(stripRule).toContain("justify-content: flex-start");
    expect(stripRule).toContain("padding: 3px 36px 1px 0");
  });

  it("caps underlay opacity and uses dedicated low-opacity keyframes so card text stays readable", () => {
    const css = readCssFile("./unit-living.css");

    // Wrapper opacity caps across states stay <= 0.35
    for (const selector of [
      ".sc-unit-living-underlay {",
      ".sc-unit-living-underlay.is-drilling {",
      ".sc-unit-living-underlay.is-short {",
      ".sc-unit-living-underlay.is-locked {",
    ]) {
      const block = extractBlock(css, selector);
      const match = block.match(/opacity:\s*([0-9.]+)/);
      expect(match).not.toBeNull();
      expect(Number(match![1])).toBeLessThanOrEqual(0.35);
    }

    // Underlay SVG uses dedicated low-opacity keyframes, never high-opacity icon keyframes
    const baseSvgRule = extractBlock(css, ".sc-unit-living-underlay svg {");
    expect(baseSvgRule).toContain("sc-unit-underlay-breath");
    expect(baseSvgRule).not.toContain("sc-unit-idle-breath");

    const drillSvgRule = extractBlock(css, ".sc-unit-living-underlay.is-drilling svg {");
    expect(drillSvgRule).toContain("sc-unit-underlay-pulse");
    expect(drillSvgRule).not.toContain("sc-unit-drilling-pulse");

    for (const kf of ["@keyframes sc-unit-underlay-breath", "@keyframes sc-unit-underlay-pulse"]) {
      const kfBlock = extractBlock(css, kf);
      const opacities = [...kfBlock.matchAll(/opacity:\s*([0-9.]+)/g)].map((m) => Number(m[1]));
      expect(opacities.length).toBeGreaterThanOrEqual(2);
      for (const op of opacities) {
        expect(op).toBeLessThan(0.6);
      }
    }
  });
});
