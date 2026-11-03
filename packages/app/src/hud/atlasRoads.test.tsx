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
        { id: "p_home", x: 0, y: 0, terrain: "plain", node: "hold", occupantRealmId: "player" },
        { id: "p_road", x: 5, y: 5, terrain: "plain", node: "none" },
        { id: "p_neighbor", x: 6, y: 5, terrain: "hill", node: "none" },
        { id: "p_peak", x: 5, y: 4, terrain: "peak", node: "none" },
        { id: "p_fog", x: 5, y: 6, terrain: "wood", node: "none" },
      ],
    },
    buildings: [],
    flags: {
      fog_seen: JSON.stringify(["p_home", "p_road", "p_neighbor", "p_peak"]),
      "seen:p_home": true,
      "seen:p_road": true,
      "seen:p_neighbor": true,
      "seen:p_peak": true,
    },
    season: { current: "summer" },
  } as unknown as GameState;
}

describe("OverworldAtlas living road treatment (bakeoff/gemini-roads)", () => {
  it("renders living roads and paths with dark ink underlay, earth bed, pale crown, and living traffic & dust", () => {
    const state = createMockState();
    const html = renderToStaticMarkup(<OverworldAtlas state={state} />);

    expect(html).toContain('class="sc-atlas-roads"');
    expect(html).toContain('class="sc-atlas-road sc-atlas-road-road"');
    expect(html).toContain('class="sc-atlas-road-ink"');
    expect(html).toContain('class="sc-atlas-road-bed "');
    expect(html).toContain('class="sc-atlas-road-crown"');
    expect(html).toContain('class="sc-atlas-road-traffic"');
    expect(html).toContain('class="sc-atlas-road-dust"');

    // Mountain path is dashed
    expect(html).toContain('class="sc-atlas-road sc-atlas-road-path"');
    expect(html).toContain('sc-atlas-path-dash');

    // Fog trail stops at border
    expect(html).toContain('sc-atlas-road-fog');

    // Strict pointer-events: none on decorative overlays
    expect(html).toContain('style="pointer-events:none"');
  });

  it("applies pointer-events none and motion safety in atlas-roads.css without modifying theme.css", () => {
    const css = readCssFile("./atlas-roads.css");
    expect(css).toContain(".sc-atlas-road");
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain("@keyframes sc-atlas-road-traffic-flow");
    expect(css).toContain("@keyframes sc-atlas-road-dust-puff");
    expect(css).toContain("@keyframes sc-atlas-path-dash");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-atlas-road");
  });
});
