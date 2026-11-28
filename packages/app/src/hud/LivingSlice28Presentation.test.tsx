import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BOARD_SCALE_NOTE_MID,
  BOARD_SCALE_NOTE_SMALL,
  BOARD_SCALE_NOTE_WIDE,
  BUILDING_NOTE_BUILDING,
  BUILDING_NOTE_NO_STATION,
  BUILDING_NOTE_STAFFED,
  BUILDING_NOTE_UNSTAFFED,
  BUILDING_NOTE_UPGRADING,
  BUILDING_WORK_STATIONS,
  createGameState,
  isProvinceSeen,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { BOARD_H, BOARD_W } from "@second-crown/shared";
import { BoardLiving } from "../BoardLiving";
import { BoardScaleHorizon, BoardScaleNote, resolveBoardScale } from "./BoardScaleTag";
import { BuildingDetailStrip, resolveBuildingDetail } from "./BuildingDetailBadge";
import { WorkCard } from "./WorkCard";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function emptyBuildingState(): GameState {
  const s = createGameState({ seed: 1, now: 1, withStarterBuildings: false });
  s.meta.tick = 20100;
  s.citizens = [];
  s.flags.upgrades_json = [];
  return s;
}

function addWork(
  s: GameState,
  typeId: string,
  opts: Partial<GameState["buildings"][number]> = {},
) {
  const b = {
    id: `b_${typeId}_${s.buildings.length}`,
    typeId,
    realmId: "player",
    x: 3,
    y: 3,
    level: 1,
    completesAtTick: null,
    ...opts,
  } as GameState["buildings"][number];
  s.buildings.push(b);
  return b;
}

const noop = (() => ({ ok: true })) as never;

