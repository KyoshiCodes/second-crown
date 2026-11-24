import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CULTURES, createGameState, getCulture, setPlayerCulture, type GameState } from "@second-crown/sim";
import {
  HomeKeepCultureBanner,
  LivingCultureBanner,
  readCultureBannerState,
  resolveCultureBannerDescriptor,
} from "./LivingCultureBanner";
import { CultureLine } from "../CultureLine";
import { BoardLiving } from "../BoardLiving";

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

const noop = () => undefined;

describe("LivingCultureBanner & HomeKeepCultureBanner", () => {
  it("resolves all 10 cultures with unique patterns and canonical tabard colors safely", () => {
    const patterns = new Set<string>();
    for (const c of CULTURES) {
      const desc = resolveCultureBannerDescriptor(c.id);
      expect(desc.cultureId).toBe(c.id);
      expect(desc.primary).toBe(getCulture(c.id).palette.tabard);
      patterns.add(desc.pattern);
    }
    expect(patterns.size).toBe(10);

    expect(readCultureBannerState(undefined).cultureId).toBe("western");
    expect(readCultureBannerState({} as GameState).cultureId).toBe("western");

    const state = createGameState({ seed: 1 });
    setPlayerCulture(state, "tide");
    const snap = JSON.stringify(state);
    expect(readCultureBannerState(state)).toMatchObject({
      cultureId: "tide",
      pattern: "wave",
      primary: getCulture("tide").palette.tabard,
    });
    expect(JSON.stringify(state)).toBe(snap);
  });

  it("renders LivingCultureBanner with culture classes, patterns, and pointer-events: none", () => {
    const html = renderToStaticMarkup(<LivingCultureBanner cultureId="woodland" />);
    expect(html).toContain("sc-living-culture-banner culture-woodland pattern-pine");
    expect(html).toContain(`data-banner-culture="woodland"`);
    expect(html).toContain(`data-banner-pattern="pine"`);
    expect(html).toContain(`data-banner-color="${getCulture("woodland").palette.tabard}"`);
    expect(html).toContain(`aria-hidden="true"`);
    expect(html).toContain(`pointer-events:none`);
    expect(html).toContain('class="sc-living-culture-banner-aura"');
    expect(html).toContain('class="sc-living-culture-banner-cloth"');
    expect(html).toContain('class="sc-living-culture-banner-pattern"');
  });

  it("integrates into CultureLine and shifts when culture changes without mutating state", () => {
    const state = createGameState({ seed: 1 });
    setPlayerCulture(state, "desert");
    const snapDesert = JSON.stringify(state);
    const desertHtml = renderToStaticMarkup(<CultureLine state={state} act={noop} />);
    expect(JSON.stringify(state)).toBe(snapDesert);
    expect(desertHtml).toContain("sc-living-culture-banner culture-desert pattern-diamond");
    expect(desertHtml).toContain(`data-banner-culture="desert"`);

    setPlayerCulture(state, "steppe");
    const steppeHtml = renderToStaticMarkup(<CultureLine state={state} act={noop} />);
    expect(steppeHtml).toContain("sc-living-culture-banner culture-steppe pattern-stripe");
    expect(steppeHtml).toContain(`data-banner-culture="steppe"`);
  });

  it("renders on the home keep in HomeKeepCultureBanner and BoardLiving across cultures", () => {
    const state = createGameState({ seed: 2 });
    const homeId = state.board.homeProvinceId;
    setPlayerCulture(state, "glen");

    const glenKeep = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <HomeKeepCultureBanner state={state} />
      </svg>,
    );
    expect(glenKeep).toContain("sc-keep-culture-banner culture-glen pattern-check");
    expect(glenKeep).toContain(`data-home-keep-culture-banner="true"`);
    expect(glenKeep).toContain(`data-province-id="${homeId}"`);
    expect(glenKeep).toContain('class="sc-keep-culture-banner-aura"');
    expect(glenKeep).toContain('class="sc-keep-culture-banner-cloth"');
    expect(glenKeep).toContain('class="sc-keep-culture-banner-pattern"');

    setPlayerCulture(state, "peak");
    const peakBoard = renderToStaticMarkup(
      <BoardLiving state={state} selectedId={null} visible={true} />,
    );
    expect(peakBoard).toContain("sc-keep-culture-banner culture-peak pattern-peak");
    expect(peakBoard).toContain(`data-banner-culture="peak"`);
    expect(peakBoard).toContain(`data-banner-pattern="peak"`);
    expect(peakBoard).toContain(`data-banner-color="${getCulture("peak").palette.tabard}"`);
  });

  it("keeps CSS isolated with pointer-events: none, flutter/glow keyframes, and reduced-motion support", () => {
    const css = readCssFile("./living-culture-banner.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("@keyframes sc-culture-banner-flutter");
    expect(css).toContain("@keyframes sc-culture-banner-glow");
    expect(css).toContain("@keyframes sc-culture-banner-shimmer");
    expect(css).toContain(".sc-living-culture-banner");
    expect(css).toContain(".sc-keep-culture-banner");
    expect(css).toContain(".sc-culture-status-line .sc-culture-status-icon");

    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-living-culture-banner");
    expect(theme).not.toContain("sc-keep-culture-banner");
    expect(theme).not.toContain("sc-culture-banner-flutter");
  });
});
