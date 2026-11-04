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

describe("Living Hover Treatment on Diamond Board / Kingdom Atlas (bakeoff/gemini-hover)", () => {
  it("atlas-hover.css exists and enforces strict pointer-events: none on all decorative classes", () => {
    const css = readCssFile("./atlas-hover.css");

    expect(css).toContain(".sc-atlas-hover-rim");
    expect(css).toContain(".sc-atlas-hover-wash");
    expect(css).toContain(".sc-atlas-hover-ink");
    expect(css).toContain(".sc-atlas-hover-halo");
    expect(css).toContain(".sc-atlas-hover-tick");
    expect(css).toContain(".sc-atlas-hover-glint");

    const matches = css.match(/pointer-events:\s*none\s*!important/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(6);
  });

  it("atlas-hover.css provides keyframes and prefers-reduced-motion guard", () => {
    const css = readCssFile("./atlas-hover.css");
    expect(css).toContain("@keyframes sc-atlas-hover-pulse");
    expect(css).toContain("@keyframes sc-atlas-hover-wash-breathe");
    expect(css).toContain("@keyframes sc-atlas-hover-glint-sparkle");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("OverworldAtlas renders cleanly with state", () => {
    const state = createMockState();
    const html = renderToStaticMarkup(
      <OverworldAtlas state={state} selectedId="p_home" />
    );
    expect(html).toContain("Kingdom Atlas");
    expect(html).toContain("sc-overworld-atlas");
  });
});
