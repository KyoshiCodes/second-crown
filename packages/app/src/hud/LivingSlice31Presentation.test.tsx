import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ENVIRONMENT_AMBIENT,
  ENVIRONMENT_FEATURES,
  ENVIRONMENT_NOTE,
  EXTRA_BUILDINGS,
  EXTRA_BUILDING_DETAIL_FULL,
  EXTRA_BUILDING_DETAIL_SMALL,
  EXTRA_BUILDING_DETAIL_UPGRADING,
  EXTRA_BUILDING_NOTE_BUILDING,
  EXTRA_BUILDING_NOTE_STANDING,
  EXTRA_BUILDING_NOTE_UPGRADING,
  WORK_STATION_DEPTH_LABEL,
  WORK_STATION_DEPTH_NOTE_ACTIVE,
  WORK_STATION_DEPTH_NOTE_BUILDING,
  WORK_STATION_DEPTH_NOTE_EMPTY,
  WORK_STATION_DEPTH_NOTE_LOW_TIER,
  WORK_STATION_DEPTH_NOTE_NO_BASE,
  WORK_STATION_DEPTH_NOTE_UPGRADING,
  createGameState,
  currentSeason,
  environmentSnapshot,
  isProvinceSeen,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import {
  BoardEnvironmentLayer,
  BoardEnvironmentNote,
  resolveBoardEnvironment,
} from "./BoardEnvironmentMarks";
import { ExtraBuildingRow, resolveExtraBuilding } from "./ExtraBuildingBadge";
import { WorkCard } from "./WorkCard";
import { WorkStationDepthBadge, resolveWorkStationDepth } from "./WorkStationDepthMark";

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

