import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WarLivingGlyph, WarLivingUnderlay } from "./WarLivingGlyph";
import { ForceCard } from "./ForceCard";
import { forceStatusRows } from "./ForceStatus";

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

describe("WarLivingUnderlay", () => {
  it("renders underlay for all force tones with aria-hidden", () => {
    for (const tone of ["hostile", "scout", "gather", "garrison"] as const) {
      const html = renderToStaticMarkup(<WarLivingUnderlay tone={tone} />);
      expect(html).toContain("sc-war-living-underlay");
      expect(html).toContain(`is-${tone}`);
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain("<svg");
    }
  });

  it("applies danger class when riskTone is danger or hostile tone", () => {
    const dangerHostile = renderToStaticMarkup(<WarLivingUnderlay tone="hostile" />);
    expect(dangerHostile).toContain("is-danger");

    const dangerGarrison = renderToStaticMarkup(<WarLivingUnderlay tone="garrison" riskTone="danger" />);
    expect(dangerGarrison).toContain("is-danger");

    const calmGarrison = renderToStaticMarkup(<WarLivingUnderlay tone="garrison" riskTone="calm" />);
    expect(calmGarrison).not.toContain("is-danger");
  });

  it("applies is-moving class when moving is true", () => {
    const moving = renderToStaticMarkup(<WarLivingUnderlay tone="scout" moving={true} />);
    expect(moving).toContain("is-moving");

    const stationary = renderToStaticMarkup(<WarLivingUnderlay tone="scout" moving={false} />);
    expect(stationary).not.toContain("is-moving");
  });
});

describe("WarLivingGlyph", () => {
  it("renders living war glyph for hostile with crossed blades and warning text", () => {
    const html = renderToStaticMarkup(<WarLivingGlyph tone="hostile" riskTone="danger" moving={true} />);
    expect(html).toContain("sc-war-status-glyph");
    expect(html).toContain("is-hostile");
    expect(html).toContain("is-danger");
    expect(html).toContain("is-moving");
    expect(html).toContain("Hostile march");
    expect(html).toContain("sc-war-glyph-sparkle");
  });

  it("renders living war glyph for scout with beacon sweep", () => {
    const movingHtml = renderToStaticMarkup(<WarLivingGlyph tone="scout" moving={true} />);
    expect(movingHtml).toContain("Vanguard sweep");

    const idleHtml = renderToStaticMarkup(<WarLivingGlyph tone="scout" moving={false} />);
    expect(idleHtml).toContain("Scout beacon");
  });

  it("renders gather party with load state awareness", () => {
    const ladenHtml = renderToStaticMarkup(<WarLivingGlyph tone="gather" loaded={true} />);
    expect(ladenHtml).toContain("Harvest laden");
    expect(ladenHtml).toContain("sc-war-glyph-sparkle");

    const emptyHtml = renderToStaticMarkup(<WarLivingGlyph tone="gather" empty={true} />);
    expect(emptyHtml).toContain("Empty haul");

    const defaultHtml = renderToStaticMarkup(<WarLivingGlyph tone="gather" />);
    expect(defaultHtml).toContain("Supply party");
  });

  it("renders garrison ward with danger awareness", () => {
    const safeHtml = renderToStaticMarkup(<WarLivingGlyph tone="garrison" riskTone="calm" />);
    expect(safeHtml).toContain("Bulwark ward");

    const alertHtml = renderToStaticMarkup(<WarLivingGlyph tone="garrison" riskTone="danger" />);
    expect(alertHtml).toContain("Ward breach alert");
  });
});

describe("ForceCard integration with living war glyphs", () => {
  it("renders both underlay and living glyph when status rows are present", () => {
    const rows = forceStatusRows({ power: 5, powerMax: 10, seconds: 4, risk: { value: "Low", tone: "calm" } });
    const html = renderToStaticMarkup(
      <ForceCard tone="scout" name="Vanguard" dest="2,3" seconds={4} status={rows} />,
    );
    expect(html).toContain("sc-war-living-underlay");
    expect(html).toContain("sc-war-status-glyph");
    expect(html).toContain("Vanguard sweep");
  });

  it("renders underlay but omits status glyph when no status rows are present", () => {
    const html = renderToStaticMarkup(<ForceCard tone="garrison" name="Garrison" dest="1,1" />);
    expect(html).toContain("sc-war-living-underlay");
    expect(html).not.toContain("sc-war-status-glyph");
  });
});

describe("war-living.css isolation & accessibility", () => {
  it("theme.css is untouched and does not contain war-living classes", () => {
    const themeCss = readCssFile("../theme.css");
    expect(themeCss).not.toContain("sc-war-living");
    expect(themeCss).not.toContain("sc-war-status-glyph");
    expect(themeCss).not.toContain("sc-war-pulse");
  });

  it("war-living.css includes reduced-motion guard and pointer-events: none", () => {
    const css = readCssFile("./war-living.css");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain("@keyframes sc-war-pulse");
    expect(css).toContain("@keyframes sc-war-drift");
    expect(css).toContain("@keyframes sc-war-danger-pulse");
  });
});
