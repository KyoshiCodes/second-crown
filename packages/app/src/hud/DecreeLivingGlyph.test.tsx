import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, DECREES } from "@second-crown/sim";
import {
  DecreeLivingGlyph,
  DecreeLivingUnderlay,
  getDecreeSealKind,
  resolveDecreeLiving,
} from "./DecreeLivingGlyph";
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
const rite = DECREES.find((d) => d.id === "rite")!;
const envoys = DECREES.find((d) => d.id === "envoys")!;

describe("DecreeLivingGlyph pure helpers", () => {
  it("resolves decree seal kinds correctly", () => {
    expect(getDecreeSealKind("muster")).toBe("muster");
    expect(getDecreeSealKind("rite")).toBe("rite");
    expect(getDecreeSealKind("envoys")).toBe("envoys");
    expect(getDecreeSealKind("unknown_decree")).toBe("crown");
  });

  it("resolves active decree descriptors with exact countdown seconds and flairs", () => {
    const descMuster = resolveDecreeLiving({
      decreeId: "muster",
      status: "active",
      left: 145,
      ticks: 400,
    });
    expect(descMuster.sealKind).toBe("muster");
    expect(descMuster.status).toBe("active");
    expect(descMuster.flair).toContain("Host mustered");
    expect(descMuster.flair).toContain("15s left");

    const descRite = resolveDecreeLiving({
      decreeId: "rite",
      status: "active",
      left: 80,
      ticks: 400,
    });
    expect(descRite.flair).toContain("Rite in force");
    expect(descRite.flair).toContain("8s left");

    const descEnvoys = resolveDecreeLiving({
      decreeId: "envoys",
      status: "active",
      left: 210,
      ticks: 500,
    });
    expect(descEnvoys.flair).toContain("Envoys riding");
    expect(descEnvoys.flair).toContain("21s left");
  });

  it("resolves ready, short, and idle descriptors with appropriate seal titles", () => {
    const ready = resolveDecreeLiving({
      decreeId: "muster",
      status: "ready",
      left: 0,
      ticks: 400,
    });
    expect(ready.flair).toContain("Host Muster Seal prepared");

    const short = resolveDecreeLiving({
      decreeId: "rite",
      status: "short",
      left: 0,
      ticks: 400,
    });
    expect(short.flair).toContain("Harvest Rite Seal held · short of royal stores");

    const idle = resolveDecreeLiving({
      decreeId: "envoys",
      status: "idle",
      left: 0,
      ticks: 500,
    });
    expect(idle.flair).toContain("lasts 50s");
  });
});

describe("DecreeLivingGlyph & DecreeLivingUnderlay markup", () => {
  it("renders underlay watermark with aria-hidden and corner pocket classes", () => {
    const html = renderToStaticMarkup(
      <DecreeLivingUnderlay decreeId="muster" status="active" left={100} ticks={400} />,
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("sc-decree-living-underlay");
    expect(html).toContain("decree-muster");
    expect(html).toContain("status-active");
    expect(html).toContain("sc-decree-underlay-svg");
    expect(html).toContain('data-decree-watermark="muster"');
  });

  it("renders living seal glyph strip with flair text and SVG layers", () => {
    const html = renderToStaticMarkup(
      <DecreeLivingGlyph decreeId="rite" status="ready" left={0} ticks={400} />,
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("sc-decree-seal-glyph");
    expect(html).toContain("sc-decree-seal-flair");
    expect(html).toContain("Harvest Rite Seal prepared");
    expect(html).toContain("sc-decree-drift-layer");
    expect(html).toContain("sc-decree-pulse-layer");
  });

  it("DecreeCard mounts underlay, ledger, glyph, cost, and button in visual stack order", () => {
    const state = createGameState({ seed: 42 });
    state.resources.gold = "500";
    const html = renderToStaticMarkup(<DecreeCard state={state} decree={muster} act={noop as never} />);

    expect(
      inOrder(html, [
        "sc-decree-living-underlay",
        "sc-decree-living-head",
        muster.name,
        muster.blurb,
        "sc-decree-seal-glyph",
        "sc-decree-cost",
        "sc-decree-btn",
      ]),
    ).toBe(true);
  });
});

describe("decree-glyph-living.css contract & contrast safety", () => {
  it("keeps styles isolated in decree-glyph-living.css without touching theme.css", () => {
    const css = readCssFile("./decree-glyph-living.css");
    expect(css).toContain(".sc-decree-card.is-living");
    expect(css).toContain(".sc-decree-living-underlay");
    expect(css).toContain(".sc-decree-seal-glyph");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("strictly enforces pointer-events: none on all decorative layers", () => {
    const css = readCssFile("./decree-glyph-living.css");
    expect(css).toContain(".sc-decree-living-underlay");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain(".sc-decree-seal-glyph");
  });

  it("keeps watermark underlay opacity strictly low (<= 0.25) so decree text is never obscured", () => {
    const css = readCssFile("./decree-glyph-living.css");
    const matches = Array.from(css.matchAll(/\.sc-decree-living-underlay(?:\.[a-z-]+)*\s*\{[^}]*?opacity:\s*([0-9.]+)/gs));
    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) {
      const opacity = parseFloat(match[1]);
      expect(opacity).toBeLessThanOrEqual(0.25);
    }
  });
});
