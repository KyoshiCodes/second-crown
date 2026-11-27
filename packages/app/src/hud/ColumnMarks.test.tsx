import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  WAR_AFTERMATH_TICKS,
  WAR_PHASE_START,
  columnMarkSnapshot,
  createGameState,
  joinSide,
  tryWhitePeace,
  type GameState,
} from "@second-crown/sim";
import {
  BoardColumnMarks,
  COLUMN_MARK_LABEL,
  resolveBoardColumnMark,
} from "./BoardColumnMarks";
import { listBoardJoinedFormations } from "./BoardJoinedFormations";
import { BoardLiving } from "../BoardLiving";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("BoardColumnMarks & resolveBoardColumnMark", () => {
  it("guards partial mock GameState fixtures safely and stays quiet at baseline", () => {
    expect(resolveBoardColumnMark(undefined)).toBeNull();
    expect(resolveBoardColumnMark({} as GameState)).toBeNull();

    const s = createGameState({ seed: 1 });
    expect(resolveBoardColumnMark(s)).toBeNull();
    expect(renderToStaticMarkup(<svg><BoardColumnMarks state={s} /></svg>)).not.toContain(
      "sc-colmark-layer",
    );
  });

  it("renders opposing column standards and phase marks across column, skirmish-line, clash-line, falling-back alongside formations", () => {
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

    // 1. column phase
    expect(resolveBoardColumnMark(s)?.column).toBe(columnMarkSnapshot(s)?.column);
    expect(resolveBoardColumnMark(s)?.column).toBe("column");

    const boardHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible />);
    expect(boardHtml).toContain("sc-joined-formation-layer");
    expect(boardHtml).toContain("sc-colmark-layer");
    expect(boardHtml).toContain(`data-column-mark="${joined.id}"`);
    expect(boardHtml).toContain('data-column-phase="column"');
    expect(boardHtml).toContain("sc-colmark-column is-ours");
    expect(boardHtml).toContain("sc-colmark-column is-theirs");
    expect(boardHtml).toContain(COLUMN_MARK_LABEL.column);

    // Distinct non-colliding Y anchor from BoardJoinedFormations
    const fPt = listBoardJoinedFormations(s)[0]!;
    const cPt = resolveBoardColumnMark(s)!;
    expect(cPt.badgeY).not.toBe(fPt.my);

    // 2. skirmish-line
    s.meta.tick = 980 + WAR_PHASE_START.skirmish + 10;
    expect(resolveBoardColumnMark(s)?.column).toBe("skirmish-line");
    expect(renderToStaticMarkup(<svg><BoardColumnMarks state={s} /></svg>)).toContain(
      'data-column-phase="skirmish-line"',
    );

    // 3. clash-line
    s.meta.tick = 980 + WAR_PHASE_START.clash + 10;
    expect(resolveBoardColumnMark(s)?.column).toBe("clash-line");
    expect(renderToStaticMarkup(<svg><BoardColumnMarks state={s} /></svg>)).toContain(
      'data-column-phase="clash-line"',
    );

    // 4. falling-back
    tryWhitePeace(s);
    const fb = resolveBoardColumnMark(s);
    expect(fb?.column).toBe("falling-back");
    expect(fb?.active).toBe(false);
    expect(renderToStaticMarkup(<svg><BoardColumnMarks state={s} /></svg>)).toContain(
      'data-column-phase="falling-back"',
    );

    // 5. Clears cleanly after aftermath expires
    s.meta.tick += WAR_AFTERMATH_TICKS + 1;
    expect(resolveBoardColumnMark(s)).toBeNull();
  });

  it("keeps column-marks.css isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    const css = readTextFile("./column-marks.css");
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
