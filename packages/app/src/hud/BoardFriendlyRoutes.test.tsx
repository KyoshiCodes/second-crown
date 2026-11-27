import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  createGameState,
  friendlyRoutesSnapshot,
  joinSide,
  maybeNpcTrade,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import { BoardFriendlyRoutes, listBoardFriendlyRoutes } from "./BoardFriendlyRoutes";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function revealAllHolds(s: GameState) {
  s.flags.fog_seen = JSON.stringify(s.board.provinces.map((p) => p.id));
}

describe("BoardFriendlyRoutes friendly routes presentation", () => {
  it("guards partial state, stays hidden with no qualifying pairs, respects fog, and honors living_friendly_routes", () => {
    expect(listBoardFriendlyRoutes(undefined)).toEqual([]);
    expect(listBoardFriendlyRoutes({} as GameState)).toEqual([]);

    const s = createGameState({ seed: 1 });
    expect(friendlyRoutesSnapshot(s)).toEqual([]);
    expect(listBoardFriendlyRoutes(s)).toEqual([]);
    expect(renderToStaticMarkup(<svg><BoardFriendlyRoutes state={s} /></svg>)).toBe("<svg></svg>");

    // Peace lock between two friendly neighbors whose one hold is still fogged -> skipped
    const npcHolds = s.board.provinces.filter(
      (p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player",
    );
    const aId = npcHolds[0].occupantRealmId!;
    const bId = npcHolds[1].occupantRealmId!;
    s.meta.tick = 1000;
    s.flags[`peace_player_${aId}`] = 2000;
    s.flags[`peace_player_${bId}`] = 2000;
    s.flags[`peace_${aId}_${bId}`] = 2000;
    s.flags.fog_seen = JSON.stringify([s.board.homeProvinceId, npcHolds[0].id]);

    expect(friendlyRoutesSnapshot(s)).toHaveLength(1);
    expect(listBoardFriendlyRoutes(s)).toEqual([]);

    // Reveal both holds, then switch living_friendly_routes off
    revealAllHolds(s);
    expect(listBoardFriendlyRoutes(s)).toHaveLength(1);
    setLivingSwitch(s, "friendlyRoutes", false);
    expect(listBoardFriendlyRoutes(s)).toEqual([]);
    expect(renderToStaticMarkup(<svg><BoardFriendlyRoutes state={s} /></svg>)).toBe("<svg></svg>");
  });

  it("renders calm culture-kit arcs across strengths 1, 2, and 3 beneath presence and war marks without blocking or blood", () => {
    const s = createGameState({ seed: 1 });
    s.wars = [];
    s.meta.tick = 1000;
    revealAllHolds(s);

    const npcHolds = s.board.provinces.filter(
      (p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player",
    );
    const allyId = npcHolds[0].occupantRealmId!;
    const foeId = npcHolds[1].occupantRealmId!;
    const friendB = npcHolds[2].occupantRealmId!;
    const friendC = npcHolds[3].occupantRealmId!;
    const friendD = npcHolds[4].occupantRealmId!;

    // Player peace locks with friendB, friendC, friendD
    s.flags[`peace_player_${friendB}`] = 2000;
    s.flags[`peace_player_${friendC}`] = 2000;
    s.flags[`peace_player_${friendD}`] = 2000;

    // Joined war -> allyId is Pact ally (riding with player)
    const npcWar = {
      id: `war_npc_${allyId}_${foeId}_980`,
      attackerRealmId: allyId,
      defenderRealmId: foeId,
      startedTick: 980,
      status: "active" as const,
    };
    s.wars.push(npcWar);
    joinSide(s, npcWar.id, "attacker");

    // 1. Peace-only route between friendC & friendD (strength 1)
    s.flags[`peace_${friendC}_${friendD}`] = 2000;
    // 2. Pact route between allyId & friendB (strength 2) -> auto via ally + friendB
    // 3. Trade + Pact route between allyId & friendC (strength 3) via live gather crew
    s.flags.gathers_json = JSON.stringify([
      { realmId: allyId, toId: npcHolds[2].id },
    ]);

    // Suppress unused warning on maybeNpcTrade import or verify it isn't needed
    expect(typeof maybeNpcTrade).toBe("function");

    const routes = listBoardFriendlyRoutes(s);
    const strengths = new Set(routes.map((r) => r.strength));
    expect(strengths.has(1)).toBe(true);
    expect(strengths.has(2)).toBe(true);
    expect(strengths.has(3)).toBe(true);

    const html = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible />);
    expect(html).toContain("sc-froute-layer");
    expect(html).toContain('style="pointer-events:none"');
    expect(html).toContain('data-route-strength="1"');
    expect(html).toContain('data-route-strength="2"');
    expect(html).toContain('data-route-strength="3"');
    expect(html).toContain("sc-froute-glow");
    expect(html).toContain("sc-froute-mote is-strong");
    expect(html).not.toContain("blood");

    // Friendly routes sit cleanly below presence, formations, and column marks in SVG paint order
    const routesPos = html.indexOf("sc-froute-layer");
    const presencePos = html.indexOf("sc-friendly-layer");
    const formationsPos = html.indexOf("sc-joined-formation-layer");
    const colMarksPos = html.indexOf("sc-colmark-layer");
    expect(routesPos).toBeGreaterThan(-1);
    expect(presencePos).toBeGreaterThan(routesPos);
    expect(formationsPos).toBeGreaterThan(routesPos);
    expect(colMarksPos).toBeGreaterThan(routesPos);
  });

  it("keeps friendly-routes.css isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    const css = readTextFile("./friendly-routes.css");
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
