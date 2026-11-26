import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  GATHER_NODES,
  assignJob,
  assignTile,
  createCitizen,
  createGameState,
  revealProvince,
  setPlayerCulture,
  tryDeclareWar,
  tryWhitePeace,
} from "@second-crown/sim";
import {
  BoardLivingRealm,
  CARAVAN_BOARD_WINDOW_TICKS,
  LIVING_CULTURE_PALETTE,
  listBoardCaravanTrails,
  listBoardUnitTasks,
  listBoardWarPhaseArcs,
  listBoardWorkerFigures,
  resolveLivingCultureKit,
} from "./BoardLivingRealm";
import { CultureWhispersCard, summarizeCultureNews } from "./CultureWhispersCard";
import { WarPhaseLine } from "./WarPhaseLine";
import { BoardLiving } from "../BoardLiving";
import { WorldTab } from "../tabs/WorldTab";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("resolveLivingCultureKit", () => {
  it("resolves Western, Cedar, Sand, Steppe, Islands, and Iron March variants with player fallback", () => {
    const s = createGameState({ seed: 1 });
    expect(resolveLivingCultureKit(s, "rival")).toBe("iron");
    expect(LIVING_CULTURE_PALETTE.iron.label).toBe("Iron March");

    setPlayerCulture(s, "woodland");
    expect(resolveLivingCultureKit(s, "player")).toBe("woodland");
    setPlayerCulture(s, "desert");
    expect(resolveLivingCultureKit(s, "player")).toBe("desert");
    setPlayerCulture(s, "steppe");
    expect(resolveLivingCultureKit(s, "player")).toBe("steppe");
    setPlayerCulture(s, "tide");
    expect(resolveLivingCultureKit(s, "player")).toBe("tide");
    // Regional western kit falls back to western palette
    setPlayerCulture(s, "mist");
    expect(resolveLivingCultureKit(s, "player")).toBe("western");

    // Unknown NPC realm falls back cleanly to player's kit
    setPlayerCulture(s, "tide");
    expect(resolveLivingCultureKit(s, "unknown_realm")).toBe("tide");
  });
});

describe("Board workers, node crews, and unit tasks", () => {
  it("separates idle workers from working farm/quarry/yard citizens and node gather crews", () => {
    const s = createGameState({ seed: 1, withStarterBuildings: true });
    s.citizens = [];
    const cFarm = createCitizen(s, "player", "farmer");
    assignJob(s, cFarm.id, "farmer");
    assignTile(s, cFarm.id, { x: 0, y: 0 });
    const cQuarry = createCitizen(s, "player", "miner");
    assignJob(s, cQuarry.id, "miner");
    assignTile(s, cQuarry.id, { x: 2, y: 0 });
    const cYard = createCitizen(s, "player", "woodcutter");
    assignJob(s, cYard.id, "woodcutter");
    assignTile(s, cYard.id, { x: 1, y: 0 });
    createCitizen(s, "player", "unassigned");

    const nodeProv = s.board.provinces.find((p) => p.node in GATHER_NODES)!;
    revealProvince(s, nodeProv.id);
    s.flags.gathers_json = JSON.stringify([
      {
        id: "g_1",
        realmId: "player",
        fromId: s.board.homeProvinceId,
        toId: nodeProv.id,
        node: nodeProv.node,
        phase: "gathering",
        arrivesTick: s.meta.tick + 40,
        force: { militia: 3 },
      },
    ]);

    const figs = listBoardWorkerFigures(s);
    expect(figs.some((f) => f.kind === "citizen" && f.tag === "farm" && f.working)).toBe(true);
    expect(figs.some((f) => f.kind === "citizen" && f.tag === "quarry" && f.working)).toBe(true);
    expect(figs.some((f) => f.kind === "citizen" && f.tag === "yard" && f.working)).toBe(true);
    expect(figs.some((f) => f.kind === "citizen" && f.tag === "idle" && !f.working)).toBe(true);
    expect(figs.some((f) => f.kind === "crew" && f.working)).toBe(true);

    const svgHtml = renderToStaticMarkup(<svg><BoardLivingRealm state={s} /></svg>);
    expect(svgHtml).toContain('data-worker-state="working"');
    expect(svgHtml).toContain('data-worker-state="idle"');
    expect(svgHtml).toContain('data-worker-task="farm"');
    expect(svgHtml).toContain('data-worker-task="quarry"');
    expect(svgHtml).toContain('data-worker-task="yard"');
    expect(svgHtml).toContain('data-unit-doing="gathering"');
  });

  it("maps active marches, scouts, garrisons, and returning columns onto the board", () => {
    const s = createGameState({ seed: 1 });
    const dest = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId)!;
    revealProvince(s, dest.id);
    s.flags.marches_json = JSON.stringify([
      {
        id: "m_1",
        realmId: "player",
        fromId: s.board.homeProvinceId,
        toId: dest.id,
        arrivesTick: s.meta.tick + 30,
        kind: "camp",
        levy: 0,
        force: { spearman: 4 },
        purpose: "raid",
      },
    ]);
    s.flags.garrisons_json = JSON.stringify([{ provinceId: dest.id, force: { militia: 2 } }]);

    const tasks = listBoardUnitTasks(s);
    expect(tasks.some((t) => t.doing === "marching" && t.men === 4)).toBe(true);
    expect(tasks.some((t) => t.doing === "garrisoned" && t.men === 2)).toBe(true);
  });
});

