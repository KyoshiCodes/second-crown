import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ENVIRONMENT_SEASON_NOTE,
  STATION_REST_NOTE_BUILDING,
  STATION_REST_NOTE_FRESH,
  STATION_REST_NOTE_RESTING,
  STATION_REST_NOTE_WORKING,
  createGameState,
  currentSeason,
  environmentSnapshot,
  isProvinceSeen,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import {
  BoardEnvironmentSeasonNotePill,
  resolveBoardEnvironmentSeasonNote,
} from "./BoardEnvironmentSeasonNote";
import { WorkCard } from "./WorkCard";
import { WorkStationRestBadge, resolveStationRest } from "./WorkStationRestMark";

const DAY_CYCLE = 3600;
const DAY = 7 * DAY_CYCLE;
const DAWN = DAY + 100;
const NOON = DAY + 1000;
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

function emptyState(tick = NOON): GameState {
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

describe("Living Realm Slice 33: environment seasonNote & station rest visuals", () => {
  it("renders calm BoardEnvironmentSeasonNotePill across seasons, and hides cleanly when null or off", () => {
    expect(resolveBoardEnvironmentSeasonNote(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardEnvironmentSeasonNotePill state={undefined} />)).toBe("");

    const s = emptyState();
    const seenSeasons = new Set<string>();
    for (let t = 0; t < 8000; t += 500) {
      s.meta.tick = t;
      const snap = environmentSnapshot(s)!;
      const resolved = resolveBoardEnvironmentSeasonNote(s)!;
      expect(resolved.seasonNote).toBe(snap.seasonNote);
      expect(resolved.seasonNote).toBe(ENVIRONMENT_SEASON_NOTE[currentSeason(s)]);
      seenSeasons.add(resolved.seasonNote);
    }
    expect(seenSeasons.size).toBe(4);

    s.meta.tick = NOON;
    const expectedNote = environmentSnapshot(s)!.seasonNote!;
    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(boardHtml).toContain("sc-benv-note");
    expect(boardHtml).toContain("sc-bmood-pill");
    expect(boardHtml).toContain(`data-bseason-note="${expectedNote}"`);
    expect(boardHtml).toContain("sc-bseason-mark");

    // Environment notes flag off: third pill hides while Slice 31/32 note & mood remain visible
    setLivingSwitch(s, "environmentNotes", false);
    expect(resolveBoardEnvironmentSeasonNote(s)).toBeNull();
    expect(renderToStaticMarkup(<BoardEnvironmentSeasonNotePill state={s} />)).toBe("");
    const noNotesBoardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(noNotesBoardHtml).toContain("sc-benv-note");
    expect(noNotesBoardHtml).toContain("sc-bmood-pill");
    expect(noNotesBoardHtml).not.toContain("sc-bseason-pill");

    // Master environment flag off or empty board: also hides cleanly
    setLivingSwitch(s, "environmentNotes", true);
    setLivingSwitch(s, "environment", false);
    expect(resolveBoardEnvironmentSeasonNote(s)).toBeNull();

    const emptyBoard = emptyState();
    emptyBoard.board.provinces = [];
    expect(resolveBoardEnvironmentSeasonNote(emptyBoard)).toBeNull();
  });

  it("renders WorkStationRestBadge crescent at night, dawn fresh +2%, working/building notes, and hides when null or off", () => {
    expect(resolveStationRest(undefined, "b1")).toBeNull();
    expect(renderToStaticMarkup(<WorkStationRestBadge state={{} as GameState} buildingId="b1" />)).toBe("");

    const s = emptyState(NIGHT);
    const cottage = addWork(s, "cottage");
    expect(renderToStaticMarkup(<WorkStationRestBadge state={s} buildingId={cottage.id} />)).toBe("");

    const farm = addWork(s, "farm");
    const pendingFarm = addWork(s, "farm", { completesAtTick: NIGHT + 200 });

    const nightHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop} />);
    expect(nightHtml).toContain('data-wrest-resting="true" data-wrest-kind="resting"');
    expect(nightHtml).toContain("sc-wrest-crescent");
    expect(nightHtml).toContain("Resting");
    expect(nightHtml).toContain(STATION_REST_NOTE_RESTING);

    s.meta.tick = DAWN;
    const dawnHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop} />);
    expect(dawnHtml).toContain('data-wrest-resting="false" data-wrest-kind="fresh"');
    expect(dawnHtml).not.toContain("sc-wrest-crescent");
    expect(dawnHtml).toContain("Fresh +2%");
    expect(dawnHtml).toContain(STATION_REST_NOTE_FRESH);

    for (const tick of [NOON, DUSK]) {
      s.meta.tick = tick;
      const workHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop} />);
      expect(workHtml).toContain('data-wrest-resting="false" data-wrest-kind="working"');
      expect(workHtml).not.toContain("sc-wrest-crescent");
      expect(workHtml).toContain(STATION_REST_NOTE_WORKING);
    }

    const buildHtml = renderToStaticMarkup(<WorkStationRestBadge state={s} buildingId={pendingFarm.id} />);
    expect(buildHtml).toContain('data-wrest-resting="false" data-wrest-kind="building"');
    expect(buildHtml).not.toContain("sc-wrest-crescent");
    expect(buildHtml).toContain(STATION_REST_NOTE_BUILDING);

    setLivingSwitch(s, "stationRest", false);
    expect(renderToStaticMarkup(<WorkStationRestBadge state={s} buildingId={farm.id} />)).toBe("");
  });

  it("reads environmentSnapshot.seasonNote and stationRestSnapshot without mutating GameState", () => {
    const s = emptyState(NIGHT);
    const farm = addWork(s, "farm");
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    isProvinceSeen(s, home.id);
    const before = JSON.stringify(s);
    const cardHtml = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop} />);
    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(cardHtml).toContain("sc-wrest-row");
    expect(boardHtml).toContain("sc-bseason-pill");
    expect(JSON.stringify(s)).toBe(before);
  });

  it("isolates Slice 33 styles with Dusk/Night/Parchment tokens, pointer-events: none, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./board-environment-season-note.css",
      "./work-station-rest.css",
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
