import { describe, it, expect } from "vitest";
import type { GameState } from "@second-crown/shared";
import {
  resolveBoardHoverTooltip,
  paintBoardHoverTooltip,
  toHoverText,
  hoverTextWidth,
  BOARD_HOVER_TIP_INK,
  BOARD_HOVER_TIP_HALO,
  BOARD_HOVER_STATUS_COLORS,
  BOARD_HOVER_GLYPHS_3X5,
} from "./hover.js";

function createMockGraphics() {
  const calls: { method: string; args: any[] }[] = [];
  const g: any = { calls, eventMode: "auto" };
  for (const m of ["clear", "poly", "fill", "stroke", "rect", "roundRect", "circle", "ellipse", "moveTo", "lineTo"]) {
    g[m] = (...args: any[]) => {
      calls.push({ method: m, args });
      return g;
    };
  }
  return g;
}

function createState(): GameState {
  return {
    meta: { version: 1, seed: 1, tick: 0, lastRealTime: 0, playTimeMs: 0 },
    resources: {},
    buildings: [],
    units: [],
    citizens: [],
    realms: [{ id: "rival", name: "Ash Crown", rulerId: "c1" }],
    characters: [],
    opinions: [],
    wars: [],
    factions: [],
    inputLog: [],
    flags: {
      fog_seen: JSON.stringify(["p_home", "p_wood", "p_rival", "p_dry", "p_top"]),
      node_stock_p_wood: 12,
      node_stock_p_dry: 0,
    },
    unlocks: [],
    board: {
      width: 12,
      height: 8,
      homeProvinceId: "p_home",
      provinces: [
        { id: "p_home", x: 5, y: 4, terrain: "plain", node: "hold", occupantRealmId: "player" },
        { id: "p_wood", x: 6, y: 4, terrain: "wood", node: "woodcut", occupantRealmId: null },
        { id: "p_rival", x: 7, y: 4, terrain: "hill", node: "camp", occupantRealmId: "rival" },
        { id: "p_dry", x: 6, y: 5, terrain: "hill", node: "quarry", occupantRealmId: null },
        { id: "p_fog", x: 9, y: 6, terrain: "plain", node: "field", occupantRealmId: "rival" },
        { id: "p_top", x: 0, y: 0, terrain: "plain", node: "none", occupantRealmId: null },
      ],
    },
  } as unknown as GameState;
}

const row = (t: any, key: string) => t.rows.find((r: any) => r.key === key);

describe("wave/board-hover: province hover tooltip", () => {
  it("shows stock, owner and status for a seen woodcut", () => {
    const t = resolveBoardHoverTooltip(createState(), 6, 4)!;
    expect(t.rows.map((r) => r.key)).toEqual(["STOCK", "OWNER", "STATUS"]);
    expect(row(t, "STOCK").value).toMatch(/^12\/\d+ WOOD$/);
    expect(row(t, "OWNER").value).toBe("NONE");
    expect(row(t, "STATUS").value).toBe("OPEN");
  });

  it("names you on home, and the rival realm by name", () => {
    const s = createState();
    expect(row(resolveBoardHoverTooltip(s, 5, 4)!, "OWNER").value).toBe("YOU");
    expect(resolveBoardHoverTooltip(s, 5, 4)!.status).toBe("home");
    const r = resolveBoardHoverTooltip(s, 7, 4)!;
    expect(row(r, "OWNER").value).toBe("ASH CROWN");
    expect(r.status).toBe("rival");
    expect(r.rim).toBe(BOARD_HOVER_STATUS_COLORS.rival);
  });

  it("marks an empty node as dry", () => {
    const t = resolveBoardHoverTooltip(createState(), 6, 5)!;
    expect(t.status).toBe("dry");
    expect(row(t, "STOCK").value).toMatch(/^0\/\d+ STONE$/);
  });

  it("keeps fog as fog: unseen tiles show only UNSCOUTED", () => {
    const t = resolveBoardHoverTooltip(createState(), 9, 6)!;
    expect(t.seen).toBe(false);
    expect(t.status).toBe("unscouted");
    expect(row(t, "STOCK").value).toBe("?");
    expect(row(t, "OWNER").value).toBe("?");
  });

  it("returns null with no state or no province", () => {
    expect(resolveBoardHoverTooltip(null, 0, 0)).toBeNull();
    expect(resolveBoardHoverTooltip(createState(), 11, 0)).toBeNull();
  });

  it("sits above the tile, and flips below for a top-row tile", () => {
    const mid = resolveBoardHoverTooltip(createState(), 6, 4)!;
    expect(mid.flipped).toBe(false);
    expect(mid.y + mid.h).toBeLessThan(mid.anchorY);
    const top = resolveBoardHoverTooltip(createState(), 0, 0)!;
    expect(top.flipped).toBe(true);
    expect(top.y).toBeGreaterThan(top.anchorY);
  });

  it("is deterministic: same state in, same card out", () => {
    expect(resolveBoardHoverTooltip(createState(), 6, 4)).toEqual(resolveBoardHoverTooltip(createState(), 6, 4));
  });

  it("paints halo, ink plate and status rim; nothing when not hovered", () => {
    const g = createMockGraphics();
    paintBoardHoverTooltip(g, createState(), { bx: 6, by: 4 });
    expect(g.eventMode).toBe("none");
    const fills = g.calls.filter((c: any) => c.method === "fill").map((c: any) => c.args[0]?.color);
    expect(fills).toContain(BOARD_HOVER_TIP_INK);
    expect(fills).toContain(BOARD_HOVER_TIP_HALO);
    const strokes = g.calls.filter((c: any) => c.method === "stroke").map((c: any) => c.args[0]?.color);
    expect(strokes).toContain(BOARD_HOVER_STATUS_COLORS.open);

    const empty = createMockGraphics();
    paintBoardHoverTooltip(empty, createState(), null);
    expect(empty.calls.map((c: any) => c.method)).toEqual(["clear"]);
  });

  it("text helpers cover the glyph set", () => {
    expect(toHoverText("k_silk realm!")).toBe("K SILK REALM");
    expect(toHoverText("a very long realm name indeed").length).toBeLessThanOrEqual(14);
    expect(hoverTextWidth("ABC")).toBe(11);
    for (const ch of "STOCKOWNERSTATUSUNSCOUTEDRIVALHELDGARRISONGATHERINGINCOMINGMARCHING0123456789/-?") {
      expect(BOARD_HOVER_GLYPHS_3X5[ch]).toBeDefined();
    }
  });

  it("tooltip layer is the top board layer", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const code = fs.readFileSync(path.resolve(__dirname, "index.ts"), "utf-8");
    const at = (n: string) => code.indexOf(`boardContainer.addChild(${n})`);
    const tip = at("boardHoverTipLayer");
    expect(tip).toBeGreaterThan(0);
    for (const below of [
      "boardStaticTilesLayer", "boardRoadsLayer", "boardRoadsTrafficLayer", "boardProvincesLayer", "boardFogEdgeLayer",
      "boardWeatherGraphic", "boardRoutesLayer", "boardKeepsLayer", "boardPawnsLayer", "boardNodePilesLayer",
      "boardOutpostMarksLayer", "boardSelectionLayer", "boardHighlightLayer", "boardStatusMarksLayer",
      "boardAlmanacLayer", "boardUnitLabelsLayer",
    ]) {
      expect(tip).toBeGreaterThan(at(below));
    }
    expect(code).toMatch(/boardHoverTipLayer\.eventMode = "none"/);
  });
});
