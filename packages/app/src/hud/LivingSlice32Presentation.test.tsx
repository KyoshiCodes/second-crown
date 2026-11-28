import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ENVIRONMENT_MOOD_OPEN,
  ENVIRONMENT_MOOD_RESTLESS,
  ENVIRONMENT_MOOD_SOFT,
  ENVIRONMENT_MOOD_STILL,
  STATION_PAIR_NOTE_ALONE,
  STATION_PAIR_NOTE_BUILDING,
  STATION_PAIR_NOTE_LEAD,
  STATION_PAIR_NOTE_TWIN,
  createGameState,
  environmentSnapshot,
  isProvinceSeen,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import { BoardEnvironmentMoodPill, resolveBoardEnvironmentMood } from "./BoardEnvironmentMood";
import { WorkCard } from "./WorkCard";
import { WorkStationPairBadge, resolveStationPair } from "./WorkStationPairMark";

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

describe("Living Realm Slice 32: environment mood & station pairing visuals", () => {
  it("renders calm BoardEnvironmentMoodPill near BoardEnvironmentNote when mood is present, and hides cleanly when null or off", () => {
    expect(resolveBoardEnvironmentMood(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardEnvironmentMoodPill state={undefined} />)).toBe("");

    const s = emptyState();
    const seenMoods = new Set<string>();
    for (let t = 0; t < 60000; t += 2500) {
      s.meta.tick = t;
      const snap = environmentSnapshot(s)!;
      const resolved = resolveBoardEnvironmentMood(s)!;
      expect(resolved.mood).toBe(snap.mood);
      seenMoods.add(resolved.mood);
    }
    for (const m of seenMoods) {
      expect([
        ENVIRONMENT_MOOD_OPEN,
        ENVIRONMENT_MOOD_SOFT,
        ENVIRONMENT_MOOD_STILL,
        ENVIRONMENT_MOOD_RESTLESS,
      ]).toContain(m);
    }

    s.meta.tick = 20100;
    const expectedMood = environmentSnapshot(s)!.mood!;
    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(boardHtml).toContain("sc-benv-note");
    expect(boardHtml).toContain(`data-bmood="${expectedMood}"`);
    expect(boardHtml).toContain("sc-bmood-crest");

    // Depth flag off: mood pill hides while Slice 31 environment note remains visible
    setLivingSwitch(s, "environmentDepth", false);
    expect(resolveBoardEnvironmentMood(s)).toBeNull();
    expect(renderToStaticMarkup(<BoardEnvironmentMoodPill state={s} />)).toBe("");
    const noDepthBoardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(noDepthBoardHtml).toContain("sc-benv-note");
    expect(noDepthBoardHtml).not.toContain("sc-bmood-pill");

    // Master environment flag off or empty board: also hides cleanly
    setLivingSwitch(s, "environmentDepth", true);
    setLivingSwitch(s, "environment", false);
    expect(resolveBoardEnvironmentMood(s)).toBeNull();

    const emptyBoard = emptyState();
    emptyBoard.board.provinces = [];
    expect(resolveBoardEnvironmentMood(emptyBoard)).toBeNull();
  });

  it("renders WorkStationPairBadge linked diamonds for paired lead/twin stations, alone/building notes, and hides when null or off", () => {
    expect(resolveStationPair(undefined, "b1")).toBeNull();
    expect(renderToStaticMarkup(<WorkStationPairBadge state={{} as GameState} buildingId="b1" />)).toBe("");

    const s = emptyState();
    const cottageA = addWork(s, "cottage");
    addWork(s, "cottage");
    expect(renderToStaticMarkup(<WorkStationPairBadge state={s} buildingId={cottageA.id} />)).toBe("");

    const quarryAlone = addWork(s, "quarry");
    const aloneHtml = renderToStaticMarkup(<WorkCard state={s} b={quarryAlone} scarred={false} act={noop} />);
    expect(aloneHtml).toContain('data-wpair-paired="false" data-wpair-kind="alone"');
    expect(aloneHtml).not.toContain("sc-wpair-link");
    expect(aloneHtml).toContain(STATION_PAIR_NOTE_ALONE);

    const farmLead = addWork(s, "farm");
    const farmTwin = addWork(s, "farm");
    const farmPending = addWork(s, "farm", { completesAtTick: 20200 });

    const leadHtml = renderToStaticMarkup(<WorkCard state={s} b={farmLead} scarred={false} act={noop} />);
    expect(leadHtml).toContain('data-wpair-paired="true" data-wpair-kind="lead"');
    expect(leadHtml).toContain("sc-wpair-link");
    expect(leadHtml).toContain("sc-wpair-diamond-a");
    expect(leadHtml).toContain("sc-wpair-diamond-b");
    expect(leadHtml).toContain("Paired +2%");
    expect(leadHtml).toContain(STATION_PAIR_NOTE_LEAD);

    const twinHtml = renderToStaticMarkup(<WorkCard state={s} b={farmTwin} scarred={false} act={noop} />);
    expect(twinHtml).toContain('data-wpair-paired="true" data-wpair-kind="twin"');
    expect(twinHtml).toContain("sc-wpair-link");
    expect(twinHtml).toContain(STATION_PAIR_NOTE_TWIN);

    const buildingHtml = renderToStaticMarkup(<WorkStationPairBadge state={s} buildingId={farmPending.id} />);
    expect(buildingHtml).toContain('data-wpair-paired="false" data-wpair-kind="building"');
    expect(buildingHtml).not.toContain("sc-wpair-link");
    expect(buildingHtml).toContain(STATION_PAIR_NOTE_BUILDING);

    setLivingSwitch(s, "stationPair", false);
    expect(renderToStaticMarkup(<WorkStationPairBadge state={s} buildingId={farmLead.id} />)).toBe("");
  });

  it("reads environmentSnapshot.mood and stationPairSnapshot without mutating GameState", () => {
    const s = emptyState();
    const farm1 = addWork(s, "farm");
    addWork(s, "farm");
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    isProvinceSeen(s, home.id);
    const before = JSON.stringify(s);
    const cardHtml = renderToStaticMarkup(<WorkCard state={s} b={farm1} scarred={false} act={noop} />);
    const boardHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(cardHtml).toContain("sc-wpair-row");
    expect(boardHtml).toContain("sc-bmood-pill");
    expect(JSON.stringify(s)).toBe(before);
  });

  it("isolates Slice 32 styles with Dusk/Night/Parchment tokens, pointer-events: none, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./board-environment-mood.css",
      "./work-station-pair.css",
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
