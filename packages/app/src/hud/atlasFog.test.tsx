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

function createFogMockState(seenIds: string[] = ["p_home"]): GameState {
  return {
    meta: { tick: 300 },
    buildings: [],
    board: {
      homeProvinceId: "p_home",
      provinces: [
        { id: "p_home", x: 0, y: 0, terrain: "plain", node: "hold", occupantRealmId: "player" },
        { id: "p_seen", x: 5, y: 5, terrain: "plain", node: "none" },
        { id: "p_unseen", x: 6, y: 5, terrain: "plain", node: "none" },
      ],
    },
    flags: {
      fog_seen: JSON.stringify(seenIds),
    },
    season: { current: "summer" },
  } as unknown as GameState;
}

describe("OverworldAtlas living fog treatment (bakeoff/gemini-fog)", () => {
  it("renders living cloud veil with drift, pulse, and wisps on unseen tiles", () => {
    const state = createFogMockState(["p_home", "p_seen"]);
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);

    // Cloud veil and animated motion groups
    expect(html).toContain("sc-atlas-fog-veil");
    expect(html).toContain("sc-atlas-fog-drift");
    expect(html).toContain("sc-atlas-fog-puff");
    expect(html).toContain("sc-atlas-fog-tendril");

    // Strict pointer-events: none on decorative veil and drift groups
    const veilBlock = html.slice(html.indexOf("sc-atlas-fog-veil"));
    expect(veilBlock).toMatch(/style="[^"]*pointer-events:\s*none/);
  });

  it("renders slate edge underlay and pale mist contour on unseen tile perimeter", () => {
    const state = createFogMockState(["p_home", "p_seen"]);
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);

    // Slate fog boundary edge and pale mist line
    expect(html).toContain("sc-atlas-fog-edge");
    expect(html).toContain('stroke="#334155"');
    expect(html).toContain("sc-atlas-fog-mist");
    expect(html).toContain('stroke="#e2e8f0"');

    // Strict pointer-events: none
    const edgeBlock = html.slice(html.indexOf("sc-atlas-fog-edge"));
    expect(edgeBlock).toMatch(/style="[^"]*pointer-events:\s*none/);
  });

  it("omits fog veil and edge lines when tiles are revealed", () => {
    const state = createFogMockState(["p_home", "p_seen", "p_unseen"]);
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);

    expect(html).not.toContain("sc-atlas-fog-veil");
    expect(html).not.toContain("sc-atlas-fog-edge");
    expect(html).not.toContain("sc-atlas-fog-mist");
  });

  it("keeps styles in hud/atlas-fog.css with pointer-events: none, animations, and motion guard", () => {
    const css = readCssFile("./atlas-fog.css");

    // Strict pointer-events: none
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain(".sc-atlas-fog-veil *");
    expect(css).toContain(".sc-atlas-fog-drift *");
    expect(css).toContain(".sc-atlas-fog-puff *");
    expect(css).toContain(".sc-atlas-fog-tendril *");
    expect(css).toContain(".sc-atlas-fog-edge");
    expect(css).toContain(".sc-atlas-fog-mist");

    // Keyframes
    expect(css).toContain("@keyframes sc-atlas-fog-drift");
    expect(css).toContain("@keyframes sc-atlas-fog-pulse");
    expect(css).toContain("@keyframes sc-atlas-fog-wisp");
    expect(css).toContain("@keyframes sc-atlas-fog-mist-shimmer");

    // Motion guard
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important");

    // theme.css isolation
    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-atlas-fog");
  });
});
