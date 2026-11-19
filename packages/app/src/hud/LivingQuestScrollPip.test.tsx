import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QUESTS, createGameState, tryClaimQuest, tryHireChampion, type GameState } from "@second-crown/sim";
import {
  HomeKeepQuestScrollPip,
  LivingQuestScrollPip,
  summarizeActiveQuests,
} from "./LivingQuestScrollPip";
import { ScrollPip } from "./ScrollPip";
import { QuestPanel } from "../QuestPanel";
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

function meetAllQuests(s: GameState): void {
  s.buildings.push({ id: "c1", typeId: "chapel", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null });
  s.flags["scout_ai1"] = 1;
  s.flags.spoils_iron = 1;
  s.flags.trade_routes = 1;
  s.resources.gold = "80";
  s.resources.food = "40";
  expect(tryHireChampion(s)).toBe(true);
}

const noop = () => undefined;

describe("LivingQuestScrollPip & HomeKeepQuestScrollPip", () => {
  it("summarizes active and ready quests without mutating GameState", () => {
    const s = createGameState({ seed: 1 });
    const snap = JSON.stringify(s);
    expect(summarizeActiveQuests(s)).toEqual({
      active: QUESTS.length,
      ready: 0,
      status: "open",
    });
    expect(JSON.stringify(s)).toBe(snap);

    s.buildings.push({ id: "c1", typeId: "chapel", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null });
    expect(summarizeActiveQuests(s)).toEqual({
      active: QUESTS.length,
      ready: 1,
      status: "ready",
    });

    meetAllQuests(s);
    for (const q of QUESTS) {
      expect(tryClaimQuest(s, q.id)).toBe(true);
    }
    expect(summarizeActiveQuests(s)).toEqual({
      active: 0,
      ready: 0,
      status: "idle",
    });
  });

  it("renders LivingQuestScrollPip idle vs active open/ready with pointer-events: none", () => {
    const idleHtml = renderToStaticMarkup(<LivingQuestScrollPip active={false} />);
    expect(idleHtml).toContain("sc-living-quest-scroll-pip is-idle");
    expect(idleHtml).toContain(`data-quest-active="false"`);
    expect(idleHtml).toContain(`aria-hidden="true"`);
    expect(idleHtml).toContain(`pointer-events:none`);
    expect(idleHtml).not.toContain('class="sc-living-quest-scroll-aura"');
    expect(idleHtml).not.toContain('class="sc-living-quest-scroll-glint"');

    const openHtml = renderToStaticMarkup(<LivingQuestScrollPip active={true} ready={false} count={5} readyCount={0} />);
    expect(openHtml).toContain("sc-living-quest-scroll-pip is-active is-open");
    expect(openHtml).toContain(`data-quest-active="true"`);
    expect(openHtml).toContain(`data-quest-ready="false"`);
    expect(openHtml).toContain('class="sc-living-quest-scroll-aura"');
    expect(openHtml).toContain('class="sc-living-quest-scroll-glint"');

    const readyHtml = renderToStaticMarkup(<LivingQuestScrollPip active={true} ready={true} count={5} readyCount={2} />);
    expect(readyHtml).toContain("sc-living-quest-scroll-pip is-active is-ready");
    expect(readyHtml).toContain(`data-quest-ready="true"`);
    expect(readyHtml).toContain(`data-quest-ready-count="2"`);
  });

  it("integrates into QuestPanel and ScrollPip without mutating GameState", () => {
    const s = createGameState({ seed: 1 });
    const snap = JSON.stringify(s);
    const activePanel = renderToStaticMarkup(<QuestPanel state={s} act={noop as never} />);
    expect(JSON.stringify(s)).toBe(snap);
    expect(activePanel).toContain("sc-living-quest-scroll-pip is-active is-open");

    meetAllQuests(s);
    const readyPanel = renderToStaticMarkup(<QuestPanel state={s} act={noop as never} />);
    expect(readyPanel).toContain("sc-living-quest-scroll-pip is-active is-ready");

    for (const q of QUESTS) tryClaimQuest(s, q.id);
    const idlePanel = renderToStaticMarkup(<QuestPanel state={s} act={noop as never} />);
    expect(idlePanel).toContain("sc-living-quest-scroll-pip is-idle");

    const openScroll = renderToStaticMarkup(<ScrollPip status="open" size={14} />);
    expect(openScroll).toContain("sc-scroll-pip-aura is-open");
    const readyScroll = renderToStaticMarkup(<ScrollPip status="ready" size={14} />);
    expect(readyScroll).toContain("sc-scroll-pip-aura is-ready");
    const claimedScroll = renderToStaticMarkup(<ScrollPip status="claimed" size={14} />);
    expect(claimedScroll).not.toContain("sc-scroll-pip-aura");
  });

  it("renders on the home keep in HomeKeepQuestScrollPip and BoardLiving", () => {
    const s = createGameState({ seed: 2 });
    const homeId = s.board.homeProvinceId;

    const openKeep = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <HomeKeepQuestScrollPip state={s} />
      </svg>,
    );
    expect(openKeep).toContain("sc-keep-quest-scroll-pip is-active is-open");
    expect(openKeep).toContain(`data-home-keep-quest="true"`);
    expect(openKeep).toContain(`data-province-id="${homeId}"`);
    expect(openKeep).toContain('class="sc-keep-quest-scroll-aura"');
    expect(openKeep).toContain('class="sc-keep-quest-scroll-glint"');

    meetAllQuests(s);
    const readyBoard = renderToStaticMarkup(
      <BoardLiving state={s} selectedId={null} visible={true} />,
    );
    expect(readyBoard).toContain("sc-keep-quest-scroll-pip is-active is-ready");
    expect(readyBoard).toContain(`data-quest-ready="true"`);

    for (const q of QUESTS) tryClaimQuest(s, q.id);
    const idleBoard = renderToStaticMarkup(
      <BoardLiving state={s} selectedId={null} visible={true} />,
    );
    expect(idleBoard).toContain("sc-keep-quest-scroll-pip is-idle");
    expect(idleBoard).not.toContain('class="sc-keep-quest-scroll-aura"');
    expect(idleBoard).not.toContain('class="sc-keep-quest-scroll-glint"');
  });

  it("keeps CSS isolated with pointer-events: none, unroll/glow keyframes, and reduced-motion support", () => {
    const css = readCssFile("./living-quest-scroll-pip.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("@keyframes sc-quest-scroll-unroll");
    expect(css).toContain("@keyframes sc-quest-scroll-aura");
    expect(css).toContain("@keyframes sc-quest-scroll-roller");
    expect(css).toContain(".sc-living-quest-scroll-pip.is-active");
    expect(css).toContain(".sc-keep-quest-scroll-pip.is-active");
    expect(css).toContain(".sc-quests-status-line.is-active .sc-quests-status-icon");

    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-living-quest-scroll-pip");
    expect(theme).not.toContain("sc-keep-quest-scroll-pip");
    expect(theme).not.toContain("sc-quest-scroll-unroll");
  });
});
