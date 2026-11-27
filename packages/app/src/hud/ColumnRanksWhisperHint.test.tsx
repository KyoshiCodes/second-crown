import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  COLUMN_RANKS,
  WAR_AFTERMATH_TICKS,
  WAR_PHASE_START,
  columnRanks,
  createGameState,
  joinSide,
  nextWhisperHint,
  setLivingSwitch,
  tryWhitePeace,
  type GameState,
} from "@second-crown/sim";
import { BoardColumnRanks, resolveBoardColumnRanks } from "./BoardColumnRanks";
import { NextWhisperHintLine, resolveNextWhisperHint } from "./NextWhisperHintLine";
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

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe("BoardColumnRanks & NextWhisperHintLine", () => {
  it("guards partial mock GameState fixtures safely and stays quiet at baseline", () => {
    expect(resolveBoardColumnRanks(undefined)).toBeNull();
    expect(resolveBoardColumnRanks({} as GameState)).toBeNull();
    expect(resolveNextWhisperHint(undefined)).toBeNull();
    expect(resolveNextWhisperHint({} as GameState)).toBeNull();

    const s = createGameState({ seed: 1 });
    expect(resolveBoardColumnRanks(s)).toBeNull();
    expect(renderToStaticMarkup(<svg><BoardColumnRanks state={s} /></svg>)).not.toContain(
      "sc-colrank-layer",
    );
  });

  it("renders 1, 2, or 3 unit rank bars beside column standards across phases alongside formations and column marks", () => {
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

    const joined = joinSide(s, npcWar.id, "attacker")!;

    // 1. column -> 1 rank per side
    expect(resolveBoardColumnRanks(s)?.ranks).toBe(COLUMN_RANKS.column);
    const colHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible />);
    expect(colHtml).toContain("sc-joined-formation-layer");
    expect(colHtml).toContain("sc-colmark-layer");
    expect(colHtml).toContain("sc-colrank-layer");
    expect(colHtml).toContain(`data-column-ranks-war="${joined.id}"`);
    expect(colHtml).toContain('data-column-ranks="1"');
    expect(countOccurrences(colHtml, 'data-rank-side="ours"')).toBe(1);
    expect(countOccurrences(colHtml, 'data-rank-side="theirs"')).toBe(1);

    // 2. skirmish-line -> 2 ranks per side
    s.meta.tick = 980 + WAR_PHASE_START.skirmish + 10;
    expect(resolveBoardColumnRanks(s)?.ranks).toBe(COLUMN_RANKS["skirmish-line"]);
    expect(columnRanks("skirmish")).toBe(2);
    const skHtml = renderToStaticMarkup(<svg><BoardColumnRanks state={s} /></svg>);
    expect(skHtml).toContain('data-column-ranks="2"');
    expect(countOccurrences(skHtml, 'data-rank-side="ours"')).toBe(2);
    expect(countOccurrences(skHtml, 'data-rank-side="theirs"')).toBe(2);

    // 3. clash-line -> 3 ranks per side
    s.meta.tick = 980 + WAR_PHASE_START.clash + 10;
    expect(resolveBoardColumnRanks(s)?.ranks).toBe(COLUMN_RANKS["clash-line"]);
    expect(columnRanks("clash")).toBe(3);
    const clHtml = renderToStaticMarkup(<svg><BoardColumnRanks state={s} /></svg>);
    expect(clHtml).toContain('data-column-ranks="3"');
    expect(countOccurrences(clHtml, 'data-rank-side="ours"')).toBe(3);
    expect(countOccurrences(clHtml, 'data-rank-side="theirs"')).toBe(3);

    // 4. falling-back -> 1 rank per side
    tryWhitePeace(s);
    expect(resolveBoardColumnRanks(s)?.ranks).toBe(COLUMN_RANKS["falling-back"]);
    expect(columnRanks("aftermath")).toBe(1);
    const fbHtml = renderToStaticMarkup(<svg><BoardColumnRanks state={s} /></svg>);
    expect(fbHtml).toContain('data-column-ranks-phase="falling-back"');
    expect(fbHtml).toContain('data-column-ranks="1"');
    expect(countOccurrences(fbHtml, 'data-rank-side="ours"')).toBe(1);
    expect(countOccurrences(fbHtml, 'data-rank-side="theirs"')).toBe(1);

    // 5. Clears after aftermath expires
    s.meta.tick += WAR_AFTERMATH_TICKS + 1;
    expect(resolveBoardColumnRanks(s)).toBeNull();
  });

  it("renders 'Next whisper in ~Ns' near the culture card on WorldTab and hides when hint is null", () => {
    const s = createGameState({ seed: 1 });
    s.meta.tick = 150;
    const hint = nextWhisperHint(s)!;
    expect(hint.secondsApprox).toBe(15);

    const lineHtml = renderToStaticMarkup(<NextWhisperHintLine state={s} />);
    expect(lineHtml).toContain("sc-next-whisper-hint");
    expect(lineHtml).toContain('data-next-whisper-seconds="15"');
    expect(lineHtml).toContain("Next whisper in ~15s");

    const tabHtml = renderToStaticMarkup(<WorldTab state={s} act={() => {}} worldLog={[]} />);
    expect(tabHtml).toContain("Next whisper in ~15s");
    expect(tabHtml).toContain("sc-culture-whispers");

    // Disabled whispers -> hint is null -> hidden cleanly
    setLivingSwitch(s, "whispers", false);
    expect(nextWhisperHint(s)).toBeNull();
    expect(renderToStaticMarkup(<NextWhisperHintLine state={s} />)).toBe("");
    expect(
      renderToStaticMarkup(<WorldTab state={s} act={() => {}} worldLog={[]} />),
    ).not.toContain("sc-next-whisper-hint");
  });

  it("keeps column-ranks-whisper-hint.css isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    const css = readTextFile("./column-ranks-whisper-hint.css");
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
