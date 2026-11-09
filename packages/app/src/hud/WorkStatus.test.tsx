import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { WorkStatus, workStatusRows, type WorkStatusInput } from "./WorkStatus";
import { WorkCard } from "./WorkCard";

type B = ReturnType<typeof createGameState>["buildings"][number];

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

const base: WorkStatusInput = {
  level: 1,
  maxLevel: 2,
  scarred: false,
  crewed: true,
  staffPct: 0,
  clusterPct: 0,
  pairPct: 0,
  keepPct: 0,
};

const noop = () => {};

describe("workStatusRows", () => {
  it("stacks level, staffed, bonuses in that order", () => {
    const rows = workStatusRows(base);
    expect(rows.map((r) => r.kind)).toEqual(["level", "staffed", "bonuses"]);
    expect(rows[0]).toMatchObject({ value: "lv 1 / 2", note: "1 to cap", tone: "calm", fill: 0.5 });
    expect(rows[1]).toMatchObject({ value: "Empty", tone: "warn", fill: 0 });
    expect(rows[2]).toMatchObject({ note: "none", tone: "fog", chips: [] });
  });

  it("marks a work at its level cap", () => {
    const rows = workStatusRows({ ...base, level: 3, maxLevel: 3 });
    expect(rows[0]).toMatchObject({ note: "at cap", fill: 1 });
  });

  it("shows staff lift and bonus chips from the passed percents", () => {
    const rows = workStatusRows({ ...base, staffPct: 20, clusterPct: 10, keepPct: 10 });
    expect(rows[1]).toMatchObject({ value: "+20%", note: "crewed", tone: "calm", live: true, fill: 0.5 });
    expect(rows[2].chips?.map((c) => `${c.label} +${c.pct}%`)).toEqual(["cluster +10%", "keep +10%"]);
    expect(rows[2]).toMatchObject({ tone: "calm", live: true, note: "" });
  });

  it("reads full crew at +40%", () => {
    expect(workStatusRows({ ...base, staffPct: 40 })[1]).toMatchObject({ note: "full crew", fill: 1 });
  });

  it("works with no job read as no crew needed", () => {
    expect(workStatusRows({ ...base, crewed: false })[1]).toMatchObject({ value: "No crew", tone: "fog" });
  });

  it("scarred works go idle and drop bonus chips", () => {
    const rows = workStatusRows({ ...base, scarred: true, clusterPct: 10 });
    expect(rows[0]).toMatchObject({ note: "idle", tone: "fog" });
    expect(rows[1]).toMatchObject({ value: "Scarred", tone: "danger" });
    expect(rows[2]).toMatchObject({ note: "idle", chips: [] });
  });
});

describe("WorkStatus render", () => {
  it("renders rows, bars and chips", () => {
    const html = renderToStaticMarkup(
      <WorkStatus rows={workStatusRows({ ...base, staffPct: 20, pairPct: 15 })} />
    );
    expect(html).toContain("sc-workstat-row is-level tone-calm");
    expect(html).toContain("sc-workstat-row is-staffed tone-calm is-live");
    expect(html).toContain("pair +15%");
    expect(html).toContain('style="width:50%"');
  });
});

describe("WorkCard keeps its buttons", () => {
  const card = (scarred: boolean) => {
    const s = createGameState({ seed: 1 });
    const b = { id: "f", typeId: "farm", realmId: "player", x: 0, y: 0, level: 1, completesAtTick: null } as B;
    s.buildings = [b];
    return renderToStaticMarkup(<WorkCard state={s} b={b} scarred={scarred} act={noop as never} />);
  };

  it("standing work shows rows and Demolish", () => {
    const html = card(false);
    expect(html).toContain("sc-workstat");
    expect(html).toContain("Demolish");
    expect(html).not.toContain("Repair (8 stone)");
  });

  it("scarred work shows rows and Repair", () => {
    const html = card(true);
    expect(html).toContain("sc-work-living-row is-staffed tone-danger");
    expect(html).toContain("Repair (8 stone)");
  });
});

describe("work-status.css", () => {
  it("defines tones and honours reduced motion", () => {
    const css = readCssFile("./work-status.css");
    expect(css).toContain(".sc-workstat-row.tone-danger");
    expect(css).toContain("prefers-reduced-motion");
  });
});
