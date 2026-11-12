import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ascendThreshold, createGameState, formatLetterSuffix } from "@second-crown/sim";
import {
  PrestigePip,
  PrestigeCrestPip,
  AgeSealPip,
  LivingPrestigePip,
  PrestigeGlyphPip,
  PrestigeStatusLine,
  PrestigeLine,
  resolvePrestigeTier,
  resolvePrestigeEpoch,
  resolvePrestigeTitle,
} from "./PrestigePip";
import { AgeLine, AgeGlyphPip } from "../AgeLine";

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

describe("Prestige tier and epoch helpers", () => {
  it("resolves prestige tiers correctly across dawn thresholds", () => {
    expect(resolvePrestigeTier(0)).toBe(0);
    expect(resolvePrestigeTier(1)).toBe(1);
    expect(resolvePrestigeTier(2)).toBe(2);
    expect(resolvePrestigeTier(3)).toBe(3);
    expect(resolvePrestigeTier(4)).toBe(4);
    expect(resolvePrestigeTier(10)).toBe(4);
    expect(resolvePrestigeTier(-1)).toBe(0);
    expect(resolvePrestigeTier(Number.NaN)).toBe(0);
  });

  it("resolves prestige epochs and titles correctly", () => {
    expect(resolvePrestigeEpoch(0)).toBe("mortal");
    expect(resolvePrestigeEpoch(1)).toBe("second-dawn");
    expect(resolvePrestigeEpoch(2)).toBe("ascendant");
    expect(resolvePrestigeEpoch(3)).toBe("imperial");
    expect(resolvePrestigeEpoch(4)).toBe("celestial");
    expect(resolvePrestigeEpoch(0, true)).toBe("shared");

    expect(resolvePrestigeTitle(0)).toBe("Prestige 0 · Mortal Dawn");
    expect(resolvePrestigeTitle(1)).toBe("Prestige 1 · First Second Dawn");
    expect(resolvePrestigeTitle(2)).toBe("Prestige 2 · Age of Crowns");
    expect(resolvePrestigeTitle(3)).toBe("Prestige 3 · Imperial Epoch");
    expect(resolvePrestigeTitle(4)).toBe("Prestige 4 · Celestial Era");
    expect(resolvePrestigeTitle(1, true)).toBe("Prestige 1 · First Second Dawn · Ready to Ascend");
    expect(resolvePrestigeTitle(0, false, true)).toBe("Shared Realm · Enduring Epoch");
  });
});

describe("PrestigePip heraldry and living layers", () => {
  it("renders Tier 0 (Mortal Dawn) with rustic foundation and crescent horizon", () => {
    const html = renderToStaticMarkup(<PrestigePip dawn={0} ready={false} />);
    expect(html).toContain('data-prestige-pip="true"');
    expect(html).toContain('data-prestige-tier="0"');
    expect(html).toContain('data-epoch="mortal"');
    expect(html).toContain('data-dawn="0"');
    expect(html).toContain('data-ready="false"');
    expect(html).toContain("tier-0");
    expect(html).toContain("epoch-mortal");
    expect(html).toContain("sc-prestige-horizon");
    expect(html).toContain("sc-prestige-rays-group");
    expect(html).toContain('width:18px;height:18px;pointer-events:none');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("sc-prestige-ready-ring");
  });

  it("renders Tier 1 (First Second Dawn) with solar disc, laurel wreath, and apex star", () => {
    const html = renderToStaticMarkup(<PrestigePip dawn={1} ready={false} />);
    expect(html).toContain('data-prestige-tier="1"');
    expect(html).toContain('data-epoch="second-dawn"');
    expect(html).toContain("tier-1");
    expect(html).toContain("epoch-second-dawn");
    expect(html).toContain("sc-prestige-laurel");
    expect(html).toContain("sc-prestige-star-1");
  });

  it("renders Tier 2 (Age of Crowns) with dual coronet and twin heraldic stars", () => {
    const html = renderToStaticMarkup(<PrestigePip dawn={2} ready={false} />);
    expect(html).toContain('data-prestige-tier="2"');
    expect(html).toContain('data-epoch="ascendant"');
    expect(html).toContain("tier-2");
    expect(html).toContain("epoch-ascendant");
    expect(html).toContain("sc-prestige-star-1");
    expect(html).toContain("sc-prestige-star-2");
  });

  it("renders Tier 3 (Imperial Epoch) with imperial diadem and 3 constellation stars", () => {
    const html = renderToStaticMarkup(<PrestigePip dawn={3} ready={false} />);
    expect(html).toContain('data-prestige-tier="3"');
    expect(html).toContain('data-epoch="imperial"');
    expect(html).toContain("tier-3");
    expect(html).toContain("epoch-imperial");
    expect(html).toContain("sc-prestige-star-1");
    expect(html).toContain("sc-prestige-star-2");
    expect(html).toContain("sc-prestige-star-3");
  });

  it("renders Tier 4+ (Celestial Era) with mythic crown and quad constellation stars", () => {
    const html = renderToStaticMarkup(<PrestigePip dawn={5} ready={false} />);
    expect(html).toContain('data-prestige-tier="4"');
    expect(html).toContain('data-epoch="celestial"');
    expect(html).toContain("tier-4");
    expect(html).toContain("epoch-celestial");
    expect(html).toContain("sc-prestige-star-1");
    expect(html).toContain("sc-prestige-star-2");
    expect(html).toContain("sc-prestige-star-3");
    expect(html).toContain("sc-prestige-star-4");
  });

  it("renders ready state with living pulsing ready ring and starburst rays", () => {
    const html = renderToStaticMarkup(<PrestigePip dawn={2} ready={true} />);
    expect(html).toContain('data-ready="true"');
    expect(html).toContain("is-ready");
    expect(html).toContain("sc-prestige-ready-ring");
    expect(html).toContain("sc-prestige-aura");
    expect(html).toContain("sc-prestige-rays-group");
  });

  it("renders shared state with enduring sapphire monolith", () => {
    const html = renderToStaticMarkup(<PrestigePip dawn={0} shared={true} />);
    expect(html).toContain('data-epoch="shared"');
    expect(html).toContain("is-shared");
    expect(html).toContain("epoch-shared");
    expect(html).toContain("sc-prestige-shared-group");
  });

  it("supports custom size and passes aliases", () => {
    const custom = renderToStaticMarkup(<PrestigeCrestPip dawn={2} size={28} />);
    expect(custom).toContain("width:28px;height:28px");
    expect(custom).toContain("pointer-events:none");

    const seal = renderToStaticMarkup(<AgeSealPip dawn={3} size={24} />);
    expect(seal).toContain("width:24px;height:24px");

    const living = renderToStaticMarkup(<LivingPrestigePip dawn={1} />);
    expect(living).toContain('data-prestige-pip="true"');

    const glyph = renderToStaticMarkup(<PrestigeGlyphPip dawn={0} />);
    expect(glyph).toContain('data-prestige-pip="true"');
  });
});

