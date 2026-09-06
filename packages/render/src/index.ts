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

export interface MapRenderer {
  sync(state: GameState): void;
  setTheme(themeId: string, holidayId: string): void;
  destroy(): void;
  onTileClick(cb: (x: number, y: number) => void): void;
}

// Convert grid (gx, gy) to screen center (px, py)
function gridToScreen(gx: number, gy: number): { px: number; py: number } {
  return {
    px: ORIGIN_X + (gx - gy) * HALF_W,
    py: ORIGIN_Y + (gx + gy) * HALF_H,
  };
}

// Convert screen (px, py) to grid (gx, gy)
function screenToGrid(px: number, py: number): { gx: number; gy: number } {
  const dx = px - ORIGIN_X;
  const dy = py - ORIGIN_Y;
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
  // Left-facing cliff wall along bottom edge (x = 0..15, y = 9)
  const CLIFF_DEPTH = 22;
  for (let x = 0; x < GRID_W; x++) {
    const { px, py } = gridToScreen(x, GRID_H - 1);
    const pLeft = { x: px - HALF_W, y: py };
    const pBottom = { x: px, y: py + HALF_H };
    const pRight = { x: px + HALF_W, y: py };

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
    const { px, py } = gridToScreen(GRID_W - 1, y);
    const pBottom = { x: px, y: py + HALF_H };
    const pRight = { x: px + HALF_W, y: py };

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
      const { px, py } = gridToScreen(x, y);
      const isRoad = ROAD_TILES.has(`${x},${y}`);
      const shade = isRoad
        ? ((x + y) % 2 === 0 ? visuals.roadColor : visuals.roadCobble)
        : ((x + y) % 2 === 0 ? visuals.groundA : visuals.groundB);

      // Base diamond tile
      g.poly([
        px, py - HALF_H,
        px + HALF_W, py,
        px, py + HALF_H,
        px - HALF_W, py,
      ]);
      g.fill({ color: shade });

      // Subtle diamond grid border
      g.stroke({ width: 1, color: visuals.gridLine, alpha: 0.45 });

      // Cobblestone path details
      if (isRoad) {
        g.rect(px - 6, py - 3, 4, 2);
        g.fill({ color: visuals.roadCobble, alpha: 0.7 });
        g.rect(px + 2, py - 1, 5, 2);
        g.fill({ color: visuals.roadColor, alpha: 0.8 });
        g.rect(px - 3, py + 2, 4, 2);
        g.fill({ color: visuals.roadCobble, alpha: 0.75 });
      } else {
        // Seasonal terrain flourishes
        const hash = (x * 13 + y * 29) % 17;
        if (visuals.decorations === "spring" && hash === 3) {
          // Wildflower blossoms
          g.circle(px - 3, py - 2, 1.4);
          g.fill({ color: 0xf472b6, alpha: 0.8 });
        } else if (visuals.decorations === "spring" && hash === 7) {
          g.circle(px + 4, py + 1, 1.4);
          g.fill({ color: 0xfacc15, alpha: 0.8 });
        } else if (visuals.decorations === "easter" && hash === 5) {
          // Easter egg hidden in grass
          g.ellipse(px, py, 2.5, 3.2);
          g.fill({ color: 0xd8b4fe, alpha: 0.85 });
          g.circle(px, py, 1.2);
          g.fill({ color: 0xfde047, alpha: 0.9 });
        } else if (visuals.decorations === "halloween" && hash === 4) {
          // Fallen pumpkin patch
          g.ellipse(px + 2, py + 1, 3.5, 2.8);
          g.fill({ color: 0xe85d04, alpha: 0.85 });
          g.rect(px + 2, py - 2, 1.2, 2);
          g.fill({ color: 0x3f6212, alpha: 0.9 });
        } else if (visuals.decorations === "midwinter" && hash % 3 === 0) {
          // Snow drifts
          g.ellipse(px, py + 2, 8, 3);
          g.fill({ color: 0xf1f5f9, alpha: 0.35 });
        } else if (visuals.decorations === "autumn" && hash === 6) {
          // Fallen autumn leaves
          g.circle(px - 2, py - 1, 1.8);
          g.fill({ color: 0xd97706, alpha: 0.8 });
          g.circle(px + 3, py + 2, 1.6);
          g.fill({ color: 0xb91c1c, alpha: 0.75 });
        } else if (visuals.decorations === "harvest" && hash === 2) {
          // Harvest wheat bushel
          g.rect(px - 1, py - 2, 3, 5);
          g.fill({ color: 0xca8a04, alpha: 0.8 });
        } else if (visuals.decorations === "midsummer" && hash === 8) {
          // Sunburst marigold
          g.circle(px, py, 1.8);
          g.fill({ color: 0xfbbf24, alpha: 0.85 });
        }
      }
    }
  }
}

