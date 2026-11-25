import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AwayReturnSeal, resolveAwaySpanTier } from "./AwayReturnSeal";
import { AwaySummaryBanner } from "./AwaySummary";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("AwayReturnSeal & span classification", () => {
  it("classifies brief, hours, and days elapsed strings", () => {
    expect(resolveAwaySpanTier("1m")).toBe("brief");
    expect(resolveAwaySpanTier("45m")).toBe("brief");
    expect(resolveAwaySpanTier("2h")).toBe("hours");
    expect(resolveAwaySpanTier("3h 15m")).toBe("hours");
    expect(resolveAwaySpanTier("1d")).toBe("days");
    expect(resolveAwaySpanTier("2d 4h")).toBe("days");
  });

  it("renders a quiet non-blocking time-passed seal for every span tier", () => {
    for (const [elapsed, tier] of [
      ["12m", "brief"],
      ["4h 10m", "hours"],
      ["2d 6h", "days"],
    ] as const) {
      const html = renderToStaticMarkup(<AwayReturnSeal elapsed={elapsed} />);
      expect(html).toContain(`sc-away-seal is-${tier}`);
      expect(html).toContain(`data-away-seal="${tier}"`);
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain("sc-away-seal-ring");
      expect(html).toContain("sc-away-seal-grain");
      expect(html).toContain("<svg");
    }
  });
});

describe("AwaySummaryBanner living dispatch presentation", () => {
  it("renders short dispatch styling, seal, kicker, rows, next step, and dismiss control", () => {
    const html = renderToStaticMarkup(
      <AwaySummaryBanner
        summary={{
          elapsed: "3h 15m",
          works: ["Farm built"],
          studies: ["Husbandry"],
          events: ["Your Crown held the field."],
          moreEvents: 1,
          changes: ["+300 food"],
          full: ["wood"],
          next: "Start Crop Rotation.",
        }}
        onDismiss={() => {}}
      />,
    );
    expect(html).toContain("sc-away sc-away-dispatch is-span-hours");
    expect(html).toContain('data-away-span="hours"');
    expect(html).toContain('data-away-elapsed="3h 15m"');
    expect(html).toContain("sc-away-dispatch-sheen");
    expect(html).toContain("sc-away-seal is-hours");
    expect(html).toContain("sc-away-dispatch-kicker");
    expect(html).toContain(">Dispatch</span>");
    expect(html).toContain("While you were away");
    expect(html).toContain("3h 15m settled");
    expect(html).toContain('data-away-row="works"');
    expect(html).toContain('data-away-row="studies"');
    expect(html).toContain('data-away-row="events"');
    expect(html).toContain('data-away-row="stores"');
    expect(html).toContain('data-away-row="next"');
    expect(html).toContain("Dismiss away summary");
  });

  it("renders quiet fallback cleanly and stays null when summary is absent", () => {
    const quietHtml = renderToStaticMarkup(
      <AwaySummaryBanner
        summary={{ elapsed: "5m", works: [], studies: [], events: [], moreEvents: 0, changes: [], full: [], next: null }}
        onDismiss={() => {}}
      />,
    );
    expect(quietHtml).toContain("sc-away sc-away-dispatch is-span-brief");
    expect(quietHtml).toContain("Quiet. Nothing finished and nothing struck the hold.");
    expect(renderToStaticMarkup(<AwaySummaryBanner summary={null} onDismiss={() => {}} />)).toBe("");
  });
});

describe("away-dispatch.css isolation and safety", () => {
  const css = readTextFile("./away-dispatch.css");
  const summarySrc = readTextFile("./AwaySummary.tsx");
  const sealSrc = readTextFile("./AwayReturnSeal.tsx");
  const themeCss = readTextFile("../theme.css");

  it("is imported after away-summary.css and leaves theme.css untouched", () => {
    const baseIdx = summarySrc.indexOf('import "./away-summary.css";');
    const dispatchIdx = summarySrc.indexOf('import "./away-dispatch.css";');
    expect(baseIdx).toBeGreaterThan(-1);
    expect(dispatchIdx).toBeGreaterThan(baseIdx);
    expect(sealSrc).toContain('import "./away-dispatch.css";');
    expect(themeCss).not.toContain("sc-away-dispatch");
    expect(themeCss).not.toContain("sc-away-seal");
  });

  it("supports Dusk, Night, Parchment themes, click immunity, and reduced motion", () => {
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important;");
    expect(css).toMatch(/\.sc-away-dispatch-sheen\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-away-seal\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/\.sc-away-seal-ring\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toContain("@keyframes sc-away-dispatch-enter");
    expect(css).toContain("@keyframes sc-away-seal-pulse");
    expect(css).toContain("@keyframes sc-away-grain-breathe");
  });

  it("never uses board, chat, admin, theme dock, or store cell selectors", () => {
    expect(css).not.toContain(".sc-board");
    expect(css).not.toContain(".sc-chat-float");
    expect(css).not.toContain(".sc-admin-float");
    expect(css).not.toContain(".sc-theme-dock");
    expect(css).not.toContain(".sc-ledger-cell");
  });
});
