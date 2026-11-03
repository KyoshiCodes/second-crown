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

function createMarchMockState(hasMarch: boolean = true): GameState {
  return {
    meta: { tick: 300 },
    buildings: [],
    board: {
      homeProvinceId: "p_home",
      provinces: [
        { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
        { id: "p_dest", x: 4, y: 3, terrain: "wood", node: "woodcut" },
      ],
    },
    flags: {
      fog_seen: JSON.stringify(["p_home", "p_dest"]),
      ...(hasMarch
        ? {
            marches_json: JSON.stringify([
              {
                id: "m_scout",
                realmId: "player",
                fromId: "p_home",
                toId: "p_dest",
                kind: "scout",
                arrivesTick: 350,
                force: { scout: 1 },
              },
            ]),
          }
        : {}),
    },
    season: { current: "summer" },
  } as unknown as GameState;
}

describe("OverworldAtlas living march treatment (bakeoff/gemini-marches)", () => {
  it("renders living march route, banner, dust puffs, and meeple with ink contrast", () => {
    const state = createMarchMockState(true);
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);

    // March root and animated groups
    expect(html).toContain("sc-atlas-march");
    expect(html).toContain("sc-atlas-march-trail");
    expect(html).toContain("sc-atlas-march-dust");
    expect(html).toContain("sc-atlas-march-meeple");
    expect(html).toContain("sc-atlas-march-banner");

    // Ink route underlay and meeple ring underlay for contrast
    expect(html).toContain('stroke="#0f172a"');
    expect(html).toContain('stroke-width="4.2"');
    expect(html).toContain('fill="#0f172a"');

    // Strict pointer-events: none on decorative march overlay
    const marchBlock = html.slice(html.indexOf("sc-atlas-march"));
    expect(marchBlock).toMatch(/style="[^"]*pointer-events:\s*none/);
  });

  it("omits march elements when no marches are underway", () => {
    const state = createMarchMockState(false);
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);

    expect(html).not.toContain("sc-atlas-march");
    expect(html).not.toContain("sc-atlas-march-trail");
    expect(html).not.toContain("sc-atlas-march-dust");
    expect(html).not.toContain("sc-atlas-march-meeple");
    expect(html).not.toContain("sc-atlas-march-banner");
  });

  it("keeps styles in hud/atlas-marches.css with pointer-events: none, animations, and motion guard", () => {
    const css = readCssFile("./atlas-marches.css");

    // Strict pointer-events: none
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain(".sc-atlas-march *");
    expect(css).toContain(".sc-atlas-march-meeple *");
    expect(css).toContain(".sc-atlas-march-banner *");
    expect(css).toContain(".sc-atlas-march-dust *");
    expect(css).toContain(".sc-atlas-march-trail");

    // Keyframes
    expect(css).toContain("@keyframes sc-atlas-march-bob");
    expect(css).toContain("@keyframes sc-atlas-march-flutter");
    expect(css).toContain("@keyframes sc-atlas-march-dust-puff");
    expect(css).toContain("@keyframes sc-atlas-march-dash");

    // Motion guard
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important");

    // theme.css isolation: new march styles are never added to theme.css
    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-atlas-march-meeple");
    expect(theme).not.toContain("sc-atlas-march-banner");
    expect(theme).not.toContain("sc-atlas-march-dust");
    expect(theme).not.toContain("sc-atlas-march-trail");
  });
});
