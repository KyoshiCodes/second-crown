import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { FOLD_HEAD_PULSE_MS } from "./Fold";
import { detectResourceMicroPulse, HUD_PULSE_MS, ResourceHud } from "./ResourceHud";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: {
      getBuiltinModule?: (id: string) => {
        readFileSync: (path: URL, encoding: string) => string;
      };
    };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const RESOURCES = { food: "120", wood: "80", stone: "40", gold: "15" };
const INCOME = { food: "2", wood: "1", stone: "0", gold: "0.5" };

describe("HUD micro-feedback pass", () => {
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it("detects income ticks up and store full/empty transitions without firing on first render", () => {
    expect(detectResourceMicroPulse(undefined, { income: 3, full: false, empty: false })).toBeNull();

    expect(
      detectResourceMicroPulse(
        { income: 1, full: false, empty: false },
        { income: 2.5, full: false, empty: false },
      ),
    ).toBe("income-up");

    expect(
      detectResourceMicroPulse(
        { income: 2.5, full: false, empty: false },
        { income: 2.5, full: false, empty: false },
      ),
    ).toBeNull();

    expect(
      detectResourceMicroPulse(
        { income: 2.5, full: false, empty: false },
        { income: 1, full: false, empty: false },
      ),
    ).toBeNull();

    expect(
      detectResourceMicroPulse(
        { income: 1, full: false, empty: false },
        { income: 1, full: true, empty: false },
      ),
    ).toBe("became-full");
    expect(
      detectResourceMicroPulse(
        { income: 1, full: true, empty: false },
        { income: 1, full: true, empty: false },
      ),
    ).toBeNull();

    expect(
      detectResourceMicroPulse(
        { income: 1, full: false, empty: false },
        { income: 2, full: true, empty: true },
      ),
    ).toBe("became-empty");
    expect(HUD_PULSE_MS).toBe(680);
  });

  it("renders non-blocking flash overlays in ResourceHud when pulseOverride triggers", () => {
    const html = renderToStaticMarkup(
      <ResourceHud
        resources={RESOURCES}
        income={INCOME}
        pulseOverride={{ food: "became-empty", wood: "became-full", gold: "income-up" }}
      />,
    );
    expect(html).toContain('data-hud-pulse="became-empty"');
    expect(html).toContain('data-hud-pulse="became-full"');
    expect(html).toContain('data-hud-pulse="income-up"');
    expect(html).toContain("sc-hud-cell-flash is-became-empty");
    expect(html).toContain("sc-hud-cell-flash is-became-full");
    expect(html).toContain("sc-hud-cell-flash is-income-up");
    expect(html).toContain("pointer-events:none");
    expect(html).toContain("+2/s");
  });

  it("keeps Fold storage keys unchanged and isolates styles in hud-micro-feedback.css", () => {
    const css = readTextFile("./hud-micro-feedback.css");
    const foldTsx = readTextFile("./Fold.tsx");
    const themeCss = readTextFile("../theme.css");

    expect(FOLD_HEAD_PULSE_MS).toBe(320);
    expect(foldTsx).toContain('import "./hud-micro-feedback.css"');
    expect(foldTsx).toContain("`sc-fold:${id}`");
    expect(foldTsx).toContain("`sc-fold-seen:${id}`");
    expect(foldTsx).toContain('"sc-compact"');

    // Required visuals + strict click immunity
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain(".sc-hud-cell-flash.is-income-up");
    expect(css).toContain(".sc-resource-bar .sc-ledger-cell.is-full");
    expect(css).toContain(".sc-resource-bar .sc-ledger-cell.is-empty");
    expect(css).toContain('.sc-fold-head[data-fold-motion="expanded"]::before');
    expect(css).toContain('.sc-fold-head[data-fold-motion="collapsed"]::before');
    expect(css).toContain(".sc-tabs-bar .sc-tab.active::before");
    expect(css).toContain("@keyframes sc-tab-active-sheen");

    // Non-collision with theme.css & music-reactive.css
    expect(css).not.toContain(".sc-tab.active::after");
    expect(css).not.toContain(".sc-ledger-cell::before");
    expect(css).not.toContain(".sc-ledger-cell::after");

    for (const theme of ["dusk", "night", "parchment"] as const) {
      expect(css).toContain(`:root[data-chrome="${theme}"]`);
    }
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important;");
    expect(themeCss).not.toContain("sc-hud-cell-flash");
    expect(themeCss).not.toContain("sc-fold-head-expand");
  });
});
