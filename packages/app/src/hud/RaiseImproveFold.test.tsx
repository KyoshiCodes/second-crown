import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { createGameState, listBuildableTypes } from "@second-crown/sim";
import { RaiseImproveFold, raiseImproveSummary, worksInProgress } from "./RaiseImproveFold";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function stubStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

const noAct = () => {};
const noPick = () => {};

/** A state with one cottage half-raised (ends 50 ticks from now). */
function withRaise() {
  const s = createGameState({ seed: 1 });
  s.buildings.push({
    id: "b_test_raise",
    typeId: "cottage",
    realmId: "player",
    x: 1,
    y: 1,
    level: 1,
    completesAtTick: s.meta.tick + 50,
  });
  return s;
}

describe("raiseImproveSummary", () => {
  it("names the pick, else the affordable count, then work counts", () => {
    expect(raiseImproveSummary(undefined, [], 4)).toBe("4 affordable");
    expect(raiseImproveSummary("Cottage", [], 4)).toBe("Picked: Cottage");
    const works = [
      { key: "a", kind: "raise" as const, name: "Farm", level: "", secondsLeft: 3, targetId: "x" },
      { key: "b", kind: "improve" as const, name: "Mint", level: "→ lv 2", secondsLeft: 9, targetId: "y" },
      { key: "c", kind: "raise" as const, name: "Cottage", level: "", secondsLeft: 1, targetId: "z" },
    ];
    expect(raiseImproveSummary("Farm", works, 0)).toBe("Picked: Farm · 2 raising · 1 improving");
  });
});

describe("worksInProgress", () => {
  it("reads raises from the sim with seconds left", () => {
    expect(worksInProgress(undefined)).toEqual([]);
    const w = worksInProgress(withRaise()).find((x) => x.targetId === "b_test_raise");
    expect(w).toMatchObject({ kind: "raise", name: "Cottage", secondsLeft: 5 });
  });
});

describe("RaiseImproveFold", () => {
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it("holds the picker and works underway in one kingdom-raise fold", () => {
    const html = renderToStaticMarkup(
      <RaiseImproveFold state={withRaise()} act={noAct} selectedBuild="farm" setSelectedBuild={noPick} />,
    );
    expect(html).toContain('data-fold="kingdom-raise"');
    expect(html).toContain("Raise / Improve");
    expect(html).toContain("Picked: Farm");
    expect(html).toContain("1 raising");
    expect(html).toContain("sc-raise-works");
    expect(html).toContain(">Raising</span>");
    expect(html).toContain(">Cancel</button>");
    expect(html).toContain("Picked — tap a plot");
    expect((html.match(/sc-plain-pick/g) ?? []).length).toBe(listBuildableTypes().length);
  });

  it("starts open, folds on a saved choice, and keeps the summary when folded", () => {
    stubStorage({ "sc-fold-seen:kingdom-raise": "1" });
    const seen = renderToStaticMarkup(
      <RaiseImproveFold state={withRaise()} act={noAct} selectedBuild={null} setSelectedBuild={noPick} />,
    );
    expect(seen).toContain('aria-expanded="true"');

    stubStorage({ "sc-fold:kingdom-raise": "0" });
    const closed = renderToStaticMarkup(
      <RaiseImproveFold state={withRaise()} act={noAct} selectedBuild={null} setSelectedBuild={noPick} />,
    );
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain("1 raising");
    expect(closed).not.toContain("sc-plain-pick");
  });

  it("styles live in kingdom-flow.css, not theme.css", () => {
    const css = readCssFile("../kingdom-flow.css");
    expect(css).toContain(".sc-raise-grid");
    expect(css).toContain(".sc-raise-work");
    expect(readCssFile("../theme.css")).not.toContain("sc-raise-");
  });
});
