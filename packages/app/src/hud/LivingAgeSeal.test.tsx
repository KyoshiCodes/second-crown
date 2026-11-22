import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ascendThreshold, createGameState, type GameState } from "@second-crown/sim";
import {
  HomeKeepAgeSeal,
  LivingAgeSeal,
  readAgeSealState,
  resolveAgeSealDescriptor,
} from "./LivingAgeSeal";
import { AgeLine } from "../AgeLine";
import { PrestigeLine } from "../PrestigeLine";
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

describe("LivingAgeSeal & HomeKeepAgeSeal", () => {
  it("resolves progressive age tiers, glow opacity, and shift cadence safely", () => {
    const d0 = resolveAgeSealDescriptor({ dawn: 0 });
    const d1 = resolveAgeSealDescriptor({ dawn: 1 });
    const d2 = resolveAgeSealDescriptor({ dawn: 2 });
    const d3 = resolveAgeSealDescriptor({ dawn: 3 });
    const d4 = resolveAgeSealDescriptor({ dawn: 6 });

    expect(d0.tier).toBe(0);
    expect(d4.tier).toBe(4);
    expect(d4.dawn).toBe(6);
    expect(d0.glowOpacity).toBeLessThan(d1.glowOpacity);
    expect(d1.glowOpacity).toBeLessThan(d2.glowOpacity);
    expect(d2.glowOpacity).toBeLessThan(d3.glowOpacity);
    expect(d3.glowOpacity).toBeLessThan(d4.glowOpacity);
    expect(d0.shiftDurationSec).toBeGreaterThan(d4.shiftDurationSec);
    expect(new Set([d0.sealFill, d1.sealFill, d2.sealFill, d3.sealFill, d4.sealFill]).size).toBe(5);

    const readyDesc = resolveAgeSealDescriptor({ dawn: 0, ready: true });
    expect(readyDesc.glowOpacity).toBeGreaterThan(d0.glowOpacity);
    expect(readyDesc.shiftDurationSec).toBeLessThan(d0.shiftDurationSec);

    const sharedDesc = resolveAgeSealDescriptor({ dawn: 2, ready: true, shared: true });
    expect(sharedDesc.shared).toBe(true);
    expect(sharedDesc.ready).toBe(false);

    expect(readAgeSealState(undefined).dawn).toBe(0);
    expect(readAgeSealState({} as GameState).tier).toBe(0);

    const state = createGameState({ seed: 1 });
    const snap = JSON.stringify(state);
    expect(readAgeSealState(state).dawn).toBe(0);
    expect(JSON.stringify(state)).toBe(snap);
  });

  it("renders LivingAgeSeal across advancing ages and readiness with pointer-events: none", () => {
    const idleHtml = renderToStaticMarkup(<LivingAgeSeal dawn={0} ready={false} />);
    expect(idleHtml).toContain("sc-living-age-seal age-tier-0 is-waiting");
    expect(idleHtml).toContain(`data-age-dawn="0"`);
    expect(idleHtml).toContain(`data-age-tier="0"`);
    expect(idleHtml).toContain(`aria-hidden="true"`);
    expect(idleHtml).toContain(`pointer-events:none`);
    expect(idleHtml).toContain('class="sc-living-age-seal-aura"');
    expect(idleHtml).not.toContain('class="sc-living-age-seal-glint"');

    const advancedHtml = renderToStaticMarkup(<LivingAgeSeal dawn={3} ready={true} />);
    expect(advancedHtml).toContain("sc-living-age-seal age-tier-3 is-ready");
    expect(advancedHtml).toContain(`data-age-dawn="3"`);
    expect(advancedHtml).toContain(`data-age-tier="3"`);
    expect(advancedHtml).toContain(`data-age-ready="true"`);
    expect(advancedHtml).toContain('class="sc-living-age-seal-glint"');

    const sharedHtml = renderToStaticMarkup(<LivingAgeSeal dawn={2} shared={true} />);
    expect(sharedHtml).toContain("sc-living-age-seal age-tier-2 is-shared");
    expect(sharedHtml).toContain(`data-age-shared="true"`);
  });

  it("integrates into AgeLine and PrestigeLine without mutating GameState", () => {
    const state = createGameState({ seed: 1 });
    const snap0 = JSON.stringify(state);
    const age0 = renderToStaticMarkup(<AgeLine state={state} />);
    const prestige0 = renderToStaticMarkup(<PrestigeLine state={state} act={noop} />);
    expect(JSON.stringify(state)).toBe(snap0);
    expect(age0).toContain("sc-living-age-seal age-tier-0 is-waiting");
    expect(prestige0).toContain("sc-living-age-seal age-tier-0 is-waiting");

    state.flags.prestige_level = 3;
    state.resources.gold = String(ascendThreshold(state));
    const snap3 = JSON.stringify(state);
    const age3 = renderToStaticMarkup(<AgeLine state={state} />);
    const prestige3 = renderToStaticMarkup(<PrestigeLine state={state} act={noop} />);
    expect(JSON.stringify(state)).toBe(snap3);
    expect(age3).toContain("sc-living-age-seal age-tier-3 is-ready");
    expect(prestige3).toContain("sc-living-age-seal age-tier-3 is-ready");
  });

  it("renders on the home keep in HomeKeepAgeSeal and BoardLiving", () => {
    const state = createGameState({ seed: 2 });
    const homeId = state.board.homeProvinceId;

    const tier0Keep = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <HomeKeepAgeSeal state={state} />
      </svg>,
    );
    expect(tier0Keep).toContain("sc-keep-age-seal age-tier-0 is-waiting");
    expect(tier0Keep).toContain(`data-home-keep-age-seal="true"`);
    expect(tier0Keep).toContain(`data-province-id="${homeId}"`);
    expect(tier0Keep).toContain('class="sc-keep-age-seal-aura"');
    expect(tier0Keep).not.toContain('class="sc-keep-age-seal-glint"');

    state.flags.prestige_level = 4;
    state.resources.gold = String(ascendThreshold(state));
    const activeBoard = renderToStaticMarkup(
      <BoardLiving state={state} selectedId={null} visible={true} />,
    );
    expect(activeBoard).toContain("sc-keep-age-seal age-tier-4 is-ready");
    expect(activeBoard).toContain(`data-age-dawn="4"`);
    expect(activeBoard).toContain(`data-age-tier="4"`);
    expect(activeBoard).toContain(`data-age-ready="true"`);
    expect(activeBoard).toContain('class="sc-keep-age-seal-aura"');
    expect(activeBoard).toContain('class="sc-keep-age-seal-glint"');
  });

  it("keeps CSS isolated with pointer-events: none, shift/glow keyframes, and reduced-motion support", () => {
    const css = readCssFile("./living-age-seal.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("@keyframes sc-age-seal-glow");
    expect(css).toContain("@keyframes sc-age-seal-shift");
    expect(css).toContain("@keyframes sc-age-seal-twinkle");
    expect(css).toContain(".sc-living-age-seal");
    expect(css).toContain(".sc-keep-age-seal");
    expect(css).toContain(".sc-age-status-line .sc-age-status-icon");

    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-living-age-seal");
    expect(theme).not.toContain("sc-keep-age-seal");
    expect(theme).not.toContain("sc-age-seal-shift");
  });
});
