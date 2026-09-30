import { Graphics } from "pixi.js";
import type { GameState, Province, TerrainId, ProvinceNode } from "@second-crown/shared";
import { BOARD_W, BOARD_H } from "@second-crown/shared";
import {
  listMarches,
  isProvinceSeen,
  getProvince,
  nodeStock,
  nodeStockMax,
  GATHER_NODES,
  garrisonAt,
  garrisonPower,
  listGarrisons,
} from "@second-crown/sim";
import * as sim from "@second-crown/sim";
import type { March } from "@second-crown/sim";
import {
  provinceTokenBounds,
  calculateMarchProgress,
  CHIP_W,
  CHIP_H,
  CANVAS_W,
  CANVAS_H,
  RIM_SIZE,
  BOARD_TILE_W,
  BOARD_TILE_H,
  BOARD_HALF_W,
  BOARD_HALF_H,
  boardGridToWorld,
} from "./camera.js";
import {
  terrainChipPalette,
  terrainElevation,
  paintTileHeightFace,
  paintFogHeightVeil,
  type ThemeVisuals,
} from "./tiles.js";
import {
  type CultureKit,
  resolveCultureKit,
  culturePalette,
  type CultureVisualPalette,
  blendDark,
  blendLight,
  getThemeVisuals,
} from "./buildings.js";
import { isFoodStoresEmptyOrLow } from "./walkers.js";

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

export function isNpcHoldProvince(p: { node?: string; occupantRealmId?: string | null }): boolean {
  return Boolean(p.occupantRealmId && p.occupantRealmId !== "player" && p.node === "hold");
}

export type KeepYardSlot = "west" | "south" | "east" | "north";

export interface KeepYardBuildingInfo {
  id?: string;
  typeId: string;
  isFinished: boolean;
  level?: number;
  slot: KeepYardSlot;
}

export interface MiniatureKeepOptions {
  state?: GameState | null;
  yardBuildings?: KeepYardBuildingInfo[];
}

/**
 * Returns finished and unfinished keep-yard buildings sharing an edge with the player's keep.
 * Mapped to 4 relative isometric slots around the keep:
 * - west: North-West flank (behind-left)
 * - south: South-West flank (front-left)
 * - east: South-East flank (front-right)
 * - north: North-East flank (behind-right)
 */
export function listKeepYardBuildings(
  state?: GameState | null,
  realmId = "player"
): KeepYardBuildingInfo[] {
  if (!state || !Array.isArray(state.buildings)) return [];

  // Check explicit test / mock flag overrides first if present
  const anyState = state as unknown as Record<string, unknown>;
  const flags = state.flags as Record<string, unknown> | undefined;
  const mockYard = anyState.keepYard ?? flags?.keepYard;
  if (Array.isArray(mockYard)) {
    return mockYard as KeepYardBuildingInfo[];
  }

  const keep = state.buildings.find(
    (b) => b.realmId === realmId && b.typeId === "keep"
  );

  const candidateBuildings = state.buildings.filter(
    (b) =>
      b.realmId === realmId &&
      b.typeId !== "keep" &&
      b.typeId !== "walls" &&
      b.typeId !== "gate"
  );

  const results: KeepYardBuildingInfo[] = [];
  const usedSlots = new Set<string>();

  if (keep) {
    for (const b of candidateBuildings) {
      const dx = b.x - keep.x;
      const dy = b.y - keep.y;
      if (Math.abs(dx) + Math.abs(dy) === 1) {
        let slot: KeepYardSlot;
        if (dx === -1 && dy === 0) slot = "west";
        else if (dx === 0 && dy === 1) slot = "south";
        else if (dx === 1 && dy === 0) slot = "east";
        else slot = "north";

        if (!usedSlots.has(slot)) {
          usedSlots.add(slot);
          results.push({
            id: b.id,
            typeId: b.typeId,
            isFinished: b.completesAtTick === null || b.completesAtTick === undefined,
            level: b.level ?? 1,
            slot,
          });
        }
      }
    }
  }

  // Fallback: if keep is not placed or buildings don't share exact coordinates (e.g. test mock),
  // but candidate buildings exist on state, map up to 4 to slots
  if (results.length === 0 && candidateBuildings.length > 0) {
    const slots: KeepYardSlot[] = ["south", "east", "west", "north"];
    let slotIdx = 0;
    for (const b of candidateBuildings.slice(0, 4)) {
      const slot = slots[slotIdx++];
      results.push({
        id: b.id,
        typeId: b.typeId,
        isFinished: b.completesAtTick === null || b.completesAtTick === undefined,
        level: b.level ?? 1,
        slot,
      });
    }
  }

  return results;
}

/**
 * Draws an authentic miniature isometric building annex or timber scaffolding around the keep.
 * Finished buildings read as small architectural annexes with walls, gabled/hipped roofs, and characteristic details.
 * Unfinished buildings stay authentic timber scaffolding with corner posts, ledger cross-beams, diagonal X-braces,
 * builder's work deck, and stone hoist.
 */
export function drawKeepYardAnnex(
  g: Graphics,
  cx: number,
  cy: number,
  info: KeepYardBuildingInfo,
  kit: CultureKit = "western",
  phase = 0
): void {
  const { typeId, isFinished, slot } = info;
  let ax = cx;
  let ay = cy;

  if (slot === "south") {
    ax = cx - 11.5;
    ay = cy + 2.8;
  } else if (slot === "east") {
    ax = cx + 11.5;
    ay = cy + 2.8;
  } else if (slot === "west") {
    ax = cx - 11.5;
    ay = cy - 3.8;
  } else {
    // north
    ax = cx + 11.5;
    ay = cy - 3.8;
  }

  // 1. Ground contact footprint shadow
  g.ellipse(ax, ay + 2.5, 4.8, 2.2);
  g.fill({ color: 0x050403, alpha: 0.45 });

  if (!isFinished) {
    // -------------------------------------------------------------
    // Unfinished keep-yard building: timber construction scaffolding
    // -------------------------------------------------------------
    // Sawdust / wood chips on turf
    g.circle(ax - 2.5, ay + 2.2, 0.5); g.fill({ color: 0xd97706 });
    g.circle(ax + 2.8, ay + 2.5, 0.5); g.fill({ color: 0xfbbf24 });

    // Timber upright standards (corner posts)
    const poleCol = kit === "steppe" ? 0x44403c : kit === "islands" ? 0x57534e : 0x78350f;
    const ledgerCol = kit === "steppe" ? 0x78716c : kit === "islands" ? 0xca8a04 : 0x92400e;
    const braceCol = kit === "steppe" ? 0xa8a29e : kit === "islands" ? 0x0284c7 : 0xb45309;

    g.moveTo(ax - 3.5, ay - 7.5); g.lineTo(ax - 3.5, ay + 0.5);
    g.moveTo(ax + 3.5, ay - 7.5); g.lineTo(ax + 3.5, ay + 0.5);
    g.moveTo(ax, ay - 9); g.lineTo(ax, ay + 2.5);
    g.stroke({ width: 0.9, color: poleCol });

    // Horizontal ledger beams
    g.moveTo(ax - 3.5, ay - 2); g.lineTo(ax, ay); g.lineTo(ax + 3.5, ay - 2);
    g.stroke({ width: 0.8, color: ledgerCol });
    g.moveTo(ax - 3.5, ay - 5.5); g.lineTo(ax, ay - 3.5); g.lineTo(ax + 3.5, ay - 5.5);
    g.stroke({ width: 0.8, color: ledgerCol });

    // Diagonal X-bracing
    g.moveTo(ax - 3.5, ay - 5.5); g.lineTo(ax, ay);
    g.moveTo(ax - 3.5, ay - 2); g.lineTo(ax, ay - 3.5);
    g.stroke({ width: 0.6, color: braceCol, alpha: 0.85 });
    g.moveTo(ax, ay - 3.5); g.lineTo(ax + 3.5, ay - 2);
    g.moveTo(ax, ay); g.lineTo(ax + 3.5, ay - 5.5);
    g.stroke({ width: 0.6, color: poleCol, alpha: 0.85 });

    // Planks work staging deck
    g.poly([ax - 4, ay - 4, ax, ay - 2.2, ax + 4, ay - 4, ax, ay - 5.5]);
    g.fill({ color: braceCol });
    g.stroke({ width: 0.5, color: poleCol });

    // Hoist line and suspended building block
    g.moveTo(ax + 1, ay - 8.5); g.lineTo(ax + 1, ay - 4.5);
    g.stroke({ width: 0.6, color: 0xe2e8f0 });
    g.rect(ax + 0.2, ay - 4.5, 1.8, 1.8);
    g.fill({ color: 0x94a3b8 });
    g.stroke({ width: 0.4, color: 0x334155 });
    return;
  }

  // -------------------------------------------------------------
  // Finished keep-yard building: small architectural annex
  // -------------------------------------------------------------
  // Culture kit palettes
  let wallLight = 0x94a3b8;
  let wallDark = 0x475569;
  let plinthCol = 0x1e293b;
  let roofLight = 0x854d0e;
  let roofDark = 0x5c3818;
  let strokeCol = 0x0f172a;

  if (kit === "cedar") {
    wallLight = 0xa16207;
    wallDark = 0x451a03;
    plinthCol = 0x292524;
    roofLight = 0x92400e;
    roofDark = 0x78350f;
    strokeCol = 0x1c0f05;
  } else if (kit === "sand") {
    wallLight = 0xf5ebe0;
    wallDark = 0xa16207;
    plinthCol = 0x78531e;
    roofLight = 0xd97706;
    roofDark = 0xb45309;
    strokeCol = 0x451a03;
  } else if (kit === "steppe") {
    wallLight = 0xf5f5f4;
    wallDark = 0x78716c;
    plinthCol = 0x292524;
    roofLight = 0xffffff;
    roofDark = 0xd6d3d1;
    strokeCol = 0x44403c;
  } else if (kit === "islands") {
    wallLight = 0xa8a29e;
    wallDark = 0x57534e;
    plinthCol = 0x292524;
    roofLight = 0x06b6d4;
    roofDark = 0x0e7490;
    strokeCol = 0x155e75;
  }

  // Type-specific adjustments
  const isMilitary = typeId === "barracks" || typeId === "archery_range" || typeId === "siege_workshop";
  const isReligious = typeId === "chapel" || typeId === "infirmary";
  const isIndustry = typeId === "sawmill" || typeId === "lumber" || typeId === "lumber_camp";
  const isStore = typeId === "granary" || typeId === "farm";
  const isStone = typeId === "mason" || typeId === "quarry";

  if (isMilitary && kit === "western") {
    roofLight = 0x94a3b8;
    roofDark = 0x64748b;
  } else if (isReligious && kit === "western") {
    roofLight = 0x334155;
    roofDark = 0x1e293b;
  }

  // 1. Foundation plinth
  g.poly([ax - 4.5, ay + 0.8, ax, ay + 2.8, ax + 4.5, ay + 0.8, ax, ay - 1.2]);
  g.fill({ color: plinthCol });
  g.stroke({ width: 0.6, color: strokeCol });

  // 2. Isometric walls
  // Left facet (sunlit)
  g.poly([ax - 4, ay + 0.5, ax, ay + 2.5, ax, ay - 3.8, ax - 4, ay - 5.8]);
  g.fill({ color: wallLight });
  g.stroke({ width: 0.6, color: strokeCol });
  // Right facet (shaded)
  g.poly([ax, ay + 2.5, ax + 4, ay + 0.5, ax + 4, ay - 5.8, ax, ay - 3.8]);
  g.fill({ color: wallDark });
  g.stroke({ width: 0.6, color: strokeCol });

  // Corner dividing seam
  g.moveTo(ax, ay - 3.8); g.lineTo(ax, ay + 2.5);
  g.stroke({ width: 0.8, color: strokeCol });

  // 3. Roof / Parapet
  if (isMilitary && kit === "western") {
    // Crenellated stone parapet wing
    g.rect(ax - 4, ay - 7.5, 2, 2.2); g.fill({ color: roofLight }); g.stroke({ width: 0.5, color: strokeCol });
    g.rect(ax + 2, ay - 7.5, 2, 2.2); g.fill({ color: roofDark }); g.stroke({ width: 0.5, color: strokeCol });
    // Red shield crest on front wall
    g.poly([ax - 2.5, ay - 1.5, ax - 1, ay - 0.5, ax - 1, ay - 3, ax - 2.5, ay - 4]);
    g.fill({ color: 0xb91c1c });
  } else {
    // Gabled / hipped roof with eaves
    g.poly([ax - 5, ay - 5.5, ax, ay - 9.5, ax + 5, ay - 5.5, ax, ay - 3.5]);
    g.fill({ color: roofDark });
    g.stroke({ width: 0.7, color: strokeCol });
    // Left roof pitch
    g.poly([ax - 5, ay - 5.5, ax, ay - 9.5, ax, ay - 3.5]);
    g.fill({ color: roofLight });
  }

  // 4. Doorway / warm window
  g.rect(ax - 1.2, ay - 0.2, 2.4, 2.4);
  g.fill({ color: 0x18181b });
  // Warm candlelit window / hearth glow inside
  const glow = 0.8 + Math.sin(phase * 4 + ax) * 0.2;
  g.circle(ax, ay + 0.8, 0.7);
  g.fill({ color: 0xfef08a, alpha: glow });

  // 5. Distinctive yard annex details
  if (isStore) {
    // Grain sack / hay bundle
    g.circle(ax + 2.6, ay + 1.2, 0.9);
    g.fill({ color: 0xd97706 });
  } else if (isIndustry) {
    // Stacked firewood logs
    g.rect(ax + 2, ay + 0.6, 2.2, 1.2);
    g.fill({ color: 0x92400e });
  } else if (isStone) {
    // Cut ashlar block
    g.rect(ax + 2, ay + 0.6, 1.6, 1.4);
    g.fill({ color: 0x94a3b8 });
  } else if (isReligious) {
    // Tiny golden cross atop gable
    g.moveTo(ax, ay - 11); g.lineTo(ax, ay - 9.5);
    g.stroke({ width: 0.7, color: 0xfacc15 });
  }
}

// -------------------------------------------------------------
// Small Heraldic Realm Crest Above Rival / NPC Capital Keeps
// -------------------------------------------------------------
export function drawRealmCrestAboveKeep(
  g: Graphics,
  cx: number,
  cy: number,
  pal: RealmTokenPalette,
  phase = 0
): void {
  const crestY = cy - 23.5;

  // 1. Drop shadow onto keep / air
  g.poly([
    cx - 4.5, crestY - 4,
    cx + 4.5, crestY - 4,
    cx + 4.5, crestY + 1,
    cx, crestY + 5.5,
    cx - 4.5, crestY + 1,
  ]);
  g.fill({ color: 0x050403, alpha: 0.65 });

  // 2. Escutcheon rim plaque
  g.poly([
    cx - 4.5, crestY - 4.5,
    cx + 4.5, crestY - 4.5,
    cx + 4.5, crestY + 0.5,
    cx, crestY + 5,
    cx - 4.5, crestY + 0.5,
  ]);
  g.fill({ color: pal.plaqueColor || 0x18181b });
  g.stroke({ width: 0.9, color: pal.borderColor });

  // 3. Inner shield field (faction primary color)
  g.poly([
    cx - 3.5, crestY - 3.5,
    cx + 3.5, crestY - 3.5,
    cx + 3.5, crestY + 0.2,
    cx, crestY + 4,
    cx - 3.5, crestY + 0.2,
  ]);
  g.fill({ color: pal.pennantColor });

  // 4. Subtle inner border accent
  g.poly([
    cx - 3.5, crestY - 3.5,
    cx + 3.5, crestY - 3.5,
    cx + 3.5, crestY + 0.2,
    cx, crestY + 4,
    cx - 3.5, crestY + 0.2,
  ]);
  g.stroke({ width: 0.5, color: pal.accentColor, alpha: 0.5 });

  // 5. Faction Sigil / Charge
  switch (pal.realmId) {
    case "rival": {
      // Iron March: Crossed blades & crimson rivet
      g.moveTo(cx - 2.2, crestY - 2.2); g.lineTo(cx + 2.2, crestY + 2.2);
      g.stroke({ width: 0.8, color: 0xf4f4f5 });
      g.moveTo(cx + 2.2, crestY - 2.2); g.lineTo(cx - 2.2, crestY + 2.2);
      g.stroke({ width: 0.8, color: 0xf4f4f5 });
      g.circle(cx, crestY, 0.8); g.fill({ color: 0xef4444 });
      g.circle(cx, crestY, 0.4); g.fill({ color: 0xfef08a });
      break;
    }
    case "k_silk": {
      // Silk Coast: Golden anchor / trident
      g.moveTo(cx, crestY - 2.5); g.lineTo(cx, crestY + 2.5);
      g.stroke({ width: 0.8, color: 0xf1c40f });
      g.moveTo(cx - 1.6, crestY - 1); g.lineTo(cx + 1.6, crestY - 1);
      g.stroke({ width: 0.7, color: 0xf1c40f });
      g.moveTo(cx - 1.8, crestY + 0.8);
      g.bezierCurveTo(cx - 1.8, crestY + 2.4, cx + 1.8, crestY + 2.4, cx + 1.8, crestY + 0.8);
      g.stroke({ width: 0.8, color: 0xf1c40f });
      g.circle(cx, crestY - 2.5, 0.6); g.fill({ color: 0xfef08a });
      break;
    }
    case "k_ash": {
      // Ash Nomads: Peaked steppe nomad arrowhead
      g.poly([cx, crestY - 2.8, cx + 2.2, crestY + 1.8, cx - 2.2, crestY + 1.8]);
      g.fill({ color: 0xe67e22 });
      g.stroke({ width: 0.6, color: 0x7c2d12 });
      g.poly([cx, crestY - 1.5, cx + 1.1, crestY + 1.2, cx - 1.1, crestY + 1.2]);
      g.fill({ color: 0xfde047 });
      break;
    }
    case "k_veil": {
      // Veil Theocracy: Radiant dawn star
      g.poly([
        cx, crestY - 3,
        cx + 0.8, crestY - 0.8,
        cx + 2.8, crestY,
        cx + 0.8, crestY + 0.8,
        cx, crestY + 3,
        cx - 0.8, crestY + 0.8,
        cx - 2.8, crestY,
        cx - 0.8, crestY - 0.8,
      ]);
      g.fill({ color: 0xffffff });
      g.stroke({ width: 0.5, color: 0xa78bfa });
      g.circle(cx, crestY, 0.5); g.fill({ color: 0x7c3aed });
      break;
    }
    case "k_glass": {
      // Glass Cities: Faceted cyan prism diamond
      g.poly([cx, crestY - 2.8, cx + 2.2, crestY, cx, crestY + 2.8, cx - 2.2, crestY]);
      g.fill({ color: 0x06b6d4 });
      g.stroke({ width: 0.6, color: 0x38bdf8 });
      g.poly([cx, crestY - 1.6, cx + 1.2, crestY, cx, crestY + 1.6, cx - 1.2, crestY]);
      g.fill({ color: 0xffffff });
      break;
    }
    case "k_frost": {
      // Frost Holds: Six-pointed frost crystal
      g.moveTo(cx, crestY - 2.6); g.lineTo(cx, crestY + 2.6);
      g.stroke({ width: 0.7, color: 0xffffff });
      g.moveTo(cx - 2.2, crestY - 1.3); g.lineTo(cx + 2.2, crestY + 1.3);
      g.stroke({ width: 0.7, color: 0xffffff });
      g.moveTo(cx - 2.2, crestY + 1.3); g.lineTo(cx + 2.2, crestY - 1.3);
      g.stroke({ width: 0.7, color: 0xffffff });
      g.circle(cx, crestY, 0.6); g.fill({ color: 0x7dd3fc });
      break;
    }
    case "k_tide": {
      // Tide Princes: Twin ocean surf waves
      g.moveTo(cx - 2.4, crestY - 1);
      g.bezierCurveTo(cx - 1.2, crestY - 2.4, cx, crestY + 0.2, cx + 2.4, crestY - 1);
      g.stroke({ width: 0.8, color: 0x2dd4bf });
      g.moveTo(cx - 2.4, crestY + 1.4);
      g.bezierCurveTo(cx - 1.2, crestY - 0.2, cx, crestY + 2.4, cx + 2.4, crestY + 1.4);
      g.stroke({ width: 0.8, color: 0x5eead4 });
      break;
    }
    case "k_ember": {
      // Ember Concord: Rising flame comet
      g.circle(cx, crestY + 1.2, 1.2); g.fill({ color: 0xea580c });
      g.poly([cx - 1.3, crestY + 1.2, cx, crestY - 3, cx + 1.3, crestY + 1.2]);
      g.fill({ color: 0xf97316 });
      g.circle(cx, crestY + 0.8, 0.5); g.fill({ color: 0xfef08a });
      break;
    }
    case "k_bronze": {
      // Bronze League: Classical bronze arch & anvil
      g.moveTo(cx - 2.0, crestY + 1.3);
      g.bezierCurveTo(cx - 2.0, crestY - 2.2, cx + 2.0, crestY - 2.2, cx + 2.0, crestY + 1.3);
      g.stroke({ width: 0.8, color: 0xfbbf24 });
      g.moveTo(cx - 2.2, crestY + 1.3); g.lineTo(cx - 1.1, crestY + 1.3);
      g.stroke({ width: 0.8, color: 0xfbbf24 });
      g.moveTo(cx + 1.1, crestY + 1.3); g.lineTo(cx + 2.2, crestY + 1.3);
      g.stroke({ width: 0.8, color: 0xfbbf24 });
      g.circle(cx, crestY - 0.3, 0.6); g.fill({ color: 0xfde68a });
      break;
    }
    default: {
      // Fallback: Chevron & stud
      g.poly([cx - 2.2, crestY + 1.6, cx, crestY - 1.2, cx + 2.2, crestY + 1.6]);
      g.stroke({ width: 0.8, color: pal.accentColor });
      g.circle(cx, crestY - 0.6, 0.7); g.fill({ color: pal.studColor });
      break;
    }
  }

  // 6. Finial crown topper stud atop the crest shield
  g.poly([
    cx - 1.8, crestY - 4.5,
    cx, crestY - 6.2,
    cx + 1.8, crestY - 4.5,
  ]);
  g.fill({ color: pal.studColor });
  g.stroke({ width: 0.5, color: pal.borderColor });
  g.circle(cx, crestY - 6.2, 0.6); g.fill({ color: 0xffffff });

  // 7. Subtle animated breathing glint on left corner
  const glint = 0.5 + Math.sin(phase * 3 + cx) * 0.35;
  g.circle(cx - 2.8, crestY - 2.6, 0.6);
  g.fill({ color: 0xffffff, alpha: glint });
}

