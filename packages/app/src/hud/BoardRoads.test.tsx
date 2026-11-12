import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, revealProvince, type GameState, type March } from "@second-crown/sim";
import {
  BoardRoads,
  BoardRoadLiving,
  BoardRoutes,
  listBoardConnectedRoads,
  listBoardRoadJunctions,
  boardTerrainElevation,
  boardTileTop,
  pointsToSvgPath,
} from "./BoardRoads";
import { BoardLiving } from "../BoardLiving";

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

function fresh(): GameState {
  return createGameState({ seed: 1 });
}

describe("BoardRoads pure helpers", () => {
  it("computes terrain elevations matching the 3D isometric tile heights", () => {
    expect(boardTerrainElevation("peak")).toBe(14);
    expect(boardTerrainElevation("hill")).toBe(9);
    expect(boardTerrainElevation("waste")).toBe(7);
    expect(boardTerrainElevation("wood")).toBe(5);
    expect(boardTerrainElevation("plain")).toBe(4);
    expect(boardTerrainElevation("shore")).toBe(1);
    expect(boardTerrainElevation("unknown")).toBe(4);
    expect(boardTerrainElevation(undefined)).toBe(4);
  });

  it("calculates tile top coordinate with elevation offset", () => {
    // Grid (0, 0): wx = 236, wy = 56
    const topPlain = boardTileTop(0, 0, "plain");
    expect(topPlain.x).toBe(236);
    expect(topPlain.y).toBe(56 - 4);

    const topPeak = boardTileTop(0, 0, "peak");
    expect(topPeak.x).toBe(236);
    expect(topPeak.y).toBe(56 - 14);
  });

  it("converts flat coordinate array to valid SVG path string", () => {
    expect(pointsToSvgPath([])).toBe("");
    expect(pointsToSvgPath([10, 20])).toBe("");
    expect(pointsToSvgPath([10, 20, 30, 40])).toBe("M 10 20 L 30 40");
    expect(pointsToSvgPath([10, 20, 30, 40, 50, 60])).toBe("M 10 20 L 30 40 L 50 60");
  });
});

describe("listBoardConnectedRoads", () => {
  it("returns empty array when state or board is missing", () => {
    expect(listBoardConnectedRoads(undefined)).toEqual([]);
    expect(listBoardConnectedRoads(null)).toEqual([]);
  });

  it("lists roads connecting adjacent seen provinces and fog trails into unseen tiles", () => {
    const s = fresh();
    const roads = listBoardConnectedRoads(s);
    expect(roads.length).toBeGreaterThan(0);

    // Each road has required fields
    for (const r of roads) {
      expect(r.id).toBeDefined();
      expect(r.fromId).toBeDefined();
      expect(r.toId).toBeDefined();
      expect(["road", "path"]).toContain(r.kind);
      expect(typeof r.intoFog).toBe("boolean");
      expect(r.points.length).toBeGreaterThanOrEqual(4);
      expect(r.svgPath).toContain("M ");
      expect(Number.isFinite(r.midX)).toBe(true);
      expect(Number.isFinite(r.midY)).toBe(true);
      expect(Number.isFinite(r.travelerX)).toBe(true);
      expect(Number.isFinite(r.travelerY)).toBe(true);
      expect(Number.isFinite(r.dustX)).toBe(true);
      expect(Number.isFinite(r.dustY)).toBe(true);
    }
  });

  it("marks connected routes when a province is selected", () => {
    const s = fresh();
    const homeId = s.board.homeProvinceId;
    const roadsWithSelection = listBoardConnectedRoads(s, homeId);

    const connected = roadsWithSelection.filter((r) => r.isConnectedRoute);
    // There should be connected visible routes leading out from the home province
    expect(connected.length).toBeGreaterThanOrEqual(1);

    for (const cr of connected) {
      expect(cr.fromId === homeId || cr.toId === homeId).toBe(true);
      expect(cr.intoFog).toBe(false);
    }
  });

  it("marks active marches traversing roads", () => {
    const s = fresh();
    const homeId = s.board.homeProvinceId;
    const home = s.board.provinces.find((p) => p.id === homeId)!;

    // Find an adjacent neighbor
    const neighbor = s.board.provinces.find(
      (p) =>
        Math.abs(p.x - home.x) + Math.abs(p.y - home.y) === 1
    )!;
    revealProvince(s, neighbor.id);

    // Add a march between home and neighbor
    const march: March = {
      id: "march-1",
      fromId: home.id,
      toId: neighbor.id,
      realmId: "player",
      arrivesTick: 100,
      kind: "node",
      levy: 5,
    };
    s.flags["marches_json"] = JSON.stringify([march]);

    const roads = listBoardConnectedRoads(s);
    const marchingRoad = roads.find(
      (r) =>
        (r.fromId === home.id && r.toId === neighbor.id) ||
        (r.fromId === neighbor.id && r.toId === home.id)
    );

    expect(marchingRoad).toBeDefined();
    expect(marchingRoad?.hasMarch).toBe(true);
  });
});

