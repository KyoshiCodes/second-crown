import { Application, Graphics, Container } from "pixi.js";
import type { GameState } from "@second-crown/shared";
import { getBuildingType, currentSeason } from "@second-crown/sim";

// Grid configuration
const GRID_W = 16;
const GRID_H = 10;
const TILE_W = 40;
const TILE_H = 20;
const HALF_W = TILE_W / 2; // 20
const HALF_H = TILE_H / 2; // 10

// Canvas viewport configuration
const CANVAS_W = 560;
const CANVAS_H = 360;
const ORIGIN_X = 220;
const ORIGIN_Y = 64;
const RIM_SIZE = 16; // Wooden table rim border thickness

export interface MapRenderer {
  sync(state: GameState): void;
  setTheme(themeId: string, holidayId: string): void;
  destroy(): void;
  onTileClick(cb: (x: number, y: number) => void): void;
  zoomIn(): void;
  zoomOut(): void;
  resetView(): void;
}

// Convert grid (gx, gy) to world space center (wx, wy)
function gridToWorld(gx: number, gy: number): { wx: number; wy: number } {
  return {
    wx: ORIGIN_X + (gx - gy) * HALF_W,
    wy: ORIGIN_Y + (gx + gy) * HALF_H,
  };
}

// Convert world space (wx, wy) to grid coordinates (gx, gy)
function worldToGrid(wx: number, wy: number): { gx: number; gy: number } {
  const dx = wx - ORIGIN_X;
  const dy = wy - ORIGIN_Y;
  const gx = Math.floor(dx / TILE_W + dy / TILE_H);
  const gy = Math.floor(dy / TILE_H - dx / TILE_W);
  return { gx, gy };
}

// Pre-defined cobblestone road network: central thoroughfare connecting the hold
const ROAD_TILES = new Set<string>([
  // East-West main street
  "3,4", "4,4", "5,4", "6,4", "7,4", "8,4", "9,4", "10,4", "11,4", "12,4",
  // North-South cross street & market square
  "7,2", "7,3", "7,5", "7,6", "7,7",
  "8,2", "8,3", "8,5", "8,6", "8,7",
  // Town square plaza
  "6,5", "9,5",
]);

interface ThemeVisuals {
  groundA: number;
  groundB: number;
  gridLine: number;
  roadColor: number;
  roadCobble: number;
  cliffColor: number;
  cliffDark: number;
  tintColor: number;
  tintAlpha: number;
  decorations: "none" | "halloween" | "midwinter" | "easter" | "harvest" | "midsummer" | "spring" | "summer" | "autumn" | "winter";
}

function getThemeVisuals(season: string, holiday: string): ThemeVisuals {
  if (holiday === "halloween") {
    return {
      groundA: 0x1c1026,
      groundB: 0x160a20,
      gridLine: 0x2e1740,
      roadColor: 0x291a18,
      roadCobble: 0x3d2720,
      cliffColor: 0x1f142b,
      cliffDark: 0x0f0817,
      tintColor: 0x581c87,
      tintAlpha: 0.2,
      decorations: "halloween",
    };
  }
  if (holiday === "midwinter") {
    return {
      groundA: 0x2b3b4d,
      groundB: 0x223141,
      gridLine: 0x3d5168,
      roadColor: 0x374558,
      roadCobble: 0x4d5f75,
      cliffColor: 0x1e2a38,
      cliffDark: 0x0f1620,
      tintColor: 0x38bdf8,
      tintAlpha: 0.16,
      decorations: "midwinter",
    };
  }
  if (holiday === "easter") {
    return {
      groundA: 0x1e3624,
      groundB: 0x172b1c,
      gridLine: 0x2b4c34,
      roadColor: 0x3a3024,
      roadCobble: 0x4f4232,
      cliffColor: 0x242e20,
      cliffDark: 0x121710,
      tintColor: 0xc084fc,
      tintAlpha: 0.12,
      decorations: "easter",
    };
  }
  if (holiday === "harvest") {
    return {
      groundA: 0x342416,
      groundB: 0x2c1d11,
      gridLine: 0x4c331e,
      roadColor: 0x422d1c,
      roadCobble: 0x5a3e26,
      cliffColor: 0x2c1f14,
      cliffDark: 0x17100a,
      tintColor: 0xf59e0b,
      tintAlpha: 0.16,
      decorations: "harvest",
    };
  }
  if (holiday === "midsummer") {
    return {
      groundA: 0x253618,
      groundB: 0x1e2c13,
      gridLine: 0x394e24,
      roadColor: 0x453826,
      roadCobble: 0x5e4d34,
      cliffColor: 0x282e18,
      cliffDark: 0x14180c,
      tintColor: 0xfde047,
      tintAlpha: 0.14,
      decorations: "midsummer",
    };
  }

  // Standard seasons
  if (season === "Summer") {
    return {
      groundA: 0x2a3818,
      groundB: 0x222d13,
      gridLine: 0x3f5022,
      roadColor: 0x483a24,
      roadCobble: 0x614f32,
      cliffColor: 0x2b2e1a,
      cliffDark: 0x15170d,
      tintColor: 0xfef08a,
      tintAlpha: 0.1,
      decorations: "summer",
    };
  }
  if (season === "Autumn") {
    return {
      groundA: 0x352316,
      groundB: 0x2d1d12,
      gridLine: 0x4e3320,
      roadColor: 0x443022,
      roadCobble: 0x5c422f,
      cliffColor: 0x2e2016,
      cliffDark: 0x17100b,
      tintColor: 0xf97316,
      tintAlpha: 0.12,
      decorations: "autumn",
    };
  }
  if (season === "Winter") {
    return {
      groundA: 0x24303c,
      groundB: 0x1d2732,
      gridLine: 0x364859,
      roadColor: 0x2f3c4a,
      roadCobble: 0x435467,
      cliffColor: 0x1b232c,
      cliffDark: 0x0e1318,
      tintColor: 0xbae6fd,
      tintAlpha: 0.14,
      decorations: "winter",
    };
  }

  // Default: Spring
  return {
    groundA: 0x1e3622,
    groundB: 0x182c1b,
    gridLine: 0x2a4c2f,
    roadColor: 0x362c20,
    roadCobble: 0x4a3d2c,
    cliffColor: 0x222a1e,
    cliffDark: 0x11160f,
    tintColor: 0x86efac,
    tintAlpha: 0.08,
    decorations: "spring",
  };
}

