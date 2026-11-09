import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createCitizen, createGameState, listBuildableTypes, tryAssignCitizen } from "@second-crown/sim";
import { WorkLivingRows, splitWorkRows } from "./WorkLivingRows";
import { workStatusRows, type WorkStatusInput } from "./WorkStatus";
import { WorkCard } from "./WorkCard";
import { getHallDomain } from "./WorkLivingGlyph";

type B = ReturnType<typeof createGameState>["buildings"][number];

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const noop = () => {};

const base: WorkStatusInput = {
  level: 2,
  maxLevel: 4,
  scarred: false,
  crewed: true,
  staffPct: 20,
  clusterPct: 0,
  pairPct: 0,
  keepPct: 0,
};

describe("splitWorkRows", () => {
  it("moves level and staffed into the head and leaves bonuses below", () => {
    const { head, rest } = splitWorkRows(workStatusRows(base));
    expect(head.map((r) => r.kind)).toEqual(["level", "staffed"]);
    expect(rest.map((r) => r.kind)).toEqual(["bonuses"]);
  });
});

describe("WorkLivingRows", () => {
  it("stacks name, level, staffed using the existing row values", () => {
    const rows = workStatusRows(base);
    const html = renderToStaticMarkup(
      <WorkLivingRows typeId="farm" name="Farm" scarred={false} rows={splitWorkRows(rows).head} />,
    );
    const order = ["is-name", "is-level", "is-staffed"].map((c) => html.indexOf(c));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(html).toContain("Farm");
    expect(html).toContain(rows[0].value);
    expect(html).toContain(rows[1].value);
    expect(html).toContain("domain-hearth");
    expect(html).toContain('style="width:50%"');
    expect(html).toContain("is-staffed tone-calm is-live");
  });

  it("scarred halls fog the domain tag", () => {
    const rows = workStatusRows({ ...base, scarred: true });
    const html = renderToStaticMarkup(
      <WorkLivingRows typeId="farm" name="Farm" scarred rows={splitWorkRows(rows).head} />,
    );
    expect(html).toContain("sc-work-living-domain is-fog");
    expect(html).toContain("Scarred");
  });
});

describe("WorkCard living layout", () => {
  it("living head replaces the inline lv tag; bonuses, glyph and buttons kept", () => {
    const s = createGameState({ seed: 1 });
    const farm = { id: "f1", typeId: "farm", realmId: "player", x: 1, y: 2, level: 1, completesAtTick: null } as B;
    s.buildings = [farm];
    const cit = createCitizen(s, "player");
    expect(tryAssignCitizen(s, cit.id, "f1")).toBe(true);
    const html = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred={false} act={noop as never} />);
    expect(html).toContain("sc-work-living-head");
    expect(html).not.toContain("sc-work-level");
    expect(html).toContain("sc-workstat-row is-bonuses");
    expect(html).not.toContain("sc-workstat-row is-level");
    expect(html).toContain("sc-works-status-glyph");
    expect(html).toContain("Demolish");
    expect(html).toContain("sc-work-living-row is-staffed tone-calm is-live");
  });

  it("scarred card keeps Repair and shows the scarred staffed row", () => {
    const s = createGameState({ seed: 1 });
    const farm = { id: "f1", typeId: "farm", realmId: "player", x: 1, y: 2, level: 1, completesAtTick: null } as B;
    s.buildings = [farm];
    const html = renderToStaticMarkup(<WorkCard state={s} b={farm} scarred act={noop as never} />);
    expect(html).toContain("sc-work-living-row is-staffed tone-danger");
    expect(html).toContain("Repair (8 stone)");
  });

  it("every buildable type renders the living head with its hall domain", () => {
    const s = createGameState({ seed: 1 });
    for (const t of listBuildableTypes()) {
      const b = { id: `b_${t.id}`, typeId: t.id, realmId: "player", x: 0, y: 0, level: 1, completesAtTick: null } as B;
      s.buildings = [b];
      const html = renderToStaticMarkup(<WorkCard state={s} b={b} scarred={false} act={noop as never} />);
      expect(html).toContain(`sc-work-living-rows domain-${getHallDomain(t.id)}`);
    }
  });
});

describe("work-living-rows.css", () => {
  it("is its own file, respects reduced motion, and theme.css stays clean", () => {
    const css = readCssFile("./work-living-rows.css");
    expect(css).toContain(".sc-work-living-rows");
    expect(css).toContain("prefers-reduced-motion");
    expect(readCssFile("../theme.css")).not.toContain("sc-work-living");
  });
});
