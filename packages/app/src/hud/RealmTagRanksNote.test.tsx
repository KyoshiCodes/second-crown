import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  RANKS_LABEL,
  RANKS_NOTE,
  WAR_PHASE_START,
  columnMarkSnapshot,
  createGameState,
  getCulture,
  joinSide,
  nextWhisperHint,
  setLivingSwitch,
  tryWhitePeace,
} from "@second-crown/sim";
import { BoardColumnRanks, resolveBoardColumnRanks } from "./BoardColumnRanks";
import { resolveBoardColumnMark } from "./BoardColumnMarks";
import { listBoardJoinedFormations } from "./BoardJoinedFormations";
import {
  NextWhisperHintLine,
  formatWhisperSenderTag,
} from "./NextWhisperHintLine";
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

describe("NextWhisperHintLine fromName+fromCulture tag & BoardColumnRanks ranksNote visuals", () => {
  it("formats sender tag with clean fallbacks when either or both fields are null", () => {
    const cultureName = getCulture("solari").name;
    expect(formatWhisperSenderTag("Valenhold", "solari")).toEqual({
      realmName: "Valenhold",
      cultureLabel: cultureName,
      text: `Valenhold (${cultureName})`,
    });
    expect(formatWhisperSenderTag("Valenhold", null)).toEqual({
      realmName: "Valenhold",
      cultureLabel: null,
      text: "Valenhold",
    });
    expect(formatWhisperSenderTag(null, "solari")).toEqual({
      realmName: null,
      cultureLabel: cultureName,
      text: cultureName,
    });
    expect(formatWhisperSenderTag("   ", undefined)).toEqual({
      realmName: null,
      cultureLabel: null,
      text: null,
    });
  });

  it("renders 'Next whisper in ~Ns · from <realm> (<culture>)' on WorldTab and hides tag when null", () => {
    const s = createGameState({ seed: 1 });
    s.meta.tick = 150;

    const hint = nextWhisperHint(s)!;
    expect(hint.fromName).not.toBeNull();
    expect(hint.fromCulture).not.toBeNull();
    const expectedCulture = getCulture(hint.fromCulture!).name;

    const html = renderToStaticMarkup(<WorldTab state={s} act={() => {}} worldLog={[]} />);
    expect(html).toContain("Next whisper in ~15s");
    expect(html).toContain('data-from-tag="true"');
    expect(html).toContain(`data-from-realm="${hint.fromName}"`);
    expect(html).toContain(`data-from-culture="${hint.fromCulture}"`);
    expect(html).toContain(`sc-next-whisper-realm">${hint.fromName}<`);
    expect(html).toContain(`(<span class="sc-next-whisper-culture">${expectedCulture}</span>)`);

    // Due sender has no listener -> both fromName & fromCulture null, hint keeps ~Ns, hides tag
    const soloFoe = s.realms.find((r) => r.id !== "player")!;
    s.realms = s.realms.filter((r) => r.id === "player" || r.id === soloFoe.id);
    s.wars.push({
      id: `war_${soloFoe.id}_100`,
      attackerRealmId: soloFoe.id,
      defenderRealmId: "player",
      startedTick: 100,
      status: "active",
    });
    const nullHint = nextWhisperHint(s)!;
    expect(nullHint.fromName).toBeNull();
    expect(nullHint.fromCulture).toBeNull();

    const noTagHtml = renderToStaticMarkup(<NextWhisperHintLine state={s} />);
    expect(noTagHtml).toContain("Next whisper in ~15s");
    expect(noTagHtml).not.toContain("sc-next-whisper-from");
    expect(noTagHtml).not.toContain("sc-next-whisper-realm");
    expect(noTagHtml).not.toContain('data-from-tag="true"');

    // Whispers off -> hint is null -> entire line stays hidden
    setLivingSwitch(s, "whispers", false);
    expect(renderToStaticMarkup(<NextWhisperHintLine state={s} />)).toBe("");
  });

  it("renders richer rank bevels and ranksNote across all four phases without overlapping formations or column marks", () => {
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

    // 1. column -> one rank · column
    const simSnap = columnMarkSnapshot(s)!;
    const v1 = resolveBoardColumnRanks(s)!;
    expect(v1.ranksNote).toBe(simSnap.ranksNote);
    expect(v1.ranksNote).toBe(RANKS_NOTE.columns);

    const fPt = listBoardJoinedFormations(s)[0]!;
    const cPt = resolveBoardColumnMark(s)!;
    expect(v1.noteY).not.toBe(fPt.my);
    expect(v1.noteY).not.toBe(cPt.badgeY);

    const boardHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible />);
    expect(boardHtml).toContain("sc-joined-formation-layer");
    expect(boardHtml).toContain("sc-colmark-layer");
    expect(boardHtml).toContain("sc-colrank-layer");
    expect(boardHtml).toContain('style="pointer-events:none"');
    expect(boardHtml).toContain("sc-colrank-bevel");
    expect(boardHtml).toContain("sc-colrank-pip");
    expect(boardHtml).toContain("sc-colrank-note-label");
    expect(boardHtml).toContain("sc-colrank-note-phase");
    expect(boardHtml).toContain(`data-ranks-label="${RANKS_LABEL[1]}"`);
    expect(boardHtml).toContain(`data-ranks-note="${RANKS_NOTE.columns}"`);
    expect(boardHtml).toContain(RANKS_NOTE.columns);

    // 2. skirmish -> two ranks · skirmish
    s.meta.tick = 980 + WAR_PHASE_START.skirmish + 10;
    expect(resolveBoardColumnRanks(s)?.ranksNote).toBe(RANKS_NOTE.skirmish);
    const skirmishHtml = renderToStaticMarkup(<svg><BoardColumnRanks state={s} /></svg>);
    expect(skirmishHtml).toContain(`data-ranks-note="${RANKS_NOTE.skirmish}"`);
    expect(skirmishHtml).toContain(`>${RANKS_NOTE.skirmish}<`);

    // 3. clash -> three ranks · clash
    s.meta.tick = 980 + WAR_PHASE_START.clash + 10;
    expect(resolveBoardColumnRanks(s)?.ranksNote).toBe(RANKS_NOTE.clash);
    const clashHtml = renderToStaticMarkup(<svg><BoardColumnRanks state={s} /></svg>);
    expect(clashHtml).toContain(`data-ranks-note="${RANKS_NOTE.clash}"`);
    expect(clashHtml).toContain(`>${RANKS_NOTE.clash}<`);

    // 4. aftermath -> one rank · falling-back
    tryWhitePeace(s);
    expect(resolveBoardColumnRanks(s)?.ranksNote).toBe(RANKS_NOTE.aftermath);
    const fallbackHtml = renderToStaticMarkup(<svg><BoardColumnRanks state={s} /></svg>);
    expect(fallbackHtml).toContain(`data-ranks-note="${RANKS_NOTE.aftermath}"`);
    expect(fallbackHtml).toContain(`>${RANKS_NOTE.aftermath}<`);

    // Non-joined / no active joined war -> hides cleanly
    s.wars = [];
    expect(resolveBoardColumnRanks(s)).toBeNull();
    expect(renderToStaticMarkup(<svg><BoardColumnRanks state={s} /></svg>)).toBe("<svg></svg>");
  });

  it("keeps realm-tag-ranks-note.css isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    const css = readTextFile("./realm-tag-ranks-note.css");
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
