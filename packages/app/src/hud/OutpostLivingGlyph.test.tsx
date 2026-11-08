import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, listOutposts, plantOutpost, type GameState } from "@second-crown/sim";
import {
  OutpostLivingGlyph,
  OutpostLivingUnderlay,
  resolveOutpostGlyphDescriptor,
  resolveOutpostGlyphDescriptorByValues,
} from "./OutpostLivingGlyph";
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

function withFlag(): { s: GameState; id: string } {
  const s = createGameState({ seed: 1 });
  const p = s.board.provinces.find((x) => x.id !== s.board.homeProvinceId && x.node !== "hold")!;
  plantOutpost(s, p);
  const flag = listOutposts(s).find((o) => o.id === p.id)!;
  return { s, id: flag.id };
}

const tileOf = (s: GameState, id: string) => s.board.provinces.find((p) => p.id === id)!;

describe("resolveOutpostGlyphDescriptorByValues", () => {
  it("resolves threatened outpost descriptor", () => {
    const desc = resolveOutpostGlyphDescriptorByValues("woodcut", true, 10, 5, {
      realmName: "Frost King",
      etaSeconds: 8,
    });
    expect(desc.mood).toBe("threatened");
    expect(desc.tone).toBe("danger");
    expect(desc.motion).toBe("pulse");
    expect(desc.color).toBe("#f85149");
    expect(desc.flair).toContain("Frost King inbound (8s)");
    expect(desc.label).toBe("Timber redoubt");
  });

  it("resolves guarded outpost descriptor", () => {
    const desc = resolveOutpostGlyphDescriptorByValues("quarry", true, 15, 6);
    expect(desc.mood).toBe("guarded");
    expect(desc.tone).toBe("safe");
    expect(desc.motion).toBe("drift");
    expect(desc.color).toBe("#3fb950");
    expect(desc.flair).toContain("Banner flying · 15 power (6 soldiers)");
    expect(desc.label).toBe("Garrison camp");
  });

  it("resolves bare unguarded outpost descriptor", () => {
    const desc = resolveOutpostGlyphDescriptorByValues("field", false, 0, 0);
    expect(desc.mood).toBe("bare");
    expect(desc.tone).toBe("warn");
    expect(desc.motion).toBe("drift");
    expect(desc.color).toBe("#d29922");
    expect(desc.flair).toContain("Banner claimed · post unattended");
    expect(desc.label).toBe("Frontier flag");
  });
});

describe("resolveOutpostGlyphDescriptor", () => {
  it("resolves descriptor from state and province", () => {
    const { s, id } = withFlag();
    const desc = resolveOutpostGlyphDescriptor(s, tileOf(s, id));
    expect(desc.mood).toBe("bare");
    expect(desc.tone).toBe("warn");
  });

  it("updates descriptor when garrison is posted", () => {
    const { s, id } = withFlag();
    s.flags["garrisons_json"] = JSON.stringify([{ provinceId: id, force: { militia: 4 } }]);
    const desc = resolveOutpostGlyphDescriptor(s, tileOf(s, id));
    expect(desc.mood).toBe("guarded");
    expect(desc.tone).toBe("safe");
    expect(desc.troops).toBe(4);
  });
});

describe("OutpostLivingGlyph component", () => {
  it("renders a 14x14 living strip with glow, pulse, and drift layers", () => {
    const { s, id } = withFlag();
    const html = renderToStaticMarkup(<OutpostLivingGlyph state={s} province={tileOf(s, id)} />);
    expect(html).toContain("sc-outpost-living-glyph");
    expect(html).toContain("sc-outpost-living-svg");
    expect(html).toContain("sc-outpost-glow-layer");
    expect(html).toContain("sc-outpost-pulse-layer");
    expect(html).toContain("sc-outpost-drift-layer");
    expect(html).toContain("sc-outpost-living-label");
    expect(html).toContain("sc-outpost-living-flair");
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("OutpostLivingUnderlay component", () => {
  it("renders a 34x34 watermark underlay for each mood", () => {
    for (const mood of ["guarded", "bare", "threatened"] as const) {
      const html = renderToStaticMarkup(<OutpostLivingUnderlay mood={mood} />);
      expect(html).toContain("sc-outpost-living-underlay");
      expect(html).toContain(`is-${mood}`);
      expect(html).toContain('viewBox="0 0 34 34"');
      expect(html).toContain('aria-hidden="true"');
    }
  });
});

describe("OutpostLivingCard with living camp/flag glyphs", () => {
  it("mounts underlay, card rows, and living glyph", () => {
    const { s, id } = withFlag();
    const html = renderToStaticMarkup(<OutpostLivingCard state={s} province={tileOf(s, id)} />);
    expect(html).toContain("sc-outpost-card is-living");
    expect(html).toContain("sc-outpost-living-underlay");
    expect(html).toContain("sc-outpost-card-rows");
    expect(html).toContain("sc-outpost-living-glyph");
  });

  it("keeps styles isolated in outpost-living.css with pointer-events: none and no theme.css pollution", () => {
    const css = readFile("./outpost-living.css");
    expect(css).toContain(".sc-outpost-living-underlay");
    expect(css).toContain(".sc-outpost-living-glyph");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-outpost-pulse");
    expect(css).toContain("@keyframes sc-outpost-drift");

    const theme = readFile("../theme.css");
    expect(theme).not.toContain("sc-outpost-living");
    expect(theme).not.toContain("sc-outpost-glow-layer");
  });
});
