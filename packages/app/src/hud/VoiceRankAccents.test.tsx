import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  RANKS_LABEL,
  WAR_PHASE_START,
  createGameState,
  getCulture,
  joinSide,
  nextWhisperHint,
  setLivingSwitch,
  tryWhitePeace,
  type GameState,
} from "@second-crown/sim";
import { BoardColumnRanks, resolveBoardColumnRanks } from "./BoardColumnRanks";
import { resolveBoardColumnMark } from "./BoardColumnMarks";
import { listBoardJoinedFormations } from "./BoardJoinedFormations";
import { NextWhisperHintLine, formatWhisperCultureTag } from "./NextWhisperHintLine";
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

describe("NextWhisperHintLine fromCulture tag & stronger BoardColumnRanks visuals", () => {
  it("renders 'Next whisper in ~Ns · from <culture>' when fromCulture is present and hides tag when null", () => {
    const s = createGameState({ seed: 1 });
    s.meta.tick = 150;

    const hint = nextWhisperHint(s)!;
    expect(hint.fromCulture).not.toBeNull();
    const expectedCulture = getCulture(hint.fromCulture!).name;
    expect(formatWhisperCultureTag(hint.fromCulture)).toBe(expectedCulture);
    expect(formatWhisperCultureTag(null)).toBeNull();

    const html = renderToStaticMarkup(<WorldTab state={s} act={() => {}} worldLog={[]} />);
    expect(html).toContain("Next whisper in ~15s");
    expect(html).toContain('data-from-tag="true"');
    expect(html).toContain(expectedCulture);

    // Due sender has no listener (war with the only other realm) -> fromCulture is null, seconds stay, tag hides
    const soloFoe = s.realms.find((r) => r.id !== "player")!;
    s.realms = s.realms.filter((r) => r.id === "player" || r.id === soloFoe.id);
    s.wars.push({
      id: `war_${soloFoe.id}_100`,
      attackerRealmId: soloFoe.id,
      defenderRealmId: "player",
      startedTick: 100,
      status: "active",
    });
    const noSenderHint = nextWhisperHint(s)!;
    expect(noSenderHint.fromCulture).toBeNull();
    expect(noSenderHint.secondsApprox).toBe(15);

    const noTagHtml = renderToStaticMarkup(<NextWhisperHintLine state={s} />);
    expect(noTagHtml).toContain("Next whisper in ~15s");
    expect(noTagHtml).not.toContain("sc-next-whisper-from");
    expect(noTagHtml).not.toContain('data-from-tag="true"');

    // Whispers off -> whole line still hides
    setLivingSwitch(s, "whispers", false);
    expect(renderToStaticMarkup(<NextWhisperHintLine state={s} />)).toBe("");
  });

  it("renders stronger rank plates and ranksLabel without overlapping formations or column marks", () => {
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

    // 1. column -> one rank
    const v1 = resolveBoardColumnRanks(s)!;
    expect(v1.ranks).toBe(1);
    expect(v1.ranksLabel).toBe(RANKS_LABEL[1]);
    const fPt = listBoardJoinedFormations(s)[0]!;
    const cPt = resolveBoardColumnMark(s)!;
    expect(v1.noteY).not.toBe(fPt.my);
    expect(v1.noteY).not.toBe(cPt.badgeY);

    const boardHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible />);
    expect(boardHtml).toContain("sc-joined-formation-layer");
    expect(boardHtml).toContain("sc-colmark-layer");
    expect(boardHtml).toContain("sc-colrank-layer");
    expect(boardHtml).toContain("sc-colrank-plate");
    expect(boardHtml).toContain("sc-colrank-mark is-strong");
    expect(boardHtml).toContain("sc-colrank-note");
    expect(boardHtml).toContain(`data-ranks-label="${RANKS_LABEL[1]}"`);
    expect(boardHtml).toContain(RANKS_LABEL[1]);

    // 2. skirmish-line -> two ranks
    s.meta.tick = 980 + WAR_PHASE_START.skirmish + 10;
    expect(resolveBoardColumnRanks(s)?.ranksLabel).toBe(RANKS_LABEL[2]);
    expect(renderToStaticMarkup(<svg><BoardColumnRanks state={s} /></svg>)).toContain(
      RANKS_LABEL[2],
    );

    // 3. clash-line -> three ranks
    s.meta.tick = 980 + WAR_PHASE_START.clash + 10;
    expect(resolveBoardColumnRanks(s)?.ranksLabel).toBe(RANKS_LABEL[3]);
    expect(renderToStaticMarkup(<svg><BoardColumnRanks state={s} /></svg>)).toContain(
      RANKS_LABEL[3],
    );

    // 4. falling-back -> one rank
    tryWhitePeace(s);
    expect(resolveBoardColumnRanks(s)?.ranksLabel).toBe(RANKS_LABEL[1]);
  });

  it("keeps voice-rank-accents.css isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    const css = readTextFile("./voice-rank-accents.css");
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
