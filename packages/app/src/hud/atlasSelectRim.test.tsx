import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OverworldAtlas } from "../OverworldAtlas";
import type { GameState } from "@second-crown/sim";

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

function createMockState(): GameState {
  return {
    meta: { tick: 10 },
    board: {
      homeProvinceId: "p_home",
      provinces: [
        { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
        { id: "p_hill", x: 3, y: 2, terrain: "hill", node: "quarry" },
      ],
    },
    flags: {
      "seen:p_home": true,
      "seen:p_hill": true,
    },
    season: { current: "summer" },
  } as unknown as GameState;
}

describe("OverworldAtlas living selected-province rim treatment (bakeoff/gemini-select-rim)", () => {
  it("renders living layered selection rim overlay with pale halo, dark ink underlay, gold glow, and brackets when selected", () => {
    const state = createMockState();
    const html = renderToStaticMarkup(
      <OverworldAtlas state={state} selectedId="p_hill" />,
    );

    expect(html).toContain('class="sc-atlas-select-rim"');
    expect(html).toContain('class="sc-atlas-select-halo"');
    expect(html).toContain('class="sc-atlas-select-glow"');
    expect(html).toContain('class="sc-atlas-select-brackets"');
    expect(html).toContain('stroke="#e2e8f0"'); // pale halo
    expect(html).toContain('stroke="#1c1208"'); // dark ink underlay
    expect(html).toContain('stroke="#d97706"'); // soft amber glow
    expect(html).toContain('stroke="#facc15"'); // radiant gold core and brackets

    // Strict pointer-events: none on all decorative overlays
    const selectRimBlock = html.slice(html.indexOf('class="sc-atlas-select-rim"'));
    expect(selectRimBlock).toMatch(/style="[^"]*pointer-events:\s*none/);
  });

  it("omits the selection rim overlay when no province is selected", () => {
    const state = createMockState();
    const html = renderToStaticMarkup(
      <OverworldAtlas state={state} selectedId={null} />,
    );

    expect(html).not.toContain("sc-atlas-select-rim");
    expect(html).not.toContain("sc-atlas-select-glow");
    expect(html).not.toContain("sc-atlas-select-halo");
    expect(html).not.toContain("sc-atlas-select-brackets");
  });

  it("keeps styles in hud/atlas-select-rim.css with pointer-events: none, pulse keyframes, and motion guard", () => {
    const css = readCssFile("./atlas-select-rim.css");

    // Pointer-events enforcement
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain(".sc-atlas-select-rim *");
    expect(css).toContain(".sc-atlas-select-brackets");

    // Living pulse animation
    expect(css).toContain("@keyframes sc-atlas-select-pulse");
    expect(css).toContain("animation: sc-atlas-select-pulse");
    expect(css).toContain("@keyframes sc-atlas-bracket-shimmer");
    expect(css).toContain("animation: sc-atlas-bracket-shimmer");

    // Reduced motion media query guard
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important");

    // theme.css isolation
    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-atlas-select");
  });
});
