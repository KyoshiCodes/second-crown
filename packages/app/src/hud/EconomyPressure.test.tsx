import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { projectCost, type RealmRates } from "../projection";
import { StudyProjection } from "../CostProjection";
import { SAVING_MIN_SECONDS, bottleneckResourceMap, isSavingCost } from "./economyPressure";
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

describe("economy pressure helpers", () => {
  it("flags unpaid costs requiring >= 10 minutes (600s) of income", () => {
    expect(SAVING_MIN_SECONDS).toBe(600);

    const cheap = projectCost(
      { food: "50" },
      makeRates({ rate: { food: 1 }, have: { food: 0 }, cap: { food: 500 } }),
    );
    expect(isSavingCost(cheap)).toBe(false);

    const covered = projectCost(
      { stone: "800" },
      makeRates({ rate: { stone: 1 }, have: { stone: 800 }, cap: { stone: 2000 } }),
    );
    expect(isSavingCost(covered)).toBe(false);

    const slow = projectCost(
      { stone: "700" },
      makeRates({ rate: { stone: 1 }, have: { stone: 100 }, cap: { stone: 2000 } }),
    );
    expect(isSavingCost(slow)).toBe(true);

    const noIncomeShort = projectCost(
      { gold: "50" },
      makeRates({ rate: { gold: 0 }, have: { gold: 10 }, cap: { gold: 200 } }),
    );
    expect(isSavingCost(noIncomeShort)).toBe(true);
  });

  it("maps bottlenecks by resource for empty stores and stays empty when covered", () => {
    const emptyState = createGameState({ seed: 1 });
    for (const k of Object.keys(emptyState.resources)) emptyState.resources[k] = "0";
    const map = bottleneckResourceMap(emptyState);
    expect(Object.keys(map).length).toBeGreaterThan(0);

    const richState = createGameState({ seed: 1 });
    for (const k of ["food", "wood", "stone", "gold"]) richState.resources[k] = "100000";
    expect(bottleneckResourceMap(richState)).toEqual({});
    expect(bottleneckResourceMap(undefined)).toEqual({});
  });
});

describe("ResourceHud bottleneck accents", () => {
  it("adds soft amber bottleneck pulse on limiting store cells", () => {
    const emptyState = createGameState({ seed: 1 });
    for (const k of Object.keys(emptyState.resources)) emptyState.resources[k] = "0";
    emptyState.resources.food = "100"; // keep food non-empty so focus is bottleneck
    const html = renderToStaticMarkup(
      <ResourceHud resources={RESOURCES} income={INCOME} state={emptyState} />,
    );
    expect(html).toContain("is-bottleneck");
    expect(html).toContain('data-economy-bottleneck="true"');
    expect(html).toContain("sc-econ-bottleneck-glow");
    expect(html).toContain("sc-econ-bottleneck-pip");
    expect(html).toContain("limiter for");
    expect(html).toContain('class="sc-ledger-tag is-limiter"');

    const richState = createGameState({ seed: 1 });
    for (const k of ["food", "wood", "stone", "gold"]) richState.resources[k] = "100000";
    const calmHtml = renderToStaticMarkup(
      <ResourceHud resources={RESOURCES} income={INCOME} state={richState} />,
    );
    expect(calmHtml).not.toContain("is-bottleneck");
  });

  it("supports bottleneckOverride for targeted stone/gold testing", () => {
    const html = renderToStaticMarkup(
      <ResourceHud resources={RESOURCES} income={INCOME} bottleneckOverride={{ stone: "Keep II" }} />,
    );
    expect(html).toContain("is-stone  is-bottleneck");
    expect(html).toContain('data-bottleneck-targets="Keep II"');
    expect(html).toContain("limiter for Keep II");
  });
});

describe("Saving pip on studies, build picker, and standing buildings", () => {
  it("shows Saving pip on StudyProjection only when >= 10m of income and unpaid", () => {
    const savingRates = makeRates({ rate: { gold: 0.5 }, have: { gold: 20 }, cap: { gold: 2000 } });
    const savingHtml = renderToStaticMarkup(
      <StudyProjection cost={{ gold: "400" }} rates={savingRates} paid={false} />,
    );
    expect(savingHtml).toContain("is-saving-cost");
    expect(savingHtml).toContain('data-saving="true"');
    expect(savingHtml).toContain("sc-saving-pip");
    expect(savingHtml).toContain("Saving</span>");

    const coveredRates = makeRates({ rate: { gold: 0.5 }, have: { gold: 400 }, cap: { gold: 2000 } });
    const coveredHtml = renderToStaticMarkup(
      <StudyProjection cost={{ gold: "400" }} rates={coveredRates} paid={false} />,
    );
    expect(coveredHtml).not.toContain("sc-saving-pip");
  });

  it("shows compact Saving pip on expensive picker chips and full pip on WorkCard upgrades", () => {
    const s = createGameState({ seed: 1 });
    for (const k of Object.keys(s.resources)) s.resources[k] = "0";
    const raiseHtml = renderToStaticMarkup(
      <RaiseImproveFold state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(raiseHtml).toContain("is-saving-cost");
    expect(raiseHtml).toContain('data-saving="true"');
    expect(raiseHtml).toContain("sc-saving-pip is-compact");
    expect(raiseHtml).not.toMatch(/<(div|p|dl)\b[^>]*data-saving-pip/);

    const farm = s.buildings.find((b) => b.realmId === "player" && b.typeId === "farm") ?? s.buildings[0];
    if (farm) {
      const cardHtml = renderToStaticMarkup(
        <WorkCard state={s} b={farm} scarred={false} act={(() => {}) as never} />,
      );
      expect(cardHtml).toContain("is-saving-cost");
      expect(cardHtml).toContain("sc-saving-pip");
      expect(cardHtml).not.toContain("sc-work-level");
    }
  });
});

describe("economy-pressure.css isolation and safety", () => {
  const css = readTextFile("./economy-pressure.css");
  const hudSrc = readTextFile("./ResourceHud.tsx");
  const pipSrc = readTextFile("./SavingPip.tsx");

  it("is imported from ResourceHud and SavingPip", () => {
    expect(hudSrc).toContain('import "./economy-pressure.css";');
    expect(pipSrc).toContain('import "./economy-pressure.css";');
  });

  it("supports Dusk, Night, Parchment themes, reduced motion, and click immunity", () => {
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toMatch(/\.sc-econ-bottleneck-glow\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-econ-bottleneck-pip\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-saving-pip\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toContain("@keyframes sc-econ-bottleneck-pulse");
    expect(css).toContain("@keyframes sc-econ-saving-dot");
    expect(css).toContain("@keyframes sc-econ-saving-glow");
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
