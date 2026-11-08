import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  GATHER_NODES,
  createGameState,
  isProvinceSeen,
  nodeStockMax,
  revealProvince,
  type GameState,
} from "@second-crown/sim";
import {
  NodePileLivingGlyph,
  NodePileUnderlay,
  resolveNodePileDescriptor,
  resolveNodePileDescriptorByValues,
} from "./NodePileLivingGlyph";
import { NodeLivingCard } from "./NodeLivingCard";

function readFile(relativePath: string): string {
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

function seenNode(nodeType?: "woodcut" | "quarry" | "field"): { s: GameState; id: string; max: number } {
  const s = createGameState({ seed: 1 });
  const p = s.board.provinces.find((x) => (nodeType ? x.node === nodeType : x.node in GATHER_NODES))!;
  if (!isProvinceSeen(s, p.id)) revealProvince(s, p.id);
  return { s, id: p.id, max: nodeStockMax(p.node) };
}

describe("resolveNodePileDescriptorByValues", () => {
  it("resolves woodcut states (dry, draining, full, untouched)", () => {
    const dry = resolveNodePileDescriptorByValues("woodcut", 0, 10, 0);
    expect(dry.status).toBe("dry");
    expect(dry.tone).toBe("danger");
    expect(dry.motion).toBe("pulse");
    expect(dry.flair).toContain("Depleted stand");

    const draining = resolveNodePileDescriptorByValues("woodcut", 5, 10, 5);
    expect(draining.status).toBe("draining");
    expect(draining.tone).toBe("warn");
    expect(draining.motion).toBe("pulse");
    expect(draining.flair).toContain("5/10 logs");

    const full = resolveNodePileDescriptorByValues("woodcut", 10, 10, 10);
    expect(full.status).toBe("full");
    expect(full.tone).toBe("safe");
    expect(full.motion).toBe("drift");
    expect(full.flair).toContain("Bountiful stand");

    const untouched = resolveNodePileDescriptorByValues("woodcut", 10, 10, null);
    expect(untouched.status).toBe("untouched");
    expect(untouched.tone).toBe("safe");
    expect(untouched.motion).toBe("drift");
    expect(untouched.flair).toContain("Untouched cord");
  });

  it("resolves quarry states (dry, draining, full, untouched)", () => {
    const dry = resolveNodePileDescriptorByValues("quarry", 0, 10, 0);
    expect(dry.status).toBe("dry");
    expect(dry.flair).toContain("Exhausted pit");

    const draining = resolveNodePileDescriptorByValues("quarry", 4, 10, 4);
    expect(draining.status).toBe("draining");
    expect(draining.flair).toContain("4/10 ashlar");

    const full = resolveNodePileDescriptorByValues("quarry", 10, 10, 10);
    expect(full.status).toBe("full");
    expect(full.flair).toContain("Bountiful cairn");

    const untouched = resolveNodePileDescriptorByValues("quarry", 10, 10, null);
    expect(untouched.status).toBe("untouched");
    expect(untouched.flair).toContain("Untouched seam");
  });

  it("resolves field states (dry, draining, full, untouched)", () => {
    const dry = resolveNodePileDescriptorByValues("field", 0, 10, 0);
    expect(dry.status).toBe("dry");
    expect(dry.flair).toContain("Picked meadow");

    const draining = resolveNodePileDescriptorByValues("field", 6, 10, 6);
    expect(draining.status).toBe("draining");
    expect(draining.flair).toContain("6/10 bushels");

    const full = resolveNodePileDescriptorByValues("field", 10, 10, 10);
    expect(full.status).toBe("full");
    expect(full.flair).toContain("Bountiful forage");

    const untouched = resolveNodePileDescriptorByValues("field", 10, 10, null);
    expect(untouched.status).toBe("untouched");
    expect(untouched.flair).toContain("Wild thicket");
  });
});

describe("resolveNodePileDescriptor", () => {
  it("returns null for non-gather tiles or unseen tiles", () => {
    const s = createGameState({ seed: 1 });
    expect(resolveNodePileDescriptor(s, s.board.homeProvinceId)).toBeNull();
  });

  it("returns valid descriptor for seen gather province", () => {
    const { s, id } = seenNode();
    const desc = resolveNodePileDescriptor(s, id);
    expect(desc).not.toBeNull();
    expect(["woodcut", "quarry", "field"]).toContain(desc!.node);
  });
});

describe("NodePileLivingGlyph component", () => {
  it("renders a 14x14 living strip with glow, pulse, and drift layers", () => {
    const { s, id } = seenNode();
    const html = renderToStaticMarkup(<NodePileLivingGlyph state={s} provinceId={id} />);
    expect(html).toContain("sc-node-pile-glyph");
    expect(html).toContain("sc-node-pile-svg");
    expect(html).toContain("sc-node-glow-layer");
    expect(html).toContain("sc-node-pulse-layer");
    expect(html).toContain("sc-node-drift-layer");
    expect(html).toContain("sc-node-pile-label");
    expect(html).toContain("sc-node-pile-flair");
    expect(html).toContain('aria-hidden="true"');
  });

  it("returns null for non-gather tiles", () => {
    const s = createGameState({ seed: 1 });
    const html = renderToStaticMarkup(<NodePileLivingGlyph state={s} provinceId={s.board.homeProvinceId} />);
    expect(html).toBe("");
  });
});

describe("NodePileUnderlay component", () => {
  it("renders a 34x34 watermark underlay for each node kind", () => {
    for (const node of ["woodcut", "quarry", "field"] as const) {
      const html = renderToStaticMarkup(<NodePileUnderlay node={node} have={10} max={10} />);
      expect(html).toContain("sc-node-pile-underlay");
      expect(html).toContain(`is-${node}`);
      expect(html).toContain("viewBox=\"0 0 34 34\"");
      expect(html).toContain('aria-hidden="true"');
    }
  });

  it("applies dry and draining status classes", () => {
    const dryHtml = renderToStaticMarkup(<NodePileUnderlay node="woodcut" have={0} max={10} />);
    expect(dryHtml).toContain("is-dry");

    const drainHtml = renderToStaticMarkup(<NodePileUnderlay node="woodcut" have={5} max={10} />);
    expect(drainHtml).toContain("is-draining");
  });
});

describe("NodeLivingCard with living pile glyphs", () => {
  it("mounts underlay and living glyph alongside card rows and meter", () => {
    const { s, id } = seenNode();
    const html = renderToStaticMarkup(<NodeLivingCard state={s} provinceId={id} />);
    expect(html).toContain("sc-node-card is-living");
    expect(html).toContain("sc-node-pile-underlay");
    expect(html).toContain("sc-node-card-rows");
    expect(html).toContain("sc-node-card-meter");
    expect(html).toContain("sc-node-pile-glyph");
  });

  it("keeps styles isolated in node-living.css with pointer-events: none and no theme.css pollution", () => {
    const css = readFile("./node-living.css");
    expect(css).toContain(".sc-node-pile-underlay");
    expect(css).toContain(".sc-node-pile-glyph");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-node-pile-pulse");
    expect(css).toContain("@keyframes sc-node-pile-drift");

    const theme = readFile("../theme.css");
    expect(theme).not.toContain("sc-node-pile");
    expect(theme).not.toContain("sc-node-glow-layer");
  });
});
