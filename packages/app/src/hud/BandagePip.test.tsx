import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { BandagePip, WoundedChip, WoundedUnitChip } from "./BandagePip";
import { UnitCard } from "./UnitCard";

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

describe("BandagePip & living heal glow", () => {
  it("renders phrasing-only markup with aria-hidden and data attributes", () => {
    const html = renderToStaticMarkup(<BandagePip size={16} wounded={true} active={false} />);
    expect(html).toContain('class="sc-bandage-pip is-calm has-wounded "');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-bandage-pip="true"');
    expect(html).toContain('data-wounded="true"');
    expect(html).toContain('data-healing="false"');
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('width="16"');
    expect(html).toContain('height="16"');
  });

  it("renders living emerald glow, aura ring, and motes when active and wounded", () => {
    const html = renderToStaticMarkup(<BandagePip size={20} wounded={true} active={true} />);
    expect(html).toContain('class="sc-bandage-pip is-healing has-wounded "');
    expect(html).toContain('data-healing="true"');
    expect(html).toContain('sc-heal-glow-layer');
    expect(html).toContain('sc-heal-aura-ring');
    expect(html).toContain('sc-heal-drift-layer');
  });

  it("does not render heal glow layers when wounded is false", () => {
    const html = renderToStaticMarkup(<BandagePip size={16} wounded={false} active={true} />);
    expect(html).toContain('class="sc-bandage-pip is-calm is-idle "');
    expect(html).toContain('data-healing="false"');
    expect(html).not.toContain('sc-heal-glow-layer');
  });

  it("exports WoundedChip and WoundedUnitChip aliases", () => {
    expect(WoundedChip).toBe(BandagePip);
    expect(WoundedUnitChip).toBe(BandagePip);
  });

  it("renders bandage badge and living glow on UnitCard when wounded and healing", () => {
    const html = renderToStaticMarkup(
      <UnitCard
        typeId="militia"
        name="Militia"
        power={1}
        cost={{ food: 10 }}
        ticks={10}
        open={true}
        lock=""
        affordable={true}
        onTrain={() => {}}
        wounded={4}
        healing={true}
      />
    );

    expect(html).toContain("sc-unit-art sc-unit-art-wrapper has-wounded is-healing");
    expect(html).toContain("sc-unit-chip-bandage-badge");
    expect(html).toContain("sc-bandage-pip is-healing has-wounded");
  });

  it("does not render bandage badge on UnitCard when wounded is 0", () => {
    const html = renderToStaticMarkup(
      <UnitCard
        typeId="ranger"
        name="Ranger"
        power={4}
        cost={{ gold: 20 }}
        ticks={20}
        open={true}
        lock=""
        affordable={true}
        onTrain={() => {}}
        wounded={0}
        healing={false}
      />
    );

    expect(html).not.toContain("sc-unit-chip-bandage-badge");
    expect(html).not.toContain("has-wounded");
    expect(html).not.toContain("is-healing");
  });

  it("enforces pointer-events: none and reduced motion in infirmary-heal-living.css", () => {
    const css = readCssFile("./infirmary-heal-living.css");

    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("sc-heal-glow-breathe");
    expect(css).toContain("sc-heal-aura-spin");
    expect(css).toContain("sc-heal-mote-rise");
    expect(css).toContain("sc-heal-chip-pulse");
  });
});