// -------------------------------------------------------------
// Miniature Pixel Keeps for Board-Band Holds (Lords Mobile Style)
// Reuses Authentic Culture Kit Silhouettes at Miniature Scale (~0.42x)
// High-Readability Foundations, High-Contrast Lighting & Heraldry
// -------------------------------------------------------------
export function drawMiniatureKeep(
  g: Graphics,
  cx: number,
  cy: number,
  kit: CultureKit,
  realmPal?: RealmTokenPalette,
  isHome = false,
  phase = 0,
  options?: MiniatureKeepOptions
): void {
  // 0. Ambient ground contact shadow (detaches keep from busy terrain relief)
  g.ellipse(cx, cy + 4, 11, 4.5);
  g.fill({ color: 0x050403, alpha: 0.62 });

  // If this is a rival (Iron March) hold
  if (realmPal?.realmId === "rival") {
    // Spiked Blackened Iron Keep
    const ironPlinth = 0x18181b;
    const ironWallLight = 0x52525b;
    const ironWallDark = 0x18181b;
    const ironBattlement = 0x3f3f46;

    // Foundation talus with dark border
    g.poly([cx - 8.5, cy + 2.5, cx, cy + 6.5, cx + 8.5, cy + 2.5, cx, cy - 0.5]);
    g.fill({ color: ironPlinth });
    g.stroke({ width: 0.9, color: 0x09090b });

    // Main tower walls (left cold gunmetal, right obsidian iron)
    g.poly([cx - 7, cy + 1, cx, cy + 4, cx, cy - 9, cx - 7, cy - 12]);
    g.fill({ color: ironWallLight });
    g.stroke({ width: 0.8, color: 0x09090b });
    g.poly([cx, cy + 4, cx + 7, cy + 1, cx + 7, cy - 12, cx, cy - 9]);
    g.fill({ color: ironWallDark });
    g.stroke({ width: 0.8, color: 0x09090b });

    // Vertical dividing corner seam
    g.moveTo(cx, cy - 9); g.lineTo(cx, cy + 4);
    g.stroke({ width: 1, color: 0x09090b });

    // Iron rivets on tower
    g.circle(cx - 4, cy - 4, 0.9); g.fill({ color: 0xa1a1aa });
    g.circle(cx + 4, cy - 4, 0.9); g.fill({ color: 0x52525b });
    g.circle(cx - 4, cy + 0.5, 0.9); g.fill({ color: 0xa1a1aa });
    g.circle(cx + 4, cy + 0.5, 0.9); g.fill({ color: 0x52525b });

    // Spiked iron battlements with sharpened steel tips
    g.poly([cx - 7, cy - 12, cx - 5, cy - 17, cx - 3, cy - 12]);
    g.fill({ color: ironBattlement });
    g.stroke({ width: 0.7, color: 0x09090b });
    g.circle(cx - 5, cy - 17, 0.7); g.fill({ color: 0xe4e4e7 });

    g.poly([cx - 2, cy - 12, cx, cy - 16, cx + 2, cy - 12]);
    g.fill({ color: ironBattlement });
    g.stroke({ width: 0.7, color: 0x09090b });
    g.circle(cx, cy - 16, 0.7); g.fill({ color: 0xe4e4e7 });

    g.poly([cx + 3, cy - 12, cx + 5, cy - 17, cx + 7, cy - 12]);
    g.fill({ color: 0x27272a });
    g.stroke({ width: 0.7, color: 0x09090b });
    g.circle(cx + 5, cy - 17, 0.7); g.fill({ color: 0xd4d4d8 });

    // Sinister glowing crimson eye-slit gate
    g.rect(cx - 2.5, cy - 0.5, 5, 4.5);
    g.fill({ color: 0x09090b });
    g.rect(cx - 2, cy + 1, 4, 1.8);
    g.fill({ color: 0x7f1d1d });
    g.rect(cx - 1.5, cy + 1.2, 3, 1.2);
    g.fill({ color: 0xef4444 });
    g.circle(cx, cy + 1.8, 0.7);
    g.fill({ color: 0xfef08a });

    // Waving blood-red spiked war pennant
    const wave = Math.sin(phase * 4 + cx) * 1.8;
    g.moveTo(cx, cy - 9); g.lineTo(cx, cy - 20);
    g.stroke({ width: 1.3, color: 0x3f3f46 });
    g.circle(cx, cy - 20.5, 0.9); g.fill({ color: 0x71717a });
    g.poly([
      cx, cy - 20,
      cx + 8 + wave, cy - 16.5,
      cx + 5 + wave * 0.6, cy - 14,
      cx + 8 + wave, cy - 11.5,
      cx, cy - 11.5,
    ]);
    g.fill({ color: 0x991b1b });
    g.stroke({ width: 0.7, color: 0x450a0a });
    drawRealmCrestAboveKeep(g, cx, cy, realmPal, phase);
    return;
  }

  // Keep yard annexes and scaffolding for home hold
  const yard = options?.yardBuildings ?? (isHome && options?.state ? listKeepYardBuildings(options.state) : []);
  const rearAnnexes = yard.filter((a) => a.slot === "west" || a.slot === "north");
  const frontAnnexes = yard.filter((a) => a.slot === "south" || a.slot === "east");

  // 1. Draw rear annexes / scaffolding (behind keep)
  for (const annex of rearAnnexes) {
    drawKeepYardAnnex(g, cx, cy, annex, kit, phase);
  }

  // Culture-specific miniature pixel keeps
  switch (kit) {
    case "cedar": {
      // Cedar Kin: Miniature Timber Longhouse Keep on Riverstone Plinth
      const timberLight = 0xa16207;
      const timberDark = 0x451a03;
      const timberPlinth = 0x292524;
      const roofShake = 0x78350f;
      const flagCol = realmPal ? realmPal.pennantColor : 0x14532d;

      // Riverstone plinth with stone outline
      g.poly([cx - 8.5, cy + 2.5, cx, cy + 6.5, cx + 8.5, cy + 2.5, cx, cy - 0.5]);
      g.fill({ color: timberPlinth });
      g.stroke({ width: 0.8, color: 0x1c1917 });

      g.circle(cx - 5, cy + 3.2, 1); g.fill({ color: 0x57534e });
      g.circle(cx, cy + 4.5, 1.1); g.fill({ color: 0x78350f });
      g.circle(cx + 5, cy + 3.2, 1); g.fill({ color: 0x44403c });

      // Cross-lap log walls (left golden cedar, right dark bark shadow)
      g.poly([cx - 7, cy + 1, cx, cy + 4, cx, cy - 7, cx - 7, cy - 10]);
      g.fill({ color: timberLight });
      g.stroke({ width: 0.8, color: 0x451a03 });
      g.poly([cx, cy + 4, cx + 7, cy + 1, cx + 7, cy - 10, cx, cy - 7]);
      g.fill({ color: timberDark });
      g.stroke({ width: 0.8, color: 0x1c0f05 });

      // Vertical center seam
      g.moveTo(cx, cy - 7); g.lineTo(cx, cy + 4);
      g.stroke({ width: 1, color: 0x3f1d0b });

      // Hewn log horizontal courses
      for (const my of [cy - 4.5, cy - 1.5, cy + 1.5]) {
        g.moveTo(cx - 7, my - 2); g.lineTo(cx, my); g.lineTo(cx + 7, my - 2);
        g.stroke({ width: 0.9, color: 0x271306, alpha: 0.85 });
      }

      // Steep pitched cedar-shake gabled roof
      g.poly([cx - 9.5, cy - 7.5, cx, cy - 15.5, cx + 9.5, cy - 7.5, cx, cy - 4.5]);
      g.fill({ color: roofShake });
      g.stroke({ width: 1, color: 0x3f1d0b });

      // Left illuminated roof slope
      g.poly([cx - 9.5, cy - 7.5, cx, cy - 15.5, cx, cy - 4.5]);
      g.fill({ color: 0x92400e });

      // Shingle texture highlights
      g.moveTo(cx - 6, cy - 9.5); g.lineTo(cx, cy - 7.5); g.stroke({ width: 0.7, color: 0xb45309 });
      g.moveTo(cx - 3, cy - 12); g.lineTo(cx, cy - 10); g.stroke({ width: 0.7, color: 0xb45309 });

      // Golden eagle ridgepole finials
      g.poly([cx, cy - 15.5, cx - 2.5, cy - 19, cx, cy - 17.5, cx + 2.5, cy - 19]);
      g.fill({ color: 0xfacc15 });
      g.stroke({ width: 0.7, color: 0x78350f });
      g.circle(cx, cy - 17.5, 0.7); g.fill({ color: 0xfef08a });

      // Timber doorway with warm hearth fire glow
      g.rect(cx - 2, cy - 0.5, 4, 4);
      g.fill({ color: 0x1c1008 });
      g.rect(cx - 1.2, cy + 0.5, 2.4, 2.8);
      g.fill({ color: 0xd97706 });
      g.circle(cx, cy + 1.8, 0.8);
      g.fill({ color: 0xfef08a });

      // Waving cedar pennant
      const cWave = Math.sin(phase * 4 + cx) * 1.8;
      g.moveTo(cx, cy - 15.5); g.lineTo(cx, cy - 21);
      g.stroke({ width: 1.2, color: 0x3f220c });
      g.circle(cx, cy - 21.5, 0.8); g.fill({ color: 0xfacc15 });
      g.poly([cx, cy - 21, cx + 7 + cWave, cy - 18, cx, cy - 15.5]);
      g.fill({ color: flagCol });
      g.stroke({ width: 0.6, color: 0x1c1917 });
      break;
    }

    case "sand": {
      // Sand Banner: Miniature Sunbleached Limestone Courtyard Keep + Lookout Minaret
      const sandPlinth = 0x78531e;
      const sandLight = 0xf5ebe0;
      const sandDark = 0xa16207;
      const flagCol = realmPal ? realmPal.pennantColor : 0xb45309;

      // Terraced foundation plinth
      g.poly([cx - 8.5, cy + 2.5, cx, cy + 6.5, cx + 8.5, cy + 2.5, cx, cy - 0.5]);
      g.fill({ color: sandPlinth });
      g.stroke({ width: 0.8, color: 0x451a03 });

      // Main limestone hold (left ivory, right sandstone shadow)
      g.poly([cx - 7, cy + 1, cx, cy + 4, cx, cy - 8, cx - 7, cy - 11]);
      g.fill({ color: sandLight });
      g.stroke({ width: 0.8, color: 0x5c4217 });
      g.poly([cx, cy + 4, cx + 7, cy + 1, cx + 7, cy - 11, cx, cy - 8]);
      g.fill({ color: sandDark });
      g.stroke({ width: 0.8, color: 0x5c4217 });

      // Vertical dividing seam
      g.moveTo(cx, cy - 8); g.lineTo(cx, cy + 4);
      g.stroke({ width: 1, color: 0x5c4217 });

      // Flat roof parapet with sawtooth merlons
      g.rect(cx - 7.5, cy - 12, 15, 2.5);
      g.fill({ color: 0xe6d5ac });
      g.stroke({ width: 0.8, color: 0x5c4217 });
      g.rect(cx - 6.5, cy - 14.5, 2.5, 2.5); g.fill({ color: sandLight }); g.stroke({ width: 0.6, color: 0x5c4217 });
      g.rect(cx - 1.2, cy - 14.5, 2.4, 2.5); g.fill({ color: sandLight }); g.stroke({ width: 0.6, color: 0x5c4217 });
      g.rect(cx + 4, cy - 14.5, 2.5, 2.5); g.fill({ color: sandDark }); g.stroke({ width: 0.6, color: 0x5c4217 });

      // Corner lookout minaret turret with golden dome
      g.rect(cx + 4, cy - 18, 4, 6.5);
      g.fill({ color: sandLight });
      g.stroke({ width: 0.8, color: 0x5c4217 });
      g.circle(cx + 6, cy - 19, 2.4);
      g.fill({ color: 0xfacc15 });
      g.stroke({ width: 0.7, color: 0x78350f });
      g.circle(cx + 5.3, cy - 19.8, 0.8);
      g.fill({ color: 0xffffff }); // specular dome glint
      g.moveTo(cx + 6, cy - 21.4); g.lineTo(cx + 6, cy - 23);
      g.stroke({ width: 0.8, color: 0xfacc15 }); // crescent spire

      // Horseshoe arched portal
      g.poly([cx - 2, cy + 3.5, cx - 2, cy, cx, cy - 1.8, cx + 2, cy, cx + 2, cy + 3.5]);
      g.fill({ color: 0x1c1008 });
      g.circle(cx, cy - 1.8, 0.7); g.fill({ color: 0xfacc15 }); // keystone

      // Waving desert silk standard
      const sWave = Math.sin(phase * 4 + cx) * 1.8;
      g.moveTo(cx - 4, cy - 12); g.lineTo(cx - 4, cy - 20);
      g.stroke({ width: 1.2, color: 0x78531e });
      g.circle(cx - 4, cy - 20.5, 0.8); g.fill({ color: 0xfacc15 });
      g.poly([cx - 4, cy - 20, cx + 4 + sWave, cy - 17, cx - 4, cy - 14]);
      g.fill({ color: flagCol });
      g.stroke({ width: 0.6, color: 0x451a03 });
      break;
    }

    case "steppe": {
      // Wind Host: Miniature Great Hall on Mound + Conical Dome + Horsehair Standard
      const moundColor = 0x292524;
      const wallLight = 0xffffff;
      const wallDark = 0x78716c;
      const flagCol = realmPal ? realmPal.pennantColor : 0x9f1239;

      // Packed earthen kurgan mound
      g.ellipse(cx, cy + 3.5, 9.5, 4.8);
      g.fill({ color: moundColor });
      g.stroke({ width: 0.8, color: 0x1c1917 });

      // Circular felt yurt wall (left bleached wool, right shaded felt)
      g.poly([cx - 7.5, cy + 2, cx, cy + 4.5, cx, cy - 3, cx - 7.5, cy - 5]);
      g.fill({ color: wallLight });
      g.stroke({ width: 0.8, color: 0x44403c });
      g.poly([cx, cy + 4.5, cx + 7.5, cy + 2, cx + 7.5, cy - 5, cx, cy - 3]);
      g.fill({ color: wallDark });
      g.stroke({ width: 0.8, color: 0x44403c });

      // Center dividing seam
      g.moveTo(cx, cy - 3); g.lineTo(cx, cy + 4.5);
      g.stroke({ width: 1, color: 0x44403c });

      // Decorative crimson felt geometric bands
      g.moveTo(cx - 7.5, cy - 1); g.lineTo(cx, cy + 0.8); g.lineTo(cx + 7.5, cy - 1);
      g.stroke({ width: 1.5, color: 0xbe123c });
      g.moveTo(cx - 7.5, cy - 4); g.lineTo(cx, cy - 2.2); g.lineTo(cx + 7.5, cy - 4);
      g.stroke({ width: 0.8, color: 0x9f1239 });

      // Conical yurt roof canopy
      g.poly([cx - 8.5, cy - 4, cx, cy - 14, cx + 8.5, cy - 4, cx, cy - 2]);
      g.fill({ color: 0xf5f5f4 });
      g.stroke({ width: 0.9, color: 0x44403c });
      g.poly([cx - 8.5, cy - 4, cx, cy - 14, cx, cy - 2]);
      g.fill({ color: 0xffffff });

      // Radial tension ribs
      g.moveTo(cx, cy - 14); g.lineTo(cx - 5, cy - 3); g.stroke({ width: 0.7, color: 0xa8a29e });
      g.moveTo(cx, cy - 14); g.lineTo(cx + 5, cy - 3); g.stroke({ width: 0.7, color: 0x78350f });

      // Central carved timber smoke crown (shangyrak)
      g.circle(cx, cy - 14, 2.2);
      g.fill({ color: 0x78350f });
      g.stroke({ width: 0.8, color: 0x451a03 });
      g.circle(cx, cy - 14, 0.9);
      g.fill({ color: 0xf59e0b });

      // Wooden door frame
      g.rect(cx - 2, cy - 0.2, 4, 4);
      g.fill({ color: 0x451a03 });
      g.rect(cx - 1.2, cy + 0.5, 2.4, 3);
      g.fill({ color: 0x9a3412 });

      // Tall horsehair banner pole
      const stWave = Math.sin(phase * 4 + cx) * 1.8;
      g.moveTo(cx + 6.5, cy + 2); g.lineTo(cx + 6.5, cy - 19);
      g.stroke({ width: 1.3, color: 0x451a03 });
      g.circle(cx + 6.5, cy - 19.5, 0.8); g.fill({ color: 0xd4a359 });
      g.poly([cx + 6.5, cy - 19, cx + 13 + stWave, cy - 16, cx + 6.5, cy - 13.5]);
      g.fill({ color: flagCol });
      g.stroke({ width: 0.6, color: 0x451a03 });
      break;
    }

    case "islands": {
      // Tide Clans: Miniature Stilt Pile-House Keep on Driftwood Pilings
      const deckPlinth = 0x44403c;
      const reedLight = 0xa8a29e;
      const reedDark = 0x57534e;
      const thatchRoof = 0x0e7490;
      const flagCol = realmPal ? realmPal.pennantColor : 0x0e7490;

      // Elevated timber pilings with cross-brace
      g.moveTo(cx - 6.5, cy + 4.5); g.lineTo(cx - 6.5, cy);
      g.moveTo(cx - 1, cy + 5.5); g.lineTo(cx - 1, cy + 1);
      g.moveTo(cx + 5, cy + 4.5); g.lineTo(cx + 5, cy);
      g.stroke({ width: 1.6, color: 0x292524 });
      g.moveTo(cx - 6.5, cy + 4); g.lineTo(cx - 1, cy + 1.5);
      g.stroke({ width: 0.8, color: 0x1c1917 });

      // Elevated platform deck
      g.poly([cx - 8.5, cy, cx, cy + 3.8, cx + 8.5, cy, cx, cy - 3.2]);
      g.fill({ color: deckPlinth });
      g.stroke({ width: 0.9, color: 0x1c1917 });

      // Slatted stilt cabin walls (left salt-bleached cedar, right shadow drift)
      g.poly([cx - 6.5, cy - 1, cx, cy + 1.8, cx, cy - 8, cx - 6.5, cy - 10.5]);
      g.fill({ color: reedLight });
      g.stroke({ width: 0.8, color: 0x292524 });
      g.poly([cx, cy + 1.8, cx + 6.5, cy - 1, cx + 6.5, cy - 10.5, cx, cy - 8]);
      g.fill({ color: reedDark });
      g.stroke({ width: 0.8, color: 0x292524 });

      // Center seam
      g.moveTo(cx, cy - 8); g.lineTo(cx, cy + 1.8);
      g.stroke({ width: 1, color: 0x292524 });

      // Multi-tiered woven pavilion roof in vibrant ocean teal
      g.poly([cx - 9, cy - 8, cx, cy - 16, cx + 9, cy - 8, cx, cy - 5.5]);
      g.fill({ color: thatchRoof });
      g.stroke({ width: 1, color: 0x155e75 });
      g.poly([cx - 9, cy - 8, cx, cy - 16, cx, cy - 5.5]);
      g.fill({ color: 0x06b6d4 });
      g.moveTo(cx - 5, cy - 10); g.lineTo(cx, cy - 8.5);
      g.stroke({ width: 0.8, color: 0x67e8f9 });

      // Wave crest finial
      g.circle(cx, cy - 16.5, 1.8);
      g.fill({ color: 0x38bdf8 });
      g.stroke({ width: 0.6, color: 0x0284c7 });
      g.circle(cx, cy - 16.5, 0.7);
      g.fill({ color: 0xffffff });

      // Hanging glowing sea lantern
      g.moveTo(cx - 5, cy - 8); g.lineTo(cx - 5, cy - 4.5);
      g.stroke({ width: 0.8, color: 0x292524 });
      g.circle(cx - 5, cy - 4.5, 2.4);
      g.fill({ color: 0xfde047, alpha: 0.4 });
      g.circle(cx - 5, cy - 4.5, 1.3);
      g.fill({ color: 0xfef08a });

      // Waving ocean swallowtail pennant
      const iWave = Math.sin(phase * 4 + cx) * 1.8;
      g.moveTo(cx, cy - 16); g.lineTo(cx, cy - 21.5);
      g.stroke({ width: 1.2, color: 0x292524 });
      g.circle(cx, cy - 22, 0.8); g.fill({ color: 0x38bdf8 });
      g.poly([cx, cy - 21.5, cx + 8 + iWave, cy - 18.5, cx + 4.5 + iWave * 0.5, cy - 16.5, cx, cy - 16.5]);
      g.fill({ color: flagCol });
      g.stroke({ width: 0.6, color: 0x155e75 });
      break;
    }

    default: {
      // Western Crown Marches: Miniature Ashlar Stone Keep Tower + Bartizans + Crenellations
      const stonePlinth = 0x1e293b;
      const stoneLight = 0x94a3b8;
      const stoneDark = 0x334155;
      const bartizanLight = 0xcbd5e1;
      const bartizanDark = 0x475569;
      const flagCol = realmPal ? realmPal.pennantColor : isHome ? 0x1e40af : 0xb91c1c;

      // 1. Foundation talus plinth with dark border
      g.poly([cx - 8.5, cy + 2.5, cx, cy + 6.5, cx + 8.5, cy + 2.5, cx, cy - 0.5]);
      g.fill({ color: stonePlinth });
      g.stroke({ width: 0.8, color: 0x0f172a });

      // 2. Main Stone Hold Tower Walls (left granite with corner quoins, right shadowed slate)
      g.poly([cx - 7, cy + 1, cx, cy + 4, cx, cy - 9, cx - 7, cy - 12]);
      g.fill({ color: stoneLight });
      g.stroke({ width: 0.8, color: 0x1e293b });
      g.poly([cx, cy + 4, cx + 7, cy + 1, cx + 7, cy - 12, cx, cy - 9]);
      g.fill({ color: stoneDark });
      g.stroke({ width: 0.8, color: 0x0f172a });

      // Quoins on left outer corner
      g.rect(cx - 7, cy - 10, 1.6, 2); g.fill({ color: 0xcbd5e1 });
      g.rect(cx - 7, cy - 6, 1.6, 2); g.fill({ color: 0xcbd5e1 });
      g.rect(cx - 7, cy - 2, 1.6, 2); g.fill({ color: 0xcbd5e1 });

      // Center dividing seam
      g.moveTo(cx, cy - 9); g.lineTo(cx, cy + 4);
      g.stroke({ width: 1.1, color: 0x0f172a });

      // Horizontal masonry course lines
      g.moveTo(cx - 7, cy - 5); g.lineTo(cx, cy - 2.5); g.lineTo(cx + 7, cy - 5);
      g.stroke({ width: 0.8, color: 0x1e293b, alpha: 0.75 });
      g.moveTo(cx - 7, cy - 1); g.lineTo(cx, cy + 1.5); g.lineTo(cx + 7, cy - 1);
      g.stroke({ width: 0.8, color: 0x1e293b, alpha: 0.75 });

      // 3. Corner Watch Bartizans
      g.poly([cx - 8, cy - 10, cx - 5.5, cy - 8.5, cx - 5.5, cy - 14, cx - 8, cy - 15]);
      g.fill({ color: bartizanLight });
      g.stroke({ width: 0.6, color: 0x1e293b });
      g.poly([cx - 8, cy - 15, cx - 5.5, cy - 14, cx - 6.8, cy - 17.5]);
      g.fill({ color: stonePlinth });
      g.circle(cx - 6.8, cy - 17.5, 0.6); g.fill({ color: 0xfacc15 });

      g.poly([cx + 5.5, cy - 8.5, cx + 8, cy - 10, cx + 8, cy - 15, cx + 5.5, cy - 14]);
      g.fill({ color: bartizanDark });
      g.stroke({ width: 0.6, color: 0x0f172a });
      g.poly([cx + 5.5, cy - 14, cx + 8, cy - 15, cx + 6.8, cy - 17.5]);
      g.fill({ color: 0x0f172a });
      g.circle(cx + 6.8, cy - 17.5, 0.6); g.fill({ color: 0xfacc15 });

      // 4. Parapet battlements (3 crenellations)
      g.rect(cx - 5, cy - 14, 2.5, 2.8); g.fill({ color: bartizanLight }); g.stroke({ width: 0.6, color: 0x1e293b });
      g.rect(cx - 1.2, cy - 14, 2.4, 2.8); g.fill({ color: bartizanLight }); g.stroke({ width: 0.6, color: 0x1e293b });
      g.rect(cx + 2.5, cy - 14, 2.5, 2.8); g.fill({ color: stoneDark }); g.stroke({ width: 0.6, color: 0x0f172a });

      // 5. Arched Gateway & Portcullis
      g.rect(cx - 2, cy + 0.5, 4, 4);
      g.fill({ color: 0x09090b });
      g.moveTo(cx - 1, cy + 1); g.lineTo(cx - 1, cy + 4.5);
      g.moveTo(cx + 1, cy + 1); g.lineTo(cx + 1, cy + 4.5);
      g.stroke({ width: 0.8, color: 0x94a3b8, alpha: 0.85 });

      // 6. Warm Royal Candlelit Window with ambient glow
      const candle = 0.85 + Math.sin(phase * 4 + cx) * 0.15;
      g.circle(cx, cy - 5, 2.5);
      g.fill({ color: 0xfef08a, alpha: candle * 0.35 });
      g.rect(cx - 1.2, cy - 6.5, 2.4, 3.2);
      g.fill({ color: 0xfef08a, alpha: candle });
      g.stroke({ width: 0.6, color: 0x78350f });

      // 7. Waving Swallowtail Pennant on Mast
      const wWave = Math.sin(phase * 4 + cx) * 1.8;
      g.moveTo(cx, cy - 11); g.lineTo(cx, cy - 20);
      g.stroke({ width: 1.3, color: 0x1e293b });
      g.circle(cx, cy - 20.5, 1); g.fill({ color: 0xfacc15 });
      g.poly([
        cx, cy - 20,
        cx + 8 + wWave, cy - 17,
        cx + 5 + wWave * 0.6, cy - 14.8,
        cx + 8 + wWave, cy - 12.5,
        cx, cy - 12.5,
      ]);
      g.fill({ color: flagCol });
      g.stroke({ width: 0.6, color: 0x0f172a });
      break;
    }
  }

  // 2. Draw front annexes / scaffolding (in front of keep)
  for (const annex of frontAnnexes) {
    drawKeepYardAnnex(g, cx, cy, annex, kit, phase);
  }

  // Ornamental Heraldic Realm Shield on NPC Keep Wall
  if (realmPal && !isHome && realmPal.realmId !== "player" && realmPal.realmId !== "rival") {
    g.poly([
      cx - 2.5, cy - 3.5,
      cx + 2.5, cy - 3.5,
      cx + 2.5, cy - 0.5,
      cx, cy + 2,
      cx - 2.5, cy - 0.5,
    ]);
    g.fill({ color: realmPal.pennantColor });
    g.stroke({ width: 0.8, color: realmPal.borderColor });
    g.circle(cx, cy - 1, 0.9);
    g.fill({ color: realmPal.accentColor });
  }

  // Small Heraldic Realm Crest Above Keep for Rival / NPC Home Holds
  if (!isHome && realmPal && realmPal.realmId !== "player") {
    drawRealmCrestAboveKeep(g, cx, cy, realmPal, phase);
  }

  // Majestic Golden Coronet Crest for Player Capital Home Keep
  if (isHome) {
    g.poly([
      cx - 5.5, cy - 19,
      cx - 4.5, cy - 23.5,
      cx - 2, cy - 20.5,
      cx, cy - 24.5,
      cx + 2, cy - 20.5,
      cx + 4.5, cy - 23.5,
      cx + 5.5, cy - 19,
    ]);
    g.fill({ color: 0xfacc15 });
    g.stroke({ width: 0.8, color: 0x78350f });
    g.circle(cx - 4.5, cy - 23.5, 0.7); g.fill({ color: 0xffffff });
    g.circle(cx, cy - 24.5, 0.8); g.fill({ color: 0xfde047 });
    g.circle(cx + 4.5, cy - 23.5, 0.7); g.fill({ color: 0xffffff });
  }
}

// -------------------------------------------------------------
// Resource Node Stock Info & Isometric Stock Pile Renderers
// -------------------------------------------------------------

/**
 * Resolves stock information for a resource node on the board.
 * Returns { stock, max, ratio } where ratio is normalized between 0 and 1.
 */
export function getNodeStockInfo(
  state: GameState,
  provinceId: string,
  nodeType: string
): { stock: number; max: number; ratio: number; hasStock: boolean } {
  const max = typeof nodeStockMax === "function"
    ? nodeStockMax(nodeType)
    : (typeof sim.nodeStockMax === "function"
        ? sim.nodeStockMax(nodeType)
        : (nodeType === "field" ? 160 : nodeType === "woodcut" ? 120 : nodeType === "quarry" ? 90 : 0));

  if (max <= 0) {
    return { stock: 0, max: 0, ratio: 1, hasStock: false };
  }

  let stock: number | undefined;
  if (state?.flags) {
    const raw = state.flags[`node_stock_${provinceId}`];
    if (typeof raw === "number" && Number.isFinite(raw)) {
      stock = Math.max(0, raw);
    }
  }

  if (stock === undefined) {
    if (typeof nodeStock === "function" && state?.board?.provinces) {
      stock = nodeStock(state, provinceId);
    } else if (typeof sim.nodeStock === "function" && state?.board?.provinces) {
      stock = sim.nodeStock(state, provinceId);
    } else {
      stock = max;
    }
  }

  const hasStock = stock > 0;
  const ratio = Math.max(0, Math.min(1, stock / max));
  return { stock, max, ratio, hasStock };
}

/**
 * Draws the resource node stock pile on the isometric diamond tile.
 * Reads visibly emptier when the node is low:
 * - High / Full (ratio >= 0.65): Stacked multi-tier full pyramid pile
 * - Medium (0.35 <= ratio < 0.65): Reduced 2-tier pile
 * - Low (0.10 <= ratio < 0.35): Diminished 1-tier pile (1-2 items)
 * - Empty / Depleted (ratio < 0.10): Empty skids / bare gravel / trampled threshing floor with depletion indicator
 */
