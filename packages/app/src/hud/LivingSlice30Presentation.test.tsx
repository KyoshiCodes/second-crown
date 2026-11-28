import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BOARD_H, BOARD_W } from "@second-crown/shared";
import { CANVAS_H, CANVAS_W, boardCameraFit, boardGridToWorld } from "@second-crown/render";
import {
  BUILDING_VARIETY,
  BUILDING_VARIETY_NOTE_BUILDING,
  BUILDING_VARIETY_NOTE_GROWING,
  BUILDING_VARIETY_NOTE_TOP,
  BUILDING_VARIETY_NOTE_UPGRADING,
  BUILDING_VARIETY_TIER_DETAIL,
  WORK_STATION_BENEFIT_LABEL,
  WORK_STATION_BENEFIT_NOTE_ACTIVE,
  WORK_STATION_BENEFIT_NOTE_BUILDING,
  WORK_STATION_BENEFIT_NOTE_EMPTY,
  WORK_STATION_BENEFIT_NOTE_UPGRADING,
  createGameState,
  isProvinceSeen,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import { BoardWideEnvironment, resolveBoardViewportFit } from "./BoardWideEnvironment";
import { BuildingVarietyRow, resolveBuildingVariety } from "./BuildingVarietyBadge";
import { WorkCard } from "./WorkCard";
import { WorkStationBenefitBadge, resolveWorkStationBenefit } from "./WorkStationBenefitMark";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function emptyState(): GameState {
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

describe("Living Realm Slice 30: 16x10 board framing, building variety & work-station benefit visuals", () => {
  it("frames the 16x10 board cleanly inside the 560x360 viewport with BoardWideEnvironment", () => {
    expect([BOARD_W, BOARD_H]).toEqual([16, 10]);
    const fit = boardCameraFit(BOARD_W, BOARD_H);
    for (const [gx, gy] of [
      [0, 0],
      [BOARD_W - 1, 0],
      [BOARD_W - 1, BOARD_H - 1],
      [0, BOARD_H - 1],
    ]) {
      const { wx, wy } = boardGridToWorld(gx, gy);
      const sx = wx * fit.scale + fit.offsetX;
      const sy = wy * fit.scale + fit.offsetY;
      expect(sx).toBeGreaterThan(0);
      expect(sx).toBeLessThan(CANVAS_W);
      expect(sy).toBeGreaterThan(0);
      expect(sy).toBeLessThan(CANVAS_H);
    }

    const s = emptyState();
    const resolved = resolveBoardViewportFit(s);
    expect(resolved.width).toBe(16);
    expect(resolved.height).toBe(10);
    expect(resolved.isWide).toBe(true);

    const html = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(html).toContain('viewBox="0 0 560 360"');
    expect(html).toContain('class="sc-bwenv-layer is-wide" data-bwenv-dims="16x10"');
    expect(html).toContain(`class="sc-board-world-fit" data-board-fit-scale="${fit.scale}"`);
    expect(renderToStaticMarkup(<svg><BoardWideEnvironment state={s} /></svg>)).toContain("sc-bwenv-mist");
  });

  it("renders BuildingVarietyRow in WorkCard across styles, tier details, build/upgrade phases, and hides when off", () => {
    expect(resolveBuildingVariety(undefined, "b1")).toBeNull();
    expect(renderToStaticMarkup(<BuildingVarietyRow state={{} as GameState} buildingId="b1" />)).toBe("");

    const s = emptyState();
    const t1Farm = addWork(s, "farm", { level: 1 });
    const t3Quarry = addWork(s, "quarry", { x: 4, y: 2, level: 3 });
    const t5Keep = addWork(s, "keep", { x: 2, y: 2, level: 5 });
    const building = addWork(s, "lumber_camp", { x: 5, y: 2, level: 2, completesAtTick: 20200 });
    const upgrading = addWork(s, "market", { x: 6, y: 2, level: 2 });
    s.flags.upgrades_json = [
      { id: "up1", buildingId: upgrading.id, fromLevel: 2, doneTick: 20250, ticks: 50, paid: {} },
    ];

    const farmHtml = renderToStaticMarkup(<WorkCard state={s} b={t1Farm} scarred={false} act={noop} />);
    expect(farmHtml).toContain("sc-bvar-family-agrarian");
    expect(farmHtml).toContain(`data-bvar-variety="${BUILDING_VARIETY.farm}"`);
    expect(farmHtml).toContain(BUILDING_VARIETY_NOTE_GROWING);

    const quarryHtml = renderToStaticMarkup(<WorkCard state={s} b={t3Quarry} scarred={false} act={noop} />);
    expect(quarryHtml).toContain("sc-bvar-family-masonry");
    expect(quarryHtml).toContain(`data-bvar-detail="${BUILDING_VARIETY_TIER_DETAIL[3]}"`);
    expect(quarryHtml).toContain(BUILDING_VARIETY.quarry);

    const keepHtml = renderToStaticMarkup(<WorkCard state={s} b={t5Keep} scarred={false} act={noop} />);
    expect(keepHtml).toContain("sc-bvar-family-martial");
    expect(keepHtml).toContain('data-bvar-stage="top"');
    expect(keepHtml).toContain(BUILDING_VARIETY_TIER_DETAIL[5]!);
    expect(keepHtml).toContain(BUILDING_VARIETY_NOTE_TOP);

    const buildHtml = renderToStaticMarkup(<BuildingVarietyRow state={s} buildingId={building.id} />);
    expect(buildHtml).toContain('data-bvar-stage="building"');
    expect(buildHtml).toContain(BUILDING_VARIETY_NOTE_BUILDING);

    const upgHtml = renderToStaticMarkup(<BuildingVarietyRow state={s} buildingId={upgrading.id} />);
    expect(upgHtml).toContain('data-bvar-stage="upgrading"');
    expect(upgHtml).toContain(BUILDING_VARIETY_TIER_DETAIL[2]!);
    expect(upgHtml).toContain(BUILDING_VARIETY_NOTE_UPGRADING);

    setLivingSwitch(s, "buildingVariety", false);
    expect(renderToStaticMarkup(<BuildingVarietyRow state={s} buildingId={t3Quarry.id} />)).toBe("");
  });

  it("renders WorkStationBenefitBadge for active, empty, building, and upgrading stations, and hides when no station or off", () => {
    expect(resolveWorkStationBenefit(undefined, "b1")).toBeNull();
    expect(renderToStaticMarkup(<WorkStationBenefitBadge state={{} as GameState} buildingId="b1" />)).toBe("");

    const s = emptyState();
    const emptyFarm = addWork(s, "farm");
    const staffedQuarry = addWork(s, "quarry", { x: 4, y: 2 });
    const cottage = addWork(s, "cottage", { x: 2, y: 2 });
    const buildingFarm = addWork(s, "farm", { x: 5, y: 1, completesAtTick: 20200 });
    const upgradingFarm = addWork(s, "farm", { x: 6, y: 1 });
    s.citizens.push({ id: "c1", realmId: "player", job: "miner", tile: { x: 4, y: 2 } });
    s.citizens.push({ id: "c2", realmId: "player", job: "farmer", tile: { x: 5, y: 1 } });
    s.flags.upgrades_json = [
      { id: "up1", buildingId: upgradingFarm.id, fromLevel: 1, doneTick: 20250, ticks: 50, paid: {} },
    ];

    expect(renderToStaticMarkup(<WorkStationBenefitBadge state={s} buildingId={cottage.id} />)).toBe("");

    const emptyHtml = renderToStaticMarkup(<WorkCard state={s} b={emptyFarm} scarred={false} act={noop} />);
    expect(emptyHtml).toContain('data-wben-active="false" data-wben-state="inactive"');
    expect(emptyHtml).toContain(WORK_STATION_BENEFIT_LABEL);
    expect(emptyHtml).toContain(WORK_STATION_BENEFIT_NOTE_EMPTY);

    const activeHtml = renderToStaticMarkup(<WorkCard state={s} b={staffedQuarry} scarred={false} act={noop} />);
    expect(activeHtml).toContain('data-wben-active="true" data-wben-state="active"');
    expect(activeHtml).toContain(WORK_STATION_BENEFIT_NOTE_ACTIVE);

    expect(renderToStaticMarkup(<WorkStationBenefitBadge state={s} buildingId={buildingFarm.id} />)).toContain(
      WORK_STATION_BENEFIT_NOTE_BUILDING,
    );
    expect(renderToStaticMarkup(<WorkStationBenefitBadge state={s} buildingId={upgradingFarm.id} />)).toContain(
      WORK_STATION_BENEFIT_NOTE_UPGRADING,
    );

    setLivingSwitch(s, "workStationBenefit", false);
    expect(renderToStaticMarkup(<WorkStationBenefitBadge state={s} buildingId={staffedQuarry.id} />)).toBe("");
  });

  it("reads 16x10 viewport fit, buildingVariety, and workStationBenefit without mutating GameState", () => {
    const s = emptyState();
    const farm = addWork(s, "farm", { level: 4 });
    s.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 3, y: 3 } });
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    isProvinceSeen(s, home.id);
    const before = JSON.stringify(s);
    const cardHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop} />);
    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(cardHtml).toContain("sc-bvar-row");
    expect(cardHtml).toContain("sc-wben-row");
    expect(boardHtml).toContain("sc-board-world-fit");
    expect(JSON.stringify(s)).toBe(before);
  });

  it("isolates Slice 30 styles with Dusk/Night/Parchment tokens, non-blocking marks, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./board-wide-env.css",
      "./building-variety.css",
      "./work-station-benefit.css",
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
