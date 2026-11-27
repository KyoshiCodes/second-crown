import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BATTLE_NOTE_WON,
  BATTLE_SUGGEST_WON,
  COLUMN_NOTE_THREAT,
  battleOutcomeNoteSnapshot,
  columnStatusSnapshot,
  createGameState,
  isProvinceSeen,
  marchEtaSnapshot,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { ProvinceInspect } from "../ProvinceInspect";
import { WarRoom } from "../WarRoom";
import {
  BattleOutcomeNoteLine,
  resolveBattleOutcomeNote,
} from "./BattleOutcomeNoteLine";
import {
  ColumnStatusExpander,
  resolveColumnStatus,
} from "./ColumnStatusExpander";
import { MarchEtaNote, resolveMarchEta } from "./MarchEtaNote";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function emptyWarState(): GameState {
  const s = createGameState({ seed: 1, now: 1, withStarterBuildings: false });
  s.meta.tick = 500;
  s.wars = [];
  s.flags.marches_json = "[]";
  s.flags.gathers_json = "[]";
  delete s.flags.last_battle_json;
  s.flags.world_log = "[]";
  return s;
}

describe("Living Realm Slice 24: column status, march ETA, and battle outcome notes", () => {
  it("renders collapsed ColumnStatusExpander in WarRoom and hides when empty or off", () => {
    expect(resolveColumnStatus(undefined)).toBeNull();
    expect(renderToStaticMarkup(<ColumnStatusExpander state={{} as GameState} />)).toBe("");

    const s = emptyWarState();
    expect(columnStatusSnapshot(s)).toBeNull();
    expect(renderToStaticMarkup(<ColumnStatusExpander state={s} />)).toBe("");

    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    const other = s.board.provinces.find((p) => p.id !== home.id)!;
    const npc = s.realms.find((r) => r.id !== "player")!;
    s.flags.marches_json = JSON.stringify([
      {
        id: "m_p",
        realmId: "player",
        fromId: home.id,
        toId: other.id,
        arrivesTick: 540,
        kind: "node",
        levy: 5,
      },
      {
        id: "m_r",
        realmId: npc.id,
        fromId: other.id,
        toId: home.id,
        arrivesTick: 525,
        kind: "hold",
        levy: 4,
      },
    ]);

    const snap = columnStatusSnapshot(s)!;
    expect(snap.columns).toHaveLength(2);
    expect(snap.note).toBe(COLUMN_NOTE_THREAT);

    const html = renderToStaticMarkup(
      <WarRoom
        state={s}
        act={() => ({ ok: true })}
        rivalOp={0}
        playerOp={0}
        battleSnap={null}
        setBattleSnap={() => {}}
      />,
    );
    expect(html).toContain('<details class="sc-col-status"');
    expect(html).not.toContain('open=""');
    expect(html).not.toContain(" open>");
    expect(html).toContain("Columns on road (2)");
    expect(html).toContain(COLUMN_NOTE_THREAT);
    expect(html).toContain(`data-col-id="${snap.columns[0].id}"`);
    expect(html).toContain(`pwr ${snap.columns[0].strength}`);

    setLivingSwitch(s, "columnStatus", false);
    expect(renderToStaticMarkup(<ColumnStatusExpander state={s} />)).toBe("");
  });

  it("renders seen-only MarchEtaNote in ProvinceInspect for incoming & outgoing marches", () => {
    expect(resolveMarchEta(undefined, null)).toBeNull();

    const s = emptyWarState();
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    const target = s.board.provinces.find((p) => p.id !== home.id && isProvinceSeen(s, p.id))!;

    expect(marchEtaSnapshot(s, target.id)).toEqual({ incoming: [], outgoing: [] });
    expect(renderToStaticMarkup(<MarchEtaNote state={s} provinceId={target.id} />)).toBe("");

    s.flags.marches_json = JSON.stringify([
      {
        id: "m_in_24",
        realmId: "player",
        fromId: home.id,
        toId: target.id,
        arrivesTick: 530,
        kind: "node",
        levy: 3,
      },
      {
        id: "m_out_24",
        realmId: "player",
        fromId: target.id,
        toId: home.id,
        arrivesTick: 560,
        kind: "hold",
        levy: 4,
      },
    ]);

    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={target.id} onClear={() => {}} act={() => ({ ok: true })} />,
    );
    expect(html).toContain("sc-march-eta-note");
    expect(html).toContain('data-march-eta-in="1"');
    expect(html).toContain('data-march-eta-out="1"');
    expect(html).toContain(">In:<");
    expect(html).toContain(">Out:<");
    expect(html).toContain('data-march-eta-id="m_in_24"');
    expect(html).toContain('data-march-eta-id="m_out_24"');
    expect(html).toContain("(30t)");
    expect(html).toContain("(60t)");

    // Unseen (fogged) province hides MarchEtaNote inside ProvinceInspect
    const unseen = s.board.provinces.find((p) => p.id !== home.id && !isProvinceSeen(s, p.id));
    if (unseen) {
      const fogHtml = renderToStaticMarkup(
        <ProvinceInspect state={s} selectedId={unseen.id} onClear={() => {}} act={() => ({ ok: true })} />,
      );
      expect(fogHtml).not.toContain("sc-march-eta-note");
    }

    setLivingSwitch(s, "marchEta", false);
    expect(renderToStaticMarkup(<MarchEtaNote state={s} provinceId={target.id} />)).toBe("");
  });

  it("renders BattleOutcomeNoteLine in WarRoom for recent battles and hides when null or off", () => {
    expect(resolveBattleOutcomeNote(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BattleOutcomeNoteLine state={{} as GameState} />)).toBe("");

    const s = emptyWarState();
    expect(battleOutcomeNoteSnapshot(s)).toBeNull();
    expect(renderToStaticMarkup(<BattleOutcomeNoteLine state={s} />)).toBe("");

    const npc = s.realms.find((r) => r.id !== "player")!;
    s.flags.world_log = JSON.stringify([
      { tick: 480, id: "battle", text: "Clashed in test battle." },
    ]);
    s.flags.last_battle_json = JSON.stringify({
      winnerId: "player",
      loserId: npc.id,
      events: [],
      phases: [],
    });

    const snap = battleOutcomeNoteSnapshot(s)!;
    expect(snap).toMatchObject({
      last: { tick: 480, text: BATTLE_NOTE_WON },
      suggestion: BATTLE_SUGGEST_WON,
    });

    const html = renderToStaticMarkup(
      <WarRoom
        state={s}
        act={() => ({ ok: true })}
        rivalOp={0}
        playerOp={0}
        battleSnap={null}
        setBattleSnap={() => {}}
      />,
    );
    expect(html).toContain("sc-battle-note-line");
    expect(html).toContain('data-battle-note-tick="480"');
    expect(html).toContain(BATTLE_NOTE_WON);
    expect(html).toContain("T480");
    expect(html).toContain(BATTLE_SUGGEST_WON);

    setLivingSwitch(s, "battleNotes", false);
    expect(renderToStaticMarkup(<BattleOutcomeNoteLine state={s} />)).toBe("");
  });

  it("isolates Slice 24 styles with Dusk/Night/Parchment tokens, non-blocking pips, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./column-status.css",
      "./march-eta.css",
      "./battle-outcome-note.css",
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
