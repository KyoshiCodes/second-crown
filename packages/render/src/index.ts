import { Application, Graphics, Container } from "pixi.js";
import type { GameState, Province, TerrainId, ProvinceNode } from "@second-crown/shared";
import { BOARD_W, BOARD_H } from "@second-crown/shared";
import {
  getBuildingType,
  currentSeason,
  activePlayerMarch,
  listMarches,
  getProvince,
  isProvinceSeen,
} from "@second-crown/sim";
import * as sim from "@second-crown/sim";
import type { March } from "@second-crown/sim";

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

export interface MapRenderer {
  sync(state: GameState): void;
  setTheme(themeId: string, holidayId: string): void;
  destroy(): void;
  onTileClick(cb: (x: number, y: number) => void): void;
  onProvinceClick(cb: (provinceId: string) => void): void;
  zoomIn(): void;
  zoomOut(): void;
  resetView(): void;
  getBand(): CameraBand;
  setBand(band: CameraBand): void;
  onBandChange(cb: (band: CameraBand) => void): void;
}

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
      return { fill: 0x44403c, fillDark: 0x2e2b29, border: 0x57534e, accent: 0x78716c };
    case "waste":
      return { fill: 0x291d18, fillDark: 0x1c130f, border: 0x442f24, accent: 0xd97706 };
    case "shore":
      return { fill: 0x0369a1, fillDark: 0x02456b, border: 0x0284c7, accent: 0xd4a359 };
    case "peak":
      return { fill: 0x334155, fillDark: 0x1e293b, border: 0x475569, accent: 0xf8fafc };
    default:
      return { fill: 0x2d5a27, fillDark: 0x1e3e1a, border: 0x4d7c0f, accent: 0x78b159 };
  }
}

// Grid configuration
export const GRID_W = 16;
export const GRID_H = 10;

export function isRimTile(gx: number, gy: number): boolean {
  return gx === 0 || gy === 0 || gx === GRID_W - 1 || gy === GRID_H - 1;
}

export function isMarchHostile(march: { realmId: string }): boolean {
  return march.realmId !== "player";
}

/**
 * Resolves the primary unit type for a march column.
 * Inspects march.force counts with tier priority (champion > siege > knight > cavalry > archer > skirmisher > spearman > militia).
 * Defaults to "militia" when force is empty or unspecified.
 */
export function primaryUnitTypeForMarch(march: { force?: Record<string, number>; levy?: number }): string {
  if (march.force) {
    let bestType = "";
    let maxCount = 0;
    const tierPriority: Record<string, number> = {
      champion: 10,
      siege: 9,
      knight: 8,
      cavalry: 7,
      archer: 6,
      skirmisher: 5,
      spearman: 4,
      militia: 1,
    };
    for (const [typeId, count] of Object.entries(march.force)) {
      const n = Number(count) || 0;
      if (n > maxCount || (n === maxCount && (tierPriority[typeId] ?? 0) > (tierPriority[bestType] ?? 0))) {
        maxCount = n;
        bestType = typeId;
      }
    }
    if (bestType && maxCount > 0) return bestType;
  }
  return "militia";
}

export interface UnitVisualPalette {
  id: string;
  name: string;
  tabardColor: number;
  tabardDark: number;
  armorColor: number;
  weaponColor: number;
  accentColor: number;
  weaponKind: "spear" | "bow" | "horse" | "heater" | "siege" | "club" | "javelin" | "greatsword";
  helmKind: "none" | "kettle" | "cap" | "plate" | "crown";
  hasMount: boolean;
  isChassis: boolean;
}

export function unitPalette(typeId: string, cultureId?: string): UnitVisualPalette {
  let pal: UnitVisualPalette;
  switch (typeId) {
    case "archer":
      pal = {
        id: "archer",
        name: "Archer",
        tabardColor: 0x14532d,
        tabardDark: 0x052e16,
        armorColor: 0x78350f,
        weaponColor: 0x854d0e,
        accentColor: 0xfacc15,
        weaponKind: "bow",
        helmKind: "cap",
        hasMount: false,
        isChassis: false,
      };
      break;
    case "spearman":
      pal = {
        id: "spearman",
        name: "Spearman",
        tabardColor: 0x1e40af,
        tabardDark: 0x172554,
        armorColor: 0x94a3b8,
        weaponColor: 0xf1f5f9,
        accentColor: 0xfacc15,
        weaponKind: "spear",
        helmKind: "kettle",
        hasMount: false,
        isChassis: false,
      };
      break;
    case "skirmisher":
      pal = {
        id: "skirmisher",
        name: "Skirmisher",
        tabardColor: 0x15803d,
        tabardDark: 0x14532d,
        armorColor: 0x5c3818,
        weaponColor: 0xcbd5e1,
        accentColor: 0xfde047,
        weaponKind: "javelin",
        helmKind: "cap",
        hasMount: false,
        isChassis: false,
      };
      break;
    case "cavalry":
      pal = {
        id: "cavalry",
        name: "Cavalry",
        tabardColor: 0x1d4ed8,
        tabardDark: 0x1e3a8a,
        armorColor: 0x94a3b8,
        weaponColor: 0xf8fafc,
        accentColor: 0x22c55e,
        weaponKind: "horse",
        helmKind: "kettle",
        hasMount: true,
        isChassis: false,
      };
      break;
    case "knight":
      pal = {
        id: "knight",
        name: "Knight",
        tabardColor: 0xb91c1c,
        tabardDark: 0x7f1d1d,
        armorColor: 0xcbd5e1,
        weaponColor: 0xf8fafc,
        accentColor: 0xfacc15,
        weaponKind: "heater",
        helmKind: "plate",
        hasMount: false,
        isChassis: false,
      };
      break;
    case "siege":
      pal = {
        id: "siege",
        name: "Siege Engine",
        tabardColor: 0x5c3818,
        tabardDark: 0x3b2010,
        armorColor: 0x27272a,
        weaponColor: 0x94a3b8,
        accentColor: 0xd4a359,
        weaponKind: "siege",
        helmKind: "none",
        hasMount: false,
        isChassis: true,
      };
      break;
    case "champion":
      pal = {
        id: "champion",
        name: "Champion",
        tabardColor: 0x581c87,
        tabardDark: 0x3b0764,
        armorColor: 0xf59e0b,
        weaponColor: 0x38bdf8,
        accentColor: 0xfde047,
        weaponKind: "greatsword",
        helmKind: "crown",
        hasMount: false,
        isChassis: false,
      };
      break;
    case "militia":
    default:
      pal = {
        id: "militia",
        name: "Militia",
        tabardColor: 0x854d0e,
        tabardDark: 0x543007,
        armorColor: 0x52525b,
        weaponColor: 0x78350f,
        accentColor: 0xa16207,
        weaponKind: "club",
        helmKind: "none",
        hasMount: false,
        isChassis: false,
      };
      break;
  }

  if (cultureId) {
    const kit = resolveCultureKit(cultureId);
    if (kit !== "western") {
      const cult = culturePalette(cultureId);
      pal.tabardColor = cult.tabard;
      pal.tabardDark = blendDark(cult.tabard, 0.7);
      pal.accentColor = cult.accent;
      if (kit === "cedar" || kit === "sand") {
        pal.armorColor = cult.timber;
      } else if (kit === "steppe" || kit === "islands") {
        pal.armorColor = cult.stone;
      }
    }
  }

  return pal;
}

export interface RealmTokenPalette {
  realmId: string;
  name: string;
  glyph: string;
  borderColor: number;
  rimColor: number;
  studColor: number;
  keepWallColor: number;
  keepWallDark: number;
  battlementColor: number;
  pennantColor: number;
  accentColor: number;
  plaqueColor: number;
  plaqueBorder: number;
}

export const REALM_TOKEN_PALETTES: Record<string, RealmTokenPalette> = {
  rival: {
    realmId: "rival",
    name: "Iron March",
    glyph: "⚔",
    borderColor: 0x71717a,
    rimColor: 0x2d3748,
    studColor: 0xd1d5db,
    keepWallColor: 0x3f3f46,
    keepWallDark: 0x27272a,
    battlementColor: 0x3f3f46,
    pennantColor: 0x991b1b,
    accentColor: 0xef4444,
    plaqueColor: 0x18181b,
    plaqueBorder: 0x71717a,
  },
  k_silk: {
    realmId: "k_silk",
    name: "Silk Coast",
    glyph: "⚓",
    borderColor: 0x1a5b66,
    rimColor: 0xb8860b,
    studColor: 0xfad961,
    keepWallColor: 0x134e5a,
    keepWallDark: 0x0e353c,
    battlementColor: 0x247582,
    pennantColor: 0x0f766e,
    accentColor: 0xf1c40f,
    plaqueColor: 0x0e353c,
    plaqueBorder: 0xfad961,
  },
  k_ash: {
    realmId: "k_ash",
    name: "Ash Nomads",
    glyph: "▲",
    borderColor: 0x6b2c15,
    rimColor: 0x4a2411,
    studColor: 0xc98a58,
    keepWallColor: 0x4a2411,
    keepWallDark: 0x2b1007,
    battlementColor: 0x7c2d12,
    pennantColor: 0xc2410c,
    accentColor: 0xe67e22,
    plaqueColor: 0x2b1007,
    plaqueBorder: 0xc98a58,
  },
  k_veil: {
    realmId: "k_veil",
    name: "Veil Theocracy",
    glyph: "✦",
    borderColor: 0x3d2b63,
    rimColor: 0x64748b,
    studColor: 0xe2e8f0,
    keepWallColor: 0x312350,
    keepWallDark: 0x1f1435,
    battlementColor: 0x4c1d95,
    pennantColor: 0x7c3aed,
    accentColor: 0xa78bfa,
    plaqueColor: 0x1f1435,
    plaqueBorder: 0xa78bfa,
  },
  k_glass: {
    realmId: "k_glass",
    name: "Glass Cities",
    glyph: "◇",
    borderColor: 0x1e4e61,
    rimColor: 0x0284c7,
    studColor: 0xbae6fd,
    keepWallColor: 0x153846,
    keepWallDark: 0x0c2833,
    battlementColor: 0x0284c7,
    pennantColor: 0x0284c7,
    accentColor: 0x06b6d4,
    plaqueColor: 0x0c2833,
    plaqueBorder: 0x38bdf8,
  },
  k_frost: {
    realmId: "k_frost",
    name: "Frost Holds",
    glyph: "❄",
    borderColor: 0x1c3d5a,
    rimColor: 0x38bdf8,
    studColor: 0xe0f2fe,
    keepWallColor: 0x132a3e,
    keepWallDark: 0x091c2b,
    battlementColor: 0x0369a1,
    pennantColor: 0x0284c7,
    accentColor: 0x7dd3fc,
    plaqueColor: 0x091c2b,
    plaqueBorder: 0x7dd3fc,
  },
  k_tide: {
    realmId: "k_tide",
    name: "Tide Princes",
    glyph: "≈",
    borderColor: 0x0c4052,
    rimColor: 0x0f766e,
    studColor: 0x6ee7b7,
    keepWallColor: 0x082e3b,
    keepWallDark: 0x041e27,
    battlementColor: 0x0d9488,
    pennantColor: 0x0d9488,
    accentColor: 0x2dd4bf,
    plaqueColor: 0x041e27,
    plaqueBorder: 0x2dd4bf,
  },
  k_ember: {
    realmId: "k_ember",
    name: "Ember Concord",
    glyph: "☄",
    borderColor: 0x5a180c,
    rimColor: 0xc2410c,
    studColor: 0xfdba74,
    keepWallColor: 0x3d1008,
    keepWallDark: 0x2d0b05,
    battlementColor: 0x9a3412,
    pennantColor: 0xea580c,
    accentColor: 0xf97316,
    plaqueColor: 0x2d0b05,
    plaqueBorder: 0xf97316,
  },
  k_bronze: {
    realmId: "k_bronze",
    name: "Bronze League",
    glyph: "Ω",
    borderColor: 0x4a3512,
    rimColor: 0x92400e,
    studColor: 0xfde68a,
    keepWallColor: 0x33240c,
    keepWallDark: 0x211604,
    battlementColor: 0x78350f,
    pennantColor: 0xd97706,
    accentColor: 0xfbbf24,
    plaqueColor: 0x211604,
    plaqueBorder: 0xfbbf24,
  },
};

export function realmTokenPalette(realmId: string): RealmTokenPalette {
  if (REALM_TOKEN_PALETTES[realmId]) {
    return REALM_TOKEN_PALETTES[realmId];
  }
  let hash = 0;
  for (let i = 0; i < realmId.length; i++) {
    hash = (hash * 31 + realmId.charCodeAt(i)) >>> 0;
  }
  const hues = [0xb91c1c, 0x1d4ed8, 0x15803d, 0xb45309, 0x7c3aed, 0x0e7490, 0x475569];
  const col = hues[hash % hues.length];
  return {
    realmId,
    name: realmId,
    glyph: "✦",
    borderColor: col,
    rimColor: 0xd4d4d8,
    studColor: 0xfef08a,
    keepWallColor: 0x3f3f46,
    keepWallDark: 0x27272a,
    battlementColor: col,
    pennantColor: col,
    accentColor: 0xfde047,
    plaqueColor: 0x18181b,
    plaqueBorder: col,
  };
}

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

export function isNpcHoldProvince(p: { node?: string; occupantRealmId?: string | null }): boolean {
  return Boolean(p.occupantRealmId && p.occupantRealmId !== "player" && p.node === "hold");
}

export interface RimFort {
  x: number;
  y: number;
  kind: "wall" | "gate";
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

export interface RimNeighbors {
  hasPrev: boolean;
  hasNext: boolean;
  prevKind?: "wall" | "gate";
  nextKind?: "wall" | "gate";
}
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
        const dec = visuals.decorations;

        if (dec === "halloween") {
          // Keep Halloween scatter as-is (pumpkins + stems)
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
          // Midwinter: snowdrifts, pine boughs with holly berries, ice crystals
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
          // Easter: painted easter eggs, spring blossoms, pale ribbons, fresh clover
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
          // Harvest: bound golden sheaves, ripe field pumpkins, apple bushel, autumn leaves
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
          // Midsummer: sunburst sunflowers, solstice flower crowns, chamomile, warm flagstones
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
          // Spring (lighter version of Easter)
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
          // Summer (lighter version of Midsummer)
          if (hash === 4) {
            g.circle(wx + 2, wy - 1, 1.5);
            g.fill({ color: 0xfacc15, alpha: 0.8 });
          } else if (hash === 10) {
            g.circle(wx - 2, wy + 1, 1.5);
            g.fill({ color: 0x84cc16, alpha: 0.75 });
          }
        } else if (dec === "autumn") {
          // Autumn (lighter version of Harvest)
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
          // Winter (lighter version of Midwinter)
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
// Rim Wall Run: Connected Stone Curtain & Gatehouse Wings
// -------------------------------------------------------------
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

  // Boundary coordinates from tile center (0, 0) to neighbor tiles
  const bPrevX = ((pPrev.x - gx - (pPrev.y - gy)) * HALF_W) / 2;
  const bPrevY = ((pPrev.x - gx + (pPrev.y - gy)) * HALF_H) / 2;
  const bNextX = ((pNext.x - gx - (pNext.y - gy)) * HALF_W) / 2;
  const bNextY = ((pNext.x - gx + (pNext.y - gy)) * HALF_H) / 2;

  const isTop = gy === 0;
  const isRight = gx === GRID_W - 1;
  const isBottom = gy === GRID_H - 1;
  const isLeft = gx === 0;

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

  function drawCurtainSpan(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    normX: number,
    normY: number,
    sunlit: boolean
  ) {
    // 1. Foundation Plinth (bottom 3.5px)
    g.poly([
      x0 + normX, y0 + normY,
      x1 + normX, y1 + normY,
      x1 + normX, y1 + normY - 3.5,
      x0 + normX, y0 + normY - 3.5,
    ]);
    g.fill({ color: plinthCol, alpha: a });

    // 2. Vertical Curtain Face
    g.poly([
      x0 + normX, y0 + normY - 3.5,
      x1 + normX, y1 + normY - 3.5,
      x1 + normX, y1 + normY - h,
      x0 + normX, y0 + normY - h,
    ]);
    g.fill({ color: sunlit ? wallSunlitCol : wallShadedCol, alpha: a });

    // 3. Horizontal Mortar / Seam Scoring
    for (const f of [0.35, 0.70]) {
      const my0 = y0 + normY - h * f;
      const my1 = y1 + normY - h * f;
      g.moveTo(x0 + normX, my0);
      g.lineTo(x1 + normX, my1);
      g.stroke({ width: 0.8, color: mortarCol, alpha: a * 0.65 });
    }

    // 4. Wall-Walk Top Walkway (at height -h)
    g.poly([
      x0 + normX, y0 + normY - h,
      x1 + normX, y1 + normY - h,
      x1 - normX, y1 - normY - h,
      x0 - normX, y0 - normY - h,
    ]);
    g.fill({ color: walkCol, alpha: a });

    // Wall-walk planking center line
    g.moveTo(x0, y0 - h);
    g.lineTo(x1, y1 - h);
    g.stroke({ width: 1.6, color: walkPlankCol, alpha: a });

    // 5. Parapet Merlons along outer edge
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.round(dist / 6));
    for (let i = 0; i < steps; i++) {
      const tStart = i / steps;
      const tEnd = (i + 0.6) / steps;
      const mx0 = x0 + normX + (x1 - x0) * tStart;
      const my0 = y0 + normY - h + (y1 - y0) * tStart;
      const mx1 = x0 + normX + (x1 - x0) * tEnd;
      const my1 = y0 + normY - h + (y1 - y0) * tEnd;

      if (kit === "cedar") {
        // Pointed cedar log stakes
        g.poly([
          mx0, my0,
          (mx0 + mx1) * 0.5, my0 - 4.5,
          mx1, my1,
          mx1, my1 - 2,
          mx0, my0 - 2,
        ]);
        g.fill({ color: sunlit ? merlonSunlitCol : merlonShadedCol, alpha: a });
        g.moveTo((mx0 + mx1) * 0.5, my0 - 4.5);
        g.lineTo(mx1, my1);
        g.stroke({ width: 0.8, color: merlonCopingCol, alpha: a * 0.8 });
      } else if (kit === "sand") {
        // Stepped / sawtooth desert crenellations
        g.poly([
          mx0, my0,
          (mx0 + mx1) * 0.5, my0 - 4,
          mx1, my1,
          mx1, my1 - 2,
          mx0, my0 - 2,
        ]);
        g.fill({ color: sunlit ? merlonSunlitCol : merlonShadedCol, alpha: a });
        g.moveTo(mx0, my0 - 2);
        g.lineTo((mx0 + mx1) * 0.5, my0 - 4);
        g.lineTo(mx1, my1 - 2);
        g.stroke({ width: 0.8, color: merlonCopingCol, alpha: a * 0.9 });
      } else {
        // Merlon block (rises 3.5px above parapet)
        g.poly([
          mx0, my0,
          mx1, my1,
          mx1, my1 - 3.5,
          mx0, my0 - 3.5,
        ]);
        g.fill({ color: sunlit ? merlonSunlitCol : merlonShadedCol, alpha: a });

        // Merlon coping stone highlight
        g.moveTo(mx0, my0 - 3.5);
        g.lineTo(mx1, my1 - 3.5);
        g.stroke({ width: 0.8, color: merlonCopingCol, alpha: a * 0.8 });
      }
    }

    // 6. Arrow loop slits in curtain face
    const midX = (x0 + x1) / 2 + normX;
    const midY = (y0 + y1) / 2 + normY - h * 0.45;
    g.rect(midX - 0.7, midY - 2, 1.4, 4);
    g.fill({ color: arrowSlitCol, alpha: a });
  }

