import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { campTierId, createGameState, revealProvince, type GameState } from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import { ProvinceInspect } from "../ProvinceInspect";
import { AtlasProvinceCard } from "./AtlasProvinceCard";
import { BoardCampTierAccents, listBoardCampTierAccents } from "./BoardCampTierAccents";
import { CAMP_TIER_VISUAL, CampTierPip } from "./CampTierPip";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function revealCamp(s: GameState, tier: string) {
  const p = s.board.provinces.find((q) => campTierId(s, q) === tier)!;
  revealProvince(s, p.id);
  return p;
}

describe("listBoardCampTierAccents", () => {
  it("respects fog-of-war and assigns distinct colors/tones to lean_to, camp, and stockade", () => {
    const s = createGameState({ seed: 1 });
    expect(listBoardCampTierAccents(undefined)).toEqual([]);

    const beforeReveal = JSON.stringify(s);
    const hiddenCount = listBoardCampTierAccents(s).length;
    expect(JSON.stringify(s)).toBe(beforeReveal);

    const lean = revealCamp(s, "lean_to");
    const fair = revealCamp(s, "camp");
    const stock = revealCamp(s, "stockade");

    const points = listBoardCampTierAccents(s);
    expect(points.length).toBeGreaterThanOrEqual(hiddenCount);

    const pLean = points.find((pt) => pt.id === lean.id)!;
    const pFair = points.find((pt) => pt.id === fair.id)!;
    const pStock = points.find((pt) => pt.id === stock.id)!;

    expect(pLean).toMatchObject({ tierId: "lean_to", tone: "safe", shape: "leaf" });
    expect(pFair).toMatchObject({ tierId: "camp", tone: "fair", shape: "tent" });
    expect(pStock).toMatchObject({ tierId: "stockade", tone: "hard", shape: "palisade" });
    expect(pLean.crestColor).not.toBe(pStock.crestColor);
  });
});

describe("BoardCampTierAccents & BoardLiving integration", () => {
  it("renders non-blocking board overlays for revealed starter vs stockade camps", () => {
    const s = createGameState({ seed: 1 });
    revealCamp(s, "lean_to");
    revealCamp(s, "stockade");

    const svgHtml = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <BoardCampTierAccents state={s} />
      </svg>,
    );
    expect(svgHtml).toContain("sc-board-camp-accents");
    expect(svgHtml).toContain("sc-board-camp-tier is-lean_to tone-safe");
    expect(svgHtml).toContain("sc-board-camp-tier is-stockade tone-hard");
    expect(svgHtml).toContain("sc-board-camp-aura");
    expect(svgHtml).toContain("sc-board-camp-ring");
    expect(svgHtml).toContain("sc-board-camp-spark");
    expect(svgHtml).toContain('aria-hidden="true"');
    expect(svgHtml).toContain("pointer-events:none");

    const boardHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible={true} />);
    expect(boardHtml).toContain("sc-board-camp-accents");
    expect(boardHtml).toContain("is-lean_to");
    expect(boardHtml).toContain("is-stockade");
  });
});

describe("CampTierPip, ProvinceInspect, and AtlasProvinceCard distinctions", () => {
  it("renders distinct pips for Safe, Fair, and Hard camp tiers", () => {
    expect(CAMP_TIER_VISUAL.lean_to.shape).toBe("leaf");
    expect(CAMP_TIER_VISUAL.camp.shape).toBe("tent");
    expect(CAMP_TIER_VISUAL.stockade.shape).toBe("palisade");

    for (const [id, label, shape] of [
      ["lean_to", "Safe", "leaf"],
      ["camp", "Fair", "tent"],
      ["stockade", "Hard", "palisade"],
    ] as const) {
      const html = renderToStaticMarkup(<CampTierPip tierId={id} />);
      expect(html).toContain(`sc-camp-tier-pip is-${id}`);
      expect(html).toContain(`data-camp-pip="${id}"`);
      expect(html).toContain(`data-camp-shape="${shape}"`);
      expect(html).toContain(`>${label}</span>`);
      expect(html).toContain("<svg");
    }
  });

  it("distinguishes safe starter camps from hard stockades in ProvinceInspect and AtlasProvinceCard", () => {
    const s = createGameState({ seed: 1 });
    const lean = revealCamp(s, "lean_to");
    const stock = revealCamp(s, "stockade");

    const leanInspect = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={lean.id} onClear={() => {}} act={() => {}} />,
    );
    expect(leanInspect).toContain("is-camp-tier-lean_to");
    expect(leanInspect).toContain('data-camp-tier="lean_to"');
    expect(leanInspect).toContain('data-camp-tier-line="lean_to"');
    expect(leanInspect).toContain('data-camp-pip="lean_to"');
    expect(leanInspect).toContain("Bandit lean-to · Safe · +6 wood +3 food");

    const stockInspect = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={stock.id} onClear={() => {}} act={() => {}} />,
    );
    expect(stockInspect).toContain("is-camp-tier-stockade");
    expect(stockInspect).toContain('data-camp-tier="stockade"');
    expect(stockInspect).toContain('data-camp-tier-line="stockade"');
    expect(stockInspect).toContain('data-camp-pip="stockade"');
    expect(stockInspect).toContain("Bandit stockade · Hard · +10 gold +8 stone +6 wood (siege +6 gold)");

    const leanAtlas = renderToStaticMarkup(<AtlasProvinceCard state={s} provinceId={lean.id} role="selected" />);
    expect(leanAtlas).toContain("is-camp-tier-lean_to");
    expect(leanAtlas).toContain('data-camp-pip="lean_to"');

    const stockAtlas = renderToStaticMarkup(<AtlasProvinceCard state={s} provinceId={stock.id} role="selected" />);
    expect(stockAtlas).toContain("is-camp-tier-stockade");
    expect(stockAtlas).toContain('data-camp-pip="stockade"');
  });
});

describe("camp-tier-accents.css isolation and safety", () => {
  const css = readTextFile("./camp-tier-accents.css");
  const pipSrc = readTextFile("./CampTierPip.tsx");
  const boardSrc = readTextFile("./BoardCampTierAccents.tsx");
  const themeCss = readTextFile("../theme.css");

  it("is imported from CampTierPip and BoardCampTierAccents and leaves theme.css untouched", () => {
    expect(pipSrc).toContain('import "./camp-tier-accents.css";');
    expect(boardSrc).toContain('import "./camp-tier-accents.css";');
    expect(themeCss).not.toContain("sc-board-camp-");
    expect(themeCss).not.toContain("sc-camp-tier-pip");
  });

  it("supports Dusk, Night, Parchment themes, click immunity, and reduced motion", () => {
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important;");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-camp-safe-breathe");
    expect(css).toContain("@keyframes sc-camp-hard-breathe");
    expect(css).toContain("@keyframes sc-camp-hard-ring");
    expect(css).toContain("@keyframes sc-camp-hard-spark");
  });

  it("never touches chat, admin, theme dock, or ledger cell selectors", () => {
    expect(css).not.toContain(".sc-chat-float");
    expect(css).not.toContain(".sc-admin-float");
    expect(css).not.toContain(".sc-theme-dock");
    expect(css).not.toContain(".sc-ledger-cell");
  });
});
