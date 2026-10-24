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
  incomingOnProvince,
  listOutposts,
  listGathers,
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
  holdHasPeople,
  isBuildingStaffed,
  isHoldBreached,
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
      lancer: 8,
      cavalry: 7,
      outrider: 7,
      archer: 6,
      ranger: 6,
      skirmisher: 5,
      warden: 4,
      banner: 4,
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
  weaponKind: "spear" | "bow" | "horse" | "heater" | "siege" | "club" | "javelin" | "greatsword" | "shortbow" | "pennant" | "shortlance" | "roundshield" | "longlance";
  helmKind: "none" | "kettle" | "cap" | "plate" | "crown" | "hood";
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
    case "ranger":
      pal = {
        id: "ranger",
        name: "Ranger",
        tabardColor: 0x475569, // mist-blue slate
        tabardDark: 0x1e293b,
        armorColor: 0x5c3818, // leather
        weaponColor: 0xca8a04, // short bow
        accentColor: 0x38bdf8, // mist cyan
        weaponKind: "shortbow",
        helmKind: "hood",
        hasMount: false,
        isChassis: false,
      };
      break;
    case "banner":
      pal = {
        id: "banner",
        name: "Banner",
        tabardColor: 0x4d7c0f, // glen-green
        tabardDark: 0x365314,
        armorColor: 0x78716c, // quarry granite
        weaponColor: 0xffffff, // spearhead
        accentColor: 0xa3e635, // small pennant green
        weaponKind: "pennant",
        helmKind: "kettle",
        hasMount: false,
        isChassis: false,
      };
      break;
    case "outrider":
      pal = {
        id: "outrider",
        name: "Outrider",
        tabardColor: 0xa8a29e, // salt-grey
        tabardDark: 0x78716c,
        armorColor: 0x5c3818, // timber saddle
        weaponColor: 0xf1f5f9, // short lance tip
        accentColor: 0xe2e8f0, // salt frost
        weaponKind: "shortlance",
        helmKind: "none",
        hasMount: true,
        isChassis: false,
      };
      break;
    case "warden":
      pal = {
        id: "warden",
        name: "Warden",
        tabardColor: 0x3f6212, // fen-reed
        tabardDark: 0x1a2e05,
        armorColor: 0x44403c, // round shield rim
        weaponColor: 0xf8fafc, // spearhead
        accentColor: 0x65a30d, // reed boss
        weaponKind: "roundshield",
        helmKind: "kettle",
        hasMount: false,
        isChassis: false,
      };
      break;
    case "lancer":
      pal = {
        id: "lancer",
        name: "Lancer",
        tabardColor: 0xf8fafc, // peak-white cloak
        tabardDark: 0xcbd5e1,
        armorColor: 0x94a3b8, // mountain plate
        weaponColor: 0xffffff, // diamond steel lance
        accentColor: 0x38bdf8, // alpine frost
        weaponKind: "longlance",
        helmKind: "plate",
        hasMount: true,
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
  isStaffed?: boolean;
  hasWorker?: boolean;
}