  function getNorm(isEdgeTop: boolean, isEdgeRight: boolean, isEdgeBottom: boolean, isEdgeLeft: boolean): { nx: number; ny: number; sunlit: boolean } {
    if (isEdgeBottom) return { nx: -3.5, ny: 1.8, sunlit: true };
    if (isEdgeRight) return { nx: 3.5, ny: 1.8, sunlit: false };
    if (isEdgeTop) return { nx: -3.5, ny: -1.8, sunlit: false };
    return { nx: -3.5, ny: -1.8, sunlit: true };
  }

  // Draw curtain to prev neighbor
  const normPrev = getNorm(isTop, isRight, isBottom, isLeft);
  const pTargetX = hasPrev ? bPrevX : bPrevX * 0.65;
  const pTargetY = hasPrev ? bPrevY : bPrevY * 0.65;
  drawCurtainSpan(0, 0, pTargetX, pTargetY, normPrev.nx, normPrev.ny, normPrev.sunlit);

  // Draw curtain to next neighbor
  const normNext = getNorm(isTop, isRight, isBottom, isLeft);
  const nTargetX = hasNext ? bNextX : bNextX * 0.65;
  const nTargetY = hasNext ? bNextY : bNextY * 0.65;
  drawCurtainSpan(0, 0, nTargetX, nTargetY, normNext.nx, normNext.ny, normNext.sunlit);

  // Center Bastion Tower at (0, 0)
  const isCorner = (isTop && isLeft) || (isTop && isRight) || (isBottom && isRight) || (isBottom && isLeft);
  const towerH = h + (isCorner ? 4 : 2);
  const tw = isCorner ? 7 : 5.5;

  // Tower plinth
  g.poly([-tw, 0, 0, tw * 0.5, tw, 0, 0, -tw * 0.5]);
  g.fill({ color: plinthCol, alpha: a });

  // Tower light face (left)
  g.poly([-tw, 0, 0, tw * 0.5, 0, tw * 0.5 - towerH, -tw, -towerH]);
  g.fill({ color: wallSunlitCol, alpha: a });

  // Tower shadow face (right)
  g.poly([0, tw * 0.5, tw, 0, tw, -towerH, 0, tw * 0.5 - towerH]);
  g.fill({ color: wallShadedCol, alpha: a });

  // Tower roof / platform
  g.poly([-tw, -towerH, 0, tw * 0.5 - towerH, tw, -towerH, 0, -tw * 0.5 - towerH]);
  g.fill({ color: walkCol, alpha: a });

  // Tower crenellations / merlons
  g.rect(-tw, -towerH - 3, 2.5, 3); g.fill({ color: merlonSunlitCol, alpha: a });
  g.rect(-1, -towerH - 3 + tw * 0.5, 2.5, 3); g.fill({ color: merlonSunlitCol, alpha: a });
  g.rect(tw - 2.5, -towerH - 3, 2.5, 3); g.fill({ color: merlonShadedCol, alpha: a });

  // Arrow slit in tower front
  g.rect(-0.7, -towerH * 0.5, 1.4, 4);
  g.fill({ color: arrowSlitCol, alpha: a });