// -------------------------------------------------------------
// Isometric Terrain Painter
// -------------------------------------------------------------
function paintIsometricGround(g: Graphics, visuals: ThemeVisuals): void {
  g.clear();

  // 1. Draw 3D Stone Cliff Foundation along southern perimeter
  const CLIFF_DEPTH = 22;
  for (let x = 0; x < GRID_W; x++) {
    const { wx, wy } = gridToWorld(x, GRID_H - 1);
    const pLeft = { x: wx - HALF_W, y: wy };
    const pBottom = { x: wx, y: wy + HALF_H };
    const pRight = { x: wx + HALF_W, y: wy };

    // South-facing cliff facets
    g.poly([
      pLeft.x, pLeft.y,
      pBottom.x, pBottom.y,
      pBottom.x, pBottom.y + CLIFF_DEPTH,
      pLeft.x, pLeft.y + CLIFF_DEPTH,
    ]);
    g.fill({ color: visuals.cliffColor });

    g.poly([
      pBottom.x, pBottom.y,
      pRight.x, pRight.y,
      pRight.x, pRight.y + CLIFF_DEPTH,
      pBottom.x, pBottom.y + CLIFF_DEPTH,
    ]);
    g.fill({ color: visuals.cliffDark });

    // Stone masonry block lines
    g.moveTo(pLeft.x, pLeft.y + CLIFF_DEPTH * 0.5);
    g.lineTo(pBottom.x, pBottom.y + CLIFF_DEPTH * 0.5);
    g.stroke({ width: 1, color: 0x0a0c0e, alpha: 0.45 });
  }

  // Right-facing cliff wall along right edge (x = 15, y = 0..9)
  for (let y = 0; y < GRID_H; y++) {
    const { wx, wy } = gridToWorld(GRID_W - 1, y);
    const pBottom = { x: wx, y: wy + HALF_H };
    const pRight = { x: wx + HALF_W, y: wy };

    g.poly([
      pBottom.x, pBottom.y,
      pRight.x, pRight.y,
      pRight.x, pRight.y + CLIFF_DEPTH,
      pBottom.x, pBottom.y + CLIFF_DEPTH,
    ]);
    g.fill({ color: visuals.cliffDark });

    g.moveTo(pBottom.x, pBottom.y + CLIFF_DEPTH * 0.5);
    g.lineTo(pRight.x, pRight.y + CLIFF_DEPTH * 0.5);
    g.stroke({ width: 1, color: 0x0a0c0e, alpha: 0.5 });
  }

  // 2. Draw Isometric Diamond Grid Tiles & Cobblestone Paths
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const { wx, wy } = gridToWorld(x, y);
      const isRoad = ROAD_TILES.has(`${x},${y}`);
      const shade = isRoad
        ? ((x + y) % 2 === 0 ? visuals.roadColor : visuals.roadCobble)
        : ((x + y) % 2 === 0 ? visuals.groundA : visuals.groundB);

      // Base diamond tile
      g.poly([
        wx, wy - HALF_H,
        wx + HALF_W, wy,
        wx, wy + HALF_H,
        wx - HALF_W, wy,
      ]);
      g.fill({ color: shade });

      // Subtle diamond grid border
      g.stroke({ width: 1, color: visuals.gridLine, alpha: 0.45 });

      // Cobblestone path details
      if (isRoad) {
        g.rect(wx - 6, wy - 3, 4, 2);
        g.fill({ color: visuals.roadCobble, alpha: 0.7 });
        g.rect(wx + 2, wy - 1, 5, 2);
        g.fill({ color: visuals.roadColor, alpha: 0.8 });
        g.rect(wx - 3, wy + 2, 4, 2);
        g.fill({ color: visuals.roadCobble, alpha: 0.75 });
      } else {
        // Seasonal terrain flourishes
        const hash = (x * 13 + y * 29) % 17;
        if (visuals.decorations === "spring" && hash === 3) {
          g.circle(wx - 3, wy - 2, 1.4);
          g.fill({ color: 0xf472b6, alpha: 0.8 });
        } else if (visuals.decorations === "spring" && hash === 7) {
          g.circle(wx + 4, wy + 1, 1.4);
          g.fill({ color: 0xfacc15, alpha: 0.8 });
        } else if (visuals.decorations === "easter" && hash === 5) {
          g.ellipse(wx, wy, 2.5, 3.2);
          g.fill({ color: 0xd8b4fe, alpha: 0.85 });
          g.circle(wx, wy, 1.2);
          g.fill({ color: 0xfde047, alpha: 0.9 });
        } else if (visuals.decorations === "halloween" && hash === 4) {
          g.ellipse(wx + 2, wy + 1, 3.5, 2.8);
          g.fill({ color: 0xe85d04, alpha: 0.85 });
          g.rect(wx + 2, wy - 2, 1.2, 2);
          g.fill({ color: 0x3f6212, alpha: 0.9 });
        } else if (visuals.decorations === "midwinter" && hash % 3 === 0) {
          g.ellipse(wx, wy + 2, 8, 3);
          g.fill({ color: 0xf1f5f9, alpha: 0.35 });
        } else if (visuals.decorations === "autumn" && hash === 6) {
          g.circle(wx - 2, wy - 1, 1.8);
          g.fill({ color: 0xd97706, alpha: 0.8 });
          g.circle(wx + 3, wy + 2, 1.6);
          g.fill({ color: 0xb91c1c, alpha: 0.75 });
        } else if (visuals.decorations === "harvest" && hash === 2) {
          g.rect(wx - 1, wy - 2, 3, 5);
          g.fill({ color: 0xca8a04, alpha: 0.8 });
        } else if (visuals.decorations === "midsummer" && hash === 8) {
          g.circle(wx, wy, 1.8);
          g.fill({ color: 0xfbbf24, alpha: 0.85 });
        }
      }
    }
  }
}