export function drawNodeStockPile(
  g: Graphics,
  px: number,
  py: number,
  nodeType: string,
  ratio: number,
  phase: number = 0
): void {
  const clampedRatio = Math.max(0, Math.min(1, ratio));

  if (nodeType === "woodcut") {
    // -------------------------------------------------------------
    // Timber Log Rick / Stack
    // -------------------------------------------------------------
    // 1. Ground contact shadow
    g.ellipse(px, py + 3.5, 7.5, 2.2);
    g.fill({ color: 0x000000, alpha: 0.38 });

    // 2. Timber skid beams (supporting rails)
    g.rect(px - 5.5, py + 1.5, 11, 2.5);
    g.fill({ color: 0x713f12, alpha: 0.35 }); // sawdust footprint
    g.moveTo(px - 5.5, py + 1.5); g.lineTo(px - 5.5, py + 4.5);
    g.stroke({ width: 1.2, color: 0x3f1d0b });
    g.moveTo(px + 4.5, py + 1.5); g.lineTo(px + 4.5, py + 4.5);
    g.stroke({ width: 1.2, color: 0x3f1d0b });

    const drawLog = (lx: number, ly: number, len: number) => {
      // Bark cylinder body
      g.rect(lx - len / 2, ly - 1.5, len - 2, 3);
      g.fill({ color: 0x78350f });
      // Bark highlight top seam
      g.moveTo(lx - len / 2, ly - 1.5);
      g.lineTo(lx + len / 2 - 2, ly - 1.5);
      g.stroke({ width: 0.7, color: 0x9a3412 });
      // Bark bottom shadow seam
      g.moveTo(lx - len / 2, ly + 1.5);
      g.lineTo(lx + len / 2 - 2, ly + 1.5);
      g.stroke({ width: 0.7, color: 0x451a03 });
      // Cut circular log face end (growth rings)
      g.ellipse(lx + len / 2 - 1.2, ly, 1.4, 1.5);
      g.fill({ color: 0xd97706 });
      g.circle(lx + len / 2 - 1.2, ly, 0.6);
      g.fill({ color: 0xfde047 });
    };

    if (clampedRatio >= 0.65) {
      // Stage 3: Full 6-log stack (3 bottom, 2 middle, 1 top)
      drawLog(px - 3, py + 1.5, 7);
      drawLog(px + 2.5, py + 1.5, 7);
      drawLog(px - 0.5, py + 3.5, 8);
      drawLog(px - 1.5, py - 0.5, 7);
      drawLog(px + 2.5, py - 0.5, 7);
      drawLog(px + 0.5, py - 2.5, 7);

      // End retaining stakes
      g.moveTo(px - 6, py - 3); g.lineTo(px - 6, py + 4.5);
      g.stroke({ width: 1.1, color: 0x451a03 });
      g.moveTo(px + 6, py - 3); g.lineTo(px + 6, py + 4.5);
      g.stroke({ width: 1.1, color: 0x451a03 });

      if (clampedRatio >= 0.9) {
        g.circle(px + 0.5, py - 3, 0.7);
        g.fill({ color: 0xfef08a });
      }
    } else if (clampedRatio >= 0.35) {
      // Stage 2: Medium 4-log stack (3 bottom, 1 top)
      drawLog(px - 3, py + 1.5, 7);
      drawLog(px + 2.5, py + 1.5, 7);
      drawLog(px - 0.5, py + 3.5, 8);
      drawLog(px + 0.5, py - 0.5, 7);

      // Shorter retaining stakes
      g.moveTo(px - 6, py - 1); g.lineTo(px - 6, py + 4.5);
      g.stroke({ width: 1.1, color: 0x451a03 });
      g.moveTo(px + 6, py - 1); g.lineTo(px + 6, py + 4.5);
      g.stroke({ width: 1.1, color: 0x451a03 });
    } else if (clampedRatio >= 0.10) {
      // Stage 1: Low 2-log stack lying flat
      drawLog(px - 2, py + 2.5, 7);
      drawLog(px + 3, py + 2.5, 7);
      // Scattered wood curlings
      g.circle(px - 4, py + 4, 0.7); g.fill({ color: 0xfde047 });
      g.circle(px + 1, py + 4.5, 0.6); g.fill({ color: 0xd97706 });
    } else {
      // Stage 0: Depleted / Dry (zero logs) - empty node stays as it is
      g.circle(px - 3, py + 3, 0.6); g.fill({ color: 0xd97706 });
      g.circle(px + 2, py + 3.5, 0.6); g.fill({ color: 0xb45309 });
    }
  } else if (nodeType === "quarry") {
    // -------------------------------------------------------------
    // Dressed Ashlar Stone Block Pile
    // -------------------------------------------------------------
    // 1. Ground contact shadow
    g.ellipse(px, py + 3.5, 7.5, 2.5);
    g.fill({ color: 0x18181b, alpha: 0.45 });

    // 2. Excavated gravel dust bed
    g.ellipse(px, py + 2.5, 6, 2);
    g.fill({ color: 0x52525b, alpha: 0.35 });

    const drawBlock = (bx: number, by: number, w: number, h: number) => {
      // Top sunlit facet
      g.poly([
        bx - w / 2, by - h / 2,
        bx, by - h / 2 - 1,
        bx + w / 2, by - h / 2,
        bx, by - h / 2 + 1,
      ]);
      g.fill({ color: 0xe4e4e7 });

      // Left lit face
      g.poly([
        bx - w / 2, by - h / 2,
        bx, by - h / 2 + 1,
        bx, by + h / 2,
        bx - w / 2, by + h / 2 - 1,
      ]);
      g.fill({ color: 0xa1a1aa });

      // Right shaded face
      g.poly([
        bx, by - h / 2 + 1,
        bx + w / 2, by - h / 2,
        bx + w / 2, by + h / 2 - 1,
        bx, by + h / 2,
      ]);
      g.fill({ color: 0x71717a });

      // Outlines
      g.poly([
        bx - w / 2, by - h / 2,
        bx, by - h / 2 - 1,
        bx + w / 2, by - h / 2,
        bx + w / 2, by + h / 2 - 1,
        bx, by + h / 2,
        bx - w / 2, by + h / 2 - 1,
      ]);
      g.stroke({ width: 0.6, color: 0x3f3f46 });
    };

    if (clampedRatio >= 0.65) {
      // Stage 3: Full 6-block pyramid
      drawBlock(px - 3.5, py + 2.5, 4.5, 3);
      drawBlock(px + 1, py + 3, 4.5, 3);
      drawBlock(px + 5, py + 2, 4, 3);
      drawBlock(px - 1.5, py + 0.2, 4.5, 3);
      drawBlock(px + 3, py + 0.5, 4.5, 3);
      drawBlock(px + 0.5, py - 2.2, 4.5, 3);

      if (clampedRatio >= 0.9) {
        g.circle(px + 0.5, py - 3.2, 0.7);
        g.fill({ color: 0xffffff });
      }
    } else if (clampedRatio >= 0.35) {
      // Stage 2: Medium 4-block pile
      drawBlock(px - 3.5, py + 2.5, 4.5, 3);
      drawBlock(px + 1, py + 3, 4.5, 3);
      drawBlock(px + 5, py + 2, 4, 3);
      drawBlock(px + 0.5, py + 0.5, 4.5, 3);
    } else if (clampedRatio >= 0.10) {
      // Stage 1: Low 2-block pile
      drawBlock(px - 2, py + 2.5, 4.5, 3);
      drawBlock(px + 3, py + 2.5, 4.5, 3);
      // Rubble chips
      g.rect(px - 4.5, py + 4, 1.2, 1); g.fill({ color: 0xa1a1aa });
      g.rect(px + 1, py + 4.5, 1, 0.9); g.fill({ color: 0x71717a });
    } else {
      // Stage 0: Depleted / Dry (zero blocks) - empty node stays as it is
      g.ellipse(px, py + 2.5, 5.5, 2);
      g.fill({ color: 0x3f3f46, alpha: 0.65 });
      g.rect(px - 2, py + 2, 1.2, 1); g.fill({ color: 0x71717a });
      g.rect(px + 2, py + 3, 1, 0.8); g.fill({ color: 0x52525b });
    }
  } else if (nodeType === "field") {
    // -------------------------------------------------------------
    // Burlap Harvest Grain Sack Pile
    // -------------------------------------------------------------
    // 1. Ground contact shadow
    g.ellipse(px, py + 3.5, 7.5, 2.5);
    g.fill({ color: 0x451a03, alpha: 0.4 });

    // 2. Threshing cloth / straw mat
    g.poly([
      px - 6, py + 2,
      px, py + 0.5,
      px + 6, py + 2.5,
      px, py + 4.5,
    ]);
    g.fill({ color: 0x92400e });

    const drawSack = (sx: number, sy: number, size: number) => {
      // Sack belly
      g.ellipse(sx, sy + 0.5, size * 1.7, size * 1.3);
      g.fill({ color: 0xb45309 });
      // Upper belly highlight
      g.ellipse(sx - 0.3, sy, size * 1.2, size * 0.8);
      g.fill({ color: 0xd97706 });
      // Tied neck
      g.rect(sx - size * 0.5, sy - size * 1.0, size * 1.0, 1);
      g.fill({ color: 0x78350f });
      // Flared opening
      g.poly([
        sx - size * 0.6, sy - size * 1.0,
        sx + size * 0.6, sy - size * 1.0,
        sx + size * 0.8, sy - size * 1.5,
        sx - size * 0.8, sy - size * 1.5,
      ]);
      g.fill({ color: 0xb45309 });
      // Wheat grain ear peeking out
      g.circle(sx, sy - size * 1.4, 0.7);
      g.fill({ color: 0xfde047 });
    };

    if (clampedRatio >= 0.65) {
      // Stage 3: Full 5-sack stack
      drawSack(px - 3.5, py + 2, 1.3);
      drawSack(px + 1.5, py + 2.5, 1.3);
      drawSack(px + 4.5, py + 1.2, 1.2);
      drawSack(px - 1, py - 0.5, 1.3);
      drawSack(px + 3, py, 1.2);

      if (clampedRatio >= 0.9) {
        g.circle(px - 1, py - 2, 0.7);
        g.fill({ color: 0xfef08a });
      }
    } else if (clampedRatio >= 0.35) {
      // Stage 2: Medium 3-sack pile
      drawSack(px - 3, py + 2.2, 1.3);
      drawSack(px + 2, py + 2.5, 1.3);
      drawSack(px - 0.5, py + 0.2, 1.3);
    } else if (clampedRatio >= 0.10) {
      // Stage 1: Low 1 lone sack
      drawSack(px, py + 2, 1.3);
      // Chaff seeds
      g.circle(px - 4, py + 3, 0.6); g.fill({ color: 0xfde047 });
      g.circle(px + 3, py + 3.5, 0.6); g.fill({ color: 0xfef08a });
    } else {
      // Stage 0: Depleted / Dry (zero sacks) - empty node stays as it is
      g.circle(px - 2, py + 2.5, 0.6); g.fill({ color: 0xfde047 });
      g.circle(px + 2, py + 3, 0.5); g.fill({ color: 0xd97706 });
    }
  } else if (nodeType === "ruins") {
    // -------------------------------------------------------------
    // Relic Cache / Treasure Hoard
    // -------------------------------------------------------------
    g.ellipse(px, py + 3.5, 6, 2);
    g.fill({ color: 0x18181b, alpha: 0.4 });

    if (clampedRatio >= 0.5) {
      // Full unlooted treasure chest
      g.rect(px - 3.5, py + 1, 7, 4);
      g.fill({ color: 0x78350f });
      g.stroke({ width: 0.7, color: 0x3f3f46 });
      g.circle(px, py + 2.5, 0.8);
      g.fill({ color: 0xfacc15 });
      g.circle(px + 2.5, py + 3.5, 0.9);
      g.fill({ color: 0xfde047 });
    } else {
      // Open / looted chest
      g.rect(px - 3.5, py + 1.5, 7, 3);
      g.fill({ color: 0x451a03 });
      g.stroke({ width: 0.6, color: 0x3f3f46 });
      if (clampedRatio <= 0) {
        const pulse = Math.sin(phase * 4) * 0.25 + 0.75;
        g.circle(px, py - 1, 1.5);
        g.fill({ color: 0xef4444, alpha: 0.85 * pulse });
        g.circle(px, py - 1, 0.7);
        g.fill({ color: 0xfef08a, alpha: pulse });
      }
    }
  }
}

/**
 * Draws the complete resource node on an isometric diamond tile:
 * 1. Facility / work station landmark on the left (stump+axe, quarry face+pick, wheat stook+sickle, or ruins columns)
 * 2. Small stock pile on the right (stacked logs, ashlar blocks, grain sacks) when the province already has node stock.
 * When the node is empty (stock <= 0), no pile is drawn on the diamond and empty nodes stay as they are.
 */
export function drawResourceNode(
  g: Graphics,
  cx: number,
  cy: number,
  nodeType: string,
  ratio: number,
  phase: number = 0,
  hasStock: boolean = ratio > 0
): void {
  // 1. Station Landmark on Left Side
  switch (nodeType) {
    case "woodcut": {
      // Tree stump with root flares
      g.poly([
        cx - 9, cy + 4,
        cx - 7, cy + 1,
        cx - 3, cy + 1,
        cx - 1, cy + 4,
      ]);
      g.fill({ color: 0x451a03 });
      g.rect(cx - 7.5, cy + 0.5, 5, 3.5);
      g.fill({ color: 0x713f12 });
      g.ellipse(cx - 5, cy + 0.5, 2.5, 1.2);
      g.fill({ color: 0xa16207 });
      g.circle(cx - 5, cy + 0.5, 0.6);
      g.fill({ color: 0xd97706 });

      // Embedded felling broadaxe
      g.moveTo(cx - 5, cy + 0.5);
      g.lineTo(cx - 9, cy - 7);
      g.stroke({ width: 1.1, color: 0x78350f });
      g.poly([cx - 5, cy + 0.5, cx - 7, cy - 1.5, cx - 4.5, cy - 2.5]);
      g.fill({ color: 0x94a3b8 });
      g.moveTo(cx - 5, cy + 0.5);
      g.lineTo(cx - 7, cy - 1.5);
      g.stroke({ width: 0.8, color: 0xf8fafc });

      // Small timber A-frame sawbuck behind it
      g.moveTo(cx - 4, cy - 1);
      g.lineTo(cx + 1, cy - 7);
      g.stroke({ width: 0.9, color: 0x854d0e });
      g.moveTo(cx + 1, cy - 1);
      g.lineTo(cx - 4, cy - 7);
      g.stroke({ width: 0.9, color: 0x854d0e });
      break;
    }

    case "quarry": {
      // Exposed granite quarry rock outcrop
      g.poly([
        cx - 9, cy + 4,
        cx - 1, cy + 4,
        cx - 2, cy + 1,
        cx - 8, cy + 1,
      ]);
      g.fill({ color: 0x18181b, alpha: 0.4 });
      g.poly([
        cx - 8.5, cy + 3.5,
        cx - 2.5, cy + 3.5,
        cx - 2.5, cy - 3,
        cx - 8.5, cy - 1,
      ]);
      g.fill({ color: 0x52525b });
      g.poly([
        cx - 8.5, cy - 1,
        cx - 2.5, cy - 3,
        cx - 4, cy - 5,
        cx - 9.5, cy - 3,
      ]);
      g.fill({ color: 0xa1a1aa });
      g.moveTo(cx - 8, cy + 1);
      g.lineTo(cx - 3, cy + 0.5);
      g.stroke({ width: 0.7, color: 0x27272a });

      // Heavy quarry pickaxe leaning against ledge
      g.moveTo(cx - 2, cy + 4);
      g.lineTo(cx - 7, cy - 6);
      g.stroke({ width: 1.1, color: 0x78350f });
      g.poly([cx - 9, cy - 5, cx - 7, cy - 6, cx - 5, cy - 7.5, cx - 7, cy - 6.5]);
      g.fill({ color: 0x94a3b8 });
      g.circle(cx - 9, cy - 5, 0.7);
      g.fill({ color: 0xf1f5f9 });
      break;
    }

    case "field": {
      // Harvest wheat stook / sheaf standing tall
      g.ellipse(cx - 5, cy + 4, 4, 1.5);
      g.fill({ color: 0x000000, alpha: 0.35 });
      g.poly([
        cx - 7, cy + 4,
        cx - 8, cy - 2,
        cx - 2, cy - 2,
        cx - 3, cy + 4,
      ]);
      g.fill({ color: 0xca8a04 });
      g.rect(cx - 7.5, cy + 0.5, 5, 1.5);
      g.fill({ color: 0xdc2626 });
      g.poly([
        cx - 8, cy - 2,
        cx - 9, cy - 5,
        cx - 5, cy - 6,
        cx - 5, cy - 2,
      ]);
      g.fill({ color: 0xfacc15 });
      g.poly([
        cx - 5, cy - 2,
        cx - 5, cy - 6,
        cx - 1, cy - 5,
        cx - 2, cy - 2,
      ]);
      g.fill({ color: 0xfde047 });
      g.circle(cx - 7, cy - 5, 1.1); g.fill({ color: 0xfef08a });
      g.circle(cx - 5, cy - 6, 1.2); g.fill({ color: 0xfde047 });
      g.circle(cx - 3, cy - 5, 1.1); g.fill({ color: 0xfef08a });

      // Reaping sickle stuck in ground
      g.moveTo(cx - 1, cy + 4);
      g.lineTo(cx + 1, cy + 0.5);
      g.stroke({ width: 0.9, color: 0x78350f });
      g.moveTo(cx + 1, cy + 0.5);
      g.bezierCurveTo(cx + 3, cy - 1, cx + 2, cy - 4, cx, cy - 3.5);
      g.stroke({ width: 0.9, color: 0xe2e8f0 });
      g.circle(cx + 2.5, cy - 2, 0.6);
      g.fill({ color: 0xffffff });
      break;
    }

    case "ruins": {
      // Crumbling classical stone column & archway
      g.rect(cx - 8, cy + 2, 5, 2);
      g.fill({ color: 0x52525b });
      g.rect(cx - 7.5, cy - 5, 4, 7);
      g.fill({ color: 0xa1a1aa });
      g.moveTo(cx - 6.5, cy - 5); g.lineTo(cx - 6.5, cy + 2);
      g.stroke({ width: 0.6, color: 0x71717a });
      g.moveTo(cx - 4.5, cy - 5); g.lineTo(cx - 4.5, cy + 2);
      g.stroke({ width: 0.6, color: 0x71717a });
      g.poly([cx - 8, cy - 5, cx - 6, cy - 7, cx - 4, cy - 5.5, cx - 3, cy - 5]);
      g.fill({ color: 0xd4d4d8 });
      g.moveTo(cx - 4, cy - 6); g.lineTo(cx, cy - 3);
      g.stroke({ width: 1.4, color: 0x71717a });
      break;
    }
  }

  // 2. Small Stock Pile on Right Side of Diamond (only when province already has stock; empty nodes stay as they are)
  if (hasStock && ratio > 0) {
    drawNodeStockPile(g, cx + 5, cy + 1, nodeType, ratio, phase);
  }
}


// -------------------------------------------------------------
// Seasonal & Holiday Board Tinting Helpers
// -------------------------------------------------------------
export interface BoardSeasonTint {
  color: number;
  alpha: number;
  hex: string;
  season: string;
  holiday: string;
  decorations: string;
}

function getSeasonFromState(state?: GameState | null): string {
  if (!state) return "Spring";
  if (typeof (state as any).season === "string") return (state as any).season;
  if (state.meta && typeof state.meta.tick === "number") {
    try {
      return sim.currentSeason(state);
    } catch {
      return "Spring";
    }
  }
  return "Spring";
}

export function resolveBoardThemeVisuals(
  state?: GameState | null,
  visuals?: ThemeVisuals | null
): ThemeVisuals {
  if (visuals && typeof visuals === "object" && "tintColor" in visuals && typeof (visuals as any).tintColor === "number") {
    return visuals;
  }
  const season = getSeasonFromState(state);
  const holiday = (state as any)?.flags?.holiday || (state as any)?.flags?.theme || "none";
  return getThemeVisuals(season, holiday);
}

export function resolveBoardSeasonTint(
  state?: GameState | null,
  visuals?: ThemeVisuals | null
): BoardSeasonTint {
  const season = getSeasonFromState(state);
  const holiday = (state as any)?.flags?.holiday || (state as any)?.flags?.theme || "none";
  const v = resolveBoardThemeVisuals(state, visuals);
  const hex = `#${(v.tintColor >>> 0).toString(16).padStart(6, "0")}`;
  return {
    color: v.tintColor,
    alpha: v.tintAlpha,
    hex,
    season,
    holiday,
    decorations: v.decorations,
  };
}

export interface BoardSeasonWash {
  season: string;
  holiday: string;
  hasWash: boolean;
  washColor: number | null;
  washAlpha: number;
  hex: string | null;
  kind: "winter-frost" | "harvest-gold" | "none";
  isWinter: boolean;
  isHarvest: boolean;
  isFarmOrPlain: boolean;
}

/**
 * Resolves board-only seasonal wash settings:
 * - Winter: light snow / frost on tiles (0xbae6fd / 0xe0f2fe translucent wash, frost rime, snow flecks).
 * - Harvest: warm gold wash on farms (node === "field") and plains (terrain === "plain").
 * - Spring/Summer: leave current look (zero wash / un-tinted natural terrain).
 */
export function resolveBoardSeasonWash(
  state?: GameState | null,
  province?: { terrain?: string; node?: string | null } | null,
  visuals?: ThemeVisuals | null
): BoardSeasonWash {
  const season = getSeasonFromState(state);
  const holiday = String((state as any)?.flags?.holiday || (state as any)?.flags?.theme || "none");
  const normSeason = season.toLowerCase();
  const normHoliday = holiday.toLowerCase();

  const isWinter =
    normSeason === "winter" ||
    normHoliday === "midwinter" ||
    visuals?.decorations === "winter" ||
    visuals?.decorations === "midwinter";

  const isHarvest =
    !isWinter &&
    (normSeason === "autumn" ||
      normSeason === "harvest" ||
      normHoliday === "harvest" ||
      visuals?.decorations === "autumn" ||
      visuals?.decorations === "harvest");

  const isFarmOrPlain = province
    ? province.terrain === "plain" || province.node === "field"
    : true;

  if (isWinter) {
    const washColor = 0xbae6fd;
    const washAlpha = 0.22;
    return {
      season,
      holiday,
      hasWash: true,
      washColor,
      washAlpha,
      hex: "#bae6fd",
      kind: "winter-frost",
      isWinter: true,
      isHarvest: false,
      isFarmOrPlain: Boolean(province && (province.terrain === "plain" || province.node === "field")),
    };
  }

  if (isHarvest && isFarmOrPlain) {
    const washColor = 0xf59e0b;
    const washAlpha = 0.22;
    return {
      season,
      holiday,
      hasWash: true,
      washColor,
      washAlpha,
      hex: "#f59e0b",
      kind: "harvest-gold",
      isWinter: false,
      isHarvest: true,
      isFarmOrPlain: true,
    };
  }

  // Spring, Summer, or Harvest on non-farm/plain: leave current look
  return {
    season,
    holiday,
    hasWash: false,
    washColor: null,
    washAlpha: 0,
    hex: null,
    kind: "none",
    isWinter: false,
    isHarvest,
    isFarmOrPlain: Boolean(province && (province.terrain === "plain" || province.node === "field")),
  };
}

