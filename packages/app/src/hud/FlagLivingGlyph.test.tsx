import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  createGameState,
  listOutposts,
  plantOutpost,
  type GameState,
} from "@second-crown/sim";
import {
  FlagLivingGlyph,
  FlagLivingUnderlay,
  resolveFlagGlyphDescriptor,
  resolveFlagGlyphDescriptorByValues,
} from "./FlagLivingGlyph";
import { OutpostLivingCard } from "./OutpostLivingCard";

function readFile(relativePath: string): string {
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

function withFlagState(node = "field"): { s: GameState; id: string } {
  const s = createGameState({ seed: 77 });
  const p = s.board.provinces.find((x) => x.id !== s.board.homeProvinceId && x.node === node)!;
  plantOutpost(s, p);
  const flag = listOutposts(s).find((o) => o.id === p.id)!;
  s.flags["garrisons_json"] = JSON.stringify([{ provinceId: flag.id, force: { militia: 5 } }]);
  return { s, id: flag.id };
}

const tileOf = (s: GameState, id: string) => s.board.provinces.find((p) => p.id === id)!;

describe("resolveFlagGlyphDescriptorByValues", () => {
  it("resolves guarded mood with full stock on forage field", () => {
    const desc = resolveFlagGlyphDescriptorByValues("field", true, 10, 5, 160, 160);
    expect(desc.mood).toBe("guarded");
    expect(desc.tone).toBe("safe");
    expect(desc.label).toBe("Forage garrison");
    expect(desc.flair).toBe("Banner flying · 10 power (5 soldiers) · 160 food");
    expect(desc.color).toBe("#3fb950");
    expect(desc.motion).toBe("drift");
  });

  it("resolves guarded mood with dry stock on timber stand", () => {
    const desc = resolveFlagGlyphDescriptorByValues("woodcut", true, 8, 4, 0, 160);
    expect(desc.mood).toBe("guarded");
    expect(desc.tone).toBe("safe");
    expect(desc.label).toBe("Timber garrison");
    expect(desc.flair).toBe("Banner flying · 8 power · wood dry");
    expect(desc.color).toBe("#3fb950");
  });

  it("resolves guarded mood on non-gather tile", () => {
    const desc = resolveFlagGlyphDescriptorByValues("none", true, 6, 3);
    expect(desc.mood).toBe("guarded");
    expect(desc.tone).toBe("safe");
    expect(desc.label).toBe("Garrison camp");
    expect(desc.flair).toBe("Banner flying · 6 power (3 soldiers)");
  });

  it("resolves threatened mood with incoming host", () => {
    const desc = resolveFlagGlyphDescriptorByValues("quarry", true, 10, 5, 120, 160, {
      realmName: "Iron Guard",
      etaSeconds: 14,
    });
    expect(desc.mood).toBe("threatened");
    expect(desc.tone).toBe("danger");
    expect(desc.label).toBe("Stone redoubt");
    expect(desc.flair).toBe("Iron Guard inbound (14s) · muster watch");
    expect(desc.color).toBe("#f85149");
    expect(desc.motion).toBe("pulse");
    expect(desc.threatSeconds).toBe(14);
    expect(desc.threatRealm).toBe("Iron Guard");
  });

  it("resolves bare mood with unharvested stock", () => {
    const desc = resolveFlagGlyphDescriptorByValues("quarry", false, 0, 0, 80, 160);
    expect(desc.mood).toBe("bare");
    expect(desc.tone).toBe("warn");
    expect(desc.label).toBe("Stone claim");
    expect(desc.flair).toBe("Banner claimed · 80 stone unharvested");
    expect(desc.color).toBe("#d29922");
    expect(desc.motion).toBe("drift");
  });

  it("resolves bare mood with dry stock", () => {
    const desc = resolveFlagGlyphDescriptorByValues("field", false, 0, 0, 0, 160);
    expect(desc.mood).toBe("bare");
    expect(desc.tone).toBe("warn");
    expect(desc.label).toBe("Forage claim");
    expect(desc.flair).toBe("Banner claimed · food dry · unpatrolled");
  });

  it("resolves bare mood on non-gather tile", () => {
    const desc = resolveFlagGlyphDescriptorByValues("none", false, 0, 0);
    expect(desc.mood).toBe("bare");
    expect(desc.tone).toBe("warn");
    expect(desc.label).toBe("Frontier flag");
    expect(desc.flair).toBe("Banner claimed · post unattended");
  });
});

describe("resolveFlagGlyphDescriptor from GameState", () => {
  it("resolves guarded flag from live GameState", () => {
    const { s, id } = withFlagState("field");
    const desc = resolveFlagGlyphDescriptor(s, tileOf(s, id));
    expect(desc.mood).toBe("guarded");
    expect(desc.tone).toBe("safe");
    expect(desc.label).toBe("Forage garrison");
    expect(desc.flair).toContain("Banner flying");
  });

  it("resolves threatened state when march is inbound", () => {
    const { s, id } = withFlagState("woodcut");
    s.flags["marches_json"] = JSON.stringify([
      {
        id: "attack-1",
        realmId: "rival",
        fromId: "rival-keep",
        toId: id,
        kind: "attack",
        arrivesTick: s.meta.tick + 80,
        travelTicks: 80,
        force: { militia: 6 },
      },
    ]);

    const desc = resolveFlagGlyphDescriptor(s, tileOf(s, id), (rId) => (rId === "rival" ? "Dusk Cohort" : rId));
    expect(desc.mood).toBe("threatened");
    expect(desc.tone).toBe("danger");
    expect(desc.label).toBe("Timber redoubt");
    expect(desc.threatRealm).toBe("Dusk Cohort");
    expect(desc.threatSeconds).toBe(8);
  });
});

describe("FlagLivingGlyph component", () => {
  it("renders phrasing-only markup with living SVG layers", () => {
    const { s, id } = withFlagState();
    const html = renderToStaticMarkup(<FlagLivingGlyph state={s} province={tileOf(s, id)} />);
    expect(html).toContain("sc-flag-living-glyph");
    expect(html).toContain("sc-flag-glyph-icon");
    expect(html).toContain("sc-flag-living-label");
    expect(html).toContain("sc-flag-living-flair");
    expect(html).toContain("sc-flag-glow-layer");
    expect(html).toContain("sc-flag-drift-layer");
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<a");
  });

  it("renders corner underlay watermark with radial vignette", () => {
    const html = renderToStaticMarkup(<FlagLivingUnderlay mood="guarded" node="field" />);
    expect(html).toContain("sc-flag-living-underlay");
    expect(html).toContain("sc-flag-living-watermark");
    expect(html).toContain('viewBox="0 0 34 34"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("integrates seamlessly into OutpostLivingCard with 4 rows and meter", () => {
    const { s, id } = withFlagState("woodcut");
    const html = renderToStaticMarkup(<OutpostLivingCard state={s} province={tileOf(s, id)} />);
    expect(html).toContain("sc-outpost-card is-living");
    expect(html).toContain("sc-flag-living");
    expect(html).toContain("sc-flag-living-underlay");
    expect(html).toContain("sc-outpost-card-rows");
    expect(html).toContain("sc-flag-meter");
    expect(html).toContain("sc-flag-living-glyph");
    expect(html).toContain("Timber garrison");
  });

  it("styles living flag layers in flag-living.css with pointer-events: none and no theme.css pollution", () => {
    const css = readFile("./flag-living.css");
    expect(css).toContain(".sc-flag-living-underlay");
    expect(css).toContain(".sc-flag-living-glyph");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-flag-pulse");
    expect(css).toContain("@keyframes sc-flag-drift");

    const theme = readFile("../theme.css");
    expect(theme).not.toContain("sc-flag-living");
    expect(theme).not.toContain("sc-flag-glow-layer");
  });
});
