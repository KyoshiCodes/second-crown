import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { type RealmRates } from "../projection";
import { BlockedLine, StudyProjection } from "../CostProjection";
import {
  LIVING_BLOCKER_META,
  hasWarehouseBlocker,
  isFoodInDeficit,
  projectPartialCost,
  resolveLivingBlockers,
} from "./blockerAccents";
import { BlockerPip } from "./BlockerPip";
import { ResourceHud } from "./ResourceHud";
import { RaiseImproveFold } from "./RaiseImproveFold";
import { WorkCard } from "./WorkCard";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function makeRates(partial: Partial<RealmRates>): RealmRates {
  return { rate: {}, have: {}, cap: {}, ...partial };
}

const RESOURCES = { food: "120", wood: "80", stone: "40", gold: "15" };
const INCOME = { food: "2", wood: "1", stone: "0.5", gold: "0.5" };

describe("blocker and deficit accent helpers", () => {
  it("extracts living blocker kinds while keeping stores/saving separate", () => {
    expect(LIVING_BLOCKER_META.warehouse.shape).toBe("cap");
    expect(LIVING_BLOCKER_META.prereq.shape).toBe("link");
    expect(LIVING_BLOCKER_META.busy.shape).toBe("glass");

    expect(
      resolveLivingBlockers([
        { kind: "prereq", text: "missing prerequisite (Masonry)" },
        { kind: "keep", text: "needs Keep II" },
        { kind: "hall", text: "needs Academy" },
        { kind: "busy", text: "lectern busy (Forestry)" },
        { kind: "warehouse", text: "warehouse too small (stone 600 > 400)" },
        { kind: "warehouse", text: "warehouse too small (gold 300 > 200)" },
        { kind: "stores", text: "stores short (20 gold)" },
      ]),
    ).toEqual(["prereq", "busy", "warehouse"]);

    expect(resolveLivingBlockers([{ kind: "stores", text: "stores short (40 stone)" }])).toEqual([]);
  });

  it("detects warehouse overCap and partial cost projections", () => {
    const over = projectPartialCost(
      { stone: "500", wood: undefined },
      makeRates({ rate: { stone: 2 }, have: { stone: 10 }, cap: { stone: 200 } }),
    );
    expect(hasWarehouseBlocker(over)).toBe(true);

    const fine = projectPartialCost(
      { stone: "100", wood: "50" },
      makeRates({ rate: { stone: 2, wood: 2 }, have: { stone: 0, wood: 0 }, cap: { stone: 200, wood: 200 } }),
    );
    expect(hasWarehouseBlocker(fine)).toBe(false);
  });

  it("validates negative finite food rates as deficits", () => {
    expect(isFoodInDeficit(-1.5)).toBe(true);
    expect(isFoodInDeficit(0)).toBe(false);
    expect(isFoodInDeficit(2)).toBe(false);
    expect(isFoodInDeficit(null)).toBe(false);
    expect(isFoodInDeficit(undefined)).toBe(false);
    expect(isFoodInDeficit(Number.NaN)).toBe(false);
  });
});

