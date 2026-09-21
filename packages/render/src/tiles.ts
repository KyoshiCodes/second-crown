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
} from "./camera.js";

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
    case "peak": return 13;
    case "hill": return 9;
    case "waste": return 8;
    case "wood": return 6;
    case "plain": return 5;
    case "shore": return 3;
    default: return 5;
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
  const faceH = elev + 2;
  const faceY = b.y + b.h - faceH;

  // 1. Base Cliff Face Block
  g.rect(b.x, faceY, b.w, faceH);
  g.fill({ color: pal.fillDark });

  // 2. Front vertical cliff dividing groove / top lip
  g.moveTo(b.x, faceY);
  g.lineTo(b.x + b.w, faceY);
  g.stroke({ width: 1.2, color: pal.border, alpha: 0.9 });

  // Left bevel highlight
  g.moveTo(b.x, faceY);
  g.lineTo(b.x, b.y + b.h);
  g.stroke({ width: 1, color: 0xffffff, alpha: 0.15 });

  // Right bevel shadow
  g.moveTo(b.x + b.w, faceY);
  g.lineTo(b.x + b.w, b.y + b.h);
  g.stroke({ width: 1, color: 0x000000, alpha: 0.35 });

  // 3. Terrain-specific height face stratification
  switch (terrain) {
    case "peak": {
      // Tall alpine granite cliff face with vertical chiseled clefts and meltwater streaks
      g.rect(b.x, faceY, b.w, faceH);
      g.fill({ color: 0x1e293b });

      // Vertical basalt & granite rock column strata
      for (const rx of [b.x + 8, b.x + 18, b.x + 30, b.x + 42, b.x + 50]) {
        g.moveTo(rx, faceY);
        g.lineTo(rx + (rx % 3 - 1), b.y + b.h);
        g.stroke({ width: 1.2, color: 0x0f172a, alpha: 0.8 });
        // Granite facet highlight
        g.moveTo(rx + 1.5, faceY);
        g.lineTo(rx + 1.5, b.y + b.h);
        g.stroke({ width: 0.8, color: 0x475569, alpha: 0.65 });
      }

      // Vertical snow melt streaks trickling down the rock face
      g.moveTo(b.x + 14, faceY);
      g.lineTo(b.x + 14, faceY + faceH * 0.7);
      g.stroke({ width: 1, color: 0xbae6fd, alpha: 0.85 });

      g.moveTo(b.x + 36, faceY);
      g.lineTo(b.x + 37, faceY + faceH * 0.85);
      g.stroke({ width: 1.2, color: 0xf8fafc, alpha: 0.9 });

      // Talus scree along the foot of the cliff
      for (let sx = b.x + 4; sx < b.x + b.w - 4; sx += 7) {
        g.poly([sx - 2, b.y + b.h, sx, b.y + b.h - 2.5, sx + 2, b.y + b.h]);
        g.fill({ color: 0x334155 });
      }
      break;
    }

    case "hill": {
      // Highland contour terrace: earthen clay strata and overhanging sod lip
      g.rect(b.x, faceY, b.w, faceH);
      g.fill({ color: 0x3e3226 });

      // Horizontal geological sedimentary strata lines
      g.moveTo(b.x + 1, faceY + faceH * 0.45);
      g.lineTo(b.x + b.w - 1, faceY + faceH * 0.45);
      g.stroke({ width: 1, color: 0x5a4635, alpha: 0.85 });

      g.moveTo(b.x + 2, faceY + faceH * 0.75);
      g.lineTo(b.x + b.w - 2, faceY + faceH * 0.75);
      g.stroke({ width: 0.9, color: 0x2b2219, alpha: 0.75 });

      // Overhanging highland turf fringe at the top edge
      for (let tx = b.x + 3; tx < b.x + b.w - 3; tx += 6) {
        g.poly([tx - 2, faceY, tx, faceY + 2.4, tx + 2, faceY]);
        g.fill({ color: 0x65a30d });
      }

      // Exposed bedrock stones embedded in the cliff face
      g.rect(b.x + 12, faceY + 3, 4.5, 2.2);
      g.fill({ color: 0x78716c });
      g.rect(b.x + 38, faceY + 4, 5, 2.5);
      g.fill({ color: 0x78716c });
      break;
    }

    case "wood": {
      // Forest bluff: rich dark loam, tangled roots dangling down, mossy brow
      g.rect(b.x, faceY, b.w, faceH);
      g.fill({ color: 0x181008 });

      // Mossy brow on the lip
      g.rect(b.x, faceY, b.w, 1.8);
      g.fill({ color: 0x15803d });

      // Dangling tangled tree roots
      for (const [rx, rlen] of [
        [b.x + 9, faceH * 0.8],
        [b.x + 21, faceH * 0.95],
        [b.x + 33, faceH * 0.75],
        [b.x + 47, faceH * 0.85],
      ]) {
        g.moveTo(rx, faceY + 1);
        g.lineTo(rx + 1, faceY + rlen * 0.5);
        g.lineTo(rx - 0.5, faceY + rlen);
        g.stroke({ width: 1.1, color: 0x78350f, alpha: 0.95 });
        // Root highlight
        g.moveTo(rx + 0.8, faceY + 1);
        g.lineTo(rx + 0.8, faceY + rlen * 0.4);
        g.stroke({ width: 0.6, color: 0xa16207, alpha: 0.7 });
      }
      break;
    }

    case "plain": {
      // Pastoral turf cut: vibrant grass sod top layer + fertile dark loam
      g.rect(b.x, faceY, b.w, faceH);
      g.fill({ color: 0x23170c });

      // Green grass sod layer
      g.rect(b.x, faceY, b.w, 2);
      g.fill({ color: 0x4d7c0f });

      // Fine rootlets
      for (let fx = b.x + 6; fx < b.x + b.w - 5; fx += 8) {
        g.moveTo(fx, faceY + 2);
        g.lineTo(fx + (fx % 2 === 0 ? 1 : -1), faceY + 4.5);
        g.stroke({ width: 0.8, color: 0x854d0e, alpha: 0.75 });
      }
      break;
    }

    case "waste": {
      // Scorched basalt crag cliff with vertical glowing magma fissures
      g.rect(b.x, faceY, b.w, faceH);
      g.fill({ color: 0x140e0a });

      const pulse = Math.sin(phase * 3 + b.x) * 0.2 + 0.8;

      // Volcanic magma fissure fissures cracking vertically through the cliff face
      for (const [vx, vOffset] of [
        [b.x + 12, 0],
        [b.x + 28, 1.5],
        [b.x + 44, 0.8],
      ]) {
        const vPulse = Math.sin(phase * 4 + vx) * 0.25 + 0.75;
        // 1. Broad crimson magma glow
        g.moveTo(vx, faceY);
        g.lineTo(vx - 1.5, faceY + faceH * 0.5);
        g.lineTo(vx + 1, b.y + b.h);
        g.stroke({ width: 3.2, color: 0x991b1b, alpha: 0.8 * vPulse });

        // 2. Intense bright orange molten lava core
        g.moveTo(vx, faceY);
        g.lineTo(vx - 1.5, faceY + faceH * 0.5);
        g.lineTo(vx + 1, b.y + b.h);
        g.stroke({ width: 1.6, color: 0xf97316, alpha: 0.95 });

        // 3. Incandescent golden-yellow heat thread
        g.moveTo(vx, faceY + 1);
        g.lineTo(vx - 1.5, faceY + faceH * 0.5);
        g.lineTo(vx + 1, b.y + b.h - 1);
        g.stroke({ width: 0.7, color: 0xfef08a, alpha: pulse });
      }
      break;
    }

    case "shore": {
      // Coastal sea shelf: sandstone ledge, wet tideline, and frothing surf wash
      g.rect(b.x, faceY, b.w, faceH);
      g.fill({ color: 0x6e4b1b });

      // Dark wet tideline notch
      g.moveTo(b.x, faceY + faceH * 0.5);
      g.lineTo(b.x + b.w, faceY + faceH * 0.5);
      g.stroke({ width: 1, color: 0x3d2710, alpha: 0.85 });

      // Foaming white wash along the sea-shelf baseline
      const washShift = Math.sin(phase * 2.5 + b.x) * 1.5;
      g.moveTo(b.x, b.y + b.h - 1);
      g.bezierCurveTo(b.cx - 10, b.y + b.h - 2.5 + washShift, b.cx + 10, b.y + b.h - 0.5 - washShift, b.x + b.w, b.y + b.h - 1);
      g.stroke({ width: 1.8, color: 0xffffff, alpha: 0.95 });

      for (let sx = b.x + 5; sx < b.x + b.w - 4; sx += 9) {
        g.circle(sx, b.y + b.h - 1.5, 1.2);
        g.fill({ color: 0xe0f2fe, alpha: 0.9 });
      }
      break;
    }
  }
}

