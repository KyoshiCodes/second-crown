import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { studyLedgerRows } from "./StudyLedger";
import { StudyLivingRows, orderStudyRows } from "./StudyLivingRows";
import { ResearchBar } from "../ResearchBar";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function bare() {
  const s = createGameState({ seed: 1 });
  s.buildings = [];
  for (const k of Object.keys(s.flags)) if (k.startsWith("research_")) delete s.flags[k];
  return s;
}

const base = {
  name: "Husbandry",
  ticksLeft: 0,
  seconds: 18,
  effect: "Farms yield more food.",
  halls: ["farm", "academy"],
  keepNeed: 0,
  hallOk: true,
  keepOk: true,
};

describe("orderStudyRows", () => {
  it("keeps name, progress, bonus order regardless of input order", () => {
    const rows = studyLedgerRows({ ...base, status: "open" });
    expect(orderStudyRows([rows[2], rows[0], rows[1]]).map((r) => r.kind)).toEqual(["name", "progress", "bonus"]);
  });
});

describe("StudyLivingRows", () => {
  it("stacks name, progress, bonus using the existing row values", () => {
    const rows = studyLedgerRows({ ...base, status: "open" });
    const html = renderToStaticMarkup(<StudyLivingRows topicId="husbandry" status="open" rows={rows} />);
    const order = ["is-name", "is-progress", "is-bonus"].map((c) => html.indexOf(`sc-study-living-row ${c}`));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    for (const r of rows) expect(html).toContain(r.value);
    expect(html).toContain("18s to study");
    expect(html).toContain("discipline-agronomy");
    expect(html).toContain("agronomy · open");
  });

  it("studying draws the stored-total meter and carries the slot control", () => {
    const rows = studyLedgerRows({ ...base, status: "studying", ticksLeft: 45, ticksTotal: 180 }).map((r) =>
      r.kind === "progress" ? { ...r, slot: <button type="button">Cancel</button> } : r,
    );
    const html = renderToStaticMarkup(<StudyLivingRows topicId="siege" status="studying" rows={rows} />);
    expect(html).toContain("is-studying discipline-siegecraft");
    expect(html).toContain('aria-valuenow="0.75"');
    expect(html).toContain('style="width:75%"');
    expect(html).toContain("Cancel");
  });

  it("locked cards say sealed and list what is missing", () => {
    const rows = studyLedgerRows({ ...base, status: "locked", hallOk: false, keepOk: false, keepNeed: 2 });
    const html = renderToStaticMarkup(<StudyLivingRows topicId="horse" status="locked" rows={rows} />);
    expect(html).toContain("horsemanship · sealed");
    expect(html).toContain("needs farm or academy · needs Keep II");
  });
});

describe("ResearchBar living head", () => {
  it("every study card renders the living head and keeps its Study button", () => {
    const s = bare();
    const html = renderToStaticMarkup(<ResearchBar state={s} act={() => {}} />);
    const cards = (html.match(/data-study="/g) ?? []).length;
    expect(cards).toBeGreaterThan(0);
    expect((html.match(/sc-study-living-head /g) ?? []).length).toBe(cards);
    expect((html.match(/sc-study-living-chip/g) ?? []).length).toBe(cards);
    expect(html).toContain("Study husbandry (");
  });
});

describe("study-living-rows.css", () => {
  it("lives outside theme.css and respects reduced motion", () => {
    const css = readCssFile("./study-living-rows.css");
    expect(css).toContain(".sc-study-living-row");
    expect(css).toContain("prefers-reduced-motion");
    expect(readCssFile("../theme.css")).not.toContain("sc-study-living-row");
  });
});
