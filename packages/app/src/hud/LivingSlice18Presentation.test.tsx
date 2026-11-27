import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  createGameState,
  economyYieldBreakdownSnapshot,
  setLivingSwitch,
  storageCap,
  storagePressureDetailSnapshot,
  type GameState,
} from "@second-crown/sim";
import { KingdomTab } from "../tabs/KingdomTab";
import {
  EconomyYieldBreakdown,
  resolveEconomyYieldBreakdown,
} from "./EconomyYieldBreakdown";
import {
  StoragePressureDetailLine,
  resolveStoragePressureDetail,
} from "./StoragePressureDetailLine";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function steadyState(starter = true): GameState {
  const s = createGameState({ seed: 1, now: 1, withStarterBuildings: starter });
  for (const res of ["food", "wood", "stone", "gold"] as const) {
    s.resources[res] = String(Math.floor(storageCap(s, res) * 0.5));
  }
  return s;
}

describe("Living Realm Slice 18: yield breakdown and storage pressure detail", () => {
  it("hides EconomyYieldBreakdown when state is partial, all sources are empty, or living_yield_breakdown is off", () => {
    expect(resolveEconomyYieldBreakdown(undefined)).toBeNull();
    expect(resolveEconomyYieldBreakdown({} as GameState)).toBeNull();
    expect(renderToStaticMarkup(<EconomyYieldBreakdown state={{} as GameState} />)).toBe("");

    const bare = createGameState({ seed: 1 });
    bare.buildings = [];
    bare.citizens = [];
    bare.units = [];
    delete bare.flags.trade_routes;
    expect(economyYieldBreakdownSnapshot(bare)).toEqual({
      food: [],
      wood: [],
      stone: [],
      gold: [],
    });
    expect(renderToStaticMarkup(<EconomyYieldBreakdown state={bare} />)).toBe("");

    const starter = steadyState(true);
    setLivingSwitch(starter, "yieldBreakdown", false);
    expect(renderToStaticMarkup(<EconomyYieldBreakdown state={starter} />)).toBe("");
  });

  it("renders a collapsed-by-default Breakdown expander under EconomyYieldsLine when sources exist", () => {
    const s = steadyState(true);
    const snap = economyYieldBreakdownSnapshot(s);
    const nonEmptyCount = (["food", "wood", "stone", "gold"] as const).reduce(
      (sum, res) => sum + snap[res].length,
      0,
    );
    expect(nonEmptyCount).toBeGreaterThan(0);

    const html = renderToStaticMarkup(<EconomyYieldBreakdown state={s} />);
    expect(html).toContain('<details class="sc-yield-breakdown"');
    expect(html).not.toContain('open=""');
    expect(html).not.toContain(" open>");
    expect(html).toContain(`Breakdown (${nonEmptyCount})`);
    for (const res of ["food", "wood", "stone", "gold"] as const) {
      if (snap[res].length > 0) {
        expect(html).toContain(`data-breakdown-res="${res}"`);
        for (const src of snap[res]) {
          expect(html).toContain(src.name);
        }
      }
    }

    const tabHtml = renderToStaticMarkup(
      <KingdomTab state={s} act={() => ({ ok: true })} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const yieldsPos = tabHtml.indexOf("sc-yields-line");
    const breakdownPos = tabHtml.indexOf("sc-yield-breakdown");
    expect(yieldsPos).toBeGreaterThan(-1);
    expect(breakdownPos).toBeGreaterThan(yieldsPos);
  });

  it("hides StoragePressureDetailLine when state is partial, all stores are ok, or living_storage_detail is off", () => {
    expect(resolveStoragePressureDetail(undefined)).toEqual([]);
    expect(resolveStoragePressureDetail({} as GameState)).toEqual([]);
    expect(renderToStaticMarkup(<StoragePressureDetailLine state={{} as GameState} />)).toBe("");

    const okState = steadyState(true);
    const snap = storagePressureDetailSnapshot(okState);
    expect(snap.every((row) => row.status === "ok")).toBe(true);
    expect(renderToStaticMarkup(<StoragePressureDetailLine state={okState} />)).toBe("");

    const pressured = steadyState(false);
    pressured.resources.food = "0";
    setLivingSwitch(pressured, "storageDetail", false);
    expect(renderToStaticMarkup(<StoragePressureDetailLine state={pressured} />)).toBe("");

    const tabHtml = renderToStaticMarkup(
      <KingdomTab state={okState} act={() => ({ ok: true })} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(tabHtml).not.toContain("sc-econ-status-line");
    expect(tabHtml).not.toContain("sc-storage-detail-line");
  });

  it("renders StoragePressureDetailLine under EconomyPressureLine with percent-full and status for non-ok stores only", () => {
    const s = steadyState(true);
    s.resources.food = "0";
    s.resources.wood = String(storageCap(s, "wood"));

    const snap = storagePressureDetailSnapshot(s);
    expect(snap.find((r) => r.resource === "food")?.status).toBe("high");
    expect(snap.find((r) => r.resource === "wood")?.status).toBe("low");
    expect(snap.find((r) => r.resource === "stone")?.status).toBe("ok");
    expect(snap.find((r) => r.resource === "gold")?.status).toBe("ok");

    const html = renderToStaticMarkup(<StoragePressureDetailLine state={s} />);
    expect(html).toContain('class="sc-storage-detail-line"');
    expect(html).toContain('data-storage-res="food"');
    expect(html).toContain('data-storage-status="high"');
    expect(html).toContain("0%");
    expect(html).toContain("(low)");
    expect(html).toContain('data-storage-res="wood"');
    expect(html).toContain('data-storage-status="low"');
    expect(html).toContain("100%");
    expect(html).toContain("(full)");
    expect(html).not.toContain('data-storage-res="stone"');
    expect(html).not.toContain('data-storage-res="gold"');

    const tabHtml = renderToStaticMarkup(
      <KingdomTab state={s} act={() => ({ ok: true })} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const econPos = tabHtml.indexOf("sc-econ-status-line");
    const detailPos = tabHtml.indexOf("sc-storage-detail-line");
    expect(econPos).toBeGreaterThan(-1);
    expect(detailPos).toBeGreaterThan(econPos);
  });

  it("isolates Slice 18 styles with Dusk/Night/Parchment tokens, non-blocking pips, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./economy-yield-breakdown.css",
      "./storage-pressure-detail.css",
    ]) {
      const css = readTextFile(cssPath);
      expect(css).toContain(':root[data-chrome="dusk"]');
      expect(css).toContain(':root[data-chrome="night"]');
      expect(css).toContain(':root[data-chrome="parchment"]');
      expect(css).toContain("pointer-events: none !important;");
      expect(css).toContain("@media (prefers-reduced-motion: reduce)");
      for (const token of forbidden) {
        expect(css).not.toContain(token);
      }
    }
  });
});
