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
    buildings: [],
    board: {
      homeProvinceId: "p_home",
      provinces: [
        { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
        { id: "p_outpost", x: 3, y: 2, terrain: "plain", node: "none", occupantRealmId: "player" },
        { id: "p_camp", x: 4, y: 2, terrain: "hill", node: "camp", occupantRealmId: "rival" },
      ],
    },
    flags: {
      fog_seen: JSON.stringify(["p_home", "p_outpost", "p_camp"]),
    },
    season: { current: "summer" },
  } as unknown as GameState;
}

describe("OverworldAtlas living outpost and camp treatment (bakeoff/gemini-camps)", () => {
  it("renders dark ink plinths and kind rims under outposts and rival camps", () => {
    const state = createMockState();
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);

    expect(html).toContain("sc-atlas-camp-outpost");
    expect(html).toContain("sc-atlas-camp-rival");

    // Ink plinth fill
    expect(html).toContain('fill="#0e0906"');
    expect(html).toContain('opacity="0.68"');

    // Emerald rim for player outpost, rose rim for rival camp
    expect(html).toContain('stroke="#86efac"');
    expect(html).toContain('stroke="#fda4af"');
    expect(html).toContain('opacity="0.72"');

    // Lantern and flag living elements
    expect(html).toContain("sc-atlas-camp-lantern");
    expect(html).toContain("sc-atlas-camp-flag");

    // Pointer events none on the camp groups
    const campBlock = html.slice(html.indexOf("sc-atlas-camp"));
    expect(campBlock).toMatch(/style="[^"]*pointer-events:\s*none/);
  });

  it("keeps styles in hud/atlas-camps.css with pointer-events: none, flutter/flicker keyframes, and motion guard", () => {
    const css = readCssFile("./atlas-camps.css");

    // Strict pointer-events none
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain(".sc-atlas-camp *");

    // Living animations
    expect(css).toContain("@keyframes sc-atlas-flag-flutter");
    expect(css).toContain("animation: sc-atlas-flag-flutter");
    expect(css).toContain("@keyframes sc-atlas-lantern-flicker");
    expect(css).toContain("animation: sc-atlas-lantern-flicker");

    // Reduced motion media query guard
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important");

    // theme.css isolation
    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-atlas-camp");
  });
});