// -------------------------------------------------------------
// Isometric Pixel Building Painter
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

  // Isometric ground footprint indicator
  g.poly([
    0, -HALF_H,
    HALF_W - 1, 0,
    0, HALF_H - 1,
    -HALF_W + 1, 0,
  ]);
  g.fill({ color: 0x0b100d, alpha: 0.35 });

  const lvl = Math.max(1, Math.min(5, level));
  const isWinter = visuals.decorations === "winter" || visuals.decorations === "midwinter";
  const isHalloween = visuals.decorations === "halloween";

  // Level visual scaling: base height increases slightly with upgrades
  const heightBoost = (lvl - 1) * 2;

  switch (typeId) {
    case "farm": {
      // Thatched Farm Cottage with Field
      const h = 16 + heightBoost;
      // Cottage Left Wall (timber)
      g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
      g.fill({ color: 0x8b5a2b, alpha: a });
      // Cottage Right Wall (shadowed timber)
      g.poly([0, 8, 14, 1, 14, 1 - h, 0, 8 - h]);
      g.fill({ color: 0x6e431f, alpha: a });
      // Thatched Roof
      g.poly([
        -18, -h,
        0, 10 - h - 10,
        16, 1 - h,
        0, -h - 16,
      ]);
      g.fill({ color: 0xd4a359, alpha: a });
      // Chimney & Smoke
      g.rect(6, -h - 14, 4, 8);
      g.fill({ color: 0x71717a, alpha: a });
      const puff = Math.sin(phase * 2) * 2;
      g.circle(8, -h - 16 + puff, 2.5);
      g.fill({ color: 0xe4e4e7, alpha: 0.4 * a });
      // Wooden door & windows
      g.rect(-10, 4 - h * 0.5, 4, 6);
      g.fill({ color: 0x3d2410, alpha: a });
      // Wheat field patch on right
      g.rect(4, 2, 8, 3);
      g.fill({ color: 0xca8a04, alpha: a * 0.85 });
      break;
    }

    case "lumber_camp": {
      // Log Cabin with Chopping Block & Tall Pine
      const h = 14 + heightBoost;
      // Cabin Walls
      g.poly([-14, 0, 0, 7, 0, 7 - h, -14, 0 - h]);
      g.fill({ color: 0x5c3d28, alpha: a });
      g.poly([0, 7, 12, 1, 12, 1 - h, 0, 7 - h]);
      g.fill({ color: 0x472d1c, alpha: a });
      // Log Roof
      g.poly([-16, -h, 0, 8 - h - 8, 14, 1 - h, 0, -h - 12]);
      g.fill({ color: 0x382214, alpha: a });
      // Pine Tree on left
      g.poly([-12, 2, -7, -22, -2, 2]);
      g.fill({ color: 0x166534, alpha: a });
      g.poly([-11, -8, -7, -28, -3, -8]);
      g.fill({ color: 0x15803d, alpha: a });
      // Chopping block & axe
      g.rect(4, 3, 5, 3);
      g.fill({ color: 0x854d0e, alpha: a });
      g.rect(6, 1, 2, 3);
      g.fill({ color: 0xd1d5db, alpha: a });
      break;
    }

    case "quarry": {
      // Stepped Granite Pit with Wooden Crane
      g.poly([-14, 0, 0, 7, 14, 0, 0, -7]);
      g.fill({ color: 0x3f3f46, alpha: a });
      // Tiered Stone Blocks
      g.poly([-10, 2, 0, 7, 0, 1, -10, -4]);
      g.fill({ color: 0x71717a, alpha: a });
      g.poly([0, 7, 10, 2, 10, -4, 0, 1]);
      g.fill({ color: 0x52525b, alpha: a });
      // Wooden Derrick Crane
      g.moveTo(-4, 0); g.lineTo(-4, -18); g.lineTo(6, -12);
      g.stroke({ width: 2, color: 0x854d0e, alpha: a });
      g.circle(6, -6, 2.5);
      g.fill({ color: 0xa1a1aa, alpha: a }); // Hoisted stone
      break;
    }

    case "mason": {
      // Stonecutter's Atelier with Sculpted Arch
      const h = 18 + heightBoost;
      g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
      g.fill({ color: 0x94a3b8, alpha: a });
      g.poly([0, 8, 14, 1, 14, 1 - h, 0, 8 - h]);
      g.fill({ color: 0x64748b, alpha: a });
      // Slate Gable Roof
      g.poly([-18, -h, 0, 9 - h - 10, 16, 1 - h, 0, -h - 14]);
      g.fill({ color: 0x334155, alpha: a });
      // Carved stone column
      g.rect(-10, 2 - h * 0.4, 4, 8);
      g.fill({ color: 0xf8fafc, alpha: a });
      break;
    }

    case "gold_mine": {
      // Mine Entrance in Rocky Outcrop with Ore Cart
      // Rocky mound
      g.poly([-16, 2, -10, -18, 6, -20, 16, 0, 0, 8]);
      g.fill({ color: 0x475569, alpha: a });
      // Timber Mine Entrance Frame
      g.poly([-8, 4, 0, 8, 0, -6, -8, -10]);
      g.fill({ color: 0x18181b, alpha: a }); // Deep shaft
      g.moveTo(-8, 4); g.lineTo(-8, -10); g.lineTo(0, -6); g.lineTo(0, 8);
      g.stroke({ width: 2.2, color: 0x78350f, alpha: a });
      // Gold ore cart on tracks
      g.rect(4, 2, 7, 5);
      g.fill({ color: 0x3f3f46, alpha: a });
      g.circle(7, 3, 2);
      g.fill({ color: 0xfacc15, alpha: a }); // Glittering gold
      break;
    }

    case "mint": {
      // Royal Mint Vault with Gold Coin Press
      const h = 20 + heightBoost;
      g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
      g.fill({ color: 0x64748b, alpha: a });
      g.poly([0, 8, 14, 1, 14, 1 - h, 0, 8 - h]);
      g.fill({ color: 0x475569, alpha: a });
      // Vaulted Gilded Roof
      g.poly([-18, -h, 0, 9 - h - 8, 16, 1 - h, 0, -h - 14]);
      g.fill({ color: 0x854d0e, alpha: a });
      // Gold Coin Sigil
      g.circle(0, -h * 0.4, 3.5);
      g.fill({ color: 0xfacc15, alpha: a });
      break;
    }

    case "granary": {
      // Conical Silo with Timber Hoist
      const h = 22 + heightBoost;
      // Cylinder body (left/right shading)
      g.rect(-10, -h + 8, 10, h);
      g.fill({ color: 0xd4b36a, alpha: a });
      g.rect(0, -h + 8, 10, h);
      g.fill({ color: 0xb59247, alpha: a });
      // Conical Roof
      g.poly([-13, -h + 8, 0, -h - 12, 13, -h + 8]);
      g.fill({ color: 0x991b1b, alpha: a });
      // Grain sack on hoist
      g.circle(12, -h + 12, 2.5);
      g.fill({ color: 0xfef08a, alpha: a });
      break;
    }

    case "sawmill": {
      // Watermill & Saw Shed with Rotating Blade
      const h = 16 + heightBoost;
      g.poly([-14, 0, 0, 7, 0, 7 - h, -14, 0 - h]);
      g.fill({ color: 0x78350f, alpha: a });
      g.poly([0, 7, 12, 1, 12, 1 - h, 0, 7 - h]);
      g.fill({ color: 0x5b2609, alpha: a });
      // Roof
      g.poly([-16, -h, 0, 8 - h - 8, 14, 1 - h, 0, -h - 12]);
      g.fill({ color: 0x451a03, alpha: a });
      // Rotating saw blade / waterwheel
      const spin = phase * 4;
      g.circle(14, 0, 6);
      g.fill({ color: 0x94a3b8, alpha: a });
      g.moveTo(14, 0);
      g.lineTo(14 + Math.cos(spin) * 5, Math.sin(spin) * 5);
      g.stroke({ width: 1.5, color: 0x334155, alpha: a });
      break;
    }

    case "market": {
      // Striped Bazaar Tents with Crates
      const h = 16 + heightBoost;
      // Crimson & Gold Striped Canopy
      g.poly([-16, -2, 0, 6, 0, 6 - h, -16, -2 - h]);
      g.fill({ color: 0xd97706, alpha: a });
      g.poly([0, 6, 14, -1, 14, -1 - h, 0, 6 - h]);
      g.fill({ color: 0xb91c1c, alpha: a });
      // Peak of tent
      g.poly([-18, -h, 0, 8 - h - 10, 16, -1 - h, 0, -h - 14]);
      g.fill({ color: 0xf59e0b, alpha: a });
      // Produce stalls & crates
      g.rect(-8, 3, 5, 4);
      g.fill({ color: 0x854d0e, alpha: a });
      g.circle(-6, 3, 1.8);
      g.fill({ color: 0x22c55e, alpha: a }); // Apples/melons
      g.rect(4, 2, 5, 4);
      g.fill({ color: 0x854d0e, alpha: a });
      g.circle(6, 2, 1.8);
      g.fill({ color: 0xef4444, alpha: a }); // Spices/fruit
      break;
    }

    case "barracks": {
      // Fortified Stone Keep with Battlements & War Banner
      const h = 22 + heightBoost;
      g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
      g.fill({ color: 0x64748b, alpha: a });
      g.poly([0, 8, 16, 0, 16, 0 - h, 0, 8 - h]);
      g.fill({ color: 0x475569, alpha: a });
      // Parapet Crenellations
      g.rect(-16, -h - 3, 6, 4); g.fill({ color: 0x64748b, alpha: a });
      g.rect(-6, -h - 3, 6, 4); g.fill({ color: 0x64748b, alpha: a });
      g.rect(4, -h - 3, 6, 4); g.fill({ color: 0x475569, alpha: a });
      g.rect(12, -h - 3, 6, 4); g.fill({ color: 0x475569, alpha: a });
      // Iron Gate
      g.rect(-4, 3, 8, 6);
      g.fill({ color: 0x1e293b, alpha: a });
      // Red War Banner waving
      const wave = Math.sin(phase * 3) * 2;
      g.moveTo(0, -h - 2); g.lineTo(0, -h - 16);
      g.stroke({ width: 1.5, color: 0xd4a359, alpha: a });
      g.poly([0, -h - 16, 8 + wave, -h - 12, 0, -h - 8]);
      g.fill({ color: 0xdc2626, alpha: a });
      break;
    }

    case "stables": {
      // Timber Barn with Hayloft & Stalls
      const h = 18 + heightBoost;
      g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
      g.fill({ color: 0x78350f, alpha: a });
      g.poly([0, 8, 14, 1, 14, 1 - h, 0, 8 - h]);
      g.fill({ color: 0x5b2609, alpha: a });
      // Gabled Hayloft Roof
      g.poly([-18, -h, 0, 9 - h - 10, 16, 1 - h, 0, -h - 14]);
      g.fill({ color: 0x451a03, alpha: a });
      // Stall doors & straw
      g.rect(-10, 3, 5, 5); g.fill({ color: 0x1c1917, alpha: a });
      g.rect(4, 2, 5, 5); g.fill({ color: 0x1c1917, alpha: a });
      g.rect(4, 6, 5, 2); g.fill({ color: 0xfef08a, alpha: a }); // Straw
      break;
    }

    case "archery_range": {
      // Target Range with Pavilion & Straw Butts
      // Grass practice ground
      g.poly([-12, 0, 0, 6, 12, 0, 0, -6]);
      g.fill({ color: 0x15803d, alpha: a });
      // Archery Target Butt (straw round with bullseye)
      g.circle(8, -6, 5);
      g.fill({ color: 0xfef08a, alpha: a });
      g.circle(8, -6, 3.2);
      g.fill({ color: 0xef4444, alpha: a });
      g.circle(8, -6, 1.2);
      g.fill({ color: 0xfacc15, alpha: a });
      // Archer's Pavilion
      g.poly([-14, -4, -6, 0, -6, -14, -14, -18]);
      g.fill({ color: 0x1e3a8a, alpha: a });
      break;
    }

    case "siege_workshop": {
      // Engineer Yard with Catapult & Ballista
      const h = 16 + heightBoost;
      g.poly([-14, 0, 0, 7, 0, 7 - h, -14, 0 - h]);
      g.fill({ color: 0x57534e, alpha: a });
      g.poly([0, 7, 14, 0, 14, 0 - h, 0, 7 - h]);
      g.fill({ color: 0x44403c, alpha: a });
      // Timber Catapult Arm & Frame
      g.moveTo(-6, 2); g.lineTo(6, -14);
      g.stroke({ width: 3, color: 0x78350f, alpha: a });
      g.circle(-6, 4, 3);
      g.fill({ color: 0x292524, alpha: a }); // Wheel
      g.circle(4, 2, 3);
      g.fill({ color: 0x292524, alpha: a }); // Wheel
      // Boulder ammunition pile
      g.circle(10, 4, 2); g.fill({ color: 0xa8a29e, alpha: a });
      g.circle(12, 2, 2); g.fill({ color: 0x78716c, alpha: a });
      break;
    }

    case "watchtower": {
      // High Stone Lookout Tower with Fluttering Banner
      const h = 32 + heightBoost;
      g.poly([-8, 0, 0, 4, 0, 4 - h, -8, 0 - h]);
      g.fill({ color: 0x94a3b8, alpha: a });
      g.poly([0, 4, 8, 0, 8, 0 - h, 0, 4 - h]);
      g.fill({ color: 0x64748b, alpha: a });
      // Wooden Hoarding / Platform
      g.poly([-11, -h + 2, 0, 6 - h, 11, -h + 2, 0, -h - 4]);
      g.fill({ color: 0x854d0e, alpha: a });
      // Conical Roof
      g.poly([-10, -h, 0, -h - 14, 10, -h]);
      g.fill({ color: 0x713f12, alpha: a });
      // Royal Flag
      const flap = Math.sin(phase * 3.5) * 3;
      g.moveTo(0, -h - 14); g.lineTo(0, -h - 22);
      g.stroke({ width: 1.5, color: 0xd4a359, alpha: a });
      g.poly([0, -h - 22, 9 + flap, -h - 18, 0, -h - 14]);
      g.fill({ color: 0xfacc15, alpha: a });
      break;
    }

    case "chapel": {
      // Gothic Sanctuary with Rose Window & Steeple Cross
      const h = 24 + heightBoost;
      g.poly([-14, 0, 0, 7, 0, 7 - h, -14, 0 - h]);
      g.fill({ color: 0xc4b5fd, alpha: a });
      g.poly([0, 7, 14, 0, 14, 0 - h, 0, 7 - h]);
      g.fill({ color: 0xa78bfa, alpha: a });
      // Steep Purple Slate Roof
      g.poly([-16, -h, 0, 8 - h - 12, 16, 0 - h, 0, -h - 18]);
      g.fill({ color: 0x6b21a8, alpha: a });
      // Rose Stained Glass Window
      g.circle(0, 2 - h * 0.45, 3.5);
      g.fill({ color: 0xf43f5e, alpha: a });
      g.circle(0, 2 - h * 0.45, 1.8);
      g.fill({ color: 0x60a5fa, alpha: a });
      // Golden Cross Finial
      g.rect(-1, -h - 24, 2, 8);
      g.fill({ color: 0xfacc15, alpha: a });
      g.rect(-3, -h - 21, 6, 2);
      g.fill({ color: 0xfacc15, alpha: a });
      break;
    }

    case "walls": {
      // Fortified Isometric Curtain Wall & Crenellations
      const h = 18 + heightBoost;
      g.poly([-18, 0, 0, 9, 0, 9 - h, -18, 0 - h]);
      g.fill({ color: 0x64748b, alpha: a });
      g.poly([0, 9, 18, 0, 18, 0 - h, 0, 9 - h]);
      g.fill({ color: 0x475569, alpha: a });
      // Battlements
      for (let i = -16; i <= 14; i += 7) {
        g.rect(i, -h - 2, 4, 3);
        g.fill({ color: 0x94a3b8, alpha: a });
      }
      break;
    }

    default: {
      // Half-timbered Town Hall
      const h = 18 + heightBoost;
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

  // Halloween Jack-o'-Lanterns by the Doorstep
  if (isHalloween && complete) {
    g.ellipse(8, 4, 3.5, 2.8);
    g.fill({ color: 0xe85d04, alpha: 0.95 });
    // Glowing witchfire eyes & mouth
    const flicker = Math.sin(phase * 5) * 0.15 + 0.85;
    g.rect(7, 3, 1, 1); g.fill({ color: 0xfef08a, alpha: flicker });
    g.rect(9, 3, 1, 1); g.fill({ color: 0xfef08a, alpha: flicker });
    g.rect(7.5, 4.5, 2, 1); g.fill({ color: 0xfef08a, alpha: flicker });
  }

  // Under-construction scaffolding overlay
  if (!complete) {
    g.stroke({ width: 1.5, color: 0xfbbf24, alpha: 0.7 });
    // Scaffolding timber poles
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
// Living Hold Walkers (Presentation Citizens)
// -------------------------------------------------------------
interface Walker {
  id: number;
  role: "villager" | "woodcutter" | "miner" | "merchant" | "guard" | "scholar";
  x: number; // continuous tile coordinates (0..15)
  y: number; // continuous tile coordinates (0..9)
  targetX: number;
  targetY: number;
  state: "walking" | "idle";
  idleTime: number;
  speed: number;
  facing: number; // -1 for left, 1 for right
  stepPhase: number;
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
    stepPhase: Math.random() * Math.PI * 2,
    graphics: g,
  };
}

function drawWalkerSprite(g: Graphics, role: Walker["role"], facing: number, stride: number): void {
  g.clear();

  // Subtle ground contact shadow
  g.ellipse(0, 1, 4.5, 2.2);
  g.fill({ color: 0x000000, alpha: 0.28 });

  const bob = Math.abs(Math.sin(stride)) * 1.5;
  const legOffset = Math.sin(stride) * 2;

  // Legs / boots
  g.rect(-2 - legOffset * 0.5, -2 - bob, 2, 3);
  g.fill({ color: 0x27272a });
  g.rect(1 + legOffset * 0.5, -2 - bob, 2, 3);
  g.fill({ color: 0x18181b });

  // Body & Clothes by role
  let tunicColor = 0x854d0e;
  let toolColor: number | null = null;

  if (role === "villager") tunicColor = 0xb45309;
  else if (role === "woodcutter") { tunicColor = 0x15803d; toolColor = 0xd1d5db; }
  else if (role === "miner") { tunicColor = 0x52525b; toolColor = 0x71717a; }
  else if (role === "merchant") tunicColor = 0xb91c1c;
  else if (role === "guard") tunicColor = 0x1e3a8a;
  else if (role === "scholar") tunicColor = 0x6b21a8;

  // Torso / Tunic
  g.rect(-3, -7 - bob, 6, 5);
  g.fill({ color: tunicColor });

  // Head
  g.circle(0, -10 - bob, 2.8);
  g.fill({ color: 0xfbcfe8 }); // Skin tone

  // Headwear / hair
  if (role === "guard") {
    // Steel helmet
    g.rect(-3, -13 - bob, 6, 3);
    g.fill({ color: 0x94a3b8 });
  } else if (role === "scholar") {
    // Cowl
    g.rect(-3, -12 - bob, 6, 2.5);
    g.fill({ color: 0x581c87 });
  } else {
    // Hair
    g.rect(-2.5, -12 - bob, 5, 2);
    g.fill({ color: 0x451a03 });
  }

  // Carried Tool / Prop
  if (toolColor) {
    g.rect(facing * 3, -8 - bob, 1.5, 6);
    g.fill({ color: 0x78350f });
    g.rect(facing * 3 - 1, -9 - bob, 3.5, 2);
    g.fill({ color: toolColor });
  } else if (role === "guard") {
    // Spear with pennant
    g.moveTo(facing * 3, 0 - bob); g.lineTo(facing * 3, -16 - bob);
    g.stroke({ width: 1.2, color: 0xd4a359 });
    g.poly([facing * 3, -16 - bob, facing * 3 + facing * 4, -14 - bob, facing * 3, -12 - bob]);
    g.fill({ color: 0xdc2626 });
  }
}

// -------------------------------------------------------------
// Main Map Renderer Factory
// -------------------------------------------------------------
export async function createMapRenderer(canvas: HTMLCanvasElement): Promise<MapRenderer> {
  const app = new Application();
  await app.init({
    canvas,
    width: CANVAS_W,
    height: CANVAS_H,
    backgroundColor: 0x0c1014,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  // Layer hierarchy
  const groundLayer = new Graphics();
  app.stage.addChild(groundLayer);

  // Depth-sorted entities container (buildings + walkers)
  const entitiesLayer = new Container();
  entitiesLayer.sortableChildren = true;
  app.stage.addChild(entitiesLayer);

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
  app.stage.addChild(hoverGraphic);

  // Ambient lighting overlay
  const ambientOverlay = new Graphics();
  app.stage.addChild(ambientOverlay);

  // Floating atmospheric particles layer
  const particlesGraphic = new Graphics();
  app.stage.addChild(particlesGraphic);

  // State management
  const buildingGraphics = new Map<string, Graphics>();
  let lastState: GameState | null = null;
  let clickCb: ((x: number, y: number) => void) | null = null;
  let phase = 0;
  let currentSeasonName = "Spring";
  let currentHolidayId = "none";
  let visuals = getThemeVisuals(currentSeasonName, currentHolidayId);

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

  app.canvas.style.cursor = "pointer";

  function getGridFromEvent(ev: PointerEvent): { gx: number; gy: number } {
    const rect = app.canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const px = (ev.clientX - rect.left) * scaleX;
    const py = (ev.clientY - rect.top) * scaleY;
    return screenToGrid(px, py);
  }

  app.canvas.addEventListener("pointermove", (ev) => {
    const { gx, gy } = getGridFromEvent(ev);
    if (gx >= 0 && gy >= 0 && gx < GRID_W && gy < GRID_H) {
      const { px, py } = gridToScreen(gx, gy);
      hoverGraphic.visible = true;
      hoverGraphic.x = px;
      hoverGraphic.y = py;
    } else {
      hoverGraphic.visible = false;
    }
  });

  app.canvas.addEventListener("pointerleave", () => {
    hoverGraphic.visible = false;
  });

  app.canvas.addEventListener("pointerdown", (ev) => {
    const { gx, gy } = getGridFromEvent(ev);
    if (gx >= 0 && gy >= 0 && gx < GRID_W && gy < GRID_H && clickCb) {
      clickCb(gx, gy);
    }
  });

  // Pick destination for walker based on hold buildings
  function pickDestination(w: Walker, state: GameState | null): void {
    if (state && state.buildings.length > 0 && Math.random() > 0.25) {
      // Pick a random built building
      const b = state.buildings[Math.floor(Math.random() * state.buildings.length)];
      const bx = ((b.x % GRID_W) + GRID_W) % GRID_W;
      const by = ((b.y % GRID_H) + GRID_H) % GRID_H;
      // Stroll to building or adjacent road
      w.targetX = Math.max(0, Math.min(GRID_W - 1, bx + (Math.random() > 0.5 ? 1 : -1)));
      w.targetY = Math.max(0, Math.min(GRID_H - 1, by));
    } else {
      // Idle near the keep / town center
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
        if (w.idleTime <= 0) {
          pickDestination(w, state);
        }
      } else {
        // Walking towards target
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
          w.stepPhase += dt * 8;
        }
      }

      // Position in isometric space
      const { px, py } = gridToScreen(w.x, w.y);
      w.graphics.x = px;
      w.graphics.y = py;
      // Depth sort key: objects in foreground (higher x + y) rendered on top
      w.graphics.zIndex = Math.floor((w.x + w.y) * 100) + 40;

      drawWalkerSprite(w.graphics, w.role, w.facing, w.state === "walking" ? w.stepPhase : 0);
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
        // Falling snowflakes
        particlesGraphic.circle(p.x, p.y, p.size * 0.9);
        particlesGraphic.fill({ color: 0xf8fafc, alpha: p.alpha });
      } else if (dec === "halloween") {
        // Drifting spectral embers / wisps
        particlesGraphic.circle(p.x, p.y, p.size);
        particlesGraphic.fill({ color: 0xf97316, alpha: p.alpha * 0.75 });
      } else if (dec === "midsummer") {
        // Solstice fireflies pulsing
        const glow = Math.sin(t * 3 + p.phase) * 0.4 + 0.6;
        particlesGraphic.circle(p.x, p.y, p.size * 1.2);
        particlesGraphic.fill({ color: 0xfacc15, alpha: p.alpha * glow });
      } else if (dec === "autumn" || dec === "harvest") {
        // Swirling autumn leaves
        particlesGraphic.ellipse(p.x, p.y, p.size * 1.5, p.size);
        particlesGraphic.fill({ color: 0xd97706, alpha: p.alpha * 0.8 });
      } else if (dec === "spring" || dec === "easter") {
        // Drifting spring petals
        particlesGraphic.circle(p.x, p.y, p.size);
        particlesGraphic.fill({ color: 0xf472b6, alpha: p.alpha * 0.6 });
      }
    }
  }

  function paintAmbientLighting(): void {
    ambientOverlay.clear();
    if (visuals.tintAlpha > 0) {
      ambientOverlay.rect(0, 0, CANVAS_W, CANVAS_H);
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
      const { px, py } = gridToScreen(gx, gy);

      g.x = px;
      g.y = py;
      // Building depth sorting
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
  };
}
