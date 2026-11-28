import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  boardCameraFit,
  computeBoardStaticCacheKey,
  hitTestProvince,
  paintBoardStaticTiles,
  paintFogHeightVeil,
  paintTileHeightFace,
  provinceTokenBounds,
  resolveTerrainDepthStyle,
  terrainChipPalette,
  terrainElevation,
} from "@second-crown/render";
import {
  audioSnapshot,
  createGameState,
  revealProvince,
  setLivingSwitch,
  terrainDepthSnapshot,
  type AudioWeatherLayerId,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import {
  BoardTerrainDepth,
  resolveBoardTerrainDepth,
} from "./BoardTerrainDepth";

const DAY_CYCLE_TICKS = 3600;
const NIGHT = 7 * DAY_CYCLE_TICKS + 3000;

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function freshState(tick = NIGHT, seed = 1): GameState {
  const s = createGameState({ seed, now: 1, withStarterBuildings: false });
  s.meta.tick = tick;
  return s;
}

function withWeatherLayer(layer: AudioWeatherLayerId, tick = NIGHT): GameState {
  for (let seed = 1; seed <= 500; seed++) {
    const s = freshState(tick, seed);
    if (audioSnapshot(s)?.weatherLayer === layer) return s;
  }
  throw new Error(`no seed found with weatherLayer ${layer}`);
}

function makeMockGraphics() {
  const calls: Array<{ op: string; args: unknown[] }> = [];
  const state: Record<string, unknown> = { eventMode: "auto" };
  const proxy: unknown = new Proxy(state, {
    get(target, prop) {
      if (prop in target) return target[prop as string];
      return (...args: unknown[]) => {
        calls.push({ op: String(prop), args });
        return proxy;
      };
    },
    set(target, prop, value) {
      target[prop as string] = value;
      return true;
    },
  });
  return { g: proxy as never, calls };
}

describe("Route B Slice 2: terrain depth presentation on Pixi board and overlay", () => {
  it("resolves Pixi terrain depth style from terrainDepthSnapshot and updates static cache key when toggled or changed", () => {
    expect(resolveTerrainDepthStyle(undefined)).toBeNull();

    const s = withWeatherLayer("clear");
    // Force low vs high relief boards to verify scaling
    for (const p of s.board.provinces) p.terrain = "plain";
    const lowDepth = resolveTerrainDepthStyle(s)!;
    expect(lowDepth.relief).toBe("low");

    for (const p of s.board.provinces) p.terrain = "peak";
    const highDepth = resolveTerrainDepthStyle(s)!;
    expect(highDepth.relief).toBe("high");
    expect(highDepth.faceShadeBoost).toBeGreaterThan(lowDepth.faceShadeBoost);
    expect(highDepth.groundShadowAlpha).toBeGreaterThan(lowDepth.groundShadowAlpha);

    const keyOn = computeBoardStaticCacheKey(s, "board");
    expect(keyOn).toContain("td:high:");

    setLivingSwitch(s, "terrainDepth", false);
    expect(resolveTerrainDepthStyle(s)).toBeNull();
    const keyOff = computeBoardStaticCacheKey(s, "board");
    expect(keyOff).toContain("td:off");
    expect(keyOff).not.toBe(keyOn);
  });

  it("strengthens Pixi height faces, ground shadows, and fog veil without changing terrainElevation or hit-testing", () => {
    const s = withWeatherLayer("wind"); // storm -> high fogThickness
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    home.terrain = "peak";
    const b = provinceTokenBounds(home.x, home.y);
    const pal = terrainChipPalette("peak");

    // 1. Height face draws additional shading/seam strokes with depth enabled
    const baseFace = makeMockGraphics();
    paintTileHeightFace(baseFace.g, b, "peak", pal, 0, null, null);
    const depthStyle = resolveTerrainDepthStyle(s)!;
    const richFace = makeMockGraphics();
    paintTileHeightFace(richFace.g, b, "peak", pal, 0, null, depthStyle);
    expect(richFace.calls.filter((c) => c.op === "fill").length).toBeGreaterThan(
      baseFace.calls.filter((c) => c.op === "fill").length,
    );
    expect(richFace.calls.filter((c) => c.op === "stroke").length).toBeGreaterThan(
      baseFace.calls.filter((c) => c.op === "stroke").length,
    );
    expect(terrainElevation("peak")).toBe(14);

    // 2. Fog veil draws extra atmospheric density layers when fogDensity > 0
    const baseFog = makeMockGraphics();
    paintFogHeightVeil(baseFog.g, b, home, 0, null);
    const richFog = makeMockGraphics();
    paintFogHeightVeil(richFog.g, b, home, 0, depthStyle);
    expect(richFog.calls.filter((c) => c.op === "ellipse").length).toBeGreaterThan(
      baseFog.calls.filter((c) => c.op === "ellipse").length,
    );

    // 3. Full static board paint emits more ground shadow + fog operations when living_terrain_depth is on vs off
    const onBoard = makeMockGraphics();
    paintBoardStaticTiles(onBoard.g, s);
    setLivingSwitch(s, "terrainDepth", false);
    const offBoard = makeMockGraphics();
    paintBoardStaticTiles(offBoard.g, s);
    expect(onBoard.calls.filter((c) => c.op === "ellipse").length).toBeGreaterThan(
      offBoard.calls.filter((c) => c.op === "ellipse").length,
    );

    // 4. Camera fit and hit-testing remain completely unaffected
    const fitBefore = boardCameraFit();
    const hitBefore = hitTestProvince(b.cx, b.cy);
    setLivingSwitch(s, "terrainDepth", true);
    expect(boardCameraFit()).toEqual(fitBefore);
    expect(hitTestProvince(b.cx, b.cy)).toEqual(hitBefore);
    expect(hitBefore).toEqual({ bx: home.x, by: home.y });
  });

  it("renders calm BoardTerrainDepth overlay and coexists with Slice 0 and Slice 1 without mutating state", () => {
    expect(resolveBoardTerrainDepth(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardTerrainDepth state={undefined} />)).toBe("");

    const s = withWeatherLayer("rain", NIGHT);
    const snap = terrainDepthSnapshot(s)!;
    const view = resolveBoardTerrainDepth(s)!;
    expect(view.relief).toBe(snap.relief);
    expect(view.shadowStrength).toBe(snap.shadowStrength);
    expect(view.fogDensity).toBe(snap.fogDensity);
    expect(view.shadowOpacity).toBeLessThanOrEqual(0.2);
    expect(view.fogOpacity).toBeLessThanOrEqual(0.2);

    const before = JSON.stringify(s);
    const html = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(JSON.stringify(s)).toBe(before);

    expect(html).toContain("sc-bdepth-overlay");
    expect(html).toContain(`data-bdepth-relief="${snap.relief}"`);
    expect(html).toContain(`data-bdepth-shadow="${snap.shadowStrength.toFixed(3)}"`);
    expect(html).toContain(`data-bdepth-fog="${snap.fogDensity.toFixed(3)}"`);
    expect(html).toContain("sc-bdepth-ground");
    expect(html).toContain("sc-bdepth-fog");

    // Slice 0 & Slice 1 remain present alongside Slice 2
    expect(html).toContain("sc-btint-overlay");
    expect(html).toContain("sc-bwpart-overlay");
    expect(html).toContain("sc-baudio-bridge");

    // Reveal all provinces -> fogDensity becomes 0, fog layer hides while ground depth remains
    for (const p of s.board.provinces) revealProvince(s, p.id);
    const clearFogHtml = renderToStaticMarkup(<BoardTerrainDepth state={s} />);
    expect(clearFogHtml).toContain("sc-bdepth-ground");
    expect(clearFogHtml).not.toContain("sc-bdepth-fog");

    // Flag off hides only Slice 2 while keeping Slice 0 & Slice 1 intact
    setLivingSwitch(s, "terrainDepth", false);
    expect(resolveBoardTerrainDepth(s)).toBeNull();
    const noDepthHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(noDepthHtml).not.toContain("sc-bdepth-overlay");
    expect(noDepthHtml).toContain("sc-btint-overlay");
    expect(noDepthHtml).toContain("sc-bwpart-overlay");
    expect(noDepthHtml).toContain("sc-baudio-bridge");
  });

  it("isolates terrain depth CSS with Dusk/Night/Parchment tokens, pointer-events: none, reduced motion, no heavy filters, and zero forbidden selectors", () => {
    const css = readTextFile("./board-terrain-depth.css");
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).not.toContain("backdrop-filter");

    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const token of forbidden) {
      expect(css).not.toContain(token);
    }
  });
});
