import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createGameState, type GameState } from "@second-crown/sim";

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
import {
  BoardSeasonWash,
  normalizeBoardSeason,
  resolveSeasonWashDescriptor,
} from "./BoardSeasonWash";
import { BoardLiving } from "../BoardLiving";

const SEASON_TICKS = [0, 2000, 4000, 6000] as const;

function stateWithSeasonIndex(seasonIdx: number): GameState {
  const state = createGameState();
  state.meta.tick = SEASON_TICKS[seasonIdx % 4];
  return state;
}

describe("BoardSeasonWash", () => {
  it("normalizes season strings cleanly", () => {
    expect(normalizeBoardSeason("Spring")).toBe("spring");
    expect(normalizeBoardSeason("Summer")).toBe("summer");
    expect(normalizeBoardSeason("Autumn")).toBe("autumn");
    expect(normalizeBoardSeason("Fall")).toBe("autumn");
    expect(normalizeBoardSeason("Winter")).toBe("winter");
  });

  it("resolves distinct seasonal descriptors for spring green, summer gold, autumn amber, and winter cool", () => {
    const spring = resolveSeasonWashDescriptor(stateWithSeasonIndex(0));
    const summer = resolveSeasonWashDescriptor(stateWithSeasonIndex(1));
    const autumn = resolveSeasonWashDescriptor(stateWithSeasonIndex(2));
    const winter = resolveSeasonWashDescriptor(stateWithSeasonIndex(3));

    expect(spring.season).toBe("spring");
    expect(spring.tileFill).toBe("#4ade80");
    expect(summer.season).toBe("summer");
    expect(summer.tileFill).toBe("#fde047");
    expect(autumn.season).toBe("autumn");
    expect(autumn.tileFill).toBe("#f59e0b");
    expect(winter.season).toBe("winter");
    expect(winter.tileFill).toBe("#bae6fd");

    expect(new Set([spring.tileFill, summer.tileFill, autumn.tileFill, winter.tileFill]).size).toBe(4);
    expect(new Set([spring.fogSoftFill, summer.fogSoftFill, autumn.fogSoftFill, winter.fogSoftFill]).size).toBe(4);
  });

  it("renders seasonal tile tints and fog-softening veils with pointer-events: none", () => {
    for (let i = 0; i < 4; i++) {
      const state = stateWithSeasonIndex(i);
      const desc = resolveSeasonWashDescriptor(state);
      const html = renderToStaticMarkup(
        <svg viewBox="0 0 560 360">
          <BoardSeasonWash state={state} />
        </svg>,
      );

      expect(html).toContain(`sc-board-season-wash is-${desc.season}`);
      expect(html).toContain(`data-season="${desc.season}"`);
      expect(html).toContain(`aria-hidden="true"`);
      expect(html).toContain(`pointer-events:none`);
      expect(html).toContain("sc-board-season-wash-ambient");
      expect(html).toContain("sc-board-season-wash-tile");
      expect(html).toContain(desc.tileFill);

      // Initial state has unseen provinces covered by fog-softening veils
      expect(html).toContain("sc-board-season-wash-fog");
      expect(html).toContain(`sc-board-season-fog-${desc.season}`);
    }
  });

  it("integrates into BoardLiving over the isometric board", () => {
    const winterState = stateWithSeasonIndex(3);
    const html = renderToStaticMarkup(
      <BoardLiving state={winterState} selectedId={null} visible={true} />,
    );

    expect(html).toContain("sc-board-living");
    expect(html).toContain("sc-board-season-wash is-winter");
    expect(html).toContain("sc-board-season-wash-tile");
    expect(html).toContain("sc-board-season-wash-fog");
  });

  it("keeps CSS isolated with pointer-events: none and reduced-motion support", () => {
    const css = readCssFile("./board-season-wash.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain(".sc-board-season-wash.is-spring");
    expect(css).toContain(".sc-board-season-wash.is-summer");
    expect(css).toContain(".sc-board-season-wash.is-autumn");
    expect(css).toContain(".sc-board-season-wash.is-winter");
  });
});
