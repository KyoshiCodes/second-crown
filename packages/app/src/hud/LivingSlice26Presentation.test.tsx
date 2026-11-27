import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  SELECTION_NOTE_HOME,
  SELECTION_NOTE_OPEN,
  SELECTION_NOTE_OWN,
  SELECTION_NOTE_RIVAL,
  SELECTION_NOTE_VEILED,
  SURFACE_ELEVATION,
  SURFACE_KEEP_HOME,
  SURFACE_MARCH_ENEMY,
  SURFACE_MARCH_OWN,
  createGameState,
  isProvinceSeen,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import {
  BoardSelectionFeedbackMark,
  BoardSelectionFeedbackNote,
  resolveSelectionFeedback,
} from "./BoardSelectionFeedback";
import { BoardSurfaceLayer, resolveBoardSurface } from "./BoardSurfaceLayer";

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
  return s;
}

describe("Living Realm Slice 26: board surface detail & selection feedback", () => {
  it("renders BoardSurfaceLayer for clear terrain/elevation/keep/march cues, keeps veiled tiles strictly fogged, and hides when off", () => {
    expect(resolveBoardSurface(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardSurfaceLayer state={{} as GameState} />)).toBe("");

    const s = emptyBoardState();
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    const seenProv = s.board.provinces.find((p) => p.id !== home.id && isProvinceSeen(s, p.id))!;
    const veiledProv = s.board.provinces.find((p) => p.id !== home.id && !isProvinceSeen(s, p.id))!;

    seenProv.terrain = "peak";
    seenProv.node = "hold";
    seenProv.occupantRealmId = "rival";

    // Veiled tile has a rival hold & inbound march in raw data, but surface overlay must hide it under fog.
    veiledProv.node = "hold";
    veiledProv.occupantRealmId = "rival";

    s.flags.marches_json = JSON.stringify([
      {
        id: "m_enemy",
        realmId: "rival",
        fromId: veiledProv.id,
        toId: seenProv.id,
        arrivesTick: 2040,
        kind: "hold",
        levy: 3,
      },
      {
        id: "m_own",
        realmId: "player",
        fromId: seenProv.id,
        toId: home.id,
        arrivesTick: 2060,
        kind: "hold",
        levy: 2,
      },
      {
        id: "m_fog",
        realmId: "rival",
        fromId: home.id,
        toId: veiledProv.id,
        arrivesTick: 2070,
        kind: "hold",
        levy: 2,
      },
    ]);

    const html = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(html).toContain('class="sc-bsurf-layer"');
    expect(html).toContain("pointer-events:none");
    expect(html).toContain(`data-bsurf-tile="${home.id}"`);
    expect(html).toContain('data-bsurf-keep="home"');
    expect(html).toContain(`data-bsurf-tile="${seenProv.id}" data-bsurf-terrain="peak" data-bsurf-elev="peak"`);
    expect(html).toContain('data-bsurf-keep="rival"');
    expect(html).toContain('data-bsurf-march="enemy"');
    expect(html).toContain('data-bsurf-march="own"');

    // Veiled tile appears ONLY as a veiled fog polygon, with zero keep/march leak
    expect(html).toContain(`data-bsurf-tile="${veiledProv.id}" data-bsurf-fog="veiled"`);
    expect(html).not.toContain(`data-bsurf-tile="${veiledProv.id}" data-bsurf-terrain`);

    setLivingSwitch(s, "boardSurface", false);
    expect(renderToStaticMarkup(<BoardSurfaceLayer state={s} />)).toBe("");
  });

  it("renders BoardSelectionFeedbackMark & BoardSelectionFeedbackNote across tones, hides on null/unknown/off, and gates surface detail behind fog & boardSurface", () => {
    expect(resolveSelectionFeedback(undefined, {})).toBeNull();
    expect(renderToStaticMarkup(<BoardSelectionFeedbackMark state={{} as GameState} selectedId="p1" />)).toBe("");
    expect(renderToStaticMarkup(<BoardSelectionFeedbackNote state={{} as GameState} selectedId="p1" />)).toBe("");

    const s = emptyBoardState();
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    const seenProv = s.board.provinces.find((p) => p.id !== home.id && isProvinceSeen(s, p.id))!;
    const veiledProv = s.board.provinces.find((p) => p.id !== home.id && !isProvinceSeen(s, p.id))!;

    expect(renderToStaticMarkup(<BoardSelectionFeedbackMark state={s} selectedId={null} />)).toBe("");
    expect(renderToStaticMarkup(<BoardSelectionFeedbackNote state={s} selectedId="missing" />)).toBe("");

    // Home tile shows home tone, note, and elevation/keep detail
    home.terrain = "hill";
    s.flags.marches_json = JSON.stringify([
      {
        id: "m_in_home",
        realmId: "player",
        fromId: seenProv.id,
        toId: home.id,
        arrivesTick: 2050,
        kind: "hold",
        levy: 2,
      },
    ]);
    const homeHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={home.id} />);
    expect(homeHtml).toContain(`data-sel-fb-id="${home.id}" data-sel-fb-tone="home"`);
    expect(homeHtml).toContain(`data-sel-fb-note-id="${home.id}" data-sel-fb-tone="home"`);
    expect(homeHtml).toContain(SELECTION_NOTE_HOME);
    expect(homeHtml).toContain(SURFACE_ELEVATION.hill);
    expect(homeHtml).toContain(SURFACE_KEEP_HOME);
    expect(homeHtml).toContain(SURFACE_MARCH_OWN);

    // Veiled tile hides keep/march/elevation detail even if occupied/targeted
    veiledProv.node = "hold";
    veiledProv.occupantRealmId = "rival";
    const veiledHtml = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={veiledProv.id} />);
    expect(veiledHtml).toContain(`data-sel-fb-note-id="${veiledProv.id}" data-sel-fb-tone="veiled"`);
    expect(veiledHtml).toContain(SELECTION_NOTE_VEILED);
    expect(veiledHtml).not.toContain("sc-sel-fb-surface-detail");

    // Open -> Rival -> Own seen tile transitions
    seenProv.node = "none";
    seenProv.occupantRealmId = null;
    expect(renderToStaticMarkup(<BoardSelectionFeedbackNote state={s} selectedId={seenProv.id} />)).toContain(SELECTION_NOTE_OPEN);

    seenProv.occupantRealmId = "rival";
    const rivalHtml = renderToStaticMarkup(<BoardSelectionFeedbackNote state={s} selectedId={seenProv.id} />);
    expect(rivalHtml).toContain('data-sel-fb-tone="rival"');
    expect(rivalHtml).toContain(SELECTION_NOTE_RIVAL);

    seenProv.occupantRealmId = "player";
    const ownHtml = renderToStaticMarkup(<BoardSelectionFeedbackNote state={s} selectedId={seenProv.id} />);
    expect(ownHtml).toContain('data-sel-fb-tone="own"');
    expect(ownHtml).toContain(SELECTION_NOTE_OWN);

    // boardSurface off keeps selection note visible without surface detail
    s.flags.marches_json = JSON.stringify([
      {
        id: "m_threat",
        realmId: "rival",
        fromId: veiledProv.id,
        toId: home.id,
        arrivesTick: 2040,
        kind: "hold",
        levy: 2,
      },
    ]);
    expect(renderToStaticMarkup(<BoardSelectionFeedbackNote state={s} selectedId={home.id} />)).toContain(SURFACE_MARCH_ENEMY);
    setLivingSwitch(s, "boardSurface", false);
    const noSurfNoteHtml = renderToStaticMarkup(<BoardSelectionFeedbackNote state={s} selectedId={home.id} />);
    expect(noSurfNoteHtml).toContain(SELECTION_NOTE_HOME);
    expect(noSurfNoteHtml).not.toContain("sc-sel-fb-surface-detail");

    // selectionFeedback off hides selection mark and note completely
    setLivingSwitch(s, "selectionFeedback", false);
    expect(renderToStaticMarkup(<BoardSelectionFeedbackMark state={s} selectedId={home.id} />)).toBe("");
    expect(renderToStaticMarkup(<BoardSelectionFeedbackNote state={s} selectedId={home.id} />)).toBe("");
  });

  it("reads boardSurface and selectionFeedback without mutating GameState", () => {
    const s = emptyBoardState();
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    // Trigger initial fog_seen once, then snapshot state strictly
    isProvinceSeen(s, home.id);
    const before = JSON.stringify(s);
    const html = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={home.id} />);
    expect(html).toContain("sc-bsurf-layer");
    expect(html).toContain("sc-sel-fb-note-bar");
    expect(JSON.stringify(s)).toBe(before);
  });

  it("isolates Slice 26 styles with Dusk/Night/Parchment tokens, non-blocking overlays, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./board-surface.css",
      "./selection-feedback.css",
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
