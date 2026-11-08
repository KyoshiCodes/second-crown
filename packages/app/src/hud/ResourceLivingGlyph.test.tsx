import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ResourceLivingGlyph,
  ResourceLivingUnderlay,
  resolveResourceGlyphDescriptorByValues,
  resolveResourceGlyphDescriptor,
} from "./ResourceLivingGlyph";
import { ResourceHud } from "./ResourceHud";

describe("ResourceLivingGlyph", () => {
  it("resolves default descriptors for all four resources", () => {
    const foodDesc = resolveResourceGlyphDescriptorByValues("food", "1200", "3");
    expect(foodDesc.label).toBe("Harvest sheaf");
    expect(foodDesc.mood).toBe("earning");
    expect(foodDesc.flair).toContain("+3/s");
    expect(foodDesc.motion).toBe("drift");

    const woodDesc = resolveResourceGlyphDescriptorByValues("wood", "50", "0");
    expect(woodDesc.label).toBe("Timber cord");
    expect(woodDesc.mood).toBe("idle");
    expect(woodDesc.flair).toBe("Timber stacked · idle hauling");
    expect(woodDesc.motion).toBe("calm");

    const stoneDesc = resolveResourceGlyphDescriptorByValues("stone", "100", "2.5");
    expect(stoneDesc.label).toBe("Ashlar cairn");
    expect(stoneDesc.mood).toBe("earning");
    expect(stoneDesc.flair).toContain("+2.5/s");

    const goldDesc = resolveResourceGlyphDescriptorByValues("gold", "0", "0");
    expect(goldDesc.label).toBe("Crown mint");
    expect(goldDesc.mood).toBe("empty");
    expect(goldDesc.tone).toBe("danger");
    expect(goldDesc.flair).toBe("Coffers empty · royal debt");
    expect(goldDesc.motion).toBe("pulse");
  });

  it("handles empty / bare states with danger tone and alert pulse", () => {
    const foodEmpty = resolveResourceGlyphDescriptorByValues("food", "0", "0", true);
    expect(foodEmpty.mood).toBe("empty");
    expect(foodEmpty.tone).toBe("danger");
    expect(foodEmpty.flair).toBe("Larder bare · host famished");
    expect(foodEmpty.motion).toBe("pulse");

    const woodEmpty = resolveResourceGlyphDescriptorByValues("wood", "0", "0");
    expect(woodEmpty.mood).toBe("empty");
    expect(woodEmpty.flair).toBe("Timber dry · cordwood bare");

    const stoneEmpty = resolveResourceGlyphDescriptorByValues("stone", "0", "0");
    expect(stoneEmpty.mood).toBe("empty");
    expect(stoneEmpty.flair).toBe("Quarry bare · unworked pits");
  });

  it("handles full / capped states with warn tone and alert pulse", () => {
    const foodFull = resolveResourceGlyphDescriptorByValues("food", "5000", "5", false, true);
    expect(foodFull.mood).toBe("full");
    expect(foodFull.tone).toBe("warn");
    expect(foodFull.flair).toBe("Granary full · stores capped");
    expect(foodFull.motion).toBe("pulse");

    const woodFull = resolveResourceGlyphDescriptorByValues("wood", "2000", "0", false, true);
    expect(woodFull.mood).toBe("full");
    expect(woodFull.flair).toBe("Yard piled · capacity capped");

    const stoneFull = resolveResourceGlyphDescriptorByValues("stone", "2000", "0", false, true);
    expect(stoneFull.mood).toBe("full");
    expect(stoneFull.flair).toBe("Crypt gorged · capacity capped");

    const goldFull = resolveResourceGlyphDescriptorByValues("gold", "1000", "1", false, true);
    expect(goldFull.mood).toBe("full");
    expect(goldFull.flair).toBe("Treasury overflowing · capacity capped");
  });

  it("renders 14x14 living glyph markup with aria-hidden and pointer-events none", () => {
    const html = renderToStaticMarkup(
      <ResourceLivingGlyph resource="food" have="150" income="2" />
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events:none");
    expect(html).toContain("sc-resource-living-glyph");
    expect(html).toContain("sc-resource-glow-layer");
    expect(html).toContain("Harvest sheaf");
    expect(html).toContain("Harvest flowing · +2/s");
    expect(html).toContain("viewBox=\"0 0 14 14\"");
  });

  it("renders 34x34 watermark underlay with aria-hidden and pointer-events none", () => {
    const html = renderToStaticMarkup(
      <ResourceLivingUnderlay resource="food" mood="earning" />
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events:none");
    expect(html).toContain("sc-resource-living-underlay");
    expect(html).toContain("viewBox=\"0 0 34 34\"");
  });

  it("integrates both underlays and glyphs inside ResourceHud for each resource", () => {
    const resources = { food: "1200", wood: "40", stone: "0", gold: "7.5" };
    const income = { food: "3", wood: "0", stone: "0", gold: "1.5" };
    const html = renderToStaticMarkup(<ResourceHud resources={resources} income={income} />);

    for (const r of ["food", "wood", "stone", "gold"] as const) {
      expect(html).toContain(`sc-resource-living-underlay is-${r}`);
      expect(html).toContain(`sc-resource-living-glyph is-${r}`);
    }

    // Verify flairs
    expect(html).toContain("Harvest flowing · +3/s");
    expect(html).toContain("Timber stacked · idle hauling");
    expect(html).toContain("Quarry bare · unworked pits");
    expect(html).toContain("Tribute minted · +1.5/s");
  });
});
