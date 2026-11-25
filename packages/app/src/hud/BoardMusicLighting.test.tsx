import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createGameState } from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import { WeatherOverlay, resolveMusicWeatherResponse } from "../seasons/WeatherOverlay";
import { BoardMusicLighting, resolveBoardMusicLighting } from "./BoardMusicLighting";

function readTextFile(relativePath: string): string {
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

describe("BoardMusicLighting", () => {
  it("resolves source-based lighting palettes for travis, lofi, realm seasons, and idle state", () => {
    const travis = resolveBoardMusicLighting({ source: "travis", playing: true }, "Spring");
    expect(travis.playing).toBe(true);
    expect(travis.topColor).toBe("#fde68a");
    expect(travis.bottomColor).toBe("#f59e0b");
    expect(travis.ambientOpacity).toBeGreaterThan(0);

    const lofi = resolveBoardMusicLighting({ source: "lofi", playing: true }, "Spring");
    expect(lofi.playing).toBe(true);
    expect(lofi.topColor).toBe("#a5b4fc");
    expect(lofi.bottomColor).toBe("#4f6d9a");
    expect(lofi.topColor).not.toBe(travis.topColor);

    const realmPalettes = (["Spring", "Summer", "Autumn", "Winter"] as const).map((season) =>
      resolveBoardMusicLighting({ source: "realm", playing: true }, season),
    );
    expect(new Set(realmPalettes.map((d) => d.topColor)).size).toBe(4);
    expect(realmPalettes[3].topColor).toBe("#e0f2fe");

    const paused = resolveBoardMusicLighting({ source: "travis", playing: false }, "Spring");
    expect(paused.playing).toBe(false);
    expect(paused.ambientOpacity).toBe(0);
    expect(paused.haloOpacity).toBe(0);
  });

  it("renders source-tinted decorative SVG lighting on the board and integrates with BoardLiving", () => {
    const state = createGameState({ seed: 1 });
    state.meta.tick = 6000; // Winter

    const travisHtml = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <BoardMusicLighting state={state} nowPlayingOverride={{ source: "travis", playing: true }} />
      </svg>,
    );
    expect(travisHtml).toContain("sc-board-music-lighting is-playing source-travis");
    expect(travisHtml).toContain('data-music-playing="true"');
    expect(travisHtml).toContain('data-music-source="travis"');
    expect(travisHtml).toContain('aria-hidden="true"');
    expect(travisHtml).toContain("pointer-events:none");
    expect(travisHtml).toContain("#fde68a");

    const lofiHtml = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <BoardMusicLighting state={state} nowPlayingOverride={{ source: "lofi", playing: true }} />
      </svg>,
    );
    expect(lofiHtml).toContain("source-lofi");
    expect(lofiHtml).toContain("#a5b4fc");

    const realmHtml = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <BoardMusicLighting state={state} nowPlayingOverride={{ source: "realm", playing: true }} />
      </svg>,
    );
    expect(realmHtml).toContain("source-realm season-winter");
    expect(realmHtml).toContain("#e0f2fe");

    const idleHtml = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <BoardMusicLighting state={state} nowPlayingOverride={{ source: "travis", playing: false }} />
      </svg>,
    );
    expect(idleHtml).toContain("sc-board-music-lighting is-idle");
    expect(idleHtml).toContain('data-music-playing="false"');

    const boardHtml = renderToStaticMarkup(
      <BoardLiving state={state} selectedId={null} visible={true} />,
    );
    expect(boardHtml).toContain("sc-board-music-lighting");
  });

  it("computes light particle/weather boosts and stamps data-music-* attributes on WeatherOverlay", () => {
    expect(resolveMusicWeatherResponse(false, "travis", "Autumn", "rain")).toEqual({
      countMultiplier: 1,
      alphaMultiplier: 1,
      speedMultiplier: 1,
      moteCount: 0,
      moteColor: "",
    });

    const rainBoost = resolveMusicWeatherResponse(true, "lofi", "Autumn", "rain");
    expect(rainBoost.countMultiplier).toBeGreaterThan(1);
    expect(rainBoost.alphaMultiplier).toBeGreaterThan(1);

    const clearTravis = resolveMusicWeatherResponse(true, "travis", "Spring", "clear");
    const clearLofi = resolveMusicWeatherResponse(true, "lofi", "Spring", "clear");
    const clearRealmSpring = resolveMusicWeatherResponse(true, "realm", "Spring", "clear");
    expect(clearTravis.moteCount).toBeGreaterThan(0);
    expect(clearTravis.moteColor).toBe("#fde68a");
    expect(clearLofi.moteColor).toBe("#b8c7e8");
    expect(clearRealmSpring.moteColor).toBe("#86efac");

    const weatherHtml = renderToStaticMarkup(
      <WeatherOverlay season="Spring" holiday="none" nowPlayingOverride={{ source: "travis", playing: true }} />,
    );
    expect(weatherHtml).toContain('data-music-playing="true"');
    expect(weatherHtml).toContain('data-music-source="travis"');
    expect(weatherHtml).toContain("pointer-events:none");
  });

  it("keeps CSS isolated from theme.css with pointer-events: none and source/season selectors", () => {
    const css = readTextFile("./board-music-lighting.css");
    const themeCss = readTextFile("../theme.css");

    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain('html[data-music-playing="true"][data-music-source="travis"]');
    expect(css).toContain('html[data-music-playing="true"][data-music-source="lofi"]');
    expect(css).toContain('html[data-music-playing="true"][data-music-source="realm"]');
    for (const season of ["spring", "summer", "autumn", "winter"] as const) {
      expect(css).toContain(`.season-${season}`);
    }
    expect(css).toContain('html[data-music-playing="true"] .sc-map-canvas-container > div::before');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important;");
    expect(themeCss).not.toContain("sc-board-music");
  });
});
