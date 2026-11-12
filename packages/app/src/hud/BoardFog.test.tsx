import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BoardFogVeil,
  BoardFog,
  BoardFogLiving,
  BoardMistGlyphs,
  listUnseenFogProvinces,
  isFogFrontier,
} from "./BoardFog";
import { BoardLiving } from "../BoardLiving";
import { createGameState, revealProvince, type GameState } from "@second-crown/sim";

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

function freshState(): GameState {
  return createGameState({ seed: 1 });
}

describe("BoardFog", () => {
  it("listUnseenFogProvinces correctly filters out seen provinces and home", () => {
    const state = freshState();
    const unseen = listUnseenFogProvinces(state);

    const homeId = state.board.homeProvinceId;
    const ids = unseen.map((u) => u.id);
    expect(ids).not.toContain(homeId);
    expect(unseen.length).toBeGreaterThan(0);
  });

  it("identifies frontier provinces directly adjacent to explored lands", () => {
    const state = freshState();
    const unseen = listUnseenFogProvinces(state);

    // Some unseen tiles near home should be frontier
    const frontiers = unseen.filter((u) => u.isFrontier);
    expect(frontiers.length).toBeGreaterThan(0);
  });

  it("isFogFrontier returns false if no adjacent tile is seen", () => {
    const state = freshState();
    const seenSet = new Set([state.board.homeProvinceId]);
    // Find a corner tile far from home
    const farProv = state.board.provinces.find(
      (p) => Math.abs(p.x - 6) > 4 && Math.abs(p.y - 4) > 3
    ) || state.board.provinces[0]!;
    expect(isFogFrontier(state, farProv, seenSet)).toBe(false);
  });

  it("sorts unseen provinces in isometric depth order (y * 20 + x)", () => {
    const state = freshState();
    const unseen = listUnseenFogProvinces(state);

    for (let i = 1; i < unseen.length; i++) {
      const prevDepth = unseen[i - 1].y * 20 + unseen[i - 1].x;
      const currDepth = unseen[i].y * 20 + unseen[i].x;
      expect(currDepth).toBeGreaterThanOrEqual(prevDepth);
    }
  });

  it("returns empty array when state or provinces are absent", () => {
    expect(listUnseenFogProvinces(null)).toEqual([]);
    expect(listUnseenFogProvinces(undefined)).toEqual([]);
    expect(listUnseenFogProvinces({} as any)).toEqual([]);
  });

  it("renders null if state is null or all provinces are seen", () => {
    const htmlNull = renderToStaticMarkup(<BoardFogVeil state={null} />);
    expect(htmlNull).toBe("");

    const state = freshState();
    for (const p of state.board.provinces) {
      revealProvince(state, p.id);
    }
    const htmlAllSeen = renderToStaticMarkup(<BoardFogVeil state={state} />);
    expect(htmlAllSeen).toBe("");
  });

  it("renders BoardFogVeil with SVG cumulus lobes, wisps, shadows, and compass star", () => {
    const state = freshState();
    const html = renderToStaticMarkup(<BoardFogVeil state={state} />);

    expect(html).toContain('class="sc-board-living-fog-veil"');
    expect(html).toContain('data-testid="sc-board-living-fog-veil"');
    expect(html).toContain('data-fog-province-id="');
    expect(html).toContain("sc-board-fog-ground-shadow");
    expect(html).toContain("sc-board-fog-base-mist");
    expect(html).toContain("sc-board-fog-underside-shadow");
    expect(html).toContain("sc-board-fog-cumulus-lobe");
    expect(html).toContain("sc-board-fog-core-bank");
    expect(html).toContain("sc-board-fog-crest-highlight");
    expect(html).toContain("sc-board-fog-wisp");
    expect(html).toContain("sc-board-fog-mist-mote");
    expect(html).toContain("sc-board-fog-compass-star");
    expect(html).toContain("sc-board-fog-frontier-glow");
  });

  it("drop-in aliases render identically", () => {
    const state = freshState();
    const html1 = renderToStaticMarkup(<BoardFogVeil state={state} />);
    const html2 = renderToStaticMarkup(<BoardFog state={state} />);
    const html3 = renderToStaticMarkup(<BoardFogLiving state={state} />);
    const html4 = renderToStaticMarkup(<BoardMistGlyphs state={state} />);

    expect(html1).toBe(html2);
    expect(html1).toBe(html3);
    expect(html1).toBe(html4);
  });

  it("integrates into BoardLiving without breaking overlay", () => {
    const state = freshState();
    const html = renderToStaticMarkup(<BoardLiving state={state} selectedId="p_seen" visible={true} />);

    expect(html).toContain("sc-board-living-fog-veil");
    expect(html).toContain("data-fog-province-id=");
    expect(html).toContain("sc-board-fog-compass-star");
  });

  it("board-fog.css enforces pointer-events: none and reduced motion", () => {
    const css = readCssFile("./board-fog.css");

    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("sc-board-fog-compass-star");
    expect(css).toContain("sc-board-fog-wisp");
  });

  it("theme.css was not modified or polluted", () => {
    const theme = readCssFile("../theme.css");

    expect(theme).not.toContain("sc-board-living-fog-veil");
    expect(theme).not.toContain("sc-board-fog-cumulus");
    expect(theme).not.toContain("sc-board-fog-compass-star");
  });
});
