import { Graphics } from "pixi.js";
import { BOARD_W, BOARD_H } from "@second-crown/shared";

export type CameraBand = "hold" | "board";

export const ZOOM_THRESHOLD = 0.70;
export const BOARD_DEFAULT_ZOOM = 0.58;
export const HOLD_DEFAULT_ZOOM = 1.0;
export const MIN_CAMERA_ZOOM = 0.45;
export const MAX_CAMERA_ZOOM = 2.2;

// Tabletop Board Layout Constants (8 columns x 6 rows)
export const CHIP_W = 56;
export const CHIP_H = 46;
export const GAP_X = 6;
export const GAP_Y = 6;
export const ORIGIN_BOARD_X = 35;
export const ORIGIN_BOARD_Y = 27;

// Canvas viewport configuration
export const CANVAS_W = 560;
export const CANVAS_H = 360;
export const ORIGIN_X = 220;
export const ORIGIN_Y = 64;
export const RIM_SIZE = 16; // Wooden table rim border thickness

// Hold isometric tile geometry
export const TILE_W = 40;
export const TILE_H = 20;
export const HALF_W = TILE_W / 2; // 20
export const HALF_H = TILE_H / 2; // 10

export function bandForZoom(zoom: number): CameraBand {
  return zoom <= ZOOM_THRESHOLD ? "board" : "hold";
}

export function provinceTokenBounds(bx: number, by: number): {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
} {
  const x = ORIGIN_BOARD_X + bx * (CHIP_W + GAP_X);
  const y = ORIGIN_BOARD_Y + by * (CHIP_H + GAP_Y);
  return {
    x,
    y,
    w: CHIP_W,
    h: CHIP_H,
    cx: x + CHIP_W / 2,
    cy: y + CHIP_H / 2,
  };
}

export function hitTestProvince(boardX: number, boardY: number): { bx: number; by: number } | null {
  for (let by = 0; by < BOARD_H; by++) {
    for (let bx = 0; bx < BOARD_W; bx++) {
      const b = provinceTokenBounds(bx, by);
      if (boardX >= b.x && boardX <= b.x + b.w && boardY >= b.y && boardY <= b.y + b.h) {
        return { bx, by };
      }
    }
  }
  return null;
}

export function calculateMarchProgress(tick: number, arrivesTick: number, dist: number): number {
  const totalTicks = Math.max(1, dist * 15);
  const startTick = arrivesTick - totalTicks;
  if (tick <= startTick) return 0;
  if (tick >= arrivesTick) return 1;
  return (tick - startTick) / totalTicks;
}

// Convert grid (gx, gy) to world space center (wx, wy)
export function gridToWorld(gx: number, gy: number): { wx: number; wy: number } {
  return {
    wx: ORIGIN_X + (gx - gy) * HALF_W,
    wy: ORIGIN_Y + (gx + gy) * HALF_H,
  };
}

// Convert world space (wx, wy) to grid coordinates (gx, gy)
export function worldToGrid(wx: number, wy: number): { gx: number; gy: number } {
  const dx = wx - ORIGIN_X;
  const dy = wy - ORIGIN_Y;
  const gx = Math.floor(dx / TILE_W + dy / TILE_H);
  const gy = Math.floor(dy / TILE_H - dx / TILE_W);
  return { gx, gy };
}

// -------------------------------------------------------------
// Hardwood Table Rim & Board Border Painter
// -------------------------------------------------------------
export function paintTableRim(g: Graphics): void {
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
}
