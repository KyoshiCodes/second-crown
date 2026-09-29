import { Graphics } from "pixi.js";
import type { GameState, TerrainId, Province } from "@second-crown/shared";
import { BOARD_W, BOARD_H } from "@second-crown/shared";
import * as sim from "@second-crown/sim";
import {
  provinceTokenBounds,
  CANVAS_W,
  CANVAS_H,
  ORIGIN_BOARD_X,
  ORIGIN_BOARD_Y,
  CHIP_W,
  CHIP_H,
  GAP_X,
  GAP_Y,
  RIM_SIZE,
  TILE_W,
  TILE_H,
  HALF_W,
  HALF_H,
  gridToWorld,
  BOARD_TILE_W,
  BOARD_TILE_H,
  BOARD_HALF_W,
  BOARD_HALF_H,
  BOARD_ORIGIN_X,
  BOARD_ORIGIN_Y,
  boardGridToWorld,
} from "./camera.js";
import { blendDark } from "./buildings.js";

// Grid configuration
export const GRID_W = 16;
export const GRID_H = 10;

export function isRimTile(gx: number, gy: number): boolean {
  return gx === 0 || gy === 0 || gx === GRID_W - 1 || gy === GRID_H - 1;
}

export interface RimFort {
  x: number;
  y: number;
  kind: "wall" | "gate";
}

export interface RimNeighbors {
  hasPrev: boolean;
  hasNext: boolean;
  prevKind?: "wall" | "gate";
  nextKind?: "wall" | "gate";
}

/** Index of a rim tile walking the ring clockwise starting at (0,0): top L->R, right T->B, bottom R->L, left B->T. */
export function rimWalkIndex(x: number, y: number): number {
  if (y === 0) return x;
  if (x === GRID_W - 1) return 16 + (y - 1);
  if (y === GRID_H - 1) return 25 + (GRID_W - 2 - x);
  return 40 + (GRID_H - 2 - y);
}

/** Returns the grid coordinates for a given rim index walking clockwise from (0,0). */
export function getRimTileAt(idx: number): { x: number; y: number } {
  const norm = ((idx % 48) + 48) % 48;
  if (norm < 16) return { x: norm, y: 0 };
  if (norm < 25) return { x: GRID_W - 1, y: norm - 15 };
  if (norm < 40) return { x: 39 - norm, y: GRID_H - 1 };
  return { x: 0, y: 48 - norm };
}

/** Finished wall/gate buildings on the hold rim, ordered clockwise from (0,0). Uses sim.listRimForts if exported, else reads state.buildings. */
export function listRimFortsPresentation(state: GameState, realmId = "player"): RimFort[] {
  const simAny = sim as Record<string, unknown>;
  if (typeof simAny["listRimForts"] === "function") {
    return (simAny["listRimForts"] as (s: GameState, r?: string) => RimFort[])(state, realmId);
  }
  const forts: RimFort[] = [];
  if (!state?.buildings) return forts;
  for (const b of state.buildings) {
    if (b.realmId !== realmId) continue;
    if (b.completesAtTick !== null) continue;
    if (!isRimTile(b.x, b.y)) continue;
    if (b.typeId === "walls") forts.push({ x: b.x, y: b.y, kind: "wall" });
    else if (b.typeId === "gate") forts.push({ x: b.x, y: b.y, kind: "gate" });
  }
  forts.sort((a, b) => rimWalkIndex(a.x, a.y) - rimWalkIndex(b.x, b.y));
  return forts;
}

// Pre-defined cobblestone road network: central thoroughfare connecting the hold
export const ROAD_TILES = new Set<string>([
  // East-West main street
  "3,4", "4,4", "5,4", "6,4", "7,4", "8,4", "9,4", "10,4", "11,4", "12,4",
  // North-South cross streets
  "6,2", "6,3", "6,4", "6,5", "6,6",
  "9,2", "9,3", "9,4", "9,5", "9,6",
  // Square connectors
  "7,3", "8,3",
  "7,5", "8,5",
  "5,4", "10,4",
  "6,3", "9,3",
  "6,5", "9,5",
]);