/**
 * Fog as a Height Veil for Unseen Provinces on the Board.
 * Conceals unknown terrain beneath a towering, billowing volumetric cloud plateau.
 */
export function paintFogHeightVeil(
  g: Graphics,
  b: { x: number; y: number; w: number; h: number; cx: number; cy: number },
  p: Province,
  phase: number
): void {
  const veilElev = 10;
  const faceH = veilElev + 2;
  const faceY = b.y + b.h - faceH;

  // 1. Deep 3D drop shadow onto board
  g.rect(b.x + 2, b.y + 4, b.w, b.h + 2);
  g.fill({ color: 0x000000, alpha: 0.42 });

  // 2. Shaded Cloud Veil Height Face (Bottom Mist Stratum)
  g.rect(b.x, faceY, b.w, faceH);
  g.fill({ color: 0x1a1622 });

  // Rolling vapor lobes in height face
  const fogWave = Math.sin(phase * 1.6 + p.x * 0.8 + p.y * 0.9) * 2;
  for (let lx = b.x + 5; lx <= b.x + b.w - 5; lx += 11) {
    const lobePulse = Math.sin(phase * 2 + lx) * 1.2;
    g.ellipse(lx, faceY + faceH * 0.55 + lobePulse * 0.3, 7, faceH * 0.4);
    g.fill({ color: 0x282234 });
    g.ellipse(lx, faceY + faceH * 0.4 + lobePulse * 0.2, 5, faceH * 0.3);
    g.fill({ color: 0x362f44 });
  }

  // Lip dividing line between top veil and height face
  g.moveTo(b.x, faceY);
  g.lineTo(b.x + b.w, faceY);
  g.stroke({ width: 1.4, color: 0x544766, alpha: 0.75 });

  // 3. Cloud Plateau Face (Raised Top Surface)
  g.rect(b.x, b.y, b.w, b.h - faceH + 2);
  g.fill({ color: 0x2e2738 });

  // Pearlescent cloud crests
  g.poly([
    b.x + 1, b.y + 1,
    b.x + b.w - 1, b.y + 1,
    b.x + b.w - 1, b.y + 12,
    b.cx + 8, b.y + 16,
    b.cx - 10, b.y + 10,
    b.x + 1, b.y + 14,
  ]);
  g.fill({ color: 0x3d334a, alpha: 0.85 });

  // Top highlight rim
  g.moveTo(b.x + 1, b.y + 1);
  g.lineTo(b.x + b.w - 1, b.y + 1);
  g.stroke({ width: 1.2, color: 0xffffff, alpha: 0.18 });

  // Outer chip border
  g.rect(b.x, b.y, b.w, b.h);
  g.stroke({ width: 1.2, color: 0x534464, alpha: 0.85 });

  const cx = b.cx;
  const cy = b.cy - 3;

  // 4. Volumetric Shifting Cloud Tendrils & Mist Curtains
  g.moveTo(cx - 18, cy - 6 + fogWave * 0.6);
  g.bezierCurveTo(cx - 9, cy - 10 + fogWave, cx + 7, cy - 3 - fogWave, cx + 18, cy - 8 - fogWave * 0.5);
  g.stroke({ width: 2.0, color: 0x7c698f, alpha: 0.45 });

  g.moveTo(cx - 16, cy + 3 - fogWave * 0.5);
  g.bezierCurveTo(cx - 5, cy - 1 - fogWave, cx + 9, cy + 6 + fogWave, cx + 16, cy + 1 + fogWave * 0.5);
  g.stroke({ width: 1.8, color: 0x6b5a7d, alpha: 0.4 });

  // Ethereal cloud puffs
  g.ellipse(cx - 8, cy - 2, 8, 4.5);
  g.fill({ color: 0x4f435e, alpha: 0.55 });
  g.ellipse(cx + 7, cy + 1, 9, 5);
  g.fill({ color: 0x483d56, alpha: 0.5 });

  // Faint cartographer's parchment compass mark peeking through the clouds
  g.circle(cx, cy, 2);
  g.fill({ color: 0x8b7aa1, alpha: 0.5 });
  g.circle(cx, cy, 1);
  g.fill({ color: 0xd8b4fe, alpha: 0.6 });
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
  g.fill({ color: 0x14100c });

  // 2. Inner parchment board surface for the 8x6 grid
  const boardX = ORIGIN_BOARD_X - 6;
  const boardY = ORIGIN_BOARD_Y - 6;
  const boardW = 8 * (CHIP_W + GAP_X) - GAP_X + 12;
  const boardH = 6 * (CHIP_H + GAP_Y) - GAP_Y + 12;

  g.rect(boardX, boardY, boardW, boardH);
  g.fill({ color: 0x1a1510 });
  g.stroke({ width: 1.5, color: 0x45311e, alpha: 0.9 });

  // 3. Subtle grid lines interconnecting tabletop provinces
  for (let bx = 0; bx < BOARD_W; bx++) {
    const b = provinceTokenBounds(bx, 0);
    g.moveTo(b.cx, boardY);
    g.lineTo(b.cx, boardY + boardH);
    g.stroke({ width: 1, color: 0x2e2116, alpha: 0.4 });
  }
  for (let by = 0; by < BOARD_H; by++) {
    const b = provinceTokenBounds(0, by);
    g.moveTo(boardX, b.cy);
    g.lineTo(boardX + boardW, b.cy);
    g.stroke({ width: 1, color: 0x2e2116, alpha: 0.4 });
  }

  // 4. Subtle brass studs at grid corners
  const corners = [
    { x: boardX + 3, y: boardY + 3 },
    { x: boardX + boardW - 3, y: boardY + 3 },
    { x: boardX + 3, y: boardY + boardH - 3 },
    { x: boardX + boardW - 3, y: boardY + boardH - 3 },
  ];
  for (const c of corners) {
    g.circle(c.x, c.y, 2);
    g.fill({ color: 0xc8963e });
  }

  // 5. Compass Rose in top right corner
  const crX = boardX + boardW - 22;
  const crY = boardY + 16;
  g.poly([crX, crY - 8, crX + 2.5, crY, crX, crY + 8, crX - 2.5, crY]);
  g.fill({ color: 0xc8963e, alpha: 0.55 });
  g.poly([crX - 8, crY, crX, crY + 2.5, crX + 8, crY, crX, crY - 2.5]);
  g.fill({ color: 0x78350f, alpha: 0.55 });
  g.circle(crX, crY, 1.5);
  g.fill({ color: 0xfde047, alpha: 0.8 });
}
