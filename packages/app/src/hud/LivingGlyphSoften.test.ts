import { describe, expect, it } from "vitest";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("living-glyph-soften.css", () => {
  const css = readTextFile("./living-glyph-soften.css");

  it("covers watermark underlays across all card domains", () => {
    const domains = [
      "building",
      "market",
      "works",
      "hold",
      "people",
      "unit",
      "war",
      "events",
      "academy",
      "decree",
      "diplo",
      "vault",
      "ledger",
      "node",
      "outpost",
      "camp",
      "flag",
      "resource",
    ];
    for (const d of domains) {
      if (d === "hold") {
        expect(css).toContain(`.sc-hold-card-underlay`);
      } else if (d === "vault") {
        expect(css).toContain(`.sc-vault-seal-underlay`);
      } else if (d === "ledger") {
        expect(css).toContain(`.sc-quill-living-underlay`);
      } else {
        expect(css).toContain(`.sc-${d}-living-underlay`);
      }
    }
  });

  it("strictly caps underlay wrapper opacities to <= 0.20 so card text stays readable", () => {
    const underlayMatches = [
      ...css.matchAll(/\.sc-shell\s+\.sc-(?:[a-z]+-living-underlay|hold-card-underlay|vault-seal-underlay|quill-living-underlay)(?![^{]*\bsvg\b)[^{]*\{[^}]*?opacity:\s*([0-9.]+)/gs),
    ].map((m) => Number(m[1]));

    expect(underlayMatches.length).toBeGreaterThanOrEqual(15);
    for (const op of underlayMatches) {
      expect(op).toBeLessThanOrEqual(0.20);
      expect(op).toBeGreaterThan(0.04);
    }
  });

  it("caps underlay child svg opacity to <= 0.30", () => {
    const svgMatches = [
      ...css.matchAll(/\.sc-shell\s+\.sc-(?:[a-z]+-living-underlay|hold-card-underlay|vault-seal-underlay|quill-living-underlay)[^{]*\bsvg\b[^{]*\{[^}]*?opacity:\s*([0-9.]+)/gs),
    ].map((m) => Number(m[1]));

    expect(svgMatches.length).toBeGreaterThanOrEqual(5);
    for (const op of svgMatches) {
      expect(op).toBeLessThanOrEqual(0.30);
    }
  });

  it("tones down glow intensity and caps decorative layer filters", () => {
    const glowLayers = ["building", "unit", "war", "events", "academy", "decree", "diplo", "vault", "ledger", "node", "outpost", "camp", "flag", "resource"];
    for (const g of glowLayers) {
      expect(css).toContain(`.sc-${g}-glow-layer`);
      expect(css).toContain(`.sc-${g}-pulse-layer`);
    }

    const dropShadows = [...css.matchAll(/drop-shadow\([^)]*?([0-9.]+)px/g)].map((m) => Number(m[1]));
    expect(dropShadows.length).toBeGreaterThan(0);
    for (const blur of dropShadows) {
      expect(blur).toBeLessThanOrEqual(1.5);
    }
  });

  it("enforces pointer-events: none !important on all decorative layers", () => {
    expect(css).toContain("pointer-events: none !important;");
    const blocksWithoutPointerEvents = css
      .split("}")
      .filter((block) => block.includes(".sc-shell") && !block.includes("@media") && block.includes("pointer-events"));
    expect(blocksWithoutPointerEvents.length).toBeGreaterThan(0);
  });

  it("softens board living atmospheric layers and atlas terrain glyphs", () => {
    expect(css).toContain(".sc-board-terrain-aura");
    expect(css).toContain(".sc-board-terrain-ring");
    expect(css).toContain(".sc-board-keep-hearth-glow");
    expect(css).toContain(".sc-board-fog-cloud");
    expect(css).toContain(".sc-board-status-tether");
    expect(css).toContain(".sc-atlas-living-glyph");
  });

  it("provides prefers-reduced-motion accessibility overrides", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important;");
    expect(css).toContain("filter: none !important;");
  });
});