export interface ThemeVisuals {
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

export function terrainChipPalette(terrain: TerrainId): {
  fill: number;
  fillDark: number;
  border: number;
  accent: number;
} {
  switch (terrain) {
    case "plain":
      return { fill: 0x2d5a27, fillDark: 0x1e3e1a, border: 0x4d7c0f, accent: 0x78b159 };
    case "wood":
      return { fill: 0x163c1b, fillDark: 0x0e2611, border: 0x24582c, accent: 0x15803d };
    case "hill":
      return { fill: 0x6e5c46, fillDark: 0x473b2b, border: 0x8f785b, accent: 0xb59e7f };
    case "waste":
      return { fill: 0x3d271d, fillDark: 0x24160f, border: 0x6e422f, accent: 0xcc5500 };
    case "shore":
      return { fill: 0x1a4f6e, fillDark: 0x0f3044, border: 0x297fae, accent: 0x4bb5eb };
    case "peak":
      return { fill: 0x4f5866, fillDark: 0x323842, border: 0x737f94, accent: 0xc8d2e6 };
    default:
      return { fill: 0x2a382c, fillDark: 0x1a241c, border: 0x445947, accent: 0x6e8a72 };
  }
}

// -------------------------------------------------------------
// Lords Mobile-Style Board Height Mapping
// -------------------------------------------------------------

/**
 * Returns height elevation face thickness in pixels for each terrain type.
 * Peaks tower high like real mountain ranges, hills form stepped plateaus,
 * wastes drop jagged basalt cliffs, woods form elevated groves,
 * plains form rich loam terraces, and shores meet the sea shelf.
 */
export function terrainElevation(terrain: TerrainId): number {
  switch (terrain) {
    case "peak": return 14;
    case "hill": return 9;
    case "waste": return 7;
    case "wood": return 5;
    case "plain": return 4;
    case "shore": return 1;
    default: return 4;
  }
}

/**
 * Renders the 3D vertical height face for a board terrain tile.
 * Features stratified rock layers, cliff facets, tree roots, sod cuts,
 * glowing lava cracks, or breaking foam surf according to terrain.
 */
export function paintTileHeightFace(
  g: Graphics,
  b: { x: number; y: number; w: number; h: number; cx: number; cy: number },
  terrain: TerrainId,
  pal: { fill: number; fillDark: number; border: number; accent: number },
  phase: number
): void {
  const elev = terrainElevation(terrain);
  if (elev <= 0) return;

  const wx = b.cx;
  const wy = b.cy;
  const hw = BOARD_HALF_W;
  const hh = BOARD_HALF_H;

  // 1. Front-left cliff face (moderate shadow, facing down-left)
  g.poly([
    wx - hw, wy - elev,
    wx, wy + hh - elev,
    wx, wy + hh,
    wx - hw, wy,
  ]);
  g.fill({ color: pal.fillDark });

  // 2. Front-right cliff face (deeper shadow, facing down-right)
  const cliffShadeRight = blendDark(pal.fillDark, 0.7);
  g.poly([
    wx, wy + hh - elev,
    wx + hw, wy - elev,
    wx + hw, wy,
    wx, wy + hh,
  ]);
  g.fill({ color: cliffShadeRight });

  // Center vertical prow seam between the two faces
  g.moveTo(wx, wy + hh - elev);
  g.lineTo(wx, wy + hh);
  g.stroke({ width: 1.2, color: 0x000000, alpha: 0.45 });

  // Top lip dividing strokes
  g.moveTo(wx - hw, wy - elev);
  g.lineTo(wx, wy + hh - elev);
  g.lineTo(wx + hw, wy - elev);
  g.stroke({ width: 1.2, color: pal.border, alpha: 0.85 });

  // Left bevel highlight
  g.moveTo(wx - hw, wy - elev);
  g.lineTo(wx - hw, wy);
  g.stroke({ width: 1, color: 0xffffff, alpha: 0.18 });

  // Right bevel shadow
  g.moveTo(wx + hw, wy - elev);
  g.lineTo(wx + hw, wy);
  g.stroke({ width: 1, color: 0x000000, alpha: 0.4 });

  // 3. Terrain-specific height face stratification
  switch (terrain) {
    case "peak": {
      // Tall alpine granite cliff face with vertical basalt fissures and meltwater streaks
      for (const lx of [wx - 14, wx - 6]) {
        const t = (lx - (wx - hw)) / hw;
        const topY = (wy - elev) + t * hh;
        const botY = wy + t * hh;
        g.moveTo(lx, topY);
        g.lineTo(lx + 0.5, botY);
        g.stroke({ width: 1.2, color: 0x0f172a, alpha: 0.85 });
        g.moveTo(lx + 1, topY);
        g.lineTo(lx + 1.5, botY);
        g.stroke({ width: 0.7, color: 0x475569, alpha: 0.6 });
      }

      for (const rx of [wx + 6, wx + 14]) {
        const t = (rx - wx) / hw;
        const topY = (wy + hh - elev) - t * hh;
        const botY = (wy + hh) - t * hh;
        g.moveTo(rx, topY);
        g.lineTo(rx - 0.5, botY);
        g.stroke({ width: 1.2, color: 0x0f172a, alpha: 0.9 });
      }

      // Vertical snow melt trickles
      g.moveTo(wx - 4, wy + hh * 0.7 - elev);
      g.lineTo(wx - 4, wy + hh * 0.7);
      g.stroke({ width: 1.1, color: 0xbae6fd, alpha: 0.85 });

      g.moveTo(wx + 4, wy + hh * 0.8 - elev);
      g.lineTo(wx + 4, wy + hh * 0.8);
      g.stroke({ width: 1.1, color: 0xf8fafc, alpha: 0.9 });
      break;
    }

    case "hill": {
      // Highland sedimentary strata lines along both cliff slopes
      g.moveTo(wx - hw + 2, wy - elev * 0.5);
      g.lineTo(wx - 1, wy + hh - elev * 0.5);
      g.stroke({ width: 1.0, color: 0x5a4635, alpha: 0.85 });

      g.moveTo(wx + 1, wy + hh - elev * 0.5);
      g.lineTo(wx + hw - 2, wy - elev * 0.5);
      g.stroke({ width: 1.0, color: 0x3a2b1f, alpha: 0.85 });

      // Overhanging turf fringe
      g.poly([wx - 10, wy + hh * 0.45 - elev, wx - 8, wy + hh * 0.45 - elev + 2.5, wx - 6, wy + hh * 0.45 - elev]);
      g.fill({ color: 0x65a30d });
      g.poly([wx + 6, wy + hh * 0.65 - elev, wx + 8, wy + hh * 0.65 - elev + 2.5, wx + 10, wy + hh * 0.65 - elev]);
      g.fill({ color: 0x65a30d });
      break;
    }

    case "wood": {
      // Dangling tangled roots along the earthen slope
      g.rect(wx - hw, wy - elev, hw * 2, 1.5);
      g.fill({ color: 0x15803d, alpha: 0.7 });

      for (const rx of [wx - 11, wx - 2, wx + 8]) {
        const isLeft = rx < wx;
        const t = isLeft ? (rx - (wx - hw)) / hw : (rx - wx) / hw;
        const topY = isLeft ? (wy - elev) + t * hh : (wy + hh - elev) - t * hh;
        g.moveTo(rx, topY + 1);
        g.lineTo(rx + (isLeft ? 1 : -1), topY + elev * 0.8);
        g.stroke({ width: 1.1, color: 0x78350f, alpha: 0.95 });
        g.moveTo(rx + 0.5, topY + 1);
        g.lineTo(rx + 0.5, topY + elev * 0.4);
        g.stroke({ width: 0.6, color: 0xa16207, alpha: 0.7 });
      }
      break;
    }

    case "plain": {
      // Grass sod lip along the top edge
      g.moveTo(wx - hw, wy - elev);
      g.lineTo(wx, wy + hh - elev);
      g.lineTo(wx + hw, wy - elev);
      g.stroke({ width: 1.8, color: 0x4d7c0f, alpha: 0.9 });
      break;
    }

    case "waste": {
      // Basalt crag with glowing magma fissures down the cliff face
      const pulse = Math.sin(phase * 3 + b.x) * 0.2 + 0.8;
      g.moveTo(wx, wy + hh - elev);
      g.lineTo(wx, wy + hh);
      g.stroke({ width: 2.8, color: 0x991b1b, alpha: 0.85 * pulse });
      g.moveTo(wx, wy + hh - elev);
      g.lineTo(wx, wy + hh);
      g.stroke({ width: 1.4, color: 0xf97316, alpha: 0.95 });
      g.moveTo(wx, wy + hh - elev + 1);
      g.lineTo(wx, wy + hh - 1);
      g.stroke({ width: 0.6, color: 0xfef08a, alpha: pulse });

      g.moveTo(wx - 8, wy + hh * 0.55 - elev);
      g.lineTo(wx - 7, wy + hh * 0.55);
      g.stroke({ width: 1.8, color: 0xef4444, alpha: 0.85 * pulse });
      g.moveTo(wx - 8, wy + hh * 0.55 - elev);
      g.lineTo(wx - 7, wy + hh * 0.55);
      g.stroke({ width: 0.8, color: 0xfef08a, alpha: pulse });
      break;
    }

    case "shore": {
      // Sea shelf waterline and frothing wash along the bottom edge
      const washShift = Math.sin(phase * 2.5 + b.x) * 1.2;
      g.moveTo(wx - hw, wy);
      g.lineTo(wx, wy + hh + washShift);
      g.lineTo(wx + hw, wy);
      g.stroke({ width: 1.8, color: 0xffffff, alpha: 0.95 });

      for (let sx = wx - 14; sx <= wx + 14; sx += 7) {
        const isLeft = sx < wx;
        const t = isLeft ? (sx - (wx - hw)) / hw : (sx - wx) / hw;
        const fy = isLeft ? wy + t * hh : (wy + hh) - t * hh;
        g.circle(sx, fy - 0.5, 1.2);
        g.fill({ color: 0xe0f2fe, alpha: 0.9 });
      }
      break;
    }
  }
}

/**
 * Fog as a Raised Cloud Mass for Unseen Provinces on the Board.
 * Volumetric billowing cumulus cloud plateau floating directly over the diamond tile.
 * Clearly distinguishable from solid terrain (mountain peaks, plains, hills, wastes) via:
 * - Floating aerial shadow cast on the tabletop plane below
 * - Translucent atmospheric celestial sky-mist base stratum (cool azure/slate undertone)
 * - Multi-tiered billowing cumulus cloud lobes with soft ambient underside and sunlit white crests
 * - Dynamic curving vapor wisps trailing off the cloud periphery
 * - Antique cartographic brass compass star glinting at the center
 * - Airy floating hover animation
 */
export function paintFogHeightVeil(
  g: Graphics,
  b: { x: number; y: number; w: number; h: number; cx: number; cy: number },
  p: Province,
  phase: number
): void {
  const wx = b.cx;
  const wy = b.cy;
  const hw = BOARD_HALF_W;
  const hh = BOARD_HALF_H;

  // 1. Soft diffused aerial shadow on tabletop (wider & softer than solid ground terrain)
  g.ellipse(wx, wy + 4, hw * 0.96, hh * 0.88);
  g.fill({ color: 0x000000, alpha: 0.22 });
  g.ellipse(wx, wy + 3, hw * 0.76, hh * 0.68);
  g.fill({ color: 0x0f172a, alpha: 0.18 });

  // 2. Continuous airy floating hover & wind drift
  const bob = Math.sin(phase * 1.5 + p.x * 0.7 + p.y * 0.9) * 1.4;
  const driftX = Math.cos(phase * 1.0 + p.x * 0.6) * 0.8;
  const cx = wx + driftX;
  const cy = wy - 8 + bob;

  // 3. Ethereal atmospheric sky-mist aura & base stratum (cool celestial azure undertone)
  // Outer translucent mist boundary spreading across the diamond footprint
  g.ellipse(cx, cy + 4.5, hw * 0.96, hh * 0.88);
  g.fill({ color: 0x38bdf8, alpha: 0.18 });

  // Deep atmospheric underside shadow (distinct from rock/ashlar stone)
  g.ellipse(cx, cy + 3.5, hw * 0.92, hh * 0.8);
  g.fill({ color: 0x475569, alpha: 0.45 });

  // Cool silver-slate vapor bed
  g.ellipse(cx, cy + 1.5, hw * 0.94, hh * 0.82);
  g.fill({ color: 0x94a3b8, alpha: 0.65 });
  g.ellipse(cx, cy, hw * 0.9, hh * 0.75);
  g.fill({ color: 0xcbd5e1, alpha: 0.85 });

  // 4. Multi-tiered billowing cumulus cloud lobes spanning the diamond
  // Lateral flanks and perimeter cloud lobes
  g.circle(cx - 13, cy - 1, 6.8); g.fill({ color: 0xdbeafe }); // cool celestial tint
  g.circle(cx + 13, cy - 1, 6.8); g.fill({ color: 0xdbeafe });
  g.circle(cx - 16, cy + 1, 5.0); g.fill({ color: 0xe2e8f0 });
  g.circle(cx + 16, cy + 1, 5.0); g.fill({ color: 0xe2e8f0 });
  g.circle(cx, cy - 6, 8.2); g.fill({ color: 0xe0f2fe });
  g.circle(cx, cy + 3.2, 7.8); g.fill({ color: 0xcbd5e1 });

  // Main volumetric cumulus mounds (pearl & soft white)
  g.circle(cx - 8, cy - 2, 8.2); g.fill({ color: 0xf1f5f9 });
  g.circle(cx + 8, cy - 2, 8.2); g.fill({ color: 0xf1f5f9 });
  g.circle(cx - 1, cy - 5, 9.0); g.fill({ color: 0xf8fafc });
  g.circle(cx + 1, cy + 1, 8.6); g.fill({ color: 0xffffff });
  g.circle(cx - 6, cy + 2.5, 6.8); g.fill({ color: 0xf8fafc });
  g.circle(cx + 7, cy + 2.5, 6.8); g.fill({ color: 0xf8fafc });

  // 5. Sunlit rounded crest highlights on billowing puffs (pure white 0xffffff)
  g.ellipse(cx - 2, cy - 8, 6.2, 3.2); g.fill({ color: 0xffffff });
  g.circle(cx - 7, cy - 4.5, 4.4); g.fill({ color: 0xffffff });
  g.circle(cx + 7, cy - 4.5, 4.4); g.fill({ color: 0xffffff });
  g.ellipse(cx + 1, cy - 0.5, 5.8, 3.2); g.fill({ color: 0xffffff });
  g.circle(cx + 13, cy - 2.5, 3.0); g.fill({ color: 0xffffff });
  g.circle(cx - 13, cy - 2.5, 3.0); g.fill({ color: 0xffffff });

  // 6. Curving vapor wisps and wind tendrils (unmistakable living mist trails)
  g.moveTo(cx - 15, cy - 4);
  g.quadraticCurveTo(cx - 19, cy - 6.5, cx - 22, cy - 4.5);
  g.stroke({ width: 0.9, color: 0xe0f2fe, alpha: 0.85 });

  g.moveTo(cx + 14, cy + 2.5);
  g.quadraticCurveTo(cx + 18, cy + 5, cx + 22, cy + 3);
  g.stroke({ width: 0.9, color: 0xe0f2fe, alpha: 0.85 });

  g.moveTo(cx - 6, cy - 9.5);
  g.quadraticCurveTo(cx, cy - 11.5, cx + 6, cy - 9.5);
  g.stroke({ width: 1.0, color: 0xffffff, alpha: 0.9 });

  // 7. Antique cartographer brass compass star & warm golden glint
  // 8-point compass rose glinting through the clouds
  g.poly([
    cx, cy - 6,
    cx + 1.4, cy - 1.6,
    cx + 5.5, cy,
    cx + 1.4, cy + 1.6,
    cx, cy + 6,
    cx - 1.4, cy + 1.6,
    cx - 5.5, cy,
    cx - 1.4, cy - 1.6,
  ]);
  g.fill({ color: 0xd4a359, alpha: 0.75 });
  g.stroke({ width: 0.4, color: 0x78350f, alpha: 0.6 });

  // Diagonal star points (ordinal pips)
  g.poly([
    cx - 2.8, cy - 2.8,
    cx, cy - 0.8,
    cx + 2.8, cy - 2.8,
    cx + 0.8, cy,
    cx + 2.8, cy + 2.8,
    cx, cy + 0.8,
    cx - 2.8, cy + 2.8,
    cx - 0.8, cy,
  ]);
  g.fill({ color: 0xb45309, alpha: 0.65 });

  // Center golden star glint
  g.circle(cx, cy, 1.4);
  g.fill({ color: 0xfef08a, alpha: 0.9 });
  g.circle(cx, cy, 0.6);
  g.fill({ color: 0xffffff, alpha: 0.95 });
}

// -------------------------------------------------------------
// Isometric Terrain Painter (Hold Band)
// -------------------------------------------------------------
export function paintIsometricGround(g: Graphics, visuals: ThemeVisuals): void {
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
        const dec = visuals.decorations;

        if (dec === "halloween") {
          if (hash === 4) {
            g.ellipse(wx + 2, wy + 1, 3.5, 2.8);
            g.fill({ color: 0xe85d04, alpha: 0.85 });
            g.rect(wx + 2, wy - 2, 1.2, 2);
            g.fill({ color: 0x3f6212, alpha: 0.9 });
          } else if (hash === 11) {
            g.circle(wx - 4, wy + 2, 1.5);
            g.fill({ color: 0xd6d3d1, alpha: 0.55 });
          }
        } else if (dec === "midwinter") {
          if (hash % 4 === 0) {
            g.ellipse(wx, wy + 1, 7, 3);
            g.fill({ color: 0xf8fafc, alpha: 0.55 });
            g.ellipse(wx + 1, wy + 2, 5, 2);
            g.fill({ color: 0xe2e8f0, alpha: 0.6 });
          } else if (hash === 5) {
            g.moveTo(wx - 4, wy + 2);
            g.lineTo(wx + 4, wy - 2);
            g.stroke({ width: 1.5, color: 0x166534, alpha: 0.85 });
            g.circle(wx - 1, wy, 1.3);
            g.fill({ color: 0xef4444, alpha: 0.9 });
            g.circle(wx + 1, wy - 1, 1.3);
            g.fill({ color: 0xdc2626, alpha: 0.9 });
          } else if (hash === 11) {
            g.moveTo(wx - 2, wy); g.lineTo(wx + 2, wy);
            g.moveTo(wx, wy - 2); g.lineTo(wx, wy + 2);
            g.stroke({ width: 1, color: 0xe0f2fe, alpha: 0.8 });
            g.circle(wx, wy, 1.2);
            g.fill({ color: 0xffffff, alpha: 0.9 });
          }
        } else if (dec === "easter") {
          if (hash === 5) {
            g.ellipse(wx, wy, 2.8, 3.6);
            g.fill({ color: 0xd8b4fe, alpha: 0.9 });
            g.rect(wx - 2, wy - 0.5, 4, 1.2);
            g.fill({ color: 0xfef08a, alpha: 0.95 });
          } else if (hash === 2) {
            g.circle(wx - 3, wy - 1, 1.8);
            g.fill({ color: 0xf472b6, alpha: 0.85 });
            g.circle(wx + 2, wy + 2, 1.6);
            g.fill({ color: 0xc084fc, alpha: 0.85 });
            g.circle(wx, wy, 1.2);
            g.fill({ color: 0xfde047, alpha: 0.9 });
          } else if (hash === 9) {
            g.poly([wx - 4, wy + 2, wx - 1, wy, wx + 4, wy + 3, wx + 2, wy + 4]);
            g.fill({ color: 0xfbcfe8, alpha: 0.85 });
          } else if (hash === 13) {
            g.ellipse(wx + 1, wy - 1, 2, 2.5);
            g.fill({ color: 0xf8fafc, alpha: 0.9 });
            g.circle(wx + 1, wy - 1, 1);
            g.fill({ color: 0xfacc15, alpha: 0.9 });
          }
        } else if (dec === "harvest") {
          if (hash === 2) {
            g.poly([wx - 2, wy + 3, wx - 3, wy - 3, wx + 3, wy - 3, wx + 2, wy + 3]);
            g.fill({ color: 0xca8a04, alpha: 0.9 });
            g.rect(wx - 2.5, wy - 0.5, 5, 1.2);
            g.fill({ color: 0x78350f, alpha: 0.95 });
            g.circle(wx - 1, wy - 3.5, 1.2);
            g.fill({ color: 0xfef08a, alpha: 0.9 });
            g.circle(wx + 1.5, wy - 3.5, 1.2);
            g.fill({ color: 0xfef08a, alpha: 0.9 });
          } else if (hash === 7) {
            g.ellipse(wx + 2, wy + 1, 3.4, 2.6);
            g.fill({ color: 0xea580c, alpha: 0.9 });
            g.rect(wx + 2, wy - 1.8, 1.2, 1.8);
            g.fill({ color: 0x65a30d, alpha: 0.9 });
          } else if (hash === 11) {
            g.rect(wx - 3, wy, 6, 3.5);
            g.fill({ color: 0x78350f, alpha: 0.85 });
            g.circle(wx - 1.5, wy - 1, 1.5);
            g.fill({ color: 0xdc2626, alpha: 0.95 });
            g.circle(wx + 1.5, wy - 1, 1.5);
            g.fill({ color: 0xb91c1c, alpha: 0.95 });
          } else if (hash === 15) {
            g.circle(wx - 2, wy, 1.5);
            g.fill({ color: 0xd97706, alpha: 0.8 });
            g.circle(wx + 3, wy + 1, 1.4);
            g.fill({ color: 0xb45309, alpha: 0.8 });
          }
        } else if (dec === "midsummer") {
          if (hash === 8) {
            g.circle(wx, wy, 2.6);
            g.fill({ color: 0xfbbf24, alpha: 0.9 });
            g.circle(wx, wy, 1.2);
            g.fill({ color: 0x451a03, alpha: 0.95 });
          } else if (hash === 3) {
            g.circle(wx + 2, wy - 1, 3.2);
            g.stroke({ width: 1.5, color: 0x16a34a, alpha: 0.85 });
            g.circle(wx + 1, wy - 3, 1.2);
            g.fill({ color: 0xf43f5e, alpha: 0.9 });
            g.circle(wx + 4, wy - 1, 1.2);
            g.fill({ color: 0xfacc15, alpha: 0.9 });
          } else if (hash === 12) {
            g.circle(wx - 2, wy + 1, 1.6);
            g.fill({ color: 0xfef08a, alpha: 0.85 });
            g.circle(wx + 3, wy - 2, 1.4);
            g.fill({ color: 0xffffff, alpha: 0.85 });
            g.circle(wx + 3, wy - 2, 0.8);
            g.fill({ color: 0xf59e0b, alpha: 0.9 });
          } else if (hash === 16) {
            g.ellipse(wx, wy + 2, 3, 1.8);
            g.fill({ color: 0xd4a373, alpha: 0.7 });
          }
        } else if (dec === "spring") {
          if (hash === 3) {
            g.circle(wx - 3, wy - 2, 1.4);
            g.fill({ color: 0xf472b6, alpha: 0.75 });
          } else if (hash === 7) {
            g.circle(wx + 4, wy + 1, 1.4);
            g.fill({ color: 0xfacc15, alpha: 0.75 });
          } else if (hash === 11) {
            g.circle(wx, wy, 1.3);
            g.fill({ color: 0x4ade80, alpha: 0.7 });
          }
        } else if (dec === "summer") {
          if (hash === 4) {
            g.circle(wx + 2, wy - 1, 1.5);
            g.fill({ color: 0xfacc15, alpha: 0.8 });
          } else if (hash === 10) {
            g.circle(wx - 2, wy + 1, 1.5);
            g.fill({ color: 0x84cc16, alpha: 0.75 });
          }
        } else if (dec === "autumn") {
          if (hash === 6) {
            g.circle(wx - 2, wy - 1, 1.6);
            g.fill({ color: 0xd97706, alpha: 0.75 });
            g.circle(wx + 3, wy + 2, 1.5);
            g.fill({ color: 0xb91c1c, alpha: 0.7 });
          } else if (hash === 12) {
            g.rect(wx - 1, wy, 2.5, 1.5);
            g.fill({ color: 0x78350f, alpha: 0.75 });
          }
        } else if (dec === "winter") {
          if (hash % 5 === 0) {
            g.ellipse(wx, wy + 1, 5, 2);
            g.fill({ color: 0xf1f5f9, alpha: 0.35 });
          } else if (hash === 7) {
            g.moveTo(wx - 2, wy); g.lineTo(wx + 2, wy);
            g.stroke({ width: 0.8, color: 0xbae6fd, alpha: 0.6 });
          }
        }
      }
    }
  }
}