  // Wall fixture
  if (kit === "cedar") {
    // Carved beast totem marker & pitch torch
    g.rect(-2, -towerH * 0.7, 4, 3); g.fill({ color: 0xd4a359, alpha: a });
    const flameFlicker = Math.sin(phase * 4 + gx * 2) * 0.8;
    g.rect(-tw - 1.5, -h * 0.45, 1.5, 3.5); g.fill({ color: 0x3f220c, alpha: a });
    g.circle(-tw - 1, -h * 0.45 - 2, 1.6 + flameFlicker * 0.3);
    g.fill({ color: 0xea580c, alpha: a });
  } else if (kit === "sand") {
    // Hanging brass oil lantern
    g.rect(-tw - 1.5, -h * 0.45, 1.5, 3.5); g.fill({ color: 0xb45309, alpha: a });
    g.circle(-tw - 1, -h * 0.45 - 2, 1.6); g.fill({ color: 0xfacc15, alpha: a });
  } else if (kit === "steppe") {
    // Timber pole with horsehair streamer
    g.moveTo(-tw - 1, -h * 0.45); g.lineTo(-tw - 1, -h * 0.45 - 6);
    g.stroke({ width: 1.2, color: 0x291807, alpha: a });
    g.circle(-tw - 1, -h * 0.45 - 6, 1.5); g.fill({ color: 0xdc2626, alpha: a });
  } else if (kit === "islands") {
    // Hanging sea-lantern with cyan glow
    g.rect(-tw - 1.5, -h * 0.45, 1.5, 3.5); g.fill({ color: 0x78350f, alpha: a });
    g.circle(-tw - 1, -h * 0.45 - 2, 1.6); g.fill({ color: 0x06b6d4, alpha: a });
  } else {
    // Western: Wall torch sconce with flickering animated flame
    const flameFlicker = Math.sin(phase * 4 + gx * 2) * 0.8;
    g.rect(-tw - 1.5, -h * 0.45, 1.5, 3.5); g.fill({ color: 0x27272a, alpha: a });
    g.circle(-tw - 1, -h * 0.45 - 2, 1.6 + flameFlicker * 0.3);
    g.fill({ color: 0xf97316, alpha: a });
    g.circle(-tw - 1, -h * 0.45 - 2, 0.8);
    g.fill({ color: 0xfef08a, alpha: a });
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

  const isBottom = gy === GRID_H - 1;
  const isRight = gx === GRID_W - 1;

  const sunlitWingCol =
    kit === "cedar"
      ? 0x854d0e
      : kit === "sand"
      ? 0xd4a373
      : kit === "steppe"
      ? 0x713f12
      : kit === "islands"
      ? 0x94a3b8
      : 0x64748b;

  const shadedWingCol =
    kit === "cedar"
      ? 0x5c3818
      : kit === "sand"
      ? 0xa16207
      : kit === "steppe"
      ? 0x543007
      : kit === "islands"
      ? 0x64748b
      : 0x475569;

  const merlonCol =
    kit === "cedar"
      ? 0xd97706
      : kit === "sand"
      ? 0xfde68a
      : kit === "steppe"
      ? 0x854d0e
      : kit === "islands"
      ? 0xd97706
      : 0x94a3b8;

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

  if (rimNeighbors.hasPrev) {
    // Connect left bastion tower to prev boundary
    g.poly([
      -17, -1,
      bPrevX, bPrevY,
      bPrevX, bPrevY - h,
      -17, -1 - h,
    ]);
    g.fill({ color: isBottom ? sunlitWingCol : shadedWingCol, alpha: a });

    // Merlons on connection
    g.rect(bPrevX, bPrevY - h - 3.5, 3.5, 3.5);
    g.fill({ color: merlonCol, alpha: a });

    // Mortar line
    g.moveTo(-17, -1 - h * 0.5); g.lineTo(bPrevX, bPrevY - h * 0.5);
    g.stroke({ width: 0.8, color: mortarCol, alpha: a * 0.6 });
  }

  if (rimNeighbors.hasNext) {
    // Connect right bastion tower to next boundary
    g.poly([
      17, -1,
      bNextX, bNextY,
      bNextX, bNextY - h,
      17, -1 - h,
    ]);
    g.fill({ color: isRight ? shadedWingCol : sunlitWingCol, alpha: a });

    // Merlons on connection
    g.rect(bNextX - 3.5, bNextY - h - 3.5, 3.5, 3.5);
    g.fill({ color: merlonCol, alpha: a });

    // Mortar line
    g.moveTo(17, -1 - h * 0.5); g.lineTo(bNextX, bNextY - h * 0.5);
    g.stroke({ width: 0.8, color: mortarCol, alpha: a * 0.6 });
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
  cult: CultureVisualPalette
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
    const cPuff = Math.sin(phase * 2) * 2;
    g.circle(6, -h - 19 + cPuff, 2.4);
    g.fill({ color: 0xe2e8f0, alpha: 0.45 * a });
    g.circle(8, -h - 23 + cPuff, 3);
    g.fill({ color: 0xf1f5f9, alpha: 0.3 * a });

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
    const sPuff = Math.sin(phase * 2.2) * 1.5;
    g.circle(-10, -wh * 0.75 - 4 + sPuff, 1.8);
    g.fill({ color: 0xe2e8f0, alpha: 0.4 * a });

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
  cult: CultureVisualPalette
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
    const cPuff = Math.sin(phase * 2.2) * 1.8;
    g.circle(-8.5, -h - 15 + cPuff, 2.2);
    g.fill({ color: 0xe2e8f0, alpha: a * 0.45 });
    g.circle(-6.5, -h - 19 + cPuff, 2.8);
    g.fill({ color: 0xf1f5f9, alpha: a * 0.3 });

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
    const sPuff = Math.sin(phase * 2.2) * 1.6;
    g.circle(0, -h - 10 + sPuff, 2);
    g.fill({ color: 0xe2e8f0, alpha: a * 0.45 });
    g.circle(1.5, -h - 14 + sPuff, 2.6);
    g.fill({ color: 0xf1f5f9, alpha: a * 0.3 });

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
  cult: CultureVisualPalette
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
    const kSmoke = Math.sin(phase * 2.2) * 2;
    g.circle(0, -h - 20 + kSmoke, 2.8);
    g.fill({ color: 0xe2e8f0, alpha: 0.5 * a });
    g.circle(2, -h - 25 + kSmoke, 3.6);
    g.fill({ color: 0xf1f5f9, alpha: a * 0.35 });

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
    const sPuff = Math.sin(phase * 2.2) * 2;
    g.circle(0, -gh - 19 + sPuff, 2.8);
    g.fill({ color: 0xe2e8f0, alpha: a * 0.5 });
    g.circle(2, -gh - 24 + sPuff, 3.8);
    g.fill({ color: 0xf1f5f9, alpha: a * 0.35 });

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
  cult: CultureVisualPalette
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
    const cPuff = Math.sin(phase * 2.5) * 1.5;
    g.circle(8, 2 + cPuff, 2); g.fill({ color: 0x86efac, alpha: 0.4 * a });
    g.circle(9, -2 + cPuff, 2.5); g.fill({ color: 0xe2e8f0, alpha: 0.3 * a });

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
  cult: CultureVisualPalette
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
    const cPuff = Math.sin(phase * 2.2) * 1.8;
    g.circle(-10, -h - 17 + cPuff, 2.4);
    g.fill({ color: 0x86efac, alpha: 0.45 * a });

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
    const puff = Math.sin(phase * 2.2) * 1.5;
    g.circle(0, -h - 8 + puff, 2.2); g.fill({ color: 0xd1fae5, alpha: 0.5 * a });

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

function drawWatchtowerCulture(
  g: Graphics,
  h: number,
  a: number,
  phase: number,
  kit: CultureKit,
  cult: CultureVisualPalette
): void {
  if (kit === "cedar") {
    // Cedar Kin: Cross-Braced Cedar Trestle Lookout with Beacon Cage
    g.poly([-8, 0, 0, 4, 8, 0, 0, -4]); g.fill({ color: 0x3f3f46, alpha: a });

    g.moveTo(-7, 0); g.lineTo(-4, -h);
    g.moveTo(7, 0); g.lineTo(4, -h);
    g.moveTo(0, 4); g.lineTo(0, -h + 2);
    g.stroke({ width: 2.2, color: 0x78350f, alpha: a });

    for (const f of [0.25, 0.5, 0.75]) {
      g.moveTo(-6, -h * f); g.lineTo(6, -h * f);
      g.stroke({ width: 1.2, color: 0x5c3818, alpha: a });
    }

    g.poly([-8, -h + 2, 0, 4 - h, 8, -h + 2, 0, -h - 4]);
    g.fill({ color: 0x854d0e, alpha: a });
    g.poly([-8, -h - 2, 0, -h - 16, 8, -h - 2]);
    g.fill({ color: 0x654321, alpha: a });

    const fPuff = Math.sin(phase * 6) * 1.2;
    g.circle(0, -h - 18, 2.5 + fPuff * 0.2); g.fill({ color: 0xea580c, alpha: a });
    g.circle(0, -h - 18, 1.2); g.fill({ color: 0xfacc15, alpha: a });

    g.circle(-5, -h, 1.6); g.fill({ color: 0xd97706, alpha: a });

  } else if (kit === "sand") {
    // Sand Banner: Slender Sandstone Minaret with Openwork Balcony
    g.poly([-8, 0, 0, 4, 8, 0, 0, -4]); g.fill({ color: 0x92400e, alpha: a });

    g.poly([-6, 0, 0, 3, 0, 3 - h, -6, -h]); g.fill({ color: 0xd4a373, alpha: a });
    g.poly([0, 3, 6, 0, 6, -h, 0, 3 - h]); g.fill({ color: 0xa16207, alpha: a });

    g.rect(-2, -h * 0.4, 1.4, 4); g.fill({ color: 0x451a03, alpha: a });
    g.rect(2, -h * 0.7, 1.4, 4); g.fill({ color: 0x451a03, alpha: a });

    g.poly([-9, -h + 2, 0, 5 - h, 9, -h + 2, 0, -h - 4]);
    g.fill({ color: 0xc29d62, alpha: a });
    g.rect(-8, -h - 3, 16, 3); g.fill({ color: 0xfde68a, alpha: a });

    g.poly([-6, -h - 3, 0, -h - 15, 6, -h - 3]); g.fill({ color: 0xd97706, alpha: a });
    g.circle(0, -h - 15, 1.4); g.fill({ color: 0xfacc15, alpha: a });

    const sWave = Math.sin(phase * 4) * 2;
    g.moveTo(0, -h - 15); g.lineTo(8 + sWave, -h - 11);
    g.stroke({ width: 1.2, color: 0xdc2626, alpha: a });

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

    const sPuff = Math.sin(phase * 3) * 2;
    g.circle(0, -h - 8 + sPuff, 3); g.fill({ color: 0x3f3f46, alpha: 0.5 * a });
    g.circle(2, -h - 14 + sPuff, 4); g.fill({ color: 0x27272a, alpha: 0.35 * a });

    g.moveTo(5, -h - 2); g.lineTo(5, -h - 12);
    g.stroke({ width: 1.2, color: 0x291807, alpha: a });
    g.circle(5, -h - 12, 1.4); g.fill({ color: 0xdc2626, alpha: a });

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

    g.circle(0, -h - 4, 2.8); g.fill({ color: 0x06b6d4, alpha: a * 0.9 });
    g.circle(0, -h - 4, 1.4); g.fill({ color: 0xffffff, alpha: a });

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
  const kit = resolveCultureKit(cultureId);
  const cult = culturePalette(cultureId);

  switch (typeId) {
    case "farm": {
      if (kit !== "western") {
        drawFarmCulture(g, 18 + heightBoost, a, phase, kit, cult);
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

    case "cottage": {
      if (kit !== "western") {
        drawCottageCulture(g, 16 + heightBoost, a, phase, kit, cult);
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
      const cPuff = Math.sin(phase * 2.2) * 1.8;
      g.circle(-8.5, -h - 15 + cPuff, 2.2);
      g.fill({ color: 0xe2e8f0, alpha: 0.45 * a });
      g.circle(-6.5, -h - 19 + cPuff, 2.8);
      g.fill({ color: 0xf1f5f9, alpha: 0.3 * a });

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
      const forgeFlame = Math.sin(phase * 5) * 0.3;
      g.circle(13, 5.5, 1.8 + forgeFlame);
      g.fill({ color: 0xea580c, alpha: a * 0.95 });
      g.circle(13, 5.5, 1.1);
      g.fill({ color: 0xfacc15, alpha: a });
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
      if (kit !== "western") {
        drawWatchtowerCulture(g, 34 + heightBoost, a, phase, kit, cult);
        break;
      }
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
      if (kit !== "western") {
        drawChapelCulture(g, 26 + heightBoost, a, phase, kit, cult);
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
        drawInfirmaryCulture(g, 20 + heightBoost, a, phase, kit, cult);
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
      const infPuff = Math.sin(phase * 2.2) * 1.8;
      g.circle(-10, -h - 17 + infPuff, 2.4);
      g.fill({ color: 0xe2e8f0, alpha: 0.45 * a });
      g.circle(-8, -h - 21 + infPuff, 3);
      g.fill({ color: 0xf1f5f9, alpha: 0.3 * a });

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
        drawKeepCulture(g, 30 + heightBoost, a, phase, kit, cult);
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
      const kFlame = Math.sin(phase * 6) * 1.5;
      g.circle(-9.5, 3, 2.2 + kFlame * 0.3);
      g.fill({ color: 0xf97316, alpha: a });
      g.circle(-9.5, 2.5, 1.2);
      g.fill({ color: 0xfef08a, alpha: a });

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
export type WalkerRole = "villager" | "woodcutter" | "miner" | "merchant" | "guard" | "scholar";

export interface Walker {
  id: number;
  role: WalkerRole;
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

export function roleForCitizenJob(job: string): WalkerRole {
  switch (job) {
    case "farmer":
      return "villager";
    case "woodcutter":
      return "woodcutter";
    case "miner":
      return "miner";
    case "merchant":
      return "merchant";
    case "guard":
      return "guard";
    case "scholar":
      return "scholar";
    default:
      return "villager";
  }
}

export function pickDestination(w: Walker, state: GameState | null): void {
  const playerWorkers = state?.citizens?.filter(
    (c) => c.realmId === "player" && c.tile != null
  ) ?? [];

  if (playerWorkers.length > 0) {
    const worker = playerWorkers[w.id % playerWorkers.length];
    w.role = roleForCitizenJob(worker.job);

    const tx = ((worker.tile!.x % GRID_W) + GRID_W) % GRID_W;
    const ty = ((worker.tile!.y % GRID_H) + GRID_H) % GRID_H;

    const dist = Math.hypot(w.x - tx, w.y - ty);
    if (dist > 0.4) {
      w.targetX = tx;
      w.targetY = ty;
    } else {
      // Small pacing near work tile so the walker stays active at their post
      const ox = (Math.random() - 0.5) * 0.7;
      const oy = (Math.random() - 0.5) * 0.7;
      w.targetX = Math.max(0, Math.min(GRID_W - 1, tx + ox));
      w.targetY = Math.max(0, Math.min(GRID_H - 1, ty + oy));
    }
  } else {
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
  }
  w.state = "walking";
  w.facing = w.targetX >= w.x ? 1 : -1;
}

function createWalker(id: number, gx: number, gy: number): Walker {
  const roles: WalkerRole[] = ["villager", "woodcutter", "miner", "merchant", "guard", "scholar"];
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

function drawCultureWalker(
  g: Graphics,
  role: "villager" | "guard",
  facing: number,
  frame: 0 | 1 | 2,
  kit: CultureKit,
  cult: CultureVisualPalette,
  bob: number,
  legL: number,
  legR: number,
  armSwing: number
): void {
  if (kit === "cedar") {
    // Cedar Kin: Woodland Walker Cloaks
    if (role === "villager") {
      g.rect(legL, -3 - bob, 2, 4); g.fill({ color: 0x5c3818 });
      g.rect(legR, -3 - bob, 2, 4); g.fill({ color: 0x3f220c });

      g.rect(-3, -8 - bob, 6, 6); g.fill({ color: 0x14532d });

      // Trailing woodland cloak behind
      g.poly([
        -facing * 2.5, -8 - bob,
        -facing * 6, -3 - bob + (frame === 1 ? 1 : 0),
        -facing * 2, -2 - bob
      ]);
      g.fill({ color: 0x166534 });

      // Shoulder mantle
      g.rect(-3.5, -9 - bob, 7, 3); g.fill({ color: 0x166534 });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      // Woodland hood
      g.rect(-3, -14 - bob, 6, 3.5); g.fill({ color: 0x14532d });

      // Woven birch-bark foraging basket with herbs
      g.rect(facing * 3 - 1, -7 - bob + armSwing, 3.5, 3.5);
      g.fill({ color: 0xd4a359 });
      g.circle(facing * 3 + 0.5, -7.5 - bob + armSwing, 1.2);
      g.fill({ color: 0xef4444 });
    } else {
      // Guard: Woodland warrior with travel cloak, leather coif, shield, hunting spear
      g.rect(legL, -3 - bob, 2, 4); g.fill({ color: 0x3f220c });
      g.rect(legR, -3 - bob, 2, 4); g.fill({ color: 0x271406 });

      g.rect(-3, -8 - bob, 6, 6); g.fill({ color: 0x14532d });

      // Trailing woodland travel cloak
      g.poly([
        -facing * 2.5, -8 - bob,
        -facing * 6.5, -1 - bob + (frame === 1 ? 1 : 0),
        -facing * 2, 0 - bob
      ]);
      g.fill({ color: 0x166534 });

      g.rect(-3.5, -9 - bob, 7, 3); g.fill({ color: 0x166534 });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      g.rect(-3, -14 - bob, 6, 3); g.fill({ color: 0x5c3818 });
      g.rect(-1, -15 - bob, 2, 1.5); g.fill({ color: 0xfef3c7 });

      // Carved round cedar war shield on off-arm
      g.circle(-facing * 3, -6 - bob + armSwing, 3.5);
      g.fill({ color: 0x854d0e });
      g.stroke({ width: 0.8, color: 0xca8a04 });

      // Heavy ash hunting spear with leaf head
      g.moveTo(facing * 3, 0 - bob); g.lineTo(facing * 3, -17 - bob + armSwing);
      g.stroke({ width: 1.4, color: 0x78350f });
      g.poly([
        facing * 3, -17 - bob + armSwing,
        facing * 3 - 2, -14 - bob + armSwing,
        facing * 3 + 2, -14 - bob + armSwing
      ]);
      g.fill({ color: 0xe2e8f0 });
    }
  } else if (kit === "sand") {
    // Sand Banner: Linen/Sash Walkers
    if (role === "villager") {
      g.rect(legL, -2 - bob, 2, 3); g.fill({ color: 0xa16207 });
      g.rect(legR, -2 - bob, 2, 3); g.fill({ color: 0x78350f });

      g.rect(-3, -8 - bob, 6, 6); g.fill({ color: 0xd6c7a1 });

      // Bright crimson waist sash with trailing tails
      g.rect(-3.5, -6 - bob, 7, 2); g.fill({ color: 0xb45309 });
      g.rect(-facing * 1.5, -4 - bob, 2, 4 + (frame === 1 ? 1 : 0));
      g.fill({ color: 0xf59e0b });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      // Draped linen headcloth (keffiyeh) with agal cord
      g.rect(-3.5, -14 - bob, 7, 4.5); g.fill({ color: 0xfef3c7 });
      g.rect(-3.5, -13 - bob, 7, 1); g.fill({ color: 0x18181b });
      g.rect(-facing * 3, -12 - bob, 2.5, 5); g.fill({ color: 0xfef3c7 });

      // Terracotta water amphora
      g.ellipse(facing * 3, -7 - bob + armSwing, 2, 3);
      g.fill({ color: 0xc2410c });
    } else {
      // Sand Guard: Desert turban with havelock, sand tunic with crimson sash, brass buckler, slender lance
      g.rect(legL, -3 - bob, 2, 4); g.fill({ color: 0x78350f });
      g.rect(legR, -3 - bob, 2, 4); g.fill({ color: 0x5c3818 });

      g.rect(-3, -8 - bob, 6, 6); g.fill({ color: 0xd6c7a1 });
      g.rect(-3.5, -6 - bob, 7, 2.2); g.fill({ color: 0xb45309 });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      g.rect(-3.5, -14 - bob, 7, 3.5); g.fill({ color: 0xfef08a });
      g.rect(-facing * 3, -12 - bob, 2.5, 6); g.fill({ color: 0xfde047 });

      g.circle(-facing * 3, -6 - bob + armSwing, 3.5);
      g.fill({ color: 0xf59e0b });
      g.stroke({ width: 0.8, color: 0xfacc15 });

      g.moveTo(facing * 3, 0 - bob); g.lineTo(facing * 3, -18 - bob + armSwing);
      g.stroke({ width: 1.2, color: 0xa16207 });
      g.poly([
        facing * 3, -18 - bob + armSwing,
        facing * 3 + facing * 4, -16 - bob + armSwing,
        facing * 3, -14 - bob + armSwing
      ]);
      g.fill({ color: 0xb45309 });
    }
  } else if (kit === "steppe") {
    // Wind Host: Coat-and-Sash Walkers
    if (role === "villager") {
      g.rect(legL, -3 - bob, 2.5, 4); g.fill({ color: 0x451a03 });
      g.rect(legR, -3 - bob, 2.5, 4); g.fill({ color: 0x271406 });

      g.rect(-3.5, -9 - bob, 7, 7); g.fill({ color: 0x9f1239 });
      g.moveTo(-3.5, -9 - bob); g.lineTo(0, -5 - bob);
      g.stroke({ width: 1, color: 0xca8a04 });

      g.rect(-3.5, -6 - bob, 7, 2.2); g.fill({ color: 0xca8a04 });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      g.rect(-3.5, -13 - bob, 7, 2); g.fill({ color: 0x78350f });
      g.poly([-3, -13 - bob, 0, -17 - bob, 3, -13 - bob]);
      g.fill({ color: 0xf1f5f9 });

      g.rect(facing * 3 - 1, -7 - bob + armSwing, 3.5, 3);
      g.fill({ color: 0xca8a04 });
    } else {
      // Steppe Guard: Nomad coat with sash, pointed steel helmet with horsehair plume, shield, lance
      g.rect(legL, -3 - bob, 2.5, 4); g.fill({ color: 0x451a03 });
      g.rect(legR, -3 - bob, 2.5, 4); g.fill({ color: 0x271406 });

      g.rect(-3.5, -9 - bob, 7, 7); g.fill({ color: 0x9f1239 });
      g.rect(-3.5, -6 - bob, 7, 2.2); g.fill({ color: 0xca8a04 });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      g.poly([-3, -13 - bob, 0, -17 - bob, 3, -13 - bob]);
      g.fill({ color: 0xcbd5e1 });
      g.moveTo(0, -17 - bob); g.lineTo(0, -20 - bob);
      g.stroke({ width: 1.4, color: 0x9f1239 });

      g.circle(-facing * 3, -6 - bob + armSwing, 3.5);
      g.fill({ color: 0x57534e });
      g.stroke({ width: 0.8, color: 0xca8a04 });

      g.moveTo(facing * 3, 0 - bob); g.lineTo(facing * 3, -18 - bob + armSwing);
      g.stroke({ width: 1.4, color: 0x7c2d12 });
      g.circle(facing * 3, -15 - bob + armSwing, 1.4);
      g.fill({ color: 0x18181b });
      g.poly([
        facing * 3, -18 - bob + armSwing,
        facing * 3 - 1.5, -15 - bob + armSwing,
        facing * 3 + 1.5, -15 - bob + armSwing
      ]);
      g.fill({ color: 0xf1f5f9 });
    }
  } else {
    // Tide Clans: Sailcloth Walkers
    if (role === "villager") {
      g.rect(legL, -3 - bob, 2, 3); g.fill({ color: 0x0e7490 });
      g.rect(legL, 0 - bob, 2, 1); g.fill({ color: 0xfbcfe8 });
      g.rect(legR, -3 - bob, 2, 3); g.fill({ color: 0x155e75 });
      g.rect(legR, 0 - bob, 2, 1); g.fill({ color: 0xfbcfe8 });

      g.rect(-3, -8 - bob, 6, 6); g.fill({ color: 0xe2e8f0 });
      g.moveTo(-3, -5 - bob); g.lineTo(3, -5 - bob);
      g.stroke({ width: 1.2, color: 0xa16207 });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      g.ellipse(0, -13 - bob, 5.5, 1.8); g.fill({ color: 0xd4a359 });
      g.poly([-2.5, -13 - bob, 0, -16 - bob, 2.5, -13 - bob]);
      g.fill({ color: 0xb45309 });

      g.rect(facing * 3 - 1, -7 - bob + armSwing, 3.5, 3.5);
      g.fill({ color: 0xa16207 });
    } else {
      // Tide Guard: Sailcloth warrior vest, reed war cap, turtle-shell buckler, barbed trident
      g.rect(legL, -3 - bob, 2, 4); g.fill({ color: 0x44403c });
      g.rect(legR, -3 - bob, 2, 4); g.fill({ color: 0x271406 });

      g.rect(-3, -8 - bob, 6, 6); g.fill({ color: 0x0e7490 });
      g.moveTo(-3, -8 - bob); g.lineTo(3, -2 - bob);
      g.stroke({ width: 1, color: 0x44403c });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      g.rect(-3, -14 - bob, 6, 3); g.fill({ color: 0x0e7490 });
      g.moveTo(-3, -13 - bob); g.lineTo(3, -13 - bob);
      g.stroke({ width: 0.8, color: 0xf8fafc });

      g.ellipse(-facing * 3, -6 - bob + armSwing, 3, 4);
      g.fill({ color: 0x44403c });
      g.stroke({ width: 0.8, color: 0x94a3b8 });

      g.moveTo(facing * 3, 0 - bob); g.lineTo(facing * 3, -18 - bob + armSwing);
      g.stroke({ width: 1.4, color: 0x44403c });
      g.poly([
        facing * 3 - 2, -18 - bob + armSwing,
        facing * 3, -21 - bob + armSwing,
        facing * 3 + 2, -18 - bob + armSwing
      ]);
      g.stroke({ width: 1, color: 0xcbd5e1 });
    }
  }
}

/**
 * Renders an authentic 2-3 frame pixel walker sprite.
 * Frame 0: Planted / Neutral (legs together, tool at side, bob 0)
 * Frame 1: Left Step (left leg forward, right leg back, bob 1px)
 * Frame 2: Right Step (right leg forward, left leg back, bob 1px)
 */
function drawWalkerFrame(
  g: Graphics,
  role: Walker["role"],
  facing: number,
  frame: 0 | 1 | 2,
  cultureId?: string
): void {
  g.clear();

  // Ground contact shadow
  g.ellipse(0, 1, 4.5, 2.2);
  g.fill({ color: 0x000000, alpha: 0.28 });

  // Integer pixel offsets for authentic 2-3 frame animation
  const bob = frame === 0 ? 0 : 1;
  const legL = frame === 1 ? -2 : (frame === 2 ? 1 : -1);
  const legR = frame === 1 ? 1 : (frame === 2 ? -2 : 1);
  const armSwing = frame === 1 ? -1 : (frame === 2 ? 1 : 0);

  const kit = resolveCultureKit(cultureId);
  const cult = culturePalette(cultureId);
  const isDefaultCulture = kit === "western";

  // Culture-specific silhouette rendering for villager and guard
  if (!isDefaultCulture && (role === "villager" || role === "guard")) {
    drawCultureWalker(g, role, facing, frame, kit, cult, bob, legL, legR, armSwing);
    return;
  }

  // Boots / legs
  g.rect(legL, -3 - bob, 2, 4);
  g.fill({ color: 0x27272a });
  g.rect(legR, -3 - bob, 2, 4);
  g.fill({ color: 0x18181b });

  // Tunic & clothing colors by role (tinted by culture when not default western)
  let tunicColor = 0x854d0e;
  let toolColor: number | null = null;
  const toolHandleColor = isDefaultCulture ? 0x78350f : cult.timber;
  const guardPennant = isDefaultCulture ? 0xdc2626 : cult.tabard;

  if (role === "villager") tunicColor = isDefaultCulture ? 0xb45309 : cult.tabard;
  else if (role === "woodcutter") { tunicColor = 0x15803d; toolColor = 0xd1d5db; }
  else if (role === "miner") { tunicColor = isDefaultCulture ? 0x52525b : cult.stone; toolColor = 0x71717a; }
  else if (role === "merchant") tunicColor = 0xb91c1c;
  else if (role === "guard") tunicColor = isDefaultCulture ? 0x1e3a8a : cult.tabard;
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
    g.fill({ color: isDefaultCulture ? 0x94a3b8 : cult.stone }); // Helmet
  } else if (role === "scholar") {
    g.rect(-3, -13 - bob, 6, 2.5);
    g.fill({ color: 0x581c87 }); // Monk cowl
  } else {
    g.rect(-2.5, -13 - bob, 5, 2);
    g.fill({ color: 0x451a03 }); // Hair
  }

  // Carried Tools / Weapons with 2-3 frame arm motion
  if (toolColor) {
    // Woodsman axe / miner pickaxe
    g.rect(facing * 3, -9 - bob + armSwing, 1.5, 6);
    g.fill({ color: toolHandleColor });
    g.rect(facing * 3 - 1, -10 - bob + armSwing, 3.5, 2);
    g.fill({ color: toolColor });
  } else if (role === "guard") {
    // Spear with waving pennant
    g.moveTo(facing * 3, 0 - bob); g.lineTo(facing * 3, -17 - bob + armSwing);
    g.stroke({ width: 1.2, color: toolHandleColor });
    g.poly([
      facing * 3, -17 - bob + armSwing,
      facing * 3 + facing * 4, -15 - bob + armSwing,
      facing * 3, -13 - bob + armSwing,
    ]);
    g.fill({ color: guardPennant });
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
}

// -------------------------------------------------------------
// Tabletop Board Diorama Painters (8x6 Grid, Terrain Chips, Marches)
// -------------------------------------------------------------
function paintBoardBackdrop(g: Graphics, visuals: ThemeVisuals): void {
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
  g.fill({ color: 0x78531e, alpha: 0.55 });
  g.circle(crX, crY, 1.5);
  g.fill({ color: 0xfde047, alpha: 0.8 });
}

function paintBoardProvinces(g: Graphics, state: GameState, phase: number): void {
  g.clear();
  if (!state?.board?.provinces) return;

  for (const p of state.board.provinces) {
    const b = provinceTokenBounds(p.x, p.y);
    const seen = isProvinceSeen(state, p.id);

    // 1. 3D Tactile Token Drop Shadow
    g.rect(b.x + 2, b.y + 3, b.w, b.h);
    g.fill({ color: 0x000000, alpha: 0.38 });

    if (!seen) {
      // Unseen Province: Blank Parchment / Fog Chip
      // 2. 3D Bottom Bevel Edge (dark parchment bevel)
      g.rect(b.x, b.y + b.h - 4, b.w, 4);
      g.fill({ color: 0x1f1a14 });

      // 3. Token Face (blank aged parchment / fog vellum)
      g.rect(b.x, b.y, b.w, b.h - 2);
      g.fill({ color: 0x2e2720 });

      // Top subtle parchment highlight
      g.moveTo(b.x + 1, b.y + 1);
      g.lineTo(b.x + b.w - 1, b.y + 1);
      g.stroke({ width: 1, color: 0xffffff, alpha: 0.1 });

      // Outer blank parchment chip border
      g.rect(b.x, b.y, b.w, b.h);
      g.stroke({ width: 1, color: 0x4d3f31, alpha: 0.75 });

      const cx = b.cx;
      const cy = b.cy;

      // Subtle fog mists / parchment texture
      const fogWave = Math.sin(phase * 1.5 + p.x * 0.7 + p.y * 0.9) * 2;
      g.moveTo(cx - 16, cy - 4 + fogWave * 0.5);
      g.bezierCurveTo(cx - 8, cy - 7 + fogWave, cx + 6, cy - 1 - fogWave, cx + 16, cy - 5 - fogWave * 0.5);
      g.stroke({ width: 1.4, color: 0x6b5c4c, alpha: 0.35 });

      g.moveTo(cx - 14, cy + 5 - fogWave * 0.5);
      g.bezierCurveTo(cx - 4, cy + 2 - fogWave, cx + 8, cy + 7 + fogWave, cx + 14, cy + 3 + fogWave * 0.5);
      g.stroke({ width: 1.2, color: 0x574738, alpha: 0.3 });

      // Faint cartographer's parchment center compass dot
      g.circle(cx, cy, 1.8);
      g.fill({ color: 0x4a3c2e, alpha: 0.45 });

      continue;
    }

    const pal = terrainChipPalette(p.terrain);

    // 2. 3D Bottom Bevel Edge
    g.rect(b.x, b.y + b.h - 4, b.w, 4);
    g.fill({ color: pal.fillDark });

    // 3. Token Face
    g.rect(b.x, b.y, b.w, b.h - 2);
    g.fill({ color: pal.fill });

    // Top subtle highlight
    g.moveTo(b.x + 1, b.y + 1);
    g.lineTo(b.x + b.w - 1, b.y + 1);
    g.stroke({ width: 1, color: 0xffffff, alpha: 0.16 });

    // Outer chip border
    g.rect(b.x, b.y, b.w, b.h);
    g.stroke({ width: 1, color: pal.border, alpha: 0.8 });

    const cx = b.cx;
    const cy = b.cy;

    // 4. Terrain Chip Details (Stronger, reads at a glance from 0.58 zoom)
    switch (p.terrain) {
      case "plain": {
        // Plain stays meadow: lush pastoral meadow with rolling knolls, clover/grass tufts, and wildflower daisy clusters
        // Meadow grass knoll bands
        g.moveTo(b.x + 3, cy + 3);
        g.bezierCurveTo(cx - 10, cy - 2, cx + 8, cy + 6, b.x + b.w - 3, cy + 1);
        g.stroke({ width: 1.6, color: 0x4d7c0f, alpha: 0.85 });

        g.moveTo(b.x + 4, cy + 10);
        g.bezierCurveTo(cx - 6, cy + 6, cx + 12, cy + 13, b.x + b.w - 4, cy + 9);
        g.stroke({ width: 1.4, color: 0x3f6212, alpha: 0.75 });

        // Clustered grass tufts across the meadow
        for (const [gx, gy] of [
          [cx - 16, cy - 4],
          [cx - 7, cy + 5],
          [cx + 12, cy - 2],
          [cx + 18, cy + 8],
          [cx - 14, cy + 11],
        ]) {
          g.moveTo(gx, gy + 4); g.lineTo(gx - 2.5, gy - 3);
          g.moveTo(gx, gy + 4); g.lineTo(gx, gy - 4.5);
          g.moveTo(gx, gy + 4); g.lineTo(gx + 2.5, gy - 3);
          g.stroke({ width: 1.2, color: 0x84cc16, alpha: 0.9 });
        }

        // Wildflower blossoms (daisies, buttercups, cornflowers)
        for (const [fx, fy, col] of [
          [cx - 11, cy - 6, 0xffffff],
          [cx - 3, cy + 2, 0xfacc15],
          [cx + 6, cy - 5, 0x60a5fa],
          [cx + 15, cy + 4, 0xffffff],
          [cx + 8, cy + 10, 0xfacc15],
          [cx - 8, cy + 12, 0xffffff],
        ]) {
          g.circle(fx, fy, 1.6);
          g.fill({ color: col, alpha: 0.95 });
          g.circle(fx, fy, 0.7);
          g.fill({ color: 0xeab308, alpha: 0.9 });
        }
        break;
      }

      case "wood": {
        // Wood is a stand of trees: dense, multi-tiered forest grove spanning the chip
        // Deep forest floor mulch
        g.rect(b.x + 3, cy + 5, b.w - 6, 12);
        g.fill({ color: 0x052e16, alpha: 0.7 });

        // Stand of 6 layered evergreen pines (background to foreground)
        const trees = [
          // Background tier (dark spruce)
          { tx: cx - 18, ty: cy + 4, scale: 0.8, dark: true },
          { tx: cx + 18, ty: cy + 3, scale: 0.85, dark: true },
          { tx: cx - 2, ty: cy - 2, scale: 0.9, dark: true },
          // Mid tier
          { tx: cx - 10, ty: cy + 7, scale: 1.0, dark: false },
          { tx: cx + 10, ty: cy + 6, scale: 1.05, dark: false },
          // Foreground monarch
          { tx: cx - 1, ty: cy + 11, scale: 1.25, dark: false },
        ];

        for (const tr of trees) {
          const s = tr.scale;
          const x = tr.tx;
          const y = tr.ty;
          const trunkColor = 0x451a03;
          const leafDark = tr.dark ? 0x064e3b : 0x14532d;
          const leafMid = tr.dark ? 0x047857 : 0x16a34a;
          const leafLight = tr.dark ? 0x10b981 : 0x22c55e;

          // Tree trunk
          g.rect(x - 1.2 * s, y - 2 * s, 2.4 * s, 6 * s);
          g.fill({ color: trunkColor });

          // Tier 1 (bottom bough)
          g.poly([x - 7 * s, y, x, y - 6 * s, x + 7 * s, y]);
          g.fill({ color: leafDark });
          // Highlight edge on west bough
          g.moveTo(x - 7 * s, y); g.lineTo(x, y - 6 * s);
          g.stroke({ width: 1, color: leafLight, alpha: 0.8 });

          // Tier 2 (mid bough)
          g.poly([x - 5.5 * s, y - 4 * s, x, y - 10 * s, x + 5.5 * s, y - 4 * s]);
          g.fill({ color: leafMid });
          g.moveTo(x - 5.5 * s, y - 4 * s); g.lineTo(x, y - 10 * s);
          g.stroke({ width: 1, color: leafLight, alpha: 0.85 });

          // Tier 3 (treetop spire)
          g.poly([x - 4 * s, y - 8 * s, x, y - 14 * s, x + 4 * s, y - 8 * s]);
          g.fill({ color: leafLight });
        }
        break;
      }

      case "hill": {
        // Hill has contours: rich topographic highland contour ridges with light/shadow facets and rounded knolls
        // Shaded elevation terraces
        g.poly([b.x + 3, cy + 15, cx - 14, cy + 2, cx + 4, cy + 8, b.x + b.w - 3, cy + 4, b.x + b.w - 3, b.y + b.h - 3, b.x + 3, b.y + b.h - 3]);
        g.fill({ color: 0x292524, alpha: 0.6 });

        // Base hill mounds (smooth rounded elevation masses)
        g.ellipse(cx - 12, cy + 5, 14, 9);
        g.fill({ color: 0x57534e });
        g.ellipse(cx + 10, cy + 2, 16, 11);
        g.fill({ color: 0x44403c });
        g.ellipse(cx - 2, cy + 8, 18, 9);
        g.fill({ color: 0x57534e });

        // Highlighted topographic contour lines (3 bold stepped contour bands)
        // Upper contour ridge
        g.moveTo(b.x + 6, cy - 1);
        g.bezierCurveTo(cx - 12, cy - 9, cx + 6, cy - 8, b.x + b.w - 6, cy - 2);
        g.stroke({ width: 1.8, color: 0xa8a29e, alpha: 0.95 });

        // Mid contour ridge (terrace edge)
        g.moveTo(b.x + 4, cy + 5);
        g.bezierCurveTo(cx - 14, cy - 1, cx - 2, cy + 1, cx + 14, cy - 2);
        g.lineTo(b.x + b.w - 4, cy + 5);
        g.stroke({ width: 2.0, color: 0xd6d3d1, alpha: 0.95 });

        // Lower contour ridge
        g.moveTo(b.x + 5, cy + 12);
        g.bezierCurveTo(cx - 10, cy + 7, cx + 4, cy + 8, b.x + b.w - 5, cy + 11);
        g.stroke({ width: 1.8, color: 0xa8a29e, alpha: 0.9 });

        // Exposed granite rocky bluffs / stone outcroppings
        g.rect(cx - 9, cy - 3, 4.5, 2.5); g.fill({ color: 0x78716c });
        g.rect(cx + 8, cy - 4, 5, 3); g.fill({ color: 0x78716c });
        g.rect(cx - 2, cy + 4, 4, 2); g.fill({ color: 0x78716c });
        break;
      }

      case "waste": {
        // Waste glows: scorched basalt caldera with radiant glowing lava fissures and animated heat pulse
        const pulse = Math.sin(phase * 3 + p.x + p.y) * 0.2 + 0.8;

        // Dark volcanic basalt crust plates
        g.poly([b.x + 4, b.y + 4, cx - 6, b.y + 4, cx - 12, cy + 2, b.x + 4, cy - 1]);
        g.fill({ color: 0x1c130f });
        g.poly([cx + 2, b.y + 4, b.x + b.w - 4, b.y + 4, b.x + b.w - 4, cy - 3, cx + 8, cy + 1]);
        g.fill({ color: 0x18100c });
        g.poly([b.x + 4, cy + 4, cx - 4, cy + 6, cx - 8, b.y + b.h - 5, b.x + 4, b.y + b.h - 5]);
        g.fill({ color: 0x1c130f });
        g.poly([cx + 6, cy + 4, b.x + b.w - 4, cy + 2, b.x + b.w - 4, b.y + b.h - 5, cx + 4, b.y + b.h - 5]);
        g.fill({ color: 0x18100c });

        // Radiating volcanic fissures — Layer 1: Wide Deep Crimson Glow
        const drawFissures = (w: number, col: number, a: number) => {
          // Main diagonal fault line
          g.moveTo(b.x + 4, cy - 5);
          g.lineTo(cx - 8, cy - 1);
          g.lineTo(cx - 1, cy + 3);
          g.lineTo(cx + 10, cy - 1);
          g.lineTo(b.x + b.w - 4, cy + 6);
          g.stroke({ width: w, color: col, alpha: a });

          // North-south rift
          g.moveTo(cx - 3, b.y + 3);
          g.lineTo(cx - 1, cy + 3);
          g.lineTo(cx + 4, cy + 10);
          g.lineTo(cx + 2, b.y + b.h - 4);
          g.stroke({ width: w * 0.8, color: col, alpha: a });

          // Branch fissure southwest
          g.moveTo(cx - 8, cy - 1);
          g.lineTo(cx - 14, cy + 8);
          g.stroke({ width: w * 0.7, color: col, alpha: a });
        };

        // 1. Broad outer crimson magma aura
        drawFissures(4.5, 0x991b1b, 0.75 * pulse);
        // 2. Vivid orange burning lava channel
        drawFissures(2.6, 0xf97316, 0.95);
        // 3. Incandescent white-hot / golden-yellow heat core
        drawFissures(1.2, 0xfef08a, 0.95 * pulse);

        // Central bubbling caldera vent
        g.circle(cx - 1, cy + 3, 3.5);
        g.fill({ color: 0xef4444, alpha: 0.9 });
        g.circle(cx - 1, cy + 3, 2.0);
        g.fill({ color: 0xfef08a, alpha: pulse });

        // Floating ember motes
        g.circle(cx - 7, cy - 6, 1.2); g.fill({ color: 0xfb923c, alpha: 0.9 });
        g.circle(cx + 12, cy + 4, 1.0); g.fill({ color: 0xfde047, alpha: 0.85 });
        break;
      }

      case "shore": {
        // Shore has water+foam: deep ocean waters, azure shallows, golden sandy beach, curling surf rollers, and frothing white sea foam
        // 1. Deep ocean backdrop (top half)
        g.rect(b.x + 2, b.y + 2, b.w - 4, 18);
        g.fill({ color: 0x0284c7 });

        // 2. Coastal shelf / turquoise shallows
        g.rect(b.x + 2, b.y + 16, b.w - 4, 8);
        g.fill({ color: 0x38bdf8 });

        // 3. Golden sand beach (bottom third)
        g.poly([
          b.x + 2, cy + 3,
          cx - 10, cy + 5,
          cx + 8, cy + 2,
          b.x + b.w - 2, cy + 4,
          b.x + b.w - 2, b.y + b.h - 3,
          b.x + 2, b.y + b.h - 3,
        ]);
        g.fill({ color: 0xd4a359 });

        // Wet sand tideline
        g.moveTo(b.x + 2, cy + 3);
        g.bezierCurveTo(cx - 10, cy + 6, cx + 8, cy + 3, b.x + b.w - 2, cy + 5);
        g.stroke({ width: 1.5, color: 0xa16207, alpha: 0.6 });

        // 4. Curling wave rollers in deep water
        const waveShift = Math.sin(phase * 2.5 + p.x) * 1.5;
        g.moveTo(b.x + 4, cy - 10 + waveShift);
        g.bezierCurveTo(cx - 12, cy - 13 + waveShift, cx - 2, cy - 7 + waveShift, cx + 10, cy - 11 + waveShift);
        g.stroke({ width: 1.6, color: 0xbae6fd, alpha: 0.8 });

        g.moveTo(cx - 14, cy - 4 - waveShift * 0.7);
        g.bezierCurveTo(cx - 2, cy - 8 - waveShift * 0.7, cx + 10, cy - 2 - waveShift * 0.7, b.x + b.w - 4, cy - 6 - waveShift * 0.7);
        g.stroke({ width: 1.8, color: 0x7dd3fc, alpha: 0.85 });

        // 5. Heavy frothing sea foam / crashing surf line on the beach
        // Primary breaking surf foam crest
        g.moveTo(b.x + 2, cy + 2);
        g.bezierCurveTo(cx - 12, cy - 1, cx + 6, cy + 4, b.x + b.w - 2, cy + 1);
        g.stroke({ width: 2.5, color: 0xffffff, alpha: 0.95 });

        // Secondary foam lace / bubbling surf fringe
        for (let fx = b.x + 6; fx <= b.x + b.w - 6; fx += 7) {
          const fy = cy + 2 + Math.sin(fx * 0.8 + phase * 2) * 1.5;
          g.circle(fx, fy + 2, 1.4);
          g.fill({ color: 0xf0fdfa, alpha: 0.95 });
        }
        break;
      }

      case "peak": {
        // Peak is a real ridge: continuous grand mountain massif with illuminated and shadowed facets, sharp arêtes, and snowcaps
        const ridgeBaseY = cy + 13;

        // Shadowed eastern mountain slopes (dark basalt shadow)
        g.poly([
          cx - 2, cy - 13,
          cx + 12, cy - 1,
          cx + 15, cy - 8,
          b.x + b.w - 4, cy + 7,
          b.x + b.w - 4, ridgeBaseY,
          cx - 2, ridgeBaseY,
        ]);
        g.fill({ color: 0x1e293b });

        // Illuminated western mountain slopes (bright alpine granite)
        g.poly([
          b.x + 4, ridgeBaseY,
          b.x + 4, cy + 8,
          cx - 16, cy - 6,
          cx - 9, cy + 1,
          cx - 2, cy - 13,
          cx - 2, ridgeBaseY,
        ]);
        g.fill({ color: 0x475569 });

        // Secondary sunlit peak facets
        g.poly([
          cx - 16, cy - 6,
          cx - 9, cy + 1,
          cx - 9, ridgeBaseY,
          cx - 16, ridgeBaseY,
        ]);
        g.fill({ color: 0x64748b });

        // Sharp central dividing arête ridge line
        g.moveTo(cx - 2, cy - 13);
        g.lineTo(cx - 1, ridgeBaseY);
        g.stroke({ width: 1.4, color: 0x334155 });

        // Pure white snowcaps and hanging glaciers
        // Monarch center summit snowcap
        g.poly([
          cx - 6, cy - 6,
          cx - 2, cy - 13,
          cx + 3, cy - 6,
          cx, cy - 4,
        ]);
        g.fill({ color: 0xffffff });

        // Western horn snowcap
        g.poly([
          cx - 19, cy - 2,
          cx - 16, cy - 6,
          cx - 12, cy - 2,
          cx - 15, cy,
        ]);
        g.fill({ color: 0xf8fafc });

        // Eastern horn snowcap
        g.poly([
          cx + 11, cy - 4,
          cx + 15, cy - 8,
          cx + 19, cy - 3,
          cx + 15, cy - 2,
        ]);
        g.fill({ color: 0xf8fafc });

        // High glacial ice tongue (cirque)
        g.poly([
          cx - 5, cy - 3,
          cx - 2, cy - 1,
          cx + 2, cy - 3,
          cx, cy + 2,
        ]);
        g.fill({ color: 0xbae6fd });

        // Scree / rock teeth at base of ridge
        for (let rx = b.x + 8; rx < b.x + b.w - 8; rx += 8) {
          g.poly([rx - 2, ridgeBaseY, rx, ridgeBaseY - 3, rx + 2, ridgeBaseY]);
          g.fill({ color: 0x334155 });
        }
        break;
      }
    }

    // 5. Node Marks (Hold, Camp, Woodcut, Quarry, Field)
    switch (p.node) {
      case "hold": {
        // Fortress keep silhouette
        g.rect(cx - 7, cy - 4, 14, 11);
        g.fill({ color: 0x94a3b8 });
        // 3 merlon crenellations
        g.rect(cx - 7, cy - 7, 3.5, 3); g.fill({ color: 0x64748b });
        g.rect(cx - 1.7, cy - 7, 3.4, 3); g.fill({ color: 0x64748b });
        g.rect(cx + 3.5, cy - 7, 3.5, 3); g.fill({ color: 0x64748b });
        // Arched portcullis gate
        g.rect(cx - 2.5, cy + 1, 5, 6);
        g.fill({ color: 0x0f172a });
        // Pennant flag on roof
        g.moveTo(cx, cy - 7); g.lineTo(cx, cy - 13);
        g.stroke({ width: 1, color: 0x78350f });
        g.poly([cx, cy - 13, cx + 5, cy - 11, cx, cy - 9]);
        g.fill({ color: 0xdc2626 });
        break;
      }
      case "camp": {
        // Striped war pavilion / tent
        g.poly([cx - 8, cy + 8, cx, cy - 5, cx + 8, cy + 8]);
        g.fill({ color: 0xb91c1c });
        g.poly([cx - 2.5, cy + 8, cx, cy - 1, cx + 2.5, cy + 8]);
        g.fill({ color: 0xfde047 });
        // Crossed spears behind tent
        g.moveTo(cx - 9, cy - 3); g.lineTo(cx + 9, cy + 7);
        g.moveTo(cx + 9, cy - 3); g.lineTo(cx - 9, cy + 7);
        g.stroke({ width: 1, color: 0x78350f, alpha: 0.8 });
        break;
      }
      case "woodcut": {
        // Stacked timber cord + crossed felling axes
        g.rect(cx - 8, cy + 3, 16, 4.5);
        g.fill({ color: 0x78350f });
        g.moveTo(cx - 8, cy + 5); g.lineTo(cx + 8, cy + 5);
        g.stroke({ width: 0.8, color: 0x3f1d0b });
        // Crossed steel axes
        g.moveTo(cx - 6, cy + 2); g.lineTo(cx + 6, cy - 8);
        g.moveTo(cx + 6, cy + 2); g.lineTo(cx - 6, cy - 8);
        g.stroke({ width: 1.2, color: 0x854d0e });
        g.rect(cx + 4, cy - 9, 3, 2.5); g.fill({ color: 0xd1d5db });
        g.rect(cx - 7, cy - 9, 3, 2.5); g.fill({ color: 0xd1d5db });
        break;
      }
      case "quarry": {
        // Cut ashlar stone block + pickaxe
        g.rect(cx - 7, cy - 1, 10, 8);
        g.fill({ color: 0xa1a1aa });
        g.rect(cx - 7, cy + 3, 10, 4);
        g.fill({ color: 0x71717a });
        // Steel pickaxe
        g.moveTo(cx + 6, cy + 6); g.lineTo(cx - 2, cy - 7);
        g.stroke({ width: 1.2, color: 0x78350f });
        g.poly([cx - 5, cy - 7, cx - 1, cy - 8, cx + 2, cy - 5]);
        g.stroke({ width: 1.5, color: 0x94a3b8 });
        break;
      }
      case "field": {
        // Bundled golden sheaf of wheat
        g.poly([cx - 5, cy + 8, cx - 7, cy - 3, cx + 7, cy - 3, cx + 5, cy + 8]);
        g.fill({ color: 0xca8a04 });
        g.rect(cx - 6, cy + 1, 12, 2.5);
        g.fill({ color: 0xdc2626 });
        // Wheat ears
        g.circle(cx - 4, cy - 5, 1.8); g.fill({ color: 0xfef08a });
        g.circle(cx, cy - 6, 2); g.fill({ color: 0xfde047 });
        g.circle(cx + 4, cy - 5, 1.8); g.fill({ color: 0xfef08a });
        break;
      }
    }

    // 6. Special Realm Occupant Token Overlays
    if (p.occupantRealmId === "player") {
      const isHome = p.id === state.board.homeProvinceId;
      const cult = culturePalette(sim.playerCultureId ? sim.playerCultureId(state) : undefined);
      const playerTabardCol = cult.id === "western" ? 0x1e40af : cult.tabard;
      const playerHomePlaque = cult.id === "western" ? 0x7f1d1d : cult.tabard;

      if (isHome) {
        // Player Home Hold: Gilded Royal Frame with corner studs & crown
        g.rect(b.x, b.y, b.w, b.h);
        g.stroke({ width: 2, color: 0xfacc15 });

        // Inner golden border highlight
        g.rect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
        g.stroke({ width: 1, color: 0xfef08a, alpha: 0.6 });

        // 4 Corner Golden Studs
        g.circle(b.x + 3.5, b.y + 3.5, 1.6); g.fill({ color: 0xfde047 });
        g.circle(b.x + b.w - 3.5, b.y + 3.5, 1.6); g.fill({ color: 0xfde047 });
        g.circle(b.x + 3.5, b.y + b.h - 3.5, 1.6); g.fill({ color: 0xfde047 });
        g.circle(b.x + b.w - 3.5, b.y + b.h - 3.5, 1.6); g.fill({ color: 0xfde047 });

        // Crown emblem above keep
        g.poly([
          cx - 6, cy - 9,
          cx - 4, cy - 13,
          cx, cy - 10,
          cx + 4, cy - 13,
          cx + 6, cy - 9,
        ]);
        g.fill({ color: 0xfacc15 });

        // Bottom banner: royal plaque (tinted by culture tabard)
        g.rect(b.x + 7, b.y + b.h - 10, b.w - 14, 7);
        g.fill({ color: playerHomePlaque });
        g.stroke({ width: 1, color: 0xfacc15 });

        // Animated golden halo pulse
        const haloAlpha = 0.35 + Math.sin(phase * 4) * 0.2;
        g.rect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
        g.stroke({ width: 1.5, color: 0xfde047, alpha: haloAlpha });
      } else {
        // Player Outpost / Flag Token on Player-Occupied Field Tiles & Nodes
        // Outer royal blue & brass border trim
        g.rect(b.x, b.y, b.w, b.h);
        g.stroke({ width: 1.8, color: 0x2563eb });

        g.rect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);
        g.stroke({ width: 0.8, color: 0xfacc15, alpha: 0.75 });

        // 4 Corner Brass Pins
        g.circle(b.x + 3, b.y + 3, 1.2); g.fill({ color: 0xfde047 });
        g.circle(b.x + b.w - 3, b.y + 3, 1.2); g.fill({ color: 0xfde047 });
        g.circle(b.x + 3, b.y + b.h - 3, 1.2); g.fill({ color: 0xfde047 });
        g.circle(b.x + b.w - 3, b.y + b.h - 3, 1.2); g.fill({ color: 0xfde047 });

        // Stone cairn anchor base
        g.poly([cx - 4, cy + 5, cx + 4, cy + 5, cx + 2, cy + 2, cx - 2, cy + 2]);
        g.fill({ color: 0x64748b });

        // Tall wooden flagpole
        g.moveTo(cx, cy + 3); g.lineTo(cx, cy - 14);
        g.stroke({ width: 1.4, color: 0x78350f });
        // Brass ball finial
        g.circle(cx, cy - 14.5, 1.4); g.fill({ color: 0xfacc15 });

        // Waving royal player swallowtail standard
        const flagWave = Math.sin(phase * 4 + p.x * 2) * 2.2;
        g.poly([
          cx, cy - 14,
          cx + 10 + flagWave, cy - 10,
          cx + 7 + flagWave * 0.7, cy - 7,
          cx + 10 + flagWave, cy - 4,
          cx, cy - 4,
        ]);
        g.fill({ color: playerTabardCol });

        // Golden heraldic insignia on the flag
        g.poly([
          cx + 2, cy - 11,
          cx + 6 + flagWave * 0.5, cy - 9,
          cx + 2, cy - 7,
        ]);
        g.fill({ color: 0xfacc15 });

        // Field bivouac supply cache / shelter tent
        g.poly([cx - 9, cy + 7, cx - 3, cy + 1, cx + 1, cy + 7]);
        g.fill({ color: 0xb45309 });
        g.poly([cx - 7, cy + 7, cx - 3, cy + 2.5, cx, cy + 7]);
        g.fill({ color: 0xd4a359 });

        // Bottom Outpost plaque
        g.rect(b.x + 9, b.y + b.h - 9, b.w - 18, 6);
        g.fill({ color: playerHomePlaque });
        g.stroke({ width: 0.8, color: 0xfacc15 });
        g.circle(cx, b.y + b.h - 6, 1.1); g.fill({ color: 0xfde047 });
      }
    } else if (p.occupantRealmId) {
      const pal = realmTokenPalette(p.occupantRealmId);
      if (p.node === "hold") {
        // Distinct NPC Hold Token for every NPC realm
        g.rect(b.x, b.y, b.w, b.h);
        g.stroke({ width: 2, color: pal.borderColor });

        g.rect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);
        g.stroke({ width: 0.8, color: pal.rimColor, alpha: 0.8 });

        // 4 Corner Rivets / Studs
        g.circle(b.x + 3.5, b.y + 3.5, 1.5); g.fill({ color: pal.studColor });
        g.circle(b.x + b.w - 3.5, b.y + 3.5, 1.5); g.fill({ color: pal.studColor });
        g.circle(b.x + 3.5, b.y + b.h - 3.5, 1.5); g.fill({ color: pal.studColor });
        g.circle(b.x + b.w - 3.5, b.y + b.h - 3.5, 1.5); g.fill({ color: pal.studColor });

        if (p.occupantRealmId === "rival") {
          // Iron March spiked keep battlements
          g.poly([cx - 6, cy - 7, cx - 4, cy - 12, cx - 2, cy - 7]);
          g.fill({ color: pal.battlementColor });
          g.poly([cx + 2, cy - 7, cx + 4, cy - 12, cx + 6, cy - 7]);
          g.fill({ color: pal.battlementColor });
        } else {
          // Distinct fortified keep tower silhouette with twin bartizans
          g.poly([cx - 8, cy - 6, cx - 8, cy - 12, cx - 5, cy - 12, cx - 5, cy - 6]);
          g.fill({ color: pal.battlementColor });
          g.poly([cx + 5, cy - 6, cx + 5, cy - 12, cx + 8, cy - 12, cx + 8, cy - 6]);
          g.fill({ color: pal.battlementColor });
          g.rect(cx - 5, cy - 9, 10, 3);
          g.fill({ color: pal.keepWallColor });
        }

        // Animated waving realm heraldic pennant
        const npcWave = Math.sin(phase * 4 + p.x * 2 + p.y) * 2;
        g.moveTo(cx, cy - 7); g.lineTo(cx, cy - 14);
        g.stroke({ width: 1.2, color: pal.rimColor });
        g.circle(cx, cy - 14.5, 1.2); g.fill({ color: pal.accentColor });
        g.poly([
          cx, cy - 14,
          cx + 8 + npcWave, cy - 11,
          cx + 5 + npcWave * 0.6, cy - 9,
          cx + 8 + npcWave, cy - 7,
          cx, cy - 7,
        ]);
        g.fill({ color: pal.pennantColor });

        // Bottom banner: realm plaque
        g.rect(b.x + 7, b.y + b.h - 10, b.w - 14, 7);
        g.fill({ color: pal.plaqueColor });
        g.stroke({ width: 1, color: pal.plaqueBorder });
        // Center heraldic seal dot
        g.circle(cx, b.y + b.h - 6.5, 1.4);
        g.fill({ color: pal.accentColor });
      } else {
        // NPC Outpost / Territory Marker on claimed province
        g.rect(b.x, b.y, b.w, b.h);
        g.stroke({ width: 1.5, color: pal.borderColor, alpha: 0.85 });

        // 4 Corner Pins
        g.circle(b.x + 3, b.y + 3, 1.1); g.fill({ color: pal.studColor });
        g.circle(b.x + b.w - 3, b.y + 3, 1.1); g.fill({ color: pal.studColor });
        g.circle(b.x + 3, b.y + b.h - 3, 1.1); g.fill({ color: pal.studColor });
        g.circle(b.x + b.w - 3, b.y + b.h - 3, 1.1); g.fill({ color: pal.studColor });

        // Marker flagpole with realm swallowtail flag
        const npcFlagWave = Math.sin(phase * 3.5 + p.x) * 2;
        g.moveTo(cx, cy + 3); g.lineTo(cx, cy - 13);
        g.stroke({ width: 1.2, color: pal.rimColor });
        g.poly([
          cx, cy - 13,
          cx + 9 + npcFlagWave, cy - 9.5,
          cx + 6 + npcFlagWave * 0.7, cy - 7,
          cx, cy - 7,
        ]);
        g.fill({ color: pal.pennantColor });

        // Bottom claim plaque
        g.rect(b.x + 10, b.y + b.h - 8, b.w - 20, 5.5);
        g.fill({ color: pal.plaqueColor });
        g.stroke({ width: 0.8, color: pal.plaqueBorder, alpha: 0.9 });
      }
    }
  }
}

function paintBoardMarches(
  routeG: Graphics,
  pawnsG: Graphics,
  state: GameState | null,
  phase: number
): void {
  routeG.clear();
  pawnsG.clear();
  if (!state?.board) return;

  const marches = listMarches(state);
  for (const m of marches) {
    const fromProv = getProvince(state, m.fromId);
    const toProv = getProvince(state, m.toId);
    if (!fromProv || !toProv) continue;

    const fromB = provinceTokenBounds(fromProv.x, fromProv.y);
    const toB = provinceTokenBounds(toProv.x, toProv.y);
    const isPlayer = m.realmId === "player";

    // 1. Dotted Route Trail between origin and destination
    const dx = toB.cx - fromB.cx;
    const dy = toB.cy - fromB.cy;
    const distPx = Math.hypot(dx, dy);
    const steps = Math.max(4, Math.floor(distPx / 14));

    const trailColor = isPlayer ? 0xf59e0b : 0xef4444;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lx = fromB.cx + dx * t;
      const ly = fromB.cy + dy * t;
      const pulse = Math.sin(phase * 4 + i * 0.4) * 0.2 + 0.8;
      routeG.circle(lx, ly, i % 2 === 0 ? 2 : 1.3);
      routeG.fill({ color: trailColor, alpha: 0.7 * pulse });
    }

    // Destination target indicator
    routeG.circle(toB.cx, toB.cy, 10);
    routeG.stroke({ width: 1.5, color: trailColor, alpha: 0.85 });
    routeG.moveTo(toB.cx - 13, toB.cy); routeG.lineTo(toB.cx + 13, toB.cy);
    routeG.moveTo(toB.cx, toB.cy - 13); routeG.lineTo(toB.cx, toB.cy + 13);
    routeG.stroke({ width: 1, color: trailColor, alpha: 0.65 });

    // 2. March Progress Calculation
    const dist = Math.max(1, Math.abs(toProv.x - fromProv.x) + Math.abs(toProv.y - fromProv.y));
    const progress = calculateMarchProgress(state.meta.tick, m.arrivesTick, dist);
    const pawnX = fromB.cx + dx * progress;
    const pawnY = fromB.cy + dy * progress;

    // 3. Marching Pawn / Meeple Presentation
    const facing = dx >= 0 ? 1 : -1;
    const stepIdx = Math.floor((phase * 6) % 4);
    const frame: 0 | 1 | 2 = stepIdx === 1 ? 1 : stepIdx === 3 ? 2 : 0;
    const bob = frame === 0 ? 0 : 2;

    // Base contact shadow
    pawnsG.ellipse(pawnX, pawnY + 6, 8, 3.5);
    pawnsG.fill({ color: 0x000000, alpha: 0.45 });

    if (isPlayer) {
      // Player: Meeple styled in the matching unit type pixel language (archer, knight, cavalry, siege, spearman, etc.)
      const unitType = primaryUnitTypeForMarch(m);
      const cultId = state && sim.playerCultureId ? sim.playerCultureId(state) : undefined;
      const kit = resolveCultureKit(cultId);
      const cult = culturePalette(cultId);
      const pal = unitPalette(unitType, cultId);

      // Wooden pawn pedestal base
      pawnsG.rect(pawnX - 6.5, pawnY + 2 - bob, 13, 4);
      pawnsG.fill({ color: 0x854d0e });
      pawnsG.stroke({ width: 0.8, color: 0x543007 });

      if (pal.isChassis) {
        // Siege Engine: wheeled chassis, upright A-frame, throwing beam
        pawnsG.circle(pawnX - 5.5, pawnY + 2 - bob, 3);
        pawnsG.fill({ color: 0x451a03 });
        pawnsG.stroke({ width: 0.8, color: 0x27272a });
        pawnsG.circle(pawnX + 5.5, pawnY + 2 - bob, 3);
        pawnsG.fill({ color: 0x451a03 });
        pawnsG.stroke({ width: 0.8, color: 0x27272a });

        pawnsG.rect(pawnX - 7.5, pawnY - 3 - bob, 15, 4.5);
        pawnsG.fill({ color: 0x5c3818 });
        pawnsG.stroke({ width: 0.7, color: 0x27272a });

        pawnsG.poly([pawnX - 3.5, pawnY - 3 - bob, pawnX, pawnY - 13 - bob, pawnX + 3.5, pawnY - 3 - bob]);
        pawnsG.stroke({ width: 1.5, color: 0x78350f });

        const armTilt = frame === 1 ? -2 : frame === 2 ? 2 : 0;
        pawnsG.moveTo(pawnX - facing * 7, pawnY - 5 - bob - armTilt);
        pawnsG.lineTo(pawnX + facing * 8, pawnY - 17 - bob + armTilt);
        pawnsG.stroke({ width: 1.8, color: 0x451a03 });

        pawnsG.rect(pawnX - facing * 8.5, pawnY - 7 - bob - armTilt, 3.5, 3.5);
        pawnsG.fill({ color: 0x27272a });
        pawnsG.circle(pawnX + facing * 8, pawnY - 17 - bob + armTilt, 2.2);
        pawnsG.fill({ color: 0x94a3b8 });
      } else if (pal.hasMount) {
        // Cavalry: Warhorse with animated legs + mounted armored lancer
        const hLeg1 = frame === 1 ? 1 : frame === 2 ? -1 : 0;
        const hLeg2 = frame === 1 ? -1 : frame === 2 ? 1 : 0;
        pawnsG.rect(pawnX - 5, pawnY - 1 - bob + hLeg1, 2.2, 4);
        pawnsG.fill({ color: 0x451a03 });
        pawnsG.rect(pawnX + 3.5, pawnY - 1 - bob + hLeg2, 2.2, 4);
        pawnsG.fill({ color: 0x6b3a19 });

        pawnsG.rect(pawnX - 6, pawnY - 5 - bob, 12, 5);
        pawnsG.fill({ color: 0x6b3a19 });

        pawnsG.poly([
          pawnX + facing * 3, pawnY - 5 - bob,
          pawnX + facing * 7, pawnY - 11 - bob,
          pawnX + facing * 9.5, pawnY - 9 - bob,
          pawnX + facing * 5, pawnY - 3 - bob,
        ]);
        pawnsG.fill({ color: 0x6b3a19 });
        pawnsG.rect(pawnX + facing * 6.5, pawnY - 12 - bob, 1.8, 2.5);
        pawnsG.fill({ color: 0x18181b });

        pawnsG.rect(pawnX - 2, pawnY - 6 - bob, 4.5, 2.5);
        pawnsG.fill({ color: 0x451a03 });

        // Rider
        pawnsG.rect(pawnX - 2.5, pawnY - 11 - bob, 5, 5);
        pawnsG.fill({ color: pal.tabardColor });
        pawnsG.circle(pawnX, pawnY - 13 - bob, 2.8);
        pawnsG.fill({ color: pal.armorColor });

        // Lance with pennant
        pawnsG.moveTo(pawnX - facing * 3, pawnY - 8 - bob);
        pawnsG.lineTo(pawnX + facing * 12, pawnY - 15 - bob);
        pawnsG.stroke({ width: 1.3, color: 0x854d0e });
        pawnsG.poly([
          pawnX + facing * 9, pawnY - 15 - bob,
          pawnX + facing * 14, pawnY - 13.5 - bob,
          pawnX + facing * 9, pawnY - 12 - bob,
        ]);
        pawnsG.fill({ color: pal.accentColor });
      } else {
        // Humanoid Walkers: militia, spearman, skirmisher, archer, knight, champion
        const legL = frame === 1 ? -2 : frame === 2 ? 1 : -1;
        const legR = frame === 1 ? 1 : frame === 2 ? -2 : 1;
        pawnsG.rect(pawnX + legL, pawnY - 2 - bob, 2.2, 4);
        pawnsG.fill({ color: pal.armorColor === 0xcbd5e1 ? 0x94a3b8 : 0x27272a });
        pawnsG.rect(pawnX + legR, pawnY - 2 - bob, 2.2, 4);
        pawnsG.fill({ color: 0x18181b });

        // Tapered torso
        pawnsG.poly([
          pawnX - 4, pawnY + 1 - bob,
          pawnX - 3, pawnY - 7 - bob,
          pawnX + 3, pawnY - 7 - bob,
          pawnX + 4, pawnY + 1 - bob,
        ]);
        pawnsG.fill({ color: pal.tabardColor });

        // Belt / accent trim
        pawnsG.rect(pawnX - 3, pawnY - 2 - bob, 6, 1.4);
        pawnsG.fill({ color: pal.accentColor });

        // Head
        pawnsG.circle(pawnX, pawnY - 10 - bob, 3);
        pawnsG.fill({ color: 0xfbcfe8 });

        // Helmet / Headwear
        if (pal.helmKind === "kettle") {
          if (kit === "cedar") {
            // Hunter cowl
            pawnsG.poly([
              pawnX - 4, pawnY - 9 - bob,
              pawnX, pawnY - 14 - bob,
              pawnX + 4, pawnY - 9 - bob,
              pawnX - facing * 3.5, pawnY - 15 - bob,
            ]);
            pawnsG.fill({ color: cult.tabard });
          } else if (kit === "sand") {
            // Desert turban with draped havelock veil
            pawnsG.circle(pawnX, pawnY - 12 - bob, 3.4);
            pawnsG.fill({ color: 0xfafaf9 });
            pawnsG.rect(pawnX - facing * 3.5, pawnY - 11 - bob, 2.2, 5);
            pawnsG.fill({ color: cult.accent });
          } else if (kit === "steppe") {
            // Conical spangenhelm with horsehair crest
            pawnsG.poly([pawnX - 3.5, pawnY - 11 - bob, pawnX, pawnY - 15 - bob, pawnX + 3.5, pawnY - 11 - bob]);
            pawnsG.fill({ color: cult.stone });
            pawnsG.moveTo(pawnX, pawnY - 15 - bob); pawnsG.lineTo(pawnX - facing * 3, pawnY - 17 - bob);
            pawnsG.stroke({ width: 1.2, color: 0x9f1239 });
          } else if (kit === "islands") {
            // Woven reed war cap
            pawnsG.poly([pawnX - 4.5, pawnY - 11 - bob, pawnX, pawnY - 14 - bob, pawnX + 4.5, pawnY - 11 - bob]);
            pawnsG.fill({ color: 0xd4a359 });
            pawnsG.rect(pawnX - 3.5, pawnY - 11 - bob, 7, 1.2);
            pawnsG.fill({ color: 0x0e7490 });
          } else {
            pawnsG.rect(pawnX - 4, pawnY - 12 - bob, 8, 2);
            pawnsG.fill({ color: 0x94a3b8 });
            pawnsG.circle(pawnX, pawnY - 12.5 - bob, 2.4);
            pawnsG.fill({ color: 0xcbd5e1 });
          }
        } else if (pal.helmKind === "cap") {
          pawnsG.rect(pawnX - 3, pawnY - 12 - bob, 6, 2.5);
          pawnsG.fill({ color: pal.tabardColor });
          pawnsG.poly([
            pawnX - facing * 1.5, pawnY - 12 - bob,
            pawnX - facing * 5, pawnY - 15 - bob,
            pawnX - facing * 1.5, pawnY - 13 - bob,
          ]);
          pawnsG.fill({ color: pal.accentColor });
        } else if (pal.helmKind === "plate") {
          pawnsG.rect(pawnX - 3.5, pawnY - 13 - bob, 7, 5.5);
          pawnsG.fill({ color: 0xcbd5e1 });
          pawnsG.rect(pawnX - 2, pawnY - 11 - bob, 4, 1.2);
          pawnsG.fill({ color: 0x0f172a });
          pawnsG.poly([pawnX - 1, pawnY - 13 - bob, pawnX, pawnY - 16 - bob, pawnX + 1, pawnY - 13 - bob]);
          pawnsG.fill({ color: 0xdc2626 });
        } else if (pal.helmKind === "crown") {
          pawnsG.rect(pawnX - 3.5, pawnY - 13 - bob, 7, 4.5);
          pawnsG.fill({ color: 0xf59e0b });
          pawnsG.poly([
            pawnX - 3, pawnY - 13 - bob,
            pawnX - 1.5, pawnY - 16 - bob,
            pawnX, pawnY - 13.5 - bob,
            pawnX + 1.5, pawnY - 16 - bob,
            pawnX + 3, pawnY - 13 - bob,
          ]);
          pawnsG.fill({ color: 0xfde047 });
        } else {
          // Militia peasant coif
          if (kit === "cedar") {
            pawnsG.rect(pawnX - 3, pawnY - 12 - bob, 6, 2.5);
            pawnsG.fill({ color: 0x854d0e });
          } else if (kit === "sand") {
            pawnsG.circle(pawnX, pawnY - 12 - bob, 2.8);
            pawnsG.fill({ color: 0xd6c7a1 });
          } else if (kit === "steppe") {
            pawnsG.rect(pawnX - 3, pawnY - 12 - bob, 6, 2.5);
            pawnsG.fill({ color: 0x7c2d12 });
          } else if (kit === "islands") {
            pawnsG.rect(pawnX - 4, pawnY - 12 - bob, 8, 2);
            pawnsG.fill({ color: 0xd4a359 });
          } else {
            pawnsG.rect(pawnX - 2.5, pawnY - 12 - bob, 5, 2.5);
            pawnsG.fill({ color: 0x52525b });
          }
        }

        // Arm motion & weapons
        const armSwing = frame === 1 ? -1 : frame === 2 ? 1 : 0;
        if (pal.weaponKind === "spear") {
          if (kit === "cedar") {
            // Leaf-blade hunting spear
            pawnsG.moveTo(pawnX + facing * 4, pawnY + 3 - bob);
            pawnsG.lineTo(pawnX + facing * 4, pawnY - 18 - bob + armSwing);
            pawnsG.stroke({ width: 1.3, color: 0x854d0e });
            pawnsG.ellipse(pawnX + facing * 4, pawnY - 17 - bob + armSwing, 2.2, 3.2);
            pawnsG.fill({ color: 0xd1d5db });
            // Cedar bark shield
            pawnsG.circle(pawnX - facing * 2.5, pawnY - 5 - bob + armSwing, 3.2);
            pawnsG.fill({ color: 0x854d0e });
            pawnsG.circle(pawnX - facing * 2.5, pawnY - 5 - bob + armSwing, 1.2);
            pawnsG.fill({ color: 0x166534 });
          } else if (kit === "sand") {
            // Slender lance with red pennon & brass sun buckler
            pawnsG.moveTo(pawnX + facing * 4, pawnY + 3 - bob);
            pawnsG.lineTo(pawnX + facing * 4, pawnY - 19 - bob + armSwing);
            pawnsG.stroke({ width: 1.2, color: 0xa16207 });
            pawnsG.poly([
              pawnX + facing * 4, pawnY - 16 - bob + armSwing,
              pawnX + facing * 8, pawnY - 14 - bob + armSwing,
              pawnX + facing * 4, pawnY - 12 - bob + armSwing,
            ]);
            pawnsG.fill({ color: 0xdc2626 });
            pawnsG.circle(pawnX - facing * 2.5, pawnY - 5 - bob + armSwing, 3.2);
            pawnsG.fill({ color: 0xfacc15 });
          } else if (kit === "steppe") {
            // Horsehair collar lance & studded rawhide buckler
            pawnsG.moveTo(pawnX + facing * 4, pawnY + 3 - bob);
            pawnsG.lineTo(pawnX + facing * 4, pawnY - 19 - bob + armSwing);
            pawnsG.stroke({ width: 1.3, color: 0x7c2d12 });
            pawnsG.rect(pawnX + facing * 3.2, pawnY - 16 - bob + armSwing, 1.6, 2.5);
            pawnsG.fill({ color: 0x9f1239 });
            pawnsG.circle(pawnX - facing * 2.5, pawnY - 5 - bob + armSwing, 3.2);
            pawnsG.fill({ color: 0x78350f });
            pawnsG.circle(pawnX - facing * 2.5, pawnY - 5 - bob + armSwing, 1);
            pawnsG.fill({ color: 0xfacc15 });
          } else if (kit === "islands") {
            // 3-pronged barbed fishing trident & turtle-shell reef buckler
            pawnsG.moveTo(pawnX + facing * 4, pawnY + 3 - bob);
            pawnsG.lineTo(pawnX + facing * 4, pawnY - 19 - bob + armSwing);
            pawnsG.stroke({ width: 1.3, color: 0x44403c });
            // Trident prongs
            pawnsG.moveTo(pawnX + facing * 2.5, pawnY - 19 - bob + armSwing);
            pawnsG.lineTo(pawnX + facing * 2.5, pawnY - 16 - bob + armSwing);
            pawnsG.lineTo(pawnX + facing * 5.5, pawnY - 16 - bob + armSwing);
            pawnsG.lineTo(pawnX + facing * 5.5, pawnY - 19 - bob + armSwing);
            pawnsG.stroke({ width: 1, color: 0x06b6d4 });
            pawnsG.ellipse(pawnX - facing * 2.5, pawnY - 5 - bob + armSwing, 3.4, 4);
            pawnsG.fill({ color: 0x0e7490 });
          } else {
            // Western untouched
            pawnsG.moveTo(pawnX + facing * 4, pawnY + 3 - bob);
            pawnsG.lineTo(pawnX + facing * 4, pawnY - 18 - bob + armSwing);
            pawnsG.stroke({ width: 1.3, color: 0x78350f });
            pawnsG.poly([
              pawnX + facing * 4, pawnY - 18 - bob + armSwing,
              pawnX + facing * 4 - 2, pawnY - 15 - bob + armSwing,
              pawnX + facing * 4 + 2, pawnY - 15 - bob + armSwing,
            ]);
            pawnsG.fill({ color: 0xf1f5f9 });

            // Round shield on off-arm
            pawnsG.circle(pawnX - facing * 2.5, pawnY - 5 - bob + armSwing, 3.2);
            pawnsG.fill({ color: 0x1e3a8a });
            pawnsG.circle(pawnX - facing * 2.5, pawnY - 5 - bob + armSwing, 1.2);
            pawnsG.fill({ color: 0xfacc15 });
          }
        } else if (pal.weaponKind === "bow") {
          pawnsG.poly([
            pawnX + facing * 3.5, pawnY - 15 - bob + armSwing,
            pawnX + facing * 5.5, pawnY - 7 - bob + armSwing,
            pawnX + facing * 3.5, pawnY + 1 - bob + armSwing,
          ]);
          pawnsG.stroke({ width: 1.5, color: 0x854d0e });
          pawnsG.moveTo(pawnX + facing * 3.5, pawnY - 15 - bob + armSwing);
          pawnsG.lineTo(pawnX + facing * 3.5, pawnY + 1 - bob + armSwing);
          pawnsG.stroke({ width: 0.8, color: 0xe2e8f0 });

          // Quiver over shoulder
          pawnsG.rect(pawnX - facing * 3.5, pawnY - 11 - bob, 2.2, 6);
          pawnsG.fill({ color: 0x78350f });
          pawnsG.rect(pawnX - facing * 3.5, pawnY - 13 - bob, 2.2, 2);
          pawnsG.fill({ color: 0xf8fafc });
        } else if (pal.weaponKind === "javelin") {
          pawnsG.moveTo(pawnX - facing * 2, pawnY - 3 - bob + armSwing);
          pawnsG.lineTo(pawnX + facing * 8, pawnY - 13 - bob + armSwing);
          pawnsG.stroke({ width: 1.2, color: 0x78350f });
          pawnsG.poly([
            pawnX + facing * 8, pawnY - 13 - bob + armSwing,
            pawnX + facing * 9, pawnY - 10 - bob + armSwing,
            pawnX + facing * 6, pawnY - 11 - bob + armSwing,
          ]);
          pawnsG.fill({ color: 0xcbd5e1 });
          pawnsG.circle(pawnX - facing * 3, pawnY - 5 - bob, 2.5);
          pawnsG.fill({ color: 0x854d0e });
        } else if (pal.weaponKind === "heater") {
          // Knight heater shield
          pawnsG.poly([
            pawnX - facing * 2, pawnY - 9 - bob + armSwing,
            pawnX - facing * 6.5, pawnY - 9 - bob + armSwing,
            pawnX - facing * 6.5, pawnY - 3 - bob + armSwing,
            pawnX - facing * 4.2, pawnY + 1 - bob + armSwing,
            pawnX - facing * 2, pawnY - 3 - bob + armSwing,
          ]);
          pawnsG.fill({ color: 0xb91c1c });
          pawnsG.moveTo(pawnX - facing * 4.2, pawnY - 9 - bob + armSwing);
          pawnsG.lineTo(pawnX - facing * 4.2, pawnY + 1 - bob + armSwing);
          pawnsG.stroke({ width: 1, color: 0xfacc15 });

          // Broadsword
          pawnsG.moveTo(pawnX + facing * 3.5, pawnY - 2 - bob + armSwing);
          pawnsG.lineTo(pawnX + facing * 3.5, pawnY - 13 - bob + armSwing);
          pawnsG.stroke({ width: 1.5, color: 0xf8fafc });
          pawnsG.moveTo(pawnX + facing * 1.5, pawnY - 4 - bob + armSwing);
          pawnsG.lineTo(pawnX + facing * 5.5, pawnY - 4 - bob + armSwing);
          pawnsG.stroke({ width: 1.2, color: 0xeab308 });
        } else if (pal.weaponKind === "greatsword") {
          // Champion glowing runic greatsword + cape
          pawnsG.moveTo(pawnX + facing * 4, pawnY + 1 - bob + armSwing);
          pawnsG.lineTo(pawnX + facing * 4, pawnY - 16 - bob + armSwing);
          pawnsG.stroke({ width: 2, color: 0x38bdf8 });
          pawnsG.moveTo(pawnX + facing * 1, pawnY - 3 - bob + armSwing);
          pawnsG.lineTo(pawnX + facing * 7, pawnY - 3 - bob + armSwing);
          pawnsG.stroke({ width: 1.5, color: 0xfde047 });
          pawnsG.poly([
            pawnX - facing * 2.5, pawnY - 7 - bob,
            pawnX - facing * 6.5, pawnY + 2 - bob,
            pawnX - facing * 1.5, pawnY + 1 - bob,
          ]);
          pawnsG.fill({ color: 0xdc2626 });
        } else {
          // Militia: spear-less levy club
          pawnsG.rect(pawnX + facing * 3, pawnY - 7 - bob + armSwing, 1.8, 5);
          pawnsG.fill({ color: 0x78350f });
        }
      }

      // Floating ETA pill badge
      pawnsG.rect(pawnX - 16, pawnY - 28 - bob, 32, 9);
      pawnsG.fill({ color: 0x181410, alpha: 0.92 });
      pawnsG.stroke({ width: 1, color: pal.accentColor, alpha: 0.9 });

      // Progress timer dots inside pill
      pawnsG.circle(pawnX - 10, pawnY - 23.5 - bob, 1.8);
      pawnsG.fill({ color: 0xfde047 });
      pawnsG.circle(pawnX - 4, pawnY - 23.5 - bob, 1.5);
      pawnsG.fill({ color: 0xfacc15 });
      pawnsG.circle(pawnX + 2, pawnY - 23.5 - bob, 1.5);
      pawnsG.fill({ color: 0xeab308 });
      pawnsG.circle(pawnX + 8, pawnY - 23.5 - bob, 1.5);
      pawnsG.fill({ color: 0xca8a04 });
    } else {
      // Hostile March: Red / Blackened Iron War Meeple
      // Heavy Blackened Iron Pedestal with iron rivets
      pawnsG.rect(pawnX - 6.5, pawnY + 2 - bob, 13, 4.5);
      pawnsG.fill({ color: 0x18181b });
      pawnsG.stroke({ width: 0.8, color: 0x3f3f46 });
      pawnsG.circle(pawnX - 4.5, pawnY + 4 - bob, 0.7); pawnsG.fill({ color: 0x71717a });
      pawnsG.circle(pawnX + 4.5, pawnY + 4 - bob, 0.7); pawnsG.fill({ color: 0x71717a });

      // Angular Blackened Iron Meeple Torso
      pawnsG.poly([
        pawnX - 6, pawnY + 2 - bob,
        pawnX - 4, pawnY - 8 - bob,
        pawnX + 4, pawnY - 8 - bob,
        pawnX + 6, pawnY + 2 - bob,
      ]);
      pawnsG.fill({ color: 0x27272a });

      // Spiked Iron Pauldrons (shoulders)
      pawnsG.poly([pawnX - 7, pawnY - 5 - bob, pawnX - 4, pawnY - 9 - bob, pawnX - 3, pawnY - 5 - bob]);
      pawnsG.fill({ color: 0x3f3f46 });
      pawnsG.poly([pawnX + 3, pawnY - 5 - bob, pawnX + 4, pawnY - 9 - bob, pawnX + 7, pawnY - 5 - bob]);
      pawnsG.fill({ color: 0x3f3f46 });

      // Blood-red War Tabard
      pawnsG.rect(pawnX - 2.5, pawnY - 7 - bob, 5, 6);
      pawnsG.fill({ color: 0x991b1b });
      // Crossed iron straps on chest
      pawnsG.moveTo(pawnX - 2, pawnY - 6 - bob); pawnsG.lineTo(pawnX + 2, pawnY - 2 - bob);
      pawnsG.moveTo(pawnX + 2, pawnY - 6 - bob); pawnsG.lineTo(pawnX - 2, pawnY - 2 - bob);
      pawnsG.stroke({ width: 0.8, color: 0x18181b });

      // Jagged Dark Iron Helm with horn crest
      pawnsG.circle(pawnX, pawnY - 11 - bob, 3.8);
      pawnsG.fill({ color: 0x18181b });
      // Horn spikes
      pawnsG.poly([pawnX - 3, pawnY - 12 - bob, pawnX - 6, pawnY - 16 - bob, pawnX - 1.5, pawnY - 13 - bob]);
      pawnsG.fill({ color: 0x3f3f46 });
      pawnsG.poly([pawnX + 1.5, pawnY - 13 - bob, pawnX + 6, pawnY - 16 - bob, pawnX + 3, pawnY - 12 - bob]);
      pawnsG.fill({ color: 0x3f3f46 });
      // Glowing crimson eye-slit
      pawnsG.rect(pawnX - 2, pawnY - 11.5 - bob, 4, 1.2);
      pawnsG.fill({ color: 0xef4444 });

      // Blackened Polearm & ragged war pennant
      pawnsG.moveTo(pawnX + 4.5, pawnY + 4 - bob);
      pawnsG.lineTo(pawnX + 4.5, pawnY - 19 - bob);
      pawnsG.stroke({ width: 1.4, color: 0x18181b });
      // Jagged halberd axe head
      pawnsG.poly([
        pawnX + 4.5, pawnY - 19 - bob,
        pawnX + 9, pawnY - 16 - bob,
        pawnX + 7, pawnY - 13 - bob,
        pawnX + 4.5, pawnY - 14 - bob,
      ]);
      pawnsG.fill({ color: 0x52525b });

      // Ragged crimson/black war pennant
      const hWave = Math.sin(phase * 8.5) * 1.6;
      pawnsG.poly([
        pawnX + 4.5, pawnY - 13 - bob,
        pawnX + 13, pawnY - 11 - bob + hWave,
        pawnX + 4.5, pawnY - 7 - bob,
      ]);
      pawnsG.fill({ color: 0x7f1d1d });

      // Floating ETA pill badge (blackened iron with crimson border)
      pawnsG.rect(pawnX - 16, pawnY - 28 - bob, 32, 9);
      pawnsG.fill({ color: 0x09090b, alpha: 0.95 });
      pawnsG.stroke({ width: 1, color: 0xdc2626, alpha: 0.9 });

      // Crimson indicator dots
      pawnsG.circle(pawnX - 10, pawnY - 23.5 - bob, 1.8);
      pawnsG.fill({ color: 0xf87171 });
      pawnsG.circle(pawnX - 4, pawnY - 23.5 - bob, 1.5);
      pawnsG.fill({ color: 0xef4444 });
      pawnsG.circle(pawnX + 2, pawnY - 23.5 - bob, 1.5);
      pawnsG.fill({ color: 0xdc2626 });
      pawnsG.circle(pawnX + 8, pawnY - 23.5 - bob, 1.5);
      pawnsG.fill({ color: 0x991b1b });
    }
  }

  // Render gather expeditions if gather system is present (Astra lane stub)
  paintBoardGathers(routeG, pawnsG, state, phase);
}

export function isOutpostProvince(
  state: GameState | null,
  p: { id: string; occupantRealmId?: string }
): boolean {
  if (!state?.board) return false;
  return p.occupantRealmId === "player" && p.id !== state.board.homeProvinceId;
}

export function listGathersPresentation(state: GameState | null): any[] {
  if (!state) return [];
  if (typeof sim.listGathers === "function") {
    return sim.listGathers(state).map((g) => {
      const tick = state.meta.tick;
      let progress = 0.5;
      if (g.phase === "outbound") {
        const span = Math.max(1, g.arrivesTick - g.departedTick);
        progress = Math.min(1, Math.max(0, (tick - g.departedTick) / span));
      } else if (g.phase === "gathering") {
        progress = 1;
      } else if (g.phase === "returning") {
        const span = Math.max(1, g.arrivesTick - g.departedTick);
        progress = 1 - Math.min(1, Math.max(0, (tick - g.departedTick) / span));
      }
      return { ...g, progress };
    });
  }
  return [];
}

function paintBoardGathers(
  routeG: Graphics,
  pawnsG: Graphics,
  state: GameState | null,
  phase: number
): void {
  const gathers = listGathersPresentation(state);
  if (gathers.length === 0) return;

  const cultId = state && sim.playerCultureId ? sim.playerCultureId(state) : undefined;
  const kit = resolveCultureKit(cultId);
  const cult = culturePalette(cultId);

  for (const g of gathers) {
    const fromId = g.fromId ?? state?.board?.homeProvinceId;
    const toId = g.toId ?? g.targetProvinceId;
    if (!fromId || !toId) continue;

    const fromProv = getProvince(state!, fromId);
    const toProv = getProvince(state!, toId);
    if (!fromProv || !toProv) continue;

    const fromB = provinceTokenBounds(fromProv.x, fromProv.y);
    const toB = provinceTokenBounds(toProv.x, toProv.y);

    const dx = toB.cx - fromB.cx;
    const dy = toB.cy - fromB.cy;
    const distPx = Math.hypot(dx, dy);
    const steps = Math.max(3, Math.floor(distPx / 16));

    // Green / timber foraging route trail
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lx = fromB.cx + dx * t;
      const ly = fromB.cy + dy * t;
      const pulse = Math.sin(phase * 4 + i * 0.5) * 0.2 + 0.8;
      routeG.circle(lx, ly, 1.4);
      routeG.fill({ color: 0x16a34a, alpha: 0.75 * pulse });
    }

    // Gather destination target badge
    routeG.circle(toB.cx, toB.cy, 8);
    routeG.stroke({ width: 1.2, color: 0x22c55e, alpha: 0.8 });

    // Progress
    const progress = Math.min(1, Math.max(0, typeof g.progress === "number" ? g.progress : 0.5));
    const pawnX = fromB.cx + dx * progress;
    const pawnY = fromB.cy + dy * progress;

    // Contact shadow
    pawnsG.ellipse(pawnX, pawnY + 5, 7, 3);
    pawnsG.fill({ color: 0x000000, alpha: 0.4 });

    // Culture-kit pack-cart / gatherer pawn
    if (kit === "cedar") {
      // Split-cedar wood pack cart with foraging burlap sack
      pawnsG.rect(pawnX - 5.5, pawnY - 2, 11, 4.5);
      pawnsG.fill({ color: cult.timber });
      pawnsG.stroke({ width: 0.8, color: 0x3f220c });
      pawnsG.circle(pawnX - 3.5, pawnY + 3, 2.2); pawnsG.fill({ color: 0x3f220c });
      pawnsG.circle(pawnX + 3.5, pawnY + 3, 2.2); pawnsG.fill({ color: 0x3f220c });
      pawnsG.circle(pawnX, pawnY - 3, 3); pawnsG.fill({ color: cult.tabard }); // Woodland bundle
      pawnsG.circle(pawnX + 1, pawnY - 3.5, 1.5); pawnsG.fill({ color: 0xca8a04 });
    } else if (kit === "sand") {
      // Sunbleached acacia timber cart with clay amphorae cargo
      pawnsG.rect(pawnX - 5.5, pawnY - 2, 11, 4.5);
      pawnsG.fill({ color: cult.stone });
      pawnsG.stroke({ width: 0.8, color: 0xa16207 });
      pawnsG.circle(pawnX - 3.5, pawnY + 3, 2.2); pawnsG.fill({ color: cult.timber });
      pawnsG.circle(pawnX + 3.5, pawnY + 3, 2.2); pawnsG.fill({ color: cult.timber });
      pawnsG.ellipse(pawnX - 1.5, pawnY - 3, 2.2, 3); pawnsG.fill({ color: 0xc2410c }); // Amphora
      pawnsG.ellipse(pawnX + 2, pawnY - 3, 1.8, 2.5); pawnsG.fill({ color: cult.accent });
    } else if (kit === "steppe") {
      // Nomad two-wheeled arba wagon with wool felt cargo bundle
      pawnsG.rect(pawnX - 6, pawnY - 2.5, 12, 4.5);
      pawnsG.fill({ color: cult.timber });
      pawnsG.stroke({ width: 0.8, color: 0x44403c });
      pawnsG.circle(pawnX - 4, pawnY + 3.2, 2.6); pawnsG.stroke({ width: 1.2, color: 0x44403c });
      pawnsG.circle(pawnX + 4, pawnY + 3.2, 2.6); pawnsG.stroke({ width: 1.2, color: 0x44403c });
      pawnsG.rect(pawnX - 3, pawnY - 5, 6, 3.5); pawnsG.fill({ color: 0xf5f5f4 }); // Felt pack
      pawnsG.rect(pawnX - 3, pawnY - 3.5, 6, 1); pawnsG.fill({ color: cult.tabard }); // Crimson strap
    } else if (kit === "islands") {
      // Coastal driftwood slip cart with reed baskets & net sacks
      pawnsG.rect(pawnX - 5.5, pawnY - 2, 11, 4.5);
      pawnsG.fill({ color: cult.timber });
      pawnsG.stroke({ width: 0.8, color: 0x1e293b });
      pawnsG.circle(pawnX - 3.5, pawnY + 3, 2.2); pawnsG.fill({ color: 0x1e293b });
      pawnsG.circle(pawnX + 3.5, pawnY + 3, 2.2); pawnsG.fill({ color: 0x1e293b });
      pawnsG.circle(pawnX - 1.5, pawnY - 3, 2.5); pawnsG.fill({ color: 0xa16207 }); // Reed basket
      pawnsG.circle(pawnX + 2, pawnY - 3, 2.2); pawnsG.fill({ color: cult.tabard }); // Fish net bundle
    } else {
      // Western: Classic untouched timber pack-cart
      pawnsG.rect(pawnX - 5, pawnY - 2, 10, 4.5);
      pawnsG.fill({ color: 0x854d0e });
      pawnsG.stroke({ width: 0.7, color: 0x543007 });

      // Cart wheels
      pawnsG.circle(pawnX - 3.5, pawnY + 3, 2.2);
      pawnsG.fill({ color: 0x27272a });
      pawnsG.circle(pawnX + 3.5, pawnY + 3, 2.2);
      pawnsG.fill({ color: 0x27272a });

      // Resource cargo sack in cart
      pawnsG.circle(pawnX, pawnY - 3, 2.8);
      pawnsG.fill({ color: 0xd97706 });
    }
  }
}

function paintBoardHighlight(
  g: Graphics,
  bx: number,
  by: number,
  state: GameState | null
): void {
  g.clear();
  const bounds = provinceTokenBounds(bx, by);

  // 1. Glowing selection border around token
  g.rect(bounds.x - 2, bounds.y - 2, bounds.w + 4, bounds.h + 4);
  g.stroke({ width: 2, color: 0xfef08a, alpha: 0.95 });

  // 2. Information plaque at bottom of diorama table
  const p = state?.board?.provinces?.find((pr) => pr.x === bx && pr.y === by);
  if (!p) return;

  const seen = state ? isProvinceSeen(state, p.id) : true;
  const plaqueX = 70;
  const plaqueY = CANVAS_H - RIM_SIZE - 22;
  const plaqueW = CANVAS_W - 140;
  const plaqueH = 18;

  g.rect(plaqueX, plaqueY, plaqueW, plaqueH);
  g.fill({ color: 0x14100c, alpha: 0.92 });
  g.stroke({ width: 1, color: 0xc8963e, alpha: 0.85 });

  if (!seen) {
    // Unscouted province pip
    g.circle(plaqueX + 12, plaqueY + 9, 3.5);
    g.fill({ color: 0x78716c });

    // Unscouted status badge
    g.rect(plaqueX + plaqueW - 68, plaqueY + 3, 62, 12);
    g.fill({ color: 0x3f3f46 });
    g.stroke({ width: 0.8, color: 0x78716c, alpha: 0.7 });
    return;
  }

  // Status indicator pip on left
  const isHome = p.id === state?.board?.homeProvinceId;
  const pipColor = isHome
    ? 0xfacc15
    : p.occupantRealmId && p.occupantRealmId !== "player"
    ? realmTokenPalette(p.occupantRealmId).accentColor
    : p.node !== "none"
    ? 0x38bdf8
    : 0x4ade80;
  g.circle(plaqueX + 12, plaqueY + 9, 3.5);
  g.fill({ color: pipColor });

  // Action badge on right
  const isMarching = listMarches(state!).some((m) => m.toId === p.id);
  const actionColor = isHome ? 0x2d5a27 : isMarching ? 0xb45309 : 0x991b1b;
  g.rect(plaqueX + plaqueW - 68, plaqueY + 3, 62, 12);
  g.fill({ color: actionColor });
  g.stroke({ width: 0.8, color: 0xfef08a, alpha: 0.7 });
}

// -------------------------------------------------------------
// Main Map Renderer Factory (Two-Band Camera: Hold vs Board)
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

  // Two camera bands inside worldContainer:
  // Band 1: Hold Container (16x10 isometric turf, buildings, walkers, fog, particles)
  const holdContainer = new Container();
  worldContainer.addChild(holdContainer);

  // Band 2: Board Container (8x6 tabletop province tokens, routes, march pawns)
  const boardContainer = new Container();
  boardContainer.visible = false;
  worldContainer.addChild(boardContainer);

  // Hold layers inside holdContainer
  const groundLayer = new Graphics();
  holdContainer.addChild(groundLayer);

  const entitiesLayer = new Container();
  entitiesLayer.sortableChildren = true;
  holdContainer.addChild(entitiesLayer);

  const fogLayer = new Graphics();
  holdContainer.addChild(fogLayer);

  const ambientOverlay = new Graphics();
  holdContainer.addChild(ambientOverlay);

  const particlesGraphic = new Graphics();
  holdContainer.addChild(particlesGraphic);

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
  holdContainer.addChild(hoverGraphic);

  // Board layers inside boardContainer
  const boardBackdropLayer = new Graphics();
  boardContainer.addChild(boardBackdropLayer);

  const boardProvincesLayer = new Graphics();
  boardContainer.addChild(boardProvincesLayer);

  const boardRoutesLayer = new Graphics();
  boardContainer.addChild(boardRoutesLayer);

  const boardPawnsLayer = new Graphics();
  boardContainer.addChild(boardPawnsLayer);

  const boardHighlightLayer = new Graphics();
  boardHighlightLayer.visible = false;
  boardContainer.addChild(boardHighlightLayer);

  // 3. Tabletop Hardwood Rim (rendered on top of world and mask)
  const tableRimLayer = new Graphics();
  app.stage.addChild(tableRimLayer);
  paintTableRim(tableRimLayer);

  // State management
  const buildingGraphics = new Map<string, Graphics>();
  let lastState: GameState | null = null;
  let clickCb: ((x: number, y: number) => void) | null = null;
  let provinceClickCb: ((provinceId: string) => void) | null = null;
  let bandChangeCb: ((band: CameraBand) => void) | null = null;
  let phase = 0;
  let currentSeasonName = "Spring";
  let currentHolidayId = "none";
  let visuals = getThemeVisuals(currentSeasonName, currentHolidayId);
  let hoveredProvinceCoord: { bx: number; by: number } | null = null;

  // Zoom & Pan State (two zoom bands: Hold vs Board)
  let zoom = HOLD_DEFAULT_ZOOM;
  let panX = 0;
  let panY = 0;
  let currentBand: CameraBand = "hold";

  function updateBand(nextBand: CameraBand): void {
    if (currentBand !== nextBand) {
      currentBand = nextBand;
      bandChangeCb?.(currentBand);
      window.dispatchEvent(new CustomEvent("sc-camera-band-change", { detail: currentBand }));
    }
  }

  function applyTransform(): void {
    const nextBand = bandForZoom(zoom);
    updateBand(nextBand);

    if (currentBand === "hold") {
      holdContainer.visible = true;
      boardContainer.visible = false;
      holdContainer.scale.set(zoom);
      holdContainer.position.set(panX, panY);
    } else {
      holdContainer.visible = false;
      boardContainer.visible = true;
      const boardScale = zoom / BOARD_DEFAULT_ZOOM;
      boardContainer.scale.set(boardScale);
      boardContainer.position.set(
        panX + (1 - boardScale) * (CANVAS_W / 2),
        panY + (1 - boardScale) * (CANVAS_H / 2)
      );
    }
  }
  applyTransform();

  function setZoomCentered(newZoom: number, cx: number, cy: number): void {
    const clamped = Math.max(MIN_CAMERA_ZOOM, Math.min(MAX_CAMERA_ZOOM, newZoom));
    if (Math.abs(clamped - zoom) < 0.001) return;
    const wx = (cx - panX) / zoom;
    const wy = (cy - panY) / zoom;
    zoom = clamped;
    panX = cx - wx * zoom;
    panY = cy - wy * zoom;

    const maxPanX = CANVAS_W * 0.75;
    const maxPanY = CANVAS_H * 0.75;
    panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
    panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
    applyTransform();
  }

  function setBand(targetBand: CameraBand): void {
    if (targetBand === "hold") {
      zoom = HOLD_DEFAULT_ZOOM;
      panX = 0;
      panY = 0;
    } else {
      zoom = BOARD_DEFAULT_ZOOM;
      panX = 0;
      panY = 0;
    }
    applyTransform();
  }

  // Paint ground and board backdrop initially
  paintIsometricGround(groundLayer, visuals);
  paintBoardBackdrop(boardBackdropLayer, visuals);

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

  function getBoardCoords(ev: PointerEvent | MouseEvent): { bx: number; by: number } {
    const { px, py } = getCanvasCoords(ev);
    const boardScale = zoom / BOARD_DEFAULT_ZOOM;
    const boardOriginX = panX + (1 - boardScale) * (CANVAS_W / 2);
    const boardOriginY = panY + (1 - boardScale) * (CANVAS_H / 2);
    return {
      bx: (px - boardOriginX) / boardScale,
      by: (py - boardOriginY) / boardScale,
    };
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

    if (currentBand === "hold") {
      boardHighlightLayer.visible = false;
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
    } else {
      hoverGraphic.visible = false;
      const { bx, by } = getBoardCoords(ev);
      const hit = hitTestProvince(bx, by);
      if (
        hit &&
        px >= RIM_SIZE && px <= CANVAS_W - RIM_SIZE &&
        py >= RIM_SIZE && py <= CANVAS_H - RIM_SIZE
      ) {
        hoveredProvinceCoord = hit;
        boardHighlightLayer.visible = true;
        paintBoardHighlight(boardHighlightLayer, hit.bx, hit.by, lastState);
      } else {
        hoveredProvinceCoord = null;
        boardHighlightLayer.visible = false;
      }
    }
  });

  window.addEventListener("pointerup", (ev) => {
    if (!isDragging) return;
    isDragging = false;
    app.canvas.style.cursor = "grab";

    if (dragMoved < 6) {
      const { px, py } = getCanvasCoords(ev);
      if (
        px >= RIM_SIZE && px <= CANVAS_W - RIM_SIZE &&
        py >= RIM_SIZE && py <= CANVAS_H - RIM_SIZE
      ) {
        if (currentBand === "hold" && clickCb) {
          const { gx, gy } = getGridFromEvent(ev);
          if (gx >= 0 && gy >= 0 && gx < GRID_W && gy < GRID_H) {
            clickCb(gx, gy);
          }
        } else if (currentBand === "board" && lastState) {
          const { bx, by } = getBoardCoords(ev);
          const hit = hitTestProvince(bx, by);
          if (hit) {
            const p = lastState.board?.provinces?.find((pr) => pr.x === hit.bx && pr.y === hit.by);
            if (p) {
              if (p.id === lastState.board?.homeProvinceId) {
                // Clicking home province snaps back to Hold band
                setBand("hold");
              } else if (provinceClickCb) {
                provinceClickCb(p.id);
              }
            }
          }
        }
      }
    }
  });

  app.canvas.addEventListener("pointerleave", () => {
    hoverGraphic.visible = false;
    boardHighlightLayer.visible = false;
    hoveredProvinceCoord = null;
  });

  // Mouse wheel zoom centered at cursor
  app.canvas.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    const { px, py } = getCanvasCoords(ev);
    const zoomDelta = ev.deltaY < 0 ? 1.15 : 0.87;
    setZoomCentered(zoom * zoomDelta, px, py);
  }, { passive: false });

  function updateWalkers(dt: number, state: GameState | null): void {
    const playerWorkers = state?.citizens?.filter(
      (c) => c.realmId === "player" && c.tile != null
    ) ?? [];

    for (const w of walkers) {
      if (playerWorkers.length > 0) {
        const worker = playerWorkers[w.id % playerWorkers.length];
        w.role = roleForCitizenJob(worker.job);
      }

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

      let frame: 0 | 1 | 2 = 0;
      if (w.state === "walking") {
        const cycle = Math.floor(w.walkDist) % 4;
        if (cycle === 1) frame = 1;
        else if (cycle === 3) frame = 2;
        else frame = 0;
      }

      const { wx, wy } = gridToWorld(w.x, w.y);
      w.graphics.x = wx;
      w.graphics.y = wy;
      w.graphics.zIndex = Math.floor((w.x + w.y) * 100) + 40;

      const cultId = lastState && sim.playerCultureId ? sim.playerCultureId(lastState) : undefined;
      drawWalkerFrame(w.graphics, w.role, w.facing, frame, cultId);
    }
  }

  function updateFog(t: number): void {
    fogLayer.clear();
    const dec = visuals.decorations;

    let outerColor = 0x3b244d;
    let innerColor = 0x241433;
    let alphaMult = 1.0;

    if (dec === "halloween") {
      outerColor = 0x3b244d;
      innerColor = 0x241433;
      alphaMult = 1.0;
    } else if (dec === "midwinter") {
      outerColor = 0xbae6fd;
      innerColor = 0xe0f2fe;
      alphaMult = 1.15;
    } else if (dec === "easter") {
      outerColor = 0xf3e8ff;
      innerColor = 0xfdf4ff;
      alphaMult = 0.85;
    } else if (dec === "harvest") {
      outerColor = 0x78350f;
      innerColor = 0x92400e;
      alphaMult = 0.95;
    } else if (dec === "midsummer") {
      outerColor = 0xfde047;
      innerColor = 0xfef08a;
      alphaMult = 0.75;
    } else if (dec === "spring") {
      outerColor = 0xdcfce7;
      innerColor = 0xf0fdf4;
      alphaMult = 0.50;
    } else if (dec === "summer") {
      outerColor = 0xfef9c3;
      innerColor = 0xfef08a;
      alphaMult = 0.40;
    } else if (dec === "autumn") {
      outerColor = 0x78350f;
      innerColor = 0xb45309;
      alphaMult = 0.60;
    } else if (dec === "winter") {
      outerColor = 0xe2e8f0;
      innerColor = 0xf1f5f9;
      alphaMult = 0.70;
    } else {
      return;
    }

    for (const f of fogBanks) {
      f.x += f.vx;
      f.y += f.vy;
      if (f.x > CANVAS_W + 50) f.x = -50;
      if (f.y > CANVAS_H + 30) f.y = -30;

      const pulse = Math.sin(t + f.phase) * 0.08 + 1.0;
      fogLayer.ellipse(f.x, f.y, f.rx * pulse, f.ry * pulse);
      fogLayer.fill({ color: outerColor, alpha: f.alpha * alphaMult });
      fogLayer.ellipse(f.x + 4, f.y - 2, f.rx * 0.65 * pulse, f.ry * 0.6 * pulse);
      fogLayer.fill({ color: innerColor, alpha: f.alpha * 0.7 * alphaMult });
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
    const rimForts = listRimFortsPresentation(state);
    const rimFortMap = new Map<number, RimFort>();
    for (const f of rimForts) {
      rimFortMap.set(rimWalkIndex(f.x, f.y), f);
    }

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

      let rimNeighbors: RimNeighbors | undefined;
      if (isRimTile(gx, gy) && (b.typeId === "walls" || b.typeId === "gate")) {
        const idx = rimWalkIndex(gx, gy);
        const prevIdx = (idx - 1 + 48) % 48;
        const nextIdx = (idx + 1) % 48;
        const prevFort = rimFortMap.get(prevIdx);
        const nextFort = rimFortMap.get(nextIdx);
        rimNeighbors = {
          hasPrev: prevFort != null,
          hasNext: nextFort != null,
          prevKind: prevFort?.kind,
          nextKind: nextFort?.kind,
        };
      }

      const cultId = state && sim.playerCultureId ? sim.playerCultureId(state) : undefined;
      drawIsometricBuilding(g, b.typeId, b.level, complete, t + gx * 0.35, visuals, gx, gy, rimNeighbors, cultId);
    }

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
      paintBoardBackdrop(boardBackdropLayer, visuals);
    }
    paintBuildings(state, phase);
    paintBoardProvinces(boardProvincesLayer, state, phase);
    paintBoardMarches(boardRoutesLayer, boardPawnsLayer, state, phase);
    if (hoveredProvinceCoord) {
      paintBoardHighlight(boardHighlightLayer, hoveredProvinceCoord.bx, hoveredProvinceCoord.by, state);
    }
  }

  function setTheme(themeId: string, holidayId: string): void {
    currentHolidayId = holidayId;
    visuals = getThemeVisuals(currentSeasonName, holidayId);
    paintIsometricGround(groundLayer, visuals);
    paintAmbientLighting();
    paintBoardBackdrop(boardBackdropLayer, visuals);
    if (lastState) {
      paintBuildings(lastState, phase);
      paintBoardProvinces(boardProvincesLayer, lastState, phase);
      paintBoardMarches(boardRoutesLayer, boardPawnsLayer, lastState, phase);
    }
  }

  let lastTickTime = performance.now();

  app.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastTickTime) / 1000);
    lastTickTime = now;

    phase += dt * 2.5;

    if (currentBand === "hold") {
      updateWalkers(dt, lastState);
      updateFog(phase);
      updateParticles(phase);
      if (lastState) {
        paintBuildings(lastState, phase);
      }
    } else {
      if (lastState) {
        paintBoardMarches(boardRoutesLayer, boardPawnsLayer, lastState, phase);
      }
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
    onProvinceClick(cb) {
      provinceClickCb = cb;
    },
    zoomIn() {
      setZoomCentered(zoom * 1.25, CANVAS_W / 2, CANVAS_H / 2);
    },
    zoomOut() {
      setZoomCentered(zoom * 0.8, CANVAS_W / 2, CANVAS_H / 2);
    },
    resetView() {
      if (currentBand === "hold") {
        zoom = HOLD_DEFAULT_ZOOM;
      } else {
        zoom = BOARD_DEFAULT_ZOOM;
      }
      panX = 0;
      panY = 0;
      applyTransform();
    },
    getBand() {
      return currentBand;
    },
    setBand(band: CameraBand) {
      setBand(band);
    },
    onBandChange(cb) {
      bandChangeCb = cb;
    },
  };
}