describe("Living Realm Slice 28: building detail & board scale note", () => {
  it("renders BuildingDetailStrip on WorkCard across tiers, stations, states, and hides when off", () => {
    expect(resolveBuildingDetail(undefined, "b1")).toBeNull();
    expect(renderToStaticMarkup(<BuildingDetailStrip state={{} as GameState} buildingId="b1" />)).toBe("");

    const s = emptyBuildingState();
    const farm = addWork(s, "farm", { level: 3 });
    const quarry = addWork(s, "quarry", { x: 4, y: 2, level: 5 });
    const cottage = addWork(s, "cottage", { x: 2, y: 2, level: 2 });
    const lumber = addWork(s, "lumber_camp", { x: 5, y: 1, completesAtTick: 20200 });
    const market = addWork(s, "market", { x: 6, y: 1, level: 1 });
    s.citizens.push({ id: "c1", realmId: "player", job: "miner", tile: { x: 4, y: 2 } });
    s.flags.upgrades_json = [
      { id: "up1", buildingId: market.id, fromLevel: 1, doneTick: 20250, ticks: 50, paid: {} },
    ];

    const farmHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop} />);
    expect(farmHtml).toContain("sc-bdet-depth-t3");
    expect(farmHtml).toContain('data-building-tier="tier-3"');
    expect(farmHtml).toContain('data-bdet-tier="Tier III"');
    expect(farmHtml).toContain('data-bdet-state="unstaffed"');
    expect(farmHtml).toContain('data-bdet-station="field"');
    expect(farmHtml).toContain(BUILDING_WORK_STATIONS.farmer);
    expect(farmHtml).toContain(BUILDING_NOTE_UNSTAFFED);
    expect(farmHtml).toContain("Demolish");

    const quarryHtml = renderToStaticMarkup(<WorkCard state={s} b={quarry} scarred={false} act={noop} />);
    expect(quarryHtml).toContain("sc-bdet-depth-t5");
    expect(quarryHtml).toContain('data-bdet-tier="Tier V"');
    expect(quarryHtml).toContain('data-bdet-state="staffed"');
    expect(quarryHtml).toContain('data-bdet-station="pit"');
    expect(quarryHtml).toContain("sc-bdet-station is-pit is-staffed");
    expect(quarryHtml).toContain(BUILDING_NOTE_STAFFED);

    const cottageHtml = renderToStaticMarkup(<WorkCard state={s} b={cottage} scarred={false} act={noop} />);
    expect(cottageHtml).toContain("sc-bdet-depth-t2");
    expect(cottageHtml).toContain('data-bdet-state="passive"');
    expect(cottageHtml).toContain(BUILDING_NOTE_NO_STATION);
    expect(cottageHtml).not.toContain("sc-bdet-station is-");

    const lumberHtml = renderToStaticMarkup(<BuildingDetailStrip state={s} buildingId={lumber.id} />);
    expect(lumberHtml).toContain('data-bdet-state="building"');
    expect(lumberHtml).toContain(BUILDING_NOTE_BUILDING);

    const marketHtml = renderToStaticMarkup(<BuildingDetailStrip state={s} buildingId={market.id} />);
    expect(marketHtml).toContain('data-bdet-state="upgrading"');
    expect(marketHtml).toContain(BUILDING_NOTE_UPGRADING);

    setLivingSwitch(s, "buildingDetail", false);
    const offCardHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop} />);
    expect(offCardHtml).not.toContain("sc-bdet-strip");
    expect(offCardHtml).not.toContain("sc-bdet-depth-");
    expect(offCardHtml).not.toContain("data-building-tier");
  });

  it("renders BoardScaleHorizon & BoardScaleNote on BoardLiving across scale bands without altering board size", () => {
    expect(resolveBoardScale(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardScaleHorizon state={{} as GameState} />)).toBe("");
    expect(renderToStaticMarkup(<BoardScaleNote state={{} as GameState} />)).toBe("");

    const s = emptyBuildingState();
    const midHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(midHtml).toContain('class="sc-bscale-frame is-mid"');
    expect(midHtml).toContain(`data-bscale-dims="${BOARD_W}x${BOARD_H}"`);
    expect(midHtml).toContain('class="sc-bscale-note is-mid"');
    expect(midHtml).toContain(`${BOARD_W}×${BOARD_H}`);
    expect(midHtml).toContain(BOARD_SCALE_NOTE_MID);
    expect(s.board.width).toBe(BOARD_W);
    expect(s.board.height).toBe(BOARD_H);

    s.board.width = 6;
    s.board.height = 8;
    const smallHtml = renderToStaticMarkup(<BoardScaleNote state={s} />);
    expect(smallHtml).toContain('data-bscale-band="small"');
    expect(smallHtml).toContain("6×8");
    expect(smallHtml).toContain(BOARD_SCALE_NOTE_SMALL);

    s.board.width = 14;
    s.board.height = 10;
    const wideHtml = renderToStaticMarkup(<BoardScaleNote state={s} />);
    expect(wideHtml).toContain('data-bscale-band="wide"');
    expect(wideHtml).toContain("14×10");
    expect(wideHtml).toContain(BOARD_SCALE_NOTE_WIDE);

    setLivingSwitch(s, "boardScale", false);
    expect(renderToStaticMarkup(<BoardScaleHorizon state={s} />)).toBe("");
    expect(renderToStaticMarkup(<BoardScaleNote state={s} />)).toBe("");
  });

  it("reads buildingDetail and boardScale without mutating GameState", () => {
    const s = emptyBuildingState();
    const farm = addWork(s, "farm");
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    isProvinceSeen(s, home.id);
    const before = JSON.stringify(s);
    const cardHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop} />);
    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(cardHtml).toContain("sc-bdet-strip");
    expect(boardHtml).toContain("sc-bscale-note");
    expect(JSON.stringify(s)).toBe(before);
  });

  it("isolates Slice 28 styles with Dusk/Night/Parchment tokens, non-blocking marks, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./building-detail.css",
      "./board-scale.css",
    ]) {
      const css = readTextFile(cssPath);
      expect(css, cssPath).toContain(':root[data-chrome="dusk"]');
      expect(css, cssPath).toContain(':root[data-chrome="night"]');
      expect(css, cssPath).toContain(':root[data-chrome="parchment"]');
      expect(css, cssPath).toContain("pointer-events: none !important;");
      expect(css, cssPath).toContain("@media (prefers-reduced-motion: reduce)");
      for (const token of forbidden) {
        expect(css, `${cssPath} should not contain ${token}`).not.toContain(token);
      }
    }
  });
});
