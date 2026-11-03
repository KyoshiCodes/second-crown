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

function createMockStateWithMarch(): GameState {
  return {
    meta: { tick: 10 },
    board: {
      homeProvinceId: "p_home",
      provinces: [
        { id: "p_home", x: 0, y: 0, terrain: "plain", node: "hold", occupantRealmId: "player" },
        { id: "p_target", x: 2, y: 1, terrain: "plain", node: "camp", occupantRealmId: "player" },
      ],
    },
    flags: {
      fog_seen: JSON.stringify(["p_home", "p_target"]),
      "seen:p_home": true,
      "seen:p_target": true,
      garrisons_json: JSON.stringify([
        {
          provinceId: "p_target",
          force: { spearman: 5 },
        },
      ]),
      marches_json: JSON.stringify([
        {
          id: "m_march_1",
          realmId: "player",
          fromId: "p_home",
          toId: "p_target",
          arrivesTick: 60,
          purpose: "raid",
        },
      ]),
    },
    season: { current: "summer" },
  } as unknown as GameState;
}

describe("OverworldAtlas living unit and march treatment (bakeoff/gemini-units)", () => {
  it("renders breathing status pulse aura and trailing wake motes along the march path", () => {
    const state = createMockStateWithMarch();
    const html = renderToStaticMarkup(<OverworldAtlas state={state} />);

    expect(html).toContain("sc-atlas-unit-pulse-glow");
    expect(html).toContain("sc-atlas-march-wake");
    expect(html).toContain("sc-atlas-unit-sentry");

    // Strict pointer-events: none on decorative unit elements
    const wakeBlock = html.slice(html.indexOf("sc-atlas-march-wake"));
    expect(wakeBlock).toMatch(/style="[^"]*pointer-events:\s*none/);
  });

  it("keeps styles isolated in atlas-units.css with pointer-events: none, keyframes, and motion guard", () => {
    const css = readCssFile("./atlas-units.css");

    expect(css).toContain(".sc-atlas-unit-pulse-glow");
    expect(css).toContain(".sc-atlas-march-wake");
    expect(css).toContain(".sc-atlas-unit-sentry");
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain("@keyframes sc-atlas-unit-pulse");
    expect(css).toContain("@keyframes sc-atlas-wake-spark");
    expect(css).toContain("@keyframes sc-atlas-sentry-ward");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    // Strict isolation: theme.css is untouched
    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-atlas-unit-pulse-glow");
    expect(theme).not.toContain("sc-atlas-march-wake");
    expect(theme).not.toContain("sc-atlas-unit-sentry");
  });
});