// -------------------------------------------------------------
// Tabletop Board Province Rendering (Height-Mapped Lords Mobile Style)
// -------------------------------------------------------------
export function paintBoardProvinces(
  g: Graphics,
  state: GameState,
  phase: number = 0,
  selectedProvinceId?: string | null,
  visuals?: ThemeVisuals | null
): void {
  g.clear();
  if (!state?.board?.provinces) return;

  const animPhase = typeof phase === "number" ? phase : 0;
  const theme = resolveBoardThemeVisuals(state, visuals);
  const marchDestMap = buildMarchDestinationMap(state);

  // Sort back-to-front by depth (y * 20 + x) so foreground isometric tiles and cliff faces layer on top
  const sortedProvinces = [...state.board.provinces].sort((a, b) => (a.y * 20 + a.x) - (b.y * 20 + b.x));

  for (const p of sortedProvinces) {
    const b = provinceTokenBounds(p.x, p.y);
    const seen = isProvinceSeen(state, p.id);

    if (!seen) {
      // Unseen Province: Raised Volumetric Cumulus Cloud Mass (NOT purple squares)
      paintFogHeightVeil(g, b, p, animPhase);
      const destKind = marchDestMap.get(p.id);
      if (destKind) {
        paintBoardDestinationRing(g, p, destKind, animPhase);
      }
      continue;
    }

    const pal = terrainChipPalette(p.terrain);
    const elev = terrainElevation(p.terrain);
    const wx = b.cx;
    const wy = b.cy;
    const hw = BOARD_HALF_W;
    const hh = BOARD_HALF_H;

    // 1. 3D Tactile Diamond Drop Shadow onto Tabletop
    g.poly([
      wx, wy - hh + 2,
      wx + hw + 2, wy + 2,
      wx, wy + hh + 3,
      wx - hw - 2, wy + 2,
    ]);
    g.fill({ color: 0x000000, alpha: 0.32 });

    // Resolve Board-Only Seasonal Wash (Winter frost on all tiles, Harvest gold on farms/plains, Spring/Summer untouched)
    const wash = resolveBoardSeasonWash(state, p, visuals);
    const tileTheme: ThemeVisuals = wash.hasWash && wash.washColor !== null
      ? { ...theme, tintColor: wash.washColor, tintAlpha: wash.washAlpha }
      : { ...theme, tintColor: 0, tintAlpha: 0 };

    // 2. 3D Height Faces (Front-left & Front-right vertical cliffs based on Terrain)
    if (elev > 0) {
      paintTileHeightFace(g, b, p.terrain, pal, animPhase, tileTheme);
    }

    // 3. Raised Top Diamond Plateau
    const cy = wy - elev;
    const topDiamond = [
      wx, cy - hh,
      wx + hw, cy,
      wx, cy + hh,
      wx - hw, cy,
    ];
    g.poly(topDiamond);
    g.fill({ color: pal.fill });

    // Board-only seasonal wash over top diamond plateau (translucent wash; does not hide terrain)
    if (wash.hasWash && wash.washColor !== null && wash.washAlpha > 0) {
      g.poly(topDiamond);
      g.fill({ color: wash.washColor, alpha: wash.washAlpha });
    }

    // Seasonal accent rims and dusting:
    if (wash.kind === "winter-frost") {
      // Crisp white frost rime along rear facets
      g.moveTo(wx - hw, cy);
      g.lineTo(wx, cy - hh);
      g.lineTo(wx + hw, cy);
      g.stroke({ width: 1.2, color: 0xffffff, alpha: 0.45 });

      // Subtle frost rime on front facet edge
      g.moveTo(wx - hw, cy);
      g.lineTo(wx, cy + hh);
      g.lineTo(wx + hw, cy);
      g.stroke({ width: 0.8, color: 0xe0f2fe, alpha: 0.35 });

      // Light snow / frost dusting crystals on top plateau
      const cx = wx;
      g.circle(cx - 8, cy - 3, 0.8); g.fill({ color: 0xffffff, alpha: 0.65 });
      g.circle(cx + 7, cy + 2, 0.7); g.fill({ color: 0xffffff, alpha: 0.65 });
      g.circle(cx + 2, cy - 5, 0.6); g.fill({ color: 0xffffff, alpha: 0.55 });
      g.circle(cx - 3, cy + 4, 0.7); g.fill({ color: 0xffffff, alpha: 0.55 });
    } else if (wash.kind === "harvest-gold") {
      // Harvest: warm golden rim highlight along top facets
      g.moveTo(wx - hw, cy);
      g.lineTo(wx, cy - hh);
      g.lineTo(wx + hw, cy);
      g.stroke({ width: 1.2, color: 0xfde047, alpha: 0.4 });

      // Subtle warm wheat glints on harvested ground
      const cx = wx;
      g.circle(cx - 6, cy - 2, 0.8); g.fill({ color: 0xfef08a, alpha: 0.55 });
      g.circle(cx + 5, cy + 3, 0.8); g.fill({ color: 0xfde047, alpha: 0.55 });
    } else {
      // Top subtle highlight rim along rear two facets (standard natural look)
      g.moveTo(wx - hw, cy);
      g.lineTo(wx, cy - hh);
      g.lineTo(wx + hw, cy);
      g.stroke({ width: 1, color: 0xffffff, alpha: 0.22 });
    }

    // Outer diamond border
    g.poly(topDiamond);
    g.stroke({ width: 1, color: pal.border, alpha: 0.85 });

    const cx = wx;

    // 4. Terrain Details (Isometric Relief Artwork)
    switch (p.terrain) {
      case "plain": {
        // Lush pastoral meadow with rolling knoll lines, grass tufts, and daisy blossoms
        g.moveTo(cx - 14, cy);
        g.bezierCurveTo(cx - 5, cy - 3, cx + 5, cy + 3, cx + 14, cy);
        g.stroke({ width: 1.4, color: 0x4d7c0f, alpha: 0.85 });

        g.moveTo(cx - 10, cy + 3);
        g.bezierCurveTo(cx - 3, cy + 1, cx + 6, cy + 5, cx + 11, cy + 3);
        g.stroke({ width: 1.1, color: 0x3f6212, alpha: 0.75 });

        // Grass tufts
        for (const [gx, gy] of [
          [cx - 9, cy - 3],
          [cx + 8, cy - 2],
          [cx - 3, cy + 4],
          [cx + 6, cy + 4],
        ]) {
          g.moveTo(gx, gy + 3); g.lineTo(gx - 2, gy - 2);
          g.moveTo(gx, gy + 3); g.lineTo(gx, gy - 3.5);
          g.moveTo(gx, gy + 3); g.lineTo(gx + 2, gy - 2);
          g.stroke({ width: 1.1, color: 0x84cc16, alpha: 0.9 });
        }

        // Wildflowers
        for (const [fx, fy, col] of [
          [cx - 6, cy - 4, 0xffffff],
          [cx + 4, cy - 4, 0xfacc15],
          [cx - 1, cy + 2, 0x60a5fa],
          [cx + 10, cy + 2, 0xffffff],
          [cx - 7, cy + 5, 0xfacc15],
        ]) {
          g.circle(fx, fy, 1.3);
          g.fill({ color: col, alpha: 0.95 });
          g.circle(fx, fy, 0.6);
          g.fill({ color: 0xeab308, alpha: 0.9 });
        }
        break;
      }

      case "wood": {
        // Deep forest pine grove with small evergreen spires standing on diamond
        const trees = [
          { tx: cx - 10, ty: cy - 2, s: 0.85, dark: true },
          { tx: cx + 9, ty: cy - 3, s: 0.9, dark: true },
          { tx: cx - 4, ty: cy + 4, s: 1.1, dark: false },
          { tx: cx + 5, ty: cy + 3, s: 1.05, dark: false },
        ];

        for (const tr of trees) {
          const s = tr.s;
          const x = tr.tx;
          const y = tr.ty;
          const trunkColor = 0x451a03;
          const leafDark = tr.dark ? 0x064e3b : 0x14532d;
          const leafMid = tr.dark ? 0x047857 : 0x16a34a;
          const leafLight = tr.dark ? 0x10b981 : 0x22c55e;

          g.rect(x - 1 * s, y - 2 * s, 2 * s, 4 * s);
          g.fill({ color: trunkColor });

          g.poly([x - 5.5 * s, y - 1 * s, x, y - 6 * s, x + 5.5 * s, y - 1 * s]);
          g.fill({ color: leafDark });
          g.poly([x - 4.5 * s, y - 4 * s, x, y - 9 * s, x + 4.5 * s, y - 4 * s]);
          g.fill({ color: leafMid });
          g.poly([x - 3.5 * s, y - 7 * s, x, y - 12 * s, x + 3.5 * s, y - 7 * s]);
          g.fill({ color: leafLight });
        }
        break;
      }

      case "hill": {
        // High stepped contour terraces on diamond
        g.ellipse(cx - 4, cy - 2, 11, 5.5);
        g.fill({ color: 0x57534e });
        g.ellipse(cx + 4, cy + 2, 10, 5);
        g.fill({ color: 0x44403c });
        g.ellipse(cx, cy, 7, 3.5);
        g.fill({ color: 0x57534e });

        // Highlighted contour ridges
        g.moveTo(cx - 12, cy - 2);
        g.bezierCurveTo(cx - 4, cy - 6, cx + 4, cy - 5, cx + 11, cy - 1);
        g.stroke({ width: 1.4, color: 0xd6d3d1, alpha: 0.9 });

        g.moveTo(cx - 10, cy + 2);
        g.bezierCurveTo(cx - 2, cy + 5, cx + 6, cy + 4, cx + 12, cy + 1);
        g.stroke({ width: 1.2, color: 0xa8a29e, alpha: 0.85 });

        // Granite stone boulders
        g.rect(cx - 5, cy - 3, 3.5, 2); g.fill({ color: 0x78716c });
        g.rect(cx + 4, cy - 1, 4, 2.5); g.fill({ color: 0x78716c });
        g.rect(cx - 1, cy + 2, 3, 2); g.fill({ color: 0x78716c });
        break;
      }

      case "waste": {
        // Scorched basalt caldera with glowing magma fissures
        const pulse = Math.sin(phase * 3 + p.x + p.y) * 0.2 + 0.8;
        g.ellipse(cx, cy, 12, 6);
        g.fill({ color: 0x140e0a });

        const drawFissures = (w: number, col: number, a: number) => {
          g.moveTo(cx - 14, cy - 1);
          g.lineTo(cx - 5, cy + 1);
          g.lineTo(cx + 1, cy - 2);
          g.lineTo(cx + 8, cy + 2);
          g.lineTo(cx + 14, cy - 1);
          g.stroke({ width: w, color: col, alpha: a });

          g.moveTo(cx - 2, cy - 6);
          g.lineTo(cx + 1, cy - 2);
          g.lineTo(cx + 3, cy + 5);
          g.stroke({ width: w * 0.8, color: col, alpha: a });

          g.moveTo(cx - 5, cy + 1);
          g.lineTo(cx - 8, cy + 5);
          g.stroke({ width: w * 0.7, color: col, alpha: a });
        };

        drawFissures(3.2, 0x991b1b, 0.75 * pulse);
        drawFissures(1.8, 0xf97316, 0.95);
        drawFissures(0.8, 0xfef08a, 0.95 * pulse);

        g.circle(cx + 1, cy - 2, 2.2);
        g.fill({ color: 0xef4444, alpha: 0.9 });
        g.circle(cx + 1, cy - 2, 1.2);
        g.fill({ color: 0xfef08a, alpha: pulse });
        break;
      }

      case "shore": {
        // Coastline: northwest sea, southeast beach, and frothing wave surf
        g.poly([
          cx - hw, cy,
          cx, cy - hh,
          cx + hw * 0.3, cy - hh * 0.7,
          cx - hw * 0.3, cy + hh * 0.7,
        ]);
        g.fill({ color: 0x0284c7 });

        g.poly([
          cx - hw * 0.3, cy + hh * 0.7,
          cx + hw * 0.3, cy - hh * 0.7,
          cx + hw, cy,
          cx, cy + hh,
        ]);
        g.fill({ color: 0xd4a359 });

        const waveShift = Math.sin(phase * 2.5 + p.x) * 1.2;
        g.moveTo(cx - hw * 0.5, cy + hh * 0.5);
        g.bezierCurveTo(
          cx - 4, cy - 2 + waveShift,
          cx + 4, cy + 2 - waveShift,
          cx + hw * 0.5, cy - hh * 0.5
        );
        g.stroke({ width: 2.2, color: 0xffffff, alpha: 0.95 });

        for (let fx = cx - 8; fx <= cx + 8; fx += 5) {
          const fy = cy + Math.sin(fx * 0.8 + phase * 2) * 1.2;
          g.circle(fx, fy, 1.1);
          g.fill({ color: 0xf0fdfa, alpha: 0.95 });
        }
        break;
      }

      case "peak": {
        // Towering alpine mountain peak: twin snowcapped rocky crags
        // Shadowed eastern slopes
        g.poly([
          cx, cy - 14,
          cx + 11, cy - 1,
          cx + 13, cy - 7,
          cx + hw - 3, cy,
          cx, cy + 4,
        ]);
        g.fill({ color: 0x1e293b });

        // Illuminated western slopes
        g.poly([
          cx - hw + 3, cy,
          cx - 12, cy - 5,
          cx - 7, cy + 1,
          cx, cy - 14,
          cx, cy + 4,
        ]);
        g.fill({ color: 0x475569 });

        // Central arête ridge line
        g.moveTo(cx, cy - 14);
        g.lineTo(cx, cy + 4);
        g.stroke({ width: 1.2, color: 0x334155 });

        // Monarch summit snowcap
        g.poly([
          cx - 4, cy - 8,
          cx, cy - 14,
          cx + 4, cy - 8,
          cx, cy - 6,
        ]);
        g.fill({ color: 0xffffff });

        // Western horn snowcap
        g.poly([
          cx - 14, cy - 2,
          cx - 12, cy - 5,
          cx - 9, cy - 2,
          cx - 11, cy - 1,
        ]);
        g.fill({ color: 0xf8fafc });

        // Eastern horn snowcap
        g.poly([
          cx + 10, cy - 4,
          cx + 13, cy - 7,
          cx + 15, cy - 3,
          cx + 13, cy - 2,
        ]);
        g.fill({ color: 0xf8fafc });
        break;
      }
    }

    // 5. Node Marks (Hold, Camp, Woodcut, Quarry, Field)
    const isHoldNode = p.node === "hold";
    const isNpcHold = isNpcHoldProvince(p);
    const isPlayerHome = p.occupantRealmId === "player" && p.id === state.board.homeProvinceId;

    if (isHoldNode || isNpcHold || (p.occupantRealmId === "player" && isHoldNode)) {
      // Tiny Pixel Keep sitting squarely on top of the raised diamond tile
      let kit: CultureKit = "western";
      let realmPal: RealmTokenPalette | undefined;

      if (p.occupantRealmId === "player") {
        const cultId = sim.playerCultureId ? sim.playerCultureId(state) : undefined;
        kit = resolveCultureKit(cultId);
      } else if (p.occupantRealmId) {
        realmPal = realmTokenPalette(p.occupantRealmId);
        if (p.occupantRealmId === "rival") {
          kit = "western"; // Iron March spiked keep
        } else if (p.occupantRealmId === "k_silk") {
          kit = "sand";
        } else if (p.occupantRealmId === "k_ash") {
          kit = "steppe";
        } else if (p.occupantRealmId === "k_tide") {
          kit = "islands";
        } else {
          kit = "western";
        }
      }

      drawMiniatureKeep(g, cx, cy - 2, kit, realmPal, isPlayerHome, phase, isPlayerHome ? { state } : undefined);
    } else {
      switch (p.node) {
        case "camp": {
          if (p.occupantRealmId !== "player") {
            const campPal = p.occupantRealmId ? realmTokenPalette(p.occupantRealmId) : undefined;
            drawCampTentAndFlag(g, cx, cy, "western", undefined, phase, false, { flagColor: campPal?.pennantColor });
          }
          break;
        }
        case "woodcut":
        case "quarry":
        case "field":
        case "ruins": {
          const { ratio, hasStock } = getNodeStockInfo(state, p.id, p.node);
          drawResourceNode(g, cx, cy, p.node, ratio, phase, hasStock);
          break;
        }
      }
    }

    // 6. Special Realm Occupant Token Overlays
    if (p.occupantRealmId === "player") {
      const isHome = p.id === state.board.homeProvinceId;
      const cultId = sim.playerCultureId ? sim.playerCultureId(state) : undefined;
      const kit = resolveCultureKit(cultId);
      const cult = culturePalette(cultId);
      const playerTabardCol = cult.id === "western" ? 0x1e40af : cult.tabard;

      if (isHome) {
        // Player Home Hold: Gilded Royal Diamond Frame with corner studs & crown
        g.poly(topDiamond);
        g.stroke({ width: 2, color: 0xfacc15 });

        // 4 Corner Golden Studs at the diamond vertices
        g.circle(wx, cy - hh, 1.6); g.fill({ color: 0xfde047 });
        g.circle(wx + hw, cy, 1.6); g.fill({ color: 0xfde047 });
        g.circle(wx, cy + hh, 1.6); g.fill({ color: 0xfde047 });
        g.circle(wx - hw, cy, 1.6); g.fill({ color: 0xfde047 });

        // Crown emblem above keep
        g.poly([
          cx - 6, cy - 15,
          cx - 4, cy - 19,
          cx, cy - 16,
          cx + 4, cy - 19,
          cx + 6, cy - 15,
        ]);
        g.fill({ color: 0xfacc15 });

        // Animated golden halo pulse
        const haloAlpha = 0.35 + Math.sin(phase * 4) * 0.2;
        g.poly([
          wx, cy - hh - 1.5,
          wx + hw + 1.5, cy,
          wx, cy + hh + 1.5,
          wx - hw - 1.5, cy,
        ]);
        g.stroke({ width: 1.5, color: 0xfde047, alpha: haloAlpha });
      } else {
        // Player Outpost / Flag Token on Player-Occupied Field Tiles & Nodes
        g.poly(topDiamond);
        g.stroke({ width: 1.6, color: 0x2563eb });

        // Corner brass pins
        g.circle(wx, cy - hh, 1.2); g.fill({ color: 0xfde047 });
        g.circle(wx + hw, cy, 1.2); g.fill({ color: 0xfde047 });
        g.circle(wx, cy + hh, 1.2); g.fill({ color: 0xfde047 });
        g.circle(wx - hw, cy, 1.2); g.fill({ color: 0xfde047 });

        const garrison = getPostedGarrison(state, p.id);
        if (garrison.posted) {
          // Posted Garrison Encampment: small tent + banner meeple with armaments & power crest
          drawGarrisonMeeple(g, cx, cy, kit, cult, garrison.power, phase);
        } else {
          // Player Camp / Outpost: clearer tent + flag
          drawPlayerCampTentAndFlag(g, cx, cy, kit, cult, phase, { node: p.node, flagColor: playerTabardCol });
        }
      }
    } else if (p.occupantRealmId) {
      const pal = realmTokenPalette(p.occupantRealmId);
      if (p.node === "hold") {
        // Distinct NPC Hold Diamond Rim
        g.poly(topDiamond);
        g.stroke({ width: 2, color: pal.borderColor });

        // 4 Corner Studs
        g.circle(wx, cy - hh, 1.5); g.fill({ color: pal.studColor });
        g.circle(wx + hw, cy, 1.5); g.fill({ color: pal.studColor });
        g.circle(wx, cy + hh, 1.5); g.fill({ color: pal.studColor });
        g.circle(wx - hw, cy, 1.5); g.fill({ color: pal.studColor });
      } else {
        // NPC Outpost on claimed province
        g.poly(topDiamond);
        g.stroke({ width: 1.5, color: pal.borderColor, alpha: 0.85 });

        g.circle(wx, cy - hh, 1.1); g.fill({ color: pal.studColor });
        g.circle(wx + hw, cy, 1.1); g.fill({ color: pal.studColor });
        g.circle(wx, cy + hh, 1.1); g.fill({ color: pal.studColor });
        g.circle(wx - hw, cy, 1.1); g.fill({ color: pal.studColor });

        // Ground shadow under crate & flag
        g.ellipse(cx + 4.5, cy + 5, 4.5, 2);
        g.fill({ color: 0x000000, alpha: 0.45 });

        // Territory flag
        g.moveTo(cx - 3, cy + 4); g.lineTo(cx - 3, cy - 14);
        g.stroke({ width: 1.3, color: pal.rimColor });
        g.circle(cx - 3, cy - 14.5, 1.3); g.fill({ color: pal.studColor });

        const flagWave = Math.sin(phase * 4 + p.x * 2) * 1.8;
        g.poly([
          cx - 3, cy - 14,
          cx + 5 + flagWave, cy - 11.5,
          cx + 3 + flagWave * 0.6, cy - 9.5,
          cx + 5 + flagWave, cy - 7.5,
          cx - 3, cy - 7.5,
        ]);
        g.fill({ color: pal.pennantColor });
        g.stroke({ width: 0.6, color: pal.borderColor });

        // Reinforced supply crate with iron banding
        g.rect(cx + 2, cy + 1, 5.5, 4.5);
        g.fill({ color: pal.keepWallColor });
        g.stroke({ width: 0.8, color: pal.borderColor });
        g.moveTo(cx + 2, cy + 1); g.lineTo(cx + 7.5, cy + 5.5);
        g.stroke({ width: 0.6, color: pal.borderColor });
      }
    }

    // 6.5 Faint Ring for March Destination Tiles (Player Gold / Hostile Red)
    const destKind = marchDestMap.get(p.id);
    if (destKind) {
      paintBoardDestinationRing(g, p, destKind, animPhase);
    }

    // 7. Clear Gold Rim & Ground Ring for Currently Selected Province
    if (selectedProvinceId && p.id === selectedProvinceId) {
      paintBoardSelectionRim(g, p.x, p.y, state, animPhase);
    }
  }
}

/**
 * Resolves whether a province has a posted garrison stationed on it,
 * along with its defensive garrison power rating and garrisoned force breakdown.
 */
export function getPostedGarrison(
  state: GameState | null,
  provinceId: string
): { posted: boolean; power: number; force?: Record<string, number> } {
  if (!state) return { posted: false, power: 0 };
  const g = garrisonAt(state, provinceId);
  if (!g) return { posted: false, power: 0 };
  const power = garrisonPower(state, provinceId);
  return { posted: true, power, force: g.force };
}

/**
 * Determines if a march represents an active garrison deployment or recall expedition.
 */
export function isGarrisonMarch(m: any): boolean {
  if (!m) return false;
  return (
    m.purpose === "garrison" ||
    m.purpose === "garrison_home" ||
    (typeof m.id === "string" && m.id.startsWith("m_garrison_"))
  );
}

/**
 * Determines if a march represents a hostile incoming war march or enemy raid column.
 */
export function isIncomingMarch(m: any, state?: GameState | null): boolean {
  if (!m) return false;
  if (m.realmId === "player") return false;
  if (isScoutMarch(m)) return false;
  if (m.purpose === "gather") return false;
  if (m.purpose === "garrison" || m.purpose === "garrison_home") return false;
  return true;
}

/**
 * Determines if a march represents an active reconnaissance scout column.
 */
export function isScoutMarch(m: any): boolean {
  if (!m) return false;
  return m.purpose === "scout" || (typeof m.id === "string" && m.id.startsWith("m_scout_"));
}

export function isGatherMarch(m: any, state: GameState | null): boolean {
  if (!m) return false;
  if (isScoutMarch(m)) return false;
  if (m.purpose === "gather") return true;
  if (m.kind === "node") return true;
  if (!state?.board) return false;
  const toProv = getProvince(state, m.toId);
  if (
    toProv &&
    (toProv.node === "woodcut" ||
      toProv.node === "quarry" ||
      toProv.node === "field" ||
      toProv.node === "ruins")
  ) {
    if (m.kind !== "hold" && m.kind !== "camp") return true;
  }
  return false;
}

export interface GatherCartOptions {
  stockCount?: number;
  capacity?: number;
  ratio?: number;
  isLoaded?: boolean;
  isEmptyReturn?: boolean;
  phase?: "outbound" | "gathering" | "returning" | "transit";
}

export interface GatherLoadInfo extends GatherCartOptions {
  hasStock: boolean;
  stockCount: number;
  capacity: number;
  ratio: number;
  isLoaded: boolean;
  isEmptyReturn: boolean;
  phase: "outbound" | "gathering" | "returning" | "transit";
}

/**
 * Resolves stock count and load status for gather marches and presentation gathers:
 * - If the march or gather already carries a stock count (e.g. load, stock, cargo, stockCount):
 *   classifies whether the cart is full / loaded or an empty return.
 * - Outbound / transit carts default to active loaded carts.
 * - Returning carts with 0 stock/load are tagged as empty returns.
 */
export function resolveGatherLoadInfo(
  item: any,
  state?: GameState | null
): GatherLoadInfo {
  let stockCount: number | null = null;
  let capacity = 50;
  let phase: "outbound" | "gathering" | "returning" | "transit" = "transit";

  if (item) {
    if (typeof item.stockCount === "number") {
      stockCount = item.stockCount;
    } else if (typeof item.stock === "number") {
      stockCount = item.stock;
    } else if (typeof item.cargo === "number") {
      stockCount = item.cargo;
    } else if (typeof item.load === "string" || typeof item.load === "number") {
      const parsed = parseFloat(String(item.load));
      if (!isNaN(parsed)) stockCount = parsed;
    }

    if (typeof item.capacity === "string" || typeof item.capacity === "number") {
      const parsed = parseFloat(String(item.capacity));
      if (!isNaN(parsed) && parsed > 0) capacity = parsed;
    }

    if (item.phase === "outbound" || item.phase === "gathering" || item.phase === "returning") {
      phase = item.phase;
    } else if (state?.board?.homeProvinceId) {
      if (item.toId === state.board.homeProvinceId) {
        phase = "returning";
      } else if (item.fromId === state.board.homeProvinceId) {
        phase = "outbound";
      }
    }

    // If stockCount wasn't directly present, look up matching gather in state
    if (stockCount === null && state) {
      const gathers = listGathersPresentation(state);
      const match = gathers.find(
        (g: any) => g.id === item.id || (g.toId === item.toId && g.fromId === item.fromId)
      );
      if (match) {
        if (typeof match.load === "string" || typeof match.load === "number") {
          const parsed = parseFloat(String(match.load));
          if (!isNaN(parsed)) stockCount = parsed;
        }
        if (typeof match.capacity === "string" || typeof match.capacity === "number") {
          const parsed = parseFloat(String(match.capacity));
          if (!isNaN(parsed) && parsed > 0) capacity = parsed;
        }
        if (match.phase) phase = match.phase;
      }
    }
  }

  const hasStock = stockCount !== null;
  const numStock = stockCount ?? (phase === "returning" ? 50 : 25);
  const ratio = capacity > 0 ? Math.min(1, Math.max(0, numStock / capacity)) : (numStock > 0 ? 1 : 0);

  // An empty return is explicitly in returning phase with 0 stock/load, or any march carrying 0 stock count
  const isReturnPhase = phase === "returning" || Boolean(state?.board?.homeProvinceId && item?.toId === state.board.homeProvinceId);
  const isEmptyReturn = hasStock ? numStock <= 0 : isReturnPhase && numStock <= 0;
  // A loaded cart has positive stock count (> 0), or default active supply cart when stock is unstated
  const isLoaded = hasStock ? numStock > 0 : !isEmptyReturn;

  return {
    hasStock,
    stockCount: numStock,
    capacity,
    ratio,
    isLoaded,
    isEmptyReturn,
    phase,
  };
}

/**
 * Draws a distinct 2-3 frame pixel gather column meeple with a clear supply cart (yoke, crates)
 * and cargo load awareness: full carts look loaded with crates and sacks, while empty returns look light and open.
 */
