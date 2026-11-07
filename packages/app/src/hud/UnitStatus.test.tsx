import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { UnitStatus, unitStatusRows, jobProgress, type UnitStatusInput } from "./UnitStatus";
import { UnitCard } from "./UnitCard";
import { ArmyTab } from "../tabs/ArmyTab";

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

const base: UnitStatusInput = {
  power: 3,
  powerMax: 12,
  home: 0,
  away: 0,
  costText: "10 food",
  ticks: 50,
  qty: 1,
  open: true,
  lock: "",
  affordable: true,
  queueFull: false,
  drilling: 0,
};

describe("unitStatusRows", () => {
  it("stacks power, cost, readiness in that order", () => {
    const rows = unitStatusRows(base);
    expect(rows.map((r) => r.kind)).toEqual(["power", "cost", "ready"]);
    expect(rows[0]).toMatchObject({ value: "3", fill: 0.25, tone: "calm" });
    expect(rows[1]).toMatchObject({ value: "10 food · x1 5s", tone: "calm" });
    expect(rows[2]).toMatchObject({ value: "Ready to drill", tone: "calm" });
  });

  it("shows home and away counts on the power row", () => {
    const rows = unitStatusRows({ ...base, home: 4, away: 2 });
    expect(rows[0].value).toBe("3 · 4 home, 2 away");
  });

  it("locked units fog every row and show the lock note", () => {
    const rows = unitStatusRows({ ...base, open: false, lock: "Needs Horse lore" });
    expect(rows.map((r) => r.tone)).toEqual(["fog", "fog", "fog"]);
    expect(rows[2].value).toBe("Needs Horse lore");
  });

  it("short of stores warns on cost and reads danger on readiness", () => {
    const rows = unitStatusRows({ ...base, affordable: false });
    expect(rows[1].tone).toBe("warn");
    expect(rows[2]).toMatchObject({ value: "Short of stores", tone: "danger" });
  });

  it("queue full beats short of stores; drilling beats both", () => {
    expect(unitStatusRows({ ...base, affordable: false, queueFull: true })[2].value).toBe("Queue full");
    const drill = unitStatusRows({ ...base, queueFull: true, drilling: 5, drillProgress: 0.4 })[2];
    expect(drill).toMatchObject({ value: "Drilling 5", fill: 0.4, live: true, tone: "warn" });
  });
});

describe("jobProgress", () => {
  it("reads progress from stored ticks and clamps", () => {
    expect(jobProgress(50, 0, 100)).toBe(0.5);
    expect(jobProgress(200, 0, 100)).toBe(1);
    expect(jobProgress(5, 10, 20)).toBeUndefined();
    expect(jobProgress(10, 10, 10)).toBeUndefined();
  });
});

describe("UnitStatus and UnitCard", () => {
  it("renders spans (valid inside a button) with tone classes", () => {
    const html = renderToStaticMarkup(<UnitStatus rows={unitStatusRows({ ...base, affordable: false })} />);
    expect(html).toContain("sc-unit-status");
    expect(html).toContain("tone-danger");
    expect(html).not.toMatch(/<(div|dl|dt|dd)\b/);
  });

  it("UnitCard with status replaces the cost line; without status renders as before", () => {
    const props = { typeId: "militia", name: "Militia", power: 1, cost: { food: 10 }, ticks: 50, open: true, lock: "", affordable: true, onTrain: () => {} };
    const withRows = renderToStaticMarkup(<UnitCard {...props} status={unitStatusRows(base)} />);
    expect(withRows).toContain("sc-unit-status");
    expect(withRows).not.toContain("sc-unit-cost");
    const plain = renderToStaticMarkup(<UnitCard {...props} />);
    expect(plain).toContain("sc-unit-cost");
    expect(plain).not.toContain("sc-unit-status");
  });
});

describe("ArmyTab unit cards", () => {
  it("every unit card shows the three rows and keeps train buttons", () => {
    const s = createGameState({ seed: 1 });
    const html = renderToStaticMarkup(<ArmyTab state={s} act={() => {}} trainQty={1} setTrainQty={() => {}} />);
    expect(html).toContain("sc-unit-status");
    expect(html).toContain("is-power");
    expect(html).toContain("is-cost");
    expect(html).toContain("is-ready");
    expect(html).toContain("sc-unit-card");
    expect(html).toContain("x10");
  });
});

describe("unit-status.css", () => {
  it("lives outside theme.css and respects reduced motion", () => {
    const css = readCssFile("./unit-status.css");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain(".sc-unit-status");
    expect(readCssFile("../theme.css")).not.toContain("sc-unit-status");
    expect(readCssFile("../theme.css")).not.toContain("sc-unit-row");
  });
});
