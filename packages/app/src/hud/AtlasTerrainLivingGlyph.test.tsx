import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, isProvinceSeen } from "@second-crown/sim";
import {
  AtlasTerrainLivingGlyph,
  AtlasTerrainUnderlay,
  resolveAtlasTerrainLiving,
  type AtlasTerrainKind,
} from "./AtlasTerrainLivingGlyph";
import { AtlasProvinceCard, AtlasProvinceCards } from "./AtlasProvinceCard";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function fresh() {
  return createGameState({ seed: 1 });
}

describe("resolveAtlasTerrainLiving", () => {
  it("resolves distinct descriptors across all six terrain types when seen", () => {
    const terrains: AtlasTerrainKind[] = ["plain", "wood", "hill", "waste", "shore", "peak"];
    const descs = terrains.map((t) => resolveAtlasTerrainLiving({ terrain: t, seen: true }));

    expect(new Set(descs.map((d) => d.kind)).size).toBe(6);
    expect(new Set(descs.map((d) => d.color)).size).toBe(6);
    expect(new Set(descs.map((d) => d.label)).size).toBe(6);

    const plain = descs.find((d) => d.kind === "plain")!;
    expect(plain.motion).toBe("drift");
    expect(plain.color).toBe("#22c55e");

    const hill = descs.find((d) => d.kind === "hill")!;
    expect(hill.motion).toBe("pulse");
    expect(hill.color).toBe("#ca8a04");
  });

  it("resolves fog descriptor when province is unseen", () => {
    const desc = resolveAtlasTerrainLiving({ terrain: "wood", seen: false });
    expect(desc.kind).toBe("fog");
    expect(desc.label).toBe("Uncharted");
    expect(desc.flair).toContain("Veiled in mist");
    expect(desc.color).toBe("#94a3b8");
  });

  it("tailors flairs to special nodes like fields, woodcuts, quarries, ruins, and camps", () => {
    const field = resolveAtlasTerrainLiving({ terrain: "plain", node: "field", seen: true });
    expect(field.flair).toContain("Forage pasture");

    const woodcut = resolveAtlasTerrainLiving({ terrain: "wood", node: "woodcut", seen: true });
    expect(woodcut.flair).toContain("Timber stand");

    const quarry = resolveAtlasTerrainLiving({ terrain: "hill", node: "quarry", seen: true });
    expect(quarry.flair).toContain("Stone quarry");

    const ruins = resolveAtlasTerrainLiving({ terrain: "waste", node: "ruins", seen: true });
    expect(ruins.flair).toContain("Ancient ruins");

    const camp = resolveAtlasTerrainLiving({ terrain: "waste", node: "camp", seen: true });
    expect(camp.flair).toContain("Hostile camp");
  });

  it("tailors flairs for the player's home hold", () => {
    const homePlain = resolveAtlasTerrainLiving({ terrain: "plain", seen: true, isHome: true });
    expect(homePlain.flair).toContain("Home pastures");

    const homeWood = resolveAtlasTerrainLiving({ terrain: "wood", seen: true, isHome: true });
    expect(homeWood.flair).toContain("Home timber");
  });
});

describe("AtlasTerrainUnderlay & AtlasTerrainLivingGlyph", () => {
  it("renders distinct SVG geometries across all terrain kinds", () => {
    const kinds: AtlasTerrainKind[] = ["plain", "wood", "hill", "waste", "shore", "peak", "fog"];
    const underlays = kinds.map((k) =>
      renderToStaticMarkup(<AtlasTerrainUnderlay terrain={k} seen={k !== "fog"} />)
    );
    expect(new Set(underlays).size).toBe(7);

    const glyphs = kinds.map((k) =>
      renderToStaticMarkup(<AtlasTerrainLivingGlyph terrain={k} seen={k !== "fog"} />)
    );
    expect(new Set(glyphs).size).toBe(7);
  });

  it("marks all decorative layers aria-hidden and uses phrasing-only markup", () => {
    const u = renderToStaticMarkup(<AtlasTerrainUnderlay terrain="wood" seen={true} />);
    const g = renderToStaticMarkup(<AtlasTerrainLivingGlyph terrain="wood" seen={true} />);

    expect(u).toContain('aria-hidden="true"');
    expect(g).toContain('aria-hidden="true"');
    expect(u).not.toMatch(/<(p|section|article|button)\b/);
  });

  it("integrates seamlessly into AtlasProvinceCard and AtlasProvinceCards", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<AtlasProvinceCards state={s} selectedId={s.board.homeProvinceId} />);

    expect(html).toContain("sc-atlas-card is-selected is-living");
    expect(html).toContain("sc-atlas-terrain-underlay");
    expect(html).toContain("sc-atlas-terrain-glyph");
    expect(html).toContain("Home pastures");
    expect(html).toContain("sc-atlas-glow-layer");
  });

  it("renders fog underlay and uncharted flair for unseen provinces", () => {
    const s = fresh();
    const unseen = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId && !isProvinceSeen(s, p.id))!;
    expect(unseen).toBeDefined();

    const html = renderToStaticMarkup(<AtlasProvinceCard state={s} provinceId={unseen.id} role="selected" />);
    expect(html).toContain("terrain-fog");
    expect(html).toContain("Veiled in mist");
  });

  it("enforces pointer-events: none, capped low opacity, and theme isolation", () => {
    const css = readTextFile("./atlas-living.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain(".sc-atlas-terrain-underlay");
    expect(css).toContain(".sc-atlas-terrain-glyph");
    expect(css).toContain("mask-image: radial-gradient");
    expect(css).toContain("@keyframes sc-atlas-underlay-breathe");
    expect(css).toContain("@keyframes sc-atlas-terrain-drift");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    const opacityMatch = /opacity:\s*([0-9.]+);/.exec(
      css.slice(css.indexOf(".sc-atlas-terrain-underlay {"))
    );
    expect(opacityMatch).not.toBeNull();
    const underlayOpacity = Number(opacityMatch![1]);
    expect(underlayOpacity).toBeLessThanOrEqual(0.20);

    const themeCss = readTextFile("../theme.css");
    expect(themeCss).not.toContain("sc-atlas-terrain");
    expect(themeCss).not.toContain("sc-atlas-card");
  });
});