export function drawGatherColumnMeeple(
  pawnsG: Graphics,
  pawnX: number,
  pawnY: number,
  facing: number,
  frame: 0 | 1 | 2,
  bob: number,
  kit: CultureKit,
  cult: CultureVisualPalette,
  nodeType?: string,
  phase: number = 0,
  progress: number = 0.5,
  loadInput?: number | boolean | GatherCartOptions
): void {
  // Parse loadInput
  let isLoaded = true;
  let isEmptyReturn = false;
  let ratio = 1.0;
  let stockCount: number | undefined;

  if (typeof loadInput === "number") {
    if (loadInput <= 1 && loadInput >= 0) {
      ratio = loadInput;
      stockCount = Math.round(ratio * 50);
    } else {
      stockCount = loadInput;
      ratio = Math.min(1, Math.max(0, stockCount / 50));
    }
    isLoaded = ratio >= 0.25;
    isEmptyReturn = ratio === 0;
  } else if (typeof loadInput === "boolean") {
    isLoaded = loadInput;
    isEmptyReturn = !loadInput;
    ratio = isLoaded ? 1.0 : 0.0;
    stockCount = isLoaded ? 50 : 0;
  } else if (loadInput && typeof loadInput === "object") {
    if (typeof loadInput.ratio === "number") ratio = Math.min(1, Math.max(0, loadInput.ratio));
    if (typeof loadInput.stockCount === "number") stockCount = loadInput.stockCount;
    if (typeof loadInput.isEmptyReturn === "boolean") {
      isEmptyReturn = loadInput.isEmptyReturn;
      isLoaded = !isEmptyReturn;
    } else if (typeof loadInput.isLoaded === "boolean") {
      isLoaded = loadInput.isLoaded;
      isEmptyReturn = !isLoaded;
    } else if (stockCount !== undefined && stockCount <= 0) {
      isEmptyReturn = true;
      isLoaded = false;
    } else {
      isLoaded = stockCount !== undefined ? stockCount > 0 : ratio >= 0.25;
      isEmptyReturn = ratio === 0 && loadInput.phase === "returning";
    }
  }

  // 1. Dual Ground Contact Shadows (cart wheelbase + draft animal)
  const shadowW = isEmptyReturn ? 10 : 13;
  const shadowAlpha = isEmptyReturn ? 0.32 : 0.48;
  pawnsG.ellipse(pawnX, pawnY + 5.5, shadowW, 4);
  pawnsG.fill({ color: 0x000000, alpha: shadowAlpha });

  pawnsG.ellipse(pawnX + facing * 8, pawnY + 5, 6, 2.8);
  pawnsG.fill({ color: 0x000000, alpha: 0.38 });

  // 2. Draft Animal / Puller (trotting in front with 2-3 frame animated trot)
  const muleX = pawnX + facing * 8;
  const muleY = pawnY + 1;
  const muleLeg1 = frame === 1 ? 1.8 : frame === 2 ? -1.8 : 0;
  const muleLeg2 = frame === 1 ? -1.8 : frame === 2 ? 1.8 : 0;

  // Hind legs
  pawnsG.rect(muleX - facing * 2.5, muleY + muleLeg1 - bob * 0.4, 1.8, 4);
  pawnsG.fill({ color: 0x3f220c });
  pawnsG.rect(muleX - facing * 2.5, muleY + muleLeg1 + 3 - bob * 0.4, 1.8, 1);
  pawnsG.fill({ color: 0x18181b });

  // Fore legs
  pawnsG.rect(muleX + facing * 2, muleY + muleLeg2 - bob * 0.4, 1.8, 4);
  pawnsG.fill({ color: 0x5c3818 });
  pawnsG.rect(muleX + facing * 2, muleY + muleLeg2 + 3 - bob * 0.4, 1.8, 1);
  pawnsG.fill({ color: 0x18181b });

  // Draft torso
  const muleColor = kit === "sand" ? 0xa16207 : kit === "steppe" ? 0x451a03 : 0x5c3818;
  pawnsG.rect(muleX - 3.5, muleY - 4.5 - bob * 0.5, 7, 4.5);
  pawnsG.fill({ color: muleColor });

  // Leather breast-collar and harness
  pawnsG.rect(muleX - 3.5, muleY - 2.5 - bob * 0.5, 7, 1);
  pawnsG.fill({ color: 0x271406 });
  pawnsG.circle(muleX + facing * 0.5, muleY - 2 - bob * 0.5, 0.8);
  pawnsG.fill({ color: 0xca8a04 });

  // Neck and head
  pawnsG.poly([
    muleX + facing * 2, muleY - 4.5 - bob * 0.5,
    muleX + facing * 5.5, muleY - 9 - bob * 0.5,
    muleX + facing * 8, muleY - 7.5 - bob * 0.5,
    muleX + facing * 3.5, muleY - 2.5 - bob * 0.5,
  ]);
  pawnsG.fill({ color: muleColor });

  // Perked ears
  pawnsG.poly([
    muleX + facing * 5, muleY - 9 - bob * 0.5,
    muleX + facing * 5.5, muleY - 12 - bob * 0.5,
    muleX + facing * 6.5, muleY - 9 - bob * 0.5,
  ]);
  pawnsG.fill({ color: 0x3f220c });

  // Dark muzzle & bridle
  pawnsG.rect(muleX + facing * 6.5, muleY - 8.5 - bob * 0.5, 2, 2);
  pawnsG.fill({ color: 0x271406 });
  pawnsG.moveTo(muleX + facing * 7, muleY - 8 - bob * 0.5);
  pawnsG.lineTo(muleX + facing * 5, muleY - 7 - bob * 0.5);
  pawnsG.stroke({ width: 0.6, color: 0x18181b });

  // 3. Clear Wooden Draft Yoke & Reinforced Traces
  const yokeX = muleX - facing * 1.5;
  const yokeY = muleY - 4.5 - bob * 0.5;

  // Arched wooden yoke beam resting on withers
  pawnsG.poly([
    yokeX - facing * 2.5, yokeY - 2.5,
    yokeX, yokeY - 4.0,
    yokeX + facing * 2.5, yokeY - 2.5,
    yokeX + facing * 2.5, yokeY - 1.2,
    yokeX, yokeY - 2.5,
    yokeX - facing * 2.5, yokeY - 1.2,
  ]);
  pawnsG.fill({ color: 0x92400e }); // Rich seasoned hardwood yoke
  pawnsG.stroke({ width: 0.6, color: 0x451a03 });

  // Iron under-neck yoke bow & collar straps
  pawnsG.rect(yokeX - 1.2, yokeY - 1.2, 2.4, 2.6);
  pawnsG.stroke({ width: 0.7, color: 0x27272a });

  // Forged brass hitch ring & coupling pin
  pawnsG.circle(yokeX, yokeY - 2.2, 1.1);
  pawnsG.fill({ color: 0xd4a359 });
  pawnsG.circle(yokeX, yokeY - 2.2, 0.4);
  pawnsG.fill({ color: 0x18181b });

  // Cart position: empty return rides lighter/higher, loaded sits firm
  const cartYOffset = isEmptyReturn ? -0.8 : 0;
  const cartX = pawnX;
  const cartY = pawnY + cartYOffset;

  // Dual timber draft shafts from yoke to cart hitch
  pawnsG.moveTo(yokeX, yokeY - 1.5);
  pawnsG.lineTo(cartX + facing * 5, cartY - 0.5 - bob);
  pawnsG.stroke({ width: 1.4, color: 0x78350f });

  pawnsG.moveTo(yokeX, yokeY - 0.5);
  pawnsG.lineTo(cartX + facing * 5, cartY + 1.2 - bob);
  pawnsG.stroke({ width: 1.0, color: 0x451a03 });

  // 4. The Supply Cart Chassis
  const cartTimber =
    kit === "sand"
      ? cult.stone
      : kit === "cedar" || kit === "islands"
      ? cult.timber
      : 0x78350f;

  const bedW = 14;
  const bedH = 5;
  const bedX = cartX - 7;
  const bedY = cartY - 3.5 - bob;

  // Timber bed & side framing
  pawnsG.rect(bedX, bedY, bedW, bedH);
  pawnsG.fill({ color: cartTimber });
  pawnsG.stroke({ width: 0.8, color: 0x3f220c });

  // Axle beam
  pawnsG.rect(cartX - 5.5, cartY + 1.5 - bob, 11, 1.8);
  pawnsG.fill({ color: 0x271406 });

  // Spoked Rotating Wheels with Iron Tire & Brass Hub
  for (const wx of [cartX - 4.5, cartX + 4.5]) {
    const wy = cartY + 2.5;
    pawnsG.circle(wx, wy, 3.5);
    pawnsG.fill({ color: 0x27272a }); // Iron rim
    pawnsG.circle(wx, wy, 2.7);
    pawnsG.fill({ color: 0x854d0e }); // Wood felloe

    // Rotating spokes across frames
    if (frame === 0) {
      pawnsG.moveTo(wx, wy - 2.5); pawnsG.lineTo(wx, wy + 2.5);
      pawnsG.moveTo(wx - 2.5, wy); pawnsG.lineTo(wx + 2.5, wy);
    } else if (frame === 1) {
      pawnsG.moveTo(wx - 1.8, wy - 1.8); pawnsG.lineTo(wx + 1.8, wy + 1.8);
      pawnsG.moveTo(wx + 1.8, wy - 1.8); pawnsG.lineTo(wx - 1.8, wy + 1.8);
    } else {
      pawnsG.moveTo(wx - 1, wy - 2.2); pawnsG.lineTo(wx + 1, wy + 2.2);
      pawnsG.moveTo(wx - 2.2, wy + 1); pawnsG.lineTo(wx + 2.2, wy - 1);
    }
    pawnsG.stroke({ width: 0.6, color: 0x451a03 });

    // Brass hub
    pawnsG.circle(wx, wy, 1.2);
    pawnsG.fill({ color: 0xd4a359 });
    pawnsG.circle(wx, wy, 0.5);
    pawnsG.fill({ color: 0x18181b });
  }

  // 5. Cargo Presentation: Full Loaded Cart vs Empty Return Cart
  if (isEmptyReturn) {
    // --- EMPTY RETURN: Bare timber slats, open bed interior, light unburdened frame ---
    // Recessed dark interior floor
    pawnsG.rect(bedX + 0.8, bedY + 0.8, bedW - 1.6, bedH - 1.6);
    pawnsG.fill({ color: 0x543007 });

    // Visible bare floorboard plank lines
    pawnsG.moveTo(bedX + 1.5, bedY + 2.2); pawnsG.lineTo(bedX + bedW - 1.5, bedY + 2.2);
    pawnsG.moveTo(bedX + 1.5, bedY + 3.6); pawnsG.lineTo(bedX + bedW - 1.5, bedY + 3.6);
    pawnsG.stroke({ width: 0.5, color: 0x3f220c });

    // Open timber side stakes / light cage uprights
    pawnsG.rect(bedX, bedY - 2.5, 1.4, 6.5); pawnsG.fill({ color: 0x27272a });
    pawnsG.rect(bedX + bedW - 1.4, bedY - 2.5, 1.4, 6.5); pawnsG.fill({ color: 0x27272a });
    pawnsG.rect(cartX - 0.7, bedY - 2.2, 1.4, 6.2); pawnsG.fill({ color: 0x27272a });

    // Folded burlap drop-cloth resting flat on the floor (empty)
    pawnsG.rect(cartX - 3.5, bedY + 2.4, 7, 1.4);
    pawnsG.fill({ color: 0xa16207, alpha: 0.55 });
    pawnsG.stroke({ width: 0.4, color: 0x78350f });

    // Small empty open crate outline at floor
    pawnsG.rect(cartX - 2.5, bedY + 1.2, 5, 2.4);
    pawnsG.stroke({ width: 0.6, color: 0x92400e });
  } else {
    // --- FULL LOADED CART: Timber Supply Crates, Iron Straps, Cargo Sacks & Lashings ---
    // Timber side plank groove & corner iron brackets
    pawnsG.moveTo(bedX, bedY + 2.5); pawnsG.lineTo(bedX + bedW, bedY + 2.5);
    pawnsG.stroke({ width: 0.6, color: 0x451a03 });
    pawnsG.rect(bedX, bedY - 2.5, 1.8, 7.5); pawnsG.fill({ color: 0x27272a });
    pawnsG.rect(bedX + bedW - 1.8, bedY - 2.5, 1.8, 7.5); pawnsG.fill({ color: 0x27272a });

    // 1. Primary Center Supply Crate
    const crate1X = cartX - facing * 0.5 - 4.2;
    const crate1Y = bedY - 6.5;
    pawnsG.rect(crate1X, crate1Y, 8.5, 6.5);
    pawnsG.fill({ color: 0xb45309 }); // Rich aged timber crate
    pawnsG.stroke({ width: 0.8, color: 0x451a03 });

    // Horizontal crate plank slat grooves
    pawnsG.moveTo(crate1X, crate1Y + 2.2); pawnsG.lineTo(crate1X + 8.5, crate1Y + 2.2);
    pawnsG.moveTo(crate1X, crate1Y + 4.4); pawnsG.lineTo(crate1X + 8.5, crate1Y + 4.4);
    pawnsG.stroke({ width: 0.6, color: 0x78350f });

    // Iron corner straps on crate
    pawnsG.rect(crate1X, crate1Y, 1.2, 6.5); pawnsG.fill({ color: 0x27272a });
    pawnsG.rect(crate1X + 7.3, crate1Y, 1.2, 6.5); pawnsG.fill({ color: 0x27272a });

    // Crate diagonal X-brace
    pawnsG.moveTo(crate1X + 1.2, crate1Y + 1); pawnsG.lineTo(crate1X + 7.3, crate1Y + 5.5);
    pawnsG.moveTo(crate1X + 7.3, crate1Y + 1); pawnsG.lineTo(crate1X + 1.2, crate1Y + 5.5);
    pawnsG.stroke({ width: 0.6, color: 0x78350f });

    // 2. Secondary Forward Crate
    const crate2X = cartX + facing * 3.5 - 2.2;
    const crate2Y = bedY - 4.8;
    pawnsG.rect(crate2X, crate2Y, 5.2, 4.8);
    pawnsG.fill({ color: 0x92400e });
    pawnsG.stroke({ width: 0.7, color: 0x451a03 });
    pawnsG.moveTo(crate2X, crate2Y + 2.4); pawnsG.lineTo(crate2X + 5.2, crate2Y + 2.4);
    pawnsG.stroke({ width: 0.5, color: 0x78350f });
    pawnsG.rect(crate2X, crate2Y, 1, 4.8); pawnsG.fill({ color: 0x27272a });
    pawnsG.rect(crate2X + 4.2, crate2Y, 1, 4.8); pawnsG.fill({ color: 0x27272a });

    // 3. Bulging Cargo Sacks atop the crates
    pawnsG.ellipse(cartX - facing * 0.5, crate1Y - 2.2, 4.2, 3.2);
    pawnsG.fill({ color: 0xd97706 });
    pawnsG.stroke({ width: 0.6, color: 0x92400e });
    pawnsG.rect(cartX - facing * 0.5 - 1.2, crate1Y - 5.8, 2.4, 1.8);
    pawnsG.fill({ color: 0xb45309 });
    pawnsG.circle(cartX - facing * 0.5, crate1Y - 6.2, 1.0);
    pawnsG.fill({ color: 0xfde047 }); // Golden tie

    // Trailing barrel or secondary sack
    pawnsG.ellipse(cartX - facing * 4.2, bedY - 3.8, 3.2, 3.8);
    pawnsG.fill({ color: 0x78350f }); // Timber barrel
    pawnsG.stroke({ width: 0.6, color: 0x27272a });
    pawnsG.moveTo(cartX - facing * 4.2 - 2.8, bedY - 4.5); pawnsG.lineTo(cartX - facing * 4.2 + 2.8, bedY - 4.5);
    pawnsG.moveTo(cartX - facing * 4.2 - 2.8, bedY - 2.2); pawnsG.lineTo(cartX - facing * 4.2 + 2.8, bedY - 2.2);
    pawnsG.stroke({ width: 0.6, color: 0x27272a }); // Iron barrel hoops

    // Resource-specific cargo stacked on/in the crates
    if (nodeType === "woodcut" || nodeType === "wood") {
      pawnsG.rect(cartX - 5.5, crate1Y - 4.2, 11, 2.6);
      pawnsG.fill({ color: 0x713f12 });
      pawnsG.ellipse(cartX + (facing > 0 ? 5.5 : -5.5), crate1Y - 2.9, 1.2, 1.3);
      pawnsG.fill({ color: 0xfde047 });
      pawnsG.rect(cartX - 4.5, crate1Y - 6.5, 9, 2.4);
      pawnsG.fill({ color: 0x543007 });
      pawnsG.ellipse(cartX + (facing > 0 ? 4.5 : -4.5), crate1Y - 5.3, 1.0, 1.2);
      pawnsG.fill({ color: 0xfacc15 });
    } else if (nodeType === "quarry" || nodeType === "stone") {
      pawnsG.rect(cartX - 3.5, crate1Y - 4.5, 7, 3.8);
      pawnsG.fill({ color: 0x64748b });
      pawnsG.stroke({ width: 0.7, color: 0xcbd5e1 });
      pawnsG.moveTo(cartX - 0.5, crate1Y - 4.5); pawnsG.lineTo(cartX - 0.5, crate1Y - 0.7);
      pawnsG.stroke({ width: 0.6, color: 0x334155 });
    } else if (nodeType === "ruins" || nodeType === "gold") {
      pawnsG.rect(cartX - 3.5, crate1Y - 4.8, 7, 4.2);
      pawnsG.fill({ color: 0x451a03 });
      pawnsG.stroke({ width: 0.8, color: 0xfacc15 });
      pawnsG.circle(cartX + facing * 1.5, crate1Y - 5.5, 1.2);
      pawnsG.fill({ color: 0xfef08a });
    } else {
      // Food: golden wheat sheaves & bushel grain in crates
      pawnsG.circle(cartX - facing * 0.5 - 1.8, crate1Y - 4.2, 1.4);
      pawnsG.fill({ color: 0xfacc15 });
      pawnsG.circle(cartX - facing * 0.5 + 1.8, crate1Y - 3.8, 1.2);
      pawnsG.fill({ color: 0xfef08a });
      pawnsG.circle(cartX - facing * 0.5, crate1Y - 5.2, 1.0);
      pawnsG.fill({ color: 0xfde047 });
    }

    // Heavy tie-down ropes strapping the crates to the cart
    pawnsG.moveTo(bedX + 1.5, bedY + 1);
    pawnsG.lineTo(cartX - facing * 0.5, crate1Y - 2);
    pawnsG.lineTo(bedX + bedW - 1.5, bedY + 1);
    pawnsG.stroke({ width: 0.7, color: 0xfef08a, alpha: 0.65 });
  }

  // 6. Floating Harvest Cargo Badge / Load Pill
  const badgeBorderColor = isEmptyReturn ? 0x64748b : 0x22c55e;
  const badgeBgColor = isEmptyReturn ? 0x0f172a : 0x142e1b;
  pawnsG.rect(cartX - 14, cartY - 19 - bob, 28, 8);
  pawnsG.fill({ color: 0x000000, alpha: 0.45 });
  pawnsG.rect(cartX - 14, cartY - 20 - bob, 28, 8);
  pawnsG.fill({ color: badgeBgColor, alpha: 0.95 });
  pawnsG.stroke({ width: 1, color: badgeBorderColor, alpha: 0.85 });

  if (isEmptyReturn) {
    // Mini empty cart outline
    pawnsG.rect(cartX - 10, cartY - 17.5 - bob, 3.8, 2.4);
    pawnsG.stroke({ width: 0.7, color: 0x94a3b8 });
  } else {
    // Mini wooden crate icon
    pawnsG.rect(cartX - 10, cartY - 18 - bob, 3.4, 3.4);
    pawnsG.fill({ color: 0xb45309 });
    pawnsG.stroke({ width: 0.6, color: 0xfacc15 });
  }

  // Load progress pips
  const pips = 3;
  for (let p = 0; p < pips; p++) {
    const pipX = cartX - 2 + p * 4.5;
    const filled = !isEmptyReturn && (ratio >= (p + 1) / (pips + 1) || (isLoaded && ratio >= 0.25));
    const pipColor = filled ? (ratio >= 0.8 ? 0x4ade80 : 0xfacc15) : 0x1e293b;
    pawnsG.circle(pipX, cartY - 16 - bob, 1.3);
    pawnsG.fill({ color: pipColor });
  }
}

/**
 * Draws a distinct small cloak/spy meeple for reconnaissance scout columns,
 * featuring nimble running legs, a deep shadowed hooded cowl with glowing cyan eye slit,
 * a billowing ranger stealth cloak, and a brass spyglass scanning the uncharted horizon.
 */
export function drawScoutColumnMeeple(
  pawnsG: Graphics,
  pawnX: number,
  pawnY: number,
  facing: number,
  frame: 0 | 1 | 2,
  bob: number,
  kit: CultureKit,
  cult: CultureVisualPalette,
  phase: number = 0,
  progress: number = 0.5
): void {
  // 1. Sleek, Nimble Ground Contact Shadow
  pawnsG.ellipse(pawnX, pawnY + 5.5, 7.5, 2.6);
  pawnsG.fill({ color: 0x000000, alpha: 0.42 });

  // 2. Nimble Running Legs with Leather Scout Boots
  const bootColor = 0x292524;
  const cuffColor = 0x57534e;
  const legY = pawnY + 1;

  if (frame === 1) {
    // Forward stride
    pawnsG.moveTo(pawnX, legY);
    pawnsG.lineTo(pawnX + facing * 3.5, legY + 3.5);
    pawnsG.stroke({ width: 1.6, color: bootColor });
    pawnsG.circle(pawnX + facing * 3.5, legY + 4, 1.1);
    pawnsG.fill({ color: cuffColor });

    pawnsG.moveTo(pawnX, legY);
    pawnsG.lineTo(pawnX - facing * 3, legY + 3);
    pawnsG.stroke({ width: 1.5, color: bootColor });
    pawnsG.circle(pawnX - facing * 3, legY + 3.5, 1.0);
    pawnsG.fill({ color: cuffColor });
  } else if (frame === 2) {
    // Opposite stride
    pawnsG.moveTo(pawnX, legY);
    pawnsG.lineTo(pawnX + facing * 2, legY + 3.5);
    pawnsG.stroke({ width: 1.5, color: bootColor });
    pawnsG.circle(pawnX + facing * 2, legY + 4, 1.0);
    pawnsG.fill({ color: cuffColor });

    pawnsG.moveTo(pawnX, legY);
    pawnsG.lineTo(pawnX - facing * 4, legY + 3.2);
    pawnsG.stroke({ width: 1.6, color: bootColor });
    pawnsG.circle(pawnX - facing * 4, legY + 3.8, 1.1);
    pawnsG.fill({ color: cuffColor });
  } else {
    // Neutral alert prowl
    pawnsG.moveTo(pawnX - 1.2, legY);
    pawnsG.lineTo(pawnX - 1.8, legY + 4);
    pawnsG.stroke({ width: 1.5, color: bootColor });
    pawnsG.circle(pawnX - 1.8, legY + 4.2, 1.0);
    pawnsG.fill({ color: cuffColor });

    pawnsG.moveTo(pawnX + 1.2, legY);
    pawnsG.lineTo(pawnX + 1.8, legY + 4);
    pawnsG.stroke({ width: 1.5, color: bootColor });
    pawnsG.circle(pawnX + 1.8, legY + 4.2, 1.0);
    pawnsG.fill({ color: cuffColor });
  }

  // 3. Flowing Ranger Stealth Cloak / Billowing Mantle (Trailing behind scout)
  const cloakMain = cult?.tabard ? blendDark(cult.tabard, 0.45) : 0x0f172a;
  const cloakDark = 0x020617;
  const cloakRim = 0x38bdf8; // faint moonlit cyan rim
  const flutter = frame === 1 ? -2.2 : frame === 2 ? -1.2 : 0.5;

  // Billowing rear cloak tail
  pawnsG.poly([
    pawnX - facing * 1, pawnY - 2 - bob,
    pawnX - facing * 6.5, pawnY + 1 - bob + flutter,
    pawnX - facing * 8.5, pawnY + 3.5 - bob + flutter * 1.3,
    pawnX - facing * 5, pawnY + 4.5 - bob,
    pawnX - facing * 2, pawnY + 1.5 - bob,
  ]);
  pawnsG.fill({ color: cloakMain });
  pawnsG.stroke({ width: 0.6, color: cloakDark });

  // Cloak shadow fold
  pawnsG.moveTo(pawnX - facing * 1.5, pawnY - 1 - bob);
  pawnsG.lineTo(pawnX - facing * 6, pawnY + 2.5 - bob + flutter);
  pawnsG.stroke({ width: 0.8, color: cloakDark, alpha: 0.85 });

  // Subtle moonlit edge glint on top hem
  pawnsG.moveTo(pawnX - facing * 1, pawnY - 2 - bob);
  pawnsG.lineTo(pawnX - facing * 7.5, pawnY + 1.5 - bob + flutter);
  pawnsG.stroke({ width: 0.6, color: cloakRim, alpha: 0.65 });

  // 4. Leather Scout Tunic & Torso
  pawnsG.rect(pawnX - 2.5, pawnY - 3.5 - bob, 5, 5);
  pawnsG.fill({ color: 0x1e293b }); // Midnight slate leather
  pawnsG.stroke({ width: 0.6, color: 0x0f172a });

  // Belt & brass buckle
  pawnsG.rect(pawnX - 2.5, pawnY + 0.5 - bob, 5, 1.2);
  pawnsG.fill({ color: 0x451a03 });
  pawnsG.circle(pawnX, pawnY + 1 - bob, 0.7);
  pawnsG.fill({ color: 0xfacc15 });

  // Rolled Cartography Map / Scroll tucked in belt
  pawnsG.rect(pawnX - facing * 2.8, pawnY - 0.5 - bob, 2.2, 3);
  pawnsG.fill({ color: 0xfef08a }); // Parchment
  pawnsG.circle(pawnX - facing * 1.7, pawnY + 1 - bob, 0.6);
  pawnsG.fill({ color: 0xdc2626 }); // Crimson wax seal

  // Cloak Brooch / Clasp at collar
  pawnsG.circle(pawnX + facing * 0.5, pawnY - 3 - bob, 0.8);
  pawnsG.fill({ color: 0xe2e8f0 }); // Silver clasp

  // 5. Deep Shadowed Hooded Cowl (Head)
  // Outer hood dome
  pawnsG.poly([
    pawnX - 3.2, pawnY - 3.5 - bob,
    pawnX - 3.6, pawnY - 7.5 - bob,
    pawnX - 1.5, pawnY - 10.5 - bob,
    pawnX + 2, pawnY - 10 - bob,
    pawnX + 3.8, pawnY - 6.5 - bob,
    pawnX + 2.5, pawnY - 3.5 - bob,
  ]);
  pawnsG.fill({ color: cloakMain });
  pawnsG.stroke({ width: 0.7, color: cloakDark });

  // Culture-specific cowl touch
  if (kit === "cedar") {
    // Red huntsman feather
    pawnsG.moveTo(pawnX - 2, pawnY - 10 - bob);
    pawnsG.lineTo(pawnX - 4.5, pawnY - 13 - bob);
    pawnsG.stroke({ width: 1, color: 0xef4444 });
    pawnsG.circle(pawnX - 4.5, pawnY - 13 - bob, 0.5);
    pawnsG.fill({ color: 0xfacc15 });
  } else if (kit === "sand") {
    // Ivory nomad headwrap sash
    pawnsG.rect(pawnX - 3, pawnY - 6.5 - bob, 6, 1.4);
    pawnsG.fill({ color: 0xfef08a });
  } else if (kit === "steppe") {
    // Fur cowl rim
    pawnsG.rect(pawnX - 3.5, pawnY - 8 - bob, 7, 1.2);
    pawnsG.fill({ color: 0xd6d3d1 });
  } else if (kit === "islands") {
    // Shell pearl clasp
    pawnsG.circle(pawnX + facing * 0.5, pawnY - 3 - bob, 0.9);
    pawnsG.fill({ color: 0x06b6d4 });
  }

  // Pitch-black shadow cavity under the cowl
  pawnsG.ellipse(pawnX + facing * 1, pawnY - 6.5 - bob, 2.2, 1.8);
  pawnsG.fill({ color: 0x020617 });

  // Keen glowing scout eye / spy slit
  const eyeX = pawnX + facing * 1.5;
  const eyeY = pawnY - 6.5 - bob;
  pawnsG.ellipse(eyeX, eyeY, 1.1, 0.7);
  pawnsG.fill({ color: 0x38bdf8 }); // Radiant spy cyan
  pawnsG.circle(eyeX, eyeY, 0.45);
  pawnsG.fill({ color: 0xffffff }); // Specular gleam

  // 6. Brass Spyglass / Monocular Telescope (Scanning the frontier)
  const glassAngleY = -0.5; // slight upward tilt
  const armStartX = pawnX + facing * 1.5;
  const armStartY = pawnY - 2.5 - bob;
  const handX = pawnX + facing * 4;
  const handY = pawnY - 3.5 - bob;

  // Reaching arm
  pawnsG.moveTo(armStartX, armStartY);
  pawnsG.lineTo(handX, handY);
  pawnsG.stroke({ width: 1.4, color: 0x1e293b });

  // Spyglass brass cylinder
  const tubeStart = handX;
  const tubeEnd = handX + facing * 4.5;
  const tubeY = handY + glassAngleY;

  pawnsG.moveTo(tubeStart, handY);
  pawnsG.lineTo(tubeEnd, tubeY);
  pawnsG.stroke({ width: 1.6, color: 0xd97706 }); // Polished brass barrel

  // Brass eyepiece rim
  pawnsG.circle(tubeStart, handY, 0.9);
  pawnsG.fill({ color: 0xfacc15 });

  // Objective lens band
  pawnsG.circle(tubeEnd, tubeY, 1.1);
  pawnsG.fill({ color: 0xfacc15 });

  // Front glass objective lens
  pawnsG.ellipse(tubeEnd + facing * 0.6, tubeY, 0.7, 1.2);
  pawnsG.fill({ color: 0x38bdf8 });
  pawnsG.circle(tubeEnd + facing * 0.6, tubeY, 0.45);
  pawnsG.fill({ color: 0xffffff }); // Lens glint catching daylight

  // 7. Floating Reconnaissance Status Badge
  const badgeY = pawnY - 15 - bob;
  pawnsG.rect(pawnX - 8.5, badgeY - 2.5, 17, 5);
  pawnsG.fill({ color: 0x0f172a, alpha: 0.92 });
  pawnsG.rect(pawnX - 8.5, badgeY - 2.5, 17, 5);
  pawnsG.stroke({ width: 0.7, color: 0x0284c7, alpha: 0.85 });

  // Compass / Eye icon
  pawnsG.circle(pawnX - 4.5, badgeY, 1.4);
  pawnsG.fill({ color: 0x38bdf8 });
  pawnsG.circle(pawnX - 4.5, badgeY, 0.5);
  pawnsG.fill({ color: 0xffffff });

  // Scouting progress pips
  pawnsG.circle(pawnX + 0.5, badgeY, 1.0);
  pawnsG.fill({ color: progress >= 0.33 ? 0x38bdf8 : 0x334155 });
  pawnsG.circle(pawnX + 4.5, badgeY, 1.0);
  pawnsG.fill({ color: progress >= 0.75 ? 0x38bdf8 : 0x334155 });
}

