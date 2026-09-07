import { describe, it, expect } from "vitest";
import {
  roleForCitizenJob,
  pickDestination,
  type Walker,
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
  realmTokenPalette,
  culturePalette,
  isNpcHoldProvince,
} from "./index.js";
import type { GameState } from "@second-crown/shared";

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
});

describe("packages/render two-band camera and tabletop board helpers", () => {
  it("determines camera band based on ZOOM_THRESHOLD", () => {
    expect(bandForZoom(1.0)).toBe("hold");
    expect(bandForZoom(0.71)).toBe("hold");
    expect(bandForZoom(ZOOM_THRESHOLD)).toBe("board");
    expect(bandForZoom(0.58)).toBe("board");
    expect(bandForZoom(0.45)).toBe("board");
  });

  it("calculates 8x6 province token bounds within diorama viewport", () => {
    const origin = provinceTokenBounds(0, 0);
    expect(origin.x).toBe(35);
    expect(origin.y).toBe(27);
    expect(origin.w).toBe(56);
    expect(origin.h).toBe(46);
    expect(origin.cx).toBe(35 + 28);
    expect(origin.cy).toBe(27 + 23);

    // Far corner token (column 7, row 5)
    const far = provinceTokenBounds(7, 5);
    expect(far.x + far.w).toBeLessThanOrEqual(544); // within RIM_SIZE=16 to 544
    expect(far.y + far.h).toBeLessThanOrEqual(344); // within RIM_SIZE=16 to 344
  });

  it("hit tests province tokens on the board", () => {
    const b0 = provinceTokenBounds(2, 3);
    const hit = hitTestProvince(b0.cx, b0.cy);
    expect(hit).toEqual({ bx: 2, by: 3 });

    // Click in the gap between tokens
    const miss = hitTestProvince(35 + 56 + 2, 27);
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
  });
});


