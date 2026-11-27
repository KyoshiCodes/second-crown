import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  WAR_AFTERMATH_TICKS,
  WAR_PHASE_START,
  createGameState,
  joinSide,
  maybeWhisper,
  replyToWhisper,
  tryWhitePeace,
  type GameState,
} from "@second-crown/sim";
import { CultureWhispersCard, listReplyableWhispers } from "./CultureWhispersCard";
import {
  BoardJoinedFormations,
  FORMATION_LABEL,
  listBoardJoinedFormations,
} from "./BoardJoinedFormations";
import { BoardLiving } from "../BoardLiving";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("Player whisper reply buttons & Joined-war board formations", () => {
  it("guards partial mock GameState fixtures safely and stays quiet at baseline", () => {
    expect(listReplyableWhispers(undefined)).toEqual([]);
    expect(listReplyableWhispers({} as GameState)).toEqual([]);
    expect(listBoardJoinedFormations(undefined)).toEqual([]);
    expect(listBoardJoinedFormations({} as GameState)).toEqual([]);

    const s = createGameState({ seed: 1 });
    expect(renderToStaticMarkup(<CultureWhispersCard state={s} act={() => {}} />)).not.toContain(
      "sc-reply-picker",
    );
    expect(renderToStaticMarkup(<svg><BoardJoinedFormations state={s} /></svg>)).not.toContain(
      "sc-joined-formation-layer",
    );
  });

  it("shows fixed reply buttons on player-addressed whispers, pairs after replyToWhisper, and renders zero text input", () => {
    const s = createGameState({ seed: 1 });
    let w = maybeWhisper(s, 300);
    for (let t = 300; t <= 3600 && (!w || w.toRealmId !== "player"); t += 100) {
      w = maybeWhisper(s, t);
    }
    expect(w).not.toBeNull();
    expect(w!.toRealmId).toBe("player");
    expect(w!.id).toBeTruthy();

    const replyables = listReplyableWhispers(s);
    expect(replyables).toHaveLength(1);
    expect(replyables[0].lines).toHaveLength(4);

    const beforeHtml = renderToStaticMarkup(<CultureWhispersCard state={s} act={() => {}} />);
    expect(beforeHtml).toContain(`data-reply-picker="${w!.id}"`);
    expect(beforeHtml).toContain(`data-reply-whisper="${w!.id}"`);
    expect(beforeHtml).toContain('data-reply-index="0"');
    expect(beforeHtml).toContain('data-reply-index="3"');
    for (const line of replyables[0].lines) {
      expect(beforeHtml).toContain(line);
    }
    expect(beforeHtml).not.toContain("<input");
    expect(beforeHtml).not.toContain("<textarea");

    // Send fixed line 1 via replyToWhisper -> picker clears and whisper + reply render as a pair
    s.meta.tick = w!.tick + 20;
    const sent = replyToWhisper(s, w!.id!, 1);
    expect(sent).not.toBeNull();
    expect(listReplyableWhispers(s)).toEqual([]);

    const afterHtml = renderToStaticMarkup(<CultureWhispersCard state={s} act={() => {}} />);
    expect(afterHtml).not.toContain(`data-reply-picker="${w!.id}"`);
    expect(afterHtml).toContain("is-correspondence-pair");
    expect(afterHtml).toContain(`data-correspondence-pair="${w!.id}"`);
    expect(afterHtml).toContain(`data-reply-to="${w!.id}"`);
    expect(afterHtml).not.toContain("<input");
    expect(afterHtml).not.toContain("<textarea");
  });

  it("renders opposing standards and formation phase marks across muster, skirmish, clash, fall-back, then clears", () => {
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

    // 1. muster (columns phase)
    expect(listBoardJoinedFormations(s)[0]?.formation).toBe("muster");
    const musterHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible />);
    expect(musterHtml).toContain("sc-joined-formation-layer");
    expect(musterHtml).toContain(`data-joined-formation="${joined.id}"`);
    expect(musterHtml).toContain('data-formation="muster"');
    expect(musterHtml).toContain("sc-formation-standards is-ours");
    expect(musterHtml).toContain("sc-formation-standards is-theirs");
    expect(musterHtml).toContain(FORMATION_LABEL.muster);

    // 2. skirmish
    s.meta.tick = 980 + WAR_PHASE_START.skirmish + 10;
    expect(listBoardJoinedFormations(s)[0]?.formation).toBe("skirmish");
    expect(renderToStaticMarkup(<svg><BoardJoinedFormations state={s} /></svg>)).toContain(
      'data-formation="skirmish"',
    );

    // 3. clash
    s.meta.tick = 980 + WAR_PHASE_START.clash + 10;
    expect(listBoardJoinedFormations(s)[0]?.formation).toBe("clash");
    expect(renderToStaticMarkup(<svg><BoardJoinedFormations state={s} /></svg>)).toContain(
      'data-formation="clash"',
    );

    // 4. fall-back (aftermath)
    tryWhitePeace(s);
    const fb = listBoardJoinedFormations(s);
    expect(fb[0]?.formation).toBe("fall-back");
    expect(fb[0]?.active).toBe(false);
    expect(renderToStaticMarkup(<svg><BoardJoinedFormations state={s} /></svg>)).toContain(
      'data-formation="fall-back"',
    );

    // 5. Clears after WAR_AFTERMATH_TICKS
    s.meta.tick += WAR_AFTERMATH_TICKS + 1;
    expect(listBoardJoinedFormations(s)).toEqual([]);
  });

  it("keeps player-reply-formation.css isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    const css = readTextFile("./player-reply-formation.css");
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
