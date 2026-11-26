import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import {
  ArmyStarvationNotice,
  UnitStarvePip,
  resolveUnitStarveRisk,
} from "./StarvationCue";
import { ResourceHud } from "./ResourceHud";
import { UnitCard } from "./UnitCard";
import { ArmyTab } from "../tabs/ArmyTab";
import { UpkeepLine } from "../UpkeepLine";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const RESOURCES = { food: "120", wood: "80", stone: "40", gold: "15" };
const INCOME = { food: "2", wood: "1", stone: "0.5", gold: "0.5" };

function hostState(opts: {
  food: string;
  typeId?: string;
  count?: string;
  starveTicks?: number;
  withStarterBuildings?: boolean;
}) {
  const s = createGameState({ seed: 1, withStarterBuildings: opts.withStarterBuildings });
  s.units = s.units.filter((u) => u.realmId !== "player");
  s.units.push({
    id: "u_starve_test",
    realmId: "player",
    typeId: opts.typeId ?? "spearman",
    count: opts.count ?? "400",
    armyId: null,
  });
  s.resources.food = opts.food;
  if (opts.starveTicks !== undefined) {
    s.flags.starve_ticks = opts.starveTicks;
  }
  return s;
}

describe("resolveUnitStarveRisk", () => {
  it("flags trained units standing at home when starvation is imminent or starving, skipping militia, champion, and 0-home", () => {
    expect(resolveUnitStarveRisk("imminent", "spearman", 12)).toBe("imminent");
    expect(resolveUnitStarveRisk("starving", "knight", 4)).toBe("starving");
    expect(resolveUnitStarveRisk("starving", "siege", 1)).toBe("starving");
    expect(resolveUnitStarveRisk("starving", "militia", 50)).toBeNull();
    expect(resolveUnitStarveRisk("starving", "champion", 1)).toBeNull();
    expect(resolveUnitStarveRisk("starving", "spearman", 0)).toBeNull();
    expect(resolveUnitStarveRisk(null, "spearman", 10)).toBeNull();
  });
});

describe("ResourceHud starvation states", () => {
  it("renders calm amber imminent accent and starving crimson accent via starvationOverride", () => {
    const imminentHtml = renderToStaticMarkup(
      <ResourceHud resources={RESOURCES} income={INCOME} starvationOverride="imminent" />,
    );
    expect(imminentHtml).toContain("is-food  is-starve-imminent");
    expect(imminentHtml).toContain('data-starve-cell="imminent"');
    expect(imminentHtml).toContain("sc-starve-cell-glow is-imminent");
    expect(imminentHtml).toContain('data-starve-tag="imminent"');
    expect(imminentHtml).toContain("hunger soon");

    const starvingHtml = renderToStaticMarkup(
      <ResourceHud resources={RESOURCES} income={INCOME} starvationOverride="starving" />,
    );
    expect(starvingHtml).toContain("is-food  is-starve-starving");
    expect(starvingHtml).toContain('data-starve-cell="starving"');
    expect(starvingHtml).toContain("sc-starve-cell-glow is-starving");
    expect(starvingHtml).toContain('data-starve-tag="starving"');
    expect(starvingHtml).toContain("starving");
  });

  it("activates on real GameStates with trained troops at deficit/starving and stays off for militia-only deficit", () => {
    const imminentState = hostState({ food: "40", typeId: "spearman", count: "400" });
    const imminentHtml = renderToStaticMarkup(
      <ResourceHud resources={RESOURCES} income={INCOME} state={imminentState} />,
    );
    expect(imminentHtml).toContain("is-starve-imminent");
    expect(imminentHtml).toContain('data-starve-cell="imminent"');

    const starvingState = hostState({ food: "0", typeId: "spearman", count: "400", starveTicks: 180 });
    const starvingHtml = renderToStaticMarkup(
      <ResourceHud resources={{ ...RESOURCES, food: "0" }} income={INCOME} state={starvingState} />,
    );
    expect(starvingHtml).toContain("is-starve-starving");
    expect(starvingHtml).toContain('data-starve-cell="starving"');
    expect(starvingHtml).toContain("Starving: trained troops desert 2%");

    const militiaState = hostState({ food: "0", typeId: "militia", count: "400" });
    const militiaHtml = renderToStaticMarkup(
      <ResourceHud resources={{ ...RESOURCES, food: "0" }} income={INCOME} state={militiaState} />,
    );
    expect(militiaHtml).toContain("is-food-deficit");
    expect(militiaHtml).not.toContain("data-starve-cell");
    expect(militiaHtml).not.toContain("sc-starve-cell-glow");
  });
});

