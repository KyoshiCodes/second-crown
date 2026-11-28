import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ENVIRONMENT_WEATHER_MARK,
  STATION_RHYTHM_NOTE_BUILDING,
  STATION_RHYTHM_NOTE_IN,
  STATION_RHYTHM_NOTE_UNSTAFFED,
  STATION_RHYTHM_NOTE_UPGRADING,
  STATION_RHYTHM_NOTE_WAIT,
  createGameState,
  environmentSnapshot,
  isProvinceSeen,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import {
  BoardEnvironmentWeatherMarkPill,
  resolveBoardEnvironmentWeatherMark,
} from "./BoardEnvironmentWeatherMark";
import { WorkCard } from "./WorkCard";
import { WorkStationRhythmBadge, resolveStationRhythm } from "./WorkStationRhythmMark";

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

describe("Living Realm Slice 34: environment weatherMark & station rhythm visuals", () => {
  it("renders calm BoardEnvironmentWeatherMarkPill alongside Slice 31-33 pills, and hides cleanly when null or off", () => {
    expect(resolveBoardEnvironmentWeatherMark(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardEnvironmentWeatherMarkPill state={undefined} />)).toBe("");

    const s = emptyState();
    const seenMarks = new Set<string>();
    const validMarks = Object.values(ENVIRONMENT_WEATHER_MARK);
    for (let t = 0; t < 60000; t += 2000) {
      s.meta.tick = t;
      const snap = environmentSnapshot(s)!;
      const resolved = resolveBoardEnvironmentWeatherMark(s)!;
      expect(resolved.weatherMark).toBe(snap.weatherMark);
      expect(validMarks).toContain(resolved.weatherMark);
      seenMarks.add(resolved.weatherMark);
    }
    expect(seenMarks.size).toBeGreaterThan(1);

    s.meta.tick = MIDDAY;
    const expectedMark = environmentSnapshot(s)!.weatherMark!;
    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(boardHtml).toContain("sc-benv-note");
    expect(boardHtml).toContain("sc-bmood-pill");
    expect(boardHtml).toContain("sc-bseason-pill");
    expect(boardHtml).toContain(`data-bweather-mark="${expectedMark}"`);
    expect(boardHtml).toContain("sc-bweather-mark");

    // Environment weather flag off: fourth pill hides while Slice 31-33 pills remain visible
    setLivingSwitch(s, "environmentWeather", false);
    expect(resolveBoardEnvironmentWeatherMark(s)).toBeNull();
    expect(renderToStaticMarkup(<BoardEnvironmentWeatherMarkPill state={s} />)).toBe("");
    const noWeatherBoardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(noWeatherBoardHtml).toContain("sc-benv-note");
    expect(noWeatherBoardHtml).toContain("sc-bmood-pill");
    expect(noWeatherBoardHtml).toContain("sc-bseason-pill");
    expect(noWeatherBoardHtml).not.toContain("sc-bweather-pill");

    // Master environment flag off or empty board: also hides cleanly
    setLivingSwitch(s, "environmentWeather", true);
    setLivingSwitch(s, "environment", false);
    expect(resolveBoardEnvironmentWeatherMark(s)).toBeNull();

    const emptyBoard = emptyState();
    emptyBoard.board.provinces = [];
    expect(resolveBoardEnvironmentWeatherMark(emptyBoard)).toBeNull();
  });

  it("renders WorkStationRhythmBadge linked dots in rhythm, waiting/unstaffed/upgrading/building notes, and hides when null or off", () => {
    expect(resolveStationRhythm(undefined, "b1")).toBeNull();
    expect(renderToStaticMarkup(<WorkStationRhythmBadge state={{} as GameState} buildingId="b1" />)).toBe("");

    const s = emptyState(MIDDAY);
    const cottage = addWork(s, "cottage");
    expect(renderToStaticMarkup(<WorkStationRhythmBadge state={s} buildingId={cottage.id} />)).toBe("");

    const unstaffedFarm = addWork(s, "farm", { x: 4, y: 3 });
    expect(renderToStaticMarkup(<WorkCard state={s} b={unstaffedFarm} scarred={false} act={noop} />)).toContain(
      STATION_RHYTHM_NOTE_UNSTAFFED,
    );

    const staffedFarm = addWork(s, "farm", { x: 5, y: 3 });
    s.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 5, y: 3 } });

    const inRhythmHtml = renderToStaticMarkup(<WorkCard state={s} b={staffedFarm} scarred={false} act={noop} />);
    expect(inRhythmHtml).toContain('data-wrhy-in-rhythm="true" data-wrhy-kind="in-rhythm"');
    expect(inRhythmHtml).toContain("sc-wrhy-pulse");
    expect(inRhythmHtml).toContain("Rhythm +1%");
    expect(inRhythmHtml).toContain(STATION_RHYTHM_NOTE_IN);

    for (const tick of [DAWN, MORNING, DUSK, NIGHT]) {
      s.meta.tick = tick;
      const waitHtml = renderToStaticMarkup(<WorkCard state={s} b={staffedFarm} scarred={false} act={noop} />);
      expect(waitHtml).toContain('data-wrhy-in-rhythm="false" data-wrhy-kind="wait"');
      expect(waitHtml).not.toContain("sc-wrhy-pulse");
      expect(waitHtml).toContain(STATION_RHYTHM_NOTE_WAIT);
    }

    s.meta.tick = MIDDAY;
    const buildingFarm = addWork(s, "farm", { x: 6, y: 3, completesAtTick: MIDDAY + 50 });
    expect(renderToStaticMarkup(<WorkStationRhythmBadge state={s} buildingId={buildingFarm.id} />)).toContain(
      STATION_RHYTHM_NOTE_BUILDING,
    );

    const upgradingFarm = addWork(s, "farm", { x: 7, y: 3 });
    s.citizens.push({ id: "c2", realmId: "player", job: "farmer", tile: { x: 7, y: 3 } });
    s.flags.upgrades_json = [
      { id: "u1", buildingId: upgradingFarm.id, fromLevel: 1, doneTick: MIDDAY + 50, ticks: 50, paid: {} },
    ];
    expect(renderToStaticMarkup(<WorkStationRhythmBadge state={s} buildingId={upgradingFarm.id} />)).toContain(
      STATION_RHYTHM_NOTE_UPGRADING,
    );

    setLivingSwitch(s, "stationRhythm", false);
    expect(renderToStaticMarkup(<WorkStationRhythmBadge state={s} buildingId={staffedFarm.id} />)).toBe("");
  });

  it("reads environmentSnapshot.weatherMark and stationRhythmSnapshot without mutating GameState", () => {
    const s = emptyState(MIDDAY);
    const farm = addWork(s, "farm", { x: 5, y: 3 });
    s.citizens.push({ id: "c1", realmId: "player", job: "farmer", tile: { x: 5, y: 3 } });
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    isProvinceSeen(s, home.id);
    const before = JSON.stringify(s);
    const cardHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop} />);
    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(cardHtml).toContain("sc-wrhy-row");
    expect(boardHtml).toContain("sc-bweather-pill");
    expect(JSON.stringify(s)).toBe(before);
  });

  it("isolates Slice 34 styles with Dusk/Night/Parchment tokens, pointer-events: none, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./board-environment-weather-mark.css",
      "./work-station-rhythm.css",
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
