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
import { NodeLivingCard, nodeRows } from "./NodeLivingCard";

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

function seenNode(): { s: GameState; id: string; max: number } {
  const s = createGameState({ seed: 1 });
  const p = s.board.provinces.find((x) => x.node in GATHER_NODES)!;
  if (!isProvinceSeen(s, p.id)) revealProvince(s, p.id);
  return { s, id: p.id, max: nodeStockMax(p.node) };
}

describe("nodeRows", () => {
  it("stacks name, stock, pile for a seen gather node", () => {
    const { s, id } = seenNode();
    expect(nodeRows(s, id)!.map((r) => r.kind)).toEqual(["name", "stock", "pile"]);
  });

  it("returns null for non-gather tiles", () => {
    const s = createGameState({ seed: 1 });
    expect(nodeRows(s, s.board.homeProvinceId)).toBeNull();
  });

  it("reads an untouched tile as a full pile", () => {
    const { s, id, max } = seenNode();
    const [, stock, pile] = nodeRows(s, id)!;
    expect(stock).toMatchObject({ value: `${max}/${max}`, tone: "safe", sub: "full" });
    expect(pile).toMatchObject({ value: "Untouched", tone: "safe", sub: `badge ${max}/${max}` });
  });

  it("reads drained and dry stock from the stored flag", () => {
    const { s, id, max } = seenNode();
    s.flags[`node_stock_${id}`] = max - 1;
    const [, stock, pile] = nodeRows(s, id)!;
    expect(stock!.tone).toBe("warn");
    expect(stock!.sub).toContain("refills +1");
    expect(pile!.value).toContain(`${max - 1}`);
    expect(pile!.value).toContain("left");

    s.flags[`node_stock_${id}`] = 0;
    const [, dry, empty] = nodeRows(s, id)!;
    expect(dry).toMatchObject({ tone: "danger" });
    expect(dry!.sub).toContain("dry");
    expect(empty!.tone).toBe("danger");
  });

  it("does not change state", () => {
    const { s, id } = seenNode();
    const before = JSON.stringify(s);
    nodeRows(s, id);
    renderToStaticMarkup(<NodeLivingCard state={s} provinceId={id} />);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("NodeLivingCard", () => {
  it("renders a living node card with three rows and a meter", () => {
    const { s, id } = seenNode();
    const html = renderToStaticMarkup(<NodeLivingCard state={s} provinceId={id} />);
    expect(html).toContain("sc-node-card is-living");
    expect(html.match(/sc-node-card-row /g)?.length).toBe(3);
    expect(html).toContain("sc-node-card-meter-fill");
  });

  it("styles live in node-living.css, not theme.css", () => {
    expect(readFile("./node-living.css")).toContain(".sc-node-card-row");
    expect(readFile("../theme.css")).not.toContain("sc-node-card");
  });
});
