import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  WAR_AFTERMATH_TICKS,
  WAR_PHASE_START,
  createGameState,
  joinSide,
  revealProvince,
  settleNpcWars,
  type GameState,
} from "@second-crown/sim";
import { JoinableWarsCard, listJoinableNpcWars } from "./JoinableWarsCard";
import { BoardWarImagery, listBoardWarImagery } from "./BoardWarImagery";
import { BoardLiving } from "../BoardLiving";
import { WarRoom } from "../WarRoom";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function renderWarRoom(s: GameState) {
  return renderToStaticMarkup(
    <WarRoom
      state={s}
      act={() => {}}
      rivalOp={0}
      playerOp={0}
      battleSnap={null}
      setBattleSnap={() => {}}
    />,
  );
}

describe("JoinableWarsCard, BoardWarImagery & Living Realm slice 5 UI", () => {
  it("guards partial mock GameState fixtures safely and stays quiet at baseline", () => {
    expect(listJoinableNpcWars(undefined)).toEqual([]);
    expect(listJoinableNpcWars({} as GameState)).toEqual([]);
    expect(listBoardWarImagery(undefined)).toEqual([]);
    expect(listBoardWarImagery({} as GameState)).toEqual([]);

    const s = createGameState({ seed: 1 });
    s.wars = [];
    expect(listJoinableNpcWars(s)).toEqual([]);
    expect(listBoardWarImagery(s)).toEqual([]);
    expect(renderWarRoom(s)).not.toContain("sc-join-wars-card");
    expect(renderToStaticMarkup(<svg><BoardWarImagery state={s} /></svg>)).not.toContain(
      "sc-war-imagery-layer",
    );
  });

  it("renders a calm Join control per side on WarRoom and honors peace locks & joinSide", () => {
    const s = createGameState({ seed: 1 });
    s.wars = [];
    s.meta.tick = 1000;

    const npcRealms = s.realms.filter((r) => r.id !== "player");
    const attacker = npcRealms[0];
    const defender = npcRealms[1];

    const npcWar = {
      id: `war_npc_${attacker.id}_${defender.id}_900`,
      attackerRealmId: attacker.id,
      defenderRealmId: defender.id,
      startedTick: 900,
      status: "active" as const,
    };
    s.wars.push(npcWar);

    const html = renderWarRoom(s);
    expect(html).toContain("sc-join-wars-card");
    expect(html).toContain(`data-join-war-row="${npcWar.id}"`);
    expect(html).toContain('data-join-side="attacker"');
    expect(html).toContain('data-join-side="defender"');
    expect(html).toContain(`Join ${attacker.name}`);
    expect(html).toContain(`Join ${defender.name}`);

    // Peace-lock with defender disables only joining the attacker side
    s.flags[`peace_player_${defender.id}`] = s.meta.tick + 500;
    const listLocked = listJoinableNpcWars(s);
    expect(listLocked).toHaveLength(1);
    expect(listLocked[0].sides).toEqual({ attacker: false, defender: true });

    const lockedHtml = renderToStaticMarkup(<JoinableWarsCard state={s} act={() => {}} />);
    expect(lockedHtml).toMatch(/disabled[^>]*data-join-side="attacker"|data-join-side="attacker"[^>]*disabled/);
    expect(lockedHtml).not.toMatch(/data-join-side="defender"[^>]*disabled/);

    // Clear lock and join attacker side using the sim's joinSide action
    delete s.flags[`peace_player_${defender.id}`];
    const joined = joinSide(s, npcWar.id, "attacker");
    expect(joined).not.toBeNull();
    expect(joined?.allyRealmId).toBe(attacker.id);
    // Player is now at war -> JoinableWarsCard disappears
    expect(listJoinableNpcWars(s)).toEqual([]);
    expect(renderWarRoom(s)).not.toContain("sc-join-wars-card");
  });

  it("renders opposing culture banners and short phase line from warImagerySnapshot on BoardLiving", () => {
    const s = createGameState({ seed: 1 });
    s.wars = [];
    s.meta.tick = 1000;

    const npcHolds = s.board.provinces.filter(
      (p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player",
    );
    const holdA = npcHolds[0];
    const holdD = npcHolds[1];
    const realmAId = holdA.occupantRealmId!;
    const realmDId = holdD.occupantRealmId!;
    const realmA = s.realms.find((r) => r.id === realmAId)!;
    const realmD = s.realms.find((r) => r.id === realmDId)!;

    const npcWar = {
      id: `war_npc_${realmAId}_${realmDId}_950`,
      attackerRealmId: realmAId,
      defenderRealmId: realmDId,
      startedTick: 950,
      status: "active" as const,
    };
    s.wars.push(npcWar);

    // Fog check: neither NPC hold seen -> hidden on board
    expect(listBoardWarImagery(s)).toEqual([]);

    // Reveal one NPC hold -> opposing standards, front line, and short banner appear
    revealProvince(s, holdA.id);
    const items = listBoardWarImagery(s);
    expect(items).toHaveLength(1);
    expect(items[0].phase).toBe("columns");
    expect(items[0].banner).toContain(realmA.name);
    expect(items[0].banner).toContain(realmD.name);

    const boardHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible />);
    expect(boardHtml).toContain("sc-war-imagery-layer");
    expect(boardHtml).toContain(`data-war-imagery="${npcWar.id}"`);
    expect(boardHtml).toContain('data-war-phase="columns"');
    expect(boardHtml).toContain("sc-war-imagery-front");
    expect(boardHtml).toContain("sc-war-imagery-standard is-attacker");
    expect(boardHtml).toContain("sc-war-imagery-standard is-defender");
    expect(boardHtml).toContain(items[0].banner);

    // Join attacker side -> joined player war renders companion ally pennant & banner
    const joined = joinSide(s, npcWar.id, "attacker")!;
    const joinedHtml = renderToStaticMarkup(<svg><BoardWarImagery state={s} /></svg>);
    expect(joinedHtml).toContain(`data-war-imagery="${joined.id}"`);
    expect(joinedHtml).toContain("sc-war-imagery-ally");

    // Settle NPC war -> aftermath banner shown until WAR_AFTERMATH_TICKS passes
    const clashTick = 950 + WAR_PHASE_START.clash;
    s.meta.tick = clashTick + 10;
    settleNpcWars(s, clashTick);
    const aftermathItems = listBoardWarImagery(s).filter((x) => x.warId === npcWar.id);
    expect(aftermathItems).toHaveLength(1);
    expect(aftermathItems[0].phase).toBe("aftermath");
    expect(aftermathItems[0].active).toBe(false);
    expect(aftermathItems[0].banner).toContain("fall");

    s.meta.tick = clashTick + WAR_AFTERMATH_TICKS + 1;
    expect(listBoardWarImagery(s).some((x) => x.warId === npcWar.id)).toBe(false);
  });

  it("keeps war-join-imagery.css isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    const css = readTextFile("./war-join-imagery.css");
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    for (const forbidden of [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ]) {
      expect(css).not.toContain(forbidden);
    }
  });
});