/**
 * Draws a clear, distinct pitched canvas encampment tent and waving heraldic flag standard
 * for camps and outposts on the tabletop board.
 *
 * Distinct features:
 * - Soft ground contact shadows under tent footprint and flagpole base
 * - Angled tension guy ropes anchored with wooden ground stakes
 * - 3D pitched dual-tone canvas tent with shaded flank and sunlit roof pitch
 * - Timber ridgepole along tent apex and faction valance trim along eaves
 * - Open arched tent entrance revealing warm glowing lantern / hearth light
 * - Elevated hardwood flagpole with iron base bracket and polished finial sphere
 * - Fluttering heraldic flag standard with animated wave and chevron charge
 */
export function drawCampTentAndFlag(
  g: Graphics,
  cx: number,
  cy: number,
  kit: CultureKit = "western",
  cult?: CultureVisualPalette,
  phase: number = 0,
  isPlayer: boolean = false,
  options?: { node?: string; flagColor?: number }
): void {
  // 1. Dual Ground Contact Shadows
  g.ellipse(cx - 3, cy + 5, 8.5, 3.2);
  g.fill({ color: 0x000000, alpha: 0.38 });

  const poleX = cx + 5.5;
  g.ellipse(poleX, cy + 5.5, 3.2, 1.6);
  g.fill({ color: 0x000000, alpha: 0.32 });

  // 2. Tension Guy Ropes and Timber Ground Pegs
  // Left guy rope & ground peg
  g.moveTo(cx - 8, cy + 2.5);
  g.lineTo(cx - 12, cy + 5.5);
  g.stroke({ width: 0.7, color: 0xd4a373 });
  g.rect(cx - 12.5, cy + 4.5, 1.4, 2.4);
  g.fill({ color: 0x78350f });

  // Right guy rope & ground peg
  g.moveTo(cx + 1.5, cy + 2.5);
  g.lineTo(cx + 3.8, cy + 5.5);
  g.stroke({ width: 0.7, color: 0xd4a373 });
  g.rect(cx + 3.4, cy + 4.5, 1.4, 2.4);
  g.fill({ color: 0x78350f });

  // 3. Faction Palette & Canvas Styling
  const tabard = options?.flagColor ?? (isPlayer
    ? (cult?.tabard ?? 0x1e40af)
    : 0xb91c1c);
  const accent = isPlayer ? (cult?.accent ?? 0xfacc15) : 0xf59e0b;
  const timber = cult?.timber ?? 0x78350f;

  const canvasMain = isPlayer
    ? (kit === "sand"
      ? 0xd97706
      : kit === "cedar"
      ? 0x15803d
      : kit === "steppe"
      ? 0xa16207
      : kit === "islands"
      ? 0x0284c7
      : 0xb45309)
    : 0x9a3412;

  const canvasDark = blendDark(canvasMain, 0.38);
  const canvasLight = blendLight(canvasMain, 0.22);

  // 4. Tent Structure
  if (kit === "steppe" && isPlayer) {
    // Steppe round yurt cylinder
    g.rect(cx - 8.5, cy - 0.5, 11, 5.5);
    g.fill({ color: canvasDark });
    g.stroke({ width: 0.7, color: 0x451a03 });

    // Conical felt dome
    g.poly([
      cx - 9.5, cy - 0.5,
      cx - 3, cy - 7,
      cx + 2.5, cy - 0.5,
    ]);
    g.fill({ color: canvasLight });
    g.stroke({ width: 0.7, color: 0x451a03 });

    // Yurt crown / compression ring
    g.circle(cx - 3, cy - 7, 1.3);
    g.fill({ color: 0xd6d3d1 });
    g.stroke({ width: 0.5, color: 0x451a03 });
  } else {
    // Pitched Pavilion Ridge Tent
    // Left roof pitch (shadowed)
    g.poly([
      cx - 9, cy + 5,
      cx - 3.5, cy - 6,
      cx - 1, cy - 6,
      cx - 6, cy + 5,
    ]);
    g.fill({ color: canvasDark });

    // Right roof pitch / front gable (sunlit)
    g.poly([
      cx - 6, cy + 5,
      cx - 1, cy - 6,
      cx + 2.5, cy + 5,
    ]);
    g.fill({ color: canvasLight });

    // Roof seam outline
    g.poly([
      cx - 9, cy + 5,
      cx - 3.5, cy - 6,
      cx - 1, cy - 6,
      cx + 2.5, cy + 5,
    ]);
    g.stroke({ width: 0.7, color: 0x451a03 });

    // Timber ridgepole along apex
    g.moveTo(cx - 4, cy - 6);
    g.lineTo(cx - 0.5, cy - 6);
    g.stroke({ width: 1.3, color: timber });
  }

  // Faction Tabard Valance / Eaves Trim
  g.poly([
    cx - 9, cy + 2,
    cx - 3.5, cy - 2.5,
    cx + 2.5, cy + 2,
    cx + 2.5, cy + 3.2,
    cx - 3.5, cy - 1.3,
    cx - 9, cy + 3.2,
  ]);
  g.fill({ color: tabard });
  g.stroke({ width: 0.5, color: blendDark(tabard, 0.4) });

  // Arched Tent Entrance Flap
  g.poly([
    cx - 5, cy + 5,
    cx - 3.5, cy,
    cx - 2, cy + 5,
  ]);
  g.fill({ color: 0x1c1917 });

  // Glowing Lantern / Hearth Fire inside tent
  g.circle(cx - 3.5, cy + 2.8, 1.8);
  g.fill({ color: 0xf59e0b, alpha: 0.32 });
  g.circle(cx - 3.5, cy + 2.8, 1.1);
  g.fill({ color: 0xfef08a });
  g.circle(cx - 3.5, cy + 2.8, 0.5);
  g.fill({ color: 0xffffff });

  // 5. Elevated Hardwood Flagpole
  g.moveTo(poleX, cy + 5.5);
  g.lineTo(poleX, cy - 15);
  g.stroke({ width: 1.4, color: timber });

  // Pole Base Iron Bracket
  g.rect(poleX - 1.1, cy + 3.5, 2.2, 2.2);
  g.fill({ color: 0x27272a });

  // Finial Tip
  g.circle(poleX, cy - 15.5, 1.3);
  g.fill({ color: isPlayer ? 0xfacc15 : 0x94a3b8 });
  g.circle(poleX, cy - 15.5, 0.4);
  g.fill({ color: 0xffffff });

  // Culture finial plume
  if (isPlayer && kit === "cedar") {
    g.moveTo(poleX, cy - 15.5);
    g.lineTo(poleX - 2.5, cy - 18.5);
    g.stroke({ width: 1.1, color: 0xef4444 });
    g.circle(poleX - 2.5, cy - 18.5, 0.6);
    g.fill({ color: 0xfacc15 });
  } else if (isPlayer && kit === "steppe") {
    g.moveTo(poleX, cy - 14.5);
    g.lineTo(poleX - 2, cy - 10.5);
    g.stroke({ width: 1.1, color: 0xd6d3d1 });
  } else if (isPlayer && kit === "islands") {
    g.circle(poleX, cy - 15.5, 1.1);
    g.fill({ color: 0x06b6d4 });
  }

  // 6. Fluttering Waving Heraldic Flag Standard
  const flagWave = Math.sin(phase * 4 + (cx + cy) * 0.15) * 1.8;
  g.poly([
    poleX, cy - 15,
    poleX + 10.5 + flagWave, cy - 11.5,
    poleX + 8.5 + flagWave * 0.7, cy - 8.5,
    poleX + 10.5 + flagWave, cy - 5.5,
    poleX, cy - 5.5,
  ]);
  g.fill({ color: tabard });
  g.stroke({ width: 0.7, color: accent });

  // Heraldic Charge / Chevron on banner
  g.poly([
    poleX + 2 + flagWave * 0.2, cy - 11.5,
    poleX + 5 + flagWave * 0.45, cy - 8.5,
    poleX + 2 + flagWave * 0.2, cy - 6.5,
    poleX + 3.5 + flagWave * 0.3, cy - 6.5,
    poleX + 6.5 + flagWave * 0.55, cy - 8.5,
    poleX + 3.5 + flagWave * 0.3, cy - 11.5,
  ]);
  g.fill({ color: isPlayer ? 0xfde047 : 0xfef08a });
}

export function drawPlayerCampTentAndFlag(
  g: Graphics,
  cx: number,
  cy: number,
  kit: CultureKit = "western",
  cult?: CultureVisualPalette,
  phase: number = 0,
  options?: { node?: string; flagColor?: number }
): void {
  drawCampTentAndFlag(g, cx, cy, kit, cult, phase, true, options);
}

/**
 * Draws a distinct military encampment pavilion tent and heraldic banner meeple
 * representing posted garrisons stationed on player outposts and flag tiles,
 * as well as marching garrison deployment/recall columns.
 *
 * Distinct features:
 * - 3D pitched pavilion canvas ridgepole tent with guy ropes and timber ground pegs
 * - Open arched tent flap revealing a warm glowing lantern / hearth amber light
 * - Defensive garrison armaments leaning beside the tent (steel spearhead & heraldic guard shield)
 * - Elevated royal hardwood flagpole with gilded finial and waving swallowtail standard
 * - Heraldic garrison chevron / charge emblazoned on the waving banner
 * - Floating fortified steel & gold garrison shield crest indicating defensive readiness
 * - Culture-responsive palettes and architectural styling across all 5 cultures
 */
export function drawGarrisonMeeple(
  pawnsG: Graphics,
  x: number,
  y: number,
  kit: CultureKit,
  cult: CultureVisualPalette,
  power: number = 0,
  phase: number = 0,
  options?: { facing?: number; frame?: 0 | 1 | 2; isColumn?: boolean; tired?: boolean }
): void {
  const facing = options?.facing ?? 1;
  const isColumn = !!options?.isColumn;
  const isTired = Boolean(options?.tired);
  const bob = (isColumn && !isTired) ? (options?.frame === 0 ? 0 : 2) : 0;
  const cy = y - bob;

  // 1. Dual Ground Contact Shadows (encampment footprint + flagpole base)
  pawnsG.ellipse(x - 3.5, cy + 5.5, 9.5, 3.4);
  pawnsG.fill({ color: 0x000000, alpha: 0.45 });

  pawnsG.ellipse(x + 5.5, cy + 5.5, 4.0, 1.8);
  pawnsG.fill({ color: 0x000000, alpha: 0.38 });

  // 2. Tension Guy Ropes & Timber Ground Pegs
  // Left rear tension rope & timber peg
  pawnsG.moveTo(x - 9, cy + 3.2);
  pawnsG.lineTo(x - 13.5, cy + 6.2);
  pawnsG.stroke({ width: 0.7, color: 0xd4a373 });
  pawnsG.rect(x - 14, cy + 5.2, 1.5, 2.5);
  pawnsG.fill({ color: 0x78350f });

  // Right tension rope & timber peg
  pawnsG.moveTo(x + 2, cy + 3.2);
  pawnsG.lineTo(x + 5, cy + 6.2);
  pawnsG.stroke({ width: 0.7, color: 0xd4a373 });
  pawnsG.rect(x + 4.5, cy + 5.2, 1.5, 2.5);
  pawnsG.fill({ color: 0x78350f });

  // 3. Pavilion Military Tent
  const canvasMain =
    kit === "sand"
      ? 0xd97706
      : kit === "cedar"
      ? 0x15803d
      : kit === "steppe"
      ? 0xa16207
      : kit === "islands"
      ? 0x0284c7
      : 0xb45309;

  const canvasDark = blendDark(canvasMain, 0.4);
  const canvasLight = blendLight(canvasMain, 0.25);
  const timberColor = cult.timber ?? 0x78350f;

  if (kit === "steppe") {
    // Steppe: Conical nomadic yurt pavilion
    // Round yurt lower cylinder
    pawnsG.rect(x - 9.5, cy - 0.5, 12.5, 6);
    pawnsG.fill({ color: canvasDark });
    pawnsG.stroke({ width: 0.7, color: 0x451a03 });

    // Conical felt roof dome
    pawnsG.poly([
      x - 10.5, cy - 0.5,
      x - 3.5, cy - 7.5,
      x + 3.5, cy - 0.5,
    ]);
    pawnsG.fill({ color: canvasLight });
    pawnsG.stroke({ width: 0.7, color: 0x451a03 });

    // Yurt crown / compression ring
    pawnsG.circle(x - 3.5, cy - 7.5, 1.4);
    pawnsG.fill({ color: 0xd6d3d1 });
    pawnsG.stroke({ width: 0.5, color: 0x451a03 });
  } else {
    // Pitched Pavilion Ridge Tent
    // Left roof pitch (shadowed)
    pawnsG.poly([
      x - 10, cy + 5.5,
      x - 3.5, cy - 6,
      x - 1, cy - 6,
      x - 7, cy + 5.5,
    ]);
    pawnsG.fill({ color: canvasDark });

    // Right roof pitch / front gable (sunlit)
    pawnsG.poly([
      x - 7, cy + 5.5,
      x - 1, cy - 6,
      x + 3, cy + 5.5,
    ]);
    pawnsG.fill({ color: canvasLight });

    // Roof ridge outline
    pawnsG.poly([
      x - 10, cy + 5.5,
      x - 3.5, cy - 6,
      x - 1, cy - 6,
      x + 3, cy + 5.5,
    ]);
    pawnsG.stroke({ width: 0.7, color: 0x451a03 });

    // Ridgepole along apex
    pawnsG.moveTo(x - 4, cy - 6);
    pawnsG.lineTo(x - 0.5, cy - 6);
    pawnsG.stroke({ width: 1.3, color: timberColor });
  }

  // Faction Tabard Scalloped Valance / Eaves Trim
  pawnsG.poly([
    x - 10, cy + 2,
    x - 3.5, cy - 2.5,
    x + 3, cy + 2,
    x + 3, cy + 3.4,
    x - 3.5, cy - 1.2,
    x - 10, cy + 3.4,
  ]);
  pawnsG.fill({ color: cult.tabard });
  pawnsG.stroke({ width: 0.5, color: blendDark(cult.tabard, 0.4) });

  // Arched Tent Entrance Flap
  pawnsG.poly([
    x - 5.5, cy + 5.5,
    x - 3.5, cy - 0.2,
    x - 1.5, cy + 5.5,
  ]);
  pawnsG.fill({ color: 0x1c1917 });

  // Glowing Lantern / Hearth Fire inside tent
  pawnsG.circle(x - 3.5, cy + 3.0, 2.2);
  pawnsG.fill({ color: 0xf59e0b, alpha: 0.28 });
  pawnsG.circle(x - 3.5, cy + 3.0, 1.3);
  pawnsG.fill({ color: 0xfef08a });
  pawnsG.circle(x - 3.5, cy + 3.0, 0.6);
  pawnsG.fill({ color: 0xffffff });

  // 4. Defensive Garrison Armaments Beside Tent
  // Guard Spear / Halberd leaning against left flank
  pawnsG.moveTo(x - 8.5, cy + 5);
  pawnsG.lineTo(x - 6.5, cy - 9.5);
  pawnsG.stroke({ width: 1.2, color: timberColor });

  // Steel Spearhead
  pawnsG.poly([
    x - 7.6, cy - 8.5,
    x - 6.5, cy - 12,
    x - 5.4, cy - 8.5,
  ]);
  pawnsG.fill({ color: 0xe2e8f0 });
  pawnsG.stroke({ width: 0.5, color: 0x475569 });

  // Crossbar / Halberd hook
  pawnsG.moveTo(x - 8, cy - 7.5);
  pawnsG.lineTo(x - 5, cy - 7.5);
  pawnsG.stroke({ width: 0.7, color: 0x94a3b8 });

  // Leaning Heater / Buckler Shield beside tent entrance
  if (kit === "sand" || kit === "steppe") {
    // Round Buckler Shield
    pawnsG.circle(x - 7.2, cy + 3.2, 2.5);
    pawnsG.fill({ color: cult.tabard });
    pawnsG.stroke({ width: 0.6, color: 0xfacc15 });
    pawnsG.circle(x - 7.2, cy + 3.2, 0.9);
    pawnsG.fill({ color: 0xfde047 });
  } else {
    // Heater Shield with golden rim
    pawnsG.poly([
      x - 8.8, cy + 1,
      x - 5.2, cy + 1,
      x - 5.2, cy + 4.5,
      x - 7.0, cy + 6.8,
      x - 8.8, cy + 4.5,
    ]);
    pawnsG.fill({ color: cult.tabard });
    pawnsG.stroke({ width: 0.6, color: 0xfacc15 });
    // Center boss
    pawnsG.circle(x - 7.0, cy + 3.2, 0.7);
    pawnsG.fill({ color: 0xfde047 });
  }

  // 5. Elevated Royal Heraldic War Banner
  // Hardwood Flagpole
  const poleX = x + 5.5;
  pawnsG.moveTo(poleX, cy + 6);
  pawnsG.lineTo(poleX, cy - 16);
  pawnsG.stroke({ width: 1.5, color: timberColor });

  // Pole Base Iron Bracket
  pawnsG.rect(poleX - 1.2, cy + 3.5, 2.4, 2.5);
  pawnsG.fill({ color: 0x27272a });

  // Gilded Finial Tip
  pawnsG.circle(poleX, cy - 16.5, 1.4);
  pawnsG.fill({ color: 0xfacc15 });
  pawnsG.circle(poleX, cy - 16.5, 0.5);
  pawnsG.fill({ color: 0xffffff });

  // Culture-specific finial decoration
  if (kit === "cedar") {
    // Red huntsman plume
    pawnsG.moveTo(poleX, cy - 16.5);
    pawnsG.lineTo(poleX - 2.5, cy - 19.5);
    pawnsG.stroke({ width: 1.1, color: 0xef4444 });
    pawnsG.circle(poleX - 2.5, cy - 19.5, 0.6);
    pawnsG.fill({ color: 0xfacc15 });
  } else if (kit === "steppe") {
    // Horsehair pennant tuft
    pawnsG.moveTo(poleX, cy - 15.5);
    pawnsG.lineTo(poleX - 2, cy - 11.5);
    pawnsG.stroke({ width: 1.1, color: 0xd6d3d1 });
  } else if (kit === "islands") {
    // Sea pearl
    pawnsG.circle(poleX, cy - 16.5, 1.2);
    pawnsG.fill({ color: 0x06b6d4 });
  }

  // Waving Heraldic Swallowtail Standard (suppressed when tired)
  const flagWave = isTired ? 0 : Math.sin(phase * 4 + (x + y) * 0.15) * 2;
  pawnsG.poly([
    poleX, cy - 16,
    poleX + 11.5 + flagWave, cy - 12.5,
    poleX + 9.0 + flagWave * 0.7, cy - 9.5,
    poleX + 11.5 + flagWave, cy - 6.5,
    poleX, cy - 6.5,
  ]);
  pawnsG.fill({ color: cult.tabard });
  pawnsG.stroke({ width: 0.7, color: cult.accent ?? 0xfacc15 });

  // Heraldic Garrison Charge (Chevron / Insignia on banner)
  pawnsG.poly([
    poleX + 2.5 + flagWave * 0.2, cy - 12.5,
    poleX + 5.5 + flagWave * 0.45, cy - 9.5,
    poleX + 2.5 + flagWave * 0.2, cy - 7.5,
    poleX + 4.0 + flagWave * 0.3, cy - 7.5,
    poleX + 7.0 + flagWave * 0.55, cy - 9.5,
    poleX + 4.0 + flagWave * 0.3, cy - 12.5,
  ]);
  pawnsG.fill({ color: 0xfde047 });

  // 6. Floating Fortified Garrison Readiness Crest (Power Emblem)
  const badgeX = x - 3.5;
  const badgeY = cy - 14;

  // Steel & Gold Garrison Shield Badge
  pawnsG.poly([
    badgeX - 4.5, badgeY - 3.5,
    badgeX + 4.5, badgeY - 3.5,
    badgeX + 4.5, badgeY,
    badgeX, badgeY + 4.2,
    badgeX - 4.5, badgeY,
  ]);
  pawnsG.fill({ color: 0x0f172a, alpha: 0.92 });
  pawnsG.stroke({ width: 0.8, color: 0xfacc15, alpha: 0.95 });

  // Inner Garrison Power Indicators
  if (power >= 25) {
    // Elite garrison: 2 golden stars
    pawnsG.circle(badgeX - 2.0, badgeY - 0.5, 0.9);
    pawnsG.fill({ color: 0xfde047 });
    pawnsG.circle(badgeX + 2.0, badgeY - 0.5, 0.9);
    pawnsG.fill({ color: 0xfde047 });
    pawnsG.circle(badgeX, badgeY + 1.2, 0.6);
    pawnsG.fill({ color: 0xfde047 });
  } else if (power > 0) {
    // Standard garrison: 1 central golden garrison star
    pawnsG.circle(badgeX, badgeY - 0.2, 1.2);
    pawnsG.fill({ color: 0xfacc15 });
    pawnsG.circle(badgeX, badgeY - 0.2, 0.5);
    pawnsG.fill({ color: 0xffffff });
  } else {
    // Sentry post / minimal outpost
    pawnsG.circle(badgeX, badgeY - 0.2, 0.9);
    pawnsG.fill({ color: 0x94a3b8 });
  }
}

/**
 * Draws a distinct, menacing red warband meeple for hostile incoming marches
 * advancing on player territory or traversing the isometric board.
 *
 * Distinct features:
 * - Spiked blackened iron pedestal base with crimson danger ring
/**
 * 3x5 Pixel Bitmap Font for numeric digits 0-9 and unit 's'.
 * Bit 2 is x=0, Bit 1 is x=1, Bit 0 is x=2.
 */
export const MARCH_ETA_GLYPHS_3X5: Record<string, number[]> = {
  "0": [7, 5, 5, 5, 7],
  "1": [2, 6, 2, 2, 7],
  "2": [7, 1, 7, 4, 7],
  "3": [7, 1, 7, 1, 7],
  "4": [5, 5, 7, 1, 1],
  "5": [7, 4, 7, 1, 7],
  "6": [7, 4, 7, 5, 7],
  "7": [7, 1, 1, 1, 1],
  "8": [7, 5, 7, 5, 7],
  "9": [7, 5, 7, 1, 7],
  "s": [7, 4, 7, 1, 7],
};

/**
 * Draws a tiny seconds badge floating above a board march meeple.
 * Strictly non-interactive (pointer-events: none on layer), pure pixel art graphics.
 * Shows remaining seconds (e.g. "4s", "18s", "0s") with an hourglass/hazard pip.
 */
export function drawMarchEtaBadge(
  pawnsG: Graphics,
  pawnX: number,
  pawnY: number,
  secs: number,
  borderColor: number = 0xf59e0b,
  bob: number = 0,
  isHostile: boolean = false
): void {
  const safeSecs = Math.max(0, Math.floor(secs));
  const text = `${safeSecs}s`;

  // Compute compact width based on char count
  // Each char: 3px wide, 1px spacing. Icon: 3px. Padding: 3px left & right. Gap: 2px.
  // totalWidth = 3 + 3 + 2 + (text.length * 3 + (text.length - 1)) + 3 = 10 + 4 * text.length
  const badgeW = Math.max(18, 10 + 4 * text.length);
  const badgeH = 9;
  const badgeX = Math.round(pawnX - badgeW / 2);
  const badgeY = Math.round(pawnY - 28 - bob);

  // 1. Subtle drop shadow
  pawnsG.rect(badgeX, badgeY + 1, badgeW, badgeH);
  pawnsG.fill({ color: 0x000000, alpha: 0.45 });

  // 2. Crisp dark pill container with faction/threat border
  pawnsG.rect(badgeX, badgeY, badgeW, badgeH);
  pawnsG.fill({ color: 0x090d16, alpha: 0.95 });
  pawnsG.stroke({ width: 0.9, color: borderColor, alpha: 0.95 });

  // 3. Status pip on the left: Skull/hazard for hostile, golden hourglass for friendly/neutral
  const iconX = badgeX + 3;
  const iconY = badgeY + 2;

  if (isHostile) {
    // Red skull / hazard pip
    pawnsG.circle(iconX + 1.5, iconY + 1.5, 1.4);
    pawnsG.fill({ color: 0xf87171 });
    pawnsG.rect(iconX + 0.5, iconY + 2.5, 2, 1.2);
    pawnsG.fill({ color: 0xf87171 });
  } else {
    // Golden hourglass pip
    pawnsG.rect(iconX, iconY, 3, 1);
    pawnsG.rect(iconX + 1, iconY + 1, 1, 3);
    pawnsG.rect(iconX, iconY + 4, 3, 1);
    pawnsG.fill({ color: 0xfde047 });
  }

  // 4. Pixel font characters (3x5) in crisp white
  let charX = iconX + 3 + 2;
  const charY = badgeY + 2;

  for (let c = 0; c < text.length; c++) {
    const ch = text[c];
    const glyph = MARCH_ETA_GLYPHS_3X5[ch] ?? MARCH_ETA_GLYPHS_3X5["s"];
    for (let r = 0; r < 5; r++) {
      const bits = glyph[r];
      if (bits === 7) {
        pawnsG.rect(charX, charY + r, 3, 1);
      } else if (bits === 6) {
        pawnsG.rect(charX, charY + r, 2, 1);
      } else if (bits === 5) {
        pawnsG.rect(charX, charY + r, 1, 1);
        pawnsG.rect(charX + 2, charY + r, 1, 1);
      } else if (bits === 4) {
        pawnsG.rect(charX, charY + r, 1, 1);
      } else if (bits === 3) {
        pawnsG.rect(charX + 1, charY + r, 2, 1);
      } else if (bits === 2) {
        pawnsG.rect(charX + 1, charY + r, 1, 1);
      } else if (bits === 1) {
        pawnsG.rect(charX + 2, charY + r, 1, 1);
      }
    }
    charX += 4;
  }
  pawnsG.fill({ color: 0xffffff });
}

/**
 * Draws a distinct, menacing red warband meeple for hostile incoming marches
 * - Hulking iron-armored torso with blood-red warband surcoat and crossed iron harness straps
 * - Tiered spiked iron pauldrons (shoulders) with aggressive silhouette
 * - Horned iron war helm with curved demon/warband horns
 * - Glowing crimson eye-slit visor with burning pupil hot spots and pulsing aura
 * - Heavy barbed halberd axe blade with specular cutting bevel and ragged waving crimson/black war pennant
 * - Spiked off-hand heater shield with central iron boss
 * - Floating ETA/threat pill badge with skull hazard emblem and remaining seconds badge
 * - Adapts subtle heraldic accents if the hostile march belongs to a specific rival realm
 */