// -------------------------------------------------------------
// Denser Isometric Pixel Building Painter
// -------------------------------------------------------------
function drawIsometricBuilding(
  g: Graphics,
  typeId: string,
  level: number,
  complete: boolean,
  phase: number,
  visuals: ThemeVisuals
): void {
  const a = complete ? 1.0 : 0.45;
  g.clear();

  // 1. Isometric Ground Footprint Shadow & Base Foundation
  g.poly([
    0, -HALF_H,
    HALF_W - 1, 0,
    0, HALF_H - 1,
    -HALF_W + 1, 0,
  ]);
  g.fill({ color: 0x080c09, alpha: 0.4 });

  // Cast shadow to the southeast
  g.poly([
    -4, 4,
    HALF_W + 6, 2,
    HALF_W + 12, 10,
    2, HALF_H + 4,
  ]);
  g.fill({ color: 0x000000, alpha: 0.28 });

  const lvl = Math.max(1, Math.min(5, level));
  const isWinter = visuals.decorations === "winter" || visuals.decorations === "midwinter";
  const isHalloween = visuals.decorations === "halloween";
  const heightBoost = (lvl - 1) * 3;

  switch (typeId) {
    case "farm": {
      // Denser Thatched Farmhouse + Stone Well + Vegetable Patch + Hayrick
      const h = 18 + heightBoost;

      // Farmhouse Timber Walls (left & right facets)
      g.poly([-16, 0, -2, 7, -2, 7 - h, -16, 0 - h]);
      g.fill({ color: 0x8b5a2b, alpha: a });
      g.poly([-2, 7, 10, 1, 10, 1 - h, -2, 7 - h]);
      g.fill({ color: 0x6e431f, alpha: a });

      // Timber framing exposed cross-beams
      g.moveTo(-16, 0 - h * 0.5); g.lineTo(-2, 7 - h * 0.5);
      g.moveTo(-2, 7 - h * 0.5); g.lineTo(10, 1 - h * 0.5);
      g.stroke({ width: 1, color: 0x4a2c11, alpha: a });

      // Thatched Gable Roof with overhang
      g.poly([
        -18, -h,
        -2, 9 - h - 11,
        12, 1 - h,
        -4, -h - 17,
      ]);
      g.fill({ color: 0xd4a359, alpha: a });
      g.moveTo(-18, -h); g.lineTo(-2, 9 - h - 11); g.lineTo(12, 1 - h);
      g.stroke({ width: 1.2, color: 0xca8a04, alpha: a });

      // Brick Chimney & Animated Smoke
      g.rect(4, -h - 15, 4, 9);
      g.fill({ color: 0x71717a, alpha: a });
      const puff = Math.sin(phase * 2) * 2;
      g.circle(6, -h - 18 + puff, 2.5);
      g.fill({ color: 0xe4e4e7, alpha: 0.45 * a });
      g.circle(8, -h - 22 + puff, 3.2);
      g.fill({ color: 0xf4f4f5, alpha: 0.3 * a });

      // Door & glowing window
      g.rect(-10, 3 - h * 0.45, 4, 6);
      g.fill({ color: 0x3d2410, alpha: a });
      g.rect(2, -h * 0.4, 3.5, 3.5);
      g.fill({ color: 0xfef08a, alpha: a * 0.85 });

      // Outbuilding 1: Stone Well with wooden bucket
      g.ellipse(-11, 4, 3.5, 2.2);
      g.fill({ color: 0x64748b, alpha: a });
      g.moveTo(-11, 4); g.lineTo(-11, -2);
      g.stroke({ width: 1.2, color: 0x78350f, alpha: a });

      // Outbuilding 2: Fenced Vegetable Garden with cabbages & pumpkins
      g.rect(10, 2, 7, 5);
      g.fill({ color: 0x27272a, alpha: a * 0.6 });
      g.circle(12, 4, 1.5); g.fill({ color: 0x22c55e, alpha: a });
      g.circle(15, 3, 1.5); g.fill({ color: 0x16a34a, alpha: a });
      g.circle(13, 6, 1.6); g.fill({ color: 0xea580c, alpha: a });

      // Golden Hayrick in foreground corner
      g.poly([4, 5, 8, 8, 5, 2]);
      g.fill({ color: 0xca8a04, alpha: a });
      break;
    }

    case "lumber_camp": {
      // Denser Log Cabin + Chopping Awning + Stacked Timber Cords + Tall Pines
      const h = 16 + heightBoost;

      // Log Cabin Walls with notched log ends
      g.poly([-14, 0, 0, 7, 0, 7 - h, -14, 0 - h]);
      g.fill({ color: 0x5c3d28, alpha: a });
      g.poly([0, 7, 12, 1, 12, 1 - h, 0, 7 - h]);
      g.fill({ color: 0x472d1c, alpha: a });

      // Log Plank Roof
      g.poly([-16, -h, 0, 8 - h - 9, 14, 1 - h, 0, -h - 13]);
      g.fill({ color: 0x382214, alpha: a });

      // Tall Pine Trees on rear flank
      g.poly([-14, 0, -9, -24, -4, 0]);
      g.fill({ color: 0x14532d, alpha: a });
      g.poly([-13, -10, -9, -30, -5, -10]);
      g.fill({ color: 0x166534, alpha: a });

      // Woodcutter's Open Shelter & Chopping Block with Steel Axe
      g.moveTo(3, 4); g.lineTo(3, -4);
      g.moveTo(11, 0); g.lineTo(11, -7);
      g.stroke({ width: 1.2, color: 0x78350f, alpha: a });
      g.poly([1, -4, 13, -7, 11, -11, 0, -8]);
      g.fill({ color: 0x451a03, alpha: a });

      g.rect(5, 4, 5, 3.5);
      g.fill({ color: 0x854d0e, alpha: a });
      g.rect(7, 2, 1.8, 3.5);
      g.fill({ color: 0xd1d5db, alpha: a }); // Steel axe

      // Stacked Firewood Cords on pallet
      g.rect(-6, 4, 8, 4);
      g.fill({ color: 0x78350f, alpha: a });
      g.moveTo(-6, 6); g.lineTo(2, 6);
      g.stroke({ width: 1, color: 0x3f1d0b, alpha: a });
      break;
    }

    case "quarry": {
      // Denser Granite Quarry Pit + A-Frame Crane + Stone Blocks + Wheelbarrow
      g.poly([-16, 0, 0, 8, 16, 0, 0, -8]);
      g.fill({ color: 0x27272a, alpha: a });

      // Terraced granite quarry shelf
      g.poly([-12, 1, 0, 7, 0, 1, -12, -5]);
      g.fill({ color: 0x71717a, alpha: a });
      g.poly([0, 7, 12, 1, 12, -5, 0, 1]);
      g.fill({ color: 0x52525b, alpha: a });

      // Wooden A-Frame Crane with cable & hoisted block
      g.moveTo(-4, 0); g.lineTo(-4, -22); g.lineTo(8, -14);
      g.stroke({ width: 2.2, color: 0x78350f, alpha: a });
      g.moveTo(-4, -22); g.lineTo(2, 2);
      g.stroke({ width: 1.5, color: 0x5c2b09, alpha: a });
      g.moveTo(8, -14); g.lineTo(8, -5);
      g.stroke({ width: 0.8, color: 0xd1d5db, alpha: a }); // Hoist line
      g.rect(6, -5, 4.5, 4);
      g.fill({ color: 0xa1a1aa, alpha: a }); // Hoisted granite block

      // Stack of cut ashlar blocks
      g.rect(-10, 3, 5, 4); g.fill({ color: 0x94a3b8, alpha: a });
      g.rect(-8, 0, 5, 3.5); g.fill({ color: 0x64748b, alpha: a });

      // Wooden wheelbarrow
      g.rect(9, 4, 4.5, 3); g.fill({ color: 0x854d0e, alpha: a });
      g.circle(8, 6, 1.5); g.fill({ color: 0x18181b, alpha: a });
      break;
    }

    case "mason": {
      // Denser Stonecutter Atelier + Sculpted Pillars + Urns + Chisel Bench
      const h = 20 + heightBoost;

      // Masonry walls with stone blocks
      g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
      g.fill({ color: 0x94a3b8, alpha: a });
      g.poly([0, 8, 14, 1, 14, 1 - h, 0, 8 - h]);
      g.fill({ color: 0x64748b, alpha: a });

      // Arched workshop door
      g.poly([-8, 4, -2, 7, -2, -h * 0.4, -8, -h * 0.4 - 3]);
      g.fill({ color: 0x1e293b, alpha: a });

      // Slate Gable Roof with carved gargoyle finial
      g.poly([-18, -h, 0, 9 - h - 11, 16, 1 - h, 0, -h - 15]);
      g.fill({ color: 0x334155, alpha: a });
      g.circle(0, -h - 16, 2.5); g.fill({ color: 0xcbd5e1, alpha: a });

      // Displayed carved column & marble urn
      g.rect(-13, 2, 3.5, 7); g.fill({ color: 0xf8fafc, alpha: a });
      g.ellipse(8, 4, 2.5, 3.5); g.fill({ color: 0xe2e8f0, alpha: a });
      break;
    }

    case "gold_mine": {
      // Denser Gold Mine Shaft + Timber Portal + Tracks + Gold Cart + Sluice
      // Rocky crag with glittering gold veins
      g.poly([-17, 3, -10, -20, 8, -22, 17, 1, 0, 9]);
      g.fill({ color: 0x475569, alpha: a });
      g.circle(-4, -14, 1.8); g.fill({ color: 0xfacc15, alpha: a });
      g.circle(4, -10, 1.5); g.fill({ color: 0xfacc15, alpha: a });

      // Timber mine shaft entrance
      g.poly([-9, 4, 1, 9, 1, -7, -9, -12]);
      g.fill({ color: 0x09090b, alpha: a });
      g.moveTo(-9, 4); g.lineTo(-9, -12); g.lineTo(1, -7); g.lineTo(1, 9);
      g.stroke({ width: 2.5, color: 0x78350f, alpha: a });

      // Mine tracks & ore cart full of gold
      g.moveTo(-1, 8); g.lineTo(11, 3);
      g.stroke({ width: 1.5, color: 0x94a3b8, alpha: a });
      g.rect(6, 2, 8, 5.5);
      g.fill({ color: 0x3f3f46, alpha: a });
      g.circle(10, 3, 2.5); g.fill({ color: 0xfacc15, alpha: a });
      g.circle(7, 2, 2); g.fill({ color: 0xfde047, alpha: a });

      // Sluice wash trough
      g.rect(-14, 3, 4, 7);
      g.fill({ color: 0x854d0e, alpha: a });
      g.rect(-13, 4, 2, 5);
      g.fill({ color: 0x38bdf8, alpha: a * 0.85 });
      break;
    }

    case "mint": {
      // Denser Royal Treasury Vault + Coin Press + Bullion Stacks
      const h = 22 + heightBoost;
      g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
      g.fill({ color: 0x64748b, alpha: a });
      g.poly([0, 8, 14, 1, 14, 1 - h, 0, 8 - h]);
      g.fill({ color: 0x475569, alpha: a });

      // Gilded Vaulted Roof with Royal Crown Medallion
      g.poly([-18, -h, 0, 9 - h - 10, 16, 1 - h, 0, -h - 16]);
      g.fill({ color: 0x854d0e, alpha: a });
      g.circle(0, -h * 0.45, 4); g.fill({ color: 0xfacc15, alpha: a });

      // Double iron-studded security doors
      g.rect(-10, 3 - h * 0.4, 6, 7);
      g.fill({ color: 0x1e293b, alpha: a });
      g.rect(-9, 4 - h * 0.4, 1.5, 1.5); g.fill({ color: 0xd4a359, alpha: a });

      // Turning Flywheel Coin Press on right platform
      g.circle(8, 2, 4);
      g.stroke({ width: 1.5, color: 0xd97706, alpha: a });
      // Shimmering Gold Coin Stacks
      g.rect(6, 6, 3, 3); g.fill({ color: 0xfacc15, alpha: a });
      g.rect(10, 5, 3, 4); g.fill({ color: 0xfef08a, alpha: a });
      break;
    }

    case "granary": {
      // Denser Twin Grain Silos + Central Hoist Gantry + Flour Sacks
      const h = 24 + heightBoost;

      // Silo 1 (Left Tower)
      g.rect(-14, -h + 8, 9, h);
      g.fill({ color: 0xd4b36a, alpha: a });
      g.poly([-16, -h + 8, -9.5, -h - 10, -3, -h + 8]);
      g.fill({ color: 0x991b1b, alpha: a });

      // Silo 2 (Right Tower)
      g.rect(2, -h + 8, 9, h);
      g.fill({ color: 0xb59247, alpha: a });
      g.poly([0, -h + 8, 6.5, -h - 10, 13, -h + 8]);
      g.fill({ color: 0x7f1d1d, alpha: a });

      // Connecting timber gantry & pulley hoist
      g.rect(-5, -h + 10, 8, 3);
      g.fill({ color: 0x78350f, alpha: a });
      g.moveTo(-1, -h + 10); g.lineTo(-1, -h + 20);
      g.stroke({ width: 1, color: 0xd1d5db, alpha: a });
      g.circle(-1, -h + 20, 2.5); g.fill({ color: 0xfef08a, alpha: a }); // Grain sack

      // Grain barrels & flour sacks on ground
      g.rect(-6, 3, 4.5, 4); g.fill({ color: 0x78350f, alpha: a });
      g.circle(1, 4, 2.2); g.fill({ color: 0xfef08a, alpha: a });
      break;
    }

    case "sawmill": {
      // Denser River Mill + Oversized Spinning Waterwheel + Log Carriage Track
      const h = 18 + heightBoost;
      g.poly([-15, 0, -1, 7, -1, 7 - h, -15, 0 - h]);
      g.fill({ color: 0x78350f, alpha: a });
      g.poly([-1, 7, 11, 1, 11, 1 - h, -1, 7 - h]);
      g.fill({ color: 0x5b2609, alpha: a });

      // Cedar Shingle Roof
      g.poly([-17, -h, -1, 8 - h - 9, 13, 1 - h, -1, -h - 13]);
      g.fill({ color: 0x451a03, alpha: a });

      // Spinning Waterwheel with paddle blades & spray
      const spin = phase * 4;
      g.circle(14, 1, 7);
      g.fill({ color: 0x854d0e, alpha: a });
      g.moveTo(14, 1);
      g.lineTo(14 + Math.cos(spin) * 6, 1 + Math.sin(spin) * 6);
      g.stroke({ width: 1.8, color: 0x451a03, alpha: a });
      // Water churn foam
      g.circle(14, 8, 2.2);
      g.fill({ color: 0xe0f2fe, alpha: a * 0.8 });

      // Log carriage & spinning circular saw blade
      g.rect(-10, 4, 7, 3); g.fill({ color: 0x5c3d28, alpha: a }); // Tree log
      g.circle(-3, 4, 3); g.fill({ color: 0xcbd5e1, alpha: a }); // Circular blade
      break;
    }

    case "market": {
      // Denser 3-Canopy Striped Grand Bazaar + Crates + Hanging Sign
      const h = 18 + heightBoost;

      // Center Canopy: Crimson & White
      g.poly([-10, -2, 2, 4, 2, 4 - h, -10, -2 - h]);
      g.fill({ color: 0xdc2626, alpha: a });
      g.poly([2, 4, 12, -1, 12, -1 - h, 2, 4 - h]);
      g.fill({ color: 0xf8fafc, alpha: a });
      g.poly([-12, -h, 2, 6 - h - 10, 14, -1 - h, 0, -h - 14]);
      g.fill({ color: 0xef4444, alpha: a });

      // Left Canopy: Gold Striped
      g.poly([-18, 0, -10, 4, -10, 4 - (h - 3), -18, 0 - (h - 3)]);
      g.fill({ color: 0xf59e0b, alpha: a });

      // Fruit crates & market stalls
      g.rect(-8, 3, 5, 4); g.fill({ color: 0x854d0e, alpha: a });
      g.circle(-6, 3, 1.8); g.fill({ color: 0x22c55e, alpha: a }); // Melons
      g.rect(4, 3, 5, 4); g.fill({ color: 0x854d0e, alpha: a });
      g.circle(6, 3, 1.8); g.fill({ color: 0xef4444, alpha: a }); // Apples
      g.rect(10, 1, 4, 4); g.fill({ color: 0xca8a04, alpha: a }); // Spices
      break;
    }

    case "barracks": {
      // Denser Garrison Keep + Crenellated Battlements + Fluttering Banner + Training Yard
      const h = 24 + heightBoost;
      g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
      g.fill({ color: 0x64748b, alpha: a });
      g.poly([0, 8, 16, 0, 16, 0 - h, 0, 8 - h]);
      g.fill({ color: 0x475569, alpha: a });

      // Parapet Crenellations
      g.rect(-16, -h - 4, 5, 4); g.fill({ color: 0x64748b, alpha: a });
      g.rect(-7, -h - 4, 5, 4); g.fill({ color: 0x64748b, alpha: a });
      g.rect(3, -h - 4, 5, 4); g.fill({ color: 0x475569, alpha: a });
      g.rect(11, -h - 4, 5, 4); g.fill({ color: 0x475569, alpha: a });

      // Iron Portcullis
      g.rect(-4, 3, 8, 6.5);
      g.fill({ color: 0x1e293b, alpha: a });

      // Fluttering Red War Banner
      const wave = Math.sin(phase * 3.5) * 2.5;
      g.moveTo(0, -h - 3); g.lineTo(0, -h - 18);
      g.stroke({ width: 1.5, color: 0xd4a359, alpha: a });
      g.poly([0, -h - 18, 9 + wave, -h - 13, 0, -h - 9]);
      g.fill({ color: 0xdc2626, alpha: a });

      // Training Dummy & Weapon Rack on yard
      g.moveTo(11, 4); g.lineTo(11, -2);
      g.stroke({ width: 1.5, color: 0x854d0e, alpha: a });
      g.circle(11, -2, 2.2); g.fill({ color: 0xfef08a, alpha: a }); // Dummy head
      g.rect(-14, 4, 4, 3.5); g.fill({ color: 0x3f3f46, alpha: a }); // Armor chest
      break;
    }

    case "stables": {
      // Denser Equestrian Barn + Open Stalls + Hayloft Hoist + Water Trough
      const h = 20 + heightBoost;
      g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
      g.fill({ color: 0x78350f, alpha: a });
      g.poly([0, 8, 14, 1, 14, 1 - h, 0, 8 - h]);
      g.fill({ color: 0x5b2609, alpha: a });

      // Gabled Roof with Hayloft Dormer
      g.poly([-18, -h, 0, 9 - h - 11, 16, 1 - h, 0, -h - 15]);
      g.fill({ color: 0x451a03, alpha: a });

      // Stalls & Straw Bedding
      g.rect(-10, 3, 5, 5); g.fill({ color: 0x1c1917, alpha: a });
      g.rect(4, 2, 5, 5); g.fill({ color: 0x1c1917, alpha: a });
      g.rect(4, 6, 5, 2.5); g.fill({ color: 0xfef08a, alpha: a }); // Straw

      // Water Trough on front courtyard
      g.rect(-8, 6, 6, 3); g.fill({ color: 0x52525b, alpha: a });
      g.rect(-7, 7, 4, 1.5); g.fill({ color: 0x38bdf8, alpha: a });
      break;
    }

    case "archery_range": {
      // Denser Covered Pavilion + Straw Roundel Targets with Arrows
      g.poly([-14, 0, 0, 7, 14, 0, 0, -7]);
      g.fill({ color: 0x15803d, alpha: a });

      // Archer's Striped Blue Pavilion
      g.poly([-16, -4, -7, 1, -7, -14, -16, -19]);
      g.fill({ color: 0x1e3a8a, alpha: a });
      g.poly([-16, -19, -7, -14, -4, -22, -13, -26]);
      g.fill({ color: 0x3b82f6, alpha: a });

      // Target Butt 1 (Round straw roundel with bullseye)
      g.circle(8, -6, 5.5); g.fill({ color: 0xfef08a, alpha: a });
      g.circle(8, -6, 3.5); g.fill({ color: 0xef4444, alpha: a });
      g.circle(8, -6, 1.5); g.fill({ color: 0xfacc15, alpha: a });
      // Stuck Arrow
      g.moveTo(8, -6); g.lineTo(13, -10);
      g.stroke({ width: 1, color: 0x18181b, alpha: a });

      // Target Butt 2 (Foreground)
      g.circle(3, 2, 4); g.fill({ color: 0xfef08a, alpha: a });
      g.circle(3, 2, 2.5); g.fill({ color: 0xef4444, alpha: a });
      break;
    }

    case "siege_workshop": {
      // Denser Engineering Yard + Rigged Catapult + Boulder Pyramid + Blueprints
      const h = 18 + heightBoost;
      g.poly([-14, 0, 0, 7, 0, 7 - h, -14, 0 - h]);
      g.fill({ color: 0x57534e, alpha: a });
      g.poly([0, 7, 14, 0, 14, 0 - h, 0, 7 - h]);
      g.fill({ color: 0x44403c, alpha: a });

      // Heavy Wooden Catapult / Trebuchet
      g.moveTo(-6, 3); g.lineTo(6, -16);
      g.stroke({ width: 3.2, color: 0x78350f, alpha: a });
      g.circle(-6, 5, 3.5); g.fill({ color: 0x292524, alpha: a }); // Spoked wheel
      g.circle(5, 3, 3.5); g.fill({ color: 0x292524, alpha: a }); // Spoked wheel
      g.rect(-9, -2, 5, 4); g.fill({ color: 0x1c1917, alpha: a }); // Counterweight box

      // Projectile Boulder Pyramid
      g.circle(9, 4, 2.2); g.fill({ color: 0xa8a29e, alpha: a });
      g.circle(12, 2, 2.2); g.fill({ color: 0x78716c, alpha: a });
      g.circle(10.5, 1, 2); g.fill({ color: 0x94a3b8, alpha: a });
      break;
    }

    case "watchtower": {
      // Denser Soaring Stone Lookout + Overhanging Hoarding + Beacon Brazier
      const h = 34 + heightBoost;
      g.poly([-9, 0, 0, 4.5, 0, 4.5 - h, -9, 0 - h]);
      g.fill({ color: 0x94a3b8, alpha: a });
      g.poly([0, 4.5, 9, 0, 9, 0 - h, 0, 4.5 - h]);
      g.fill({ color: 0x64748b, alpha: a });

      // Arrow slits along shaft
      g.rect(-4, -h * 0.4, 1.5, 4); g.fill({ color: 0x0f172a, alpha: a });
      g.rect(3, -h * 0.6, 1.5, 4); g.fill({ color: 0x0f172a, alpha: a });

      // Timber Hoarding Overhang
      g.poly([-12, -h + 3, 0, 7 - h, 12, -h + 3, 0, -h - 5]);
      g.fill({ color: 0x854d0e, alpha: a });

      // Conical Slate Roof & Iron Brazier with Fire
      g.poly([-11, -h, 0, -h - 16, 11, -h]);
      g.fill({ color: 0x713f12, alpha: a });
      const flame = Math.sin(phase * 6) * 1.5;
      g.circle(0, -h - 18, 2.5 + flame * 0.3);
      g.fill({ color: 0xf97316, alpha: a });

      // Royal Pennant
      const flap = Math.sin(phase * 4) * 3;
      g.moveTo(0, -h - 16); g.lineTo(0, -h - 25);
      g.stroke({ width: 1.5, color: 0xd4a359, alpha: a });
      g.poly([0, -h - 25, 9 + flap, -h - 21, 0, -h - 17]);
      g.fill({ color: 0xfacc15, alpha: a });
      break;
    }

    case "chapel": {
      // Denser Gothic Cathedral Sanctuary + Rose Window + Bell Spire + Cloister Garden
      const h = 26 + heightBoost;
      g.poly([-15, 0, 0, 7.5, 0, 7.5 - h, -15, 0 - h]);
      g.fill({ color: 0xc4b5fd, alpha: a });
      g.poly([0, 7.5, 15, 0, 15, 0 - h, 0, 7.5 - h]);
      g.fill({ color: 0xa78bfa, alpha: a });

      // Steep Purple Slate Roof
      g.poly([-17, -h, 0, 9 - h - 13, 17, 0 - h, 0, -h - 19]);
      g.fill({ color: 0x6b21a8, alpha: a });

      // Stained Glass Rose Window
      g.circle(0, 2 - h * 0.45, 4); g.fill({ color: 0xf43f5e, alpha: a });
      g.circle(0, 2 - h * 0.45, 2.2); g.fill({ color: 0x60a5fa, alpha: a });
      g.circle(0, 2 - h * 0.45, 1); g.fill({ color: 0xfacc15, alpha: a });

      // Soaring Golden Cross Finial
      g.rect(-1, -h - 26, 2, 9); g.fill({ color: 0xfacc15, alpha: a });
      g.rect(-3.5, -h - 23, 7, 2); g.fill({ color: 0xfacc15, alpha: a });

      // Cloister Garden with Stone Headstone
      g.rect(-12, 4, 3, 4); g.fill({ color: 0x94a3b8, alpha: a });
      g.circle(11, 4, 1.8); g.fill({ color: 0xec4899, alpha: a });
      break;
    }

    case "walls": {
      // Denser Fortress Curtain Wall + Projecting Bastion + Wall Torches
      const h = 20 + heightBoost;
      g.poly([-18, 0, 0, 9, 0, 9 - h, -18, 0 - h]);
      g.fill({ color: 0x64748b, alpha: a });
      g.poly([0, 9, 18, 0, 18, 0 - h, 0, 9 - h]);
      g.fill({ color: 0x475569, alpha: a });

      // Parapet battlements
      for (let i = -16; i <= 14; i += 6) {
        g.rect(i, -h - 3, 3.5, 3.5);
        g.fill({ color: 0x94a3b8, alpha: a });
      }

      // Wall-walk timber hoarding
      g.moveTo(-16, -h + 2); g.lineTo(16, -h + 2);
      g.stroke({ width: 1.5, color: 0x78350f, alpha: a });
      break;
    }

    default: {
      // Grand Half-timbered Civic Hold
      const h = 20 + heightBoost;
      const bColor = getBuildingType(typeId)?.color ?? 0x3b82f6;
      g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
      g.fill({ color: bColor, alpha: a });
      g.poly([0, 8, 14, 1, 14, 1 - h, 0, 8 - h]);
      g.fill({ color: 0x1e293b, alpha: a });
      g.poly([-18, -h, 0, 9 - h - 10, 16, 1 - h, 0, -h - 14]);
      g.fill({ color: 0x854d0e, alpha: a });
      break;
    }
  }

  // Seasonal Rooftop Snow Capping
  if (isWinter && complete) {
    const h = 18 + heightBoost;
    g.moveTo(-16, -h + 2);
    g.lineTo(0, -h - 10);
    g.lineTo(16, -h + 2);
    g.stroke({ width: 2.8, color: 0xf8fafc, alpha: 0.92 });
  }

  // All Hallows Jack-o'-Lanterns & Flickering Lanterns
  if (isHalloween && complete) {
    // Carved Jack-o'-Lantern on doorstep
    g.ellipse(8, 4, 3.8, 3);
    g.fill({ color: 0xe85d04, alpha: 0.95 });
    g.rect(8, 1, 1.2, 1.8); g.fill({ color: 0x3f6212 }); // Stem

    // Flickering witchfire eyes & jagged grin
    const flicker = 0.72 + Math.sin(phase * 8.5) * 0.16 + Math.sin(phase * 14.3) * 0.12;
    g.rect(6.8, 3, 1, 1.2); g.fill({ color: 0xfef08a, alpha: flicker });
    g.rect(9.2, 3, 1, 1.2); g.fill({ color: 0xfef08a, alpha: flicker });
    g.rect(7.2, 4.8, 2.6, 1.2); g.fill({ color: 0xfef08a, alpha: flicker });

    // Witchfire ground light cast halo
    g.ellipse(8, 6, 14, 6);
    g.fill({ color: 0xf97316, alpha: 0.18 * flicker });
  }

  // Under-construction scaffolding overlay
  if (!complete) {
    g.stroke({ width: 1.5, color: 0xfbbf24, alpha: 0.7 });
    g.moveTo(-14, 4); g.lineTo(-14, -22);
    g.moveTo(12, 4); g.lineTo(12, -22);
    g.stroke({ width: 2, color: 0x854d0e, alpha: 0.85 });
  }

  // Level Pips (Visual upgrade indicator)
  for (let i = 0; i < lvl; i++) {
    const px = -8 + i * 4.5;
    g.rect(px, HALF_H - 4, 3, 2.5);
    g.fill({ color: 0xfef08a, alpha: 0.9 });
    g.stroke({ width: 0.5, color: 0x78350f, alpha: 0.8 });
  }
}

