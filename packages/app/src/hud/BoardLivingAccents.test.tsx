import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createGameState } from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import {
  BoardLivingAccents,
  listKeepAccents,
  listTerrainAccents,
  resolveAccentMusicTint,
  resolveProvinceSelectionFeedback,
} from "./BoardLivingAccents";

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

describe("BoardLivingAccents", () => {
  it("resolves quiet, deterministic keep and terrain accents responsive to time of day and music", () => {
    const state = createGameState({ seed: 1 });
    const silent = { playing: false, source: "travis" as const };
    const travis = { playing: true, source: "travis" as const };
    const lofi = { playing: true, source: "lofi" as const };

    const dayKeeps = listKeepAccents(state, "day", silent);
    const nightKeeps = listKeepAccents(state, "night", travis);
    expect(dayKeeps.length).toBeGreaterThanOrEqual(1);
    expect(dayKeeps.length).toBeLessThanOrEqual(8);
    expect(nightKeeps[0].glowOpacity).toBeGreaterThan(dayKeeps[0].glowOpacity);

    const terrainA = listTerrainAccents(state, "night", travis);
    const terrainB = listTerrainAccents(state, "night", travis);
    expect(terrainA).toEqual(terrainB);
    expect(terrainA.length).toBeLessThanOrEqual(10);

    const tintTravis = resolveAccentMusicTint(true, "travis", "night");
    const tintLofi = resolveAccentMusicTint(true, "lofi", "night");
    expect(tintTravis.firefly).toBe("#fde68a");
    expect(tintLofi.firefly).toBe("#c7d2fe");
    expect(resolveAccentMusicTint(false, "travis", "day").keepOpacity).toBeLessThan(tintTravis.keepOpacity);
  });

  it("builds tactile province selection feedback by ownership/visibility and integrates into BoardLiving", () => {
    const state = createGameState({ seed: 1 });
    const homeId = state.board.homeProvinceId;
    const silent = { playing: false, source: "travis" as const };
    const playing = { playing: true, source: "travis" as const };

    expect(resolveProvinceSelectionFeedback(state, null, silent)).toBeNull();
    expect(resolveProvinceSelectionFeedback(state, "no_such_tile", silent)).toBeNull();

    const homeSel = resolveProvinceSelectionFeedback(state, homeId, playing);
    expect(homeSel).not.toBeNull();
    expect(homeSel?.tone).toBe("player");
    expect(homeSel?.edgeColor).toBe("#fef08a");

    const unseen = state.board.provinces.find((p) => p.id !== homeId && !p.occupantRealmId);
    if (unseen) {
      const sel = resolveProvinceSelectionFeedback(state, unseen.id, silent);
      expect(["fog", "neutral"]).toContain(sel?.tone);
    }

    const html = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <BoardLivingAccents
          state={state}
          selectedId={homeId}
          dayPhase="night"
          nowPlayingOverride={{ playing: true, source: "travis" }}
        />
      </svg>,
    );
    expect(html).toContain("sc-board-living-accents phase-night source-travis is-music-playing");
    expect(html).toContain('data-day-phase="night"');
    expect(html).toContain('data-music-playing="true"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events:none");
    expect(html).toContain("sc-board-accent-keeps");
    expect(html).toContain("sc-board-select-feedback");
    expect(html).toContain("sc-board-select-ripple");
    expect(html).toContain("sc-board-select-edge");
    expect(html).toContain("sc-board-select-corner");

    const boardHtml = renderToStaticMarkup(
      <BoardLiving state={state} selectedId={homeId} visible={true} />,
    );
    expect(boardHtml).toContain("sc-board-living-accents");
    expect(boardHtml).toContain("sc-board-select-feedback");
  });

  it("isolates styles from theme.css with pointer-events: none and reduced-motion guards", () => {
    const css = readTextFile("./board-living-accents.css");
    const themeCss = readTextFile("../theme.css");

    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-accent-hearth-breathe");
    expect(css).toContain("@keyframes sc-select-ripple-out");
    expect(css).toContain("@keyframes sc-select-edge-pulse");
    expect(css).toContain(".sc-atlas-card:hover");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important;");
    expect(themeCss).not.toContain("sc-board-living-accents");
    expect(themeCss).not.toContain("sc-board-select-");
  });
});