export function drawRedWarbandMeeple(
  pawnsG: Graphics,
  pawnX: number,
  pawnY: number,
  facing: number,
  frame: 0 | 1 | 2,
  bob: number,
  realmId?: string,
  phase: number = 0,
  power: number = 0,
  secs?: number
): void {
  const pal = realmId ? realmTokenPalette(realmId) : null;
  const accentRed = 0xdc2626;
  const darkRed = 0x991b1b;
  const bloodRed = 0x7f1d1d;

  // 1. Heavy Contact Shadow with Ground Menace Pulse
  pawnsG.ellipse(pawnX, pawnY + 6.5, 10.5, 4.2);
  pawnsG.fill({ color: 0x000000, alpha: 0.6 });

  // 2. Heavy Spiked Blackened Iron Pedestal
  pawnsG.rect(pawnX - 7.5, pawnY + 2 - bob, 15, 4.5);
  pawnsG.fill({ color: 0x18181b });
  pawnsG.stroke({ width: 0.8, color: 0x3f3f46 });

  // Spiked flange studs
  pawnsG.circle(pawnX - 5.5, pawnY + 4.2 - bob, 0.8);
  pawnsG.fill({ color: 0x71717a });
  pawnsG.circle(pawnX + 5.5, pawnY + 4.2 - bob, 0.8);
  pawnsG.fill({ color: 0x71717a });

  // Crimson danger ring on pedestal
  pawnsG.rect(pawnX - 6.5, pawnY + 1.2 - bob, 13, 2.0);
  pawnsG.fill({ color: accentRed });
  pawnsG.stroke({ width: 0.5, color: darkRed });

  // 3. Angular Blackened Iron Meeple Torso
  pawnsG.poly([
    pawnX - 6.5, pawnY + 2 - bob,
    pawnX - 4.5, pawnY - 8.5 - bob,
    pawnX + 4.5, pawnY - 8.5 - bob,
    pawnX + 6.5, pawnY + 2 - bob,
  ]);
  pawnsG.fill({ color: 0x27272a });
  pawnsG.stroke({ width: 0.8, color: 0x09090b });

  // 4. Spiked Iron Pauldrons (Shoulders)
  pawnsG.poly([
    pawnX - 8.5, pawnY - 5 - bob,
    pawnX - 5.0, pawnY - 10.5 - bob,
    pawnX - 3.5, pawnY - 5 - bob,
  ]);
  pawnsG.fill({ color: 0x3f3f46 });
  pawnsG.stroke({ width: 0.6, color: 0x18181b });

  pawnsG.poly([
    pawnX + 3.5, pawnY - 5 - bob,
    pawnX + 5.0, pawnY - 10.5 - bob,
    pawnX + 8.5, pawnY - 5 - bob,
  ]);
  pawnsG.fill({ color: 0x3f3f46 });
  pawnsG.stroke({ width: 0.6, color: 0x18181b });

  // 5. Blood-Red Warband Tabard & Crossed Iron Straps
  pawnsG.rect(pawnX - 3.0, pawnY - 7.5 - bob, 6.0, 6.5);
  pawnsG.fill({ color: darkRed });

  // Crossed harness straps
  pawnsG.moveTo(pawnX - 2.5, pawnY - 6.5 - bob);
  pawnsG.lineTo(pawnX + 2.5, pawnY - 2.0 - bob);
  pawnsG.stroke({ width: 0.9, color: 0x18181b });

  pawnsG.moveTo(pawnX + 2.5, pawnY - 6.5 - bob);
  pawnsG.lineTo(pawnX - 2.5, pawnY - 2.0 - bob);
  pawnsG.stroke({ width: 0.9, color: 0x18181b });

  // Central iron skull / medallion boss
  pawnsG.circle(pawnX, pawnY - 4.2 - bob, 1.2);
  pawnsG.fill({ color: pal ? pal.studColor : 0xd4d4d8 });

  // 6. Jagged Dark Iron Helm with Curved Horn Spikes
  pawnsG.circle(pawnX, pawnY - 12 - bob, 4.0);
  pawnsG.fill({ color: 0x18181b });
  pawnsG.stroke({ width: 0.8, color: 0x09090b });

  // Left curved horn
  pawnsG.poly([
    pawnX - 3.0, pawnY - 13.0 - bob,
    pawnX - 7.5, pawnY - 18.0 - bob,
    pawnX - 1.5, pawnY - 14.0 - bob,
  ]);
  pawnsG.fill({ color: 0x52525b });
  pawnsG.stroke({ width: 0.6, color: 0x18181b });

  // Right curved horn
  pawnsG.poly([
    pawnX + 1.5, pawnY - 14.0 - bob,
    pawnX + 7.5, pawnY - 18.0 - bob,
    pawnX + 3.0, pawnY - 13.0 - bob,
  ]);
  pawnsG.fill({ color: 0x52525b });
  pawnsG.stroke({ width: 0.6, color: 0x18181b });

  // Glowing crimson eye-slit visor with ambient corona
  const eyePulse = Math.sin(phase * 8) * 0.2 + 0.8;
  pawnsG.ellipse(pawnX, pawnY - 12 - bob, 2.8, 1.6);
  pawnsG.fill({ color: bloodRed, alpha: 0.65 * eyePulse });

  pawnsG.rect(pawnX - 2.4, pawnY - 12.5 - bob, 4.8, 1.4);
  pawnsG.fill({ color: 0xef4444 });

  // Dual specular burning red/white hot spots
  pawnsG.circle(pawnX - 1.1, pawnY - 12 - bob, 0.45);
  pawnsG.fill({ color: 0xffffff });
  pawnsG.circle(pawnX + 1.1, pawnY - 12 - bob, 0.45);
  pawnsG.fill({ color: 0xffffff });

  // 7. Spiked Heater Shield on Off-Arm
  const armSwing = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  pawnsG.poly([
    pawnX - facing * 3.5, pawnY - 9 - bob + armSwing,
    pawnX - facing * 8.5, pawnY - 9 - bob + armSwing,
    pawnX - facing * 8.5, pawnY - 2 - bob + armSwing,
    pawnX - facing * 6.0, pawnY + 3 - bob + armSwing,
    pawnX - facing * 3.5, pawnY - 2 - bob + armSwing,
  ]);
  pawnsG.fill({ color: pal ? pal.borderColor : bloodRed });
  pawnsG.stroke({ width: 0.8, color: accentRed });

  // Shield iron spike boss
  pawnsG.circle(pawnX - facing * 6.0, pawnY - 3.5 - bob + armSwing, 1.2);
  pawnsG.fill({ color: 0xd4d4d8 });

  // 8. Heavy Blackened Polearm & Ragged Crimson War Pennant
  // Polearm shaft
  pawnsG.moveTo(pawnX + facing * 5.0, pawnY + 4 - bob);
  pawnsG.lineTo(pawnX + facing * 5.0, pawnY - 22 - bob + armSwing);
  pawnsG.stroke({ width: 1.6, color: 0x18181b });

  // Jagged barbed halberd axe head
  pawnsG.poly([
    pawnX + facing * 5.0, pawnY - 22 - bob + armSwing,
    pawnX + facing * 11.5, pawnY - 18.5 - bob + armSwing,
    pawnX + facing * 8.5, pawnY - 14.5 - bob + armSwing,
    pawnX + facing * 5.0, pawnY - 15.5 - bob + armSwing,
  ]);
  pawnsG.fill({ color: 0x71717a });
  pawnsG.stroke({ width: 0.7, color: 0x09090b });

  // Razor cutting edge
  pawnsG.moveTo(pawnX + facing * 11.5, pawnY - 18.5 - bob + armSwing);
  pawnsG.lineTo(pawnX + facing * 8.5, pawnY - 14.5 - bob + armSwing);
  pawnsG.stroke({ width: 0.9, color: 0xf87171 });

  // Ragged crimson/black war pennant
  const hWave = Math.sin(phase * 8.5) * 2.0;
  pawnsG.poly([
    pawnX + facing * 5.0, pawnY - 14.5 - bob + armSwing,
    pawnX + facing * 15.0 + hWave, pawnY - 11.5 - bob + armSwing,
    pawnX + facing * 12.0 + hWave * 0.7, pawnY - 9.0 - bob + armSwing,
    pawnX + facing * 15.0 + hWave, pawnY - 7.0 - bob + armSwing,
    pawnX + facing * 5.0, pawnY - 7.5 - bob + armSwing,
  ]);
  pawnsG.fill({ color: pal ? pal.pennantColor : bloodRed });
  pawnsG.stroke({ width: 0.7, color: 0x18181b });

  // 9. Floating Hostile Threat & ETA Pill Badge
  if (typeof secs === "number") {
    drawMarchEtaBadge(pawnsG, pawnX, pawnY, secs, accentRed, bob, true);
  } else {
    pawnsG.rect(pawnX - 16, pawnY - 28 - bob, 32, 9);
    pawnsG.fill({ color: 0x000000, alpha: 0.45 });
    pawnsG.rect(pawnX - 16, pawnY - 29 - bob, 32, 9);
    pawnsG.fill({ color: 0x09090b, alpha: 0.95 });
    pawnsG.stroke({ width: 1, color: accentRed, alpha: 0.95 });

    // Skull / Hazard Icon on the left
    pawnsG.circle(pawnX - 10.5, pawnY - 24.5 - bob, 2.0);
    pawnsG.fill({ color: 0xf87171 });
    pawnsG.rect(pawnX - 11.5, pawnY - 23.5 - bob, 2.0, 1.2);
    pawnsG.fill({ color: 0xf87171 });

    // Threat indicator dots inside pill
    pawnsG.circle(pawnX - 4, pawnY - 24.5 - bob, 1.5);
    pawnsG.fill({ color: 0xef4444 });
    pawnsG.circle(pawnX + 2, pawnY - 24.5 - bob, 1.5);
    pawnsG.fill({ color: accentRed });
    pawnsG.circle(pawnX + 8, pawnY - 24.5 - bob, 1.5);
    pawnsG.fill({ color: darkRed });
  }
}

export const drawWarbandMeeple = drawRedWarbandMeeple;

