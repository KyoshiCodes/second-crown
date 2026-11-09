import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DECREES, createGameState } from "@second-crown/sim";
import { decreeLedgerRows } from "./DecreeLedger";
import { DecreeLivingRows, orderDecreeRows } from "./DecreeLivingRows";
import { DecreeCard } from "./DecreeCard";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const muster = DECREES.find((d) => d.id === "muster") ?? DECREES[0];
const noop = () => {};
const base = { name: "Muster", blurb: "Fx", ticks: 300 };

describe("orderDecreeRows", () => {
  it("keeps name, duration, effect order regardless of input order", () => {
    const rows = decreeLedgerRows({ ...base, status: "ready", left: 0 });
    expect(orderDecreeRows([rows[2], rows[0], rows[1]]).map((r) => r.kind)).toEqual(["name", "time", "effect"]);
  });
});

describe("DecreeLivingRows", () => {
  it("stacks name, duration, effect using the existing row values", () => {
    const rows = decreeLedgerRows({ ...base, status: "ready", left: 0 });
    const html = renderToStaticMarkup(<DecreeLivingRows decreeId="muster" status="ready" rows={rows} />);
    const order = ["is-name", "is-duration", "is-effect"].map((c) => html.indexOf(`sc-decree-living-row ${c}`));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    for (const r of rows) expect(html).toContain(r.value);
    expect(html).toContain("Duration");
    expect(html).toContain("lasts 30s");
    expect(html).toContain("seal-muster");
    expect(html).toContain("muster · ready");
  });

  it("active decree draws the remaining-share meter", () => {
    const rows = decreeLedgerRows({ ...base, status: "active", left: 75 });
    const html = renderToStaticMarkup(<DecreeLivingRows decreeId="envoys" status="active" rows={rows} />);
    expect(html).toContain("is-active seal-envoys");
    expect(html).toContain("8s left");
    expect(html).toContain('aria-valuenow="0.25"');
    expect(html).toContain('style="width:25%"');
    expect(html).toContain("envoys · in force");
  });

  it("unknown decree ids fall back to the crown seal", () => {
    const rows = decreeLedgerRows({ ...base, status: "short", left: 0 });
    const html = renderToStaticMarkup(<DecreeLivingRows decreeId="other" status="short" rows={rows} />);
    expect(html).toContain("seal-crown");
    expect(html).toContain("crown · short");
  });
});

describe("DecreeCard living head", () => {
  it("every card renders the living head and keeps cost + Issue", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "1000";
    for (const d of DECREES) {
      const html = renderToStaticMarkup(<DecreeCard state={s} decree={d} act={noop as never} />);
      expect((html.match(/sc-decree-living-head /g) ?? []).length).toBe(1);
      expect(html).toContain("sc-decree-living-chip");
      expect(html).toContain("sc-decree-cost");
      expect(html).toContain("sc-decree-btn");
    }
    const html = renderToStaticMarkup(<DecreeCard state={s} decree={muster} act={noop as never} />);
    expect(html).toContain(">Issue<");
  });
});

describe("decree-living-rows.css", () => {
  it("lives outside theme.css and respects reduced motion", () => {
    const css = readCssFile("./decree-living-rows.css");
    expect(css).toContain(".sc-decree-living-row");
    expect(css).toContain("prefers-reduced-motion");
    expect(readCssFile("../theme.css")).not.toContain("sc-decree-living-row");
  });
});
