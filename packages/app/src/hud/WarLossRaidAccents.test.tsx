import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  HOME_RAID_COOLDOWN_TICKS,
  WAR_AFTERMATH_TICKS,
  WAR_PHASE_START,
  createGameState,
  getHomeRaid,
  listMarches,
  maybeNpcRaid,
  revealProvince,
  settleNpcWars,
  type GameState,
} from "@second-crown/sim";

const HOME_RAID_FIRST_TICK = 3000;
import {
  BoardWarLossAndRaid,
  listBoardNpcWarLosses,
  resolveBoardHomeRaid,
} from "./BoardWarLossAndRaid";
import { BoardLiving } from "../BoardLiving";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function setRealmMilitia(s: GameState, realmId: string, count: number): void {
  s.units = s.units.filter((u) => u.realmId !== realmId);
  s.units.push({
    id: `u_${realmId}_militia`,
    typeId: "militia",
    realmId,
    count: String(count),
    armyId: null,
  });
}

describe("listBoardNpcWarLosses, resolveBoardHomeRaid & BoardWarLossAndRaid", () => {
  it("guards partial mock GameState fixtures safely and stays quiet when nothing applies", () => {
    expect(listBoardNpcWarLosses(undefined)).toEqual([]);
    expect(listBoardNpcWarLosses({} as GameState)).toEqual([]);
    expect(resolveBoardHomeRaid(undefined)).toBeNull();
    expect(resolveBoardHomeRaid({} as GameState)).toBeNull();

    const s = createGameState({ seed: 1 });
    expect(listBoardNpcWarLosses(s)).toEqual([]);
    expect(resolveBoardHomeRaid(s)).toBeNull();
    const html = renderToStaticMarkup(<svg><BoardWarLossAndRaid state={s} /></svg>);
    expect(html).not.toContain("sc-war-loss-raid-layer");
  });

  it("renders aftermath fallen standard on seen losing NPC holds, handles white peace & fog, and expires", () => {
    const s = createGameState({ seed: 1 });
    s.wars = [];
    const npcHolds = s.board.provinces.filter(
      (p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player",
    );
    const holdA = npcHolds[0];
    const holdB = npcHolds[1];
    const realmA = holdA.occupantRealmId!;
    const realmB = holdB.occupantRealmId!;

    // Attacker A clearly stronger -> B loses 12% of 50 = 6 militia
    setRealmMilitia(s, realmA, 120);
    setRealmMilitia(s, realmB, 50);

    const startTick = 400;
    const clashTick = startTick + WAR_PHASE_START.clash;
    s.wars.push({
      id: `war_npc_${realmA}_${realmB}_${startTick}`,
      attackerRealmId: realmA,
      defenderRealmId: realmB,
      startedTick: startTick,
      status: "active",
    });

    settleNpcWars(s, clashTick);
    s.meta.tick = clashTick + 20;

    // Fog check: while holdB is unseen, skip it
    expect(listBoardNpcWarLosses(s)).toEqual([]);

    // Reveal holdB -> loser aftermath appears with calm scar hush & lowered standard
    revealProvince(s, holdB.id);
    const losses = listBoardNpcWarLosses(s);
    expect(losses).toHaveLength(1);
    expect(losses[0].realmId).toBe(realmB);
    expect(losses[0].provinceId).toBe(holdB.id);
    expect(losses[0].lost).toBe(6);

    const svgHtml = renderToStaticMarkup(<svg><BoardWarLossAndRaid state={s} /></svg>);
    expect(svgHtml).toContain("sc-war-loss-raid-layer");
    expect(svgHtml).toContain(`data-npc-war-loss="${holdB.id}"`);
    expect(svgHtml).toContain(`data-loss-realm="${realmB}"`);
    expect(svgHtml).toContain("sc-war-loss-hush");
    expect(svgHtml).toContain("sc-war-loss-standard");

    // BoardLiving integration mounts the overlay
    const boardHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible />);
    expect(boardHtml).toContain("sc-war-loss-raid-layer");
    expect(boardHtml).toContain(`data-npc-war-loss="${holdB.id}"`);

    // Short-lived: once WAR_AFTERMATH_TICKS passes, the aftermath mark clears
    s.meta.tick = clashTick + WAR_AFTERMATH_TICKS + 1;
    expect(listBoardNpcWarLosses(s)).toEqual([]);

    // White peace marks both seen holds when both lost units
    const sWp = createGameState({ seed: 2 });
    sWp.wars = [];
    const wpHolds = sWp.board.provinces.filter(
      (p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player",
    );
    const wpA = wpHolds[0];
    const wpB = wpHolds[1];
    setRealmMilitia(sWp, wpA.occupantRealmId!, 25);
    setRealmMilitia(sWp, wpB.occupantRealmId!, 25);
    revealProvince(sWp, wpA.id);
    revealProvince(sWp, wpB.id);
    sWp.wars.push({
      id: `war_npc_${wpA.occupantRealmId}_${wpB.occupantRealmId}_500`,
      attackerRealmId: wpA.occupantRealmId!,
      defenderRealmId: wpB.occupantRealmId!,
      startedTick: 500,
      status: "active",
    });
    const wpClash = 500 + WAR_PHASE_START.clash;
    settleNpcWars(sWp, wpClash);
    sWp.meta.tick = wpClash + 15;
    expect(listBoardNpcWarLosses(sWp)).toHaveLength(2);
  });

  it("renders inbound approach chevron/ring during a home raid and resting mark during cooldown", () => {
    const s = createGameState({ seed: 20261126, now: 1 });
    s.meta.tick = HOME_RAID_FIRST_TICK;
    s.flags.marches_json = "[]";

    const raiderId = s.realms.find((r) => r.id === "rival")?.id ?? "rival";
    expect(maybeNpcRaid(s, raiderId, HOME_RAID_FIRST_TICK)).toBe(true);
    const rec = getHomeRaid(s)!;

    // Inbound takes precedence even though snapshot already exposes cooldownUntil
    const inbound = resolveBoardHomeRaid(s);
    expect(inbound?.mode).toBe("inbound");
    if (inbound?.mode === "inbound") {
      expect(inbound.realmId).toBe(raiderId);
    }

    const inboundHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible />);
    expect(inboundHtml).toContain("sc-war-loss-raid-layer");
    expect(inboundHtml).toContain('data-home-raid="inbound"');
    expect(inboundHtml).toContain("sc-home-raid-ring");
    expect(inboundHtml).toContain("sc-home-raid-chevron");
    expect(inboundHtml).not.toContain('data-home-raid="resting"');

    // Clear inbound column and advance into post-raid cooldown -> quiet resting mark
    s.flags.marches_json = JSON.stringify(listMarches(s).filter((m) => m.id !== rec.marchId));
    s.meta.tick = rec.untilTick + 10;

    const resting = resolveBoardHomeRaid(s);
    expect(resting?.mode).toBe("resting");
    const restHtml = renderToStaticMarkup(<svg><BoardWarLossAndRaid state={s} /></svg>);
    expect(restHtml).toContain('data-home-raid="resting"');
    expect(restHtml).toContain("sc-home-raid-rest-ring");
    expect(restHtml).toContain("sc-home-raid-rest-mark");
    expect(restHtml).not.toContain('data-home-raid="inbound"');

    // Cooldown ends -> clears cleanly
    s.meta.tick = rec.untilTick + HOME_RAID_COOLDOWN_TICKS + 1;
    expect(resolveBoardHomeRaid(s)).toBeNull();
  });

  it("keeps war-loss-raid-accents.css isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    const css = readTextFile("./war-loss-raid-accents.css");
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
