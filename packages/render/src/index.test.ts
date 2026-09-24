import { describe, it, expect } from "vitest";
import {
  roleForCitizenJob,
  toolForCitizen,
  resolveWalkerTool,
  createWalker,
  drawWalkerFrame,
  pickDestination,
  isFoodStoresEmptyOrLow,
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
  isGarrisonMarch,
  getPostedGarrison,
  drawGarrisonMeeple,
  isIncomingMarch,
  drawRedWarbandMeeple,
  drawWarbandMeeple,
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
  drawCrackedStoneOverlay,
  buildingHeight,
  drawWatchtowerScaffolding,
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

    it("renders a closed 48-tile fortress perimeter ring with continuous walls, 4 corner bastions, and a gatehouse across all 48 tiles", () => {
      // 48 rim tiles: 47 walls + 1 gate at (0, 5)
      const rimTiles: { x: number; y: number; kind: "wall" | "gate" }[] = [];
      for (let i = 0; i < 48; i++) {
        const pt = getRimTileAt(i);
        const isGate = pt.x === 0 && pt.y === 5;
        rimTiles.push({ x: pt.x, y: pt.y, kind: isGate ? "gate" : "wall" });
      }
      expect(rimTiles.length).toBe(48);

      // Verify the 4 corners exist at exact indices
      expect(rimWalkIndex(0, 0)).toBe(0);
      expect(rimWalkIndex(15, 0)).toBe(15);
      expect(rimWalkIndex(15, 9)).toBe(24);
      expect(rimWalkIndex(0, 9)).toBe(39);

      // Render each tile in the closed ring with full neighbors (hasPrev=true, hasNext=true)
      for (let i = 0; i < 48; i++) {
        const tile = rimTiles[i];
        const prevTile = rimTiles[(i - 1 + 48) % 48];
        const nextTile = rimTiles[(i + 1) % 48];
        const neighbors: RimNeighbors = {
          hasPrev: true,
          hasNext: true,
          prevKind: prevTile.kind,
          nextKind: nextTile.kind,
        };

        const g = createMockGraphics();
        expect(() => {
          drawIsometricBuilding(
            g,
            tile.kind === "gate" ? "gate" : "walls",
            1,
            true,
            0.5,
            defaultVisuals,
            tile.x,
            tile.y,
            neighbors
          );
        }).not.toThrow();

        // Must produce substantive visual geometry
        expect(g.calls.length).toBeGreaterThan(10);
      }
    });

    it("supports partial runs: starting wall, ending wall, and isolated wall bastion", () => {
      // Starting wall (hasPrev: false, hasNext: true)
      const gStart = createMockGraphics();
      const startNeighbors: RimNeighbors = { hasPrev: false, hasNext: true, nextKind: "wall" };
      drawIsometricBuilding(gStart, "walls", 1, true, 0, defaultVisuals, 3, 0, startNeighbors);
      expect(gStart.calls.length).toBeGreaterThan(5);

      // Ending wall (hasPrev: true, hasNext: false)
      const gEnd = createMockGraphics();
      const endNeighbors: RimNeighbors = { hasPrev: true, hasNext: false, prevKind: "wall" };
      drawIsometricBuilding(gEnd, "walls", 1, true, 0, defaultVisuals, 3, 0, endNeighbors);
      expect(gEnd.calls.length).toBeGreaterThan(5);

      // Isolated wall bastion (hasPrev: false, hasNext: false)
      const gIso = createMockGraphics();
      const isoNeighbors: RimNeighbors = { hasPrev: false, hasNext: false };
      drawIsometricBuilding(gIso, "walls", 1, true, 0, defaultVisuals, 3, 0, isoNeighbors);
      expect(gIso.calls.length).toBeGreaterThan(5);
    });

    it("renders gatehouse curtain wings seamlessly connecting to adjacent walls on all 4 rim edges", () => {
      const edgeGatePositions = [
        { x: 0, y: 5, edge: "left" },
        { x: 15, y: 4, edge: "right" },
        { x: 8, y: 0, edge: "top" },
        { x: 8, y: 9, edge: "bottom" },
      ];

      for (const pos of edgeGatePositions) {
        const gBoth = createMockGraphics();
        const neighborsBoth: RimNeighbors = {
          hasPrev: true,
          hasNext: true,
          prevKind: "wall",
          nextKind: "wall",
        };
        drawIsometricBuilding(gBoth, "gate", 1, true, 0.2, defaultVisuals, pos.x, pos.y, neighborsBoth);
        expect(gBoth.calls.length).toBeGreaterThan(15);

        // One-sided connection (prev only)
        const gLeftOnly = createMockGraphics();
        drawIsometricBuilding(gLeftOnly, "gate", 1, true, 0.2, defaultVisuals, pos.x, pos.y, {
          hasPrev: true,
          hasNext: false,
          prevKind: "wall",
        });
        expect(gLeftOnly.calls.length).toBeGreaterThan(10);

        // One-sided connection (next only)
        const gRightOnly = createMockGraphics();
        drawIsometricBuilding(gRightOnly, "gate", 1, true, 0.2, defaultVisuals, pos.x, pos.y, {
          hasPrev: false,
          hasNext: true,
          nextKind: "wall",
        });
        expect(gRightOnly.calls.length).toBeGreaterThan(10);
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

  describe("posted garrisons and garrison meeples", () => {
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

    it("resolves posted garrison status via getPostedGarrison", () => {
      expect(getPostedGarrison(null, "p_flag")).toEqual({ posted: false, power: 0 });

      const state = createMockState();
      state.flags = {};
      expect(getPostedGarrison(state, "p_flag")).toEqual({ posted: false, power: 0 });

      state.flags["garrisons_json"] = JSON.stringify([
        { provinceId: "p_flag", force: { spearman: 4, archer: 2 } },
      ]);
      const res = getPostedGarrison(state, "p_flag");
      expect(res.posted).toBe(true);
      expect(res.power).toBeGreaterThan(0);
      expect(res.force).toEqual({ spearman: 4, archer: 2 });

      // Unrelated province remains unposted
      expect(getPostedGarrison(state, "p_other")).toEqual({ posted: false, power: 0 });
    });

    it("identifies garrison deployment and recall marches via isGarrisonMarch", () => {
      expect(isGarrisonMarch(null)).toBe(false);
      expect(isGarrisonMarch({})).toBe(false);
      expect(isGarrisonMarch({ purpose: "scout" })).toBe(false);
      expect(isGarrisonMarch({ purpose: "gather" })).toBe(false);
      expect(isGarrisonMarch({ purpose: "raid" })).toBe(false);

      expect(isGarrisonMarch({ purpose: "garrison" })).toBe(true);
      expect(isGarrisonMarch({ purpose: "garrison_home" })).toBe(true);
      expect(isGarrisonMarch({ id: "m_garrison_123" })).toBe(true);
    });

    it("draws distinct pavilion tent and banner meeple across culture kits, powers, and frames", () => {
      const kits = ["western", "cedar", "sand", "steppe", "islands"] as const;
      const powers = [0, 15, 45];
      const frames: (0 | 1 | 2)[] = [0, 1, 2];
      const facings = [1, -1];

      for (const kit of kits) {
        const cult = culturePalette(kit);
        for (const power of powers) {
          const g = createMockGraphics();
          drawGarrisonMeeple(g, 100, 100, kit, cult, power, 0.5);
          expect(g.calls.length).toBeGreaterThan(25);
        }
      }

      // Test animated marching column mode
      for (const frame of frames) {
        for (const facing of facings) {
          const g = createMockGraphics();
          drawGarrisonMeeple(g, 120, 140, "western", culturePalette("western"), 20, 1.2, {
            facing,
            frame,
            isColumn: true,
          });
          expect(g.calls.length).toBeGreaterThan(25);
        }
      }
    });

    it("paints board provinces displaying distinct tent + banner meeple for posted garrison vs boundary stake for unguarded", () => {
      const state = createMockState();
      state.board = {
        homeProvinceId: "p_home",
        provinces: [
          { id: "p_home", x: 0, y: 0, terrain: "plain", node: "hold", occupantRealmId: "player" },
          { id: "p_unguarded", x: 1, y: 0, terrain: "wood", node: "woodcut", occupantRealmId: "player" },
          { id: "p_guarded", x: 2, y: 0, terrain: "hill", node: "quarry", occupantRealmId: "player" },
        ],
      };
      state.flags = {
        "seen:p_home": true,
        "seen:p_unguarded": true,
        "seen:p_guarded": true,
        "garrisons_json": JSON.stringify([
          { provinceId: "p_guarded", force: { spearman: 6, knight: 2 } },
        ]),
      };

      const g = createMockGraphics();
      expect(() => {
        paintBoardProvinces(g, state, 0.4);
      }).not.toThrow();

      // Ensure graphics rendered for all tiles including guarded encampment and unguarded boundary
      expect(g.calls.length).toBeGreaterThan(30);
    });

    it("paints board marches rendering distinct route trails and meeples for garrison, scout, gather, and war", () => {
      const state = createMockState();
      state.board = {
        homeProvinceId: "p_home",
        provinces: [
          { id: "p_home", x: 0, y: 0, terrain: "plain", node: "hold", occupantRealmId: "player" },
          { id: "p_garrison_dest", x: 1, y: 1, terrain: "hill", node: "none", occupantRealmId: "player" },
          { id: "p_scout_dest", x: 2, y: 0, terrain: "waste", node: "none" },
          { id: "p_gather_dest", x: 0, y: 2, terrain: "wood", node: "woodcut" },
          { id: "p_war_dest", x: 3, y: 2, terrain: "shore", node: "hold", occupantRealmId: "rival" },
        ],
      };
      state.flags = {
        "seen:p_home": true,
        "seen:p_garrison_dest": true,
        "seen:p_gather_dest": true,
        "marches_json": JSON.stringify([
          {
            id: "m_garrison_1",
            realmId: "player",
            fromId: "p_home",
            toId: "p_garrison_dest",
            arrivesTick: 120,
            purpose: "garrison",
            force: { spearman: 5 },
          },
          {
            id: "m_scout_2",
            realmId: "player",
            fromId: "p_home",
            toId: "p_scout_dest",
            arrivesTick: 130,
            purpose: "scout",
          },
          {
            id: "m_gather_3",
            realmId: "player",
            fromId: "p_home",
            toId: "p_gather_dest",
            arrivesTick: 140,
            purpose: "gather",
          },
          {
            id: "m_war_4",
            realmId: "player",
            fromId: "p_home",
            toId: "p_war_dest",
            arrivesTick: 150,
            purpose: "raid",
            force: { knight: 3 },
          },
        ]),
      };

      const routeG = createMockGraphics();
      const pawnsG = createMockGraphics();

      expect(() => {
        paintBoardMarches(routeG, pawnsG, state, 0.7);
      }).not.toThrow();

      // All 4 march types render route indicators and distinct animated meeples
      expect(routeG.calls.length).toBeGreaterThan(40);
      expect(pawnsG.calls.length).toBeGreaterThan(50);
    });
  });

  describe("hostile incoming marches and red warband meeple", () => {
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

    it("identifies hostile incoming marches via isIncomingMarch and excludes player, scout, gather, and garrison", () => {
      expect(isIncomingMarch(null)).toBe(false);
      expect(isIncomingMarch(undefined)).toBe(false);

      // Player marches are never hostile incoming
      expect(isIncomingMarch({ realmId: "player", purpose: "raid" })).toBe(false);
      expect(isIncomingMarch({ realmId: "player", purpose: "scout" })).toBe(false);
      expect(isIncomingMarch({ realmId: "player", purpose: "gather" })).toBe(false);
      expect(isIncomingMarch({ realmId: "player", purpose: "garrison" })).toBe(false);

      // Scout marches are not warbands
      expect(isIncomingMarch({ realmId: "k_silk", purpose: "scout" })).toBe(false);
      expect(isIncomingMarch({ realmId: "k_silk", id: "m_scout_99" })).toBe(false);

      // Gather marches are not warbands
      expect(isIncomingMarch({ realmId: "k_silk", purpose: "gather" })).toBe(false);

      // Garrison dispatches/recalls are not warbands
      expect(isIncomingMarch({ realmId: "k_silk", purpose: "garrison" })).toBe(false);
      expect(isIncomingMarch({ realmId: "k_silk", purpose: "garrison_home" })).toBe(false);

      // Hostile warbands / raids
      expect(isIncomingMarch({ realmId: "k_silk", purpose: "raid" })).toBe(true);
      expect(isIncomingMarch({ realmId: "rival" })).toBe(true);
      expect(isIncomingMarch({ realmId: "bandit" })).toBe(true);
    });

    it("draws distinct red warband meeple across frames, facings, and rival realms", () => {
      expect(drawWarbandMeeple).toBe(drawRedWarbandMeeple);

      const frames: (0 | 1 | 2)[] = [0, 1, 2];
      const facings = [1, -1];
      const realms = ["k_silk", "k_ash", "k_frost", "k_tide", undefined];
      const powers = [0, 15, 60];

      for (const realmId of realms) {
        for (const power of powers) {
          const g = createMockGraphics();
          drawRedWarbandMeeple(g, 100, 100, 1, 0, 0, realmId, 0.5, power);
          expect(g.calls.length).toBeGreaterThan(25);
        }
      }

      for (const frame of frames) {
        for (const facing of facings) {
          const g = createMockGraphics();
          drawRedWarbandMeeple(g, 120, 120, facing, frame, frame === 0 ? 0 : 2, "k_silk", 1.2, 25);
          expect(g.calls.length).toBeGreaterThan(25);
        }
      }
    });

    it("paints board marches rendering red warband meeple for hostile incoming marches distinct from all other march types", () => {
      const state = createMockState();
      state.board = {
        homeProvinceId: "p_home",
        provinces: [
          { id: "p_home", x: 0, y: 0, terrain: "plain", node: "hold", occupantRealmId: "player" },
          { id: "p_outpost", x: 1, y: 0, terrain: "wood", node: "woodcut", occupantRealmId: "player" },
          { id: "p_enemy_base", x: 4, y: 2, terrain: "hill", node: "hold", occupantRealmId: "k_silk" },
        ],
      };
      state.flags = {
        "seen:p_home": true,
        "seen:p_outpost": true,
        "marches_json": JSON.stringify([
          // Hostile incoming raid targeting player home
          {
            id: "m_incoming_raid",
            realmId: "k_silk",
            fromId: "p_enemy_base",
            toId: "p_home",
            arrivesTick: 150,
            purpose: "raid",
            levy: 15,
            force: { spearman: 10, knight: 5 },
          },
          // Player war march targeting enemy base
          {
            id: "m_player_war",
            realmId: "player",
            fromId: "p_home",
            toId: "p_enemy_base",
            arrivesTick: 160,
            purpose: "raid",
            force: { knight: 5 },
          },
        ]),
      };

      const routeG = createMockGraphics();
      const pawnsG = createMockGraphics();

      expect(() => {
        paintBoardMarches(routeG, pawnsG, state, 1.0);
      }).not.toThrow();

      // Renders both hostile crimson warband route & player amber route
      expect(routeG.calls.length).toBeGreaterThan(20);
      // Renders red warband meeple with horned helm and player knight
      expect(pawnsG.calls.length).toBeGreaterThan(30);
    });
  });

  describe("Scarred / Knocked-out Buildings & Cracked Stone Overlay (Gemini Scar Lane)", () => {
    function createMockGraphics() {
      const calls: { method: string; args: any[] }[] = [];
      const mock: any = {
        calls,
        clear: () => { calls.push({ method: "clear", args: [] }); return mock; },
        poly: (...args: any[]) => { calls.push({ method: "poly", args }); return mock; },
        fill: (...args: any[]) => { calls.push({ method: "fill", args }); return mock; },
        stroke: (...args: any[]) => { calls.push({ method: "stroke", args }); return mock; },
        moveTo: (...args: any[]) => { calls.push({ method: "moveTo", args }); return mock; },
        lineTo: (...args: any[]) => { calls.push({ method: "lineTo", args }); return mock; },
        circle: (...args: any[]) => { calls.push({ method: "circle", args }); return mock; },
        rect: (...args: any[]) => { calls.push({ method: "rect", args }); return mock; },
        ellipse: (...args: any[]) => { calls.push({ method: "ellipse", args }); return mock; },
        roundRect: (...args: any[]) => { calls.push({ method: "roundRect", args }); return mock; },
        quadraticCurveTo: (...args: any[]) => { calls.push({ method: "quadraticCurveTo", args }); return mock; },
      };
      return mock;
    }

    const defaultVisuals: ThemeVisuals = {
      groundLight: 0x2d4a22,
      groundDark: 0x22381a,
      gridLine: 0x3d5e30,
      wallColor: 0x64748b,
      wallTrim: 0x475569,
      parapet: 0x334155,
      decorations: "none",
      season: "summer",
      seasonName: "Verdant Sun",
    };

    it("resolves correct buildingHeight across all building types and levels", () => {
      expect(buildingHeight("watchtower", 1)).toBe(34);
      expect(buildingHeight("watchtower", 3)).toBe(34 + 6);
      expect(buildingHeight("keep", 1)).toBe(30);
      expect(buildingHeight("keep", 2)).toBe(33);
      expect(buildingHeight("academy", 1)).toBe(26);
      expect(buildingHeight("chapel", 1)).toBe(26);
      expect(buildingHeight("granary", 1)).toBe(24);
      expect(buildingHeight("barracks", 1)).toBe(24);
      expect(buildingHeight("gate", 1)).toBe(24);
      expect(buildingHeight("infirmary", 1)).toBe(20);
      expect(buildingHeight("siege_workshop", 1)).toBe(20);
      expect(buildingHeight("walls", 1)).toBe(20);
      expect(buildingHeight("farm", 1)).toBe(18);
      expect(buildingHeight("gold_mine", 1)).toBe(18);
      expect(buildingHeight("cottage", 1)).toBe(16);
      expect(buildingHeight("quarry", 1)).toBe(14);
    });

    it("draws cracked stone overlay across all culture kits with fractures, craters and rubble", () => {
      const kits = ["western", "sand", "steppe", "cedar", "islands"] as const;
      for (const kit of kits) {
        const g = createMockGraphics();
        expect(() => {
          drawCrackedStoneOverlay(g, "farm", 20, 2, 3, kit, 1);
        }).not.toThrow();

        // Must produce strokes for fault lines and stress cracks
        const strokes = g.calls.filter((c) => c.method === "stroke");
        expect(strokes.length).toBeGreaterThanOrEqual(4);

        // Must produce fills for impact crater scorch and fallen rubble masonry blocks
        const fills = g.calls.filter((c) => c.method === "fill");
        expect(fills.length).toBeGreaterThanOrEqual(5);

        // Must produce polygons for faceted 3D fallen stone blocks
        const polys = g.calls.filter((c) => c.method === "poly");
        expect(polys.length).toBeGreaterThanOrEqual(4);

        // Must produce ellipses for impact crater and cast ground rubble shadows
        const ellipses = g.calls.filter((c) => c.method === "ellipse");
        expect(ellipses.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("seeds deterministic unique crack patterns per tile coordinates", () => {
      const g1 = createMockGraphics();
      const g2 = createMockGraphics();
      drawCrackedStoneOverlay(g1, "barracks", 24, 1, 1, "western", 1);
      drawCrackedStoneOverlay(g2, "barracks", 24, 7, 8, "western", 1);

      // Same number of structural elements but different coordinates
      expect(g1.calls.length).toBeGreaterThan(15);
      expect(g2.calls.length).toBeGreaterThan(15);
      const lines1 = g1.calls.filter((c) => c.method === "lineTo");
      const lines2 = g2.calls.filter((c) => c.method === "lineTo");
      expect(lines1.length).toBeGreaterThan(0);
      // Fissure vertices differ due to tile coordinates
      expect(lines1[0].args).not.toEqual(lines2[0].args);
    });

    it("scarred building (complete = false) renders cracked stone overlay without scaffolding", () => {
      const gScar = createMockGraphics();
      const gDone = createMockGraphics();

      drawIsometricBuilding(gScar, "barracks", 1, false, 0, defaultVisuals, 3, 3);
      drawIsometricBuilding(gDone, "barracks", 1, true, 0, defaultVisuals, 3, 3);

      // Scarred building has cracked stone rubble blocks and fissures
      expect(gScar.calls.length).toBeGreaterThan(0);
      expect(gDone.calls.length).toBeGreaterThan(0);

      // Check that the old scaffolding stroke (color 0xfbbf24 with moveTo -14, 4) is not drawn
      const scaffoldingMoves = gScar.calls.filter(
        (c) => c.method === "moveTo" && c.args[0] === -14 && c.args[1] === 4
      );
      expect(scaffoldingMoves.length).toBe(0);

      // Scarred building includes the cracked stone rubble and crater
      const scarStrokes = gScar.calls.filter((c) => c.method === "stroke");
      const doneStrokes = gDone.calls.filter((c) => c.method === "stroke");
      expect(scarStrokes.length).toBeGreaterThan(doneStrokes.length);
    });

    it("suppresses chimney smoke in Western farm when completesAtTick is set (complete = false)", () => {
      const gDone = createMockGraphics();
      const gScar = createMockGraphics();

      drawIsometricBuilding(gDone, "farm", 1, true, 0.5, defaultVisuals, 2, 2, undefined, "western");
      drawIsometricBuilding(gScar, "farm", 1, false, 0.5, defaultVisuals, 2, 2, undefined, "western");

      // Western farm chimney smoke circles are at x = 6 and x = 8
      const smokeCirclesDone = gDone.calls.filter(
        (c) => c.method === "circle" && (c.args[0] === 6 || c.args[0] === 8)
      );
      const smokeCirclesScar = gScar.calls.filter(
        (c) => c.method === "circle" && (c.args[0] === 6 || c.args[0] === 8)
      );

      expect(smokeCirclesDone.length).toBe(2);
      expect(smokeCirclesScar.length).toBe(0);
    });

    it("suppresses chimney smoke in Western cottage when completesAtTick is set (complete = false)", () => {
      const gDone = createMockGraphics();
      const gScar = createMockGraphics();

      drawIsometricBuilding(gDone, "cottage", 1, true, 0.5, defaultVisuals, 2, 2, undefined, "western");
      drawIsometricBuilding(gScar, "cottage", 1, false, 0.5, defaultVisuals, 2, 2, undefined, "western");

      // Western cottage chimney smoke circles are at x = -8.5 and x = -6.5
      const smokeDone = gDone.calls.filter(
        (c) => c.method === "circle" && (c.args[0] === -8.5 || c.args[0] === -6.5)
      );
      const smokeScar = gScar.calls.filter(
        (c) => c.method === "circle" && (c.args[0] === -8.5 || c.args[0] === -6.5)
      );

      expect(smokeDone.length).toBe(2);
      expect(smokeScar.length).toBe(0);
    });

    it("suppresses chimney smoke in Western infirmary when completesAtTick is set (complete = false)", () => {
      const gDone = createMockGraphics();
      const gScar = createMockGraphics();

      drawIsometricBuilding(gDone, "infirmary", 1, true, 0.5, defaultVisuals, 2, 2, undefined, "western");
      drawIsometricBuilding(gScar, "infirmary", 1, false, 0.5, defaultVisuals, 2, 2, undefined, "western");

      // Infirmary chimney smoke circles are at x = -10 and x = -8, elevated above the roof (y < -20)
      const smokeDone = gDone.calls.filter(
        (c) => c.method === "circle" && (c.args[0] === -10 || c.args[0] === -8) && c.args[1] < -20
      );
      const smokeScar = gScar.calls.filter(
        (c) => c.method === "circle" && (c.args[0] === -10 || c.args[0] === -8) && c.args[1] < -20
      );

      expect(smokeDone.length).toBe(2);
      expect(smokeScar.length).toBe(0);
    });

    it("suppresses Cedar culture smoke in farm, cottage, keep, chapel, and infirmary when complete = false", () => {
      const types = ["farm", "cottage", "keep", "chapel", "infirmary"] as const;
      for (const t of types) {
        const gDone = createMockGraphics();
        const gScar = createMockGraphics();

        drawIsometricBuilding(gDone, t, 1, true, 0.5, defaultVisuals, 2, 2, undefined, "cedar");
        drawIsometricBuilding(gScar, t, 1, false, 0.5, defaultVisuals, 2, 2, undefined, "cedar");

        // Cedar farm smoke at x=6, x=8
        if (t === "farm") {
          const sDone = gDone.calls.filter((c) => c.method === "circle" && (c.args[0] === 6 || c.args[0] === 8));
          const sScar = gScar.calls.filter((c) => c.method === "circle" && (c.args[0] === 6 || c.args[0] === 8));
          expect(sDone.length).toBe(2);
          expect(sScar.length).toBe(0);
        }
        // Cedar cottage smoke at x=-8.5, x=-6.5
        if (t === "cottage") {
          const sDone = gDone.calls.filter((c) => c.method === "circle" && (c.args[0] === -8.5 || c.args[0] === -6.5));
          const sScar = gScar.calls.filter((c) => c.method === "circle" && (c.args[0] === -8.5 || c.args[0] === -6.5));
          expect(sDone.length).toBe(2);
          expect(sScar.length).toBe(0);
        }
        // Cedar keep smoke at x=0, x=2
        if (t === "keep") {
          const sDone = gDone.calls.filter((c) => c.method === "circle" && (c.args[0] === 0 || c.args[0] === 2) && c.args[1] < -30);
          const sScar = gScar.calls.filter((c) => c.method === "circle" && (c.args[0] === 0 || c.args[0] === 2) && c.args[1] < -30);
          expect(sDone.length).toBeGreaterThanOrEqual(2);
          expect(sScar.length).toBe(0);
        }
        // Cedar chapel incense smoke at x=8, x=9
        if (t === "chapel") {
          const sDone = gDone.calls.filter((c) => c.method === "circle" && (c.args[0] === 8 || c.args[0] === 9));
          const sScar = gScar.calls.filter((c) => c.method === "circle" && (c.args[0] === 8 || c.args[0] === 9));
          expect(sDone.length).toBe(2);
          expect(sScar.length).toBe(0);
        }
        // Cedar infirmary smoke at x=-10
        if (t === "infirmary") {
          const sDone = gDone.calls.filter((c) => c.method === "circle" && c.args[0] === -10 && c.args[1] < -20);
          const sScar = gScar.calls.filter((c) => c.method === "circle" && c.args[0] === -10 && c.args[1] < -20);
          expect(sDone.length).toBe(1);
          expect(sScar.length).toBe(0);
        }
      }
    });

    it("suppresses Steppe culture smoke in farm, cottage, keep, infirmary, and watchtower when complete = false", () => {
      const types = ["farm", "cottage", "keep", "infirmary", "watchtower"] as const;
      for (const t of types) {
        const gDone = createMockGraphics();
        const gScar = createMockGraphics();

        drawIsometricBuilding(gDone, t, 1, true, 0.5, defaultVisuals, 2, 2, undefined, "steppe");
        drawIsometricBuilding(gScar, t, 1, false, 0.5, defaultVisuals, 2, 2, undefined, "steppe");

        if (t === "farm") {
          const sDone = gDone.calls.filter((c) => c.method === "circle" && c.args[0] === -10 && c.args[2] === 1.8 && c.args[1] < -11);
          const sScar = gScar.calls.filter((c) => c.method === "circle" && c.args[0] === -10 && c.args[2] === 1.8 && c.args[1] < -11);
          expect(sDone.length).toBe(2);
          expect(sScar.length).toBe(1);
        }
        if (t === "cottage") {
          const sDone = gDone.calls.filter((c) => c.method === "circle" && (c.args[0] === 0 || c.args[0] === 1.5));
          const sScar = gScar.calls.filter((c) => c.method === "circle" && (c.args[0] === 0 || c.args[0] === 1.5));
          expect(sDone.length).toBe(2);
          expect(sScar.length).toBe(0);
        }
        if (t === "keep") {
          const sDone = gDone.calls.filter((c) => c.method === "circle" && (c.args[0] === 0 || c.args[0] === 2) && c.args[1] < -30);
          const sScar = gScar.calls.filter((c) => c.method === "circle" && (c.args[0] === 0 || c.args[0] === 2) && c.args[1] < -30);
          expect(sDone.length).toBe(2);
          expect(sScar.length).toBe(0);
        }
        if (t === "infirmary") {
          const sDone = gDone.calls.filter((c) => c.method === "circle" && c.args[0] === 0 && c.args[1] < -20);
          const sScar = gScar.calls.filter((c) => c.method === "circle" && c.args[0] === 0 && c.args[1] < -20);
          expect(sDone.length).toBe(1);
          expect(sScar.length).toBe(0);
        }
        if (t === "watchtower") {
          const sDone = gDone.calls.filter((c) => c.method === "circle" && (c.args[0] === 0 || c.args[0] === 2) && c.args[1] < -30);
          const sScar = gScar.calls.filter((c) => c.method === "circle" && (c.args[0] === 0 || c.args[0] === 2) && c.args[1] < -30);
          expect(sDone.length).toBe(2);
          expect(sScar.length).toBe(0);
        }
      }
    });

    it("extinguishes active fire in forge, watchtower beacon, and keep brazier when complete = false", () => {
      // Siege workshop forge
      const gForgeDone = createMockGraphics();
      const gForgeScar = createMockGraphics();
      drawIsometricBuilding(gForgeDone, "siege_workshop", 1, true, 0.5, defaultVisuals, 0, 0);
      drawIsometricBuilding(gForgeScar, "siege_workshop", 1, false, 0.5, defaultVisuals, 0, 0);
      const forgeFlameDone = gForgeDone.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xea580c);
      const forgeFlameScar = gForgeScar.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xea580c);
      expect(forgeFlameDone.length).toBe(1);
      expect(forgeFlameScar.length).toBe(0);

      // Watchtower beacon
      const gTowerDone = createMockGraphics();
      const gTowerScar = createMockGraphics();
      drawIsometricBuilding(gTowerDone, "watchtower", 1, true, 0.5, defaultVisuals, 0, 0);
      drawIsometricBuilding(gTowerScar, "watchtower", 1, false, 0.5, defaultVisuals, 0, 0);
      const towerFlameDone = gTowerDone.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
      const towerFlameScar = gTowerScar.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
      expect(towerFlameDone.length).toBe(1);
      expect(towerFlameScar.length).toBe(0);

      // Keep brazier
      const gKeepDone = createMockGraphics();
      const gKeepScar = createMockGraphics();
      drawIsometricBuilding(gKeepDone, "keep", 1, true, 0.5, defaultVisuals, 0, 0);
      drawIsometricBuilding(gKeepScar, "keep", 1, false, 0.5, defaultVisuals, 0, 0);
      const keepFlameDone = gKeepDone.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
      const keepFlameScar = gKeepScar.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
      expect(keepFlameDone.length).toBe(1);
      expect(keepFlameScar.length).toBe(0);
    });
  });

  describe("Watchtowers on the rim and unfinished scaffolding (bakeoff/gemini-towers)", () => {
    function createMockGraphics() {
      const calls: { method: string; args: any[] }[] = [];
      const mock: any = {
        calls,
        clear: () => { calls.push({ method: "clear", args: [] }); return mock; },
        poly: (...args: any[]) => { calls.push({ method: "poly", args }); return mock; },
        fill: (...args: any[]) => { calls.push({ method: "fill", args }); return mock; },
        stroke: (...args: any[]) => { calls.push({ method: "stroke", args }); return mock; },
        moveTo: (...args: any[]) => { calls.push({ method: "moveTo", args }); return mock; },
        lineTo: (...args: any[]) => { calls.push({ method: "lineTo", args }); return mock; },
        circle: (...args: any[]) => { calls.push({ method: "circle", args }); return mock; },
        rect: (...args: any[]) => { calls.push({ method: "rect", args }); return mock; },
        ellipse: (...args: any[]) => { calls.push({ method: "ellipse", args }); return mock; },
        roundRect: (...args: any[]) => { calls.push({ method: "roundRect", args }); return mock; },
        quadraticCurveTo: (...args: any[]) => { calls.push({ method: "quadraticCurveTo", args }); return mock; },
      };
      return mock;
    }

    const defaultVisuals: ThemeVisuals = {
      groundColors: [0x1e3a1e, 0x2d4a27, 0x3b5a32],
      unclaimedColor: 0x3a3f3a,
      decorations: "none",
      seasonName: "Verdant Sun",
    };

    it("resolves taller buildingHeight for rim watchtowers while preserving interior height", () => {
      // Interior watchtower (1, 1) or (2, 2)
      expect(buildingHeight("watchtower", 1, 1, 1)).toBe(34);
      expect(buildingHeight("watchtower", 3, 2, 2)).toBe(34 + 6);

      // Rim watchtowers at outer perimeter (gx === 0, gy === 0, gx === GRID_W - 1, gy === GRID_H - 1)
      expect(buildingHeight("watchtower", 1, 0, 4)).toBe(44);
      expect(buildingHeight("watchtower", 2, 0, 4)).toBe(44 + 3);
      expect(buildingHeight("watchtower", 3, 0, 4)).toBe(44 + 6);
      expect(buildingHeight("watchtower", 1, 5, 0)).toBe(44);
      expect(buildingHeight("watchtower", 1, 15, 5)).toBe(44);
      expect(buildingHeight("watchtower", 1, 5, 9)).toBe(44);

      // Default without coordinates maintains backward compatibility (interior standard)
      expect(buildingHeight("watchtower", 1)).toBe(34);
      expect(buildingHeight("watchtower", 2)).toBe(37);
    });

    it("finished Western watchtower on the rim reads taller with a small beacon and radiant glow", () => {
      const gRim = createMockGraphics();
      const gInt = createMockGraphics();

      drawIsometricBuilding(gRim, "watchtower", 1, true, 0.5, defaultVisuals, 0, 4, undefined, "western");
      drawIsometricBuilding(gInt, "watchtower", 1, true, 0.5, defaultVisuals, 2, 2, undefined, "western");

      // Verify rim watchtower reaches higher apex (more negative Y) than interior
      const minYRim = Math.min(...gRim.calls.flatMap((c) =>
        c.method === "moveTo" || c.method === "lineTo" ? [c.args[1]] :
        c.method === "circle" ? [c.args[1]] :
        c.method === "poly" ? (c.args[0] as number[]).filter((_, i) => i % 2 === 1) : []
      ));
      const minYInt = Math.min(...gInt.calls.flatMap((c) =>
        c.method === "moveTo" || c.method === "lineTo" ? [c.args[1]] :
        c.method === "circle" ? [c.args[1]] :
        c.method === "poly" ? (c.args[0] as number[]).filter((_, i) => i % 2 === 1) : []
      ));

      // Rim watchtower should be at least 10px taller than interior watchtower
      expect(minYInt - minYRim).toBeGreaterThanOrEqual(10);

      // Both have active flame (0xf97316)
      const flameRim = gRim.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
      const flameInt = gInt.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
      expect(flameRim.length).toBe(1);
      expect(flameInt.length).toBe(1);

      // Rim beacon has radiant warm beacon glow halo (0xfde047)
      const haloRim = gRim.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfde047);
      expect(haloRim.length).toBeGreaterThan(0);
    });

    it("finished culture watchtowers scale taller on the rim with culture-specific beacons", () => {
      const kits = ["cedar", "sand", "steppe", "islands"] as const;

      for (const kit of kits) {
        const gRim = createMockGraphics();
        const gInt = createMockGraphics();

        drawIsometricBuilding(gRim, "watchtower", 1, true, 0.5, defaultVisuals, 0, 4, undefined, kit);
        drawIsometricBuilding(gInt, "watchtower", 1, true, 0.5, defaultVisuals, 2, 2, undefined, kit);

        const minYRim = Math.min(...gRim.calls.flatMap((c) =>
          c.method === "moveTo" || c.method === "lineTo" ? [c.args[1]] :
          c.method === "circle" ? [c.args[1]] :
          c.method === "poly" ? (c.args[0] as number[]).filter((_, i) => i % 2 === 1) : []
        ));
        const minYInt = Math.min(...gInt.calls.flatMap((c) =>
          c.method === "moveTo" || c.method === "lineTo" ? [c.args[1]] :
          c.method === "circle" ? [c.args[1]] :
          c.method === "poly" ? (c.args[0] as number[]).filter((_, i) => i % 2 === 1) : []
        ));

        // Rim version reaches higher elevation across all culture kits
        expect(minYInt - minYRim).toBeGreaterThanOrEqual(8);

        // Rim beacon lighting presence
        if (kit === "cedar") {
          const cedarFire = gRim.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xea580c);
          expect(cedarFire.length).toBe(1);
          const cedarHalo = gRim.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfde047);
          expect(cedarHalo.length).toBe(1);
        } else if (kit === "sand") {
          const sandFire = gRim.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
          expect(sandFire.length).toBe(1);
          const sandHalo = gRim.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfde047);
          expect(sandHalo.length).toBe(1);
        } else if (kit === "steppe") {
          const steppeCoals = gRim.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xea580c);
          expect(steppeCoals.length).toBe(1);
          const steppeSmoke = gRim.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x3f3f46);
          expect(steppeSmoke.length).toBe(1);
        } else if (kit === "islands") {
          const beaconLens = gRim.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x06b6d4);
          expect(beaconLens.length).toBe(1);
          const islandHalo = gRim.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x38bdf8);
          expect(islandHalo.length).toBe(1);
        }
      }
    });

    it("unfinished watchtowers stay scaffolding across Western and all culture kits without cracked stone", () => {
      const kits = ["western", "cedar", "sand", "steppe", "islands"] as const;

      for (const kit of kits) {
        const gUnfinished = createMockGraphics();
        const gFinished = createMockGraphics();

        drawIsometricBuilding(gUnfinished, "watchtower", 1, false, 0.5, defaultVisuals, 0, 4, undefined, kit);
        drawIsometricBuilding(gFinished, "watchtower", 1, true, 0.5, defaultVisuals, 0, 4, undefined, kit);

        // 1. Unfinished tower has NO active beacon fire
        const unfinishedFlames = gUnfinished.calls.filter(
          (c) => c.method === "fill" && (c.args[0]?.color === 0xf97316 || c.args[0]?.color === 0xea580c)
        );
        expect(unfinishedFlames.length).toBe(0);

        // 2. Unfinished tower draws timber scaffolding elements (corner standards, ledgers, X-bracing, work decks, ladder, hoist boom)
        const strokes = gUnfinished.calls.filter((c) => c.method === "stroke");
        expect(strokes.length).toBeGreaterThanOrEqual(10);

        // 3. Unfinished tower has builder's hoist pulley and suspended stone block
        const hoistedBlock = gUnfinished.calls.filter(
          (c) => c.method === "poly" && (c.args[0] as number[]).length === 8
        );
        expect(hoistedBlock.length).toBeGreaterThan(0);

        // 4. Unfinished tower does NOT draw cracked stone overlay (crater or fissures)
        const fissures = gUnfinished.calls.filter(
          (c) => c.method === "stroke" && c.args[0]?.color === 0x0f172a && c.args[0]?.width === 1.4
        );
        expect(fissures.length).toBe(0);
      }
    });

    it("unfinished rim watchtower scaffolding scales taller than interior scaffolding", () => {
      const gRim = createMockGraphics();
      const gInt = createMockGraphics();

      drawIsometricBuilding(gRim, "watchtower", 1, false, 0.5, defaultVisuals, 0, 4);
      drawIsometricBuilding(gInt, "watchtower", 1, false, 0.5, defaultVisuals, 2, 2);

      const minYRim = Math.min(...gRim.calls.flatMap((c) =>
        c.method === "moveTo" || c.method === "lineTo" ? [c.args[1]] :
        c.method === "circle" ? [c.args[1]] :
        c.method === "poly" ? (c.args[0] as number[]).filter((_, i) => i % 2 === 1) : []
      ));
      const minYInt = Math.min(...gInt.calls.flatMap((c) =>
        c.method === "moveTo" || c.method === "lineTo" ? [c.args[1]] :
        c.method === "circle" ? [c.args[1]] :
        c.method === "poly" ? (c.args[0] as number[]).filter((_, i) => i % 2 === 1) : []
      ));

      // Rim scaffolding reaches taller (at least 10px higher) to match rim elevation
      expect(minYInt - minYRim).toBeGreaterThanOrEqual(10);
    });

    it("drawWatchtowerScaffolding can be directly called with custom culture palettes", () => {
      const g = createMockGraphics();
      drawWatchtowerScaffolding(g, 44, 1.0, 0, "western", culturePalette("western"), true);
      expect(g.calls.length).toBeGreaterThan(20);
    });
  });

  describe("Home Militia Meeples & Upkeep Hunger Visuals (Gemini Upkeep Lane)", () => {
    function createMockGraphics() {
      const calls: { method: string; args: any[] }[] = [];
      const mock: any = {
        calls,
        clear: () => { calls.push({ method: "clear", args: [] }); return mock; },
        poly: (...args: any[]) => { calls.push({ method: "poly", args }); return mock; },
        fill: (...args: any[]) => { calls.push({ method: "fill", args }); return mock; },
        stroke: (...args: any[]) => { calls.push({ method: "stroke", args }); return mock; },
        moveTo: (...args: any[]) => { calls.push({ method: "moveTo", args }); return mock; },
        lineTo: (...args: any[]) => { calls.push({ method: "lineTo", args }); return mock; },
        circle: (...args: any[]) => { calls.push({ method: "circle", args }); return mock; },
        rect: (...args: any[]) => { calls.push({ method: "rect", args }); return mock; },
        ellipse: (...args: any[]) => { calls.push({ method: "ellipse", args }); return mock; },
        roundRect: (...args: any[]) => { calls.push({ method: "roundRect", args }); return mock; },
        quadraticCurveTo: (...args: any[]) => { calls.push({ method: "quadraticCurveTo", args }); return mock; },
      };
      return mock;
    }

    it("evaluates isFoodStoresEmptyOrLow correctly for empty, low, and full food stores", () => {
      // 1. Missing or undefined state/resources/food
      expect(isFoodStoresEmptyOrLow(null)).toBe(true);
      expect(isFoodStoresEmptyOrLow(undefined)).toBe(true);
      expect(isFoodStoresEmptyOrLow({} as any)).toBe(true);
      expect(isFoodStoresEmptyOrLow({ resources: {} } as any)).toBe(true);
      expect(isFoodStoresEmptyOrLow({ resources: { food: "0" } } as any)).toBe(true);
      expect(isFoodStoresEmptyOrLow({ resources: { food: "-5" } } as any)).toBe(true);

      // 2. Low food buffer (<= 5 when army upkeep is 0)
      expect(isFoodStoresEmptyOrLow({ resources: { food: "4" } } as any)).toBe(true);
      expect(isFoodStoresEmptyOrLow({ resources: { food: "5" } } as any)).toBe(true);
      expect(isFoodStoresEmptyOrLow({ resources: { food: "6" } } as any)).toBe(false);

      // 3. Standing army mouths increase nearly-empty upkeep threshold
      // 100 militia: upkeep = 100 * 0.02 = 2.0 / tick. Threshold = max(5, 2.0 * 50) = 100.
      const stateWithArmy: any = {
        resources: { food: "80" },
        units: [{ realmId: "player", typeId: "militia", count: "100" }],
      };
      expect(isFoodStoresEmptyOrLow(stateWithArmy)).toBe(true); // 80 <= 100 => nearly empty

      stateWithArmy.resources.food = "150";
      expect(isFoodStoresEmptyOrLow(stateWithArmy)).toBe(false); // 150 > 100 => well stocked

      // Champion does not consume food mouths
      const stateWithChamp: any = {
        resources: { food: "6" },
        units: [{ realmId: "player", typeId: "champion", count: "100" }],
      };
      expect(isFoodStoresEmptyOrLow(stateWithChamp)).toBe(false);
    });

    it("draws tired home militia meeple with slumped head, torso, low weapon, and NO banner bounce when food stores empty", () => {
      // Compare frames 0, 1, 2 for full stores (tired = false)
      const gFullF0 = createMockGraphics();
      const gFullF1 = createMockGraphics();
      const gFullF2 = createMockGraphics();
      drawWalkerFrame(gFullF0, "militia", 1, 0, "western", undefined, false);
      drawWalkerFrame(gFullF1, "militia", 1, 1, "western", undefined, false);
      drawWalkerFrame(gFullF2, "militia", 1, 2, "western", undefined, false);

      // In full stores, banner/spear poly bounces with stride bob/armSwing (-17 - bob + armSwing)
      const polyFull0 = gFullF0.calls.find((c: any) => c.method === "poly");
      const polyFull1 = gFullF1.calls.find((c: any) => c.method === "poly");
      const polyFull2 = gFullF2.calls.find((c: any) => c.method === "poly");
      expect(polyFull0).toBeDefined();
      expect(polyFull1).toBeDefined();
      expect(polyFull2).toBeDefined();
      // Poly y coordinates differ across frames due to banner bounce!
      expect(polyFull0!.args[0][1]).not.toBe(polyFull1!.args[0][1]);

      // Compare frames 0, 1, 2 for tired stores (tired = true)
      const gTiredF0 = createMockGraphics();
      const gTiredF1 = createMockGraphics();
      const gTiredF2 = createMockGraphics();
      drawWalkerFrame(gTiredF0, "militia", 1, 0, "western", undefined, true);
      drawWalkerFrame(gTiredF1, "militia", 1, 1, "western", undefined, true);
      drawWalkerFrame(gTiredF2, "militia", 1, 2, "western", undefined, true);

      // In tired stores, spear drags low and pennant has NO BANNER BOUNCE across strides
      const polyTired0 = gTiredF0.calls.find((c: any) => c.method === "poly");
      const polyTired1 = gTiredF1.calls.find((c: any) => c.method === "poly");
      const polyTired2 = gTiredF2.calls.find((c: any) => c.method === "poly");
      expect(polyTired0).toBeDefined();
      expect(polyTired1).toBeDefined();
      expect(polyTired2).toBeDefined();
      // Exact same static coordinates across strides: NO BANNER BOUNCE!
      expect(polyTired0!.args[0]).toEqual(polyTired1!.args[0]);
      expect(polyTired1!.args[0]).toEqual(polyTired2!.args[0]);

      // Head and torso are slumped down by 2px when tired
      // Full torso: rect(-3, -8, 6, 6). Tired torso: rect(-3, -8 + 2, 6, 6) = rect(-3, -6, 6, 6)
      const torsoFull = gFullF0.calls.find((c: any) => c.method === "rect" && c.args[2] === 6 && c.args[3] === 6);
      const torsoTired = gTiredF0.calls.find((c: any) => c.method === "rect" && c.args[2] === 6 && c.args[3] === 6);
      expect(torsoFull!.args[1]).toBe(-8);
      expect(torsoTired!.args[1]).toBe(-6); // Slumped down 2px!

      // Head circle is also slumped down by 2px
      const headFull = gFullF0.calls.find((c: any) => c.method === "circle" && c.args[2] === 2.8);
      const headTired = gTiredF0.calls.find((c: any) => c.method === "circle" && c.args[2] === 2.8);
      expect(headFull!.args[1]).toBe(-11);
      expect(headTired!.args[1]).toBe(-9); // Slumped down 2px!

      // Tired brow stroke exists only when tired
      const browFull = gFullF0.calls.find((c: any) => c.method === "moveTo" && c.args[0] === -1.2);
      const browTired = gTiredF0.calls.find((c: any) => c.method === "moveTo" && c.args[0] === -1.2);
      expect(browFull).toBeUndefined();
      expect(browTired).toBeDefined();
    });

    it("applies tired slumping and suppresses banner bounce across Cedar, Sand, Steppe, and Tide cultures", () => {
      const cultures = ["cedar", "sand", "steppe", "islands"] as const;

      for (const cult of cultures) {
        const gAlertF1 = createMockGraphics();
        const gTiredF0 = createMockGraphics();
        const gTiredF1 = createMockGraphics();

        drawWalkerFrame(gAlertF1, "militia", 1, 1, cult, undefined, false);
        drawWalkerFrame(gTiredF0, "militia", 1, 0, cult, undefined, true);
        drawWalkerFrame(gTiredF1, "militia", 1, 1, cult, undefined, true);

        // All cultures have tired brow when tired
        const browTired = gTiredF0.calls.find((c: any) => c.method === "moveTo" && c.args[0] === -1.2);
        expect(browTired).toBeDefined();

        // All cultures have slumped head (slumpY = 2)
        const headAlert = gAlertF1.calls.find((c: any) => c.method === "circle" && c.args[2] === 2.8);
        const headTired = gTiredF1.calls.find((c: any) => c.method === "circle" && c.args[2] === 2.8);
        expect(headAlert).toBeDefined();
        expect(headTired).toBeDefined();
        expect(headTired!.args[1] - headAlert!.args[1]).toBe(2);

        // Weapon/banner poly has zero bounce across animation frames when tired
        const polysTired0 = gTiredF0.calls.filter((c: any) => c.method === "poly");
        const polysTired1 = gTiredF1.calls.filter((c: any) => c.method === "poly");
        const weaponPoly0 = polysTired0[polysTired0.length - 1];
        const weaponPoly1 = polysTired1[polysTired1.length - 1];
        expect(weaponPoly0).toBeDefined();
        expect(weaponPoly1).toBeDefined();
        expect(weaponPoly0.args[0]).toEqual(weaponPoly1.args[0]);
      }
    });

    it("pickDestination assigns patrol destinations for home militia when home militia is present", () => {
      const w = createWalker(0, 5, 5);
      const stateWithMilitia: any = {
        citizens: [],
        units: [{ realmId: "player", typeId: "militia", count: "10" }],
        buildings: [{ typeId: "watchtower", x: 2, y: 3 }],
      };

      pickDestination(w, stateWithMilitia);
      expect(w.role).toBe("militia");
      expect(w.state).toBe("walking");
      expect(w.tool).toBeUndefined();
    });

    it("preserves hit-testing and camera projection invariants regardless of food upkeep state", () => {
      // Board hit test unchanged
      const hit = hitTestProvince(100, 100);
      expect(hit).toBeDefined();

      // Band for zoom threshold unchanged
      expect(bandForZoom(1.0)).toBe("hold");
      expect(bandForZoom(0.3)).toBe("board");
    });
  });

  describe("Inhabited Shell HUD, Stamped Tabs & Primer Banner (Gemini HUD Lane)", () => {
    it("theme.css incorporates inner gold edges, candle flicker, dust motes, and stamped metal tabs", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const themeCssPath = path.resolve(__dirname, "../../app/src/theme.css");
      expect(fs.existsSync(themeCssPath)).toBe(true);
      const css = fs.readFileSync(themeCssPath, "utf-8");

      // 1. Inner gold edge on realm cards and lectern
      expect(css).toContain("sc-realm-card");
      expect(css).toContain("inset 0 0 0 1px rgba(212, 163, 89");
      expect(css).toContain("sc-research-lectern");
      expect(css).toContain("border-left: 4px solid #d4a359");

      // 2. Idle candle flicker & faint dust motes
      expect(css).toContain("@keyframes sc-candle-flicker");
      expect(css).toContain("@keyframes sc-dust-drift");
      expect(css).toContain("sc-candle-flicker");

      // 3. Stamped metal tabs and active tab lantern tick
      expect(css).toContain("sc-tab");
      expect(css).toContain("sc-tab.active");
      expect(css).toContain("@keyframes sc-lantern-tick");
      expect(css).toContain("sc-tab-lantern");

      // 4. Primer banner with wax seal and page edge
      expect(css).toContain("sc-primer-banner");
      expect(css).toContain("sc-wax-seal");
      expect(css).toContain("sc-primer-btn-done");
      expect(css).toContain("sc-primer-btn-skip");

      // 5. Clicks NOT broken: overlays strictly enforce pointer-events: none
      expect(css).toContain(".sc-tab.active::after");
      expect(css).toContain("pointer-events: none");

      // 6. Form inputs are NOT restyled to white
      expect(css).not.toMatch(/input\s*\{[^}]*background:\s*white/i);
      expect(css).not.toMatch(/input\s*\{[^}]*background:\s*#fff/i);
    });

    it("AppShell, TutorialBanner, and Lectern preserve clean button action handlers and tab switching", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const appShellPath = path.resolve(__dirname, "../../app/src/AppShell.tsx");
      const bannerPath = path.resolve(__dirname, "../../app/src/TutorialBanner.tsx");
      const lecternPath = path.resolve(__dirname, "../../app/src/ResearchBar.tsx");

      const appShell = fs.readFileSync(appShellPath, "utf-8");
      const banner = fs.readFileSync(bannerPath, "utf-8");
      const lectern = fs.readFileSync(lecternPath, "utf-8");

      // Active lantern tick SVG is present in AppShell
      expect(appShell).toContain("sc-tab-lantern");
      expect(appShell).toContain("Lantern top cap & ring");

      // Primer banner buttons remain readable with exact required text
      expect(banner).toContain("sc-primer-banner");
      expect(banner).toContain("sc-wax-seal");
      expect(banner).toContain("Done with this step");
      expect(banner).toContain("Skip primer");
      expect(banner).toContain("sc-primer-btn-done");
      expect(banner).toContain("sc-primer-btn-skip");

      // InhabitedOverlay present on the Lectern
      expect(lectern).toContain("InhabitedOverlay");
      expect(lectern).toContain("sc-research-lectern");
    });
  });

  describe("Resource Strip Animated Pips (Gemini Strip Lane)", () => {
    it("resource-pip.css and theme.css define stepped loops, slumped idle, stacked glow, and non-blocking pointer events", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const themeCssPath = path.resolve(__dirname, "../../app/src/theme.css");
      const pipCssPath = path.resolve(__dirname, "../../app/src/hud/resource-pip.css");
      expect(fs.existsSync(themeCssPath)).toBe(true);
      expect(fs.existsSync(pipCssPath)).toBe(true);
      const themeCss = fs.readFileSync(themeCssPath, "utf-8");
      const pipCss = fs.readFileSync(pipCssPath, "utf-8");

      // 1. Timber ledger strip layout & cells
      expect(themeCss).toContain("sc-ledger");
      expect(themeCss).toContain("sc-ledger-cell");

      // 2. Stepped 3-frame looping animation (f0, f1, f2)
      expect(pipCss).toContain("sc-pip-f0");
      expect(pipCss).toContain("sc-pip-f1");
      expect(pipCss).toContain("sc-pip-f2");
      expect(pipCss).toContain("steps(1)");

      // 3. Empty food pip slumps & full store stacks
      expect(pipCss).toContain("sc-pip-slumped");
      expect(pipCss).toContain("sc-pip-stacked");

      // 4. Clicks NOT blocked: pointer-events: none !important
      expect(pipCss).toContain(".sc-pip");
      expect(pipCss).toContain("pointer-events: none !important");
    });

    it("ResourcePip renders 2-3 frame SVGs for grain sack, log, ashlar, and coin", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const pipPath = path.resolve(__dirname, "../../app/src/hud/ResourcePip.tsx");
      expect(fs.existsSync(pipPath)).toBe(true);
      const code = fs.readFileSync(pipPath, "utf-8");

      // All 4 resource types present
      expect(code).toContain("GrainSackNormal");
      expect(code).toContain("GrainSackSlumped");
      expect(code).toContain("GrainSackStacked");
      expect(code).toContain("TimberLogNormal");
      expect(code).toContain("TimberLogStacked");
      expect(code).toContain("AshlarNormal");
      expect(code).toContain("AshlarStacked");
      expect(code).toContain("CoinNormal");
      expect(code).toContain("CoinStacked");

      // Loop frames 0, 1, 2 present
      expect(code).toContain('data-frame="0"');
      expect(code).toContain('data-frame="1"');
      expect(code).toContain('data-frame="2"');
      expect(code).toContain("sc-pip-f0");
      expect(code).toContain("sc-pip-f1");
      expect(code).toContain("sc-pip-f2");

      // Guaranteed non-blocking inline
      expect(code).toContain('pointerEvents: "none"');
      expect(code).toContain('aria-hidden="true"');
    });

    it("evaluates resolveResourcePipVariant: empty food slumps, full stores stack high", async () => {
      const { resolveResourcePipVariant } = await import("../../app/src/hud/ResourcePip.tsx");

      // 1. Food slumping logic
      // Empty / nearly empty food state slumps
      const emptyState = createMockState();
      emptyState.resources.food = "0";
      expect(resolveResourcePipVariant("food", emptyState, false, "0")).toBe("slumped");

      const lowFoodState = createMockState();
      lowFoodState.resources.food = "3";
      expect(resolveResourcePipVariant("food", lowFoodState, false, "3")).toBe("slumped");

      // Empty raw amount with no state slumps
      expect(resolveResourcePipVariant("food", null, false, "0")).toBe("slumped");
      expect(resolveResourcePipVariant("food", null, false, "-2")).toBe("slumped");

      // Well-fed food is normal (or stacked if full)
      const wellFedState = createMockState();
      wellFedState.resources.food = "500";
      expect(resolveResourcePipVariant("food", wellFedState, false, "500")).toBe("normal");
      expect(resolveResourcePipVariant("food", wellFedState, true, "500")).toBe("stacked");

      // 2. Full store stacks high for all 4 resource types
      expect(resolveResourcePipVariant("food", wellFedState, true)).toBe("stacked");
      expect(resolveResourcePipVariant("wood", wellFedState, true)).toBe("stacked");
      expect(resolveResourcePipVariant("stone", wellFedState, true)).toBe("stacked");
      expect(resolveResourcePipVariant("gold", wellFedState, true)).toBe("stacked");

      // 3. Non-full stores default to normal
      expect(resolveResourcePipVariant("wood", wellFedState, false)).toBe("normal");
      expect(resolveResourcePipVariant("stone", wellFedState, false)).toBe("normal");
      expect(resolveResourcePipVariant("gold", wellFedState, false)).toBe("normal");
    });

    it("ResourceHud mounts cells with non-blocking pips and intact tooltips", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const hudPath = path.resolve(__dirname, "../../app/src/hud/ResourceHud.tsx");
      expect(fs.existsSync(hudPath)).toBe(true);
      const code = fs.readFileSync(hudPath, "utf-8");

      expect(code).toContain("ResourcePip");
      expect(code).toContain("resolveResourcePipVariant");
      expect(code).toContain("sc-ledger");
      expect(code).toContain("sc-ledger-cell");
      expect(code).toContain("sc-ledger-amount");
      expect(code).toContain("sc-ledger-rate");
      expect(code).toContain("title={tip}");
    });
  });

  describe("Work Cards & 24px Isometric Hall Chips (Gemini Works Lane)", () => {
    it("theme.css defines work card grid, 24px hall chip, dim unstaffed state, and cracked scarred state", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const themeCssPath = path.resolve(__dirname, "../../app/src/theme.css");
      expect(fs.existsSync(themeCssPath)).toBe(true);
      const css = fs.readFileSync(themeCssPath, "utf-8");

      // 1. Work grid and work card structure
      expect(css).toContain("sc-work-grid");
      expect(css).toContain("sc-work-card");
      expect(css).toContain("sc-work-head");
      expect(css).toContain("sc-work-title-group");
      expect(css).toContain("sc-work-name");
      expect(css).toContain("sc-work-level");
      expect(css).toContain("sc-work-status");
      expect(css).toContain("sc-work-foot");
      expect(css).toContain("sc-work-btn");

      // 2. 24px isometric hall chip
      expect(css).toContain("sc-chip-wrapper");
      expect(css).toContain("sc-chip");
      expect(css).toContain("width: 24px");
      expect(css).toContain("height: 24px");

      // 3. Unstaffed chip is dim
      expect(css).toContain(".sc-chip.is-unstaffed");
      expect(css).toContain("brightness(0.68)");

      // 4. Scarred chip is cracked
      expect(css).toContain(".sc-chip.is-scarred");
      expect(css).toContain("sc-chip-cracks");
      expect(css).toContain("sc-chip-crack-main");

      // 5. Clicks NOT blocked: pointer-events: none !important
      expect(css).toContain(".sc-chip-wrapper");
      expect(css).toContain(".sc-chip *");
      expect(css).toContain("pointer-events: none !important");
    });

    it("HallChip renders 24px isometric SVGs for building types with dim unstaffed and cracked scarred states", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const chipPath = path.resolve(__dirname, "../../app/src/hud/HallChip.tsx");
      expect(fs.existsSync(chipPath)).toBe(true);
      const code = fs.readFileSync(chipPath, "utf-8");

      // Building types supported
      expect(code).toContain("CottageSvg");
      expect(code).toContain("FarmSvg");
      expect(code).toContain("LumberCampSvg");
      expect(code).toContain("QuarrySvg");
      expect(code).toContain("MarketSvg");
      expect(code).toContain("BarracksSvg");
      expect(code).toContain("AcademySvg");
      expect(code).toContain("ChapelSvg");
      expect(code).toContain("InfirmarySvg");
      expect(code).toContain("WatchtowerSvg");

      // Unstaffed dim state and scarred cracked state
      expect(code).toContain("CrackedOverlay");
      expect(code).toContain("sc-chip-crack-main");
      expect(code).toContain("is-unstaffed");
      expect(code).toContain("is-scarred");
      expect(code).toContain('pointerEvents: "none"');
      expect(code).toContain('aria-hidden="true"');
      expect(code).toContain('viewBox="0 0 24 24"');
    });

    it("WorkCard integrates HallChip and evaluates isScarred accurately", async () => {
      const { isScarred, WorkCard } = await import("../../app/src/hud/WorkCard.tsx");
      expect(typeof isScarred).toBe("function");
      expect(typeof WorkCard).toBe("function");

      // Finished building (completesAtTick is null) is not scarred
      const finishedBuilding = {
        id: "b_100_1",
        typeId: "farm",
        realmId: "player",
        x: 3,
        y: 3,
        level: 1,
        completesAtTick: null,
      };
      expect(isScarred(finishedBuilding)).toBe(false);

      // Fresh build scaffolding: finishes at 100 + buildTicks (farm = 30 ticks -> 130)
      const freshScaffolding = {
        id: "b_100_1",
        typeId: "farm",
        realmId: "player",
        x: 3,
        y: 3,
        level: 1,
        completesAtTick: 130, // 100 + 30
      };
      expect(isScarred(freshScaffolding)).toBe(false);

      // Siege scarred building: completesAtTick is blow tick + 40 (e.g. tick 200 -> 240 != 130)
      const scarredBuilding = {
        id: "b_100_1",
        typeId: "farm",
        realmId: "player",
        x: 3,
        y: 3,
        level: 1,
        completesAtTick: 240, // siege damage scar
      };
      expect(isScarred(scarredBuilding)).toBe(true);
    });

    it("KingdomTab renders standing works with WorkCard grid", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const tabPath = path.resolve(__dirname, "../../app/src/tabs/KingdomTab.tsx");
      expect(fs.existsSync(tabPath)).toBe(true);
      const code = fs.readFileSync(tabPath, "utf-8");

      expect(code).toContain("WorkCard");
      expect(code).toContain("isScarred");
      expect(code).toContain("sc-work-grid");
      expect(code).toContain("Standing works");
    });

    it("ArmyTab trains through UnitCard grid with lock notes", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const tab = fs.readFileSync(path.resolve(__dirname, "../../app/src/tabs/ArmyTab.tsx"), "utf-8");
      expect(tab).toContain("UnitCard");
      expect(tab).toContain("sc-unit-grid");
      expect(tab).not.toContain("pwr ${u.power}");
      expect(tab).toContain("tryCancelTraining");
      expect(tab).toContain("tryTreatWounded");
      expect(tab).toContain("Posts");
      expect(tab).toContain("UpkeepLine");
      const card = fs.readFileSync(path.resolve(__dirname, "../../app/src/hud/UnitCard.tsx"), "utf-8");
      expect(card).toContain("sc-unit-lock");
      expect(card).toContain("sc-unit-cost");
      expect(card).toContain("is-locked");
    });
  });

  describe("Army Unit Cards & 28px Culture-Kit Chips (Gemini Army Lane)", () => {
    it("theme.css defines unit card grid, 28px chip art wrapper, and greyed locked states", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const themeCssPath = path.resolve(__dirname, "../../app/src/theme.css");
      expect(fs.existsSync(themeCssPath)).toBe(true);
      const css = fs.readFileSync(themeCssPath, "utf-8");

      // 1. Unit card grid & card structure
      expect(css).toContain("sc-unit-grid");
      expect(css).toContain("sc-unit-card");
      expect(css).toContain("sc-unit-head");
      expect(css).toContain("sc-unit-name");
      expect(css).toContain("sc-unit-power");
      expect(css).toContain("sc-unit-cost");
      expect(css).toContain("sc-unit-lock");

      // 2. 28px culture-kit chip art wrapper with non-blocking pointer events
      expect(css).toContain("sc-unit-art-wrapper");
      expect(css).toContain("width: 28px");
      expect(css).toContain("height: 28px");
      expect(css).toContain("pointer-events: none !important");

      // 3. Locked cards are greyed
      expect(css).toContain(".sc-unit-card.is-locked");
      expect(css).toContain("grayscale(1)");
      expect(css).toContain(".sc-unit-card.is-locked .sc-unit-art-wrapper");
    });

    it("UnitCard renders 28px UnitIcon culture-kit chip and handles locked/ready/short states", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const cardPath = path.resolve(__dirname, "../../app/src/hud/UnitCard.tsx");
      expect(fs.existsSync(cardPath)).toBe(true);
      const code = fs.readFileSync(cardPath, "utf-8");

      // Uses UnitIcon with size 28
      expect(code).toContain("UnitIcon");
      expect(code).toContain("size={28}");
      expect(code).toContain("sc-unit-art-wrapper");
      expect(code).toContain('pointerEvents: "none"');

      // Handles locked, ready, short classes
      expect(code).toContain("is-locked");
      expect(code).toContain("is-ready");
      expect(code).toContain("is-short");
    });

    it("ArmyTab trains through UnitCard grid and passes typeId for 28px culture-kit chips", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const tabPath = path.resolve(__dirname, "../../app/src/tabs/ArmyTab.tsx");
      expect(fs.existsSync(tabPath)).toBe(true);
      const code = fs.readFileSync(tabPath, "utf-8");

      expect(code).toContain("UnitCard");
      expect(code).toContain("sc-unit-grid");
      expect(code).toContain("typeId={u.id}");
      expect(code).toContain("affordable={!!state && canAffordTrain(state, u.id, trainQty)}");
      expect(code).toContain("open={open}");
      expect(code).toContain("lock={lock}");
      expect(code).not.toContain("pwr ${u.power}");
    });
  });

  describe("People Cards & Walker Role Pips (Gemini People Lane)", () => {
    it("theme.css defines job card grid, walker role pip, 2-frame walk animations, sitting idle states, and non-blocking pointer-events", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const themeCssPath = path.resolve(__dirname, "../../app/src/theme.css");
      expect(fs.existsSync(themeCssPath)).toBe(true);
      const css = fs.readFileSync(themeCssPath, "utf-8");

      // 1. Job card grid & trade card states
      expect(css).toContain("sc-job-grid");
      expect(css).toContain("sc-job-card");
      expect(css).toContain("sc-job-card.is-assigned");
      expect(css).toContain("sc-job-card.is-idle");
      expect(css).toContain("sc-job-head");
      expect(css).toContain("sc-job-title-group");
      expect(css).toContain("sc-job-name");
      expect(css).toContain("sc-job-count");
      expect(css).toContain("sc-job-where");

      // 2. Walker role pip wrapper & base element
      expect(css).toContain("sc-walker-pip-wrapper");
      expect(css).toContain("sc-walker-pip");
      expect(css).toContain("width: 24px");
      expect(css).toContain("height: 24px");

      // 3. Assigned pip walks 2 frames with stepped keyframes
      expect(css).toContain(".sc-walker-pip.is-walking .sc-walker-f0");
      expect(css).toContain(".sc-walker-pip.is-walking .sc-walker-f1");
      expect(css).toContain("@keyframes sc-walker-walk0");
      expect(css).toContain("@keyframes sc-walker-walk1");
      expect(css).toContain("steps(1)");

      // 4. Idle pip sits
      expect(css).toContain(".sc-walker-pip.is-sitting .sc-walker-sit");
      expect(css).toContain(".sc-walker-pip.is-sitting .sc-walker-f0");

      // 5. Clicks NOT blocked: pointer-events: none !important
      expect(css).toContain(".sc-walker-pip-wrapper");
      expect(css).toContain(".sc-walker-pip *");
      expect(css).toContain("pointer-events: none !important");
    });

    it("WalkerPip resolves matching walker role tools (hoe, axe, pick, coin) and supports walking & sitting states", async () => {
      const { toolForRole } = await import("../../app/src/hud/WalkerPip.tsx");
      expect(typeof toolForRole).toBe("function");

      // Matching tools
      expect(toolForRole("farmer")).toBe("hoe");
      expect(toolForRole("farm")).toBe("hoe");
      expect(toolForRole("woodcutter")).toBe("axe");
      expect(toolForRole("wood")).toBe("axe");
      expect(toolForRole("miner")).toBe("pick");
      expect(toolForRole("stone")).toBe("pick");
      expect(toolForRole("merchant")).toBe("coin");
      expect(toolForRole("gold")).toBe("coin");

      // Code structure verification
      const fs = await import("node:fs");
      const path = await import("node:path");
      const pipPath = path.resolve(__dirname, "../../app/src/hud/WalkerPip.tsx");
      expect(fs.existsSync(pipPath)).toBe(true);
      const code = fs.readFileSync(pipPath, "utf-8");

      expect(code).toContain("FarmerPip");
      expect(code).toContain("WoodcutterPip");
      expect(code).toContain("MinerPip");
      expect(code).toContain("MerchantPip");

      expect(code).toContain("sc-walker-f0");
      expect(code).toContain("sc-walker-f1");
      expect(code).toContain("sc-walker-sit");
      expect(code).toContain('pointerEvents: "none"');
      expect(code).toContain('aria-hidden="true"');
      expect(code).toContain('viewBox="0 0 24 24"');
    });

    it("JobCard mounts WalkerPip in sc-job-head and displays worksite and controls", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const cardPath = path.resolve(__dirname, "../../app/src/hud/JobCard.tsx");
      expect(fs.existsSync(cardPath)).toBe(true);
      const code = fs.readFileSync(cardPath, "utf-8");

      expect(code).toContain("WalkerPip");
      expect(code).toContain("sc-job-head");
      expect(code).toContain("sc-job-title-group");
      expect(code).toContain("sc-job-name");
      expect(code).toContain("sc-job-count");
      expect(code).toContain("sc-job-where");
      expect(code).toContain("sc-job-row");
      expect(code).toContain("sc-job-btn");
      expect(code).toContain("effectiveRole");
    });

    it("PeoplePanel mounts people cards in sc-job-grid with idle first", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const panelPath = path.resolve(__dirname, "../../app/src/PeoplePanel.tsx");
      expect(fs.existsSync(panelPath)).toBe(true);
      const code = fs.readFileSync(panelPath, "utf-8");

      expect(code).toContain("JobCard");
      expect(code).toContain("sc-job-grid");
      expect(code).toContain("listCitizenJobs");
      expect(code).toContain('k === "unassigned" ? "Idle"');
    });
  });

  describe("War Force Cards & 24px War Chips (Gemini War Lane)", () => {
    it("theme.css and force-card.css define force card grid, tone accents, 24px war chips, and non-blocking clicks", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const themeCssPath = path.resolve(__dirname, "../../app/src/theme.css");
      expect(fs.existsSync(themeCssPath)).toBe(true);
      const css = fs.readFileSync(themeCssPath, "utf-8");

      // 1. Force grid and force card structure
      expect(css).toContain("sc-force-grid");
      expect(css).toContain("sc-force-card");
      expect(css).toContain("sc-force-card.is-hostile");
      expect(css).toContain("sc-force-card.is-scout");
      expect(css).toContain("sc-force-card.is-gather");
      expect(css).toContain("sc-force-card.is-garrison");
      expect(css).toContain("sc-force-head");
      expect(css).toContain("sc-force-title-group");
      expect(css).toContain("sc-force-name");
      expect(css).toContain("sc-force-eta");
      expect(css).toContain("sc-force-dest");

      // 2. 24px war chips
      expect(css).toContain("sc-war-chip-wrapper");
      expect(css).toContain("sc-war-chip");
      expect(css).toContain("width: 24px");
      expect(css).toContain("height: 24px");

      // 3. Chip drop-shadow glows for the 4 tones
      expect(css).toContain("sc-war-chip-warband");
      expect(css).toContain("sc-war-chip-cloak");
      expect(css).toContain("sc-war-chip-cart");
      expect(css).toContain("sc-war-chip-tent");

      // 4. Clicks NOT blocked: pointer-events: none !important
      expect(css).toContain(".sc-war-chip-wrapper");
      expect(css).toContain(".sc-war-chip *");
      expect(css).toContain("pointer-events: none !important");
    });

    it("WarChip normalizes kinds to warband, cloak, cart, tent and renders 24px SVGs with pointer-events none", async () => {
      const { normalizeWarChipKind, WarChip } = await import("../../app/src/hud/WarChip.tsx");
      expect(typeof normalizeWarChipKind).toBe("function");
      expect(typeof WarChip).toBe("function");

      // Normalization
      expect(normalizeWarChipKind("hostile")).toBe("warband");
      expect(normalizeWarChipKind("warband")).toBe("warband");
      expect(normalizeWarChipKind("scout")).toBe("cloak");
      expect(normalizeWarChipKind("cloak")).toBe("cloak");
      expect(normalizeWarChipKind("gather")).toBe("cart");
      expect(normalizeWarChipKind("cart")).toBe("cart");
      expect(normalizeWarChipKind("garrison")).toBe("tent");
      expect(normalizeWarChipKind("tent")).toBe("tent");

      // Code structure verification
      const fs = await import("node:fs");
      const path = await import("node:path");
      const chipPath = path.resolve(__dirname, "../../app/src/hud/WarChip.tsx");
      expect(fs.existsSync(chipPath)).toBe(true);
      const code = fs.readFileSync(chipPath, "utf-8");

      expect(code).toContain("WarbandSvg");
      expect(code).toContain("CloakSvg");
      expect(code).toContain("CartSvg");
      expect(code).toContain("TentSvg");

      expect(code).toContain("sc-war-chip-wrapper");
      expect(code).toContain('pointerEvents: "none"');
      expect(code).toContain('aria-hidden="true"');
      expect(code).toContain('viewBox="0 0 24 24"');
    });

    it("ForceCard mounts WarChip in sc-force-head and renders force info and actions", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const cardPath = path.resolve(__dirname, "../../app/src/hud/ForceCard.tsx");
      expect(fs.existsSync(cardPath)).toBe(true);
      const code = fs.readFileSync(cardPath, "utf-8");

      expect(code).toContain("WarChip");
      expect(code).toContain("sc-force-card");
      expect(code).toContain("sc-force-head");
      expect(code).toContain("sc-force-title-group");
      expect(code).toContain("sc-force-name");
      expect(code).toContain("sc-force-eta");
      expect(code).toContain("sc-force-dest");
      expect(code).toContain("sc-force-btn");
      expect(code).toContain("size={24}");
    });

    it("WarRoom mounts ForceCard grid for incoming, scouts, gathers, and garrisons", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const roomPath = path.resolve(__dirname, "../../app/src/WarRoom.tsx");
      expect(fs.existsSync(roomPath)).toBe(true);
      const code = fs.readFileSync(roomPath, "utf-8");

      expect(code).toContain("ForceCard");
      expect(code).toContain("sc-force-grid");
      expect(code).toContain('tone="hostile"');
      expect(code).toContain('tone="scout"');
      expect(code).toContain('tone="gather"');
      expect(code).toContain('tone="garrison"');
    });
  });
});



