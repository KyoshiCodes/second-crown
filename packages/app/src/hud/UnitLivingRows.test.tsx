import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { UnitLivingRows, splitUnitRows } from "./UnitLivingRows";
import { unitStatusRows, type UnitStatusInput } from "./UnitStatus";
import { UnitCard } from "./UnitCard";
import { ArmyTab } from "../tabs/ArmyTab";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const base: UnitStatusInput = {
  power: 3,
  powerMax: 12,
  home: 2,
  away: 1,
  costText: "10 food",
  ticks: 50,
  qty: 1,
  open: true,
  lock: "",
  affordable: true,
  queueFull: false,
  drilling: 0,
};

const cardProps = {
  typeId: "archer",
  name: "Archer",
  power: 3,
  cost: { food: 10 },
  ticks: 50,
  open: true,
  lock: "",
  affordable: true,
  onTrain: () => {},
};

describe("splitUnitRows", () => {
  it("moves power and cost into the head and leaves readiness below", () => {
    const { head, rest } = splitUnitRows(unitStatusRows(base));
    expect(head.map((r) => r.kind)).toEqual(["power", "cost"]);
    expect(rest.map((r) => r.kind)).toEqual(["ready"]);
  });
});

describe("UnitLivingRows", () => {
  it("stacks name, power, cost using the existing row values", () => {
    const rows = unitStatusRows(base);
    const html = renderToStaticMarkup(
      <UnitLivingRows typeId="archer" name="Archer" open rows={splitUnitRows(rows).head} />,
    );
    const order = ["is-name", "is-power", "is-cost"].map((c) => html.indexOf(c));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(html).toContain("Archer");
    expect(html).toContain(rows[0].value);
    expect(html).toContain(rows[1].value);
    expect(html).toContain("family-ranged");
    expect(html).toContain('style="width:25%"');
    expect(html).not.toMatch(/<(div|dl|dt|dd|p)\b/);
  });
});

describe("UnitCard living layout", () => {
  it("with status: living head, no inline pwr, readiness and glyph kept", () => {
    const html = renderToStaticMarkup(<UnitCard {...cardProps} status={unitStatusRows(base)} />);
    expect(html).toContain("sc-unit-living-head");
    expect(html).toContain("sc-unit-name");
    expect(html).not.toContain("sc-unit-power");
    expect(html).toContain("sc-unit-status");
    expect(html).toContain("is-ready");
    expect(html).toContain("sc-unit-status-glyph");
    expect(html).toMatch(/^<button[^>]*type="button"/);
  });

  it("without status: legacy head and cost line unchanged", () => {
    const html = renderToStaticMarkup(<UnitCard {...cardProps} />);
    expect(html).not.toContain("sc-unit-living-head");
    expect(html).toContain("sc-unit-power");
    expect(html).toContain("sc-unit-cost");
  });

  it("disabled state still follows open/affordable", () => {
    const html = renderToStaticMarkup(<UnitCard {...cardProps} affordable={false} status={unitStatusRows({ ...base, affordable: false })} />);
    expect(html).toContain("disabled");
    expect(html).toContain("is-short");
  });
});

describe("ArmyTab", () => {
  it("every unit card uses the living head and keeps the batch buttons", () => {
    const s = createGameState({ seed: 1 });
    const html = renderToStaticMarkup(<ArmyTab state={s} act={() => {}} trainQty={1} setTrainQty={() => {}} />);
    const cards = html.match(/class="sc-unit-card /g)?.length ?? 0;
    const heads = html.match(/sc-unit-living-head/g)?.length ?? 0;
    expect(cards).toBeGreaterThan(0);
    expect(heads).toBe(cards);
    expect(html).toContain("x1");
    expect(html).toContain("x5");
    expect(html).toContain("x10");
  });
});

describe("unit-living-rows.css", () => {
  it("is its own file, respects reduced motion, and theme.css stays clean", () => {
    const css = readCssFile("./unit-living-rows.css");
    expect(css).toContain(".sc-unit-living-rows");
    expect(css).toContain("prefers-reduced-motion");
    expect(readCssFile("../theme.css")).not.toContain("sc-unit-living");
  });
});