describe("ResourceHud food deficit state", () => {
  it("renders soft deficit glow and pip on the food cell when foodDeficitOverride is negative", () => {
    const html = renderToStaticMarkup(
      <ResourceHud resources={RESOURCES} income={INCOME} foodDeficitOverride={-2.5} />,
    );
    expect(html).toContain("is-food-deficit");
    expect(html).toContain('data-food-deficit-cell="true"');
    expect(html).toContain("sc-food-deficit-glow");
    expect(html).toContain('data-deficit-pip="true"');
    expect(html).toContain("Food −2.5/s after upkeep");
  });

  it("activates on a real GameState whose army upkeep exceeds food income", () => {
    const s = createGameState({ seed: 1 });
    s.resources.food = "100";
    s.units.push({ id: "u_deficit_test", realmId: "player", typeId: "militia", count: "200", armyId: null });
    const html = renderToStaticMarkup(<ResourceHud resources={RESOURCES} income={INCOME} state={s} />);
    expect(html).toContain("is-food-deficit");
    expect(html).toContain("sc-food-deficit-glow");
    expect(html).toContain("sc-deficit-pip");
  });

  it("stays quiet when net food is positive and coexists cleanly with bottleneck + income accents", () => {
    const calmHtml = renderToStaticMarkup(
      <ResourceHud resources={RESOURCES} income={INCOME} foodDeficitOverride={1.2} />,
    );
    expect(calmHtml).not.toContain("is-food-deficit");
    expect(calmHtml).not.toContain("sc-food-deficit-glow");
    expect(calmHtml).not.toContain("sc-deficit-pip");

    const coexistHtml = renderToStaticMarkup(
      <ResourceHud
        resources={RESOURCES}
        income={{ food: "180", wood: "1", stone: "180", gold: "1" }}
        foodDeficitOverride={-1}
        bottleneckOverride={{ stone: "Keep IV" }}
      />,
    );
    expect(coexistHtml).toContain("is-food  is-income-late is-food-deficit");
    expect(coexistHtml).toContain("is-stone  is-bottleneck is-income-late");
  });
});