export function paintBoardMarches(
  routeG: Graphics,
  pawnsG: Graphics,
  state: GameState | null,
  phase: number
): void {
  routeG.clear();
  pawnsG.clear();
  if (!state?.board) return;

  const marches = listMarches(state);
  const renderedGatherIds = new Set<string>();

  for (const m of marches) {
    const fromProv = getProvince(state, m.fromId);
    const toProv = getProvince(state, m.toId);
    if (!fromProv || !toProv) continue;

    const fromB = provinceTokenBounds(fromProv.x, fromProv.y);
    const toB = provinceTokenBounds(toProv.x, toProv.y);
    const isPlayer = m.realmId === "player";
    const isScout = isScoutMarch(m);
    const isGather = !isScout && isGatherMarch(m, state);
    const isGarrison = !isScout && !isGather && isGarrisonMarch(m);

    // 1. Dotted Route Trail between origin and destination
    const dx = toB.cx - fromB.cx;
    const dy = toB.cy - fromB.cy;
    const distPx = Math.hypot(dx, dy);
    const steps = Math.max(4, Math.floor(distPx / 14));

    if (isScout) {
      // Stealth reconnaissance route trail (midnight cyan & starlight core)
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lx = fromB.cx + dx * t;
        const ly = fromB.cy + dy * t;
        const pulse = Math.sin(phase * 4 + i * 0.5) * 0.2 + 0.8;
        // Outer cyan recon aura
        routeG.circle(lx, ly, i % 2 === 0 ? 2.2 : 1.4);
        routeG.fill({ color: 0x0284c7, alpha: 0.35 * pulse });
        // Crisp starlight core
        routeG.circle(lx, ly, i % 2 === 0 ? 1.2 : 0.8);
        routeG.fill({ color: 0xe0f2fe, alpha: 0.85 * pulse });
      }

      // Recon destination spyglass/compass indicator
      routeG.circle(toB.cx, toB.cy, 11);
      routeG.stroke({ width: 1.4, color: 0x38bdf8, alpha: 0.85 });
      routeG.circle(toB.cx, toB.cy, 4.5);
      routeG.stroke({ width: 1, color: 0x0284c7, alpha: 0.65 });
      routeG.moveTo(toB.cx - 13, toB.cy); routeG.lineTo(toB.cx - 8, toB.cy);
      routeG.moveTo(toB.cx + 8, toB.cy); routeG.lineTo(toB.cx + 13, toB.cy);
      routeG.moveTo(toB.cx, toB.cy - 13); routeG.lineTo(toB.cx, toB.cy - 8);
      routeG.moveTo(toB.cx, toB.cy + 8); routeG.lineTo(toB.cx, toB.cy + 13);
      routeG.stroke({ width: 1, color: 0x38bdf8, alpha: 0.75 });
      routeG.circle(toB.cx, toB.cy, 1.8);
      routeG.fill({ color: 0xfef08a, alpha: 0.9 });
    } else if (isGather) {
      // Pastoral foraging route trail (emerald & harvest gold)
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lx = fromB.cx + dx * t;
        const ly = fromB.cy + dy * t;
        const pulse = Math.sin(phase * 4 + i * 0.45) * 0.2 + 0.8;
        routeG.circle(lx, ly, i % 2 === 0 ? 2.4 : 1.6);
        routeG.fill({ color: 0x16a34a, alpha: 0.35 * pulse });
        routeG.circle(lx, ly, i % 2 === 0 ? 1.4 : 0.9);
        routeG.fill({ color: 0xfef08a, alpha: 0.85 * pulse });
      }

      // Harvest destination target indicator (green harvest circle & seed center)
      routeG.circle(toB.cx, toB.cy, 11);
      routeG.stroke({ width: 1.4, color: 0x22c55e, alpha: 0.85 });
      routeG.circle(toB.cx, toB.cy, 4.5);
      routeG.stroke({ width: 1, color: 0x16a34a, alpha: 0.65 });
      routeG.circle(toB.cx, toB.cy, 2);
      routeG.fill({ color: 0xfacc15, alpha: 0.8 });
    } else if (isGarrison) {
      // Royal blue & gold garrison deployment route trail
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lx = fromB.cx + dx * t;
        const ly = fromB.cy + dy * t;
        const pulse = Math.sin(phase * 4 + i * 0.4) * 0.2 + 0.8;
        // Outer royal blue aura
        routeG.circle(lx, ly, i % 2 === 0 ? 2.5 : 1.6);
        routeG.fill({ color: 0x2563eb, alpha: 0.35 * pulse });
        // Steel / golden core
        routeG.circle(lx, ly, i % 2 === 0 ? 1.3 : 0.8);
        routeG.fill({ color: 0xfde047, alpha: 0.85 * pulse });
      }

      // Fortified outpost destination target indicator
      routeG.circle(toB.cx, toB.cy, 11);
      routeG.stroke({ width: 1.4, color: 0x2563eb, alpha: 0.85 });
      routeG.circle(toB.cx, toB.cy, 4.5);
      routeG.stroke({ width: 1, color: 0x1d4ed8, alpha: 0.65 });
      routeG.moveTo(toB.cx - 12, toB.cy); routeG.lineTo(toB.cx + 12, toB.cy);
      routeG.moveTo(toB.cx, toB.cy - 12); routeG.lineTo(toB.cx, toB.cy + 12);
      routeG.stroke({ width: 0.8, color: 0x60a5fa, alpha: 0.75 });
      routeG.circle(toB.cx, toB.cy, 1.8);
      routeG.fill({ color: 0xfacc15, alpha: 0.9 });
    } else {
      const trailColor = isPlayer ? 0xf59e0b : 0xef4444;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lx = fromB.cx + dx * t;
        const ly = fromB.cy + dy * t;
        const pulse = Math.sin(phase * 4 + i * 0.4) * 0.2 + 0.8;
        // High-contrast outer glow
        routeG.circle(lx, ly, i % 2 === 0 ? 2.6 : 1.8);
        routeG.fill({ color: trailColor, alpha: 0.35 * pulse });
        // Sharp inner core
        routeG.circle(lx, ly, i % 2 === 0 ? 1.5 : 1.0);
        routeG.fill({ color: 0xffffff, alpha: 0.85 * pulse });
      }

      // Destination target indicator
      routeG.circle(toB.cx, toB.cy, 11);
      routeG.stroke({ width: 1.5, color: trailColor, alpha: 0.85 });
      routeG.circle(toB.cx, toB.cy, 4);
      routeG.stroke({ width: 1, color: trailColor, alpha: 0.65 });
      routeG.moveTo(toB.cx - 14, toB.cy); routeG.lineTo(toB.cx + 14, toB.cy);
      routeG.moveTo(toB.cx, toB.cy - 14); routeG.lineTo(toB.cx, toB.cy + 14);
      routeG.stroke({ width: 1, color: trailColor, alpha: 0.7 });
    }

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

    const hasArrival = typeof m.arrivesTick === "number";
    const ticksLeft = hasArrival ? Math.max(0, m.arrivesTick - (state.meta.tick ?? 0)) : 0;
    const secs = Math.ceil(ticksLeft / 10);

    const cultId = state && sim.playerCultureId ? sim.playerCultureId(state) : undefined;
    const kit = resolveCultureKit(cultId);
    const cult = culturePalette(cultId);

    if (isScout) {
      drawScoutColumnMeeple(
        pawnsG,
        pawnX,
        pawnY,
        facing,
        frame,
        bob,
        kit,
        cult,
        phase,
        progress
      );
      if (hasArrival) {
        drawMarchEtaBadge(pawnsG, pawnX, pawnY, secs, 0x38bdf8, bob);
      }
    } else if (isGather) {
      renderedGatherIds.add(m.id);
      if (m.toId) renderedGatherIds.add(m.toId);
      const gatherLoad = resolveGatherLoadInfo(m, state);
      drawGatherColumnMeeple(
        pawnsG,
        pawnX,
        pawnY,
        facing,
        frame,
        bob,
        kit,
        cult,
        toProv.node,
        phase,
        progress,
        gatherLoad
      );
      if (hasArrival) {
        drawMarchEtaBadge(pawnsG, pawnX, pawnY, secs, 0x22c55e, bob);
      }
    } else if (isGarrison) {
      let gPower = 0;
      if (m.force) {
        for (const n of Object.values(m.force)) gPower += Number(n) || 0;
      }
      const isTired = isFoodStoresEmptyOrLow(state);
      drawGarrisonMeeple(
        pawnsG,
        pawnX,
        pawnY,
        kit,
        cult,
        gPower,
        phase,
        { facing, frame, isColumn: true, tired: isTired }
      );
      if (hasArrival) {
        drawMarchEtaBadge(pawnsG, pawnX, pawnY, secs, 0x3b82f6, bob);
      }
    } else if (isPlayer) {
      // Player: Meeple styled in the matching unit type pixel language (archer, knight, cavalry, siege, spearman, etc.)
      const unitType = primaryUnitTypeForMarch(m);
      const pal = unitPalette(unitType, cultId);

      // Base contact shadow
      pawnsG.ellipse(pawnX, pawnY + 6.5, 9.5, 4);
      pawnsG.fill({ color: 0x000000, alpha: 0.55 });

      // Turned wooden pawn pedestal base with golden faction ring
      pawnsG.rect(pawnX - 7, pawnY + 2 - bob, 14, 4.5);
      pawnsG.fill({ color: 0x451a03 });
      pawnsG.stroke({ width: 0.8, color: 0x271302 });

      // Golden Faction Ring on top of pedestal
      pawnsG.rect(pawnX - 6, pawnY + 1.2 - bob, 12, 1.8);
      pawnsG.fill({ color: 0xfacc15 });
      pawnsG.rect(pawnX - 4, pawnY + 1.5 - bob, 8, 1.2);
      pawnsG.fill({ color: 0x2563eb });

      // Corner golden studs
      pawnsG.circle(pawnX - 5.5, pawnY + 4.2 - bob, 0.7); pawnsG.fill({ color: 0xfde047 });
      pawnsG.circle(pawnX + 5.5, pawnY + 4.2 - bob, 0.7); pawnsG.fill({ color: 0xfde047 });

      if (pal.isChassis) {
        // Siege Engine: wheeled chassis, upright A-frame, throwing beam
        // Large spiked wooden wheels with iron rims & bronze hubs
        pawnsG.circle(pawnX - 6, pawnY + 2 - bob, 3.5);
        pawnsG.fill({ color: 0x27272a });
        pawnsG.stroke({ width: 0.8, color: 0x52525b });
        pawnsG.circle(pawnX - 6, pawnY + 2 - bob, 1.2);
        pawnsG.fill({ color: 0xd4a359 });

        pawnsG.circle(pawnX + 6, pawnY + 2 - bob, 3.5);
        pawnsG.fill({ color: 0x27272a });
        pawnsG.stroke({ width: 0.8, color: 0x52525b });
        pawnsG.circle(pawnX + 6, pawnY + 2 - bob, 1.2);
        pawnsG.fill({ color: 0xd4a359 });

        // Heavy timber chassis bed
        pawnsG.rect(pawnX - 8, pawnY - 3 - bob, 16, 5);
        pawnsG.fill({ color: 0x5c3818 });
        pawnsG.stroke({ width: 0.8, color: 0x27272a });

        // Corner iron brackets
        pawnsG.rect(pawnX - 8, pawnY - 3 - bob, 2.5, 5); pawnsG.fill({ color: 0x27272a });
        pawnsG.rect(pawnX + 5.5, pawnY - 3 - bob, 2.5, 5); pawnsG.fill({ color: 0x27272a });

        // Upright timber A-frame gantry
        pawnsG.poly([pawnX - 4, pawnY - 3 - bob, pawnX, pawnY - 14 - bob, pawnX + 4, pawnY - 3 - bob]);
        pawnsG.stroke({ width: 1.8, color: 0x78350f });

        // Throwing beam with pivot
        const armTilt = frame === 1 ? -2.5 : frame === 2 ? 2.5 : 0;
        pawnsG.moveTo(pawnX - facing * 8, pawnY - 5 - bob - armTilt);
        pawnsG.lineTo(pawnX + facing * 9, pawnY - 18 - bob + armTilt);
        pawnsG.stroke({ width: 2, color: 0x451a03 });

        // Iron counterweight box
        pawnsG.rect(pawnX - facing * 9.5, pawnY - 7.5 - bob - armTilt, 4.5, 4.5);
        pawnsG.fill({ color: 0x18181b });
        pawnsG.stroke({ width: 0.8, color: 0x52525b });

        // Sling basket loaded with stone projectile
        pawnsG.circle(pawnX + facing * 9, pawnY - 18 - bob + armTilt, 2.5);
        pawnsG.fill({ color: 0xd1d5db });
        pawnsG.stroke({ width: 0.7, color: 0x475569 });
      } else if (pal.hasMount) {
        // Cavalry: Warhorse with animated galloping legs + mounted armored lancer
        const hLeg1 = frame === 1 ? 2 : frame === 2 ? -2 : 0;
        const hLeg2 = frame === 1 ? -2 : frame === 2 ? 2 : 0;

        // Galloping legs with dark hooves
        pawnsG.rect(pawnX - 5.5, pawnY - 1 - bob + hLeg1, 2.4, 4.5);
        pawnsG.fill({ color: 0x451a03 });
        pawnsG.rect(pawnX - 5.5, pawnY + 2.5 - bob + hLeg1, 2.4, 1.2);
        pawnsG.fill({ color: 0x18181b });

        pawnsG.rect(pawnX + 4, pawnY - 1 - bob + hLeg2, 2.4, 4.5);
        pawnsG.fill({ color: 0x6b3a19 });
        pawnsG.rect(pawnX + 4, pawnY + 2.5 - bob + hLeg2, 2.4, 1.2);
        pawnsG.fill({ color: 0x18181b });

        // Horse body
        pawnsG.rect(pawnX - 6.5, pawnY - 5.5 - bob, 13, 5.5);
        pawnsG.fill({ color: 0x6b3a19 });

        // Saddle blanket / caparison
        pawnsG.rect(pawnX - 3.5, pawnY - 6.5 - bob, 7, 4.5);
        pawnsG.fill({ color: pal.tabardColor });
        pawnsG.stroke({ width: 0.6, color: 0xfacc15 });

        // Horse neck and head
        pawnsG.poly([
          pawnX + facing * 3.5, pawnY - 5.5 - bob,
          pawnX + facing * 7.5, pawnY - 12 - bob,
          pawnX + facing * 10.5, pawnY - 10 - bob,
          pawnX + facing * 5.5, pawnY - 3.5 - bob,
        ]);
        pawnsG.fill({ color: 0x6b3a19 });

        // Mane and bridle
        pawnsG.rect(pawnX + facing * 7, pawnY - 13 - bob, 2, 3);
        pawnsG.fill({ color: 0x18181b });
        pawnsG.moveTo(pawnX + facing * 9.5, pawnY - 9.5 - bob);
        pawnsG.lineTo(pawnX + facing * 2, pawnY - 9 - bob);
        pawnsG.stroke({ width: 0.7, color: 0x18181b });

        // Rider
        pawnsG.rect(pawnX - 2.5, pawnY - 12 - bob, 5.5, 6);
        pawnsG.fill({ color: pal.tabardColor });
        pawnsG.circle(pawnX, pawnY - 14 - bob, 3);
        pawnsG.fill({ color: 0xcbd5e1 });
        pawnsG.stroke({ width: 0.7, color: 0x334155 });

        // Couched lance with fluttering lance pennon
        pawnsG.moveTo(pawnX - facing * 4, pawnY - 9 - bob);
        pawnsG.lineTo(pawnX + facing * 13, pawnY - 16 - bob);
        pawnsG.stroke({ width: 1.5, color: 0x854d0e });

        // Lance steel tip
        pawnsG.poly([
          pawnX + facing * 12, pawnY - 15.5 - bob,
          pawnX + facing * 14.5, pawnY - 16.5 - bob,
          pawnX + facing * 12, pawnY - 17.5 - bob,
        ]);
        pawnsG.fill({ color: 0xffffff });

        // Lance pennon
        pawnsG.poly([
          pawnX + facing * 9, pawnY - 16 - bob,
          pawnX + facing * 14, pawnY - 14 - bob,
          pawnX + facing * 9, pawnY - 12.5 - bob,
        ]);
        pawnsG.fill({ color: pal.accentColor });
      } else {
        // Humanoid Walkers: militia, spearman, skirmisher, archer, knight, champion
        const legL = frame === 1 ? -2.2 : frame === 2 ? 1.2 : -1;
        const legR = frame === 1 ? 1.2 : frame === 2 ? -2.2 : 1;
        pawnsG.rect(pawnX + legL, pawnY - 2 - bob, 2.4, 4.5);
        pawnsG.fill({ color: 0x334155 });
        pawnsG.rect(pawnX + legR, pawnY - 2 - bob, 2.4, 4.5);
        pawnsG.fill({ color: 0x1e293b });

        // Tapered torso
        pawnsG.poly([
          pawnX - 4.5, pawnY + 1 - bob,
          pawnX - 3.5, pawnY - 7 - bob,
          pawnX + 3.5, pawnY - 7 - bob,
          pawnX + 4.5, pawnY + 1 - bob,
        ]);
        pawnsG.fill({ color: pal.tabardColor });
        pawnsG.stroke({ width: 0.7, color: pal.tabardDark });

        // Belt / accent trim
        pawnsG.rect(pawnX - 3.5, pawnY - 2 - bob, 7, 1.5);
        pawnsG.fill({ color: pal.accentColor });

        // Head
        pawnsG.circle(pawnX, pawnY - 10 - bob, 3);
        pawnsG.fill({ color: 0xfbcfe8 });

        // Helmet / Headwear
        if (pal.helmKind === "crown") {
          // Champion golden coronet helm
          pawnsG.rect(pawnX - 3.5, pawnY - 13.5 - bob, 7, 5);
          pawnsG.fill({ color: 0xf59e0b });
          pawnsG.poly([
            pawnX - 3.5, pawnY - 13.5 - bob,
            pawnX - 2, pawnY - 17 - bob,
            pawnX, pawnY - 14 - bob,
            pawnX + 2, pawnY - 17 - bob,
            pawnX + 3.5, pawnY - 13.5 - bob,
          ]);
          pawnsG.fill({ color: 0xfde047 });
          pawnsG.stroke({ width: 0.6, color: 0x78350f });
        } else if (pal.helmKind === "plate") {
          // Knight Greathelm with waving chivalric plume
          pawnsG.rect(pawnX - 3.5, pawnY - 13.5 - bob, 7, 6);
          pawnsG.fill({ color: 0xe2e8f0 });
          pawnsG.stroke({ width: 0.7, color: 0x475569 });
          pawnsG.rect(pawnX - 2, pawnY - 11.5 - bob, 4, 1.4);
          pawnsG.fill({ color: 0x0f172a });
          pawnsG.poly([
            pawnX - facing * 1, pawnY - 13.5 - bob,
            pawnX - facing * 4.5, pawnY - 17.5 - bob,
            pawnX - facing * 1, pawnY - 15 - bob,
          ]);
          pawnsG.fill({ color: 0xdc2626 });
        } else if (pal.helmKind === "kettle") {
          if (kit === "cedar") {
            // Hunter cowl
            pawnsG.poly([
              pawnX - 4, pawnY - 9 - bob,
              pawnX, pawnY - 15 - bob,
              pawnX + 4, pawnY - 9 - bob,
            ]);
            pawnsG.fill({ color: cult.tabard });
            pawnsG.moveTo(pawnX, pawnY - 15 - bob);
            pawnsG.lineTo(pawnX - facing * 3.5, pawnY - 17.5 - bob);
            pawnsG.stroke({ width: 1.2, color: 0xfde047 });
          } else if (kit === "sand") {
            // Desert turban with draped havelock veil
            pawnsG.circle(pawnX, pawnY - 12.5 - bob, 3.6);
            pawnsG.fill({ color: 0xfafaf9 });
            pawnsG.rect(pawnX - facing * 3.5, pawnY - 11 - bob, 2.4, 5.5);
            pawnsG.fill({ color: cult.accent });
          } else if (kit === "steppe") {
            // Conical spangenhelm with horsehair crest
            pawnsG.poly([pawnX - 3.5, pawnY - 11 - bob, pawnX, pawnY - 16 - bob, pawnX + 3.5, pawnY - 11 - bob]);
            pawnsG.fill({ color: 0xd1d5db });
            pawnsG.moveTo(pawnX, pawnY - 16 - bob);
            pawnsG.lineTo(pawnX - facing * 3.5, pawnY - 18 - bob);
            pawnsG.stroke({ width: 1.3, color: 0x9f1239 });
          } else if (kit === "islands") {
            // Woven reed war cap
            pawnsG.poly([pawnX - 4.5, pawnY - 11 - bob, pawnX, pawnY - 14.5 - bob, pawnX + 4.5, pawnY - 11 - bob]);
            pawnsG.fill({ color: 0xd4a359 });
            pawnsG.circle(pawnX, pawnY - 14.5 - bob, 1);
            pawnsG.fill({ color: 0x0e7490 });
          } else {
            // Western kettle helm
            pawnsG.rect(pawnX - 4.5, pawnY - 12 - bob, 9, 2);
            pawnsG.fill({ color: 0x94a3b8 });
            pawnsG.circle(pawnX, pawnY - 12.5 - bob, 2.6);
            pawnsG.fill({ color: 0xf1f5f9 });
            pawnsG.stroke({ width: 0.6, color: 0x334155 });
          }
        } else if (pal.helmKind === "cap") {
          // Archer / Skirmisher cap with cockade feather
          pawnsG.rect(pawnX - 3.2, pawnY - 12 - bob, 6.4, 2.5);
          pawnsG.fill({ color: pal.tabardColor });
          pawnsG.poly([
            pawnX - facing * 1.5, pawnY - 12 - bob,
            pawnX - facing * 5.5, pawnY - 16 - bob,
            pawnX - facing * 1.5, pawnY - 13.5 - bob,
          ]);
          pawnsG.fill({ color: pal.accentColor });
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
          // Spearman towering pike & shield
          pawnsG.moveTo(pawnX + facing * 4, pawnY + 3 - bob);
          pawnsG.lineTo(pawnX + facing * 4, pawnY - 21 - bob + armSwing);
          pawnsG.stroke({ width: 1.4, color: 0x78350f });

          pawnsG.poly([
            pawnX + facing * 4, pawnY - 21 - bob + armSwing,
            pawnX + facing * 4 - 2.2, pawnY - 17 - bob + armSwing,
            pawnX + facing * 4 + 2.2, pawnY - 17 - bob + armSwing,
          ]);
          pawnsG.fill({ color: 0xffffff });
          pawnsG.stroke({ width: 0.6, color: 0x475569 });

          // Shield on off-arm
          pawnsG.circle(pawnX - facing * 3, pawnY - 5 - bob + armSwing, 3.8);
          pawnsG.fill({ color: pal.tabardColor });
          pawnsG.stroke({ width: 1, color: pal.accentColor });
          pawnsG.circle(pawnX - facing * 3, pawnY - 5 - bob + armSwing, 1.4);
          pawnsG.fill({ color: pal.accentColor });
        } else if (pal.weaponKind === "bow") {
          // Archer recurve bow, nocked arrow & back quiver
          pawnsG.poly([
            pawnX + facing * 3.5, pawnY - 16 - bob + armSwing,
            pawnX + facing * 6.5, pawnY - 7 - bob + armSwing,
            pawnX + facing * 3.5, pawnY + 2 - bob + armSwing,
          ]);
          pawnsG.stroke({ width: 2, color: 0x854d0e });
          pawnsG.moveTo(pawnX + facing * 3.5, pawnY - 16 - bob + armSwing);
          pawnsG.lineTo(pawnX + facing * 3.5, pawnY + 2 - bob + armSwing);
          pawnsG.stroke({ width: 0.9, color: 0xffffff });

          // Nocked bodkin arrow
          pawnsG.moveTo(pawnX, pawnY - 7 - bob + armSwing);
          pawnsG.lineTo(pawnX + facing * 8, pawnY - 7 - bob + armSwing);
          pawnsG.stroke({ width: 1.1, color: 0xd4a359 });
          pawnsG.poly([
            pawnX + facing * 8, pawnY - 8.2 - bob + armSwing,
            pawnX + facing * 9.5, pawnY - 7 - bob + armSwing,
            pawnX + facing * 8, pawnY - 5.8 - bob + armSwing,
          ]);
          pawnsG.fill({ color: 0xffffff });

          // Quiver over shoulder with arrows
          pawnsG.rect(pawnX - facing * 3.8, pawnY - 11 - bob, 2.6, 6);
          pawnsG.fill({ color: 0x78350f });
          pawnsG.rect(pawnX - facing * 3.8, pawnY - 14 - bob, 2.6, 3);
          pawnsG.fill({ color: 0xf8fafc });
        } else if (pal.weaponKind === "javelin") {
          // Skirmisher poised throwing javelin & extra javelins
          pawnsG.moveTo(pawnX - facing * 3, pawnY - 4 - bob + armSwing);
          pawnsG.lineTo(pawnX + facing * 9, pawnY - 15 - bob + armSwing);
          pawnsG.stroke({ width: 1.4, color: 0x78350f });
          pawnsG.poly([
            pawnX + facing * 9, pawnY - 15 - bob + armSwing,
            pawnX + facing * 10.5, pawnY - 12 - bob + armSwing,
            pawnX + facing * 7.5, pawnY - 13 - bob + armSwing,
          ]);
          pawnsG.fill({ color: 0xffffff });

          // Spare javelins on back
          pawnsG.moveTo(pawnX - facing * 3.5, pawnY - 6 - bob);
          pawnsG.lineTo(pawnX - facing * 6.5, pawnY - 15 - bob);
          pawnsG.stroke({ width: 1.1, color: 0x78350f });
          pawnsG.moveTo(pawnX - facing * 2.5, pawnY - 6 - bob);
          pawnsG.lineTo(pawnX - facing * 4.5, pawnY - 15 - bob);
          pawnsG.stroke({ width: 1.1, color: 0x78350f });

          // Off-arm buckler
          pawnsG.circle(pawnX - facing * 2.5, pawnY - 5 - bob, 3);
          pawnsG.fill({ color: 0xa16207 });
          pawnsG.circle(pawnX - facing * 2.5, pawnY - 5 - bob, 1.2);
          pawnsG.fill({ color: 0xfacc15 });
        } else if (pal.weaponKind === "heater") {
          // Knight chivalric heater shield & broadsword
          pawnsG.poly([
            pawnX - facing * 2, pawnY - 10 - bob + armSwing,
            pawnX - facing * 7, pawnY - 10 - bob + armSwing,
            pawnX - facing * 7, pawnY - 3 - bob + armSwing,
            pawnX - facing * 4.5, pawnY + 1.5 - bob + armSwing,
            pawnX - facing * 2, pawnY - 3 - bob + armSwing,
          ]);
          pawnsG.fill({ color: 0xb91c1c });
          pawnsG.stroke({ width: 1, color: 0xfacc15 });
          pawnsG.moveTo(pawnX - facing * 4.5, pawnY - 10 - bob + armSwing);
          pawnsG.lineTo(pawnX - facing * 4.5, pawnY + 1.5 - bob + armSwing);
          pawnsG.stroke({ width: 1, color: 0xfacc15 });

          // Upright broadsword
          pawnsG.moveTo(pawnX + facing * 3.8, pawnY - 1 - bob + armSwing);
          pawnsG.lineTo(pawnX + facing * 3.8, pawnY - 14 - bob + armSwing);
          pawnsG.stroke({ width: 1.8, color: 0xffffff });
          pawnsG.moveTo(pawnX + facing * 1.8, pawnY - 3.5 - bob + armSwing);
          pawnsG.lineTo(pawnX + facing * 5.8, pawnY - 3.5 - bob + armSwing);
          pawnsG.stroke({ width: 1.3, color: 0xfacc15 });
        } else if (pal.weaponKind === "greatsword") {
          // Champion billowing royal cape & glowing runic greatsword
          pawnsG.poly([
            pawnX - facing * 2.5, pawnY - 7 - bob,
            pawnX - facing * 8, pawnY + 3 - bob,
            pawnX - facing * 1.5, pawnY + 2 - bob,
          ]);
          pawnsG.fill({ color: 0x581c87 });
          pawnsG.stroke({ width: 0.8, color: 0xfacc15 });

          // Runic claymore with glowing aura
          pawnsG.moveTo(pawnX + facing * 4.2, pawnY + 2 - bob + armSwing);
          pawnsG.lineTo(pawnX + facing * 4.2, pawnY - 17 - bob + armSwing);
          pawnsG.stroke({ width: 2.4, color: 0x38bdf8 });
          pawnsG.moveTo(pawnX + facing * 4.2, pawnY + 1 - bob + armSwing);
          pawnsG.lineTo(pawnX + facing * 4.2, pawnY - 16 - bob + armSwing);
          pawnsG.stroke({ width: 1, color: 0xffffff });
          pawnsG.moveTo(pawnX + facing * 1, pawnY - 2.5 - bob + armSwing);
          pawnsG.lineTo(pawnX + facing * 7.5, pawnY - 2.5 - bob + armSwing);
          pawnsG.stroke({ width: 1.6, color: 0xfde047 });
        } else {
          // Militia: spiked war club & buckler
          const isTired = isFoodStoresEmptyOrLow(state);
          if (isTired) {
            // Tired militia: club dragging low, buckler slumped, no bob
            pawnsG.rect(pawnX + facing * 3.2, pawnY - 4, 2.2, 6);
            pawnsG.fill({ color: 0x78350f });
            pawnsG.stroke({ width: 0.6, color: 0x451a03 });
            pawnsG.circle(pawnX + facing * 4.3, pawnY - 3, 0.8); pawnsG.fill({ color: 0xd1d5db });
            pawnsG.circle(pawnX + facing * 4.3, pawnY, 0.8); pawnsG.fill({ color: 0xd1d5db });
            pawnsG.circle(pawnX - facing * 2.5, pawnY - 1, 2.8);
            pawnsG.fill({ color: 0x5c3818 });
            pawnsG.stroke({ width: 0.8, color: 0x27272a });
          } else {
            pawnsG.rect(pawnX + facing * 3.2, pawnY - 8 - bob + armSwing, 2.2, 6);
            pawnsG.fill({ color: 0x78350f });
            pawnsG.stroke({ width: 0.6, color: 0x451a03 });
            pawnsG.circle(pawnX + facing * 4.3, pawnY - 7 - bob + armSwing, 0.8); pawnsG.fill({ color: 0xd1d5db });
            pawnsG.circle(pawnX + facing * 4.3, pawnY - 4 - bob + armSwing, 0.8); pawnsG.fill({ color: 0xd1d5db });
            pawnsG.circle(pawnX - facing * 2.5, pawnY - 4.5 - bob + armSwing, 2.8);
            pawnsG.fill({ color: 0x5c3818 });
            pawnsG.stroke({ width: 0.8, color: 0x27272a });
          }
        }
      }

      if (hasArrival) {
        drawMarchEtaBadge(pawnsG, pawnX, pawnY, secs, pal.accentColor, bob);
      } else {
        // Floating ETA pill badge with subtle shadow
        pawnsG.rect(pawnX - 16, pawnY - 27 - bob, 32, 9);
        pawnsG.fill({ color: 0x000000, alpha: 0.45 });
        pawnsG.rect(pawnX - 16, pawnY - 28 - bob, 32, 9);
        pawnsG.fill({ color: 0x090d16, alpha: 0.95 });
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
      }
    } else {
      // Hostile Incoming Warband: Red Warband Meeple
      const forceCount = m.force
        ? Object.values(m.force).reduce((a, b) => a + (Number(b) || 0), 0)
        : (m.levy ?? 10);
      drawRedWarbandMeeple(
        pawnsG,
        pawnX,
        pawnY,
        facing,
        frame,
        bob,
        m.realmId,
        phase,
        forceCount,
        hasArrival ? secs : undefined
      );
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
  const fromSim = typeof sim.listGathers === "function" ? sim.listGathers(state) : [];
  if (fromSim.length) {
    return fromSim.map((g) => {
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
  if (Array.isArray((state as any).gathers)) return (state as any).gathers;
  return [];
}

export function paintBoardGathers(
  routeG: Graphics,
  pawnsG: Graphics,
  state: GameState | null,
  phase: number,
  renderedGatherIds?: Set<string>
): void {
  const gathers = listGathersPresentation(state);
  if (gathers.length === 0) return;

  const cultId = state && sim.playerCultureId ? sim.playerCultureId(state) : undefined;
  const kit = resolveCultureKit(cultId);
  const cult = culturePalette(cultId);

  for (const g of gathers) {
    if (renderedGatherIds && (renderedGatherIds.has(g.id) || (g.toId && renderedGatherIds.has(g.toId)))) continue;

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
      const pulse = Math.sin(phase * 4 + i * 0.45) * 0.2 + 0.8;
      routeG.circle(lx, ly, i % 2 === 0 ? 2.4 : 1.6);
      routeG.fill({ color: 0x16a34a, alpha: 0.35 * pulse });
      routeG.circle(lx, ly, i % 2 === 0 ? 1.4 : 0.9);
      routeG.fill({ color: 0xfef08a, alpha: 0.85 * pulse });
    }

    // Gather destination target badge
    routeG.circle(toB.cx, toB.cy, 11);
    routeG.stroke({ width: 1.4, color: 0x22c55e, alpha: 0.85 });
    routeG.circle(toB.cx, toB.cy, 4.5);
    routeG.stroke({ width: 1, color: 0x16a34a, alpha: 0.65 });
    routeG.circle(toB.cx, toB.cy, 2);
    routeG.fill({ color: 0xfacc15, alpha: 0.8 });

    // Progress
    const progress = Math.min(1, Math.max(0, typeof g.progress === "number" ? g.progress : 0.5));
    const pawnX = fromB.cx + dx * progress;
    const pawnY = fromB.cy + dy * progress;

    const facing = dx >= 0 ? 1 : -1;
    const stepIdx = Math.floor((phase * 6) % 4);
    const frame: 0 | 1 | 2 = stepIdx === 1 ? 1 : stepIdx === 3 ? 2 : 0;
    const bob = frame === 0 ? 0 : 2;

    const gatherLoad = resolveGatherLoadInfo(g, state);
    drawGatherColumnMeeple(
      pawnsG,
      pawnX,
      pawnY,
      facing,
      frame,
      bob,
      kit,
      cult,
      g.node ?? toProv.node,
      phase,
      progress,
      gatherLoad
    );

    const hasArrival = typeof g.arrivesTick === "number";
    if (hasArrival) {
      const ticksLeft = Math.max(0, g.arrivesTick - (state?.meta?.tick ?? 0));
      const secs = Math.ceil(ticksLeft / 10);
      drawMarchEtaBadge(pawnsG, pawnX, pawnY, secs, 0x22c55e, bob);
    }
  }
}

export function paintBoardSelectionRim(
  g: Graphics,
  bx: number,
  by: number,
  state: GameState | null,
  phase: number = 0
): void {
  const { wx, wy } = boardGridToWorld(bx, by);
  const p = state?.board?.provinces?.find((pr) => pr.x === bx && pr.y === by);
  const seen = (state && p) ? isProvinceSeen(state, p.id) : true;
  const elev = (p && seen) ? terrainElevation(p.terrain) : 4;
  const cy = wy - elev;
  const hw = BOARD_HALF_W;
  const hh = BOARD_HALF_H;

  // Gentle radiant breath
  const pulse = Math.sin(phase * 3) * 0.08;
  const alphaBase = 0.92 + pulse;

  // 1. CLEAR GOLD GROUND RING (tabletop ground plane at wy)
  // Outer warm amber-gold ground aura
  g.poly([
    wx, wy - hh - 3,
    wx + hw + 3, wy,
    wx, wy + hh + 3,
    wx - hw - 3, wy,
  ]);
  g.stroke({ width: 3.5, color: 0xb45309, alpha: 0.45 * alphaBase });

  // Main radiant gold ground ring
  g.poly([
    wx, wy - hh - 2,
    wx + hw + 2, wy,
    wx, wy + hh + 2,
    wx - hw - 2, wy,
  ]);
  g.stroke({ width: 2, color: 0xfacc15, alpha: 0.95 * alphaBase });

  // Inner bright ground shimmer
  g.poly([
    wx, wy - hh - 1,
    wx + hw + 1, wy,
    wx, wy + hh + 1,
    wx - hw - 1, wy,
  ]);
  g.stroke({ width: 0.8, color: 0xfef08a, alpha: 0.8 * alphaBase });

  // Ground ring cardinal bracket pips
  const groundPips = [
    { x: wx, y: wy - hh - 2 },
    { x: wx + hw + 2, y: wy },
    { x: wx, y: wy + hh + 2 },
    { x: wx - hw - 2, y: wy },
  ];
  for (const pip of groundPips) {
    g.circle(pip.x, pip.y, 1.8);
    g.fill({ color: 0xfef08a });
    g.stroke({ width: 0.6, color: 0xb45309 });
  }

  // 2. VERTICAL CORNER STRUTS & FRONT RIM (connecting ground ring to elevated plateau)
  if (elev > 0) {
    g.moveTo(wx - hw - 1, cy);
    g.lineTo(wx - hw - 1, wy);
    g.stroke({ width: 2, color: 0xfacc15, alpha: 0.85 * alphaBase });

    g.moveTo(wx, cy + hh + 1);
    g.lineTo(wx, wy + hh + 1);
    g.stroke({ width: 2.2, color: 0xfacc15, alpha: 0.95 * alphaBase });

    g.moveTo(wx + hw + 1, cy);
    g.lineTo(wx + hw + 1, wy);
    g.stroke({ width: 2, color: 0xfacc15, alpha: 0.85 * alphaBase });

    g.moveTo(wx - hw - 1, wy);
    g.lineTo(wx, wy + hh + 1);
    g.lineTo(wx + hw + 1, wy);
    g.stroke({ width: 1.5, color: 0xfef08a, alpha: 0.75 * alphaBase });
  }

  // 3. RADIANT GOLD TOP RIM (elevated plateau at cy)
  // Outer warm golden glow
  g.poly([
    wx, cy - hh - 2,
    wx + hw + 2, cy,
    wx, cy + hh + 2,
    wx - hw - 2, cy,
  ]);
  g.stroke({ width: 3, color: 0xd97706, alpha: 0.45 * alphaBase });

  // Main brilliant gold top rim
  g.poly([
    wx, cy - hh - 1,
    wx + hw + 1, cy,
    wx, cy + hh + 1,
    wx - hw - 1, cy,
  ]);
  g.stroke({ width: 2.2, color: 0xfacc15, alpha: 0.98 * alphaBase });

  // Sunlit top edge highlight (rear facets)
  g.moveTo(wx - hw - 0.5, cy);
  g.lineTo(wx, cy - hh - 0.5);
  g.lineTo(wx + hw + 0.5, cy);
  g.stroke({ width: 1.2, color: 0xffffff, alpha: 0.9 * alphaBase });

  // Top cardinal reticle bracket pips
  const topPips = [
    { x: wx, y: cy - hh - 1, r: 2.0, color: 0xffffff },
    { x: wx + hw + 1, y: cy, r: 1.6, color: 0xfef08a },
    { x: wx, y: cy + hh + 1, r: 1.6, color: 0xfef08a },
    { x: wx - hw - 1, y: cy, r: 1.6, color: 0xfef08a },
  ];
  for (const pip of topPips) {
    g.circle(pip.x, pip.y, pip.r);
    g.fill({ color: pip.color });
    g.stroke({ width: 0.6, color: 0xb45309 });
  }
}

/**
 * Maps all province IDs that are destinations of active marches to their destination kind:
 * - "hostile": hostile warband/raid/column targeting the province (takes alert priority)
 * - "player": player war/raid/scout/gather/garrison column targeting the province
 */
export function buildMarchDestinationMap(
  state: GameState | null
): Map<string, "player" | "hostile"> {
  const map = new Map<string, "player" | "hostile">();
  if (!state?.board) return map;

  const marches = listMarches(state);
  for (const m of marches) {
    if (!m?.toId) continue;
    const isPlayer = m.realmId === "player";
    const current = map.get(m.toId);
    if (!isPlayer) {
      // Hostile march destination takes alert priority
      map.set(m.toId, "hostile");
    } else if (!current) {
      map.set(m.toId, "player");
    }
  }

  // Also check gathers for outbound and returning trips
  const gathers = listGathersPresentation(state);
  for (const g of gathers) {
    if (!g) continue;
    const destId = g.phase === "returning"
      ? (g.fromId ?? state.board?.homeProvinceId)
      : (g.toId ?? g.targetProvinceId);
    if (!destId) continue;
    const isPlayer = !g.realmId || g.realmId === "player";
    const current = map.get(destId);
    if (!isPlayer) {
      map.set(destId, "hostile");
    } else if (!current) {
      map.set(destId, "player");
    }
  }

  return map;
}

/**
 * Resolves whether a province is currently the destination of an active march:
 * Returns "player" (gold), "hostile" (red), or null if not a march destination.
 */
export function getTileMarchDestination(
  state: GameState | null,
  provinceId: string
): "player" | "hostile" | null {
  if (!state || !provinceId) return null;
  const map = buildMarchDestinationMap(state);
  return map.get(provinceId) ?? null;
}

/**
 * Paints a faint, elegant destination ring around an isometric tile that is already a march destination.
 * - Player marches: warm luminous gold palette (0xf59e0b, 0xd97706, 0xfde047)
 * - Hostile marches: menacing crimson/red palette (0xef4444, 0xdc2626, 0xfca5a5)
 * Distinct from the high-opacity, thick player selection rim.
 */
export function paintBoardDestinationRing(
  g: Graphics,
  p: Province,
  destType: "player" | "hostile",
  phase: number = 0
): void {
  const b = provinceTokenBounds(p.x, p.y);
  const elev = terrainElevation(p.terrain);
  const wx = b.cx;
  const wy = b.cy;
  const cy = wy - elev;
  const hw = BOARD_HALF_W;
  const hh = BOARD_HALF_H;

  const isPlayer = destType === "player";
  const ringColor = isPlayer ? 0xf59e0b : 0xef4444;
  const glowColor = isPlayer ? 0xd97706 : 0xdc2626;
  const shimmerColor = isPlayer ? 0xfde047 : 0xfca5a5;

  const pulse = Math.sin(phase * 3 + p.x * 2 + p.y) * 0.12;
  const alphaBase = isPlayer ? (0.50 + pulse) : (0.60 + pulse);

  // 1. Soft atmospheric outer glow around the ground footprint
  g.poly([
    wx, wy - hh - 2.5,
    wx + hw + 2.5, wy,
    wx, wy + hh + 2.5,
    wx - hw - 2.5, wy,
  ]);
  g.stroke({ width: 2.5, color: glowColor, alpha: 0.25 * alphaBase });

  // 2. Main faint ground ring on tabletop ground plane
  g.poly([
    wx, wy - hh - 1.5,
    wx + hw + 1.5, wy,
    wx, wy + hh + 1.5,
    wx - hw - 1.5, wy,
  ]);
  g.stroke({ width: 1.5, color: ringColor, alpha: 0.55 * alphaBase });

  // 3. Faint elevated plateau ring if tile has elevation
  if (elev > 0) {
    g.poly([
      wx, cy - hh - 1,
      wx + hw + 1, cy,
      wx, cy + hh + 1,
      wx - hw - 1, cy,
    ]);
    g.stroke({ width: 1.2, color: ringColor, alpha: 0.50 * alphaBase });

    // Subtle sunlit rear-facet rim
    g.moveTo(wx - hw - 0.5, cy);
    g.lineTo(wx, cy - hh - 0.5);
    g.lineTo(wx + hw + 0.5, cy);
    g.stroke({ width: 0.8, color: shimmerColor, alpha: 0.65 * alphaBase });
  }

  // 4. Subtle corner target pips on the 4 cardinal diamond points
  const pips = [
    { x: wx, y: cy - hh - 1 },
    { x: wx + hw + 1, y: cy },
    { x: wx, y: cy + hh + 1 },
    { x: wx - hw - 1, y: cy },
  ];
  for (const pip of pips) {
    g.circle(pip.x, pip.y, 1.2);
    g.fill({ color: shimmerColor, alpha: 0.75 * alphaBase });
  }
}

export function paintBoardHighlight(
  g: Graphics,
  bx: number,
  by: number,
  state: GameState | null,
  phase: number = 0
): void {
  g.clear();
  // 1. Clear gold rim and ground ring
  paintBoardSelectionRim(g, bx, by, state, phase);

  // 2. Information plaque at bottom of diorama table
  const p = state?.board?.provinces?.find((pr) => pr.x === bx && pr.y === by);
  const seen = (state && p) ? isProvinceSeen(state, p.id) : true;
  if (!p) return;

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

