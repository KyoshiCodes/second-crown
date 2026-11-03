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

function createWeatherMockState(weatherKind?: "clear" | "rain" | "storm" | "snow" | "leaves"): GameState {
  return {
    meta: { tick: 300 },
    buildings: [],
    board: {
      homeProvinceId: "p_home",
      provinces: [
        { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
        { id: "p_tile", x: 3, y: 2, terrain: "plain", node: "none" },
      ],
    },
    flags: {
      fog_seen: JSON.stringify(["p_home", "p_tile"]),
      ...(weatherKind ? { weather: weatherKind } : {}),
    },
    season: { current: "summer" },
  } as unknown as GameState;
}

describe("OverworldAtlas living weather treatment (bakeoff/gemini-weather)", () => {
  it("renders corner weather glyph and ink-backed rain drops during rain", () => {
    const state = createWeatherMockState("rain");
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);

    // Corner weather glyph plaque
    expect(html).toContain("sc-atlas-weather-glyph");
    expect(html).toContain("sc-atlas-weather-rain");
    expect(html).toContain('fill="#0f172a"'); // plaque ink fill
    expect(html).toContain('stroke="#b45309"'); // plaque bronze edge

    // Tile weather drops with dark ink underlay
    expect(html).toContain("sc-atlas-weather-drops");
    expect(html).toContain('stroke="#0f172a"'); // ink underlay
    expect(html).toContain('opacity="0.34"'); // ink alpha
    expect(html).toContain('stroke="#93c5fd"'); // rain streak

    // Strict pointer-events: none on decorative overlays
    const glyphBlock = html.slice(html.indexOf("sc-atlas-weather-glyph"));
    expect(glyphBlock).toMatch(/style="[^"]*pointer-events:\s*none/);
  });

  it("renders storm lightning bolt in glyph and blue rain streaks", () => {
    const state = createWeatherMockState("storm");
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);

    expect(html).toContain("sc-atlas-weather-storm");
    expect(html).toContain('stroke="#facc15"'); // lightning bolt in glyph
    expect(html).toContain('stroke="#60a5fa"'); // storm rain color
  });

  it("renders drifting snowflakes with ink halo during snow", () => {
    const state = createWeatherMockState("snow");
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);

    expect(html).toContain("sc-atlas-weather-snow");
    expect(html).toContain("sc-atlas-weather-flakes");
    expect(html).toContain('fill="#f8fafc"'); // snow fleck
    expect(html).toContain('stroke="#0f172a"'); // ink halo
  });

  it("renders fluttering autumn leaves with ink outline during leaves weather", () => {
    const state = createWeatherMockState("leaves");
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);

    expect(html).toContain("sc-atlas-weather-leaves");
    expect(html).toContain("sc-atlas-glyph-leaves");
    expect(html).toContain('fill="#f59e0b"'); // amber leaf
    expect(html).toContain('fill="#d97706"'); // russet leaf
    expect(html).toContain('stroke="#0f172a"'); // ink outline
  });

  it("omits weather glyph and tile precipitation during clear weather", () => {
    const state = createWeatherMockState("clear");
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);

    expect(html).not.toContain("sc-atlas-weather-glyph");
    expect(html).not.toContain("sc-atlas-weather-drops");
    expect(html).not.toContain("sc-atlas-weather-flakes");
    expect(html).not.toContain("sc-atlas-weather-leaves");
  });

  it("keeps styles in hud/atlas-weather.css with pointer-events: none, animations, and motion guard", () => {
    const css = readCssFile("./atlas-weather.css");

    // Strict pointer-events: none
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain(".sc-atlas-weather-glyph *");
    expect(css).toContain(".sc-atlas-weather-drops *");
    expect(css).toContain(".sc-atlas-weather-leaves *");

    // Keyframes
    expect(css).toContain("@keyframes sc-atlas-rain-fall");
    expect(css).toContain("@keyframes sc-atlas-snow-drift");
    expect(css).toContain("@keyframes sc-atlas-leaf-flutter");
    expect(css).toContain("@keyframes sc-atlas-glyph-rain-bounce");

    // Motion guard
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important");

    // theme.css isolation
    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-atlas-weather");
  });
});
