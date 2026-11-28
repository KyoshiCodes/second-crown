import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BATTLE_FEEDBACK_NOTE_LOST,
  BATTLE_FEEDBACK_NOTE_OTHERS,
  BATTLE_FEEDBACK_NOTE_WON,
  BATTLE_NOTE_RECENT_TICKS,
  POLISH_KEEP_EMPTY,
  POLISH_KEEP_HOME,
  POLISH_KEEP_RIVAL,
  POLISH_MARCH_ENEMY,
  POLISH_MARCH_LEAVING,
  POLISH_MARCH_OWN,
  createGameState,
  isProvinceSeen,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import {
  BoardBattleFeedbackMark,
  BoardBattleFeedbackNote,
  resolveBoardBattleFeedback,
} from "./BoardBattleFeedback";
import { BoardPolishLayer, resolveBoardPolish } from "./BoardPolishLayer";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function emptyBoardState(): GameState {
  const s = createGameState({ seed: 1, now: 1, withStarterBuildings: false });
  s.meta.tick = 2000;
  s.wars = [];
  s.flags.marches_json = "[]";
  s.flags.garrisons_json = "[]";
  delete s.flags.last_battle_json;
  s.flags.world_log = "[]";
  return s;
}

describe("Living Realm Slice 27: battle feedback & board polish detail", () => {
  it("renders BoardBattleFeedbackMark & BoardBattleFeedbackNote for seen battles, hides when null/stale/off, and never leaks veiled tiles", () => {
    expect(resolveBoardBattleFeedback(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardBattleFeedbackMark state={{} as GameState} />)).toBe("");
    expect(renderToStaticMarkup(<BoardBattleFeedbackNote state={{} as GameState} />)).toBe("");

    const s = emptyBoardState();
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    const seenProv = s.board.provinces.find((p) => p.id !== home.id && isProvinceSeen(s, p.id))!;
    const veiledProv = s.board.provinces.find((p) => p.id !== home.id && !isProvinceSeen(s, p.id))!;

    // No battle yet -> empty
    expect(renderToStaticMarkup(<BoardBattleFeedbackMark state={s} />)).toBe("");
    expect(renderToStaticMarkup(<BoardBattleFeedbackNote state={s} />)).toBe("");

    // Stale battle (> BATTLE_NOTE_RECENT_TICKS) -> empty
    s.flags.world_log = JSON.stringify([
      { tick: s.meta.tick - BATTLE_NOTE_RECENT_TICKS - 1, id: "battle", text: "Old fight." },
    ]);
    s.flags.last_battle_json = JSON.stringify({
      winnerId: "player",
      loserId: "rival",
      events: [],
      phases: [],
      provinceId: seenProv.id,
    });
    expect(renderToStaticMarkup(<BoardBattleFeedbackMark state={s} />)).toBe("");
    expect(renderToStaticMarkup(<BoardBattleFeedbackNote state={s} />)).toBe("");

    // Recent won battle on seen tile -> mark + note with coordinates inside BoardLiving
    s.flags.world_log = JSON.stringify([{ tick: 1995, id: "battle", text: "Clash resolved." }]);
    const wonHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(wonHtml).toContain(`data-bfb-mark="won" data-bfb-province="${seenProv.id}"`);
    expect(wonHtml).toContain(`data-bfb-note-mark="won" data-bfb-note-province="${seenProv.id}"`);
    expect(wonHtml).toContain(BATTLE_FEEDBACK_NOTE_WON);
    expect(wonHtml).toContain(`@ ${seenProv.x},${seenProv.y}`);

    // Recent lost battle on seen tile
    s.flags.last_battle_json = JSON.stringify({
      winnerId: "rival",
      loserId: "player",
      events: [],
      phases: [],
      provinceId: home.id,
    });
    const lostMark = renderToStaticMarkup(<BoardBattleFeedbackMark state={s} />);
    const lostNote = renderToStaticMarkup(<BoardBattleFeedbackNote state={s} />);
    expect(lostMark).toContain(`data-bfb-mark="lost" data-bfb-province="${home.id}"`);
    expect(lostNote).toContain(BATTLE_FEEDBACK_NOTE_LOST);

    // Others fought without a tile (realm-level Fight) -> note shown without mark
    s.flags.last_battle_json = JSON.stringify({
      winnerId: "a",
      loserId: "b",
      events: [],
      phases: [],
    });
    expect(renderToStaticMarkup(<BoardBattleFeedbackMark state={s} />)).toBe("");
    const othersNote = renderToStaticMarkup(<BoardBattleFeedbackNote state={s} />);
    expect(othersNote).toContain('data-bfb-note-mark="clash"');
    expect(othersNote).toContain(BATTLE_FEEDBACK_NOTE_OTHERS);

    // Veiled tile battle -> hides province mark so fog secrecy holds, while keeping note quiet
    s.flags.last_battle_json = JSON.stringify({
      winnerId: "player",
      loserId: "rival",
      events: [],
      phases: [],
      provinceId: veiledProv.id,
    });
    expect(renderToStaticMarkup(<BoardBattleFeedbackMark state={s} />)).toBe("");
    const veiledNote = renderToStaticMarkup(<BoardBattleFeedbackNote state={s} />);
    expect(veiledNote).toContain(BATTLE_FEEDBACK_NOTE_WON);
    expect(veiledNote).not.toContain(`@ ${veiledProv.x},${veiledProv.y}`);

    setLivingSwitch(s, "battleFeedback", false);
    expect(renderToStaticMarkup(<BoardBattleFeedbackMark state={s} />)).toBe("");
    expect(renderToStaticMarkup(<BoardBattleFeedbackNote state={s} />)).toBe("");
  });

  it("renders BoardPolishLayer for keep, march, and fog detail, strictly keeping veiled tiles fogged, and hides when off", () => {
    expect(resolveBoardPolish(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardPolishLayer state={{} as GameState} />)).toBe("");

    const s = emptyBoardState();
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    const seenClearProvs = s.board.provinces.filter((p) => p.id !== home.id && isProvinceSeen(s, p.id));
    const rivalHoldProv = seenClearProvs[0];
    const emptyHoldProv = seenClearProvs[1];
    const openProv = seenClearProvs[2] ?? seenClearProvs[0];
    const veiledProv = s.board.provinces.find((p) => p.id !== home.id && !isProvinceSeen(s, p.id))!;

    rivalHoldProv.node = "hold";
    rivalHoldProv.occupantRealmId = "rival";
    emptyHoldProv.node = "hold";
    emptyHoldProv.occupantRealmId = null;

    // Veiled tile has rival hold + inbound march in raw state, but overlay must NOT leak them under fog.
    veiledProv.node = "hold";
    veiledProv.occupantRealmId = "rival";

    s.flags.marches_json = JSON.stringify([
      {
        id: "m_enemy_27",
        realmId: "rival",
        fromId: veiledProv.id,
        toId: rivalHoldProv.id,
        arrivesTick: 2040,
        kind: "hold",
        levy: 3,
      },
      {
        id: "m_own_27",
        realmId: "player",
        fromId: openProv.id,
        toId: emptyHoldProv.id,
        arrivesTick: 2055,
        kind: "hold",
        levy: 2,
      },
      {
        id: "m_fog_27",
        realmId: "rival",
        fromId: home.id,
        toId: veiledProv.id,
        arrivesTick: 2070,
        kind: "hold",
        levy: 2,
      },
    ]);

    const html = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(html).toContain('class="sc-bpol-layer"');
    expect(html).toContain("pointer-events:none");
    expect(html).toContain(`data-bpol-tile="${home.id}" data-bpol-keep="home"`);
    expect(html).toContain(POLISH_KEEP_HOME);
    expect(html).toContain(`data-bpol-tile="${rivalHoldProv.id}" data-bpol-keep="rival"`);
    expect(html).toContain(POLISH_KEEP_RIVAL);
    expect(html).toContain(`data-bpol-tile="${emptyHoldProv.id}" data-bpol-keep="empty"`);
    expect(html).toContain(POLISH_KEEP_EMPTY);
    expect(html).toContain(`data-bpol-tile="${rivalHoldProv.id}" data-bpol-march="enemy"`);
    expect(html).toContain(POLISH_MARCH_ENEMY);
    expect(html).toContain(`data-bpol-tile="${emptyHoldProv.id}" data-bpol-march="own"`);
    expect(html).toContain(POLISH_MARCH_OWN);
    expect(html).toContain(`data-bpol-tile="${openProv.id}" data-bpol-march="leaving"`);
    expect(html).toContain(POLISH_MARCH_LEAVING);

    // Veiled tile emits ONLY fog veil and NEVER keep or march items
    expect(html).toContain(`data-bpol-tile="${veiledProv.id}" data-bpol-fog="veiled"`);
    expect(html).not.toContain(`data-bpol-tile="${veiledProv.id}" data-bpol-keep`);
    expect(html).not.toContain(`data-bpol-tile="${veiledProv.id}" data-bpol-march`);

    setLivingSwitch(s, "boardPolish", false);
    expect(renderToStaticMarkup(<BoardPolishLayer state={s} />)).toBe("");
  });

  it("reads battleFeedback and boardPolish without mutating GameState", () => {
    const s = emptyBoardState();
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    s.flags.world_log = JSON.stringify([{ tick: 1995, id: "battle", text: "Clash resolved." }]);
    s.flags.last_battle_json = JSON.stringify({
      winnerId: "player",
      loserId: "rival",
      events: [],
      phases: [],
      provinceId: home.id,
    });
    isProvinceSeen(s, home.id);
    const before = JSON.stringify(s);
    const html = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(html).toContain("sc-bpol-layer");
    expect(html).toContain("sc-bfb-note-bar");
    expect(JSON.stringify(s)).toBe(before);
  });

  it("isolates Slice 27 styles with Dusk/Night/Parchment tokens, non-blocking overlays, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./battle-feedback.css",
      "./board-polish.css",
    ]) {
      const css = readTextFile(cssPath);
      expect(css, cssPath).toContain(':root[data-chrome="dusk"]');
      expect(css, cssPath).toContain(':root[data-chrome="night"]');
      expect(css, cssPath).toContain(':root[data-chrome="parchment"]');
      expect(css, cssPath).toContain("pointer-events: none !important;");
      expect(css, cssPath).toContain("@media (prefers-reduced-motion: reduce)");
      for (const token of forbidden) {
        expect(css, `${cssPath} should not contain ${token}`).not.toContain(token);
      }
    }
  });
});
