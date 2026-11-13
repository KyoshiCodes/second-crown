import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createGameState, type GameState } from "@second-crown/sim";
import {
  BoardDayNight,
  listFinishedBuildingLanterns,
  resolveDayNightDescriptor,
} from "./BoardDayNight";
import { BoardLiving } from "../BoardLiving";

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

function makeStateAtTick(tick: number): GameState {
  const state = createGameState();
  state.meta.tick = tick;
  return state;
}

describe("BoardDayNight", () => {
  it("shifts descriptor from warm daylight to cool night", () => {
    const dawn = resolveDayNightDescriptor(makeStateAtTick(100));
    const day = resolveDayNightDescriptor(makeStateAtTick(1000));
    const dusk = resolveDayNightDescriptor(makeStateAtTick(2100));
    const night = resolveDayNightDescriptor(makeStateAtTick(3000));

    expect(dawn.phase).toBe("dawn");
    expect(dawn.isNight).toBe(false);
    expect(day.phase).toBe("day");
    expect(day.isNight).toBe(false);
    expect(day.tileFill).toBe("#fef08a");
    expect(dusk.phase).toBe("dusk");
    expect(dusk.isNight).toBe(false);
    expect(night.phase).toBe("night");
    expect(night.isNight).toBe(true);
    expect(night.tileFill).toBe("#38bdf8");
    expect(night.washTop).toBe("#1e3a8a");
  });

  it("collects lantern points only for finished buildings on seen holds", () => {
    const state = makeStateAtTick(3000);
    state.buildings = [
      { id: "b_done_1", typeId: "farm", realmId: "player", completesAtTick: null, damaged: false } as any,
      { id: "b_done_2", typeId: "cottage", realmId: "player", completesAtTick: null, damaged: false } as any,
      { id: "b_wip_1", typeId: "smithy", realmId: "player", completesAtTick: 3500, damaged: false } as any,
    ];

    const lanterns = listFinishedBuildingLanterns(state);
    expect(lanterns.map((l) => l.buildingId)).toEqual(["b_done_1", "b_done_2"]);
  });

  it("renders warm daylight wash without building lanterns during day, and cool night wash with lantern glows at night", () => {
    const dayState = makeStateAtTick(1000);
    dayState.buildings = [
      { id: "b_done_1", typeId: "farm", realmId: "player", completesAtTick: null, damaged: false } as any,
    ];

    const dayHtml = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <BoardDayNight state={dayState} />
      </svg>,
    );
    expect(dayHtml).toContain("sc-board-day-night is-day");
    expect(dayHtml).toContain(`data-night="false"`);
    expect(dayHtml).toContain(`aria-hidden="true"`);
    expect(dayHtml).toContain(`pointer-events:none`);
    expect(dayHtml).not.toContain("sc-board-day-night-lantern-bloom");

    const nightState = makeStateAtTick(3000);
    nightState.buildings = [
      { id: "b_done_1", typeId: "farm", realmId: "player", completesAtTick: null, damaged: false } as any,
      { id: "b_wip_1", typeId: "smithy", realmId: "player", completesAtTick: 3400, damaged: false } as any,
    ];

    const nightHtml = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <BoardDayNight state={nightState} />
      </svg>,
    );
    expect(nightHtml).toContain("sc-board-day-night is-night");
    expect(nightHtml).toContain(`data-night="true"`);
    expect(nightHtml).toContain("sc-board-day-night-lantern-bloom");
    expect(nightHtml).toContain("sc-board-day-night-lantern-core");
    expect(nightHtml).toContain(`data-building-id="b_done_1"`);
    expect(nightHtml).not.toContain(`data-building-id="b_wip_1"`);
  });

  it("integrates into BoardLiving over the isometric board", () => {
    const nightState = makeStateAtTick(3000);
    nightState.buildings = [
      { id: "b_done_1", typeId: "farm", realmId: "player", completesAtTick: null, damaged: false } as any,
    ];

    const html = renderToStaticMarkup(
      <BoardLiving state={nightState} selectedId={null} visible={true} />,
    );
    expect(html).toContain("sc-board-living");
    expect(html).toContain("sc-board-day-night is-night");
    expect(html).toContain("sc-board-day-night-lantern");
  });

  it("keeps CSS isolated with pointer-events: none and reduced-motion support", () => {
    const css = readCssFile("./board-day-night.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain(".sc-board-day-night.is-night");
    expect(css).toContain(".sc-board-day-night-lantern-bloom");
  });
});