describe("War phase board arcs & WarPhaseLine accents", () => {
  it("renders non-blocking arcs and WarPhaseLine accents across columns, skirmish, clash, and aftermath", () => {
    const s = createGameState({ seed: 1 });
    s.meta.tick = 1000;
    tryDeclareWar(s, { attackerRealmId: "player", defenderRealmId: "rival" });

    expect(listBoardWarPhaseArcs(s)[0]?.phaseId).toBe("columns");
    expect(renderToStaticMarkup(<svg><BoardLivingRealm state={s} /></svg>)).toContain('data-war-phase="columns"');
    expect(renderToStaticMarkup(<WarPhaseLine state={s} />)).toContain("sc-war-phase-pip");

    s.meta.tick = 1150;
    expect(listBoardWarPhaseArcs(s)[0]?.phaseId).toBe("skirmish");
    expect(renderToStaticMarkup(<svg><BoardLivingRealm state={s} /></svg>)).toContain('data-war-phase="skirmish"');
    expect(renderToStaticMarkup(<WarPhaseLine state={s} />)).toContain('data-phase="skirmish"');

    s.meta.tick = 1350;
    expect(listBoardWarPhaseArcs(s)[0]?.phaseId).toBe("clash");
    expect(renderToStaticMarkup(<svg><BoardLivingRealm state={s} /></svg>)).toContain('data-war-phase="clash"');

    tryWhitePeace(s);
    expect(listBoardWarPhaseArcs(s)[0]?.phaseId).toBe("aftermath");
    expect(renderToStaticMarkup(<svg><BoardLivingRealm state={s} /></svg>)).toContain('data-war-phase="aftermath"');
  });
});

