import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  WAR_AFTERMATH_TICKS,
  WAR_PHASE_START,
  WHISPER_REPLY_DELAY_TICKS,
  createGameState,
  joinSide,
  latestJoinedWarOutcome,
  maybeWhisper,
  settleNpcWars,
  tickCorrespondence,
  tryWhitePeace,
  type GameState,
} from "@second-crown/sim";
import { CultureWhispersCard, pairCultureCorrespondence } from "./CultureWhispersCard";
import {
  BoardJoinedOutcome,
  JoinedWarOutcomeLine,
  resolveBoardJoinedOutcome,
  resolveLatestJoinedOutcome,
} from "./JoinedWarOutcomeCue";
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

describe("Culture correspondence pairing & Joined-war outcomes UI", () => {
  it("guards partial mock GameState fixtures safely and stays quiet at baseline", () => {
    expect(pairCultureCorrespondence(undefined)).toEqual([]);
    expect(pairCultureCorrespondence({} as GameState)).toEqual([]);
    expect(resolveLatestJoinedOutcome(undefined)).toBeNull();
    expect(resolveLatestJoinedOutcome({} as GameState)).toBeNull();
    expect(resolveBoardJoinedOutcome(undefined)).toBeNull();
    expect(resolveBoardJoinedOutcome({} as GameState)).toBeNull();

    const s = createGameState({ seed: 1 });
    expect(renderWarRoom(s)).not.toContain("sc-joined-outcome");
    expect(renderToStaticMarkup(<svg><BoardJoinedOutcome state={s} /></svg>)).not.toContain(
      "sc-joined-outcome-board",
    );
  });

  it("pairs a whisper and its reply newest-first in CultureWhispersCard with seals and no chat input", () => {
    const s = createGameState({ seed: 1 });
    // Produce a real NPC-to-NPC whisper (whispers to player queue no reply) and its reply.
    let w = maybeWhisper(s, 600);
    for (let t = 600; t <= 3600 && (!w || w.toRealmId === "player"); t += 100) {
      w = maybeWhisper(s, t);
    }
    expect(w).not.toBeNull();
    expect(w!.toRealmId).not.toBe("player");
    expect(w!.id).toBeTruthy();

    // Insert an intermediate caravan between whisper and reply to verify newest-first pair sort.
    const current = JSON.parse(String(s.flags.culture_news));
    current.push({
      tick: w!.tick + 100,
      kind: "caravan",
      fromRealmId: w!.fromRealmId,
      toRealmId: w!.toRealmId,
      text: "Caravan arrives mid-week.",
    });
    s.flags.culture_news = JSON.stringify(current);

    tickCorrespondence(s, w!.tick + WHISPER_REPLY_DELAY_TICKS);

    const paired = pairCultureCorrespondence(s);
    expect(paired[0].kind).toBe("pair");
    if (paired[0].kind === "pair") {
      expect(paired[0].whisper.id).toBe(w!.id);
      expect(paired[0].reply.kind).toBe("reply");
      expect(paired[0].reply.replyTo).toBe(w!.id);
    }
    expect(paired[1].kind).toBe("single");

    const html = renderToStaticMarkup(<CultureWhispersCard state={s} />);
    expect(html).toContain("is-correspondence-pair");
    expect(html).toContain(`data-correspondence-pair="${w!.id}"`);
    expect(html).toContain(`data-reply-to="${w!.id}"`);
    expect(html).toContain("Whisper");
    expect(html).toContain("Reply");
    expect(html).toContain("sc-culture-crest");
    expect(html).toContain("sc-culture-whisper-crest");
    expect(html).not.toContain("<input");
    expect(html).not.toContain("<textarea");

    // Whisper precedes reply inside the paired item
    const whisperIdx = html.indexOf('data-culture-news-kind="whisper"');
    const replyIdx = html.indexOf('data-culture-news-kind="reply"');
    expect(whisperIdx).toBeGreaterThan(-1);
    expect(replyIdx).toBeGreaterThan(whisperIdx);
  });

  it("renders joined-war outcomes on WarRoom and short-lived BoardLiving ribbon across white peace, victory, and defeat", () => {
    const s = createGameState({ seed: 1 });
    s.wars = [];
    s.meta.tick = 1000;

    const npcs = s.realms.filter((r) => r.id !== "player");
    const npcA = npcs[0];
    const npcB = npcs[1];
    const npcWar = {
      id: `war_npc_${npcA.id}_${npcB.id}_900`,
      attackerRealmId: npcA.id,
      defenderRealmId: npcB.id,
      startedTick: 900,
      status: "active" as const,
    };
    s.wars.push(npcWar);

    const joined = joinSide(s, npcWar.id, "attacker")!;
    tryWhitePeace(s);

    const peaceOutcome = latestJoinedWarOutcome(s)!;
    expect(peaceOutcome.whitePeace).toBe(true);

    const warHtml = renderWarRoom(s);
    expect(warHtml).toContain(`data-joined-outcome="${joined.id}"`);
    expect(warHtml).toContain('data-white-peace="true"');
    expect(warHtml).toContain(peaceOutcome.line);

    const boardPeaceHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible />);
    expect(boardPeaceHtml).toContain(`data-board-joined-outcome="${joined.id}"`);
    expect(boardPeaceHtml).toContain('data-outcome-tone="peace"');

    // Player holds the field + settled NPC war summary
    joined.status = "attacker_won";
    joined.endedTick = 1250;
    s.meta.tick = 1260;
    settleNpcWars(s, 900 + WAR_PHASE_START.clash);
    const winHtml = renderToStaticMarkup(<JoinedWarOutcomeLine state={s} />);
    expect(winHtml).toContain("is-victory");
    expect(winHtml).toContain("Field held");
    expect(winHtml).toContain('data-held-field="player"');
    expect(winHtml).toContain("hold the field");

    // Foe holds the field
    joined.status = "defender_won";
    const loseHtml = renderToStaticMarkup(<JoinedWarOutcomeLine state={s} />);
    expect(loseHtml).toContain("is-defeat");
    expect(loseHtml).toContain("Foe held");
    expect(loseHtml).toContain('data-held-field="foe"');

    // Board ribbon clears after WAR_AFTERMATH_TICKS while War tab keeps calm summary
    s.meta.tick = 1250 + WAR_AFTERMATH_TICKS + 1;
    expect(resolveBoardJoinedOutcome(s)).toBeNull();
    expect(renderToStaticMarkup(<JoinedWarOutcomeLine state={s} />)).toContain(joined.id);
  });

  it("keeps correspondence-outcome.css isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    const css = readTextFile("./correspondence-outcome.css");
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
