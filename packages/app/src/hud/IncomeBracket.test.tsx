import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BASE_INCOME_PER_SECOND,
  INCOME_LATE_MULT,
  INCOME_MID_MULT,
  incomeBracketLabel,
  resolveIncomeBracket,
} from "./incomeBracket";
import { ResourceHud } from "./ResourceHud";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const RESOURCES = { food: "1200", wood: "800", stone: "400", gold: "150" };

describe("income bracket helpers", () => {
  it("resolves base, mid (3x+ base), and late (15x+ base) income brackets", () => {
    expect(BASE_INCOME_PER_SECOND).toBe(10);
    expect(INCOME_MID_MULT).toBe(3);
    expect(INCOME_LATE_MULT).toBe(15);

    expect(resolveIncomeBracket(undefined)).toBe("base");
    expect(resolveIncomeBracket("0")).toBe("base");
    expect(resolveIncomeBracket("-5")).toBe("base");
    expect(resolveIncomeBracket("10")).toBe("base");
    expect(resolveIncomeBracket("29.9")).toBe("base");

    expect(resolveIncomeBracket("30")).toBe("mid");
    expect(resolveIncomeBracket("75")).toBe("mid");
    expect(resolveIncomeBracket("149.9")).toBe("mid");

    expect(resolveIncomeBracket("150")).toBe("late");
    expect(resolveIncomeBracket("280")).toBe("late");
    expect(resolveIncomeBracket(Infinity)).toBe("late");
  });

  it("maps bracket tooltip labels", () => {
    expect(incomeBracketLabel("base")).toBeNull();
    expect(incomeBracketLabel("mid")).toBe("Mid income (3×+ base)");
    expect(incomeBracketLabel("late")).toBe("Late income (15×+ base)");
  });
});

describe("ResourceHud income bracket accents", () => {
  it("stays quiet on base-bracket incomes", () => {
    const html = renderToStaticMarkup(
      <ResourceHud resources={RESOURCES} income={{ food: "10", wood: "15", stone: "0", gold: "2" }} />,
    );
    expect(html).not.toContain("is-income-mid");
    expect(html).not.toContain("is-income-late");
    expect(html).not.toContain("data-income-bracket");
    expect(html).not.toContain("sc-income-bracket-pip");
  });

  it("renders calm mid and late glows, pips, and tooltip text when scaled", () => {
    const html = renderToStaticMarkup(
      <ResourceHud
        resources={RESOURCES}
        income={{ food: "44", wood: "75", stone: "200", gold: "280" }}
      />,
    );
    expect(html.match(/is-income-mid/g)?.length).toBe(2);
    expect(html.match(/is-income-late/g)?.length).toBe(2);
    expect(html.match(/data-income-pip="mid"/g)?.length).toBe(2);
    expect(html.match(/data-income-pip="late"/g)?.length).toBe(2);
    expect(html.match(/class="sc-income-bracket-pip-ring"/g)?.length).toBe(2);
    expect(html).toContain("sc-income-bracket-glow is-mid");
    expect(html).toContain("sc-income-bracket-glow is-late");
    expect(html).toContain("Mid income (3×+ base)");
    expect(html).toContain("Late income (15×+ base)");
  });

  it("coexists cleanly with bottleneck accents", () => {
    const html = renderToStaticMarkup(
      <ResourceHud
        resources={RESOURCES}
        income={{ food: "10", wood: "40", stone: "180", gold: "5" }}
        bottleneckOverride={{ stone: "Keep IV" }}
      />,
    );
    expect(html).toContain("is-stone  is-bottleneck is-income-late");
    expect(html).toContain('data-economy-bottleneck="true"');
    expect(html).toContain('data-income-bracket="late"');
    expect(html).toContain("limiter for Keep IV · Late income (15×+ base)");
  });
});

describe("income-bracket.css isolation and safety", () => {
  const css = readTextFile("./income-bracket.css");
  const hudSrc = readTextFile("./ResourceHud.tsx");

  it("is imported after economy-pressure.css in ResourceHud.tsx", () => {
    const econIdx = hudSrc.indexOf('import "./economy-pressure.css";');
    const incomeIdx = hudSrc.indexOf('import "./income-bracket.css";');
    expect(econIdx).toBeGreaterThan(-1);
    expect(incomeIdx).toBeGreaterThan(econIdx);
  });

  it("supports Dusk, Night, Parchment themes, click immunity, and reduced motion", () => {
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toMatch(/\.sc-income-bracket-glow\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-income-bracket-pip\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-income-bracket-pip-ring\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toContain("@keyframes sc-income-glow-mid");
    expect(css).toContain("@keyframes sc-income-glow-late");
    expect(css).toContain("@keyframes sc-income-pip-mid");
    expect(css).toContain("@keyframes sc-income-pip-late");
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
