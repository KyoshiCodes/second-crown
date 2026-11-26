import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { ForceCard } from "./ForceCard";
import { ForceMixChips, isMixedForce, summarizeForceMix } from "./ForceMixChips";
import { WarRoom } from "../WarRoom";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("summarizeForceMix & isMixedForce", () => {
  it("stays false for empty or single-type militia forces and summarizes mixed forces sorted by count", () => {
    expect(summarizeForceMix(undefined)).toEqual([]);
    expect(isMixedForce(undefined)).toBe(false);
    expect(isMixedForce({ militia: 5, spearman: 0 })).toBe(false);

    const mix = summarizeForceMix({ spearman: 3, militia: 4, siege: 1, archer: 0 });
    expect(isMixedForce({ spearman: 3, militia: 4, siege: 1 })).toBe(true);
    expect(mix).toEqual([
      { typeId: "militia", count: 4, shortName: "militia", role: "line" },
      { typeId: "spearman", count: 3, shortName: "spears", role: "line" },
      { typeId: "siege", count: 1, shortName: "siege", role: "siege" },
    ]);
  });
});

describe("ForceMixChips component", () => {
  it("renders nothing for single-type forces and shows role pips + returning cue for mixed forces", () => {
    expect(renderToStaticMarkup(<ForceMixChips force={{ militia: 5 }} />)).toBe("");

    const mixedHtml = renderToStaticMarkup(
      <ForceMixChips force={{ militia: 4, spearman: 3, siege: 1 }} returning />,
    );
    expect(mixedHtml).toContain("sc-force-mix is-returning");
    expect(mixedHtml).toContain('data-force-mix="militia,spearman,siege"');
    expect(mixedHtml).toContain('data-returning="true"');
    expect(mixedHtml).toContain("sc-force-mix-return-mark");
    expect(mixedHtml).toContain("role-line");
    expect(mixedHtml).toContain("role-siege");
    expect(mixedHtml).toContain("4 militia");
    expect(mixedHtml).toContain("3 spears");
    expect(mixedHtml).toContain("1 siege");

    const fourTypes = renderToStaticMarkup(
      <ForceMixChips force={{ militia: 5, spearman: 4, archer: 3, knight: 1 }} compact />,
    );
    expect(fourTypes).toContain("is-compact");
    expect(fourTypes).toContain("is-more");
    expect(fourTypes).toContain("+1");
  });
});

describe("ForceCard & WarRoom mixed force integration", () => {
  it("renders mixed unit chips on ForceCard only when multiple unit types exist", () => {
    const singleHtml = renderToStaticMarkup(
      <ForceCard tone="gather" name="Gather wood" dest="1,1" seconds={3} force={{ militia: 5 }} />,
    );
    expect(singleHtml).not.toContain("sc-force-mix");

    const mixedHtml = renderToStaticMarkup(
      <ForceCard
        tone="gather"
        name="Gather wood"
        dest="1,1"
        seconds={3}
        force={{ spearman: 4, archer: 2 }}
        returning
      />,
    );
    expect(mixedHtml).toContain("sc-force-mix is-returning");
    expect(mixedHtml).toContain("4 spears");
    expect(mixedHtml).toContain("2 archers");
  });

  it("shows mixed chips in WarRoom for returning columns, garrisons, and gathers while keeping single-type quiet", () => {
    const s = createGameState({ seed: 1 });
    const targetId = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId)!.id;

    s.flags["marches_json"] = JSON.stringify([
      {
        id: "m_mixed_return",
        realmId: "player",
        fromId: targetId,
        toId: s.board.homeProvinceId,
        arrivesTick: s.meta.tick + TICKS_PER_SECOND * 4,
        kind: "camp",
        levy: 5,
        force: { spearman: 3, militia: 2 },
        purpose: "garrison_home",
      },
      {
        id: "m_single",
        realmId: "player",
        fromId: s.board.homeProvinceId,
        toId: targetId,
        arrivesTick: s.meta.tick + TICKS_PER_SECOND * 5,
        kind: "camp",
        levy: 5,
        force: { militia: 5 },
      },
    ]);

    s.flags["gathers_json"] = JSON.stringify([
      {
        id: "g_return_mix",
        realmId: "player",
        node: "woodcut",
        fromId: s.board.homeProvinceId,
        toId: targetId,
        phase: "returning",
        load: "10",
        arrivesTick: s.meta.tick + TICKS_PER_SECOND * 3,
        travelTicks: TICKS_PER_SECOND * 6,
        force: { militia: 3, spearman: 2 },
      },
    ]);

    const html = renderToStaticMarkup(
      <WarRoom state={s} act={() => {}} rivalOp={0} playerOp={0} battleSnap={null} setBattleSnap={() => {}} />,
    );
    expect(html).toContain('data-force-mix="spearman,militia"');
    expect(html).toContain('data-force-mix="militia,spearman"');
    expect(html).toContain('data-returning="true"');
    expect(html).toContain("3 spears");
    expect(html).toContain("2 militia");
  });
});

describe("force-mix-chips.css isolation and safety", () => {
  const css = readTextFile("./force-mix-chips.css");
  const compSrc = readTextFile("./ForceMixChips.tsx");
  const themeCss = readTextFile("../theme.css");

  it("is imported from ForceMixChips.tsx and leaves theme.css untouched", () => {
    expect(compSrc).toContain('import "./force-mix-chips.css";');
    expect(themeCss).not.toContain("sc-force-mix");
  });

  it("supports Dusk, Night, Parchment themes, click immunity, and reduced motion", () => {
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important;");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-force-mix-breathe");
    expect(css).toContain("@keyframes sc-force-mix-return-pulse");
  });

  it("never touches board, chat, admin, theme dock, or ledger cell selectors", () => {
    expect(css).not.toContain(".sc-board");
    expect(css).not.toContain(".sc-chat-float");
    expect(css).not.toContain(".sc-admin-float");
    expect(css).not.toContain(".sc-theme-dock");
    expect(css).not.toContain(".sc-ledger-cell");
  });
});
