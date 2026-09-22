import { describe, it, expect } from "vitest";
import {
  roleForCitizenJob,
  toolForCitizen,
  resolveWalkerTool,
  createWalker,
  drawWalkerFrame,
  pickDestination,
  type Walker,
  type WalkerJobTool,
  bandForZoom,
  ZOOM_THRESHOLD,
  provinceTokenBounds,
  hitTestProvince,
  calculateMarchProgress,
  terrainChipPalette,
  isRimTile,
  isMarchHostile,
  rimWalkIndex,
  getRimTileAt,
  listRimFortsPresentation,
  GRID_W,
  GRID_H,
  primaryUnitTypeForMarch,
  unitPalette,
  isOutpostProvince,
  listGathersPresentation,
  paintBoardGathers,
  isGatherMarch,
  drawGatherColumnMeeple,
  isScoutMarch,
  drawScoutColumnMeeple,
  realmTokenPalette,
  culturePalette,
  resolveCultureKit,
  isNpcHoldProvince,
  drawIsometricBuilding,
  getThemeVisuals,
  type ThemeVisuals,
  type RimNeighbors,
  terrainElevation,
  paintTileHeightFace,
  paintFogHeightVeil,
  drawMiniatureKeep,
  paintBoardMarches,
  paintBoardProvinces,
  getNodeStockInfo,
  drawNodeStockPile,
  drawResourceNode,
} from "./index.js";
import type { GameState } from "@second-crown/shared";
import { BUILDING_TYPES } from "@second-crown/sim";

function createMockWalker(id: number = 0, x: number = 0, y: number = 0): Walker {
  return {
    id,
    role: "villager",
    x,
    y,
    targetX: x,
    targetY: y,
    state: "idle",
    idleTime: 0,
    speed: 0.8,
    facing: 1,
    walkDist: 0,
    idlePhase: 0,
    graphics: {} as any,
  };
}

function createMockState(): GameState {
  return {
    meta: { version: 1, seed: 1, tick: 0, lastRealTime: 0, playTimeMs: 0 },
    resources: {},
    buildings: [],
    units: [],
    citizens: [],
    realms: [],
    characters: [],
    opinions: [],
    wars: [],
    factions: [],
    inputLog: [],
    flags: {},
    unlocks: [],
  };
}

describe("packages/render walker roles and pickDestination", () => {
  it("maps citizen jobs to matching walker roles", () => {
    expect(roleForCitizenJob("farmer")).toBe("villager");
    expect(roleForCitizenJob("woodcutter")).toBe("woodcutter");
    expect(roleForCitizenJob("miner")).toBe("miner");
    expect(roleForCitizenJob("merchant")).toBe("merchant");
    expect(roleForCitizenJob("guard")).toBe("guard");
    expect(roleForCitizenJob("scholar")).toBe("scholar");
    expect(roleForCitizenJob("unassigned")).toBe("villager");
    expect(roleForCitizenJob("unknown")).toBe("villager");
  });

  it("sends walker to player worker tile with matching role when citizens exist", () => {
    const state = createMockState();
    state.citizens.push({
      id: "c1",
      realmId: "player",
      job: "woodcutter",
      tile: { x: 5, y: 7 },
    });

    const walker = createMockWalker(0, 0, 0);
    pickDestination(walker, state);

    expect(walker.role).toBe("woodcutter");
    expect(walker.targetX).toBe(5);
    expect(walker.targetY).toBe(7);
    expect(walker.state).toBe("walking");
    expect(walker.facing).toBe(1);
  });

  it("maps walker id to matching player worker by modulo index", () => {
    const state = createMockState();
    state.citizens.push(
      { id: "c1", realmId: "player", job: "farmer", tile: { x: 2, y: 3 } },
      { id: "c2", realmId: "player", job: "guard", tile: { x: 8, y: 9 } }
    );

    const w0 = createMockWalker(0, 0, 0);
    const w1 = createMockWalker(1, 0, 0);
    const w2 = createMockWalker(2, 0, 0);

    pickDestination(w0, state);
    pickDestination(w1, state);
    pickDestination(w2, state);

    expect(w0.role).toBe("villager");
    expect(w0.targetX).toBe(2);
    expect(w0.targetY).toBe(3);

    expect(w1.role).toBe("guard");
    expect(w1.targetX).toBe(8);
    expect(w1.targetY).toBe(9);

    // w2 wraps around to worker 0
    expect(w2.role).toBe("villager");
    expect(w2.targetX).toBe(2);
    expect(w2.targetY).toBe(3);
  });

  it("ignores non-player citizens or citizens without a tile", () => {
    const state = createMockState();
    state.citizens.push(
      { id: "enemy_c", realmId: "rival", job: "guard", tile: { x: 1, y: 1 } },
      { id: "unassigned_c", realmId: "player", job: "guard", tile: null }
    );

    const walker = createMockWalker(0, 0, 0);
    pickDestination(walker, state);

    // Falls back to random wander (default center bounds 6..9, 3..5)
    expect(walker.targetX).toBeGreaterThanOrEqual(6);
    expect(walker.targetX).toBeLessThanOrEqual(9);
    expect(walker.targetY).toBeGreaterThanOrEqual(3);
    expect(walker.targetY).toBeLessThanOrEqual(5);
  });

  it("falls back to random wander when state has no citizens", () => {
    const state = createMockState();
    const walker = createMockWalker(0, 0, 0);
    pickDestination(walker, state);

    expect(walker.targetX).toBeGreaterThanOrEqual(6);
    expect(walker.targetX).toBeLessThanOrEqual(9);
    expect(walker.targetY).toBeGreaterThanOrEqual(3);
    expect(walker.state).toBe("walking");
  });

  it("resolves job tools for farm, wood, stone, gold based on job and building type", () => {
    expect(toolForCitizen("farmer", "farm")).toBe("farm");
    expect(toolForCitizen("farmer", "granary")).toBe("farm");
    expect(toolForCitizen("woodcutter", "lumber_camp")).toBe("wood");
    expect(toolForCitizen("woodcutter", "sawmill")).toBe("wood");
    expect(toolForCitizen("miner", "quarry")).toBe("stone");
    expect(toolForCitizen("miner", "mason")).toBe("stone");
    expect(toolForCitizen("miner", "gold_mine")).toBe("gold");
    expect(toolForCitizen("merchant", "mint")).toBe("gold");
    expect(toolForCitizen("gold")).toBe("gold");
    expect(toolForCitizen("gold_miner")).toBe("gold");
    expect(toolForCitizen("stone")).toBe("stone");
    expect(toolForCitizen("stone_cutter")).toBe("stone");
    // Fallback modulo cycling
    expect(toolForCitizen("miner", undefined, 0)).toBe("stone");
    expect(toolForCitizen("miner", undefined, 1)).toBe("gold");
  });

  it("resolves walker tool from role or explicit tool override", () => {
    expect(resolveWalkerTool("farm")).toBe("farm");
    expect(resolveWalkerTool("farmer")).toBe("farm");
    expect(resolveWalkerTool("wood")).toBe("wood");
    expect(resolveWalkerTool("woodcutter")).toBe("wood");
    expect(resolveWalkerTool("stone")).toBe("stone");
    expect(resolveWalkerTool("gold")).toBe("gold");
    expect(resolveWalkerTool("villager")).toBe("farm");
    expect(resolveWalkerTool("miner")).toBe("stone");
    expect(resolveWalkerTool("villager", "gold")).toBe("gold");
    expect(resolveWalkerTool("guard")).toBe(null);
    expect(resolveWalkerTool("scholar")).toBe(null);
  });

  it("creates presentation walkers with assigned job tools cycling across farm, wood, stone, gold", () => {
    const w0 = createWalker(0, 5, 5);
    const w1 = createWalker(1, 5, 5);
    const w2 = createWalker(2, 5, 5);
    const w3 = createWalker(3, 5, 5);
    const w4 = createWalker(4, 5, 5);

    expect(w0.tool).toBe("farm");
    expect(w0.role).toBe("villager");
    expect(w1.tool).toBe("wood");
    expect(w1.role).toBe("woodcutter");
    expect(w2.tool).toBe("stone");
    expect(w2.role).toBe("miner");
    expect(w3.tool).toBe("gold");
    expect(w3.role).toBe("miner");
    expect(w4.tool).toBe("farm");
  });

  it("assigns appropriate tool when picking destination based on worker building", () => {
    const state = createMockState();
    state.buildings.push(
      { id: "b1", typeId: "quarry", x: 2, y: 3, level: 1 } as any,
      { id: "b2", typeId: "gold_mine", x: 4, y: 5, level: 1 } as any,
      { id: "b3", typeId: "lumber_camp", x: 6, y: 7, level: 1 } as any
    );
    state.citizens.push(
      { id: "c1", realmId: "player", job: "miner", tile: { x: 2, y: 3 } },
      { id: "c2", realmId: "player", job: "miner", tile: { x: 4, y: 5 } },
      { id: "c3", realmId: "player", job: "woodcutter", tile: { x: 6, y: 7 } }
    );

    const walker0 = createMockWalker(0, 0, 0);
    const walker1 = createMockWalker(1, 0, 0);
    const walker2 = createMockWalker(2, 0, 0);

    pickDestination(walker0, state);
    pickDestination(walker1, state);
    pickDestination(walker2, state);

    expect(walker0.role).toBe("miner");
    expect(walker0.tool).toBe("stone");

    expect(walker1.role).toBe("miner");
    expect(walker1.tool).toBe("gold");

    expect(walker2.role).toBe("woodcutter");
    expect(walker2.tool).toBe("wood");
  });

  it("draws 2-3 frame pixel walkers with distinct tools across all frames and facings", () => {
    const createMockG = () => {
      const calls: string[] = [];
      return {
        calls,
        clear: () => calls.push("clear"),
        ellipse: (...args: any[]) => calls.push(`ellipse`),
        rect: (...args: any[]) => calls.push(`rect`),
        circle: (...args: any[]) => calls.push(`circle`),
        poly: (...args: any[]) => calls.push(`poly`),
        moveTo: (...args: any[]) => calls.push(`moveTo`),
        lineTo: (...args: any[]) => calls.push(`lineTo`),
        fill: (...args: any[]) => calls.push(`fill`),
        stroke: (...args: any[]) => calls.push(`stroke`),
      } as any;
    };

    const tools: WalkerJobTool[] = ["farm", "wood", "stone", "gold"];
    const frames: (0 | 1 | 2)[] = [0, 1, 2];
    const facings = [1, -1];

    for (const tool of tools) {
      for (const frame of frames) {
        for (const facing of facings) {
          const g = createMockG();
          drawWalkerFrame(g, tool, facing, frame, "western", tool);
          expect(g.calls.length).toBeGreaterThan(15);
          expect(g.calls[0]).toBe("clear");
        }
      }
    }

    // Verify non-western cultures also render job tools
    for (const cult of ["cedar", "sand", "steppe", "tide"]) {
      const g = createMockG();
      drawWalkerFrame(g, "villager", 1, 1, cult, "gold");
      expect(g.calls.length).toBeGreaterThan(15);
    }
  });
});