describe("listBoardRoadJunctions", () => {
  it("detects provinces where multiple seen roads intersect as junctions", () => {
    const s = fresh();
    // Reveal all provinces to have a fully seen board
    for (const p of s.board.provinces) {
      revealProvince(s, p.id);
    }

    const roads = listBoardConnectedRoads(s);
    const junctions = listBoardRoadJunctions(s, roads);

    expect(junctions.length).toBeGreaterThan(0);
    for (const j of junctions) {
      expect(j.roadCount).toBeGreaterThanOrEqual(2);
      expect(Number.isFinite(j.x)).toBe(true);
      expect(Number.isFinite(j.y)).toBe(true);
    }
  });
});

describe("BoardRoads component rendering", () => {
  it("renders null when state has no board", () => {
    expect(renderToStaticMarkup(<BoardRoads state={undefined} />)).toBe("");
    expect(renderToStaticMarkup(<BoardRoads state={null} />)).toBe("");
  });

  it("renders base container, SVG road paths, ink underlays, and crowns", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<BoardRoads state={s} />);

    expect(html).toContain('class="sc-board-living-roads"');
    expect(html).toContain('data-testid="sc-board-living-roads"');
    expect(html).toContain('style="pointer-events:none"');
    expect(html).toContain('aria-hidden="true"');

    expect(html).toContain("sc-board-road");
    expect(html).toContain("sc-board-road-ink");
    expect(html).toContain("sc-board-road-bed");
    expect(html).toContain("sc-board-road-traveler");
    expect(html).toContain("sc-board-road-dust");
  });

  it("renders connected route glow, flow dashes, and waymarkers when a province is selected", () => {
    const s = fresh();
    const homeId = s.board.homeProvinceId;
    const html = renderToStaticMarkup(<BoardRoads state={s} selectedId={homeId} />);

    expect(html).toContain("is-connected-route");
    expect(html).toContain('data-connected="true"');
    expect(html).toContain("sc-board-route-glow");
    expect(html).toContain("sc-board-route-flow");
    expect(html).toContain("sc-board-route-waymarker");
    expect(html).toContain("sc-board-route-waymarker-core");
  });

  it("renders fog trail wisps on routes entering the fog", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<BoardRoads state={s} />);

    expect(html).toContain("is-into-fog");
    expect(html).toContain("sc-board-fog-trail-group");
    expect(html).toContain("sc-board-trail-fog-wisp");
  });

  it("renders route junction milestone stones", () => {
    const s = fresh();
    for (const p of s.board.provinces) {
      revealProvince(s, p.id);
    }
    const html = renderToStaticMarkup(<BoardRoads state={s} showJunctions={true} />);

    expect(html).toContain("sc-board-road-junctions");
    expect(html).toContain("sc-board-road-junction");
    expect(html).toContain("sc-board-junction-stone");
    expect(html).toContain("sc-board-junction-shadow");
  });

  it("supports component aliases", () => {
    expect(BoardRoadLiving).toBe(BoardRoads);
    expect(BoardRoutes).toBe(BoardRoads);
  });
});

describe("BoardLiving integration with roads", () => {
  it("includes living roads within the main isometric BoardLiving overlay", () => {
    const s = fresh();
    const homeId = s.board.homeProvinceId;
    const html = renderToStaticMarkup(<BoardLiving state={s} selectedId={homeId} visible={true} />);

    expect(html).toContain("sc-board-living-roads");
    expect(html).toContain("sc-board-road");
    expect(html).toContain("is-connected-route");
    expect(html).toContain("sc-board-route-glow");
    expect(html).toContain("sc-board-route-flow");
    expect(html).toContain("sc-board-road-traveler");
  });
});

describe("Board roads CSS isolation and safety", () => {
  it("enforces pointer-events: none !important and provides keyframe animations in board-roads.css", () => {
    const css = readCssFile("./board-roads.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("user-select: none;");
    expect(css).toContain("@keyframes sc-board-route-pulse");
    expect(css).toContain("@keyframes sc-board-route-dash-flow");
    expect(css).toContain("@keyframes sc-board-route-march-dash");
    expect(css).toContain("@keyframes sc-board-route-waymarker-pulse");
    expect(css).toContain("@keyframes sc-board-road-traffic-flow");
    expect(css).toContain("@keyframes sc-board-road-dust-puff");
    expect(css).toContain("@keyframes sc-board-trail-fog-breathe");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("does not leak into theme.css", () => {
    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-board-road");
    expect(theme).not.toContain("sc-board-route");
  });
});