// -------------------------------------------------------------
// Living Hold 2-3 Frame Walkers (Discrete Animation Cadence)
// -------------------------------------------------------------
interface Walker {
  id: number;
  role: "villager" | "woodcutter" | "miner" | "merchant" | "guard" | "scholar";
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: "walking" | "idle";
  idleTime: number;
  speed: number;
  facing: number; // -1 for left, 1 for right
  walkDist: number;
  idlePhase: number;
  graphics: Graphics;
}

function createWalker(id: number, gx: number, gy: number): Walker {
  const roles: Walker["role"][] = ["villager", "woodcutter", "miner", "merchant", "guard", "scholar"];
  const role = roles[id % roles.length];
  const g = new Graphics();
  return {
    id,
    role,
    x: gx + (Math.random() * 0.4 - 0.2),
    y: gy + (Math.random() * 0.4 - 0.2),
    targetX: gx,
    targetY: gy,
    state: "idle",
    idleTime: 1.5 + Math.random() * 3,
    speed: 0.65 + Math.random() * 0.35,
    facing: Math.random() > 0.5 ? 1 : -1,
    walkDist: 0,
    idlePhase: Math.random() * 10,
    graphics: g,
  };
}

/**
 * Renders an authentic 2-3 frame pixel walker sprite.
 * Frame 0: Planted / Neutral (legs together, tool at side, bob 0)
 * Frame 1: Left Step (left leg forward, right leg back, bob 1px)
 * Frame 2: Right Step (right leg forward, left leg back, bob 1px)
 */
