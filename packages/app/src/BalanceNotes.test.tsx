import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CULTURES } from "@second-crown/sim";
import { BalanceNotes, unitCostText } from "./BalanceNotes";
import { cultureUnitId } from "./cultureLines";

function readCssFile(relativePath: string): string {
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

describe("unitCostText", () => {
  it("reads base costs straight from the sim unit table", () => {
    expect(unitCostText("ranger")).toBe("food 5 · wood 6 · gold 1");
    expect(unitCostText("lancer")).toBe("food 12 · gold 8 · wood 4");
    expect(unitCostText("nope")).toBeNull();
  });
});

describe("BalanceNotes", () => {
  it("lists every culture with its edge, unit cost, and living culture emblem", () => {
    const html = renderToStaticMarkup(<BalanceNotes playerCulture="mist" />);
    expect(html.match(/<tr/g)?.length).toBe(CULTURES.length + 1);
    expect(html).toContain("Farm +1 food");
    expect(html).toContain("Ranger");
    expect(html).toContain(unitCostText(cultureUnitId("mist")!)!);
    expect(html).toContain("base roster");

    // Living emblem presence for all 10 cultures
    CULTURES.forEach((c) => {
      expect(html).toContain(`data-culture="${c.id}"`);
      expect(html).toContain(c.name);
    });

    // Active player culture row receives is-active-culture and is-selected on crest
    expect(html).toContain("is-active-culture");
    expect(html).toContain('class="sc-culture-crest is-selected "');
    expect(html).toContain('data-picked="true"');
    expect(html).toContain("sc-culture-crest-aura");
    expect(html).toContain("sc-culture-crest-glint");
  });

  it("balance-notes.css provides strict pointer-events: none and accessibility guards", () => {
    const css = readCssFile("./hud/balance-notes.css");

    expect(css).toContain(".sc-balance-culture-cell .sc-culture-crest");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-balance-crest-idle");
    expect(css).toContain("@keyframes sc-balance-crest-float");
    expect(css).toContain("@keyframes sc-balance-crest-pulse");
    expect(css).toContain("@keyframes sc-balance-crest-sparkle");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});

describe("BalanceNotes playtest notes", () => {
  it("shows the five culture edges, each with its own unit", () => {
    const html = renderToStaticMarkup(<BalanceNotes playerCulture="mist" />);
    const pairs: Array<[string, string]> = [
      ["Farm +", "Ranger"],
      ["Quarry +", "Banner"],
      ["Lumber camp +", "Outrider"],
      ["Cottage +", "Warden"],
      ["Keep +", "Lancer"],
    ];
    for (const [edge, unit] of pairs) {
      expect(html).toContain(edge);
      expect(html).toContain(unit);
    }
  });

  it("shows a read-only placeholder when no feedback is logged", () => {
    const html = renderToStaticMarkup(<BalanceNotes playerCulture="mist" notes={[]} />);
    expect(html).toContain("Playtest notes");
    expect(html).toContain("No playtest feedback logged yet");
    expect(html).not.toContain("sc-balance-playtest-list");
    expect(html).not.toMatch(/<(textarea|input|button)/);
  });

  it("lists logged feedback lines in place of the placeholder", () => {
    const html = renderToStaticMarkup(
      <BalanceNotes playerCulture="mist" notes={["Glen: quarry edge feels weak early"]} />,
    );
    expect(html).toContain("<li>Glen: quarry edge feels weak early</li>");
    expect(html).not.toContain("No playtest feedback logged yet");
  });

  it("keeps the note area styles in balance-notes.css", () => {
    const css = readCssFile("./hud/balance-notes.css");
    expect(css).toContain(".sc-balance-playtest");
    expect(css).toContain(".sc-balance-playtest-empty");
  });
});
