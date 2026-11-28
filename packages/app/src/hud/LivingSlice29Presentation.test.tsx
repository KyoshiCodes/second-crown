import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BOARD_BAND_MID,
  BOARD_BAND_WIDE,
  BOARD_EXPANSION_NOTE_PLANNED,
  BOARD_EXPANSION_NOTE_WIDEST,
  BUILDING_LIFE_NOTE_BUILDING,
  BUILDING_LIFE_NOTE_NO_STATION,
  BUILDING_LIFE_NOTE_STAFFED,
  BUILDING_LIFE_NOTE_UNSTAFFED,
  BUILDING_LIFE_NOTE_UPGRADING,
  WORK_STATION_NOTE_BUILDING,
  WORK_STATION_NOTE_EMPTY,
  WORK_STATION_NOTE_STAFFED,
  WORK_STATION_NOTE_UPGRADING,
  WORK_STATION_STAGED,
  createGameState,
  isProvinceSeen,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { BOARD_H, BOARD_W } from "@second-crown/shared";
import { BoardLiving } from "../BoardLiving";
import { BoardExpansionBadge, BoardExpansionRim, resolveBoardExpansion } from "./BoardExpansionBackdrop";
import { BuildingLifeRow, resolveBuildingLife } from "./BuildingLifeOverlay";
import { WorkCard } from "./WorkCard";
import { WorkStationStagingBadge, resolveWorkStationStaging } from "./WorkStationStagingMark";

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