function drawWalkerFrame(g: Graphics, role: Walker["role"], facing: number, frame: 0 | 1 | 2): void {
  g.clear();

  // Ground contact shadow
  g.ellipse(0, 1, 4.5, 2.2);
  g.fill({ color: 0x000000, alpha: 0.28 });

  // Integer pixel offsets for authentic 2-3 frame animation
  const bob = frame === 0 ? 0 : 1;
  const legL = frame === 1 ? -2 : (frame === 2 ? 1 : -1);
  const legR = frame === 1 ? 1 : (frame === 2 ? -2 : 1);

  // Boots / legs
  g.rect(legL, -3 - bob, 2, 4);
  g.fill({ color: 0x27272a });
  g.rect(legR, -3 - bob, 2, 4);
  g.fill({ color: 0x18181b });

  // Tunic & clothing colors by role
  let tunicColor = 0x854d0e;
  let toolColor: number | null = null;
  if (role === "villager") tunicColor = 0xb45309;
  else if (role === "woodcutter") { tunicColor = 0x15803d; toolColor = 0xd1d5db; }
  else if (role === "miner") { tunicColor = 0x52525b; toolColor = 0x71717a; }
  else if (role === "merchant") tunicColor = 0xb91c1c;
  else if (role === "guard") tunicColor = 0x1e3a8a;
  else if (role === "scholar") tunicColor = 0x6b21a8;

  // Torso / Tunic
  g.rect(-3, -8 - bob, 6, 6);
  g.fill({ color: tunicColor });

  // Head
  g.circle(0, -11 - bob, 2.8);
  g.fill({ color: 0xfbcfe8 }); // Skin tone

  // Headwear / Hair
  if (role === "guard") {
    g.rect(-3, -14 - bob, 6, 3);
    g.fill({ color: 0x94a3b8 }); // Steel helmet
  } else if (role === "scholar") {
    g.rect(-3, -13 - bob, 6, 2.5);
    g.fill({ color: 0x581c87 }); // Monk cowl
  } else {
    g.rect(-2.5, -13 - bob, 5, 2);
    g.fill({ color: 0x451a03 }); // Hair
  }

  // Carried Tools / Weapons with 2-3 frame arm motion
  const armSwing = frame === 1 ? -1 : (frame === 2 ? 1 : 0);
  if (toolColor) {
    // Woodsman axe / miner pickaxe
    g.rect(facing * 3, -9 - bob + armSwing, 1.5, 6);
    g.fill({ color: 0x78350f });
    g.rect(facing * 3 - 1, -10 - bob + armSwing, 3.5, 2);
    g.fill({ color: toolColor });
  } else if (role === "guard") {
    // Spear with waving pennant
    g.moveTo(facing * 3, 0 - bob); g.lineTo(facing * 3, -17 - bob + armSwing);
    g.stroke({ width: 1.2, color: 0xd4a359 });
    g.poly([
      facing * 3, -17 - bob + armSwing,
      facing * 3 + facing * 4, -15 - bob + armSwing,
      facing * 3, -13 - bob + armSwing,
    ]);
    g.fill({ color: 0xdc2626 });
  } else if (role === "villager") {
    // Wicker bread basket
    g.rect(facing * 3 - 1, -7 - bob + armSwing, 3, 3);
    g.fill({ color: 0xd4a359 });
  } else if (role === "scholar") {
    // Parchment scroll
    g.rect(facing * 2.5, -7 - bob + armSwing, 2, 4);
    g.fill({ color: 0xfef3c7 });
  }
}