export interface MiniatureKeepOptions {
  state?: GameState | null;
  yardBuildings?: KeepYardBuildingInfo[];
  hasPeople?: boolean;
  isBreached?: boolean;
  breached?: boolean;
  stands?: boolean;
  cultureId?: string;
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
          const staffed = isBuildingStaffed(state, b);
          results.push({
            id: b.id,
            typeId: b.typeId,
            isFinished: b.completesAtTick === null || b.completesAtTick === undefined,
            level: b.level ?? 1,
            slot,
            isStaffed: staffed,
            hasWorker: staffed,
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
      const staffed = isBuildingStaffed(state, b);
      results.push({
        id: b.id,
        typeId: b.typeId,
        isFinished: b.completesAtTick === null || b.completesAtTick === undefined,
        level: b.level ?? 1,
        slot,
        isStaffed: staffed,
        hasWorker: staffed,
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

  // -------------------------------------------------------------
  // Bespoke Silhouette for Finished Watchtower: Soaring Stone Shaft + Battlements + Clear Beacon Fire + Gold Glint
  // -------------------------------------------------------------
  if (typeId === "watchtower") {
    // Foundation plinth
    g.poly([ax - 4, ay + 0.8, ax, ay + 2.6, ax + 4, ay + 0.8, ax, ay - 1.0]);
    g.fill({ color: plinthCol });
    g.stroke({ width: 0.6, color: strokeCol });

    // Tall vertical stone tower shaft
    g.poly([ax - 3.2, ay + 0.4, ax, ay + 2.0, ax, ay - 8.5, ax - 3.2, ay - 10.0]);
    g.fill({ color: wallLight });
    g.stroke({ width: 0.6, color: strokeCol });
    g.poly([ax, ay + 2.0, ax + 3.2, ay + 0.4, ax + 3.2, ay - 10.0, ax, ay - 8.5]);
    g.fill({ color: wallDark });
    g.stroke({ width: 0.6, color: strokeCol });

    // Center dividing corner seam
    g.moveTo(ax, ay - 8.5); g.lineTo(ax, ay + 2.0);
    g.stroke({ width: 0.7, color: strokeCol });

    // Dark arrow loop slits along shaft
    g.rect(ax - 2.0, ay - 4.5, 0.9, 2.5); g.fill({ color: 0x0f172a });
    g.rect(ax + 1.1, ay - 6.0, 0.9, 2.5); g.fill({ color: 0x0f172a });

    // Projecting corbels & crenellated parapet / hoarding
    g.poly([
      ax - 4.2, ay - 9.5,
      ax, ay - 8.0,
      ax + 4.2, ay - 9.5,
      ax, ay - 11.2,
    ]);
    g.fill({ color: 0x334155 });
    g.stroke({ width: 0.6, color: strokeCol });

    // Parapet battlements (crenellations)
    g.rect(ax - 4.0, ay - 11.8, 1.6, 2.0); g.fill({ color: wallLight }); g.stroke({ width: 0.4, color: strokeCol });
    g.rect(ax + 2.4, ay - 11.8, 1.6, 2.0); g.fill({ color: wallDark }); g.stroke({ width: 0.4, color: strokeCol });

    // Elevated iron brazier basket
    g.rect(ax - 1.2, ay - 11.2, 2.4, 1.4);
    g.fill({ color: 0x18181b });

    const isStaffed = info.isStaffed !== false && info.hasWorker !== false;

    if (isStaffed) {
      const flamePuff = Math.sin(phase * 5 + ax) * 0.4;
      // Radiant beacon warm halo
      g.ellipse(ax, ay - 12.2, 3.8, 2.4);
      g.fill({ color: 0xfde047, alpha: 0.25 });

      // Beacon flame tongues
      g.circle(ax, ay - 12.2, 1.6 + flamePuff);
      g.fill({ color: 0xf97316 });
      g.circle(ax, ay - 12.8, 0.9);
      g.fill({ color: 0xfacc15 });
      g.circle(ax, ay - 13.2, 0.4);
      g.fill({ color: 0xffffff, alpha: 0.9 });

      // Gold Glint: 4-point diamond star spark
      const glintPhase = phase * 4 + ax * 1.5;
      const glintScale = 0.5 + 0.5 * Math.sin(glintPhase);
      const glintY = ay - 14.8;
      g.poly([
        ax, glintY - 2.5 * glintScale,
        ax + 0.8 * glintScale, glintY,
        ax, glintY + 2.5 * glintScale,
        ax - 0.8 * glintScale, glintY,
      ]);
      g.fill({ color: 0xfacc15 });
      g.poly([
        ax - 2.5 * glintScale, glintY,
        ax, glintY - 0.8 * glintScale,
        ax + 2.5 * glintScale, glintY,
        ax, glintY + 0.8 * glintScale,
      ]);
      g.fill({ color: 0xfacc15 });
      g.circle(ax, glintY, 0.7 * glintScale);
      g.fill({ color: 0xffffff, alpha: 0.95 });
    } else {
      // Unstaffed / No worker: beacon unlit / cold. Cold dark charcoal ash bed
      g.rect(ax - 1.0, ay - 11.6, 2.0, 0.8);
      g.fill({ color: 0x0f172a });
    }
    return;
  }

  // -------------------------------------------------------------
  // Bespoke Silhouette for Finished Quarry: Excavated Pit + Cut Stone Ashlar Stacks + Crane Derrick + Rubble Piles
  // -------------------------------------------------------------
  if (typeId === "quarry") {
    // 1. Excavated granite quarry pit bedrock floor
    g.poly([ax - 5.5, ay + 0.5, ax, ay + 2.8, ax + 5.5, ay + 0.5, ax, ay - 1.8]);
    g.fill({ color: 0x27272a });

    // Terraced granite quarry shelves / stepped rock strata
    g.poly([ax - 4.8, ay + 0.8, ax, ay + 2.4, ax, ay + 0.4, ax - 4.8, ay - 1.2]);
    g.fill({ color: 0x71717a });
    g.poly([ax, ay + 2.4, ax + 4.8, ay + 0.8, ax + 4.8, ay - 1.2, ax, ay + 0.4]);
    g.fill({ color: 0x52525b });

    // Chiseled strata seam
    g.moveTo(ax - 4.0, ay - 0.2); g.lineTo(ax - 0.8, ay + 1.2);
    g.stroke({ width: 0.5, color: 0x18181b, alpha: 0.75 });

    // 2. Cut Stone / Ashlar Masonry Blocks on that tile
    // Stack of neatly chiseled ashlar blocks
    g.rect(ax - 4.2, ay - 0.2, 2.8, 2.2); g.fill({ color: 0xcbd5e1 });
    g.stroke({ width: 0.4, color: 0x334155 });
    g.rect(ax - 3.2, ay - 2.0, 2.6, 1.8); g.fill({ color: 0x94a3b8 });
    g.stroke({ width: 0.4, color: 0x334155 });
    g.rect(ax - 2.2, ay + 0.6, 2.2, 1.6); g.fill({ color: 0xe2e8f0 });
    g.stroke({ width: 0.35, color: 0x334155 });

    // Mortar / chisel seams
    g.moveTo(ax - 4.2, ay + 0.9); g.lineTo(ax - 1.4, ay + 0.9);
    g.stroke({ width: 0.35, color: 0x475569 });

    // 3. Piles on that tile: quarried rubble mounds & cut stone piles
    // Foreground pyramidal stone rubble pile
    g.poly([ax - 1.4, ay + 1.2, ax + 0.8, ay + 2.4, ax + 0.2, ay + 0.8]);
    g.fill({ color: 0x64748b });
    g.circle(ax - 0.3, ay + 1.5, 0.8); g.fill({ color: 0x94a3b8 });
    g.circle(ax + 0.8, ay + 1.7, 0.9); g.fill({ color: 0x71717a });
    g.circle(ax + 0.3, ay + 0.9, 0.6); g.fill({ color: 0xcbd5e1 });

    // Cut stone blocks pile on rear right ledge
    g.rect(ax + 2.2, ay - 1.2, 2.4, 1.8); g.fill({ color: 0x94a3b8 });
    g.stroke({ width: 0.3, color: 0x1e293b });
    g.rect(ax + 3.0, ay - 2.7, 2.0, 1.5); g.fill({ color: 0xcbd5e1 });
    g.stroke({ width: 0.3, color: 0x1e293b });

    // 4. Wooden A-Frame Crane Derrick with Brass Pulley, Cable & Hoisted Stone Block
    const craneSwing = Math.sin(phase * 3 + ax) * 0.4;
    g.moveTo(ax - 1.5, ay + 0.5); g.lineTo(ax - 1.5, ay - 8.5); g.lineTo(ax + 3.2, ay - 5.5);
    g.stroke({ width: 1.2, color: 0x78350f });
    g.moveTo(ax - 1.5, ay - 8.5); g.lineTo(ax + 0.8, ay + 1.2);
    g.stroke({ width: 0.8, color: 0x5c2b09 });

    // Brass pulley wheel at crane mast tip
    g.circle(ax + 3.2, ay - 5.5, 0.7);
    g.fill({ color: 0xf59e0b });
    g.stroke({ width: 0.3, color: 0x78350f });

    // Steel cable line & hoisted cut ashlar stone block
    g.moveTo(ax + 3.2, ay - 5.0); g.lineTo(ax + 3.2 + craneSwing, ay - 2.2);
    g.stroke({ width: 0.5, color: 0xd1d5db });
    g.rect(ax + 2.2 + craneSwing, ay - 2.2, 2.2, 1.8);
    g.fill({ color: 0xa1a1aa });
    g.stroke({ width: 0.35, color: 0x334155 });

    // 5. Quarry pickaxe
    g.moveTo(ax - 0.4, ay + 1.2); g.lineTo(ax - 1.6, ay + 2.6);
    g.stroke({ width: 0.5, color: 0x451a03 });
    g.moveTo(-2.0 + ax, ay + 2.2); g.lineTo(-1.2 + ax, ay + 3.0);
    g.stroke({ width: 0.7, color: 0x94a3b8 });
    return;
  }

  // Type-specific adjustments
  const isMilitary = typeId === "barracks" || typeId === "archery_range" || typeId === "siege_workshop";
  const isReligious = typeId === "chapel" || typeId === "infirmary";
  const isIndustry = typeId === "sawmill" || typeId === "lumber" || typeId === "lumber_camp";
  const isStore = typeId === "granary" || typeId === "farm";
  const isStone = typeId === "mason";

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
  kit: CultureKit | string,
  realmPal?: RealmTokenPalette,
  isHome = false,
  phase = 0,
  options?: MiniatureKeepOptions
): void {
  const isBreached = Boolean(
    options?.isBreached ??
    options?.breached ??
    (options?.stands !== undefined ? !options.stands : undefined) ??
    (options?.state ? isHoldBreached(options.state, options, isHome ? "player" : realmPal?.realmId ?? "player") : false)
  );

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

  const resolvedKit: CultureKit = resolveCultureKit(typeof kit === "string" ? kit : undefined);

  // 1. Draw rear annexes / scaffolding (behind keep)
  for (const annex of rearAnnexes) {
    drawKeepYardAnnex(g, cx, cy, annex, resolvedKit, phase);
  }

  const cultKey = (
    options?.cultureId ||
    (!["western", "cedar", "sand", "steppe", "islands"].includes(kit as string) ? (kit as string) : undefined) ||
    (isHome && options?.state && sim.playerCultureId ? sim.playerCultureId(options.state) : undefined) ||
    (options?.state?.flags?.culture as string | undefined) ||
    (options?.state?.flags?.culture_player as string | undefined)
  )?.toLowerCase().trim();

  if (cultKey === "mist") {
    // -------------------------------------------------------------
    // Mist Reach: Low Reed Roof and a Pale Mist Veil
    // -------------------------------------------------------------
    const mistPlinth = 0x1e293b;
    const mistStoneLight = 0x64748b;
    const mistStoneDark = 0x334155;
    const reedThatchLight = 0xca8a04;
    const reedThatchDark = 0x92400e;
    const sodRidge = 0x4d7c0f;
    const flagCol = realmPal ? realmPal.pennantColor : 0x475569;

    // 1. Foundation plinth on wet soil
    g.poly([cx - 8.5, cy + 2.5, cx, cy + 6.5, cx + 8.5, cy + 2.5, cx, cy - 0.5]);
    g.fill({ color: mistPlinth });
    g.stroke({ width: 0.8, color: 0x0f172a });

    // 2. Low-slung wet stone walls (noticeably lower than western: cy - 7 instead of cy - 12)
    g.poly([cx - 7, cy + 1, cx, cy + 3.5, cx, cy - 5, cx - 7, cy - 7.5]);
    g.fill({ color: mistStoneLight });
    g.stroke({ width: 0.8, color: 0x1e293b });
    g.poly([cx, cy + 3.5, cx + 7, cy + 1, cx + 7, cy - 7.5, cx, cy - 5]);
    g.fill({ color: mistStoneDark });
    g.stroke({ width: 0.8, color: 0x0f172a });

    // Center dividing seam
    g.moveTo(cx, cy - 5); g.lineTo(cx, cy + 3.5);
    g.stroke({ width: 1, color: 0x0f172a });

    // Wet mortar line
    g.moveTo(cx - 7, cy - 3); g.lineTo(cx, cy - 1); g.lineTo(cx + 7, cy - 3);
    g.stroke({ width: 0.7, color: 0x1e293b, alpha: 0.7 });

    if (isBreached) {
      g.moveTo(cx - 3, cy - 6); g.lineTo(cx - 1, cy - 2); g.lineTo(cx - 4, cy + 1);
      g.stroke({ width: 0.9, color: 0x09090b });
    }

    // 3. Low Reed Roof: wide, low-pitched hipped reed thatch
    // Left illuminated reed roof facet
    g.poly([cx - 9.5, cy - 5.5, cx, cy - 11, cx, cy - 3.5, cx - 9.5, cy - 5.5]);
    g.fill({ color: reedThatchLight });
    g.stroke({ width: 0.8, color: 0x78350f });
    // Right shaded reed roof facet
    g.poly([cx, cy - 11, cx + 9.5, cy - 5.5, cx, cy - 3.5]);
    g.fill({ color: reedThatchDark });
    g.stroke({ width: 0.8, color: 0x451a03 });

    // Layered reed thatch lines
    g.moveTo(cx - 7, cy - 7); g.lineTo(cx, cy - 5); g.lineTo(cx + 7, cy - 7);
    g.stroke({ width: 0.7, color: 0xb45309 });
    g.moveTo(cx - 5, cy - 9); g.lineTo(cx, cy - 7); g.lineTo(cx + 5, cy - 9);
    g.stroke({ width: 0.7, color: 0xb45309 });

    // Sod ridge crest
    g.poly([cx - 2, cy - 11, cx, cy - 12.2, cx + 2, cy - 11, cx, cy - 10.2]);
    g.fill({ color: sodRidge });
    g.stroke({ width: 0.5, color: 0x365314 });

    // Low stone chimney pot
    g.rect(cx + 3.5, cy - 9, 2.2, 3);
    g.fill({ color: 0x475569 });
    g.rect(cx + 3.2, cy - 9.6, 2.8, 0.8);
    g.fill({ color: 0x334155 });
    if (!isBreached) {
      // Soft peat smoke wisp
      const smk = Math.sin(phase * 2.5 + cx) * 0.8;
      g.circle(cx + 4.5 + smk * 0.4, cy - 11.5, 1.2);
      g.fill({ color: 0xe2e8f0, alpha: 0.5 });
      g.circle(cx + 5.5 + smk * 0.7, cy - 13.5, 1.6);
      g.fill({ color: 0xf1f5f9, alpha: 0.35 });
    }

    // Low arched entry
    g.rect(cx - 1.8, cy + 0.5, 3.6, 3.5);
    g.fill({ color: 0x09090b });
    if (!isBreached) {
      // Warm lantern glow inside low hall
      const candle = 0.85 + Math.sin(phase * 4 + cx) * 0.15;
      g.circle(cx, cy + 2, 1.5);
      g.fill({ color: 0xfef08a, alpha: candle * 0.4 });
      g.circle(cx, cy + 2, 0.8);
      g.fill({ color: 0xfef08a, alpha: candle });
    }

    // 4. Mast & Mist Pennant
    if (!isBreached) {
      const mWave = Math.sin(phase * 3.8 + cx) * 1.5;
      g.moveTo(cx, cy - 10); g.lineTo(cx, cy - 17);
      g.stroke({ width: 1.2, color: 0x5c3818 });
      g.circle(cx, cy - 17.5, 0.8); g.fill({ color: 0x94a3b8 });
      g.poly([
        cx, cy - 17,
        cx + 7 + mWave, cy - 14.5,
        cx + 4 + mWave * 0.5, cy - 12.8,
        cx, cy - 12.8,
      ]);
      g.fill({ color: flagCol });
      g.stroke({ width: 0.6, color: 0x1e293b });
    } else {
      g.moveTo(cx, cy - 10); g.lineTo(cx, cy - 12.5);
      g.stroke({ width: 1.2, color: 0x5c3818 });
    }

    // 5. Pale Mist Veil (ethereal translucent vapor drifting across keep base and facets)
    const mDrift = Math.sin(phase * 1.8 + cx) * 2;
    // Lower ground mist bank
    g.ellipse(cx + mDrift * 0.6, cy + 3.5, 11, 3.6);
    g.fill({ color: 0xe2e8f0, alpha: 0.38 });
    // Mid mist veil across front walls
    g.poly([
      cx - 9 + mDrift, cy + 1.5,
      cx, cy + 4,
      cx + 9 + mDrift, cy + 1.5,
      cx + 6 + mDrift, cy - 1.5,
      cx, cy + 1,
      cx - 6 + mDrift, cy - 1.5,
    ]);
    g.fill({ color: 0xf1f5f9, alpha: 0.28 });
    // Drifting vapor wisp on eaves
    g.ellipse(cx - 5 + mDrift, cy - 4, 3.8, 1.6);
    g.fill({ color: 0xf8fafc, alpha: 0.32 });
  } else if (cultKey === "glen") {
    // -------------------------------------------------------------
    // Glen Holds: Stone Quarry Keep with a Green Slope
    // -------------------------------------------------------------
    const quarryLight = 0x78716c;
    const quarryDark = 0x57534e;
    const quarryPlinth = 0x44403c;
    const slopeGreen = 0x4d7c0f;
    const slopeDark = 0x365314;
    const slopeBright = 0x65a30d;
    const flagCol = realmPal ? realmPal.pennantColor : 0x4d7c0f;

    // 1. Heavy cyclopean quarry plinth
    g.poly([cx - 8.5, cy + 2.5, cx, cy + 6.5, cx + 8.5, cy + 2.5, cx, cy - 0.5]);
    g.fill({ color: quarryPlinth });
    g.stroke({ width: 0.9, color: 0x292524 });

    // 2. Stepped Quarry Keep Walls (rough-hewn granite blocks)
    g.poly([cx - 7, cy + 1, cx, cy + 4, cx, cy - 9, cx - 7, cy - 12]);
    g.fill({ color: quarryLight });
    g.stroke({ width: 0.8, color: 0x292524 });
    g.poly([cx, cy + 4, cx + 7, cy + 1, cx + 7, cy - 12, cx, cy - 9]);
    g.fill({ color: quarryDark });
    g.stroke({ width: 0.8, color: 0x1c1917 });

    // Horizontal quarry courses
    for (const my of [cy - 6, cy - 2, cy + 1.5]) {
      g.moveTo(cx - 7, my - 2); g.lineTo(cx, my); g.lineTo(cx + 7, my - 2);
      g.stroke({ width: 0.8, color: 0x292524, alpha: 0.8 });
    }

    if (isBreached) {
      g.moveTo(cx - 3, cy - 10); g.lineTo(cx - 1, cy - 4); g.lineTo(cx - 4, cy + 1);
      g.stroke({ width: 1.1, color: 0x1c1917 });
    }

    // 3. Heavy stone quarry battlements
    g.rect(cx - 5.5, cy - 14.5, 3, 3); g.fill({ color: quarryLight }); g.stroke({ width: 0.6, color: 0x292524 });
    g.rect(cx - 1.2, cy - 14.5, 2.4, 3); g.fill({ color: quarryLight }); g.stroke({ width: 0.6, color: 0x292524 });
    g.rect(cx + 2.5, cy - 14.5, 3, 3); g.fill({ color: quarryDark }); g.stroke({ width: 0.6, color: 0x1c1917 });

    // 4. The Green Slope (sloping turf embankment hugging the southwest flank)
    g.poly([
      cx - 11, cy + 3.5,
      cx - 2, cy + 0.5,
      cx - 3.5, cy - 4.5,
      cx - 8.5, cy - 2,
    ]);
    g.fill({ color: slopeGreen });
    g.stroke({ width: 0.7, color: slopeDark });
    // Crest highlight of the green slope
    g.moveTo(cx - 11, cy + 3.5); g.lineTo(cx - 8.5, cy - 2); g.lineTo(cx - 3.5, cy - 4.5);
    g.stroke({ width: 1, color: slopeBright });
    // Green slope underside
    g.poly([cx - 11, cy + 3.5, cx - 2, cy + 0.5, cx - 2, cy + 3.5, cx - 9.5, cy + 5.5]);
    g.fill({ color: slopeDark });
    // Moss & clover tufts
    g.circle(cx - 7, cy + 0.5, 0.7); g.fill({ color: 0x84cc16 });
    g.circle(cx - 5, cy - 1.5, 0.6); g.fill({ color: 0x84cc16 });

    // Quarry crane arm & suspended stone block
    g.moveTo(cx + 4, cy - 11); g.lineTo(cx + 8, cy - 13);
    g.stroke({ width: 1.2, color: 0x5c3818 });
    g.moveTo(cx + 8, cy - 13); g.lineTo(cx + 8, cy - 8);
    g.stroke({ width: 0.6, color: 0xa8a29e });
    g.rect(cx + 7, cy - 8, 2, 2);
    g.fill({ color: 0x78716c });
    g.stroke({ width: 0.4, color: 0x292524 });

    // Deep arched portal
    g.rect(cx - 1.5, cy + 0.5, 3, 4);
    g.fill({ color: 0x09090b });
    g.moveTo(cx - 1.5, cy + 0.5); g.lineTo(cx + 1.5, cy + 0.5);
    g.stroke({ width: 1.2, color: 0x292524 });

    // High quarry window
    if (!isBreached) {
      const candle = 0.85 + Math.sin(phase * 4 + cx) * 0.15;
      g.rect(cx - 1, cy - 6, 2, 2.5);
      g.fill({ color: 0xfef08a, alpha: candle });
      g.stroke({ width: 0.5, color: 0x78350f });
    } else {
      g.rect(cx - 1, cy - 6, 2, 2.5);
      g.fill({ color: 0x09090b });
    }

    // 5. Banner on mast
    if (!isBreached) {
      const gWave = Math.sin(phase * 4 + cx) * 1.8;
      g.moveTo(cx, cy - 11); g.lineTo(cx, cy - 20);
      g.stroke({ width: 1.3, color: 0x5c3818 });
      g.circle(cx, cy - 20.5, 0.9); g.fill({ color: 0xfacc15 });
      g.poly([
        cx, cy - 20,
        cx + 8 + gWave, cy - 17,
        cx + 5 + gWave * 0.6, cy - 14.8,
        cx + 8 + gWave, cy - 12.5,
        cx, cy - 12.5,
      ]);
      g.fill({ color: flagCol });
      g.stroke({ width: 0.6, color: 0x365314 });
      g.poly([
        cx, cy - 18,
        cx + 4 + gWave * 0.5, cy - 16,
        cx, cy - 14,
      ]);
      g.fill({ color: 0xa3e635 });
    } else {
      g.moveTo(cx, cy - 11); g.lineTo(cx, cy - 14);
      g.stroke({ width: 1.3, color: 0x5c3818 });
    }
  } else if (cultKey === "salt") {
    // -------------------------------------------------------------
    // Salt Reaches: Timber Yard Keep with a Grey Salt Roof
    // -------------------------------------------------------------
    const timberWallLight = 0x854d0e;
    const timberWallDark = 0x5c3818;
    const saltRoofLight = 0xd6d3d1;
    const saltRoofDark = 0xa8a29e;
    const saltCrustRidge = 0xf1f5f9;
    const flagCol = realmPal ? realmPal.pennantColor : 0xa8a29e;

    // 1. Heavy timber balk plinth
    g.poly([cx - 8.5, cy + 2.5, cx, cy + 6.5, cx + 8.5, cy + 2.5, cx, cy - 0.5]);
    g.fill({ color: 0x271406 });
    g.stroke({ width: 0.8, color: 0x180c04 });

    // 2. Fortified Timber Yard Walls (squared stacked logs)
    g.poly([cx - 7, cy + 1, cx, cy + 4, cx, cy - 7, cx - 7, cy - 10]);
    g.fill({ color: timberWallLight });
    g.stroke({ width: 0.8, color: 0x3f220c });
    g.poly([cx, cy + 4, cx + 7, cy + 1, cx + 7, cy - 10, cx, cy - 7]);
    g.fill({ color: timberWallDark });
    g.stroke({ width: 0.8, color: 0x271406 });

    // Horizontal timber courses with dovetail notches
    for (const my of [cy - 4.5, cy - 1.5, cy + 1.5]) {
      g.moveTo(cx - 7, my - 2); g.lineTo(cx, my); g.lineTo(cx + 7, my - 2);
      g.stroke({ width: 0.9, color: 0x3f220c, alpha: 0.85 });
    }

    if (isBreached) {
      g.moveTo(cx - 4, cy - 8); g.lineTo(cx - 2, cy - 3); g.lineTo(cx - 5, cy + 1);
      g.stroke({ width: 1.1, color: 0x1f1005 });
    }

    // 3. Steep Grey Salt Roof (weathered grey salt-crusted timber shingles)
    g.poly([cx - 9.5, cy - 7.5, cx, cy - 16, cx + 9.5, cy - 7.5, cx, cy - 4.5]);
    g.fill({ color: saltRoofDark });
    g.stroke({ width: 0.9, color: 0x78350f });
    // Left illuminated salt roof face
    g.poly([cx - 9.5, cy - 7.5, cx, cy - 16, cx, cy - 4.5]);
    g.fill({ color: saltRoofLight });

    // Salt crust frost ridge line
    g.moveTo(cx, cy - 16); g.lineTo(cx, cy - 4.5);
    g.stroke({ width: 1.2, color: saltCrustRidge });
    // Salt shingle horizontal courses
    g.moveTo(cx - 7, cy - 9.5); g.lineTo(cx, cy - 7.5); g.lineTo(cx + 7, cy - 9.5);
    g.stroke({ width: 0.7, color: 0xe2e8f0 });
    g.moveTo(cx - 4, cy - 12.5); g.lineTo(cx, cy - 10.5); g.lineTo(cx + 4, cy - 12.5);
    g.stroke({ width: 0.7, color: 0xe2e8f0 });

    // 4. Timber Yard Details: stacked lumber logs flanking entry
    // Left stacked lumber balks
    g.rect(cx - 7.5, cy + 0.5, 3.5, 2.5);
    g.fill({ color: 0x78350f });
    g.stroke({ width: 0.5, color: 0x451a03 });
    g.circle(cx - 4.5, cy + 1.8, 0.7); g.fill({ color: 0xca8a04 });
    // Right stacked logs
    g.rect(cx + 4, cy + 0.5, 3.5, 2.5);
    g.fill({ color: 0x5c3818 });
    g.stroke({ width: 0.5, color: 0x271406 });
    g.circle(cx + 4.8, cy + 1.8, 0.7); g.fill({ color: 0xca8a04 });

    // Heavy braced timber door
    g.rect(cx - 1.8, cy + 0.5, 3.6, 4);
    g.fill({ color: 0x180c04 });
    g.moveTo(cx - 1.8, cy + 0.5); g.lineTo(cx + 1.8, cy + 0.5);
    g.stroke({ width: 1.2, color: 0xca8a04 });

    // Timber shutter window
    if (!isBreached) {
      const candle = 0.85 + Math.sin(phase * 4 + cx) * 0.15;
      g.rect(cx - 1, cy - 4, 2, 2.5);
      g.fill({ color: 0xfef08a, alpha: candle });
      g.stroke({ width: 0.5, color: 0x78350f });
    } else {
      g.rect(cx - 1, cy - 4, 2, 2.5);
      g.fill({ color: 0x09090b });
    }

    // 5. Salt-grey banner on mast
    if (!isBreached) {
      const sWave = Math.sin(phase * 4 + cx) * 1.8;
      g.moveTo(cx, cy - 14); g.lineTo(cx, cy - 21);
      g.stroke({ width: 1.3, color: 0x5c3818 });
      g.circle(cx, cy - 21.5, 0.9); g.fill({ color: 0xe2e8f0 });
      g.poly([
        cx, cy - 21,
        cx + 8 + sWave, cy - 18,
        cx + 5 + sWave * 0.6, cy - 15.8,
        cx + 8 + sWave, cy - 13.5,
        cx, cy - 13.5,
      ]);
      g.fill({ color: flagCol });
      g.stroke({ width: 0.6, color: 0x57534e });
      g.poly([
        cx, cy - 19,
        cx + 4 + sWave * 0.5, cy - 17,
        cx, cy - 15,
      ]);
      g.fill({ color: 0xe2e8f0 });
    } else {
      g.moveTo(cx, cy - 14); g.lineTo(cx, cy - 17);
      g.stroke({ width: 1.3, color: 0x5c3818 });
    }
  } else if (cultKey === "fen") {
    // -------------------------------------------------------------
    // Fen Steads: Stilt Cottage Keep Over Dark Water
    // -------------------------------------------------------------
    const darkWater = 0x090d16;
    const waterDepth = 0x0f172a;
    const stiltWood = 0x292524;
    const cottageWall = 0x6b7280;
    const reedThatch = 0x4d7c0f;
    const flagCol = realmPal ? realmPal.pennantColor : 0x3f6212;

    // 1. Dark Water pool beneath the entire keep
    g.poly([cx - 11, cy + 1, cx, cy + 6.5, cx + 11, cy + 1, cx, cy - 3.5]);
    g.fill({ color: darkWater });
    g.stroke({ width: 0.7, color: 0x1e293b });
    // Water depth undertone
    g.poly([cx - 8, cy + 1.5, cx, cy + 5, cx + 8, cy + 1.5, cx, cy - 1.5]);
    g.fill({ color: waterDepth });

    // Animated dark water ripples
    const wRip = Math.sin(phase * 3 + cx) * 0.6;
    g.ellipse(cx, cy + 3.2, 5.5 + wRip, 2.2);
    g.stroke({ width: 0.6, color: 0x334155, alpha: 0.65 });

    // Wetland bulrushes & fen reeds at water edge
    g.moveTo(cx - 9, cy + 2.5); g.lineTo(cx - 9, cy - 1);
    g.stroke({ width: 0.8, color: 0x3f6212 });
    g.circle(cx - 9, cy - 1.5, 0.6); g.fill({ color: 0x78350f });
    g.moveTo(cx + 9, cy + 2.5); g.lineTo(cx + 9, cy - 1);
    g.stroke({ width: 0.8, color: 0x3f6212 });
    g.circle(cx + 9, cy - 1.5, 0.6); g.fill({ color: 0x78350f });

    // 2. Heavy wooden stilts / pilings rising out of the dark water
    const stiltCols = [-7, -3, 3, 7];
    for (const sx of stiltCols) {
      g.moveTo(cx + sx, cy + 3 - Math.abs(sx) * 0.25);
      g.lineTo(cx + sx, cy - 2);
      g.stroke({ width: 1.4, color: stiltWood });
    }
    // Cross-bracing under deck
    g.moveTo(cx - 6, cy + 1); g.lineTo(cx - 2, cy - 1.5);
    g.stroke({ width: 0.8, color: 0x1c1917 });
    g.moveTo(cx + 2, cy - 1.5); g.lineTo(cx + 6, cy + 1);
    g.stroke({ width: 0.8, color: 0x1c1917 });

    // 3. Elevated cottage deck platform
    g.poly([cx - 8.5, cy - 1, cx, cy + 2, cx + 8.5, cy - 1, cx, cy - 3.5]);
    g.fill({ color: 0x44403c });
    g.stroke({ width: 0.8, color: 0x1c1917 });

    // 4. Fortified Stilt Cottage Walls
    g.poly([cx - 6.5, cy - 2.5, cx, cy + 0.5, cx, cy - 8, cx - 6.5, cy - 10.5]);
    g.fill({ color: cottageWall });
    g.stroke({ width: 0.7, color: 0x292524 });
    g.poly([cx, cy + 0.5, cx + 6.5, cy - 2.5, cx + 6.5, cy - 10.5, cx, cy - 8]);
    g.fill({ color: 0x4b5563 });
    g.stroke({ width: 0.7, color: 0x1c1917 });

    if (isBreached) {
      g.moveTo(cx - 3, cy - 9); g.lineTo(cx - 1, cy - 5); g.lineTo(cx - 4, cy - 2);
      g.stroke({ width: 1.1, color: 0x1c1917 });
      // Broken listing stilt
      g.moveTo(cx - 3, cy + 3); g.lineTo(cx - 1, cy);
      g.stroke({ width: 1.2, color: 0x1c1917 });
    }

    // 5. Steep mossy fen-reed cottage roof
    g.poly([cx - 8.5, cy - 9, cx, cy - 16.5, cx + 8.5, cy - 9, cx, cy - 6]);
    g.fill({ color: 0x365314 });
    g.stroke({ width: 0.8, color: 0x1a2e05 });
    g.poly([cx - 8.5, cy - 9, cx, cy - 16.5, cx, cy - 6]);
    g.fill({ color: reedThatch });

    // Reed ridge line
    g.moveTo(cx, cy - 16.5); g.lineTo(cx, cy - 6);
    g.stroke({ width: 1.1, color: 0x65a30d });

    // Elevated doorway & hanging lantern over dark water
    g.rect(cx - 1.5, cy - 2, 3, 3);
    g.fill({ color: 0x09090b });
    if (!isBreached) {
      // Warm amber lantern hanging under stilt platform over water
      const lnt = 0.85 + Math.sin(phase * 4 + cx) * 0.15;
      g.circle(cx, cy + 1.2, 1.6);
      g.fill({ color: 0xfef08a, alpha: lnt * 0.45 });
      g.circle(cx, cy + 1.2, 0.7);
      g.fill({ color: 0xfef08a, alpha: lnt });
      // Reflection on dark water
      g.ellipse(cx, cy + 3.8, 1.8, 0.6);
      g.fill({ color: 0xfef08a, alpha: lnt * 0.25 });
    }

    // 6. Fen banner on mast
    if (!isBreached) {
      const fWave = Math.sin(phase * 4 + cx) * 1.8;
      g.moveTo(cx, cy - 14); g.lineTo(cx, cy - 21);
      g.stroke({ width: 1.3, color: 0x292524 });
      g.circle(cx, cy - 21.5, 0.9); g.fill({ color: 0x84cc16 });
      g.poly([
        cx, cy - 21,
        cx + 8 + fWave, cy - 18,
        cx + 5 + fWave * 0.6, cy - 15.8,
        cx + 8 + fWave, cy - 13.5,
        cx, cy - 13.5,
      ]);
      g.fill({ color: flagCol });
      g.stroke({ width: 0.6, color: 0x1a2e05 });
      g.poly([
        cx, cy - 19,
        cx + 4 + fWave * 0.5, cy - 17,
        cx, cy - 15,
      ]);
      g.fill({ color: 0x84cc16 });
    } else {
      g.moveTo(cx, cy - 14); g.lineTo(cx, cy - 17);
      g.stroke({ width: 1.3, color: 0x292524 });
    }
  } else if (cultKey === "peak") {
    // -------------------------------------------------------------
    // Peak Holds: Tall White Keep with a Snow Cap
    // -------------------------------------------------------------
    const whiteLimestone = 0xf8fafc;
    const limestoneShade = 0xcbd5e1;
    const limestoneDark = 0x94a3b8;
    const snowCap = 0xffffff;
    const snowShade = 0xe0f2fe;
    const icicleCol = 0xbae6fd;
    const flagCol = realmPal ? realmPal.pennantColor : 0x475569;

    // 1. Dressed white limestone plinth
    g.poly([cx - 8.5, cy + 2.5, cx, cy + 6.5, cx + 8.5, cy + 2.5, cx, cy - 0.5]);
    g.fill({ color: limestoneDark });
    g.stroke({ width: 0.8, color: 0x64748b });

    // 2. Soaring Tall White Keep Walls (noticeably taller: reaching up to cy - 16 vs standard cy - 12)
    g.poly([cx - 7, cy + 1, cx, cy + 4, cx, cy - 13, cx - 7, cy - 16]);
    g.fill({ color: whiteLimestone });
    g.stroke({ width: 0.8, color: 0x94a3b8 });
    g.poly([cx, cy + 4, cx + 7, cy + 1, cx + 7, cy - 16, cx, cy - 13]);
    g.fill({ color: limestoneShade });
    g.stroke({ width: 0.8, color: 0x64748b });

    // Clean white quoin courses
    g.rect(cx - 7, cy - 14, 1.6, 2); g.fill({ color: 0xffffff });
    g.rect(cx - 7, cy - 10, 1.6, 2); g.fill({ color: 0xffffff });
    g.rect(cx - 7, cy - 6, 1.6, 2); g.fill({ color: 0xffffff });
    g.rect(cx - 7, cy - 2, 1.6, 2); g.fill({ color: 0xffffff });

    // Center dividing seam
    g.moveTo(cx, cy - 13); g.lineTo(cx, cy + 4);
    g.stroke({ width: 1.1, color: 0x64748b });

    // Horizontal dressed ashlar lines
    for (const my of [cy - 9, cy - 5, cy - 1]) {
      g.moveTo(cx - 7, my - 2); g.lineTo(cx, my); g.lineTo(cx + 7, my - 2);
      g.stroke({ width: 0.7, color: 0x94a3b8, alpha: 0.75 });
    }

    if (isBreached) {
      g.moveTo(cx - 4, cy - 14); g.lineTo(cx - 2, cy - 7); g.lineTo(cx - 5, cy);
      g.stroke({ width: 1.1, color: 0x334155 });
    }

    // 3. The Snow Cap: sculptured alpine snow mantle crowning battlements & roof
    // Deep snow cap over battlements
    g.poly([cx - 8.5, cy - 15.5, cx, cy - 20, cx + 8.5, cy - 15.5, cx, cy - 12.5]);
    g.fill({ color: snowShade });
    g.stroke({ width: 0.7, color: 0x94a3b8 });
    // Brilliant pure white snow cap crest
    g.poly([cx - 8.5, cy - 15.5, cx, cy - 20, cx, cy - 12.5]);
    g.fill({ color: snowCap });

    // Snow pillows atop corner bartizans
    g.circle(cx - 7, cy - 16, 1.5); g.fill({ color: snowCap });
    g.circle(cx + 7, cy - 16, 1.5); g.fill({ color: snowShade });

    // Crystalline icicles hanging from parapet
    g.moveTo(cx - 5, cy - 12.5); g.lineTo(cx - 5, cy - 10.5);
    g.stroke({ width: 0.8, color: icicleCol, alpha: 0.85 });
    g.moveTo(cx + 4, cy - 12.5); g.lineTo(cx + 4, cy - 10.5);
    g.stroke({ width: 0.8, color: icicleCol, alpha: 0.85 });
    g.moveTo(cx - 1, cy - 11.5); g.lineTo(cx - 1, cy - 9.5);
    g.stroke({ width: 0.8, color: icicleCol, alpha: 0.85 });

    // Tall narrow lancet window & portal
    g.rect(cx - 1.8, cy + 0.5, 3.6, 4);
    g.fill({ color: 0x09090b });
    g.moveTo(cx - 1.8, cy + 0.5); g.lineTo(cx + 1.8, cy + 0.5);
    g.stroke({ width: 1.2, color: whiteLimestone });

    if (!isBreached) {
      // Warm golden light streaming from tall lancet window
      const candle = 0.85 + Math.sin(phase * 4 + cx) * 0.15;
      g.circle(cx, cy - 7, 2.2);
      g.fill({ color: 0xfef08a, alpha: candle * 0.4 });
      g.rect(cx - 1, cy - 8.5, 2, 3.6);
      g.fill({ color: 0xfef08a, alpha: candle });
      g.stroke({ width: 0.5, color: 0x78350f });
    } else {
      g.rect(cx - 1, cy - 8.5, 2, 3.6);
      g.fill({ color: 0x09090b });
      g.stroke({ width: 0.5, color: 0x334155 });
    }

    // 4. Alpine mast flying high above snow cap
    if (!isBreached) {
      const pWave = Math.sin(phase * 4 + cx) * 1.8;
      g.moveTo(cx, cy - 15); g.lineTo(cx, cy - 25);
      g.stroke({ width: 1.3, color: 0x64748b });
      g.circle(cx, cy - 25.5, 1); g.fill({ color: 0xf8fafc });
      g.poly([
        cx, cy - 25,
        cx + 8 + pWave, cy - 22,
        cx + 5 + pWave * 0.6, cy - 19.8,
        cx + 8 + pWave, cy - 17.5,
        cx, cy - 17.5,
      ]);
      g.fill({ color: flagCol });
      g.stroke({ width: 0.6, color: 0x334155 });
      g.poly([
        cx, cy - 23,
        cx + 4 + pWave * 0.5, cy - 21,
        cx, cy - 19,
      ]);
      g.fill({ color: 0xf8fafc });
    } else {
      g.moveTo(cx, cy - 15); g.lineTo(cx, cy - 18);
      g.stroke({ width: 1.3, color: 0x64748b });
    }
  } else {
    // Culture-specific miniature pixel keeps (Older kits & Western)
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

      if (isBreached) {
        // Crack fissure across tower wall
        g.moveTo(cx - 4, cy - 10); g.lineTo(cx - 2, cy - 5); g.lineTo(cx - 5, cy);
        g.stroke({ width: 0.9, color: 0x0f172a });
      }

      // 3. Corner Watch Bartizans
      g.poly([cx - 8, cy - 10, cx - 5.5, cy - 8.5, cx - 5.5, cy - 14, cx - 8, cy - 15]);
      g.fill({ color: bartizanLight });
      g.stroke({ width: 0.6, color: 0x1e293b });
      g.poly([cx - 8, cy - 15, cx - 5.5, cy - 14, cx - 6.8, cy - 17.5]);
      g.fill({ color: stonePlinth });
      if (!isBreached) {
        g.circle(cx - 6.8, cy - 17.5, 0.6); g.fill({ color: 0xfacc15 });
      }

      g.poly([cx + 5.5, cy - 8.5, cx + 8, cy - 10, cx + 8, cy - 15, cx + 5.5, cy - 14]);
      g.fill({ color: bartizanDark });
      g.stroke({ width: 0.6, color: 0x0f172a });
      g.poly([cx + 5.5, cy - 14, cx + 8, cy - 15, cx + 6.8, cy - 17.5]);
      g.fill({ color: 0x0f172a });
      if (!isBreached) {
        g.circle(cx + 6.8, cy - 17.5, 0.6); g.fill({ color: 0xfacc15 });
      }

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

      // 6. Royal High Window
      if (!isBreached) {
        // Warm Royal Candlelit Window with ambient glow when hold stands
        const candle = 0.85 + Math.sin(phase * 4 + cx) * 0.15;
        g.circle(cx, cy - 5, 2.5);
        g.fill({ color: 0xfef08a, alpha: candle * 0.35 });
        g.rect(cx - 1.2, cy - 6.5, 2.4, 3.2);
        g.fill({ color: 0xfef08a, alpha: candle });
        g.stroke({ width: 0.6, color: 0x78350f });
      } else {
        // Dark shattered window aperture when breached (no candlelit glow)
        g.rect(cx - 1.2, cy - 6.5, 2.4, 3.2);
        g.fill({ color: 0x09090b });
        g.stroke({ width: 0.6, color: 0x1e293b });
      }

      // 7. Standard / Pennant on Mast
      if (!isBreached) {
        // Waving Swallowtail Pennant on Mast when hold stands
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
      } else {
        // Snapped splintered mast stump when breached (no proud banner, no golden finial)
        g.moveTo(cx, cy - 11); g.lineTo(cx, cy - 14);
        g.stroke({ width: 1.3, color: 0x1e293b });
      }
      break;
    }
  }
}

  // 2. Draw front annexes / scaffolding (in front of keep)
  for (const annex of frontAnnexes) {
    drawKeepYardAnnex(g, cx, cy, annex, resolvedKit, phase);
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

  // Majestic Golden Coronet Crest & Hearth Smoke for Player Capital Home Keep
  if (isHome) {
    const hasPeople = options?.hasPeople ?? (options?.state ? holdHasPeople(options.state) : true);
    const mcX = cx + 4.5;
    const mcY = cy - 13;
    if (!isBreached) {
      if (hasPeople) {
        const mWind = Math.sin(phase * 2 + cx) * 0.8;
        // Warm hearth ember glint
        g.circle(mcX, mcY, 0.7);
        g.fill({ color: 0xfef08a, alpha: 0.85 });
        // Billowing tiny puffs
        g.circle(mcX + mWind * 0.4, mcY - 2.5, 1.2);
        g.fill({ color: 0xe2e8f0, alpha: 0.65 });
        g.circle(mcX + 1.2 + mWind * 0.8, mcY - 5.5, 1.6);
        g.fill({ color: 0xf1f5f9, alpha: 0.45 });
      } else {
        // Quieter faint wisp
        g.circle(mcX, mcY - 2.2, 0.7);
        g.fill({ color: 0xd1d5db, alpha: 0.2 });
      }

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
    } else {
      // Breached: faint spent ash wisp (no warm golden glow, no proud golden coronet)
      g.circle(mcX, mcY - 2.2, 0.6);
      g.fill({ color: 0x475569, alpha: 0.2 });
    }
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
 * Draws a small ruined keep on the diamond tile:
 * - Broken wall: crumbled, cracked, uneven masonry courses with deep fissures and jagged breaches
 * - Fallen stone: tumbled ashlar blocks and rubble heaps scattered across the plinth and ground
 * - Empty breached gateway
 * - No flag / banner
 * - No tent
 */
export function drawRuinedKeep(
  g: Graphics,
  cx: number,
  cy: number,
  phase: number = 0,
  options?: { withShadow?: boolean }
): void {
  // 1. Ambient ground contact shadow (detaches keep and rubble from busy terrain relief)
  g.ellipse(cx, cy + 4, 11, 4.5);
  g.fill({ color: 0x050403, alpha: 0.58 });
  g.ellipse(cx - 5.5, cy + 4.5, 4.5, 2.2);
  g.fill({ color: 0x050403, alpha: 0.35 });
  g.ellipse(cx + 5.5, cy + 4.5, 4.5, 2.2);
  g.fill({ color: 0x050403, alpha: 0.35 });

  const plinthDark = 0x292524;
  const plinthBorder = 0x1c1917;
  const stoneLight = 0x78716c; // weathered light ashlar wall
  const stoneDark = 0x44403c;  // shadowed dark ashlar wall
  const stoneCore = 0xa8a29e;  // exposed inner rubble core
  const stoneCrack = 0x18181b;
  const mossGreen = 0x3f6212;
  const mossLight = 0x4d7c0f;

  // 2. Crumbled Foundation Talus Plinth with dark border
  g.poly([
    cx - 8.5, cy + 2.5,
    cx, cy + 6.5,
    cx + 8.5, cy + 2.5,
    cx, cy - 0.5,
  ]);
  g.fill({ color: plinthDark });
  g.stroke({ width: 0.8, color: plinthBorder });

  // 3. Broken Wall: Left Standing Stub (sunlit, jagged fracture line at top)
  g.poly([
    cx - 7, cy + 1,
    cx, cy + 3.8,
    cx, cy - 5.5,
    cx - 2, cy - 8.5,
    cx - 4, cy - 6.5,
    cx - 5.5, cy - 9,
    cx - 7, cy - 6,
  ]);
  g.fill({ color: stoneLight });
  g.stroke({ width: 0.8, color: plinthBorder });

  // 4. Broken Wall: Right Collapsed Stub (heavily tumbled, lower profile)
  g.poly([
    cx, cy + 3.8,
    cx + 7, cy + 1,
    cx + 7, cy - 3.5,
    cx + 5, cy - 5,
    cx + 3, cy - 3,
    cx + 1.5, cy - 4.5,
    cx, cy - 5.5,
  ]);
  g.fill({ color: stoneDark });
  g.stroke({ width: 0.8, color: plinthBorder });

  // 5. Exposed Inner Rubble Core along broken top edges
  g.poly([
    cx - 5.5, cy - 9,
    cx - 4, cy - 6.5,
    cx - 2, cy - 8.5,
    cx, cy - 5.5,
    cx + 1.5, cy - 4.5,
    cx + 3, cy - 3,
    cx + 5, cy - 5,
    cx + 7, cy - 3.5,
    cx + 6, cy - 2.5,
    cx + 2, cy - 2,
    cx - 2, cy - 4.5,
    cx - 7, cy - 5,
  ]);
  g.fill({ color: stoneCore });
  g.stroke({ width: 0.6, color: 0x27272a });

  // 6. Wall Seams, Weathered Courses, and Deep Fissures
  // Center corner seam
  g.moveTo(cx, cy - 5.5);
  g.lineTo(cx, cy + 3.8);
  g.stroke({ width: 1.0, color: plinthBorder });

  // Deep structural crack on left tower face
  g.moveTo(cx - 4, cy - 6.5);
  g.lineTo(cx - 3, cy - 3);
  g.lineTo(cx - 5, cy - 0.5);
  g.lineTo(cx - 4, cy + 1.8);
  g.stroke({ width: 0.9, color: stoneCrack });

  // Structural fracture on right wall
  g.moveTo(cx + 3, cy - 3);
  g.lineTo(cx + 4.5, cy - 0.5);
  g.lineTo(cx + 3.5, cy + 1.5);
  g.stroke({ width: 0.8, color: stoneCrack });

  // Weathered horizontal masonry courses
  g.moveTo(cx - 7, cy - 2); g.lineTo(cx, cy + 0.5); g.lineTo(cx + 7, cy - 1);
  g.stroke({ width: 0.7, color: 0x292524, alpha: 0.7 });

  // 7. Empty Breached Gateway (shattered portal, fallen lintel stone)
  g.poly([
    cx - 2, cy + 3.5,
    cx - 2, cy + 0.8,
    cx, cy - 0.2,
    cx + 2, cy + 0.8,
    cx + 2, cy + 3.5,
  ]);
  g.fill({ color: 0x0c0a09 });
  // Slanted fallen lintel stone wedged in entrance
  g.poly([
    cx - 2.8, cy + 0.2,
    cx + 2.2, cy + 1.2,
    cx + 1.8, cy + 2.2,
    cx - 3.2, cy + 1.2,
  ]);
  g.fill({ color: 0x57534e });
  g.stroke({ width: 0.6, color: plinthBorder });

  // 8. Fallen Stone: Tumbled Masonry Blocks and Rubble Piles on Diamond Ground
  // Fallen stone block 1 (southwest rubble block)
  g.poly([
    cx - 9, cy + 2.5,
    cx - 6.5, cy + 1,
    cx - 5, cy + 2.5,
    cx - 7.5, cy + 4,
  ]);
  g.fill({ color: 0xa8a29e });
  g.stroke({ width: 0.6, color: 0x27272a });
  g.poly([
    cx - 7.5, cy + 4,
    cx - 5, cy + 2.5,
    cx - 5, cy + 3.5,
    cx - 7.5, cy + 5,
  ]);
  g.fill({ color: 0x57534e });

  // Fallen stone block 2 (southeast crumbled block)
  g.poly([
    cx + 4.5, cy + 3,
    cx + 7.5, cy + 1.5,
    cx + 9, cy + 3,
    cx + 6, cy + 4.5,
  ]);
  g.fill({ color: 0x78716c });
  g.stroke({ width: 0.6, color: plinthBorder });
  g.poly([
    cx + 6, cy + 4.5,
    cx + 9, cy + 3,
    cx + 9, cy + 4,
    cx + 6, cy + 5.5,
  ]);
  g.fill({ color: 0x44403c });

  // Fallen stone block 3 (dislodged stone in foreground center)
  g.poly([
    cx - 1.5, cy + 4.5,
    cx + 1, cy + 3.2,
    cx + 2.8, cy + 4.8,
    cx + 0.3, cy + 6.1,
  ]);
  g.fill({ color: 0xd6d3d1 });
  g.stroke({ width: 0.6, color: 0x27272a });

  // Loose stone chunks and gravel debris
  g.rect(cx - 5.5, cy + 4.5, 1.8, 1.2); g.fill({ color: 0x78716c });
  g.rect(cx + 3, cy + 5, 1.6, 1.2); g.fill({ color: 0x57534e });
  g.rect(cx - 3.5, cy + 5.5, 1.4, 1.0); g.fill({ color: 0xa8a29e });
  g.rect(cx + 7.5, cy + 0.5, 1.6, 1.3); g.fill({ color: 0x78716c });
  g.rect(cx - 8, cy + 0.2, 1.5, 1.2); g.fill({ color: 0x57534e });

  // 9. Wild Overgrowth: Creeping Moss and Lichen
  g.circle(cx - 6, cy + 1.5, 0.8); g.fill({ color: mossGreen });
  g.circle(cx - 5.2, cy + 2, 0.6); g.fill({ color: mossLight });
  g.circle(cx + 5, cy + 2.2, 0.8); g.fill({ color: mossGreen });
  g.circle(cx + 2, cy - 2, 0.7); g.fill({ color: mossLight });
  g.circle(cx - 2, cy - 5, 0.7); g.fill({ color: mossGreen });
}

/**
 * Draws the complete resource node on an isometric diamond tile:
 * 1. Facility / work station landmark on the left (stump+axe, quarry face+pick, wheat stook+sickle, or small ruined keep)
 * 2. Small stock pile on the right (stacked logs, ashlar blocks, grain sacks, treasure cache) when the province already has node stock.
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
      // Small ruined keep on the diamond: broken wall, fallen stone, no flag, no tent
      drawRuinedKeep(g, cx, cy - 2, phase);
      break;
    }
  }

  // 2. Small Stock Pile on Right Side of Diamond (only when province already has stock; empty nodes stay as they are)
  if (hasStock && ratio > 0) {
    drawNodeStockPile(g, cx + 5, cy + 1, nodeType, ratio, phase);
  }
}

/**
 * 3x5 Pixel Bitmap Font for numeric digits 0-9 and '/' ratio separator.
 * Bit 2 (4) is x=0, Bit 1 (2) is x=1, Bit 0 (1) is x=2.
 */
export const STOCK_BADGE_GLYPHS_3X5: Record<string, number[]> = {
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
  "/": [1, 1, 2, 4, 4],
};

/**
 * Formats the stock ratio text for a gather node badge (e.g. "12/40" or "0/40").
 * Returns null when stockMax <= 0.
 */
export function formatStockBadgeText(stock: number, stockMax: number): string | null {
  if (!Number.isFinite(stockMax) || stockMax <= 0) return null;
  const safeMax = Math.max(0, Math.floor(stockMax));
  if (safeMax <= 0) return null;
  const safeStock = Math.max(0, Math.floor(Number.isFinite(stock) ? stock : 0));
  return `${safeStock}/${safeMax}`;
}

/**
 * Paints a small dark pill with the stock ratio (e.g. 12/40) in light text,
 * tucked beside the resource pile on an isometric gather tile.
 * - Stocked tile (stock > 0): dark pill (0x090d16, border 0x475569) with light text (0xf8fafc).
 * - Dry tile (stock <= 0): shows 0/N in muted grey (0x94a3b8) with muted border (0x3f3f46).
 * - No badge when stockMax is 0 (or <= 0).
 * - Strictly non-interactive (rendered on board graphics layer with pointer-events: none).
 */
export function drawStockBadge(
  g: Graphics,
  cx: number,
  cy: number,
  stock: number,
  stockMax: number
): void {
  const text = formatStockBadgeText(stock, stockMax);
  if (!text) return;

  const safeStock = Math.max(0, Math.floor(Number.isFinite(stock) ? stock : 0));
  const isDry = safeStock <= 0;

  // Compute compact pill dimensions for 3x5 bitmap glyphs (3px wide, 1px gap, 2px horizontal pad, 1px vertical pad)
  const pillW = Math.max(15, 4 * text.length + 3);
  const pillH = 7;
  // Tucked beside/below-right of the stock pile (which sits at cx + 5, cy + 1)
  const pillX = Math.round(cx + 5 - pillW / 2);
  const pillY = Math.round(cy + 4);

  // 1. Subtle drop shadow under the pill
  g.rect(pillX, pillY + 1, pillW, pillH);
  g.fill({ color: 0x000000, alpha: 0.42 });

  // 2. Small dark pill container
  const pillFill = 0x090d16;
  const pillBorder = isDry ? 0x3f3f46 : 0x475569;
  g.rect(pillX, pillY, pillW, pillH);
  g.fill({ color: pillFill, alpha: isDry ? 0.86 : 0.94 });
  g.stroke({ width: 0.8, color: pillBorder, alpha: isDry ? 0.78 : 0.92 });

  // 3. Ratio text (e.g. "12/40" in light text 0xf8fafc, or "0/N" in muted grey 0x94a3b8 when dry)
  const textColor = isDry ? 0x94a3b8 : 0xf8fafc;
  const textAlpha = isDry ? 0.85 : 0.96;

  let charX = pillX + 2;
  const charY = pillY + 1;

  for (let c = 0; c < text.length; c++) {
    const ch = text[c];
    const glyph = STOCK_BADGE_GLYPHS_3X5[ch];
    if (glyph) {
      for (let r = 0; r < 5; r++) {
        const bits = glyph[r];
        if (bits === 7) {
          g.rect(charX, charY + r, 3, 1);
        } else if (bits === 6) {
          g.rect(charX, charY + r, 2, 1);
        } else if (bits === 5) {
          g.rect(charX, charY + r, 1, 1);
          g.rect(charX + 2, charY + r, 1, 1);
        } else if (bits === 4) {
          g.rect(charX, charY + r, 1, 1);
        } else if (bits === 3) {
          g.rect(charX + 1, charY + r, 2, 1);
        } else if (bits === 2) {
          g.rect(charX + 1, charY + r, 1, 1);
        } else if (bits === 1) {
          g.rect(charX + 2, charY + r, 1, 1);
        }
      }
    }
    charX += 4;
  }
  g.fill({ color: textColor, alpha: textAlpha });
}

// -------------------------------------------------------------
// Active Column Clash & Engagement Mark (drawClashMark)
// -------------------------------------------------------------

/**
 * Determines whether a seen province on the board currently has an active
 * column clash (columns of two or more realms bound for the tile) or an
 * active engagement (a rival column bound for a player-held tile/outpost, or
 * a non-scout column bound for a tile occupied by a different realm).
 * Uses only existing board/march/garrison/incoming data already read by the board.
 * Unseen tiles always return false (stay fog).
 */
export function hasProvinceClash(
  state: GameState | null | undefined,
  provinceId: string | null | undefined
): boolean {
  if (!state?.board?.provinces || !provinceId) return false;
  if (!isProvinceSeen(state, provinceId)) return false;

  const simMarches = listMarches(state);
  const boardMarches = Array.isArray((state.board as any).marches)
    ? ((state.board as any).marches as March[])
    : [];
  const allMarches = simMarches.length > 0 ? simMarches : boardMarches;
  const marchesToTile = allMarches.filter(
    (m) => m && m.toId === provinceId
  );

  // 1. Column clash: columns of two or more realms bound for the same tile
  const realms = new Set(marchesToTile.map((m) => m.realmId));
  if (realms.size >= 2) return true;

  // 2. Engagement: rival column bound for a tile the player holds or garrisons
  const p = getProvince(state, provinceId);
  const incoming =
    incomingOnProvince(state, provinceId) ??
    marchesToTile.find((m) => m.realmId !== "player" && !isScoutMarch(m));
  const playerHolds =
    p?.occupantRealmId === "player" ||
    provinceId === state.board.homeProvinceId ||
    Boolean(garrisonAt(state, provinceId));
  if (incoming && playerHolds) return true;

  // Or a non-scout column bound for a tile occupied by a different realm
  if (
    p?.occupantRealmId &&
    marchesToTile.some((m) => m.realmId !== p.occupantRealmId && !isScoutMarch(m))
  ) {
    return true;
  }

  return false;
}

/**
 * Paints a small crossed-swords and impact burst clash mark on a province
 * that has an active column clash or engagement on the isometric diamond.
 *
 * Visual anatomy:
 * - Soft ground/drop shadow beneath the mark so it reads crisply over any terrain or token
 * - Dark iron shield roundel backing (0x1a0b0e) with crimson warning rim (0x991b1b)
 * - Jagged 8-point crimson-amber impact burst (0xdc2626 / 0xef4444 / 0xf97316)
 * - Pair of crossed steel broadswords (0xe2e8f0 / 0xcbd5e1 / 0xf8fafc / 0x475569)
 *   with brass crossguards & pommels (0xd97706) and leather grips (0x78350f)
 * - Bright white-gold clash spark at the blade intersection (0xfef08a / 0xffffff)
 * - Purely non-interactive graphics (pointer-events: none; camera math, zoom, and hit-testing untouched)
 */
export function drawClashMark(
  g: Graphics,
  cx: number,
  cy: number,
  phase: number = 0
): void {
  if (!g) return;

  const pulse = 1 + Math.sin(phase * 3.2) * 0.06;
  const mx = cx;
  const my = cy;

  // 1. Soft drop shadow beneath the clash emblem
  g.ellipse(mx, my + 1.8, 7.6, 4.4);
  g.fill({ color: 0x000000, alpha: 0.45 });

  // 2. Dark obsidian roundel backing for crisp contrast over keeps, piles, and terrain
  g.circle(mx, my, 6.4);
  g.fill({ color: 0x1a0b0e, alpha: 0.88 });
  g.circle(mx, my, 6.4);
  g.stroke({ width: 0.9, color: 0x991b1b, alpha: 0.92 });

  // 3. Outer 8-point crimson-orange impact burst star
  const rOuter = 7.4 * pulse;
  const rDiag = 6.2 * pulse;
  const rInner = 3.1;
  g.poly([
    mx, my - rOuter,
    mx + rInner * 0.55, my - rInner * 0.55,
    mx + rDiag, my - rDiag * 0.72,
    mx + rInner, my,
    mx + rDiag, my + rDiag * 0.72,
    mx + rInner * 0.55, my + rInner * 0.55,
    mx, my + rOuter * 0.88,
    mx - rInner * 0.55, my + rInner * 0.55,
    mx - rDiag, my + rDiag * 0.72,
    mx - rInner, my,
    mx - rDiag, my - rDiag * 0.72,
    mx - rInner * 0.55, my - rInner * 0.55,
  ]);
  g.fill({ color: 0xdc2626, alpha: 0.94 });
  g.stroke({ width: 0.7, color: 0x7f1d1d, alpha: 0.95 });

  // Inner fiery orange-amber impact burst core
  const rCoreOuter = 4.8 * pulse;
  const rCoreInner = 1.9;
  g.poly([
    mx, my - rCoreOuter,
    mx + rCoreInner, my - rCoreInner,
    mx + rCoreOuter, my,
    mx + rCoreInner, my + rCoreInner,
    mx, my + rCoreOuter,
    mx - rCoreInner, my + rCoreInner,
    mx - rCoreOuter, my,
    mx - rCoreInner, my - rCoreInner,
  ]);
  g.fill({ color: 0xf97316, alpha: 0.95 });

  // 4. Left-to-Right Sword (hilt bottom-left -> tip top-right)
  // Tapered steel blade polygon
  g.poly([
    mx - 2.6, my + 1.8,
    mx - 1.8, my + 2.6,
    mx + 4.4, my - 3.6,
    mx + 4.8, my - 4.8,
    mx + 3.6, my - 4.4,
  ]);
  g.fill({ color: 0xcbd5e1 });
  g.stroke({ width: 0.55, color: 0x475569 });

  // Blade fuller highlight
  g.moveTo(mx - 2.0, my + 2.0);
  g.lineTo(mx + 4.3, my - 4.3);
  g.stroke({ width: 0.7, color: 0xf8fafc, alpha: 0.95 });

  // Leather grip & brass crossguard + pommel (bottom-left)
  g.moveTo(mx - 2.2, my + 2.2);
  g.lineTo(mx - 4.2, my + 4.2);
  g.stroke({ width: 1.5, color: 0x78350f });

  g.moveTo(mx - 3.6, my + 0.8);
  g.lineTo(mx - 0.8, my + 3.6);
  g.stroke({ width: 1.3, color: 0xd97706 });

  g.circle(mx - 4.5, my + 4.5, 1.05);
  g.fill({ color: 0xd97706 });
  g.stroke({ width: 0.45, color: 0x78350f });

  // 5. Right-to-Left Sword (hilt bottom-right -> tip top-left)
  // Tapered steel blade polygon
  g.poly([
    mx + 1.8, my + 2.6,
    mx + 2.6, my + 1.8,
    mx - 3.6, my - 4.4,
    mx - 4.8, my - 4.8,
    mx - 4.4, my - 3.6,
  ]);
  g.fill({ color: 0xe2e8f0 });
  g.stroke({ width: 0.55, color: 0x475569 });

  // Blade fuller highlight
  g.moveTo(mx + 2.0, my + 2.0);
  g.lineTo(mx - 4.3, my - 4.3);
  g.stroke({ width: 0.7, color: 0xffffff, alpha: 0.95 });

  // Leather grip & brass crossguard + pommel (bottom-right)
  g.moveTo(mx + 2.2, my + 2.2);
  g.lineTo(mx + 4.2, my + 4.2);
  g.stroke({ width: 1.5, color: 0x78350f });

  g.moveTo(mx + 0.8, my + 3.6);
  g.lineTo(mx + 3.6, my + 0.8);
  g.stroke({ width: 1.3, color: 0xd97706 });

  g.circle(mx + 4.5, my + 4.5, 1.05);
  g.fill({ color: 0xd97706 });
  g.stroke({ width: 0.45, color: 0x78350f });

  // 6. Central Blade-Intersection Impact Spark
  g.poly([
    mx, my - 2.5 * pulse,
    mx + 0.7, my - 0.7,
    mx + 2.5 * pulse, my,
    mx + 0.7, my + 0.7,
    mx, my + 2.5 * pulse,
    mx - 0.7, my + 0.7,
    mx - 2.5 * pulse, my,
    mx - 0.7, my - 0.7,
  ]);
  g.fill({ color: 0xfef08a, alpha: 0.96 });

  g.circle(mx, my, 0.95);
  g.fill({ color: 0xffffff, alpha: 0.98 });
}

// -------------------------------------------------------------
// Hostile Column Inbound Mark (drawIncomingMark)
// -------------------------------------------------------------

/**
 * Determines whether a seen province on the board currently has a hostile
 * (non-player) march heading to it.
 * Uses only existing march data the board already reads (isProvinceSeen,
 * incomingOnProvince, listMarches). Unseen tiles always return false (stay fog).
 */
export function hasProvinceIncoming(
  state: GameState | null | undefined,
  provinceId: string | null | undefined
): boolean {
  if (!state?.board?.provinces || !provinceId) return false;
  if (!isProvinceSeen(state, provinceId)) return false;

  if (incomingOnProvince(state, provinceId)) return true;

  const boardMarches = Array.isArray((state.board as any).marches)
    ? ((state.board as any).marches as March[])
    : [];
  return boardMarches.some(
    (m) => m && m.toId === provinceId && m.realmId !== "player"
  );
}

/**
 * Paints a small amber arrow and threat pip on a seen province that has a
 * non-player march heading to it on the isometric diamond.
 *
 * Visual anatomy:
 * - Soft ground/drop shadow beneath the pip (0x000000)
 * - Dark amber-obsidian threat pip roundel backing (0x1c1206) with burnt-amber rim (0x92400e)
 * - Inner amber threat diamond ring (0xb45309 / 0x78350f)
 * - Crisp downward-pointing amber chevron arrow and shaft (0xd97706 / 0xf59e0b / 0xfbbf24)
 * - Luminous pale-amber threat pip point at the arrow tip (0xfef3c7)
 * - Purely non-interactive graphics (pointer-events: none; camera math, zoom, and hit-testing untouched)
 */
export function drawIncomingMark(
  g: Graphics,
  cx: number,
  cy: number,
  phase: number = 0
): void {
  if (!g) return;

  const bob = Math.sin(phase * 3.0) * 0.45;
  const mx = cx;
  const my = cy + bob;

  // 1. Soft drop shadow beneath the incoming mark
  g.ellipse(cx, cy + 2.0, 5.8, 3.4);
  g.fill({ color: 0x000000, alpha: 0.42 });

  // 2. Dark amber-obsidian threat pip roundel backing
  g.circle(mx, my, 5.2);
  g.fill({ color: 0x1c1206, alpha: 0.90 });
  g.circle(mx, my, 5.2);
  g.stroke({ width: 0.85, color: 0x92400e, alpha: 0.94 });

  // 3. Amber threat pip diamond frame
  g.poly([
    mx, my - 4.4,
    mx + 4.4, my,
    mx, my + 4.4,
    mx - 4.4, my,
  ]);
  g.fill({ color: 0xb45309, alpha: 0.92 });
  g.stroke({ width: 0.6, color: 0x78350f, alpha: 0.95 });

  // 4. Downward-pointing amber arrow (tail shaft + broad chevron arrowhead)
  // Upper tail feather / notch
  g.poly([
    mx - 1.3, my - 3.6,
    mx + 1.3, my - 3.6,
    mx + 1.0, my - 0.6,
    mx - 1.0, my - 0.6,
  ]);
  g.fill({ color: 0xd97706 });

  // Broad downward amber arrowhead chevron
  g.poly([
    mx - 3.2, my - 1.0,
    mx + 3.2, my - 1.0,
    mx, my + 3.2,
  ]);
  g.fill({ color: 0xf59e0b });
  g.stroke({ width: 0.55, color: 0x78350f });

  // Sunlit left bevel highlight on the amber arrow
  g.poly([
    mx - 2.3, my - 0.7,
    mx, my - 0.7,
    mx, my + 2.4,
  ]);
  g.fill({ color: 0xfbbf24, alpha: 0.95 });

  // 5. Threat pip core glint at the arrow tip and crown
  g.circle(mx, my - 2.3, 0.75);
  g.fill({ color: 0xfef3c7, alpha: 0.95 });

  g.circle(mx, my + 2.2, 0.65);
  g.fill({ color: 0xfef3c7, alpha: 0.98 });
}

// -------------------------------------------------------------
// Player Column Trail Mark (drawTrailMark)
// -------------------------------------------------------------

/**
 * Determines whether a seen province on the board currently has a player
 * march on or heading to it.
 * Uses only existing march data the board already reads (isProvinceSeen,
 * listMarches). Unseen tiles always return false (stay fog).
 */
export function hasProvinceTrail(
  state: GameState | null | undefined,
  provinceId: string | null | undefined
): boolean {
  if (!state?.board?.provinces || !provinceId) return false;
  if (!isProvinceSeen(state, provinceId)) return false;

  const simMarches = listMarches(state);
  if (simMarches.some((m) => m && m.realmId === "player" && m.toId === provinceId)) {
    return true;
  }

  const boardMarches = Array.isArray((state.board as any).marches)
    ? ((state.board as any).marches as March[])
    : [];
  return boardMarches.some(
    (m) => m && m.realmId === "player" && m.toId === provinceId
  );
}

/**
 * Paints a small soft-gold footprint and trail pip on a seen province that has
 * a player march on or heading to it on the isometric diamond.
 *
 * Visual anatomy:
 * - Soft ground/drop shadow beneath the pip (0x000000)
 * - Dark bronze-charcoal trail pip roundel backing (0x19160d) with antique-gold rim (0x85682a / 0xa68438)
 * - Pair of stepping soft-gold boot footprints (sole + heel in 0xd4b062 / 0xc49e48, sunlit toe highlight 0xe6c87a)
 * - Trailing soft-gold breadcrumb trail pips (0xf5e6b3)
 * - Purely non-interactive graphics (pointer-events: none; camera math, zoom, and hit-testing untouched)
 */
export function drawTrailMark(
  g: Graphics,
  cx: number,
  cy: number,
  phase: number = 0
): void {
  if (!g) return;

  const step = Math.sin(phase * 2.8) * 0.35;
  const mx = cx;
  const my = cy + step;

  // 1. Soft drop shadow beneath the trail mark
  g.ellipse(cx, cy + 1.9, 5.6, 3.2);
  g.fill({ color: 0x000000, alpha: 0.40 });

  // 2. Dark bronze-charcoal trail pip roundel backing
  g.circle(mx, my, 5.0);
  g.fill({ color: 0x19160d, alpha: 0.88 });
  g.circle(mx, my, 5.0);
  g.stroke({ width: 0.8, color: 0x85682a, alpha: 0.92 });

  // Subtle inner soft-gold compass ring
  g.circle(mx, my, 4.1);
  g.stroke({ width: 0.5, color: 0xa68438, alpha: 0.78 });

  // 3. Left Boot Footprint (stepping lower-left -> upper-left)
  // Left boot sole (forefoot)
  g.ellipse(mx - 1.5, my - 0.5, 1.15, 1.55);
  g.fill({ color: 0xc49e48 });
  g.ellipse(mx - 1.5, my - 0.6, 0.95, 1.3);
  g.fill({ color: 0xd4b062 });
  // Left boot heel
  g.circle(mx - 1.6, my + 1.6, 0.78);
  g.fill({ color: 0xd4b062 });

  // 4. Right Boot Footprint (stepping slightly ahead on the right)
  // Right boot sole (forefoot)
  g.ellipse(mx + 1.4, my - 1.4, 1.15, 1.55);
  g.fill({ color: 0xc49e48 });
  g.ellipse(mx + 1.4, my - 1.5, 0.95, 1.3);
  g.fill({ color: 0xd4b062 });
  // Sunlit toe highlight on lead footprint
  g.ellipse(mx + 1.4, my - 2.0, 0.65, 0.75);
  g.fill({ color: 0xe6c87a, alpha: 0.95 });
  // Right boot heel
  g.circle(mx + 1.3, my + 0.7, 0.78);
  g.fill({ color: 0xd4b062 });

  // 5. Soft-gold trail pips (leading & trailing step breadcrumbs)
  g.circle(mx - 0.2, my + 2.9, 0.6);
  g.fill({ color: 0xf5e6b3, alpha: 0.92 });

  g.circle(mx + 0.2, my - 3.3, 0.65);
  g.fill({ color: 0xf5e6b3, alpha: 0.96 });
}

// -------------------------------------------------------------
// Player Outpost Flag Pip & Rival Camp Pip (drawOutpostMark)
// -------------------------------------------------------------

export type OutpostMarkKind = "outpost" | "camp" | "player" | "rival";

/**
 * Resolves whether a seen province on the board should show a player outpost
 * flag mark ("outpost") or a rival camp mark ("camp").
 * Uses only existing outpost and province data the board already reads
 * (isProvinceSeen, getProvince, listOutposts). Unseen tiles and the player's
 * home province always return null.
 */
export function resolveProvinceOutpostMark(
  state: GameState | null | undefined,
  provinceId: string | null | undefined
): "outpost" | "camp" | null {
  if (!state?.board?.provinces || !provinceId) return null;
  if (!isProvinceSeen(state, provinceId)) return null;
  if (provinceId === state.board.homeProvinceId) return null;

  const p = getProvince(state, provinceId);
  if (!p) return null;

  if (
    listOutposts(state).some((o) => o.id === provinceId) ||
    (p.occupantRealmId === "player" && p.node !== "hold")
  ) {
    return "outpost";
  }

  if (p.node === "camp" && p.occupantRealmId !== "player") {
    return "camp";
  }

  return null;
}

/**
 * Paints a small emerald flag pip on a seen player outpost or a small deep-red
 * camp pip on a seen rival camp on the isometric diamond.
 *
 * Visual anatomy:
 * - Player Outpost ("outpost" / "player" / true):
 *   - Soft ground/drop shadow beneath the pip (0x000000)
 *   - Dark emerald-forest roundel backing (0x042619) with emerald rim (0x047857)
 *   - Emerald pip bezel (0x059669)
 *   - Crisp silver mast (0xe2e8f0) and fluttering emerald swallowtail flag (0x10b981 / 0x6ee7b7)
 * - Rival Camp ("camp" / "rival" / false):
 *   - Soft ground/drop shadow beneath the pip (0x000000)
 *   - Dark blood-garnet roundel backing (0x2a0808) with crimson rim (0x7f1d1d)
 *   - Deep-red camp pip bezel (0x991b1b)
 *   - Miniature pitched war-camp tent silhouette (0xb91c1c / 0xdc2626, dark flap 0x450a0a, apex pip 0xfca5a5)
 * - Purely non-interactive graphics (pointer-events: none; camera math, zoom, and hit-testing untouched)
 */
export function drawOutpostMark(
  g: Graphics,
  cx: number,
  cy: number,
  kind: OutpostMarkKind | boolean = "outpost",
  phase: number = 0
): void {
  if (!g) return;

  const isPlayerOutpost =
    kind === "outpost" || kind === "player" || kind === true;
  const mx = cx;
  const my = cy;

  // 1. Soft drop shadow beneath the status mark
  g.ellipse(mx, my + 1.8, 5.4, 3.1);
  g.fill({ color: 0x000000, alpha: 0.40 });

  if (isPlayerOutpost) {
    // 2A. Dark emerald roundel backing + emerald rim
    g.circle(mx, my, 4.8);
    g.fill({ color: 0x042619, alpha: 0.90 });
    g.circle(mx, my, 4.8);
    g.stroke({ width: 0.85, color: 0x047857, alpha: 0.94 });

    // Inner emerald pip disk (#059669)
    g.circle(mx, my, 3.8);
    g.fill({ color: 0x059669, alpha: 0.92 });

    // Fluttering miniature emerald flag pip
    const wave = Math.sin(phase * 3.2) * 0.35;
    // Flagpole mast
    g.moveTo(mx - 1.8, my + 2.5);
    g.lineTo(mx - 1.8, my - 2.6);
    g.stroke({ width: 0.95, color: 0xe2e8f0 });

    // Swallowtail emerald flag cloth
    g.poly([
      mx - 1.5, my - 2.4,
      mx + 2.5, my - 1.6 + wave,
      mx + 1.4, my - 0.5 + wave * 0.5,
      mx + 2.5, my + 0.6 + wave,
      mx - 1.5, my + 0.5,
    ]);
    g.fill({ color: 0x10b981 });

    // Pale-emerald upper fold & finial pip
    g.poly([
      mx - 1.5, my - 2.4,
      mx + 2.2, my - 1.6 + wave,
      mx - 1.5, my - 0.9,
    ]);
    g.fill({ color: 0x6ee7b7, alpha: 0.95 });

    g.circle(mx - 1.8, my - 2.8, 0.6);
    g.fill({ color: 0xa7f3d0 });
  } else {
    // 2B. Dark blood-garnet roundel backing + deep-red rim
    g.circle(mx, my, 4.8);
    g.fill({ color: 0x2a0808, alpha: 0.90 });
    g.circle(mx, my, 4.8);
    g.stroke({ width: 0.85, color: 0x7f1d1d, alpha: 0.94 });

    // Inner deep-red camp pip disk (#991b1b)
    g.circle(mx, my, 3.8);
    g.fill({ color: 0x991b1b, alpha: 0.92 });

    // Miniature pitched war-camp tent pip
    // Left shaded tent slope
    g.poly([
      mx - 2.7, my + 2.0,
      mx, my - 2.3,
      mx, my + 2.0,
    ]);
    g.fill({ color: 0xb91c1c });

    // Right sunlit tent slope
    g.poly([
      mx, my - 2.3,
      mx + 2.7, my + 2.0,
      mx, my + 2.0,
    ]);
    g.fill({ color: 0xdc2626 });

    // Dark arched tent entrance flap
    g.poly([
      mx - 1.0, my + 2.0,
      mx, my - 0.1,
      mx + 1.0, my + 2.0,
    ]);
    g.fill({ color: 0x450a0a });

    // Ridgepole apex pip
    g.circle(mx, my - 2.4, 0.6);
    g.fill({ color: 0xfca5a5, alpha: 0.95 });
  }
}


// -------------------------------------------------------------
// Season Pip on Home Tile / Isometric Diamond (drawSeasonMark)
// -------------------------------------------------------------

export type SeasonMarkKind = "spring" | "summer" | "autumn" | "winter";

/**
 * Resolves the normalized season mark kind ("spring" | "summer" | "autumn" | "winter")
 * using only existing season data the board already reads (currentSeason(state) or state.season).
 * Does not add sim math.
 */
export function resolveBoardSeasonMark(
  stateOrSeason?: GameState | SeasonMarkKind | string | null
): SeasonMarkKind {
  const raw =
    typeof stateOrSeason === "string"
      ? stateOrSeason
      : getSeasonFromState(stateOrSeason);
  const norm = String(raw || "spring").trim().toLowerCase();
  if (norm === "summer") return "summer";
  if (norm === "autumn" || norm === "fall" || norm === "harvest") return "autumn";
  if (norm === "winter" || norm === "midwinter") return "winter";
  return "spring";
}

/**
 * Resolves the season mark kind to paint on a province tile on the isometric diamond.
 * Paints on the seen home tile; unseen tiles stay fog (return null), and non-home tiles
 * return null so each diamond stays uncluttered.
 */
export function resolveProvinceSeasonMark(
  state: GameState | null | undefined,
  provinceId: string | null | undefined
): SeasonMarkKind | null {
  if (!state?.board?.provinces || !provinceId) return null;
  if (!isProvinceSeen(state, provinceId)) return null;
  if (provinceId !== state.board.homeProvinceId) return null;
  return resolveBoardSeasonMark(state);
}

/**
 * Paints a small season pip on the home tile of the isometric diamond that
 * changes with the current season:
 * - "spring": soft green leaf (0x4ade80 / 0x16a34a leaf with 0xbbf7d0 vein over 0x132a1c disk)
 * - "summer": gold sun (0xfbbf24 starburst rays, 0xfacc15 sun disk, 0xfef08a core over 0x2b1f07 disk)
 * - "autumn": amber leaf (0xf59e0b / 0xd97706 lobed leaf with 0xfcd34d vein over 0x2c1608 disk)
 * - "winter": pale blue flake (0x7dd3fc crystal core, 0xbae6fd 6-point arms, 0xe0f2fe tips over 0x0c2233 disk)
 *
 * Purely non-interactive graphics (pointer-events: none; camera math, zoom, and hit-testing untouched).
 */
export function drawSeasonMark(
  g: Graphics,
  cx: number,
  cy: number,
  seasonOrState: SeasonMarkKind | string | GameState | null | undefined = "spring",
  phase: number = 0
): void {
  if (!g) return;

  const kind = resolveBoardSeasonMark(seasonOrState);
  const mx = cx;
  const my = cy;

  // 1. Soft drop shadow beneath the season pip
  g.ellipse(mx, my + 1.8, 5.4, 3.1);
  g.fill({ color: 0x000000, alpha: 0.40 });

  // 2. Dark slate-indigo season roundel backing
  g.circle(mx, my, 4.8);
  g.fill({ color: 0x0d1520, alpha: 0.90 });

  if (kind === "spring") {
    // Spring: soft green leaf pip
    g.circle(mx, my, 4.8);
    g.stroke({ width: 0.85, color: 0x15803d, alpha: 0.94 });

    g.circle(mx, my, 3.8);
    g.fill({ color: 0x132a1c, alpha: 0.92 });

    // Upper sunlit soft-green leaf blade
    g.poly([
      mx - 2.3, my + 1.9,
      mx - 1.1, my - 1.4,
      mx + 2.3, my - 2.2,
      mx + 0.5, my + 0.2,
    ]);
    g.fill({ color: 0x4ade80 });

    // Lower shaded leaf facet
    g.poly([
      mx - 2.3, my + 1.9,
      mx + 0.5, my + 0.2,
      mx + 2.3, my - 2.2,
      mx + 1.2, my + 1.2,
    ]);
    g.fill({ color: 0x16a34a });

    // Pale mint midrib vein & tip dewdrop
    g.moveTo(mx - 2.5, my + 2.2);
    g.lineTo(mx + 1.7, my - 1.6);
    g.stroke({ width: 0.75, color: 0xbbf7d0, alpha: 0.95 });

    g.circle(mx + 2.0, my - 1.9, 0.55);
    g.fill({ color: 0xbbf7d0 });
  } else if (kind === "summer") {
    // Summer: gold sun pip
    g.circle(mx, my, 4.8);
    g.stroke({ width: 0.85, color: 0xca8a04, alpha: 0.94 });

    g.circle(mx, my, 3.8);
    g.fill({ color: 0x2b1f07, alpha: 0.92 });

    // 8-point gold sun starburst rays
    const pulse = Math.sin(phase * 3.0) * 0.2;
    const rOuter = 3.1 + pulse;
    const rInner = 1.6;
    const dOuter = rOuter * 0.707;
    const dInner = rInner * 0.383;
    const dMid = rInner * 0.924;
    g.poly([
      mx, my - rOuter,
      mx + dInner, my - dMid,
      mx + dOuter, my - dOuter,
      mx + dMid, my - dInner,
      mx + rOuter, my,
      mx + dMid, my + dInner,
      mx + dOuter, my + dOuter,
      mx + dInner, my + dMid,
      mx, my + rOuter,
      mx - dInner, my + dMid,
      mx - dOuter, my + dOuter,
      mx - dMid, my + dInner,
      mx - rOuter, my,
      mx - dMid, my - dInner,
      mx - dOuter, my - dOuter,
      mx - dInner, my - dMid,
    ]);
    g.fill({ color: 0xfbbf24 });

    // Gold sun disk & warm core glint
    g.circle(mx, my, 1.75);
    g.fill({ color: 0xfacc15 });

    g.circle(mx - 0.35, my - 0.35, 0.75);
    g.fill({ color: 0xfef08a });
  } else if (kind === "autumn") {
    // Autumn: amber leaf pip
    g.circle(mx, my, 4.8);
    g.stroke({ width: 0.85, color: 0x9a3412, alpha: 0.94 });

    g.circle(mx, my, 3.8);
    g.fill({ color: 0x2c1608, alpha: 0.92 });

    // Warm amber lobed autumn leaf blade
    g.poly([
      mx - 2.1, my + 1.8,
      mx - 2.3, my - 0.4,
      mx - 0.8, my - 0.8,
      mx - 0.3, my - 2.4,
      mx + 0.9, my - 1.1,
      mx + 2.4, my - 1.5,
      mx + 0.3, my + 0.3,
    ]);
    g.fill({ color: 0xf59e0b });

    // Deep russet-amber lower leaf lobe
    g.poly([
      mx - 2.1, my + 1.8,
      mx + 0.3, my + 0.3,
      mx + 2.4, my - 1.5,
      mx + 1.8, my + 0.6,
      mx + 0.4, my + 2.0,
    ]);
    g.fill({ color: 0xd97706 });

    // Golden-amber central vein & tip pip
    g.moveTo(mx - 2.4, my + 2.2);
    g.lineTo(mx + 1.6, my - 1.2);
    g.stroke({ width: 0.75, color: 0xfcd34d, alpha: 0.95 });

    g.circle(mx + 1.9, my - 1.4, 0.55);
    g.fill({ color: 0xfcd34d });
  } else {
    // Winter: pale blue flake pip
    g.circle(mx, my, 4.8);
    g.stroke({ width: 0.85, color: 0x0284c7, alpha: 0.94 });

    g.circle(mx, my, 3.8);
    g.fill({ color: 0x0c2233, alpha: 0.92 });

    // Pale blue crystalline snowflake diamond core
    g.poly([
      mx, my - 1.7,
      mx + 1.7, my,
      mx, my + 1.7,
      mx - 1.7, my,
    ]);
    g.fill({ color: 0x7dd3fc });

    // Six-pointed pale blue snowflake crystal arms
    g.moveTo(mx, my - 2.8);
    g.lineTo(mx, my + 2.8);
    g.moveTo(mx - 2.4, my - 1.4);
    g.lineTo(mx + 2.4, my + 1.4);
    g.moveTo(mx - 2.4, my + 1.4);
    g.lineTo(mx + 2.4, my - 1.4);
    g.stroke({ width: 0.85, color: 0xbae6fd, alpha: 0.96 });

    // Crisp ice-blue center & crystal tip pips
    g.circle(mx, my, 0.75);
    g.fill({ color: 0xe0f2fe });
    g.circle(mx, my - 2.8, 0.5);
    g.fill({ color: 0xe0f2fe });
    g.circle(mx, my + 2.8, 0.5);
    g.fill({ color: 0xe0f2fe });
  }
}

// -------------------------------------------------------------
// Posted Garrison Pip on Isometric Diamond (drawGarrisonMark)
// -------------------------------------------------------------

/**
 * Resolves whether a seen province on the board has a posted player garrison.
 * Uses only existing garrison and visibility data the board already reads
 * (isProvinceSeen, garrisonAt). Unseen tiles always return false (stay fog).
 */
export function hasProvinceGarrison(
  state: GameState | null | undefined,
  provinceId: string | null | undefined
): boolean {
  if (!state?.board?.provinces || !provinceId) return false;
  if (!isProvinceSeen(state, provinceId)) return false;
  return Boolean(garrisonAt(state, provinceId));
}

/**
 * Paints a small emerald shield and tent pip on a seen province that has a
 * posted player garrison on the isometric diamond.
 *
 * Visual anatomy:
 * - Soft ground/drop shadow beneath the pip (0x000000)
 * - Dark emerald-iron roundel backing (0x062c1e) with emerald rim (0x047857)
 * - Emerald heater-shield body (0x059669 left facet, 0x10b981 sunlit right facet, 0x6ee7b7 bevel rim)
 * - Miniature pitched garrison tent chevron emblem (0xd1fae5 tent, 0x064e3b tent doorway, 0xa7f3d0 crest pip)
 * - Purely non-interactive graphics (pointer-events: none; camera math, zoom, and hit-testing untouched)
 */
export function drawGarrisonMark(
  g: Graphics,
  cx: number,
  cy: number,
  phase: number = 0
): void {
  if (!g) return;

  const mx = cx;
  const my = cy;
  const pulse = Math.sin(phase * 3.0) * 0.15;

  // 1. Soft drop shadow beneath the garrison mark
  g.ellipse(mx, my + 1.8, 5.4, 3.1);
  g.fill({ color: 0x000000, alpha: 0.40 });

  // 2. Dark emerald-iron roundel backing + emerald rim
  g.circle(mx, my, 4.8);
  g.fill({ color: 0x062c1e, alpha: 0.90 });
  g.circle(mx, my, 4.8);
  g.stroke({ width: 0.85, color: 0x047857, alpha: 0.94 });

  // 3. Emerald heater-shield body (#059669 & #10b981) with bevel rim (#6ee7b7)
  g.poly([
    mx - 2.6, my - 2.4,
    mx + 2.6, my - 2.4,
    mx + 2.6, my + 0.2,
    mx, my + 3.0 + pulse,
    mx - 2.6, my + 0.2,
  ]);
  g.fill({ color: 0x059669 });

  g.poly([
    mx, my - 2.4,
    mx + 2.6, my - 2.4,
    mx + 2.6, my + 0.2,
    mx, my + 3.0 + pulse,
  ]);
  g.fill({ color: 0x10b981 });

  g.poly([
    mx - 2.6, my - 2.4,
    mx + 2.6, my - 2.4,
    mx + 2.6, my + 0.2,
    mx, my + 3.0 + pulse,
    mx - 2.6, my + 0.2,
  ]);
  g.stroke({ width: 0.75, color: 0x6ee7b7, alpha: 0.95 });

  // 4. Miniature pitched garrison tent emblem on the shield face
  g.poly([
    mx - 1.7, my + 1.0,
    mx, my - 1.4,
    mx + 1.7, my + 1.0,
  ]);
  g.fill({ color: 0xd1fae5 });

  g.poly([
    mx - 0.65, my + 1.0,
    mx, my - 0.1,
    mx + 0.65, my + 1.0,
  ]);
  g.fill({ color: 0x064e3b });

  // 5. Shield crest rivet pip
  g.circle(mx, my - 1.7, 0.5);
  g.fill({ color: 0xa7f3d0 });
}

// -------------------------------------------------------------
// Player Scout Cloak & Spyglass Pip on Isometric Diamond (drawScoutMark)
// -------------------------------------------------------------

/**
 * Resolves whether a seen province on the board has a player scout on or heading to it.
 * Uses only existing march, scout, and visibility data the board already reads
 * (isProvinceSeen, listMarches, isScoutMarch). Unseen tiles always return false (stay fog).
 */
export function hasProvinceScout(
  state: GameState | null | undefined,
  provinceId: string | null | undefined
): boolean {
  if (!state?.board?.provinces || !provinceId) return false;
  if (!isProvinceSeen(state, provinceId)) return false;

  const marches = listMarches(state);
  return marches.some(
    (m) => m.realmId === "player" && isScoutMarch(m) && m.toId === provinceId
  );
}

/**
 * Paints a small sky cloak and spyglass pip on a seen province that has a
 * player scout on or heading to it on the isometric diamond.
 *
 * Visual anatomy:
 * - Soft ground/drop shadow beneath the pip (0x000000)
 * - Dark sky-slate roundel backing (0x071e2e) with sky-azure rim (0x0284c7)
 * - Inner deep-sky disk (0x0c4a6e)
 * - Swept sky-blue scout cloak & hood silhouette (0x0ea5e9 shaded fold, 0x38bdf8 sky cloak)
 * - Angled spyglass barrel & gleaming crystal objective lens (0x7dd3fc barrel, 0xe0f2fe lens glint)
 * - Purely non-interactive graphics (pointer-events: none; camera math, zoom, and hit-testing untouched)
 */
export function drawScoutMark(
  g: Graphics,
  cx: number,
  cy: number,
  phase: number = 0
): void {
  if (!g) return;

  const mx = cx;
  const my = cy;
  const sway = Math.sin(phase * 3.0) * 0.25;

  // 1. Soft drop shadow beneath the scout mark
  g.ellipse(mx, my + 1.8, 5.4, 3.1);
  g.fill({ color: 0x000000, alpha: 0.40 });

  // 2. Dark sky-slate roundel backing + sky-azure rim
  g.circle(mx, my, 4.8);
  g.fill({ color: 0x071e2e, alpha: 0.90 });
  g.circle(mx, my, 4.8);
  g.stroke({ width: 0.85, color: 0x0284c7, alpha: 0.94 });

  // 3. Inner deep-sky disk
  g.circle(mx, my, 3.8);
  g.fill({ color: 0x0c4a6e, alpha: 0.92 });

  // 4. Swept sky-blue scout cloak & hood (#0ea5e9 & #38bdf8)
  g.poly([
    mx - 2.6, my + 2.2,
    mx - 1.8, my - 1.5,
    mx - 0.3, my - 2.6,
    mx + 1.4, my - 1.2,
    mx + 2.3 + sway, my + 2.1,
  ]);
  g.fill({ color: 0x0ea5e9 });

  g.poly([
    mx - 0.3, my - 2.6,
    mx + 1.4, my - 1.2,
    mx + 2.3 + sway, my + 2.1,
    mx - 0.2, my + 2.1,
  ]);
  g.fill({ color: 0x38bdf8 });

  // 5. Angled spyglass barrel & gleaming objective lens
  g.moveTo(mx - 1.6, my + 1.0);
  g.lineTo(mx + 2.2, my - 1.5);
  g.stroke({ width: 1.25, color: 0x7dd3fc, alpha: 0.96 });

  g.circle(mx + 2.3, my - 1.6, 0.95);
  g.fill({ color: 0x38bdf8 });
  g.circle(mx + 2.3, my - 1.6, 0.55);
  g.fill({ color: 0xe0f2fe });
}

// -------------------------------------------------------------
// Player Gather Cart & Sack Pip on Isometric Diamond (drawGatherMark)
// -------------------------------------------------------------

/**
 * Resolves whether a seen province on the board has a player gather on or heading to it.
 * Uses only existing gather, march, and visibility data the board already reads
 * (isProvinceSeen, listGathers, listMarches). Unseen tiles always return false (stay fog),
 * and returning gathers that have already left the tile return false.
 */
export function hasProvinceGather(
  state: GameState | null | undefined,
  provinceId: string | null | undefined
): boolean {
  if (!state?.board?.provinces || !provinceId) return false;
  if (!isProvinceSeen(state, provinceId)) return false;

  if (typeof listGathers === "function") {
    const gathers = listGathers(state).filter(
      (g) => g.realmId === "player" && g.toId === provinceId
    );
    if (
      gathers.some(
        (g) => g.phase === "gathering" || g.phase === "outbound" || !g.phase
      )
    ) {
      return true;
    }
  }

  const marches = listMarches(state);
  return marches.some(
    (m) => m.realmId === "player" && (m as any).purpose === "gather" && m.toId === provinceId
  );
}

/**
 * Paints a small amber cart and sack pip on a seen province that has a
 * player gather on or heading to it on the isometric diamond.
 *
 * Visual anatomy:
 * - Soft ground/drop shadow beneath the pip (0x000000)
 * - Dark amber-chestnut roundel backing (0x211508) with warm bronze rim (0xb45309)
 * - Inner deep-ochre disk (0x45270d)
 * - Amber handcart bed (0xd97706), plump amber gather sack (0xf59e0b), tied sack crown (0xfbbf24)
 * - Spoked cart wheel rim & hub glint (0xfbbf24 & 0xfef3c7)
 * - Purely non-interactive graphics (pointer-events: none; camera math, zoom, and hit-testing untouched)
 */
export function drawGatherMark(
  g: Graphics,
  cx: number,
  cy: number,
  phase: number = 0
): void {
  if (!g) return;

  const mx = cx;
  const my = cy;
  const bob = Math.sin(phase * 3.2) * 0.2;

  // 1. Soft drop shadow beneath the gather mark
  g.ellipse(mx, my + 1.8, 5.4, 3.1);
  g.fill({ color: 0x000000, alpha: 0.40 });

  // 2. Dark amber-chestnut roundel backing + warm bronze rim
  g.circle(mx, my, 4.8);
  g.fill({ color: 0x211508, alpha: 0.90 });
  g.circle(mx, my, 4.8);
  g.stroke({ width: 0.85, color: 0xb45309, alpha: 0.94 });

  // 3. Inner deep-ochre disk
  g.circle(mx, my, 3.8);
  g.fill({ color: 0x45270d, alpha: 0.92 });

  // 4. Amber handcart bed & shafts (#d97706)
  g.poly([
    mx - 2.6, my + 0.4 + bob,
    mx + 1.8, my + 0.4 + bob,
    mx + 1.3, my + 1.7 + bob,
    mx - 2.2, my + 1.7 + bob,
  ]);
  g.fill({ color: 0xd97706 });

  // 5. Plump amber gather sack resting in the cart (#f59e0b) & tied sack crown (#fbbf24)
  g.poly([
    mx - 1.9, my + 0.5 + bob,
    mx - 2.1, my - 1.1 + bob,
    mx - 0.8, my - 2.0 + bob,
    mx + 0.8, my - 1.9 + bob,
    mx + 1.4, my - 0.8 + bob,
    mx + 1.1, my + 0.5 + bob,
  ]);
  g.fill({ color: 0xf59e0b });

  g.poly([
    mx - 0.9, my - 2.6 + bob,
    mx + 0.7, my - 2.6 + bob,
    mx + 0.4, my - 1.8 + bob,
    mx - 0.6, my - 1.8 + bob,
  ]);
  g.fill({ color: 0xfbbf24 });

  // 6. Cart wheel rim & bright hub pip (#fbbf24 & #fef3c7)
  g.circle(mx - 0.4, my + 1.9, 1.15);
  g.stroke({ width: 0.75, color: 0xfbbf24, alpha: 0.95 });
  g.circle(mx - 0.4, my + 1.9, 0.5);
  g.fill({ color: 0xfef3c7 });
}

// -------------------------------------------------------------
// Rival Realm Owner Mark on Isometric Diamond (drawOwnerMark)
// -------------------------------------------------------------

/**
 * Resolves whether a seen province on the board is owned by a rival realm.
 * Uses only existing province ownership and visibility data the board already reads
 * (isProvinceSeen, p.occupantRealmId).
 * Unseen tiles always return null (stay fog), unowned tiles return null,
 * and player-owned tiles return null (player-owned tiles get no mark).
 * Returns the rival realmId string (e.g. "rival", "k_silk", etc.) if owned by a rival.
 */
export function resolveProvinceOwnerMark(
  state: GameState | null | undefined,
  provinceId: string | null | undefined
): string | null {
  if (!state?.board?.provinces || !provinceId) return null;
  if (!isProvinceSeen(state, provinceId)) return null;

  const p = state.board.provinces.find((pr) => pr.id === provinceId);
  if (!p || !p.occupantRealmId) return null;
  if (p.occupantRealmId === "player" || p.occupantRealmId === "none") return null;

  return p.occupantRealmId;
}

/**
 * Returns true if the province is seen and owned by a rival realm.
 */
export function hasProvinceOwner(
  state: GameState | null | undefined,
  provinceId: string | null | undefined
): boolean {
  return resolveProvinceOwnerMark(state, provinceId) !== null;
}

/**
 * Paints a small realm crest or banner pip on a seen province that is owned by a rival realm.
 * Player-owned tiles get no mark.
 *
 * Visual anatomy:
 * - Soft ground/drop shadow beneath the pip (0x000000)
 * - Dark iron-slate roundel backing (0x141419) with realm border rim (pal.borderColor)
 * - Inner disk tinted with pal.rimColor (alpha: 0.25)
 * - Vertical flagpole / spear staff in pal.studColor
 * - Fluttering realm pennant / banner in pal.pennantColor
 * - Crest finial pip at top of staff in pal.accentColor
 * - Purely non-interactive graphics (pointer-events: none; camera math, zoom, and hit-testing untouched)
 */
export function drawOwnerMark(
  g: Graphics,
  cx: number,
  cy: number,
  realmIdOrPal?: string | RealmTokenPalette,
  phase: number = 0
): void {
  if (!g) return;

  const pal: RealmTokenPalette =
    typeof realmIdOrPal === "object" && realmIdOrPal !== null
      ? realmIdOrPal
      : realmTokenPalette(typeof realmIdOrPal === "string" ? realmIdOrPal : "rival");

  const mx = cx;
  const my = cy;
  const flutter = Math.sin(phase * 3.5) * 0.3;

  // 1. Soft drop shadow beneath the owner mark
  g.ellipse(mx, my + 1.8, 5.4, 3.1);
  g.fill({ color: 0x000000, alpha: 0.40 });

  // 2. Dark iron-slate roundel backing + realm border rim
  g.circle(mx, my, 4.8);
  g.fill({ color: 0x141419, alpha: 0.90 });
  g.circle(mx, my, 4.8);
  g.stroke({ width: 0.85, color: pal.borderColor, alpha: 0.94 });

  // 3. Inner disk tinted with realm rim color
  g.circle(mx, my, 3.8);
  g.fill({ color: pal.rimColor, alpha: 0.25 });

  // 4. Vertical flagpole / spear staff (pal.studColor)
  g.poly([
    mx - 2.2, my - 2.5,
    mx - 1.4, my - 2.5,
    mx - 1.4, my + 2.5,
    mx - 2.2, my + 2.5,
  ]);
  g.fill({ color: pal.studColor });

  // 5. Fluttering realm pennant / swallowtail banner (pal.pennantColor)
  g.poly([
    mx - 1.4, my - 2.3,
    mx + 2.4, my - 2.0 + flutter,
    mx + 1.4, my - 0.7 + flutter * 0.5,
    mx + 2.4, my + 0.5,
    mx - 1.4, my + 0.3,
  ]);
  g.fill({ color: pal.pennantColor });

  // 6. Finial crest pip atop the flagpole (pal.accentColor)
  g.circle(mx - 1.8, my - 2.8, 0.9);
  g.fill({ color: pal.accentColor });
}

// -------------------------------------------------------------
// Player Hold Crown Pip on Isometric Diamond (drawHoldMark)
// -------------------------------------------------------------

/**
 * Resolves whether a seen province on the board is part of the player's hold
 * (either the player's home province or has a player building on it).
 * Uses only existing hold, building, and visibility data the board already reads
 * (isProvinceSeen, state.board.homeProvinceId, state.buildings).
 * Unseen tiles always return false (stay fog).
 */
export function hasProvinceHold(
  state: GameState | null | undefined,
  provinceId: string | null | undefined
): boolean {
  if (!state?.board?.provinces || !provinceId) return false;
  if (!isProvinceSeen(state, provinceId)) return false;

  // 1. Home province is the player's hold
  if (state.board.homeProvinceId && provinceId === state.board.homeProvinceId) {
    return true;
  }

  // 2. Any province that has a player building on it
  if (Array.isArray(state.buildings)) {
    const hasBuilding = state.buildings.some(
      (b) =>
        (b.realmId === "player" || !b.realmId) &&
        ((b as any).provinceId === provinceId || (b as any).toId === provinceId)
    );
    if (hasBuilding) return true;
  }

  return false;
}

/**
 * Paints a small gold crown or banner pip on a seen province that is part of the player's hold
 * (player's home or has a player building on it).
 *
 * Visual anatomy:
 * - Soft ground/drop shadow beneath the crown pip (0x000000)
 * - Dark imperial gold roundel backing (0x251a06) with warm amber rim (0xd97706)
 * - Inner deep-bronze disk (0x422d08)
 * - Golden crown base band (0xf59e0b)
 * - Three-pointed gold crown peaks (0xfbbf24)
 * - Crown jewels / finial pips on the 3 peaks (0xfef08a)
 * - Center crown band jewel (0xef4444 ruby glint)
 * - Purely non-interactive graphics (pointer-events: none; camera math, zoom, and hit-testing untouched)
 */
export function drawHoldMark(
  g: Graphics,
  cx: number,
  cy: number,
  phase: number = 0
): void {
  if (!g) return;

  const mx = cx;
  const my = cy;
  const bob = Math.sin(phase * 2.8) * 0.2;

  // 1. Soft drop shadow beneath the hold mark
  g.ellipse(mx, my + 1.8, 5.4, 3.1);
  g.fill({ color: 0x000000, alpha: 0.40 });

  // 2. Dark imperial gold roundel backing + warm amber rim
  g.circle(mx, my, 4.8);
  g.fill({ color: 0x251a06, alpha: 0.90 });
  g.circle(mx, my, 4.8);
  g.stroke({ width: 0.85, color: 0xd97706, alpha: 0.94 });

  // 3. Inner deep-bronze disk
  g.circle(mx, my, 3.8);
  g.fill({ color: 0x422d08, alpha: 0.92 });

  // 4. Gold crown headband / base band (0xf59e0b)
  g.poly([
    mx - 2.5, my + 0.8 + bob,
    mx + 2.5, my + 0.8 + bob,
    mx + 2.1, my + 1.8 + bob,
    mx - 2.1, my + 1.8 + bob,
  ]);
  g.fill({ color: 0xf59e0b });

  // 5. Three-pointed gold crown peaks (0xfbbf24)
  // Left spike
  g.poly([
    mx - 2.4, my + 0.8 + bob,
    mx - 1.2, my + 0.8 + bob,
    mx - 1.9, my - 1.4 + bob,
  ]);
  g.fill({ color: 0xfbbf24 });

  // Center spike (taller)
  g.poly([
    mx - 0.8, my + 0.8 + bob,
    mx + 0.8, my + 0.8 + bob,
    mx, my - 2.2 + bob,
  ]);
  g.fill({ color: 0xfbbf24 });

  // Right spike
  g.poly([
    mx + 1.2, my + 0.8 + bob,
    mx + 2.4, my + 0.8 + bob,
    mx + 1.9, my - 1.4 + bob,
  ]);
  g.fill({ color: 0xfbbf24 });

  // 6. Crown finial pips on the 3 peaks (0xfef08a)
  g.circle(mx, my - 2.3 + bob, 0.75);
  g.fill({ color: 0xfef08a });
  g.circle(mx - 1.9, my - 1.5 + bob, 0.6);
  g.fill({ color: 0xfef08a });
  g.circle(mx + 1.9, my - 1.5 + bob, 0.6);
  g.fill({ color: 0xfef08a });

  // 7. Center crown ruby glint on headband (0xef4444)
  g.circle(mx, my + 1.3 + bob, 0.5);
  g.fill({ color: 0xef4444 });
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

/**
 * Draws coastal water, shallow sea shelf, wave surf, and wet sand edge
 * on an isometric shore terrain diamond tile.
 *
 * Distinct features:
 * - Deep ocean basin (northwest sea) in rich oceanic blue with surface ripples
 * - Luminous shallow sea shelf with sunlit underwater caustics
 * - Wet sand edge with damp watermark saturation and glossy sheen
 * - Dry golden sand beach margin (southeast)
 * - Animated small cresting wave with curled breaker lip and frothing surf bubbles
 */
export function drawShoreTile(
  g: Graphics,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  phase: number = 0,
  options?: { px?: number; py?: number }
): void {
  const px = options?.px ?? 0;
  const py = options?.py ?? 0;

  // Coastline control vertices crossing the diamond from SW to NE
  const cSwX = cx - hw * 0.42;
  const cSwY = cy + hh * 0.58;
  const cMid1X = cx - 3;
  const cMid1Y = cy + 2.2;
  const cMid2X = cx + 2.5;
  const cMid2Y = cy - 0.8;
  const cNeX = cx + hw * 0.52;
  const cNeY = cy - hh * 0.48;

  // 1. Dry Golden Sand Beach (Southeast landmass)
  g.poly([
    cSwX, cSwY,
    cMid1X, cMid1Y,
    cMid2X, cMid2Y,
    cNeX, cNeY,
    cx + hw, cy,
    cx, cy + hh,
  ]);
  g.fill({ color: 0xd4a359 });

  // Warm beach sand shading along South vertex
  g.poly([
    cx - hw * 0.15, cy + hh * 0.85,
    cx + hw * 0.35, cy + hh * 0.65,
    cx + hw, cy,
    cx, cy + hh,
  ]);
  g.fill({ color: 0xca8a04, alpha: 0.45 });

  // Beach sand granules and dried sea shell specks
  g.circle(cx + 6, cy + 3.5, 0.75); g.fill({ color: 0xfde047, alpha: 0.85 });
  g.circle(cx + 10, cy + 1.2, 0.65); g.fill({ color: 0xb45309, alpha: 0.75 });
  g.circle(cx + 1.5, cy + 5.2, 0.7); g.fill({ color: 0xfde047, alpha: 0.8 });
  g.circle(cx + 4.5, cy + 5.8, 0.6); g.fill({ color: 0x78350f, alpha: 0.65 });
  g.circle(cx + 8, cy + 2.5, 0.55); g.fill({ color: 0xfef08a, alpha: 0.9 });

  // 2. Wet Sand Edge (Saturated damp sand margin with glossy tidal sheen)
  // Saturated dark wet sand band along the receding waterline
  g.moveTo(cSwX, cSwY);
  g.bezierCurveTo(cMid1X, cMid1Y, cMid2X, cMid2Y, cNeX, cNeY);
  g.stroke({ width: 3.2, color: 0x92400e, alpha: 0.92 });

  // Second layer of wet amber sand
  g.moveTo(cSwX, cSwY);
  g.bezierCurveTo(cMid1X, cMid1Y, cMid2X, cMid2Y, cNeX, cNeY);
  g.stroke({ width: 1.8, color: 0xa16207, alpha: 0.85 });

  // Glossy wet watermark sheen catching ambient light
  g.moveTo(cSwX + 0.5, cSwY + 0.3);
  g.bezierCurveTo(cMid1X + 0.5, cMid1Y + 0.3, cMid2X + 0.5, cMid2Y + 0.3, cNeX + 0.5, cNeY + 0.3);
  g.stroke({ width: 0.9, color: 0xd97706, alpha: 0.95 });
  g.moveTo(cSwX + 0.3, cSwY + 0.2);
  g.bezierCurveTo(cMid1X + 0.3, cMid1Y + 0.2, cMid2X + 0.3, cMid2Y + 0.2, cNeX + 0.3, cNeY + 0.2);
  g.stroke({ width: 0.5, color: 0xfef08a, alpha: 0.65 });

  // 3. Water on the Diamond: Deep Ocean Shelf (Northwest sea)
  // Deep oceanic basin
  g.poly([
    cx - hw, cy,
    cx, cy - hh,
    cx + hw * 0.18, cy - hh * 0.82,
    cx - 4, cy - 3.5,
    cx - hw * 0.72, cy + hh * 0.28,
  ]);
  g.fill({ color: 0x0284c7 });

  // Deep oceanic undertone
  g.poly([
    cx - hw, cy,
    cx, cy - hh,
    cx - hw * 0.25, cy - hh * 0.5,
    cx - hw * 0.85, cy - hh * 0.1,
  ]);
  g.fill({ color: 0x0369a1 });

  // Deep water swell ripple lines
  g.moveTo(cx - 11, cy - 2.5);
  g.lineTo(cx - 5, cy - 5.5);
  g.stroke({ width: 1.0, color: 0x0ea5e9, alpha: 0.65 });

  g.moveTo(cx - 8, cy - 1);
  g.lineTo(cx - 2, cy - 4);
  g.stroke({ width: 0.8, color: 0x38bdf8, alpha: 0.55 });

  // 4. Shallow Sea Shelf (Submerged coastal reef / shallows)
  // Coastal turquoise / cyan shelf between deep water and wet sand edge
  g.poly([
    cx - hw * 0.72, cy + hh * 0.28,
    cx - 4, cy - 3.5,
    cx + hw * 0.18, cy - hh * 0.82,
    cNeX, cNeY,
    cMid2X, cMid2Y,
    cMid1X, cMid1Y,
    cSwX, cSwY,
  ]);
  g.fill({ color: 0x06b6d4 });

  // Luminous turquoise shelf upper layer
  g.poly([
    cx - hw * 0.58, cy + hh * 0.38,
    cx - 2, cy - 2,
    cx + hw * 0.32, cy - hh * 0.68,
    cNeX, cNeY,
    cMid2X, cMid2Y,
    cMid1X, cMid1Y,
    cSwX, cSwY,
  ]);
  g.fill({ color: 0x22d3ee, alpha: 0.82 });

  // Sunlit caustic streaks on the shallow seabed
  g.moveTo(cx - 8, cy + 1);
  g.bezierCurveTo(cx - 5, cy - 1, cx - 2, cy + 1.5, cx + 1, cy - 1.5);
  g.stroke({ width: 0.9, color: 0xa5f3fc, alpha: 0.85 });

  g.moveTo(cx - 4, cy + 2);
  g.bezierCurveTo(cx - 1, cy + 0.2, cx + 2, cy + 1, cx + 5, cy - 0.5);
  g.stroke({ width: 0.8, color: 0x67e8f9, alpha: 0.8 });

  g.circle(cx - 3, cy - 0.5, 0.75); g.fill({ color: 0xe0f2fe, alpha: 0.85 });
  g.circle(cx + 3, cy - 1.5, 0.7); g.fill({ color: 0xa5f3fc, alpha: 0.85 });

  // 5. Small Wave (Curled wave swell, pure white breaker crest, and frothing surf)
  const waveCycle = phase * 2.5 + px * 0.85 + py * 0.45;
  const waveSurge = Math.sin(waveCycle) * 1.4;
  const waveLift = Math.cos(waveCycle) * 0.45;

  // Wave swell body (curling azure water)
  g.moveTo(cSwX + 1.2 + waveSurge * 0.7, cSwY - 0.8 - waveLift);
  g.bezierCurveTo(
    cMid1X + waveSurge * 0.9, cMid1Y - 1.2 - waveLift,
    cMid2X + waveSurge * 0.9, cMid2Y - 1.2 - waveLift,
    cNeX - 0.8 + waveSurge * 0.7, cNeY + 1.0 - waveLift
  );
  g.stroke({ width: 2.2, color: 0x0284c7, alpha: 0.88 });

  // Crisp white breaker crest along wave front
  g.moveTo(cSwX + 1.5 + waveSurge * 0.8, cSwY - 0.6 - waveLift);
  g.bezierCurveTo(
    cMid1X + 0.2 + waveSurge, cMid1Y - 1.0 - waveLift,
    cMid2X + 0.2 + waveSurge, cMid2Y - 1.0 - waveLift,
    cNeX - 0.5 + waveSurge * 0.8, cNeY + 1.2 - waveLift
  );
  g.stroke({ width: 1.6, color: 0xffffff, alpha: 0.98 });

  // Trailing wash ripple
  g.moveTo(cSwX - 1.5 + waveSurge * 0.4, cSwY - 2.5);
  g.bezierCurveTo(
    cMid1X - 2.0 + waveSurge * 0.5, cMid1Y - 3.0,
    cMid2X - 2.0 + waveSurge * 0.5, cMid2Y - 3.0,
    cNeX - 3.0 + waveSurge * 0.4, cNeY - 1.0
  );
  g.stroke({ width: 0.8, color: 0x7dd3fc, alpha: 0.65 });

  // Frothing surf foam bubbles washing along wave front & wet sand edge
  const foamSpots = [
    { ox: -6, oy: 2.2, r: 1.1 },
    { ox: -3.5, oy: 3.2, r: 0.9 },
    { ox: -1.0, oy: 1.2, r: 1.2 },
    { ox: 1.8, oy: -0.2, r: 1.0 },
    { ox: 4.5, oy: -1.5, r: 0.85 },
    { ox: 6.5, oy: -2.8, r: 0.75 },
    { ox: -4.5, oy: 1.0, r: 0.85 },
    { ox: 3.2, oy: 1.0, r: 0.9 },
  ];
  for (const f of foamSpots) {
    const fx = cx + f.ox + Math.sin(waveCycle + f.ox) * 0.7;
    const fy = cy + f.oy + Math.cos(waveCycle + f.oy) * 0.35;
    g.circle(fx, fy, f.r);
    g.fill({ color: 0xf0fdfa, alpha: 0.95 });
    g.circle(fx - 0.2, fy - 0.2, f.r * 0.5);
    g.fill({ color: 0xffffff, alpha: 0.9 });
  }
}

/**
 * Draws trees on an isometric wood terrain diamond tile:
 * - Forest floor woodland duff & needle bed across the diamond plateau
 * - Ground shadows (soft contact ellipses cast southeast under each pine tree)
 * - Timber trunks with dark bark shading, sunlit bark highlights, and root flare
 * - Small stand of evergreen pines (depth-sorted rear-to-front) with multi-tiered boughs
 * - Sunlit needle crest highlights along the apex of pine foliage
 * - Forest undergrowth tufts (ferns, seedlings, fallen pinecones)
 */
export function drawWoodTile(
  g: Graphics,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  phase: number = 0,
  options?: { px?: number; py?: number }
): void {
  // 1. Forest floor woodland duff & needle bed
  g.ellipse(cx, cy + 0.5, hw * 0.72, hh * 0.56);
  g.fill({ color: 0x14532d, alpha: 0.28 });
  g.ellipse(cx + 0.8, cy + 0.8, hw * 0.50, hh * 0.38);
  g.fill({ color: 0x064e3b, alpha: 0.22 });

  // 2. Small stand of evergreen pines across the diamond plateau
  // Arranged in depth order (back-to-front by ty)
  const trees = [
    { tx: cx + 7.5, ty: cy - 3.2, s: 0.80, dark: true },
    { tx: cx - 8.5, ty: cy - 2.8, s: 0.85, dark: true },
    { tx: cx + 0.5, ty: cy - 0.5, s: 1.15, dark: false },
    { tx: cx + 6.0, ty: cy + 2.5, s: 0.95, dark: false },
    { tx: cx - 5.5, ty: cy + 3.2, s: 1.00, dark: false },
  ];

  // Render ground contact shadows for each pine tree
  for (const tr of trees) {
    const s = tr.s;
    const x = tr.tx;
    const y = tr.ty;

    // Outer soft contact ground shadow (cast southeast onto forest floor)
    g.ellipse(x + 1.2 * s, y + 2.6 * s, 5.2 * s, 2.2 * s);
    g.fill({ color: 0x000000, alpha: 0.36 });

    // Inner contact shadow under trunk base
    g.ellipse(x + 0.4 * s, y + 2.2 * s, 2.6 * s, 1.2 * s);
    g.fill({ color: 0x0a1c13, alpha: 0.65 });
  }

  // Render each pine tree (trunk + tiered foliage + sunlit crests)
  for (const tr of trees) {
    const s = tr.s;
    const x = tr.tx;
    const y = tr.ty;

    // Timber trunk
    // Dark timber bark
    g.rect(x - 1.1 * s, y - 1.8 * s, 2.2 * s, 4.4 * s);
    g.fill({ color: 0x451a03 });

    // Sunlit bark highlight (western light facet)
    g.rect(x - 1.1 * s, y - 1.8 * s, 0.9 * s, 4.4 * s);
    g.fill({ color: 0x5c3818 });

    // Root flare grounded into forest soil
    g.poly([
      x - 1.8 * s, y + 2.6 * s,
      x - 1.1 * s, y + 1.0 * s,
      x + 1.1 * s, y + 1.0 * s,
      x + 1.8 * s, y + 2.6 * s,
    ]);
    g.fill({ color: 0x271101 });

    // Conical evergreen foliage boughs (3 tiers)
    const leafDark = tr.dark ? 0x064e3b : 0x14532d;
    const leafMid = tr.dark ? 0x047857 : 0x16a34a;
    const leafLight = tr.dark ? 0x10b981 : 0x22c55e;

    // Tier 1 (Lowest broad skirt)
    g.poly([x - 5.6 * s, y + 0.6 * s, x, y - 4.8 * s, x + 5.6 * s, y + 0.6 * s]);
    g.fill({ color: leafDark });
    g.poly([x - 5.6 * s, y + 0.6 * s, x, y - 4.8 * s, x, y + 0.6 * s]);
    g.fill({ color: tr.dark ? 0x0f5132 : 0x15803d, alpha: 0.55 });

    // Tier 2 (Middle bough skirt)
    g.poly([x - 4.6 * s, y - 2.8 * s, x, y - 8.2 * s, x + 4.6 * s, y - 2.8 * s]);
    g.fill({ color: leafMid });
    g.poly([x - 4.6 * s, y - 2.8 * s, x, y - 8.2 * s, x, y - 2.8 * s]);
    g.fill({ color: tr.dark ? 0x16a34a : 0x22c55e, alpha: 0.5 });

    // Tier 3 (Crown bough spire)
    g.poly([x - 3.2 * s, y - 6.2 * s, x, y - 11.8 * s, x + 3.2 * s, y - 6.2 * s]);
    g.fill({ color: leafLight });

    // Sunlit needle crest along spire ridge
    g.moveTo(x - 2.2 * s, y - 6.2 * s);
    g.lineTo(x, y - 11.8 * s);
    g.stroke({ width: 0.9 * s, color: 0x34d399, alpha: 0.85 });
  }

  // 3. Forest undergrowth tufts (ferns, seedlings)
  const undergrowth = [
    { ux: cx - 10.5, uy: cy + 0.8 },
    { ux: cx + 11.0, uy: cy - 0.5 },
    { ux: cx - 1.5, uy: cy + 5.0 },
    { ux: cx + 4.0, uy: cy + 5.2 },
  ];
  for (const u of undergrowth) {
    g.moveTo(u.ux, u.uy + 1.5);
    g.lineTo(u.ux - 1.8, u.uy - 1.5);
    g.moveTo(u.ux, u.uy + 1.5);
    g.lineTo(u.ux, u.uy - 2.2);
    g.moveTo(u.ux, u.uy + 1.5);
    g.lineTo(u.ux + 1.8, u.uy - 1.5);
    g.stroke({ width: 0.8, color: 0x16a34a, alpha: 0.85 });
  }

  // Fallen pinecones and needle litter specks
  g.circle(cx - 3.5, cy + 1.2, 0.7);
  g.fill({ color: 0x78350f, alpha: 0.75 });
  g.circle(cx + 3.8, cy + 0.8, 0.6);
  g.fill({ color: 0x78350f, alpha: 0.7 });
  g.circle(cx - 7.0, cy + 3.5, 0.65);
  g.fill({ color: 0x451a03, alpha: 0.65 });
}

/**
 * Draws an alpine mountain on an isometric peak terrain diamond tile:
 * - Rock shadow: soft contact shadow (0x000000, alpha 0.38) and dense base shadow (0x0f172a) cast southeast across the diamond
 * - Mountain base scree & boulder talus debris (0x475569, 0x334155, 0x64748b)
 * - Tall peak: towering monarch summit crag (cy - 15), shadowed eastern slopes (0x1e293b, 0x0f172a), sunlit western slopes (0x475569, 0x64748b), and sharp central arête ridge (0x334155, 0x94a3b8)
 * - Snow cap: permanent monarch glacier snowcap (0xffffff / 0xe2e8f0) with couloir drifts, and western & eastern sub-peak horn snowcaps (0xffffff, 0xf1f5f9)
 */
export function drawPeakTile(
  g: Graphics,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  phase: number = 0,
  options?: { px?: number; py?: number }
): void {
  // 1. Rock Shadow cast onto the diamond plateau
  // Soft elliptical contact rock shadow cast southeast across the diorama floor
  g.ellipse(cx + 2.5, cy + 3.2, 10.5, 4.2);
  g.fill({ color: 0x000000, alpha: 0.38 });

  // Dense contact shadow along the base of the eastern and southern rock walls
  g.poly([
    cx - 2, cy + 3.5,
    cx + 8, cy + 4.5,
    cx + hw - 1, cy + 1,
    cx + 11, cy - 1,
    cx, cy + 4,
  ]);
  g.fill({ color: 0x0f172a, alpha: 0.55 });

  // Scree and boulder talus skirting the mountain base
  g.rect(cx - 7, cy + 3.8, 2.2, 1.4);
  g.fill({ color: 0x475569 });
  g.rect(cx + 5, cy + 3.5, 2.0, 1.2);
  g.fill({ color: 0x334155 });
  g.circle(cx - 3, cy + 4.5, 0.7);
  g.fill({ color: 0x64748b });
  g.circle(cx + 2, cy + 4.2, 0.65);
  g.fill({ color: 0x475569 });

  // 2. A Tall Peak: Towering alpine mountain massif
  // Shadowed eastern slopes (deep navy/slate rock)
  g.poly([
    cx, cy - 15,
    cx + 11, cy - 1,
    cx + 13, cy - 7,
    cx + hw - 2, cy + 0.5,
    cx, cy + 4,
  ]);
  g.fill({ color: 0x1e293b });

  // Secondary eastern shadow facet / gully
  g.poly([
    cx, cy - 15,
    cx + 5, cy - 5,
    cx + 7, cy + 1,
    cx, cy + 4,
  ]);
  g.fill({ color: 0x0f172a, alpha: 0.6 });

  // Illuminated western slopes (sunlit slate rock)
  g.poly([
    cx - hw + 2, cy,
    cx - 12, cy - 5,
    cx - 7, cy + 1,
    cx, cy - 15,
    cx, cy + 4,
  ]);
  g.fill({ color: 0x475569 });

  // Sunlit western buttress / crag highlight facet
  g.poly([
    cx - 6, cy - 8,
    cx, cy - 15,
    cx - 1, cy - 4,
    cx - 7, cy + 1,
  ]);
  g.fill({ color: 0x64748b, alpha: 0.85 });

  // Central arête ridge line from towering monarch summit to base
  g.moveTo(cx, cy - 15);
  g.lineTo(cx, cy + 4);
  g.stroke({ width: 1.4, color: 0x334155, alpha: 0.95 });

  // High-contrast sun edge along arête ridge
  g.moveTo(cx - 0.5, cy - 15);
  g.lineTo(cx - 0.5, cy + 4);
  g.stroke({ width: 0.7, color: 0x94a3b8, alpha: 0.7 });

  // 3. A Snow Cap: Alpine glacier snowcaps & high couloirs
  // Monarch summit snowcap (sunlit western flank)
  g.poly([
    cx - 4.5, cy - 8.5,
    cx, cy - 15,
    cx, cy - 6,
    cx - 2, cy - 5,
  ]);
  g.fill({ color: 0xffffff });

  // Monarch summit snowcap (shadowed eastern flank)
  g.poly([
    cx, cy - 15,
    cx + 4.5, cy - 8.5,
    cx + 2, cy - 5,
    cx, cy - 6,
  ]);
  g.fill({ color: 0xe2e8f0 });

  // Glacier couloir snow tongues spilling down mountain crevices
  g.moveTo(cx, cy - 6);
  g.lineTo(cx - 0.5, cy - 2);
  g.stroke({ width: 1.0, color: 0xffffff, alpha: 0.9 });

  g.moveTo(cx + 1, cy - 5);
  g.lineTo(cx + 2.5, cy - 1);
  g.stroke({ width: 0.8, color: 0xcbd5e1, alpha: 0.85 });

  // Western horn sub-peak snowcap
  g.poly([
    cx - 14, cy - 2,
    cx - 12, cy - 6,
    cx - 9, cy - 2,
    cx - 11, cy - 1,
  ]);
  g.fill({ color: 0xffffff });

  // Eastern horn sub-peak snowcap
  g.poly([
    cx + 10, cy - 4,
    cx + 13, cy - 8,
    cx + 15, cy - 3,
    cx + 13, cy - 2,
  ]);
  g.fill({ color: 0xf1f5f9 });

  // Alpine snow dusting on high crags
  g.circle(cx - 6, cy - 2, 0.7);
  g.fill({ color: 0xffffff, alpha: 0.85 });
  g.circle(cx + 7, cy - 2.5, 0.65);
  g.fill({ color: 0xe2e8f0, alpha: 0.85 });
}

/**
 * Paints a low stepped plateau on an isometric hill terrain diamond tile:
 * - Soft shadow: soft elliptical contact shadow (0x000000, alpha 0.34) cast southeast across the diamond floor, plus warm dark earth base shadow (0x292524, alpha 0.45)
 * - Three stepped tiers of warm ochre and stone:
 *   - Tier 1 (broad lower terrace): sunlit warm stone left riser (0x78716c), shadowed stone right riser (0x44403c), warm ochre terrace plateau (0xb45309, 0x92400e), and contour rim (0xa8a29e)
 *   - Tier 2 (middle stepped rise): soft step shadow (0x000000, alpha 0.22), sunlit stone left riser (0xa8a29e), shaded stone right riser (0x57534e), golden-ochre terrace plateau (0xd97706), and contour rim (0xd6d3d1)
 *   - Tier 3 (upper crown plateau): soft step shadow (0x000000, alpha 0.20), sunlit limestone left riser (0xd6d3d1), stone right riser (0x78716c), sunlit warm ochre crown tableland (0xca8a04, 0xf59e0b), and bright rim edge (0xe7e5e4)
 * - Weathered stone outcrops and ochre scree along the terrace ledges (0x78716c, 0x57534e, 0x92400e)
 * - No keep, no flag, no tent.
 */
export function drawHillRise(
  g: Graphics,
  cx: number,
  cy: number,
  hw: number = BOARD_HALF_W,
  hh: number = BOARD_HALF_H,
  phase: number = 0,
  options?: { px?: number; py?: number }
): void {
  // 1. Soft Shadow cast onto the diamond plateau
  // Soft elliptical contact shadow cast southeast across the hill floor
  g.ellipse(cx + 2.0, cy + 2.6, 11.2, 4.6);
  g.fill({ color: 0x000000, alpha: 0.34 });

  // Warm dark earth contact shadow along the southern and eastern base of the rise
  g.ellipse(cx + 1.2, cy + 2.0, 9.6, 3.8);
  g.fill({ color: 0x292524, alpha: 0.45 });

  // 2. Tier 1: Broad Lower Stepped Terrace (Warm Ochre & Stone)
  const t1x = cx;
  const t1y = cy + 1.6;
  const w1 = Math.min(11.5, hw * 0.72);
  const h1 = Math.min(5.2, hh * 0.65);
  const r1 = 2.4;

  // Tier 1 front-left stone riser (sunlit warm stone)
  g.poly([
    t1x - w1, t1y - r1,
    t1x, t1y + h1 - r1,
    t1x, t1y + h1,
    t1x - w1, t1y,
  ]);
  g.fill({ color: 0x78716c });

  // Tier 1 front-right stone riser (shadowed stone)
  g.poly([
    t1x, t1y + h1 - r1,
    t1x + w1, t1y - r1,
    t1x + w1, t1y,
    t1x, t1y + h1,
  ]);
  g.fill({ color: 0x44403c });

  // Tier 1 flat stepped top plateau (warm deep ochre)
  g.poly([
    t1x, t1y - h1 - r1,
    t1x + w1, t1y - r1,
    t1x, t1y + h1 - r1,
    t1x - w1, t1y - r1,
  ]);
  g.fill({ color: 0xb45309 });

  // Tier 1 warm ochre rear shading & stone rim contour
  g.poly([
    t1x, t1y - h1 - r1,
    t1x + w1, t1y - r1,
    t1x, t1y - r1,
    t1x - w1 * 0.5, t1y - h1 * 0.5 - r1,
  ]);
  g.fill({ color: 0x92400e, alpha: 0.45 });

  g.moveTo(t1x - w1, t1y - r1);
  g.lineTo(t1x, t1y + h1 - r1);
  g.lineTo(t1x + w1, t1y - r1);
  g.stroke({ width: 1.0, color: 0xa8a29e, alpha: 0.85 });

  // 3. Tier 2: Middle Stepped Rise (Warm Golden Ochre & Dressed Stone)
  const t2x = cx - 0.4;
  const t2y = cy - 1.0;
  const w2 = Math.min(8.0, hw * 0.50);
  const h2 = Math.min(3.6, hh * 0.45);
  const r2 = 2.2;

  // Soft step shadow cast by Tier 2 onto Tier 1 plateau
  g.ellipse(t2x + 1.0, t2y + 0.5, w2 * 0.95, h2 * 0.88);
  g.fill({ color: 0x000000, alpha: 0.22 });

  // Tier 2 front-left stone riser (sunlit warm ashlar stone)
  g.poly([
    t2x - w2, t2y - r2,
    t2x, t2y + h2 - r2,
    t2x, t2y + h2,
    t2x - w2, t2y,
  ]);
  g.fill({ color: 0xa8a29e });

  // Tier 2 front-right stone riser (shaded weathered stone)
  g.poly([
    t2x, t2y + h2 - r2,
    t2x + w2, t2y - r2,
    t2x + w2, t2y,
    t2x, t2y + h2,
  ]);
  g.fill({ color: 0x57534e });

  // Tier 2 flat stepped top plateau (warm amber-ochre)
  g.poly([
    t2x, t2y - h2 - r2,
    t2x + w2, t2y - r2,
    t2x, t2y + h2 - r2,
    t2x - w2, t2y - r2,
  ]);
  g.fill({ color: 0xd97706 });

  // Tier 2 stone lip contour ridge
  g.moveTo(t2x - w2, t2y - r2);
  g.lineTo(t2x, t2y + h2 - r2);
  g.lineTo(t2x + w2, t2y - r2);
  g.stroke({ width: 1.1, color: 0xd6d3d1, alpha: 0.9 });

  // 4. Tier 3: Upper Crown Stepped Plateau (Sunlit Ochre & Pale Stone)
  const t3x = cx - 0.8;
  const t3y = cy - 3.4;
  const w3 = Math.min(4.6, hw * 0.29);
  const h3 = Math.min(2.1, hh * 0.26);
  const r3 = 1.8;

  // Soft step shadow cast by Tier 3 onto Tier 2 plateau
  g.ellipse(t3x + 0.7, t3y + 0.4, w3 * 0.95, h3 * 0.88);
  g.fill({ color: 0x000000, alpha: 0.20 });

  // Tier 3 front-left stone riser (sunlit pale stone)
  g.poly([
    t3x - w3, t3y - r3,
    t3x, t3y + h3 - r3,
    t3x, t3y + h3,
    t3x - w3, t3y,
  ]);
  g.fill({ color: 0xd6d3d1 });

  // Tier 3 front-right stone riser (warm stone shade)
  g.poly([
    t3x, t3y + h3 - r3,
    t3x + w3, t3y - r3,
    t3x + w3, t3y,
    t3x, t3y + h3,
  ]);
  g.fill({ color: 0x78716c });

  // Tier 3 flat crown plateau (warm sunlit ochre & golden sandstone)
  g.poly([
    t3x, t3y - h3 - r3,
    t3x + w3, t3y - r3,
    t3x, t3y + h3 - r3,
    t3x - w3, t3y - r3,
  ]);
  g.fill({ color: 0xca8a04 });

  // Sunlit western crown facet on Tier 3 plateau
  g.poly([
    t3x, t3y - h3 - r3,
    t3x, t3y + h3 - r3,
    t3x - w3, t3y - r3,
  ]);
  g.fill({ color: 0xf59e0b, alpha: 0.75 });

  // Crisp sunlit rim along the crown plateau
  g.moveTo(t3x - w3, t3y - r3);
  g.lineTo(t3x, t3y - h3 - r3);
  g.lineTo(t3x + w3, t3y - r3);
  g.stroke({ width: 0.9, color: 0xe7e5e4, alpha: 0.85 });

  // Center vertical stone prow seams on the 3 risers
  g.moveTo(t1x, t1y + h1 - r1); g.lineTo(t1x, t1y + h1);
  g.moveTo(t2x, t2y + h2 - r2); g.lineTo(t2x, t2y + h2);
  g.moveTo(t3x, t3y + h3 - r3); g.lineTo(t3x, t3y + h3);
  g.stroke({ width: 0.8, color: 0x292524, alpha: 0.65 });

  // 5. Weathered Stone Outcrops & Ochre Scree along the Stepped Ledges
  g.rect(cx - 7.5, cy + 0.5, 2.4, 1.4);
  g.fill({ color: 0x78716c });
  g.rect(cx + 4.5, cy + 0.2, 2.6, 1.5);
  g.fill({ color: 0x57534e });
  g.circle(cx - 3.2, cy + 2.8, 0.7);
  g.fill({ color: 0xd97706 });
  g.circle(cx + 2.8, cy + 2.4, 0.65);
  g.fill({ color: 0x92400e });
}

export const drawHillTile = drawHillRise;

/**
 * Paints a low scorched basalt crag on an isometric waste terrain diamond tile:
 * - Soft contact shadow (0x000000, alpha 0.36) and scorched ash caldera bed (0x140e0a, 0x1c1917)
 * - Cracked ash crust plates and grey ash drifts (0x44403c, 0x57534e, 0x78716c, 0xa8a29e)
 * - Dark basalt low scorched rise: stepped lower basalt shelf (0x27272a, 0x18181b, 0x292524) and jagged angular basalt crag outcrops (0x3f3f46, 0x52525b, 0x18181b, 0x09090b, rim 0x71717a)
 * - Faint heat glow: pulsing subterranean ember aura and branching magma/heat fissures (0x7f1d1d, 0x991b1b, 0xea580c, 0xf97316, 0xef4444, 0xfdba74, 0xfef08a)
 * - No keep, no flag, no tent.
 */
export function drawWasteCrag(
  g: Graphics,
  cx: number,
  cy: number,
  hw: number = BOARD_HALF_W,
  hh: number = BOARD_HALF_H,
  phase: number = 0,
  options?: { px?: number; py?: number }
): void {
  const px = options?.px ?? 0;
  const py = options?.py ?? 0;
  const pulse = Math.sin(phase * 3 + px + py) * 0.18 + 0.82;

  // 1. Soft Contact Shadow & Scorched Cracked Ash Bed
  g.ellipse(cx + 1.8, cy + 2.4, 11.4, 4.8);
  g.fill({ color: 0x000000, alpha: 0.36 });

  g.ellipse(cx, cy + 0.6, 11.8, 5.6);
  g.fill({ color: 0x140e0a });

  g.ellipse(cx - 0.4, cy + 0.4, 9.6, 4.4);
  g.fill({ color: 0x1c1917, alpha: 0.9 });

  // Cracked ash plates around the scorched perimeter
  g.poly([
    cx - 11.5, cy + 0.5,
    cx - 6.5, cy - 2.2,
    cx - 3.5, cy - 0.5,
    cx - 8.5, cy + 2.4,
  ]);
  g.fill({ color: 0x44403c, alpha: 0.75 });

  g.poly([
    cx + 4.0, cy + 1.2,
    cx + 9.5, cy - 1.2,
    cx + 11.2, cy + 0.8,
    cx + 5.8, cy + 3.2,
  ]);
  g.fill({ color: 0x57534e, alpha: 0.65 });

  // Cracked ash fracture lines across the outer ash crust
  g.moveTo(cx - 12.5, cy - 0.5);
  g.lineTo(cx - 7.5, cy + 1.2);
  g.lineTo(cx - 4.0, cy + 3.8);
  g.moveTo(cx + 5.5, cy - 3.2);
  g.lineTo(cx + 9.0, cy - 1.0);
  g.lineTo(cx + 12.0, cy + 0.5);
  g.stroke({ width: 0.8, color: 0x78716c, alpha: 0.6 });

  // 2. Faint Subterranean Heat Glow Aura at the Crag Cleft
  g.ellipse(cx + 0.4, cy - 0.2, 7.2, 3.2);
  g.fill({ color: 0x7f1d1d, alpha: 0.28 * pulse });

  // 3. Low Scorched Basalt Rise — Lower Basalt Shelf (Tier 1)
  const b1x = cx;
  const b1y = cy + 1.4;
  const w1 = Math.min(10.5, hw * 0.66);
  const h1 = Math.min(4.6, hh * 0.58);
  const r1 = 2.2;

  // Lower shelf front-left basalt face (charcoal basalt)
  g.poly([
    b1x - w1, b1y - r1,
    b1x, b1y + h1 - r1,
    b1x, b1y + h1,
    b1x - w1, b1y,
  ]);
  g.fill({ color: 0x27272a });

  // Lower shelf front-right basalt face (deep obsidian shadow)
  g.poly([
    b1x, b1y + h1 - r1,
    b1x + w1, b1y - r1,
    b1x + w1, b1y,
    b1x, b1y + h1,
  ]);
  g.fill({ color: 0x18181b });

  // Lower shelf scorched basalt & ash top table
  g.poly([
    b1x, b1y - h1 - r1,
    b1x + w1, b1y - r1,
    b1x, b1y + h1 - r1,
    b1x - w1, b1y - r1,
  ]);
  g.fill({ color: 0x292524 });

  // Lower shelf jagged basalt rim edge
  g.moveTo(b1x - w1, b1y - r1);
  g.lineTo(b1x, b1y + h1 - r1);
  g.lineTo(b1x + w1, b1y - r1);
  g.stroke({ width: 0.9, color: 0x52525b, alpha: 0.85 });

  // 4. Faint Heat Glow Fissures Cracking Through the Ash & Basalt Shelf
  const drawHeatFissures = (w: number, col: number, a: number) => {
    g.moveTo(cx - 11.5, cy - 0.8);
    g.lineTo(cx - 4.5, cy + 0.8);
    g.lineTo(cx + 0.8, cy - 1.6);
    g.lineTo(cx + 6.8, cy + 1.4);
    g.lineTo(cx + 11.5, cy - 0.6);
    g.stroke({ width: w, color: col, alpha: a });

    g.moveTo(cx - 1.8, cy - 4.8);
    g.lineTo(cx + 0.8, cy - 1.6);
    g.lineTo(cx + 2.4, cy + 3.8);
    g.stroke({ width: w * 0.8, color: col, alpha: a });

    g.moveTo(cx - 4.5, cy + 0.8);
    g.lineTo(cx - 7.0, cy + 4.0);
    g.stroke({ width: w * 0.7, color: col, alpha: a });
  };

  drawHeatFissures(2.4, 0x991b1b, 0.55 * pulse);
  drawHeatFissures(1.3, 0xea580c, 0.72 * pulse);
  drawHeatFissures(0.6, 0xfdba74, 0.65 * pulse);

  // 5. Jagged Dark Basalt Crag Outcrops (Upper Scorched Rise)
  // Shadow underneath the upper basalt crags
  g.ellipse(cx + 0.6, cy - 1.2, 6.8, 2.8);
  g.fill({ color: 0x09090b, alpha: 0.55 });

  // Western angular basalt crag (left of thermal cleft)
  // Sunlit western basalt facet
  g.poly([
    cx - 6.8, cy - 0.8,
    cx - 5.2, cy - 5.8,
    cx - 1.4, cy - 7.2,
    cx - 1.0, cy - 1.2,
    cx - 3.8, cy + 0.4,
  ]);
  g.fill({ color: 0x3f3f46 });

  // Shadowed inner/eastern facet of western basalt crag
  g.poly([
    cx - 1.4, cy - 7.2,
    cx + 0.2, cy - 5.0,
    cx - 0.2, cy - 0.8,
    cx - 1.0, cy - 1.2,
  ]);
  g.fill({ color: 0x18181b });

  // Eastern angular basalt crag (right of thermal cleft)
  // Sunlit left facet
  g.poly([
    cx + 1.2, cy - 1.0,
    cx + 1.8, cy - 5.6,
    cx + 3.6, cy - 6.4,
    cx + 3.2, cy - 0.6,
  ]);
  g.fill({ color: 0x52525b });

  // Shadowed eastern slope of eastern basalt crag
  g.poly([
    cx + 3.6, cy - 6.4,
    cx + 7.2, cy - 1.4,
    cx + 5.6, cy + 0.6,
    cx + 3.2, cy - 0.6,
  ]);
  g.fill({ color: 0x09090b });

  // Crisp fractured basalt ridge highlights & ash dusting on crag shoulders
  g.moveTo(cx - 5.2, cy - 5.8);
  g.lineTo(cx - 1.4, cy - 7.2);
  g.lineTo(cx - 1.0, cy - 1.2);
  g.moveTo(cx + 1.8, cy - 5.6);
  g.lineTo(cx + 3.6, cy - 6.4);
  g.lineTo(cx + 3.2, cy - 0.6);
  g.stroke({ width: 0.8, color: 0x71717a, alpha: 0.85 });

  // Faint heat glow in the central cleft between the basalt crags
  g.circle(cx + 0.5, cy - 2.0, 1.8);
  g.fill({ color: 0xef4444, alpha: 0.55 * pulse });
  g.circle(cx + 0.5, cy - 2.0, 1.0);
  g.fill({ color: 0xf97316, alpha: 0.75 * pulse });
  g.circle(cx + 0.5, cy - 2.0, 0.55);
  g.fill({ color: 0xfef08a, alpha: 0.7 * pulse });

  // Basal basalt shards and pale grey ash flakes
  g.rect(cx - 8.2, cy + 0.6, 2.2, 1.3);
  g.fill({ color: 0x27272a });
  g.rect(cx + 5.8, cy + 0.4, 2.0, 1.2);
  g.fill({ color: 0x18181b });
  g.circle(cx - 3.0, cy + 2.2, 0.65);
  g.fill({ color: 0xa8a29e, alpha: 0.7 });
  g.circle(cx + 3.4, cy + 2.0, 0.6);
  g.fill({ color: 0x78716c, alpha: 0.75 });
}

export const drawWasteTile = drawWasteCrag;

/**
 * Paints a low pastoral meadow on an isometric plain terrain diamond tile:
 * - Gentle shadow: soft contact ground shadow (0x000000, alpha 0.24) cast southeast under the rolling meadow knolls, plus rich dark turf base shadow (0x14532d, alpha 0.42)
 * - Soft grass: layered pastoral meadow turf swells (0x365314, 0x3f6212, 0x4d7c0f), sunlit velvet grass crown (0x65a30d, 0x84cc16), and rolling pastoral knoll contour lines (0x4d7c0f, 0x3f6212, 0xa3e635)
 * - A few low tufts: 5 low clustered pastoral grass tufts with gentle base shadows (0x1a2e05), fanning grass blades (0x84cc16), sunlit blade tips (0xa3e635, 0xbef264), and soft meadow clover/dew specks (0xd9f99d, 0xecfccb)
 * - No keep, no flag, no tent.
 */
export function drawPlainMeadow(
  g: Graphics,
  cx: number,
  cy: number,
  hw: number = BOARD_HALF_W,
  hh: number = BOARD_HALF_H,
  phase: number = 0,
  options?: { px?: number; py?: number }
): void {
  const px = options?.px ?? 0;
  const py = options?.py ?? 0;
  const sway = Math.sin(phase * 2.2 + px + py) * 0.4;

  // 1. Gentle Shadow cast onto the diamond plateau under the rolling meadow knolls
  g.ellipse(cx + 1.4, cy + 2.2, 10.8, 4.4);
  g.fill({ color: 0x000000, alpha: 0.24 });

  g.ellipse(cx + 0.8, cy + 1.6, 9.2, 3.6);
  g.fill({ color: 0x14532d, alpha: 0.42 });

  // 2. Soft Grass — Low Pastoral Meadow Swells & Rolling Knolls
  // Broad lower pastoral turf cushion
  g.ellipse(cx, cy + 0.4, Math.min(11.6, hw * 0.72), Math.min(5.2, hh * 0.65));
  g.fill({ color: 0x365314, alpha: 0.88 });

  // Western sunlit pastoral meadow knoll
  g.ellipse(cx - 1.2, cy - 0.6, Math.min(8.8, hw * 0.55), Math.min(3.8, hh * 0.48));
  g.fill({ color: 0x3f6212, alpha: 0.90 });

  // Eastern gentle pasture hollow
  g.ellipse(cx + 2.2, cy + 0.8, Math.min(7.4, hw * 0.46), Math.min(3.1, hh * 0.39));
  g.fill({ color: 0x4d7c0f, alpha: 0.85 });

  // Soft sunlit velvet grass crown
  g.ellipse(cx - 0.6, cy - 1.0, Math.min(6.4, hw * 0.40), Math.min(2.7, hh * 0.34));
  g.fill({ color: 0x65a30d, alpha: 0.85 });

  // Dewy sunlit grass highlight patch on the upper-left swell
  g.ellipse(cx - 1.8, cy - 1.5, Math.min(4.2, hw * 0.26), Math.min(1.8, hh * 0.22));
  g.fill({ color: 0x84cc16, alpha: 0.72 });

  // Rolling pastoral knoll contour lines sweeping across the diamond
  g.moveTo(cx - 13.5, cy - 0.2);
  g.bezierCurveTo(cx - 5, cy - 3.2, cx + 5, cy + 2.8, cx + 13.5, cy - 0.2);
  g.stroke({ width: 1.3, color: 0x4d7c0f, alpha: 0.85 });

  g.moveTo(cx - 10.0, cy + 2.6);
  g.bezierCurveTo(cx - 3, cy + 0.6, cx + 5.5, cy + 4.4, cx + 10.5, cy + 2.4);
  g.stroke({ width: 1.1, color: 0x3f6212, alpha: 0.78 });

  // Sunlit grass crest contour along the upper knoll
  g.moveTo(cx - 8.5, cy - 1.6);
  g.bezierCurveTo(cx - 3.5, cy - 3.4, cx + 2.5, cy - 1.2, cx + 7.5, cy - 2.0);
  g.stroke({ width: 0.8, color: 0xa3e635, alpha: 0.65 });

  // 3. A Few Low Tufts — Clustered Pastoral Grass Tufts & Soft Clover Specks
  const tufts = [
    { gx: cx - 8.5, gy: cy - 2.0, s: 1.0 },
    { gx: cx + 7.5, gy: cy - 1.6, s: 0.95 },
    { gx: cx + 0.8, gy: cy - 3.0, s: 0.90 },
    { gx: cx - 2.8, gy: cy + 3.2, s: 1.05 },
    { gx: cx + 5.6, gy: cy + 2.8, s: 0.95 },
  ];

  for (const t of tufts) {
    const gx = t.gx;
    const gy = t.gy;
    const s = t.s;

    // Gentle shadow under each low grass tuft
    g.ellipse(gx + 0.4, gy + 1.6 * s, 2.2 * s, 0.9 * s);
    g.fill({ color: 0x1a2e05, alpha: 0.55 });

    // Low fanning grass blades (3 blades per tuft)
    g.moveTo(gx, gy + 1.5 * s);
    g.lineTo(gx - 1.8 * s + sway * 0.5, gy - 1.6 * s);
    g.moveTo(gx, gy + 1.5 * s);
    g.lineTo(gx + sway * 0.7, gy - 2.4 * s);
    g.moveTo(gx, gy + 1.5 * s);
    g.lineTo(gx + 1.8 * s + sway * 0.5, gy - 1.5 * s);
    g.stroke({ width: 1.0, color: 0x84cc16, alpha: 0.92 });

    // Sunlit center blade tip highlight
    g.moveTo(gx + sway * 0.3, gy - 0.4 * s);
    g.lineTo(gx + sway * 0.7, gy - 2.4 * s);
    g.stroke({ width: 0.7, color: 0xbef264, alpha: 0.85 });
  }

  // Soft pastoral clover / meadow dew specks nestled in the grass
  g.circle(cx - 5.2, cy - 2.8, 0.75);
  g.fill({ color: 0xd9f99d, alpha: 0.88 });
  g.circle(cx + 3.8, cy - 2.4, 0.7);
  g.fill({ color: 0xecfccb, alpha: 0.85 });
  g.circle(cx - 0.8, cy + 1.4, 0.75);
  g.fill({ color: 0xd9f99d, alpha: 0.85 });
  g.circle(cx + 8.6, cy + 1.2, 0.65);
  g.fill({ color: 0xecfccb, alpha: 0.82 });
  g.circle(cx - 6.4, cy + 2.6, 0.7);
  g.fill({ color: 0xa3e635, alpha: 0.85 });
}

export const drawPlainTile = drawPlainMeadow;

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
        // Low pastoral meadow on the diamond: soft grass, a few low tufts, gentle shadow
        drawPlainMeadow(g, cx, cy, hw, hh, animPhase, { px: p.x, py: p.y });
        break;
      }

      case "wood": {
        // Trees on the diamond: small stand of pines, trunk, and ground shadow
        drawWoodTile(g, cx, cy, hw, hh, animPhase, { px: p.x, py: p.y });
        break;
      }

      case "hill": {
        // Low stepped plateau on the diamond: warm ochre and stone, three tiers, soft shadow
        drawHillRise(g, cx, cy, hw, hh, animPhase, { px: p.x, py: p.y });
        break;
      }

      case "waste": {
        // Low scorched basalt crag on the diamond: dark basalt, cracked ash, faint heat glow
        drawWasteCrag(g, cx, cy, hw, hh, animPhase, { px: p.x, py: p.y });
        break;
      }

      case "shore": {
        // Water on the diamond: shallow sea shelf, small wave, and wet sand edge
        drawShoreTile(g, cx, cy, hw, hh, animPhase, { px: p.x, py: p.y });
        break;
      }

      case "peak": {
        // Mountain on the diamond: tall peak, snow cap, and rock shadow
        drawPeakTile(g, cx, cy, hw, hh, animPhase, { px: p.x, py: p.y });
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

      let cultId: string | undefined;
      if (p.occupantRealmId === "player") {
        cultId = sim.playerCultureId ? sim.playerCultureId(state) : undefined;
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

      drawMiniatureKeep(
        g,
        cx,
        cy - 2,
        cultId ?? kit,
        realmPal,
        isPlayerHome,
        phase,
        isPlayerHome ? { state, cultureId: cultId } : undefined
      );
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
          const { stock, max, ratio, hasStock } = getNodeStockInfo(state, p.id, p.node);
          drawResourceNode(g, cx, cy, p.node, ratio, phase, hasStock);
          if (p.node === "woodcut" || p.node === "quarry" || p.node === "field") {
            drawStockBadge(g, cx, cy, stock, max);
          }
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

        if (p.node !== "ruins") {
          const garrison = getPostedGarrison(state, p.id);
          if (garrison.posted) {
            // Posted Garrison Encampment: small tent + banner meeple with armaments & power crest
            drawGarrisonMeeple(g, cx, cy, kit, cult, garrison.power, phase);
          } else {
            // Player Camp / Outpost: clearer tent + flag
            drawPlayerCampTentAndFlag(g, cx, cy, kit, cult, phase, { node: p.node, flagColor: playerTabardCol });
          }
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

        if (p.node !== "ruins") {
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
    }

    // 6.5 Faint Ring for March Destination Tiles (Player Gold / Hostile Red)
    const destKind = marchDestMap.get(p.id);
    if (destKind) {
      paintBoardDestinationRing(g, p, destKind, animPhase);
    }

    // 6.6 Active Fight / Column Clash or Engagement Mark on Seen Tiles
    if (hasProvinceClash(state, p.id)) {
      drawClashMark(g, cx, cy - 6, animPhase);
    }

    // 6.7 Hostile Column Inbound Mark on Seen Tiles
    if (hasProvinceIncoming(state, p.id)) {
      drawIncomingMark(g, cx + 8, cy - 8, animPhase);
    }

    // 6.8 Player Column Trail Mark on Seen Tiles
    if (hasProvinceTrail(state, p.id)) {
      drawTrailMark(g, cx - 8, cy - 8, animPhase);
    }

    // 6.9 Player Outpost Flag Mark or Rival Camp Mark on Seen Tiles
    const outpostMarkKind = resolveProvinceOutpostMark(state, p.id);
    if (outpostMarkKind && !hasProvinceHold(state, p.id)) {
      drawOutpostMark(g, cx - 7, cy + 4, outpostMarkKind, animPhase);
    }

    // 6.10 Season Pip on Seen Home Tile
    const seasonMarkKind = resolveProvinceSeasonMark(state, p.id);
    if (seasonMarkKind) {
      drawSeasonMark(g, cx + 7, cy + 4, seasonMarkKind, animPhase);
    }

    // 6.11 Posted Player Garrison Mark on Seen Tiles
    if (hasProvinceGarrison(state, p.id)) {
      drawGarrisonMark(g, cx, cy + 6, animPhase);
    }

    // 6.12 Player Scout Mark on Seen Tiles
    if (hasProvinceScout(state, p.id)) {
      drawScoutMark(g, cx + 11, cy - 1, animPhase);
    }

    // 6.13 Player Gather Mark on Seen Tiles
    if (hasProvinceGather(state, p.id)) {
      drawGatherMark(g, cx - 11, cy - 1, animPhase);
    }

    // 6.14 Rival Realm Owner Mark on Seen Tiles
    const ownerRealmId = resolveProvinceOwnerMark(state, p.id);
    if (ownerRealmId) {
      drawOwnerMark(g, cx + 7, cy + 4, ownerRealmId, animPhase);
    }

    // 6.15 Player Hold Crown Mark on Seen Tiles
    if (hasProvinceHold(state, p.id)) {
      drawHoldMark(g, cx - 7, cy + 4, animPhase);
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

/**
 * Draws the Ranger unit meeple:
 * Silhouette: Hood, mist-blue cloak, and short bow.
 */
export function drawRangerMeeple(
  pawnsG: Graphics,
  pawnX: number,
  pawnY: number,
  facing: number = 1,
  frame: 0 | 1 | 2 = 0,
  bob: number = 0,
  cultId?: string,
  phase: number = 0,
  options?: { withPedestal?: boolean }
): void {
  if (options?.withPedestal) {
    pawnsG.ellipse(pawnX, pawnY + 6.5, 9.5, 4);
    pawnsG.fill({ color: 0x000000, alpha: 0.55 });
    pawnsG.rect(pawnX - 7, pawnY + 2 - bob, 14, 4.5);
    pawnsG.fill({ color: 0x451a03 });
    pawnsG.stroke({ width: 0.8, color: 0x271302 });
    pawnsG.rect(pawnX - 6, pawnY + 1.2 - bob, 12, 1.8);
    pawnsG.fill({ color: 0xfacc15 });
    pawnsG.rect(pawnX - 4, pawnY + 1.5 - bob, 8, 1.2);
    pawnsG.fill({ color: 0x2563eb });
    pawnsG.circle(pawnX - 5.5, pawnY + 4.2 - bob, 0.7); pawnsG.fill({ color: 0xfde047 });
    pawnsG.circle(pawnX + 5.5, pawnY + 4.2 - bob, 0.7); pawnsG.fill({ color: 0xfde047 });
  }

  const armSwing = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  const legL = frame === 1 ? -2.2 : frame === 2 ? 1.2 : -1;
  const legR = frame === 1 ? 1.2 : frame === 2 ? -2.2 : 1;

  const mistBlue = 0x475569;
  const mistDark = 0x1e293b;
  const leatherWood = 0x5c3818;
  const bowWood = 0xca8a04;

  // 1. Billowing Mist-Blue Cloak trailing behind runner
  const cDrift = Math.sin(phase * 4 + pawnX) * 1.5;
  pawnsG.poly([
    pawnX - facing * 2, pawnY - 9 - bob,
    pawnX - facing * (7 + cDrift), pawnY + 1 - bob,
    pawnX - facing * 4.5, pawnY + 2.5 - bob,
    pawnX - facing * 1, pawnY - 1 - bob,
  ]);
  pawnsG.fill({ color: mistBlue });
  pawnsG.stroke({ width: 0.6, color: mistDark });

  // Translucent mist trim on hem
  pawnsG.poly([
    pawnX - facing * (7 + cDrift), pawnY + 1 - bob,
    pawnX - facing * (5.5 + cDrift * 0.5), pawnY + 2.5 - bob,
    pawnX - facing * 4.5, pawnY + 2.5 - bob,
  ]);
  pawnsG.fill({ color: 0xe2e8f0, alpha: 0.45 });

  // 2. Nimble Ranger Legs with soft leather boots
  pawnsG.rect(pawnX + legL, pawnY - 2 - bob, 2.2, 4.5);
  pawnsG.fill({ color: 0x292524 });
  pawnsG.rect(pawnX + legR, pawnY - 2 - bob, 2.2, 4.5);
  pawnsG.fill({ color: 0x1c1917 });

  // 3. Tapered Torso with Peat-Leather Jerkin & Belt
  pawnsG.poly([
    pawnX - 4, pawnY + 1 - bob,
    pawnX - 3.2, pawnY - 7 - bob,
    pawnX + 3.2, pawnY - 7 - bob,
    pawnX + 4, pawnY + 1 - bob,
  ]);
  pawnsG.fill({ color: mistBlue });
  pawnsG.stroke({ width: 0.7, color: mistDark });

  // Leather cross-straps and belt with pouch
  pawnsG.rect(pawnX - 3.2, pawnY - 2 - bob, 6.4, 1.4);
  pawnsG.fill({ color: leatherWood });
  pawnsG.circle(pawnX, pawnY - 1.3 - bob, 0.7);
  pawnsG.fill({ color: 0xd4a359 });
  // Quiver strap
  pawnsG.moveTo(pawnX - 2.5, pawnY - 6.5 - bob);
  pawnsG.lineTo(pawnX + 2.5, pawnY - 2 - bob);
  pawnsG.stroke({ width: 0.8, color: leatherWood });

  // 4. Head and The Ranger Hood
  pawnsG.circle(pawnX, pawnY - 10 - bob, 2.8);
  pawnsG.fill({ color: 0x18181b }); // shadowed cowl depth

  // Pulled-up hood cowl with pointed peak trailing back
  pawnsG.poly([
    pawnX - 4, pawnY - 8.5 - bob,
    pawnX, pawnY - 15 - bob,
    pawnX + 4, pawnY - 8.5 - bob,
  ]);
  pawnsG.fill({ color: mistBlue });
  pawnsG.stroke({ width: 0.7, color: mistDark });

  // Hood point trailing back
  pawnsG.poly([
    pawnX - facing * 0.5, pawnY - 15 - bob,
    pawnX - facing * 4.5, pawnY - 17 - bob,
    pawnX - facing * 2.5, pawnY - 13 - bob,
  ]);
  pawnsG.fill({ color: mistDark });

  // Shadowed cowl interior with keen scout glint
  pawnsG.circle(pawnX + facing * 0.8, pawnY - 11 - bob, 1.8);
  pawnsG.fill({ color: 0x09090b });
  pawnsG.circle(pawnX + facing * 1.4, pawnY - 11 - bob, 0.6);
  pawnsG.fill({ color: 0x38bdf8 }); // keen mist cyan eye

  // Back Quiver with arrows
  pawnsG.rect(pawnX - facing * 3.5, pawnY - 11 - bob, 2.4, 5.5);
  pawnsG.fill({ color: leatherWood });
  pawnsG.moveTo(pawnX - facing * 3.5, pawnY - 14 - bob);
  pawnsG.lineTo(pawnX - facing * 3.5, pawnY - 11 - bob);
  pawnsG.stroke({ width: 1, color: 0xf1f5f9 });
  pawnsG.moveTo(pawnX - facing * 2.2, pawnY - 13.5 - bob);
  pawnsG.lineTo(pawnX - facing * 2.2, pawnY - 11 - bob);
  pawnsG.stroke({ width: 1, color: 0xca8a04 });

  // 5. The Short Bow
  // Compact hunting recurve bow (noticeably smaller than archer longbow)
  pawnsG.poly([
    pawnX + facing * 3.5, pawnY - 12 - bob + armSwing,
    pawnX + facing * 6.2, pawnY - 7 - bob + armSwing,
    pawnX + facing * 3.5, pawnY - 2 - bob + armSwing,
  ]);
  pawnsG.stroke({ width: 1.8, color: bowWood });

  // Taut bowstring
  pawnsG.moveTo(pawnX + facing * 3.5, pawnY - 12 - bob + armSwing);
  pawnsG.lineTo(pawnX + facing * 3.5, pawnY - 2 - bob + armSwing);
  pawnsG.stroke({ width: 0.8, color: 0xf8fafc });

  // Nocked bodkin arrow ready to loose
  pawnsG.moveTo(pawnX + facing * 0.5, pawnY - 7 - bob + armSwing);
  pawnsG.lineTo(pawnX + facing * 7, pawnY - 7 - bob + armSwing);
  pawnsG.stroke({ width: 1.0, color: 0xd4a359 });
  pawnsG.poly([
    pawnX + facing * 7, pawnY - 8 - bob + armSwing,
    pawnX + facing * 8.5, pawnY - 7 - bob + armSwing,
    pawnX + facing * 7, pawnY - 6 - bob + armSwing,
  ]);
  pawnsG.fill({ color: 0xffffff });
}

/**
 * Draws the Banner unit meeple:
 * Silhouette: Spear with a small pennant, and glen-green cloak.
 */
export function drawBannerMeeple(
  pawnsG: Graphics,
  pawnX: number,
  pawnY: number,
  facing: number = 1,
  frame: 0 | 1 | 2 = 0,
  bob: number = 0,
  cultId?: string,
  phase: number = 0,
  options?: { withPedestal?: boolean }
): void {
  if (options?.withPedestal) {
    pawnsG.ellipse(pawnX, pawnY + 6.5, 9.5, 4);
    pawnsG.fill({ color: 0x000000, alpha: 0.55 });
    pawnsG.rect(pawnX - 7, pawnY + 2 - bob, 14, 4.5);
    pawnsG.fill({ color: 0x451a03 });
    pawnsG.stroke({ width: 0.8, color: 0x271302 });
    pawnsG.rect(pawnX - 6, pawnY + 1.2 - bob, 12, 1.8);
    pawnsG.fill({ color: 0xfacc15 });
    pawnsG.rect(pawnX - 4, pawnY + 1.5 - bob, 8, 1.2);
    pawnsG.fill({ color: 0x2563eb });
    pawnsG.circle(pawnX - 5.5, pawnY + 4.2 - bob, 0.7); pawnsG.fill({ color: 0xfde047 });
    pawnsG.circle(pawnX + 5.5, pawnY + 4.2 - bob, 0.7); pawnsG.fill({ color: 0xfde047 });
  }

  const armSwing = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  const legL = frame === 1 ? -2.2 : frame === 2 ? 1.2 : -1;
  const legR = frame === 1 ? 1.2 : frame === 2 ? -2.2 : 1;

  const glenGreen = 0x4d7c0f;
  const glenDark = 0x365314;
  const pennantBright = 0xa3e635;
  const graniteStone = 0x78716c;

  // 1. Glen-Green Cloak pinned neatly at collar
  pawnsG.poly([
    pawnX - facing * 2, pawnY - 8 - bob,
    pawnX - facing * 6, pawnY + 2 - bob,
    pawnX - facing * 1.5, pawnY + 1.5 - bob,
  ]);
  pawnsG.fill({ color: glenGreen });
  pawnsG.stroke({ width: 0.6, color: glenDark });

  // 2. Disciplined Marching Legs
  pawnsG.rect(pawnX + legL, pawnY - 2 - bob, 2.4, 4.5);
  pawnsG.fill({ color: graniteStone });
  pawnsG.rect(pawnX + legR, pawnY - 2 - bob, 2.4, 4.5);
  pawnsG.fill({ color: 0x44403c });

  // 3. Torso with Glen Tabard & Brass Livery
  pawnsG.poly([
    pawnX - 4.5, pawnY + 1 - bob,
    pawnX - 3.5, pawnY - 7 - bob,
    pawnX + 3.5, pawnY - 7 - bob,
    pawnX + 4.5, pawnY + 1 - bob,
  ]);
  pawnsG.fill({ color: glenGreen });
  pawnsG.stroke({ width: 0.7, color: glenDark });

  // Gold livery belt
  pawnsG.rect(pawnX - 3.5, pawnY - 2 - bob, 7, 1.5);
  pawnsG.fill({ color: 0xfacc15 });

  // 4. Head and Kettle Helm
  pawnsG.circle(pawnX, pawnY - 10 - bob, 2.8);
  pawnsG.fill({ color: 0xfbcfe8 });

  // Polished granite kettle helm
  pawnsG.rect(pawnX - 4.5, pawnY - 12 - bob, 9, 2);
  pawnsG.fill({ color: graniteStone });
  pawnsG.circle(pawnX, pawnY - 12.5 - bob, 2.6);
  pawnsG.fill({ color: 0xd6d3d1 });
  pawnsG.stroke({ width: 0.6, color: 0x44403c });

  // 5. The Spear with a Small Pennant
  // Spear shaft held aloft
  pawnsG.moveTo(pawnX + facing * 4, pawnY + 3 - bob);
  pawnsG.lineTo(pawnX + facing * 4, pawnY - 23 - bob + armSwing);
  pawnsG.stroke({ width: 1.5, color: 0x5c3818 });

  // Spear leaf head
  pawnsG.poly([
    pawnX + facing * 4, pawnY - 25 - bob + armSwing,
    pawnX + facing * 4 - 2, pawnY - 21 - bob + armSwing,
    pawnX + facing * 4 + 2, pawnY - 21 - bob + armSwing,
  ]);
  pawnsG.fill({ color: 0xffffff });
  pawnsG.stroke({ width: 0.6, color: 0x475569 });

  // Gold ferrule / pennant attachment ring
  pawnsG.circle(pawnX + facing * 4, pawnY - 20 - bob + armSwing, 1.0);
  pawnsG.fill({ color: 0xfacc15 });

  // The Small Pennant waving from spearhead
  const bWave = Math.sin(phase * 4 + pawnX) * 1.8;
  pawnsG.poly([
    pawnX + facing * 4, pawnY - 21 - bob + armSwing,
    pawnX + facing * (12 + bWave), pawnY - 18.5 - bob + armSwing,
    pawnX + facing * (8 + bWave * 0.5), pawnY - 16.5 - bob + armSwing,
    pawnX + facing * (12 + bWave), pawnY - 14.5 - bob + armSwing,
    pawnX + facing * 4, pawnY - 14.5 - bob + armSwing,
  ]);
  pawnsG.fill({ color: pennantBright });
  pawnsG.stroke({ width: 0.6, color: glenDark });

  // Inner heraldic stripe on pennant
  pawnsG.poly([
    pawnX + facing * 4, pawnY - 18.5 - bob + armSwing,
    pawnX + facing * (7 + bWave * 0.5), pawnY - 16.5 - bob + armSwing,
    pawnX + facing * 4, pawnY - 16.5 - bob + armSwing,
  ]);
  pawnsG.fill({ color: 0xfacc15 });
}

/**
 * Draws the Outrider unit meeple:
 * Silhouette: Horse and short lance, with salt-grey cloak.
 */
export function drawOutriderMeeple(
  pawnsG: Graphics,
  pawnX: number,
  pawnY: number,
  facing: number = 1,
  frame: 0 | 1 | 2 = 0,
  bob: number = 0,
  cultId?: string,
  phase: number = 0,
  options?: { withPedestal?: boolean }
): void {
  if (options?.withPedestal) {
    pawnsG.ellipse(pawnX, pawnY + 6.5, 9.5, 4);
    pawnsG.fill({ color: 0x000000, alpha: 0.55 });
    pawnsG.rect(pawnX - 7, pawnY + 2 - bob, 14, 4.5);
    pawnsG.fill({ color: 0x451a03 });
    pawnsG.stroke({ width: 0.8, color: 0x271302 });
    pawnsG.rect(pawnX - 6, pawnY + 1.2 - bob, 12, 1.8);
    pawnsG.fill({ color: 0xfacc15 });
    pawnsG.rect(pawnX - 4, pawnY + 1.5 - bob, 8, 1.2);
    pawnsG.fill({ color: 0x2563eb });
    pawnsG.circle(pawnX - 5.5, pawnY + 4.2 - bob, 0.7); pawnsG.fill({ color: 0xfde047 });
    pawnsG.circle(pawnX + 5.5, pawnY + 4.2 - bob, 0.7); pawnsG.fill({ color: 0xfde047 });
  }

  const hLeg1 = frame === 1 ? 2 : frame === 2 ? -2 : 0;
  const hLeg2 = frame === 1 ? -2 : frame === 2 ? 2 : 0;

  const saltGrey = 0xa8a29e;
  const saltDark = 0x57534e;
  const horseDun = 0x78716c;

  // 1. Agile Galloping Scout Horse Legs with hooves
  pawnsG.rect(pawnX - 5.5, pawnY - 1 - bob + hLeg1, 2.2, 4.5);
  pawnsG.fill({ color: 0x44403c });
  pawnsG.rect(pawnX - 5.5, pawnY + 2.5 - bob + hLeg1, 2.2, 1.2);
  pawnsG.fill({ color: 0x18181b });

  pawnsG.rect(pawnX + 4, pawnY - 1 - bob + hLeg2, 2.2, 4.5);
  pawnsG.fill({ color: horseDun });
  pawnsG.rect(pawnX + 4, pawnY + 2.5 - bob + hLeg2, 2.2, 1.2);
  pawnsG.fill({ color: 0x18181b });

  // 2. Scout Horse Body
  pawnsG.rect(pawnX - 6.5, pawnY - 5.5 - bob, 13, 5.5);
  pawnsG.fill({ color: horseDun });

  // Timber yard leather saddle & salt-grey blanket
  pawnsG.rect(pawnX - 3.5, pawnY - 6.5 - bob, 7, 4.5);
  pawnsG.fill({ color: saltGrey });
  pawnsG.stroke({ width: 0.6, color: saltDark });

  // 3. Swift Horse Neck and Head
  pawnsG.poly([
    pawnX + facing * 3, pawnY - 5.5 - bob,
    pawnX + facing * 7, pawnY - 11.5 - bob,
    pawnX + facing * 10, pawnY - 9.5 - bob,
    pawnX + facing * 5, pawnY - 3.5 - bob,
  ]);
  pawnsG.fill({ color: horseDun });

  // Salt-white mane and bridle
  pawnsG.rect(pawnX + facing * 6.5, pawnY - 12.5 - bob, 2, 3);
  pawnsG.fill({ color: 0xf1f5f9 });
  pawnsG.moveTo(pawnX + facing * 9, pawnY - 9 - bob);
  pawnsG.lineTo(pawnX + facing * 2, pawnY - 8.5 - bob);
  pawnsG.stroke({ width: 0.6, color: 0x292524 });

  // 4. Rider with Salt-Grey Cloak
  // Flowing salt-grey cloak streaming behind rider
  const oWave = Math.sin(phase * 4 + pawnX) * 1.5;
  pawnsG.poly([
    pawnX - facing * 2.5, pawnY - 11 - bob,
    pawnX - facing * (8.5 + oWave), pawnY - 7 - bob,
    pawnX - facing * 3, pawnY - 5 - bob,
  ]);
  pawnsG.fill({ color: saltGrey });
  pawnsG.stroke({ width: 0.6, color: saltDark });

  // Rider body & coif
  pawnsG.rect(pawnX - 2.5, pawnY - 11.5 - bob, 5, 5.5);
  pawnsG.fill({ color: saltGrey });
  pawnsG.circle(pawnX, pawnY - 13.5 - bob, 2.6);
  pawnsG.fill({ color: 0xd6d3d1 });
  pawnsG.stroke({ width: 0.6, color: saltDark });

  // 5. The Short Lance
  // Agile, light scouting short lance (noticeably more compact than cavalry lance)
  pawnsG.moveTo(pawnX - facing * 2, pawnY - 8 - bob);
  pawnsG.lineTo(pawnX + facing * 10.5, pawnY - 12.5 - bob);
  pawnsG.stroke({ width: 1.3, color: 0xd4a359 });

  // Short lance steel point
  pawnsG.poly([
    pawnX + facing * 9.5, pawnY - 12 - bob,
    pawnX + facing * 12, pawnY - 13 - bob,
    pawnX + facing * 9.5, pawnY - 14 - bob,
  ]);
  pawnsG.fill({ color: 0xf1f5f9 });
}

/**
 * Draws the Warden unit meeple:
 * Silhouette: Spear and round shield, with fen-reed cloak.
 */
export function drawWardenMeeple(
  pawnsG: Graphics,
  pawnX: number,
  pawnY: number,
  facing: number = 1,
  frame: 0 | 1 | 2 = 0,
  bob: number = 0,
  cultId?: string,
  phase: number = 0,
  options?: { withPedestal?: boolean }
): void {
  if (options?.withPedestal) {
    pawnsG.ellipse(pawnX, pawnY + 6.5, 9.5, 4);
    pawnsG.fill({ color: 0x000000, alpha: 0.55 });
    pawnsG.rect(pawnX - 7, pawnY + 2 - bob, 14, 4.5);
    pawnsG.fill({ color: 0x451a03 });
    pawnsG.stroke({ width: 0.8, color: 0x271302 });
    pawnsG.rect(pawnX - 6, pawnY + 1.2 - bob, 12, 1.8);
    pawnsG.fill({ color: 0xfacc15 });
    pawnsG.rect(pawnX - 4, pawnY + 1.5 - bob, 8, 1.2);
    pawnsG.fill({ color: 0x2563eb });
    pawnsG.circle(pawnX - 5.5, pawnY + 4.2 - bob, 0.7); pawnsG.fill({ color: 0xfde047 });
    pawnsG.circle(pawnX + 5.5, pawnY + 4.2 - bob, 0.7); pawnsG.fill({ color: 0xfde047 });
  }

  const armSwing = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  const legL = frame === 1 ? -2.2 : frame === 2 ? 1.2 : -1;
  const legR = frame === 1 ? 1.2 : frame === 2 ? -2.2 : 1;

  const fenGreen = 0x3f6212;
  const fenDark = 0x1a2e05;
  const reedBright = 0x65a30d;

  // 1. Fen-Reed Cloak with rush frills
  pawnsG.poly([
    pawnX - facing * 2, pawnY - 8 - bob,
    pawnX - facing * 6.5, pawnY + 2 - bob,
    pawnX - facing * 1.5, pawnY + 1 - bob,
  ]);
  pawnsG.fill({ color: fenGreen });
  pawnsG.stroke({ width: 0.6, color: fenDark });
  // Bone toggle clasp
  pawnsG.rect(pawnX - facing * 1.5, pawnY - 7.5 - bob, 1.2, 1.8);
  pawnsG.fill({ color: 0xfef08a });

  // 2. Heavy Marsh Guard Boots & Stride
  pawnsG.rect(pawnX + legL, pawnY - 2 - bob, 2.4, 4.5);
  pawnsG.fill({ color: 0x292524 });
  pawnsG.rect(pawnX + legR, pawnY - 2 - bob, 2.4, 4.5);
  pawnsG.fill({ color: 0x1c1917 });

  // 3. Sturdy Torso with Gambeson
  pawnsG.poly([
    pawnX - 4.5, pawnY + 1 - bob,
    pawnX - 3.5, pawnY - 7 - bob,
    pawnX + 3.5, pawnY - 7 - bob,
    pawnX + 4.5, pawnY + 1 - bob,
  ]);
  pawnsG.fill({ color: fenGreen });
  pawnsG.stroke({ width: 0.7, color: fenDark });

  // Belt with leather pouch
  pawnsG.rect(pawnX - 3.5, pawnY - 2 - bob, 7, 1.5);
  pawnsG.fill({ color: 0x44403c });

  // 4. Head and Kettle Helm
  pawnsG.circle(pawnX, pawnY - 10 - bob, 2.8);
  pawnsG.fill({ color: 0xfbcfe8 });

  // Conical iron kettle helm with brim
  pawnsG.rect(pawnX - 4.5, pawnY - 12 - bob, 9, 2);
  pawnsG.fill({ color: 0x4b5563 });
  pawnsG.circle(pawnX, pawnY - 12.5 - bob, 2.6);
  pawnsG.fill({ color: 0x6b7280 });
  pawnsG.stroke({ width: 0.6, color: 0x1f2937 });

  // 5. The Prominent Round Shield on off-arm
  // Outer reinforced rim
  pawnsG.circle(pawnX - facing * 3.5, pawnY - 5 - bob + armSwing, 4.6);
  pawnsG.fill({ color: 0x292524 });
  pawnsG.stroke({ width: 0.8, color: 0x1c1917 });
  // Wicker-reed shield face
  pawnsG.circle(pawnX - facing * 3.5, pawnY - 5 - bob + armSwing, 3.8);
  pawnsG.fill({ color: reedBright });
  // Central iron boss
  pawnsG.circle(pawnX - facing * 3.5, pawnY - 5 - bob + armSwing, 1.6);
  pawnsG.fill({ color: 0xd1d5db });
  pawnsG.circle(pawnX - facing * 3.5, pawnY - 5 - bob + armSwing, 0.7);
  pawnsG.fill({ color: 0xffffff });

  // 6. The Spear
  // Marsh-wood short spear held in main arm
  pawnsG.moveTo(pawnX + facing * 4, pawnY + 2 - bob);
  pawnsG.lineTo(pawnX + facing * 4, pawnY - 18 - bob + armSwing);
  pawnsG.stroke({ width: 1.4, color: 0x5c3818 });

  // Leaf-shaped forged steel head
  pawnsG.poly([
    pawnX + facing * 4, pawnY - 20 - bob + armSwing,
    pawnX + facing * 4 - 2, pawnY - 16 - bob + armSwing,
    pawnX + facing * 4 + 2, pawnY - 16 - bob + armSwing,
  ]);
  pawnsG.fill({ color: 0xf8fafc });
  pawnsG.stroke({ width: 0.6, color: 0x334155 });

  // Reed binding beneath spearhead
  pawnsG.rect(pawnX + facing * 3.2, pawnY - 16 - bob + armSwing, 1.6, 2);
  pawnsG.fill({ color: 0xca8a04 });
}

/**
 * Draws the Lancer unit meeple:
 * Silhouette: Mountain warhorse and long lance, with peak-white cloak.
 */
export function drawLancerMeeple(
  pawnsG: Graphics,
  pawnX: number,
  pawnY: number,
  facing: number = 1,
  frame: 0 | 1 | 2 = 0,
  bob: number = 0,
  cultId?: string,
  phase: number = 0,
  options?: { withPedestal?: boolean }
): void {
  if (options?.withPedestal) {
    pawnsG.ellipse(pawnX, pawnY + 6.5, 9.5, 4);
    pawnsG.fill({ color: 0x000000, alpha: 0.55 });
    pawnsG.rect(pawnX - 7, pawnY + 2 - bob, 14, 4.5);
    pawnsG.fill({ color: 0x451a03 });
    pawnsG.stroke({ width: 0.8, color: 0x271302 });
    pawnsG.rect(pawnX - 6, pawnY + 1.2 - bob, 12, 1.8);
    pawnsG.fill({ color: 0xfacc15 });
    pawnsG.rect(pawnX - 4, pawnY + 1.5 - bob, 8, 1.2);
    pawnsG.fill({ color: 0x2563eb });
    pawnsG.circle(pawnX - 5.5, pawnY + 4.2 - bob, 0.7); pawnsG.fill({ color: 0xfde047 });
    pawnsG.circle(pawnX + 5.5, pawnY + 4.2 - bob, 0.7); pawnsG.fill({ color: 0xfde047 });
  }

  const hLeg1 = frame === 1 ? 2 : frame === 2 ? -2 : 0;
  const hLeg2 = frame === 1 ? -2 : frame === 2 ? 2 : 0;

  const peakWhite = 0xf8fafc;
  const steelShade = 0xcbd5e1;
  const warhorseCoat = 0x334155;

  // 1. Heavy Mountain Warhorse Galloping Legs
  pawnsG.rect(pawnX - 5.5, pawnY - 1 - bob + hLeg1, 2.5, 4.5);
  pawnsG.fill({ color: 0x1e293b });
  pawnsG.rect(pawnX - 5.5, pawnY + 2.5 - bob + hLeg1, 2.5, 1.2);
  pawnsG.fill({ color: 0x0f172a });

  pawnsG.rect(pawnX + 4, pawnY - 1 - bob + hLeg2, 2.5, 4.5);
  pawnsG.fill({ color: warhorseCoat });
  pawnsG.rect(pawnX + 4, pawnY + 2.5 - bob + hLeg2, 2.5, 1.2);
  pawnsG.fill({ color: 0x0f172a });

  // 2. Powerful Armored Horse Body
  pawnsG.rect(pawnX - 6.5, pawnY - 5.5 - bob, 13, 5.5);
  pawnsG.fill({ color: warhorseCoat });

  // Saddle & Peak-White Trapper caparison
  pawnsG.rect(pawnX - 3.5, pawnY - 6.5 - bob, 7, 4.5);
  pawnsG.fill({ color: peakWhite });
  pawnsG.stroke({ width: 0.6, color: steelShade });

  // 3. Horse Neck & Head with Steel Chanfron Armor
  pawnsG.poly([
    pawnX + facing * 3.5, pawnY - 5.5 - bob,
    pawnX + facing * 7.5, pawnY - 12 - bob,
    pawnX + facing * 11, pawnY - 10 - bob,
    pawnX + facing * 5.5, pawnY - 3.5 - bob,
  ]);
  pawnsG.fill({ color: warhorseCoat });

  // Steel chanfron plate on forehead
  pawnsG.poly([
    pawnX + facing * 7.5, pawnY - 12.5 - bob,
    pawnX + facing * 10.5, pawnY - 10.5 - bob,
    pawnX + facing * 9.5, pawnY - 9 - bob,
    pawnX + facing * 7, pawnY - 10.5 - bob,
  ]);
  pawnsG.fill({ color: steelShade });

  // 4. Armored Lancer Knight with Billowing Peak-White Cloak
  const lWave = Math.sin(phase * 4 + pawnX) * 1.8;
  pawnsG.poly([
    pawnX - facing * 3, pawnY - 12 - bob,
    pawnX - facing * (9 + lWave), pawnY - 6 - bob,
    pawnX - facing * 2.5, pawnY - 4 - bob,
  ]);
  pawnsG.fill({ color: peakWhite });
  pawnsG.stroke({ width: 0.6, color: steelShade });

  // Silver mountain peak brooch
  pawnsG.circle(pawnX - facing * 2.5, pawnY - 11.5 - bob, 0.8);
  pawnsG.fill({ color: 0xffffff });

  // Knight in visored helm
  pawnsG.rect(pawnX - 2.5, pawnY - 12 - bob, 5.5, 6);
  pawnsG.fill({ color: steelShade });
  pawnsG.circle(pawnX, pawnY - 14 - bob, 3);
  pawnsG.fill({ color: 0xe2e8f0 });
  pawnsG.stroke({ width: 0.7, color: 0x475569 });
  // Visor eye-slit
  pawnsG.rect(pawnX + facing * 0.5, pawnY - 14 - bob, 2.5, 1.0);
  pawnsG.fill({ color: 0x0f172a });

  // 5. The Long Lance
  // Exceptionally long, heavy couched tournament/shock lance reaching far forward (reaches +facing * 18!)
  pawnsG.moveTo(pawnX - facing * 4.5, pawnY - 8.5 - bob);
  pawnsG.lineTo(pawnX + facing * 18, pawnY - 17.5 - bob);
  pawnsG.stroke({ width: 1.8, color: 0x64748b });

  // Heavy counterweight butt
  pawnsG.moveTo(pawnX - facing * 2, pawnY - 9 - bob);
  pawnsG.lineTo(pawnX - facing * 4.5, pawnY - 8.5 - bob);
  pawnsG.stroke({ width: 2.5, color: 0x334155 });

  // Circular vamplate handguard disc
  pawnsG.ellipse(pawnX + facing * 1.5, pawnY - 10.5 - bob, 1.8, 3.2);
  pawnsG.fill({ color: 0x94a3b8 });
  pawnsG.stroke({ width: 0.6, color: 0x334155 });

  // Diamond-forged armor-piercing steel lance point
  pawnsG.poly([
    pawnX + facing * 17, pawnY - 16.5 - bob,
    pawnX + facing * 20.5, pawnY - 17.5 - bob,
    pawnX + facing * 17, pawnY - 18.5 - bob,
  ]);
  pawnsG.fill({ color: 0xffffff });

  // Alpine flutter on lance tip
  pawnsG.poly([
    pawnX + facing * 15, pawnY - 17.5 - bob,
    pawnX + facing * 18, pawnY - 15 - bob,
    pawnX + facing * 15, pawnY - 14.5 - bob,
  ]);
  pawnsG.fill({ color: 0x38bdf8 });
}

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

      if (unitType === "ranger") {
        drawRangerMeeple(pawnsG, pawnX, pawnY, facing, frame, bob, cultId, phase);
      } else if (unitType === "banner") {
        drawBannerMeeple(pawnsG, pawnX, pawnY, facing, frame, bob, cultId, phase);
      } else if (unitType === "outrider") {
        drawOutriderMeeple(pawnsG, pawnX, pawnY, facing, frame, bob, cultId, phase);
      } else if (unitType === "warden") {
        drawWardenMeeple(pawnsG, pawnX, pawnY, facing, frame, bob, cultId, phase);
      } else if (unitType === "lancer") {
        drawLancerMeeple(pawnsG, pawnX, pawnY, facing, frame, bob, cultId, phase);
      } else if (pal.isChassis) {
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

