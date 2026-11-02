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
        { id: "p_wood", x: 3, y: 2, terrain: "wood", node: "woodcut" },
        { id: "p_field", x: 4, y: 2, terrain: "plain", node: "field" },
        { id: "p_quarry", x: 5, y: 2, terrain: "hill", node: "quarry" },
        { id: "p_dry", x: 2, y: 3, terrain: "plain", node: "field" },
      ],
    },
    flags: {
      fog_seen: JSON.stringify(["p_home", "p_wood", "p_field", "p_quarry", "p_dry"]),
      node_stock_p_dry: 0,
    },
    season: { current: "summer" },
  } as unknown as GameState;
}

describe("OverworldAtlas living node pile treatment (bakeoff/gemini-node-piles)", () => {
  it("renders dark ink plinths and warm rims under stocked woodcut, field, and quarry piles", () => {
    const state = createMockState();
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);

    expect(html).toContain("sc-atlas-pile-logs");
    expect(html).toContain("sc-atlas-pile-sacks");
    expect(html).toContain("sc-atlas-pile-blocks");

    // Ink plinth and rim colors
    expect(html).toContain('fill="#1c1208"');
    expect(html).toContain('opacity="0.62"');
    expect(html).toContain('stroke="#fde68a"');
    expect(html).toContain('opacity="0.38"');

    // Pointer events none on the pile groups
    const logsBlock = html.slice(html.indexOf("sc-atlas-pile-logs"));
    expect(logsBlock).toMatch(/style="[^"]*pointer-events:\s*none/);
  });

  it("omits node pile and plinth when node stock is dry/depleted", () => {
    const state = createMockState();
    // Dry field p_dry has stock 0
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);
    // There are 3 stocked nodes (woodcut, field, quarry) -> exactly 3 plinth occurrences
    const plinthMatches = html.match(/fill="#1c1208"/g);
    expect(plinthMatches?.length).toBe(3);
  });

  it("keeps styles in hud/atlas-node-piles.css with pointer-events: none, breathe keyframes, and motion guard", () => {
    const css = readCssFile("./atlas-node-piles.css");

    // Strict pointer-events none
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain(".sc-atlas-node-pile *");

    // Living breathing animation
    expect(css).toContain("@keyframes sc-atlas-node-pile-breathe");
    expect(css).toContain("animation: sc-atlas-node-pile-breathe");

    // Reduced motion media query guard
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important");

    // theme.css isolation
    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-atlas-node-pile");
  });
});
