import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ENVIRONMENT_WIND_MARK,
  STATION_CARE_NOTE_BUILDING,
  STATION_CARE_NOTE_CARED,
  STATION_CARE_NOTE_RESTING,
  STATION_CARE_NOTE_UNSTAFFED,
  STATION_CARE_NOTE_UPGRADING,
  createGameState,
  environmentSnapshot,
  isProvinceSeen,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import {
  BoardEnvironmentWindMarkPill,
  resolveBoardEnvironmentWindMark,
} from "./BoardEnvironmentWindMark";
import { WorkCard } from "./WorkCard";
import { WorkStationCareBadge, resolveStationCare } from "./WorkStationCareMark";

const DAY_CYCLE = 3600;
const DAY = 7 * DAY_CYCLE;
const DAWN = DAY + 100;
const MIDDAY = DAY + 1200;
const DUSK = DAY + 2200;
const NIGHT = DAY + 3000;

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function emptyState(tick = MIDDAY): GameState {
  const s = createGameState({ seed: 1, now: 1, withStarterBuildings: false });
  s.meta.tick = tick;
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
    x: 3 + s.buildings.length,
    y: 3,
    level: 1,
    completesAtTick: null,
    ...opts,
  } as GameState["buildings"][number];
  s.buildings.push(b);
  return b;
}

const noop = (() => ({ ok: true })) as never;

