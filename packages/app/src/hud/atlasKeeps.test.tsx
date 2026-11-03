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

function createKeepMockState(): GameState {
  return {
    meta: { tick: 300 },
    buildings: [],
    board: {
      homeProvinceId: "p_home",
      provinces: [
        { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
        { id: "p_rival", x: 4, y: 3, terrain: "hill", node: "hold", occupantRealmId: "rival" },
      ],
    },
    flags: {
      fog_seen: JSON.stringify(["p_home", "p_rival"]),
    },
    season: { current: "summer" },
  } as unknown as GameState;
}

describe("OverworldAtlas living keep treatment (bakeoff/gemini-keeps)", () => {
  it("renders living keep plinth, banner, hearth light, and beacon with owner colors", () => {
    const state = createKeepMockState();
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);

    // Keep roots and living animated groups
    expect(html).toContain("sc-atlas-keep");
    expect(html).toContain("sc-atlas-keep-plinth");
    expect(html).toContain("sc-atlas-keep-banner");
    expect(html).toContain("sc-atlas-keep-light");
    expect(html).toContain("sc-atlas-keep-beacon");

    // Ink plinth underlay and owner-colored rims
    expect(html).toContain('fill="#0f172a"');
    expect(html).toContain('stroke="#fbbf24"'); // player gold rim
    expect(html).toContain('stroke="#ef4444"'); // rival red rim

    // Strict pointer-events: none on decorative keep elements
    const keepBlock = html.slice(html.indexOf("sc-atlas-keep"));
    expect(keepBlock).toMatch(/style="[^"]*pointer-events:\s*none/);
  });

  it("keeps styles in hud/atlas-keeps.css with pointer-events: none, animations, and motion guard", () => {
    const css = readCssFile("./atlas-keeps.css");

    // Strict pointer-events: none
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain(".sc-atlas-keep *");
    expect(css).toContain(".sc-atlas-keep-plinth *");
    expect(css).toContain(".sc-atlas-keep-banner *");
    expect(css).toContain(".sc-atlas-keep-light");
    expect(css).toContain(".sc-atlas-keep-beacon *");

    // Keyframes
    expect(css).toContain("@keyframes sc-atlas-keep-banner-flutter");
    expect(css).toContain("@keyframes sc-atlas-keep-hearth-glow");
    expect(css).toContain("@keyframes sc-atlas-keep-beacon-pulse");

    // Motion guard
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important");

    // theme.css isolation: new keep styles are never added to theme.css
    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-atlas-keep-banner");
    expect(theme).not.toContain("sc-atlas-keep-light");
    expect(theme).not.toContain("sc-atlas-keep-beacon");
  });
});
