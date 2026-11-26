import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  FIGHT_LOCKED_LINE,
  GATHER_NODES,
  WAR_PHASE_START,
  createGameState,
  maybeNpcClaim,
  revealProvince,
  tryDeclareWar,
  tryNpcGather,
  tryNpcMarch,
  type GameState,
} from "@second-crown/sim";
import { BoardNpcActivity, listBoardNpcAccents } from "./BoardNpcActivity";
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
    <WarRoom state={s} act={() => {}} rivalOp={0} playerOp={0} battleSnap={null} setBattleSnap={() => {}} />,
  );
}

describe("listBoardNpcAccents & BoardNpcActivity", () => {
  it("guards partial mock GameState fixtures safely", () => {
    expect(listBoardNpcAccents(undefined)).toEqual([]);
    expect(listBoardNpcAccents({} as GameState)).toEqual([]);
  });

  it("renders seen NPC claims, camp marches, and gather crews with culture-kit colors while respecting fog", () => {
    const s = createGameState({ seed: 1 });
    s.meta.tick = 4000;
    const npcHold = s.board.provinces.find(
      (p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player" && p.occupantRealmId !== "rival",
    )!;
    const npcId = npcHold.occupantRealmId!;
    revealProvince(s, npcHold.id);

    // 1. Seen claim
    const claimTile = s.board.provinces.find((p) => p.node === "none" && !p.occupantRealmId && p.id !== s.board.homeProvinceId)!;
    claimTile.occupantRealmId = npcId;
    s.flags.npc_claims = JSON.stringify([{ realmId: npcId, provinceId: claimTile.id, tick: s.meta.tick }]);
    // Fog check: while claimTile is unseen, skip it; once revealed, show it
    expect(listBoardNpcAccents(s).some((a) => a.kind === "claim")).toBe(false);
    revealProvince(s, claimTile.id);

    // 2. Camp march by rival (Iron March kit)
    const campProv = s.board.provinces.find((p) => p.node === "camp" && !p.occupantRealmId)!;
    revealProvince(s, campProv.id);
    tryNpcMarch(s, "rival", campProv.id);

    // 3. NPC gather crew on a seen resource node
    const nodeProv = s.board.provinces.find((p) => p.node in GATHER_NODES)!;
    revealProvince(s, nodeProv.id);
    tryNpcGather(s, npcId, nodeProv.id);

    const accents = listBoardNpcAccents(s);
    expect(accents.some((a) => a.kind === "claim" && a.phase === "planted" && a.realmId === npcId)).toBe(true);
    expect(accents.some((a) => a.kind === "camp" && a.phase === "marching" && a.kit === "iron")).toBe(true);
    expect(accents.some((a) => a.kind === "gather" && a.phase === "outbound" && a.realmId === npcId)).toBe(true);

    const svgHtml = renderToStaticMarkup(<svg><BoardNpcActivity state={s} /></svg>);
    expect(svgHtml).toContain("sc-npc-board-layer");
    expect(svgHtml).toContain('data-npc-kind="claim"');
    expect(svgHtml).toContain('data-npc-phase="planted"');
    expect(svgHtml).toContain('data-npc-kind="camp"');
    expect(svgHtml).toContain('data-npc-phase="marching"');
    expect(svgHtml).toContain('data-culture-kit="iron"');
    expect(svgHtml).toContain('data-npc-kind="gather"');
    expect(svgHtml).toContain('data-npc-phase="outbound"');

    // Also verifies BoardLiving integration renders the NPC board layer
    const boardHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible />);
    expect(boardHtml).toContain("sc-npc-board-layer");

    // Verify maybeNpcClaim integration works cleanly too
    const s2 = createGameState({ seed: 2 });
    const npcHold2 = s2.board.provinces.find(
      (p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player",
    )!;
    const npc2 = npcHold2.occupantRealmId!;
    let claimed = null;
    for (let pulse = 1; pulse <= 12 && !claimed; pulse++) {
      s2.meta.tick = pulse * 100;
      claimed = maybeNpcClaim(s2, npc2, s2.meta.tick);
    }
    expect(claimed).not.toBeNull();
    revealProvince(s2, claimed!.id);
    expect(listBoardNpcAccents(s2).some((a) => a.kind === "claim" && a.realmId === npc2)).toBe(true);
  });
});

describe("War tab calm clash lock presentation", () => {
  it("styles the locked Fight button and status note before clash while keeping White Peace open", () => {
    const s = createGameState({ seed: 1 });
    s.wars = [];
    s.meta.tick = 1000;
    tryDeclareWar(s, { attackerRealmId: "player", defenderRealmId: "rival" });

    s.meta.tick = 1000 + WAR_PHASE_START.skirmish;
    const lockedHtml = renderWarRoom(s);
    expect(lockedHtml).toContain('class="sc-fight-btn is-clash-locked"');
    expect(lockedHtml).toContain('data-fight-locked="true"');
    expect(lockedHtml).toContain(">Fight</button>");
    expect(lockedHtml).toContain(">White Peace</button>");
    expect(lockedHtml).toContain('data-clash-lock="waiting"');
    expect(lockedHtml).toContain("Waiting for clash");
    expect(lockedHtml).toContain(`${FIGHT_LOCKED_LINE}.`);

    s.meta.tick = 1000 + WAR_PHASE_START.clash;
    const openHtml = renderWarRoom(s);
    expect(openHtml).toContain('class="sc-fight-btn"');
    expect(openHtml).not.toContain("is-clash-locked");
    expect(openHtml).not.toContain('data-clash-lock="waiting"');
  });
});

describe("npc-board-clash.css isolation and safety", () => {
  const css = readTextFile("./npc-board-clash.css");
  const themeCss = readTextFile("../theme.css");
  const boardCss = readTextFile("../board-living.css");
  const livingBoardCss = readTextFile("./living-realm-board.css");

  it("supports Dusk, Night, Parchment themes, click immunity, reduced motion, and avoids forbidden selectors", () => {
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

    expect(themeCss).not.toContain("sc-npc-board-layer");
    expect(themeCss).not.toContain("sc-fight-lock-badge");
    expect(boardCss).not.toContain("sc-npc-board-layer");
    expect(livingBoardCss).not.toContain("sc-npc-board-layer");
  });
});
