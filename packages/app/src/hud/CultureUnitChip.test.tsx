import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CULTURE_UNITS, createGameState, setPlayerCulture } from "@second-crown/sim";
import { CultureUnitChip, hasCultureUnitChip } from "./CultureUnitChip";
import { ArmyTab } from "../tabs/ArmyTab";
import { lockNote, nextUnitUnlock } from "../TrainingPace";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function army(culture: string, flags: Record<string, number> = {}): string {
  const s = createGameState({ seed: 1 });
  setPlayerCulture(s, culture);
  Object.assign(s.flags, flags);
  return renderToStaticMarkup(<ArmyTab state={s} act={() => undefined} trainQty={1} setTrainQty={() => undefined} />);
}

describe("CultureUnitChip", () => {
  it("has a chip for every culture unit and none for the base roster", () => {
    for (const g of CULTURE_UNITS) expect(hasCultureUnitChip(g.unitId)).toBe(true);
    expect(hasCultureUnitChip("militia")).toBe(false);
    expect(renderToStaticMarkup(<CultureUnitChip typeId="militia" />)).toBe("");
  });

  it("marks origin and open state", () => {
    const open = renderToStaticMarkup(<CultureUnitChip typeId="horse_archer" open />);
    expect(open).toContain('data-culture-unit="horse_archer"');
    expect(open).toContain('data-origin="Steppe"');
    expect(open).toContain("is-steppe is-open");
    const locked = renderToStaticMarkup(<CultureUnitChip typeId="ironclad" open={false} />);
    expect(locked).toContain('data-origin="Iron March"');
    expect(locked).toContain("is-iron is-locked");
  });

  it("never takes clicks from the card", () => {
    const css = readTextFile("./culture-unit-chip.css");
    expect(css).toContain("pointer-events: none !important");
  });
});

describe("Army tab culture units", () => {
  const pairs: Array<[string, string, string]> = [
    ["western", "halberdier", "Halberdier"],
    ["woodland", "cedar_stalker", "Cedar Stalker"],
    ["desert", "dune_lancer", "Dune Lancer"],
    ["steppe", "horse_archer", "Horse Archer"],
    ["tide", "reef_raider", "Reef Raider"],
  ];

  it.each(pairs)("%s shows its own unit card and the ironclad, and no other kit unit", (culture, unit, name) => {
    const html = army(culture);
    expect(html).toContain(`data-culture-unit="${unit}"`);
    expect(html).toContain(name);
    expect(html).toContain('data-culture-unit="ironclad"');
    for (const [, other] of pairs) {
      if (other !== unit) expect(html).not.toContain(`data-culture-unit="${other}"`);
    }
    expect(html).toContain(`data-culture-unit-note="${unit}"`);
  });

  it("uses the existing unit card layout for the new cards", () => {
    const html = army("steppe");
    const cards = html.match(/class="sc-unit-card[^"]*"/g) ?? [];
    // 12 base units + Horse Archer + Ironclad.
    expect(cards.length).toBe(14);
  });

  it("keeps the ironclad locked with a Fortification note until the study is done", () => {
    expect(lockNote("ironclad")).toContain("Fortification");
    const before = army("western");
    expect(before).toMatch(/data-culture-unit="ironclad"[^>]*data-open="false"/);
    const after = army("western", { research_fortification: 1 });
    expect(after).toMatch(/data-culture-unit="ironclad"[^>]*data-open="true"/);
  });

  it("keeps train, cancel and treat controls on the tab", () => {
    const s = createGameState({ seed: 1 });
    const html = renderToStaticMarkup(<ArmyTab state={s} act={() => undefined} trainQty={1} setTrainQty={() => undefined} />);
    expect(html).toContain("Barracks queue");
    expect(html).toContain("Treat");
    expect(html).toContain("Food levy");
  });

  it("the pace line never names another kit's unit as next", () => {
    const s = createGameState({ seed: 1 });
    setPlayerCulture(s, "tide");
    for (const id of ["horse", "siege", "fieldcraft", "drill", "screening"]) s.flags[`research_${id}`] = 1;
    expect(nextUnitUnlock(s)?.id).toBe("ironclad");
    s.flags.research_fortification = 1;
    expect(nextUnitUnlock(s)).toBeNull();
  });
});
