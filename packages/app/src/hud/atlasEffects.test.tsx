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

function createMockStateWithStatus(): GameState {
  return {
    meta: { tick: 10 },
    board: {
      homeProvinceId: "p_home",
      provinces: [
        { id: "p_home", x: 0, y: 0, terrain: "plain", node: "hold", occupantRealmId: "player" },
        { id: "p_target", x: 2, y: 1, terrain: "plain", node: "camp", occupantRealmId: "player" },
        { id: "p_clash", x: 1, y: 2, terrain: "plain", node: "none" },
      ],
    },
    flags: {
      fog_seen: JSON.stringify(["p_home", "p_target", "p_clash"]),
      "seen:p_home": true,
      "seen:p_target": true,
      "seen:p_clash": true,
      marches_json: JSON.stringify([
        {
          id: "m_player_1",
          realmId: "player",
          fromId: "p_home",
          toId: "p_clash",
          arrivesTick: 50,
          purpose: "raid",
        },
        {
          id: "m_rival_1",
          realmId: "k_silk",
          fromId: "p_target",
          toId: "p_clash",
          arrivesTick: 50,
          purpose: "raid",
        },
        {
          id: "m_incoming",
          realmId: "k_ash",
          fromId: "p_clash",
          toId: "p_home",
          arrivesTick: 80,
          purpose: "attack",
        },
      ]),
    },
    season: { current: "summer" },
  } as unknown as GameState;
}

describe("OverworldAtlas living effect and status treatment (bakeoff/gemini-effects)", () => {
  it("renders living clash spark burst and incoming threat beacon with pointer-events: none", () => {
    const state = createMockStateWithStatus();
    const html = renderToStaticMarkup(<OverworldAtlas state={state} />);

    expect(html).toContain("sc-atlas-status-clash");
    expect(html).toContain("sc-atlas-status-incoming");
    expect(html).toContain("sc-atlas-status-trail");

    // Strict pointer-events: none on decorative overlays
    const clashBlock = html.slice(html.indexOf("sc-atlas-status-clash"));
    expect(clashBlock).toMatch(/style="[^"]*pointer-events:\s*none/);

    const incBlock = html.slice(html.indexOf("sc-atlas-status-incoming"));
    expect(incBlock).toMatch(/style="[^"]*pointer-events:\s*none/);
  });

  it("keeps styles isolated in atlas-effects.css with pointer-events: none, keyframes, and motion guard", () => {
    const css = readCssFile("./atlas-effects.css");

    expect(css).toContain(".sc-atlas-status-clash");
    expect(css).toContain(".sc-atlas-status-incoming");
    expect(css).toContain(".sc-atlas-status-trail");
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain("@keyframes sc-atlas-clash-sparkle");
    expect(css).toContain("@keyframes sc-atlas-incoming-beacon");
    expect(css).toContain("@keyframes sc-atlas-trail-pulse");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    // Strict isolation: theme.css is untouched
    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-atlas-status-clash");
    expect(theme).not.toContain("sc-atlas-status-incoming");
    expect(theme).not.toContain("sc-atlas-status-trail");
  });
});