describe("Living Realm Slice 29: building life, work-station staging, and board expansion prep", () => {
  it("renders BuildingLifeRow across tier ornaments and motions in WorkCard and hides when off", () => {
    expect(resolveBuildingLife(undefined, "b1")).toBeNull();
    expect(renderToStaticMarkup(<BuildingLifeRow state={{} as GameState} buildingId="b1" />)).toBe("");

    const s = emptyState();
    const t1Farm = addWork(s, "farm", { level: 1 });
    const t5Quarry = addWork(s, "quarry", { x: 4, y: 2, level: 5 });
    const building = addWork(s, "farm", { x: 5, y: 2, level: 4, completesAtTick: 20200 });
    const upgrading = addWork(s, "farm", { x: 6, y: 2, level: 2 });
    const cottage = addWork(s, "cottage", { x: 2, y: 2, level: 3 });
    s.citizens.push({ id: "c1", realmId: "player", job: "miner", tile: { x: 4, y: 2 } });
    s.flags.upgrades_json = [
      { id: "up1", buildingId: upgrading.id, fromLevel: 2, doneTick: 20250, ticks: 50, paid: {} },
    ];

    const farmHtml = renderToStaticMarkup(<WorkCard state={s} b={t1Farm} scarred={false} act={noop} />);
    expect(farmHtml).toContain('data-blife-motion="still"');
    expect(farmHtml).toContain('data-blife-elements=""');
    expect(farmHtml).toContain(BUILDING_LIFE_NOTE_UNSTAFFED);
    expect(farmHtml).not.toContain("sc-blife-ornaments");

    const quarryHtml = renderToStaticMarkup(<WorkCard state={s} b={t5Quarry} scarred={false} act={noop} />);
    expect(quarryHtml).toContain('data-blife-motion="work"');
    expect(quarryHtml).toContain("sc-blife-ornaments");
    expect(quarryHtml).toContain("sc-blife-banner");
    expect(quarryHtml).toContain("sc-blife-lamp");
    expect(quarryHtml).toContain("sc-blife-trim");
    expect(quarryHtml).toContain("sc-blife-crest");
    expect(quarryHtml).toContain(BUILDING_LIFE_NOTE_STAFFED);

    const buildHtml = renderToStaticMarkup(<BuildingLifeRow state={s} buildingId={building.id} />);
    expect(buildHtml).toContain('data-blife-motion="scaffold"');
    expect(buildHtml).toContain(BUILDING_LIFE_NOTE_BUILDING);
    expect(buildHtml).not.toContain("sc-blife-ornaments");

    const upgHtml = renderToStaticMarkup(<BuildingLifeRow state={s} buildingId={upgrading.id} />);
    expect(upgHtml).toContain('data-blife-motion="hammers"');
    expect(upgHtml).toContain("Banner");
    expect(upgHtml).toContain(BUILDING_LIFE_NOTE_UPGRADING);

    const cotHtml = renderToStaticMarkup(<BuildingLifeRow state={s} buildingId={cottage.id} />);
    expect(cotHtml).toContain("Banner, lamps");
    expect(cotHtml).toContain(BUILDING_LIFE_NOTE_NO_STATION);

    setLivingSwitch(s, "buildingLife", false);
    expect(renderToStaticMarkup(<BuildingLifeRow state={s} buildingId={t5Quarry.id} />)).toBe("");
  });

  it("renders WorkStationStagingBadge for stations, staged workers, empty stations, pending states, and hides without station or off", () => {
    expect(resolveWorkStationStaging(undefined, "b1")).toBeNull();
    expect(renderToStaticMarkup(<WorkStationStagingBadge state={{} as GameState} buildingId="b1" />)).toBe("");

    const s = emptyState();
    const emptyFarm = addWork(s, "farm");
    const staffedQuarry = addWork(s, "quarry", { x: 4, y: 2 });
    const cottage = addWork(s, "cottage", { x: 2, y: 2 });
    const buildFarm = addWork(s, "farm", { x: 5, y: 1, completesAtTick: 20200 });
    const upgFarm = addWork(s, "farm", { x: 6, y: 1 });
    s.citizens.push({ id: "c1", realmId: "player", job: "miner", tile: { x: 4, y: 2 } });
    s.citizens.push({ id: "c2", realmId: "player", job: "farmer", tile: { x: 5, y: 1 } });
    s.flags.upgrades_json = [
      { id: "up1", buildingId: upgFarm.id, fromLevel: 1, doneTick: 20250, ticks: 50, paid: {} },
    ];

    expect(renderToStaticMarkup(<WorkStationStagingBadge state={s} buildingId={cottage.id} />)).toBe("");

    const emptyHtml = renderToStaticMarkup(<WorkCard state={s} b={emptyFarm} scarred={false} act={noop} />);
    expect(emptyHtml).toContain('data-wstg-station="field" data-wstg-state="empty"');
    expect(emptyHtml).toContain(WORK_STATION_NOTE_EMPTY);

    const stagedHtml = renderToStaticMarkup(<WorkCard state={s} b={staffedQuarry} scarred={false} act={noop} />);
    expect(stagedHtml).toContain(`data-wstg-station="pit" data-wstg-state="staged" data-wstg-pose="${WORK_STATION_STAGED.Pit}"`);
    expect(stagedHtml).toContain("sc-wstg-pad-worker");
    expect(stagedHtml).toContain(WORK_STATION_STAGED.Pit);
    expect(stagedHtml).toContain(WORK_STATION_NOTE_STAFFED);

    expect(renderToStaticMarkup(<WorkStationStagingBadge state={s} buildingId={buildFarm.id} />)).toContain(WORK_STATION_NOTE_BUILDING);
    expect(renderToStaticMarkup(<WorkStationStagingBadge state={s} buildingId={upgFarm.id} />)).toContain(WORK_STATION_NOTE_UPGRADING);

    setLivingSwitch(s, "workStationStaging", false);
    expect(renderToStaticMarkup(<WorkStationStagingBadge state={s} buildingId={staffedQuarry.id} />)).toBe("");
  });

  it("renders BoardExpansionRim & BoardExpansionBadge cleanly on BoardLiving without altering board size or GameState", () => {
    expect(resolveBoardExpansion(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardExpansionRim state={{} as GameState} />)).toBe("");
    expect(renderToStaticMarkup(<BoardExpansionBadge state={{} as GameState} />)).toBe("");

    const s = emptyState();
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    isProvinceSeen(s, home.id);
    const before = JSON.stringify(s);

    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    // Slice 30: the live board is 16x10, already the widest band.
    expect(boardHtml).toContain('class="sc-bexp-rim is-widest"');
    expect(boardHtml).toContain('class="sc-bexp-badge is-widest"');
    expect(boardHtml).toContain(BOARD_EXPANSION_NOTE_WIDEST);
    expect(s.board.width).toBe(BOARD_W);
    expect(s.board.height).toBe(BOARD_H);
    expect(JSON.stringify(s)).toBe(before);

    s.board.width = 12;
    s.board.height = 8;
    const midBadge = renderToStaticMarkup(<BoardExpansionBadge state={s} />);
    expect(midBadge).toContain('data-bexp-stage="planned"');
    expect(midBadge).toContain(`${BOARD_BAND_MID} → ${BOARD_BAND_WIDE}`);
    expect(midBadge).toContain(BOARD_EXPANSION_NOTE_PLANNED);

    s.board.width = 14;
    s.board.height = 10;
    const wideBadge = renderToStaticMarkup(<BoardExpansionBadge state={s} />);
    expect(wideBadge).toContain('data-bexp-stage="widest"');
    expect(wideBadge).toContain(BOARD_EXPANSION_NOTE_WIDEST);

    setLivingSwitch(s, "boardExpansion", false);
    expect(renderToStaticMarkup(<BoardExpansionRim state={s} />)).toBe("");
    expect(renderToStaticMarkup(<BoardExpansionBadge state={s} />)).toBe("");
  });

  it("isolates Slice 29 styles with Dusk/Night/Parchment tokens, non-blocking marks, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./building-life.css",
      "./work-station-staging.css",
      "./board-expansion.css",
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
