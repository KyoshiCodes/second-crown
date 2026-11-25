import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Fold, initialFoldOpen } from "./Fold";

function readFile(relativePath: string): string {
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

describe("Fold", () => {
  beforeEach(() => stubStorage());
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it("starts open on first sight, even when noisy", () => {
    expect(initialFoldOpen("study-tree", true)).toBe(true);
  });

  it("starts a noisy panel closed once seen, a calm one stays open", () => {
    stubStorage({ "sc-fold-seen:study-tree": "1", "sc-fold-seen:kingdom-flags": "1" });
    expect(initialFoldOpen("study-tree", true)).toBe(false);
    expect(initialFoldOpen("kingdom-flags", false)).toBe(true);
  });

  it("honors a saved choice over the noisy default", () => {
    stubStorage({ "sc-fold-seen:study-tree": "1", "sc-fold:study-tree": "1", "sc-fold:primer": "0" });
    expect(initialFoldOpen("study-tree", true)).toBe(true);
    expect(initialFoldOpen("primer", false)).toBe(false);
  });

  it("compact mode closes panels with no saved choice", () => {
    stubStorage({ "sc-compact": "1" });
    expect(initialFoldOpen("kingdom-market", false)).toBe(false);
  });

  it("honors defaultOpen=false on first sight while keeping saved '1' open", () => {
    expect(initialFoldOpen("global-chat", true, false)).toBe(false);
    stubStorage({ "sc-fold:global-chat": "1" });
    expect(initialFoldOpen("global-chat", true, false)).toBe(true);
  });

  it("renders the title and summary always, the body only when open", () => {
    const open = renderToStaticMarkup(
      <Fold id="x" title="Study tree" summary="Lectern idle">
        <p>tree body</p>
      </Fold>
    );
    expect(open).toContain('aria-expanded="true"');
    expect(open).toContain("Lectern idle");
    expect(open).toContain("tree body");

    stubStorage({ "sc-fold:x": "0" });
    const closed = renderToStaticMarkup(
      <Fold id="x" title="Study tree" summary="Lectern idle">
        <p>tree body</p>
      </Fold>
    );
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain("Study tree");
    expect(closed).not.toContain("tree body");
  });

  it("puts the board before the study tree and inspector in AppShell", () => {
    const src = readFile("../AppShell.tsx");
    const board = src.indexOf("sc-map-canvas-container");
    expect(board).toBeGreaterThan(0);
    expect(src.indexOf('<Fold id="study-tree"')).toBeGreaterThan(board);
    expect(src.indexOf("<ProvinceInspect")).toBeGreaterThan(board);
    expect(src.indexOf("<TutorialBanner")).toBeLessThan(board);
  });

  it("keeps its styles in layout-priority.css, not theme.css", () => {
    expect(readFile("../layout-priority.css")).toContain(".sc-fold-head");
    expect(readFile("../theme.css")).not.toContain(".sc-fold");
  });
});
