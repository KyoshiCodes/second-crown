import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, DECREES } from "@second-crown/sim";
import { DecreeLedger, decreeLedgerRows, decreeStatus } from "./DecreeLedger";
import { DecreeCard } from "./DecreeCard";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function inOrder(html: string, keys: string[]): boolean {
  const idx = keys.map((k) => html.indexOf(k));
  return idx.every((i) => i >= 0) && idx.every((v, i) => i === 0 || v > idx[i - 1]);
}

const noop = () => undefined;
const muster = DECREES.find((d) => d.id === "muster")!;

describe("decree row helpers", () => {
  it("derives status from left / affordable only", () => {
    expect(decreeStatus({ hasState: false, left: 0, affordable: false })).toBe("idle");
    expect(decreeStatus({ hasState: true, left: 5, affordable: false })).toBe("active");
    expect(decreeStatus({ hasState: true, left: 0, affordable: true })).toBe("ready");
    expect(decreeStatus({ hasState: true, left: 0, affordable: false })).toBe("short");
  });

  it("stacks name, time left, effect in order", () => {
    const rows = decreeLedgerRows({ name: "Muster the Host", blurb: "x", status: "ready", left: 0, ticks: 400 });
    expect(rows.map((r) => r.kind)).toEqual(["name", "time", "effect"]);
    expect(rows[1].value).toBe("Not sworn");
    expect(rows[1].sub).toBe("lasts 40s");
  });

  it("active time row rounds like the old card and fills by remaining share", () => {
    const rows = decreeLedgerRows({ name: "M", blurb: "x", status: "active", left: 101, ticks: 400 });
    expect(rows[1].value).toBe("11s left");
    expect(rows[1].fill).toBeCloseTo(101 / 400);
    expect(rows[2].tone).toBe("ready");
  });

  it("renders a definition list", () => {
    const html = renderToStaticMarkup(
      <DecreeLedger rows={decreeLedgerRows({ name: "M", blurb: "Fx", status: "short", left: 0, ticks: 400 })} />,
    );
    expect(inOrder(html, ["Decree", "Time left", "Effect", "Fx"])).toBe(true);
    expect(html).toContain("short of stores");
  });
});

describe("DecreeCard living rows", () => {
  it("keeps cost and Issue button after the rows", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "1000";
    const html = renderToStaticMarkup(<DecreeCard state={s} decree={muster} act={noop as never} />);
    expect(inOrder(html, ["sc-decree-ledger", muster.name, muster.blurb, "sc-decree-cost", "sc-decree-btn"])).toBe(true);
    expect(html).toContain(">Issue<");
    expect(html).toContain("ready to issue");
  });

  it("shows time left while sworn and disables the button", () => {
    const s = createGameState({ seed: 1 });
    s.flags[`decree_${muster.id}_until`] = s.meta.tick + 250;
    const html = renderToStaticMarkup(<DecreeCard state={s} decree={muster} act={noop as never} />);
    expect(html).toContain("25s left");
    expect(html).toContain("Already active");
    expect(html).toMatch(/<button[^>]*disabled/);
  });

  it("styles live in a dedicated file with reduced-motion guard", () => {
    const css = readCssFile("./decree-living.css");
    expect(css).toContain(".sc-decree-ledger-row");
    expect(css).toContain("prefers-reduced-motion");
  });
});
