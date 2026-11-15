import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createGameState } from "@second-crown/sim";
import {
  HomeKeepCrownPip,
  PrestigeCrownPip,
  resolvePrestigeCrownDescriptor,
} from "./PrestigeCrownPip";
import { AgeLine } from "../AgeLine";
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

describe("PrestigeCrownPip & HomeKeepCrownPip", () => {
  it("increases glow opacity and pulse intensity as prestige rises", () => {
    const t0 = resolvePrestigeCrownDescriptor(0);
    const t1 = resolvePrestigeCrownDescriptor(1);
    const t2 = resolvePrestigeCrownDescriptor(2);
    const t3 = resolvePrestigeCrownDescriptor(3);
    const t4 = resolvePrestigeCrownDescriptor(4);

    expect(t0.tier).toBe(0);
    expect(t4.tier).toBe(4);
    expect(t0.glowOpacity).toBeLessThan(t1.glowOpacity);
    expect(t1.glowOpacity).toBeLessThan(t2.glowOpacity);
    expect(t2.glowOpacity).toBeLessThan(t3.glowOpacity);
    expect(t3.glowOpacity).toBeLessThan(t4.glowOpacity);

    expect(t0.pulseDurationSec).toBeGreaterThan(t1.pulseDurationSec);
    expect(t1.pulseDurationSec).toBeGreaterThan(t2.pulseDurationSec);
    expect(t2.pulseDurationSec).toBeGreaterThan(t3.pulseDurationSec);
    expect(t3.pulseDurationSec).toBeGreaterThan(t4.pulseDurationSec);
  });

  it("renders PrestigeCrownPip with pointer-events: none and tier metadata", () => {
    const lowHtml = renderToStaticMarkup(<PrestigeCrownPip prestige={0} />);
    const highHtml = renderToStaticMarkup(<PrestigeCrownPip prestige={3} />);

    expect(lowHtml).toContain("sc-prestige-crown-pip tier-0");
    expect(lowHtml).toContain(`data-prestige-crown="true"`);
    expect(lowHtml).toContain(`aria-hidden="true"`);
    expect(lowHtml).toContain(`pointer-events:none`);
    expect(lowHtml).toContain(`data-glow-opacity="0.18"`);

    expect(highHtml).toContain("sc-prestige-crown-pip tier-3");
    expect(highHtml).toContain(`data-glow-opacity="0.76"`);
    expect(highHtml).toContain("sc-prestige-crown-gem");
  });

  it("renders next to the prestige line in AgeLine", () => {
    const state = createGameState();
    state.flags["prestige_level"] = 2;

    const html = renderToStaticMarkup(<AgeLine state={state} />);
    expect(html).toContain("sc-age-line sc-prestige-line");
    expect(html).toContain("sc-prestige-crown-pip tier-2");
    expect(html).toContain(`data-prestige-crown="true"`);
  });

  it("renders on the home keep in HomeKeepCrownPip and BoardLiving", () => {
    const state = createGameState();
    state.flags["prestige_level"] = 4;
    const homeId = state.board.homeProvinceId;

    const standalone = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <HomeKeepCrownPip state={state} />
      </svg>,
    );
    expect(standalone).toContain("sc-keep-prestige-crown tier-4");
    expect(standalone).toContain(`data-home-keep-crown="true"`);
    expect(standalone).toContain(`data-province-id="${homeId}"`);
    expect(standalone).toContain(`data-glow-opacity="0.95"`);
    expect(standalone).toContain(`pointer-events:none`);

    const boardHtml = renderToStaticMarkup(
      <BoardLiving state={state} selectedId={null} visible={true} />,
    );
    expect(boardHtml).toContain("sc-keep-prestige-crown tier-4");
    expect(boardHtml).toContain(`data-home-keep-crown="true"`);
  });

  it("keeps CSS isolated with pointer-events: none and reduced-motion support", () => {
    const css = readCssFile("./prestige-crown-pip.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain(".sc-prestige-crown-pip.tier-4");
    expect(css).toContain(".sc-keep-prestige-crown.tier-4");
  });
});
