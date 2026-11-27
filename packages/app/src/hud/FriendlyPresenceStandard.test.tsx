import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  STANDARD_STRENGTH,
  WAR_PHASE_START,
  columnMarkSnapshot,
  createGameState,
  friendlyPresenceSnapshot,
  joinSide,
  setLivingSwitch,
  tryWhitePeace,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import { BoardColumnMarks, resolveBoardColumnMark } from "./BoardColumnMarks";
import { resolveBoardColumnRanks } from "./BoardColumnRanks";
import { BoardFriendlyPresence, listBoardFriendlyPresence } from "./BoardFriendlyPresence";
import { listBoardJoinedFormations } from "./BoardJoinedFormations";

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

describe("FriendlyPresence & Column standardStrength (1/2/3) board presentation", () => {
  it("guards partial state and stays hidden when no friendly realms qualify or fog hides holds", () => {
    expect(listBoardFriendlyPresence(undefined)).toEqual([]);
    expect(listBoardFriendlyPresence({} as GameState)).toEqual([]);

    const s = createGameState({ seed: 1 });
    expect(friendlyPresenceSnapshot(s)).toEqual([]);
    expect(listBoardFriendlyPresence(s)).toEqual([]);
    expect(renderToStaticMarkup(<svg><BoardFriendlyPresence state={s} /></svg>)).toBe("<svg></svg>");

    // Peace lock on an unseen hold is respected by fog
    const npcHold = s.board.provinces.find(
      (p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player",
    )!;
    const realmId = npcHold.occupantRealmId!;
    s.flags.fog_seen = JSON.stringify([s.board.homeProvinceId]);
    s.flags[`peace_player_${realmId}`] = 2000;
    s.meta.tick = 100;
    expect(friendlyPresenceSnapshot(s)).toHaveLength(1);
    expect(listBoardFriendlyPresence(s)).toEqual([]);
  });

  it("renders calm peace, pact, and trade presence marks on seen holds with zero blocking or blood", () => {
    const s = createGameState({ seed: 1 });
    s.wars = [];
    s.meta.tick = 1000;
    revealAllHolds(s);

    const npcHolds = s.board.provinces.filter(
      (p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player",
    );
    const peaceRealmId = npcHolds[0].occupantRealmId!;
    const allyRealmId = npcHolds[1].occupantRealmId!;
    const foeRealmId = npcHolds[2].occupantRealmId!;
    const tradeRealmId = npcHolds[3].occupantRealmId!;

    // 1. Peace lock realm
    s.flags[`peace_player_${peaceRealmId}`] = 2000;
    // 2. Trade realm (peace lock + recent world trade log entry matching "<Name> trades caravans with ")
    s.flags[`peace_player_${tradeRealmId}`] = 2000;
    const tradeName = s.realms.find((r) => r.id === tradeRealmId)!.name;
    s.flags.world_log = JSON.stringify([
      { tick: 950, id: "trade", text: `${tradeName} trades caravans with Your Crown` },
    ]);
    // 3. Pact realm (ally in an active joined NPC war)
    const npcWar = {
      id: `war_npc_${allyRealmId}_${foeRealmId}_980`,
      attackerRealmId: allyRealmId,
      defenderRealmId: foeRealmId,
      startedTick: 980,
      status: "active" as const,
    };
    s.wars.push(npcWar);
    joinSide(s, npcWar.id, "attacker");

    const items = listBoardFriendlyPresence(s);
    const byId = new Map(items.map((item) => [item.realmId, item]));
    expect(byId.get(peaceRealmId)?.kind).toBe("peace");
    expect(byId.get(peaceRealmId)?.routePath).toBeNull();
    expect(byId.get(allyRealmId)?.kind).toBe("pact");
    expect(byId.get(allyRealmId)?.routePath).toBeTruthy();
    expect(byId.get(tradeRealmId)?.kind).toBe("trade");
    expect(byId.get(tradeRealmId)?.routePath).toBeTruthy();
    expect(byId.has(foeRealmId)).toBe(false);

    const html = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible />);
    expect(html).toContain("sc-friendly-layer");
    expect(html).toContain('style="pointer-events:none"');
    expect(html).toContain(`data-friendly-realm="${peaceRealmId}" data-friendly-kind="peace"`);
    expect(html).toContain(`data-friendly-realm="${allyRealmId}" data-friendly-kind="pact"`);
    expect(html).toContain(`data-friendly-realm="${tradeRealmId}" data-friendly-kind="trade"`);
    expect(html).toContain("sc-friendly-pip is-peace");
    expect(html).toContain("sc-friendly-standard is-pact");
    expect(html).toContain("sc-friendly-pip is-trade");
    expect(html).not.toContain("blood");

    // Switching living_board_presence off empties friendly presence
    setLivingSwitch(s, "boardPresence", false);
    expect(listBoardFriendlyPresence(s)).toEqual([]);
    expect(renderToStaticMarkup(<svg><BoardFriendlyPresence state={s} /></svg>)).toBe("<svg></svg>");
  });

  it("scales BoardColumnMarks standards by standardStrength (1/2/3) without overlapping formation, column, or rank marks", () => {
    const s = createGameState({ seed: 1 });
    s.wars = [];
    s.meta.tick = 1000;

    const npcHolds = s.board.provinces.filter(
      (p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player",
    );
    const attackerId = npcHolds[0].occupantRealmId!;
    const defenderId = npcHolds[1].occupantRealmId!;
    const npcWar = {
      id: `war_npc_${attackerId}_${defenderId}_980`,
      attackerRealmId: attackerId,
      defenderRealmId: defenderId,
      startedTick: 980,
      status: "active" as const,
    };
    s.wars.push(npcWar);
    joinSide(s, npcWar.id, "attacker");

    // 1. columns -> standardStrength 1
    expect(columnMarkSnapshot(s)?.standardStrength).toBe(STANDARD_STRENGTH.columns);
    const c1 = resolveBoardColumnMark(s)!;
    const fPt = listBoardJoinedFormations(s)[0]!;
    const rPt = resolveBoardColumnRanks(s)!;
    expect(c1.standardStrength).toBe(1);
    expect(c1.badgeY).not.toBe(fPt.my);
    expect(c1.badgeY).not.toBe(rPt.noteY);

    const html1 = renderToStaticMarkup(<svg><BoardColumnMarks state={s} /></svg>);
    expect(html1).toContain("is-strength-1");
    expect(html1).toContain('data-standard-strength="1"');
    expect(html1).not.toContain("sc-colmark-finial");
    expect(html1).not.toContain("sc-colmark-standard-halo");

    // 2. skirmish -> standardStrength 2
    s.meta.tick = 980 + WAR_PHASE_START.skirmish + 10;
    expect(resolveBoardColumnMark(s)?.standardStrength).toBe(STANDARD_STRENGTH.skirmish);
    const html2 = renderToStaticMarkup(<svg><BoardColumnMarks state={s} /></svg>);
    expect(html2).toContain("is-strength-2");
    expect(html2).toContain('data-standard-strength="2"');
    expect(html2).toContain("sc-colmark-finial");
    expect(html2).not.toContain("sc-colmark-standard-halo");

    // 3. clash -> standardStrength 3 (drops back to 1 when living_board_presence is false)
    s.meta.tick = 980 + WAR_PHASE_START.clash + 10;
    expect(resolveBoardColumnMark(s)?.standardStrength).toBe(STANDARD_STRENGTH.clash);
    const html3 = renderToStaticMarkup(<svg><BoardColumnMarks state={s} /></svg>);
    expect(html3).toContain("is-strength-3");
    expect(html3).toContain('data-standard-strength="3"');
    expect(html3).toContain("sc-colmark-finial");
    expect(html3).toContain("sc-colmark-standard-halo");

    setLivingSwitch(s, "boardPresence", false);
    expect(resolveBoardColumnMark(s)?.standardStrength).toBe(1);
    setLivingSwitch(s, "boardPresence", true);

    // 4. aftermath -> standardStrength 1
    tryWhitePeace(s);
    expect(resolveBoardColumnMark(s)?.standardStrength).toBe(STANDARD_STRENGTH.aftermath);
    const html4 = renderToStaticMarkup(<svg><BoardColumnMarks state={s} /></svg>);
    expect(html4).toContain("is-strength-1");
    expect(html4).toContain('data-standard-strength="1"');
  });

  it("keeps friendly-presence-standard.css isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    const css = readTextFile("./friendly-presence-standard.css");
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