describe("living blocker indicators for studies and builds", () => {
  it("renders distinct blocker pips for warehouse, prereq, and busy", () => {
    for (const [kind, shape, label] of [
      ["warehouse", "cap", "Cap"],
      ["prereq", "link", "Prereq"],
      ["busy", "glass", "Busy"],
    ] as const) {
      const pipHtml = renderToStaticMarkup(<BlockerPip kind={kind} />);
      expect(pipHtml).toContain(`sc-blocker-pip is-${kind}`);
      expect(pipHtml).toContain(`data-blocker-pip="${kind}"`);
      expect(pipHtml).toContain(`data-blocker-shape="${shape}"`);
      expect(pipHtml).toContain(`>${label}</span>`);
      expect(pipHtml).toContain("<svg");
    }
  });

  it("renders BlockedLine accents on study rows for warehouse, prereq, and busy, leaving pure stores calm", () => {
    const html = renderToStaticMarkup(
      <BlockedLine
        reasons={[
          { kind: "prereq", text: "missing prerequisite (Masonry)" },
          { kind: "busy", text: "lectern busy (Forestry)" },
          { kind: "warehouse", text: "warehouse too small (stone 600 > 400)" },
        ]}
      />,
    );
    expect(html).toContain('class="sc-blocked-line is-blocker-prereq"');
    expect(html).toContain('data-blocker-accent="prereq,busy,warehouse"');
    expect(html).toContain('data-blocker-pip="prereq"');
    expect(html).toContain('data-blocker-pip="busy"');
    expect(html).toContain('data-blocker-pip="warehouse"');

    const storesOnlyHtml = renderToStaticMarkup(
      <BlockedLine reasons={[{ kind: "stores", text: "stores short (20 gold)" }]} />,
    );
    expect(storesOnlyHtml).not.toContain("sc-blocker-pip");
    expect(storesOnlyHtml).not.toContain("data-blocker-accent");
  });

  it("replaces SavingPip with Cap pip on warehouse-blocked studies while keeping stores-only studies on SavingPip", () => {
    const warehouseRates = makeRates({ rate: { stone: 1 }, have: { stone: 0 }, cap: { stone: 200 } });
    const overCapNoGates = renderToStaticMarkup(
      <StudyProjection cost={{ stone: "700" }} rates={warehouseRates} paid={false} />,
    );
    expect(overCapNoGates).toContain('data-blocker-accent="warehouse"');
    expect(overCapNoGates).toContain("sc-blocker-pip is-warehouse");
    expect(overCapNoGates).not.toContain("sc-saving-pip");

    const overCapWithGates = renderToStaticMarkup(
      <StudyProjection cost={{ stone: "700" }} rates={warehouseRates} paid={false} gates={{ busyWith: "Forestry" }} />,
    );
    expect(overCapWithGates).toContain('data-blocker-pip="busy"');
    expect(overCapWithGates).toContain('data-blocker-pip="warehouse"');
    expect(overCapWithGates).not.toContain("sc-saving-pip");

    const savingRates = makeRates({ rate: { gold: 0.5 }, have: { gold: 20 }, cap: { gold: 2000 } });
    const savingHtml = renderToStaticMarkup(
      <StudyProjection cost={{ gold: "400" }} rates={savingRates} paid={false} />,
    );
    expect(savingHtml).toContain("sc-saving-pip");
    expect(savingHtml).not.toContain("sc-blocker-pip");
  });

  it("shows warehouse blocker pip on WorkCard when next upgrade exceeds cap and keeps RaiseImproveFold valid", () => {
    const s = createGameState({ seed: 1 });
    for (const k of Object.keys(s.resources)) s.resources[k] = "0";
    const farm = s.buildings.find((b) => b.realmId === "player" && b.typeId === "farm") ?? s.buildings[0];
    if (farm) {
      const tinyCapRates = makeRates({
        rate: { wood: 1, stone: 1, food: 1 },
        have: { wood: 0, stone: 0, food: 0 },
        cap: { wood: 1, stone: 1, food: 1 },
      });
      const cardHtml = renderToStaticMarkup(
        <WorkCard state={s} b={farm} scarred={false} act={(() => {}) as never} rates={tinyCapRates} />,
      );
      expect(cardHtml).toContain("is-blocker-warehouse");
      expect(cardHtml).toContain('data-blocker-accent="warehouse"');
      expect(cardHtml).toContain('data-blocker-pip="warehouse"');
      expect(cardHtml).not.toContain("sc-saving-pip");
      expect(cardHtml).not.toContain("sc-work-level");
    }

    const compactPipHtml = renderToStaticMarkup(<BlockerPip kind="warehouse" compact />);
    expect(compactPipHtml).toContain("sc-blocker-pip is-warehouse is-compact");
    expect(compactPipHtml).not.toContain("sc-blocker-pip-label");
    expect(compactPipHtml).not.toMatch(/<(div|p|dl)\b/);

    const raiseHtml = renderToStaticMarkup(
      <RaiseImproveFold state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(raiseHtml).not.toMatch(/<button\b[^>]*>(?:(?!(<\/button>))[\s\S])*?<(div|p|dl)\b/);
  });
});

describe("blocker-deficit.css isolation and safety", () => {
  const css = readTextFile("./blocker-deficit.css");
  const hudSrc = readTextFile("./ResourceHud.tsx");
  const pipSrc = readTextFile("./BlockerPip.tsx");
  const themeCss = readTextFile("../theme.css");

  it("is imported from ResourceHud after income-bracket.css and from BlockerPip", () => {
    const incomeIdx = hudSrc.indexOf('import "./income-bracket.css";');
    const blockerIdx = hudSrc.indexOf('import "./blocker-deficit.css";');
    expect(incomeIdx).toBeGreaterThan(-1);
    expect(blockerIdx).toBeGreaterThan(incomeIdx);
    expect(pipSrc).toContain('import "./blocker-deficit.css";');
    expect(themeCss).not.toContain("sc-food-deficit-glow");
    expect(themeCss).not.toContain("sc-blocker-pip");
  });

  it("supports Dusk, Night, Parchment themes, click immunity, and reduced motion", () => {
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toMatch(/\.sc-food-deficit-glow\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-deficit-pip\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-blocker-pip\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-blocker-pip-icon\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toContain("@keyframes sc-deficit-cell-breathe");
    expect(css).toContain("@keyframes sc-deficit-pip-breathe");
    expect(css).toContain("@keyframes sc-blocker-warehouse-breathe");
    expect(css).toContain("@keyframes sc-blocker-prereq-breathe");
    expect(css).toContain("@keyframes sc-blocker-busy-breathe");
  });

  it("never uses store cell pseudo-elements or unrelated panel selectors", () => {
    expect(css).not.toContain(".sc-ledger-cell::before");
    expect(css).not.toContain(".sc-ledger-cell::after");
    expect(css).not.toContain(".sc-board");
    expect(css).not.toContain(".sc-chat-float");
    expect(css).not.toContain(".sc-admin-float");
    expect(css).not.toContain(".sc-theme-dock");
  });
});