describe("ArmyTab, UnitCard, and UpkeepLine starvation accents", () => {
  it("renders UnitStarvePip strictly with phrasing elements and keeps default UnitCard classes untouched", () => {
    const pipHtml = renderToStaticMarkup(<UnitStarvePip state="starving" />);
    expect(pipHtml).toContain("sc-unit-starve-pip is-starving");
    expect(pipHtml).toContain('data-unit-starve-pip="starving"');
    expect(pipHtml).toContain("Shedding");
    expect(pipHtml).toContain("<svg");
    expect(pipHtml).not.toMatch(/<(div|p|dl)\b/);

    const defaultCard = renderToStaticMarkup(
      <UnitCard
        typeId="knight"
        name="Knight"
        power={25}
        cost={{ food: "180", gold: "120", wood: "60" }}
        ticks={1200}
        tier={4}
        open
        lock=""
        affordable
        onTrain={() => {}}
      />,
    );
    expect(defaultCard).toContain('class="sc-unit-card is-ready is-elite-tier is-tier-4"');
    expect(defaultCard).not.toContain("data-starve-risk");
    expect(defaultCard).not.toContain("sc-unit-starve-rim");

    const riskCard = renderToStaticMarkup(
      <UnitCard
        typeId="knight"
        name="Knight"
        power={25}
        cost={{ food: "180", gold: "120", wood: "60" }}
        ticks={1200}
        tier={4}
        open
        lock=""
        affordable
        starveRisk="imminent"
        onTrain={() => {}}
      />,
    );
    expect(riskCard).toContain('data-starve-risk="imminent"');
    expect(riskCard).toContain("sc-unit-starve-rim is-imminent");
    expect(riskCard).toContain('data-unit-starve-pip="imminent"');
    expect(riskCard).toContain("At risk");
    expect(riskCard).not.toMatch(/<(div|p|dl)\b/);
  });

  it("shows ArmyStarvationNotice, UpkeepLine starve row, and UnitCard risk only on at-risk trained units", () => {
    const fedState = hostState({ food: "500", typeId: "spearman", count: "2", withStarterBuildings: true });
    const fedArmy = renderToStaticMarkup(<ArmyTab state={fedState} act={() => {}} trainQty={1} setTrainQty={() => {}} />);
    expect(fedArmy).not.toContain("data-army-starve");
    expect(fedArmy).not.toContain("data-starve-risk");
    expect(fedArmy).not.toContain("data-upkeep-starve");

    const starvingState = hostState({ food: "0", typeId: "spearman", count: "400", starveTicks: 150 });
    const starvingArmy = renderToStaticMarkup(
      <ArmyTab state={starvingState} act={() => {}} trainQty={1} setTrainQty={() => {}} />,
    );
    expect(starvingArmy).toContain('data-army-starve="starving"');
    expect(starvingArmy).toContain("sc-army-starve-notice is-starving");
    expect(starvingArmy).toContain('data-starve-card="starving"');
    expect(starvingArmy).toContain('data-upkeep-starve="starving"');
    expect(starvingArmy).toContain('data-starve-risk="starving"');
    expect(starvingArmy).toContain('data-unit-starve-pip="starving"');
    expect(starvingArmy).not.toMatch(/<button\b[^>]*>(?:(?!(<\/button>))[\s\S])*?<(div|p|dl)\b/);

    const noticeHtml = renderToStaticMarkup(
      <ArmyStarvationNotice noteOverride={{ state: "imminent", seconds: 70, text: "Larder empty in 10s" }} />,
    );
    expect(noticeHtml).toContain('data-army-starve="imminent"');
    expect(noticeHtml).toContain("Hunger soon");

    const upkeepHtml = renderToStaticMarkup(<UpkeepLine state={starvingState} />);
    expect(upkeepHtml).toContain("is-starve-starving");
    expect(upkeepHtml).toContain("Starving: trained troops desert 2% in 45s.");
  });
});

describe("starvation-accents.css isolation and safety", () => {
  const css = readTextFile("./starvation-accents.css");
  const hudSrc = readTextFile("./ResourceHud.tsx");
  const cueSrc = readTextFile("./StarvationCue.tsx");
  const themeCss = readTextFile("../theme.css");

  it("is imported in ResourceHud after blocker-deficit.css and leaves theme.css untouched", () => {
    const blockerIdx = hudSrc.indexOf('import "./blocker-deficit.css";');
    const starveIdx = hudSrc.indexOf('import "./starvation-accents.css";');
    expect(blockerIdx).toBeGreaterThan(-1);
    expect(starveIdx).toBeGreaterThan(blockerIdx);
    expect(cueSrc).toContain('import "./starvation-accents.css";');
    expect(themeCss).not.toContain("sc-starve-cell-glow");
    expect(themeCss).not.toContain("sc-unit-starve-pip");
  });

  it("supports Dusk, Night, Parchment themes, click immunity, and reduced motion", () => {
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toMatch(/\.sc-starve-cell-glow\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-ledger-tag\.sc-starve-tag\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-starve-pip\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-army-starve-emblem\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-army-starve-badge\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-unit-starve-rim\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-unit-starve-pip\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-unit-starve-icon\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toContain("@keyframes sc-starve-imminent-breathe");
    expect(css).toContain("@keyframes sc-starve-active-breathe");
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