describe("PrestigeStatusLine and AgeLine integration", () => {
  it("renders empty string when state is undefined", () => {
    expect(renderToStaticMarkup(<PrestigeStatusLine state={undefined} />)).toBe("");
    expect(renderToStaticMarkup(<PrestigeLine state={undefined} />)).toBe("");
  });

  it("renders full prestige status line with PrestigePip and threshold info", () => {
    const s = createGameState({ seed: 1 });
    const html = renderToStaticMarkup(<PrestigeStatusLine state={s} />);
    expect(html).toContain('data-prestige-line="true"');
    expect(html).toContain('data-prestige-tier="0"');
    expect(html).toContain("Dawn 0");
    expect(html).toContain(`next age at ${formatLetterSuffix(ascendThreshold(s))} total resources`);
    expect(html).toContain('data-prestige-pip="true"');
  });

  it("renders ascension ready state on PrestigeStatusLine", () => {
    const s = createGameState({ seed: 1 });
    s.flags["prestige_level"] = 3;
    s.resources = { gold: String(ascendThreshold(s)), food: "0", wood: "0", stone: "0" };
    const html = renderToStaticMarkup(<PrestigeStatusLine state={s} />);
    expect(html).toContain("Dawn 3");
    expect(html).toContain('data-ready="true"');
    expect(html).toContain("ascend from the Crown tab");
    expect(html).toContain("sc-prestige-ready-ring");
  });

  it("AgeLine includes enhanced prestige tier attributes and aliases", () => {
    const s = createGameState({ seed: 1 });
    s.flags["prestige_level"] = 2;
    const html = renderToStaticMarkup(<AgeLine state={s} />);
    expect(html).toContain('data-prestige="2"');
    expect(html).toContain('data-prestige-tier="2"');
    expect(html).toContain("sc-prestige-line");
    expect(html).toContain("sc-prestige-pip-tier-star");
  });
});

describe("Prestige styles and CSS isolation", () => {
  it("enforces pointer-events: none !important and provides living keyframes in prestige-pip.css", () => {
    const css = readCssFile("./prestige-pip.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-prestige-breathe");
    expect(css).toContain("@keyframes sc-prestige-ready-pulse");
    expect(css).toContain("@keyframes sc-prestige-star-twinkle");
    expect(css).toContain("@keyframes sc-prestige-solar-flare");
    expect(css).toContain("@keyframes sc-prestige-rays-shimmer");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("does not leak into theme.css", () => {
    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-prestige");
    expect(theme).not.toContain("sc-age-seal");
  });
});
