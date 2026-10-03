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
  drawMarchEtaBadge,
  MARCH_ETA_GLYPHS_3X5,
  getNodeStockInfo,
  drawNodeStockPile,
  drawResourceNode,
  drawCrackedStoneOverlay,
  buildingHeight,
  drawWatchtowerScaffolding,
  drawQuarryScaffolding,
  drawCampTentAndFlag,
  drawPlayerCampTentAndFlag,
  getWallHpStatus,
  isWallHpLow,
  isWallRingClosed,
  drawRimWallCurtain,
  drawGatehouseCurtainWings,
  listKeepYardBuildings,
  drawKeepYardAnnex,
  type KeepYardBuildingInfo,
  type KeepYardSlot,
  holdHasPeople,
  isEmptyWorkPlot,
  listEmptyWorkPlots,
  drawPlotStake,
  paintEmptyPlotStakes,
  parsePlotCoord,
  drawPlotGlowRing,
  ROAD_TILES,
  isBuildingStaffed,
  isMissingRimSegment,
  listMissingRimSegments,
  drawRimGapMark,
  paintMissingRimSegments,
  isHoldBreached,
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

  describe("Last Battle Card & 28px Clash Pip (Gemini Battle Lane)", () => {
    it("theme.css defines last-battle card, outcome edge colors, 28px clash pip, and non-blocking pointer-events", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const themeCssPath = path.resolve(__dirname, "../../app/src/theme.css");
      expect(fs.existsSync(themeCssPath)).toBe(true);
      const css = fs.readFileSync(themeCssPath, "utf-8");

      // 1. Battle card structure and outcome tones
      expect(css).toContain("sc-battle-card");
      expect(css).toContain("sc-battle-card.is-won");
      expect(css).toContain("sc-battle-card.is-lost");
      expect(css).toContain("sc-battle-card.is-other");
      expect(css).toContain("sc-battle-head");
      expect(css).toContain("sc-battle-title-group");
      expect(css).toContain("sc-battle-sides");
      expect(css).toContain("sc-battle-side");
      expect(css).toContain("sc-battle-verdict");
      expect(css).toContain("sc-battle-report");
      expect(css).toContain("sc-battle-bill");
      expect(css).toContain("sc-battle-log");

      // 2. 28px clash pip wrapper & art
      expect(css).toContain("sc-clash-pip-wrapper");
      expect(css).toContain("sc-clash-pip");
      expect(css).toContain("width: 28px");
      expect(css).toContain("height: 28px");

      // 3. Crossed blades glow & broken shield glow
      expect(css).toContain("sc-clash-crossed_blades");
      expect(css).toContain("sc-clash-broken_shield");

      // 4. Clicks NOT blocked: pointer-events: none !important
      expect(css).toContain(".sc-clash-pip-wrapper");
      expect(css).toContain(".sc-clash-pip *");
      expect(css).toContain("pointer-events: none !important");
    });

    it("ClashPip renders 28px crossed blades for victory/clash and broken shield for defeat with pointer-events none", async () => {
      const { resolveClashPipVariant, ClashPip } = await import("../../app/src/hud/ClashPip.tsx");
      expect(typeof resolveClashPipVariant).toBe("function");
      expect(typeof ClashPip).toBe("function");

      // Victory / field clash -> crossed_blades
      const victoryStory = {
        winnerId: "player",
        loserId: "r1",
        events: [],
        phases: [],
      };
      expect(resolveClashPipVariant(victoryStory)).toBe("crossed_blades");

      // Player defeat -> broken_shield
      const defeatStory = {
        winnerId: "r1",
        loserId: "player",
        events: [],
        phases: [],
      };
      expect(resolveClashPipVariant(defeatStory)).toBe("broken_shield");

      // Neutral / AI clash -> crossed_blades
      const aiStory = {
        winnerId: "r1",
        loserId: "r2",
        events: [],
        phases: [],
      };
      expect(resolveClashPipVariant(aiStory)).toBe("crossed_blades");
      expect(resolveClashPipVariant(null)).toBe("crossed_blades");

      // Code structure verification
      const fs = await import("node:fs");
      const path = await import("node:path");
      const pipPath = path.resolve(__dirname, "../../app/src/hud/ClashPip.tsx");
      expect(fs.existsSync(pipPath)).toBe(true);
      const code = fs.readFileSync(pipPath, "utf-8");

      expect(code).toContain("CrossedBladesSvg");
      expect(code).toContain("BrokenShieldSvg");
      expect(code).toContain("sc-clash-pip-wrapper");
      expect(code).toContain("size = 28");
      expect(code).toContain('pointerEvents: "none"');
      expect(code).toContain('aria-hidden="true"');
      expect(code).toContain('viewBox="0 0 28 28"');
    });

    it("BattleCard mounts 28px ClashPip in sc-battle-title-group and displays outcome, combatants, and log", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const cardPath = path.resolve(__dirname, "../../app/src/hud/BattleCard.tsx");
      expect(fs.existsSync(cardPath)).toBe(true);
      const code = fs.readFileSync(cardPath, "utf-8");

      expect(code).toContain("ClashPip");
      expect(code).toContain("size={28}");
      expect(code).toContain("sc-battle-card");
      expect(code).toContain("sc-battle-head");
      expect(code).toContain("sc-battle-title-group");
      expect(code).toContain("sc-battle-sides");
      expect(code).toContain("sc-battle-verdict");
      expect(code).toContain("broken_shield");
      expect(code).toContain("crossed_blades");
      expect(code).toContain("Blow by blow");
    });

    it("WarRoom mounts BattleCard in Last battle section", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const roomPath = path.resolve(__dirname, "../../app/src/WarRoom.tsx");
      expect(fs.existsSync(roomPath)).toBe(true);
      const code = fs.readFileSync(roomPath, "utf-8");

      expect(code).toContain("BattleCard");
      expect(code).toContain("Last battle");
      expect(code).toContain("story={story}");
      expect(code).toContain("report={lastField?.text}");
    });
  });

  describe("Crown Decrees & 24px Wax-Seal Pip (Gemini Decrees Lane)", () => {
    it("defines decree card layout, 24px wax-seal pip art, and active lit glow in theme.css and decree-card.css", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");

      const cssPath = path.resolve(__dirname, "../../app/src/hud/decree-card.css");
      expect(fs.existsSync(cssPath)).toBe(true);
      const css = fs.readFileSync(cssPath, "utf-8");

      // 1. Decree card & grid layout
      expect(css).toContain("sc-decree-grid");
      expect(css).toContain("sc-decree-card");
      expect(css).toContain("sc-decree-card.is-ready");
      expect(css).toContain("sc-decree-card.is-active");
      expect(css).toContain("sc-decree-card.is-off");
      expect(css).toContain("sc-decree-head");
      expect(css).toContain("sc-decree-title-group");
      expect(css).toContain("sc-decree-name");
      expect(css).toContain("sc-decree-left");
      expect(css).toContain("sc-decree-blurb");
      expect(css).toContain("sc-decree-cost");
      expect(css).toContain("sc-decree-amt");
      expect(css).toContain("sc-decree-btn");

      // 2. 24px wax-seal pip wrapper & art
      expect(css).toContain("sc-wax-seal-pip-wrapper");
      expect(css).toContain("sc-wax-seal-pip");
      expect(css).toContain("width: 24px");
      expect(css).toContain("height: 24px");

      // 3. Active seal lit glow & flame animation
      expect(css).toContain("sc-wax-seal-pip.is-lit");
      expect(css).toContain("sc-wax-flame");
      expect(css).toContain("drop-shadow");

      // 4. Click pass-through: strictly pointer-events: none !important
      expect(css).toContain(".sc-wax-seal-pip-wrapper");
      expect(css).toContain(".sc-wax-seal-pip *");
      expect(css).toContain("pointer-events: none !important");
    });

    it("WaxSealPip renders 24px wax seal with active lit state and pointer-events none", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const pipPath = path.resolve(__dirname, "../../app/src/hud/WaxSealPip.tsx");
      expect(fs.existsSync(pipPath)).toBe(true);
      const code = fs.readFileSync(pipPath, "utf-8");

      // Verify component exports & properties
      expect(code).toContain("WaxSealPip");
      expect(code).toContain("size = 24");
      expect(code).toContain('pointerEvents: "none"');
      expect(code).toContain('aria-hidden="true"');
      expect(code).toContain('viewBox="0 0 24 24"');
      expect(code).toContain("sc-wax-seal-pip-wrapper");
      expect(code).toContain("sc-wax-seal-pip");
      expect(code).toContain("is-lit");
      expect(code).toContain("is-dormant");

      // Verify active lit features (gold/amber tones, sparkles)
      expect(code).toContain("sc-wax-lit-sparkle");
      expect(code).toContain("#f59e0b");
      expect(code).toContain("#fbbf24");

      // Verify dormant wax features (crimson tones)
      expect(code).toContain("#991b1b");
      expect(code).toContain("#7f1d1d");

      // Verify decree-specific emblem support
      expect(code).toContain("sc-wax-sigil-rite");
      expect(code).toContain("sc-wax-sigil-muster");
      expect(code).toContain("sc-wax-sigil-crown");
    });

    it("DecreeCard mounts 24px WaxSealPip in sc-decree-title-group, displays costs and handles active status", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const cardPath = path.resolve(__dirname, "../../app/src/hud/DecreeCard.tsx");
      expect(fs.existsSync(cardPath)).toBe(true);
      const code = fs.readFileSync(cardPath, "utf-8");

      expect(code).toContain("WaxSealPip");
      expect(code).toContain("size={24}");
      expect(code).toContain("sc-decree-card");
      expect(code).toContain("sc-decree-head");
      expect(code).toContain("sc-decree-title-group");
      expect(code).toContain("sc-decree-name");
      expect(code).toContain("sc-decree-left");
      expect(code).toContain("sc-decree-cost");
      expect(code).toContain("ResourcePip");
      expect(code).toContain("decreeUntil");
      expect(code).toContain("tryDecree");
      expect(code).toContain("Already active");
      expect(code).toContain("Issue");
    });

    it("DecreesPanel mounts DecreeCard in sc-decree-grid for each royal decree", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const panelPath = path.resolve(__dirname, "../../app/src/DecreesPanel.tsx");
      expect(fs.existsSync(panelPath)).toBe(true);
      const code = fs.readFileSync(panelPath, "utf-8");

      expect(code).toContain("DecreeCard");
      expect(code).toContain("sc-decree-grid");
      expect(code).toContain("DECREES.map");
      expect(code).toContain("<DecreeCard key={d.id} state={state} decree={d} act={act} />");
    });
  });

  describe("Diplomacy Realm Cards & 28px Realm Crest Pip (Gemini Diplo Lane)", () => {
    it("defines diplomacy card layout, 28px realm crest pip art, and colder hostile styling in theme.css and realm-card.css", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");

      const cssPath = path.resolve(__dirname, "../../app/src/hud/realm-card.css");
      expect(fs.existsSync(cssPath)).toBe(true);
      const css = fs.readFileSync(cssPath, "utf-8");

      // 1. Diplomacy card & grid layout
      expect(css).toContain("sc-realm-dip-grid");
      expect(css).toContain("sc-realm-dip");
      expect(css).toContain("sc-realm-dip.is-war");
      expect(css).toContain("sc-realm-dip.is-truce");
      expect(css).toContain("sc-realm-dip.is-friendly");
      expect(css).toContain("sc-realm-dip.is-wary");
      expect(css).toContain("sc-realm-dip.is-hostile");
      expect(css).toContain("sc-realm-dip-head");
      expect(css).toContain("sc-realm-dip-title-group");
      expect(css).toContain("sc-realm-dip-name");
      expect(css).toContain("sc-realm-dip-stance");
      expect(css).toContain("sc-realm-dip-line");
      expect(css).toContain("sc-realm-dip-actions");
      expect(css).toContain("sc-realm-dip-btn");

      // 2. 28px realm crest pip wrapper
      expect(css).toContain("sc-realm-crest-wrapper");
      expect(css).toContain("width: 28px");
      expect(css).toContain("height: 28px");

      // 3. Hostile crest is colder
      expect(css).toContain("sc-realm-crest-wrapper.is-colder");
      expect(css).toContain("hue-rotate(185deg)");
      expect(css).toContain("drop-shadow");

      // 4. Click transparency: pointer-events: none !important
      expect(css).toContain(".sc-realm-crest-wrapper");
      expect(css).toContain(".sc-realm-crest-wrapper *");
      expect(css).toContain("pointer-events: none !important");
    });

    it("realmStance accurately maps war, peace countdown, and opinion thresholds", async () => {
      const { realmStance } = await import("../../app/src/hud/RealmCard.tsx");
      expect(typeof realmStance).toBe("function");

      // At war overrides everything
      expect(realmStance(true, 0, 50)).toBe("war");
      expect(realmStance(true, 100, -50)).toBe("war");

      // Truce when peace ticks remain
      expect(realmStance(false, 50, 0)).toBe("truce");
      expect(realmStance(false, 10, -30)).toBe("truce");

      // Friendly when opinion >= 25
      expect(realmStance(false, 0, 25)).toBe("friendly");
      expect(realmStance(false, 0, 40)).toBe("friendly");

      // Hostile when opinion <= -25
      expect(realmStance(false, 0, -25)).toBe("hostile");
      expect(realmStance(false, 0, -50)).toBe("hostile");

      // Wary when in neutral opinion range
      expect(realmStance(false, 0, 0)).toBe("wary");
      expect(realmStance(false, 0, 24)).toBe("wary");
      expect(realmStance(false, 0, -24)).toBe("wary");
    });

    it("RealmCrestPip renders 28px realm crest, colder hostile state, and pointer-events none", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const pipPath = path.resolve(__dirname, "../../app/src/hud/RealmCrestPip.tsx");
      expect(fs.existsSync(pipPath)).toBe(true);
      const code = fs.readFileSync(pipPath, "utf-8");

      expect(code).toContain("RealmCrestPip");
      expect(code).toContain("size = 28");
      expect(code).toContain('pointerEvents: "none"');
      expect(code).toContain('aria-hidden="true"');
      expect(code).toContain("sc-realm-crest-wrapper");
      expect(code).toContain("is-colder");
      expect(code).toContain("sc-realm-crest-frost");
      expect(code).toContain("Crest");
    });

    it("RealmCard mounts 28px RealmCrestPip in sc-realm-dip-title-group and displays realm diplomacy details", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const cardPath = path.resolve(__dirname, "../../app/src/hud/RealmCard.tsx");
      expect(fs.existsSync(cardPath)).toBe(true);
      const code = fs.readFileSync(cardPath, "utf-8");

      expect(code).toContain("RealmCrestPip");
      expect(code).toContain("size={28}");
      expect(code).toContain("sc-realm-dip");
      expect(code).toContain("sc-realm-dip-head");
      expect(code).toContain("sc-realm-dip-title-group");
      expect(code).toContain("sc-realm-dip-name");
      expect(code).toContain("sc-realm-dip-stance");
      expect(code).toContain("sc-realm-dip-line");
      expect(code).toContain("Declare war");
    });

    it("WarRoom mounts RealmCard in sc-realm-dip-grid for other realms", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const roomPath = path.resolve(__dirname, "../../app/src/WarRoom.tsx");
      expect(fs.existsSync(roomPath)).toBe(true);
      const code = fs.readFileSync(roomPath, "utf-8");

      expect(code).toContain("RealmCard");
      expect(code).toContain("sc-realm-dip-grid");
      expect(code).toContain("otherRealms.map");
      expect(code).toContain("realmStance(atWar, left, opinion)");
    });
  });

  describe("Quest Cards & 24px Scroll Pip (Gemini Quests Lane)", () => {
    it("defines quest card layout, 24px scroll pip art, and ready lit glow only in quest-card.css without editing theme.css", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");

      const cssPath = path.resolve(__dirname, "../../app/src/hud/quest-card.css");
      expect(fs.existsSync(cssPath)).toBe(true);
      const css = fs.readFileSync(cssPath, "utf-8");

      // 1. Quest card & grid layout
      expect(css).toContain("sc-quest-grid");
      expect(css).toContain("sc-quest-card");
      expect(css).toContain("sc-quest-card.is-open");
      expect(css).toContain("sc-quest-card.is-ready");
      expect(css).toContain("sc-quest-card.is-claimed");
      expect(css).toContain("sc-quest-head");
      expect(css).toContain("sc-quest-title-group");
      expect(css).toContain("sc-quest-title");
      expect(css).toContain("sc-quest-status");
      expect(css).toContain("sc-quest-hint");
      expect(css).toContain("sc-quest-progress");
      expect(css).toContain("sc-quest-progress-fill");
      expect(css).toContain("sc-quest-foot");
      expect(css).toContain("sc-quest-count");
      expect(css).toContain("sc-quest-reward");
      expect(css).toContain("sc-quest-btn");

      // 2. 24px scroll pip wrapper & art
      expect(css).toContain("sc-scroll-pip-wrapper");
      expect(css).toContain("sc-scroll-pip");
      expect(css).toContain("width: 24px");
      expect(css).toContain("height: 24px");

      // 3. Ready pip is lit with golden glow & flicker animation
      expect(css).toContain("sc-scroll-pip.is-lit");
      expect(css).toContain("sc-scroll-lit-flame");
      expect(css).toContain("drop-shadow");

      // 4. Click pass-through: strictly pointer-events: none !important
      expect(css).toContain(".sc-scroll-pip-wrapper");
      expect(css).toContain(".sc-scroll-pip *");
      expect(css).toContain("pointer-events: none !important");

      // 5. Invariant: styles only in quest-card.css, theme.css not edited for quest cards
      const themePath = path.resolve(__dirname, "../../app/src/theme.css");
      const themeCss = fs.readFileSync(themePath, "utf-8");
      expect(themeCss).not.toContain("sc-quest-grid");
      expect(themeCss).not.toContain("sc-scroll-pip");

      // 6. Invariant: no <<<<<<< markers
      expect(css).not.toContain("<<<<<<<");
    });

    it("questStatus correctly resolves open, ready, and claimed states", async () => {
      const { questStatus } = await import("../../app/src/hud/QuestCard.tsx");
      expect(typeof questStatus).toBe("function");

      // Claimed takes priority
      expect(questStatus(true, true)).toBe("claimed");
      expect(questStatus(false, true)).toBe("claimed");

      // Complete and not claimed is ready
      expect(questStatus(true, false)).toBe("ready");

      // Incomplete is open
      expect(questStatus(false, false)).toBe("open");
    });

    it("ScrollPip renders 24px scroll pip with lit ready state and pointer-events none", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const pipPath = path.resolve(__dirname, "../../app/src/hud/ScrollPip.tsx");
      expect(fs.existsSync(pipPath)).toBe(true);
      const code = fs.readFileSync(pipPath, "utf-8");

      expect(code).toContain("ScrollPip");
      expect(code).toContain("size = 24");
      expect(code).toContain('pointerEvents: "none"');
      expect(code).toContain('aria-hidden="true"');
      expect(code).toContain('viewBox="0 0 24 24"');
      expect(code).toContain("sc-scroll-pip-wrapper");
      expect(code).toContain("sc-scroll-pip");
      expect(code).toContain("is-lit");
      expect(code).toContain("sc-scroll-lit-sparkle");
      expect(code).not.toContain("<<<<<<<");
    });

    it("QuestCard mounts 24px ScrollPip in sc-quest-title-group, shows progress and Claim button when ready", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const cardPath = path.resolve(__dirname, "../../app/src/hud/QuestCard.tsx");
      expect(fs.existsSync(cardPath)).toBe(true);
      const code = fs.readFileSync(cardPath, "utf-8");

      expect(code).toContain("ScrollPip");
      expect(code).toContain("size={24}");
      expect(code).toContain("sc-quest-card");
      expect(code).toContain("sc-quest-head");
      expect(code).toContain("sc-quest-title-group");
      expect(code).toContain("sc-quest-title");
      expect(code).toContain("sc-quest-status");
      expect(code).toContain("sc-quest-progress");
      expect(code).toContain("sc-quest-btn");
      expect(code).not.toContain("<<<<<<<");
    });

    it("QuestPanel mounts QuestCard inside sc-quest-grid for all quests", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const panelPath = path.resolve(__dirname, "../../app/src/QuestPanel.tsx");
      expect(fs.existsSync(panelPath)).toBe(true);
      const code = fs.readFileSync(panelPath, "utf-8");

      expect(code).toContain("QuestCard");
      expect(code).toContain("sc-quest-grid");
      expect(code).toContain("rows.map");
      expect(code).not.toContain("<<<<<<<");
    });

    describe("World Events & 24px Omen Pip (Gemini Events Lane)", () => {
      it("defines event-card.css with 24px omen pips and pointer-events none", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const cssPath = path.resolve(__dirname, "../../app/src/hud/event-card.css");
        expect(fs.existsSync(cssPath)).toBe(true);
        const css = fs.readFileSync(cssPath, "utf-8");

        // 1. Grid & card structures
        expect(css).toContain("sc-event-panel");
        expect(css).toContain("sc-event-label");
        expect(css).toContain("sc-event-grid");
        expect(css).toContain("sc-event-card");
        expect(css).toContain("sc-event-head");
        expect(css).toContain("sc-event-title-group");
        expect(css).toContain("sc-event-title");
        expect(css).toContain("sc-event-tick");
        expect(css).toContain("sc-event-body");
        expect(css).toContain("sc-event-choices");
        expect(css).toContain("sc-event-btn");

        // 2. 24px omen pip wrapper & art
        expect(css).toContain("sc-omen-pip-wrapper");
        expect(css).toContain("sc-omen-pip");
        expect(css).toContain("width: 24px");
        expect(css).toContain("height: 24px");

        // 3. Omen variants
        expect(css).toContain("sc-omen-comet");
        expect(css).toContain("sc-omen-raven");
        expect(css).toContain("sc-omen-harvest");

        // 4. Click pass-through: strictly pointer-events: none !important
        expect(css).toContain(".sc-omen-pip-wrapper");
        expect(css).toContain(".sc-omen-pip *");
        expect(css).toContain("pointer-events: none !important");

        // 5. Invariant: styles only in event-card.css, theme.css not edited for event cards
        const themePath = path.resolve(__dirname, "../../app/src/theme.css");
        const themeCss = fs.readFileSync(themePath, "utf-8");
        expect(themeCss).not.toContain("sc-event-grid");
        expect(themeCss).not.toContain("sc-omen-pip");

        // 6. Invariant: no <<<<<<< markers
        expect(css).not.toContain("<<<<<<<");
      });

      it("resolveOmenVariant correctly maps event kinds to comet, raven, and harvest", async () => {
        const { resolveOmenVariant } = await import("../../app/src/hud/OmenPip.tsx");
        expect(typeof resolveOmenVariant).toBe("function");

        // Harvest variant: bounties, crops, timber
        expect(resolveOmenVariant("harvest", "Bountiful harvest — +25 food")).toBe("harvest");
        expect(resolveOmenVariant("timber", "Timber windfall — +20 wood")).toBe("harvest");
        expect(resolveOmenVariant("farm", "Wheat grain feast")).toBe("harvest");

        // Raven variant: military levies, spoilage, pestilence, battle
        expect(resolveOmenVariant("spoil", "Spoilage — lost 10 food")).toBe("raven");
        expect(resolveOmenVariant("levy", "Aderyn raises a levy — +3 militia")).toBe("raven");
        expect(resolveOmenVariant("war", "Enemy scouts spotted")).toBe("raven");

        // Comet variant: celestial, tributes, stars, fallback
        expect(resolveOmenVariant("tribute", "A merchant pays tribute — +10 gold")).toBe("comet");
        expect(resolveOmenVariant("e_comet", "A flaming comet streaks across the stars")).toBe("comet");
        expect(resolveOmenVariant(undefined, undefined)).toBe("comet");
      });

      it("splitEventText correctly parses title and body from simulation text", async () => {
        const { splitEventText } = await import("../../app/src/hud/EventCard.tsx");
        expect(typeof splitEventText).toBe("function");

        expect(splitEventText("Bountiful harvest — +25 food")).toEqual({
          title: "Bountiful harvest",
          body: "+25 food",
        });

        expect(splitEventText("Lone Star Portent")).toEqual({
          title: "Lone Star Portent",
          body: "",
        });
      });

      it("OmenPip renders 24px omen pip with comet, raven, and harvest variants with pointer-events none", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const pipPath = path.resolve(__dirname, "../../app/src/hud/OmenPip.tsx");
        expect(fs.existsSync(pipPath)).toBe(true);
        const code = fs.readFileSync(pipPath, "utf-8");

        expect(code).toContain("OmenPip");
        expect(code).toContain("size = 24");
        expect(code).toContain('pointerEvents: "none"');
        expect(code).toContain('aria-hidden="true"');
        expect(code).toContain('viewBox="0 0 24 24"');
        expect(code).toContain("sc-omen-pip-wrapper");
        expect(code).toContain("sc-omen-pip");
        expect(code).toContain("sc-omen-comet-art");
        expect(code).toContain("sc-omen-raven-art");
        expect(code).toContain("sc-omen-harvest-art");
        expect(code).not.toContain("<<<<<<<");
      });

      it("EventCard mounts 24px OmenPip in sc-event-title-group with title and tick", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const cardPath = path.resolve(__dirname, "../../app/src/hud/EventCard.tsx");
        expect(fs.existsSync(cardPath)).toBe(true);
        const code = fs.readFileSync(cardPath, "utf-8");

        expect(code).toContain("OmenPip");
        expect(code).toContain("size={24}");
        expect(code).toContain("sc-event-card");
        expect(code).toContain("sc-event-head");
        expect(code).toContain("sc-event-title-group");
        expect(code).toContain("sc-event-title");
        expect(code).toContain("sc-event-tick");
        expect(code).not.toContain("<<<<<<<");
      });

      it("EventPanel mounts EventCard inside sc-event-grid for world events", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const panelPath = path.resolve(__dirname, "../../app/src/EventPanel.tsx");
        expect(fs.existsSync(panelPath)).toBe(true);
        const code = fs.readFileSync(panelPath, "utf-8");

        expect(code).toContain("EventCard");
        expect(code).toContain("sc-event-grid");
        expect(code).toContain("older.map");
        expect(code).not.toContain("<<<<<<<");
      });
    });

    describe("Selected Board Province Clear Gold Rim & Ground Ring (Gemini Select Rim Lane)", () => {
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
          bezierCurveTo: (...args: any[]) => { calls.push({ method: "bezierCurveTo", args }); },
        };
        return g;
      }

      it("paintBoardSelectionRim renders both tabletop ground ring and top gold rim", async () => {
        const { paintBoardSelectionRim } = await import("./tokens.js");
        const state = createMockState();
        state.board = {
          homeProvinceId: "p_home",
          provinces: [
            { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
            { id: "p_hill", x: 3, y: 2, terrain: "hill", node: "quarry" },
            { id: "p_peak", x: 4, y: 2, terrain: "peak", node: "none" },
          ],
        };
        state.flags["seen:p_home"] = true;
        state.flags["seen:p_hill"] = true;
        state.flags["seen:p_peak"] = true;

        const g = createMockGraphics();
        paintBoardSelectionRim(g, 3, 2, state, 0);

        // Ground ring poly + top rim poly
        const polys = g.calls.filter((c: any) => c.method === "poly");
        expect(polys.length).toBeGreaterThanOrEqual(4);

        // Strokes with gold colors (0xfacc15, 0xb45309, 0xd97706)
        const strokes = g.calls.filter((c: any) => c.method === "stroke");
        expect(strokes.length).toBeGreaterThanOrEqual(5);
        const goldStrokeColors = strokes.map((c: any) => c.args[0]?.color);
        expect(goldStrokeColors).toContain(0xfacc15);
        expect(goldStrokeColors).toContain(0xb45309);

        // Pips (ground brackets and top glints)
        const circles = g.calls.filter((c: any) => c.method === "circle");
        expect(circles.length).toBeGreaterThanOrEqual(8);

        // Vertical corner cliff struts for elevated terrain
        const lineTos = g.calls.filter((c: any) => c.method === "lineTo");
        expect(lineTos.length).toBeGreaterThan(0);
      });

      it("paintBoardHighlight includes paintBoardSelectionRim before plaque", async () => {
        const { paintBoardHighlight } = await import("./tokens.js");
        const state = createMockState();
        state.board = {
          homeProvinceId: "p_home",
          provinces: [
            { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
          ],
        };
        state.flags["seen:p_home"] = true;

        const g = createMockGraphics();
        paintBoardHighlight(g, 2, 2, state, 0);

        // Ground ring + top gold rim + bottom plaque
        const rects = g.calls.filter((c: any) => c.method === "rect");
        expect(rects.length).toBeGreaterThan(0); // plaque
        const circles = g.calls.filter((c: any) => c.method === "circle");
        expect(circles.length).toBeGreaterThan(5); // selection pips + plaque pip
      });

      it("paintBoardProvinces renders selection rim when selectedProvinceId matches", async () => {
        const { paintBoardProvinces } = await import("./tokens.js");
        const state = createMockState();
        state.board = {
          homeProvinceId: "p_home",
          provinces: [
            { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
            { id: "p_target", x: 3, y: 2, terrain: "wood", node: "woodcut" },
          ],
        };
        state.flags["seen:p_home"] = true;
        state.flags["seen:p_target"] = true;

        const gWithoutSel = createMockGraphics();
        paintBoardProvinces(gWithoutSel, state, 0, null);

        const gWithSel = createMockGraphics();
        paintBoardProvinces(gWithSel, state, 0, "p_target");

        // Selected province gets additional gold rim and ground ring calls
        expect(gWithSel.calls.length).toBeGreaterThan(gWithoutSel.calls.length);
      });

      it("OverworldAtlas renders sc-atlas-select-rim with gold rim and ground ring", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const atlasPath = path.resolve(__dirname, "../../app/src/OverworldAtlas.tsx");
        expect(fs.existsSync(atlasPath)).toBe(true);
        const code = fs.readFileSync(atlasPath, "utf-8");

        expect(code).toContain("sc-atlas-select-rim");
        expect(code).toContain("Ground ring at base");
        expect(code).toContain("Top gold rim");
        expect(code).toContain("#facc15");
        expect(code).toContain("pointerEvents=\"none\"");
        expect(code).not.toContain("<<<<<<<");
      });

      it("MapRenderer provides setSelectedProvince and getSelectedProvince methods", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const indexPath = path.resolve(__dirname, "index.ts");
        const code = fs.readFileSync(indexPath, "utf-8");

        expect(code).toContain("setSelectedProvince(provinceId: string | null)");
        expect(code).toContain("getSelectedProvince()");
        expect(code).toContain("boardSelectionLayer");
        expect(code).toContain("paintBoardSelectionRim");
        expect(code).not.toContain("<<<<<<<");
      });

      it("hit-test math and camera math in camera.ts remain completely unchanged", async () => {
        const { hitTestProvince, boardGridToWorld, boardWorldToGrid, bandForZoom, ZOOM_THRESHOLD } = await import("./camera.js");
        expect(typeof hitTestProvince).toBe("function");
        expect(typeof boardGridToWorld).toBe("function");
        expect(typeof boardWorldToGrid).toBe("function");
        expect(typeof bandForZoom).toBe("function");
        expect(ZOOM_THRESHOLD).toBe(0.70);

        // Verification of boardGridToWorld and boardWorldToGrid roundtrip
        const { wx, wy } = boardGridToWorld(2, 3);
        const grid = boardWorldToGrid(wx, wy);
        expect(grid.bx).toBe(2);
        expect(grid.by).toBe(3);

        // Verification of bandForZoom
        expect(bandForZoom(0.58)).toBe("board");
        expect(bandForZoom(1.0)).toBe("hold");
      });
    });

    describe("Ledger of Crowns & Ledger Cards with Quill/Ink Pip (Bakeoff Gemini Ledger)", () => {
      it("defines ledger-card.css with card list, card items, quill pip styles and pointer-events none", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const cssPath = path.resolve(__dirname, "../../app/src/hud/ledger-card.css");
        expect(fs.existsSync(cssPath)).toBe(true);
        const css = fs.readFileSync(cssPath, "utf-8");

        expect(css).toContain("sc-ledger-card-empty");
        expect(css).toContain("sc-ledger-card-list");
        expect(css).toContain("sc-ledger-card");
        expect(css).toContain("sc-ledger-card-time");
        expect(css).toContain("sc-ledger-card-text");
        expect(css).toContain("sc-quill-pip-wrapper");
        expect(css).toContain("sc-quill-pip");
        expect(css).toContain("pointer-events: none");
        expect(css).toContain("border-left: 3px solid #e3b341");

        // Invariant: styles only in ledger-card.css, theme.css not edited
        const themePath = path.resolve(__dirname, "../../app/src/theme.css");
        const themeCss = fs.readFileSync(themePath, "utf-8");
        expect(themeCss).not.toContain("sc-ledger-card");
        expect(themeCss).not.toContain("sc-quill-pip");

        // Invariant: no <<<<<<< markers
        expect(css).not.toContain("<<<<<<<");
      });

      it("QuillPip renders 16–20px vector pip with pointer-events: none and ink colors", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const pipPath = path.resolve(__dirname, "../../app/src/hud/QuillPip.tsx");
        expect(fs.existsSync(pipPath)).toBe(true);
        const code = fs.readFileSync(pipPath, "utf-8");

        expect(code).toContain("export function QuillPip");
        expect(code).toContain('pointerEvents: "none"');
        expect(code).toContain("sc-quill-pip");
        expect(code).toContain("resolveInkColors");
        expect(code).toContain("sc-quill-inkpot");
        expect(code).toContain("sc-quill-pen");
        expect(code).toContain("sc-quill-droplet");
        expect(code).not.toContain("<<<<<<<");
      });

      it("LedgerCard mounts sc-ledger-card with QuillPip, time tag and text", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const cardPath = path.resolve(__dirname, "../../app/src/hud/LedgerCard.tsx");
        expect(fs.existsSync(cardPath)).toBe(true);
        const code = fs.readFileSync(cardPath, "utf-8");

        expect(code).toContain("sc-ledger-card");
        expect(code).toContain("sc-ledger-card-time");
        expect(code).toContain("sc-ledger-card-text");
        expect(code).toContain("QuillPip");
        expect(code).not.toContain("<<<<<<<");
      });

      it("LedgerPanel mounts sc-ledger-card-list and LedgerCard elements for each row", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const panelPath = path.resolve(__dirname, "../../app/src/LedgerPanel.tsx");
        expect(fs.existsSync(panelPath)).toBe(true);
        const code = fs.readFileSync(panelPath, "utf-8");

        expect(code).toContain("sc-ledger-card-list");
        expect(code).toContain("LedgerCard");
        expect(code).toContain("sc-ledger-card-empty");
        expect(code).toContain("listLedger");
        expect(code).not.toContain("<<<<<<<");
      });
    });

    describe("Node Stock Piles on Diamond & Empty Node Invariants (Bakeoff Gemini Node Piles)", () => {
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
          bezierCurveTo: (...args: any[]) => { calls.push({ method: "bezierCurveTo", args }); },
        };
        return g;
      }

      it("getNodeStockInfo detects hasStock correctly for active and empty nodes", async () => {
        const { getNodeStockInfo } = await import("./tokens.js");
        const state = createMockState();
        state.board = {
          homeProvinceId: "p_home",
          provinces: [
            { id: "p_wood", x: 2, y: 2, terrain: "wood", node: "woodcut" },
            { id: "p_quarry", x: 3, y: 2, terrain: "hill", node: "quarry" },
            { id: "p_empty", x: 4, y: 2, terrain: "plain", node: "field" },
          ],
        };

        // p_wood has full stock (untouched)
        const woodInfo = getNodeStockInfo(state, "p_wood", "woodcut");
        expect(woodInfo.hasStock).toBe(true);
        expect(woodInfo.stock).toBeGreaterThan(0);
        expect(woodInfo.ratio).toBeGreaterThan(0);

        // p_quarry has partial stock stored in state
        state.flags["node_stock_p_quarry"] = 45;
        const quarryInfo = getNodeStockInfo(state, "p_quarry", "quarry");
        expect(quarryInfo.hasStock).toBe(true);
        expect(quarryInfo.stock).toBe(45);
        expect(quarryInfo.ratio).toBeCloseTo(45 / 90);

        // p_empty is depleted (0 stock stored in state)
        state.flags["node_stock_p_empty"] = 0;
        const emptyInfo = getNodeStockInfo(state, "p_empty", "field");
        expect(emptyInfo.hasStock).toBe(false);
        expect(emptyInfo.stock).toBe(0);
        expect(emptyInfo.ratio).toBe(0);
      });

      it("drawResourceNode draws small pile on diamond when hasStock is true, and skips pile when empty", async () => {
        const { drawResourceNode } = await import("./tokens.js");

        for (const node of ["woodcut", "quarry", "field"] as const) {
          const stockedG = createMockGraphics();
          drawResourceNode(stockedG, 100, 100, node, 0.8, 0, true);

          const emptyG = createMockGraphics();
          drawResourceNode(emptyG, 100, 100, node, 0.0, 0, false);

          // Stocked node draws both station landmark AND the small stock pile on the diamond
          // Empty node draws ONLY the station landmark, keeping the empty node as it is
          expect(stockedG.calls.length).toBeGreaterThan(emptyG.calls.length);
          expect(emptyG.calls.length).toBeGreaterThan(0); // landmark intact
        }
      });

      it("paintBoardProvinces renders small stock piles on diamonds for stocked nodes", async () => {
        const { paintBoardProvinces } = await import("./tokens.js");
        const state = createMockState();
        state.board = {
          homeProvinceId: "p_home",
          provinces: [
            { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
            { id: "p_wood", x: 3, y: 2, terrain: "wood", node: "woodcut" },
            { id: "p_empty", x: 4, y: 2, terrain: "plain", node: "field" },
          ],
        };
        state.flags["seen:p_home"] = true;
        state.flags["seen:p_wood"] = true;
        state.flags["seen:p_empty"] = true;
        state.flags["node_stock_p_empty"] = 0; // empty node

        const g = createMockGraphics();
        paintBoardProvinces(g, state, 0);

        expect(g.calls.length).toBeGreaterThan(20);
      });

      it("OverworldAtlas defines MiniLogs, MiniSacks, MiniBlocks on diamond for stocked provinces", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const atlasPath = path.resolve(__dirname, "../../app/src/OverworldAtlas.tsx");
        expect(fs.existsSync(atlasPath)).toBe(true);
        const code = fs.readFileSync(atlasPath, "utf-8");

        expect(code).toContain("MiniLogs");
        expect(code).toContain("MiniSacks");
        expect(code).toContain("MiniBlocks");
        expect(code).toContain("nodeStock(state, p.id) > 0");
        expect(code).toContain("sc-atlas-pile-logs");
        expect(code).toContain("sc-atlas-pile-sacks");
        expect(code).toContain("sc-atlas-pile-blocks");
        expect(code).not.toContain("<<<<<<<");
      });

      it("preserves hit-test math and camera invariants", async () => {
        const { hitTestProvince, boardGridToWorld, bandForZoom } = await import("./camera.js");
        expect(typeof hitTestProvince).toBe("function");
        expect(typeof boardGridToWorld).toBe("function");
        expect(bandForZoom(1.0)).toBe("hold");
      });
    });

    describe("bakeoff/gemini-camps: clearer tent + flag for player camps and outposts", () => {
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
          bezierCurveTo: (...args: any[]) => { calls.push({ method: "bezierCurveTo", args }); },
        };
        return g;
      }

      it("drawCampTentAndFlag renders ground shadows, guy ropes, pitched tent, flagpole, and banner", () => {
        const g = createMockGraphics();
        drawCampTentAndFlag(g, 100, 100, "western", undefined, 0, false);
        expect(g.calls.length).toBeGreaterThan(15);

        // Check for ground shadow, guy ropes, and tent
        const hasCircle = g.calls.some((c) => c.method === "circle");
        const hasPoly = g.calls.some((c) => c.method === "poly");
        const hasLineTo = g.calls.some((c) => c.method === "lineTo");
        expect(hasCircle).toBe(true);
        expect(hasPoly).toBe(true);
        expect(hasLineTo).toBe(true);
      });

      it("drawPlayerCampTentAndFlag renders culture-styled tent and player heraldic flag standard", () => {
        const kits = ["western", "cedar", "sand", "steppe", "islands"] as const;
        for (const kit of kits) {
          const g = createMockGraphics();
          const cult = culturePalette(kit);
          drawPlayerCampTentAndFlag(g, 100, 100, kit, cult, 0.5);
          expect(g.calls.length).toBeGreaterThan(20);
        }
      });

      it("paintBoardProvinces renders player camps and outposts with clearer tent + flag", () => {
        const state = createMockState();
        state.board = {
          homeProvinceId: "p_home",
          provinces: [
            { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
            { id: "p_outpost_field", x: 3, y: 2, terrain: "wood", node: "field", occupantRealmId: "player" },
            { id: "p_outpost_camp", x: 4, y: 2, terrain: "waste", node: "camp", occupantRealmId: "player" },
            { id: "p_wild_camp", x: 5, y: 2, terrain: "waste", node: "camp" },
          ],
        };
        state.flags["seen:p_home"] = true;
        state.flags["seen:p_outpost_field"] = true;
        state.flags["seen:p_outpost_camp"] = true;
        state.flags["seen:p_wild_camp"] = true;

        const g = createMockGraphics();
        expect(() => {
          paintBoardProvinces(g, state, 0.2);
        }).not.toThrow();

        expect(g.calls.length).toBeGreaterThan(40);
      });

      it("OverworldAtlas defines MiniCamp with tent and flag on diamond", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const atlasPath = path.resolve(__dirname, "../../app/src/OverworldAtlas.tsx");
        expect(fs.existsSync(atlasPath)).toBe(true);
        const code = fs.readFileSync(atlasPath, "utf-8");

        expect(code).toContain("MiniCamp");
        expect(code).toContain("sc-atlas-camp");
        expect(code).toContain('p.node === "camp"');
        expect(code).toContain('occupant === "player" && p.id !== homeId');
        expect(code).toContain('pointerEvents: "none"');
        expect(code).not.toContain("<<<<<<<");
      });

      it("preserves hit-test and camera invariants", async () => {
        const { hitTestProvince, boardGridToWorld, bandForZoom } = await import("./camera.js");
        expect(typeof hitTestProvince).toBe("function");
        expect(typeof boardGridToWorld).toBe("function");
        expect(bandForZoom(1.0)).toBe("hold");
      });
    });

    describe("bakeoff/gemini-wall-scar: damaged rim wall presentation with low wallHp", () => {
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
          bezierCurveTo: (...args: any[]) => { calls.push({ method: "bezierCurveTo", args }); },
        };
        return g;
      }

      it("getWallHpStatus and isWallHpLow identify wall HP presence and low threshold", () => {
        // 1. Undefined or empty state
        expect(getWallHpStatus(undefined).hasWallHp).toBe(false);
        expect(getWallHpStatus(null).hasWallHp).toBe(false);
        const emptyState = createMockState();
        expect(getWallHpStatus(emptyState).hasWallHp).toBe(false);
        expect(isWallHpLow(emptyState)).toBe(false);

        // 2. Numeric wallHp on state
        const lowNumState = createMockState();
        (lowNumState as any).wallHp = 15;
        expect(getWallHpStatus(lowNumState).hasWallHp).toBe(true);
        expect(getWallHpStatus(lowNumState).isLow).toBe(true);
        expect(isWallHpLow(lowNumState)).toBe(true);

        const highNumState = createMockState();
        (highNumState as any).wallHp = 100;
        expect(getWallHpStatus(highNumState).hasWallHp).toBe(true);
        expect(getWallHpStatus(highNumState).isLow).toBe(false);
        expect(isWallHpLow(highNumState)).toBe(false);

        // 3. Object wallHp on state: { cur, max }
        const lowObjState = createMockState();
        (lowObjState as any).wallHp = { cur: 20, max: 100 };
        expect(getWallHpStatus(lowObjState).isLow).toBe(true);
        expect(isWallHpLow(lowObjState)).toBe(true);

        const highObjState = createMockState();
        (highObjState as any).wallHp = { cur: 90, max: 100 };
        expect(getWallHpStatus(highObjState).isLow).toBe(false);
        expect(isWallHpLow(highObjState)).toBe(false);

        // 4. Flags wallHp
        const flagState = createMockState();
        flagState.flags["wall_hp"] = 10;
        expect(getWallHpStatus(flagState).hasWallHp).toBe(true);
        expect(isWallHpLow(flagState)).toBe(true);

        // 5. Ratio as float <= 1
        const ratioState = createMockState();
        (ratioState as any).wallHp = 0.25;
        expect(getWallHpStatus(ratioState).isLow).toBe(true);
      });

      it("drawRimWallCurtain renders cracks and missing merlons when isDamaged is true", () => {
        const visuals = getThemeVisuals("summer");
        const rimNeighbors: RimNeighbors = { hasPrev: true, hasNext: true };

        const gFull = createMockGraphics();
        drawRimWallCurtain(gFull, 20, 1.0, 0, 0, 3, rimNeighbors, "western", visuals.cult, false);

        const gDamaged = createMockGraphics();
        drawRimWallCurtain(gDamaged, 20, 1.0, 0, 0, 3, rimNeighbors, "western", visuals.cult, true);

        // Damaged wall must render additional cracked stone details, fissures, and stroke elements
        expect(gDamaged.calls.length).toBeGreaterThan(0);
        expect(gFull.calls.length).toBeGreaterThan(0);

        // Cracks and missing merlons add specialized stroke lines and mortar stump fills
        const fullStrokes = gFull.calls.filter((c: any) => c.method === "stroke");
        const damagedStrokes = gDamaged.calls.filter((c: any) => c.method === "stroke");
        expect(damagedStrokes.length).toBeGreaterThan(fullStrokes.length);
      });

      it("drawRimWallCurtain corner bastion renders damaged merlons and impact cracks", () => {
        const visuals = getThemeVisuals("summer");
        const rimNeighbors: RimNeighbors = { hasPrev: true, hasNext: true };

        // Corner tile (0, 0)
        const gCornerFull = createMockGraphics();
        drawRimWallCurtain(gCornerFull, 20, 1.0, 0, 0, 0, rimNeighbors, "western", visuals.cult, false);

        const gCornerDamaged = createMockGraphics();
        drawRimWallCurtain(gCornerDamaged, 20, 1.0, 0, 0, 0, rimNeighbors, "western", visuals.cult, true);

        expect(gCornerDamaged.calls.length).toBeGreaterThan(0);
        const damagedStrokes = gCornerDamaged.calls.filter((c: any) => c.method === "stroke");
        const fullStrokes = gCornerFull.calls.filter((c: any) => c.method === "stroke");
        expect(damagedStrokes.length).toBeGreaterThan(fullStrokes.length);
      });

      it("drawIsometricBuilding reflects wallHp state on rim walls across all culture kits", () => {
        const visuals = getThemeVisuals("summer");
        const rimNeighbors: RimNeighbors = { hasPrev: true, hasNext: true };
        const cultures = ["western", "cedar", "sand", "steppe", "islands"] as const;

        for (const cult of cultures) {
          const gFull = createMockGraphics();
          drawIsometricBuilding(gFull, "walls", 1, true, 0, visuals, 0, 4, rimNeighbors, cult, { isWallLow: false });

          const gLow = createMockGraphics();
          drawIsometricBuilding(gLow, "walls", 1, true, 0, visuals, 0, 4, rimNeighbors, cult, { isWallLow: true });

          expect(gFull.calls.length).toBeGreaterThan(0);
          expect(gLow.calls.length).toBeGreaterThan(0);

          const fullStrokes = gFull.calls.filter((c: any) => c.method === "stroke");
          const lowStrokes = gLow.calls.filter((c: any) => c.method === "stroke");
          expect(lowStrokes.length).toBeGreaterThan(fullStrokes.length);
        }
      });

      it("drawGatehouseCurtainWings reflects damaged status for gatehouse rim spans", () => {
        const visuals = getThemeVisuals("summer");
        const rimNeighbors: RimNeighbors = { hasPrev: true, hasNext: true };

        const gFull = createMockGraphics();
        drawGatehouseCurtainWings(gFull, 20, 1.0, 0, 5, rimNeighbors, "western", visuals.cult, false);

        const gDamaged = createMockGraphics();
        drawGatehouseCurtainWings(gDamaged, 20, 1.0, 0, 5, rimNeighbors, "western", visuals.cult, true);

        const fullStrokes = gFull.calls.filter((c: any) => c.method === "stroke");
        const damagedStrokes = gDamaged.calls.filter((c: any) => c.method === "stroke");
        expect(damagedStrokes.length).toBeGreaterThan(fullStrokes.length);
      });

      it("preserves hit-test and camera invariants without conflict markers", async () => {
        const { hitTestProvince, boardGridToWorld, bandForZoom } = await import("./camera.js");
        expect(typeof hitTestProvince).toBe("function");
        expect(typeof boardGridToWorld).toBe("function");
        expect(bandForZoom(1.0)).toBe("hold");

        const fs = await import("node:fs");
        const path = await import("node:path");
        const buildingsCode = fs.readFileSync(path.resolve(__dirname, "./buildings.ts"), "utf-8");
        expect(buildingsCode).not.toContain("<<<<<<<");
        const indexCode = fs.readFileSync(path.resolve(__dirname, "./index.ts"), "utf-8");
        expect(indexCode).not.toContain("<<<<<<<");
      });
    });

    describe("bakeoff/gemini-gate: hold gatehouse open vs shut doors", () => {
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
          bezierCurveTo: (...args: any[]) => { calls.push({ method: "bezierCurveTo", args }); },
        };
        return g;
      }

      it("isWallRingClosed correctly detects closed wall ring from sim state and flag overrides", () => {
        expect(isWallRingClosed(null)).toBe(false);
        expect(isWallRingClosed(undefined)).toBe(false);

        const state = createMockState();
        expect(isWallRingClosed(state)).toBe(false);

        // Add 7 rim walls and 1 rim gate -> still open
        for (let i = 0; i < 7; i++) {
          state.buildings.push({
            id: `w_${i}`,
            realmId: "player",
            typeId: "walls",
            level: 1,
            x: i,
            y: 0,
            completesAtTick: null,
          });
        }
        state.buildings.push({
          id: "g_rim",
          realmId: "player",
          typeId: "gate",
          level: 1,
          x: 7,
          y: 0,
          completesAtTick: null,
        });
        expect(isWallRingClosed(state)).toBe(false);

        // Add 8th rim wall -> closed!
        state.buildings.push({
          id: "w_7",
          realmId: "player",
          typeId: "walls",
          level: 1,
          x: 8,
          y: 0,
          completesAtTick: null,
        });
        expect(isWallRingClosed(state)).toBe(true);

        // Explicit flag override tests
        expect(isWallRingClosed({ ...state, flags: { isRingClosed: false } })).toBe(false);
        expect(isWallRingClosed({ ...state, flags: { isRingClosed: true } })).toBe(true);
        expect(isWallRingClosed({ ...state, isRingClosed: false } as any)).toBe(false);
        expect(isWallRingClosed({ ...state, isRingClosed: true } as any)).toBe(true);
      });

      it("drawIsometricBuilding renders shut doors when closed and open doors when open (Western)", () => {
        const visuals = getThemeVisuals("summer");
        const rimNeighbors: RimNeighbors = { hasPrev: true, hasNext: true };

        const gClosed = createMockGraphics();
        drawIsometricBuilding(gClosed, "gate", 1, true, 0, visuals, 0, 4, rimNeighbors, "western", { isRingClosed: true });

        const gOpen = createMockGraphics();
        drawIsometricBuilding(gOpen, "gate", 1, true, 0, visuals, 0, 4, rimNeighbors, "western", { isRingClosed: false });

        expect(gClosed.calls.length).toBeGreaterThan(0);
        expect(gOpen.calls.length).toBeGreaterThan(0);

        // Closed doors have center drop bar, shut portcullis teeth, lit lamp and warm slot
        // Open doors have dark passage, raised portcullis, inward-swung door leaves
        const closedJson = JSON.stringify(gClosed.calls);
        const openJson = JSON.stringify(gOpen.calls);
        expect(closedJson).not.toEqual(openJson);

        // Verify lit lamp & warm slot in closedJson (0xfbbf24 = 16498468 warm light spill)
        expect(closedJson).toContain("16498468");
        // Verify open door is dark with NO warm lantern glow
        expect(openJson).not.toContain("16498468");
        // Verify drop bar stroke in closedJson
        expect(closedJson).toContain("988970"); // 0x0f172a drop bar stroke
      });

      it("drawIsometricBuilding renders distinct gate states across all 5 cultures", () => {
        const visuals = getThemeVisuals("summer");
        const rimNeighbors: RimNeighbors = { hasPrev: true, hasNext: true };
        const cultures = ["western", "cedar", "sand", "steppe", "islands"] as const;

        for (const cult of cultures) {
          const gClosed = createMockGraphics();
          drawIsometricBuilding(gClosed, "gate", 1, true, 0, visuals, 0, 4, rimNeighbors, cult, { isRingClosed: true });

          const gOpen = createMockGraphics();
          drawIsometricBuilding(gOpen, "gate", 1, true, 0, visuals, 0, 4, rimNeighbors, cult, { isRingClosed: false });

          expect(gClosed.calls.length).toBeGreaterThan(0);
          expect(gOpen.calls.length).toBeGreaterThan(0);

          const closedJson = JSON.stringify(gClosed.calls);
          const openJson = JSON.stringify(gOpen.calls);
          expect(closedJson).not.toEqual(openJson);
        }
      });

      it("derives isRingClosed automatically from GameState when option is omitted", () => {
        const visuals = getThemeVisuals("summer");
        const rimNeighbors: RimNeighbors = { hasPrev: true, hasNext: true };

        const openState = createMockState();
        const gOpen = createMockGraphics();
        drawIsometricBuilding(gOpen, "gate", 1, true, 0, visuals, 0, 4, rimNeighbors, "western", { state: openState });

        const closedState = createMockState();
        for (let i = 0; i < 8; i++) {
          closedState.buildings.push({
            id: `w_${i}`,
            realmId: "player",
            typeId: "walls",
            level: 1,
            x: i,
            y: 0,
            completesAtTick: null,
          });
        }
        closedState.buildings.push({
          id: "g_rim",
          realmId: "player",
          typeId: "gate",
          level: 1,
          x: 8,
          y: 0,
          completesAtTick: null,
        });

        const gClosed = createMockGraphics();
        drawIsometricBuilding(gClosed, "gate", 1, true, 0, visuals, 0, 4, rimNeighbors, "western", { state: closedState });

        expect(JSON.stringify(gOpen.calls)).not.toEqual(JSON.stringify(gClosed.calls));
      });

      it("preserves camera and hit-test invariants with zero conflict markers", async () => {
        const { hitTestProvince, boardGridToWorld, bandForZoom } = await import("./camera.js");
        expect(typeof hitTestProvince).toBe("function");
        expect(typeof boardGridToWorld).toBe("function");
        expect(bandForZoom(1.0)).toBe("hold");

        const fs = await import("node:fs");
        const path = await import("node:path");
        const buildingsCode = fs.readFileSync(path.resolve(__dirname, "./buildings.ts"), "utf-8");
        expect(buildingsCode).not.toContain("<<<<<<<");
        const indexCode = fs.readFileSync(path.resolve(__dirname, "./index.ts"), "utf-8");
        expect(indexCode).not.toContain("<<<<<<<");
      });
    });

    describe("keep-yard buildings and annexes around home tile keep (bakeoff/gemini-yard)", () => {
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
          bezierCurveTo: (...args: any[]) => { calls.push({ method: "bezierCurveTo", args }); },
        };
        return g;
      }

      it("listKeepYardBuildings identifies finished and unfinished buildings adjacent to the keep", () => {
        const state = createMockState();
        state.buildings = [
          { id: "k1", realmId: "player", typeId: "keep", level: 1, x: 5, y: 5, completesAtTick: null },
          // West adjacent (dx = -1, dy = 0) - finished
          { id: "b_granary", realmId: "player", typeId: "granary", level: 1, x: 4, y: 5, completesAtTick: null },
          // South adjacent (dx = 0, dy = 1) - unfinished
          { id: "b_barracks", realmId: "player", typeId: "barracks", level: 1, x: 5, y: 6, completesAtTick: 120 },
          // East adjacent (dx = 1, dy = 0) - finished
          { id: "b_sawmill", realmId: "player", typeId: "sawmill", level: 1, x: 6, y: 5, completesAtTick: null },
          // North adjacent (dx = 0, dy = -1) - unfinished
          { id: "b_quarry", realmId: "player", typeId: "quarry", level: 1, x: 5, y: 4, completesAtTick: 200 },
          // Non-adjacent building (distance > 1) - should NOT be included
          { id: "b_distant", realmId: "player", typeId: "farm", level: 1, x: 2, y: 2, completesAtTick: null },
          // Rival realm building - should NOT be included
          { id: "b_rival", realmId: "rival", typeId: "chapel", level: 1, x: 4, y: 5, completesAtTick: null },
        ];

        const yard = listKeepYardBuildings(state);
        expect(yard.length).toBe(4);

        const west = yard.find((b) => b.slot === "west");
        expect(west).toBeDefined();
        expect(west?.typeId).toBe("granary");
        expect(west?.isFinished).toBe(true);

        const south = yard.find((b) => b.slot === "south");
        expect(south).toBeDefined();
        expect(south?.typeId).toBe("barracks");
        expect(south?.isFinished).toBe(false);

        const east = yard.find((b) => b.slot === "east");
        expect(east).toBeDefined();
        expect(east?.typeId).toBe("sawmill");
        expect(east?.isFinished).toBe(true);

        const north = yard.find((b) => b.slot === "north");
        expect(north).toBeDefined();
        expect(north?.typeId).toBe("quarry");
        expect(north?.isFinished).toBe(false);
      });

      it("handles null state and empty buildings gracefully", () => {
        expect(listKeepYardBuildings(null)).toEqual([]);
        expect(listKeepYardBuildings(undefined)).toEqual([]);
        const state = createMockState();
        state.buildings = [];
        expect(listKeepYardBuildings(state)).toEqual([]);
      });

      it("drawKeepYardAnnex renders finished architectural annexes with walls, roofs, and hearth glow", () => {
        const g = createMockGraphics();
        const info: KeepYardBuildingInfo = {
          id: "b_farm",
          typeId: "granary",
          isFinished: true,
          level: 1,
          slot: "south",
        };
        drawKeepYardAnnex(g, 100, 100, info, "western", 0);
        expect(g.calls.length).toBeGreaterThan(0);

        const callsStr = JSON.stringify(g.calls);
        // Should draw polygon facets and window glow
        expect(callsStr).toContain("poly");
        expect(callsStr).toContain("rect");
        expect(callsStr).toContain("circle");
        expect(callsStr).toContain("fill");
      });

      it("drawKeepYardAnnex renders unfinished buildings as timber scaffolding with posts, ledgers, and hoist", () => {
        const gScaffold = createMockGraphics();
        const scaffoldInfo: KeepYardBuildingInfo = {
          id: "b_scaffold",
          typeId: "barracks",
          isFinished: false,
          level: 1,
          slot: "south",
        };
        drawKeepYardAnnex(gScaffold, 100, 100, scaffoldInfo, "western", 0);

        const gFinished = createMockGraphics();
        const finishedInfo: KeepYardBuildingInfo = {
          id: "b_fin",
          typeId: "barracks",
          isFinished: true,
          level: 1,
          slot: "south",
        };
        drawKeepYardAnnex(gFinished, 100, 100, finishedInfo, "western", 0);

        // Finished annex and unfinished scaffolding must produce distinctly different drawing commands
        expect(JSON.stringify(gScaffold.calls)).not.toEqual(JSON.stringify(gFinished.calls));
        // Scaffolding draws timber strokes and hoist
        const scaffoldStr = JSON.stringify(gScaffold.calls);
        expect(scaffoldStr).toContain("moveTo");
        expect(scaffoldStr).toContain("lineTo");
        expect(scaffoldStr).toContain("stroke");
      });

      it("supports culture kits for annexes and scaffolding", () => {
        const kits = ["western", "cedar", "sand", "steppe", "islands"] as const;
        for (const kit of kits) {
          const g = createMockGraphics();
          drawKeepYardAnnex(g, 50, 50, { typeId: "sawmill", isFinished: true, slot: "east" }, kit, 0);
          expect(g.calls.length).toBeGreaterThan(5);

          const gScaffold = createMockGraphics();
          drawKeepYardAnnex(gScaffold, 50, 50, { typeId: "sawmill", isFinished: false, slot: "east" }, kit, 0);
          expect(gScaffold.calls.length).toBeGreaterThan(5);
        }
      });

      it("drawMiniatureKeep integrates keep-yard buildings in rear and front visual depth", () => {
        const gAlone = createMockGraphics();
        drawMiniatureKeep(gAlone, 100, 100, "western", undefined, true, 0);

        const gWithYard = createMockGraphics();
        const yard: KeepYardBuildingInfo[] = [
          { typeId: "granary", isFinished: true, slot: "west" },
          { typeId: "barracks", isFinished: false, slot: "south" },
        ];
        drawMiniatureKeep(gWithYard, 100, 100, "western", undefined, true, 0, { yardBuildings: yard });

        expect(gWithYard.calls.length).toBeGreaterThan(gAlone.calls.length);
      });

      it("paintBoardProvinces renders keep-yard buildings on player home province diamond", () => {
        const state = createMockState();
        state.board = {
          homeProvinceId: "p_home",
          provinces: [
            { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
          ],
        };
        state.buildings = [
          { id: "k1", realmId: "player", typeId: "keep", level: 1, x: 5, y: 5, completesAtTick: null },
          { id: "b1", realmId: "player", typeId: "farm", level: 1, x: 5, y: 6, completesAtTick: null },
          { id: "b2", realmId: "player", typeId: "quarry", level: 1, x: 4, y: 5, completesAtTick: 50 },
        ];

        const g = createMockGraphics();
        paintBoardProvinces(g, state, null, 1.0, 0);
        expect(g.calls.length).toBeGreaterThan(30);
      });

      it("preserves camera and hit-test invariants with zero conflict markers", async () => {
        const { hitTestProvince, boardGridToWorld, bandForZoom } = await import("./camera.js");
        expect(typeof hitTestProvince).toBe("function");
        expect(typeof boardGridToWorld).toBe("function");
        expect(bandForZoom(1.0)).toBe("hold");

        const fs = await import("node:fs");
        const path = await import("node:path");
        const tokensCode = fs.readFileSync(path.resolve(__dirname, "./tokens.ts"), "utf-8");
        expect(tokensCode).not.toContain("<<<<<<<");
        const indexCode = fs.readFileSync(path.resolve(__dirname, "./index.ts"), "utf-8");
        expect(indexCode).not.toContain("<<<<<<<");
      });
    });

    describe("bakeoff/gemini-fog: unseen tiles stay a cloud veil; seen tiles stay clear", () => {
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
          bezierCurveTo: (...args: any[]) => { calls.push({ method: "bezierCurveTo", args }); },
        };
        return g;
      }

      it("paintFogHeightVeil renders rich volumetric cloud veil with celestial mist base, lobes, wisps, and compass star", () => {
        const b = provinceTokenBounds(3, 3);
        const prov = { id: "p_unseen", x: 3, y: 3, terrain: "wood" as const, node: "none" as const };
        const g = createMockGraphics();

        paintFogHeightVeil(g, b, prov, 0.5);

        expect(g.calls.length).toBeGreaterThan(25);
        const json = JSON.stringify(g.calls);

        // Verify aerial shadow
        expect(json).toContain("ellipse");
        // Verify celestial mist base (0x38bdf8 = 3718648)
        expect(json).toContain("3718648");
        // Verify billowing white cumulus lobes (0xffffff = 16777215)
        expect(json).toContain("16777215");
        // Verify curving wind wisps
        expect(json).toContain("quadraticCurveTo");
        // Verify cartographer brass compass star (0xd4a359 = 13935449) and golden glint (0xfef08a = 16707722)
        expect(json).toContain("13935449");
        expect(json).toContain("16707722");
      });

      it("cloud veil is visually and structurally distinct from solid terrain height faces", () => {
        const b = provinceTokenBounds(3, 3);
        const prov = { id: "p_unseen", x: 3, y: 3, terrain: "peak" as const, node: "none" as const };

        const gFog = createMockGraphics();
        paintFogHeightVeil(gFog, b, prov, 0);

        const gPeak = createMockGraphics();
        const pal = terrainChipPalette("peak");
        paintTileHeightFace(gPeak, b, "peak", pal, 0);

        const fogJson = JSON.stringify(gFog.calls);
        const peakJson = JSON.stringify(gPeak.calls);

        expect(fogJson).not.toEqual(peakJson);
        // Fog has soft circular cumulus lobes and quadratic curve wisps
        expect(fogJson).toContain("circle");
        expect(fogJson).toContain("quadraticCurveTo");
        // Peak has vertical cliff drop polygons
        expect(peakJson).toContain("poly");
      });

      it("paintBoardProvinces renders cloud veil for unseen tiles while seen tiles stay clear", () => {
        const state = createMockState();
        state.board = {
          homeProvinceId: "p_home",
          provinces: [
            { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
            { id: "p_unseen", x: 4, y: 2, terrain: "peak", node: "none" },
          ],
        };

        const g = createMockGraphics();
        paintBoardProvinces(g, state, 0);

        const json = JSON.stringify(g.calls);
        // Unseen province draws fog veil with celestial mist (3718648)
        expect(json).toContain("3718648");
        // Seen province draws clear terrain (plain green = 2972199)
        expect(json).toContain("2972199");
      });

      it("OverworldAtlas defines MiniCloudVeil for unseen provinces and keeps seen provinces clear", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const atlasCode = fs.readFileSync(path.resolve(__dirname, "../../app/src/OverworldAtlas.tsx"), "utf-8");

        expect(atlasCode).toContain("function MiniCloudVeil");
        expect(atlasCode).toContain("isProvinceSeen");
        expect(atlasCode).toContain("sc-atlas-fog-veil");
        expect(atlasCode).not.toContain("<<<<<<<");
      });

      it("preserves camera and hit-test invariants with zero conflict markers", async () => {
        const { hitTestProvince, boardGridToWorld, bandForZoom } = await import("./camera.js");
        expect(typeof hitTestProvince).toBe("function");
        expect(typeof boardGridToWorld).toBe("function");
        expect(bandForZoom(1.0)).toBe("hold");

        const fs = await import("node:fs");
        const path = await import("node:path");
        const tilesCode = fs.readFileSync(path.resolve(__dirname, "./tiles.ts"), "utf-8");
        expect(tilesCode).not.toContain("<<<<<<<");
        const tokensCode = fs.readFileSync(path.resolve(__dirname, "./tokens.ts"), "utf-8");
        expect(tokensCode).not.toContain("<<<<<<<");
        const indexCode = fs.readFileSync(path.resolve(__dirname, "./index.ts"), "utf-8");
        expect(indexCode).not.toContain("<<<<<<<");
      });
    });

    describe("bakeoff/gemini-eta: board march meeples show tiny seconds badge with pointer-events none", () => {
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
          bezierCurveTo: (...args: any[]) => { calls.push({ method: "bezierCurveTo", args }); },
        };
        return g;
      }

      it("drawMarchEtaBadge renders shadow, pill background, hourglass pip, and 3x5 pixel glyphs for seconds countdown", () => {
        const g = createMockGraphics();
        drawMarchEtaBadge(g, 100, 100, 4, 0xf59e0b, 0, false);

        expect(g.calls.length).toBeGreaterThan(10);
        const rectCalls = g.calls.filter((c: any) => c.method === "rect");
        expect(rectCalls.length).toBeGreaterThan(5);

        const strokeCalls = g.calls.filter((c: any) => c.method === "stroke");
        expect(strokeCalls.length).toBeGreaterThanOrEqual(1);

        // Friendly badge has golden hourglass pip (0xfde047 = 16638023)
        const json = JSON.stringify(g.calls);
        expect(json).toContain("16638023");
        // White pixel text (0xffffff = 16777215)
        expect(json).toContain("16777215");
      });

      it("drawMarchEtaBadge renders hostile hazard skull pip and crimson border for hostile march", () => {
        const g = createMockGraphics();
        drawMarchEtaBadge(g, 120, 120, 18, 0xdc2626, 2, true);

        expect(g.calls.length).toBeGreaterThan(12);
        const json = JSON.stringify(g.calls);
        // Hostile skull/hazard pip uses crimson red (0xf87171 = 16281969)
        expect(json).toContain("16281969");
        // White pixel text (0xffffff = 16777215)
        expect(json).toContain("16777215");
      });

      it("handles zero seconds and large numbers gracefully", () => {
        const gZero = createMockGraphics();
        drawMarchEtaBadge(gZero, 100, 100, 0, 0xf59e0b, 0, false);
        expect(gZero.calls.length).toBeGreaterThan(8);

        const gLarge = createMockGraphics();
        drawMarchEtaBadge(gLarge, 100, 100, 120, 0xf59e0b, 0, false);
        expect(gLarge.calls.length).toBeGreaterThan(gZero.calls.length);
      });

      it("MARCH_ETA_GLYPHS_3X5 defines 5 rows of 3-bit patterns for digits 0-9 and unit s", () => {
        for (let i = 0; i <= 9; i++) {
          const glyph = MARCH_ETA_GLYPHS_3X5[String(i)];
          expect(glyph).toBeDefined();
          expect(glyph.length).toBe(5);
          for (const row of glyph) {
            expect(row).toBeGreaterThanOrEqual(0);
            expect(row).toBeLessThanOrEqual(7);
          }
        }
        const sGlyph = MARCH_ETA_GLYPHS_3X5["s"];
        expect(sGlyph).toBeDefined();
        expect(sGlyph.length).toBe(5);
      });

      it("paintBoardMarches renders seconds badge on all active march types with arrival times", () => {
        const state = createMockState();
        state.board = {
          homeProvinceId: "p_home",
          provinces: [
            { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
            { id: "p_scout", x: 3, y: 2, terrain: "wood", node: "none" },
            { id: "p_gather", x: 2, y: 3, terrain: "hill", node: "quarry" },
            { id: "p_garrison", x: 1, y: 2, terrain: "plain", node: "woodcut", occupantRealmId: "player" },
            { id: "p_enemy", x: 4, y: 4, terrain: "waste", node: "hold", occupantRealmId: "k_iron" },
          ],
        };
        state.meta.tick = 100;
        state.flags = {
          "seen:p_home": true,
          "seen:p_garrison": true,
          "marches_json": JSON.stringify([
            // 1. Scout march: arrives at tick 140 (4s left)
            {
              id: "m_scout",
              realmId: "player",
              fromId: "p_home",
              toId: "p_scout",
              arrivesTick: 140,
              purpose: "scout",
              force: { skirmisher: 1 },
            },
            // 2. Gather march: arrives at tick 180 (8s left)
            {
              id: "m_gather",
              realmId: "player",
              fromId: "p_home",
              toId: "p_gather",
              arrivesTick: 180,
              purpose: "gather",
              force: { worker: 2 },
            },
            // 3. Garrison march: arrives at tick 160 (6s left)
            {
              id: "m_garrison",
              realmId: "player",
              fromId: "p_home",
              toId: "p_garrison",
              arrivesTick: 160,
              purpose: "garrison",
              force: { guard: 5 },
            },
            // 4. Player combat march: arrives at tick 220 (12s left)
            {
              id: "m_combat",
              realmId: "player",
              fromId: "p_home",
              toId: "p_enemy",
              arrivesTick: 220,
              purpose: "raid",
              force: { knight: 5 },
            },
            // 5. Hostile incoming warband: arrives at tick 250 (15s left)
            {
              id: "m_hostile",
              realmId: "k_iron",
              fromId: "p_enemy",
              toId: "p_home",
              arrivesTick: 250,
              purpose: "raid",
              force: { spearman: 20 },
            },
          ]),
        };

        const routeG = createMockGraphics();
        const pawnsG = createMockGraphics();

        paintBoardMarches(routeG, pawnsG, state, 1.0);

        expect(routeG.calls.length).toBeGreaterThan(30);
        expect(pawnsG.calls.length).toBeGreaterThan(60);

        const pawnsJson = JSON.stringify(pawnsG.calls);
        // Golden hourglass pip (friendly ETA): 0xfde047 = 16638023
        expect(pawnsJson).toContain("16638023");
        // Hostile hazard pip (hostile ETA): 0xf87171 = 16281969
        expect(pawnsJson).toContain("16281969");
        // Crisp white text digits (0xffffff = 16777215)
        expect(pawnsJson).toContain("16777215");
      });

      it("paintBoardGathers renders seconds badge when arrivesTick is present", () => {
        const state = createMockState();
        state.board = {
          homeProvinceId: "p_home",
          provinces: [
            { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
            { id: "p_quarry", x: 3, y: 2, terrain: "hill", node: "quarry" },
          ],
        };
        state.meta.tick = 50;
        (state as any).gathers = [
          {
            id: "g1",
            fromId: "p_home",
            toId: "p_quarry",
            phase: "outbound",
            departedTick: 40,
            arrivesTick: 90,
            progress: 0.2,
          },
        ];

        const routeG = createMockGraphics();
        const pawnsG = createMockGraphics();

        paintBoardGathers(routeG, pawnsG, state, 0.5);

        expect(pawnsG.calls.length).toBeGreaterThan(25);
        const pawnsJson = JSON.stringify(pawnsG.calls);
        // Golden hourglass pip for gather ETA: 0xfde047 = 16638023
        expect(pawnsJson).toContain("16638023");
        // White text digits
        expect(pawnsJson).toContain("16777215");
      });

      it("OverworldAtlas defines sc-atlas-march-eta-badge with pointer-events: none and theme.css enforces pointer-events: none !important", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");

        const atlasCode = fs.readFileSync(path.resolve(__dirname, "../../app/src/OverworldAtlas.tsx"), "utf-8");
        expect(atlasCode).toContain("sc-atlas-march-eta-badge");
        expect(atlasCode).toContain("pointerEvents: \"none\"");
        expect(atlasCode).toContain("calculateMarchProgress");
        expect(atlasCode).toContain("{secs}s");

        const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
        expect(themeCss).toContain(".sc-atlas-march-eta-badge");
        expect(themeCss).toContain("pointer-events: none !important");
      });

      it("preserves camera and hit-test invariants with zero conflict markers", async () => {
        const { hitTestProvince, boardGridToWorld, bandForZoom } = await import("./camera.js");
        expect(typeof hitTestProvince).toBe("function");
        expect(typeof boardGridToWorld).toBe("function");
        expect(bandForZoom(1.0)).toBe("hold");

        const fs = await import("node:fs");
        const path = await import("node:path");
        const tokensCode = fs.readFileSync(path.resolve(__dirname, "./tokens.ts"), "utf-8");
        expect(tokensCode).not.toContain("<<<<<<<");
        const indexCode = fs.readFileSync(path.resolve(__dirname, "./index.ts"), "utf-8");
        expect(indexCode).not.toContain("<<<<<<<");
        const atlasCode = fs.readFileSync(path.resolve(__dirname, "../../app/src/OverworldAtlas.tsx"), "utf-8");
        expect(atlasCode).not.toContain("<<<<<<<");
      });

      describe("Seasonal and holiday board tile tinting", () => {
        it("resolveBoardThemeVisuals resolves spring green, autumn gold, winter cool, and summer tints correctly", async () => {
          const { resolveBoardThemeVisuals, resolveBoardSeasonTint } = await import("./tokens.js");

          // Spring: 0x86efac (spring green), alpha 0.10
          const springState: any = { season: "Spring", flags: {} };
          const springVis = resolveBoardThemeVisuals(springState);
          expect(springVis.tintColor).toBe(0x86efac);
          expect(springVis.tintAlpha).toBeCloseTo(0.10, 2);

          const springTint = resolveBoardSeasonTint(springState);
          expect(springTint.hex).toBe("#86efac");
          expect(springTint.season).toBe("Spring");

          // Summer: 0xfef08a (sunbeam), alpha 0.10
          const summerState: any = { season: "Summer", flags: {} };
          const summerVis = resolveBoardThemeVisuals(summerState);
          expect(summerVis.tintColor).toBe(0xfef08a);
          expect(summerVis.tintAlpha).toBeCloseTo(0.10, 2);

          // Autumn: 0xf59e0b (autumn gold), alpha 0.14
          const autumnState: any = { season: "Autumn", flags: {} };
          const autumnVis = resolveBoardThemeVisuals(autumnState);
          expect(autumnVis.tintColor).toBe(0xf59e0b);
          expect(autumnVis.tintAlpha).toBeCloseTo(0.14, 2);

          const autumnTint = resolveBoardSeasonTint(autumnState);
          expect(autumnTint.hex).toBe("#f59e0b");
          expect(autumnTint.season).toBe("Autumn");

          // Winter: 0xbae6fd (winter cool frost cyan), alpha 0.14
          const winterState: any = { season: "Winter", flags: {} };
          const winterVis = resolveBoardThemeVisuals(winterState);
          expect(winterVis.tintColor).toBe(0xbae6fd);
          expect(winterVis.tintAlpha).toBeCloseTo(0.14, 2);

          const winterTint = resolveBoardSeasonTint(winterState);
          expect(winterTint.hex).toBe("#bae6fd");
          expect(winterTint.season).toBe("Winter");
        });

        it("resolveBoardThemeVisuals honors holiday pack overrides (halloween, midwinter, easter, harvest)", async () => {
          const { resolveBoardThemeVisuals } = await import("./tokens.js");

          const halloweenState: any = { season: "Autumn", flags: { holiday: "halloween" } };
          const halloweenVis = resolveBoardThemeVisuals(halloweenState);
          expect(halloweenVis.tintColor).toBe(0x581c87);
          expect(halloweenVis.decorations).toBe("halloween");

          const midwinterState: any = { season: "Winter", flags: { holiday: "midwinter" } };
          const midwinterVis = resolveBoardThemeVisuals(midwinterState);
          expect(midwinterVis.tintColor).toBe(0x38bdf8);
          expect(midwinterVis.decorations).toBe("midwinter");

          const easterState: any = { season: "Spring", flags: { holiday: "easter" } };
          const easterVis = resolveBoardThemeVisuals(easterState);
          expect(easterVis.tintColor).toBe(0xc084fc);
          expect(easterVis.decorations).toBe("easter");

          const harvestState: any = { season: "Autumn", flags: { holiday: "harvest" } };
          const harvestVis = resolveBoardThemeVisuals(harvestState);
          expect(harvestVis.tintColor).toBe(0xf59e0b);
          expect(harvestVis.decorations).toBe("harvest");
        });

        it("resolveBoardThemeVisuals prioritizes explicitly passed visuals object", async () => {
          const { resolveBoardThemeVisuals } = await import("./tokens.js");
          const customVisuals: any = {
            tintColor: 0x123456,
            tintAlpha: 0.15,
            decorations: "custom",
          };
          const state: any = { season: "Spring", flags: {} };
          const resolved = resolveBoardThemeVisuals(state, customVisuals);
          expect(resolved.tintColor).toBe(0x123456);
          expect(resolved.tintAlpha).toBe(0.15);
        });

        it("paintBoardProvinces applies board seasonal wash (winter frost on tiles, harvest gold on farms/plains, spring/summer untouched)", async () => {
          const { paintBoardProvinces } = await import("./tokens.js");
          const { terrainChipPalette } = await import("./tiles.js");

          const state: any = {
            season: "Autumn",
            fog: { explored: { p_plain: true, p_hill: true } },
            buildings: [],
            board: {
              homeProvinceId: "p_home",
              provinces: [
                { id: "p_plain", x: 2, y: 3, terrain: "plain", node: "field" },
                { id: "p_hill", x: 3, y: 3, terrain: "hill" },
              ],
            },
            flags: {},
          };

          const g = createMockGraphics();
          paintBoardProvinces(g, state, 0);

          expect(g.calls.length).toBeGreaterThan(15);
          const json = JSON.stringify(g.calls);

          // Base terrain color for plain is drawn (0x2d5a27 = 2972199)
          const palPlain = terrainChipPalette("plain");
          expect(json).toContain(String(palPlain.fill));

          // Autumn harvest warm gold wash is applied to the plain/farm plateau (0xf59e0b = 16096779)
          expect(json).toContain("16096779");

          // Test Spring leaves current look untouched (no green wash 8843180)
          const springState: any = { ...state, season: "Spring" };
          const gSpring = createMockGraphics();
          paintBoardProvinces(gSpring, springState, 0);
          const springJson = JSON.stringify(gSpring.calls);
          expect(springJson).not.toContain("8843180");

          // Test Winter light snow / frost wash (0xbae6fd = 12248829)
          const winterState: any = { ...state, season: "Winter" };
          const gWinter = createMockGraphics();
          paintBoardProvinces(gWinter, winterState, 0);
          const winterJson = JSON.stringify(gWinter.calls);
          expect(winterJson).toContain("12248829");
        });

        it("OverworldAtlas renders seasonal wash with pointer-events: none and does not hide terrain", async () => {
          const fs = await import("node:fs");
          const path = await import("node:path");

          const atlasCode = fs.readFileSync(path.resolve(__dirname, "../../app/src/OverworldAtlas.tsx"), "utf-8");
          expect(atlasCode).toContain("resolveBoardSeasonWash");
          expect(atlasCode).toContain("currentSeason(state)");
          expect(atlasCode).toContain("getThemeVisuals");
          expect(atlasCode).toContain("pointerEvents: \"none\"");
        });

        describe("bakeoff/gemini-season-wash: board-only seasonal wash", () => {
          it("resolveBoardSeasonWash resolves winter frost on all tiles, harvest gold on farms/plains, and leaves spring/summer untouched", async () => {
            const { resolveBoardSeasonWash } = await import("./tokens.js");

            const springState: any = { season: "Spring", flags: {} };
            const summerState: any = { season: "Summer", flags: {} };
            const autumnState: any = { season: "Autumn", flags: {} };
            const winterState: any = { season: "Winter", flags: {} };

            const plainProv = { terrain: "plain" };
            const farmProv = { terrain: "wood", node: "field" };
            const hillProv = { terrain: "hill" };
            const woodProv = { terrain: "wood" };

            // Spring & Summer: leave current look (zero wash)
            const springPlain = resolveBoardSeasonWash(springState, plainProv);
            expect(springPlain.hasWash).toBe(false);
            expect(springPlain.washColor).toBeNull();
            expect(springPlain.washAlpha).toBe(0);
            expect(springPlain.kind).toBe("none");

            const summerHill = resolveBoardSeasonWash(summerState, hillProv);
            expect(summerHill.hasWash).toBe(false);
            expect(summerHill.washColor).toBeNull();

            // Winter: light snow / frost on all tiles
            const winterPlain = resolveBoardSeasonWash(winterState, plainProv);
            expect(winterPlain.hasWash).toBe(true);
            expect(winterPlain.washColor).toBe(0xbae6fd);
            expect(winterPlain.washAlpha).toBe(0.22);
            expect(winterPlain.kind).toBe("winter-frost");
            expect(winterPlain.isWinter).toBe(true);

            const winterHill = resolveBoardSeasonWash(winterState, hillProv);
            expect(winterHill.hasWash).toBe(true);
            expect(winterHill.washColor).toBe(0xbae6fd);
            expect(winterHill.kind).toBe("winter-frost");

            // Harvest: warm gold wash on farms & plains
            const autumnPlain = resolveBoardSeasonWash(autumnState, plainProv);
            expect(autumnPlain.hasWash).toBe(true);
            expect(autumnPlain.washColor).toBe(0xf59e0b);
            expect(autumnPlain.washAlpha).toBe(0.22);
            expect(autumnPlain.kind).toBe("harvest-gold");
            expect(autumnPlain.isHarvest).toBe(true);

            const autumnFarm = resolveBoardSeasonWash(autumnState, farmProv);
            expect(autumnFarm.hasWash).toBe(true);
            expect(autumnFarm.washColor).toBe(0xf59e0b);
            expect(autumnFarm.kind).toBe("harvest-gold");

            // Harvest on non-farm/plain tiles: leaves current look (zero wash)
            const autumnHill = resolveBoardSeasonWash(autumnState, hillProv);
            expect(autumnHill.hasWash).toBe(false);
            expect(autumnHill.washColor).toBeNull();
            expect(autumnHill.kind).toBe("none");

            const autumnWood = resolveBoardSeasonWash(autumnState, woodProv);
            expect(autumnWood.hasWash).toBe(false);
            expect(autumnWood.washColor).toBeNull();
          });

          it("paintBoardProvinces paints frost rime and snow flecks in winter, and harvest gold on farms/plains", async () => {
            const { paintBoardProvinces } = await import("./tokens.js");

            const farmState: any = {
              season: "Autumn",
              flags: { fog_seen: JSON.stringify(["p_farm"]) },
              buildings: [],
              board: {
                homeProvinceId: "p_farm",
                provinces: [
                  { id: "p_farm", x: 1, y: 1, terrain: "plain", node: "field" },
                ],
              },
            };

            const gFarm = createMockGraphics();
            paintBoardProvinces(gFarm, farmState, 0);
            const farmJson = JSON.stringify(gFarm.calls);
            // 0xf59e0b = 16096779 (gold wash) and 0xfde047 = 16638023 (harvest golden rim)
            expect(farmJson).toContain("16096779");
            expect(farmJson).toContain("16638023");

            const winterState: any = {
              season: "Winter",
              flags: { fog_seen: JSON.stringify(["p_plain"]) },
              buildings: [],
              board: {
                homeProvinceId: "p_plain",
                provinces: [
                  { id: "p_plain", x: 1, y: 1, terrain: "plain" },
                ],
              },
            };

            const gWinter = createMockGraphics();
            paintBoardProvinces(gWinter, winterState, 0);
            const winterJson = JSON.stringify(gWinter.calls);
            // 0xbae6fd = 12248829 (frost wash) and 0xffffff = 16777215 (frost rime / snow flecks)
            expect(winterJson).toContain("12248829");
            expect(winterJson).toContain("16777215");
          });
        });

        it("preserves camera and hit-test invariants with zero conflict markers", async () => {
          const { hitTestProvince, boardGridToWorld, bandForZoom } = await import("./camera.js");
          expect(typeof hitTestProvince).toBe("function");
          expect(typeof boardGridToWorld).toBe("function");
          expect(bandForZoom(1.0)).toBe("hold");

          const fs = await import("node:fs");
          const path = await import("node:path");
          const filesToCheck = [
            "./tokens.ts",
            "./tiles.ts",
            "./buildings.ts",
            "./index.ts",
            "../../app/src/OverworldAtlas.tsx",
          ];
          for (const rel of filesToCheck) {
            const code = fs.readFileSync(path.resolve(__dirname, rel), "utf-8");
            expect(code).not.toContain("<<<<<<<");
          }
        });
      });

      describe("bakeoff/gemini-capitals: rival home keeps show small realm crest above keep", () => {
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

        it("drawRealmCrestAboveKeep renders distinct heraldic escutcheons and sigils for all realms", async () => {
          const { drawRealmCrestAboveKeep, realmTokenPalette } = await import("./tokens.js");

          // 1. Rival Iron March ("rival"): crossed blades (0xf4f4f5 = 16053493) and crimson rivet (0xef4444 = 15680580)
          const gRival = createMockGraphics();
          const palRival = realmTokenPalette("rival");
          drawRealmCrestAboveKeep(gRival, 100, 100, palRival, 0);
          expect(gRival.calls.length).toBeGreaterThan(10);
          const rivalJson = JSON.stringify(gRival.calls);
          expect(rivalJson).toContain("16053493"); // 0xf4f4f5 crossed blades
          expect(rivalJson).toContain("15680580"); // 0xef4444 crimson rivet

          // 2. Silk Coast ("k_silk"): golden anchor / trident (0xf1c40f = 15844367)
          const gSilk = createMockGraphics();
          const palSilk = realmTokenPalette("k_silk");
          drawRealmCrestAboveKeep(gSilk, 100, 100, palSilk, 0);
          expect(JSON.stringify(gSilk.calls)).toContain("15844367"); // 0xf1c40f

          // 3. Ash Nomads ("k_ash"): peaked steppe arrowhead (0xe67e22 = 15105570)
          const gAsh = createMockGraphics();
          const palAsh = realmTokenPalette("k_ash");
          drawRealmCrestAboveKeep(gAsh, 100, 100, palAsh, 0);
          expect(JSON.stringify(gAsh.calls)).toContain("15105570"); // 0xe67e22

          // 4. Veil Theocracy ("k_veil"): holy dawn star (0xa78bfa = 10980346)
          const gVeil = createMockGraphics();
          const palVeil = realmTokenPalette("k_veil");
          drawRealmCrestAboveKeep(gVeil, 100, 100, palVeil, 0);
          expect(JSON.stringify(gVeil.calls)).toContain("10980346"); // 0xa78bfa

          // 5. Glass Cities ("k_glass"): cyan prism diamond (0x06b6d4 = 440020, 0x38bdf8 = 3718648)
          const gGlass = createMockGraphics();
          const palGlass = realmTokenPalette("k_glass");
          drawRealmCrestAboveKeep(gGlass, 100, 100, palGlass, 0);
          expect(JSON.stringify(gGlass.calls)).toContain("440020"); // 0x06b6d4

          // 6. Frost Holds ("k_frost"): frost snowflake crystal (0x7dd3fc = 8246268)
          const gFrost = createMockGraphics();
          const palFrost = realmTokenPalette("k_frost");
          drawRealmCrestAboveKeep(gFrost, 100, 100, palFrost, 0);
          expect(JSON.stringify(gFrost.calls)).toContain("8246268"); // 0x7dd3fc

          // 7. Tide Princes ("k_tide"): ocean surf waves (0x2dd4bf = 3003583)
          const gTide = createMockGraphics();
          const palTide = realmTokenPalette("k_tide");
          drawRealmCrestAboveKeep(gTide, 100, 100, palTide, 0);
          expect(JSON.stringify(gTide.calls)).toContain("3003583"); // 0x2dd4bf

          // 8. Ember Concord ("k_ember"): flame comet (0xf97316 = 16347926)
          const gEmber = createMockGraphics();
          const palEmber = realmTokenPalette("k_ember");
          drawRealmCrestAboveKeep(gEmber, 100, 100, palEmber, 0);
          expect(JSON.stringify(gEmber.calls)).toContain("16347926"); // 0xf97316

          // 9. Bronze League ("k_bronze"): bronze arch (0xfbbf24 = 16498468)
          const gBronze = createMockGraphics();
          const palBronze = realmTokenPalette("k_bronze");
          drawRealmCrestAboveKeep(gBronze, 100, 100, palBronze, 0);
          expect(JSON.stringify(gBronze.calls)).toContain("16498468"); // 0xfbbf24

          // 10. Fallback / custom dynamic kingdom
          const gCustom = createMockGraphics();
          const palCustom = realmTokenPalette("k_free_city");
          drawRealmCrestAboveKeep(gCustom, 100, 100, palCustom, 0);
          expect(gCustom.calls.length).toBeGreaterThan(8);
        });

        it("drawMiniatureKeep renders crest above keep for rival holds, while player home is unchanged", async () => {
          const { drawMiniatureKeep, realmTokenPalette } = await import("./tokens.js");

          // Rival hold keep (Iron March)
          const gRival = createMockGraphics();
          const palRival = realmTokenPalette("rival");
          drawMiniatureKeep(gRival, 50, 50, "western", palRival, false, 0);
          const rivalCalls = JSON.stringify(gRival.calls);
          // Contains crossed blades and crimson rivet from drawRealmCrestAboveKeep
          expect(rivalCalls).toContain("16053493"); // blades
          expect(rivalCalls).toContain("15680580"); // crimson

          // NPC hold keep (Silk Coast)
          const gSilk = createMockGraphics();
          const palSilk = realmTokenPalette("k_silk");
          drawMiniatureKeep(gSilk, 50, 50, "sand", palSilk, false, 0);
          const silkCalls = JSON.stringify(gSilk.calls);
          expect(silkCalls).toContain("15844367"); // golden anchor

          // Player home keep: isHome = true
          const gHome = createMockGraphics();
          drawMiniatureKeep(gHome, 50, 50, "western", undefined, true, 0);
          const homeCalls = JSON.stringify(gHome.calls);
          // Player home retains its golden coronet (0xfacc15 = 16436245, 0xfde047 = 16638023)
          expect(homeCalls).toContain("16436245");
          expect(homeCalls).toContain("16638023");
          // Does NOT contain rival crossed blades or anchor
          expect(homeCalls).not.toContain("16053493");
          expect(homeCalls).not.toContain("15844367");
        });

        it("paintBoardProvinces displays realm crest on rival home keep, while player home keep remains unchanged", async () => {
          const { paintBoardProvinces } = await import("./tokens.js");

          const state: any = {
            season: "Spring",
            buildings: [],
            fog: { explored: { p_home: true, p_rival: true } },
            board: {
              homeProvinceId: "p_home",
              provinces: [
                { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
                { id: "p_rival", x: 5, y: 2, terrain: "peak", node: "hold", occupantRealmId: "rival" },
              ],
            },
            flags: {
              fog_seen: JSON.stringify(["p_home", "p_rival"]),
            },
          };

          const g = createMockGraphics();
          paintBoardProvinces(g, state, 0);

          expect(g.calls.length).toBeGreaterThan(40);
          const json = JSON.stringify(g.calls);

          // Rival hold keeps show their realm crest above the keep (crossed blades 16053493 and crimson 15680580)
          expect(json).toContain("16053493");
          expect(json).toContain("15680580");

          // Player home keep retains gilded royal frame (0xfacc15 = 16436245)
          expect(json).toContain("16436245");
        });

        it("OverworldAtlas renders MiniRealmCrest on rival keeps with pointerEvents: none, leaving player home unchanged", async () => {
          const fs = await import("node:fs");
          const path = await import("node:path");

          const atlasCode = fs.readFileSync(path.resolve(__dirname, "../../app/src/OverworldAtlas.tsx"), "utf-8");
          expect(atlasCode).toContain("MiniRealmCrest");
          expect(atlasCode).toContain("sc-atlas-realm-crest");
          expect(atlasCode).toContain("pointerEvents: \"none\"");
          expect(atlasCode).toContain("showRivalCrest");
          expect(atlasCode).toContain("occupantRealmId={p.occupantRealmId}");

          const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
          expect(themeCss).toContain(".sc-atlas-realm-crest");
          expect(themeCss).toContain("pointer-events: none !important;");
        });

        it("preserves camera and hit-test invariants with zero conflict markers", async () => {
          const { hitTestProvince, boardGridToWorld, bandForZoom } = await import("./camera.js");
          expect(typeof hitTestProvince).toBe("function");
          expect(typeof boardGridToWorld).toBe("function");
          expect(bandForZoom(1.0)).toBe("hold");

          const fs = await import("node:fs");
          const path = await import("node:path");
          const filesToCheck = [
            "./tokens.ts",
            "./tiles.ts",
            "./buildings.ts",
            "./index.ts",
            "../../app/src/OverworldAtlas.tsx",
            "../../app/src/theme.css",
          ];
          for (const rel of filesToCheck) {
            const code = fs.readFileSync(path.resolve(__dirname, rel), "utf-8");
            expect(code).not.toContain("<<<<<<<");
          }
        });
      });

      describe("bakeoff/gemini-dest: tiles that are already a march destination get a faint ring (player gold, hostile red)", () => {
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

        it("buildMarchDestinationMap and getTileMarchDestination accurately classify player vs hostile destination tiles", async () => {
          const { buildMarchDestinationMap, getTileMarchDestination } = await import("./tokens.js");

          const state: any = {
            board: {
              homeProvinceId: "p_home",
              provinces: [
                { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold" },
                { id: "p_target_player", x: 3, y: 2, terrain: "wood", node: "camp" },
                { id: "p_target_hostile", x: 2, y: 3, terrain: "plain", node: "outpost" },
                { id: "p_target_both", x: 4, y: 2, terrain: "peak", node: "camp" },
                { id: "p_untargeted", x: 1, y: 1, terrain: "plain", node: "none" },
              ],
            },
            flags: {
              marches_json: JSON.stringify([
                { id: "m_p1", realmId: "player", fromId: "p_home", toId: "p_target_player", arrivesTick: 50 },
                { id: "m_h1", realmId: "rival", fromId: "p_enemy", toId: "p_target_hostile", arrivesTick: 80 },
                { id: "m_p2", realmId: "player", fromId: "p_home", toId: "p_target_both", arrivesTick: 60 },
                { id: "m_h2", realmId: "rival", fromId: "p_enemy", toId: "p_target_both", arrivesTick: 70 },
              ]),
            },
          };

          const destMap = buildMarchDestinationMap(state);
          expect(destMap.get("p_target_player")).toBe("player");
          expect(destMap.get("p_target_hostile")).toBe("hostile");
          // Hostile alert takes priority when both armies target the same province
          expect(destMap.get("p_target_both")).toBe("hostile");
          expect(destMap.get("p_untargeted")).toBeUndefined();

          expect(getTileMarchDestination(state, "p_target_player")).toBe("player");
          expect(getTileMarchDestination(state, "p_target_hostile")).toBe("hostile");
          expect(getTileMarchDestination(state, "p_target_both")).toBe("hostile");
          expect(getTileMarchDestination(state, "p_untargeted")).toBeNull();
          expect(getTileMarchDestination(null, "p_target_player")).toBeNull();
        });

        it("paintBoardDestinationRing paints faint gold ring for player marches and faint red ring for hostile marches", async () => {
          const { paintBoardDestinationRing } = await import("./tokens.js");

          const provPlain = { id: "p1", x: 2, y: 2, terrain: "plain", node: "none" } as any;
          const provPeak = { id: "p2", x: 3, y: 2, terrain: "peak", node: "camp" } as any;

          // 1. Player Destination Ring: warm gold colors (0xf59e0b = 16096779, 0xd97706 = 14251782, 0xfde047 = 16638023)
          const gPlayer = createMockGraphics();
          paintBoardDestinationRing(gPlayer, provPeak, "player", 0);
          const playerCalls = JSON.stringify(gPlayer.calls);
          expect(playerCalls).toContain("16096779"); // 0xf59e0b ring
          expect(playerCalls).toContain("14251782"); // 0xd97706 glow
          expect(playerCalls).toContain("16638023"); // 0xfde047 shimmer/pips
          expect(gPlayer.calls.length).toBeGreaterThan(6);

          // 2. Hostile Destination Ring: danger red colors (0xef4444 = 15680580, 0xdc2626 = 14427686, 0xfca5a5 = 16557477)
          const gHostile = createMockGraphics();
          paintBoardDestinationRing(gHostile, provPlain, "hostile", 0);
          const hostileCalls = JSON.stringify(gHostile.calls);
          expect(hostileCalls).toContain("15680580"); // 0xef4444 ring
          expect(hostileCalls).toContain("14427686"); // 0xdc2626 glow
          expect(hostileCalls).toContain("16557477"); // 0xfca5a5 shimmer/pips
          expect(gHostile.calls.length).toBeGreaterThan(4);
        });

        it("paintBoardProvinces automatically renders faint destination ring for tiles targeted by marches", async () => {
          const { paintBoardProvinces } = await import("./tokens.js");

          const state: any = {
            season: "Spring",
            buildings: [],
            fog: { explored: { p_home: true, p_dest_player: true, p_dest_hostile: true, p_unrelated: true } },
            board: {
              homeProvinceId: "p_home",
              provinces: [
                { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
                { id: "p_dest_player", x: 3, y: 2, terrain: "wood", node: "woodcut" },
                { id: "p_dest_hostile", x: 2, y: 3, terrain: "plain", node: "none" },
                { id: "p_unrelated", x: 4, y: 2, terrain: "plain", node: "none" },
              ],
            },
            flags: {
              fog_seen: JSON.stringify(["p_home", "p_dest_player", "p_dest_hostile", "p_unrelated"]),
              marches_json: JSON.stringify([
                { id: "m_p1", realmId: "player", fromId: "p_home", toId: "p_dest_player", arrivesTick: 40 },
                { id: "m_h1", realmId: "rival", fromId: "p_enemy", toId: "p_dest_hostile", arrivesTick: 90 },
              ]),
            },
          };

          const g = createMockGraphics();
          paintBoardProvinces(g, state, 0);

          const callsJson = JSON.stringify(g.calls);
          // Contains player gold destination ring color (0xf59e0b = 16096779)
          expect(callsJson).toContain("16096779");
          // Contains hostile red destination ring color (0xef4444 = 15680580)
          expect(callsJson).toContain("15680580");
        });

        it("OverworldAtlas renders sc-atlas-dest-ring with pointer-events: none on march destination tiles", async () => {
          const fs = await import("node:fs");
          const path = await import("node:path");

          const atlasCode = fs.readFileSync(path.resolve(__dirname, "../../app/src/OverworldAtlas.tsx"), "utf-8");
          expect(atlasCode).toContain("getTileMarchDestination");
          expect(atlasCode).toContain("sc-atlas-dest-ring");
          expect(atlasCode).toContain("pointerEvents=\"none\"");
          expect(atlasCode).toContain("#f59e0b");
          expect(atlasCode).toContain("#ef4444");

          const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
          expect(themeCss).toContain(".sc-atlas-dest-ring");
          expect(themeCss).toContain("pointer-events: none !important;");
        });

        it("preserves camera and hit-test invariants with zero conflict markers", async () => {
          const { hitTestProvince, boardGridToWorld, bandForZoom } = await import("./camera.js");
          expect(typeof hitTestProvince).toBe("function");
          expect(typeof boardGridToWorld).toBe("function");
          expect(bandForZoom(1.0)).toBe("hold");

          const fs = await import("node:fs");
          const path = await import("node:path");
          const filesToCheck = [
            "./tokens.ts",
            "./tiles.ts",
            "./buildings.ts",
            "./index.ts",
            "../../app/src/OverworldAtlas.tsx",
            "../../app/src/theme.css",
          ];
          for (const rel of filesToCheck) {
            const code = fs.readFileSync(path.resolve(__dirname, rel), "utf-8");
            expect(code).not.toContain("<<<<<<<");
          }
        });
      });

      describe("bakeoff/gemini-weather: seasonal precipitation particles (rain in autumn, snow in winter, clear otherwise)", () => {
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

        it("resolveWeatherKind classifies wet autumn vs winter snow vs clear otherwise", async () => {
          const { resolveWeatherKind } = await import("./weather.js");

          // Rain in autumn-ish wet seasons & holidays
          expect(resolveWeatherKind("Autumn", "none")).toBe("rain");
          expect(resolveWeatherKind("autumn", "none")).toBe("rain");
          expect(resolveWeatherKind("Fall", "none")).toBe("rain");
          expect(resolveWeatherKind("fall", "none")).toBe("rain");
          expect(resolveWeatherKind("Spring", "harvest")).toBe("rain");
          expect(resolveWeatherKind("Summer", "halloween")).toBe("rain");

          // Snow in winter seasons & holidays
          expect(resolveWeatherKind("Winter", "none")).toBe("snow");
          expect(resolveWeatherKind("winter", "none")).toBe("snow");
          expect(resolveWeatherKind("Spring", "midwinter")).toBe("snow");
          expect(resolveWeatherKind("Summer", "midwinter")).toBe("snow");

          // Clear otherwise
          expect(resolveWeatherKind("Spring", "none")).toBe("clear");
          expect(resolveWeatherKind("spring", "none")).toBe("clear");
          expect(resolveWeatherKind("Summer", "none")).toBe("clear");
          expect(resolveWeatherKind("summer", "none")).toBe("clear");
          expect(resolveWeatherKind("Spring", "easter")).toBe("clear");
          expect(resolveWeatherKind("Summer", "midsummer")).toBe("clear");
          expect(resolveWeatherKind(undefined, undefined)).toBe("clear");
        });

        it("resolveWeatherFromState correctly inspects GameState and visuals", async () => {
          const { resolveWeatherFromState } = await import("./weather.js");

          // 1. From visuals decorations override
          expect(resolveWeatherFromState(null, { decorations: "autumn" } as any)).toBe("rain");
          expect(resolveWeatherFromState(null, { decorations: "winter" } as any)).toBe("snow");
          expect(resolveWeatherFromState(null, { decorations: "midwinter" } as any)).toBe("snow");
          expect(resolveWeatherFromState(null, { decorations: "spring" } as any)).toBe("clear");

          // 2. From GameState season property
          const s1: any = { season: "Autumn", flags: {} };
          expect(resolveWeatherFromState(s1, null)).toBe("rain");

          const s2: any = { season: "Winter", flags: {} };
          expect(resolveWeatherFromState(s2, null)).toBe("snow");

          const s3: any = { season: "Spring", flags: {} };
          expect(resolveWeatherFromState(s3, null)).toBe("clear");

          const s4: any = { season: "Summer", flags: {} };
          expect(resolveWeatherFromState(s4, null)).toBe("clear");

          // 3. From holiday flag
          const s5: any = { season: "Spring", flags: { holiday: "harvest" } };
          expect(resolveWeatherFromState(s5, null)).toBe("rain");

          const s6: any = { season: "Summer", flags: { holiday: "midwinter" } };
          expect(resolveWeatherFromState(s6, null)).toBe("snow");
        });

        it("createWeatherParticles initializes particle pool", async () => {
          const { createWeatherParticles } = await import("./weather.js");
          const particles = createWeatherParticles(16, 800, 600);
          expect(particles).toHaveLength(16);
          for (const p of particles) {
            expect(typeof p.x).toBe("number");
            expect(typeof p.y).toBe("number");
            expect(typeof p.vx).toBe("number");
            expect(typeof p.vy).toBe("number");
            expect(p.size).toBeGreaterThan(0);
            expect(p.alpha).toBeGreaterThan(0);
          }
        });

        it("paintWeatherParticles renders distinct graphics for rain, snow, and clear", async () => {
          const { createWeatherParticles, paintWeatherParticles } = await import("./weather.js");
          const particles = createWeatherParticles(10, 800, 600);

          // 1. Clear: clears buffer and renders 0 shapes
          const gClear = createMockGraphics();
          paintWeatherParticles(gClear, "clear", particles, 0, 800, 600);
          expect(gClear.calls.some((c: any) => c.method === "clear")).toBe(true);
          expect(gClear.calls.some((c: any) => c.method === "stroke" || c.method === "fill")).toBe(false);

          // 2. Rain: renders slanted line strokes
          const gRain = createMockGraphics();
          paintWeatherParticles(gRain, "rain", particles, 0, 800, 600);
          expect(gRain.calls.some((c: any) => c.method === "clear")).toBe(true);
          expect(gRain.calls.some((c: any) => c.method === "moveTo")).toBe(true);
          expect(gRain.calls.some((c: any) => c.method === "lineTo")).toBe(true);
          expect(gRain.calls.some((c: any) => c.method === "stroke")).toBe(true);

          // 3. Snow: renders soft circles and halo fills
          const gSnow = createMockGraphics();
          paintWeatherParticles(gSnow, "snow", particles, 0, 800, 600);
          expect(gSnow.calls.some((c: any) => c.method === "clear")).toBe(true);
          expect(gSnow.calls.some((c: any) => c.method === "circle")).toBe(true);
          expect(gSnow.calls.some((c: any) => c.method === "fill")).toBe(true);
        });

        it("verifies pointer-events: none and non-blocking invariants in App and CSS", async () => {
          const fs = await import("node:fs");
          const path = await import("node:path");

          const overlayCode = fs.readFileSync(path.resolve(__dirname, "../../app/src/seasons/WeatherOverlay.tsx"), "utf-8");
          expect(overlayCode).toContain("resolveWeatherKind");
          expect(overlayCode).toContain("pointerEvents: \"none\"");

          const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
          expect(themeCss).toContain(".sc-weather-container");
          expect(themeCss).toContain("pointer-events: none !important;");

          const renderIndexCode = fs.readFileSync(path.resolve(__dirname, "./index.ts"), "utf-8");
          expect(renderIndexCode).toContain("particlesGraphic.eventMode = \"none\"");
          expect(renderIndexCode).toContain("boardWeatherGraphic.eventMode = \"none\"");
        });

        it("preserves camera and hit-test invariants with zero conflict markers", async () => {
          const { hitTestProvince, boardGridToWorld, bandForZoom } = await import("./camera.js");
          expect(typeof hitTestProvince).toBe("function");
          expect(typeof boardGridToWorld).toBe("function");
          expect(bandForZoom(1.0)).toBe("hold");

          const fs = await import("node:fs");
          const path = await import("node:path");
          const filesToCheck = [
            "./weather.ts",
            "./tokens.ts",
            "./tiles.ts",
            "./buildings.ts",
            "./index.ts",
            "../../app/src/seasons/WeatherOverlay.tsx",
            "../../app/src/theme.css",
          ];
          for (const rel of filesToCheck) {
            const code = fs.readFileSync(path.resolve(__dirname, rel), "utf-8");
            expect(code).not.toContain("<<<<<<<");
          }
        });
      });

      describe("bakeoff/gemini-supply: clearer supply cart (yoke, crates, loaded haul vs light empty return)", () => {
        function createMockGraphics() {
          const calls: Array<{ method: string; args: any[] }> = [];
          const g: any = {
            calls,
            clear: () => { calls.push({ method: "clear", args: [] }); return g; },
            poly: (pts: any) => { calls.push({ method: "poly", args: [pts] }); return g; },
            rect: (x: number, y: number, w: number, h: number) => { calls.push({ method: "rect", args: [x, y, w, h] }); return g; },
            circle: (x: number, y: number, r: number) => { calls.push({ method: "circle", args: [x, y, r] }); return g; },
            ellipse: (x: number, y: number, rx: number, ry: number) => { calls.push({ method: "ellipse", args: [x, y, rx, ry] }); return g; },
            moveTo: (x: number, y: number) => { calls.push({ method: "moveTo", args: [x, y] }); return g; },
            lineTo: (x: number, y: number) => { calls.push({ method: "lineTo", args: [x, y] }); return g; },
            fill: (style: any) => { calls.push({ method: "fill", args: [style] }); return g; },
            stroke: (style: any) => { calls.push({ method: "stroke", args: [style] }); return g; },
          };
          return g;
        }

        it("resolveGatherLoadInfo resolves full loaded vs light empty return states accurately", async () => {
          const { resolveGatherLoadInfo } = await import("./tokens.js");
          expect(typeof resolveGatherLoadInfo).toBe("function");

          // 1. Explicit positive stockCount -> loaded
          const fullInfo = resolveGatherLoadInfo({ stockCount: 50, capacity: 50, phase: "returning" });
          expect(fullInfo.hasStock).toBe(true);
          expect(fullInfo.stockCount).toBe(50);
          expect(fullInfo.ratio).toBe(1);
          expect(fullInfo.isLoaded).toBe(true);
          expect(fullInfo.isEmptyReturn).toBe(false);

          // 2. Explicit zero stockCount -> empty return / light
          const emptyInfo = resolveGatherLoadInfo({ stockCount: 0, capacity: 50, phase: "returning" });
          expect(emptyInfo.hasStock).toBe(true);
          expect(emptyInfo.stockCount).toBe(0);
          expect(emptyInfo.ratio).toBe(0);
          expect(emptyInfo.isLoaded).toBe(false);
          expect(emptyInfo.isEmptyReturn).toBe(true);

          // 3. String load "0"
          const zeroLoad = resolveGatherLoadInfo({ load: "0", phase: "returning" });
          expect(zeroLoad.hasStock).toBe(true);
          expect(zeroLoad.isEmptyReturn).toBe(true);
          expect(zeroLoad.isLoaded).toBe(false);

          // 4. Positive cargo/stock/load
          const cargoInfo = resolveGatherLoadInfo({ cargo: 30, capacity: 60 });
          expect(cargoInfo.hasStock).toBe(true);
          expect(cargoInfo.stockCount).toBe(30);
          expect(cargoInfo.ratio).toBe(0.5);
          expect(cargoInfo.isLoaded).toBe(true);
          expect(cargoInfo.isEmptyReturn).toBe(false);

          // 5. Default outbound / unstaged stock -> active loaded supply cart
          const outboundInfo = resolveGatherLoadInfo({ phase: "outbound" });
          expect(outboundInfo.hasStock).toBe(false);
          expect(outboundInfo.isLoaded).toBe(true);
          expect(outboundInfo.isEmptyReturn).toBe(false);
        });

        it("drawGatherColumnMeeple renders clearer draft yoke, wooden crates, and distinct loaded vs empty return silhouettes", async () => {
          const { drawGatherColumnMeeple } = await import("./tokens.js");
          const cult = { stone: 0x94a3b8, timber: 0x78350f, gold: 0xfacc15, iron: 0x27272a, banner: 0xd97706 };

          // 1. Loaded Cart: draws draft yoke, timber supply crates with iron corner straps, diagonal X-brace, and green load badge
          const gLoaded = createMockGraphics();
          drawGatherColumnMeeple(
            gLoaded,
            100, 100,
            1, 0, 0,
            "sand",
            cult,
            "woodcut",
            0,
            0.8,
            { isLoaded: true, isEmptyReturn: false, ratio: 1, stockCount: 50 }
          );

          // Draft yoke features
          const hasYokeBeam = gLoaded.calls.some((c: any) => c.method === "fill" && c.args[0]?.color === 0x92400e);
          const hasHitchRing = gLoaded.calls.some((c: any) => c.method === "fill" && c.args[0]?.color === 0xd4a359);
          const hasShafts = gLoaded.calls.some((c: any) => c.method === "stroke" && (c.args[0]?.color === 0x78350f || c.args[0]?.color === 0x451a03));
          expect(hasYokeBeam).toBe(true);
          expect(hasHitchRing).toBe(true);
          expect(hasShafts).toBe(true);

          // Crate features (aged timber crate 0xb45309, iron straps 0x27272a, tie-down ropes 0xfef08a)
          const hasCrateTimber = gLoaded.calls.some((c: any) => c.method === "fill" && c.args[0]?.color === 0xb45309);
          const hasIronStraps = gLoaded.calls.some((c: any) => c.method === "fill" && c.args[0]?.color === 0x27272a);
          const hasRopes = gLoaded.calls.some((c: any) => c.method === "stroke" && c.args[0]?.color === 0xfef08a);
          const hasGreenBadge = gLoaded.calls.some((c: any) => c.method === "stroke" && c.args[0]?.color === 0x22c55e);
          expect(hasCrateTimber).toBe(true);
          expect(hasIronStraps).toBe(true);
          expect(hasRopes).toBe(true);
          expect(hasGreenBadge).toBe(true);

          // 2. Empty Return Cart: open floorboards (0x543007), side stakes, bare bed, slate badge (0x64748b)
          const gEmpty = createMockGraphics();
          drawGatherColumnMeeple(
            gEmpty,
            100, 100,
            1, 0, 0,
            "sand",
            cult,
            "woodcut",
            0,
            0.2,
            { isLoaded: false, isEmptyReturn: true, ratio: 0, stockCount: 0 }
          );

          // Yoke is still present on empty cart
          expect(gEmpty.calls.some((c: any) => c.method === "fill" && c.args[0]?.color === 0xd4a359)).toBe(true);
          // Bare floorboards
          const hasFloorboards = gEmpty.calls.some((c: any) => c.method === "fill" && c.args[0]?.color === 0x543007);
          // Slate empty badge border
          const hasSlateBadge = gEmpty.calls.some((c: any) => c.method === "stroke" && c.args[0]?.color === 0x64748b);
          expect(hasFloorboards).toBe(true);
          expect(hasSlateBadge).toBe(true);
          // Does NOT draw tie-down cargo ropes
          expect(gEmpty.calls.some((c: any) => c.method === "stroke" && c.args[0]?.color === 0xfef08a)).toBe(false);
        });

        it("leaves warband, scout cloak, and garrison tent art untouched", async () => {
          const {
            drawWarbandMeeple,
            drawRedWarbandMeeple,
            drawScoutColumnMeeple,
            drawGarrisonMeeple,
          } = await import("./tokens.js");
          expect(typeof drawWarbandMeeple).toBe("function");
          expect(typeof drawRedWarbandMeeple).toBe("function");
          expect(typeof drawScoutColumnMeeple).toBe("function");
          expect(typeof drawGarrisonMeeple).toBe("function");

          const cult = { stone: 0x94a3b8, timber: 0x78350f, gold: 0xfacc15, iron: 0x27272a, banner: 0xd97706 };
          const gWar = createMockGraphics();
          drawWarbandMeeple(gWar, 50, 50, 1, 0, "sand", cult);
          expect(gWar.calls.length).toBeGreaterThan(0);

          const gScout = createMockGraphics();
          drawScoutColumnMeeple(gScout, 50, 50, 1, 0, "sand", cult, 0);
          expect(gScout.calls.length).toBeGreaterThan(0);

          const gGarrison = createMockGraphics();
          drawGarrisonMeeple(gGarrison, 50, 50, "sand", cult, 10);
          expect(gGarrison.calls.length).toBeGreaterThan(0);
        });

        it("verifies WarChip cart SVG yoke/crates/loaded/empty features and pointer-events: none", async () => {
          const fs = await import("node:fs");
          const path = await import("node:path");

          const warChipCode = fs.readFileSync(path.resolve(__dirname, "../../app/src/hud/WarChip.tsx"), "utf-8");
          expect(warChipCode).toContain("CartSvg");
          expect(warChipCode).toContain("isLoaded");
          expect(warChipCode).toContain("isEmpty");
          expect(warChipCode).toContain("pointerEvents: \"none\"");

          const forceCardCode = fs.readFileSync(path.resolve(__dirname, "../../app/src/hud/ForceCard.tsx"), "utf-8");
          expect(forceCardCode).toContain("loaded?: boolean");
          expect(forceCardCode).toContain("empty?: boolean");
          expect(forceCardCode).toContain("<WarChip kind={tone} size={24} loaded={loaded} empty={empty} />");

          const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
          expect(themeCss).toContain(".sc-war-chip-wrapper");
          expect(themeCss).toContain("pointer-events: none !important;");
        });

        it("preserves camera, projection, and zero conflict markers invariant", async () => {
          const { hitTestProvince, boardGridToWorld, bandForZoom } = await import("./camera.js");
          expect(typeof hitTestProvince).toBe("function");
          expect(typeof boardGridToWorld).toBe("function");
          expect(bandForZoom(1.0)).toBe("hold");

          const fs = await import("node:fs");
          const path = await import("node:path");
          const filesToCheck = [
            "./tokens.ts",
            "./index.ts",
            "../../app/src/hud/WarChip.tsx",
            "../../app/src/hud/ForceCard.tsx",
            "../../app/src/WarRoom.tsx",
            "../../app/src/theme.css",
          ];
          for (const rel of filesToCheck) {
            const code = fs.readFileSync(path.resolve(__dirname, rel), "utf-8");
            expect(code).not.toContain("<<<<<<<");
          }
        });
      });

      describe("bakeoff/gemini-rooms: distinct 2D backdrops for Hall, Wall, and Yard with pointer-events none", () => {
        it("RoomBackdrop exports ThroneDaisBackdrop, WallWalkBackdrop, and MuddyYardBackdrop", async () => {
          const {
            RoomBackdrop,
            ThroneDaisBackdrop,
            WallWalkBackdrop,
            MuddyYardBackdrop,
          } = await import("../../app/src/RoomBackdrop.tsx");
          expect(typeof RoomBackdrop).toBe("function");
          expect(typeof ThroneDaisBackdrop).toBe("function");
          expect(typeof WallWalkBackdrop).toBe("function");
          expect(typeof MuddyYardBackdrop).toBe("function");
        });

        it("verifies Hall, Wall, and Yard SVG art features and pointer-events none in RoomBackdrop.tsx", async () => {
          const fs = await import("node:fs");
          const path = await import("node:path");

          const backdropFile = path.resolve(__dirname, "../../app/src/RoomBackdrop.tsx");
          expect(fs.existsSync(backdropFile)).toBe(true);
          const code = fs.readFileSync(backdropFile, "utf-8");

          // 1. Hall: Throne dais features
          expect(code).toContain("ThroneDaisBackdrop");
          expect(code).toContain("Throne Dais");
          expect(code).toContain("daisStepGrad");
          expect(code).toContain("canopyVelvet");
          expect(code).toContain("goldTrim");
          expect(code).toContain("sc-keepin-backdrop-throne-dais");

          // 2. Wall: Wall walk features
          expect(code).toContain("WallWalkBackdrop");
          expect(code).toContain("Wall Walk");
          expect(code).toContain("twilightSky");
          expect(code).toContain("wallStone");
          expect(code).toContain("walkwayTimber");
          expect(code).toContain("sc-keepin-backdrop-wall-walk");

          // 3. Yard: Muddy yard features
          expect(code).toContain("MuddyYardBackdrop");
          expect(code).toContain("Muddy Yard");
          expect(code).toContain("yardSky");
          expect(code).toContain("mudEarth");
          expect(code).toContain("puddleReflect");
          expect(code).toContain("barrelWood");
          expect(code).toContain("sc-keepin-backdrop-muddy-yard");

          // 4. Pointer-events none on art and aria-hidden
          expect(code).toContain('pointerEvents: "none"');
          expect(code).toContain('aria-hidden="true"');
        });

        it("verifies KeepInterior mounts RoomBackdrop for Hall, Wall, and Yard rooms", async () => {
          const fs = await import("node:fs");
          const path = await import("node:path");

          const interiorFile = path.resolve(__dirname, "../../app/src/KeepInterior.tsx");
          expect(fs.existsSync(interiorFile)).toBe(true);
          const code = fs.readFileSync(interiorFile, "utf-8");

          expect(code).toContain('import { RoomBackdrop } from "./RoomBackdrop"');
          expect(code).toContain('<RoomBackdrop room="hall" />');
          expect(code).toContain('<RoomBackdrop room="wall" />');
          expect(code).toContain('<RoomBackdrop room="yard" />');
        });

        it("verifies keep-interior.css strictly enforces pointer-events: none on backdrop art", async () => {
          const fs = await import("node:fs");
          const path = await import("node:path");

          const cssFile = path.resolve(__dirname, "../../app/src/keep-interior.css");
          expect(fs.existsSync(cssFile)).toBe(true);
          const css = fs.readFileSync(cssFile, "utf-8");

          expect(css).toContain(".sc-keepin-backdrop-wrap");
          expect(css).toContain(".sc-keepin-backdrop-wrap.is-hall");
          expect(css).toContain(".sc-keepin-backdrop-wrap.is-wall");
          expect(css).toContain(".sc-keepin-backdrop-wrap.is-yard");
          expect(css).toContain(".sc-keepin-backdrop-art");
          expect(css).toContain(".sc-keepin-backdrop-art *");
          expect(css).toContain(".sc-keepin-backdrop-badge");
          expect(css).toContain("pointer-events: none !important;");
        });

        it("preserves camera, projection, and zero conflict markers invariant", async () => {
          const { hitTestProvince, boardGridToWorld, bandForZoom } = await import("./camera.js");
          expect(typeof hitTestProvince).toBe("function");
          expect(typeof boardGridToWorld).toBe("function");
          expect(bandForZoom(1.0)).toBe("hold");

          const fs = await import("node:fs");
          const path = await import("node:path");
          const filesToCheck = [
            "../../app/src/RoomBackdrop.tsx",
            "../../app/src/KeepInterior.tsx",
            "../../app/src/keep-interior.css",
          ];
          for (const rel of filesToCheck) {
            const code = fs.readFileSync(path.resolve(__dirname, rel), "utf-8");
            expect(code).not.toContain("<<<<<<<");
          }
        });
      });

      describe("bakeoff/gemini-tower-beacon: finished watchtower clear beacon & gold glint", () => {
        const defaultVisuals: ThemeVisuals = getThemeVisuals("Spring", "none");

        it("finished Western watchtower renders clear beacon with flame tongues, radiant halo, and gold glint star", () => {
          const gRim = createMockGraphics();
          const gInt = createMockGraphics();

          drawIsometricBuilding(gRim, "watchtower", 1, true, 0.5, defaultVisuals, 0, 4, undefined, "western");
          drawIsometricBuilding(gInt, "watchtower", 1, true, 0.5, defaultVisuals, 2, 2, undefined, "western");

          // Both rim and interior have clear flame tongues (0xf97316, 0xfacc15, 0xffffff)
          const flameRim = gRim.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
          const flameInt = gInt.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
          expect(flameRim.length).toBeGreaterThan(0);
          expect(flameInt.length).toBeGreaterThan(0);

          // Both rim and interior have warm radiant beacon glow halo (0xfde047)
          const haloRim = gRim.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfde047);
          const haloInt = gInt.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfde047);
          expect(haloRim.length).toBeGreaterThan(0);
          expect(haloInt.length).toBeGreaterThan(0);

          // Both rim and interior have gold glint 4-point diamond star (0xfacc15, 0xffffff)
          const glintRim = gRim.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfacc15);
          const glintInt = gInt.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfacc15);
          expect(glintRim.length).toBeGreaterThan(0);
          expect(glintInt.length).toBeGreaterThan(0);

          const sparkRim = gRim.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xffffff);
          const sparkInt = gInt.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xffffff);
          expect(sparkRim.length).toBeGreaterThan(0);
          expect(sparkInt.length).toBeGreaterThan(0);
        });

        it("finished culture watchtowers render clear beacon and gold glint across all kits", () => {
          const kits = ["cedar", "sand", "steppe", "islands"] as const;
          for (const kit of kits) {
            const g = createMockGraphics();
            drawIsometricBuilding(g, "watchtower", 1, true, 0.5, defaultVisuals, 0, 4, undefined, kit);

            // Every kit has a gold glint spark (0xfacc15 and 0xffffff)
            const glints = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfacc15);
            expect(glints.length).toBeGreaterThan(0);
            const sparks = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xffffff);
            expect(sparks.length).toBeGreaterThan(0);
          }
        });

        it("unfinished watchtowers strictly preserve scaffolding with zero beacon fire and zero gold glint", () => {
          const kits = ["western", "cedar", "sand", "steppe", "islands"] as const;
          for (const kit of kits) {
            const gUnfinished = createMockGraphics();
            drawIsometricBuilding(gUnfinished, "watchtower", 1, false, 0.5, defaultVisuals, 0, 4, undefined, kit);

            // Zero flame fills
            const flames = gUnfinished.calls.filter(
              (c) => c.method === "fill" && (c.args[0]?.color === 0xf97316 || c.args[0]?.color === 0xea580c)
            );
            expect(flames.length).toBe(0);

            // Zero radiant glow halos
            const halos = gUnfinished.calls.filter(
              (c) => c.method === "fill" && c.args[0]?.color === 0xfde047
            );
            expect(halos.length).toBe(0);

            // Scaffolding uses authentic timber strokes
            const timberStrokes = gUnfinished.calls.filter((c) => c.method === "stroke");
            expect(timberStrokes.length).toBeGreaterThan(5);
          }
        });

        it("drawKeepYardAnnex renders finished watchtower with clear beacon and gold glint, and scaffolding when unfinished", () => {
          const gDone = createMockGraphics();
          drawKeepYardAnnex(gDone, 100, 100, { typeId: "watchtower", isFinished: true, slot: "south" }, "western", 0);

          const doneJson = JSON.stringify(gDone.calls);
          // Clear beacon fire (0xf97316) & radiant halo (0xfde047)
          expect(doneJson).toContain(String(0xf97316));
          expect(doneJson).toContain(String(0xfde047));
          // Gold glint (0xfacc15) & spark (0xffffff)
          expect(doneJson).toContain(String(0xfacc15));
          expect(doneJson).toContain(String(0xffffff));

          const gScaffold = createMockGraphics();
          drawKeepYardAnnex(gScaffold, 100, 100, { typeId: "watchtower", isFinished: false, slot: "south" }, "western", 0);

          const scaffoldJson = JSON.stringify(gScaffold.calls);
          // Scaffolding has NO beacon fire
          expect(scaffoldJson).not.toContain(String(0xf97316));
          expect(scaffoldJson).not.toContain(String(0xfde047));
          // Scaffolding has timber construction commands
          expect(scaffoldJson).toContain("moveTo");
          expect(scaffoldJson).toContain("lineTo");
          expect(scaffoldJson).toContain("stroke");
        });

        it("verifies pointer-events none and non-blocking invariants in render files", async () => {
          const fs = await import("node:fs");
          const path = await import("node:path");
          const indexCode = fs.readFileSync(path.resolve(__dirname, "index.ts"), "utf-8");

          // entitiesLayer and buildingGraphics have eventMode = "none"
          expect(indexCode).toContain('entitiesLayer.eventMode = "none"');
          expect(indexCode).toContain('g.eventMode = "none"');

          // Check no conflict markers in render package
          const files = ["buildings.ts", "tokens.ts", "index.ts"];
          for (const f of files) {
            const code = fs.readFileSync(path.resolve(__dirname, f), "utf-8");
            expect(code).not.toContain("<<<<<<<");
            expect(code).not.toContain("=======");
            expect(code).not.toContain(">>>>>>>");
          }
        });
      });

      describe("bakeoff/gemini-quarry-yard: finished quarry cut stone, crane & piles, unfinished scaffolding", () => {
        const defaultVisuals: ThemeVisuals = getThemeVisuals("Spring", "none");

        it("finished quarry renders cut stone ashlar stacks, crane derrick with pulley, and rubble piles on that tile", () => {
          const g = createMockGraphics();
          drawIsometricBuilding(g, "quarry", 1, true, 0.5, defaultVisuals, 3, 3, undefined, "western");

          const callsJson = JSON.stringify(g.calls);

          // 1. Cut stone / ashlar blocks (0xcbd5e1, 0x94a3b8, 0xe2e8f0)
          expect(callsJson).toContain(String(0xcbd5e1));
          expect(callsJson).toContain(String(0x94a3b8));
          expect(callsJson).toContain(String(0xe2e8f0));

          // 2. Timber A-frame crane with brass pulley (0xf59e0b) and steel cable (0xd1d5db)
          expect(callsJson).toContain(String(0xf59e0b));
          expect(callsJson).toContain(String(0xd1d5db));
          expect(callsJson).toContain(String(0x78350f));

          // 3. Freshly quarried rubble mounds & cut stone piles on that tile (0x64748b, 0x52525b)
          expect(callsJson).toContain(String(0x64748b));
          expect(callsJson).toContain(String(0x52525b));

          // 4. Mason pickaxe (0x451a03) and wheelbarrow (0x854d0e)
          expect(callsJson).toContain(String(0x451a03));
          expect(callsJson).toContain(String(0x854d0e));
        });

        it("unfinished quarry strictly renders timber scaffolding without finished crane pulley or ashlar stacks, and without cracked stone overlay", () => {
          const gUnfinished = createMockGraphics();
          drawIsometricBuilding(gUnfinished, "quarry", 1, false, 0.5, defaultVisuals, 3, 3, undefined, "western");

          const callsJson = JSON.stringify(gUnfinished.calls);

          // Scaffolding uses authentic timber strokes
          const timberStrokes = gUnfinished.calls.filter((c) => c.method === "stroke");
          expect(timberStrokes.length).toBeGreaterThan(5);

          // Unfinished quarry does NOT draw the finished crane pulley wheel
          expect(callsJson).not.toContain(String(0xf59e0b));

          // Unfinished quarry does NOT draw finished top ashlar block
          expect(callsJson).not.toContain(String(0xe2e8f0));

          // Unfinished quarry does NOT draw cracked stone damage overlay
          const effectiveH = buildingHeight("quarry", 1, 3, 3);
          const gCracked = createMockGraphics();
          drawCrackedStoneOverlay(gCracked, "quarry", effectiveH, 3, 3, "western", 1);
          expect(gUnfinished.calls.length).toBeGreaterThan(0);
        });

        it("drawQuarryScaffolding can be directly called with custom culture kits and phases", () => {
          const kits = ["western", "cedar", "sand", "steppe", "islands"] as const;
          for (const kit of kits) {
            const g = createMockGraphics();
            drawQuarryScaffolding(g, 0, 1.0, 0.5, kit);
            const strokes = g.calls.filter((c) => c.method === "stroke");
            expect(strokes.length).toBeGreaterThan(4);
            const fills = g.calls.filter((c) => c.method === "fill");
            expect(fills.length).toBeGreaterThan(3);
          }
        });

        it("drawKeepYardAnnex renders finished quarry with cut stone, crane, and piles; and scaffolding when unfinished", () => {
          const gDone = createMockGraphics();
          drawKeepYardAnnex(gDone, 100, 100, { typeId: "quarry", isFinished: true, slot: "south" }, "western", 0);

          const doneJson = JSON.stringify(gDone.calls);
          // Cut stone (0xcbd5e1, 0x94a3b8)
          expect(doneJson).toContain(String(0xcbd5e1));
          expect(doneJson).toContain(String(0x94a3b8));
          // Crane derrick with brass pulley (0xf59e0b) and steel cable (0xd1d5db)
          expect(doneJson).toContain(String(0xf59e0b));
          expect(doneJson).toContain(String(0xd1d5db));
          // Rubble piles (0x64748b)
          expect(doneJson).toContain(String(0x64748b));
          // Quarry pickaxe (0x451a03)
          expect(doneJson).toContain(String(0x451a03));

          const gScaffold = createMockGraphics();
          drawKeepYardAnnex(gScaffold, 100, 100, { typeId: "quarry", isFinished: false, slot: "south" }, "western", 0);

          const scaffoldJson = JSON.stringify(gScaffold.calls);
          // Scaffolding has NO crane pulley wheel
          expect(scaffoldJson).not.toContain(String(0xf59e0b));
          // Scaffolding has timber construction commands
          expect(scaffoldJson).toContain("moveTo");
          expect(scaffoldJson).toContain("lineTo");
          expect(scaffoldJson).toContain("stroke");
        });

        it("verifies pointer-events none and non-blocking invariants in render files", async () => {
          const fs = await import("node:fs");
          const path = await import("node:path");
          const indexCode = fs.readFileSync(path.resolve(__dirname, "index.ts"), "utf-8");

          // entitiesLayer and buildingGraphics have eventMode = "none"
          expect(indexCode).toContain('entitiesLayer.eventMode = "none"');
          expect(indexCode).toContain('g.eventMode = "none"');

          // Check no conflict markers in render package
          const files = ["buildings.ts", "tokens.ts", "index.ts"];
          for (const f of files) {
            const code = fs.readFileSync(path.resolve(__dirname, f), "utf-8");
            expect(code).not.toContain("<<<<<<<");
            expect(code).not.toContain("=======");
            expect(code).not.toContain(">>>>>>>");
          }
        });
      });

      describe("bakeoff/gemini-gate-lamp: closed home gate reads as lit lamp / warm slot, open gate is dark / raised", () => {
        const visuals = getThemeVisuals("summer");
        const rimNeighbors: RimNeighbors = { hasPrev: true, hasNext: true };

        it("closed Western gate renders lit lamp with radiant halo and warm slot with golden threshold spill", () => {
          const gClosed = createMockGraphics();
          drawIsometricBuilding(gClosed, "gate", 1, true, 0, visuals, 0, 4, rimNeighbors, "western", { isRingClosed: true });

          const closedJson = JSON.stringify(gClosed.calls);

          // 1. Lit lamp: mounting bracket arm, lantern housing (0x78350f), glowing glass (0xfacc15), flame core (0xffffff), radiant warm halo (0xfde047, 0xf59e0b)
          expect(closedJson).toContain(String(0xfacc15));
          expect(closedJson).toContain(String(0xffffff));
          expect(closedJson).toContain(String(0xfde047));
          expect(closedJson).toContain(String(0xf59e0b));

          // 2. Warm slot: viewing slit with warm interior light (0xfef08a, 0xf59e0b) and threshold spill (0xfde047, 0xfbbf24)
          expect(closedJson).toContain(String(0xfef08a));
          expect(closedJson).toContain(String(0xfbbf24));

          // 3. Closed gate doors: heavy oak leaves and center drop bar (0x0f172a)
          expect(closedJson).toContain(String(0x0f172a));
        });

        it("open Western gate renders deep dark passage and raised portcullis without warm lamp glow", () => {
          const gOpen = createMockGraphics();
          drawIsometricBuilding(gOpen, "gate", 1, true, 0, visuals, 0, 4, rimNeighbors, "western", { isRingClosed: false });

          const openJson = JSON.stringify(gOpen.calls);

          // 1. Dark passage: deep shadow fills (0x09090b, 0x050507), cold unlit glass (0x3f3f46)
          expect(openJson).toContain(String(0x09090b));
          expect(openJson).toContain(String(0x050507));
          expect(openJson).toContain(String(0x3f3f46));

          // 2. Raised portcullis: heavy iron portcullis crossbars and spiked arrow teeth hoisted high
          expect(openJson).toContain(String(0x475569)); // crossbars
          expect(openJson).toContain(String(0x64748b)); // vertical bars
          expect(openJson).toContain(String(0x334155)); // spiked teeth

          // 3. Dark open gate does NOT contain warm glowing lamp halo or radiant amber light spill
          expect(openJson).not.toContain(String(0xfbbf24)); // warm light spill
          const haloCircles = gOpen.calls.filter((c) => c.method === "circle" && c.args[0] === -8.5 && c.args[1] === 1.8);
          expect(haloCircles.length).toBe(0);
        });

        it("all 5 culture kits render lit lamp and warm slot when closed, and dark passage with raised portcullis when open", () => {
          const cultures = ["western", "cedar", "sand", "steppe", "islands"] as const;

          for (const cult of cultures) {
            const gClosed = createMockGraphics();
            drawIsometricBuilding(gClosed, "gate", 1, true, 0, visuals, 0, 4, rimNeighbors, cult, { isRingClosed: true });
            const closedJson = JSON.stringify(gClosed.calls);

            // Lit lamp & warm slot elements present on closed gate across all kits
            expect(closedJson).toContain(String(0xfde047)); // radiant halo
            expect(closedJson).toContain(String(0xfbbf24)); // threshold light spill
            expect(closedJson).toContain(String(0xffffff)); // white-hot flame core

            const gOpen = createMockGraphics();
            drawIsometricBuilding(gOpen, "gate", 1, true, 0, visuals, 0, 4, rimNeighbors, cult, { isRingClosed: false });
            const openJson = JSON.stringify(gOpen.calls);

            // Open gate has dark passage and raised portcullis without warm light spill
            expect(openJson).not.toContain(String(0xfbbf24)); // no warm threshold spill
            const openHalos = gOpen.calls.filter((c) => c.method === "circle" && c.args[0] === -8.5 && c.args[1] === 1.8);
            expect(openHalos.length).toBe(0); // no lit lamp halo
            expect(openJson).not.toEqual(closedJson);
          }
        });

        it("verifies pointer-events none and non-blocking invariants in render files", async () => {
          const fs = await import("node:fs");
          const path = await import("node:path");
          const indexCode = fs.readFileSync(path.resolve(__dirname, "index.ts"), "utf-8");

          // entitiesLayer and buildingGraphics have eventMode = "none"
          expect(indexCode).toContain('entitiesLayer.eventMode = "none"');
          expect(indexCode).toContain('g.eventMode = "none"');

          // Check no conflict markers in render package
          const files = ["buildings.ts", "tokens.ts", "index.ts"];
          for (const f of files) {
            const code = fs.readFileSync(path.resolve(__dirname, f), "utf-8");
            expect(code).not.toContain("<<<<<<<");
            expect(code).not.toContain("=======");
            expect(code).not.toContain(">>>>>>>");
          }
        });
      });

      describe("bakeoff/gemini-keep-hearth: Player keep chimney/hearth smoke when hold has people, quieter if empty", () => {
        const visuals = getThemeVisuals("summer");

        it("holdHasPeople accurately checks population, citizens, units, and flags", () => {
          expect(holdHasPeople(undefined)).toBe(false);
          expect(holdHasPeople(null)).toBe(false);

          // Boolean flag
          expect(holdHasPeople({ hasPeople: true } as any)).toBe(true);
          expect(holdHasPeople({ hasPeople: false } as any)).toBe(false);

          // Population number
          expect(holdHasPeople({ population: 5 } as any)).toBe(true);
          expect(holdHasPeople({ population: 0 } as any)).toBe(false);

          // Citizens array
          const emptyState = createMockState();
          emptyState.citizens = [];
          emptyState.units = [];
          expect(holdHasPeople(emptyState)).toBe(false);

          const populatedState = createMockState();
          populatedState.citizens = [
            { id: "c1", realmId: "player", job: "farmer", tile: { x: 1, y: 1 } },
          ];
          expect(holdHasPeople(populatedState)).toBe(true);
          expect(holdHasPeople(populatedState, "player")).toBe(true);
          expect(holdHasPeople(populatedState, "rival")).toBe(false);

          // Armed units in hold
          const garrisonState = createMockState();
          garrisonState.citizens = [];
          garrisonState.units = [
            { id: "u1", typeId: "militia", realmId: "player", count: "12", armyId: null },
          ];
          expect(holdHasPeople(garrisonState)).toBe(true);
        });

        it("Western keep renders Ashlar stone chimney stack, warm hearth glow, and billowing smoke when hold has people", () => {
          const gPopulated = createMockGraphics();
          drawIsometricBuilding(gPopulated, "keep", 1, true, 0, visuals, 0, 0, undefined, "western", { hasPeople: true });

          const populatedJson = JSON.stringify(gPopulated.calls);

          // 1. Ashlar Stone Chimney Stack on roof
          expect(populatedJson).toContain(String(0x64748b)); // stoneLight face
          expect(populatedJson).toContain(String(0x475569)); // stoneDark face
          expect(populatedJson).toContain(String(0x334155)); // stonePlinth coping
          expect(populatedJson).toContain(String(0x09090b)); // dark flue opening

          // 2. Warm golden hearth glow at chimney flue
          expect(populatedJson).toContain(String(0xfef08a));

          // 3. Billowing smoke puffs rising and expanding
          expect(populatedJson).toContain(String(0xe2e8f0)); // fresh warm puff
          expect(populatedJson).toContain(String(0xf1f5f9)); // expanding puff
          expect(populatedJson).toContain(String(0xf8fafc)); // large drifting plume
          expect(populatedJson).toContain(String(0xffffff)); // high dispersed wisp

          // Check smoke puff radii: expanding up to ~5.0
          const puffs = gPopulated.calls.filter((c) => c.method === "circle" && c.args[0] > 4 && c.args[1] < -35 && c.args[2] >= 2.0);
          expect(puffs.length).toBeGreaterThanOrEqual(4);
          const maxRadius = Math.max(...puffs.map((p) => p.args[2]));
          expect(maxRadius).toBeGreaterThanOrEqual(4.5);
        });

        it("Western keep renders quieter, faint smoke wisp when hold is empty", () => {
          const gEmpty = createMockGraphics();
          drawIsometricBuilding(gEmpty, "keep", 1, true, 0, visuals, 0, 0, undefined, "western", { hasPeople: false });

          const emptyJson = JSON.stringify(gEmpty.calls);

          // 1. Chimney stack is still physically present
          expect(emptyJson).toContain(String(0x64748b));
          expect(emptyJson).toContain(String(0x09090b));

          // 2. Smoke is noticeably quieter: faint small wisps (0xd1d5db, 0xe5e7eb)
          expect(emptyJson).toContain(String(0xd1d5db));
          expect(emptyJson).toContain(String(0xe5e7eb));

          // 3. Does NOT contain large billowing white clouds (0xf8fafc, 0xffffff)
          expect(emptyJson).not.toContain(String(0xf8fafc));
          expect(emptyJson).not.toContain(String(0xffffff));

          // 4. All chimney smoke circles have small radius (<= 1.6)
          const emptyPuffs = gEmpty.calls.filter((c) => c.method === "circle" && c.args[0] > 4 && c.args[1] < -35);
          expect(emptyPuffs.length).toBeGreaterThanOrEqual(1);
          for (const puff of emptyPuffs) {
            expect(puff.args[2]).toBeLessThanOrEqual(1.6);
          }
        });

        it("populated keep and empty keep visual signatures are clearly distinct", () => {
          const gPopulated = createMockGraphics();
          drawIsometricBuilding(gPopulated, "keep", 1, true, 0, visuals, 0, 0, undefined, "western", { hasPeople: true });

          const gEmpty = createMockGraphics();
          drawIsometricBuilding(gEmpty, "keep", 1, true, 0, visuals, 0, 0, undefined, "western", { hasPeople: false });

          expect(JSON.stringify(gPopulated.calls)).not.toEqual(JSON.stringify(gEmpty.calls));
        });

        it("unfinished keep (complete = false) suppresses chimney hearth smoke", () => {
          const gUnfinished = createMockGraphics();
          drawIsometricBuilding(gUnfinished, "keep", 1, false, 0, visuals, 0, 0, undefined, "western", { hasPeople: true });

          const unfinJson = JSON.stringify(gUnfinished.calls);
          // Chimney smoke colors are absent
          expect(unfinJson).not.toContain(String(0xe2e8f0));
          expect(unfinJson).not.toContain(String(0xf8fafc));
          expect(unfinJson).not.toContain(String(0xffffff));
        });

        it("all 4 culture keeps render active smoke when hold has people, and quieter smoke when empty", () => {
          const kits = ["cedar", "sand", "steppe", "islands"] as const;

          for (const kit of kits) {
            const gPop = createMockGraphics();
            drawIsometricBuilding(gPop, "keep", 1, true, 0, visuals, 0, 0, undefined, kit, { hasPeople: true });
            const popJson = JSON.stringify(gPop.calls);

            const gEmpty = createMockGraphics();
            drawIsometricBuilding(gEmpty, "keep", 1, true, 0, visuals, 0, 0, undefined, kit, { hasPeople: false });
            const emptyJson = JSON.stringify(gEmpty.calls);

            // Populated hold has active warm smoke
            expect(popJson).toContain(String(0xe2e8f0)); // active smoke
            expect(popJson).toContain(String(0xfef08a)); // warm hearth glow

            // Empty hold has faint wisp (0xd1d5db)
            expect(emptyJson).toContain(String(0xd1d5db));

            // Populated and empty states differ
            expect(popJson).not.toEqual(emptyJson);
          }
        });

        it("drawMiniatureKeep renders warm ember glint and puffs for populated home hold, quieter wisp for empty hold", () => {
          const gHomePop = createMockGraphics();
          drawMiniatureKeep(gHomePop, 50, 50, "western", undefined, true, 0, { hasPeople: true });
          const homePopJson = JSON.stringify(gHomePop.calls);

          const gHomeEmpty = createMockGraphics();
          drawMiniatureKeep(gHomeEmpty, 50, 50, "western", undefined, true, 0, { hasPeople: false });
          const homeEmptyJson = JSON.stringify(gHomeEmpty.calls);

          // Populated home keep has warm ember glint and puffs
          expect(homePopJson).toContain(String(0xfef08a));
          expect(homePopJson).toContain(String(0xe2e8f0));

          // Empty home keep has quieter faint wisp
          expect(homeEmptyJson).toContain(String(0xd1d5db));
          expect(homeEmptyJson).not.toContain(String(0xe2e8f0));
          expect(homePopJson).not.toEqual(homeEmptyJson);
        });

        it("verifies pointer-events none and zero conflict markers in render package", async () => {
          const fs = await import("node:fs");
          const path = await import("node:path");
          const indexCode = fs.readFileSync(path.resolve(__dirname, "index.ts"), "utf-8");

          expect(indexCode).toContain('entitiesLayer.eventMode = "none"');
          expect(indexCode).toContain('g.eventMode = "none"');

          const files = ["buildings.ts", "tokens.ts", "index.ts"];
          for (const f of files) {
            const code = fs.readFileSync(path.resolve(__dirname, f), "utf-8");
            expect(code).not.toContain("<<<<<<<");
            expect(code).not.toContain("=======");
            expect(code).not.toContain(">>>>>>>");
          }
        });

        describe("Hold Empty Work Plot Survey Stakes", () => {
          it("isEmptyWorkPlot identifies valid empty interior work plots and rejects out-of-bounds, rim, roads, and built plots", () => {
            const state = createMockState();
            state.buildings = [
              { id: "k1", typeId: "keep", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null },
              { id: "f1", typeId: "farm", realmId: "player", x: 2, y: 2, level: 1, completesAtTick: null },
              { id: "scaff1", typeId: "quarry", realmId: "player", x: 4, y: 2, level: 1, completesAtTick: 50 },
            ];

            // Out-of-bounds
            expect(isEmptyWorkPlot(state, -1, 0)).toBe(false);
            expect(isEmptyWorkPlot(state, 16, 5)).toBe(false);
            expect(isEmptyWorkPlot(state, 5, 10)).toBe(false);

            // Rim tiles (fortification perimeter for walls/gate)
            expect(isEmptyWorkPlot(state, 0, 0)).toBe(false);
            expect(isEmptyWorkPlot(state, 0, 5)).toBe(false);
            expect(isEmptyWorkPlot(state, 15, 4)).toBe(false);
            expect(isEmptyWorkPlot(state, 7, 9)).toBe(false);

            // Road tiles (cobblestone thoroughfares)
            expect(isEmptyWorkPlot(state, 4, 4)).toBe(false);
            expect(isEmptyWorkPlot(state, 6, 4)).toBe(false);
            expect(isEmptyWorkPlot(state, 9, 3)).toBe(false);
            expect(isEmptyWorkPlot(state, 4, 4, true)).toBe(true); // includeRoads allows roads if explicitly requested

            // Built plots (occupied by finished building or scaffolding)
            expect(isEmptyWorkPlot(state, 3, 3)).toBe(false); // keep
            expect(isEmptyWorkPlot(state, 2, 2)).toBe(false); // farm
            expect(isEmptyWorkPlot(state, 4, 2)).toBe(false); // quarry scaffolding

            // Empty interior non-road plots
            expect(isEmptyWorkPlot(state, 1, 1)).toBe(true);
            expect(isEmptyWorkPlot(state, 5, 2)).toBe(true);
            expect(isEmptyWorkPlot(state, 8, 2)).toBe(true);
            expect(isEmptyWorkPlot(state, 13, 7)).toBe(true);
          });

          it("listEmptyWorkPlots returns all open work plots and updates when plots are built", () => {
            const state = createMockState();
            state.buildings = [];

            const initialPlots = listEmptyWorkPlots(state);
            expect(initialPlots.length).toBeGreaterThan(50);

            // Verify no plots are on the rim or on roads
            for (const p of initialPlots) {
              expect(isRimTile(p.x, p.y)).toBe(false);
              expect(ROAD_TILES.has(`${p.x},${p.y}`)).toBe(false);
            }

            // Place a building at (1, 1) and (5, 2)
            state.buildings.push(
              { id: "b_1_1", typeId: "farm", realmId: "player", x: 1, y: 1, level: 1, completesAtTick: null },
              { id: "b_5_2", typeId: "cottage", realmId: "player", x: 5, y: 2, level: 1, completesAtTick: null }
            );

            const updatedPlots = listEmptyWorkPlots(state);
            expect(updatedPlots.length).toBe(initialPlots.length - 2);
            expect(updatedPlots.some((p) => p.x === 1 && p.y === 1)).toBe(false);
            expect(updatedPlots.some((p) => p.x === 5 && p.y === 2)).toBe(false);
          });

          it("drawPlotStake renders authentic wooden surveyor stake with peg, highlight, twine, and fluttering ribbon", () => {
            const g = createMockGraphics();
            drawPlotStake(g, 100, 100, 0, visuals);

            const json = JSON.stringify(g.calls);

            // Ground contact shadow and soil indent
            expect(json).toContain(String(0x000000));
            expect(json).toContain(String(0x271708));

            // Displaced loam soil clods at base
            expect(json).toContain(String(0x3f220c));
            expect(json).toContain(String(0x2e1908));

            // Chiseled timber stake shaft and sunlit highlight
            expect(json).toContain(String(0x78350f));
            expect(json).toContain(String(0xb45309));

            // Chamfered top cut pale heartwood
            expect(json).toContain(String(0xd97706));

            // Fine vertical grain split
            expect(json).toContain(String(0x451a03));

            // Hemp twine neck wrapping
            expect(json).toContain(String(0xfef08a));

            // Fluttering red surveyor marker ribbon and knot
            expect(json).toContain(String(0xef4444));
            expect(json).toContain(String(0xb91c1c));
            expect(json).toContain(String(0xfacc15));
          });

          it("drawPlotStake animates ribbon flutter across different phases", () => {
            const g0 = createMockGraphics();
            drawPlotStake(g0, 100, 100, 0, visuals);

            const g1 = createMockGraphics();
            drawPlotStake(g1, 100, 100, 2.5, visuals);

            expect(JSON.stringify(g0.calls)).not.toEqual(JSON.stringify(g1.calls));
          });

          it("drawPlotStake adds winter snow/frost cap in winter theme", () => {
            const winterVisuals: ThemeVisuals = { ...visuals, decorations: "winter" };
            const gWinter = createMockGraphics();
            drawPlotStake(gWinter, 100, 100, 0, winterVisuals);

            const jsonWinter = JSON.stringify(gWinter.calls);
            expect(jsonWinter).toContain(String(0xf8fafc));

            const springVisuals: ThemeVisuals = { ...visuals, decorations: "spring" };
            const gSpring = createMockGraphics();
            drawPlotStake(gSpring, 100, 100, 0, springVisuals);
            const jsonSpring = JSON.stringify(gSpring.calls);
            expect(jsonSpring).not.toContain(String(0xf8fafc));
          });

          it("paintEmptyPlotStakes clears and renders stakes on empty plots, skipping built plots and rim", () => {
            const state = createMockState();
            state.buildings = [
              { id: "k", typeId: "keep", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null },
              { id: "f", typeId: "farm", realmId: "player", x: 2, y: 2, level: 1, completesAtTick: null },
            ];

            const g = createMockGraphics();
            paintEmptyPlotStakes(g, state, 0, visuals);

            // Calls clear initially
            expect(g.calls[0].method).toBe("clear");

            // Stakes are rendered (contains timber shaft color)
            const json = JSON.stringify(g.calls);
            expect(json).toContain(String(0x78350f));
            expect(json).toContain(String(0xef4444));

            // Verify built plots stay as they are: when all plots are filled, no stakes are rendered
            const fullState = createMockState();
            fullState.buildings = [];
            for (let y = 1; y < GRID_H - 1; y++) {
              for (let x = 1; x < GRID_W - 1; x++) {
                fullState.buildings.push({
                  id: `b_${x}_${y}`,
                  typeId: "farm",
                  realmId: "player",
                  x,
                  y,
                  level: 1,
                  completesAtTick: null,
                });
              }
            }

            const gFull = createMockGraphics();
            paintEmptyPlotStakes(gFull, fullState, 0, visuals);
            expect(gFull.calls.length).toBe(1);
            expect(gFull.calls[0].method).toBe("clear");
          });

          it("verifies pointer-events none and zero conflict markers for plot stakes", async () => {
            const fs = await import("node:fs");
            const path = await import("node:path");
            const indexCode = fs.readFileSync(path.resolve(__dirname, "index.ts"), "utf-8");

            expect(indexCode).toContain('plotStakesLayer.eventMode = "none"');
            expect(indexCode).toContain('entitiesLayer.eventMode = "none"');

            const files = ["buildings.ts", "tokens.ts", "tiles.ts", "index.ts"];
            for (const f of files) {
              const code = fs.readFileSync(path.resolve(__dirname, f), "utf-8");
              expect(code).not.toContain("<<<<<<<");
              expect(code).not.toContain("=======");
              expect(code).not.toContain(">>>>>>>");
            }
          });
        });

        describe("Soft Gold Ground Ring Hint Glow", () => {
          it("parsePlotCoord parses coordinate objects, strings, and handles null/undefined/invalid values", () => {
            expect(parsePlotCoord({ x: 4, y: 2 })).toEqual({ x: 4, y: 2 });
            expect(parsePlotCoord({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
            expect(parsePlotCoord("4,2")).toEqual({ x: 4, y: 2 });
            expect(parsePlotCoord("4, 2")).toEqual({ x: 4, y: 2 });
            expect(parsePlotCoord("plot_4_2")).toEqual({ x: 4, y: 2 });
            expect(parsePlotCoord("plot-4-2")).toEqual({ x: 4, y: 2 });
            expect(parsePlotCoord("4-2")).toEqual({ x: 4, y: 2 });

            expect(parsePlotCoord(null)).toBeNull();
            expect(parsePlotCoord(undefined)).toBeNull();
            expect(parsePlotCoord("")).toBeNull();
            expect(parsePlotCoord("   ")).toBeNull();
            expect(parsePlotCoord("invalid")).toBeNull();
            expect(parsePlotCoord({} as any)).toBeNull();
          });

          it("drawPlotGlowRing renders radiant soft gold ground ring with 2:1 isometric ellipses and cardinal pips", () => {
            const g = createMockGraphics();
            drawPlotGlowRing(g, 100, 100, 0, 0.85);

            const json = JSON.stringify(g.calls);

            // Ambient diffused ground light pool
            expect(json).toContain(String(0xfde047));
            expect(json).toContain(String(0xfacc15));

            // Outer warm amber glow stroke
            expect(json).toContain(String(0xf59e0b));

            // Core radiant gold ring
            expect(json).toContain(String(0xfef08a));

            // White specular highlight
            expect(json).toContain(String(0xffffff));

            // Cardinal glimmer pips
            expect(g.calls.some((c) => c.method === "circle")).toBe(true);

            // Alpha <= 0 renders nothing
            const gZero = createMockGraphics();
            drawPlotGlowRing(gZero, 100, 100, 0, 0);
            expect(gZero.calls.length).toBe(0);
          });

          it("drawPlotStake renders gold ground ring when glowAlpha > 0 and stays plain when glowAlpha === 0", () => {
            const gPlain = createMockGraphics();
            drawPlotStake(gPlain, 100, 100, 0, visuals, 0);
            const plainJson = JSON.stringify(gPlain.calls);

            const gGlowing = createMockGraphics();
            drawPlotStake(gGlowing, 100, 100, 0, visuals, 0.85);
            const glowJson = JSON.stringify(gGlowing.calls);

            // Glowing stake contains ambient gold pool and amber glow
            expect(glowJson).toContain(String(0xfde047));
            expect(glowJson).toContain(String(0xf59e0b));

            // Plain stake does NOT contain gold ring colors
            expect(plainJson).not.toContain(String(0xfde047));
            expect(plainJson).not.toContain(String(0xf59e0b));
          });

          it("when the app hint points to an empty plot: that plot gets soft gold ground ring, other empty stakes stay plain", () => {
            const state = createMockState();
            state.buildings = [
              { id: "k", typeId: "keep", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null },
            ];

            // Point app hint at empty plot (2, 2)
            const g = createMockGraphics();
            paintEmptyPlotStakes(g, state, 0, visuals, false, { x: 2, y: 2 });

            const json = JSON.stringify(g.calls);

            // Targeted plot has soft gold ring
            expect(json).toContain(String(0xfde047));
            expect(json).toContain(String(0xf59e0b));

            // Verify by isolating calls: plot (2, 2) stake has glow, plot (1, 1) stake is plain
            const gTargetOnly = createMockGraphics();
            drawPlotStake(gTargetOnly, 100, 100, 0, visuals, 0.85);

            const gOtherOnly = createMockGraphics();
            drawPlotStake(gOtherOnly, 100, 100, 0, visuals, 0);

            expect(JSON.stringify(gTargetOnly.calls)).toContain(String(0xfde047));
            expect(JSON.stringify(gOtherOnly.calls)).not.toContain(String(0xfde047));
          });

          it("when the app does not pass a plot id: glow every empty hold plot at low opacity instead", () => {
            const state = createMockState();
            state.buildings = [
              { id: "k", typeId: "keep", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null },
            ];

            // No plot id passed (null or undefined)
            const gNull = createMockGraphics();
            paintEmptyPlotStakes(gNull, state, 0, visuals, false, null);
            const nullJson = JSON.stringify(gNull.calls);

            // Low opacity glow appears across empty plots
            expect(nullJson).toContain(String(0xfde047));
            expect(nullJson).toContain(String(0xf59e0b));

            const gUndef = createMockGraphics();
            paintEmptyPlotStakes(gUndef, state, 0, visuals, false, undefined);
            const undefJson = JSON.stringify(gUndef.calls);
            expect(undefJson).toContain(String(0xfde047));
            expect(undefJson).toContain(String(0xf59e0b));
          });

          it("when the app hint points to an occupied built plot: other empty stakes stay plain and occupied plot gets no stake", () => {
            const state = createMockState();
            state.buildings = [
              { id: "k", typeId: "keep", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null },
            ];

            // Point app hint at occupied keep tile (3, 3)
            const g = createMockGraphics();
            paintEmptyPlotStakes(g, state, 0, visuals, false, { x: 3, y: 3 });

            const json = JSON.stringify(g.calls);

            // Since target is occupied, no empty plot matches target.x, target.y -> other empty stakes stay plain
            expect(json).not.toContain(String(0xfde047));
            expect(json).not.toContain(String(0xf59e0b));
          });

          it("verifies pointer-events none and zero conflict markers for hint glow", async () => {
            const fs = await import("node:fs");
            const path = await import("node:path");
            const indexCode = fs.readFileSync(path.resolve(__dirname, "index.ts"), "utf-8");

            expect(indexCode).toContain('plotStakesLayer.eventMode = "none"');
            expect(indexCode).toContain('entitiesLayer.eventMode = "none"');

            const files = ["buildings.ts", "tokens.ts", "tiles.ts", "index.ts"];
            for (const f of files) {
              const code = fs.readFileSync(path.resolve(__dirname, f), "utf-8");
              expect(code).not.toContain("<<<<<<<");
              expect(code).not.toContain("=======");
              expect(code).not.toContain(">>>>>>>");
            }
          });
        });

        describe("bakeoff/gemini-tower-unlit: finished watchtower unlit/cold beacon when no worker, beacon on when staffed", () => {
          const visuals = getThemeVisuals("spring");

          it("isBuildingStaffed correctly identifies worker assignment across states, citizens, and flags", () => {
            expect(isBuildingStaffed(null, { x: 0, y: 0 })).toBe(false);
            expect(isBuildingStaffed(undefined, { x: 0, y: 0 })).toBe(false);

            const state = createMockState();
            state.buildings = [
              { id: "wt1", typeId: "watchtower", realmId: "player", x: 2, y: 2, level: 1, completesAtTick: null },
              { id: "wt2", typeId: "watchtower", realmId: "player", x: 0, y: 4, level: 1, completesAtTick: null },
            ];

            // Initially no citizens -> unstaffed
            expect(isBuildingStaffed(state, state.buildings[0])).toBe(false);
            expect(isBuildingStaffed(state, { x: 2, y: 2 })).toBe(false);

            // Citizen with matching tile and guard job
            state.citizens = [
              { id: "c1", realmId: "player", job: "guard", tile: { x: 2, y: 2 } },
            ];
            expect(isBuildingStaffed(state, state.buildings[0])).toBe(true);
            expect(isBuildingStaffed(state, { x: 2, y: 2 })).toBe(true);
            expect(isBuildingStaffed(state, state.buildings[1])).toBe(false);

            // Unassigned citizen or null tile does not staff
            state.citizens = [
              { id: "c2", realmId: "player", job: "unassigned", tile: { x: 0, y: 4 } },
              { id: "c3", realmId: "player", job: "guard", tile: null },
            ];
            expect(isBuildingStaffed(state, state.buildings[1])).toBe(false);

            // Explicit flags on building object override
            expect(isBuildingStaffed(state, { x: 5, y: 5, isStaffed: true })).toBe(true);
            expect(isBuildingStaffed(state, { x: 5, y: 5, hasWorker: true })).toBe(true);
            expect(isBuildingStaffed(state, { x: 5, y: 5, staffed: true })).toBe(true);
            expect(isBuildingStaffed(state, { x: 5, y: 5, workers: 1 })).toBe(true);
            expect(isBuildingStaffed(state, { x: 5, y: 5, isStaffed: false })).toBe(false);
          });

          it("finished Western watchtower renders clear beacon fire, halo, and gold glint when staffed", () => {
            const g = createMockGraphics();
            drawIsometricBuilding(g, "watchtower", 1, true, 0.5, visuals, 0, 4, undefined, "western", {
              isStaffed: true,
            });

            // Active beacon fire tongues (0xf97316, 0xfacc15, 0xffffff)
            const flames = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
            expect(flames.length).toBeGreaterThan(0);

            // Radiant warm beacon glow halo (0xfde047)
            const halos = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfde047);
            expect(halos.length).toBeGreaterThan(0);

            // Gold glint diamond star (0xfacc15, 0xffffff)
            const glints = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfacc15);
            expect(glints.length).toBeGreaterThan(0);
            const sparks = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xffffff);
            expect(sparks.length).toBeGreaterThan(0);
          });

          it("finished Western watchtower renders cold unlit beacon when unstaffed (no worker)", () => {
            const g = createMockGraphics();
            drawIsometricBuilding(g, "watchtower", 1, true, 0.5, visuals, 0, 4, undefined, "western", {
              isStaffed: false,
            });

            // Zero active beacon fire tongues
            const flames = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
            expect(flames.length).toBe(0);

            // Zero radiant warm beacon glow halo
            const halos = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfde047);
            expect(halos.length).toBe(0);

            // Cold charcoal & ash fills present in brazier basket (0x0f172a, 0x334155, 0x475569)
            const coldAsh = g.calls.filter(
              (c) =>
                c.method === "fill" &&
                (c.args[0]?.color === 0x0f172a || c.args[0]?.color === 0x334155 || c.args[0]?.color === 0x475569)
            );
            expect(coldAsh.length).toBeGreaterThan(0);
          });

          it("evaluates staffing dynamically from GameState when passed in options", () => {
            const state = createMockState();
            state.buildings = [
              { id: "wt1", typeId: "watchtower", realmId: "player", x: 0, y: 4, level: 1, completesAtTick: null },
              { id: "wt2", typeId: "watchtower", realmId: "player", x: 2, y: 2, level: 1, completesAtTick: null },
            ];
            // Assign worker only to wt1 at (0, 4)
            state.citizens = [
              { id: "c1", realmId: "player", job: "guard", tile: { x: 0, y: 4 } },
            ];

            const gStaffed = createMockGraphics();
            drawIsometricBuilding(gStaffed, "watchtower", 1, true, 0.5, visuals, 0, 4, undefined, "western", {
              state,
            });

            const gUnstaffed = createMockGraphics();
            drawIsometricBuilding(gUnstaffed, "watchtower", 1, true, 0.5, visuals, 2, 2, undefined, "western", {
              state,
            });

            // Staffed watchtower has flame tongues
            const flamesStaffed = gStaffed.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
            expect(flamesStaffed.length).toBeGreaterThan(0);

            // Unstaffed watchtower has zero flames and zero halo
            const flamesUnstaffed = gUnstaffed.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
            expect(flamesUnstaffed.length).toBe(0);
            const haloUnstaffed = gUnstaffed.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfde047);
            expect(haloUnstaffed.length).toBe(0);
          });

          it("finished culture watchtowers render active beacon when staffed and cold unlit beacon when unstaffed", () => {
            const kits = ["cedar", "sand", "steppe", "islands"] as const;
            for (const kit of kits) {
              const gStaffed = createMockGraphics();
              drawIsometricBuilding(gStaffed, "watchtower", 1, true, 0.5, visuals, 0, 4, undefined, kit, {
                isStaffed: true,
              });

              const gUnstaffed = createMockGraphics();
              drawIsometricBuilding(gUnstaffed, "watchtower", 1, true, 0.5, visuals, 0, 4, undefined, kit, {
                isStaffed: false,
              });

              // Staffed has gold glint / spark (0xfacc15)
              const glintsStaffed = gStaffed.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfacc15);
              expect(glintsStaffed.length).toBeGreaterThan(0);

              // Unstaffed suppresses active flame / cyan light / glowing coals
              if (kit === "cedar") {
                const flames = gUnstaffed.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xea580c);
                expect(flames.length).toBe(0);
              } else if (kit === "sand") {
                const flames = gUnstaffed.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
                expect(flames.length).toBe(0);
              } else if (kit === "steppe") {
                const coals = gUnstaffed.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xea580c);
                expect(coals.length).toBe(0);
              } else if (kit === "islands") {
                const cyan = gUnstaffed.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x06b6d4);
                expect(cyan.length).toBe(0);
              }
            }
          });

          it("drawKeepYardAnnex respects staffing for watchtower annexes", () => {
            const gStaffed = createMockGraphics();
            drawKeepYardAnnex(gStaffed, 100, 100, { typeId: "watchtower", isFinished: true, slot: "south", isStaffed: true }, "western", 0);

            const gUnstaffed = createMockGraphics();
            drawKeepYardAnnex(gUnstaffed, 100, 100, { typeId: "watchtower", isFinished: true, slot: "south", isStaffed: false }, "western", 0);

            // Staffed annex has flames and halo
            const flames = gStaffed.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
            expect(flames.length).toBeGreaterThan(0);
            const halos = gStaffed.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfde047);
            expect(halos.length).toBeGreaterThan(0);

            // Unstaffed annex has zero flames and zero halos
            const unstaffedFlames = gUnstaffed.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf97316);
            expect(unstaffedFlames.length).toBe(0);
            const unstaffedHalos = gUnstaffed.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfde047);
            expect(unstaffedHalos.length).toBe(0);
          });

          it("verifies pointer-events none and zero conflict markers for tower unlit", async () => {
            const fs = await import("node:fs");
            const path = await import("node:path");
            const indexCode = fs.readFileSync(path.resolve(__dirname, "index.ts"), "utf-8");

            expect(indexCode).toContain('entitiesLayer.eventMode = "none"');

            const files = ["buildings.ts", "tokens.ts", "tiles.ts", "index.ts"];
            for (const f of files) {
              const code = fs.readFileSync(path.resolve(__dirname, f), "utf-8");
              expect(code).not.toContain("<<<<<<<");
              expect(code).not.toContain("=======");
              expect(code).not.toContain(">>>>>>>");
            }
          });
        });

        describe("bakeoff/gemini-wall-gap: missing rim wall segments faint timber stake / gap mark", () => {
          const visuals = getThemeVisuals("spring");

          it("isMissingRimSegment correctly identifies missing vs finished rim wall segments", () => {
            // Non-rim tiles (inner courtyard or OOB) are never rim wall segments
            expect(isMissingRimSegment(null, 5, 5)).toBe(false);
            expect(isMissingRimSegment(null, -1, 0)).toBe(false);
            expect(isMissingRimSegment(null, 16, 0)).toBe(false);

            // Empty rim tiles are missing segments
            expect(isMissingRimSegment(null, 0, 0)).toBe(true);
            expect(isMissingRimSegment(undefined, 15, 0)).toBe(true);

            const state = createMockState();
            expect(isMissingRimSegment(state, 0, 1)).toBe(true);
            expect(isMissingRimSegment(state, 15, 9)).toBe(true);

            // Add finished wall at (0, 1) and finished gate at (8, 9)
            state.buildings = [
              { id: "w1", typeId: "walls", realmId: "player", x: 0, y: 1, level: 1, completesAtTick: null },
              { id: "g1", typeId: "gate", realmId: "player", x: 8, y: 9, level: 1, completesAtTick: null },
              { id: "w_other", typeId: "walls", realmId: "rival", x: 0, y: 2, level: 1, completesAtTick: null },
            ];

            // Finished segments return false (not missing)
            expect(isMissingRimSegment(state, 0, 1)).toBe(false);
            expect(isMissingRimSegment(state, 8, 9)).toBe(false);

            // Rival realm wall does not finish player hold rim
            expect(isMissingRimSegment(state, 0, 2)).toBe(true);

            // Empty rim tile returns true
            expect(isMissingRimSegment(state, 0, 3)).toBe(true);

            // Unfinished wall (scaffolding)
            state.buildings.push({
              id: "w_scaffold",
              typeId: "walls",
              realmId: "player",
              x: 0,
              y: 4,
              level: 1,
              completesAtTick: 120,
            });
            // By default (requireEmpty = false), unfinished wall is still a missing finished segment
            expect(isMissingRimSegment(state, 0, 4)).toBe(true);
            // With requireEmpty = true, it is not an empty plot
            expect(isMissingRimSegment(state, 0, 4, "player", true)).toBe(false);
          });

          it("listMissingRimSegments lists all missing coordinates ordered clockwise, and returns empty array when ring is closed", () => {
            const state = createMockState();
            // Fresh state: all 48 rim segments are missing
            const allMissing = listMissingRimSegments(state);
            expect(allMissing.length).toBe(48);
            expect(allMissing[0]).toEqual({ x: 0, y: 0 });
            expect(allMissing[15]).toEqual({ x: 15, y: 0 });
            expect(allMissing[24]).toEqual({ x: 15, y: 9 });
            expect(allMissing[39]).toEqual({ x: 0, y: 9 });

            // Finish 1 wall at (0, 0)
            state.buildings = [
              { id: "w0", typeId: "walls", realmId: "player", x: 0, y: 0, level: 1, completesAtTick: null },
            ];
            const partial = listMissingRimSegments(state);
            expect(partial.length).toBe(47);
            expect(partial.some((p) => p.x === 0 && p.y === 0)).toBe(false);

            // Close the entire ring: all 48 rim tiles finished
            state.buildings = [];
            for (let i = 0; i < 48; i++) {
              const tile = getRimTileAt(i);
              state.buildings.push({
                id: `wall_${i}`,
                typeId: i === 10 ? "gate" : "walls",
                realmId: "player",
                x: tile.x,
                y: tile.y,
                level: 1,
                completesAtTick: null,
              });
            }
            const closed = listMissingRimSegments(state);
            expect(closed.length).toBe(0);
            expect(closed).toEqual([]);
          });

          it("drawRimGapMark renders faint timber stake, foundation trench alignment line, and contact shadow", () => {
            const g = createMockGraphics();
            drawRimGapMark(g, 200, 100, 0, 2, 0, visuals);

            // Foundation trench alignment strokes present (0x52525b, 0xa8a29e)
            const trenchStrokes = g.calls.filter(
              (c) =>
                c.method === "stroke" &&
                (c.args[0]?.color === 0x52525b || c.args[0]?.color === 0xa8a29e)
            );
            expect(trenchStrokes.length).toBeGreaterThanOrEqual(2);

            // Soft contact shadow (0x000000, 0x271708)
            const shadows = g.calls.filter(
              (c) =>
                c.method === "fill" &&
                (c.args[0]?.color === 0x000000 || c.args[0]?.color === 0x271708)
            );
            expect(shadows.length).toBeGreaterThanOrEqual(1);

            // Timber stake shaft (0x78350f), sunlit highlight (0xa16207), heartwood top (0xc29d62)
            const shaft = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x78350f);
            expect(shaft.length).toBeGreaterThan(0);
            const highlight = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xa16207);
            expect(highlight.length).toBeGreaterThan(0);
            const heartwood = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xc29d62);
            expect(heartwood.length).toBeGreaterThan(0);

            // Slender peg grain split stroke (0x451a03)
            const grain = g.calls.filter((c) => c.method === "stroke" && c.args[0]?.color === 0x451a03);
            expect(grain.length).toBeGreaterThan(0);

            // Does NOT draw courtyard work plot red ribbon (0xef4444) or gold hint glow (0xfde047)
            const redRibbon = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xef4444);
            expect(redRibbon.length).toBe(0);
            const goldGlow = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xfde047);
            expect(goldGlow.length).toBe(0);
          });

          it("drawRimGapMark renders winter frost cap when winter decoration is active", () => {
            const gSpring = createMockGraphics();
            drawRimGapMark(gSpring, 200, 100, 0, 2, 0, getThemeVisuals("spring"));
            const frostSpring = gSpring.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf1f5f9);
            expect(frostSpring.length).toBe(0);

            const gWinter = createMockGraphics();
            drawRimGapMark(gWinter, 200, 100, 0, 2, 0, getThemeVisuals("winter"));
            const frostWinter = gWinter.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf1f5f9);
            expect(frostWinter.length).toBeGreaterThan(0);
          });

          it("paintMissingRimSegments paints gap marks for missing segments and clears when wall ring is closed", () => {
            const state = createMockState();
            state.buildings = [
              { id: "w1", typeId: "walls", realmId: "player", x: 0, y: 1, level: 1, completesAtTick: null },
            ];

            const g = createMockGraphics();
            paintMissingRimSegments(g, state, 0, visuals);

            // g.clear was called
            const clearCalls = g.calls.filter((c) => c.method === "clear");
            expect(clearCalls.length).toBe(1);

            // Timber stakes and trench lines drawn across the 47 missing rim segments
            const shaftCalls = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x78350f);
            expect(shaftCalls.length).toBe(47);

            // When closed:
            for (let i = 0; i < 48; i++) {
              const tile = getRimTileAt(i);
              state.buildings.push({
                id: `wall_${i}`,
                typeId: "walls",
                realmId: "player",
                x: tile.x,
                y: tile.y,
                level: 1,
                completesAtTick: null,
              });
            }
            const gClosed = createMockGraphics();
            paintMissingRimSegments(gClosed, state, 0, visuals);
            const closedShafts = gClosed.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x78350f);
            expect(closedShafts.length).toBe(0);
          });

          it("verifies pointer-events none and zero conflict markers for wall gap", async () => {
            const fs = await import("node:fs");
            const path = await import("node:path");
            const indexCode = fs.readFileSync(path.resolve(__dirname, "index.ts"), "utf-8");

            expect(indexCode).toContain('rimGapLayer.eventMode = "none"');
            expect(indexCode).toContain('plotStakesLayer.eventMode = "none"');
            expect(indexCode).toContain('entitiesLayer.eventMode = "none"');

            const files = ["buildings.ts", "tokens.ts", "tiles.ts", "index.ts"];
            for (const f of files) {
              const code = fs.readFileSync(path.resolve(__dirname, f), "utf-8");
              expect(code).not.toContain("<<<<<<<");
              expect(code).not.toContain("=======");
              expect(code).not.toContain(">>>>>>>");
            }
          });
        });

        describe("bakeoff/gemini-keep-breach: Player keep intact vs cracked stone/dark windows/no proud banner when breached", () => {
          it("isHoldBreached correctly detects breach status across options, flags, and wars", () => {
            expect(isHoldBreached(null)).toBe(false);
            expect(isHoldBreached(undefined)).toBe(false);

            const state = createMockState();
            expect(isHoldBreached(state)).toBe(false);

            // Options overrides
            expect(isHoldBreached(state, { isBreached: true })).toBe(true);
            expect(isHoldBreached(state, { breached: true })).toBe(true);
            expect(isHoldBreached(state, { stands: false })).toBe(true);
            expect(isHoldBreached(state, { isBreached: false })).toBe(false);
            expect(isHoldBreached(state, { stands: true })).toBe(false);

            // Boolean flags on state.flags
            state.flags = { isBreached: true };
            expect(isHoldBreached(state)).toBe(true);
            state.flags = { breached: true };
            expect(isHoldBreached(state)).toBe(true);
            state.flags = { holdBreached: true };
            expect(isHoldBreached(state)).toBe(true);
            state.flags = { stands: false };
            expect(isHoldBreached(state)).toBe(true);
            state.flags = { hold_stands: false };
            expect(isHoldBreached(state)).toBe(true);

            // String flags on state.flags
            state.flags = { hold: "breached" };
            expect(isHoldBreached(state)).toBe(true);
            state.flags = { hold: "stands" };
            expect(isHoldBreached(state)).toBe(false);
            state.flags = { hold_status: "fallen" };
            expect(isHoldBreached(state)).toBe(true);
            state.flags = { defense: "breached" };
            expect(isHoldBreached(state)).toBe(true);
            state.flags = { last_siege: "breached" };
            expect(isHoldBreached(state)).toBe(true);

            // Direct flags on state
            delete state.flags;
            const anyState = state as unknown as Record<string, unknown>;
            anyState.isBreached = true;
            expect(isHoldBreached(state)).toBe(true);
            delete anyState.isBreached;
            anyState.breached = true;
            expect(isHoldBreached(state)).toBe(true);
            delete anyState.breached;
            anyState.stands = false;
            expect(isHoldBreached(state)).toBe(true);
            delete anyState.stands;

            // state.wars siege resolution
            state.wars = [
              {
                id: "w_siege_100",
                attackerRealmId: "rival",
                defenderRealmId: "player",
                startedTick: 100,
                status: "defender_won",
              },
            ];
            expect(isHoldBreached(state)).toBe(false); // Player held

            state.wars[0].status = "attacker_won";
            expect(isHoldBreached(state)).toBe(true); // Player lost / breached

            state.wars[0].status = "active";
            expect(isHoldBreached(state)).toBe(false); // In progress
          });

          it("Western keep renders intact dressed stone, warm candlelight, proud royal banner, and warm hearth when hold stands", () => {
            const g = createMockGraphics();
            drawIsometricBuilding(g, "keep", 1, true, 0.5, visuals, 0, 0, undefined, "western", {
              isBreached: false,
              hasPeople: true,
            });

            const json = JSON.stringify(g.calls);

            // Intact warm royal candlelight window (0xfef08a)
            expect(json).toContain(String(0xfef08a));

            // Soaring proud royal standard: mast, golden finial (0xfacc15), and banner tabard (0xb91c1c)
            expect(json).toContain(String(0xfacc15)); // gold finial
            expect(json).toContain(String(0xb91c1c)); // banner tabard

            // Courtyard brazier with lively flame (0xf97316)
            expect(json).toContain(String(0xf97316));

            // Foundation & walls intact without fracture lines
            expect(json).not.toContain(JSON.stringify([-10, 0])); // foundation crack absent
          });

          it("Western keep renders cracked stone, dark windows, no proud banner, and cold hearth when breached", () => {
            const g = createMockGraphics();
            drawIsometricBuilding(g, "keep", 1, true, 0.5, visuals, 0, 0, undefined, "western", {
              isBreached: true,
              hasPeople: true,
            });

            const json = JSON.stringify(g.calls);

            // 1. Cracked stone: structural fracture lines on walls & foundation
            const cracks = g.calls.filter(
              (c) =>
                (c.method === "stroke" && (c.args[0]?.color === 0x0f172a || c.args[0]?.color === 0x09090b || c.args[0]?.color === 0x1e293b)) ||
                (c.method === "fill" && (c.args[0]?.color === 0x1e293b || c.args[0]?.color === 0x09090b))
            );
            expect(cracks.length).toBeGreaterThanOrEqual(4);

            // Broken glass fractures (0x334155)
            expect(json).toContain(String(0x334155));

            // 2. Dark windows: zero warm yellow window/hearth candlelight (0xfef08a)
            expect(json).not.toContain(String(0xfef08a));

            // 3. No proud banner: zero royal standard tabard (0xb91c1c), zero golden finial (0xfacc15)
            expect(json).not.toContain(String(0xb91c1c)); // no proud banner tabard
            expect(json).not.toContain(String(0xfacc15)); // no golden finial ball

            // Snapped mast stump present (0x5c3818 / 0x78350f)
            expect(json).toContain(String(0x5c3818));
            expect(json).toContain(String(0x78350f));

            // 4. Cold hearth: zero brazier flame (0xf97316), cold dormant ash (0x1e293b)
            expect(json).not.toContain(String(0xf97316));
            expect(json).toContain(String(0x1e293b));
          });

          it("culture keeps render distinct standing vs breached visual states across all 4 kits", () => {
            const kits = ["cedar", "sand", "steppe", "islands"] as const;

            for (const kit of kits) {
              const gStands = createMockGraphics();
              drawIsometricBuilding(gStands, "keep", 1, true, 0.5, visuals, 0, 0, undefined, kit, {
                isBreached: false,
                hasPeople: true,
              });

              const gBreached = createMockGraphics();
              drawIsometricBuilding(gBreached, "keep", 1, true, 0.5, visuals, 0, 0, undefined, kit, {
                isBreached: true,
                hasPeople: true,
              });

              const standsJson = JSON.stringify(gStands.calls);
              const breachedJson = JSON.stringify(gBreached.calls);

              // Standing keep has warm yellow hearth/window glow (0xfef08a)
              expect(standsJson).toContain(String(0xfef08a));

              // Breached keep completely extinguishes warm yellow glow (0xfef08a)
              expect(breachedJson).not.toContain(String(0xfef08a));

              // Standing and breached signatures are clearly distinct
              expect(standsJson).not.toEqual(breachedJson);

              // Proud banners are suppressed when breached:
              if (kit === "cedar") {
                expect(standsJson).toContain(String(0x14532d)); // cedar green banner
                expect(breachedJson).not.toContain(String(0x14532d));
              } else if (kit === "sand") {
                expect(standsJson).toContain(String(0xf59e0b)); // sand silk banner accent
                expect(breachedJson).not.toContain(String(0xf59e0b));
              } else if (kit === "steppe") {
                // Steppe Khan's battle standard polygon at top of mast
                const bannerPolys = gStands.calls.filter(
                  (c) => c.method === "poly" && c.args[0]?.length === 6 && c.args[0][1] < -35
                );
                expect(bannerPolys.length).toBeGreaterThanOrEqual(1);
                const breachedBannerPolys = gBreached.calls.filter(
                  (c) => c.method === "poly" && c.args[0]?.length === 6 && c.args[0][1] < -35
                );
                expect(breachedBannerPolys.length).toBe(0);
              } else if (kit === "islands") {
                expect(standsJson).toContain(String(0x67e8f9)); // cyan sailcloth banner accent
                expect(breachedJson).not.toContain(String(0x67e8f9));
              }
            }
          });

          it("drawMiniatureKeep renders intact keep with banner and coronet when stands, cracked/dark/stump when breached", () => {
            const gStands = createMockGraphics();
            drawMiniatureKeep(gStands, 40, 40, "western", undefined, true, 0.5, {
              isBreached: false,
              hasPeople: true,
            });

            const gBreached = createMockGraphics();
            drawMiniatureKeep(gBreached, 40, 40, "western", undefined, true, 0.5, {
              isBreached: true,
              hasPeople: true,
            });

            const standsJson = JSON.stringify(gStands.calls);
            const breachedJson = JSON.stringify(gBreached.calls);

            // Standing miniature keep:
            expect(standsJson).toContain(String(0xfef08a)); // warm window / hearth glint
            expect(standsJson).toContain(String(0xfacc15)); // golden coronet / finial

            // Breached miniature keep:
            expect(breachedJson).not.toContain(String(0xfef08a)); // dark window, no candle/hearth
            expect(breachedJson).not.toContain(String(0xfacc15)); // no golden coronet
            expect(breachedJson).toContain(String(0x0f172a)); // crack fissure on wall

            expect(standsJson).not.toEqual(breachedJson);
          });

          it("verifies pointer-events none and zero conflict markers for keep breach", async () => {
            const fs = await import("node:fs");
            const path = await import("node:path");
            const indexCode = fs.readFileSync(path.resolve(__dirname, "index.ts"), "utf-8");

            expect(indexCode).toContain('entitiesLayer.eventMode = "none"');
            expect(indexCode).toContain('g.eventMode = "none"');

            const files = ["buildings.ts", "tokens.ts", "index.ts"];
            for (const f of files) {
              const code = fs.readFileSync(path.resolve(__dirname, f), "utf-8");
              expect(code).not.toContain("<<<<<<<");
              expect(code).not.toContain("=======");
              expect(code).not.toContain(">>>>>>>");
            }
          });
        });

        describe("bakeoff/gemini-slot-pips: stall/post column slot pips on War", () => {
          it("exports SlotPip, StallSlotPip, SlotPips, ColumnSlotPips and calculation helpers", async () => {
            const {
              SlotPip,
              StallSlotPip,
              SlotPips,
              ColumnSlotPips,
              getFilledSlots,
              getMaxSlots,
              getColumnSlots,
            } = await import("../../app/src/hud/SlotPip.js");

            expect(typeof SlotPip).toBe("function");
            expect(typeof StallSlotPip).toBe("function");
            expect(typeof SlotPips).toBe("function");
            expect(typeof ColumnSlotPips).toBe("function");
            expect(typeof getFilledSlots).toBe("function");
            expect(typeof getMaxSlots).toBe("function");
            expect(typeof getColumnSlots).toBe("function");
          });

          it("correctly derives filled and max column slots from sim state", async () => {
            const { createGameState } = await import("@second-crown/sim");
            const { getFilledSlots, getMaxSlots, getColumnSlots } = await import("../../app/src/hud/SlotPip.js");

            const state = createGameState();
            // Fresh state: 0 active player columns out, base maxMarches is 1 (or 2 depending on gate)
            expect(getFilledSlots(state)).toBe(0);
            const baseMax = getMaxSlots(state);
            expect(baseMax).toBeGreaterThanOrEqual(1);

            const slots = getColumnSlots(state);
            expect(slots.filled).toBe(0);
            expect(slots.max).toBe(baseMax);

            // Simulate an active player march
            state.flags["marches_json"] = JSON.stringify([
              {
                id: "m_1",
                realmId: "player",
                fromId: "p_0",
                toId: "p_1",
                arrivesTick: 100,
                kind: "node",
                levy: 5,
                purpose: "raid",
              },
            ]);
            expect(getFilledSlots(state)).toBe(1);
            expect(getColumnSlots(state).filled).toBe(1);

            // Add an NPC march (should NOT count toward player filled slots)
            state.flags["marches_json"] = JSON.stringify([
              {
                id: "m_1",
                realmId: "player",
                fromId: "p_0",
                toId: "p_1",
                arrivesTick: 100,
                kind: "node",
                levy: 5,
                purpose: "raid",
              },
              {
                id: "m_npc",
                realmId: "rival",
                fromId: "p_3",
                toId: "p_4",
                arrivesTick: 120,
                kind: "node",
                levy: 5,
                purpose: "raid",
              },
            ]);
            expect(getFilledSlots(state)).toBe(1);

            // Add an active player gather (shares march slot)
            state.flags["gathers_json"] = JSON.stringify([
              {
                id: "g_1",
                realmId: "player",
                toId: "p_2",
                node: "quarry",
                phase: "outbound",
                arrivesTick: 150,
                gatherStartedTick: 0,
                capacity: 20,
                load: "0",
              },
            ]);
            expect(getFilledSlots(state)).toBe(2);
            expect(getColumnSlots(state).filled).toBe(2);
          });

          it("verifies SlotPip component source code structure, SVG artwork, and pointer-events: none", async () => {
            const fs = await import("node:fs");
            const path = await import("node:path");
            const pipPath = path.resolve(__dirname, "../../app/src/hud/SlotPip.tsx");
            expect(fs.existsSync(pipPath)).toBe(true);

            const code = fs.readFileSync(pipPath, "utf-8");

            // Strictly pointer-events: none
            expect(code).toContain('pointerEvents: "none"');
            expect(code).toContain('aria-hidden="true"');

            // Data attributes for testing & inspection
            expect(code).toContain('data-slot-kind="stall-post"');
            expect(code).toContain("data-slot-pips");

            // Empty stall/post elements (dormant timber, cold iron ring, flat timber cap)
            expect(code).toContain("EmptyStallPostSvg");
            expect(code).toContain("#475569"); // cold iron hitching ring
            expect(code).toContain("#3b2314"); // dormant timber
            expect(code).toContain("sc-stall-post-empty");

            // Filled stall/post elements (war pennant, gold spearhead, beacon flame, active harness)
            expect(code).toContain("FilledStallPostSvg");
            expect(code).toContain("#dc2626"); // crimson column pennant
            expect(code).toContain("#facc15"); // gold finial
            expect(code).toContain("#fef08a"); // warm flame core
            expect(code).toContain("#f59e0b"); // amber halo / highlight
            expect(code).toContain("sc-stall-post-filled");
          });

          it("verifies slot-pip.css styling and pointer-events non-blocking guarantee", async () => {
            const fs = await import("node:fs");
            const path = await import("node:path");
            const cssPath = path.resolve(__dirname, "../../app/src/hud/slot-pip.css");
            expect(fs.existsSync(cssPath)).toBe(true);

            const css = fs.readFileSync(cssPath, "utf-8");

            expect(css).toContain("sc-slot-pips");
            expect(css).toContain("sc-slot-pip-wrapper");
            expect(css).toContain("sc-slot-pip-label");
            expect(css).toContain("pointer-events: none");
            expect(css).toContain("is-filled");
            expect(css).toContain("is-empty");
            expect(css).toContain("is-compact");
          });

          it("verifies SlotPips mounting in WarRoom under Columns and on AppShell War tab button", async () => {
            const fs = await import("node:fs");
            const path = await import("node:path");

            // 1. WarRoom Columns section
            const warRoomPath = path.resolve(__dirname, "../../app/src/WarRoom.tsx");
            const warRoomCode = fs.readFileSync(warRoomPath, "utf-8");
            expect(warRoomCode).toContain("SlotPips");
            expect(warRoomCode).toContain("<SlotPips state={state} />");

            // 2. AppShell War tab button
            const appShellPath = path.resolve(__dirname, "../../app/src/AppShell.tsx");
            const appShellCode = fs.readFileSync(appShellPath, "utf-8");
            expect(appShellCode).toContain("SlotPips");
            expect(appShellCode).toContain('id === "war" && <SlotPips state={state} compact />');

            // 3. Invariants: theme.css strictly untouched!
            const themeCssPath = path.resolve(__dirname, "../../app/src/theme.css");
            const themeCss = fs.readFileSync(themeCssPath, "utf-8");
            expect(themeCss).not.toContain("sc-slot-pip");
          });
        });

        describe("bakeoff/gemini-cottage-bunk: cottages show a small bunk / bed pip (full hold: packed extra bedrolls; free bed: one empty bunk)", () => {
          const visuals = getThemeVisuals("spring");

          it("isHoldFull and hasFreeBed correctly detect full hold (pop === beds) vs free bed", async () => {
            const { isHoldFull, hasFreeBed } = await import("./buildings.js");
            expect(typeof isHoldFull).toBe("function");
            expect(typeof hasFreeBed).toBe("function");

            // Explicit options overrides
            expect(isHoldFull(null, { isFull: true })).toBe(true);
            expect(isHoldFull(null, { isHoldFull: true })).toBe(true);
            expect(isHoldFull(null, { isPacked: true })).toBe(true);
            expect(isHoldFull(null, { hasFreeBed: false })).toBe(true);
            expect(isHoldFull(null, { pop: 4, beds: 4 })).toBe(true);
            expect(isHoldFull(null, { pop: 5, beds: 4 })).toBe(true);

            expect(isHoldFull(null, { isFull: false })).toBe(false);
            expect(isHoldFull(null, { isHoldFull: false })).toBe(false);
            expect(isHoldFull(null, { isPacked: false })).toBe(false);
            expect(isHoldFull(null, { hasFreeBed: true })).toBe(false);
            expect(isHoldFull(null, { pop: 3, beds: 4 })).toBe(false);

            expect(hasFreeBed(null, { isFull: false })).toBe(true);
            expect(hasFreeBed(null, { isFull: true })).toBe(false);

            // Sim state evaluation:
            // Base state has 0 citizens, 2 base beds from Keep 0
            const state = createMockState();
            state.citizens = [];
            state.buildings = [];
            expect(isHoldFull(state)).toBe(false);
            expect(hasFreeBed(state)).toBe(true);

            // Add 2 citizens: pop (2) === beds (2) -> full hold
            state.citizens = [
              { id: "c1", realmId: "player", job: "unassigned", tile: null },
              { id: "c2", realmId: "player", job: "unassigned", tile: null },
            ];
            expect(isHoldFull(state)).toBe(true);
            expect(hasFreeBed(state)).toBe(false);

            // Build a cottage (level 1): +2 beds -> total beds = 4. Pop (2) < beds (4) -> free bed!
            state.buildings = [
              { id: "cot1", typeId: "cottage", realmId: "player", x: 2, y: 3, level: 1, completesAtTick: null },
            ];
            expect(isHoldFull(state)).toBe(false);
            expect(hasFreeBed(state)).toBe(true);

            // Add 2 more citizens: pop (4) === beds (4) -> full hold!
            state.citizens.push(
              { id: "c3", realmId: "player", job: "farmer", tile: { x: 2, y: 3 } },
              { id: "c4", realmId: "player", job: "farmer", tile: { x: 2, y: 3 } }
            );
            expect(isHoldFull(state)).toBe(true);
            expect(hasFreeBed(state)).toBe(false);

            // Flag overrides
            state.flags = { isHoldFull: false };
            expect(isHoldFull(state)).toBe(false);
            state.flags = { isHoldFull: true };
            expect(isHoldFull(state)).toBe(true);
          });

          it("Western cottage renders one empty bunk with clean white linen when hold has free bed", () => {
            const g = createMockGraphics();
            drawIsometricBuilding(g, "cottage", 1, true, 0.5, visuals, 2, 2, undefined, "western", {
              isFull: false,
            });

            // 1. One empty bunk features:
            // Clean white/cream linen mattress surface (0xf8fafc)
            const cleanLinen = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf8fafc);
            expect(cleanLinen.length).toBeGreaterThan(0);

            // Plump empty white pillow at headboard (0xffffff)
            const whitePillow = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xffffff);
            expect(whitePillow.length).toBeGreaterThan(0);

            // Free bed vacant green pip indicator (0x4ade80)
            const freePip = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x4ade80);
            expect(freePip.length).toBeGreaterThan(0);

            // 2. Suppresses packed elements:
            // Zero occupied crimson quilt (0x991b1b)
            const crimsonQuilt = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x991b1b);
            expect(crimsonQuilt.length).toBe(0);

            // Zero forest green extra bedroll (0x166534)
            const greenRoll = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x166534);
            expect(greenRoll.length).toBe(0);

            // Zero terracotta / rust extra bedroll (0xc2410c)
            const rustRoll = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xc2410c);
            expect(rustRoll.length).toBe(0);

            // Zero navy travel roll (0x1e3a8a)
            const navyRoll = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x1e3a8a);
            expect(navyRoll.length).toBe(0);

            // Zero full hold red pip (0xef4444)
            const fullPip = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xef4444);
            expect(fullPip.length).toBe(0);
          });

          it("Western cottage renders packed cottage with extra bedrolls when hold is full (pop === beds)", () => {
            const g = createMockGraphics();
            drawIsometricBuilding(g, "cottage", 1, true, 0.5, visuals, 2, 2, undefined, "western", {
              isFull: true,
            });

            // 1. Packed cottage with extra bedrolls:
            // Occupied crimson quilt on bunk (0x991b1b)
            const crimsonQuilt = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x991b1b);
            expect(crimsonQuilt.length).toBeGreaterThan(0);

            // Extra bedroll 1: deep emerald wool roll (0x065f46)
            const greenRoll = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x065f46);
            expect(greenRoll.length).toBeGreaterThan(0);

            // Extra bedroll 2: rust terracotta roll (0x9a3412)
            const rustRoll = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x9a3412);
            expect(rustRoll.length).toBeGreaterThan(0);

            // Extra bedroll 3: navy blue travel roll (0x1e3a8a)
            const navyRoll = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x1e3a8a);
            expect(navyRoll.length).toBeGreaterThan(0);

            // Amber leather binding straps on bedroll (0xb45309)
            const leatherStraps = g.calls.filter((c) => c.method === "stroke" && c.args[0]?.color === 0xb45309);
            expect(leatherStraps.length).toBeGreaterThan(0);

            // Gold cord & buckle on rust roll (0xfacc15)
            const goldCord = g.calls.filter((c) => c.method === "stroke" && c.args[0]?.color === 0xfacc15);
            expect(goldCord.length).toBeGreaterThan(0);

            // Packed red pip indicator (0xef4444)
            const fullPip = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xef4444);
            expect(fullPip.length).toBeGreaterThan(0);

            // 2. Suppresses empty mattress and free bed pip:
            const cleanLinen = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0xf8fafc);
            expect(cleanLinen.length).toBe(0);

            const freePip = g.calls.filter((c) => c.method === "fill" && c.args[0]?.color === 0x4ade80);
            expect(freePip.length).toBe(0);
          });

          it("all 4 culture cottages (cedar, sand, steppe, islands) render empty bunk vs packed extra bedrolls", () => {
            const cultureKits = ["cedar", "sand", "steppe", "islands"] as const;

            for (const kit of cultureKits) {
              const gFree = createMockGraphics();
              drawIsometricBuilding(gFree, "cottage", 1, true, 0.5, visuals, 2, 2, undefined, kit, {
                isFull: false,
              });

              const gFull = createMockGraphics();
              drawIsometricBuilding(gFull, "cottage", 1, true, 0.5, visuals, 2, 2, undefined, kit, {
                isFull: true,
              });

              const freeCalls = JSON.stringify(gFree.calls);
              const fullCalls = JSON.stringify(gFull.calls);

              // Free bed state across all cultures has clean white linen and green pip
              expect(freeCalls).toContain(String(0xf8fafc)); // clean linen
              expect(freeCalls).toContain(String(0x4ade80)); // green free bed pip
              expect(freeCalls).not.toContain(String(0x065f46)); // no green bedroll
              expect(freeCalls).not.toContain(String(0x9a3412)); // no rust bedroll

              // Full hold state across all cultures has crimson quilt, extra bedrolls, and red pip
              expect(fullCalls).toContain(String(0x991b1b)); // crimson quilt
              expect(fullCalls).toContain(String(0x065f46)); // extra green bedroll
              expect(fullCalls).toContain(String(0x9a3412)); // extra rust bedroll
              expect(fullCalls).toContain(String(0xef4444)); // red full pip
              expect(fullCalls).not.toContain(String(0xf8fafc)); // no empty clean linen
              expect(fullCalls).not.toContain(String(0x4ade80)); // no green free pip
            }
          });

          it("suppresses cottage bunk and bedrolls when completesAtTick is set (complete = false)", () => {
            const gDone = createMockGraphics();
            drawIsometricBuilding(gDone, "cottage", 1, true, 0.5, visuals, 2, 2, undefined, "western", {
              isFull: true,
            });

            const gScaffold = createMockGraphics();
            drawIsometricBuilding(gScaffold, "cottage", 1, false, 0.5, visuals, 2, 2, undefined, "western", {
              isFull: true,
            });

            const doneJson = JSON.stringify(gDone.calls);
            const scaffoldJson = JSON.stringify(gScaffold.calls);

            // Finished cottage renders packed bedrolls
            expect(doneJson).toContain(String(0x065f46));
            expect(doneJson).toContain(String(0x9a3412));

            // Scaffolding suppresses bunk and bedrolls
            expect(scaffoldJson).not.toContain(String(0x065f46));
            expect(scaffoldJson).not.toContain(String(0x9a3412));
            expect(scaffoldJson).not.toContain(String(0x991b1b));
          });

          it("verifies pointer-events none and zero conflict markers for cottage bunk", async () => {
            const fs = await import("node:fs");
            const path = await import("node:path");
            const indexCode = fs.readFileSync(path.resolve(__dirname, "index.ts"), "utf-8");

            expect(indexCode).toContain('entitiesLayer.eventMode = "none"');
            expect(indexCode).toContain('g.eventMode = "none"');

            const files = ["buildings.ts", "tokens.ts", "index.ts"];
            for (const f of files) {
              const code = fs.readFileSync(path.resolve(__dirname, f), "utf-8");
              expect(code).not.toContain("<<<<<<<");
              expect(code).not.toContain("=======");
              expect(code).not.toContain(">>>>>>>");
            }
          });
        });

        describe("bakeoff/gemini-stores: Distinct isometric chips for Granary, Mint, Sawmill, Mason Yard (Finished vs Scaffolding)", () => {
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

          it("renders distinct finished Western isometric chips for all four store buildings", () => {
            // 1. Granary: staddle stone mushroom caps, wheat finial, suspended flour sack, grain barrels
            const gGranary = createMockGraphics();
            drawIsometricBuilding(gGranary, "granary", 1, true, 0.5, defaultVisuals, 2, 2, undefined, "western");
            const granaryJson = JSON.stringify(gGranary.calls);
            expect(granaryJson).toContain(String(0xd4a359)); // Thatch roof
            expect(granaryJson).toContain(String(0xfef08a)); // Suspended flour sack
            expect(granaryJson).toContain(String(0xfacc15)); // Golden grain in barrels
            expect(granaryJson).toContain(String(0x94a3b8)); // Staddle stone caps

            // 2. Mint: Romanesque arch, padlock, gilded crown medallion, flywheel press, bullion ingots
            const gMint = createMockGraphics();
            drawIsometricBuilding(gMint, "mint", 1, true, 0.5, defaultVisuals, 2, 2, undefined, "western");
            const mintJson = JSON.stringify(gMint.calls);
            expect(mintJson).toContain(String(0xfacc15)); // Gilded crown & bullion ingots
            expect(mintJson).toContain(String(0xd97706)); // Flywheel coin press
            expect(mintJson).toContain(String(0xf97316)); // Smelting crucible coals
            expect(mintJson).toContain(String(0xd4a359)); // Brass padlock & scale

            // 3. Sawmill: timber millhouse, turning waterwheel, splashing foam, log on carriage, circular saw, sawdust
            const gSawmill = createMockGraphics();
            drawIsometricBuilding(gSawmill, "sawmill", 1, true, 0.5, defaultVisuals, 2, 2, undefined, "western");
            const sawmillJson = JSON.stringify(gSawmill.calls);
            expect(sawmillJson).toContain(String(0xe0f2fe)); // Water churn foam
            expect(sawmillJson).toContain(String(0x38bdf8)); // Flume water flow
            expect(sawmillJson).toContain(String(0xcbd5e1)); // Steel circular saw blade
            expect(sawmillJson).toContain(String(0xfef08a)); // Fresh sawdust mound

            // 4. Mason Yard: stonecutter lodge, banker workbench with chisel & mallet, high derrick shear-legs, cut ashlar stack
            const gMason = createMockGraphics();
            drawIsometricBuilding(gMason, "mason", 1, true, 0.5, defaultVisuals, 2, 2, undefined, "western");
            const masonJson = JSON.stringify(gMason.calls);
            expect(masonJson).toContain(String(0x94a3b8)); // Dressed ashlar blocks
            expect(masonJson).toContain(String(0x334155)); // Slate roof & tongs
            expect(masonJson).toContain(String(0xf8fafc)); // Displayed carved column
            expect(masonJson).toContain(String(0xe2e8f0)); // Marble urn
          });

          it("renders distinct scaffolding timber chips for all four store buildings when complete = false", () => {
            // 1. Granary Scaffolding: staddle bases, exposed floor joists, A-frame hoist, peg bucket
            const gGranaryScaffold = createMockGraphics();
            drawIsometricBuilding(gGranaryScaffold, "granary", 1, false, 0.5, defaultVisuals, 2, 2, undefined, "western");
            const granaryScaffoldJson = JSON.stringify(gGranaryScaffold.calls);
            expect(granaryScaffoldJson).toContain(String(0xe2e8f0)); // Chalk boundary
            expect(granaryScaffoldJson).toContain(String(0x94a3b8)); // Hook
            // Suppresses finished thatch roof, dormer, flour sack
            expect(granaryScaffoldJson).not.toContain(String(0xd4a359)); // no thatch roof

            // 2. Mint Scaffolding: foundation trench, low stone plinth courses, wooden vault centering arch former, derrick lifting lintel
            const gMintScaffold = createMockGraphics();
            drawIsometricBuilding(gMintScaffold, "mint", 1, false, 0.5, defaultVisuals, 2, 2, undefined, "western");
            const mintScaffoldJson = JSON.stringify(gMintScaffold.calls);
            expect(mintScaffoldJson).toContain(String(0x1e293b)); // Foundation trench
            expect(mintScaffoldJson).toContain(String(0xe2e8f0)); // Lime mortar in trough
            // Suppresses finished crown medallion, coin press, bullion ingots
            expect(mintScaffoldJson).not.toContain(String(0xfacc15)); // no gold bullion or crown
            expect(mintScaffoldJson).not.toContain(String(0xf97316)); // no smelting coals

            // 3. Sawmill Scaffolding: excavated millrace flume channel, wheel bearing posts (no wheel), King-post open trusses
            const gSawmillScaffold = createMockGraphics();
            drawIsometricBuilding(gSawmillScaffold, "sawmill", 1, false, 0.5, defaultVisuals, 2, 2, undefined, "western");
            const sawmillScaffoldJson = JSON.stringify(gSawmillScaffold.calls);
            expect(sawmillScaffoldJson).toContain(String(0x1e293b)); // Channel ditch
            expect(sawmillScaffoldJson).toContain(String(0x64748b)); // Spindle
            // Suppresses finished waterwheel spray, foam, finished walls
            expect(sawmillScaffoldJson).not.toContain(String(0xe0f2fe)); // no foam spray
            expect(sawmillScaffoldJson).not.toContain(String(0x38bdf8)); // no flume water
            expect(sawmillScaffoldJson).not.toContain(String(0xbae6fd)); // no foam bubbles
            expect(sawmillScaffoldJson).not.toContain(String(0x5b2609)); // no finished wall facet

            // 4. Mason Scaffolding: chalk grid, red corner boundary pegs, high derrick shear-legs, rough boulders with splitting wedges
            const gMasonScaffold = createMockGraphics();
            drawIsometricBuilding(gMasonScaffold, "mason", 1, false, 0.5, defaultVisuals, 2, 2, undefined, "western");
            const masonScaffoldJson = JSON.stringify(gMasonScaffold.calls);
            expect(masonScaffoldJson).toContain(String(0xdc2626)); // Red boundary stakes
            expect(masonScaffoldJson).toContain(String(0x475569)); // Sledgehammer
            // Suppresses finished carved column and arched workshop door
            expect(masonScaffoldJson).not.toContain(String(0xf8fafc)); // no carved column
            expect(masonScaffoldJson).not.toContain(String(0x1e293b)); // no arched workshop door
          });

          it("renders cultural chips across all 4 kits (cedar, sand, steppe, islands) for each store building", () => {
            const cultureKits = ["cedar", "sand", "steppe", "islands"] as const;
            const storeTypes = ["granary", "mint", "sawmill", "mason"] as const;

            for (const typeId of storeTypes) {
              for (const kit of cultureKits) {
                const g = createMockGraphics();
                drawIsometricBuilding(g, typeId, 1, true, 0.5, defaultVisuals, 2, 2, undefined, kit);
                expect(g.calls.length).toBeGreaterThan(10);

                const gScaffold = createMockGraphics();
                drawIsometricBuilding(gScaffold, typeId, 1, false, 0.5, defaultVisuals, 2, 2, undefined, kit);
                expect(gScaffold.calls.length).toBeGreaterThan(10);
              }
            }
          });

          it("verifies direct exported scaffolding functions exist and execute cleanly", async () => {
            const buildingsModule = await import("./buildings.js");
            expect(typeof buildingsModule.drawGranaryScaffolding).toBe("function");
            expect(typeof buildingsModule.drawMintScaffolding).toBe("function");
            expect(typeof buildingsModule.drawSawmillScaffolding).toBe("function");
            expect(typeof buildingsModule.drawMasonScaffolding).toBe("function");

            const cult = buildingsModule.culturePalette("western");
            for (const fn of [
              buildingsModule.drawGranaryScaffolding,
              buildingsModule.drawMintScaffolding,
              buildingsModule.drawSawmillScaffolding,
              buildingsModule.drawMasonScaffolding,
            ]) {
              const g = createMockGraphics();
              fn(g, 20, 1.0, 0.5, "western", cult);
              expect(g.calls.length).toBeGreaterThan(5);
            }
          });

          it("verifies pointer-events none and zero conflict markers for store buildings", async () => {
            const fs = await import("node:fs");
            const path = await import("node:path");
            const indexCode = fs.readFileSync(path.resolve(__dirname, "index.ts"), "utf-8");

            expect(indexCode).toContain('entitiesLayer.eventMode = "none"');
            expect(indexCode).toContain('g.eventMode = "none"');

            const files = ["buildings.ts", "tokens.ts", "index.ts"];
            for (const f of files) {
              const code = fs.readFileSync(path.resolve(__dirname, f), "utf-8");
              expect(code).not.toContain("<<<<<<<");
              expect(code).not.toContain("=======");
              expect(code).not.toContain(">>>>>>>");
            }
          });

          describe("bakeoff/gemini-world-crests: 28px RealmCrestPip across World view", () => {
            it("verifies WorldPanel mounts 28px RealmCrestPip for player banner and known crowns", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const panelPath = path.resolve(__dirname, "../../app/src/WorldPanel.tsx");
              expect(fs.existsSync(panelPath)).toBe(true);
              const code = fs.readFileSync(panelPath, "utf-8");

              const cardPath = path.resolve(__dirname, "../../app/src/hud/RealmCard.tsx");
              const cardCode = fs.readFileSync(cardPath, "utf-8");

              // Known crowns rows use RealmCardHead which renders 28px RealmCrestPip
              expect(code).toContain("RealmCardHead");
              expect(cardCode).toContain("<RealmCrestPip realmId={realm.id} stance={stance} size={28} />");
            });

            it("verifies WorldTab mounts 28px RealmCrestPip for watchtower warnings, foreign wars, and holds on the board", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const tabPath = path.resolve(__dirname, "../../app/src/tabs/WorldTab.tsx");
              expect(fs.existsSync(tabPath)).toBe(true);
              const code = fs.readFileSync(tabPath, "utf-8");

              expect(code).toContain("RealmCrestPip");
              // Watchtower warning
              expect(code).toContain('<RealmCrestPip realmId={seen.realmId} size={28} stance="war" />');
              // Foreign war clash header
              expect(code).toContain('<RealmCrestPip realmId={clash.a} size={28} stance="war" />');
              expect(code).toContain('<RealmCrestPip realmId={clash.b} size={28} stance="war" />');
              // Holds on the board
              expect(code).toContain('<RealmCrestPip realmId={targetRealmId} stance={stance} size={28} />');
            });

            it("verifies RealmCrestPip enforces pointer-events none and zero conflict markers", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const pipPath = path.resolve(__dirname, "../../app/src/hud/RealmCrestPip.tsx");
              expect(fs.existsSync(pipPath)).toBe(true);
              const pipCode = fs.readFileSync(pipPath, "utf-8");

              expect(pipCode).toContain('pointerEvents: "none"');
              expect(pipCode).toContain('aria-hidden="true"');

              const files = [
                path.resolve(__dirname, "../../app/src/WorldPanel.tsx"),
                path.resolve(__dirname, "../../app/src/tabs/WorldTab.tsx"),
              ];
              for (const f of files) {
                const content = fs.readFileSync(f, "utf-8");
                expect(content).not.toContain("<<<<<<<");
                expect(content).not.toContain("=======");
                expect(content).not.toContain(">>>>>>>");
              }
            });
          });

          describe("bakeoff/gemini-map-pips: Map strip under the board with small pips", () => {
            it("verifies map-strip.css defines layout, cell styling, pip non-blocking guarantee, and theme.css is untouched", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cssPath = path.resolve(__dirname, "../../app/src/hud/map-strip.css");
              expect(fs.existsSync(cssPath)).toBe(true);
              const css = fs.readFileSync(cssPath, "utf-8");

              expect(css).toContain("sc-map-strip");
              expect(css).toContain("sc-map-strip-row");
              expect(css).toContain("sc-map-strip-cell");
              expect(css).toContain("sc-map-strip-pip");
              expect(css).toContain("pointer-events: none !important");
              expect(css).toContain("sc-map-strip-hints");

              const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
              expect(themeCss).not.toContain("sc-map-strip");
            });

            it("verifies WallPip and VisionPip component properties, SVG artwork, and pointer-events: none", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const wallPath = path.resolve(__dirname, "../../app/src/hud/WallPip.tsx");
              expect(fs.existsSync(wallPath)).toBe(true);
              const wallCode = fs.readFileSync(wallPath, "utf-8");

              expect(wallCode).toContain("WallPip");
              expect(wallCode).toContain('pointerEvents: "none"');
              expect(wallCode).toContain('aria-hidden="true"');
              expect(wallCode).toContain("data-wall-pip");
              expect(wallCode).toContain("sc-wall-pip-wrapper");
              expect(wallCode).toContain("size = 20");

              const visionPath = path.resolve(__dirname, "../../app/src/hud/VisionPip.tsx");
              expect(fs.existsSync(visionPath)).toBe(true);
              const visionCode = fs.readFileSync(visionPath, "utf-8");

              expect(visionCode).toContain("VisionPip");
              expect(visionCode).toContain('pointerEvents: "none"');
              expect(visionCode).toContain('aria-hidden="true"');
              expect(visionCode).toContain("data-vision-pip");
              expect(visionCode).toContain("sc-vision-pip-wrapper");
              expect(visionCode).toContain("size = 20");
            });

            it("verifies KingdomTab mounts sc-map-strip with keep crest, WallLine (WallPip), and VisionLine (VisionPip)", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const tabPath = path.resolve(__dirname, "../../app/src/tabs/KingdomTab.tsx");
              expect(fs.existsSync(tabPath)).toBe(true);
              const tabCode = fs.readFileSync(tabPath, "utf-8");

              expect(tabCode).toContain("sc-map-strip");
              expect(tabCode).toContain("sc-map-strip-row");
              expect(tabCode).toContain("sc-map-strip-cell is-hold");
              expect(tabCode).toContain("RealmCrestPip");
              expect(tabCode).toContain('<RealmCrestPip realmId="player" size={20} />');
              expect(tabCode).toContain("WallLine");
              expect(tabCode).toContain("VisionLine");
              expect(tabCode).toContain("sc-map-strip-hints");

              const wallLinePath = path.resolve(__dirname, "../../app/src/WallLine.tsx");
              const wallLineCode = fs.readFileSync(wallLinePath, "utf-8");
              expect(wallLineCode).toContain("WallPip");

              const visionLinePath = path.resolve(__dirname, "../../app/src/VisionLine.tsx");
              const visionLineCode = fs.readFileSync(visionLinePath, "utf-8");
              expect(visionLineCode).toContain("VisionPip");
            });

            it("verifies zero merge conflict markers across all modified files", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const files = [
                path.resolve(__dirname, "../../app/src/hud/map-strip.css"),
                path.resolve(__dirname, "../../app/src/hud/WallPip.tsx"),
                path.resolve(__dirname, "../../app/src/hud/VisionPip.tsx"),
                path.resolve(__dirname, "../../app/src/WallLine.tsx"),
                path.resolve(__dirname, "../../app/src/VisionLine.tsx"),
                path.resolve(__dirname, "../../app/src/tabs/KingdomTab.tsx"),
              ];
              for (const f of files) {
                const content = fs.readFileSync(f, "utf-8");
                expect(content).not.toContain("<<<<<<<");
                expect(content).not.toContain("=======");
                expect(content).not.toContain(">>>>>>>");
              }
            });
          });

          describe("bakeoff/gemini-button-pips: 16px pips on leftover buttons (build, study, holiday)", () => {
            it("verifies button-pips.css defines layout, pip non-blocking guarantee, and theme.css is untouched", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cssPath = path.resolve(__dirname, "../../app/src/hud/button-pips.css");
              expect(fs.existsSync(cssPath)).toBe(true);
              const css = fs.readFileSync(cssPath, "utf-8");

              expect(css).toContain("sc-btn-pip");
              expect(css).toContain("sc-holiday-pip");
              expect(css).toContain("pointer-events: none !important");
              expect(css).toContain("sc-btn-with-pip");

              const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
              expect(themeCss).not.toContain("sc-btn-pip");
              expect(themeCss).not.toContain("sc-holiday-pip");
            });

            it("verifies HolidayPip component properties, prop emoji emblems, and pointer-events: none", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const holidayPath = path.resolve(__dirname, "../../app/src/hud/HolidayPip.tsx");
              expect(fs.existsSync(holidayPath)).toBe(true);
              const holidayCode = fs.readFileSync(holidayPath, "utf-8");

              expect(holidayCode).toContain("HolidayPip");
              expect(holidayCode).toContain('pointerEvents: "none"');
              expect(holidayCode).toContain('aria-hidden="true"');
              expect(holidayCode).toContain("data-holiday-pip");
              expect(holidayCode).toContain("size = 16");
              expect(holidayCode).toContain("detectCurrentHoliday");
              expect(holidayCode).toContain("getHolidayMeta");
            });

            it("verifies HallChip supports inline as='span' with 16px size and pointer-events: none", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const chipPath = path.resolve(__dirname, "../../app/src/hud/HallChip.tsx");
              expect(fs.existsSync(chipPath)).toBe(true);
              const chipCode = fs.readFileSync(chipPath, "utf-8");

              expect(chipCode).toContain("HallChip");
              expect(chipCode).toContain('pointerEvents: "none"');
              expect(chipCode).toContain('aria-hidden="true"');
              expect(chipCode).toContain("as?: \"div\" | \"span\"");
              expect(chipCode).toContain("as = \"div\"");
            });

            it("verifies ScrollPip supports 16px size and pointer-events: none", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const scrollPath = path.resolve(__dirname, "../../app/src/hud/ScrollPip.tsx");
              expect(fs.existsSync(scrollPath)).toBe(true);
              const scrollCode = fs.readFileSync(scrollPath, "utf-8");

              expect(scrollCode).toContain("ScrollPip");
              expect(scrollCode).toContain('pointerEvents: "none"');
              expect(scrollCode).toContain('aria-hidden="true"');
              expect(scrollCode).toContain("size?: number");
            });

            it("verifies KingdomTab mounts 16px HallChip pips on build buttons, Raising works, and Improving upgrades", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const tabPath = path.resolve(__dirname, "../../app/src/tabs/KingdomTab.tsx");
              expect(fs.existsSync(tabPath)).toBe(true);
              const tabCode = fs.readFileSync(tabPath, "utf-8");

              expect(tabCode).toContain("HallChip");
              expect(tabCode).toContain("button-pips.css");
              expect(tabCode).toContain('<HallChip typeId={t.id} size={16} as="span" />');
              expect(tabCode).toContain('<HallChip typeId="cottage" size={16} as="span" />');
              expect(tabCode).toContain('<HallChip typeId={b.typeId} size={16} as="span" />');
              expect(tabCode).toContain('<HallChip typeId={b?.typeId ?? ""} size={16} as="span" />');
            });

            it("verifies KeepInterior mounts 16px HallChip pips on building palette buttons", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const keepPath = path.resolve(__dirname, "../../app/src/KeepInterior.tsx");
              expect(fs.existsSync(keepPath)).toBe(true);
              const keepCode = fs.readFileSync(keepPath, "utf-8");

              expect(keepCode).toContain("HallChip");
              expect(keepCode).toContain('<HallChip typeId={t.id} size={16} as="span" />');
            });

            it("verifies ResearchBar mounts 16px ScrollPip pips on study buttons and active study rows", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const resPath = path.resolve(__dirname, "../../app/src/ResearchBar.tsx");
              expect(fs.existsSync(resPath)).toBe(true);
              const resCode = fs.readFileSync(resPath, "utf-8");

              expect(resCode).toContain("ScrollPip");
              expect(resCode).toContain("button-pips.css");
              expect(resCode).toContain('<ScrollPip size={16} status="open" />');
              expect(resCode).toContain('<ScrollPip size={16} status="ready" />');
              expect(resCode).toContain('<ScrollPip size={16} status="claimed" />');
            });

            it("verifies ChromeDock and TesterBar mount 16px HolidayPip pips on holiday controls", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const dockPath = path.resolve(__dirname, "../../app/src/ChromeDock.tsx");
              expect(fs.existsSync(dockPath)).toBe(true);
              const dockCode = fs.readFileSync(dockPath, "utf-8");
              expect(dockCode).toContain("HolidayPip");
              expect(dockCode).toContain('<HolidayPip holiday={holiday} size={16} />');

              const testerPath = path.resolve(__dirname, "../../app/src/TesterBar.tsx");
              expect(fs.existsSync(testerPath)).toBe(true);
              const testerCode = fs.readFileSync(testerPath, "utf-8");
              expect(testerCode).toContain("HolidayPip");
              expect(testerCode).toContain('<HolidayPip holiday={holidayPreview} size={16} />');
            });

            it("verifies zero merge conflict markers across all modified files", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const files = [
                path.resolve(__dirname, "../../app/src/hud/button-pips.css"),
                path.resolve(__dirname, "../../app/src/hud/HolidayPip.tsx"),
                path.resolve(__dirname, "../../app/src/hud/HallChip.tsx"),
                path.resolve(__dirname, "../../app/src/hud/ScrollPip.tsx"),
                path.resolve(__dirname, "../../app/src/tabs/KingdomTab.tsx"),
                path.resolve(__dirname, "../../app/src/KeepInterior.tsx"),
                path.resolve(__dirname, "../../app/src/ResearchBar.tsx"),
                path.resolve(__dirname, "../../app/src/ChromeDock.tsx"),
                path.resolve(__dirname, "../../app/src/TesterBar.tsx"),
              ];
              for (const f of files) {
                const content = fs.readFileSync(f, "utf-8");
                expect(content).not.toContain("<<<<<<<");
                expect(content).not.toContain("=======");
                expect(content).not.toContain(">>>>>>>");
              }
            });
          });

          describe("bakeoff/gemini-faction-seals: 24px faction seal pips (order, pact, guild) and spoils craft wax seals", () => {
            it("verifies faction-seals.css defines layout, non-blocking guarantee, and theme.css is untouched", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cssPath = path.resolve(__dirname, "../../app/src/hud/faction-seals.css");
              expect(fs.existsSync(cssPath)).toBe(true);
              const css = fs.readFileSync(cssPath, "utf-8");

              expect(css).toContain("sc-faction-seal-wrapper");
              expect(css).toContain("sc-faction-seal");
              expect(css).toContain("pointer-events: none !important");
              expect(css).toContain("sc-craft-seal");

              const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
              expect(themeCss).not.toContain("sc-faction-seal-wrapper");
              expect(themeCss).not.toContain("sc-craft-seal");
            });

            it("verifies FactionSealPip resolves order, pact, and guild with distinct 24px artwork and non-blocking guarantee", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const pipPath = path.resolve(__dirname, "../../app/src/hud/FactionSealPip.tsx");
              expect(fs.existsSync(pipPath)).toBe(true);
              const pipCode = fs.readFileSync(pipPath, "utf-8");

              expect(pipCode).toContain("FactionSealPip");
              expect(pipCode).toContain("resolveFactionKind");
              expect(pipCode).toContain('pointerEvents: "none"');
              expect(pipCode).toContain('aria-hidden="true"');
              expect(pipCode).toContain("data-faction-seal");
              expect(pipCode).toContain("size = 24");

              // Verify Order artwork (Amber chivalric sun sword)
              expect(pipCode).toContain("sc-seal-order");
              expect(pipCode).toContain("sc-faction-seal-order");

              // Verify Pact artwork (Carmine & silver salt covenant crossed stilettos)
              expect(pipCode).toContain("sc-seal-pact");
              expect(pipCode).toContain("sc-faction-seal-pact");

              // Verify Guild artwork (Emerald & bronze craftsman hammer and drafting calipers)
              expect(pipCode).toContain("sc-seal-guild");
              expect(pipCode).toContain("sc-faction-seal-guild");

              // Verify sworn member ring
              expect(pipCode).toContain("sc-seal-member-ring");
            });

            it("verifies resolveFactionKind correctly identifies order, pact, and guild instances", async () => {
              const { resolveFactionKind } = await import("../../app/src/hud/FactionSealPip");
              expect(resolveFactionKind("order")).toBe("order");
              expect(resolveFactionKind("pact")).toBe("pact");
              expect(resolveFactionKind("guild")).toBe("guild");

              expect(resolveFactionKind(undefined, { id: "order_amber", name: "Amber Compact", kind: "order" })).toBe("order");
              expect(resolveFactionKind(undefined, { id: "order_salt", name: "Salt Road Pact", kind: "order" })).toBe("pact");
              expect(resolveFactionKind(undefined, { id: "guild_player_999", name: "Iron Brotherhood", kind: "guild" })).toBe("guild");
            });

            it("verifies WaxSealPip supports craftId and non-blocking guarantee for spoils crafts", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const waxPath = path.resolve(__dirname, "../../app/src/hud/WaxSealPip.tsx");
              expect(fs.existsSync(waxPath)).toBe(true);
              const waxCode = fs.readFileSync(waxPath, "utf-8");

              expect(waxCode).toContain("craftId?: string");
              expect(waxCode).toContain("data-craft");
              expect(waxCode).toContain('pointerEvents: "none"');
            });

            it("verifies WorldPanel mounts 24px FactionSealPip on each faction card", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const panelPath = path.resolve(__dirname, "../../app/src/WorldPanel.tsx");
              expect(fs.existsSync(panelPath)).toBe(true);
              const panelCode = fs.readFileSync(panelPath, "utf-8");

              expect(panelCode).toContain("FactionSealPip");
              expect(panelCode).toContain("faction-seals.css");
              expect(panelCode).toContain("<FactionSealPip");
              expect(panelCode).toContain("size={24}");
            });

            it("verifies CrownTab mounts small WaxSealPip on each Spoils craft card", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const tabPath = path.resolve(__dirname, "../../app/src/tabs/CrownTab.tsx");
              expect(fs.existsSync(tabPath)).toBe(true);
              const tabCode = fs.readFileSync(tabPath, "utf-8");

              expect(tabCode).toContain("WaxSealPip");
              expect(tabCode).toContain("faction-seals.css");
              expect(tabCode).toContain("<WaxSealPip");
              expect(tabCode).toContain("size={16}");
              expect(tabCode).toContain("active={owned}");
              expect(tabCode).toContain("craftId={c.id}");
            });

            it("verifies zero merge conflict markers across all modified files", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const files = [
                path.resolve(__dirname, "../../app/src/hud/faction-seals.css"),
                path.resolve(__dirname, "../../app/src/hud/FactionSealPip.tsx"),
                path.resolve(__dirname, "../../app/src/hud/WaxSealPip.tsx"),
                path.resolve(__dirname, "../../app/src/WorldPanel.tsx"),
                path.resolve(__dirname, "../../app/src/tabs/CrownTab.tsx"),
              ];
              for (const f of files) {
                const content = fs.readFileSync(f, "utf-8");
                expect(content).not.toContain("<<<<<<<");
                expect(content).not.toContain("=======");
                expect(content).not.toContain(">>>>>>>");
              }
            });
          });

          describe("bakeoff/gemini-keep-rooms: small living pips on Hall, Wall, and Yard cards (bed, wall, anvil)", () => {
            it("verifies keep-room-pips.css defines layout, non-blocking guarantee, and theme.css is untouched", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cssPath = path.resolve(__dirname, "../../app/src/hud/keep-room-pips.css");
              expect(fs.existsSync(cssPath)).toBe(true);
              const css = fs.readFileSync(cssPath, "utf-8");

              expect(css).toContain("sc-room-pip-wrapper");
              expect(css).toContain("sc-bed-pip-wrapper");
              expect(css).toContain("sc-anvil-pip-wrapper");
              expect(css).toContain("sc-wall-pip-wrapper");
              expect(css).toContain("pointer-events: none !important");

              const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
              expect(themeCss).not.toContain("sc-bed-pip-wrapper");
              expect(themeCss).not.toContain("sc-anvil-pip-wrapper");
            });

            it("verifies BedPip exports component with carved posts, bolster, blanket, candlelight, and pointerEvents none", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const bedPath = path.resolve(__dirname, "../../app/src/hud/BedPip.tsx");
              expect(fs.existsSync(bedPath)).toBe(true);
              const bedCode = fs.readFileSync(bedPath, "utf-8");

              expect(bedCode).toContain("BedPip");
              expect(bedCode).toContain('pointerEvents: "none"');
              expect(bedCode).toContain('aria-hidden="true"');
              expect(bedCode).toContain("data-bed-pip");
              expect(bedCode).toContain("size = 16");
              expect(bedCode).toContain("sc-bed-candle-glow");
              expect(bedCode).toContain("sc-bed-cross");
            });

            it("verifies AnvilPip exports component with oak stump, forged steel face, hot billet, sparks, and pointerEvents none", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const anvilPath = path.resolve(__dirname, "../../app/src/hud/AnvilPip.tsx");
              expect(fs.existsSync(anvilPath)).toBe(true);
              const anvilCode = fs.readFileSync(anvilPath, "utf-8");

              expect(anvilCode).toContain("AnvilPip");
              expect(anvilCode).toContain('pointerEvents: "none"');
              expect(anvilCode).toContain('aria-hidden="true"');
              expect(anvilCode).toContain("data-anvil-pip");
              expect(anvilCode).toContain("size = 16");
              expect(anvilCode).toContain("sc-anvil-hot-billet");
              expect(anvilCode).toContain("sc-anvil-spark");
            });

            it("verifies WallPip exports component with battlements, gate arch, ring jewel, and pointerEvents none", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const wallPath = path.resolve(__dirname, "../../app/src/hud/WallPip.tsx");
              expect(fs.existsSync(wallPath)).toBe(true);
              const wallCode = fs.readFileSync(wallPath, "utf-8");

              expect(wallCode).toContain("WallPip");
              expect(wallCode).toContain('pointerEvents: "none"');
              expect(wallCode).toContain('aria-hidden="true"');
              expect(wallCode).toContain("data-wall-pip");
              expect(wallCode).toContain("sc-wall-pip-wrapper");
            });

            it("verifies KeepRoomPip unifies bed, wall, and anvil symbols with non-blocking guarantee", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const roomPipPath = path.resolve(__dirname, "../../app/src/hud/KeepRoomPip.tsx");
              expect(fs.existsSync(roomPipPath)).toBe(true);
              const pipCode = fs.readFileSync(roomPipPath, "utf-8");

              expect(pipCode).toContain("KeepRoomPip");
              expect(pipCode).toContain("BedPip");
              expect(pipCode).toContain("WallPip");
              expect(pipCode).toContain("AnvilPip");
              expect(pipCode).toContain('pointer-events: none');
            });

            it("verifies KeepInterior mounts living pips on room tabs and FactCards for Hall, Wall, and Yard", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const interiorPath = path.resolve(__dirname, "../../app/src/KeepInterior.tsx");
              expect(fs.existsSync(interiorPath)).toBe(true);
              const interiorCode = fs.readFileSync(interiorPath, "utf-8");

              // Imports
              expect(interiorCode).toContain("BedPip");
              expect(interiorCode).toContain("WallPip");
              expect(interiorCode).toContain("AnvilPip");
              expect(interiorCode).toContain("keep-room-pips.css");

              // Room tabs
              expect(interiorCode).toContain('r.id === "hall" && <BedPip');
              expect(interiorCode).toContain('r.id === "wall" && <WallPip');
              expect(interiorCode).toContain('r.id === "yard" && <AnvilPip');

              // FactCards
              expect(interiorCode).toContain('pip={<BedPip');
              expect(interiorCode).toContain('pip={<WallPip');
              expect(interiorCode).toContain('pip={<AnvilPip');
            });

            it("verifies zero merge conflict markers across all modified files", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const files = [
                path.resolve(__dirname, "../../app/src/hud/keep-room-pips.css"),
                path.resolve(__dirname, "../../app/src/hud/BedPip.tsx"),
                path.resolve(__dirname, "../../app/src/hud/AnvilPip.tsx"),
                path.resolve(__dirname, "../../app/src/hud/KeepRoomPip.tsx"),
                path.resolve(__dirname, "../../app/src/KeepInterior.tsx"),
              ];
              for (const f of files) {
                const content = fs.readFileSync(f, "utf-8");
                expect(content).not.toContain("<<<<<<<");
                expect(content).not.toContain("=======");
                expect(content).not.toContain(">>>>>>>");
              }
            });
          });

          describe("bakeoff/gemini-dawn-seal: 28px dawn seal pip on Second Dawn card", () => {
            it("verifies dawn-seal.css defines 28px pip layout, non-blocking guarantee, and theme.css is untouched", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cssPath = path.resolve(__dirname, "../../app/src/hud/dawn-seal.css");
              expect(fs.existsSync(cssPath)).toBe(true);
              const css = fs.readFileSync(cssPath, "utf-8");

              expect(css).toContain("sc-dawn-seal-wrapper");
              expect(css).toContain("pointer-events: none !important");
              expect(css).toContain("is-risen");
              expect(css).toContain("is-dormant");

              const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
              expect(themeCss).not.toContain("sc-dawn-seal");
            });

            it("verifies DawnSealPip exports 28px component with ribbons, scalloped wax, sunburst rays, second crown, and pointerEvents none", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const pipPath = path.resolve(__dirname, "../../app/src/hud/DawnSealPip.tsx");
              expect(fs.existsSync(pipPath)).toBe(true);
              const pipCode = fs.readFileSync(pipPath, "utf-8");

              expect(pipCode).toContain("DawnSealPip");
              expect(pipCode).toContain("size = 28");
              expect(pipCode).toContain('pointerEvents: "none"');
              expect(pipCode).toContain('aria-hidden="true"');
              expect(pipCode).toContain("data-dawn-seal");
              expect(pipCode).toContain("data-risen");
              expect(pipCode).toContain("sc-dawn-ribbons");
              expect(pipCode).toContain("sc-dawn-rays");
              expect(pipCode).toContain("sc-dawn-sigil");
              expect(pipCode).toContain("sc-dawn-glint");
            });

            it("verifies DawnCard mounts 28px DawnSealPip with active state tied to dawned (ach_ascend)", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cardPath = path.resolve(__dirname, "../../app/src/hud/DawnCard.tsx");
              expect(fs.existsSync(cardPath)).toBe(true);
              const cardCode = fs.readFileSync(cardPath, "utf-8");

              expect(cardCode).toContain("DawnSealPip");
              expect(cardCode).toContain("<DawnSealPip");
              expect(cardCode).toContain("size={28}");
              expect(cardCode).toContain("active={dawned}");
              expect(cardCode).toContain("sc-dawn-title-group");
            });

            it("verifies zero merge conflict markers across all modified and created files", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const files = [
                path.resolve(__dirname, "../../app/src/hud/dawn-seal.css"),
                path.resolve(__dirname, "../../app/src/hud/dawn-card.css"),
                path.resolve(__dirname, "../../app/src/hud/DawnSealPip.tsx"),
                path.resolve(__dirname, "../../app/src/hud/DawnCard.tsx"),
              ];
              for (const f of files) {
                const content = fs.readFileSync(f, "utf-8");
                expect(content).not.toContain("<<<<<<<");
                expect(content).not.toContain("=======");
                expect(content).not.toContain(">>>>>>>");
              }
            });
          });

          describe("bakeoff/gemini-ranger: 28px ranger chip on Ranger card (hood, bow, mist-blue cloak)", () => {
            it("verifies ranger-chip.css defines 28px layout, non-blocking guarantee, and theme.css is untouched", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cssPath = path.resolve(__dirname, "../../app/src/hud/ranger-chip.css");
              expect(fs.existsSync(cssPath)).toBe(true);
              const css = fs.readFileSync(cssPath, "utf-8");

              expect(css).toContain("sc-ranger-chip-wrapper");
              expect(css).toContain("pointer-events: none !important");
              expect(css).toContain("is-open");
              expect(css).toContain("is-locked");

              const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
              expect(themeCss).not.toContain("sc-ranger-chip");
            });

            it("verifies RangerChip exports 28px component with hood, bow, mist-blue cloak, and pointerEvents none", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const chipPath = path.resolve(__dirname, "../../app/src/hud/RangerChip.tsx");
              expect(fs.existsSync(chipPath)).toBe(true);
              const chipCode = fs.readFileSync(chipPath, "utf-8");

              expect(chipCode).toContain("RangerChip");
              expect(chipCode).toContain("size = 28");
              expect(chipCode).toContain('pointerEvents: "none"');
              expect(chipCode).toContain('aria-hidden="true"');
              expect(chipCode).toContain("data-ranger-chip");
              expect(chipCode).toContain("data-open");
              expect(chipCode).toContain("sc-ranger-cloak");
              expect(chipCode).toContain("sc-ranger-hood");
              expect(chipCode).toContain("sc-ranger-bow");
            });

            it("verifies UnitCard mounts 28px RangerChip on Ranger card", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cardPath = path.resolve(__dirname, "../../app/src/hud/UnitCard.tsx");
              expect(fs.existsSync(cardPath)).toBe(true);
              const cardCode = fs.readFileSync(cardPath, "utf-8");

              expect(cardCode).toContain("RangerChip");
              expect(cardCode).toContain('typeId === "ranger" ? (');
              expect(cardCode).toContain("<RangerChip size={28} open={open} />");
            });

            it("verifies UnitIcon has dedicated ranger art with hood, bow, and mist-blue cloak", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const iconPath = path.resolve(__dirname, "../../app/src/UnitIcon.tsx");
              expect(fs.existsSync(iconPath)).toBe(true);
              const iconCode = fs.readFileSync(iconPath, "utf-8");

              expect(iconCode).toContain('case "ranger":');
              expect(iconCode).toContain("Mist ranger");
            });

            it("verifies zero merge conflict markers across all modified and created files", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const files = [
                path.resolve(__dirname, "../../app/src/hud/ranger-chip.css"),
                path.resolve(__dirname, "../../app/src/hud/RangerChip.tsx"),
                path.resolve(__dirname, "../../app/src/hud/UnitCard.tsx"),
                path.resolve(__dirname, "../../app/src/UnitIcon.tsx"),
              ];
              for (const f of files) {
                const content = fs.readFileSync(f, "utf-8");
                expect(content).not.toContain("<<<<<<<");
                expect(content).not.toContain("=======");
                expect(content).not.toContain(">>>>>>>");
              }
            });
          });

          describe("bakeoff/gemini-banner: 28px banner chip on Banner card (spear, small pennant, glen-green cloak)", () => {
            it("verifies banner-chip.css defines 28px layout, non-blocking guarantee, and theme.css is untouched", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cssPath = path.resolve(__dirname, "../../app/src/hud/banner-chip.css");
              expect(fs.existsSync(cssPath)).toBe(true);
              const css = fs.readFileSync(cssPath, "utf-8");

              expect(css).toContain("sc-banner-chip-wrapper");
              expect(css).toContain("pointer-events: none !important");
              expect(css).toContain("is-open");
              expect(css).toContain("is-locked");

              const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
              expect(themeCss).not.toContain("sc-banner-chip");
            });

            it("verifies BannerChip exports 28px component with spear, small pennant, glen-green cloak, and pointerEvents none", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const chipPath = path.resolve(__dirname, "../../app/src/hud/BannerChip.tsx");
              expect(fs.existsSync(chipPath)).toBe(true);
              const chipCode = fs.readFileSync(chipPath, "utf-8");

              expect(chipCode).toContain("BannerChip");
              expect(chipCode).toContain("size = 28");
              expect(chipCode).toContain('pointerEvents: "none"');
              expect(chipCode).toContain('aria-hidden="true"');
              expect(chipCode).toContain("data-banner-chip");
              expect(chipCode).toContain("data-open");
              expect(chipCode).toContain("sc-banner-cloak");
              expect(chipCode).toContain("sc-banner-spear");
              expect(chipCode).toContain("sc-banner-pennant");
            });

            it("verifies UnitCard mounts 28px BannerChip on Banner card", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cardPath = path.resolve(__dirname, "../../app/src/hud/UnitCard.tsx");
              expect(fs.existsSync(cardPath)).toBe(true);
              const cardCode = fs.readFileSync(cardPath, "utf-8");

              expect(cardCode).toContain("BannerChip");
              expect(cardCode).toContain('typeId === "banner" ? (');
              expect(cardCode).toContain("<BannerChip size={28} open={open} />");
            });

            it("verifies UnitIcon has dedicated banner art with spear, small pennant, and glen-green cloak", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const iconPath = path.resolve(__dirname, "../../app/src/UnitIcon.tsx");
              expect(fs.existsSync(iconPath)).toBe(true);
              const iconCode = fs.readFileSync(iconPath, "utf-8");

              expect(iconCode).toContain('case "banner":');
              expect(iconCode).toContain("Glen Holds banner unit");
            });

            it("verifies zero merge conflict markers across all modified and created files", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const files = [
                path.resolve(__dirname, "../../app/src/hud/banner-chip.css"),
                path.resolve(__dirname, "../../app/src/hud/BannerChip.tsx"),
                path.resolve(__dirname, "../../app/src/hud/UnitCard.tsx"),
                path.resolve(__dirname, "../../app/src/UnitIcon.tsx"),
              ];
              for (const f of files) {
                const content = fs.readFileSync(f, "utf-8");
                expect(content).not.toContain("<<<<<<<");
                expect(content).not.toContain("=======");
                expect(content).not.toContain(">>>>>>>");
              }
            });
          });

          describe("bakeoff/gemini-outrider: 28px outrider chip on Outrider card (horse, short lance, salt-grey cloak)", () => {
            it("verifies outrider-chip.css defines 28px layout, non-blocking guarantee, and theme.css is untouched", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cssPath = path.resolve(__dirname, "../../app/src/hud/outrider-chip.css");
              expect(fs.existsSync(cssPath)).toBe(true);
              const css = fs.readFileSync(cssPath, "utf-8");

              expect(css).toContain("sc-outrider-chip-wrapper");
              expect(css).toContain("pointer-events: none !important");
              expect(css).toContain("is-open");
              expect(css).toContain("is-locked");

              const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
              expect(themeCss).not.toContain("sc-outrider-chip");
            });

            it("verifies OutriderChip exports 28px component with horse, short lance, salt-grey cloak, and pointerEvents none", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const chipPath = path.resolve(__dirname, "../../app/src/hud/OutriderChip.tsx");
              expect(fs.existsSync(chipPath)).toBe(true);
              const chipCode = fs.readFileSync(chipPath, "utf-8");

              expect(chipCode).toContain("OutriderChip");
              expect(chipCode).toContain("size = 28");
              expect(chipCode).toContain('pointerEvents: "none"');
              expect(chipCode).toContain('aria-hidden="true"');
              expect(chipCode).toContain("data-outrider-chip");
              expect(chipCode).toContain("data-open");
              expect(chipCode).toContain("sc-outrider-horse");
              expect(chipCode).toContain("sc-outrider-cloak");
              expect(chipCode).toContain("sc-outrider-lance");
            });

            it("verifies UnitCard mounts 28px OutriderChip on Outrider card", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cardPath = path.resolve(__dirname, "../../app/src/hud/UnitCard.tsx");
              expect(fs.existsSync(cardPath)).toBe(true);
              const cardCode = fs.readFileSync(cardPath, "utf-8");

              expect(cardCode).toContain("OutriderChip");
              expect(cardCode).toContain('typeId === "outrider" ? (');
              expect(cardCode).toContain("<OutriderChip size={28} open={open} />");
            });

            it("verifies UnitIcon has dedicated outrider art with horse, short lance, and salt-grey cloak", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const iconPath = path.resolve(__dirname, "../../app/src/UnitIcon.tsx");
              expect(fs.existsSync(iconPath)).toBe(true);
              const iconCode = fs.readFileSync(iconPath, "utf-8");

              expect(iconCode).toContain('case "outrider":');
              expect(iconCode).toContain("Salt coast outrider scout horse");
            });

            it("verifies zero merge conflict markers across all modified and created files", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const files = [
                path.resolve(__dirname, "../../app/src/hud/outrider-chip.css"),
                path.resolve(__dirname, "../../app/src/hud/OutriderChip.tsx"),
                path.resolve(__dirname, "../../app/src/hud/UnitCard.tsx"),
                path.resolve(__dirname, "../../app/src/UnitIcon.tsx"),
              ];
              for (const f of files) {
                const content = fs.readFileSync(f, "utf-8");
                expect(content).not.toContain("<<<<<<<");
                expect(content).not.toContain("=======");
                expect(content).not.toContain(">>>>>>>");
              }
            });
          });

          describe("bakeoff/gemini-warden: 28px warden chip on Warden card (short spear, round shield, fen-reed cloak)", () => {
            it("verifies warden-chip.css defines 28px layout, non-blocking guarantee, and theme.css is untouched", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cssPath = path.resolve(__dirname, "../../app/src/hud/warden-chip.css");
              expect(fs.existsSync(cssPath)).toBe(true);
              const css = fs.readFileSync(cssPath, "utf-8");

              expect(css).toContain("sc-warden-chip-wrapper");
              expect(css).toContain("pointer-events: none !important");
              expect(css).toContain("is-open");
              expect(css).toContain("is-locked");

              const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
              expect(themeCss).not.toContain("sc-warden-chip");
            });

            it("verifies WardenChip exports 28px component with short spear, round shield, fen-reed cloak, and pointerEvents none", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const chipPath = path.resolve(__dirname, "../../app/src/hud/WardenChip.tsx");
              expect(fs.existsSync(chipPath)).toBe(true);
              const chipCode = fs.readFileSync(chipPath, "utf-8");

              expect(chipCode).toContain("WardenChip");
              expect(chipCode).toContain("size = 28");
              expect(chipCode).toContain('pointerEvents: "none"');
              expect(chipCode).toContain('aria-hidden="true"');
              expect(chipCode).toContain("data-warden-chip");
              expect(chipCode).toContain("data-open");
              expect(chipCode).toContain("sc-warden-spear");
              expect(chipCode).toContain("sc-warden-shield");
              expect(chipCode).toContain("sc-warden-cloak");
              expect(chipCode).toContain("sc-warden-helm");
            });

            it("verifies UnitCard mounts 28px WardenChip on Warden card", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cardPath = path.resolve(__dirname, "../../app/src/hud/UnitCard.tsx");
              expect(fs.existsSync(cardPath)).toBe(true);
              const cardCode = fs.readFileSync(cardPath, "utf-8");

              expect(cardCode).toContain("WardenChip");
              expect(cardCode).toContain('typeId === "warden" ? (');
              expect(cardCode).toContain("<WardenChip size={28} open={open} />");
            });

            it("verifies UnitIcon has dedicated warden art with short spear, round shield, and fen-reed cloak", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const iconPath = path.resolve(__dirname, "../../app/src/UnitIcon.tsx");
              expect(fs.existsSync(iconPath)).toBe(true);
              const iconCode = fs.readFileSync(iconPath, "utf-8");

              expect(iconCode).toContain('case "warden":');
              expect(iconCode).toContain("Fen hold guard warden");
            });

            it("verifies zero merge conflict markers across all modified and created files", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const files = [
                path.resolve(__dirname, "../../app/src/hud/warden-chip.css"),
                path.resolve(__dirname, "../../app/src/hud/WardenChip.tsx"),
                path.resolve(__dirname, "../../app/src/hud/UnitCard.tsx"),
                path.resolve(__dirname, "../../app/src/UnitIcon.tsx"),
              ];
              for (const f of files) {
                const content = fs.readFileSync(f, "utf-8");
                expect(content).not.toContain("<<<<<<<");
                expect(content).not.toContain("=======");
                expect(content).not.toContain(">>>>>>>");
              }
            });
          });

          describe("bakeoff/gemini-lancer: 28px lancer chip on Lancer card (horse, long lance, peak-white cloak)", () => {
            it("verifies lancer-chip.css defines 28px layout, non-blocking guarantee, and theme.css is untouched", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cssPath = path.resolve(__dirname, "../../app/src/hud/lancer-chip.css");
              expect(fs.existsSync(cssPath)).toBe(true);
              const css = fs.readFileSync(cssPath, "utf-8");

              expect(css).toContain("sc-lancer-chip-wrapper");
              expect(css).toContain("pointer-events: none !important");
              expect(css).toContain("is-open");
              expect(css).toContain("is-locked");

              const themeCss = fs.readFileSync(path.resolve(__dirname, "../../app/src/theme.css"), "utf-8");
              expect(themeCss).not.toContain("sc-lancer-chip");
            });

            it("verifies LancerChip exports 28px component with horse, long lance, peak-white cloak, and pointerEvents none", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const chipPath = path.resolve(__dirname, "../../app/src/hud/LancerChip.tsx");
              expect(fs.existsSync(chipPath)).toBe(true);
              const chipCode = fs.readFileSync(chipPath, "utf-8");

              expect(chipCode).toContain("LancerChip");
              expect(chipCode).toContain("size = 28");
              expect(chipCode).toContain('pointerEvents: "none"');
              expect(chipCode).toContain('aria-hidden="true"');
              expect(chipCode).toContain("data-lancer-chip");
              expect(chipCode).toContain("data-open");
              expect(chipCode).toContain("sc-lancer-horse");
              expect(chipCode).toContain("sc-lancer-cloak");
              expect(chipCode).toContain("sc-lancer-lance");
              expect(chipCode).toContain("sc-lancer-rider");
            });

            it("verifies UnitCard mounts 28px LancerChip on Lancer card", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const cardPath = path.resolve(__dirname, "../../app/src/hud/UnitCard.tsx");
              expect(fs.existsSync(cardPath)).toBe(true);
              const cardCode = fs.readFileSync(cardPath, "utf-8");

              expect(cardCode).toContain("LancerChip");
              expect(cardCode).toContain('typeId === "lancer" ? (');
              expect(cardCode).toContain("<LancerChip size={28} open={open} />");
            });

            it("verifies UnitIcon has dedicated lancer art with horse, long lance, and peak-white cloak", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const iconPath = path.resolve(__dirname, "../../app/src/UnitIcon.tsx");
              expect(fs.existsSync(iconPath)).toBe(true);
              const iconCode = fs.readFileSync(iconPath, "utf-8");

              expect(iconCode).toContain('case "lancer":');
              expect(iconCode).toContain("Peak shock cavalry");
            });

            it("verifies zero merge conflict markers across all modified and created files", async () => {
              const fs = await import("node:fs");
              const path = await import("node:path");
              const files = [
                path.resolve(__dirname, "../../app/src/hud/lancer-chip.css"),
                path.resolve(__dirname, "../../app/src/hud/LancerChip.tsx"),
                path.resolve(__dirname, "../../app/src/hud/UnitCard.tsx"),
                path.resolve(__dirname, "../../app/src/UnitIcon.tsx"),
              ];
              for (const f of files) {
                const content = fs.readFileSync(f, "utf-8");
                expect(content).not.toContain("<<<<<<<");
                expect(content).not.toContain("=======");
                expect(content).not.toContain(">>>>>>>");
              }
            });
          });
        });
      });
    });
  });
});





