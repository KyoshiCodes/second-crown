import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RESEARCH, createGameState, researchDuration, tryStartResearch, type GameState } from "@second-crown/sim";
import {
  HomeKeepLecternPip,
  LivingLecternPip,
  summarizeActiveStudy,
} from "./LivingLecternPip";
import { StudyLine } from "../StudyLine";
import { ResearchBar } from "../ResearchBar";
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

function startHusbandry(state: GameState): void {
  state.buildings.push({ id: "f1", typeId: "farm", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null });
  state.resources.food = "100";
  state.resources.wood = "100";
  expect(tryStartResearch(state, "husbandry")).toBe(true);
}

const noop = () => undefined;

describe("LivingLecternPip & HomeKeepLecternPip", () => {
  it("summarizes active and known studies safely without mutating GameState", () => {
    const total = Object.keys(RESEARCH).length;
    expect(summarizeActiveStudy(undefined)).toEqual({
      active: false,
      studyId: null,
      activeCount: 0,
      knownCount: 0,
      totalCount: total,
    });
    expect(summarizeActiveStudy({} as GameState)).toEqual({
      active: false,
      studyId: null,
      activeCount: 0,
      knownCount: 0,
      totalCount: total,
    });

    const state = createGameState({ seed: 1 });
    const snap = JSON.stringify(state);
    expect(summarizeActiveStudy(state)).toEqual({
      active: false,
      studyId: null,
      activeCount: 0,
      knownCount: 0,
      totalCount: total,
    });
    expect(JSON.stringify(state)).toBe(snap);

    startHusbandry(state);
    expect(summarizeActiveStudy(state)).toEqual({
      active: true,
      studyId: "husbandry",
      activeCount: 1,
      knownCount: 0,
      totalCount: total,
    });

    state.meta.tick += researchDuration(state, "husbandry");
    expect(summarizeActiveStudy(state)).toEqual({
      active: false,
      studyId: null,
      activeCount: 0,
      knownCount: 1,
      totalCount: total,
    });
  });

  it("renders LivingLecternPip idle vs active with glow, turning page, and pointer-events: none", () => {
    const idleHtml = renderToStaticMarkup(<LivingLecternPip active={false} />);
    expect(idleHtml).toContain("sc-living-lectern-pip is-idle");
    expect(idleHtml).toContain(`data-lectern-active="false"`);
    expect(idleHtml).toContain(`data-study-id="none"`);
    expect(idleHtml).toContain(`aria-hidden="true"`);
    expect(idleHtml).toContain(`pointer-events:none`);
    expect(idleHtml).not.toContain('class="sc-living-lectern-aura"');
    expect(idleHtml).not.toContain('class="sc-living-lectern-page"');
    expect(idleHtml).not.toContain('class="sc-living-lectern-spark"');

    const activeHtml = renderToStaticMarkup(
      <LivingLecternPip active={true} studyId="husbandry" activeCount={1} knownCount={2} />,
    );
    expect(activeHtml).toContain("sc-living-lectern-pip is-active");
    expect(activeHtml).toContain(`data-lectern-active="true"`);
    expect(activeHtml).toContain(`data-study-id="husbandry"`);
    expect(activeHtml).toContain(`data-active-studies="1"`);
    expect(activeHtml).toContain(`data-known-studies="2"`);
    expect(activeHtml).toContain('class="sc-living-lectern-aura"');
    expect(activeHtml).toContain('class="sc-living-lectern-page"');
    expect(activeHtml).toContain('class="sc-living-lectern-spark"');
  });

  it("integrates into StudyLine and ResearchBar without mutating GameState", () => {
    const state = createGameState({ seed: 1 });
    const snapIdle = JSON.stringify(state);
    const idleLine = renderToStaticMarkup(<StudyLine state={state} />);
    const idleBar = renderToStaticMarkup(<ResearchBar state={state} act={noop as never} />);
    expect(JSON.stringify(state)).toBe(snapIdle);
    expect(idleLine).toContain("sc-living-lectern-pip is-idle");
    expect(idleBar).toContain("sc-living-lectern-pip is-idle");

    startHusbandry(state);
    const snapActive = JSON.stringify(state);
    const activeLine = renderToStaticMarkup(<StudyLine state={state} />);
    const activeBar = renderToStaticMarkup(<ResearchBar state={state} act={noop as never} />);
    expect(JSON.stringify(state)).toBe(snapActive);
    expect(activeLine).toContain("sc-living-lectern-pip is-active");
    expect(activeLine).toContain(`data-study-id="husbandry"`);
    expect(activeBar).toContain("sc-living-lectern-pip is-active");
    expect(activeBar).toContain(`data-study-id="husbandry"`);
  });

  it("renders on the home keep in HomeKeepLecternPip and BoardLiving", () => {
    const state = createGameState({ seed: 2 });
    const homeId = state.board.homeProvinceId;

    const idleKeep = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <HomeKeepLecternPip state={state} />
      </svg>,
    );
    expect(idleKeep).toContain("sc-keep-lectern-pip is-idle");
    expect(idleKeep).toContain(`data-home-keep-lectern="true"`);
    expect(idleKeep).toContain(`data-province-id="${homeId}"`);
    expect(idleKeep).not.toContain('class="sc-keep-lectern-aura"');
    expect(idleKeep).not.toContain('class="sc-keep-lectern-page"');
    expect(idleKeep).not.toContain('class="sc-keep-lectern-spark"');

    startHusbandry(state);
    const activeBoard = renderToStaticMarkup(
      <BoardLiving state={state} selectedId={null} visible={true} />,
    );
    expect(activeBoard).toContain("sc-keep-lectern-pip is-active");
    expect(activeBoard).toContain(`data-lectern-active="true"`);
    expect(activeBoard).toContain(`data-study-id="husbandry"`);
    expect(activeBoard).toContain('class="sc-keep-lectern-aura"');
    expect(activeBoard).toContain('class="sc-keep-lectern-page"');
    expect(activeBoard).toContain('class="sc-keep-lectern-spark"');
  });

  it("keeps CSS isolated with pointer-events: none, page-turn/glow keyframes, and reduced-motion support", () => {
    const css = readCssFile("./living-lectern-pip.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("@keyframes sc-lectern-page-turn");
    expect(css).toContain("@keyframes sc-lectern-pip-aura");
    expect(css).toContain("@keyframes sc-lectern-pip-glow");
    expect(css).toContain(".sc-living-lectern-pip.is-active");
    expect(css).toContain(".sc-keep-lectern-pip.is-active");
    expect(css).toContain(".sc-research-status-line.is-active .sc-research-status-icon");

    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-living-lectern-pip");
    expect(theme).not.toContain("sc-keep-lectern-pip");
    expect(theme).not.toContain("sc-lectern-page-turn");
  });
});