describe("Living Realm Slice 31: environment, work-station depth & extra building visuals", () => {
  it("renders calm perimeter terrain silhouettes and ambient note from environmentSnapshot, and hides cleanly when null or off", () => {
    expect(resolveBoardEnvironment(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardEnvironmentNote state={undefined} />)).toBe("");

    const s = emptyState();
    for (const p of s.board.provinces) p.terrain = "plain";
    for (const p of s.board.provinces.slice(0, 100)) p.terrain = "wood";

    const snap = environmentSnapshot(s)!;
    const env = resolveBoardEnvironment(s)!;
    expect(env.features).toBe(ENVIRONMENT_FEATURES.wood);
    expect(Object.values(ENVIRONMENT_AMBIENT)).toContain(env.ambient);
    expect(env.ambient).toBe(snap.ambient);
    expect(env.note).toBe(ENVIRONMENT_NOTE[currentSeason(s)]);
    expect(env.terrainKind).toBe("wood");

    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(boardHtml).toContain('viewBox="0 0 560 360"');
    expect(boardHtml).toContain('data-benv-terrain="wood"');
    expect(boardHtml).toContain(`data-benv-features="${ENVIRONMENT_FEATURES.wood}"`);
    expect(boardHtml).toContain(env.ambient);
    expect(boardHtml).toContain(env.note);

    for (const p of s.board.provinces) p.terrain = "peak";
    expect(resolveBoardEnvironment(s)?.terrainKind).toBe("peak");

    setLivingSwitch(s, "environment", false);
    expect(renderToStaticMarkup(<svg><BoardEnvironmentLayer state={s} /></svg>)).toBe("<svg></svg>");
    expect(renderToStaticMarkup(<BoardEnvironmentNote state={s} />)).toBe("");

    const emptyBoard = emptyState();
    emptyBoard.board.provinces = [];
    expect(resolveBoardEnvironment(emptyBoard)).toBeNull();
  });

  it("renders WorkStationDepthBadge second mark for active Tier II+ stations, inactive/paused states, and hides when null or off", () => {
    expect(resolveWorkStationDepth(undefined, "b1")).toBeNull();
    expect(renderToStaticMarkup(<WorkStationDepthBadge state={{} as GameState} buildingId="b1" />)).toBe("");

    const s = emptyState();
    const cottage = addWork(s, "cottage", { x: 2, y: 2, level: 3 });
    expect(renderToStaticMarkup(<WorkStationDepthBadge state={s} buildingId={cottage.id} />)).toBe("");

    const tier2Active = addWork(s, "farm", { level: 2 });
    const tier1Staffed = addWork(s, "quarry", { x: 4, y: 2, level: 1 });
    const emptyTier3 = addWork(s, "farm", { x: 5, y: 2, level: 3 });
    const buildingWork = addWork(s, "farm", { x: 6, y: 2, level: 2, completesAtTick: 20200 });
    const upgradingWork = addWork(s, "farm", { x: 7, y: 2, level: 2 });
    s.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 3, y: 3 } });
    s.citizens.push({ id: "c2", realmId: "player", job: "miner", tile: { x: 4, y: 2 } });
    s.flags.upgrades_json = [
      { id: "u1", buildingId: upgradingWork.id, fromLevel: 2, doneTick: 20250, ticks: 50, paid: {} },
    ];

    const activeHtml = renderToStaticMarkup(<WorkCard state={s} b={tier2Active} scarred={false} act={noop} />);
    expect(activeHtml).toContain('data-wdep-active="true" data-wdep-state="active"');
    expect(activeHtml).toContain("sc-wdep-pip is-second");
    expect(activeHtml).toContain(WORK_STATION_DEPTH_LABEL);
    expect(activeHtml).toContain(WORK_STATION_DEPTH_NOTE_ACTIVE);

    const lowTierHtml = renderToStaticMarkup(<WorkCard state={s} b={tier1Staffed} scarred={false} act={noop} />);
    expect(lowTierHtml).toContain('data-wdep-active="false" data-wdep-state="low-tier"');
    expect(lowTierHtml).toContain(WORK_STATION_DEPTH_NOTE_LOW_TIER);

    expect(renderToStaticMarkup(<WorkStationDepthBadge state={s} buildingId={emptyTier3.id} />)).toContain(
      WORK_STATION_DEPTH_NOTE_EMPTY,
    );
    expect(renderToStaticMarkup(<WorkStationDepthBadge state={s} buildingId={buildingWork.id} />)).toContain(
      WORK_STATION_DEPTH_NOTE_BUILDING,
    );
    expect(renderToStaticMarkup(<WorkStationDepthBadge state={s} buildingId={upgradingWork.id} />)).toContain(
      WORK_STATION_DEPTH_NOTE_UPGRADING,
    );

    setLivingSwitch(s, "workStationBenefit", false);
    expect(renderToStaticMarkup(<WorkStationDepthBadge state={s} buildingId={tier2Active.id} />)).toContain(
      WORK_STATION_DEPTH_NOTE_NO_BASE,
    );

    setLivingSwitch(s, "workStationBenefit", true);
    setLivingSwitch(s, "workStationDepth", false);
    expect(renderToStaticMarkup(<WorkStationDepthBadge state={s} buildingId={tier2Active.id} />)).toBe("");
  });

  it("renders ExtraBuildingRow for all eight extra building types, phase details, and hides when null or off", () => {
    expect(resolveExtraBuilding(undefined, "b1")).toBeNull();
    expect(renderToStaticMarkup(<ExtraBuildingRow state={{} as GameState} buildingId="b1" />)).toBe("");

    const s = emptyState();
    const cottage = addWork(s, "cottage", { x: 2, y: 2 });
    expect(renderToStaticMarkup(<ExtraBuildingRow state={s} buildingId={cottage.id} />)).toBe("");

    for (const [idx, [typeId, expectedLabel]] of Object.entries(EXTRA_BUILDINGS).entries()) {
      const work = addWork(s, typeId, { x: 1 + idx, y: 4, level: idx >= 4 ? 3 : 1 });
      const html = renderToStaticMarkup(<WorkCard state={s} b={work} scarred={false} act={noop} />);
      expect(html).toContain(`data-xtra-extra="${expectedLabel}"`);
      expect(html).toContain("sc-xtra-glyph");
      expect(html).toContain(EXTRA_BUILDING_NOTE_STANDING);
      if (idx >= 4) {
        expect(html).toContain(`data-xtra-detail="${EXTRA_BUILDING_DETAIL_FULL}"`);
      } else {
        expect(html).toContain(`data-xtra-detail="${EXTRA_BUILDING_DETAIL_SMALL}"`);
      }
    }

    const buildingChapel = addWork(s, "chapel", { x: 2, y: 5, completesAtTick: 20200 });
    const buildHtml = renderToStaticMarkup(<ExtraBuildingRow state={s} buildingId={buildingChapel.id} />);
    expect(buildHtml).toContain('data-xtra-detail="" data-xtra-stage="building"');
    expect(buildHtml).toContain(EXTRA_BUILDING_NOTE_BUILDING);
    expect(buildHtml).not.toContain('class="sc-xtra-detail');

    const upgradingKeep = addWork(s, "keep", { x: 3, y: 5, level: 2 });
    s.flags.upgrades_json = [
      { id: "u2", buildingId: upgradingKeep.id, fromLevel: 2, doneTick: 20260, ticks: 60, paid: {} },
    ];
    const upgHtml = renderToStaticMarkup(<ExtraBuildingRow state={s} buildingId={upgradingKeep.id} />);
    expect(upgHtml).toContain(`data-xtra-detail="${EXTRA_BUILDING_DETAIL_UPGRADING}"`);
    expect(upgHtml).toContain(EXTRA_BUILDING_NOTE_UPGRADING);

    setLivingSwitch(s, "extraBuildings", false);
    expect(renderToStaticMarkup(<ExtraBuildingRow state={s} buildingId={upgradingKeep.id} />)).toBe("");
  });

  it("reads environment, workStationDepth, and extraBuilding without mutating GameState", () => {
    const s = emptyState();
    const farm = addWork(s, "farm", { level: 3 });
    s.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 3, y: 3 } });
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    isProvinceSeen(s, home.id);
    const before = JSON.stringify(s);
    const cardHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop} />);
    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(cardHtml).toContain("sc-wdep-row");
    expect(cardHtml).toContain("sc-xtra-row");
    expect(boardHtml).toContain("sc-benv-layer");
    expect(boardHtml).toContain("sc-benv-note");
    expect(JSON.stringify(s)).toBe(before);
  });

  it("isolates Slice 31 styles with Dusk/Night/Parchment tokens, non-blocking marks, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./board-environment.css",
      "./work-station-depth.css",
      "./extra-building.css",
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