// -------------------------------------------------------------
// Hardwood Table Rim & Board Border Painter
// -------------------------------------------------------------
function paintTableRim(g: Graphics): void {
  g.clear();

  // 1. Polished Hardwood Frame Bars (Top, Bottom, Left, Right)
  // Top Rim
  g.rect(0, 0, CANVAS_W, RIM_SIZE);
  g.fill({ color: 0x4a2a14 });
  g.rect(0, 0, CANVAS_W, 2);
  g.fill({ color: 0x754826 }); // Top bevel highlight
  g.rect(0, RIM_SIZE - 2, CANVAS_W, 2);
  g.fill({ color: 0x241208 }); // Inner shadow

  // Bottom Rim
  g.rect(0, CANVAS_H - RIM_SIZE, CANVAS_W, RIM_SIZE);
  g.fill({ color: 0x361d0d });
  g.rect(0, CANVAS_H - 2, CANVAS_W, 2);
  g.fill({ color: 0x1a0c05 }); // Bottom bevel shadow
  g.rect(0, CANVAS_H - RIM_SIZE, CANVAS_W, 2);
  g.fill({ color: 0x5c351b }); // Inner highlight

  // Left Rim
  g.rect(0, 0, RIM_SIZE, CANVAS_H);
  g.fill({ color: 0x412411 });
  g.rect(0, 0, 2, CANVAS_H);
  g.fill({ color: 0x6e3f1e }); // Left bevel highlight
  g.rect(RIM_SIZE - 2, 0, 2, CANVAS_H);
  g.fill({ color: 0x201007 }); // Inner shadow

  // Right Rim
  g.rect(CANVAS_W - RIM_SIZE, 0, RIM_SIZE, CANVAS_H);
  g.fill({ color: 0x2c160a });
  g.rect(CANVAS_W - 2, 0, 2, CANVAS_H);
  g.fill({ color: 0x180a04 }); // Right bevel shadow
  g.rect(CANVAS_W - RIM_SIZE, 0, 2, CANVAS_H);
  g.fill({ color: 0x4f2a12 }); // Inner highlight

  // 2. Miter Joints at the 4 Corners
  g.moveTo(0, 0); g.lineTo(RIM_SIZE, RIM_SIZE);
  g.stroke({ width: 1, color: 0x1f0d05, alpha: 0.8 });
  g.moveTo(CANVAS_W, 0); g.lineTo(CANVAS_W - RIM_SIZE, RIM_SIZE);
  g.stroke({ width: 1, color: 0x1f0d05, alpha: 0.8 });
  g.moveTo(0, CANVAS_H); g.lineTo(RIM_SIZE, CANVAS_H - RIM_SIZE);
  g.stroke({ width: 1, color: 0x1f0d05, alpha: 0.8 });
  g.moveTo(CANVAS_W, CANVAS_H); g.lineTo(CANVAS_W - RIM_SIZE, CANVAS_H - RIM_SIZE);
  g.stroke({ width: 1, color: 0x1f0d05, alpha: 0.8 });

  // 3. Antique Brass Corner Brackets with Rivets
  const drawCornerBracket = (cx: number, cy: number, flipX: number, flipY: number) => {
    const size = 26;
    const thick = 7;
    // L-shaped brass plate
    g.poly([
      cx, cy,
      cx + flipX * size, cy,
      cx + flipX * size, cy + flipY * thick,
      cx + flipX * thick, cy + flipY * thick,
      cx + flipX * thick, cy + flipY * size,
      cx, cy + flipY * size,
    ]);
    g.fill({ color: 0xc8963e });
    g.stroke({ width: 1, color: 0x78531e });

    // Highlight inner bevel
    g.moveTo(cx + flipX * thick, cy + flipY * thick);
    g.lineTo(cx + flipX * size, cy + flipY * thick);
    g.stroke({ width: 1, color: 0xfef08a, alpha: 0.6 });

    // 3 Brass Rivets / Studs
    const rivets = [
      { rx: cx + flipX * 18, ry: cy + flipY * 3.5 },
      { rx: cx + flipX * 3.5, ry: cy + flipY * 18 },
      { rx: cx + flipX * 4.5, ry: cy + flipY * 4.5 },
    ];
    for (const r of rivets) {
      g.circle(r.rx, r.ry, 1.8);
      g.fill({ color: 0xfacc15 });
      g.stroke({ width: 0.6, color: 0x543810 });
    }
  };

  drawCornerBracket(0, 0, 1, 1);
  drawCornerBracket(CANVAS_W, 0, -1, 1);
  drawCornerBracket(0, CANVAS_H, 1, -1);
  drawCornerBracket(CANVAS_W, CANVAS_H, -1, -1);

  // 4. Inner Recessed Drop Shadow onto Playable Diorama
  // Top shadow
  g.rect(RIM_SIZE, RIM_SIZE, CANVAS_W - 2 * RIM_SIZE, 6);
  g.fill({ color: 0x000000, alpha: 0.35 });
  // Left shadow
  g.rect(RIM_SIZE, RIM_SIZE, 6, CANVAS_H - 2 * RIM_SIZE);
  g.fill({ color: 0x000000, alpha: 0.35 });
  // Bottom / Right softer shadow
  g.rect(RIM_SIZE, CANVAS_H - RIM_SIZE - 4, CANVAS_W - 2 * RIM_SIZE, 4);
  g.fill({ color: 0x000000, alpha: 0.2 });
  g.rect(CANVAS_W - RIM_SIZE - 4, RIM_SIZE, 4, CANVAS_H - 2 * RIM_SIZE);
  g.fill({ color: 0x000000, alpha: 0.2 });
}

