import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ENVIRONMENT_LIGHT_MARK,
  STATION_FOCUS_NOTE_BUILDING,
  STATION_FOCUS_NOTE_FOCUSED,
  STATION_FOCUS_NOTE_RESTING,
  STATION_FOCUS_NOTE_UNSTAFFED,
  STATION_FOCUS_NOTE_UPGRADING,
  STATION_FOCUS_NOTE_WAIT,
  createGameState,
  environmentSnapshot,
  isProvinceSeen,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import {
  BoardEnvironmentLightMarkPill,
  resolveBoardEnvironmentLightMark,
} from "./BoardEnvironmentLightMark";
import { WorkCard } from "./WorkCard";
import { WorkStationFocusBadge, resolveStationFocus } from "./WorkStationFocusMark";

const DAY_CYCLE = 3600;
const DAY = 7 * DAY_CYCLE;
const DAWN = DAY + 100;
const MORNING = DAY + 700;
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

describe("Living Realm Slice 35: environment lightMark & station focus visuals", () => {
  it("renders calm BoardEnvironmentLightMarkPill across day phases, and hides cleanly when null or off", () => {
    expect(resolveBoardEnvironmentLightMark(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardEnvironmentLightMarkPill state={undefined} />)).toBe("");

    const s = emptyState();
    for (const [tick, expectedMark] of [
      [DAWN, ENVIRONMENT_LIGHT_MARK.dawn],
      [MORNING, ENVIRONMENT_LIGHT_MARK.day],
      [MIDDAY, ENVIRONMENT_LIGHT_MARK.day],
      [DUSK, ENVIRONMENT_LIGHT_MARK.dusk],
      [NIGHT, ENVIRONMENT_LIGHT_MARK.night],
    ] as const) {
      s.meta.tick = tick;
      const snap = environmentSnapshot(s)!;
      const resolved = resolveBoardEnvironmentLightMark(s)!;
      expect(resolved.lightMark).toBe(snap.lightMark);
      expect(resolved.lightMark).toBe(expectedMark);
    }

    s.meta.tick = MIDDAY;
    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(boardHtml).toContain("sc-benv-note");
    expect(boardHtml).toContain("sc-bmood-pill");
    expect(boardHtml).toContain("sc-bseason-pill");
    expect(boardHtml).toContain("sc-bweather-pill");
    expect(boardHtml).toContain(`data-blight-mark="${ENVIRONMENT_LIGHT_MARK.day}"`);
    expect(boardHtml).toContain("sc-blight-mark");

    // Environment light flag off: fifth pill hides while Slice 31-34 pills remain visible
    setLivingSwitch(s, "environmentLight", false);
    expect(resolveBoardEnvironmentLightMark(s)).toBeNull();
    expect(renderToStaticMarkup(<BoardEnvironmentLightMarkPill state={s} />)).toBe("");
    const noLightBoardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(noLightBoardHtml).toContain("sc-benv-note");
    expect(noLightBoardHtml).toContain("sc-bmood-pill");
    expect(noLightBoardHtml).toContain("sc-bseason-pill");
    expect(noLightBoardHtml).toContain("sc-bweather-pill");
    expect(noLightBoardHtml).not.toContain("sc-blight-pill");

    // Master environment flag off or empty board: also hides cleanly
    setLivingSwitch(s, "environmentLight", true);
    setLivingSwitch(s, "environment", false);
    expect(resolveBoardEnvironmentLightMark(s)).toBeNull();

    const emptyBoard = emptyState();
    emptyBoard.board.provinces = [];
    expect(resolveBoardEnvironmentLightMark(emptyBoard)).toBeNull();
  });

  it("renders WorkStationFocusBadge ring-diamond in high light, wait/resting/unstaffed/upgrading/building notes, and hides when null or off", () => {
    expect(resolveStationFocus(undefined, "b1")).toBeNull();
    expect(renderToStaticMarkup(<WorkStationFocusBadge state={{} as GameState} buildingId="b1" />)).toBe("");

    const s = emptyState(MIDDAY);
    const cottage = addWork(s, "cottage");
    expect(renderToStaticMarkup(<WorkStationFocusBadge state={s} buildingId={cottage.id} />)).toBe("");

    const unstaffedFarm = addWork(s, "farm", { x: 4, y: 3 });
    expect(renderToStaticMarkup(<WorkCard state={s} b={unstaffedFarm} scarred={false} act={noop} />)).toContain(
      STATION_FOCUS_NOTE_UNSTAFFED,
    );

    const staffedFarm = addWork(s, "farm", { x: 5, y: 3 });
    s.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 5, y: 3 } });

    const focusedHtml = renderToStaticMarkup(<WorkCard state={s} b={staffedFarm} scarred={false} act={noop} />);
    expect(focusedHtml).toContain('data-wfoc-focused="true" data-wfoc-kind="focused"');
    expect(focusedHtml).toContain("sc-wfoc-ring");
    expect(focusedHtml).toContain("Focus +1%");
    expect(focusedHtml).toContain(STATION_FOCUS_NOTE_FOCUSED);

    for (const tick of [DAWN, DUSK]) {
      s.meta.tick = tick;
      const waitHtml = renderToStaticMarkup(<WorkCard state={s} b={staffedFarm} scarred={false} act={noop} />);
      expect(waitHtml).toContain('data-wfoc-focused="false" data-wfoc-kind="wait"');
      expect(waitHtml).not.toContain("sc-wfoc-ring");
      expect(waitHtml).toContain(STATION_FOCUS_NOTE_WAIT);
    }

    s.meta.tick = NIGHT;
    const nightRestHtml = renderToStaticMarkup(<WorkCard state={s} b={staffedFarm} scarred={false} act={noop} />);
    expect(nightRestHtml).toContain('data-wfoc-focused="false" data-wfoc-kind="resting"');
    expect(nightRestHtml).not.toContain("sc-wfoc-ring");
    expect(nightRestHtml).toContain(STATION_FOCUS_NOTE_RESTING);

    s.meta.tick = MIDDAY;
    const buildingFarm = addWork(s, "farm", { x: 6, y: 3, completesAtTick: MIDDAY + 50 });
    expect(renderToStaticMarkup(<WorkStationFocusBadge state={s} buildingId={buildingFarm.id} />)).toContain(
      STATION_FOCUS_NOTE_BUILDING,
    );

    const upgradingFarm = addWork(s, "farm", { x: 7, y: 3 });
    s.citizens.push({ id: "c2", realmId: "player", job: "farmer", tile: { x: 7, y: 3 } });
    s.flags.upgrades_json = [
      { id: "u1", buildingId: upgradingFarm.id, fromLevel: 1, doneTick: MIDDAY + 50, ticks: 50, paid: {} },
    ];
    expect(renderToStaticMarkup(<WorkStationFocusBadge state={s} buildingId={upgradingFarm.id} />)).toContain(
      STATION_FOCUS_NOTE_UPGRADING,
    );

    setLivingSwitch(s, "stationFocus", false);
    expect(renderToStaticMarkup(<WorkStationFocusBadge state={s} buildingId={staffedFarm.id} />)).toBe("");
  });

  it("reads environmentSnapshot.lightMark and stationFocusSnapshot without mutating GameState", () => {
    const s = emptyState(MIDDAY);
    const farm = addWork(s, "farm", { x: 5, y: 3 });
    s.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 5, y: 3 } });
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    isProvinceSeen(s, home.id);
    const before = JSON.stringify(s);
    const cardHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop} />);
    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(cardHtml).toContain("sc-wfoc-row");
    expect(boardHtml).toContain("sc-blight-pill");
    expect(JSON.stringify(s)).toBe(before);
  });

  it("isolates Slice 35 styles with Dusk/Night/Parchment tokens, pointer-events: none, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./board-environment-light-mark.css",
      "./work-station-focus.css",
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