describe("Living Realm Slice 36: environment windMark & station care visuals", () => {
  it("renders calm BoardEnvironmentWindMarkPill alongside Slice 31-35 pills, and hides cleanly when null or off", () => {
    expect(resolveBoardEnvironmentWindMark(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardEnvironmentWindMarkPill state={undefined} />)).toBe("");

    const s = emptyState();
    const seenWinds = new Set<string>();
    const validWinds = Object.values(ENVIRONMENT_WIND_MARK);
    for (let t = DAY; t < DAY + DAY_CYCLE; t += 180) {
      s.meta.tick = t;
      const snap = environmentSnapshot(s)!;
      const resolved = resolveBoardEnvironmentWindMark(s)!;
      expect(resolved.windMark).toBe(snap.windMark);
      expect(validWinds).toContain(resolved.windMark);
      seenWinds.add(resolved.windMark);
    }
    expect(seenWinds.size).toBeGreaterThanOrEqual(2);

    s.meta.tick = MIDDAY;
    const expectedWind = environmentSnapshot(s)!.windMark!;
    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(boardHtml).toContain("sc-benv-note");
    expect(boardHtml).toContain("sc-bmood-pill");
    expect(boardHtml).toContain("sc-bseason-pill");
    expect(boardHtml).toContain("sc-bweather-pill");
    expect(boardHtml).toContain("sc-blight-pill");
    expect(boardHtml).toContain(`data-bwind-mark="${expectedWind}"`);
    expect(boardHtml).toContain("sc-bwind-mark");

    // Environment wind flag off: sixth pill hides while Slice 31-35 pills remain visible
    setLivingSwitch(s, "environmentWind", false);
    expect(resolveBoardEnvironmentWindMark(s)).toBeNull();
    expect(renderToStaticMarkup(<BoardEnvironmentWindMarkPill state={s} />)).toBe("");
    const noWindBoardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(noWindBoardHtml).toContain("sc-benv-note");
    expect(noWindBoardHtml).toContain("sc-blight-pill");
    expect(noWindBoardHtml).not.toContain("sc-bwind-pill");

    // Master environment flag off or empty board: also hides cleanly
    setLivingSwitch(s, "environmentWind", true);
    setLivingSwitch(s, "environment", false);
    expect(resolveBoardEnvironmentWindMark(s)).toBeNull();

    const emptyBoard = emptyState();
    emptyBoard.board.provinces = [];
    expect(resolveBoardEnvironmentWindMark(emptyBoard)).toBeNull();
  });

  it("renders WorkStationCareBadge thin heart when cared, resting/unstaffed/upgrading/building notes, and hides when null or off", () => {
    expect(resolveStationCare(undefined, "b1")).toBeNull();
    expect(renderToStaticMarkup(<WorkStationCareBadge state={{} as GameState} buildingId="b1" />)).toBe("");

    const s = emptyState(MIDDAY);
    const cottage = addWork(s, "cottage");
    expect(renderToStaticMarkup(<WorkStationCareBadge state={s} buildingId={cottage.id} />)).toBe("");

    const unstaffedFarm = addWork(s, "farm", { x: 4, y: 3 });
    expect(renderToStaticMarkup(<WorkCard state={s} b={unstaffedFarm} scarred={false} act={noop} />)).toContain(
      STATION_CARE_NOTE_UNSTAFFED,
    );

    const staffedFarm = addWork(s, "farm", { x: 5, y: 3 });
    s.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 5, y: 3 } });

    for (const tick of [DAWN, MIDDAY, DUSK]) {
      s.meta.tick = tick;
      const caredHtml = renderToStaticMarkup(<WorkCard state={s} b={staffedFarm} scarred={false} act={noop} />);
      expect(caredHtml).toContain('data-wcare-cared="true" data-wcare-kind="cared"');
      expect(caredHtml).toContain("sc-wcare-heart");
      expect(caredHtml).toContain("Care +0.5%");
      expect(caredHtml).toContain(STATION_CARE_NOTE_CARED);
    }

    s.meta.tick = NIGHT;
    const nightRestHtml = renderToStaticMarkup(<WorkCard state={s} b={staffedFarm} scarred={false} act={noop} />);
    expect(nightRestHtml).toContain('data-wcare-cared="false" data-wcare-kind="resting"');
    expect(nightRestHtml).not.toContain("sc-wcare-heart");
    expect(nightRestHtml).toContain(STATION_CARE_NOTE_RESTING);

    // Night with stationRest off: still cared at night
    setLivingSwitch(s, "stationRest", false);
    const nightNoRestHtml = renderToStaticMarkup(<WorkStationCareBadge state={s} buildingId={staffedFarm.id} />);
    expect(nightNoRestHtml).toContain('data-wcare-cared="true" data-wcare-kind="cared"');
    expect(nightNoRestHtml).toContain("sc-wcare-heart");

    setLivingSwitch(s, "stationRest", true);
    s.meta.tick = MIDDAY;
    const buildingFarm = addWork(s, "farm", { x: 6, y: 3, completesAtTick: MIDDAY + 50 });
    expect(renderToStaticMarkup(<WorkStationCareBadge state={s} buildingId={buildingFarm.id} />)).toContain(
      STATION_CARE_NOTE_BUILDING,
    );

    const upgradingFarm = addWork(s, "farm", { x: 7, y: 3 });
    s.citizens.push({ id: "c2", realmId: "player", job: "farmer", tile: { x: 7, y: 3 } });
    s.flags.upgrades_json = [
      { id: "u1", buildingId: upgradingFarm.id, fromLevel: 1, doneTick: MIDDAY + 50, ticks: 50, paid: {} },
    ];
    expect(renderToStaticMarkup(<WorkStationCareBadge state={s} buildingId={upgradingFarm.id} />)).toContain(
      STATION_CARE_NOTE_UPGRADING,
    );

    setLivingSwitch(s, "stationCare", false);
    expect(renderToStaticMarkup(<WorkStationCareBadge state={s} buildingId={staffedFarm.id} />)).toBe("");
  });

  it("reads environmentSnapshot.windMark and stationCareSnapshot without mutating GameState", () => {
    const s = emptyState(MIDDAY);
    const farm = addWork(s, "farm", { x: 5, y: 3 });
    s.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 5, y: 3 } });
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    isProvinceSeen(s, home.id);
    const before = JSON.stringify(s);
    const cardHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop} />);
    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(cardHtml).toContain("sc-wcare-row");
    expect(boardHtml).toContain("sc-bwind-pill");
    expect(JSON.stringify(s)).toBe(before);
  });

  it("isolates Slice 36 styles with Dusk/Night/Parchment tokens, pointer-events: none, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./board-environment-wind-mark.css",
      "./work-station-care.css",
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