// -------------------------------------------------------------
// Main Map Renderer Factory (Zoom & Pan, Tabletop Board, Walkers)
// -------------------------------------------------------------
export async function createMapRenderer(canvas: HTMLCanvasElement): Promise<MapRenderer> {
  const app = new Application();
  await app.init({
    canvas,
    width: CANVAS_W,
    height: CANVAS_H,
    backgroundColor: 0x0a0c10,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  // Root containers
  // 1. worldContainer: scales with zoom and translates with pan
  const worldContainer = new Container();
  app.stage.addChild(worldContainer);

  // 2. Viewport mask: cleanly clips the diorama inside the wooden tabletop rim
  const boardMask = new Graphics();
  boardMask.rect(RIM_SIZE, RIM_SIZE, CANVAS_W - 2 * RIM_SIZE, CANVAS_H - 2 * RIM_SIZE);
  boardMask.fill({ color: 0xffffff });
  app.stage.addChild(boardMask);
  worldContainer.mask = boardMask;

  // World layers inside worldContainer
  const groundLayer = new Graphics();
  worldContainer.addChild(groundLayer);

  // Depth-sorted entities container (buildings + walkers)
  const entitiesLayer = new Container();
  entitiesLayer.sortableChildren = true;
  worldContainer.addChild(entitiesLayer);

  // All Hallows drifting mist/fog layer
  const fogLayer = new Graphics();
  worldContainer.addChild(fogLayer);

  // Ambient lighting overlay
  const ambientOverlay = new Graphics();
  worldContainer.addChild(ambientOverlay);

  // Floating atmospheric seasonal particles layer
  const particlesGraphic = new Graphics();
  worldContainer.addChild(particlesGraphic);

  // Tile hover diamond
  const hoverGraphic = new Graphics();
  hoverGraphic.poly([
    0, -HALF_H,
    HALF_W, 0,
    0, HALF_H,
    -HALF_W, 0,
  ]);
  hoverGraphic.stroke({ width: 1.8, color: 0xfef08a, alpha: 0.85 });
  hoverGraphic.fill({ color: 0xffffff, alpha: 0.12 });
  hoverGraphic.visible = false;
  worldContainer.addChild(hoverGraphic);

  // 3. Tabletop Hardwood Rim (rendered on top of world and mask)
  const tableRimLayer = new Graphics();
  app.stage.addChild(tableRimLayer);
  paintTableRim(tableRimLayer);

  // State management
  const buildingGraphics = new Map<string, Graphics>();
  let lastState: GameState | null = null;
  let clickCb: ((x: number, y: number) => void) | null = null;
  let phase = 0;
  let currentSeasonName = "Spring";
  let currentHolidayId = "none";
  let visuals = getThemeVisuals(currentSeasonName, currentHolidayId);

  // Zoom & Pan State (strictly zoom & pan, NO rotate)
  let zoom = 1.0;
  let panX = 0;
  let panY = 0;
  const MIN_ZOOM = 0.75;
  const MAX_ZOOM = 2.2;

  function applyTransform(): void {
    worldContainer.scale.set(zoom);
    worldContainer.position.set(panX, panY);
  }
  applyTransform();

  function setZoomCentered(newZoom: number, cx: number, cy: number): void {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    if (Math.abs(clamped - zoom) < 0.001) return;
    const wx = (cx - panX) / zoom;
    const wy = (cy - panY) / zoom;
    zoom = clamped;
    panX = cx - wx * zoom;
    panY = cy - wy * zoom;
    // Clamp panning boundaries
    const maxPanX = CANVAS_W * 0.75;
    const maxPanY = CANVAS_H * 0.75;
    panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
    panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
    applyTransform();
  }

  // Paint ground initially
  paintIsometricGround(groundLayer, visuals);

  // Living Walkers presentation pool (8 citizens)
  const WALKERS_COUNT = 8;
  const walkers: Walker[] = [];
  for (let i = 0; i < WALKERS_COUNT; i++) {
    const w = createWalker(i, 7 + (i % 3), 4 + Math.floor(i / 3));
    walkers.push(w);
    entitiesLayer.addChild(w.graphics);
  }

  // Drifting Fog banks for All Hallows
  const FOG_COUNT = 8;
  const fogBanks = Array.from({ length: FOG_COUNT }, (_, i) => ({
    x: 80 + (i * 55) % 400,
    y: 60 + (i * 38) % 240,
    vx: 0.12 + (i % 3) * 0.05,
    vy: 0.04 + (i % 2) * 0.03,
    rx: 40 + (i % 4) * 12,
    ry: 18 + (i % 3) * 6,
    alpha: 0.14 + (i % 3) * 0.05,
    phase: i * 1.2,
  }));

  // Floating ambient particle pool
  const PARTICLE_COUNT = 24;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * CANVAS_W,
    y: Math.random() * CANVAS_H,
    vx: (Math.random() - 0.5) * 0.6,
    vy: 0.3 + Math.random() * 0.7,
    size: 1 + Math.random() * 2,
    alpha: 0.2 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
  }));

  app.canvas.style.cursor = "grab";

  // Coordinate Conversion with Zoom & Pan inversion
  function getCanvasCoords(ev: PointerEvent | MouseEvent): { px: number; py: number } {
    const rect = app.canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      px: (ev.clientX - rect.left) * scaleX,
      py: (ev.clientY - rect.top) * scaleY,
    };
  }

  function getWorldCoords(ev: PointerEvent | MouseEvent): { wx: number; wy: number } {
    const { px, py } = getCanvasCoords(ev);
    return {
      wx: (px - panX) / zoom,
      wy: (py - panY) / zoom,
    };
  }

  function getGridFromEvent(ev: PointerEvent | MouseEvent): { gx: number; gy: number } {
    const { wx, wy } = getWorldCoords(ev);
    return worldToGrid(wx, wy);
  }

  // Pointer drag panning and click detection
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialPanX = 0;
  let initialPanY = 0;
  let dragMoved = 0;

  app.canvas.addEventListener("pointerdown", (ev) => {
    isDragging = true;
    app.canvas.style.cursor = "grabbing";
    dragStartX = ev.clientX;
    dragStartY = ev.clientY;
    initialPanX = panX;
    initialPanY = panY;
    dragMoved = 0;
  });

  app.canvas.addEventListener("pointermove", (ev) => {
    const { px, py } = getCanvasCoords(ev);

    if (isDragging) {
      const dx = (ev.clientX - dragStartX) * (CANVAS_W / app.canvas.clientWidth);
      const dy = (ev.clientY - dragStartY) * (CANVAS_H / app.canvas.clientHeight);
      dragMoved += Math.hypot(dx, dy);
      const maxPanX = CANVAS_W * 0.85;
      const maxPanY = CANVAS_H * 0.85;
      panX = Math.max(-maxPanX, Math.min(maxPanX, initialPanX + dx));
      panY = Math.max(-maxPanY, Math.min(maxPanY, initialPanY + dy));
      applyTransform();
    }

    // Hover diamond update (inside worldContainer coordinates)
    const { gx, gy } = getGridFromEvent(ev);
    if (
      px >= RIM_SIZE && px <= CANVAS_W - RIM_SIZE &&
      py >= RIM_SIZE && py <= CANVAS_H - RIM_SIZE &&
      gx >= 0 && gy >= 0 && gx < GRID_W && gy < GRID_H
    ) {
      const { wx, wy } = gridToWorld(gx, gy);
      hoverGraphic.visible = true;
      hoverGraphic.x = wx;
      hoverGraphic.y = wy;
    } else {
      hoverGraphic.visible = false;
    }
  });

  window.addEventListener("pointerup", (ev) => {
    if (!isDragging) return;
    isDragging = false;
    app.canvas.style.cursor = "grab";

    // If movement was minimal, interpret as deliberate tile click!
    if (dragMoved < 6 && clickCb) {
      const { px, py } = getCanvasCoords(ev);
      if (
        px >= RIM_SIZE && px <= CANVAS_W - RIM_SIZE &&
        py >= RIM_SIZE && py <= CANVAS_H - RIM_SIZE
      ) {
        const { gx, gy } = getGridFromEvent(ev);
        if (gx >= 0 && gy >= 0 && gx < GRID_W && gy < GRID_H) {
          clickCb(gx, gy);
        }
      }
    }
  });

  app.canvas.addEventListener("pointerleave", () => {
    hoverGraphic.visible = false;
  });

  // Mouse wheel zoom centered at cursor
  app.canvas.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    const { px, py } = getCanvasCoords(ev);
    const zoomDelta = ev.deltaY < 0 ? 1.15 : 0.87;
    setZoomCentered(zoom * zoomDelta, px, py);
  }, { passive: false });

  // Pick destination for walker based on hold buildings
  function pickDestination(w: Walker, state: GameState | null): void {
    if (state && state.buildings.length > 0 && Math.random() > 0.25) {
      const b = state.buildings[Math.floor(Math.random() * state.buildings.length)];
      const bx = ((b.x % GRID_W) + GRID_W) % GRID_W;
      const by = ((b.y % GRID_H) + GRID_H) % GRID_H;
      w.targetX = Math.max(0, Math.min(GRID_W - 1, bx + (Math.random() > 0.5 ? 1 : -1)));
      w.targetY = Math.max(0, Math.min(GRID_H - 1, by));
    } else {
      w.targetX = 6 + Math.floor(Math.random() * 4);
      w.targetY = 3 + Math.floor(Math.random() * 3);
    }
    w.state = "walking";
    w.facing = w.targetX >= w.x ? 1 : -1;
  }

  function updateWalkers(dt: number, state: GameState | null): void {
    for (const w of walkers) {
      if (w.state === "idle") {
        w.idleTime -= dt;
        w.idlePhase += dt;
        if (w.idleTime <= 0) {
          pickDestination(w, state);
        }
      } else {
        const dx = w.targetX - w.x;
        const dy = w.targetY - w.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.08) {
          w.x = w.targetX;
          w.y = w.targetY;
          w.state = "idle";
          w.idleTime = 2 + Math.random() * 4;
        } else {
          const move = (w.speed * dt) / Math.max(0.1, dist);
          w.x += dx * move;
          w.y += dy * move;
          w.facing = dx >= 0 ? 1 : -1;
          w.walkDist += move * 12;
        }
      }

      // Discrete 2-3 frame animation step calculation:
      // Cycle: 0 (stand) -> 1 (left step) -> 0 (stand) -> 2 (right step)
      let frame: 0 | 1 | 2 = 0;
      if (w.state === "walking") {
        const cycle = Math.floor(w.walkDist) % 4;
        if (cycle === 1) frame = 1;
        else if (cycle === 3) frame = 2;
        else frame = 0;
      }

      // Position in world isometric space
      const { wx, wy } = gridToWorld(w.x, w.y);
      w.graphics.x = wx;
      w.graphics.y = wy;
      w.graphics.zIndex = Math.floor((w.x + w.y) * 100) + 40;

      drawWalkerFrame(w.graphics, w.role, w.facing, frame);
    }
  }

  // All Hallows creeping fog rendering
  function updateFog(t: number): void {
    fogLayer.clear();
    if (visuals.decorations !== "halloween") return;

    for (const f of fogBanks) {
      f.x += f.vx;
      f.y += f.vy;
      if (f.x > CANVAS_W + 50) f.x = -50;
      if (f.y > CANVAS_H + 30) f.y = -30;

      const pulse = Math.sin(t + f.phase) * 0.08 + 1.0;
      fogLayer.ellipse(f.x, f.y, f.rx * pulse, f.ry * pulse);
      fogLayer.fill({ color: 0x3b244d, alpha: f.alpha });
      fogLayer.ellipse(f.x + 4, f.y - 2, f.rx * 0.65 * pulse, f.ry * 0.6 * pulse);
      fogLayer.fill({ color: 0x241433, alpha: f.alpha * 0.7 });
    }
  }

  function updateParticles(t: number): void {
    particlesGraphic.clear();
    const dec = visuals.decorations;

    for (const p of particles) {
      p.y += p.vy;
      p.x += p.vx + Math.sin(t + p.phase) * 0.3;

      if (p.y > CANVAS_H + 10) { p.y = -10; p.x = Math.random() * CANVAS_W; }
      if (p.x > CANVAS_W + 10) p.x = -10;
      if (p.x < -10) p.x = CANVAS_W + 10;

      if (dec === "midwinter" || dec === "winter") {
        particlesGraphic.circle(p.x, p.y, p.size * 0.9);
        particlesGraphic.fill({ color: 0xf8fafc, alpha: p.alpha });
      } else if (dec === "halloween") {
        particlesGraphic.circle(p.x, p.y, p.size);
        particlesGraphic.fill({ color: 0xf97316, alpha: p.alpha * 0.75 });
      } else if (dec === "midsummer") {
        const glow = Math.sin(t * 3 + p.phase) * 0.4 + 0.6;
        particlesGraphic.circle(p.x, p.y, p.size * 1.2);
        particlesGraphic.fill({ color: 0xfacc15, alpha: p.alpha * glow });
      } else if (dec === "autumn" || dec === "harvest") {
        particlesGraphic.ellipse(p.x, p.y, p.size * 1.5, p.size);
        particlesGraphic.fill({ color: 0xd97706, alpha: p.alpha * 0.8 });
      } else if (dec === "spring" || dec === "easter") {
        particlesGraphic.circle(p.x, p.y, p.size);
        particlesGraphic.fill({ color: 0xf472b6, alpha: p.alpha * 0.6 });
      }
    }
  }

  function paintAmbientLighting(): void {
    ambientOverlay.clear();
    if (visuals.tintAlpha > 0) {
      ambientOverlay.rect(-CANVAS_W, -CANVAS_H, CANVAS_W * 3, CANVAS_H * 3);
      ambientOverlay.fill({ color: visuals.tintColor, alpha: visuals.tintAlpha });
    }
  }

  function paintBuildings(state: GameState, t: number): void {
    const seen = new Set<string>();

    for (const b of state.buildings) {
      seen.add(b.id);
      let g = buildingGraphics.get(b.id);
      if (!g) {
        g = new Graphics();
        buildingGraphics.set(b.id, g);
        entitiesLayer.addChild(g);
      }

      const complete = b.completesAtTick === null;
      const gx = ((b.x % GRID_W) + GRID_W) % GRID_W;
      const gy = ((b.y % GRID_H) + GRID_H) % GRID_H;
      const { wx, wy } = gridToWorld(gx, gy);

      g.x = wx;
      g.y = wy;
      g.zIndex = Math.floor((gx + gy) * 100) + 50;

      drawIsometricBuilding(g, b.typeId, b.level, complete, t + gx * 0.35, visuals);
    }

    // Clean up dismantled buildings
    for (const [id, g] of buildingGraphics) {
      if (!seen.has(id)) {
        entitiesLayer.removeChild(g);
        g.destroy();
        buildingGraphics.delete(id);
      }
    }
  }

  function sync(state: GameState): void {
    lastState = state;
    const season = currentSeason(state);
    if (season !== currentSeasonName) {
      currentSeasonName = season;
      visuals = getThemeVisuals(currentSeasonName, currentHolidayId);
      paintIsometricGround(groundLayer, visuals);
      paintAmbientLighting();
    }
    paintBuildings(state, phase);
  }

  function setTheme(themeId: string, holidayId: string): void {
    currentHolidayId = holidayId;
    visuals = getThemeVisuals(currentSeasonName, holidayId);
    paintIsometricGround(groundLayer, visuals);
    paintAmbientLighting();
    if (lastState) {
      paintBuildings(lastState, phase);
    }
  }

  let lastTickTime = performance.now();

  app.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastTickTime) / 1000);
    lastTickTime = now;

    phase += dt * 2.5;

    updateWalkers(dt, lastState);
    updateFog(phase);
    updateParticles(phase);

    if (lastState) {
      paintBuildings(lastState, phase);
    }
  });

  return {
    sync,
    setTheme,
    destroy() {
      app.destroy(true);
      buildingGraphics.clear();
      walkers.length = 0;
    },
    onTileClick(cb) {
      clickCb = cb;
    },
    zoomIn() {
      setZoomCentered(zoom * 1.25, CANVAS_W / 2, CANVAS_H / 2);
    },
    zoomOut() {
      setZoomCentered(zoom * 0.8, CANVAS_W / 2, CANVAS_H / 2);
    },
    resetView() {
      zoom = 1.0;
      panX = 0;
      panY = 0;
      applyTransform();
    },
  };
}
