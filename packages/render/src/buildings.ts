import { Graphics } from "pixi.js";
import { getBuildingType } from "@second-crown/sim";
import * as sim from "@second-crown/sim";
import { HALF_W, HALF_H, TILE_W, TILE_H } from "./camera.js";
import { GRID_W, GRID_H, isRimTile, rimWalkIndex, getRimTileAt, type RimNeighbors, type RimFort, type ThemeVisuals } from "./tiles.js";

export interface CultureVisualPalette {
  id: string;
  tabard: number;
  timber: number;
  stone: number;
  accent: number;
  tabardHex: string;
  timberHex: string;
  stoneHex: string;
  accentHex: string;
}

export function parseHexColor(hex: string): number {
  return parseInt(hex.replace(/^#/, ""), 16);
}

export function blendDark(col: number, factor: number): number {
  const r = Math.floor(((col >> 16) & 0xff) * factor);
  const g = Math.floor(((col >> 8) & 0xff) * factor);
  const b = Math.floor((col & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

export function blendLight(col: number, factor: number): number {
  const r = Math.min(255, Math.floor(((col >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.floor(((col >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.floor((col & 0xff) * factor));
  return (r << 16) | (g << 8) | b;
}

export type CultureKit = "western" | "cedar" | "sand" | "steppe" | "islands";

/**
 * Resolves any raw culture ID (including sim content IDs like woodland/desert/tide)
 * to one of the 5 canonical culture kit presentation styles.
 */
export function resolveCultureKit(cultureId?: string): CultureKit {
  if (!cultureId) return "western";
  const lower = cultureId.toLowerCase().trim();
  if (lower === "cedar" || lower === "woodland") return "cedar";
  if (lower === "sand" || lower === "desert") return "sand";
  if (lower === "steppe") return "steppe";
  if (lower === "islands" || lower === "tide") return "islands";
  return "western";
}

export function culturePalette(cultureId?: string): CultureVisualPalette {
  let simLookupId = cultureId;
  const kit = resolveCultureKit(cultureId);
  if (cultureId) {
    if (kit === "cedar" && cultureId !== "woodland") simLookupId = "woodland";
    else if (kit === "sand" && cultureId !== "desert") simLookupId = "desert";
    else if (kit === "islands" && cultureId !== "tide") simLookupId = "tide";
  }
  const def = sim.getCulture ? sim.getCulture(simLookupId) : null;
  const tabard = def?.palette?.tabard ?? "#1e40af";
  const timber = def?.palette?.timber ?? "#5c3818";
  const stone = def?.palette?.stone ?? "#64748b";
  const accentHex =
    kit === "cedar"
      ? "#ca8a04"
      : kit === "sand"
      ? "#facc15"
      : kit === "steppe"
      ? "#facc15"
      : kit === "islands"
      ? "#06b6d4"
      : "#facc15";
  return {
    id: def?.id ?? (cultureId || "western"),
    tabardHex: tabard,
    timberHex: timber,
    stoneHex: stone,
    accentHex,
    tabard: parseHexColor(tabard),
    timber: parseHexColor(timber),
    stone: parseHexColor(stone),
    accent: parseHexColor(accentHex),
  };
}


export function getThemeVisuals(season: string, holiday: string): ThemeVisuals {
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
// Isometric Hold Building Drawers (Culture Kits & Silhouettes)
// -------------------------------------------------------------
interface WallColors {
  plinthCol: number;
  wallSunlitCol: number;
  wallShadedCol: number;
  mortarCol: number;
  walkCol: number;
  walkPlankCol: number;
  merlonSunlitCol: number;
  merlonShadedCol: number;
  merlonCopingCol: number;
  arrowSlitCol: number;
}

function getWallColors(kit: CultureKit, _cult?: CultureVisualPalette): WallColors {
  const plinthCol =
    kit === "cedar"
      ? 0x27272a
      : kit === "sand"
      ? 0x78350f
      : kit === "steppe"
      ? 0x44403c
      : kit === "islands"
      ? 0x334155
      : 0x334155;

  const wallSunlitCol =
    kit === "cedar"
      ? 0x854d0e
      : kit === "sand"
      ? 0xd4a373
      : kit === "steppe"
      ? 0x713f12
      : kit === "islands"
      ? 0x94a3b8
      : 0x64748b;

  const wallShadedCol =
    kit === "cedar"
      ? 0x5c3818
      : kit === "sand"
      ? 0xa16207
      : kit === "steppe"
      ? 0x543007
      : kit === "islands"
      ? 0x64748b
      : 0x475569;

  const mortarCol =
    kit === "cedar"
      ? 0x3f220c
      : kit === "sand"
      ? 0x78350f
      : kit === "steppe"
      ? 0x291807
      : kit === "islands"
      ? 0x78350f
      : 0x1e293b;

  const walkCol =
    kit === "cedar"
      ? 0x78350f
      : kit === "sand"
      ? 0xc29d62
      : kit === "steppe"
      ? 0x5c3818
      : kit === "islands"
      ? 0xa8a29e
      : 0x52525b;

  const walkPlankCol =
    kit === "cedar"
      ? 0x3f220c
      : kit === "sand"
      ? 0x8c7954
      : kit === "steppe"
      ? 0x291807
      : kit === "islands"
      ? 0x78350f
      : 0x78350f;

  const merlonSunlitCol =
    kit === "cedar"
      ? 0x854d0e
      : kit === "sand"
      ? 0xfde68a
      : kit === "steppe"
      ? 0x854d0e
      : kit === "islands"
      ? 0xd97706
      : 0x94a3b8;

  const merlonShadedCol =
    kit === "cedar"
      ? 0x5c3818
      : kit === "sand"
      ? 0xd4a373
      : kit === "steppe"
      ? 0x713f12
      : kit === "islands"
      ? 0xb45309
      : 0x64748b;

  const merlonCopingCol =
    kit === "cedar"
      ? 0xd97706
      : kit === "sand"
      ? 0xfef3c7
      : kit === "steppe"
      ? 0xd97706
      : kit === "islands"
      ? 0x06b6d4
      : 0xf1f5f9;

  const arrowSlitCol =
    kit === "cedar"
      ? 0x1c1917
      : kit === "sand"
      ? 0x451a03
      : kit === "steppe"
      ? 0x18181b
      : 0x0f172a;

  return {
    plinthCol,
    wallSunlitCol,
    wallShadedCol,
    mortarCol,
    walkCol,
    walkPlankCol,
    merlonSunlitCol,
    merlonShadedCol,
    merlonCopingCol,
    arrowSlitCol,
  };
}

interface SpanEdgeInfo {
  outX: number;
  outY: number;
  inX: number;
  inY: number;
  isFrontFacing: boolean;
  sunlit: boolean;
  faceX: number;
  faceY: number;
}

function getSpanEdgeInfo(gx: number, gy: number, targetX: number, targetY: number): SpanEdgeInfo {
  const isTop = gy === 0;
  const isRight = gx === GRID_W - 1;
  const isBottom = gy === GRID_H - 1;
  const isLeft = gx === 0;

  let edge: "top" | "right" | "bottom" | "left" = "bottom";

  if (isTop && !isLeft && !isRight) {
    edge = "top";
  } else if (isBottom && !isLeft && !isRight) {
    edge = "bottom";
  } else if (isLeft && !isTop && !isBottom) {
    edge = "left";
  } else if (isRight && !isTop && !isBottom) {
    edge = "right";
  } else {
    // Corner tile: determine edge from target direction
    if (isTop && isLeft) {
      edge = targetX > 0 && targetY > 0 ? "top" : "left";
    } else if (isTop && isRight) {
      edge = targetX < 0 && targetY < 0 ? "top" : "right";
    } else if (isBottom && isRight) {
      edge = targetX > 0 && targetY < 0 ? "right" : "bottom";
    } else if (isBottom && isLeft) {
      edge = targetX > 0 && targetY > 0 ? "bottom" : "left";
    }
  }

  if (edge === "top") {
    return {
      outX: 3.5,
      outY: -1.8,
      inX: -3.5,
      inY: 1.8,
      isFrontFacing: false,
      sunlit: true,
      faceX: -3.5,
      faceY: 1.8,
    };
  } else if (edge === "right") {
    return {
      outX: 3.5,
      outY: 1.8,
      inX: -3.5,
      inY: -1.8,
      isFrontFacing: true,
      sunlit: false,
      faceX: 3.5,
      faceY: 1.8,
    };
  } else if (edge === "bottom") {
    return {
      outX: -3.5,
      outY: 1.8,
      inX: 3.5,
      inY: -1.8,
      isFrontFacing: true,
      sunlit: true,
      faceX: -3.5,
      faceY: 1.8,
    };
  } else {
    // left
    return {
      outX: -3.5,
      outY: -1.8,
      inX: 3.5,
      inY: 1.8,
      isFrontFacing: false,
      sunlit: false,
      faceX: 3.5,
      faceY: 1.8,
    };
  }
}

function drawCurtainSpan(
  g: Graphics,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  edge: SpanEdgeInfo,
  h: number,
  a: number,
  kit: CultureKit,
  colors: WallColors,
  isTerminalStart: boolean = false,
  isTerminalEnd: boolean = false
): void {
  const faceX = edge.faceX;
  const faceY = edge.faceY;
  const faceCol = edge.sunlit ? colors.wallSunlitCol : colors.wallShadedCol;

  // 1. Foundation Plinth (bottom 3.5px)
  g.poly([
    x0 + faceX, y0 + faceY,
    x1 + faceX, y1 + faceY,
    x1 + faceX, y1 + faceY - 3.5,
    x0 + faceX, y0 + faceY - 3.5,
  ]);
  g.fill({ color: colors.plinthCol, alpha: a });

  // 2. Vertical Curtain Face
  g.poly([
    x0 + faceX, y0 + faceY - 3.5,
    x1 + faceX, y1 + faceY - 3.5,
    x1 + faceX, y1 + faceY - h,
    x0 + faceX, y0 + faceY - h,
  ]);
  g.fill({ color: faceCol, alpha: a });

  // 3. Horizontal Mortar / Course Scoring
  for (const f of [0.35, 0.70]) {
    const my0 = y0 + faceY - h * f;
    const my1 = y1 + faceY - h * f;
    g.moveTo(x0 + faceX, my0);
    g.lineTo(x1 + faceX, my1);
    g.stroke({ width: 0.8, color: colors.mortarCol, alpha: a * 0.65 });
  }

  // 4. Wall-Walk Top Walkway (at height -h)
  g.poly([
    x0 + edge.outX, y0 + edge.outY - h,
    x1 + edge.outX, y1 + edge.outY - h,
    x1 + edge.inX, y1 + edge.inY - h,
    x0 + edge.inX, y0 + edge.inY - h,
  ]);
  g.fill({ color: colors.walkCol, alpha: a });

  // Wall-walk centerline
  const mid0X = x0 + (edge.outX + edge.inX) * 0.5;
  const mid0Y = y0 + (edge.outY + edge.inY) * 0.5 - h;
  const mid1X = x1 + (edge.outX + edge.inX) * 0.5;
  const mid1Y = y1 + (edge.outY + edge.inY) * 0.5 - h;
  g.moveTo(mid0X, mid0Y);
  g.lineTo(mid1X, mid1Y);
  g.stroke({ width: 1.4, color: colors.walkPlankCol, alpha: a * 0.8 });

  // 5. Parapet Merlons along outer edge
  const dist = Math.hypot(x1 - x0, y1 - y0);
  if (dist > 3) {
    const steps = Math.max(1, Math.round(dist / 6.5));
    for (let i = 0; i < steps; i++) {
      const tStart = (i + 0.12) / steps;
      const tEnd = (i + 0.72) / steps;
      const mx0 = x0 + edge.outX + (x1 - x0) * tStart;
      const my0 = y0 + edge.outY - h + (y1 - y0) * tStart;
      const mx1 = x0 + edge.outX + (x1 - x0) * tEnd;
      const my1 = y0 + edge.outY - h + (y1 - y0) * tEnd;
      const mCol = edge.sunlit ? colors.merlonSunlitCol : colors.merlonShadedCol;

      if (kit === "cedar") {
        g.poly([
          mx0, my0,
          (mx0 + mx1) * 0.5, my0 - 4.5,
          mx1, my1,
          mx1, my1 - 2,
          mx0, my0 - 2,
        ]);
        g.fill({ color: mCol, alpha: a });
        g.moveTo((mx0 + mx1) * 0.5, my0 - 4.5);
        g.lineTo(mx1, my1);
        g.stroke({ width: 0.8, color: colors.merlonCopingCol, alpha: a * 0.8 });
      } else if (kit === "sand") {
        g.poly([
          mx0, my0,
          (mx0 + mx1) * 0.5, my0 - 4,
          mx1, my1,
          mx1, my1 - 2,
          mx0, my0 - 2,
        ]);
        g.fill({ color: mCol, alpha: a });
        g.moveTo(mx0, my0 - 2);
        g.lineTo((mx0 + mx1) * 0.5, my0 - 4);
        g.lineTo(mx1, my1 - 2);
        g.stroke({ width: 0.8, color: colors.merlonCopingCol, alpha: a * 0.9 });
      } else if (kit === "steppe") {
        g.poly([
          mx0, my0,
          mx1, my1,
          mx1, my1 - 3.5,
          mx0, my0 - 3.5,
        ]);
        g.fill({ color: mCol, alpha: a });
        g.moveTo(mx0, my0 - 1.5);
        g.lineTo(mx1, my1 - 1.5);
        g.stroke({ width: 0.8, color: colors.merlonCopingCol, alpha: a * 0.7 });
      } else if (kit === "islands") {
        g.poly([
          mx0, my0,
          mx1, my1,
          mx1, my1 - 3.5,
          mx0, my0 - 3.5,
        ]);
        g.fill({ color: mCol, alpha: a });
        g.moveTo(mx0, my0 - 3.5);
        g.lineTo(mx1, my1 - 3.5);
        g.stroke({ width: 0.9, color: colors.merlonCopingCol, alpha: a * 0.85 });
      } else {
        // Western
        g.poly([
          mx0, my0,
          mx1, my1,
          mx1, my1 - 3.5,
          mx0, my0 - 3.5,
        ]);
        g.fill({ color: mCol, alpha: a });
        g.moveTo(mx0, my0 - 3.5);
        g.lineTo(mx1, my1 - 3.5);
        g.stroke({ width: 0.8, color: colors.merlonCopingCol, alpha: a * 0.8 });
      }
    }
  }

  // 6. Terminal Caps
  if (isTerminalStart) {
    g.poly([
      x0 + edge.outX, y0 + edge.outY,
      x0 + edge.inX, y0 + edge.inY,
      x0 + edge.inX, y0 + edge.inY - h,
      x0 + edge.outX, y0 + edge.outY - h,
    ]);
    g.fill({ color: faceCol, alpha: a });
    g.rect(x0 + edge.outX - 1, y0 + edge.outY - h - 3.5, 2.5, 3.5);
    g.fill({ color: colors.merlonSunlitCol, alpha: a });
  }

  if (isTerminalEnd) {
    g.poly([
      x1 + edge.outX, y1 + edge.outY,
      x1 + edge.inX, y1 + edge.inY,
      x1 + edge.inX, y1 + edge.inY - h,
      x1 + edge.outX, y1 + edge.outY - h,
    ]);
    g.fill({ color: faceCol, alpha: a });
    g.rect(x1 + edge.outX - 1, y1 + edge.outY - h - 3.5, 2.5, 3.5);
    g.fill({ color: colors.merlonSunlitCol, alpha: a });
  }
}

function drawRimWallCurtain(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  gx: number,
  gy: number,
  rimNeighbors?: RimNeighbors,
  kit: CultureKit = "western",
  cult?: CultureVisualPalette
): void {
  const idx = rimWalkIndex(gx, gy);
  const prevIdx = (idx - 1 + 48) % 48;
  const nextIdx = (idx + 1) % 48;
  const pPrev = getRimTileAt(prevIdx);
  const pNext = getRimTileAt(nextIdx);

  const hasPrev = rimNeighbors?.hasPrev ?? false;
  const hasNext = rimNeighbors?.hasNext ?? false;

  const bPrevX = ((pPrev.x - gx - (pPrev.y - gy)) * HALF_W) / 2;
  const bPrevY = ((pPrev.x - gx + (pPrev.y - gy)) * HALF_H) / 2;
  const bNextX = ((pNext.x - gx - (pNext.y - gy)) * HALF_W) / 2;
  const bNextY = ((pNext.x - gx + (pNext.y - gy)) * HALF_H) / 2;

  const isTop = gy === 0;
  const isRight = gx === GRID_W - 1;
  const isBottom = gy === GRID_H - 1;
  const isLeft = gx === 0;
  const isCorner = (isTop && isLeft) || (isTop && isRight) || (isBottom && isRight) || (isBottom && isLeft);

  const edgePrev = getSpanEdgeInfo(gx, gy, bPrevX, bPrevY);
  const edgeNext = getSpanEdgeInfo(gx, gy, bNextX, bNextY);
  const colors = getWallColors(kit, cult);

  if (isCorner) {
    // Corner Bastion Tower at (0, 0)
    const towerH = h + 5;
    const tw = 7.5;

    // 1. Spans meeting under the corner tower
    if (hasPrev) {
      drawCurtainSpan(g, 0, 0, bPrevX, bPrevY, edgePrev, h, a, kit, colors, false, false);
    } else {
      drawCurtainSpan(g, 0, 0, bPrevX * 0.45, bPrevY * 0.45, edgePrev, h, a, kit, colors, false, true);
    }

    if (hasNext) {
      drawCurtainSpan(g, 0, 0, bNextX, bNextY, edgeNext, h, a, kit, colors, false, false);
    } else {
      drawCurtainSpan(g, 0, 0, bNextX * 0.45, bNextY * 0.45, edgeNext, h, a, kit, colors, false, true);
    }

    // 2. Corner Bastion Tower crowning the corner
    g.poly([-tw, 0, 0, tw * 0.5, tw, 0, 0, -tw * 0.5]);
    g.fill({ color: colors.plinthCol, alpha: a });

    g.poly([-tw, 0, 0, tw * 0.5, 0, tw * 0.5 - towerH, -tw, -towerH]);
    g.fill({ color: colors.wallSunlitCol, alpha: a });

    g.poly([0, tw * 0.5, tw, 0, tw, -towerH, 0, tw * 0.5 - towerH]);
    g.fill({ color: colors.wallShadedCol, alpha: a });

    g.poly([-tw, -towerH, 0, tw * 0.5 - towerH, tw, -towerH, 0, -tw * 0.5 - towerH]);
    g.fill({ color: colors.walkCol, alpha: a });

    // Tower battlements / crenellations
    g.rect(-tw, -towerH - 3.5, 3, 3.5);
    g.fill({ color: colors.merlonSunlitCol, alpha: a });
    g.moveTo(-tw, -towerH - 3.5); g.lineTo(-tw + 3, -towerH - 3.5);
    g.stroke({ width: 0.8, color: colors.merlonCopingCol, alpha: a * 0.8 });

    g.rect(-1.5, -towerH - 3.5 + tw * 0.5, 3, 3.5);
    g.fill({ color: colors.merlonSunlitCol, alpha: a });

    g.rect(tw - 3, -towerH - 3.5, 3, 3.5);
    g.fill({ color: colors.merlonShadedCol, alpha: a });
    g.moveTo(tw - 3, -towerH - 3.5); g.lineTo(tw, -towerH - 3.5);
    g.stroke({ width: 0.8, color: colors.merlonCopingCol, alpha: a * 0.8 });

    // Arrow loops on tower facets
    g.rect(-tw * 0.5 - 0.7, -towerH * 0.5, 1.4, 4);
    g.fill({ color: colors.arrowSlitCol, alpha: a });
    g.rect(tw * 0.5 - 0.7, -towerH * 0.5, 1.4, 4);
    g.fill({ color: colors.arrowSlitCol, alpha: a });

    // Cultural corner flag / beacon
    if (kit === "cedar") {
      g.rect(-1.5, -towerH - 8, 3, 8);
      g.fill({ color: 0x854d0e, alpha: a });
      const flameFlicker = Math.sin(phase * 4 + gx * 2) * 0.8;
      g.circle(0, -towerH - 10, 1.8 + flameFlicker * 0.3);
      g.fill({ color: 0xea580c, alpha: a });
    } else if (kit === "sand") {
      g.poly([0, -towerH - 7, 3, -towerH - 2, -3, -towerH - 2]);
      g.fill({ color: 0xfacc15, alpha: a });
      g.circle(0, -towerH - 8, 1.2);
      g.fill({ color: 0x0d9488, alpha: a });
    } else if (kit === "steppe") {
      g.moveTo(0, -towerH); g.lineTo(0, -towerH - 9);
      g.stroke({ width: 1.3, color: 0x291807, alpha: a });
      g.circle(0, -towerH - 9, 1.5);
      g.fill({ color: 0xdc2626, alpha: a });
    } else if (kit === "islands") {
      g.moveTo(0, -towerH); g.lineTo(0, -towerH - 8);
      g.stroke({ width: 1.2, color: 0xca8a04, alpha: a });
      g.circle(0, -towerH - 8, 1.6);
      g.fill({ color: 0x06b6d4, alpha: a });
    } else {
      // Western: corner flag pennant
      const pennantWave = Math.sin(phase * 4 + gx * 2) * 2;
      g.moveTo(0, -towerH); g.lineTo(0, -towerH - 10);
      g.stroke({ width: 1.2, color: 0xd4a359, alpha: a });
      g.poly([0, -towerH - 10, 7 + pennantWave, -towerH - 7, 0, -towerH - 4]);
      g.fill({ color: 0xb91c1c, alpha: a });
    }
    return;
  }

  // Straight Wall Run
  if (hasPrev && hasNext) {
    // Continuous stone curtain wall spanning cleanly across the entire tile!
    drawCurtainSpan(g, bPrevX, bPrevY, bNextX, bNextY, edgeNext, h, a, kit, colors, false, false);

    // Center Wall Buttress / Pilaster along visible face
    const midX = edgeNext.faceX;
    const midY = edgeNext.faceY;
    const isXAxis = isTop || isBottom;
    const px0 = isXAxis ? midX - 1.4 : midX - 1.4;
    const py0 = isXAxis ? midY - 0.7 : midY + 0.7;
    const px1 = isXAxis ? midX + 1.4 : midX + 1.4;
    const py1 = isXAxis ? midY + 0.7 : midY - 0.7;

    // Pilaster plinth
    g.poly([px0, py0, px1, py1, px1, py1 - 3.5, px0, py0 - 3.5]);
    g.fill({ color: colors.plinthCol, alpha: a });

    // Pilaster body rising to -h - 1
    g.poly([px0, py0 - 3.5, px1, py1 - 3.5, px1, py1 - h - 1, px0, py0 - h - 1]);
    g.fill({ color: edgeNext.sunlit ? colors.wallSunlitCol : colors.wallShadedCol, alpha: a });

    // Arrow slit in pilaster
    g.rect(midX - 0.7, midY - h * 0.45 - 2, 1.4, 4);
    g.fill({ color: colors.arrowSlitCol, alpha: a });

    // Cultural Wall Fixture
    if (kit === "cedar") {
      g.rect(midX - 2, midY - h * 0.75, 4, 3);
      g.fill({ color: 0xd4a359, alpha: a });
      const flameFlicker = Math.sin(phase * 4 + gx * 2) * 0.8;
      g.circle(midX, midY - h * 0.75 - 2, 1.6 + flameFlicker * 0.3);
      g.fill({ color: 0xea580c, alpha: a });
    } else if (kit === "sand") {
      g.rect(midX - 1, midY - h * 0.65, 2, 3);
      g.fill({ color: 0xb45309, alpha: a });
      g.circle(midX, midY - h * 0.65 - 2, 1.5);
      g.fill({ color: 0xfacc15, alpha: a });
    } else if (kit === "steppe") {
      g.moveTo(midX, midY - h * 0.4); g.lineTo(midX, midY - h * 0.4 - 5);
      g.stroke({ width: 1.1, color: 0x291807, alpha: a });
      g.circle(midX, midY - h * 0.4 - 5, 1.3);
      g.fill({ color: 0xdc2626, alpha: a });
    } else if (kit === "islands") {
      g.rect(midX - 1, midY - h * 0.65, 2, 3);
      g.fill({ color: 0x78350f, alpha: a });
      g.circle(midX, midY - h * 0.65 - 2, 1.5);
      g.fill({ color: 0x06b6d4, alpha: a });
    } else {
      // Western: iron torch sconce with flickering animated flame
      const flameFlicker = Math.sin(phase * 4 + gx * 2) * 0.8;
      g.rect(midX - 1, midY - h * 0.65, 2, 3);
      g.fill({ color: 0x27272a, alpha: a });
      g.circle(midX, midY - h * 0.65 - 2, 1.5 + flameFlicker * 0.3);
      g.fill({ color: 0xf97316, alpha: a });
      g.circle(midX, midY - h * 0.65 - 2, 0.7);
      g.fill({ color: 0xfef08a, alpha: a });
    }
  } else if (hasPrev && !hasNext) {
    // Terminating wall ending at (0, 0)
    drawCurtainSpan(g, bPrevX, bPrevY, 0, 0, edgePrev, h, a, kit, colors, false, true);
  } else if (!hasPrev && hasNext) {
    // Starting wall beginning at (0, 0)
    drawCurtainSpan(g, 0, 0, bNextX, bNextY, edgeNext, h, a, kit, colors, true, false);
  } else {
    // Isolated freestanding defensive bastion block
    const tw = 6;
    const towerH = h + 2;

    g.poly([-tw, 0, 0, tw * 0.5, tw, 0, 0, -tw * 0.5]);
    g.fill({ color: colors.plinthCol, alpha: a });

    g.poly([-tw, 0, 0, tw * 0.5, 0, tw * 0.5 - towerH, -tw, -towerH]);
    g.fill({ color: colors.wallSunlitCol, alpha: a });

    g.poly([0, tw * 0.5, tw, 0, tw, -towerH, 0, tw * 0.5 - towerH]);
    g.fill({ color: colors.wallShadedCol, alpha: a });

    g.poly([-tw, -towerH, 0, tw * 0.5 - towerH, tw, -towerH, 0, -tw * 0.5 - towerH]);
    g.fill({ color: colors.walkCol, alpha: a });

    g.rect(-tw, -towerH - 3, 2.5, 3); g.fill({ color: colors.merlonSunlitCol, alpha: a });
    g.rect(-1, -towerH - 3 + tw * 0.5, 2.5, 3); g.fill({ color: colors.merlonSunlitCol, alpha: a });
    g.rect(tw - 2.5, -towerH - 3, 2.5, 3); g.fill({ color: colors.merlonShadedCol, alpha: a });

    g.rect(-0.7, -towerH * 0.5, 1.4, 4);
    g.fill({ color: colors.arrowSlitCol, alpha: a });
  }
}

function drawGatehouseCurtainWings(
  g: Graphics,
  h: number,
  a: number,
  gx: number,
  gy: number,
  rimNeighbors: RimNeighbors,
  kit: CultureKit = "western",
  cult?: CultureVisualPalette
): void {
  const idx = rimWalkIndex(gx, gy);
  const prevIdx = (idx - 1 + 48) % 48;
  const nextIdx = (idx + 1) % 48;
  const pPrev = getRimTileAt(prevIdx);
  const pNext = getRimTileAt(nextIdx);

  const bPrevX = ((pPrev.x - gx - (pPrev.y - gy)) * HALF_W) / 2;
  const bPrevY = ((pPrev.x - gx + (pPrev.y - gy)) * HALF_H) / 2;
  const bNextX = ((pNext.x - gx - (pNext.y - gy)) * HALF_W) / 2;
  const bNextY = ((pNext.x - gx + (pNext.y - gy)) * HALF_H) / 2;

  const edgePrev = getSpanEdgeInfo(gx, gy, bPrevX, bPrevY);
  const edgeNext = getSpanEdgeInfo(gx, gy, bNextX, bNextY);
  const colors = getWallColors(kit, cult);

  // Map to left and right flanks in screen space
  const prevIsLeft = bPrevX < 0;

  const hasLeft = prevIsLeft ? rimNeighbors.hasPrev : rimNeighbors.hasNext;
  const bLeftX = prevIsLeft ? bPrevX : bNextX;
  const bLeftY = prevIsLeft ? bPrevY : bNextY;
  const edgeLeft = prevIsLeft ? edgePrev : edgeNext;

  const hasRight = prevIsLeft ? rimNeighbors.hasNext : rimNeighbors.hasPrev;
  const bRightX = prevIsLeft ? bNextX : bPrevX;
  const bRightY = prevIsLeft ? bNextY : bPrevY;
  const edgeRight = prevIsLeft ? edgeNext : edgePrev;

  if (hasLeft) {
    // Wing from gatehouse left bastion flank to bLeft
    drawCurtainSpan(g, bLeftX * 0.40, bLeftY * 0.40, bLeftX, bLeftY, edgeLeft, h, a, kit, colors, false, false);
  }

  if (hasRight) {
    // Wing from gatehouse right bastion flank to bRight
    drawCurtainSpan(g, bRightX * 0.40, bRightY * 0.40, bRightX, bRightY, edgeRight, h, a, kit, colors, false, false);
  }
}

// -------------------------------------------------------------
// Culture-Specific Building Silhouette Painters
// -------------------------------------------------------------
function drawFarmCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette,
  complete: boolean = true
): void {
  if (kit === "cedar") {
    // Cedar Kin: Timber Long Barn + Split-Rail Yard + Grain Crib + Woodland Garden
    g.poly([-16, 0, -2, 7, -2, 7 - h, -16, 0 - h]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.poly([-2, 7, 10, 1, 10, 1 - h, -2, 7 - h]);
    g.fill({ color: 0x5c3818, alpha: a });

    for (const f of [0.25, 0.5, 0.75]) {
      g.moveTo(-16, 0 - h * f); g.lineTo(-2, 7 - h * f);
      g.moveTo(-2, 7 - h * f); g.lineTo(10, 1 - h * f);
      g.stroke({ width: 1.1, color: 0x3f220c, alpha: a });
    }

    g.poly([-18, -h, -2, 9 - h - 12, 12, 1 - h, -4, -h - 18]);
    g.fill({ color: 0x654321, alpha: a });
    g.moveTo(-18, -h); g.lineTo(-2, 9 - h - 12); g.lineTo(12, 1 - h);
    g.stroke({ width: 1.4, color: 0x3f220c, alpha: a });
    g.moveTo(-18, -h); g.lineTo(-10, 3 - h);
    g.stroke({ width: 1.5, color: 0x166534, alpha: a * 0.8 });

    g.rect(4, -h - 16, 3.5, 8);
    g.fill({ color: 0x78716c, alpha: a });
    if (complete) {
      const cPuff = Math.sin(phase * 2) * 2;
      g.circle(6, -h - 19 + cPuff, 2.4);
      g.fill({ color: 0xe2e8f0, alpha: 0.45 * a });
      g.circle(8, -h - 23 + cPuff, 3);
      g.fill({ color: 0xf1f5f9, alpha: 0.3 * a });
    }

    g.rect(-10, 3 - h * 0.45, 4.5, 6);
    g.fill({ color: 0x3f220c, alpha: a });
    g.rect(2, -h * 0.4, 3, 3);
    g.fill({ color: 0xfef08a, alpha: a * 0.85 });

    // Split-Rail Yard: Zigzag split-cedar rail fencing
    const rails = [
      [-16, 3], [-11, 5.5], [-6, 3.5], [-1, 6], [5, 3], [11, 5.5]
    ];
    for (let i = 0; i < rails.length - 1; i++) {
      const [x1, y1] = rails[i];
      const [x2, y2] = rails[i + 1];
      g.moveTo(x1, y1 + 1.5); g.lineTo(x1, y1 - 3);
      g.moveTo(x1 - 1, y1 + 1.5); g.lineTo(x1 + 1, y1 - 2.5);
      g.stroke({ width: 0.9, color: 0x5c3818, alpha: a });
      g.moveTo(x1, y1); g.lineTo(x2, y2);
      g.moveTo(x1, y1 - 1.8); g.lineTo(x2, y2 - 1.8);
      g.stroke({ width: 1.1, color: 0x854d0e, alpha: a });
    }

    // Elevated Log Grain Crib
    g.moveTo(11, 3); g.lineTo(11, 6);
    g.moveTo(16, 1); g.lineTo(16, 4);
    g.stroke({ width: 1.2, color: 0x5c3818, alpha: a });
    g.rect(10, -2, 6.5, 5);
    g.fill({ color: 0x78350f, alpha: a });
    g.poly([9, -2, 13, -6, 17, -2]);
    g.fill({ color: 0x5c3818, alpha: a });

    // Woodland Berry Beds & Cedar Water Trough
    g.circle(-8, 7, 1.6); g.fill({ color: 0x166534, alpha: a });
    g.circle(-7.5, 6.5, 0.7); g.fill({ color: 0xef4444, alpha: a });
    g.circle(-4, 7.5, 1.8); g.fill({ color: 0x15803d, alpha: a });
    g.circle(-3.5, 7, 0.7); g.fill({ color: 0xef4444, alpha: a });
    g.rect(4, 5, 5, 2.5);
    g.fill({ color: 0x5c3818, alpha: a });
    g.rect(4.5, 5.5, 4, 1.5);
    g.fill({ color: 0x0284c7, alpha: a * 0.8 });

  } else if (kit === "sand") {
    // Sand Banner: Irrigated Terrace Garden + Flat-Roofed Mudbrick Shed + Date Palm + Cistern
    const sh = h * 0.82;
    g.poly([-16, 0, -2, 6.5, -2, 6.5 - sh, -16, 0 - sh]);
    g.fill({ color: 0xd6c7a1, alpha: a });
    g.poly([-2, 6.5, 9, 1, 9, 1 - sh, -2, 6.5 - sh]);
    g.fill({ color: 0xb8a77d, alpha: a });

    g.poly([-17, -sh, -2, 7.5 - sh, 10, 1.5 - sh, -5, -6 - sh]);
    g.fill({ color: 0x8c7954, alpha: a });
    g.stroke({ width: 1, color: 0xa89668, alpha: a });

    for (const vx of [-13, -9, -5]) {
      g.circle(vx, 3 - sh, 1.1);
      g.fill({ color: 0x78350f, alpha: a });
    }

    g.poly([-9, 4.5 - sh * 0.45, -5, 2.5 - sh * 0.45, -5, -sh * 0.45, -9, 1.5 - sh * 0.45]);
    g.fill({ color: 0x09090b, alpha: a });
    g.rect(-8.5, 3.5 - sh * 0.45, 3, 5);
    g.fill({ color: 0xb45309, alpha: a * 0.9 });

    // Irrigated Terraced Garden Plots
    g.poly([-14, 3, -4, 8, 4, 5, -6, 0]);
    g.fill({ color: 0x8c7954, alpha: a * 0.7 });
    g.moveTo(-13, 3); g.lineTo(-3, 8); g.lineTo(6, 4.5);
    g.stroke({ width: 2.2, color: 0x0284c7, alpha: a * 0.9 });
    g.rect(-4, 6.5, 2, 3);
    g.fill({ color: 0x78350f, alpha: a });

    g.circle(-10, 5, 1.4); g.fill({ color: 0x16a34a, alpha: a });
    g.circle(-7, 6.5, 1.5); g.fill({ color: 0x22c55e, alpha: a });
    g.circle(1, 6.5, 1.6); g.fill({ color: 0x15803d, alpha: a });

    // Date Palm Tree
    g.poly([11, 4, 13.5, 4, 13, -15, 11, -15]);
    g.fill({ color: 0x854d0e, alpha: a });
    for (let py = 1; py >= -13; py -= 3) {
      g.moveTo(11, py); g.lineTo(13.5, py);
      g.stroke({ width: 0.8, color: 0x5c3818, alpha: a });
    }
    const fronds = [
      [12, -15, 4, -20],
      [12, -15, 7, -24],
      [12, -15, 13, -25],
      [12, -15, 18, -22],
      [12, -15, 19, -17],
    ];
    for (const [x1, y1, x2, y2] of fronds) {
      g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2, y1 - 4, x2, y2);
      g.stroke({ width: 1.8, color: 0x15803d, alpha: a });
    }
    g.circle(11, -14, 1.2); g.fill({ color: 0xf59e0b, alpha: a });
    g.circle(13, -14, 1.2); g.fill({ color: 0xf59e0b, alpha: a });

    // Water Cistern with windlass
    g.rect(6, 1, 4.5, 3.5);
    g.fill({ color: 0xc2410c, alpha: a });
    g.rect(6.5, 1.5, 3.5, 2.5);
    g.fill({ color: 0x0284c7, alpha: a * 0.85 });
    g.moveTo(8.2, 1); g.lineTo(8.2, -2);
    g.stroke({ width: 1, color: 0x78350f, alpha: a });

  } else if (kit === "steppe") {
    // Wind Host: Nomadic Wagon Yard + Kibitka Wagon + Horse Corral + Storage Ger
    const wh = h * 0.75;
    g.poly([-14, 2, -2, 7.5, 7, 3, -5, -2.5]);
    g.fill({ color: 0x7c2d12, alpha: a });

    // Large spoked wooden cart wheels
    g.circle(-10, 5, 4.2);
    g.stroke({ width: 1.2, color: 0x44403c, alpha: a });
    g.moveTo(-10, 0.8); g.lineTo(-10, 9.2);
    g.moveTo(-14.2, 5); g.lineTo(-5.8, 5);
    g.stroke({ width: 0.8, color: 0xca8a04, alpha: a });
    g.circle(-10, 5, 1); g.fill({ color: 0xca8a04, alpha: a });

    g.circle(3, 3, 4.2);
    g.stroke({ width: 1.2, color: 0x44403c, alpha: a });
    g.moveTo(3, -1.2); g.lineTo(3, 7.2);
    g.moveTo(-1.2, 3); g.lineTo(7.2, 3);
    g.stroke({ width: 0.8, color: 0xca8a04, alpha: a });
    g.circle(3, 3, 1); g.fill({ color: 0xca8a04, alpha: a });

    // Rounded Felt Wagon Hood
    g.poly([-13, 0.5, -2, 6, -2, 6 - wh, -13, 0.5 - wh]);
    g.fill({ color: 0xe7e5df, alpha: a });
    g.poly([-2, 6, 6, 2, 6, 2 - wh, -2, 6 - wh]);
    g.fill({ color: 0xc8c6bd, alpha: a });
    g.poly([-13, 0.5 - wh, -2, 6 - wh, 6, 2 - wh, -4, -4 - wh]);
    g.fill({ color: 0xf1f5f9, alpha: a });
    g.moveTo(-8, 3 - wh); g.lineTo(-8, 3);
    g.moveTo(-5, 4.5 - wh); g.lineTo(-5, 4.5);
    g.stroke({ width: 1, color: 0x7c2d12, alpha: a });

    // Auxiliary Storage Ger
    g.circle(-10, -wh * 0.75, 4.5);
    g.fill({ color: 0xe7e5df, alpha: a });
    g.circle(-10, -wh * 0.75 - 1.5, 1.8);
    g.fill({ color: 0x9f1239, alpha: a });
    if (complete) {
      const sPuff = Math.sin(phase * 2.2) * 1.5;
      g.circle(-10, -wh * 0.75 - 4 + sPuff, 1.8);
      g.fill({ color: 0xe2e8f0, alpha: 0.4 * a });
    }

    // Livestock Pen / Horse Corral with dried hay
    g.moveTo(6, 4); g.lineTo(15, 0); g.lineTo(15, 6); g.lineTo(6, 9.5);
    g.stroke({ width: 1.1, color: 0x7c2d12, alpha: a });
    g.moveTo(6, 6.5); g.lineTo(15, 2.5);
    g.stroke({ width: 0.9, color: 0x7c2d12, alpha: a });
    g.poly([9, 4, 13, 2, 11, 0]);
    g.fill({ color: 0xca8a04, alpha: a });

    // Tripod Waterskin
    g.moveTo(-1, 5); g.lineTo(1, 1);
    g.moveTo(3, 5); g.lineTo(1, 1);
    g.moveTo(1, 7); g.lineTo(1, 1);
    g.stroke({ width: 0.9, color: 0x78350f, alpha: a });
    g.circle(1, 3.5, 1.4);
    g.fill({ color: 0x9f1239, alpha: a });

  } else {
    // Tide Clans: Pile-House Farm Hut + Drying Net Racks + Fish Traps + Tidal Canal
    const sh = h * 0.8;
    g.rect(-14, 0, 2, 8);
    g.rect(-2, 4, 2, 8);
    g.rect(9, 0, 2, 7);
    g.fill({ color: 0x44403c, alpha: a });

    g.poly([-15, -4, -2, 2.5, -2, 2.5 - sh, -15, -4 - sh]);
    g.fill({ color: 0xd4a359, alpha: a });
    g.poly([-2, 2.5, 8, -2, 8, -2 - sh, -2, 2.5 - sh]);
    g.fill({ color: 0xa16207, alpha: a });

    g.poly([-17, -4 - sh, -2, 4.5 - sh - 10, 10, -2 - sh, -4, -13 - sh]);
    g.fill({ color: 0x0e7490, alpha: a });
    g.moveTo(-17, -4 - sh); g.lineTo(-2, 4.5 - sh - 10); g.lineTo(10, -2 - sh);
    g.stroke({ width: 1.4, color: 0x155e75, alpha: a });

    g.moveTo(-5, 3); g.lineTo(-3, 8);
    g.moveTo(-3, 3); g.lineTo(-1, 8);
    g.stroke({ width: 0.9, color: 0x78350f, alpha: a });

    // Wooden Drying Net Racks
    g.moveTo(-14, 5); g.lineTo(-14, -5);
    g.moveTo(2, 5); g.lineTo(2, -5);
    g.stroke({ width: 1.4, color: 0x52525b, alpha: a });
    g.moveTo(-16, -5); g.lineTo(4, -5);
    g.stroke({ width: 1.6, color: 0x44403c, alpha: a });

    g.poly([-14, -5, 2, -5, 3, 2, -13, 2]);
    g.fill({ color: 0x64748b, alpha: a * 0.4 });
    g.moveTo(-14, -5); g.lineTo(-8, 2);
    g.moveTo(-8, -5); g.lineTo(-2, 2);
    g.moveTo(-2, -5); g.lineTo(3, 1);
    g.moveTo(2, -5); g.lineTo(-4, 2);
    g.moveTo(-4, -5); g.lineTo(-10, 2);
    g.stroke({ width: 0.6, color: 0x94a3b8, alpha: a * 0.8 });

    g.circle(-10, -2, 1.2); g.fill({ color: 0xf1f5f9, alpha: a });
    g.circle(-5, -1, 1.3); g.fill({ color: 0xe2e8f0, alpha: a });
    g.circle(0, -2.5, 1.2); g.fill({ color: 0xf1f5f9, alpha: a });

    g.poly([9, 3, 13, 1.5, 12, 5, 8, 6]);
    g.fill({ color: 0x78350f, alpha: a });
    g.stroke({ width: 0.8, color: 0xa16207, alpha: a });

    g.moveTo(-15, 8); g.lineTo(0, 9.5); g.lineTo(15, 6.5);
    g.stroke({ width: 2.2, color: 0x0e7490, alpha: a * 0.85 });
  }
}

function drawCottageCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette,
  complete: boolean = true
): void {
  if (kit === "cedar") {
    // Cedar Kin: Log Cabin with Notched Corners + Split-Shake Roof + Porch + Antler Latch
    g.poly([-15, 0, 0, 7.5, 0, 7.5 - h, -15, 0 - h]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.poly([0, 7.5, 13, 1, 13, 1 - h, 0, 7.5 - h]);
    g.fill({ color: 0x6d3d0c, alpha: a });

    for (const f of [0.2, 0.4, 0.6, 0.8]) {
      const my = 7.5 - h * f;
      g.moveTo(-15, 0 - h * f); g.lineTo(0, my);
      g.moveTo(0, my); g.lineTo(13, 1 - h * f);
      g.stroke({ width: 1.2, color: 0x3f220c, alpha: a });
      g.circle(-15.5, -h * f, 1); g.fill({ color: 0xa16207, alpha: a });
      g.circle(13.5, 1 - h * f, 1); g.fill({ color: 0xa16207, alpha: a });
    }

    g.poly([-17, 1 - h, 0, 10 - h - 11, 15, 2 - h, -1, -h - 18]);
    g.fill({ color: 0x5c3818, alpha: a });
    g.moveTo(-17, 1 - h); g.lineTo(0, 10 - h - 11); g.lineTo(15, 2 - h);
    g.stroke({ width: 1.4, color: 0x3f220c, alpha: a });
    g.moveTo(-17, 1 - h); g.lineTo(-8, 5 - h - 5);
    g.stroke({ width: 1.4, color: 0x166534, alpha: a * 0.85 });

    g.rect(-10, -h - 12, 3.5, 8);
    g.fill({ color: 0x78716c, alpha: a });
    g.stroke({ width: 0.8, color: 0x44403c, alpha: a });
    if (complete) {
      const cPuff = Math.sin(phase * 2.2) * 1.8;
      g.circle(-8.5, -h - 15 + cPuff, 2.2);
      g.fill({ color: 0xe2e8f0, alpha: a * 0.45 });
      g.circle(-6.5, -h - 19 + cPuff, 2.8);
      g.fill({ color: 0xf1f5f9, alpha: a * 0.3 });
    }

    g.moveTo(-12, 1.5); g.lineTo(-12, -h * 0.45);
    g.moveTo(-6, 4.5); g.lineTo(-6, -h * 0.35);
    g.stroke({ width: 1.4, color: 0x5c3818, alpha: a });
    g.rect(-10, 3.5 - h * 0.42, 4.5, 6.5);
    g.fill({ color: 0x451a03, alpha: a });
    g.rect(-6, 6 - h * 0.42, 1.2, 2);
    g.fill({ color: 0xfef3c7, alpha: a });

    const candle = 0.88 + Math.sin(phase * 3.5) * 0.1;
    g.rect(3, 4 - h * 0.45, 4, 4);
    g.fill({ color: 0xfef08a, alpha: a * 0.95 * candle });
    g.stroke({ width: 0.6, color: 0x3f220c, alpha: a });

    g.rect(8, 3, 5, 3.5);
    g.fill({ color: 0x78350f, alpha: a });
    g.moveTo(8, 4.8); g.lineTo(13, 4.8);
    g.stroke({ width: 0.8, color: 0x3f1d0b, alpha: a });

  } else if (kit === "sand") {
    // Sand Banner: Flat-Roofed Adobe Cube Dwelling + Vigas + Ladder + Terrace Rugs
    const sh = h * 0.88;
    g.poly([-14, 0, 0, 7, 0, 7 - sh, -14, 0 - sh]);
    g.fill({ color: 0xd6c7a1, alpha: a });
    g.poly([0, 7, 13, 0.5, 13, 0.5 - sh, 0, 7 - sh]);
    g.fill({ color: 0xb8a77d, alpha: a });

    g.poly([-15, -sh, 0, 8 - sh, 14, 1.5 - sh, -1, -6.5 - sh]);
    g.fill({ color: 0x8c7954, alpha: a });
    g.stroke({ width: 1.2, color: 0xa89668, alpha: a });

    for (const vx of [-12, -8, -4]) {
      g.circle(vx, 3 - sh, 1.2);
      g.fill({ color: 0x78350f, alpha: a });
    }

    g.moveTo(8, 6); g.lineTo(10, 1 - sh);
    g.moveTo(10, 6.5); g.lineTo(12, 1.5 - sh);
    g.stroke({ width: 1, color: 0x78350f, alpha: a });
    for (let f = 0.2; f <= 0.85; f += 0.2) {
      g.moveTo(8 + 2 * f, 6 - (5 + sh) * f);
      g.lineTo(10 + 2 * f, 6.5 - (5 + sh) * f);
      g.stroke({ width: 0.8, color: 0x5c3818, alpha: a });
    }

    g.poly([-8, 1 - sh, -2, 4 - sh, -1, 1 - sh, -7, -2 - sh]);
    g.fill({ color: 0xb45309, alpha: a });
    g.circle(4, -sh + 1, 1.3);
    g.fill({ color: 0xc2410c, alpha: a });

    g.poly([-8, 3.5 - sh * 0.42, -3.5, 5.5 - sh * 0.42, -3.5, -sh * 0.42, -8, -2 - sh * 0.42]);
    g.fill({ color: 0x09090b, alpha: a });
    g.rect(-7.5, 3 - sh * 0.42, 3.5, 5.5);
    g.fill({ color: 0xb45309, alpha: a * 0.95 });

    const candle = 0.85 + Math.sin(phase * 3) * 0.12;
    g.rect(3, 4 - sh * 0.45, 3, 3);
    g.fill({ color: 0xfde047, alpha: a * 0.95 * candle });

  } else if (kit === "steppe") {
    // Wind Host: Cylindrical Felt Yurt / Ger + Conical Roof + Toono Crown + Hitching Post
    g.poly([-14, 0, 0, 7, 0, 7 - h * 0.55, -14, 0 - h * 0.55]);
    g.fill({ color: 0xe7e5df, alpha: a });
    g.poly([0, 7, 13, 0.5, 13, 0.5 - h * 0.55, 0, 7 - h * 0.55]);
    g.fill({ color: 0xc8c6bd, alpha: a });

    g.moveTo(-14, 0 - h * 0.25); g.lineTo(0, 7 - h * 0.25); g.lineTo(13, 0.5 - h * 0.25);
    g.stroke({ width: 1.4, color: 0x9f1239, alpha: a });

    g.poly([-15, 0 - h * 0.55, 0, 7.5 - h * 0.55, 14, 1 - h * 0.55, 0, -h - 6]);
    g.fill({ color: 0xf1f5f9, alpha: a });
    g.poly([0, 7.5 - h * 0.55, 14, 1 - h * 0.55, 0, -h - 6]);
    g.fill({ color: 0xdad8cf, alpha: a });

    g.ellipse(0, -h - 6, 3.6, 2.2);
    g.fill({ color: 0x9f1239, alpha: a });
    g.ellipse(0, -h - 6, 2.4, 1.4);
    g.fill({ color: 0xca8a04, alpha: a });
    if (complete) {
      const sPuff = Math.sin(phase * 2.2) * 1.6;
      g.circle(0, -h - 10 + sPuff, 2);
      g.fill({ color: 0xe2e8f0, alpha: a * 0.45 });
      g.circle(1.5, -h - 14 + sPuff, 2.6);
      g.fill({ color: 0xf1f5f9, alpha: a * 0.3 });
    }

    g.rect(-4, 3.5 - h * 0.45, 5, 6);
    g.fill({ color: 0x9f1239, alpha: a });
    g.stroke({ width: 0.8, color: 0xca8a04, alpha: a });
    g.rect(-3.5, 4 - h * 0.45, 4, 5);
    g.fill({ color: 0x27272a, alpha: a });

    g.moveTo(-11, 4.5); g.lineTo(-9, 1.5);
    g.moveTo(-7, 4.5); g.lineTo(-9, 1.5);
    g.stroke({ width: 0.8, color: 0x27272a, alpha: a });
    g.circle(-9, 3, 1.4); g.fill({ color: 0xf97316, alpha: a });
    g.moveTo(9, 4); g.lineTo(9, -1);
    g.stroke({ width: 1.2, color: 0x7c2d12, alpha: a });
    g.circle(9, -1.5, 1); g.fill({ color: 0xca8a04, alpha: a });

  } else {
    // Tide Clans: Elevated Coastal Stilt Hut on Pilings + Woven Reed Walls + Flared Roof
    const sh = h * 0.82;
    g.rect(-13, 0, 2, 7.5);
    g.rect(-1, 4, 2, 7.5);
    g.rect(11, 0, 2, 6.5);
    g.fill({ color: 0x44403c, alpha: a });
    g.moveTo(-13, 2); g.lineTo(-1, 6);
    g.moveTo(-1, 6); g.lineTo(11, 2);
    g.stroke({ width: 0.8, color: 0x27272a, alpha: a * 0.8 });

    g.poly([-14, -5, 0, 2, 0, 2 - sh, -14, -5 - sh]);
    g.fill({ color: 0xc4b595, alpha: a });
    g.poly([0, 2, 12, -4, 12, -4 - sh, 0, 2 - sh]);
    g.fill({ color: 0xa89878, alpha: a });
    for (const f of [0.3, 0.65]) {
      g.moveTo(-14, -5 - sh * f); g.lineTo(0, 2 - sh * f);
      g.moveTo(0, 2 - sh * f); g.lineTo(12, -4 - sh * f);
      g.stroke({ width: 0.8, color: 0x78350f, alpha: a });
    }

    g.poly([-16, -4 - sh, 0, 4 - sh - 10, 14, -3 - sh, -1, -sh - 16]);
    g.fill({ color: 0x0e7490, alpha: a });
    g.moveTo(-16, -4 - sh); g.lineTo(0, 4 - sh - 10); g.lineTo(14, -3 - sh);
    g.stroke({ width: 1.4, color: 0x155e75, alpha: a });

    g.moveTo(-5, 2.5); g.lineTo(-3, 8);
    g.moveTo(-3, 2.5); g.lineTo(-1, 8);
    g.stroke({ width: 0.9, color: 0x44403c, alpha: a });

    g.poly([-11, 2, -3, 5, -2, 7, -10, 4]);
    g.fill({ color: 0x94a3b8, alpha: a * 0.4 });
    g.circle(-7, 4.5, 0.8); g.fill({ color: 0xfef08a, alpha: a });

    const candle = 0.88 + Math.sin(phase * 3.2) * 0.1;
    g.rect(3, -1 - sh * 0.45, 3.5, 3.5);
    g.fill({ color: 0xfef08a, alpha: a * 0.95 * candle });
  }
}

function drawLumberCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette
): void {
  if (kit === "cedar") {
    // Cedar Kin: Giant Felled Cedar Trunk + Pit Saw Trestle + Shakes + A-Frame Hoist
    g.poly([-14, 0, 0, 7, 0, 7 - h, -14, 0 - h]);
    g.fill({ color: 0x5c3d28, alpha: a });
    g.poly([0, 7, 12, 1, 12, 1 - h, 0, 7 - h]);
    g.fill({ color: 0x472d1c, alpha: a });
    g.poly([-16, -h, 0, 8 - h - 9, 14, 1 - h, 0, -h - 13]);
    g.fill({ color: 0x382214, alpha: a });

    g.poly([-14, 0, -9, -24, -4, 0]);
    g.fill({ color: 0x14532d, alpha: a });
    g.poly([-13, -10, -9, -30, -5, -10]);
    g.fill({ color: 0x166534, alpha: a });

    g.poly([-15, 2, 7, -6, 8, -2, -14, 6]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.stroke({ width: 0.8, color: 0x3f1d0b, alpha: a });
    g.ellipse(-14.5, 4, 2.5, 2);
    g.fill({ color: 0xa16207, alpha: a });
    g.circle(-14.5, 4, 1); g.stroke({ width: 0.6, color: 0x5c3818, alpha: a });
    g.rect(-2, -3, 1.4, 2.5); g.fill({ color: 0xd1d5db, alpha: a });
    g.rect(2, -4.5, 1.4, 2.5); g.fill({ color: 0xd1d5db, alpha: a });

    g.moveTo(7, 5); g.lineTo(10, -9); g.lineTo(13, 3);
    g.stroke({ width: 1.6, color: 0x5c3818, alpha: a });
    g.moveTo(10, -9); g.lineTo(10, -3);
    g.stroke({ width: 0.8, color: 0xa16207, alpha: a });
    g.circle(10, -3, 1.2); g.fill({ color: 0x94a3b8, alpha: a });

    g.rect(-6, 4, 7, 3.5);
    g.fill({ color: 0x78350f, alpha: a });
    g.moveTo(-6, 5.8); g.lineTo(1, 5.8);
    g.stroke({ width: 0.8, color: 0x3f1d0b, alpha: a });

  } else if (kit === "sand") {
    // Sand Banner: Shaded Acacia Arbor + Bundled Reeds + Carpenter's Adze Bench
    g.poly([-14, -5, 0, 2, 12, -4, -2, -11]);
    g.fill({ color: 0xc4b595, alpha: a * 0.9 });
    g.moveTo(-13, 3); g.lineTo(-13, -5);
    g.moveTo(0, 8); g.lineTo(0, 2);
    g.moveTo(11, 2); g.lineTo(11, -4);
    g.stroke({ width: 1.4, color: 0x78350f, alpha: a });

    g.poly([-15, 3, -5, 7, -4, 4, -14, 0]);
    g.fill({ color: 0xd6c7a1, alpha: a });
    g.stroke({ width: 0.8, color: 0x8c7954, alpha: a });

    g.poly([4, 6, 12, 3, 11, 1, 3, 4]);
    g.fill({ color: 0xa16207, alpha: a });
    g.moveTo(6, 5); g.lineTo(6, 2.5);
    g.moveTo(9, 4); g.lineTo(9, 1.5);
    g.stroke({ width: 0.8, color: 0x3f1d0b, alpha: a });

    g.rect(-4, 0, 8, 3.5);
    g.fill({ color: 0x78350f, alpha: a });
    g.rect(-2, -1.5, 2, 3.5);
    g.fill({ color: 0xd1d5db, alpha: a });

    g.circle(3, -2, 1.6);
    g.fill({ color: 0xc2410c, alpha: a });

  } else if (kit === "steppe") {
    // Wind Host: Wagonwright Yard + Spoked Cart Wheels + Shaving Horse + Birch Poles
    g.poly([-14, 0, 0, 7, 0, 7 - h, -14, 0 - h]);
    g.fill({ color: 0x7c2d12, alpha: a });
    g.poly([0, 7, 12, 1, 12, 1 - h, 0, 7 - h]);
    g.fill({ color: 0x57534e, alpha: a });
    g.poly([-16, -h, 0, 8 - h - 9, 14, 1 - h, 0, -h - 13]);
    g.fill({ color: 0x44403c, alpha: a });

    // Spoked Wooden Wheels
    g.circle(7, 2, 5);
    g.stroke({ width: 1.4, color: 0x44403c, alpha: a });
    g.moveTo(7, -3); g.lineTo(7, 7);
    g.moveTo(2, 2); g.lineTo(12, 2);
    g.stroke({ width: 0.8, color: 0xca8a04, alpha: a });
    g.circle(7, 2, 1.2); g.fill({ color: 0xca8a04, alpha: a });

    g.circle(13, 0, 3.5);
    g.stroke({ width: 1.1, color: 0x7c2d12, alpha: a });
    g.circle(13, 0, 0.8); g.fill({ color: 0xca8a04, alpha: a });

    // Shaving Horse
    g.rect(-8, 3, 7, 3);
    g.fill({ color: 0x78350f, alpha: a });
    g.moveTo(-6, 2); g.lineTo(-4, 2);
    g.stroke({ width: 1.2, color: 0xd1d5db, alpha: a });

    // Birch logs
    g.poly([-14, 2, -7, 5, -8, 6.5, -15, 3.5]);
    g.fill({ color: 0xf1f5f9, alpha: a });
    g.circle(-11, 3.5, 0.6); g.fill({ color: 0x27272a, alpha: a });
    g.circle(-9, 4.5, 0.6); g.fill({ color: 0x27272a, alpha: a });

  } else {
    // Tide Clans: Shoreline Boatbuilder's Canoe Keel Frame + Driftwood + Nautical Rope
    g.poly([-14, -4, 0, 3, 12, -3, -2, -10]);
    g.fill({ color: 0x0e7490, alpha: a * 0.85 });
    g.moveTo(-13, 4); g.lineTo(-13, -4);
    g.moveTo(0, 8); g.lineTo(0, 3);
    g.moveTo(11, 3); g.lineTo(11, -3);
    g.stroke({ width: 1.4, color: 0x44403c, alpha: a });

    g.moveTo(-13, 4); g.quadraticCurveTo(-3, 8, 7, 3);
    g.stroke({ width: 2, color: 0x44403c, alpha: a });
    for (const rx of [-10, -6, -2, 2, 6]) {
      const ry = 4 + (1 - Math.abs(rx + 2) / 8) * 3;
      g.moveTo(rx, ry); g.lineTo(rx - 1, ry - 3.5);
      g.stroke({ width: 1, color: 0x94a3b8, alpha: a });
    }

    g.poly([6, 5, 14, 2, 13, 0.5, 5, 3.5]);
    g.fill({ color: 0x64748b, alpha: a });
    g.stroke({ width: 0.6, color: 0x334155, alpha: a });

    g.circle(-8, 5.5, 2.2);
    g.stroke({ width: 1.2, color: 0xa16207, alpha: a });
    g.circle(-8, 5.5, 1.2);
    g.stroke({ width: 0.9, color: 0x78350f, alpha: a });
  }
}

function drawKeepCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette,
  complete: boolean = true
): void {
  if (kit === "cedar") {
    // Cedar Kin: Monumental Timber Longhouse Keep + Cedar-Shake Roof + Eagle Finials + Watch Scaffolds
    g.poly([-17, 1, 0, 9.5, 0, 5, -17, -3.5]);
    g.fill({ color: 0x3f220c, alpha: a });
    g.poly([0, 9.5, 17, 1, 17, -3.5, 0, 5]);
    g.fill({ color: 0x271406, alpha: a });

    g.poly([-16, -2, 0, 5.5, 0, 5.5 - h, -16, -2 - h]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.poly([0, 5.5, 16, -2, 16, -2 - h, 0, 5.5 - h]);
    g.fill({ color: 0x5c3818, alpha: a });

    for (const fraction of [0.2, 0.4, 0.6, 0.8]) {
      const my = 5.5 - h * fraction;
      g.moveTo(-16, -2 - h * fraction); g.lineTo(0, my);
      g.moveTo(0, my); g.lineTo(16, -2 - h * fraction);
      g.stroke({ width: 1.4, color: 0x3f220c, alpha: a * 0.85 });
    }

    g.poly([-19, -h + 2, 0, 8.5 - h - 14, 19, -h + 2, 0, -h - 22]);
    g.fill({ color: 0x6d3d0c, alpha: a });
    g.moveTo(-19, -h + 2); g.lineTo(0, 8.5 - h - 14); g.lineTo(19, -h + 2);
    g.stroke({ width: 1.8, color: 0x3f220c, alpha: a });

    // Eagle/Animal Ridgepole Finials
    g.poly([0, 8.5 - h - 14, -3, 8.5 - h - 20, 0, 8.5 - h - 18, 3, 8.5 - h - 20]);
    g.fill({ color: 0xfacc15, alpha: a });
    g.poly([0, -h - 22, -2.5, -h - 27, 0, -h - 25, 2.5, -h - 27]);
    g.fill({ color: 0xfacc15, alpha: a });

    // Corner Watch Scaffolds
    g.poly([-18, -h + 4, -12, -h + 7, -12, -h - 4, -18, -h - 7]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.moveTo(-18, -h - 4); g.lineTo(-12, -h - 1);
    g.stroke({ width: 1.2, color: 0x3f220c, alpha: a });

    g.poly([12, -h + 7, 18, -h + 4, 18, -h - 7, 12, -h - 4]);
    g.fill({ color: 0x5c3818, alpha: a });
    g.moveTo(12, -h - 1); g.lineTo(18, -h - 4);
    g.stroke({ width: 1.2, color: 0x3f220c, alpha: a });

    // Smoke Louvers & Plume
    g.rect(-4, -h - 16, 8, 4);
    g.fill({ color: 0x3f220c, alpha: a });
    if (complete) {
      const kSmoke = Math.sin(phase * 2.2) * 2;
      g.circle(0, -h - 20 + kSmoke, 2.8);
      g.fill({ color: 0xe2e8f0, alpha: 0.5 * a });
      g.circle(2, -h - 25 + kSmoke, 3.6);
      g.fill({ color: 0xf1f5f9, alpha: a * 0.35 });
    }

    // Grand Timber Portal & Lintel
    g.poly([-5, 5, 5, 1.5, 5, -5.5, -5, -2]);
    g.fill({ color: 0x09090b, alpha: a });
    g.rect(-4.5, 3.5, 4, 7); g.fill({ color: 0x854d0e, alpha: a });
    g.rect(0.5, 0.5, 4, 7); g.fill({ color: 0x5c3818, alpha: a });
    g.circle(-2.5, 5, 0.8); g.fill({ color: 0xfacc15, alpha: a });
    g.circle(2.5, 2, 0.8); g.fill({ color: 0xfacc15, alpha: a });
    g.moveTo(-5, -2); g.lineTo(5, -5.5);
    g.stroke({ width: 2.2, color: 0xca8a04, alpha: a });

    // Totem Pole & Brazier
    g.rect(-12, -8, 2.5, 14);
    g.fill({ color: 0x854d0e, alpha: a });
    g.circle(-10.8, -8, 1.8);
    g.fill({ color: 0xca8a04, alpha: a });

    g.rect(8, 4, 3, 3); g.fill({ color: 0x3f220c, alpha: a });
    const kFlame = Math.sin(phase * 6) * 1.5;
    g.circle(9.5, 3, 2 + kFlame * 0.3); g.fill({ color: 0xf97316, alpha: a });

    // Clan Banner
    const bannerWave = Math.sin(phase * 3.5) * 3;
    g.moveTo(0, -h + 2); g.lineTo(0, -h - 18);
    g.stroke({ width: 1.8, color: 0x854d0e, alpha: a });
    g.poly([0, -h - 18, 12 + bannerWave, -h - 13, 0, -h - 8]);
    g.fill({ color: 0x14532d, alpha: a });
    g.poly([0, -h - 16, 7 + bannerWave * 0.6, -h - 13, 0, -h - 10]);
    g.fill({ color: 0xca8a04, alpha: a });

  } else if (kit === "sand") {
    // Sand Banner: Courtyard Keep with Flat Roofs + Colonnaded Inner Courtyard + Fountain + Mirador Tower
    g.poly([-17, 1, 0, 9.5, 0, 5, -17, -3.5]);
    g.fill({ color: 0x8c7954, alpha: a });
    g.poly([0, 9.5, 17, 1, 17, -3.5, 0, 5]);
    g.fill({ color: 0x736343, alpha: a });

    g.poly([-16, -2, 0, 5.5, 0, 5.5 - h, -16, -2 - h]);
    g.fill({ color: 0xd6c7a1, alpha: a });
    g.poly([0, 5.5, 16, -2, 16, -2 - h, 0, 5.5 - h]);
    g.fill({ color: 0xb8a77d, alpha: a });

    // Flat Roof Terrace with Stepped Mudbrick Crenellations
    g.poly([-17, -h, 0, 7.5 - h, 17, -h, 0, -h - 8]);
    g.fill({ color: 0x8c7954, alpha: a });
    for (const mx of [-15, -10, -5, 2, 7, 12]) {
      const my = mx <= 0 ? -h + (mx + 15) * 0.5 : -h + 7.5 - mx * 0.45;
      g.rect(mx, my - 3.5, 3.5, 3.5);
      g.fill({ color: 0xd6c7a1, alpha: a });
    }

    // Square Mirador Tower
    g.poly([4, -h - 1, 12, -h - 5, 12, -h - 16, 4, -h - 12]);
    g.fill({ color: 0xb8a77d, alpha: a });
    g.poly([-4, -h - 5, 4, -h - 1, 4, -h - 12, -4, -h - 16]);
    g.fill({ color: 0xd6c7a1, alpha: a });
    g.poly([0, -h - 9, 3, -h - 7.5, 3, -h - 4, 0, -h - 5.5]);
    g.fill({ color: 0x09090b, alpha: a });
    g.circle(4, -h - 17, 1.8); g.fill({ color: 0xfacc15, alpha: a });

    // Horseshoe Arched Gateway & Courtyard Fountain
    g.poly([-5, 5, 5, 1.5, 5, -5.5, -5, -2]);
    g.fill({ color: 0x09090b, alpha: a });
    g.ellipse(0, 1.5, 3.5, 1.8);
    g.fill({ color: 0x0284c7, alpha: a });
    g.poly([-4, -1, 4, -4.5, 2, -7.5, -6, -4]);
    g.fill({ color: 0xb45309, alpha: a * 0.9 });
    g.moveTo(-4, -1); g.lineTo(4, -4.5);
    g.stroke({ width: 0.8, color: 0xfacc15, alpha: a });

    g.rect(-11, 4, 3, 3); g.fill({ color: 0x78350f, alpha: a });
    const kFlame = Math.sin(phase * 6) * 1.5;
    g.circle(-9.5, 3, 2 + kFlame * 0.3); g.fill({ color: 0xf59e0b, alpha: a });

    // Desert Silk Standard
    const bannerWave = Math.sin(phase * 3.5) * 3;
    g.moveTo(0, -h + 2); g.lineTo(0, -h - 16);
    g.stroke({ width: 1.8, color: 0xa16207, alpha: a });
    g.poly([0, -h - 16, 12 + bannerWave, -h - 12, 0, -h - 8]);
    g.fill({ color: 0xb45309, alpha: a });
    g.poly([0, -h - 14, 7 + bannerWave * 0.6, -h - 12, 0, -h - 10]);
    g.fill({ color: 0xf59e0b, alpha: a });

  } else if (kit === "steppe") {
    // Wind Host: Felt-Roof Hall (Great Ger) + Wagon Yard + Toono Crown + Horsehair Standards
    const gh = h * 0.88;
    g.poly([-16, -1, 0, 6.5, 0, 6.5 - gh * 0.5, -16, -1 - gh * 0.5]);
    g.fill({ color: 0xe7e5df, alpha: a });
    g.poly([0, 6.5, 16, -1, 16, -1 - gh * 0.5, 0, 6.5 - gh * 0.5]);
    g.fill({ color: 0xc8c6bd, alpha: a });

    g.moveTo(-16, -1 - gh * 0.25); g.lineTo(0, 6.5 - gh * 0.25); g.lineTo(16, -1 - gh * 0.25);
    g.stroke({ width: 1.6, color: 0x9f1239, alpha: a });
    g.moveTo(-16, -1 - gh * 0.38); g.lineTo(0, 6.5 - gh * 0.38); g.lineTo(16, -1 - gh * 0.38);
    g.stroke({ width: 1.2, color: 0xca8a04, alpha: a });

    // Domed Felt Roof
    g.poly([-18, -1 - gh * 0.5, 0, 8 - gh * 0.5, 18, -1 - gh * 0.5, 0, -gh - 14]);
    g.fill({ color: 0xf1f5f9, alpha: a });
    g.poly([0, 8 - gh * 0.5, 18, -1 - gh * 0.5, 0, -gh - 14]);
    g.fill({ color: 0xdad8cf, alpha: a });

    for (const rx of [-12, -6, 0, 6, 12]) {
      g.moveTo(rx, 3 - gh * 0.5); g.lineTo(0, -gh - 14);
      g.stroke({ width: 0.8, color: 0xca8a04, alpha: a * 0.7 });
    }

    // Toono Crown Ring & Smoke Plume
    g.ellipse(0, -gh - 14, 5, 2.8);
    g.fill({ color: 0x9f1239, alpha: a });
    g.ellipse(0, -gh - 14, 3.4, 1.8);
    g.fill({ color: 0xca8a04, alpha: a });
    if (complete) {
      const sPuff = Math.sin(phase * 2.2) * 2;
      g.circle(0, -gh - 19 + sPuff, 2.8);
      g.fill({ color: 0xe2e8f0, alpha: a * 0.5 });
      g.circle(2, -gh - 24 + sPuff, 3.8);
      g.fill({ color: 0xf1f5f9, alpha: a * 0.35 });
    }

    // Entrance Portal
    g.rect(-4.5, 2 - gh * 0.45, 9, 8);
    g.fill({ color: 0x9f1239, alpha: a });
    g.stroke({ width: 1.2, color: 0xca8a04, alpha: a });
    g.rect(-3.5, 3 - gh * 0.45, 7, 7);
    g.fill({ color: 0x09090b, alpha: a });

    // Hitching Post with Horsehair Standard (Tuk)
    g.moveTo(-11, 5); g.lineTo(-11, -10);
    g.stroke({ width: 1.6, color: 0x7c2d12, alpha: a });
    g.circle(-11, -11, 1.5); g.fill({ color: 0xca8a04, alpha: a });
    g.poly([-11, -10, -8, -6, -11, -4]); g.fill({ color: 0x18181b, alpha: a });

    // Bronze Cauldron
    g.rect(9, 4, 3.5, 3.5); g.fill({ color: 0x7c2d12, alpha: a });
    const kFlame = Math.sin(phase * 6) * 1.5;
    g.circle(10.7, 3, 2 + kFlame * 0.3); g.fill({ color: 0xf97316, alpha: a });

    // Khan's Battle Standard
    const bannerWave = Math.sin(phase * 3.5) * 3;
    g.moveTo(0, -gh - 14); g.lineTo(0, -gh - 26);
    g.stroke({ width: 1.8, color: 0x7c2d12, alpha: a });
    g.poly([0, -gh - 26, 12 + bannerWave, -gh - 21, 0, -gh - 16]);
    g.fill({ color: 0x9f1239, alpha: a });
    g.poly([0, -gh - 24, 7 + bannerWave * 0.6, -gh - 21, 0, -gh - 18]);
    g.fill({ color: 0xca8a04, alpha: a });

  } else {
    // Tide Clans: Pile-House Keep on Pilings + Boat-Keel Roof + Net Racks + Catwalk
    g.rect(-16, 0, 2.5, 10);
    g.rect(-8, 3, 2.5, 9);
    g.rect(0, 6, 2.5, 9);
    g.rect(8, 3, 2.5, 8);
    g.rect(15, 0, 2.5, 7);
    g.fill({ color: 0x44403c, alpha: a });
    g.moveTo(-16, 2); g.lineTo(0, 9); g.lineTo(15, 2);
    g.stroke({ width: 1.2, color: 0x27272a, alpha: a * 0.8 });

    g.poly([-16, -3, 0, 5, 0, 5 - h * 0.82, -16, -3 - h * 0.82]);
    g.fill({ color: 0x94a3b8, alpha: a });
    g.poly([0, 5, 16, -3, 16, -3 - h * 0.82, 0, 5 - h * 0.82]);
    g.fill({ color: 0x64748b, alpha: a });

    // Sweeping Inverted-Boat-Keel Thatched Palm Roof
    g.poly([-19, -2 - h * 0.82, 0, 8 - h * 0.82 - 14, 19, -2 - h * 0.82, 0, -h - 22]);
    g.fill({ color: 0x0e7490, alpha: a });
    g.moveTo(-19, -2 - h * 0.82); g.lineTo(0, 8 - h * 0.82 - 14); g.lineTo(19, -2 - h * 0.82);
    g.stroke({ width: 1.8, color: 0x155e75, alpha: a });

    // Elevated Wrap-Around Catwalk
    g.poly([-17, 3, 0, 10, 17, 3, 17, 1, 0, 8, -17, 1]);
    g.fill({ color: 0x44403c, alpha: a });
    g.moveTo(-17, 1); g.lineTo(0, 8); g.lineTo(17, 1);
    g.stroke({ width: 1, color: 0xa16207, alpha: a });

    // Watch Deck with Sailcloth Canopy
    g.poly([-18, -h * 0.82, -12, -h * 0.82 + 3, -12, -h * 0.82 - 6, -18, -h * 0.82 - 9]);
    g.fill({ color: 0xf1f5f9, alpha: a * 0.9 });

    g.moveTo(-4, 6); g.lineTo(-2, 11);
    g.moveTo(2, 6); g.lineTo(4, 11);
    g.stroke({ width: 1.2, color: 0x44403c, alpha: a });

    g.poly([-14, 4, -4, 9, -5, 12, -15, 7]);
    g.fill({ color: 0x64748b, alpha: a * 0.5 });
    g.circle(-9, 8, 1); g.fill({ color: 0xfef08a, alpha: a });

    // Sea-Green Sailcloth Standard
    const bannerWave = Math.sin(phase * 3.5) * 3;
    g.moveTo(0, -h + 2); g.lineTo(0, -h - 18);
    g.stroke({ width: 1.8, color: 0x44403c, alpha: a });
    g.poly([0, -h - 18, 12 + bannerWave, -h - 13, 0, -h - 8]);
    g.fill({ color: 0x0e7490, alpha: a });
    g.poly([0, -h - 16, 7 + bannerWave * 0.6, -h - 13, 0, -h - 10]);
    g.fill({ color: 0x67e8f9, alpha: a });
  }
}

function drawGoldMineCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette
): void {
  if (kit === "cedar") {
    // Cedar Kin: Forest Placer Mine & River-panning Flume
    // Stepped timber sluice flume cascading down the slope, heavy log headframe against river crag,
    // riffle sluice box catching nuggets, timber wash trough, and gold panning dish
    // Crag bedrock
    g.poly([-17, 3, -11, -18, 9, -20, 17, 1, 0, 9]);
    g.fill({ color: 0x57534e, alpha: a });
    // Mossy patches on rock
    g.circle(-5, -12, 3); g.fill({ color: 0x166534, alpha: a * 0.8 });
    g.circle(6, -8, 2.5); g.fill({ color: 0x14532d, alpha: a * 0.75 });
    // Glittering gold veins
    g.circle(-3, -14, 1.8); g.fill({ color: 0xfacc15, alpha: a });
    g.circle(3, -10, 1.5); g.fill({ color: 0xfde047, alpha: a });

    // Heavy cedar log timbering / adit portal
    g.poly([-9, 4, 1, 9, 1, -7, -9, -12]);
    g.fill({ color: 0x1c1917, alpha: a });
    // Log posts
    g.moveTo(-9, 4); g.lineTo(-9, -12); g.lineTo(1, -7); g.lineTo(1, 9);
    g.stroke({ width: 2.8, color: 0x854d0e, alpha: a });

    // Stepped Cedar Sluice Flume with rushing mountain water
    g.poly([-15, 5, -5, 10, -5, 7, -15, 2]);
    g.fill({ color: 0x78350f, alpha: a });
    g.poly([-14, 4, -6, 8, -6, 6, -14, 2]);
    g.fill({ color: 0x38bdf8, alpha: a * 0.85 }); // Clear water
    // Gold flecks in sluice riffles
    g.circle(-10, 5.5, 1); g.fill({ color: 0xfacc15, alpha: a });
    g.circle(-7, 7, 1); g.fill({ color: 0xfde047, alpha: a });

    // Split-cedar ore bin & cedar water bucket
    g.rect(5, 2, 8, 6);
    g.fill({ color: 0x5c3818, alpha: a });
    g.circle(8, 3, 2); g.fill({ color: 0xfacc15, alpha: a });
    g.circle(11, 4, 1.8); g.fill({ color: 0xfde047, alpha: a });

    // Round wooden gold panning dish
    g.ellipse(0, 6, 2.8, 1.6);
    g.fill({ color: 0x3f220c, alpha: a });
    g.circle(0, 6, 0.8); g.fill({ color: 0xfacc15, alpha: a });

  } else if (kit === "sand") {
    // Sand Banner: Desert Canyon Adit & Dry Winnowing Rocker Box
    // Sunbleached sandstone canyon cut with windlass hoist / well-bucket crane over deep dry shaft,
    // striped sun awning shading dry winnowing rocker box, earthenware amphorae of gold dust
    // Sandstone canyon cut
    g.poly([-17, 3, -10, -20, 8, -22, 17, 1, 0, 9]);
    g.fill({ color: 0xd6c7a1, alpha: a });
    // Desert strata scoring lines
    g.moveTo(-15, -4); g.lineTo(12, -7);
    g.stroke({ width: 1, color: 0xb8a77d, alpha: a * 0.7 });
    g.moveTo(-12, -12); g.lineTo(6, -15);
    g.stroke({ width: 1, color: 0xa89668, alpha: a * 0.7 });
    // Gold nuggets embedded in quartz vein
    g.circle(-4, -13, 2); g.fill({ color: 0xfacc15, alpha: a });
    g.circle(4, -9, 1.6); g.fill({ color: 0xfde047, alpha: a });

    // Square timber shaft with windlass crane
    g.poly([-8, 3, 0, 7, 0, -8, -8, -12]);
    g.fill({ color: 0x181410, alpha: a });
    // Acacia frame posts
    g.moveTo(-8, 3); g.lineTo(-8, -12); g.lineTo(0, -8); g.lineTo(0, 7);
    g.stroke({ width: 2.2, color: 0xa16207, alpha: a });
    // Windlass cross-axle & bucket rope
    g.moveTo(-8, -10); g.lineTo(0, -6);
    g.stroke({ width: 1.6, color: 0x78350f, alpha: a });
    g.moveTo(-4, -8); g.lineTo(-4, -1);
    g.stroke({ width: 0.8, color: 0xd1d5db, alpha: a });
    // Hoisted hide ore bucket
    g.circle(-4, 0, 2.2); g.fill({ color: 0x5c3818, alpha: a });
    g.circle(-4, -0.5, 1.2); g.fill({ color: 0xfacc15, alpha: a });

    // Striped sun awning over rocker table
    g.poly([3, 1, 15, -5, 15, -12, 3, -6]);
    g.fill({ color: 0xd97706, alpha: a * 0.9 });
    g.moveTo(3, 1); g.lineTo(3, -6);
    g.moveTo(15, -5); g.lineTo(15, -12);
    g.stroke({ width: 1.4, color: 0xa16207, alpha: a });

    // Dry winnowing rocker box on trestle
    g.rect(5, 1, 7, 4.5);
    g.fill({ color: 0x854d0e, alpha: a });
    g.circle(8, 2, 1.5); g.fill({ color: 0xfacc15, alpha: a });

    // Clay amphorae / earthenware jars of gold dust
    g.ellipse(-13, 5, 2.5, 3.5);
    g.fill({ color: 0xc2410c, alpha: a });
    g.rect(-13.5, 1.5, 1.5, 1.5); g.fill({ color: 0x9a3412, alpha: a });
    g.ellipse(-10, 6, 2, 2.8);
    g.fill({ color: 0xd97706, alpha: a });

  } else if (kit === "steppe") {
    // Wind Host: Nomadic Alluvial Pit & Golden Fleece Sluice
    // Open trench in gravel mound, timber shoring, horse-drawn hide drag-bucket,
    // nomad felt windbreak screen, sheep fleece sluice lined with wool fleece
    // Gravel embankment
    g.poly([-17, 3, -11, -17, 8, -19, 17, 1, 0, 9]);
    g.fill({ color: 0x57534e, alpha: a });
    g.poly([-14, 1, -8, -13, 5, -15, 13, 0, 0, 6]);
    g.fill({ color: 0x44403c, alpha: a });
    // Alluvial gold grains in gravel
    g.circle(-2, -10, 1.8); g.fill({ color: 0xfacc15, alpha: a });
    g.circle(5, -7, 1.5); g.fill({ color: 0xfde047, alpha: a });
    g.circle(-7, -4, 1.2); g.fill({ color: 0xfacc15, alpha: a });

    // Timber trench shoring
    g.poly([-8, 4, 1, 8, 1, -6, -8, -10]);
    g.fill({ color: 0x1c1917, alpha: a });
    g.moveTo(-8, 4); g.lineTo(-8, -10);
    g.moveTo(1, 8); g.lineTo(1, -6);
    g.stroke({ width: 2.2, color: 0x7c2d12, alpha: a });
    g.moveTo(-8, -3); g.lineTo(1, 1);
    g.stroke({ width: 1.5, color: 0xa16207, alpha: a });

    // Nomad Felt Windbreak Screen
    g.poly([-16, -6, -6, -11, -6, -19, -16, -14]);
    g.fill({ color: 0xd6d3d1, alpha: a * 0.95 });
    g.stroke({ width: 1.2, color: 0x7c2d12, alpha: a });

    // Fleece Sluice Trough (Golden Fleece method)
    g.poly([3, 5, 13, 0, 14, 3, 4, 8]);
    g.fill({ color: 0x78350f, alpha: a });
    // Wool fleece lining in trough with caught nuggets
    g.poly([4, 6, 12, 2, 13, 3, 5, 7]);
    g.fill({ color: 0xf5f5f4, alpha: a });
    g.circle(7, 5, 1.2); g.fill({ color: 0xfacc15, alpha: a });
    g.circle(10, 3.5, 1.2); g.fill({ color: 0xfde047, alpha: a });

    // Ironbound timber chest of nugget spoils
    g.rect(-13, 4, 5, 4);
    g.fill({ color: 0x5c3818, alpha: a });
    g.stroke({ width: 0.8, color: 0x18181b, alpha: a });
    g.circle(-10.5, 4.5, 0.8); g.fill({ color: 0xfacc15, alpha: a });

  } else {
    // Tide Clans: Coastal Reef & Tidal Sea-Cave Mine
    // Elevated stilt sluice on driftwood pilings above surf, tidal waterwheel driving stamp hammer,
    // salt-crusted bins, bamboo chutes, wicker baskets of black sand gold
    // Sea crag with barnacles / sea foam
    g.poly([-17, 3, -10, -19, 8, -21, 17, 1, 0, 9]);
    g.fill({ color: 0x475569, alpha: a });
    // Wet rock tide line
    g.poly([-17, 3, 0, 9, 17, 1, 15, 3, 0, 11, -15, 5]);
    g.fill({ color: 0x1e293b, alpha: a * 0.8 });
    // Seafoam edge
    g.circle(-6, 8, 1.5); g.fill({ color: 0xe0f2fe, alpha: a * 0.75 });
    g.circle(5, 7, 1.5); g.fill({ color: 0xe0f2fe, alpha: a * 0.75 });
    // Gold vein in wave-cut cave
    g.circle(-3, -11, 1.8); g.fill({ color: 0xfacc15, alpha: a });
    g.circle(3, -8, 1.5); g.fill({ color: 0xfde047, alpha: a });

    // Sea-cave entrance with timber pilings
    g.poly([-8, 3, 0, 7, 0, -8, -8, -12]);
    g.fill({ color: 0x0f172a, alpha: a });
    g.moveTo(-8, 3); g.lineTo(-8, -12); g.lineTo(0, -8); g.lineTo(0, 7);
    g.stroke({ width: 2.2, color: 0x44403c, alpha: a });

    // Elevated Driftwood Stilt Flume
    g.moveTo(3, 7); g.lineTo(3, 0);
    g.moveTo(12, 3); g.lineTo(12, -4);
    g.stroke({ width: 1.6, color: 0x57534e, alpha: a });
    g.poly([2, 0, 13, -5, 14, -2, 3, 3]);
    g.fill({ color: 0x334155, alpha: a });
    g.poly([3, 1, 12, -3.5, 13, -2, 4, 2.5]);
    g.fill({ color: 0x06b6d4, alpha: a * 0.85 }); // Surf water
    g.circle(7, 0, 1); g.fill({ color: 0xfacc15, alpha: a });

    // Wicker basket of black sand & gold
    g.ellipse(-12, 4, 3, 2.2);
    g.fill({ color: 0xa16207, alpha: a });
    g.circle(-12, 4, 1.5); g.fill({ color: 0x18181b, alpha: a });
    g.circle(-11.5, 3.8, 0.8); g.fill({ color: 0xfacc15, alpha: a });

    // Tidal paddle wheel
    g.circle(13, 2, 4.5);
    g.stroke({ width: 1.2, color: 0x44403c, alpha: a });
    g.circle(13, 2, 1); g.fill({ color: 0x94a3b8, alpha: a });
  }
}

function drawMarketCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette
): void {
  if (kit === "cedar") {
    // Cedar Kin: Forest Trading Post / Split-Cedar Log Trading House
    // Cedar shingle & bark canopies, timber trading counter, pelt racks (fur, buckskin),
    // bundled herbs, smoked fish / dried venison racks, woven bark baskets of berries, amber lantern
    // Main Log Trading Counter
    g.poly([-12, -1, 0, 5, 0, 5 - h * 0.75, -12, -1 - h * 0.75]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.poly([0, 5, 11, -1, 11, -1 - h * 0.75, 0, 5 - h * 0.75]);
    g.fill({ color: 0x5c3818, alpha: a });

    // Overhanging Cedar-Bark Roof Canopy
    g.poly([-15, -h * 0.75, 0, 7 - h * 0.75 - 7, 14, -h * 0.75, 0, -h * 0.75 - 13]);
    g.fill({ color: 0x654321, alpha: a });
    g.moveTo(-15, -h * 0.75); g.lineTo(0, 7 - h * 0.75 - 7); g.lineTo(14, -h * 0.75);
    g.stroke({ width: 1.4, color: 0x3f220c, alpha: a });

    // Side Timber Canopy (Left Stall)
    g.poly([-17, 2, -10, 6, -10, 6 - (h * 0.55), -17, 2 - (h * 0.55)]);
    g.fill({ color: 0x166534, alpha: a * 0.9 });
    g.moveTo(-17, 2); g.lineTo(-17, 2 - h * 0.55);
    g.stroke({ width: 1.2, color: 0x3f220c, alpha: a });

    // Fur / Pelt Racks (furs drying on wooden frame)
    g.moveTo(-14, 5); g.lineTo(-14, -2); g.lineTo(-9, 0.5); g.lineTo(-9, 7.5);
    g.stroke({ width: 1.2, color: 0x5c3818, alpha: a });
    g.poly([-13.5, 4, -9.5, 6, -9.5, 1, -13.5, -1]);
    g.fill({ color: 0xd4a359, alpha: a }); // Buckskin pelt

    // Berry Baskets & Forest Produce
    g.ellipse(3, 4.5, 2.5, 1.8);
    g.fill({ color: 0xa16207, alpha: a });
    g.circle(3, 4.5, 1.2); g.fill({ color: 0xef4444, alpha: a }); // Red berries
    g.ellipse(8, 2.5, 2.5, 1.8);
    g.fill({ color: 0xa16207, alpha: a });
    g.circle(8, 2.5, 1.2); g.fill({ color: 0x38bdf8, alpha: a }); // Blueberries

    // Amber lantern hanging from post
    g.rect(0, -h * 0.75 - 4, 2.2, 3.5);
    g.fill({ color: 0xfef08a, alpha: a * 0.95 });
    g.circle(1.1, -h * 0.75 - 2, 1.8);
    g.fill({ color: 0xf59e0b, alpha: a * 0.5 });

  } else if (kit === "sand") {
    // Sand Banner: Desert Souk / Grand Bazaar
    // Striped silk & linen awnings (desert gold, crimson, teal), mudbrick alcoves,
    // hanging brass lamps, sacks of fragrant spices (saffron, paprika, sumac), rolled carpets, date palm baskets
    // Mudbrick counter base
    g.poly([-13, 0, 0, 6, 0, 6 - h * 0.65, -13, 0 - h * 0.65]);
    g.fill({ color: 0xd6c7a1, alpha: a });
    g.poly([0, 6, 12, 0, 12, 0 - h * 0.65, 0, 6 - h * 0.65]);
    g.fill({ color: 0xb8a77d, alpha: a });

    // Center Striped Canopy: Crimson & Desert Gold
    g.poly([-11, -2, 2, 4.5, 2, 4.5 - h, -11, -2 - h]);
    g.fill({ color: 0xb45309, alpha: a });
    g.poly([2, 4.5, 13, -1, 13, -1 - h, 2, 4.5 - h]);
    g.fill({ color: 0xfacc15, alpha: a });
    g.poly([-13, -h, 2, 6.5 - h - 10, 15, -1 - h, 0, -h - 14]);
    g.fill({ color: 0xd97706, alpha: a });

    // Left Wing Canopy: Teal Silk
    g.poly([-18, 1, -9, 5, -9, 5 - (h - 2), -18, 1 - (h - 2)]);
    g.fill({ color: 0x0f766e, alpha: a * 0.9 });
    g.poly([-18, 1 - (h - 2), -9, 5 - (h - 2), -7, -h + 2, -16, -h - 2]);
    g.fill({ color: 0x14b8a6, alpha: a });

    // Upright timber posts supporting canopies
    g.moveTo(-16, 2); g.lineTo(-16, -h + 2);
    g.moveTo(0, 6); g.lineTo(0, -h + 6);
    g.moveTo(13, 0); g.lineTo(13, -h + 1);
    g.stroke({ width: 1.4, color: 0xa16207, alpha: a });

    // Sacks of exotic spices (Saffron, Paprika, Turmeric)
    g.circle(-6, 4.5, 2.4); g.fill({ color: 0xca8a04, alpha: a }); // Saffron gold
    g.circle(-2, 6, 2.2); g.fill({ color: 0xdc2626, alpha: a }); // Paprika crimson
    g.circle(4, 5, 2.2); g.fill({ color: 0xea580c, alpha: a }); // Sumac orange

    // Rolled desert carpets & brass urn
    g.rect(8, 2, 4, 6);
    g.fill({ color: 0x991b1b, alpha: a });
    g.ellipse(13, 3, 2, 3);
    g.fill({ color: 0xfacc15, alpha: a });

  } else if (kit === "steppe") {
    // Wind Host: Nomad Caravan Fair & Trading Yurt Encampment
    // Circular trading yurt with felt roof bands, flanked by spoked arba trade wagons,
    // displayed wool rugs, horse tack & bronze bridles on trestles, kumis jars
    // Central Circular Trading Yurt
    const yurtR = 9;
    g.ellipse(0, 0, yurtR + 2, yurtR * 0.55);
    g.fill({ color: 0x27272a, alpha: a * 0.4 });
    // Yurt wall drum
    g.poly([-yurtR, 0, yurtR, 0, yurtR, -h * 0.5, -yurtR, -h * 0.5]);
    g.fill({ color: 0xe7e5e4, alpha: a });
    // Timber lattice door frame
    g.rect(-2.5, -h * 0.45, 5, h * 0.45);
    g.fill({ color: 0x7c2d12, alpha: a });
    // Conical Felt Roof
    g.poly([-yurtR - 1.5, -h * 0.5, 0, -h - 4, yurtR + 1.5, -h * 0.5]);
    g.fill({ color: 0xd6d3d1, alpha: a });
    // Crimson felt tension bands
    g.moveTo(-yurtR, -h * 0.25); g.lineTo(yurtR, -h * 0.25);
    g.stroke({ width: 1.2, color: 0x9f1239, alpha: a });
    g.moveTo(-yurtR, -h * 0.5); g.lineTo(0, -h - 4); g.lineTo(yurtR, -h * 0.5);
    g.stroke({ width: 1.2, color: 0x9f1239, alpha: a });

    // Trade Arba Wagon (Left)
    g.rect(-16, 1, 6.5, 4);
    g.fill({ color: 0x78350f, alpha: a });
    // Spoked wooden cart wheel
    g.circle(-13, 5.5, 3.2);
    g.stroke({ width: 1.4, color: 0x44403c, alpha: a });
    g.circle(-13, 5.5, 0.8); g.fill({ color: 0xca8a04, alpha: a });

    // Wool felt bundles & horse tack on wooden trestle (Right)
    g.rect(6, 2, 7, 3.5);
    g.fill({ color: 0x9f1239, alpha: a });
    g.moveTo(7, 1); g.lineTo(12, 1);
    g.stroke({ width: 1, color: 0xfacc15, alpha: a }); // Bronze bridle
    g.ellipse(10, 6, 2.2, 3);
    g.fill({ color: 0x78350f, alpha: a }); // Kumis flagon

    // Clan Horsehair Standard
    g.moveTo(-1, -h - 4); g.lineTo(-1, -h - 14);
    g.stroke({ width: 1.4, color: 0x7c2d12, alpha: a });
    g.poly([-1, -h - 14, 5, -h - 11, -1, -h - 8]);
    g.fill({ color: 0x9f1239, alpha: a });

  } else {
    // Tide Clans: Shoreline Pier Market & Fish/Pearl Exchange
    // Raised driftwood boardwalk on timber pilings, thatched reed/palm canopies,
    // hanging sea glass lantern, woven wicker traps, pearl baskets, dried kelp, coral blocks
    // Boardwalk platform on pilings
    for (const px of [-14, -6, 2, 11]) {
      const py = (px + 14) * 0.35 + 2;
      g.moveTo(px, py); g.lineTo(px, py + 5);
      g.stroke({ width: 1.4, color: 0x44403c, alpha: a });
    }
    // Wooden plank decking
    g.poly([-16, 2, 0, 8, 14, 1, -2, -5]);
    g.fill({ color: 0x52525b, alpha: a });
    g.stroke({ width: 1, color: 0x334155, alpha: a });

    // Thatched Palm Pavilion Canopy
    g.poly([-14, -h * 0.7, 0, 6 - h * 0.7 - 8, 12, -h * 0.7, -2, -h * 0.7 - 12]);
    g.fill({ color: 0x0e7490, alpha: a * 0.9 });
    g.stroke({ width: 1.4, color: 0x155e75, alpha: a });
    // Palm frond roof fringe
    for (const fx of [-12, -7, -2, 3, 8]) {
      g.moveTo(fx, -h * 0.7 + 2); g.lineTo(fx - 1, -h * 0.7 + 5);
      g.stroke({ width: 1, color: 0x06b6d4, alpha: a });
    }

    // Fish Drying Rack & Woven Eel Traps
    g.moveTo(-13, 2); g.lineTo(-13, -h * 0.4); g.lineTo(-7, 2 - h * 0.4); g.lineTo(-7, 4);
    g.stroke({ width: 1.2, color: 0x44403c, alpha: a });
    g.poly([-12, 1 - h * 0.4, -8, 2 - h * 0.4, -8, -h * 0.4 - 2, -12, -h * 0.4 - 2]);
    g.fill({ color: 0x64748b, alpha: a }); // Dried fish

    // Pearl & Shell Baskets
    g.ellipse(2, 6, 2.5, 1.8);
    g.fill({ color: 0xa16207, alpha: a });
    g.circle(2, 6, 1.2); g.fill({ color: 0xf8fafc, alpha: a }); // Luminous pearls
    g.ellipse(7, 4.5, 2.5, 1.8);
    g.fill({ color: 0xa16207, alpha: a });
    g.circle(7, 4.5, 1.2); g.fill({ color: 0x06b6d4, alpha: a }); // Sea glass

    // Hanging Sea Lantern
    g.circle(-2, -h * 0.7 - 2, 2.2);
    g.fill({ color: 0x67e8f9, alpha: a * 0.9 });
    g.circle(-2, -h * 0.7 - 2, 1.1);
    g.fill({ color: 0xffffff, alpha: a });
  }
}

function drawInteriorWallCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette
): void {
  if (kit === "cedar") {
    // Cedar Kin: Squared Cross-Lap Cedar Log Stockade Block
    g.poly([-18, 0, 0, 9, 0, 6, -18, -3]);
    g.fill({ color: 0x3f3f46, alpha: a });
    g.poly([0, 9, 18, 0, 18, -3, 0, 6]);
    g.fill({ color: 0x27272a, alpha: a });

    g.poly([-17, -1, 0, 7.5, 0, 7.5 - h, -17, -1 - h]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.poly([0, 7.5, 17, -1, 17, -1 - h, 0, 7.5 - h]);
    g.fill({ color: 0x5c3818, alpha: a });

    for (const f of [0.25, 0.5, 0.75]) {
      g.moveTo(-17, -1 - h * f); g.lineTo(0, 7.5 - h * f);
      g.moveTo(0, 7.5 - h * f); g.lineTo(17, -1 - h * f);
      g.stroke({ width: 1.1, color: 0x3f220c, alpha: a });
    }

    g.poly([-17, -1 - h, 0, 7.5 - h, 17, -1 - h, 0, -9.5 - h]);
    g.fill({ color: 0x78350f, alpha: a });

    for (let i = -16; i <= 14; i += 5) {
      g.poly([i, -h - 1, i + 2, -h - 5, i + 4, -h - 1]);
      g.fill({ color: 0xd97706, alpha: a });
      g.stroke({ width: 0.6, color: 0x5c3818, alpha: a });
    }

    g.circle(-12, 1, 1.2); g.fill({ color: 0x166534, alpha: a * 0.8 });
    g.circle(8, 4, 1.2); g.fill({ color: 0x15803d, alpha: a * 0.8 });

  } else if (kit === "sand") {
    // Sand Banner: Sunbaked Sandstone Rampart with Sawtooth Merlons
    g.poly([-18, 0, 0, 9, 0, 6, -18, -3]);
    g.fill({ color: 0x92400e, alpha: a });
    g.poly([0, 9, 18, 0, 18, -3, 0, 6]);
    g.fill({ color: 0x78350f, alpha: a });

    g.poly([-17, -1, 0, 7.5, 0, 7.5 - h, -17, -1 - h]);
    g.fill({ color: 0xd4a373, alpha: a });
    g.poly([0, 7.5, 17, -1, 17, -1 - h, 0, 7.5 - h]);
    g.fill({ color: 0xa16207, alpha: a });

    for (const f of [0.33, 0.66]) {
      g.moveTo(-17, -1 - h * f); g.lineTo(0, 7.5 - h * f);
      g.moveTo(0, 7.5 - h * f); g.lineTo(17, -1 - h * f);
      g.stroke({ width: 0.8, color: 0x78350f, alpha: a * 0.6 });
    }

    g.poly([-17, -1 - h, 0, 7.5 - h, 17, -1 - h, 0, -9.5 - h]);
    g.fill({ color: 0xc29d62, alpha: a });

    for (let i = -15; i <= 13; i += 6) {
      g.poly([i, -h - 1, i + 2.5, -h - 4.5, i + 5, -h - 1]);
      g.fill({ color: 0xfde68a, alpha: a });
      g.stroke({ width: 0.7, color: 0xb45309, alpha: a });
    }

    g.rect(-8, 3 - h * 0.5, 1.4, 3.5); g.fill({ color: 0x451a03, alpha: a });
    g.rect(8, 3 - h * 0.5, 1.4, 3.5); g.fill({ color: 0x451a03, alpha: a });

  } else if (kit === "steppe") {
    // Wind Host: Nomad Rammed-Earth Rampart with Bound Hurdle Wattle
    g.poly([-18, 0, 0, 9, 0, 6, -18, -3]);
    g.fill({ color: 0x44403c, alpha: a });
    g.poly([0, 9, 18, 0, 18, -3, 0, 6]);
    g.fill({ color: 0x292524, alpha: a });

    g.poly([-17, -1, 0, 7.5, 0, 7.5 - h, -17, -1 - h]);
    g.fill({ color: 0x713f12, alpha: a });
    g.poly([0, 7.5, 17, -1, 17, -1 - h, 0, 7.5 - h]);
    g.fill({ color: 0x543007, alpha: a });

    for (const px of [-13, -7, -2, 4, 10, 15]) {
      const py = (px + 17) * 0.5 - 1;
      g.moveTo(px, py); g.lineTo(px, py - h);
      g.stroke({ width: 1.2, color: 0x291807, alpha: a });
    }

    g.poly([-17, -1 - h, 0, 7.5 - h, 17, -1 - h, 0, -9.5 - h]);
    g.fill({ color: 0x5c3818, alpha: a });

    for (let i = -16; i <= 14; i += 6) {
      g.rect(i, -h - 3.5, 4, 3.5);
      g.fill({ color: 0x854d0e, alpha: a });
      g.moveTo(i, -h - 3.5); g.lineTo(i + 4, -h - 3.5);
      g.stroke({ width: 0.8, color: 0xd97706, alpha: a });
    }

  } else if (kit === "islands") {
    // Tide Clans: Coral-Stone & Driftwood Stilt Palisade
    g.poly([-18, 0, 0, 9, 0, 6, -18, -3]);
    g.fill({ color: 0x334155, alpha: a });
    g.poly([0, 9, 18, 0, 18, -3, 0, 6]);
    g.fill({ color: 0x1e293b, alpha: a });

    g.poly([-17, -1, 0, 7.5, 0, 7.5 - h, -17, -1 - h]);
    g.fill({ color: 0x94a3b8, alpha: a });
    g.poly([0, 7.5, 17, -1, 17, -1 - h, 0, 7.5 - h]);
    g.fill({ color: 0x64748b, alpha: a });

    for (const f of [0.33, 0.66]) {
      g.moveTo(-17, -1 - h * f); g.lineTo(0, 7.5 - h * f);
      g.moveTo(0, 7.5 - h * f); g.lineTo(17, -1 - h * f);
      g.stroke({ width: 0.9, color: 0x78350f, alpha: a * 0.7 });
    }

    g.poly([-17, -1 - h, 0, 7.5 - h, 17, -1 - h, 0, -9.5 - h]);
    g.fill({ color: 0xa8a29e, alpha: a });

    for (let i = -16; i <= 14; i += 6) {
      g.rect(i, -h - 3.5, 4, 3.5);
      g.fill({ color: 0xd97706, alpha: a });
      g.moveTo(i, -h - 3.5); g.lineTo(i + 4, -h - 3.5);
      g.stroke({ width: 0.8, color: 0x06b6d4, alpha: a * 0.8 });
    }
  }
}

function drawGateCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette,
  isRim: boolean,
  gx: number,
  gy: number,
  rimNeighbors?: RimNeighbors
): void {
  if (kit === "cedar") {
    // Cedar Kin: Log Blockhouse Gatehouse with Wolf/Bear Totem Lintel
    g.poly([-18, 0, 0, 9, 0, 6, -18, -3]);
    g.fill({ color: 0x3f3f46, alpha: a });
    g.poly([0, 9, 18, 0, 18, -3, 0, 6]);
    g.fill({ color: 0x27272a, alpha: a });

    // Left log bastion tower
    g.poly([-17, -1, -8, 3.5, -8, 3.5 - (h + 4), -17, -1 - (h + 4)]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.poly([-8, 3.5, -4, 1.5, -4, 1.5 - (h + 4), -8, 3.5 - (h + 4)]);
    g.fill({ color: 0x5c3818, alpha: a });

    // Right log bastion tower
    g.poly([4, 1.5, 8, 3.5, 8, 3.5 - (h + 4), 4, 1.5 - (h + 4)]);
    g.fill({ color: 0x5c3818, alpha: a });
    g.poly([8, 3.5, 17, -1, 17, -1 - (h + 4), 8, 3.5 - (h + 4)]);
    g.fill({ color: 0x3f220c, alpha: a });

    for (const frac of [0.3, 0.6, 0.85]) {
      const myLeft = 3.5 - (h + 4) * frac;
      g.moveTo(-17, -1 - (h + 4) * frac); g.lineTo(-8, myLeft);
      const myRight = 3.5 - (h + 4) * frac;
      g.moveTo(8, myRight); g.lineTo(17, -1 - (h + 4) * frac);
      g.stroke({ width: 0.9, color: 0x3f220c, alpha: a * 0.7 });
    }

    // Central gatehouse curtain
    g.poly([-4, 1.5, 4, 1.5, 4, 1.5 - h, -4, 1.5 - h]);
    g.fill({ color: 0x78350f, alpha: a });

    // Sharpened log merlons
    g.poly([-17, -h - 5, -14, -h - 8, -11, -h - 5]); g.fill({ color: 0xd97706, alpha: a });
    g.poly([11, -h - 5, 14, -h - 8, 17, -h - 5]); g.fill({ color: 0xd97706, alpha: a });
    g.rect(-2, -h - 2, 4, 3); g.fill({ color: 0xd97706, alpha: a });

    // Carved beast totem lintel
    g.rect(-5, -h * 0.4, 10, 2.5);
    g.fill({ color: 0xd4a359, alpha: a });
    g.circle(-2, -h * 0.4 + 1.2, 0.7); g.fill({ color: 0x06b6d4, alpha: a });
    g.circle(2, -h * 0.4 + 1.2, 0.7); g.fill({ color: 0x06b6d4, alpha: a });

    // Gateway portal
    g.poly([-5, 5, 0, 7.5, 5, 5, 5, -1, 0, 1.5, -5, -1]);
    g.fill({ color: 0x1c1917, alpha: a });

    if (isRim) {
      // Split cedar double doors with blackened iron straps
      g.poly([-4, 4.5, 0, 6.5, 0, 0.5, -4, -1.5]); g.fill({ color: 0x78350f, alpha: a });
      g.poly([0, 6.5, 4, 4.5, 4, -1.5, 0, 0.5]); g.fill({ color: 0x5c3818, alpha: a });
      g.moveTo(0, 6.5); g.lineTo(0, 0.5); g.stroke({ width: 1, color: 0x3f220c, alpha: a });

      for (const dy of [-0.5, 2.5]) {
        g.moveTo(-4, dy); g.lineTo(0, dy + 2); g.lineTo(4, dy);
        g.stroke({ width: 1.4, color: 0x18181b, alpha: a });
      }
      for (const tx of [-3, -1, 1, 3]) {
        const ty = 0.5 - Math.abs(tx) * 0.25;
        g.moveTo(tx, ty - 3); g.lineTo(tx, ty);
        g.stroke({ width: 1.2, color: 0x3f220c, alpha: a });
      }
      const gPennant = Math.sin(phase * 4) * 2;
      g.moveTo(0, -h); g.lineTo(0, -h - 10);
      g.stroke({ width: 1.2, color: 0xd4a359, alpha: a });
      g.poly([0, -h - 10, 7 + gPennant, -h - 7, 0, -h - 4]);
      g.fill({ color: 0x15803d, alpha: a });
    }

    if (isRim && rimNeighbors) {
      drawGatehouseCurtainWings(g, 20 + (h - 24), a, gx, gy, rimNeighbors, kit, cult);
    }

  } else if (kit === "sand") {
    // Sand Banner: Desert Sandstone Gate with Horseshoe Arch & Mosaic Trim
    g.poly([-18, 0, 0, 9, 0, 6, -18, -3]);
    g.fill({ color: 0x92400e, alpha: a });
    g.poly([0, 9, 18, 0, 18, -3, 0, 6]);
    g.fill({ color: 0x78350f, alpha: a });

    // Left tower
    g.poly([-17, -1, -8, 3.5, -8, 3.5 - (h + 4), -17, -1 - (h + 4)]);
    g.fill({ color: 0xd4a373, alpha: a });
    g.poly([-8, 3.5, -4, 1.5, -4, 1.5 - (h + 4), -8, 3.5 - (h + 4)]);
    g.fill({ color: 0xa16207, alpha: a });

    // Right tower
    g.poly([4, 1.5, 8, 3.5, 8, 3.5 - (h + 4), 4, 1.5 - (h + 4)]);
    g.fill({ color: 0xa16207, alpha: a });
    g.poly([8, 3.5, 17, -1, 17, -1 - (h + 4), 8, 3.5 - (h + 4)]);
    g.fill({ color: 0x78350f, alpha: a });

    for (const frac of [0.3, 0.6, 0.85]) {
      const myLeft = 3.5 - (h + 4) * frac;
      g.moveTo(-17, -1 - (h + 4) * frac); g.lineTo(-8, myLeft);
      const myRight = 3.5 - (h + 4) * frac;
      g.moveTo(8, myRight); g.lineTo(17, -1 - (h + 4) * frac);
      g.stroke({ width: 0.8, color: 0x78350f, alpha: a * 0.6 });
    }

    // Central curtain
    g.poly([-4, 1.5, 4, 1.5, 4, 1.5 - h, -4, 1.5 - h]);
    g.fill({ color: 0xc29d62, alpha: a });

    // Stepped sawtooth merlons
    g.poly([-17, -h - 5, -14, -h - 8, -11, -h - 5]); g.fill({ color: 0xfde68a, alpha: a });
    g.poly([11, -h - 5, 14, -h - 8, 17, -h - 5]); g.fill({ color: 0xfde68a, alpha: a });
    g.rect(-2, -h - 2, 4, 3); g.fill({ color: 0xfde68a, alpha: a });

    // Decorative turquoise mosaic tile frieze
    g.rect(-4, 0.5 - h * 0.6, 8, 2);
    g.fill({ color: 0x0d9488, alpha: a });
    g.circle(0, 1.5 - h * 0.6, 0.8); g.fill({ color: 0xfacc15, alpha: a });

    // Horseshoe archway portal
    g.poly([-5, 5, 0, 7.5, 5, 5, 5, -1, 0, 2, -5, -1]);
    g.fill({ color: 0x271507, alpha: a });
    g.moveTo(-5, -1); g.lineTo(0, 2); g.lineTo(5, -1);
    g.stroke({ width: 1.8, color: 0xfde68a, alpha: a });

    if (isRim) {
      // Brass-studded cedar double doors
      g.poly([-4, 4.5, 0, 6.5, 0, 0.5, -4, -1.5]); g.fill({ color: 0x854d0e, alpha: a });
      g.poly([0, 6.5, 4, 4.5, 4, -1.5, 0, 0.5]); g.fill({ color: 0x78350f, alpha: a });
      g.circle(-2, 2.5, 0.6); g.fill({ color: 0xfacc15, alpha: a });
      g.circle(2, 2.5, 0.6); g.fill({ color: 0xfacc15, alpha: a });

      // Bronze lattice portcullis
      for (const tx of [-3, -1, 1, 3]) {
        const ty = 0.5 - Math.abs(tx) * 0.25;
        g.moveTo(tx, ty - 3); g.lineTo(tx, ty);
        g.stroke({ width: 1, color: 0xd97706, alpha: a });
      }

      const gPennant = Math.sin(phase * 4) * 2;
      g.moveTo(0, -h); g.lineTo(0, -h - 10);
      g.stroke({ width: 1.2, color: 0xfacc15, alpha: a });
      g.poly([0, -h - 10, 7 + gPennant, -h - 7, 0, -h - 4]);
      g.fill({ color: 0xdc2626, alpha: a });
    }

    if (isRim && rimNeighbors) {
      drawGatehouseCurtainWings(g, 20 + (h - 24), a, gx, gy, rimNeighbors, kit, cult);
    }

  } else if (kit === "steppe") {
    // Wind Host: Nomad Fortified Gate with Leather-Wrapped Pylons & Horsehair Standard
    g.poly([-18, 0, 0, 9, 0, 6, -18, -3]);
    g.fill({ color: 0x44403c, alpha: a });
    g.poly([0, 9, 18, 0, 18, -3, 0, 6]);
    g.fill({ color: 0x292524, alpha: a });

    // Left pylon
    g.poly([-17, -1, -8, 3.5, -8, 3.5 - (h + 4), -17, -1 - (h + 4)]);
    g.fill({ color: 0x713f12, alpha: a });
    g.poly([-8, 3.5, -4, 1.5, -4, 1.5 - (h + 4), -8, 3.5 - (h + 4)]);
    g.fill({ color: 0x543007, alpha: a });

    // Right pylon
    g.poly([4, 1.5, 8, 3.5, 8, 3.5 - (h + 4), 4, 1.5 - (h + 4)]);
    g.fill({ color: 0x543007, alpha: a });
    g.poly([8, 3.5, 17, -1, 17, -1 - (h + 4), 8, 3.5 - (h + 4)]);
    g.fill({ color: 0x291807, alpha: a });

    // Central curtain
    g.poly([-4, 1.5, 4, 1.5, 4, 1.5 - h, -4, 1.5 - h]);
    g.fill({ color: 0x5c3818, alpha: a });

    // Bound wattle hurdle merlons
    g.rect(-16, -h - 6, 6, 3.5); g.fill({ color: 0x854d0e, alpha: a });
    g.rect(10, -h - 6, 6, 3.5); g.fill({ color: 0x854d0e, alpha: a });
    g.rect(-2, -h - 2, 4, 3); g.fill({ color: 0x854d0e, alpha: a });

    // Horse skull talisman on lintel
    g.circle(0, 1 - h * 0.5, 1.5); g.fill({ color: 0xf5f5f4, alpha: a });
    g.rect(-0.8, 1.5 - h * 0.5, 1.6, 2); g.fill({ color: 0xe7e5e4, alpha: a });

    // Gateway portal
    g.poly([-5, 5, 0, 7.5, 5, 5, 5, -1, 0, 1.5, -5, -1]);
    g.fill({ color: 0x18181b, alpha: a });

    if (isRim) {
      g.poly([-4, 4.5, 0, 6.5, 0, 0.5, -4, -1.5]); g.fill({ color: 0x854d0e, alpha: a });
      g.poly([0, 6.5, 4, 4.5, 4, -1.5, 0, 0.5]); g.fill({ color: 0x713f12, alpha: a });
      g.moveTo(-3, 1); g.lineTo(3, 4); g.stroke({ width: 1, color: 0xd97706, alpha: a });
      g.moveTo(-3, 4); g.lineTo(3, 1); g.stroke({ width: 1, color: 0xd97706, alpha: a });

      const gPennant = Math.sin(phase * 4) * 2;
      g.moveTo(0, -h); g.lineTo(0, -h - 10);
      g.stroke({ width: 1.2, color: 0x291807, alpha: a });
      g.circle(0, -h - 10, 1.4); g.fill({ color: 0xf5f5f4, alpha: a });
      g.poly([0, -h - 9, 6 + gPennant, -h - 6, 0, -h - 3]);
      g.fill({ color: 0xdc2626, alpha: a });
    }

    if (isRim && rimNeighbors) {
      drawGatehouseCurtainWings(g, 20 + (h - 24), a, gx, gy, rimNeighbors, kit, cult);
    }

  } else if (kit === "islands") {
    // Tide Clans: Elevated Driftwood & Coral Gate with Bamboo Portcullis
    g.poly([-18, 0, 0, 9, 0, 6, -18, -3]);
    g.fill({ color: 0x334155, alpha: a });
    g.poly([0, 9, 18, 0, 18, -3, 0, 6]);
    g.fill({ color: 0x1e293b, alpha: a });

    // Left tower
    g.poly([-17, -1, -8, 3.5, -8, 3.5 - (h + 4), -17, -1 - (h + 4)]);
    g.fill({ color: 0x94a3b8, alpha: a });
    g.poly([-8, 3.5, -4, 1.5, -4, 1.5 - (h + 4), -8, 3.5 - (h + 4)]);
    g.fill({ color: 0x64748b, alpha: a });

    // Right tower
    g.poly([4, 1.5, 8, 3.5, 8, 3.5 - (h + 4), 4, 1.5 - (h + 4)]);
    g.fill({ color: 0x64748b, alpha: a });
    g.poly([8, 3.5, 17, -1, 17, -1 - (h + 4), 8, 3.5 - (h + 4)]);
    g.fill({ color: 0x334155, alpha: a });

    // Thatched gables on towers
    g.poly([-18, -h - 4, -12, -h - 10, -6, -h - 4]); g.fill({ color: 0xd97706, alpha: a });
    g.poly([6, -h - 4, 12, -h - 10, 18, -h - 4]); g.fill({ color: 0xd97706, alpha: a });

    // Central curtain
    g.poly([-4, 1.5, 4, 1.5, 4, 1.5 - h, -4, 1.5 - h]);
    g.fill({ color: 0xa8a29e, alpha: a });

    for (const sx of [-2, 0, 2]) {
      g.moveTo(sx, -h * 0.45); g.lineTo(sx, -h * 0.45 + 3);
      g.stroke({ width: 0.8, color: 0xfef08a, alpha: a });
    }

    g.poly([-5, 5, 0, 7.5, 5, 5, 5, -1, 0, 1.5, -5, -1]);
    g.fill({ color: 0x0f172a, alpha: a });

    if (isRim) {
      g.poly([-4, 4.5, 0, 6.5, 0, 0.5, -4, -1.5]); g.fill({ color: 0x78716c, alpha: a });
      g.poly([0, 6.5, 4, 4.5, 4, -1.5, 0, 0.5]); g.fill({ color: 0x57534e, alpha: a });

      for (const tx of [-3, -1, 1, 3]) {
        const ty = 0.5 - Math.abs(tx) * 0.25;
        g.moveTo(tx, ty - 3); g.lineTo(tx, ty);
        g.stroke({ width: 1.2, color: 0xca8a04, alpha: a });
      }

      const gPennant = Math.sin(phase * 4) * 2;
      g.moveTo(0, -h); g.lineTo(0, -h - 10);
      g.stroke({ width: 1.2, color: 0xca8a04, alpha: a });
      g.poly([0, -h - 10, 7 + gPennant, -h - 7, 0, -h - 4]);
      g.fill({ color: 0x06b6d4, alpha: a });
    }

    if (isRim && rimNeighbors) {
      drawGatehouseCurtainWings(g, 20 + (h - 24), a, gx, gy, rimNeighbors, kit, cult);
    }
  }
}

function drawChapelCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette,
  complete: boolean = true
): void {
  if (kit === "cedar") {
    // Cedar Kin: Sacred Spirit Grove Totem Lodge
    g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.poly([0, 8, 15, 0, 15, 0 - h, 0, 8 - h]);
    g.fill({ color: 0x5c3818, alpha: a });

    g.poly([-18, -h, 0, 9 - h - 12, 17, 0 - h, 0, -h - 18]);
    g.fill({ color: 0x654321, alpha: a });
    g.moveTo(-18, -h); g.lineTo(0, 9 - h - 12); g.lineTo(17, 0 - h);
    g.stroke({ width: 1.6, color: 0x166534, alpha: a * 0.9 });

    // Towering Carved Spirit Totem Pole (front yard)
    g.rect(-14, -h * 0.6, 4, 18);
    g.fill({ color: 0x78350f, alpha: a });
    g.poly([-17, -h * 0.5, -14, -h * 0.55, -10, -h * 0.5]);
    g.fill({ color: 0x5c3818, alpha: a });
    g.circle(-13, -h * 0.45, 0.8); g.fill({ color: 0x06b6d4, alpha: a });
    g.circle(-11, -h * 0.45, 0.8); g.fill({ color: 0x06b6d4, alpha: a });
    g.rect(-13.5, -h * 0.25, 3, 2); g.fill({ color: 0xd4a359, alpha: a });

    // Ceremonial Hearth Pit & Incense Smoke
    g.ellipse(8, 4, 3.5, 2); g.fill({ color: 0x3f3f46, alpha: a });
    if (complete) {
      const cPuff = Math.sin(phase * 2.5) * 1.5;
      g.circle(8, 2 + cPuff, 2); g.fill({ color: 0x86efac, alpha: 0.4 * a });
      g.circle(9, -2 + cPuff, 2.5); g.fill({ color: 0xe2e8f0, alpha: 0.3 * a });
    }

  } else if (kit === "sand") {
    // Sand Banner: Sun Sanctuary with Gilded Sunburst Cupola Dome
    g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
    g.fill({ color: 0xd4a373, alpha: a });
    g.poly([0, 8, 15, 0, 15, 0 - h, 0, 8 - h]);
    g.fill({ color: 0xa16207, alpha: a });

    for (const ax of [-11, -5, 4, 10]) {
      g.poly([ax - 2, 4 - h * 0.3, ax, 2 - h * 0.3, ax + 2, 4 - h * 0.3, ax + 2, 8 - h * 0.3, ax - 2, 8 - h * 0.3]);
      g.fill({ color: 0x451a03, alpha: a });
    }

    g.poly([-17, -h, 0, 8 - h - 5, 16, -h, 0, -h - 10]);
    g.fill({ color: 0xc29d62, alpha: a });

    // Central Gilded Sunburst Cupola Dome
    g.poly([-6, -h - 2, 0, -h - 16, 6, -h - 2]);
    g.fill({ color: 0xf59e0b, alpha: a });
    g.circle(0, -h - 8, 4.5); g.fill({ color: 0xfacc15, alpha: a });
    g.circle(0, -h - 16, 1.2); g.fill({ color: 0xfef08a, alpha: a });

    // Slender Minaret Spire at left
    g.rect(-15, -h - 20, 3, 18); g.fill({ color: 0xd4a373, alpha: a });
    g.poly([-16, -h - 20, -13.5, -h - 26, -11, -h - 20]); g.fill({ color: 0x0d9488, alpha: a });

    // Courtyard Fountain Basin
    g.ellipse(0, 5, 4, 2.2); g.fill({ color: 0x78350f, alpha: a });
    g.ellipse(0, 5, 3, 1.5); g.fill({ color: 0x38bdf8, alpha: a });

  } else if (kit === "steppe") {
    // Wind Host: Sky Altar & Tengri Shrine of the Eternal Blue
    g.poly([-16, 0, 0, 8, 0, 8 - h * 0.4, -16, 0 - h * 0.4]);
    g.fill({ color: 0x57534e, alpha: a });
    g.poly([0, 8, 15, 0, 15, 0 - h * 0.4, 0, 8 - h * 0.4]);
    g.fill({ color: 0x44403c, alpha: a });

    // Great White Ceremonial Yurt Pavilion
    const yR = 10;
    g.poly([-yR, 2 - h * 0.3, yR, 2 - h * 0.3, yR, 2 - h * 0.7, -yR, 2 - h * 0.7]);
    g.fill({ color: 0xf5f5f4, alpha: a });
    g.poly([-yR - 1, 2 - h * 0.7, 0, 2 - h - 8, yR + 1, 2 - h * 0.7]);
    g.fill({ color: 0xe7e5e4, alpha: a });
    g.moveTo(-yR, 2 - h * 0.7); g.lineTo(0, 2 - h - 8); g.lineTo(yR, 2 - h * 0.7);
    g.stroke({ width: 1.2, color: 0xdc2626, alpha: a });

    // Prayer Ribbon Poles
    for (const px of [-13, 12]) {
      g.moveTo(px, 3); g.lineTo(px, -h - 10);
      g.stroke({ width: 1.2, color: 0xd4a359, alpha: a });
      g.circle(px, -h - 10, 1.2); g.fill({ color: 0x38bdf8, alpha: a });
    }

    // Soaring Sulde (Horsehair Spirit Banner)
    const wave = Math.sin(phase * 4) * 2;
    g.moveTo(0, 2 - h - 8); g.lineTo(0, -h - 22);
    g.stroke({ width: 1.5, color: 0xd97706, alpha: a });
    g.poly([0, -h - 22, 6 + wave, -h - 18, 0, -h - 14]);
    g.fill({ color: 0x0284c7, alpha: a });

  } else if (kit === "islands") {
    // Tide Clans: Tide Shrine of the Deep & Giant Clam Pearl Altar
    g.poly([-16, 0, 0, 8, 0, 8 - h * 0.4, -16, 0 - h * 0.4]);
    g.fill({ color: 0x64748b, alpha: a });
    g.poly([0, 8, 15, 0, 15, 0 - h * 0.4, 0, 8 - h * 0.4]);
    g.fill({ color: 0x475569, alpha: a });

    for (const px of [-12, -4, 4, 12]) {
      g.moveTo(px, 3); g.lineTo(px, 3 - h);
      g.stroke({ width: 1.8, color: 0x78350f, alpha: a });
    }

    g.poly([-18, -h, 0, 9 - h - 14, 18, -h, 0, -h - 19]);
    g.fill({ color: 0xd97706, alpha: a });
    g.moveTo(-18, -h); g.lineTo(0, 9 - h - 14); g.lineTo(18, -h);
    g.stroke({ width: 1.5, color: 0x06b6d4, alpha: a });

    // Giant Clam Shell Font with glowing seawater
    g.ellipse(0, 3 - h * 0.2, 4.5, 2.5); g.fill({ color: 0xf8fafc, alpha: a });
    g.ellipse(0, 3 - h * 0.2, 3.2, 1.6); g.fill({ color: 0x06b6d4, alpha: a * 0.9 });
    g.circle(0, 3 - h * 0.2, 1.2); g.fill({ color: 0xffffff, alpha: a });

    // Ancestor Tiki Monolith
    g.rect(10, -2, 3.5, 6); g.fill({ color: 0x334155, alpha: a });
    g.circle(11.7, -0.5, 0.8); g.fill({ color: 0xfef08a, alpha: a });
  }
}

function drawInfirmaryCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette,
  complete: boolean = true
): void {
  if (kit === "cedar") {
    // Cedar Kin: Woodland Herbalist Lodge & Healing Soaking Bath
    g.poly([-15, -1, 0, 6.5, 0, 6.5 - h, -15, -1 - h]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.poly([0, 6.5, 13, 0, 13, 0 - h, 0, 6.5 - h]);
    g.fill({ color: 0x5c3818, alpha: a });

    g.poly([-17, -h, 0, 8 - h - 11, 15, -h, 0, -h - 17]);
    g.fill({ color: 0x166534, alpha: a });
    g.moveTo(-17, -h); g.lineTo(0, 8 - h - 11); g.lineTo(15, -h);
    g.stroke({ width: 1.2, color: 0x15803d, alpha: a });

    // Sacred Spiraling Leaf Healing Emblem (drop red cross)
    g.circle(6, 2 - h * 0.5, 3.5);
    g.fill({ color: 0x14532d, alpha: a });
    g.circle(6, 2 - h * 0.5, 2);
    g.fill({ color: 0x4ade80, alpha: a });

    g.rect(-12, -h - 14, 4, 9);
    g.fill({ color: 0x64748b, alpha: a });
    if (complete) {
      const cPuff = Math.sin(phase * 2.2) * 1.8;
      g.circle(-10, -h - 17 + cPuff, 2.4);
      g.fill({ color: 0x86efac, alpha: 0.45 * a });
    }

    // Natural Cedar Soaking Tub with Steaming Stones
    g.ellipse(8, 4.5, 4.5, 2.6); g.fill({ color: 0x78350f, alpha: a });
    g.ellipse(8, 4.5, 3.5, 1.8); g.fill({ color: 0x38bdf8, alpha: a * 0.8 });
    g.circle(7, 4.2, 0.9); g.fill({ color: 0x3f3f46, alpha: a });
    g.circle(9, 4.5, 0.9); g.fill({ color: 0x52525b, alpha: a });

    // Herbal drying rack
    g.moveTo(-14, 4); g.lineTo(-10, 6); g.lineTo(-6, 4);
    g.stroke({ width: 1.2, color: 0x78350f, alpha: a });
    g.circle(-10, 4.5, 1.2); g.fill({ color: 0xa855f7, alpha: a });

  } else if (kit === "sand") {
    // Sand Banner: Bimaristan / Desert Apothecary House
    g.poly([-15, -1, 0, 6.5, 0, 6.5 - h, -15, -1 - h]);
    g.fill({ color: 0xfef3c7, alpha: a });
    g.poly([0, 6.5, 13, 0, 13, 0 - h, 0, 6.5 - h]);
    g.fill({ color: 0xd4a373, alpha: a });

    g.poly([-16, -h, 0, 7 - h - 5, 14, -h, 0, -h - 10]);
    g.fill({ color: 0xc29d62, alpha: a });
    g.poly([-12, -h - 4, 0, -h - 8, 12, -h - 4, 0, -h - 1]);
    g.fill({ color: 0xfef08a, alpha: a * 0.9 });

    // Golden Mortar / Aloe Bloom Healing Emblem
    g.circle(6, 2 - h * 0.5, 3.5);
    g.fill({ color: 0x78350f, alpha: a });
    g.circle(6, 2 - h * 0.5, 2.2);
    g.fill({ color: 0xfacc15, alpha: a });

    // Central Cooling Fountain & Aloe Pots
    g.ellipse(8, 4.5, 3.5, 2); g.fill({ color: 0x92400e, alpha: a });
    g.ellipse(8, 4.5, 2.5, 1.2); g.fill({ color: 0x38bdf8, alpha: a });
    g.circle(-11, 4.5, 1.6); g.fill({ color: 0x15803d, alpha: a });

    // Copper Distillation Alembic Still
    g.rect(-7, 3, 3, 3); g.fill({ color: 0xd97706, alpha: a });
    g.circle(-5.5, 2, 1.5); g.fill({ color: 0xb45309, alpha: a });

  } else if (kit === "steppe") {
    // Wind Host: Nomad Shaman Yurt & Healing Sanctuary
    const yR = 9;
    g.poly([-yR, 1 - h * 0.2, yR, 1 - h * 0.2, yR, 1 - h * 0.6, -yR, 1 - h * 0.6]);
    g.fill({ color: 0xf5f5f4, alpha: a });
    g.poly([-yR - 1, 1 - h * 0.6, 0, 1 - h - 6, yR + 1, 1 - h * 0.6]);
    g.fill({ color: 0xe7e5e4, alpha: a });

    // Sun-Wheel Healing Symbol on front flap
    g.circle(0, 1 - h * 0.4, 3.2); g.fill({ color: 0xdc2626, alpha: a });
    g.circle(0, 1 - h * 0.4, 1.8); g.fill({ color: 0xfacc15, alpha: a });

    // Healing Sage & Wormwood smoke puff
    if (complete) {
      const puff = Math.sin(phase * 2.2) * 1.5;
      g.circle(0, -h - 8 + puff, 2.2); g.fill({ color: 0xd1fae5, alpha: 0.5 * a });
    }

    // Sheepskin Cot under Awning
    g.rect(6, 2, 6, 3.5); g.fill({ color: 0x78350f, alpha: a });
    g.rect(6.5, 2.5, 5, 2.5); g.fill({ color: 0xf5f5f4, alpha: a });

    g.moveTo(-12, 4); g.lineTo(-9, 1); g.lineTo(-6, 4);
    g.stroke({ width: 1.2, color: 0x5c3818, alpha: a });

  } else if (kit === "islands") {
    // Tide Clans: Reef Apothecary & Slatted Stilt Hospice
    g.poly([-15, -1, 0, 6.5, 0, 6.5 - h, -15, -1 - h]);
    g.fill({ color: 0x94a3b8, alpha: a });
    g.poly([0, 6.5, 13, 0, 13, 0 - h, 0, 6.5 - h]);
    g.fill({ color: 0x64748b, alpha: a });

    for (const f of [0.3, 0.5, 0.7]) {
      g.moveTo(-15, -1 - h * f); g.lineTo(0, 6.5 - h * f);
      g.moveTo(0, 6.5 - h * f); g.lineTo(13, 0 - h * f);
      g.stroke({ width: 0.8, color: 0x334155, alpha: a * 0.6 });
    }

    g.poly([-17, -h, 0, 8 - h - 11, 15, -h, 0, -h - 16]);
    g.fill({ color: 0xd97706, alpha: a });

    // Spiraling Nautilus Shell Healing Emblem
    g.circle(6, 2 - h * 0.5, 3.2); g.fill({ color: 0x0f766e, alpha: a });
    g.circle(6, 2 - h * 0.5, 1.8); g.fill({ color: 0x06b6d4, alpha: a });

    // Bamboo Aqueduct Flume & Freshwater Basin
    g.moveTo(-14, -h * 0.3); g.lineTo(-8, 3);
    g.stroke({ width: 1.6, color: 0xca8a04, alpha: a });
    g.ellipse(-7, 4, 3, 1.8); g.fill({ color: 0x38bdf8, alpha: a });

    // Medicinal Kelp & Coral Sponge Racks
    g.rect(7, 3, 5, 2.5); g.fill({ color: 0x78350f, alpha: a });
    g.circle(8.5, 4, 1.2); g.fill({ color: 0x0d9488, alpha: a });
    g.circle(10.5, 4, 1.2); g.fill({ color: 0xfef08a, alpha: a });
  }
}

function drawSiegeWorkshopCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette
): void {
  if (kit === "cedar") {
    // Cedar Kin: Logging Yard Battering Ram & Heavy Catapult Yard
    g.poly([-16, 0, 0, 8, 0, 8 - h * 0.4, -16, 0 - h * 0.4]);
    g.fill({ color: 0x3f3f46, alpha: a });
    g.poly([0, 8, 16, 0, 16, 0 - h * 0.4, 0, 8 - h * 0.4]);
    g.fill({ color: 0x27272a, alpha: a });

    // Heavy Cedar Gantry Frame
    g.moveTo(-14, 2); g.lineTo(-14, -h - 4); g.lineTo(-2, -h - 4); g.lineTo(-2, 7);
    g.stroke({ width: 2.4, color: 0x5c3818, alpha: a });

    // Massive Suspended Battering Ram with Carved Ironwood Head
    g.moveTo(-14, -h * 0.5); g.lineTo(-8, 1);
    g.moveTo(-2, -h * 0.5); g.lineTo(2, 4);
    g.stroke({ width: 1, color: 0x18181b, alpha: a });
    g.poly([-10, 0, 4, 5, 4, 2, -10, -3]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.poly([4, 5, 7, 6, 7, 3, 4, 2]);
    g.fill({ color: 0x3f220c, alpha: a });

    // Stacked fire-hardened cedar stakes & pitch barrels
    g.rect(8, 2, 4, 5); g.fill({ color: 0x18181b, alpha: a });
    g.moveTo(7, 6); g.lineTo(14, 2); g.stroke({ width: 1.4, color: 0xd97706, alpha: a });

    // Blacksmith Hearth with glowing coals
    g.ellipse(13, 6, 2.8, 1.8); g.fill({ color: 0x475569, alpha: a });
    const fFlame = Math.sin(phase * 5) * 0.3;
    g.circle(13, 5.5, 1.6 + fFlame); g.fill({ color: 0xea580c, alpha: a });

  } else if (kit === "sand") {
    // Sand Banner: Desert Traction Mangonel & Fire Arsenal
    g.poly([-16, 0, 0, 8, 0, 8 - h * 0.4, -16, 0 - h * 0.4]);
    g.fill({ color: 0xa16207, alpha: a });
    g.poly([0, 8, 16, 0, 16, 0 - h * 0.4, 0, 8 - h * 0.4]);
    g.fill({ color: 0x78350f, alpha: a });

    // Striped Canvas Sunshade Canopy
    g.poly([-15, -h + 2, -1, 7 - h, -2, -h - 7, -16, -h - 4]);
    g.fill({ color: 0xdc2626, alpha: a });
    g.poly([-12, -h + 1, -1, 7 - h, -2, -h - 7, -13, -h - 5]);
    g.fill({ color: 0xfacc15, alpha: a * 0.85 });

    // Traction Mangonel on Sandstone Frame
    g.moveTo(-3, 4); g.lineTo(7, -1);
    g.stroke({ width: 3.5, color: 0x8c7954, alpha: a });
    g.circle(2, 1, 2); g.fill({ color: 0xd97706, alpha: a });
    g.moveTo(-2, 3); g.lineTo(9, -20);
    g.stroke({ width: 2.8, color: 0xb45309, alpha: a });

    // Terracotta Greek Fire Amphorae
    g.circle(10, 4, 1.8); g.fill({ color: 0xd97706, alpha: a });
    g.circle(13, 2, 1.8); g.fill({ color: 0xd97706, alpha: a });
    g.circle(11.5, 0.5, 1.6); g.fill({ color: 0xea580c, alpha: a });

    // Sandstone shot pyramid
    g.circle(-8, 5, 2); g.fill({ color: 0xfef3c7, alpha: a });
    g.circle(-5, 6.5, 2); g.fill({ color: 0xfde68a, alpha: a });

  } else if (kit === "steppe") {
    // Wind Host: Nomad War Arba Workshop & Swivel Siege Ballista
    g.poly([-16, 0, 0, 8, 0, 8 - h * 0.4, -16, 0 - h * 0.4]);
    g.fill({ color: 0x57534e, alpha: a });
    g.poly([0, 8, 16, 0, 16, 0 - h * 0.4, 0, 8 - h * 0.4]);
    g.fill({ color: 0x44403c, alpha: a });

    // Heavy Two-Wheeled Siege Arba Wagon
    g.circle(-2, 7, 4.5); g.fill({ color: 0x78350f, alpha: a });
    g.circle(8, 2, 4.5); g.fill({ color: 0x5c3818, alpha: a });
    g.circle(-2, 7, 1); g.fill({ color: 0xd1d5db, alpha: a });
    g.circle(8, 2, 1); g.fill({ color: 0xd1d5db, alpha: a });

    g.poly([-8, 2, 4, 7, 4, -4, -8, -9]);
    g.fill({ color: 0x713f12, alpha: a });
    for (const sx of [-6, -2, 2]) {
      g.circle(sx, 1, 0.7); g.fill({ color: 0xd1d5db, alpha: a });
    }

    // Mounted heavy recurve spear-thrower
    g.moveTo(0, 0); g.lineTo(10, -16);
    g.stroke({ width: 2.6, color: 0x291807, alpha: a });
    g.moveTo(5, -16); g.lineTo(14, -13);
    g.stroke({ width: 2.2, color: 0xdc2626, alpha: a });

    // Quiver chest of siege bolts
    g.rect(-14, 1, 5, 4); g.fill({ color: 0x451a03, alpha: a });
    g.moveTo(-13, 0); g.lineTo(-9, 0); g.stroke({ width: 1.2, color: 0xd1d5db, alpha: a });

  } else if (kit === "islands") {
    // Tide Clans: Coastal Harpoon Artillery & Driftwood Slipway
    g.poly([-16, 0, 0, 8, 0, 8 - h * 0.4, -16, 0 - h * 0.4]);
    g.fill({ color: 0x475569, alpha: a });
    g.poly([0, 8, 16, 0, 16, 0 - h * 0.4, 0, 8 - h * 0.4]);
    g.fill({ color: 0x334155, alpha: a });

    // Driftwood slipway launch ramps
    g.moveTo(-14, 4); g.lineTo(12, -4);
    g.stroke({ width: 2.8, color: 0x78716c, alpha: a });
    g.moveTo(-10, 6); g.lineTo(16, -2);
    g.stroke({ width: 2.8, color: 0x57534e, alpha: a });

    // Heavy Swivel Harpoon Ballista
    g.circle(1, 1, 3.5); g.fill({ color: 0x1e293b, alpha: a });
    g.moveTo(-2, 3); g.lineTo(8, -18);
    g.stroke({ width: 3, color: 0x0284c7, alpha: a });

    // Massive Barbed Whale Harpoon & Coiled Line
    g.moveTo(7, -17); g.lineTo(11, -22);
    g.stroke({ width: 2, color: 0x38bdf8, alpha: a });
    g.circle(-5, 4.5, 2.5); g.fill({ color: 0xa16207, alpha: a });

    // Volcanic Basalt Shot Stack
    g.circle(10, 4, 2); g.fill({ color: 0x18181b, alpha: a });
    g.circle(13, 2, 2); g.fill({ color: 0x27272a, alpha: a });
    g.circle(11.5, 0.5, 1.8); g.fill({ color: 0x3f3f46, alpha: a });
  }
}

/**
 * Unfinished watchtower presentation: authentic timber construction scaffolding tower.
 * Replaces finished stone masonry with wooden standards, ledgers, diagonal cross-braces,
 * staging platforms, access ladder, and a builder's hoist lifting stone blocks.
 */
export function drawWatchtowerScaffolding(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette,
  isRim: boolean = false
): void {
  // Scaffolding wood & stone palette adapted by culture kit
  let woodMain = 0x78350f;     // Warm oak timber
  let woodLedger = 0x854d0e;   // Medium ledger planks
  let woodPlank = 0xb45309;    // Platform decking
  let woodDark = 0x451a03;     // Shadowed uprights & lashings
  let stoneFoot = 0x64748b;    // Cut foundation stone
  let stoneLit = 0x94a3b8;     // Lit stone face
  let ropeColor = 0xd4a373;    // Natural hemp rope

  if (kit === "cedar") {
    woodMain = 0x5c3818;
    woodLedger = 0x78350f;
    woodPlank = 0x854d0e;
    woodDark = 0x291807;
    stoneFoot = 0x52525b;
    stoneLit = 0x71717a;
    ropeColor = 0xb45309;
  } else if (kit === "sand") {
    woodMain = 0x92400e;
    woodLedger = 0xb45309;
    woodPlank = 0xd97706;
    woodDark = 0x451a03;
    stoneFoot = 0xa16207;
    stoneLit = 0xd4a373;
    ropeColor = 0xfde68a;
  } else if (kit === "steppe") {
    woodMain = 0x44403c;
    woodLedger = 0x57534e;
    woodPlank = 0x78716c;
    woodDark = 0x1c1917;
    stoneFoot = 0x27272a;
    stoneLit = 0x3f3f46;
    ropeColor = 0xa8a29e;
  } else if (kit === "islands") {
    woodMain = 0xca8a04;
    woodLedger = 0xa16207;
    woodPlank = 0xeab308;
    woodDark = 0x713f12;
    stoneFoot = 0x78716c;
    stoneLit = 0xa8a29e;
    ropeColor = 0xfef08a;
  }

  // 1. Partial Foundation Masonry (Work In Progress Footings)
  // Low foundation plinth showing initial stone courses laid by builders
  g.poly([-8, 0, 0, 4, 0, 1.5, -8, -2.5]);
  g.fill({ color: stoneLit, alpha: a });
  g.poly([0, 4, 8, 0, 8, -2.5, 0, 1.5]);
  g.fill({ color: stoneFoot, alpha: a });

  // Plinth top surface
  g.poly([-8, -2.5, 0, 1.5, 8, -2.5, 0, -6.5]);
  g.fill({ color: stoneLit, alpha: a * 0.85 });

  // Uncut ashlar stone blocks waiting to be laid near the base
  g.poly([-11, 2, -7, 4, -7, 1.5, -11, -0.5]);
  g.fill({ color: stoneFoot, alpha: a });
  g.poly([6, 3, 10, 1, 10, -1.5, 6, 0.5]);
  g.fill({ color: stoneLit, alpha: a });

  // 2. Corner Upright Scaffold Poles (Timber Standards)
  // Back-left pole
  g.moveTo(-7, -4); g.lineTo(-5, -h);
  g.stroke({ width: 2.0, color: woodDark, alpha: a * 0.85 });
  // Back-right pole
  g.moveTo(7, -4); g.lineTo(5, -h);
  g.stroke({ width: 2.0, color: woodDark, alpha: a * 0.85 });
  // Front-left pole
  g.moveTo(-7, 2); g.lineTo(-5, -h + 2);
  g.stroke({ width: 2.2, color: woodMain, alpha: a });
  // Front-right pole
  g.moveTo(7, 2); g.lineTo(5, -h + 2);
  g.stroke({ width: 2.2, color: woodMain, alpha: a });

  // 3. Multi-Tier Horizontal Ledgers & Diagonal X-Braces
  const tiers = isRim ? [0.22, 0.44, 0.66, 0.88, 1.0] : [0.28, 0.55, 0.82, 1.0];
  let prevY = 0;

  for (let i = 0; i < tiers.length; i++) {
    const f = tiers[i];
    const currY = -h * f;
    const lX = -7 + 2 * f;
    const rX = 7 - 2 * f;

    // Horizontal front ledger rail
    g.moveTo(lX, currY + 2); g.lineTo(rX, currY + 2);
    g.stroke({ width: 1.6, color: woodLedger, alpha: a });

    // Diagonal X-braces between tiers
    if (i > 0) {
      const prevLX = -7 + 2 * tiers[i - 1];
      const prevRX = 7 - 2 * tiers[i - 1];
      // Diagonal 1
      g.moveTo(prevLX, prevY + 2); g.lineTo(rX, currY + 2);
      g.stroke({ width: 1.1, color: woodLedger, alpha: a * 0.9 });
      // Diagonal 2
      g.moveTo(prevRX, prevY + 2); g.lineTo(lX, currY + 2);
      g.stroke({ width: 1.1, color: woodLedger, alpha: a * 0.9 });

      // Rope joint lashings (dark dots at joints)
      g.circle(lX, currY + 2, 0.9); g.fill({ color: 0x1e293b, alpha: a });
      g.circle(rX, currY + 2, 0.9); g.fill({ color: 0x1e293b, alpha: a });
    }

    prevY = currY;
  }

  // 4. Staging Work Platforms (Planking Decks)
  // Mid-level working platform
  const midF = isRim ? 0.44 : 0.55;
  const midY = -h * midF;
  g.poly([
    -6.5, midY + 3,
    0, midY + 6,
    6.5, midY + 3,
    0, midY,
  ]);
  g.fill({ color: woodPlank, alpha: a });
  g.stroke({ width: 0.8, color: woodDark, alpha: a });

  // Top construction staging platform
  const topY = -h * (isRim ? 0.88 : 0.82);
  g.poly([
    -5.5, topY + 2.5,
    0, topY + 5,
    5.5, topY + 2.5,
    0, topY,
  ]);
  g.fill({ color: woodPlank, alpha: a });
  g.stroke({ width: 0.8, color: woodDark, alpha: a });

  // Stack of building planks on mid platform
  g.rect(-4, midY + 1, 4, 1.8);
  g.fill({ color: woodLedger, alpha: a });

  // 5. Access Ladder along Left Upright
  for (let ly = 0; ly > midY; ly -= 3.2) {
    g.moveTo(-7.5, ly + 1.5); g.lineTo(-5.2, ly + 1.5);
    g.stroke({ width: 0.9, color: woodMain, alpha: a });
  }

  // 6. Builder's Hoist Crane Jib & Suspended Stone Block
  // Cantilever boom pole projecting from top platform
  const boomY = -h;
  g.moveTo(0, topY + 1); g.lineTo(9, boomY - 3);
  g.stroke({ width: 1.8, color: woodMain, alpha: a });
  // Diagonal boom brace strut
  g.moveTo(3, topY + 2); g.lineTo(7, boomY - 1);
  g.stroke({ width: 1.1, color: woodLedger, alpha: a });

  // Pulley wheel at the boom tip
  g.circle(9, boomY - 3, 1.2);
  g.fill({ color: 0x334155, alpha: a });

  // Hanging hoist rope
  const ropeSway = Math.sin(phase * 2) * 0.8;
  g.moveTo(9, boomY - 2);
  g.lineTo(9 + ropeSway, boomY + 7);
  g.stroke({ width: 0.9, color: ropeColor, alpha: a });

  // Hoisted ashlar stone block swinging gently on the line
  g.poly([
    7.5 + ropeSway, boomY + 7,
    10.5 + ropeSway, boomY + 7,
    10.5 + ropeSway, boomY + 10.5,
    7.5 + ropeSway, boomY + 10.5,
  ]);
  g.fill({ color: stoneLit, alpha: a });
  g.stroke({ width: 0.5, color: stoneFoot, alpha: a });

  // Mortar bucket on the top deck
  g.rect(-3, topY - 1, 2.2, 2.5);
  g.fill({ color: 0x475569, alpha: a });
}

function drawWatchtowerCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette,
  complete: boolean = true,
  isRim: boolean = false
): void {
  if (!complete) {
    drawWatchtowerScaffolding(g, h, a, phase, kit, cult, isRim);
    return;
  }

  if (kit === "cedar") {
    // Cedar Kin: Cross-Braced Cedar Trestle Lookout with Beacon Cage
    g.poly([-8, 0, 0, 4, 8, 0, 0, -4]); g.fill({ color: 0x3f3f46, alpha: a });

    g.moveTo(-7, 0); g.lineTo(-4, -h);
    g.moveTo(7, 0); g.lineTo(4, -h);
    g.moveTo(0, 4); g.lineTo(0, -h + 2);
    g.stroke({ width: 2.2, color: 0x78350f, alpha: a });

    const fTies = isRim ? [0.2, 0.4, 0.6, 0.8] : [0.25, 0.5, 0.75];
    for (const f of fTies) {
      g.moveTo(-6, -h * f); g.lineTo(6, -h * f);
      g.stroke({ width: 1.2, color: 0x5c3818, alpha: a });
    }

    g.poly([-8, -h + 2, 0, 4 - h, 8, -h + 2, 0, -h - 4]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.poly([-8, -h - 2, 0, -h - 16, 8, -h - 2]);
    g.fill({ color: 0x654321, alpha: a });

    // Cedar Beacon Cage & Signal Fire
    const fPuff = Math.sin(phase * 6) * 1.2;
    g.rect(-3.5, -h - 17, 7, 2); g.fill({ color: 0x27272a, alpha: a });
    g.circle(0, -h - 18, 2.5 + fPuff * 0.2); g.fill({ color: 0xea580c, alpha: a });
    g.circle(0, -h - 18, 1.2); g.fill({ color: 0xfacc15, alpha: a });
    if (isRim) {
      g.ellipse(0, -h - 18, 7.5, 4.2); g.fill({ color: 0xfde047, alpha: 0.18 * a });
    }

    g.circle(-5, -h, 1.6); g.fill({ color: 0xd97706, alpha: a });

  } else if (kit === "sand") {
    // Sand Banner: Slender Sandstone Minaret with Openwork Balcony
    g.poly([-8, 0, 0, 4, 8, 0, 0, -4]); g.fill({ color: 0x92400e, alpha: a });

    g.poly([-6, 0, 0, 3, 0, 3 - h, -6, -h]); g.fill({ color: 0xd4a373, alpha: a });
    g.poly([0, 3, 6, 0, 6, -h, 0, 3 - h]); g.fill({ color: 0xa16207, alpha: a });

    g.rect(-2, -h * 0.4, 1.4, 4); g.fill({ color: 0x451a03, alpha: a });
    g.rect(2, -h * 0.7, 1.4, 4); g.fill({ color: 0x451a03, alpha: a });
    if (isRim) {
      g.rect(-2, -h * 0.2, 1.4, 3.5); g.fill({ color: 0x451a03, alpha: a });
    }

    g.poly([-9, -h + 2, 0, 5 - h, 9, -h + 2, 0, -h - 4]);
    g.fill({ color: 0xc29d62, alpha: a });
    g.rect(-8, -h - 3, 16, 3); g.fill({ color: 0xfde68a, alpha: a });

    g.poly([-6, -h - 3, 0, -h - 15, 6, -h - 3]); g.fill({ color: 0xd97706, alpha: a });
    g.circle(0, -h - 15, 1.4); g.fill({ color: 0xfacc15, alpha: a });

    // Sand Beacon Lantern Cupola & Pennant
    const sWave = Math.sin(phase * 4) * 2;
    g.moveTo(0, -h - 15); g.lineTo(8 + sWave, -h - 11);
    g.stroke({ width: 1.2, color: 0xdc2626, alpha: a });
    if (isRim) {
      const flame = Math.sin(phase * 6) * 1.2;
      g.circle(0, -h - 17, 2.2 + flame * 0.25); g.fill({ color: 0xf97316, alpha: a });
      g.circle(0, -h - 17, 1.0); g.fill({ color: 0xfef08a, alpha: a });
      g.ellipse(0, -h - 17, 6.5, 3.8); g.fill({ color: 0xfde047, alpha: a * 0.16 });
    }

  } else if (kit === "steppe") {
    // Wind Host: Nomad Timber Lookout Scaffolding & Signal Smoke Pylon
    g.poly([-8, 0, 0, 4, 8, 0, 0, -4]); g.fill({ color: 0x44403c, alpha: a });

    g.moveTo(-7, 0); g.lineTo(-3, -h);
    g.moveTo(7, 0); g.lineTo(3, -h);
    g.stroke({ width: 2, color: 0x5c3818, alpha: a });

    for (let y = -4; y > -h; y -= 5) {
      g.moveTo(-3, y); g.lineTo(3, y);
      g.stroke({ width: 1, color: 0x78350f, alpha: a });
    }

    g.rect(-6, -h - 2, 12, 6); g.fill({ color: 0x854d0e, alpha: a });
    g.stroke({ width: 1, color: 0x291807, alpha: a });

    // Signal Beacon Coals & Billowing Signal Smoke
    const sPuff = Math.sin(phase * 3) * 2;
    g.circle(0, -h - 8 + sPuff, 3); g.fill({ color: 0x3f3f46, alpha: 0.5 * a });
    g.circle(2, -h - 14 + sPuff, 4); g.fill({ color: 0x27272a, alpha: 0.35 * a });

    g.moveTo(5, -h - 2); g.lineTo(5, -h - 12);
    g.stroke({ width: 1.2, color: 0x291807, alpha: a });
    g.circle(5, -h - 12, 1.4); g.fill({ color: 0xdc2626, alpha: a });

    if (isRim) {
      // Elevated beacon brazier on rim
      g.rect(-2.5, -h - 4, 5, 2.5); g.fill({ color: 0x1c1917, alpha: a });
      g.circle(0, -h - 4, 1.6); g.fill({ color: 0xea580c, alpha: a });
      g.circle(0, -h - 4, 0.8); g.fill({ color: 0xfacc15, alpha: a });
    }

  } else if (kit === "islands") {
    // Tide Clans: Driftwood & Bamboo Lighthouse Tower
    g.poly([-8, 0, 0, 4, 8, 0, 0, -4]); g.fill({ color: 0x334155, alpha: a });

    g.moveTo(-6, 0); g.lineTo(-3, -h);
    g.moveTo(6, 0); g.lineTo(3, -h);
    g.stroke({ width: 2, color: 0xca8a04, alpha: a });

    g.poly([-8, -h + 2, 0, 4 - h, 8, -h + 2, 0, -h - 4]);
    g.fill({ color: 0xa8a29e, alpha: a });
    g.poly([-7, -h - 2, 0, -h - 14, 7, -h - 2]);
    g.fill({ color: 0xd97706, alpha: a });

    // Nautical Beacon Light
    g.circle(0, -h - 4, 2.8); g.fill({ color: 0x06b6d4, alpha: a * 0.9 });
    g.circle(0, -h - 4, 1.4); g.fill({ color: 0xffffff, alpha: a });
    if (isRim) {
      g.ellipse(0, -h - 4, 8, 4.5); g.fill({ color: 0x38bdf8, alpha: 0.22 * a });
    }

    g.circle(-4, -h, 1.4); g.fill({ color: 0xfef08a, alpha: a });
  }
}

function drawBarracksCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette
): void {
  if (kit === "cedar") {
    // Cedar Kin: Hewn Log Warrior Lodge on Riverstone Plinth
    g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.poly([0, 8, 16, 0, 16, 0 - h, 0, 8 - h]);
    g.fill({ color: 0x5c3818, alpha: a });

    g.poly([-18, -h, 0, 9 - h - 10, 18, 0 - h, 0, -h - 16]);
    g.fill({ color: 0x654321, alpha: a });
    g.moveTo(0, 9 - h - 10); g.lineTo(0, -h - 18);
    g.stroke({ width: 1.5, color: 0xfacc15, alpha: a });

    g.rect(-4, 2, 8, 7); g.fill({ color: 0x271507, alpha: a });

    g.moveTo(10, 4); g.lineTo(10, -2); g.stroke({ width: 1.4, color: 0x5c3818, alpha: a });
    g.circle(10, 0, 2); g.fill({ color: 0x166534, alpha: a });

    g.moveTo(-11, 4); g.lineTo(-11, 0); g.stroke({ width: 1.6, color: 0x78350f, alpha: a });
    g.circle(-11, 0, 2); g.fill({ color: 0xd4a359, alpha: a });

  } else if (kit === "sand") {
    // Sand Banner: Desert Guard Barracks with Shaded Colonnade
    g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
    g.fill({ color: 0xd4a373, alpha: a });
    g.poly([0, 8, 16, 0, 16, 0 - h, 0, 8 - h]);
    g.fill({ color: 0xa16207, alpha: a });

    for (const bx of [-14, -6, 2, 10]) {
      g.rect(bx, -h - 3.5, 4, 3.5); g.fill({ color: 0xfde68a, alpha: a });
    }

    g.poly([-12, 1, -2, 5, 6, 2, -4, -2]);
    g.fill({ color: 0xdc2626, alpha: a * 0.9 });

    g.moveTo(11, 4); g.lineTo(11, 0); g.stroke({ width: 1.2, color: 0x78350f, alpha: a });
    g.circle(11, 2, 1.8); g.fill({ color: 0xfacc15, alpha: a });

  } else if (kit === "steppe") {
    // Wind Host: Nomad War Yurt Compound
    const yR = 10;
    g.poly([-yR, 0, yR, 0, yR, -h * 0.5, -yR, -h * 0.5]);
    g.fill({ color: 0xe7e5e4, alpha: a });
    g.poly([-yR - 1, -h * 0.5, 0, -h - 8, yR + 1, -h * 0.5]);
    g.fill({ color: 0xd6d3d1, alpha: a });

    g.moveTo(-yR, -h * 0.5); g.lineTo(yR, -h * 0.5);
    g.stroke({ width: 1.5, color: 0xdc2626, alpha: a });

    const wave = Math.sin(phase * 4) * 2;
    g.moveTo(0, -h - 8); g.lineTo(0, -h - 18);
    g.stroke({ width: 1.4, color: 0x291807, alpha: a });
    g.poly([0, -h - 18, 7 + wave, -h - 14, 0, -h - 10]);
    g.fill({ color: 0xdc2626, alpha: a });

    g.ellipse(9, 3, 4, 2.2); g.fill({ color: 0xa8a29e, alpha: a * 0.6 });

  } else if (kit === "islands") {
    // Tide Clans: Elevated Coral & Bamboo Warrior Pavilion
    g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
    g.fill({ color: 0x94a3b8, alpha: a });
    g.poly([0, 8, 16, 0, 16, 0 - h, 0, 8 - h]);
    g.fill({ color: 0x64748b, alpha: a });

    g.poly([-18, -h, 0, 9 - h - 10, 18, 0 - h, 0, -h - 15]);
    g.fill({ color: 0xd97706, alpha: a });

    g.moveTo(10, 4); g.lineTo(10, -3); g.stroke({ width: 1.4, color: 0xca8a04, alpha: a });
    g.circle(10, -3, 1.4); g.fill({ color: 0x06b6d4, alpha: a });

    g.poly([-8, 3, 0, 6.5, 8, 3, 0, -0.5]);
    g.fill({ color: 0xd4d4d4, alpha: a * 0.8 });
  }
}

function drawStablesCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette
): void {
  if (kit === "cedar") {
    // Cedar Kin: Woodland Split-Rail Elk/Horse Corral & Lean-To
    g.poly([-16, 0, 0, 8, 0, 8 - h * 0.8, -16, 0 - h * 0.8]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.poly([0, 8, 14, 1, 14, 1 - h * 0.8, 0, 8 - h * 0.8]);
    g.fill({ color: 0x5c3818, alpha: a });

    g.poly([-18, -h * 0.8, 0, 9 - h * 0.8 - 9, 16, 1 - h * 0.8, 0, -h * 0.8 - 12]);
    g.fill({ color: 0x654321, alpha: a });

    g.moveTo(-14, 4); g.lineTo(-2, 7); g.stroke({ width: 1.4, color: 0x78350f, alpha: a });
    g.rect(4, 3, 6, 3); g.fill({ color: 0x5c3818, alpha: a });
    g.rect(4, 2, 6, 1.5); g.fill({ color: 0x166534, alpha: a });

  } else if (kit === "sand") {
    // Sand Banner: Arabian Horse Pavilion with Horseshoe Arches & Water Basin
    g.poly([-16, 0, 0, 8, 0, 8 - h, -16, 0 - h]);
    g.fill({ color: 0xd4a373, alpha: a });
    g.poly([0, 8, 14, 1, 14, 1 - h, 0, 8 - h]);
    g.fill({ color: 0xa16207, alpha: a });

    g.poly([-10, 5, -5, 2.5, -5, -h * 0.3, -10, 2 - h * 0.3]); g.fill({ color: 0x451a03, alpha: a });
    g.poly([3, 4, 8, 2, 8, -h * 0.3, 3, 2 - h * 0.3]); g.fill({ color: 0x451a03, alpha: a });

    g.poly([-16, -h, 0, 7 - h - 6, 15, 1 - h, 0, -h - 10]);
    g.fill({ color: 0xdc2626, alpha: a });

    g.rect(-8, 5, 5, 2.5); g.fill({ color: 0xfef3c7, alpha: a });
    g.rect(-7, 5.5, 3, 1.2); g.fill({ color: 0x38bdf8, alpha: a });

  } else if (kit === "steppe") {
    // Wind Host: Nomad Steppe Horse Herd Paddock & Felt Shelter
    g.poly([-16, 0, 0, 8, 0, 8 - h * 0.6, -16, 0 - h * 0.6]);
    g.fill({ color: 0x713f12, alpha: a });
    g.poly([0, 8, 14, 1, 14, 1 - h * 0.6, 0, 8 - h * 0.6]);
    g.fill({ color: 0x543007, alpha: a });

    g.poly([-17, -h * 0.6, 0, 7 - h * 0.6 - 6, 15, -h * 0.6, 0, -h * 0.6 - 9]);
    g.fill({ color: 0xe7e5e4, alpha: a });

    for (const px of [-12, -4, 4, 12]) {
      g.moveTo(px, 4); g.lineTo(px, 0); g.stroke({ width: 1.4, color: 0x451a03, alpha: a });
    }
    g.moveTo(-12, 2); g.lineTo(12, 2); g.stroke({ width: 1, color: 0xd97706, alpha: a });

    g.rect(6, 3, 5, 3); g.fill({ color: 0x78350f, alpha: a });
    g.circle(8.5, 3, 1.6); g.fill({ color: 0xfacc15, alpha: a });

  } else if (kit === "islands") {
    // Tide Clans: Coastal Pack-Beast & Boar Stilt Pen
    g.poly([-16, 0, 0, 8, 0, 8 - h * 0.7, -16, 0 - h * 0.7]);
    g.fill({ color: 0x94a3b8, alpha: a });
    g.poly([0, 8, 14, 1, 14, 1 - h * 0.7, 0, 8 - h * 0.7]);
    g.fill({ color: 0x64748b, alpha: a });

    g.poly([-17, -h * 0.7, 0, 7 - h * 0.7 - 7, 15, -h * 0.7, 0, -h * 0.7 - 11]);
    g.fill({ color: 0xd97706, alpha: a });

    g.rect(-8, 5, 6, 2.5); g.fill({ color: 0x78350f, alpha: a });
    g.circle(-5, 5.5, 1.4); g.fill({ color: 0x0f766e, alpha: a });
  }
}

function drawArcheryRangeCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette
): void {
  if (kit === "cedar") {
    // Cedar Kin: Woodland Hunting Range with Carved Animal Targets
    g.poly([-14, 0, 0, 7, 14, 0, 0, -7]);
    g.fill({ color: 0x166534, alpha: a });

    g.poly([-16, -3, -7, 2, -7, -12, -16, -17]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.poly([-16, -17, -7, -12, -4, -20, -13, -24]);
    g.fill({ color: 0x5c3818, alpha: a });

    g.circle(8, -5, 5); g.fill({ color: 0x78350f, alpha: a });
    g.circle(8, -5, 3.2); g.fill({ color: 0xd4a359, alpha: a });
    g.circle(8, -5, 1.4); g.fill({ color: 0x166534, alpha: a });
    g.moveTo(8, -5); g.lineTo(13, -9); g.stroke({ width: 1, color: 0xfacc15, alpha: a });

    g.circle(3, 3, 3.5); g.fill({ color: 0x78350f, alpha: a });
    g.circle(3, 3, 2); g.fill({ color: 0xef4444, alpha: a });

  } else if (kit === "sand") {
    // Sand Banner: Desert Archery Pavilion with Striped Silk Canopy
    g.poly([-14, 0, 0, 7, 14, 0, 0, -7]);
    g.fill({ color: 0xd4a373, alpha: a });

    g.poly([-16, -4, -7, 1, -7, -14, -16, -19]);
    g.fill({ color: 0xdc2626, alpha: a });
    g.poly([-16, -19, -7, -14, -4, -22, -13, -26]);
    g.fill({ color: 0xfacc15, alpha: a });

    g.circle(8, -6, 5.5); g.fill({ color: 0xfef3c7, alpha: a });
    g.circle(8, -6, 3.5); g.fill({ color: 0xd97706, alpha: a });
    g.circle(8, -6, 1.5); g.fill({ color: 0xdc2626, alpha: a });
    g.moveTo(8, -6); g.lineTo(13, -10); g.stroke({ width: 1, color: 0x18181b, alpha: a });

    g.circle(3, 2, 4); g.fill({ color: 0xfef3c7, alpha: a });
    g.circle(3, 2, 2.2); g.fill({ color: 0x0d9488, alpha: a });

    g.ellipse(-4, 3, 1.5, 2.5); g.fill({ color: 0xfacc15, alpha: a });

  } else if (kit === "steppe") {
    // Wind Host: Mounted Archery Track & Hanging Ring Targets
    g.poly([-14, 0, 0, 7, 14, 0, 0, -7]);
    g.fill({ color: 0x713f12, alpha: a });

    g.poly([-16, -4, -7, 1, -7, -14, -16, -19]);
    g.fill({ color: 0xe7e5e4, alpha: a });
    g.poly([-16, -19, -7, -14, -4, -22, -13, -26]);
    g.fill({ color: 0x475569, alpha: a });

    g.moveTo(8, 0); g.lineTo(8, -12); g.stroke({ width: 1.4, color: 0x5c3818, alpha: a });
    g.circle(8, -12, 4); g.fill({ color: 0xfacc15, alpha: a });
    g.circle(8, -12, 2); g.fill({ color: 0xdc2626, alpha: a });
    g.moveTo(8, -12); g.lineTo(12, -15); g.stroke({ width: 1, color: 0x18181b, alpha: a });

    g.circle(3, 2, 3.5); g.fill({ color: 0x854d0e, alpha: a });
    g.circle(3, 2, 1.8); g.fill({ color: 0xf5f5f4, alpha: a });

  } else if (kit === "islands") {
    // Tide Clans: Shoreline Spear & Archery Deck with Fish-Basket Targets
    g.poly([-14, 0, 0, 7, 14, 0, 0, -7]);
    g.fill({ color: 0x0e7490, alpha: a });

    g.poly([-16, -4, -7, 1, -7, -14, -16, -19]);
    g.fill({ color: 0xd97706, alpha: a });
    g.poly([-16, -19, -7, -14, -4, -22, -13, -26]);
    g.fill({ color: 0xb45309, alpha: a });

    g.circle(8, -6, 5); g.fill({ color: 0xa16207, alpha: a });
    g.circle(8, -6, 3); g.fill({ color: 0x06b6d4, alpha: a });
    g.circle(8, -6, 1.2); g.fill({ color: 0xfef08a, alpha: a });
    g.moveTo(8, -6); g.lineTo(13, -11); g.stroke({ width: 1.2, color: 0xca8a04, alpha: a });

    g.circle(3, 2, 3.5); g.fill({ color: 0x78350f, alpha: a });
    g.circle(3, 2, 1.8); g.fill({ color: 0x38bdf8, alpha: a });
  }
}

// -------------------------------------------------------------
// Building Height Resolver for Isometric Elevations & Overlays
// -------------------------------------------------------------
export function buildingHeight(typeId: string, lvl: number = 1, gx?: number, gy?: number): number {
  const heightBoost = (Math.max(1, Math.min(5, lvl)) - 1) * 3;
  switch (typeId) {
    case "watchtower": {
      const isRim = gx !== undefined && gy !== undefined && isRimTile(gx, gy);
      return (isRim ? 44 : 34) + heightBoost;
    }
    case "keep": return 30 + heightBoost;
    case "academy":
    case "chapel": return 26 + heightBoost;
    case "granary":
    case "barracks":
    case "gate": return 24 + heightBoost;
    case "mint":
    case "mason":
    case "stables":
    case "infirmary":
    case "siege_workshop":
    case "walls": return 20 + heightBoost;
    case "farm":
    case "gold_mine":
    case "sawmill":
    case "market": return 18 + heightBoost;
    case "cottage":
    case "lumber":
    case "lumber_camp":
    case "archery_range": return 16 + heightBoost;
    case "quarry": return 14 + heightBoost;
    default: return 20 + heightBoost;
  }
}

// -------------------------------------------------------------
// Scarred Building Presentation: Cracked Stone, Impact Crater & Rubble
// -------------------------------------------------------------
export function drawCrackedStoneOverlay(
  g: Graphics,
  typeId: string,
  h: number,
  gx: number = 0,
  gy: number = 0,
  kit: CultureKit = "western",
  lvl: number = 1
): void {
  let creviceCol = 0x0f172a;
  let highlightCol = 0xcbd5e1;
  let rubbleCol = 0x64748b;
  let rubbleDarkCol = 0x334155;
  let rubbleLightCol = 0x94a3b8;
  let scorchCol = 0x18181b;

  if (kit === "sand") {
    creviceCol = 0x451a03;
    highlightCol = 0xfef08a;
    rubbleCol = 0xd4a373;
    rubbleDarkCol = 0x78350f;
    rubbleLightCol = 0xfacc15;
    scorchCol = 0x291405;
  } else if (kit === "steppe") {
    creviceCol = 0x1c1917;
    highlightCol = 0xd6d3d1;
    rubbleCol = 0x78716c;
    rubbleDarkCol = 0x44403c;
    rubbleLightCol = 0xa8a29e;
    scorchCol = 0x0c0a09;
  } else if (kit === "cedar") {
    creviceCol = 0x271406;
    highlightCol = 0x86efac;
    rubbleCol = 0x52525b;
    rubbleDarkCol = 0x27272a;
    rubbleLightCol = 0x71717a;
    scorchCol = 0x18181b;
  } else if (kit === "islands") {
    creviceCol = 0x082f49;
    highlightCol = 0xa5f3fc;
    rubbleCol = 0x475569;
    rubbleDarkCol = 0x1e293b;
    rubbleLightCol = 0x94a3b8;
    scorchCol = 0x0f172a;
  }

  // Deterministic PRNG seeded by tile coords & height for stable unique crack layout
  const seed = Math.abs((gx * 73856093) ^ (gy * 19349663) ^ (Math.round(h) * 83492791));
  const prng = (i: number) => {
    const val = Math.sin(seed + i * 14.1234) * 43758.5453;
    return val - Math.floor(val);
  };

  const leftFacet = prng(1) > 0.35;

  // 1. Primary Structural Fissure Fault Line
  const x0 = leftFacet ? -11 + (prng(2) - 0.5) * 4 : 5 + (prng(2) - 0.5) * 4;
  const y0 = -h * 0.82 + (prng(3) - 0.5) * 3;
  const x1 = x0 + (leftFacet ? 3 + prng(4) * 3 : -(3 + prng(4) * 3));
  const y1 = y0 + h * 0.28;
  const x2 = x1 + (leftFacet ? -2.5 - prng(5) * 2 : 2.5 + prng(5) * 2);
  const y2 = y1 + h * 0.25;
  const x3 = x2 + (leftFacet ? 3 + prng(6) * 3 : -(3 + prng(6) * 3));
  const y3 = y2 + h * 0.25;
  const x4 = x3 + (leftFacet ? -1.5 : 1.5);
  const y4 = Math.min(y3 + 4, 6);

  // Deep shadow crevice
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.lineTo(x2, y2);
  g.lineTo(x3, y3);
  g.lineTo(x4, y4);
  g.stroke({ width: 1.6, color: creviceCol, alpha: 0.95 });

  // Light chipped stone ridge highlight (+0.6px offset)
  g.moveTo(x0 + 0.6, y0 + 0.4);
  g.lineTo(x1 + 0.6, y1 + 0.4);
  g.lineTo(x2 + 0.6, y2 + 0.4);
  g.lineTo(x3 + 0.6, y3 + 0.4);
  g.lineTo(x4 + 0.6, y4 + 0.4);
  g.stroke({ width: 0.8, color: highlightCol, alpha: 0.75 });

  // Branch fissure splitting off midpoint
  const bx1 = x2 + (leftFacet ? -4 - prng(7) * 3 : 4 + prng(7) * 3);
  const by1 = y2 + 3 + prng(8) * 3;
  g.moveTo(x2, y2);
  g.lineTo(bx1, by1);
  g.stroke({ width: 1.1, color: creviceCol, alpha: 0.85 });
  g.moveTo(x2 + 0.5, y2 + 0.4);
  g.lineTo(bx1 + 0.5, by1 + 0.4);
  g.stroke({ width: 0.6, color: highlightCol, alpha: 0.65 });

  // 2. Transverse Stress Fissure on Opposite Facet
  const rx0 = leftFacet ? 3 + prng(9) * 4 : -9 + prng(9) * 4;
  const ry0 = -h * 0.68 + prng(10) * 4;
  const rx1 = rx0 + (leftFacet ? 3 + prng(11) * 3 : -3 - prng(11) * 3);
  const ry1 = ry0 + h * 0.28;
  const rx2 = rx1 + (leftFacet ? -2 : 2);
  const ry2 = ry1 + h * 0.22;
  g.moveTo(rx0, ry0);
  g.lineTo(rx1, ry1);
  g.lineTo(rx2, ry2);
  g.stroke({ width: 1.3, color: creviceCol, alpha: 0.9 });
  g.moveTo(rx0 + 0.5, ry0 + 0.4);
  g.lineTo(rx1 + 0.5, ry1 + 0.4);
  g.lineTo(rx2 + 0.5, ry2 + 0.4);
  g.stroke({ width: 0.7, color: highlightCol, alpha: 0.7 });

  // 3. Eave / Parapet Cleaved Notch
  const ex = -3 + (prng(12) - 0.5) * 8;
  const ey = -h + 2;
  g.moveTo(ex, ey);
  g.lineTo(ex + 2, ey - 4);
  g.lineTo(ex - 1.2, ey - 7);
  g.stroke({ width: 1.4, color: creviceCol, alpha: 0.95 });
  g.moveTo(ex + 0.6, ey);
  g.lineTo(ex + 2.6, ey - 4);
  g.stroke({ width: 0.8, color: highlightCol, alpha: 0.7 });

  // 4. Radial Impact Blowout Crater (Siege Struck Core)
  const ix = leftFacet ? x1 - 1 : rx1 - 1;
  const iy = leftFacet ? y1 : ry1;

  // Impact scorch halo
  g.ellipse(ix, iy + 0.5, 4.2, 2.6);
  g.fill({ color: 0x000000, alpha: 0.28 });

  // Crater depression
  g.ellipse(ix, iy, 2.6, 1.8);
  g.fill({ color: scorchCol, alpha: 0.9 });
  g.stroke({ width: 0.8, color: creviceCol, alpha: 0.9 });

  // Pulverized stone fleck highlights
  g.circle(ix - 1.8, iy - 0.8, 0.7);
  g.fill({ color: highlightCol, alpha: 0.85 });
  g.circle(ix + 1.8, iy + 0.7, 0.6);
  g.fill({ color: highlightCol, alpha: 0.85 });

  // Radiating stress fracture spokes
  const angles = [0.45, 2.1, 3.75, 5.25];
  for (let aIdx = 0; aIdx < angles.length; aIdx++) {
    const ang = angles[aIdx] + (prng(13 + aIdx) - 0.5) * 0.4;
    const len = 3.5 + prng(17 + aIdx) * 3.5;
    const sx = ix + Math.cos(ang) * len;
    const sy = iy + Math.sin(ang) * (len * 0.55);
    g.moveTo(ix, iy);
    g.lineTo(sx, sy);
    g.stroke({ width: 0.9, color: creviceCol, alpha: 0.85 });
  }

  // 5. Fallen Rubble Masonry Blocks at Ground Plinth
  // Block 1 (primary fallen stone block)
  const b1x = -10 + (prng(21) - 0.5) * 4;
  const b1y = 4 + prng(22) * 3;
  g.ellipse(b1x + 1.5, b1y + 2.5, 3.2, 1.4);
  g.fill({ color: 0x000000, alpha: 0.35 });
  g.poly([b1x, b1y - 1.5, b1x + 3, b1y - 2.8, b1x + 4.5, b1y - 1.5, b1x + 1.5, b1y - 0.2]);
  g.fill({ color: rubbleLightCol, alpha: 0.95 });
  g.poly([b1x + 1.5, b1y - 0.2, b1x + 4.5, b1y - 1.5, b1x + 4.5, b1y + 1, b1x + 1.5, b1y + 2.2]);
  g.fill({ color: rubbleCol, alpha: 0.95 });
  g.poly([b1x, b1y - 1.5, b1x + 1.5, b1y - 0.2, b1x + 1.5, b1y + 2.2, b1x, b1y + 1]);
  g.fill({ color: rubbleDarkCol, alpha: 0.95 });
  g.stroke({ width: 0.5, color: creviceCol, alpha: 0.7 });

  // Block 2 (secondary fallen stone chunk)
  const b2x = 6 + (prng(23) - 0.5) * 4;
  const b2y = 3 + prng(24) * 3;
  g.ellipse(b2x + 1, b2y + 2, 2.6, 1.2);
  g.fill({ color: 0x000000, alpha: 0.3 });
  g.poly([b2x, b2y - 1, b2x + 2.5, b2y - 2, b2x + 3.8, b2y - 1, b2x + 1.2, b2y]);
  g.fill({ color: rubbleLightCol, alpha: 0.95 });
  g.poly([b2x + 1.2, b2y, b2x + 3.8, b2y - 1, b2x + 3.8, b2y + 1.2, b2x + 1.2, b2y + 2]);
  g.fill({ color: rubbleCol, alpha: 0.95 });
  g.poly([b2x, b2y - 1, b2x + 1.2, b2y, b2x + 1.2, b2y + 2, b2x, b2y + 1]);
  g.fill({ color: rubbleDarkCol, alpha: 0.95 });

  // Scattered debris pebble chips
  const chips = [
    { cx: b1x - 3, cy: b1y + 1 },
    { cx: b1x + 5, cy: b1y + 2 },
    { cx: b2x - 2, cy: b2y + 2 },
    { cx: b2x + 4, cy: b2y + 1 },
    { cx: 0, cy: 7 },
  ];
  for (let cIdx = 0; cIdx < chips.length; cIdx++) {
    const c = chips[cIdx];
    g.rect(c.cx, c.cy, 1.4, 1.2);
    g.fill({ color: rubbleLightCol, alpha: 0.85 });
    g.rect(c.cx, c.cy + 1.2, 1.4, 0.6);
    g.fill({ color: rubbleDarkCol, alpha: 0.85 });
  }
}

// -------------------------------------------------------------
// Denser Isometric Pixel Building Painter
// -------------------------------------------------------------
export function drawIsometricBuilding(
  g: Graphics,
  typeId: string,
  level: number,
  complete: boolean,
  phase: number,
  visuals: ThemeVisuals,
  gx: number = 0,
  gy: number = 0,
  rimNeighbors?: RimNeighbors,
  cultureId?: string
): void {
  const a = 1.0;
  g.clear();

  // 1. Isometric Ground Footprint Shadow & Base Foundation
  const isRimWall = typeId === "walls" && isRimTile(gx, gy);
  const isRimGate = typeId === "gate" && isRimTile(gx, gy);

  if (!isRimWall && !isRimGate) {
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
  } else {
    // Continuous foundation footprint shadow along the wall perimeter run
    g.poly([
      -HALF_W + 2, 0,
      0, HALF_H - 2,
      HALF_W - 2, 0,
      0, -HALF_H + 2,
    ]);
    g.fill({ color: 0x080c09, alpha: 0.25 });
  }

  const lvl = Math.max(1, Math.min(5, level));
  const isWinter = visuals.decorations === "winter" || visuals.decorations === "midwinter";
  const isHalloween = visuals.decorations === "halloween";
  const heightBoost = (lvl - 1) * 3;
  const kit = resolveCultureKit(cultureId);
  const cult = culturePalette(cultureId);

  switch (typeId) {
    case "farm": {
      if (kit !== "western") {
        drawFarmCulture(g, 18 + heightBoost, a, phase, kit, cult, complete);
        break;
      }
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
      if (complete) {
        const puff = Math.sin(phase * 2) * 2;
        g.circle(6, -h - 18 + puff, 2.5);
        g.fill({ color: 0xe4e4e7, alpha: 0.45 * a });
        g.circle(8, -h - 22 + puff, 3.2);
        g.fill({ color: 0xf4f4f5, alpha: 0.3 * a });
      }

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

    case "cottage": {
      if (kit !== "western") {
        drawCottageCulture(g, 16 + heightBoost, a, phase, kit, cult, complete);
        break;
      }
      // Distinct Thatched Residential Cottage + Plaster/Timber Walls + Chimney Smoke + Leaded Window + Flowerbed
      const h = 16 + heightBoost;

      // Half-timbered Plaster Walls (left & right facets)
      // Left Facet (warm plaster tone)
      g.poly([-15, 0, 0, 7.5, 0, 7.5 - h, -15, 0 - h]);
      g.fill({ color: 0xd8c8b0, alpha: a });
      // Right Facet (shaded plaster tone)
      g.poly([0, 7.5, 13, 1, 13, 1 - h, 0, 7.5 - h]);
      g.fill({ color: 0xb5a38c, alpha: a });

      // Exposed timber corner posts and horizontal timber wall plate
      g.moveTo(-15, 0); g.lineTo(-15, -h);
      g.moveTo(0, 7.5); g.lineTo(0, 7.5 - h);
      g.moveTo(13, 1); g.lineTo(13, 1 - h);
      g.moveTo(-15, -h * 0.5); g.lineTo(0, 7.5 - h * 0.5);
      g.moveTo(0, 7.5 - h * 0.5); g.lineTo(13, 1 - h * 0.5);
      // Diagonal bracing beams on left facet
      g.moveTo(-15, 0); g.lineTo(-5, 5 - h * 0.5);
      g.stroke({ width: 1.2, color: 0x5c3818, alpha: a });

      // Steep Thatched Gable Roof with overhanging eaves
      g.poly([
        -17, 1 - h,
        0, 10 - h - 10,
        15, 2 - h,
        -1, -h - 17,
      ]);
      g.fill({ color: 0xc68a4c, alpha: a });
      // Roof edge & ridge trim
      g.moveTo(-17, 1 - h); g.lineTo(0, 10 - h - 10); g.lineTo(15, 2 - h);
      g.stroke({ width: 1.4, color: 0x9c6628, alpha: a });
      // Thatch ridge cresting
      g.moveTo(0, 10 - h - 10); g.lineTo(-1, -h - 17);
      g.stroke({ width: 1.8, color: 0x7c4e1a, alpha: a });

      // Fieldstone Chimney & Cozy Animated Hearth Smoke
      g.rect(-10, -h - 12, 3.5, 8);
      g.fill({ color: 0x64748b, alpha: a });
      g.stroke({ width: 0.8, color: 0x334155, alpha: a });
      if (complete) {
        const cPuff = Math.sin(phase * 2.2) * 1.8;
        g.circle(-8.5, -h - 15 + cPuff, 2.2);
        g.fill({ color: 0xe2e8f0, alpha: 0.45 * a });
        g.circle(-6.5, -h - 19 + cPuff, 2.8);
        g.fill({ color: 0xf1f5f9, alpha: 0.3 * a });
      }

      // Rustic Wooden Door with arched frame & brass handle
      g.rect(-8, 3.5 - h * 0.42, 4.5, 6.5);
      g.fill({ color: 0x4a2c11, alpha: a });
      g.circle(-4.5, 7 - h * 0.42, 0.7);
      g.fill({ color: 0xfacc15, alpha: a }); // Brass knob
      // Stone doorstep
      g.rect(-9, 8.5 - h * 0.15, 6, 1.8);
      g.fill({ color: 0x78716c, alpha: a });

      // Leaded Glass Casement Window with warm amber candlelight & shutters
      const cottageCandle = 0.88 + Math.sin(phase * 3.5) * 0.1;
      g.rect(3, 4 - h * 0.45, 4, 4);
      g.fill({ color: 0xfef08a, alpha: a * 0.95 * cottageCandle });
      // Window mullions (cross)
      g.moveTo(5, 4 - h * 0.45); g.lineTo(5, 8 - h * 0.45);
      g.moveTo(3, 6 - h * 0.45); g.lineTo(7, 6 - h * 0.45);
      g.stroke({ width: 0.6, color: 0x451a03, alpha: a });
      // Wooden shutters on sides
      g.rect(1.5, 4 - h * 0.45, 1.5, 4); g.fill({ color: 0x78350f, alpha: a });
      g.rect(7, 4 - h * 0.45, 1.5, 4); g.fill({ color: 0x78350f, alpha: a });

      // Cottage Yard 1: Stone-lined Flowerbed with blossoms
      g.rect(-14, 2, 5, 3.5);
      g.fill({ color: 0x27272a, alpha: a * 0.5 });
      g.circle(-13, 3, 1.4); g.fill({ color: 0xf43f5e, alpha: a }); // Rose
      g.circle(-10.5, 4, 1.3); g.fill({ color: 0xa855f7, alpha: a }); // Lavender
      g.circle(-11.5, 2.5, 1.2); g.fill({ color: 0xfef08a, alpha: a }); // Daisy

      // Cottage Yard 2: Stacked cord of split firewood
      g.rect(9, 3, 4.5, 3);
      g.fill({ color: 0x78350f, alpha: a });
      g.moveTo(9, 4.5); g.lineTo(13.5, 4.5);
      g.stroke({ width: 0.8, color: 0x3f1d0b, alpha: a });

      break;
    }

    case "lumber":
    case "lumber_camp": {
      if (kit !== "western") {
        drawLumberCulture(g, 16 + heightBoost, a, phase, kit, cult);
        break;
      }
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
      if (kit !== "western") {
        drawGoldMineCulture(g, 20 + heightBoost, a, phase, kit, cult);
        break;
      }
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
      if (kit !== "western") {
        drawMarketCulture(g, 18 + heightBoost, a, phase, kit, cult);
        break;
      }
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
      if (kit !== "western") {
        drawBarracksCulture(g, 24 + heightBoost, a, phase, kit, cult);
        break;
      }
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
      if (kit !== "western") {
        drawStablesCulture(g, 20 + heightBoost, a, phase, kit, cult);
        break;
      }
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
      if (kit !== "western") {
        drawArcheryRangeCulture(g, 18 + heightBoost, a, phase, kit, cult);
        break;
      }
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

    case "academy": {
      // Grand Collegiate Academy: Sandstone Ashlar Hall + Arched Cloister Arcade +
      // Gothic Stained/Lattice Library Windows + Royal Sapphire Slate Roof +
      // Central Observatory Cupola with Rotating Brass Armillary Astrolabe +
      // Scriptorium Lectern with Open Illuminated Folio + Celestial Globe
      const h = 26 + heightBoost;

      // 1. Foundation Plinth
      g.poly([-17, 1, 0, 9.5, 0, 7.5, -17, -1]);
      g.fill({ color: 0x475569, alpha: a });
      g.poly([0, 9.5, 17, 1, 17, -1, 0, 7.5]);
      g.fill({ color: 0x334155, alpha: a });

      // 2. Collegiate Main Hall Ashlar Walls (Sunlit SW / Shaded SE)
      g.poly([-15, 0, 0, 7.5, 0, 7.5 - h, -15, 0 - h]);
      g.fill({ color: 0xf1f5f9, alpha: a });
      g.poly([0, 7.5, 15, 0, 15, 0 - h, 0, 7.5 - h]);
      g.fill({ color: 0x94a3b8, alpha: a });

      // Buttress pilasters at corners and facade
      g.poly([-16, 0 - h, -14, 1 - h, -14, 1, -16, 0]);
      g.fill({ color: 0xe2e8f0, alpha: a });
      g.poly([-8, 4 - h, -6, 5 - h, -6, 5, -8, 4]);
      g.fill({ color: 0xe2e8f0, alpha: a });
      g.poly([6, 4.5 - h, 8, 3.5 - h, 8, 3.5, 6, 4.5]);
      g.fill({ color: 0x64748b, alpha: a });
      g.poly([14, 0.5 - h, 16, -0.5 - h, 16, -0.5, 14, 0.5]);
      g.fill({ color: 0x64748b, alpha: a });

      // Horizontal decorative stringcourse / cornice
      g.moveTo(-15, 0 - h * 0.55); g.lineTo(0, 7.5 - h * 0.55); g.lineTo(15, 0 - h * 0.55);
      g.stroke({ width: 1.2, color: 0x64748b, alpha: a });

      // 3. Arched Cloister Arcade Entrance with Marble Columns & Classical Pediment
      // Dark vaulted interior doorway
      g.poly([-4, 5, 0, 7, 4, 5, 4, 1, 0, 3, -4, 1]);
      g.fill({ color: 0x0f172a, alpha: a });
      // Flanking marble columns with capitals
      g.rect(-4.5, 0.8, 1.3, 4.2); g.fill({ color: 0xf8fafc, alpha: a });
      g.rect(3.2, 0.8, 1.3, 4.2); g.fill({ color: 0xf8fafc, alpha: a });
      // Classical triangular pediment & lintel
      g.poly([-5, 1, 0, -2.5, 5, 1]);
      g.fill({ color: 0xcbd5e1, alpha: a });
      g.stroke({ width: 0.8, color: 0x64748b, alpha: a });
      // Stone entrance steps
      g.poly([-5, 5.5, 0, 8, 5, 5.5, 0, 6.5]);
      g.fill({ color: 0x64748b, alpha: a });

      // 4. Arched Gothic Library Casement Windows with Warm Honey Candlelight
      const candleFlicker = 0.85 + Math.sin(phase * 4) * 0.12;
      // West library window
      g.rect(-12, -h * 0.45, 4.2, 6.5);
      g.fill({ color: 0xfef08a, alpha: a * candleFlicker });
      g.stroke({ width: 0.8, color: 0x78350f, alpha: a });
      // Window mullion cross
      g.moveTo(-10, -h * 0.45); g.lineTo(-10, -h * 0.45 + 6.5);
      g.moveTo(-12, -h * 0.45 + 3.2); g.lineTo(-7.8, -h * 0.45 + 3.2);
      g.stroke({ width: 0.6, color: 0x451a03, alpha: a });

      // East library window
      g.rect(7, -h * 0.45, 4.2, 6.5);
      g.fill({ color: 0xfde047, alpha: a * (0.8 + Math.cos(phase * 3.2) * 0.12) });
      g.stroke({ width: 0.8, color: 0x78350f, alpha: a });
      g.moveTo(9.1, -h * 0.45); g.lineTo(9.1, -h * 0.45 + 6.5);
      g.moveTo(7, -h * 0.45 + 3.2); g.lineTo(11.2, -h * 0.45 + 3.2);
      g.stroke({ width: 0.6, color: 0x451a03, alpha: a });

      // 5. Steep Royal Sapphire Slate Roof with Overhang & Gilded Ridge Coping
      g.poly([
        -17, -h,
        0, 9 - h - 11,
        17, 0 - h,
        0, -h - 18,
      ]);
      g.fill({ color: 0x1e3a8a, alpha: a });
      // Shaded roof facet
      g.poly([
        0, 9 - h - 11,
        17, 0 - h,
        0, -h - 18,
      ]);
      g.fill({ color: 0x172554, alpha: a * 0.5 });
      // Gilded ridge coping
      g.moveTo(-17, -h); g.lineTo(0, 9 - h - 11); g.lineTo(17, 0 - h);
      g.stroke({ width: 1.4, color: 0xfacc15, alpha: a });

      // 6. Central Elevated Observatory Cupola & Verdigris Dome
      g.rect(-5, -h - 17, 10, 8);
      g.fill({ color: 0xe2e8f0, alpha: a });
      g.stroke({ width: 0.8, color: 0x94a3b8, alpha: a });
      // Cupola arched observation openings
      g.rect(-3.5, -h - 15, 2, 4); g.fill({ color: 0x0f172a, alpha: a });
      g.rect(1.5, -h - 15, 2, 4); g.fill({ color: 0x0f172a, alpha: a });
      // Aged copper / verdigris dome
      g.poly([-6, -h - 17, 0, -h - 25, 6, -h - 17]);
      g.fill({ color: 0x0f766e, alpha: a });
      g.stroke({ width: 0.8, color: 0x115e59, alpha: a });

      // 7. Perched Brass Armillary Astrolabe & Rotating Celestial Rings
      g.moveTo(0, -h - 25); g.lineTo(0, -h - 31);
      g.stroke({ width: 1.4, color: 0xd4a359, alpha: a });
      // Central brass globe
      g.circle(0, -h - 29, 2.2);
      g.fill({ color: 0xfacc15, alpha: a });
      // Rotating celestial rings
      const ringOsc = Math.sin(phase * 2.8) * 1.5;
      g.ellipse(0, -h - 29, 4.2, 2.0 + ringOsc * 0.8);
      g.stroke({ width: 0.9, color: 0xfde047, alpha: a });

      // 8. Scholar's Gonfalon / Banner
      const pennantWave = Math.sin(phase * 3.5) * 2;
      g.poly([0, -h - 21, 7 + pennantWave, -h - 18, 0, -h - 15]);
      g.fill({ color: 0x2563eb, alpha: a });
      g.poly([0, -h - 19, 4 + pennantWave * 0.6, -h - 18, 0, -h - 17]);
      g.fill({ color: 0xfacc15, alpha: a });

      // 9. Forecourt Scholarly Vignette: Reading Lectern with Open Illuminated Tome & Celestial Globe
      // Stone Reading Lectern
      g.rect(-11.5, 3, 2.8, 4.2);
      g.fill({ color: 0x64748b, alpha: a });
      g.poly([-13.5, 2.5, -8.5, 4.8, -8.5, 3, -13.5, 0.7]);
      g.fill({ color: 0x78350f, alpha: a });
      // Open illuminated vellum leaves
      g.poly([-13, 2, -9, 3.8, -9, 2.2, -13, 0.4]);
      g.fill({ color: 0xfef3c7, alpha: a });
      // Ink script markings
      g.moveTo(-12.2, 1.4); g.lineTo(-10, 2.4);
      g.stroke({ width: 0.6, color: 0x1e293b, alpha: a });

      // Brass Celestial Globe on Tripod Stand in right foreground
      g.moveTo(10.5, 6.5); g.lineTo(12, 3); g.lineTo(13.5, 6.5);
      g.stroke({ width: 0.9, color: 0x78350f, alpha: a });
      g.circle(12, 2.5, 2.2);
      g.fill({ color: 0x0284c7, alpha: a });
      g.ellipse(12, 2.5, 2.6, 1.0);
      g.stroke({ width: 0.7, color: 0xfacc15, alpha: a });

      // Stacked manuscript scroll bins
      g.rect(7.5, 4.5, 2.5, 3);
      g.fill({ color: 0x5c3818, alpha: a });
      g.circle(8.2, 4.2, 0.9); g.fill({ color: 0xfef3c7, alpha: a });
      g.circle(9.3, 4.2, 0.9); g.fill({ color: 0xfef3c7, alpha: a });

      // Foundation Level Pips
      for (let i = 0; i < lvl; i++) {
        g.circle(-5 + i * 2.5, 7.5, 0.9);
        g.fill({ color: 0xfacc15, alpha: a });
      }
      break;
    }

    case "siege_workshop": {
      if (kit !== "western") {
        drawSiegeWorkshopCulture(g, 20 + heightBoost, a, phase, kit, cult);
        break;
      }
      // Heavy Siege Ordnance Yard & Master Engineer's Forge:
      // Timber-framed Drafting Workshop + Gantry Crane Derrick +
      // Trebuchet Chassis with Four Spoked Wheels & Pivot Arm +
      // Chained Pyramid of Granite Siege Boulders + Weapon Smithing Forge
      const h = 20 + heightBoost;

      // 1. Crushed Stone Apron & Squared Timber Sleepers
      g.poly([-16, 0, 0, 8, 0, 8 - h * 0.4, -16, 0 - h * 0.4]);
      g.fill({ color: 0x3f3f46, alpha: a });
      g.poly([0, 8, 16, 0, 16, 0 - h * 0.4, 0, 8 - h * 0.4]);
      g.fill({ color: 0x27272a, alpha: a });

      // Squared foundation timbers
      g.moveTo(-14, 2); g.lineTo(-2, 7.5);
      g.stroke({ width: 2, color: 0x5c3818, alpha: a });
      g.moveTo(2, 7.5); g.lineTo(14, 2);
      g.stroke({ width: 2, color: 0x5c3818, alpha: a });

      // 2. Timber-Framed Open Workshop Pavilion (Left Yard)
      // Upright oak timber posts with iron joint bands
      for (const px of [-14, -8, -2]) {
        const py = (px + 14) * 0.4;
        g.moveTo(px, py); g.lineTo(px, py - h);
        g.stroke({ width: 2.2, color: 0x78350f, alpha: a });
        // Blackened iron straps
        g.rect(px - 1.2, py - h * 0.45, 2.4, 1.4);
        g.fill({ color: 0x18181b, alpha: a });
      }
      // Workshop Rafters & Shingled Canopy
      g.poly([
        -16, -h + 2,
        0, 8 - h,
        -1, -h - 6,
        -17, -h - 3,
      ]);
      g.fill({ color: 0x543007, alpha: a });
      g.moveTo(-16, -h + 2); g.lineTo(0, 8 - h);
      g.stroke({ width: 1.4, color: 0xa16207, alpha: a });

      // Master Engineer's Drafting Table under canopy
      g.rect(-11, 0, 6, 3.2);
      g.fill({ color: 0x451a03, alpha: a });
      // Blue vellum blueprint draft
      g.rect(-10.2, -0.6, 4.4, 2.4);
      g.fill({ color: 0x0284c7, alpha: a });
      // White draft lines / compass arcs
      g.moveTo(-9.5, 0.4); g.lineTo(-6.5, 0.4);
      g.stroke({ width: 0.6, color: 0xffffff, alpha: a * 0.8 });
      // Brass calipers
      g.moveTo(-7.5, 1.2); g.lineTo(-6.8, 1.8);
      g.stroke({ width: 0.8, color: 0xfacc15, alpha: a });

      // Timber Gantry Crane / Derrick on roof
      g.moveTo(-12, -h - 2); g.lineTo(-5, -h - 15); g.lineTo(2, -h - 2);
      g.stroke({ width: 2, color: 0x78350f, alpha: a });
      // Pulley wheel & hoist rope
      g.circle(-5, -h - 15, 2); g.fill({ color: 0x18181b, alpha: a });
      g.moveTo(-5, -h - 13); g.lineTo(-5, -h - 3);
      g.stroke({ width: 1, color: 0xd4a359, alpha: a });

      // 3. Assembled Trebuchet / Heavy Catapult (Center Yard)
      // Wheeled timber carriage frame
      g.moveTo(-4, 4); g.lineTo(8, -1);
      g.stroke({ width: 3.5, color: 0x5c3818, alpha: a });

      // Four spoked wooden wheels with iron rims
      const wheelList = [
        { x: -3.5, y: 5 },
        { x: 2, y: 7.2 },
        { x: 3.5, y: 1 },
        { x: 8.5, y: 2.8 },
      ];
      for (const w of wheelList) {
        // Dark iron tire
        g.circle(w.x, w.y, 3); g.fill({ color: 0x292524, alpha: a });
        // Wood hub & spokes
        g.circle(w.x, w.y, 2); g.fill({ color: 0x78350f, alpha: a });
        g.circle(w.x, w.y, 0.8); g.fill({ color: 0xd1d5db, alpha: a }); // Iron hub pin
      }

      // Upright A-frame trestle supports
      g.moveTo(0, 3); g.lineTo(2.5, -10); g.lineTo(5, 1);
      g.stroke({ width: 2.2, color: 0x78350f, alpha: a });
      // Bronze pivot axle
      g.circle(2.5, -10, 1.6); g.fill({ color: 0xd97706, alpha: a });

      // Heavy Tapered Oak Throwing Arm (angled into the sky)
      g.moveTo(-2, 0); g.lineTo(9, -21);
      g.stroke({ width: 3.2, color: 0x78350f, alpha: a });
      g.moveTo(-1, -1); g.lineTo(8.5, -20);
      g.stroke({ width: 1.2, color: 0xb45309, alpha: a }); // highlight

      // Heavy Iron-Riveted Counterweight Box
      g.rect(-6, -1, 5.5, 5);
      g.fill({ color: 0x18181b, alpha: a });
      g.stroke({ width: 0.8, color: 0x52525b, alpha: a });
      // Steel rivets on counterweight
      g.circle(-5, 0.5, 0.6); g.fill({ color: 0xd1d5db, alpha: a });
      g.circle(-2, 0.5, 0.6); g.fill({ color: 0xd1d5db, alpha: a });
      g.circle(-3.5, 2.5, 0.6); g.fill({ color: 0xd1d5db, alpha: a });

      // Sling release hook and rope at arm tip
      g.moveTo(9, -21); g.lineTo(10.5, -24);
      g.stroke({ width: 1, color: 0xd4a359, alpha: a });
      g.circle(10.5, -24, 1.2); g.fill({ color: 0xfacc15, alpha: a });

      // 4. Chained Granite Siege Boulder Pyramid (Right Yard)
      // Bottom layer (3 granite boulders)
      g.circle(8.5, 4.5, 2.4); g.fill({ color: 0x78716c, alpha: a });
      g.circle(13, 2.5, 2.4); g.fill({ color: 0x64748b, alpha: a });
      g.circle(10.8, 1, 2.2); g.fill({ color: 0x78716c, alpha: a });
      // Middle layer (2 boulders)
      g.circle(9.8, 2.8, 2.1); g.fill({ color: 0xa8a29e, alpha: a });
      g.circle(12.2, 1.2, 2.1); g.fill({ color: 0x94a3b8, alpha: a });
      // Top apex boulder with highlight
      g.circle(11, -0.2, 2.0); g.fill({ color: 0xcbd5e1, alpha: a });
      // Iron tether chain
      g.moveTo(7.5, 5.5); g.lineTo(11, 0.8); g.lineTo(14.5, 3.5);
      g.stroke({ width: 0.8, color: 0x1e293b, alpha: a * 0.8 });

      // 5. Ordnance Forge Hearth & Smoldering Coals (Forecourt)
      g.ellipse(13, 6, 3, 2);
      g.fill({ color: 0x475569, alpha: a });
      if (complete) {
        const forgeFlame = Math.sin(phase * 5) * 0.3;
        g.circle(13, 5.5, 1.8 + forgeFlame);
        g.fill({ color: 0xea580c, alpha: a * 0.95 });
        g.circle(13, 5.5, 1.1);
        g.fill({ color: 0xfacc15, alpha: a });
      } else {
        // Cold dormant ash coals
        g.circle(13, 5.5, 1.1);
        g.fill({ color: 0x1e293b, alpha: a * 0.8 });
      }
      // Anvil on oak block
      g.rect(10, 6.5, 2.2, 2.2); g.fill({ color: 0x5c3818, alpha: a });
      g.poly([9.5, 6.5, 12.5, 6.5, 11.5, 5.5, 9.8, 5.5]);
      g.fill({ color: 0x18181b, alpha: a });

      // Foundation Level Pips
      for (let i = 0; i < lvl; i++) {
        g.circle(-3 + i * 2.5, 8.2, 0.9);
        g.fill({ color: 0xfacc15, alpha: a });
      }
      break;
    }

    case "watchtower": {
      const isRim = isRimTile(gx, gy);
      const h = (isRim ? 44 : 34) + heightBoost;

      if (!complete) {
        drawWatchtowerScaffolding(g, h, a, phase, kit, cult, isRim);
        break;
      }

      if (kit !== "western") {
        drawWatchtowerCulture(g, h, a, phase, kit, cult, complete, isRim);
        break;
      }

      // Denser Soaring Stone Lookout + Overhanging Hoarding + Beacon Brazier
      // Base stone shaft (left & right facets)
      g.poly([-9, 0, 0, 4.5, 0, 4.5 - h, -9, 0 - h]);
      g.fill({ color: 0x94a3b8, alpha: a });
      g.poly([0, 4.5, 9, 0, 9, 0 - h, 0, 4.5 - h]);
      g.fill({ color: 0x64748b, alpha: a });

      // Arrow slits along shaft
      if (isRim) {
        // Taller rim shaft has tiered arrow loops & stone corbel belt course
        g.rect(-4, -h * 0.28, 1.5, 3.5); g.fill({ color: 0x0f172a, alpha: a });
        g.rect(3, -h * 0.45, 1.5, 3.5); g.fill({ color: 0x0f172a, alpha: a });
        g.rect(-4, -h * 0.7, 1.5, 3.5); g.fill({ color: 0x0f172a, alpha: a });
        // Stone belt corbel trim
        g.moveTo(-9, -h * 0.5); g.lineTo(0, 4.5 - h * 0.5); g.lineTo(9, -h * 0.5);
        g.stroke({ width: 1.2, color: 0x475569, alpha: a });
      } else {
        g.rect(-4, -h * 0.4, 1.5, 4); g.fill({ color: 0x0f172a, alpha: a });
        g.rect(3, -h * 0.6, 1.5, 4); g.fill({ color: 0x0f172a, alpha: a });
      }

      // Timber Hoarding Overhang
      g.poly([-12, -h + 3, 0, 7 - h, 12, -h + 3, 0, -h - 5]);
      g.fill({ color: 0x854d0e, alpha: a });

      // Conical Slate Roof & Iron Brazier with Fire
      g.poly([-11, -h, 0, -h - 16, 11, -h]);
      g.fill({ color: 0x713f12, alpha: a });

      // Iron Brazier Basket & Elevated Beacon Fire
      g.rect(-3.5, -h - 17, 7, 2.5);
      g.fill({ color: 0x1e293b, alpha: a });

      const flame = Math.sin(phase * 6) * 1.5;
      g.circle(0, -h - 18, 2.5 + flame * 0.3);
      g.fill({ color: 0xf97316, alpha: a });
      g.circle(0, -h - 18.5, 1.2);
      g.fill({ color: 0xfacc15, alpha: a });

      if (isRim) {
        // Taller rim beacon has radiant warm beacon glow and ember spark
        g.ellipse(0, -h - 18, 7.5 + Math.sin(phase * 4) * 1.0, 4.5 + Math.sin(phase * 4) * 0.6);
        g.fill({ color: 0xfde047, alpha: 0.18 * a });
        g.circle(Math.sin(phase * 5) * 1.8, -h - 22, 0.7);
        g.fill({ color: 0xfef08a, alpha: 0.85 * a });
      }

      // Royal Pennant
      const flap = Math.sin(phase * 4) * 3;
      const pennantTop = isRim ? -h - 28 : -h - 25;
      const pennantBase = isRim ? -h - 18 : -h - 16;
      g.moveTo(0, pennantBase); g.lineTo(0, pennantTop);
      g.stroke({ width: 1.5, color: 0xd4a359, alpha: a });
      g.poly([0, pennantTop, 9 + flap, pennantTop + 4, 0, pennantTop + 8]);
      g.fill({ color: 0xfacc15, alpha: a });
      break;
    }

    case "chapel": {
      if (kit !== "western") {
        drawChapelCulture(g, 26 + heightBoost, a, phase, kit, cult, complete);
        break;
      }
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

    case "infirmary": {
      if (kit !== "western") {
        drawInfirmaryCulture(g, 20 + heightBoost, a, phase, kit, cult, complete);
        break;
      }
      // Dedicated Field Hospital / Hospice Sanctuary:
      // Half-timbered hospice hall with warm plaster walls, red cross / healer emblem on gable,
      // steep slate roof with dormer glowing with healing candlelight, stone chimney puffing hearth smoke,
      // healing herb garden (lavender & medicinal poppies), washbasin / herbalist bench, and cots
      const h = 20 + heightBoost;

      // 1. Foundation Plinth
      g.poly([-16, 0, 0, 8, 0, 5, -16, -3]);
      g.fill({ color: 0x475569, alpha: a });
      g.poly([0, 8, 14, 1, 14, -2, 0, 5]);
      g.fill({ color: 0x334155, alpha: a });

      // 2. Hospice Walls (Warm plaster with timber framing)
      g.poly([-15, -1, 0, 6.5, 0, 6.5 - h, -15, -1 - h]);
      g.fill({ color: 0xf1f5f9, alpha: a });
      g.poly([0, 6.5, 13, 0, 13, 0 - h, 0, 6.5 - h]);
      g.fill({ color: 0x94a3b8, alpha: a });

      // Timber corner posts and cross beams
      g.moveTo(-15, -1); g.lineTo(-15, -1 - h);
      g.moveTo(0, 6.5); g.lineTo(0, 6.5 - h);
      g.moveTo(13, 0); g.lineTo(13, 0 - h);
      g.moveTo(-15, -1 - h * 0.5); g.lineTo(0, 6.5 - h * 0.5);
      g.moveTo(0, 6.5 - h * 0.5); g.lineTo(13, 0 - h * 0.5);
      g.stroke({ width: 1.2, color: 0x5c3818, alpha: a });

      // 3. Steep Gabled Slate Roof with Dormer
      g.poly([-17, -h, 0, 8 - h - 11, 15, -h, 0, -h - 17]);
      g.fill({ color: 0x991b1b, alpha: a }); // Red hospital roof trim
      g.poly([-16, -h - 1, 0, 8 - h - 12, 14, -h - 1, 0, -h - 16]);
      g.fill({ color: 0x334155, alpha: a }); // Slate center

      // 4. Red Cross / Healer Emblem on Front Facet
      g.circle(6, 2 - h * 0.5, 3.8);
      g.fill({ color: 0xffffff, alpha: a });
      g.rect(4.8, 0.5 - h * 0.5, 2.4, 3);
      g.fill({ color: 0xdc2626, alpha: a });
      g.rect(3.5, 1.5 - h * 0.5, 5, 1.2);
      g.fill({ color: 0xdc2626, alpha: a });

      // Arched entryway door
      g.poly([-8, 2.5, -2, 5.5, -2, -h * 0.35, -8, -h * 0.35 - 3]);
      g.fill({ color: 0x1e293b, alpha: a });

      // Glowing candlelit window
      g.rect(-13, -1 - h * 0.45, 3.5, 3.5);
      g.fill({ color: 0xfef08a, alpha: a * 0.95 });

      // 5. Fieldstone Chimney & Medicinal Herbal Hearth Smoke
      g.rect(-12, -h - 14, 4, 9);
      g.fill({ color: 0x64748b, alpha: a });
      if (complete) {
        const infPuff = Math.sin(phase * 2.2) * 1.8;
        g.circle(-10, -h - 17 + infPuff, 2.4);
        g.fill({ color: 0xe2e8f0, alpha: 0.45 * a });
        g.circle(-8, -h - 21 + infPuff, 3);
        g.fill({ color: 0xf1f5f9, alpha: 0.3 * a });
      }

      // 6. Courtyard Details: Medicinal Herb Garden (Lavender & Red Poppies)
      g.rect(-14, 3, 6, 4);
      g.fill({ color: 0x27272a, alpha: a * 0.6 });
      g.circle(-12, 4.5, 1.5); g.fill({ color: 0xa855f7, alpha: a }); // Lavender
      g.circle(-10, 5.5, 1.5); g.fill({ color: 0xef4444, alpha: a }); // Red poppy
      g.circle(-9, 4, 1.2); g.fill({ color: 0x22c55e, alpha: a });

      // Water Basin / Mortar & Pestle on herbalist bench
      g.rect(8, 4, 5, 3);
      g.fill({ color: 0x78350f, alpha: a });
      g.ellipse(10.5, 4.5, 1.8, 1.2);
      g.fill({ color: 0x38bdf8, alpha: a * 0.9 });
      break;
    }

    case "walls": {
      if (!isRimTile(gx, gy)) {
        if (kit !== "western") {
          drawInteriorWallCulture(g, 20 + heightBoost, a, phase, kit, cult);
          break;
        }
        // Interior walls stay the old block
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

      // Rim Fort Wall Run: Connected stone curtain between neighbors + merlons on top
      drawRimWallCurtain(g, 20 + heightBoost, a, phase, gx, gy, rimNeighbors, kit, cult);
      break;
    }

    case "gate": {
      const isRim = isRimTile(gx, gy);
      if (kit !== "western") {
        drawGateCulture(g, 24 + heightBoost, a, phase, kit, cult, isRim, gx, gy, rimNeighbors);
        break;
      }
      // Fortified Ashlar Stone Gatehouse + Twin Bastion Towers + Crenellations + Archway
      // On rim tiles (isRim): Heavy reinforced oak & iron double doors + portcullis teeth
      const h = 24 + heightBoost;

      // 1. Foundation Plinth
      g.poly([-18, 0, 0, 9, 0, 6, -18, -3]);
      g.fill({ color: 0x334155, alpha: a });
      g.poly([0, 9, 18, 0, 18, -3, 0, 6]);
      g.fill({ color: 0x1e293b, alpha: a });

      // 2. Left Bastion Tower (Light face)
      g.poly([-17, -1, -8, 3.5, -8, 3.5 - (h + 4), -17, -1 - (h + 4)]);
      g.fill({ color: 0x64748b, alpha: a });
      g.poly([-8, 3.5, -4, 1.5, -4, 1.5 - (h + 4), -8, 3.5 - (h + 4)]);
      g.fill({ color: 0x475569, alpha: a });

      // 3. Right Bastion Tower (Shaded face)
      g.poly([4, 1.5, 8, 3.5, 8, 3.5 - (h + 4), 4, 1.5 - (h + 4)]);
      g.fill({ color: 0x475569, alpha: a });
      g.poly([8, 3.5, 17, -1, 17, -1 - (h + 4), 8, 3.5 - (h + 4)]);
      g.fill({ color: 0x334155, alpha: a });

      // 4. Central Gatehouse Curtain & Vault Bridge
      g.poly([-4, 1.5, 4, 1.5, 4, 1.5 - h, -4, 1.5 - h]);
      g.fill({ color: 0x52525b, alpha: a });

      // Ashlar Masonry Horizontal Mortar Scoring
      for (const frac of [0.3, 0.6, 0.85]) {
        const myLeft = 3.5 - (h + 4) * frac;
        g.moveTo(-17, -1 - (h + 4) * frac); g.lineTo(-8, myLeft);
        const myRight = 3.5 - (h + 4) * frac;
        g.moveTo(8, myRight); g.lineTo(17, -1 - (h + 4) * frac);
        g.stroke({ width: 0.8, color: 0x1e293b, alpha: a * 0.6 });
      }

      // Parapet battlements (crenellations) on Left Tower
      g.rect(-17, -h - 7, 3.5, 4); g.fill({ color: 0x94a3b8, alpha: a });
      g.rect(-12, -h - 5, 3.5, 4); g.fill({ color: 0x94a3b8, alpha: a });
      // Parapet battlements on Right Tower
      g.rect(9, -h - 5, 3.5, 4); g.fill({ color: 0x64748b, alpha: a });
      g.rect(14, -h - 7, 3.5, 4); g.fill({ color: 0x64748b, alpha: a });
      // Central walk battlements
      g.rect(-2, -h - 2, 4, 3); g.fill({ color: 0x94a3b8, alpha: a });

      // Arrow loops on towers
      g.rect(-13, -h * 0.45, 1.4, 4); g.fill({ color: 0x0f172a, alpha: a });
      g.rect(12, -h * 0.45, 1.4, 4); g.fill({ color: 0x0f172a, alpha: a });

      // 5. Arched Gateway Portal
      // Outer stone portal arch
      g.poly([-5, 5, 0, 7.5, 5, 5, 5, -1, 0, 1.5, -5, -1]);
      g.fill({ color: 0x18181b, alpha: a });
      // Carved stone archway trim
      g.moveTo(-5, -1); g.lineTo(0, 1.5); g.lineTo(5, -1);
      g.stroke({ width: 1.8, color: 0x94a3b8, alpha: a });

      if (isRim) {
        // Fortified Rim Gate: Heavy oak double-doors with iron cross-straps & studs
        // Left Door leaf
        g.poly([-4, 4.5, 0, 6.5, 0, 0.5, -4, -1.5]);
        g.fill({ color: 0x5c3818, alpha: a });
        // Right Door leaf
        g.poly([0, 6.5, 4, 4.5, 4, -1.5, 0, 0.5]);
        g.fill({ color: 0x45220a, alpha: a });

        // Vertical plank seam
        g.moveTo(0, 6.5); g.lineTo(0, 0.5);
        g.stroke({ width: 1, color: 0x271507, alpha: a });

        // Heavy Blackened Iron Hinge Straps
        for (const dy of [-0.5, 2.5]) {
          g.moveTo(-4, dy); g.lineTo(0, dy + 2); g.lineTo(4, dy);
          g.stroke({ width: 1.4, color: 0x1e293b, alpha: a });
          // Iron rivets on the straps
          g.circle(-2.5, dy + 0.8, 0.6); g.fill({ color: 0x94a3b8, alpha: a });
          g.circle(2.5, dy + 0.8, 0.6); g.fill({ color: 0x94a3b8, alpha: a });
        }

        // Heavy iron drop bar / lock hasp across the center
        g.moveTo(-3, 3.5); g.lineTo(3, 3.5);
        g.stroke({ width: 1.6, color: 0x0f172a, alpha: a });

        // Portcullis iron teeth lowered above the doors
        for (const tx of [-3, -1, 1, 3]) {
          const ty = 0.5 - Math.abs(tx) * 0.25;
          g.moveTo(tx, ty - 3); g.lineTo(tx, ty);
          g.stroke({ width: 1, color: 0x64748b, alpha: a });
        }

        // Defensive Rim Pennant atop gatehouse
        const gPennant = Math.sin(phase * 4) * 2;
        g.moveTo(0, -h); g.lineTo(0, -h - 10);
        g.stroke({ width: 1.2, color: 0xd4a359, alpha: a });
        g.poly([0, -h - 10, 7 + gPennant, -h - 7, 0, -h - 4]);
        g.fill({ color: 0xb91c1c, alpha: a });
      } else {
        // Interior Gatehouse Archway (Un-hung open vaulted passage)
        g.poly([-4, 4.5, 0, 6.5, 4, 4.5, 4, -0.5, 0, 1.5, -4, -0.5]);
        g.fill({ color: 0x09090b, alpha: a });
        // Portcullis raised high in the archway ceiling
        g.moveTo(-4, 0); g.lineTo(4, 0);
        g.stroke({ width: 1, color: 0x64748b, alpha: a * 0.8 });
      }

      if (isRim && rimNeighbors) {
        drawGatehouseCurtainWings(g, 20 + heightBoost, a, gx, gy, rimNeighbors);
      }

      break;
    }

    case "keep": {
      if (kit !== "western") {
        drawKeepCulture(g, 30 + heightBoost, a, phase, kit, cult, complete);
        break;
      }
      // Taller Stone Hold (Seat of the Realm) + Corner Bartizans + Crenellations + Portcullis + Royal Banner
      const h = 30 + heightBoost;
      const isDefault = true;

      const stoneLight = isDefault ? 0x64748b : cult.stone;
      const stoneDark = isDefault ? 0x475569 : blendDark(cult.stone, 0.75);
      const stonePlinth = isDefault ? 0x334155 : blendDark(cult.stone, 0.58);
      const bartizanLight = isDefault ? 0x71717a : blendLight(cult.stone, 1.12);
      const bartizanDark = isDefault ? 0x52525b : blendDark(cult.stone, 0.85);
      const lintelColor = isDefault ? 0xd4a359 : cult.timber;
      const bannerTabard = isDefault ? 0xb91c1c : cult.tabard;
      const bannerGold = isDefault ? 0xfacc15 : blendLight(cult.tabard, 1.35);
      const shieldTabard = isDefault ? 0xdc2626 : cult.tabard;
      const shieldGold = isDefault ? 0xfacc15 : blendLight(cult.tabard, 1.35);

      // 1. Foundation Plinth / Flared Talus
      g.poly([-17, 1, 0, 9.5, 0, 5, -17, -3.5]);
      g.fill({ color: stoneDark, alpha: a });
      g.poly([0, 9.5, 17, 1, 17, -3.5, 0, 5]);
      g.fill({ color: stonePlinth, alpha: a });

      // 2. Main Stone Hold Tower Walls (Dressed Ashlar Granite)
      // Left Facet (Light face)
      g.poly([-15, -2, 0, 5.5, 0, 5.5 - h, -15, -2 - h]);
      g.fill({ color: stoneLight, alpha: a });
      // Right Facet (Shaded face)
      g.poly([0, 5.5, 15, -2, 15, -2 - h, 0, 5.5 - h]);
      g.fill({ color: stoneDark, alpha: a });

      // Ashlar Masonry Course Lines
      for (const fraction of [0.22, 0.44, 0.66, 0.85]) {
        const my = 5.5 - h * fraction;
        g.moveTo(-15, -2 - h * fraction);
        g.lineTo(0, my);
        g.lineTo(15, -2 - h * fraction);
        g.stroke({ width: 0.8, color: stonePlinth, alpha: a * 0.65 });
      }

      // 3. Flanking Corner Bartizans (Stone Watch Turrets)
      // Left Bartizan
      g.poly([-17, -h + 2, -12, -h + 4.5, -12, -h - 5, -17, -h - 7.5]);
      g.fill({ color: bartizanLight, alpha: a });
      g.poly([-12, -h + 4.5, -9, -h + 3, -9, -h - 6.5, -12, -h - 5]);
      g.fill({ color: bartizanDark, alpha: a });
      g.poly([-17, -h - 7.5, -12, -h - 5, -9, -h - 6.5, -14, -h - 11]);
      g.fill({ color: stonePlinth, alpha: a }); // Turret roof cap

      // Right Bartizan
      g.poly([9, -h + 3, 12, -h + 4.5, 12, -h - 5, 9, -h - 6.5]);
      g.fill({ color: bartizanDark, alpha: a });
      g.poly([12, -h + 4.5, 17, -h + 2, 17, -h - 7.5, 12, -h - 5]);
      g.fill({ color: stonePlinth, alpha: a });
      g.poly([9, -h - 6.5, 12, -h - 5, 17, -h - 7.5, 14, -h - 11]);
      g.fill({ color: stonePlinth, alpha: a }); // Turret roof cap

      // 4. Machicolations & Parapet Battlements
      // Machicolation corbel ledge
      g.poly([-16, -h + 1, 0, 6.5 - h, 16, -h + 1, 0, -h - 7]);
      g.fill({ color: stoneLight, alpha: a });
      g.stroke({ width: 1, color: stonePlinth, alpha: a });

      // Parapet walk surface
      g.poly([-14, -h - 1, 0, 4.5 - h, 14, -h - 1, 0, -h - 6.5]);
      g.fill({ color: stonePlinth, alpha: a });

      // Left battlements (crenellations)
      for (const mx of [-14, -9, -4]) {
        const my = -h + (mx + 14) * 0.45;
        g.rect(mx, my - 4, 3.5, 4);
        g.fill({ color: bartizanLight, alpha: a });
        g.stroke({ width: 0.6, color: stoneDark, alpha: a });
      }
      // Right battlements
      for (const mx of [1, 6, 11]) {
        const my = -h + (14 - mx) * 0.45;
        g.rect(mx, my - 4, 3.5, 4);
        g.fill({ color: stoneLight, alpha: a });
        g.stroke({ width: 0.6, color: stonePlinth, alpha: a });
      }

      // 5. Arched Gateway & Iron Portcullis
      g.poly([-4, 5, 4, 1.5, 4, -5.5, -4, -2]);
      g.fill({ color: 0x09090b, alpha: a });
      // Portcullis iron grate
      g.moveTo(-2, 4); g.lineTo(-2, -3);
      g.moveTo(0, 3); g.lineTo(0, -4);
      g.moveTo(2, 2); g.lineTo(2, -5);
      g.stroke({ width: 1, color: 0x94a3b8, alpha: a * 0.8 });
      g.moveTo(-4, 0); g.lineTo(4, -3.5);
      g.stroke({ width: 1, color: 0x94a3b8, alpha: a * 0.8 });
      // Arched stone lintel / timber trim
      g.moveTo(-4, -2); g.lineTo(4, -5.5);
      g.stroke({ width: 1.8, color: lintelColor, alpha: a });

      // 6. Defensive Arrow Slits & Warm Royal Window
      // Arrow slits
      g.rect(-10, -h * 0.35, 1.4, 4); g.fill({ color: 0x0f172a, alpha: a });
      g.rect(-10, -h * 0.62, 1.4, 4); g.fill({ color: 0x0f172a, alpha: a });
      g.rect(8, -h * 0.4, 1.4, 4); g.fill({ color: 0x0f172a, alpha: a });
      g.rect(8, -h * 0.65, 1.4, 4); g.fill({ color: 0x0f172a, alpha: a });
      // Arched Royal High Window with warm candlelight
      const keepCandle = 0.85 + Math.sin(phase * 4) * 0.12;
      g.rect(-3, -h * 0.55, 4, 5.5);
      g.fill({ color: 0xfef08a, alpha: a * 0.95 * keepCandle });
      g.stroke({ width: 0.8, color: 0x78350f, alpha: a });
      // Stained glass mullion cross
      g.moveTo(-1, -h * 0.55); g.lineTo(-1, -h * 0.55 + 5.5);
      g.moveTo(-3, -h * 0.55 + 2.5); g.lineTo(1, -h * 0.55 + 2.5);
      g.stroke({ width: 0.6, color: 0x451a03, alpha: a });

      // 7. Royal Heraldic Shield above the gate
      g.poly([0, -5, 3, -3.5, 2.5, 0, 0, 2.5, -2.5, 0, -3, -3.5]);
      g.fill({ color: shieldTabard, alpha: a });
      g.poly([0, -5, 3, -3.5, 2.5, 0, 0, 2.5]);
      g.fill({ color: shieldGold, alpha: a });
      g.stroke({ width: 0.6, color: 0x78350f, alpha: a });

      // 8. Courtyard Details: Stone Steps & Iron Brazier
      // Steps in front of gate
      g.poly([-6, 6, 0, 8.8, 6, 6, 0, 3.2]);
      g.fill({ color: 0x71717a, alpha: a });
      // Iron Brazier with lively fire
      g.rect(-11, 4, 3, 3);
      g.fill({ color: 0x27272a, alpha: a });
      if (complete) {
        const kFlame = Math.sin(phase * 6) * 1.5;
        g.circle(-9.5, 3, 2.2 + kFlame * 0.3);
        g.fill({ color: 0xf97316, alpha: a });
        g.circle(-9.5, 2.5, 1.2);
        g.fill({ color: 0xfef08a, alpha: a });
      } else {
        // Cold dormant coals
        g.circle(-9.5, 3.5, 1.0);
        g.fill({ color: 0x1e293b, alpha: a * 0.8 });
      }

      // 9. Soaring Royal Standard
      const bannerWave = Math.sin(phase * 3.5) * 3;
      g.moveTo(0, -h + 2); g.lineTo(0, -h - 18);
      g.stroke({ width: 1.8, color: lintelColor, alpha: a });
      g.circle(0, -h - 19, 1.8);
      g.fill({ color: 0xfacc15, alpha: a });
      // Royal standard (tabard & accent)
      g.poly([0, -h - 18, 12 + bannerWave, -h - 13, 0, -h - 8]);
      g.fill({ color: bannerTabard, alpha: a });
      g.poly([0, -h - 16, 7 + bannerWave * 0.6, -h - 13, 0, -h - 10]);
      g.fill({ color: bannerGold, alpha: a });
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

  const h = 18 + heightBoost;
  const dec = visuals.decorations;

  // -------------------------------------------------------------
  // Holiday & Seasonal Building Dressing & Light Sources
  // -------------------------------------------------------------
  if (complete) {
    if (dec === "halloween") {
      // Keep Halloween as-is: Carved Jack-o'-Lantern on doorstep + witchfire halo
      g.ellipse(8, 4, 3.8, 3);
      g.fill({ color: 0xe85d04, alpha: 0.95 });
      g.rect(8, 1, 1.2, 1.8); g.fill({ color: 0x3f6212 }); // Stem

      // Flickering witchfire eyes & jagged grin
      const flicker = 0.72 + Math.sin(phase * 0.45 * 8.5) * 0.16 + Math.sin(phase * 0.45 * 14.3) * 0.12;
      g.rect(6.8, 3, 1, 1.2); g.fill({ color: 0xfef08a, alpha: flicker });
      g.rect(9.2, 3, 1, 1.2); g.fill({ color: 0xfef08a, alpha: flicker });
      g.rect(7.2, 4.8, 2.6, 1.2); g.fill({ color: 0xfef08a, alpha: flicker });

      // Witchfire ground light cast halo
      g.ellipse(8, 6, 5, 2.5);
      g.fill({ color: 0xf97316, alpha: 0.07 * flicker });
    } else if (dec === "midwinter") {
      // Midwinter: thick snow on roofs, hanging icicles, pine wreaths, warm windows, brass lantern
      // 1. Thick snow on roofs with contoured eaves
      g.poly([
        -17, -h + 2,
        0, -h - 12,
        17, -h + 2,
        15, -h + 5,
        0, -h - 8,
        -15, -h + 5,
      ]);
      g.fill({ color: 0xf8fafc, alpha: 0.96 });
      // Hanging icicles along eaves
      for (const ix of [-12, -6, 4, 11]) {
        const iy = -h + 3 + Math.abs(ix) * 0.35;
        g.poly([ix - 1, iy, ix + 1, iy, ix, iy + 4]);
        g.fill({ color: 0xe0f2fe, alpha: 0.9 });
      }

      // 2. Evergreen pine wreath with bright red ribbon & holly berries
      g.circle(-6, 3 - h * 0.35, 3.2);
      g.stroke({ width: 1.8, color: 0x166534, alpha: 0.95 });
      g.rect(-7, 1 - h * 0.35, 2, 2);
      g.fill({ color: 0xdc2626 });
      g.circle(-5, 4 - h * 0.35, 1);
      g.fill({ color: 0xef4444 });

      // 3. Warm candlelit windows with gentle hearth flicker & golden light halo
      const winterFlicker = 0.82 + Math.sin(phase * 0.45 * 6.0) * 0.14 + Math.sin(phase * 0.45 * 11.2) * 0.06;
      g.rect(2, -h * 0.4, 3.5, 3.5);
      g.fill({ color: 0xfef08a, alpha: 0.95 * winterFlicker });
      g.rect(3, -h * 0.35, 1.5, 1.5);
      g.fill({ color: 0xf59e0b, alpha: 0.9 });

      // Warm window/doorway light halo cast on the snow
      g.ellipse(4, 5, 5, 2.5);
      g.fill({ color: 0xfde047, alpha: 0.07 * winterFlicker });

      // 4. Brass porch lantern on doorstep
      g.rect(9, 2, 2.5, 4);
      g.fill({ color: 0x78350f });
      g.rect(9.5, 3, 1.5, 2);
      g.fill({ color: 0xfef08a, alpha: 0.95 * winterFlicker });
      g.ellipse(10, 5, 4, 2);
      g.fill({ color: 0xfacc15, alpha: 0.055 * winterFlicker });
    } else if (dec === "easter") {
      // Easter: climbing blossoms, pale ribbons, dawn lantern with golden-lilac halo
      // 1. Floral vine climbing corner and blooming boughs across eaves
      g.moveTo(-16, 2);
      g.quadraticCurveTo(-14, -h * 0.5, -16, -h + 2);
      g.stroke({ width: 1.5, color: 0x22c55e, alpha: 0.85 });

      // Pastel blossoms along eaves and lintel
      const flowerSpots: [number, number, number][] = [
        [-16, 1, 0xf472b6],
        [-14, -h * 0.4, 0xfbcfe8],
        [-10, -h * 0.8, 0xf472b6],
        [-2, -h - 6, 0xf8fafc],
        [6, -h * 0.7, 0xd8b4fe],
        [12, -h * 0.4, 0xf472b6],
        [14, 0, 0xfbcfe8],
      ];
      for (const [bx, by, col] of flowerSpots) {
        g.circle(bx, by, 1.6);
        g.fill({ color: col, alpha: 0.92 });
        g.circle(bx, by, 0.7);
        g.fill({ color: 0xfef08a, alpha: 0.95 });
      }

      // 2. Silky pale ribbons fluttering from eaves
      const ribbonSway = Math.sin(phase * 3.2) * 1.5;
      // Lavender ribbon from left eave
      g.poly([
        -14, -h + 3,
        -14 + ribbonSway, -h + 10,
        -12 + ribbonSway, -h + 10,
        -13, -h + 3,
      ]);
      g.fill({ color: 0xd8b4fe, alpha: 0.88 });
      // Pale rose ribbon from right eave
      g.poly([
        10, -h + 2,
        11 + ribbonSway, -h + 9,
        12.5 + ribbonSway, -h + 9,
        11.5, -h + 2,
      ]);
      g.fill({ color: 0xfbcfe8, alpha: 0.88 });

      // 3. Dawn lantern on doorstep with soft golden-lilac morning halo
      const dawnGlow = 0.82 + Math.sin(phase * 0.45 * 4.5) * 0.12;
      g.rect(8, 2, 2.8, 4.5);
      g.fill({ color: 0xd4a359 });
      g.rect(8.6, 3, 1.6, 2.5);
      g.fill({ color: 0xfef08a, alpha: 0.95 * dawnGlow });
      // Dawn halo cast on doorstep
      g.ellipse(9, 5, 5, 2.5);
      g.fill({ color: 0xe9d5ff, alpha: 0.07 * dawnGlow });
      g.ellipse(9, 5, 3, 1.5);
      g.fill({ color: 0xfef08a, alpha: 0.05 * dawnGlow });
    } else if (dec === "harvest") {
      // Harvest: golden sheaves, amber oil lamps with deep amber flicker & halo, harvest props
      // 1. Golden grain sheaves tied with twine propped against building wall
      g.poly([-14, 5, -16, -h * 0.5, -11, -h * 0.5, -12, 5]);
      g.fill({ color: 0xca8a04, alpha: 0.95 });
      g.circle(-14.5, -h * 0.5 - 1.5, 1.8); g.fill({ color: 0xfacc15 });
      g.circle(-12.5, -h * 0.5 - 1.5, 1.8); g.fill({ color: 0xfef08a });
      // Rustic twine tie
      g.rect(-14.5, 1 - h * 0.25, 3.5, 1.4);
      g.fill({ color: 0x78350f });

      // Smaller sheaf on right flank
      g.poly([11, 4, 10, -h * 0.35, 14, -h * 0.35, 13, 4]);
      g.fill({ color: 0xd97706, alpha: 0.9 });
      g.circle(12, -h * 0.35 - 1.5, 1.6); g.fill({ color: 0xfacc15 });

      // 2. Amber oil lamps with deep amber flicker & cast halo
      const amberFlicker = 0.76 + Math.sin(phase * 0.45 * 7.2) * 0.16 + Math.sin(phase * 0.45 * 12.1) * 0.08;
      // Iron arm & lamp
      g.moveTo(7, -h * 0.3); g.lineTo(9, -h * 0.3); g.lineTo(9, -h * 0.3 + 4);
      g.stroke({ width: 1.2, color: 0x27272a });
      g.rect(8, -h * 0.3 + 1, 2.5, 3.5);
      g.fill({ color: 0x451a03 });
      // Amber flame
      g.rect(8.5, -h * 0.3 + 2, 1.5, 2);
      g.fill({ color: 0xf59e0b, alpha: amberFlicker });
      // Rich amber halo cast on facade and ground
      g.ellipse(8, 4, 5, 2.5);
      g.fill({ color: 0xf59e0b, alpha: 0.07 * amberFlicker });
      g.ellipse(8, -h * 0.3 + 2, 4, 2.5);
      g.fill({ color: 0xd97706, alpha: 0.05 * amberFlicker });

      // 3. Harvest cider cask & field gourd on porch
      g.ellipse(-4, 5, 3, 2.2);
      g.fill({ color: 0x854d0e });
      g.ellipse(4, 5, 2.6, 2);
      g.fill({ color: 0xea580c });
    } else if (dec === "midsummer") {
      // Midsummer: standing solstice bonfire brazier with dancing flames, long light sunset highlights
      // 1. Standing iron brazier with leaping bonfire flames
      const flamePulse = Math.sin(phase * 0.45 * 8.5) * 1.5;
      const flamePulse2 = Math.sin(phase * 0.45 * 13.7) * 1.2;
      const brazierGlow = 0.8 + Math.sin(phase * 0.45 * 9.0) * 0.14 + Math.sin(phase * 0.45 * 15.0) * 0.08;
      // Brazier tripod stand
      g.moveTo(7, 6); g.lineTo(9, 1);
      g.moveTo(11, 6); g.lineTo(9, 1);
      g.stroke({ width: 1.5, color: 0x27272a });
      // Iron bowl
      g.ellipse(9, 1, 3.5, 1.8);
      g.fill({ color: 0x3f3f46 });
      // Leaping bonfire flame tongues
      g.poly([
        6.5, 1,
        8, -3 + flamePulse,
        9, -5 + flamePulse2,
        10.5, -2.5 + flamePulse,
        11.5, 1,
      ]);
      g.fill({ color: 0xf97316, alpha: 0.95 });
      g.poly([
        7.5, 1,
        9, -4 + flamePulse2,
        10.5, 1,
      ]);
      g.fill({ color: 0xfacc15, alpha: 0.98 });
      g.circle(9, 0, 1.4);
      g.fill({ color: 0xfef08a, alpha: 1.0 });
      // Wide bonfire glow halo on ground & building facet
      g.ellipse(9, 4, 5, 2.5);
      g.fill({ color: 0xf59e0b, alpha: 0.07 * brazierGlow });
      g.ellipse(9, 2, 3.5, 1.8);
      g.fill({ color: 0xfde047, alpha: 0.055 * brazierGlow });

      // 2. Long light: warm golden sunset highlight on roofline & sunburst medallion
      g.moveTo(-16, -h + 2);
      g.lineTo(0, -h - 11);
      g.lineTo(16, -h + 2);
      g.stroke({ width: 1.8, color: 0xfde047, alpha: 0.75 });
      // Solstice sunburst medallion above lintel
      g.circle(0, -h * 0.45, 2.5);
      g.fill({ color: 0xfacc15, alpha: 0.95 });
      // Marigold garlands along eaves
      for (const gx of [-10, -5, 5, 10]) {
        const gy = -h + 2 + Math.abs(gx) * 0.4;
        g.circle(gx, gy, 1.5);
        g.fill({ color: 0xfbbf24, alpha: 0.9 });
        g.circle(gx, gy, 0.7);
        g.fill({ color: 0x78350f, alpha: 0.95 });
      }
    } else if (dec === "spring") {
      // Spring (lighter version of Easter): window flowerbox + gentle morning light
      g.rect(1, -h * 0.35 + 4, 5, 2);
      g.fill({ color: 0x78350f, alpha: 0.9 });
      g.circle(2.5, -h * 0.35 + 3.5, 1.2); g.fill({ color: 0x22c55e });
      g.circle(4.5, -h * 0.35 + 3.5, 1.2); g.fill({ color: 0xf472b6 });
      g.rect(2, -h * 0.4, 3.5, 3.5);
      g.fill({ color: 0xfef08a, alpha: 0.65 });
      g.ellipse(3.5, 4, 5, 2.5);
      g.fill({ color: 0x86efac, alpha: 0.05 });
    } else if (dec === "summer") {
      // Summer (lighter version of Midsummer): brass porch lantern + sunlit roofline
      g.rect(8, 2, 2.2, 3.5); g.fill({ color: 0x78350f });
      g.rect(8.5, 3, 1.2, 1.8); g.fill({ color: 0xfef08a, alpha: 0.85 });
      g.ellipse(9, 4, 5, 2.5); g.fill({ color: 0xfde047, alpha: 0.07 });
      g.moveTo(-16, -h + 2); g.lineTo(0, -h - 10); g.lineTo(16, -h + 2);
      g.stroke({ width: 1.2, color: 0xfef08a, alpha: 0.45 });
    } else if (dec === "autumn") {
      // Autumn (lighter version of Harvest): small sheaf, gourd, warm amber window
      g.poly([-12, 4, -13, -h * 0.3, -10, -h * 0.3, -11, 4]); g.fill({ color: 0xca8a04, alpha: 0.85 });
      g.ellipse(7, 4, 2.4, 1.8); g.fill({ color: 0xea580c, alpha: 0.85 });
      g.rect(2, -h * 0.4, 3.5, 3.5); g.fill({ color: 0xf59e0b, alpha: 0.75 });
      g.ellipse(3.5, 4, 5, 2.5); g.fill({ color: 0xf97316, alpha: 0.07 });
    } else if (dec === "winter") {
      // Winter (lighter version of Midwinter): snow ridgeline trim + hearth-lit window
      g.moveTo(-16, -h + 2); g.lineTo(0, -h - 10); g.lineTo(16, -h + 2);
      g.stroke({ width: 2.2, color: 0xf8fafc, alpha: 0.85 });
      const wFlicker = 0.8 + Math.sin(phase * 0.45 * 5.0) * 0.12;
      g.rect(2, -h * 0.4, 3.5, 3.5); g.fill({ color: 0xfef08a, alpha: 0.85 * wFlicker });
      g.ellipse(3.5, 4, 5, 2.5); g.fill({ color: 0xfde047, alpha: 0.07 * wFlicker });
    }
  }

  // Scarred / knocked-out building presentation: cracked stone & rubble overlay
  // Unfinished towers stay scaffolding, while scarred buildings draw cracked stone
  if (!complete && typeId !== "watchtower") {
    const effectiveH = buildingHeight(typeId, lvl, gx, gy);
    drawCrackedStoneOverlay(g, typeId, effectiveH, gx, gy, kit, lvl);
  }

  // Level Pips (Visual upgrade indicator)
  for (let i = 0; i < lvl; i++) {
    const px = -8 + i * 4.5;
    g.rect(px, HALF_H - 4, 3, 2.5);
    g.fill({ color: 0xfef08a, alpha: 0.9 });
    g.stroke({ width: 0.5, color: 0x78350f, alpha: 0.8 });
  }
}