describe("Trade caravan trails & CultureWhispersCard", () => {
  it("projects recent caravans onto the board and expires stale ones beyond CARAVAN_BOARD_WINDOW_TICKS", () => {
    const s = createGameState({ seed: 1 });
    s.meta.tick = 500;
    const npcHold = s.board.provinces.find((p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player")!;
    const npcId = npcHold.occupantRealmId!;
    const npcName = s.realms.find((r) => r.id === npcId)!.name;

    s.flags.world_log = JSON.stringify([
      { tick: 400, id: "trade", text: `${npcName} trades caravans with Your Crown` },
    ]);
    const activeTrails = listBoardCaravanTrails(s);
    expect(activeTrails.length).toBe(1);
    expect(activeTrails[0]).toMatchObject({ fromRealmId: npcId, toRealmId: "player", isPlayer: true });

    const svgHtml = renderToStaticMarkup(<svg><BoardLivingRealm state={s} /></svg>);
    expect(svgHtml).toContain("sc-lr-caravan-trail");
    expect(svgHtml).toContain("sc-lr-caravan-mote");

    s.meta.tick = 400 + CARAVAN_BOARD_WINDOW_TICKS + 1;
    expect(listBoardCaravanTrails(s)).toEqual([]);
  });

  it("renders read-only CultureWhispersCard with culture crests and no chat input inside WorldTab", () => {
    const s = createGameState({ seed: 1 });
    expect(renderToStaticMarkup(<CultureWhispersCard state={s} />)).toContain("No whispers or caravans on the roads yet.");

    s.flags.culture_news = JSON.stringify([
      {
        tick: 300,
        kind: "whisper",
        fromRealmId: "k_silk",
        toRealmId: "player",
        text: "Silk Lands to Your Crown: \"The courtyard lamps burn late.\"",
      },
      {
        tick: 600,
        kind: "caravan",
        fromRealmId: "rival",
        toRealmId: "k_silk",
        text: "Iron March trades caravans with Silk Lands",
      },
    ]);

    const summary = summarizeCultureNews(s);
    expect(summary.length).toBe(2);
    expect(summary[0].kind).toBe("caravan");
    expect(summary[1].kind).toBe("whisper");

    const cardHtml = renderToStaticMarkup(<CultureWhispersCard state={s} />);
    expect(cardHtml).toContain('data-culture-news-kind="whisper"');
    expect(cardHtml).toContain('data-culture-news-kind="caravan"');
    expect(cardHtml).toContain("sc-culture-crest");
    expect(cardHtml).not.toMatch(/<(input|textarea)\b/i);

    const worldHtml = renderToStaticMarkup(<WorldTab state={s} act={() => {}} worldLog={[]} />);
    expect(worldHtml).toContain("Realm Whispers &amp; Caravans");
    expect(worldHtml).toContain("1 whisper · 1 caravan");
    expect(worldHtml).toContain("sc-culture-whispers");

    createCitizen(s, "player", "farmer");
    const boardHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible />);
    expect(boardHtml).toContain("sc-lr-board-layer");
  });
});

describe("Living Realm CSS isolation and safety", () => {
  const boardCss = readTextFile("./living-realm-board.css");
  const uiCss = readTextFile("./living-realm-ui.css");
  const themeCss = readTextFile("../theme.css");
  const boardBaseCss = readTextFile("../board-living.css");
  const warPhaseCss = readTextFile("./war-phase.css");

  it("supports Dusk, Night, Parchment themes, click immunity, reduced motion, and leaves base stylesheets untouched", () => {
    for (const css of [boardCss, uiCss]) {
      expect(css).toContain(':root[data-chrome="dusk"]');
      expect(css).toContain(':root[data-chrome="night"]');
      expect(css).toContain(':root[data-chrome="parchment"]');
      expect(css).toContain("@media (prefers-reduced-motion: reduce)");
      expect(css).toContain("pointer-events: none !important");
      expect(css).not.toContain(".sc-ledger-cell::before");
      expect(css).not.toContain(".sc-ledger-cell::after");
      expect(css).not.toContain(".sc-board");
      expect(css).not.toContain(".sc-chat-float");
      expect(css).not.toContain(".sc-admin-float");
      expect(css).not.toContain(".sc-theme-dock");
    }
    expect(themeCss).not.toContain("sc-lr-");
    expect(themeCss).not.toContain("sc-culture-whispers");
    expect(boardBaseCss).not.toContain("sc-lr-");
    expect(warPhaseCss).not.toContain("sc-war-phase-pip");
  });
});