describe("packages/render two-band camera and tabletop board helpers", () => {
  it("determines camera band based on ZOOM_THRESHOLD", () => {
    expect(bandForZoom(1.0)).toBe("hold");
    expect(bandForZoom(0.71)).toBe("hold");
    expect(bandForZoom(ZOOM_THRESHOLD)).toBe("board");
    expect(bandForZoom(0.58)).toBe("board");
    expect(bandForZoom(0.45)).toBe("board");
  });

  it("calculates 12x8 isometric province token bounds within diorama viewport", () => {
    const origin = provinceTokenBounds(0, 0);
    expect(origin.x).toBe(214);
    expect(origin.y).toBe(45);
    expect(origin.w).toBe(44);
    expect(origin.h).toBe(22);
    expect(origin.cx).toBe(236);
    expect(origin.cy).toBe(56);

    // Far corner token (column 11, row 7)
    const far = provinceTokenBounds(11, 7);
    expect(far.x).toBeGreaterThanOrEqual(16);
    expect(far.x + far.w).toBeLessThanOrEqual(544); // within RIM_SIZE=16 to 544
    expect(far.y).toBeGreaterThanOrEqual(16);
    expect(far.y + far.h).toBeLessThanOrEqual(344); // within RIM_SIZE=16 to 344
  });

  it("hit tests province tokens on the board", () => {
    const b0 = provinceTokenBounds(2, 3);
    const hit = hitTestProvince(b0.cx, b0.cy);
    expect(hit).toEqual({ bx: 2, by: 3 });

    // Click outside the board diorama
    const miss = hitTestProvince(10, 10);
    expect(miss).toBeNull();
  });

  it("lerps march progress accurately across elapsed ticks", () => {
    // 2 steps distance = 30 ticks total
    const dist = 2;
    const arrivesTick = 100;
    // startTick = 100 - 30 = 70

    expect(calculateMarchProgress(50, arrivesTick, dist)).toBe(0);
    expect(calculateMarchProgress(70, arrivesTick, dist)).toBe(0);
    expect(calculateMarchProgress(85, arrivesTick, dist)).toBe(0.5);
    expect(calculateMarchProgress(100, arrivesTick, dist)).toBe(1);
    expect(calculateMarchProgress(120, arrivesTick, dist)).toBe(1);
  });

  it("provides rich palette colors for all six board terrain chips", () => {
    for (const t of ["plain", "wood", "hill", "waste", "shore", "peak"] as const) {
      const p = terrainChipPalette(t);
      expect(p.fill).toBeGreaterThan(0);
      expect(p.fillDark).toBeGreaterThan(0);
      expect(p.border).toBeGreaterThan(0);
      expect(p.accent).toBeGreaterThan(0);
    }
  });

  it("accurately detects rim tiles for gatehouse door placement", () => {
    // Four corners of 16x10 grid
    expect(isRimTile(0, 0)).toBe(true);
    expect(isRimTile(GRID_W - 1, 0)).toBe(true);
    expect(isRimTile(0, GRID_H - 1)).toBe(true);
    expect(isRimTile(GRID_W - 1, GRID_H - 1)).toBe(true);

    // Edges
    expect(isRimTile(0, 4)).toBe(true);
    expect(isRimTile(8, 0)).toBe(true);
    expect(isRimTile(GRID_W - 1, 5)).toBe(true);
    expect(isRimTile(7, GRID_H - 1)).toBe(true);

    // Interior tiles
    expect(isRimTile(1, 1)).toBe(false);
    expect(isRimTile(8, 5)).toBe(false);
    expect(isRimTile(GRID_W - 2, GRID_H - 2)).toBe(false);
  });

  it("differentiates player marches from hostile marches for meeple styling", () => {
    expect(isMarchHostile({ realmId: "player" })).toBe(false);
    expect(isMarchHostile({ realmId: "rival" })).toBe(true);
    expect(isMarchHostile({ realmId: "bandit" })).toBe(true);
  });

  it("walks rim tiles clockwise from (0,0) in a 48-tile bijective ring", () => {
    // 16 on top + 9 on right + 15 on bottom + 8 on left = 48 tiles
    for (let i = 0; i < 48; i++) {
      const tile = getRimTileAt(i);
      expect(isRimTile(tile.x, tile.y)).toBe(true);
      expect(rimWalkIndex(tile.x, tile.y)).toBe(i);
    }

    // Key corners
    expect(rimWalkIndex(0, 0)).toBe(0);
    expect(rimWalkIndex(15, 0)).toBe(15);
    expect(rimWalkIndex(15, 1)).toBe(16);
    expect(rimWalkIndex(15, 9)).toBe(24);
    expect(rimWalkIndex(14, 9)).toBe(25);
    expect(rimWalkIndex(0, 9)).toBe(39);
    expect(rimWalkIndex(0, 8)).toBe(40);
    expect(rimWalkIndex(0, 1)).toBe(47);
  });

  it("lists finished player rim forts sorted clockwise and excludes interior and unfinished buildings", () => {
    const s = createMockState();
    s.buildings.push(
      { id: "w-bottom", typeId: "walls", realmId: "player", x: 10, y: 9, level: 1, completesAtTick: null },
      { id: "w-top", typeId: "walls", realmId: "player", x: 3, y: 0, level: 1, completesAtTick: null },
      { id: "g-right", typeId: "gate", realmId: "player", x: 15, y: 4, level: 1, completesAtTick: null },
      { id: "w-left", typeId: "walls", realmId: "player", x: 0, y: 5, level: 1, completesAtTick: null },
      // Excluded:
      { id: "interior", typeId: "walls", realmId: "player", x: 5, y: 5, level: 1, completesAtTick: null },
      { id: "unfinished", typeId: "walls", realmId: "player", x: 0, y: 0, level: 1, completesAtTick: 100 },
      { id: "rival", typeId: "walls", realmId: "rival", x: 0, y: 0, level: 1, completesAtTick: null },
      { id: "other", typeId: "chapel", realmId: "player", x: 0, y: 0, level: 1, completesAtTick: null }
    );

    const forts = listRimFortsPresentation(s);
    expect(forts).toEqual([
      { x: 3, y: 0, kind: "wall" },
      { x: 15, y: 4, kind: "gate" },
      { x: 10, y: 9, kind: "wall" },
      { x: 0, y: 5, kind: "wall" },
    ]);
  });

  describe("primaryUnitTypeForMarch and unitPalette", () => {
    it("defaults to militia when force is undefined or empty", () => {
      expect(primaryUnitTypeForMarch({})).toBe("militia");
      expect(primaryUnitTypeForMarch({ levy: 5 })).toBe("militia");
      expect(primaryUnitTypeForMarch({ force: {} })).toBe("militia");
    });

    it("identifies single-type march columns correctly", () => {
      expect(primaryUnitTypeForMarch({ force: { archer: 10 } })).toBe("archer");
      expect(primaryUnitTypeForMarch({ force: { knight: 4 } })).toBe("knight");
      expect(primaryUnitTypeForMarch({ force: { cavalry: 6 } })).toBe("cavalry");
      expect(primaryUnitTypeForMarch({ force: { siege: 2 } })).toBe("siege");
      expect(primaryUnitTypeForMarch({ force: { spearman: 8 } })).toBe("spearman");
      expect(primaryUnitTypeForMarch({ force: { skirmisher: 5 } })).toBe("skirmisher");
      expect(primaryUnitTypeForMarch({ force: { champion: 1 } })).toBe("champion");
    });

    it("resolves multi-type columns by highest count and tier priority", () => {
      // Archer has higher count than militia
      expect(primaryUnitTypeForMarch({ force: { militia: 2, archer: 5 } })).toBe("archer");
      // Equal count tie broken by higher tier priority (knight > spearman)
      expect(primaryUnitTypeForMarch({ force: { spearman: 4, knight: 4 } })).toBe("knight");
      // Champion priority on equal count
      expect(primaryUnitTypeForMarch({ force: { champion: 1, siege: 1 } })).toBe("champion");
    });

    it("provides distinct palettes and gear for all 8 unit types", () => {
      const types = ["militia", "spearman", "skirmisher", "archer", "cavalry", "knight", "siege", "champion"] as const;
      const palMap = new Map();
      for (const t of types) {
        const pal = unitPalette(t);
        expect(pal.id).toBe(t);
        expect(typeof pal.tabardColor).toBe("number");
        expect(typeof pal.weaponKind).toBe("string");
        palMap.set(t, pal);
      }

      // Archer uses bow and green tabard
      expect(palMap.get("archer").weaponKind).toBe("bow");
      expect(palMap.get("archer").tabardColor).toBe(0x14532d);

      // Knight uses heater shield and plate
      expect(palMap.get("knight").weaponKind).toBe("heater");
      expect(palMap.get("knight").helmKind).toBe("plate");

      // Cavalry is mounted
      expect(palMap.get("cavalry").hasMount).toBe(true);

      // Siege is a chassis
      expect(palMap.get("siege").isChassis).toBe(true);

      // Militia is spear-less
      expect(palMap.get("militia").weaponKind).toBe("club");
    });
  });

  describe("isOutpostProvince and listGathersPresentation", () => {
    it("distinguishes player home hold from player outposts", () => {
      const state = createMockState();
      state.board = {
        homeProvinceId: "prov-home",
        provinces: [
          { id: "prov-home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
          { id: "prov-outpost", x: 3, y: 2, terrain: "wood", node: "field", occupantRealmId: "player" },
          { id: "prov-rival", x: 5, y: 2, terrain: "hill", node: "hold", occupantRealmId: "rival" },
          { id: "prov-unowned", x: 1, y: 1, terrain: "plain", node: "none" },
        ],
      };

      // Home hold is not an outpost
      expect(isOutpostProvince(state, { id: "prov-home", occupantRealmId: "player" })).toBe(false);
      // Player occupied field tile is an outpost
      expect(isOutpostProvince(state, { id: "prov-outpost", occupantRealmId: "player" })).toBe(true);
      // Rival or unowned tiles are not player outposts
      expect(isOutpostProvince(state, { id: "prov-rival", occupantRealmId: "rival" })).toBe(false);
      expect(isOutpostProvince(state, { id: "prov-unowned" })).toBe(false);
      // Null state handling
      expect(isOutpostProvince(null, { id: "prov-outpost", occupantRealmId: "player" })).toBe(false);
    });

    it("safely stubs gather expedition queries when Astra gather system is absent", () => {
      const state = createMockState();
      // No gathers on state
      expect(listGathersPresentation(state)).toEqual([]);
      expect(listGathersPresentation(null)).toEqual([]);

      // When gathers array is present (future Astra merge compatibility)
      (state as any).gathers = [
        { id: "g1", fromId: "prov-home", toId: "prov-wood", progress: 0.4 },
      ];
      expect(listGathersPresentation(state)).toHaveLength(1);
      expect(listGathersPresentation(state)[0].id).toBe("g1");
    });

    it("distinguishes gather marches from military war marches using isGatherMarch", () => {
      const state = createMockState();
      state.board = {
        homeProvinceId: "p_home",
        provinces: [
          { id: "p_home", x: 0, y: 0, terrain: "plain", node: "hold", occupantRealmId: "player" },
          { id: "p_wood", x: 1, y: 0, terrain: "wood", node: "woodcut" },
          { id: "p_stone", x: 2, y: 0, terrain: "hill", node: "quarry" },
          { id: "p_food", x: 3, y: 0, terrain: "plain", node: "field" },
          { id: "p_ruins", x: 4, y: 0, terrain: "waste", node: "ruins" },
          { id: "p_camp", x: 5, y: 0, terrain: "peak", node: "none" },
          { id: "p_hold", x: 6, y: 0, terrain: "shore", node: "hold", occupantRealmId: "rival" },
        ],
      };

      // Explicit node kind march
      expect(isGatherMarch({ kind: "node", toId: "p_wood" }, state)).toBe(true);
      // Explicit gather purpose march
      expect(isGatherMarch({ kind: "camp", purpose: "gather", toId: "p_wood" }, state)).toBe(true);

      // Marches targeting resource nodes
      expect(isGatherMarch({ toId: "p_wood" }, state)).toBe(true);
      expect(isGatherMarch({ toId: "p_stone" }, state)).toBe(true);
      expect(isGatherMarch({ toId: "p_food" }, state)).toBe(true);
      expect(isGatherMarch({ toId: "p_ruins" }, state)).toBe(true);

      // Military war marches (camps, holds, plain territory)
      expect(isGatherMarch({ kind: "camp", toId: "p_camp" }, state)).toBe(false);
      expect(isGatherMarch({ kind: "hold", toId: "p_hold" }, state)).toBe(false);
      expect(isGatherMarch({ kind: "camp", toId: "p_wood" }, state)).toBe(false);
      expect(isGatherMarch(null, state)).toBe(false);
    });

    it("draws 2-3 frame pixel gather column meeple (cart / sack / draft animal) across animation frames and nodes", () => {
      const createMockG = () => {
        const calls: string[] = [];
        return {
          calls,
          clear: () => calls.push("clear"),
          ellipse: (...args: any[]) => calls.push(`ellipse`),
          rect: (...args: any[]) => calls.push(`rect`),
          circle: (...args: any[]) => calls.push(`circle`),
          poly: (...args: any[]) => calls.push(`poly`),
          moveTo: (...args: any[]) => calls.push(`moveTo`),
          lineTo: (...args: any[]) => calls.push(`lineTo`),
          fill: (...args: any[]) => calls.push(`fill`),
          stroke: (...args: any[]) => calls.push(`stroke`),
        } as any;
      };

      const nodes = ["field", "woodcut", "quarry", "ruins", undefined];
      const frames: (0 | 1 | 2)[] = [0, 1, 2];
      const facings = [1, -1];
      const cult = culturePalette("western");

      for (const node of nodes) {
        for (const frame of frames) {
          for (const facing of facings) {
            const g = createMockG();
            drawGatherColumnMeeple(g, 100, 100, facing, frame, frame === 0 ? 0 : 2, "western", cult, node, 1.5, 0.6);
            expect(g.calls.length).toBeGreaterThan(20);
          }
        }
      }

      // Culture variations
      for (const kit of ["western", "cedar", "sand", "steppe", "islands"] as const) {
        const g = createMockG();
        drawGatherColumnMeeple(g, 100, 100, 1, 1, 2, kit, culturePalette(kit), "woodcut", 2.0, 0.8);
        expect(g.calls.length).toBeGreaterThan(20);
      }
    });

    it("paints board marches using cart/sack for gather marches and military pedestals for war marches", () => {
      const createMockG = () => {
        const calls: string[] = [];
        return {
          calls,
          clear: () => calls.push("clear"),
          ellipse: (...args: any[]) => calls.push(`ellipse`),
          rect: (...args: any[]) => calls.push(`rect`),
          circle: (...args: any[]) => calls.push(`circle`),
          poly: (...args: any[]) => calls.push(`poly`),
          moveTo: (...args: any[]) => calls.push(`moveTo`),
          lineTo: (...args: any[]) => calls.push(`lineTo`),
          fill: (...args: any[]) => calls.push(`fill`),
          stroke: (...args: any[]) => calls.push(`stroke`),
        } as any;
      };

      const state = createMockState();
      state.board = {
        homeProvinceId: "p_home",
        provinces: [
          { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
          { id: "p_forage", x: 3, y: 2, terrain: "wood", node: "woodcut" },
          { id: "p_enemy", x: 5, y: 4, terrain: "hill", node: "hold", occupantRealmId: "rival" },
        ],
      };

      state.flags["marches_json"] = JSON.stringify([
        // Gather march to woodcut
        {
          id: "m_gather",
          realmId: "player",
          fromId: "p_home",
          toId: "p_forage",
          kind: "node",
          arrivesTick: 100,
        },
        // Military war march to rival hold
        {
          id: "m_war",
          realmId: "player",
          fromId: "p_home",
          toId: "p_enemy",
          kind: "hold",
          arrivesTick: 150,
          force: { knight: 5 },
        },
      ]);

      const routeG = createMockG();
      const pawnsG = createMockG();

      expect(() => {
        paintBoardMarches(routeG, pawnsG, state, 1.5);
      }).not.toThrow();

      expect(routeG.calls.length).toBeGreaterThan(10);
      expect(pawnsG.calls.length).toBeGreaterThan(20);
    });

    it("paints gather expeditions via paintBoardGathers using distinct cart & sack meeple", () => {
      const createMockG = () => {
        const calls: string[] = [];
        return {
          calls,
          clear: () => calls.push("clear"),
          ellipse: (...args: any[]) => calls.push(`ellipse`),
          rect: (...args: any[]) => calls.push(`rect`),
          circle: (...args: any[]) => calls.push(`circle`),
          poly: (...args: any[]) => calls.push(`poly`),
          moveTo: (...args: any[]) => calls.push(`moveTo`),
          lineTo: (...args: any[]) => calls.push(`lineTo`),
          fill: (...args: any[]) => calls.push(`fill`),
          stroke: (...args: any[]) => calls.push(`stroke`),
        } as any;
      };

      const state = createMockState();
      state.board = {
        homeProvinceId: "p_home",
        provinces: [
          { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
          { id: "p_quarry", x: 4, y: 2, terrain: "hill", node: "quarry" },
        ],
      };

      (state as any).gathers = [
        {
          id: "g_expedition",
          fromId: "p_home",
          toId: "p_quarry",
          node: "quarry",
          progress: 0.5,
        },
      ];

      const routeG = createMockG();
      const pawnsG = createMockG();

      expect(() => {
        paintBoardGathers(routeG, pawnsG, state, 2.0);
      }).not.toThrow();

      expect(routeG.calls.length).toBeGreaterThan(5);
      expect(pawnsG.calls.length).toBeGreaterThan(15);
    });
  });

  describe("realmTokenPalette and isNpcHoldProvince (Gemini Crowns lane)", () => {
    it("provides distinct heraldic crest palettes for all seeded NPC realms", () => {
      const iron = realmTokenPalette("rival");
      expect(iron.name).toBe("Iron March");
      expect(iron.pennantColor).toBe(0x991b1b);
      expect(iron.borderColor).toBe(0x71717a);
      expect(iron.glyph).toBe("⚔");

      const silk = realmTokenPalette("k_silk");
      expect(silk.name).toBe("Silk Coast");
      expect(silk.pennantColor).toBe(0x0f766e);
      expect(silk.accentColor).toBe(0xf1c40f);
      expect(silk.glyph).toBe("⚓");

      const ash = realmTokenPalette("k_ash");
      expect(ash.name).toBe("Ash Nomads");
      expect(ash.pennantColor).toBe(0xc2410c);
      expect(ash.glyph).toBe("▲");

      const veil = realmTokenPalette("k_veil");
      expect(veil.name).toBe("Veil Theocracy");
      expect(veil.pennantColor).toBe(0x7c3aed);
      expect(veil.glyph).toBe("✦");

      const glass = realmTokenPalette("k_glass");
      expect(glass.name).toBe("Glass Cities");
      expect(glass.glyph).toBe("◇");

      const frost = realmTokenPalette("k_frost");
      expect(frost.name).toBe("Frost Holds");
      expect(frost.glyph).toBe("❄");

      const tide = realmTokenPalette("k_tide");
      expect(tide.name).toBe("Tide Princes");
      expect(tide.glyph).toBe("≈");

      const ember = realmTokenPalette("k_ember");
      expect(ember.name).toBe("Ember Concord");
      expect(ember.glyph).toBe("☄");

      const bronze = realmTokenPalette("k_bronze");
      expect(bronze.name).toBe("Bronze League");
      expect(bronze.glyph).toBe("Ω");

      // Deterministic fallback for unknown / dynamically generated realms
      const custom = realmTokenPalette("k_custom_kingdom");
      expect(custom.realmId).toBe("k_custom_kingdom");
      expect(typeof custom.borderColor).toBe("number");
      expect(typeof custom.pennantColor).toBe("number");
    });

    it("correctly identifies NPC hold provinces vs outposts and player holds", () => {
      // Player home hold is not an NPC hold
      expect(isNpcHoldProvince({ node: "hold", occupantRealmId: "player" })).toBe(false);
      // Player outpost is not an NPC hold
      expect(isNpcHoldProvince({ node: "field", occupantRealmId: "player" })).toBe(false);
      // Unoccupied hold is not an NPC hold
      expect(isNpcHoldProvince({ node: "hold", occupantRealmId: null })).toBe(false);

      // Rival hold is an NPC hold
      expect(isNpcHoldProvince({ node: "hold", occupantRealmId: "rival" })).toBe(true);
      // Seeded NPC holds are NPC holds
      expect(isNpcHoldProvince({ node: "hold", occupantRealmId: "k_silk" })).toBe(true);
      expect(isNpcHoldProvince({ node: "hold", occupantRealmId: "k_ash" })).toBe(true);

      // NPC claimed outposts (not hold node) are not NPC holds
      expect(isNpcHoldProvince({ node: "woodcut", occupantRealmId: "k_silk" })).toBe(false);
      expect(isNpcHoldProvince({ node: "field", occupantRealmId: "k_frost" })).toBe(false);
    });
  });

  describe("culturePalette (Gemini Crowns lane)", () => {
    it("returns default art values for Crown Marches (western) or undefined", () => {
      const def = culturePalette(undefined);
      expect(def.id).toBe("western");
      expect(def.tabardHex).toBe("#1e40af");
      expect(def.timberHex).toBe("#5c3818");
      expect(def.stoneHex).toBe("#64748b");
      expect(def.tabard).toBe(0x1e40af);

      const west = culturePalette("western");
      expect(west.id).toBe("western");
      expect(west.tabardHex).toBe("#1e40af");
    });

    it("returns authentic culture palettes for Cedar Kin, Sand Banner, Wind Host, and Tide Clans", () => {
      const woodland = culturePalette("woodland");
      expect(woodland.id).toBe("woodland");
      expect(woodland.tabardHex).toBe("#14532d");
      expect(woodland.timberHex).toBe("#854d0e");
      expect(woodland.stoneHex).toBe("#78716c");
      expect(woodland.tabard).toBe(0x14532d);
      expect(woodland.timber).toBe(0x854d0e);
      expect(woodland.stone).toBe(0x78716c);

      const desert = culturePalette("desert");
      expect(desert.id).toBe("desert");
      expect(desert.tabardHex).toBe("#b45309");
      expect(desert.timberHex).toBe("#a16207");
      expect(desert.stoneHex).toBe("#d6c7a1");
      expect(desert.tabard).toBe(0xb45309);

      const steppe = culturePalette("steppe");
      expect(steppe.id).toBe("steppe");
      expect(steppe.tabardHex).toBe("#9f1239");
      expect(steppe.timberHex).toBe("#7c2d12");
      expect(steppe.stoneHex).toBe("#57534e");
      expect(steppe.tabard).toBe(0x9f1239);

      const tide = culturePalette("tide");
      expect(tide.id).toBe("tide");
      expect(tide.tabardHex).toBe("#0e7490");
      expect(tide.timberHex).toBe("#44403c");
      expect(tide.stoneHex).toBe("#94a3b8");
      expect(tide.tabard).toBe(0x0e7490);
    });

    it("resolves alias culture IDs (cedar, sand, islands) to canonical palettes", () => {
      const cedar = culturePalette("cedar");
      expect(cedar.tabardHex).toBe("#14532d");
      expect(cedar.timberHex).toBe("#854d0e");

      const sand = culturePalette("sand");
      expect(sand.tabardHex).toBe("#b45309");
      expect(sand.stoneHex).toBe("#d6c7a1");

      const islands = culturePalette("islands");
      expect(islands.tabardHex).toBe("#0e7490");
      expect(islands.timberHex).toBe("#44403c");
    });
  });

  describe("resolveCultureKit (Gemini Culture Kits lane)", () => {
    it("maps culture identifiers to the 5 canonical presentation kits", () => {
      expect(resolveCultureKit(undefined)).toBe("western");
      expect(resolveCultureKit("")).toBe("western");
      expect(resolveCultureKit("western")).toBe("western");

      expect(resolveCultureKit("cedar")).toBe("cedar");
      expect(resolveCultureKit("woodland")).toBe("cedar");
      expect(resolveCultureKit("  CEDAR  ")).toBe("cedar");

      expect(resolveCultureKit("sand")).toBe("sand");
      expect(resolveCultureKit("desert")).toBe("sand");

      expect(resolveCultureKit("steppe")).toBe("steppe");

      expect(resolveCultureKit("islands")).toBe("islands");
      expect(resolveCultureKit("tide")).toBe("islands");

      expect(resolveCultureKit("unknown_culture")).toBe("western");
    });
  });

  describe("drawIsometricBuilding and culture kits (Gemini Leftover Kits lane)", () => {
    function createMockGraphics() {
      const calls: { method: string; args: any[] }[] = [];
      const g: any = {
        calls,
        clear: () => { calls.push({ method: "clear", args: [] }); },
        poly: (...args: any[]) => { calls.push({ method: "poly", args }); },
        fill: (...args: any[]) => { calls.push({ method: "fill", args }); },
        stroke: (...args: any[]) => { calls.push({ method: "stroke", args }); },
        rect: (...args: any[]) => { calls.push({ method: "rect", args }); },
        circle: (...args: any[]) => { calls.push({ method: "circle", args }); },
        ellipse: (...args: any[]) => { calls.push({ method: "ellipse", args }); },
        moveTo: (...args: any[]) => { calls.push({ method: "moveTo", args }); },
        lineTo: (...args: any[]) => { calls.push({ method: "lineTo", args }); },
        quadraticCurveTo: (...args: any[]) => { calls.push({ method: "quadraticCurveTo", args }); },
      };
      return g;
    }

    const defaultVisuals: ThemeVisuals = getThemeVisuals("Spring", "none");
    const kits = ["western", "cedar", "sand", "steppe", "islands"] as const;

    it("renders all 21 BUILDING_TYPES IDs across all 5 culture kits without throwing", () => {
      const typeIds = Object.keys(BUILDING_TYPES);
      expect(typeIds.length).toBe(21);

      for (const typeId of typeIds) {
        for (const kit of kits) {
          const g = createMockGraphics();
          expect(() => {
            drawIsometricBuilding(g, typeId, 1, true, 0, defaultVisuals, 0, 0, undefined, kit);
          }).not.toThrow();
          expect(g.calls.length).toBeGreaterThan(0);
        }
      }
    });

    it("correctly aliases 'lumber' to 'lumber_camp' across all 5 culture kits", () => {
      for (const kit of kits) {
        const gCamp = createMockGraphics();
        const gAlias = createMockGraphics();

        drawIsometricBuilding(gCamp, "lumber_camp", 1, true, 0, defaultVisuals, 0, 0, undefined, kit);
        drawIsometricBuilding(gAlias, "lumber", 1, true, 0, defaultVisuals, 0, 0, undefined, kit);

        expect(gAlias.calls.length).toBeGreaterThan(0);
        expect(gAlias.calls.length).toEqual(gCamp.calls.length);
        expect(gAlias.calls).toEqual(gCamp.calls);
      }
    });

    it("renders dedicated infirmary building art", () => {
      const g = createMockGraphics();
      expect(() => {
        drawIsometricBuilding(g, "infirmary", 1, true, 0, defaultVisuals, 5, 5);
      }).not.toThrow();
      expect(g.calls.length).toBeGreaterThan(10);
      // Infirmary draws red cross / emblem
      const fills = g.calls.filter((c: any) => c.method === "fill");
      expect(fills.some((f: any) => f.args[0]?.color === 0xdc2626)).toBe(true);
    });

    it("renders bespoke silhouettes for gold_mine across cedar, sand, steppe, islands and western", () => {
      for (const kit of kits) {
        const g = createMockGraphics();
        expect(() => {
          drawIsometricBuilding(g, "gold_mine", 2, true, 0.5, defaultVisuals, 2, 2, undefined, kit);
        }).not.toThrow();
        expect(g.calls.length).toBeGreaterThan(5);
      }
    });

    it("renders bespoke silhouettes for market across cedar, sand, steppe, islands and western", () => {
      for (const kit of kits) {
        const g = createMockGraphics();
        expect(() => {
          drawIsometricBuilding(g, "market", 1, true, 0.2, defaultVisuals, 3, 3, undefined, kit);
        }).not.toThrow();
        expect(g.calls.length).toBeGreaterThan(5);
      }
    });

    it("handles building levels 1 through 5 and incomplete building states", () => {
      for (let lvl = 1; lvl <= 5; lvl++) {
        const g = createMockGraphics();
        drawIsometricBuilding(g, "keep", lvl, false, 0, defaultVisuals, 0, 0);
        expect(g.calls.length).toBeGreaterThan(0);
      }
    });

    it("handles rim fortress walls and gates with rim neighbors", () => {
      const neighbors: RimNeighbors = {
        hasPrev: true,
        hasNext: true,
        prevKind: "wall",
        nextKind: "gate",
      };

      // Walls on rim
      const gWallRim = createMockGraphics();
      drawIsometricBuilding(gWallRim, "walls", 1, true, 0, defaultVisuals, 0, 0, neighbors);
      expect(gWallRim.calls.length).toBeGreaterThan(0);

      // Walls interior
      const gWallInt = createMockGraphics();
      drawIsometricBuilding(gWallInt, "walls", 1, true, 0, defaultVisuals, 4, 4);
      expect(gWallInt.calls.length).toBeGreaterThan(0);

      // Gate on rim
      const gGateRim = createMockGraphics();
      drawIsometricBuilding(gGateRim, "gate", 1, true, 0, defaultVisuals, 15, 4, neighbors);
      expect(gGateRim.calls.length).toBeGreaterThan(0);

      // Gate interior
      const gGateInt = createMockGraphics();
      drawIsometricBuilding(gGateInt, "gate", 1, true, 0, defaultVisuals, 4, 4);
      expect(gGateInt.calls.length).toBeGreaterThan(0);
    });

    it("handles holiday visual decorations without throwing", () => {
      for (const holiday of ["halloween", "midwinter", "easter", "harvest", "midsummer"] as const) {
        const visuals = getThemeVisuals("Autumn", holiday);
        const g = createMockGraphics();
        drawIsometricBuilding(g, "farm", 1, true, 0, visuals, 2, 2);
        expect(g.calls.length).toBeGreaterThan(0);
      }
    });

    it("renders bespoke silhouettes for walls, gate, chapel, infirmary, siege_workshop, watchtower, barracks, stables, archery_range across all 5 culture kits without throwing", () => {
      const remainingBuildings = [
        "chapel",
        "infirmary",
        "siege_workshop",
        "watchtower",
        "barracks",
        "stables",
        "archery_range",
      ] as const;

      const neighbors: RimNeighbors = {
        hasPrev: true,
        hasNext: true,
        prevKind: "wall",
        nextKind: "gate",
      };

      for (const kit of kits) {
        // Interior and rim walls
        const gWallRim = createMockGraphics();
        expect(() => {
          drawIsometricBuilding(gWallRim, "walls", 1, true, 0, defaultVisuals, 0, 0, neighbors, kit);
        }).not.toThrow();
        expect(gWallRim.calls.length).toBeGreaterThan(0);

        const gWallInt = createMockGraphics();
        expect(() => {
          drawIsometricBuilding(gWallInt, "walls", 1, true, 0, defaultVisuals, 4, 4, undefined, kit);
        }).not.toThrow();
        expect(gWallInt.calls.length).toBeGreaterThan(0);

        // Interior and rim gates
        const gGateRim = createMockGraphics();
        expect(() => {
          drawIsometricBuilding(gGateRim, "gate", 1, true, 0, defaultVisuals, 15, 4, neighbors, kit);
        }).not.toThrow();
        expect(gGateRim.calls.length).toBeGreaterThan(0);

        const gGateInt = createMockGraphics();
        expect(() => {
          drawIsometricBuilding(gGateInt, "gate", 1, true, 0, defaultVisuals, 4, 4, undefined, kit);
        }).not.toThrow();
        expect(gGateInt.calls.length).toBeGreaterThan(0);

        // Each specialized hold building
        for (const bld of remainingBuildings) {
          const g = createMockGraphics();
          expect(() => {
            drawIsometricBuilding(g, bld, 1, true, 0.2, defaultVisuals, 5, 5, undefined, kit);
          }).not.toThrow();
          expect(g.calls.length).toBeGreaterThan(5);
        }
      }
    });
  });

  describe("unitPalette with culture kits", () => {
    it("preserves western default unit palettes when culture is undefined or western", () => {
      const defaultArcher = unitPalette("archer");
      const westernArcher = unitPalette("archer", "western");
      expect(defaultArcher.tabardColor).toBe(0x14532d);
      expect(westernArcher.tabardColor).toBe(0x14532d);

      const defaultSpear = unitPalette("spearman");
      const westernSpear = unitPalette("spearman", "western");
      expect(defaultSpear.tabardColor).toBe(0x1e40af);
      expect(westernSpear.tabardColor).toBe(0x1e40af);
    });

    it("adapts tabard and accent colors when non-western cultureId is provided", () => {
      const cedarSpear = unitPalette("spearman", "cedar");
      expect(cedarSpear.tabardColor).toBe(0x14532d); // Cedar green tabard

      const sandSpear = unitPalette("spearman", "sand");
      expect(sandSpear.tabardColor).toBe(0xb45309); // Sand amber tabard

      const steppeSpear = unitPalette("spearman", "steppe");
      expect(steppeSpear.tabardColor).toBe(0x9f1239); // Steppe crimson tabard

      const islandsSpear = unitPalette("spearman", "islands");
      expect(islandsSpear.tabardColor).toBe(0x0e7490); // Islands cyan/teal tabard
    });

    it("evaluates unitPalette across all 5 cultures for archer, skirmisher, cavalry, knight, siege, champion without throwing", () => {
      const types = ["archer", "skirmisher", "cavalry", "knight", "siege", "champion"] as const;
      const cults = ["western", "cedar", "sand", "steppe", "islands"] as const;
      for (const t of types) {
        for (const c of cults) {
          const pal = unitPalette(t, c);
          expect(pal.id).toBe(t);
          expect(typeof pal.tabardColor).toBe("number");
          expect(pal.tabardColor).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("terrainElevation, height faces, fog veil and miniature keeps (Lords Mobile overworld)", () => {
    function createMockGraphics() {
      const calls: { method: string; args: any[] }[] = [];
      const g: any = {
        calls,
        clear: () => { calls.push({ method: "clear", args: [] }); },
        poly: (...args: any[]) => { calls.push({ method: "poly", args }); },
        fill: (...args: any[]) => { calls.push({ method: "fill", args }); },
        stroke: (...args: any[]) => { calls.push({ method: "stroke", args }); },
        rect: (...args: any[]) => { calls.push({ method: "rect", args }); },
        circle: (...args: any[]) => { calls.push({ method: "circle", args }); },
        ellipse: (...args: any[]) => { calls.push({ method: "ellipse", args }); },
        moveTo: (...args: any[]) => { calls.push({ method: "moveTo", args }); },
        lineTo: (...args: any[]) => { calls.push({ method: "lineTo", args }); },
        bezierCurveTo: (...args: any[]) => { calls.push({ method: "bezierCurveTo", args }); },
        quadraticCurveTo: (...args: any[]) => { calls.push({ method: "quadraticCurveTo", args }); },
      };
      return g;
    }

    it("assigns distinct vertical elevations to all terrain types with peaks highest", () => {
      const peakElev = terrainElevation("peak");
      const hillElev = terrainElevation("hill");
      const wasteElev = terrainElevation("waste");
      const woodElev = terrainElevation("wood");
      const plainElev = terrainElevation("plain");
      const shoreElev = terrainElevation("shore");

      expect(peakElev).toBeGreaterThan(hillElev);
      expect(hillElev).toBeGreaterThan(plainElev);
      expect(plainElev).toBeGreaterThan(shoreElev);
      expect(wasteElev).toBeGreaterThan(plainElev);
      expect(woodElev).toBeGreaterThan(shoreElev);
      expect(shoreElev).toBeGreaterThan(0);
    });

    it("paints 3D height faces for all 6 terrain types without throwing", () => {
      const terrains = ["peak", "hill", "waste", "wood", "plain", "shore"] as const;
      const b = provinceTokenBounds(2, 2);

      for (const t of terrains) {
        const pal = terrainChipPalette(t);
        const g = createMockGraphics();
        expect(() => {
          paintTileHeightFace(g, b, t, pal, 1.0);
        }).not.toThrow();
        expect(g.calls.length).toBeGreaterThan(5);
      }
    });

    it("paints fog height veil for unseen provinces without throwing", () => {
      const b = provinceTokenBounds(3, 3);
      const prov = { id: "p1", x: 3, y: 3, terrain: "wood" as const, node: "none" as const };
      const g = createMockGraphics();

      expect(() => {
        paintFogHeightVeil(g, b, prov, 0.5);
      }).not.toThrow();
      expect(g.calls.length).toBeGreaterThan(10);
    });

    it("renders miniature pixel keeps across all culture kits, rival iron keep, and player home without throwing", () => {
      const kits = ["western", "cedar", "sand", "steppe", "islands"] as const;

      for (const kit of kits) {
        const g = createMockGraphics();
        expect(() => {
          drawMiniatureKeep(g, 50, 50, kit, undefined, false, 0);
        }).not.toThrow();
        expect(g.calls.length).toBeGreaterThan(5);
      }

      // Player home keep
      const gHome = createMockGraphics();
      expect(() => {
        drawMiniatureKeep(gHome, 50, 50, "western", undefined, true, 1.2);
      }).not.toThrow();
      expect(gHome.calls.length).toBeGreaterThan(5);

      // Rival (Iron March) keep
      const gRival = createMockGraphics();
      const rivalPal = realmTokenPalette("rival");
      expect(() => {
        drawMiniatureKeep(gRival, 50, 50, "western", rivalPal, false, 2.0);
      }).not.toThrow();
      expect(gRival.calls.length).toBeGreaterThan(5);

      // Seeded NPC keeps with heraldic escutcheon shields
      for (const realmId of ["k_silk", "k_ash", "k_tide", "k_veil", "k_glass", "k_frost"] as const) {
        const gNpc = createMockGraphics();
        const pal = realmTokenPalette(realmId);
        expect(() => {
          drawMiniatureKeep(gNpc, 50, 50, "western", pal, false, 0.5);
        }).not.toThrow();
        expect(gNpc.calls.length).toBeGreaterThan(8);
      }
    });

    it("paints board marches with distinct unit meeples, pedestals, and route trails without throwing", () => {
      const state = createMockState();
      state.board = {
        homeProvinceId: "p0",
        provinces: [
          { id: "p0", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
          { id: "p1", x: 4, y: 3, terrain: "wood", node: "none" },
          { id: "p2", x: 6, y: 4, terrain: "peak", node: "hold", occupantRealmId: "rival" },
        ],
      };

      const unitTypes = ["archer", "spearman", "skirmisher", "cavalry", "knight", "siege", "champion", "militia"] as const;

      for (const u of unitTypes) {
        state.flags["marches_json"] = JSON.stringify([
          {
            id: `m_${u}`,
            realmId: "player",
            fromId: "p0",
            toId: "p1",
            arrivesTick: 100,
            force: { [u]: 5 },
          },
        ]);

        const routeG = createMockGraphics();
        const pawnsG = createMockGraphics();

        expect(() => {
          paintBoardMarches(routeG, pawnsG, state, 1.5);
        }).not.toThrow();

        expect(routeG.calls.length).toBeGreaterThan(5);
        expect(pawnsG.calls.length).toBeGreaterThan(10);
      }

      // Hostile march (rival Iron March)
      state.flags["marches_json"] = JSON.stringify([
        {
          id: "m_hostile",
          realmId: "rival",
          fromId: "p2",
          toId: "p0",
          arrivesTick: 120,
          force: { knight: 10 },
        },
      ]);

      const hRouteG = createMockGraphics();
      const hPawnsG = createMockGraphics();

      expect(() => {
        paintBoardMarches(hRouteG, hPawnsG, state, 2.0);
      }).not.toThrow();

      expect(hRouteG.calls.length).toBeGreaterThan(5);
      expect(hPawnsG.calls.length).toBeGreaterThan(10);
    });

    it("paints board provinces with keeps and outposts on diamond plateaus without throwing", () => {
      const state = createMockState();
      state.board = {
        homeProvinceId: "p_home",
        provinces: [
          { id: "p_home", x: 0, y: 0, terrain: "plain", node: "hold", occupantRealmId: "player" },
          { id: "p_outpost", x: 1, y: 0, terrain: "wood", node: "field", occupantRealmId: "player" },
          { id: "p_npc_hold", x: 2, y: 0, terrain: "shore", node: "hold", occupantRealmId: "k_silk" },
          { id: "p_npc_outpost", x: 3, y: 0, terrain: "hill", node: "quarry", occupantRealmId: "k_ash" },
          { id: "p_unseen", x: 4, y: 0, terrain: "waste", node: "none" },
        ],
      };
      // Mark seen provinces (unseen is p_unseen)
      state.flags = {
        "seen:p_home": true,
        "seen:p_outpost": true,
        "seen:p_npc_hold": true,
        "seen:p_npc_outpost": true,
      };

      const g = createMockGraphics();
      expect(() => {
        paintBoardProvinces(g, state, 0);
      }).not.toThrow();
      expect(g.calls.length).toBeGreaterThan(20);
    });

    it("resolves node stock information and clamps ratio properly", () => {
      const state = createMockState();
      state.board = {
        homeProvinceId: "p_home",
        provinces: [
          { id: "p_wood", x: 1, y: 0, terrain: "wood", node: "woodcut" },
          { id: "p_stone", x: 2, y: 0, terrain: "hill", node: "quarry" },
          { id: "p_food", x: 3, y: 0, terrain: "plain", node: "field" },
          { id: "p_open", x: 4, y: 0, terrain: "plain", node: "none" },
        ],
      };
      state.flags = {};

      // Fresh nodes default to full capacity (ratio = 1)
      const woodInfo = getNodeStockInfo(state, "p_wood", "woodcut");
      expect(woodInfo.max).toBe(120);
      expect(woodInfo.stock).toBe(120);
      expect(woodInfo.ratio).toBe(1);

      const stoneInfo = getNodeStockInfo(state, "p_stone", "quarry");
      expect(stoneInfo.max).toBe(90);
      expect(stoneInfo.stock).toBe(90);
      expect(stoneInfo.ratio).toBe(1);

      const foodInfo = getNodeStockInfo(state, "p_food", "field");
      expect(foodInfo.max).toBe(160);
      expect(foodInfo.stock).toBe(160);
      expect(foodInfo.ratio).toBe(1);

      // Partially drained nodes
      state.flags["node_stock_p_wood"] = 60;
      expect(getNodeStockInfo(state, "p_wood", "woodcut").ratio).toBe(0.5);

      state.flags["node_stock_p_stone"] = 18;
      expect(getNodeStockInfo(state, "p_stone", "quarry").ratio).toBe(0.2);

      // Depleted nodes (0 stock)
      state.flags["node_stock_p_food"] = 0;
      const depletedFood = getNodeStockInfo(state, "p_food", "field");
      expect(depletedFood.stock).toBe(0);
      expect(depletedFood.ratio).toBe(0);

      // Clamping bounds
      state.flags["node_stock_p_wood"] = -10;
      expect(getNodeStockInfo(state, "p_wood", "woodcut").ratio).toBe(0);

      state.flags["node_stock_p_wood"] = 500;
      expect(getNodeStockInfo(state, "p_wood", "woodcut").ratio).toBe(1);

      // Non-gather node returns ratio 1
      expect(getNodeStockInfo(state, "p_open", "none").ratio).toBe(1);
    });

    it("draws small stock piles that read emptier across all 4 volume tiers", () => {
      const nodes = ["woodcut", "quarry", "field", "ruins"] as const;
      const ratios = [1.0, 0.5, 0.2, 0.0];

      for (const node of nodes) {
        for (const ratio of ratios) {
          const g = createMockGraphics();
          expect(() => {
            drawNodeStockPile(g, 100, 100, node, ratio, 0);
          }).not.toThrow();
          expect(g.calls.length).toBeGreaterThanOrEqual(5);
        }
      }

      // Verify that full piles have more drawing calls than depleted/empty piles
      for (const node of ["woodcut", "quarry", "field"] as const) {
        const fullG = createMockGraphics();
        drawNodeStockPile(fullG, 100, 100, node, 1.0, 0);

        const emptyG = createMockGraphics();
        drawNodeStockPile(emptyG, 100, 100, node, 0.0, 0);

        // Full stock pile has more logs / blocks / sacks drawn than empty skid/gravel bed
        expect(fullG.calls.length).toBeGreaterThan(emptyG.calls.length);
      }
    });

    it("draws complete resource nodes with station landmark and dynamic stock pile", () => {
      for (const node of ["woodcut", "quarry", "field", "ruins"] as const) {
        const g = createMockGraphics();
        expect(() => {
          drawResourceNode(g, 100, 100, node, 0.8, 1.5);
        }).not.toThrow();
        expect(g.calls.length).toBeGreaterThan(15);
      }
    });

    it("paints board provinces with active resource nodes at full and depleted stock", () => {
      const state = createMockState();
      state.board = {
        homeProvinceId: "p_home",
        provinces: [
          { id: "p_home", x: 0, y: 0, terrain: "plain", node: "hold", occupantRealmId: "player" },
          { id: "p_wood", x: 1, y: 0, terrain: "wood", node: "woodcut" },
          { id: "p_stone", x: 2, y: 0, terrain: "hill", node: "quarry" },
          { id: "p_field", x: 3, y: 0, terrain: "plain", node: "field" },
          { id: "p_ruins", x: 4, y: 0, terrain: "waste", node: "ruins" },
        ],
      };
      state.flags = {
        "seen:p_home": true,
        "seen:p_wood": true,
        "seen:p_stone": true,
        "seen:p_field": true,
        "seen:p_ruins": true,
        "node_stock_p_wood": 120, // Full wood
        "node_stock_p_stone": 0,   // Dry stone
        "node_stock_p_field": 32,  // Low food
      };

      const g = createMockGraphics();
      expect(() => {
        paintBoardProvinces(g, state, 0.5);
      }).not.toThrow();
      expect(g.calls.length).toBeGreaterThan(50);
    });

    it("identifies scout columns via isScoutMarch and separates from gather/war marches", () => {
      const state = createMockState();
      state.board = {
        homeProvinceId: "p_home",
        provinces: [
          { id: "p_home", x: 0, y: 0, terrain: "plain", node: "hold", occupantRealmId: "player" },
          { id: "p_wood", x: 1, y: 0, terrain: "wood", node: "woodcut" },
          { id: "p_fog", x: 2, y: 0, terrain: "peak", node: "none" },
          { id: "p_camp", x: 3, y: 0, terrain: "waste", node: "camp" },
        ],
      };

      // Scout marches with explicit purpose or scout id
      expect(isScoutMarch({ purpose: "scout", toId: "p_fog" })).toBe(true);
      expect(isScoutMarch({ id: "m_scout_12_p_fog", kind: "node", toId: "p_fog" })).toBe(true);
      expect(isScoutMarch({ id: "m_scout_45_p_wood", kind: "node", purpose: "scout", toId: "p_wood" })).toBe(true);

      // Non-scout marches
      expect(isScoutMarch({ kind: "node", toId: "p_wood" })).toBe(false);
      expect(isScoutMarch({ kind: "camp", toId: "p_camp", purpose: "raid" })).toBe(false);
      expect(isScoutMarch(null)).toBe(false);
      expect(isScoutMarch({})).toBe(false);

      // Crucial: scout marches targeting a node province are NOT gather marches
      const scoutMarchOnNode = { id: "m_scout_10_p_wood", kind: "node", purpose: "scout", toId: "p_wood" };
      expect(isScoutMarch(scoutMarchOnNode)).toBe(true);
      expect(isGatherMarch(scoutMarchOnNode, state)).toBe(false);

      // Standard gather march targeting a node province IS a gather march
      const gatherMarch = { id: "m_gather_10", kind: "node", purpose: "gather", toId: "p_wood" };
      expect(isScoutMarch(gatherMarch)).toBe(false);
      expect(isGatherMarch(gatherMarch, state)).toBe(true);
    });

    it("draws 2-3 frame pixel scout column meeple (hooded cowl / billowing cloak / brass spyglass) across frames, facings, and cultures", () => {
      const frames: (0 | 1 | 2)[] = [0, 1, 2];
      const facings = [1, -1];
      const kits = ["western", "cedar", "sand", "steppe", "islands"] as const;

      for (const kit of kits) {
        const cult = culturePalette(kit);
        for (const frame of frames) {
          for (const facing of facings) {
            const g = createMockGraphics();
            expect(() => {
              drawScoutColumnMeeple(
                g,
                100,
                100,
                facing,
                frame,
                frame === 0 ? 0 : 2,
                kit,
                cult,
                1.5,
                0.65
              );
            }).not.toThrow();
            expect(g.calls.length).toBeGreaterThanOrEqual(20);
          }
        }
      }

      // Progress variation (0.1, 0.5, 0.9)
      for (const progress of [0.1, 0.5, 0.9]) {
        const g = createMockGraphics();
        drawScoutColumnMeeple(g, 100, 100, 1, 1, 2, "western", culturePalette("western"), 0, progress);
        expect(g.calls.length).toBeGreaterThanOrEqual(20);
      }
    });

    it("paints board marches with scout reconnaissance columns, cyan stealth trails, and compass targets", () => {
      const state = createMockState();
      state.board = {
        homeProvinceId: "p_home",
        provinces: [
          { id: "p_home", x: 0, y: 0, terrain: "plain", node: "hold", occupantRealmId: "player" },
          { id: "p_scout_dest", x: 3, y: 1, terrain: "peak", node: "none" },
          { id: "p_gather_dest", x: 1, y: 2, terrain: "wood", node: "woodcut" },
          { id: "p_war_dest", x: 4, y: 2, terrain: "waste", node: "camp" },
        ],
      };

      state.flags = {
        marches_json: JSON.stringify([
          {
            id: "m_scout_100",
            realmId: "player",
            fromId: "p_home",
            toId: "p_scout_dest",
            arrivesTick: 150,
            kind: "node",
            levy: 1,
            purpose: "scout",
          },
          {
            id: "m_gather_101",
            realmId: "player",
            fromId: "p_home",
            toId: "p_gather_dest",
            arrivesTick: 140,
            kind: "node",
            levy: 5,
            purpose: "gather",
          },
          {
            id: "m_war_102",
            realmId: "player",
            fromId: "p_home",
            toId: "p_war_dest",
            arrivesTick: 160,
            kind: "camp",
            levy: 20,
            purpose: "raid",
          },
        ]),
      };

      const routeG = createMockGraphics();
      const pawnsG = createMockGraphics();

      expect(() => {
        paintBoardMarches(routeG, pawnsG, state, 0.5);
      }).not.toThrow();

      // Route trail includes all 3 distinct trails (cyan recon, emerald harvest, amber war)
      expect(routeG.calls.length).toBeGreaterThan(30);
      // Pawns include all 3 distinct meeples (scout cloak/spy, gather cart/sack/mule, war soldier on pedestal)
      expect(pawnsG.calls.length).toBeGreaterThan(40);
    });
  });
});