// -------------------------------------------------------------
// Tabletop Board Diorama Backdrop
// -------------------------------------------------------------
export function paintBoardBackdrop(g: Graphics, visuals: ThemeVisuals): void {
  g.clear();

  // 1. Dark oiled walnut diorama table base
  g.rect(RIM_SIZE, RIM_SIZE, CANVAS_W - 2 * RIM_SIZE, CANVAS_H - 2 * RIM_SIZE);
  g.fill({ color: 0x120d09 });

  // 2. Beveled parchment diorama plinth framing the 12x8 isometric board
  // 12x8 isometric diamond board vertices with padding:
  // Top: (236, 43), Right: (500, 177), Bottom: (324, 267), Left: (60, 133)
  const pad = 10;
  const plinthPoly = [
    236, 43 - pad,
    500 + pad * 1.4, 177 - pad * 0.4,
    500 + pad * 1.4, 177 + pad * 0.6,
    324 + pad * 0.4, 267 + pad * 1.2,
    324 - pad * 0.4, 267 + pad * 1.2,
    60 - pad * 1.4, 133 + pad * 0.6,
    60 - pad * 1.4, 133 - pad * 0.4,
  ];

  // Soft drop shadow under plinth
  g.poly(plinthPoly.map((v, i) => (i % 2 === 1 ? v + 4 : v + 2)));
  g.fill({ color: 0x000000, alpha: 0.45 });

  // Plinth surface
  g.poly(plinthPoly);
  g.fill({ color: 0x1a1510 });
  g.stroke({ width: 1.8, color: 0x45311e, alpha: 0.9 });

  // Inner subtle brass inlay
  const innerPoly = [
    236, 43 - pad + 3,
    500 + pad * 1.4 - 3, 177,
    324, 267 + pad * 1.2 - 3,
    60 - pad * 1.4 + 3, 133,
  ];
  g.poly(innerPoly);
  g.stroke({ width: 1, color: 0xc8963e, alpha: 0.35 });

  // 3. Brass corner rivets on the plinth
  const rivets = [
    { x: 236, y: 43 - pad + 5 },
    { x: 500 + pad * 1.4 - 5, y: 177 },
    { x: 324, y: 267 + pad * 1.2 - 5 },
    { x: 60 - pad * 1.4 + 5, y: 133 },
  ];
  for (const r of rivets) {
    g.circle(r.x, r.y, 2);
    g.fill({ color: 0xc8963e });
    g.circle(r.x, r.y, 1);
    g.fill({ color: 0xfde047 });
  }

  // 4. Antique Cartographer Compass Rose in upper right corner of table
  const crX = CANVAS_W - RIM_SIZE - 28;
  const crY = RIM_SIZE + 28;
  g.poly([crX, crY - 10, crX + 3, crY, crX, crY + 10, crX - 3, crY]);
  g.fill({ color: 0xc8963e, alpha: 0.65 });
  g.poly([crX - 10, crY, crX, crY + 3, crX + 10, crY, crX, crY - 3]);
  g.fill({ color: 0x78350f, alpha: 0.65 });
  g.circle(crX, crY, 2);
  g.fill({ color: 0xfde047, alpha: 0.85 });
}
