import { Graphics } from "pixi.js";
import type { GameState, Province, TerrainId, ProvinceNode } from "@second-crown/shared";
import { BOARD_W, BOARD_H } from "@second-crown/shared";
import {
  listMarches,
  isProvinceSeen,
  getProvince,
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
} from "./tiles.js";
import {
  type CultureKit,
  resolveCultureKit,
  culturePalette,
  type CultureVisualPalette,
  blendDark,
  blendLight,
} from "./buildings.js";

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

// -------------------------------------------------------------
// Miniature Pixel Keeps for Board-Band Holds (Lords Mobile Style)
// Reuses Authentic Culture Kit Silhouettes at Miniature Scale (~0.42x)
// -------------------------------------------------------------
export function drawMiniatureKeep(
  g: Graphics,
  cx: number,
  cy: number,
  kit: CultureKit,
  realmPal?: RealmTokenPalette,
  isHome = false,
  phase = 0
): void {
  // If this is a rival (Iron March) hold
  if (realmPal?.realmId === "rival") {
    // Spiked Blackened Iron Keep
    const ironPlinth = 0x18181b;
    const ironWallLight = 0x3f3f46;
    const ironWallDark = 0x27272a;
    const ironBattlement = 0x71717a;

    // Foundation talus
    g.poly([cx - 8, cy + 3, cx, cy + 6.5, cx + 8, cy + 3, cx, cy]);
    g.fill({ color: ironPlinth });

    // Main tower walls (left light, right dark)
    g.poly([cx - 7, cy + 1, cx, cy + 4, cx, cy - 9, cx - 7, cy - 12]);
    g.fill({ color: ironWallLight });
    g.poly([cx, cy + 4, cx + 7, cy + 1, cx + 7, cy - 12, cx, cy - 9]);
    g.fill({ color: ironWallDark });

    // Iron rivets on tower
    g.circle(cx - 4, cy - 4, 0.8); g.fill({ color: 0xa1a1aa });
    g.circle(cx + 4, cy - 4, 0.8); g.fill({ color: 0x71717a });

    // Spiked iron battlements
    g.poly([cx - 7, cy - 12, cx - 5, cy - 16, cx - 3, cy - 12]);
    g.fill({ color: ironBattlement });
    g.poly([cx - 2, cy - 12, cx, cy - 15, cx + 2, cy - 12]);
    g.fill({ color: ironBattlement });
    g.poly([cx + 3, cy - 12, cx + 5, cy - 16, cx + 7, cy - 12]);
    g.fill({ color: ironBattlement });

    // Narrow glowing crimson eye-slit gate
    g.rect(cx - 2, cy, 4, 4);
    g.fill({ color: 0x09090b });
    g.rect(cx - 1.5, cy + 1, 3, 1.4);
    g.fill({ color: 0xef4444 });

    // Waving blood-red spiked war pennant
    const wave = Math.sin(phase * 4 + cx) * 1.8;
    g.moveTo(cx, cy - 9); g.lineTo(cx, cy - 18);
    g.stroke({ width: 1.2, color: 0x52525b });
    g.poly([
      cx, cy - 18,
      cx + 7 + wave, cy - 15,
      cx + 4 + wave * 0.6, cy - 13,
      cx + 7 + wave, cy - 11,
      cx, cy - 11,
    ]);
    g.fill({ color: 0x991b1b });
    return;
  }

  // Culture-specific miniature pixel keeps
  switch (kit) {
    case "cedar": {
      // Cedar Kin: Miniature Timber Longhouse Keep on Riverstone Plinth
      const timberLight = 0x854d0e;
      const timberDark = 0x5c3818;
      const timberPlinth = 0x3f220c;
      const roofShake = 0x6d3d0c;
      const flagCol = realmPal ? realmPal.pennantColor : 0x14532d;

      // Riverstone plinth
      g.poly([cx - 8, cy + 3, cx, cy + 6.5, cx + 8, cy + 3, cx, cy]);
      g.fill({ color: timberPlinth });

      // Cross-lap log walls
      g.poly([cx - 7, cy + 1, cx, cy + 4, cx, cy - 7, cx - 7, cy - 10]);
      g.fill({ color: timberLight });
      g.poly([cx, cy + 4, cx + 7, cy + 1, cx + 7, cy - 10, cx, cy - 7]);
      g.fill({ color: timberDark });

      // Hewn log horizontal courses
      for (const my of [cy - 5, cy - 2, cy + 1]) {
        g.moveTo(cx - 7, my - 2); g.lineTo(cx, my); g.lineTo(cx + 7, my - 2);
        g.stroke({ width: 0.8, color: timberPlinth, alpha: 0.8 });
      }

      // Steep pitched cedar-shake gabled roof
      g.poly([cx - 9, cy - 8, cx, cy - 15, cx + 9, cy - 8, cx, cy - 5]);
      g.fill({ color: roofShake });
      g.stroke({ width: 1, color: timberPlinth });

      // Golden eagle ridgepole finials
      g.poly([cx, cy - 15, cx - 2, cy - 18, cx, cy - 17, cx + 2, cy - 18]);
      g.fill({ color: 0xfacc15 });

      // Timber doorway
      g.rect(cx - 2, cy, 4, 3.5);
      g.fill({ color: 0x1c1008 });

      // Waving cedar pennant
      const cWave = Math.sin(phase * 4 + cx) * 1.8;
      g.moveTo(cx, cy - 15); g.lineTo(cx, cy - 20);
      g.stroke({ width: 1.1, color: 0x3f220c });
      g.poly([cx, cy - 20, cx + 6 + cWave, cy - 17.5, cx, cy - 15]);
      g.fill({ color: flagCol });
      break;
    }

    case "sand": {
      // Sand Banner: Miniature Sunbleached Limestone Courtyard Keep + Lookout Minaret
      const sandPlinth = 0x78531e;
      const sandLight = 0xd6c7a1;
      const sandDark = 0xb8a882;
      const flagCol = realmPal ? realmPal.pennantColor : 0xb45309;

      // Foundation plinth
      g.poly([cx - 8, cy + 3, cx, cy + 6.5, cx + 8, cy + 3, cx, cy]);
      g.fill({ color: sandPlinth });

      // Main limestone hold
      g.poly([cx - 7, cy + 1, cx, cy + 4, cx, cy - 8, cx - 7, cy - 11]);
      g.fill({ color: sandLight });
      g.poly([cx, cy + 4, cx + 7, cy + 1, cx + 7, cy - 11, cx, cy - 8]);
      g.fill({ color: sandDark });

      // Flat roof parapet with sawtooth merlons
      g.rect(cx - 7, cy - 12, 14, 2.5);
      g.fill({ color: sandLight });
      g.rect(cx - 6, cy - 14, 2.5, 2); g.fill({ color: sandDark });
      g.rect(cx - 1, cy - 14, 2.5, 2); g.fill({ color: sandDark });
      g.rect(cx + 4, cy - 14, 2.5, 2); g.fill({ color: sandDark });

      // Corner lookout minaret turret with golden dome
      g.rect(cx + 4, cy - 17, 3.5, 6);
      g.fill({ color: sandLight });
      g.circle(cx + 5.7, cy - 18, 2);
      g.fill({ color: 0xfacc15 });

      // Horseshoe arched portal
      g.poly([cx - 2, cy + 3, cx - 2, cy, cx, cy - 1.5, cx + 2, cy, cx + 2, cy + 3]);
      g.fill({ color: 0x181008 });

      // Waving desert silk standard
      const sWave = Math.sin(phase * 4 + cx) * 1.8;
      g.moveTo(cx - 4, cy - 12); g.lineTo(cx - 4, cy - 19);
      g.stroke({ width: 1.1, color: 0x78531e });
      g.poly([cx - 4, cy - 19, cx + 3 + sWave, cy - 16.5, cx - 4, cy - 14]);
      g.fill({ color: flagCol });
      break;
    }

    case "steppe": {
      // Wind Host: Miniature Great Hall on Mound + Conical Dome + Horsehair Standard
      const moundColor = 0x44403c;
      const wallLight = 0xe7e5e4;
      const wallDark = 0xa8a29e;
      const bandColor = 0x9f1239;
      const flagCol = realmPal ? realmPal.pennantColor : 0x9f1239;

      // Earthen mound
      g.ellipse(cx, cy + 3, 9, 4.5);
      g.fill({ color: moundColor });

      // Circular felt yurt wall
      g.poly([cx - 7, cy + 2, cx, cy + 4.5, cx + 7, cy + 2, cx + 7, cy - 5, cx, cy - 3, cx - 7, cy - 5]);
      g.fill({ color: wallLight });
      g.poly([cx, cy + 4.5, cx + 7, cy + 2, cx + 7, cy - 5, cx, cy - 3]);
      g.fill({ color: wallDark });

      // Decorative crimson felt band
      g.moveTo(cx - 7, cy - 1); g.lineTo(cx, cy + 0.5); g.lineTo(cx + 7, cy - 1);
      g.stroke({ width: 1, color: bandColor });

      // Conical yurt roof canopy
      g.poly([cx - 8, cy - 4, cx, cy - 13, cx + 8, cy - 4, cx, cy - 2]);
      g.fill({ color: 0xf5f5f4 });
      g.stroke({ width: 0.8, color: wallDark });

      // Central smoke cowl ring
      g.circle(cx, cy - 13, 2);
      g.fill({ color: 0x78350f });

      // Wooden door frame
      g.rect(cx - 2, cy, 4, 3.5);
      g.fill({ color: 0x7c2d12 });

      // Tall horsehair banner pole
      const stWave = Math.sin(phase * 4 + cx) * 1.8;
      g.moveTo(cx + 6, cy + 1); g.lineTo(cx + 6, cy - 18);
      g.stroke({ width: 1.1, color: 0x78350f });
      g.poly([cx + 6, cy - 18, cx + 12 + stWave, cy - 15.5, cx + 6, cy - 13]);
      g.fill({ color: flagCol });
      break;
    }

    case "islands": {
      // Tide Clans: Miniature Stilt Pile-House Keep on Driftwood Pilings
      const deckPlinth = 0x44403c;
      const reedLight = 0xa8a29e;
      const reedDark = 0x78716c;
      const thatchRoof = 0x0e7490;
      const flagCol = realmPal ? realmPal.pennantColor : 0x0e7490;

      // Elevated timber pilings
      g.moveTo(cx - 6, cy + 4); g.lineTo(cx - 6, cy);
      g.moveTo(cx - 1, cy + 5); g.lineTo(cx - 1, cy + 1);
      g.moveTo(cx + 4, cy + 4); g.lineTo(cx + 4, cy);
      g.stroke({ width: 1.4, color: deckPlinth });

      // Elevated platform deck
      g.poly([cx - 8, cy, cx, cy + 3.5, cx + 8, cy, cx, cy - 3]);
      g.fill({ color: deckPlinth });

      // Slatted stilt cabin walls
      g.poly([cx - 6, cy - 1, cx, cy + 1.5, cx, cy - 8, cx - 6, cy - 10]);
      g.fill({ color: reedLight });
      g.poly([cx, cy + 1.5, cx + 6, cy - 1, cx + 6, cy - 10, cx, cy - 8]);
      g.fill({ color: reedDark });

      // Multi-tiered woven pavilion roof
      g.poly([cx - 8, cy - 8, cx, cy - 15, cx + 8, cy - 8, cx, cy - 6]);
      g.fill({ color: thatchRoof });
      g.stroke({ width: 0.8, color: 0x155e75 });

      // Wave crest finial
      g.circle(cx, cy - 15.5, 1.5);
      g.fill({ color: 0x38bdf8 });

      // Hanging sea lantern
      g.circle(cx - 5, cy - 5, 1.2);
      g.fill({ color: 0xfacc15, alpha: 0.9 });

      // Waving ocean swallowtail pennant
      const iWave = Math.sin(phase * 4 + cx) * 1.8;
      g.moveTo(cx, cy - 15); g.lineTo(cx, cy - 20);
      g.stroke({ width: 1.1, color: 0x44403c });
      g.poly([cx, cy - 20, cx + 7 + iWave, cy - 17.5, cx + 4 + iWave * 0.5, cy - 15.5, cx, cy - 15.5]);
      g.fill({ color: flagCol });
      break;
    }

    default: {
      // Western Crown Marches: Miniature Ashlar Stone Keep Tower + Bartizans + Crenellations
      const stonePlinth = 0x334155;
      const stoneLight = 0x64748b;
      const stoneDark = 0x475569;
      const bartizanLight = 0x71717a;
      const bartizanDark = 0x52525b;
      const flagCol = realmPal ? realmPal.pennantColor : isHome ? 0x1e40af : 0xb91c1c;

      // 1. Foundation talus plinth
      g.poly([cx - 8, cy + 3, cx, cy + 6.5, cx + 8, cy + 3, cx, cy]);
      g.fill({ color: stonePlinth });

      // 2. Main Stone Hold Tower Walls
      g.poly([cx - 7, cy + 1, cx, cy + 4, cx, cy - 9, cx - 7, cy - 12]);
      g.fill({ color: stoneLight });
      g.poly([cx, cy + 4, cx + 7, cy + 1, cx + 7, cy - 12, cx, cy - 9]);
      g.fill({ color: stoneDark });

      // Horizontal masonry course lines
      g.moveTo(cx - 7, cy - 5); g.lineTo(cx, cy - 2.5); g.lineTo(cx + 7, cy - 5);
      g.stroke({ width: 0.8, color: stonePlinth, alpha: 0.7 });
      g.moveTo(cx - 7, cy - 1); g.lineTo(cx, cy + 1.5); g.lineTo(cx + 7, cy - 1);
      g.stroke({ width: 0.8, color: stonePlinth, alpha: 0.7 });

      // 3. Corner Watch Bartizans
      g.poly([cx - 8, cy - 10, cx - 5.5, cy - 8.5, cx - 5.5, cy - 14, cx - 8, cy - 15]);
      g.fill({ color: bartizanLight });
      g.poly([cx - 8, cy - 15, cx - 5.5, cy - 14, cx - 7, cy - 17]);
      g.fill({ color: stonePlinth }); // Left turret cap

      g.poly([cx + 5.5, cy - 8.5, cx + 8, cy - 10, cx + 8, cy - 15, cx + 5.5, cy - 14]);
      g.fill({ color: bartizanDark });
      g.poly([cx + 5.5, cy - 14, cx + 8, cy - 15, cx + 7, cy - 17]);
      g.fill({ color: stonePlinth }); // Right turret cap

      // 4. Parapet battlements (3 crenellations)
      g.rect(cx - 5, cy - 13.5, 2.5, 2.5); g.fill({ color: bartizanLight });
      g.rect(cx - 1.2, cy - 13.5, 2.4, 2.5); g.fill({ color: bartizanLight });
      g.rect(cx + 2.5, cy - 13.5, 2.5, 2.5); g.fill({ color: bartizanDark });

      // 5. Arched Gateway & Portcullis
      g.rect(cx - 2, cy + 0.5, 4, 4);
      g.fill({ color: 0x09090b });
      g.moveTo(cx - 1, cy + 1); g.lineTo(cx - 1, cy + 4);
      g.moveTo(cx + 1, cy + 1); g.lineTo(cx + 1, cy + 4);
      g.stroke({ width: 0.8, color: 0x94a3b8, alpha: 0.8 });

      // 6. Warm Royal Candlelit Window
      const candle = 0.85 + Math.sin(phase * 4 + cx) * 0.15;
      g.rect(cx - 1, cy - 6, 2.2, 3);
      g.fill({ color: 0xfef08a, alpha: candle });

      // 7. Waving Swallowtail Pennant on Mast
      const wWave = Math.sin(phase * 4 + cx) * 1.8;
      g.moveTo(cx, cy - 11); g.lineTo(cx, cy - 19);
      g.stroke({ width: 1.2, color: 0x334155 });
      g.circle(cx, cy - 19.5, 1); g.fill({ color: 0xfacc15 });
      g.poly([
        cx, cy - 19,
        cx + 7 + wWave, cy - 16.5,
        cx + 4.5 + wWave * 0.6, cy - 14.5,
        cx + 7 + wWave, cy - 12.5,
        cx, cy - 12.5,
      ]);
      g.fill({ color: flagCol });
      break;
    }
  }
}


// -------------------------------------------------------------
// Tabletop Board Province Rendering (Height-Mapped Lords Mobile Style)
// -------------------------------------------------------------
export function paintBoardProvinces(g: Graphics, state: GameState, phase: number): void {
  g.clear();
  if (!state?.board?.provinces) return;

  // Sort back-to-front by depth (y * 20 + x) so foreground isometric tiles and cliff faces layer on top
  const sortedProvinces = [...state.board.provinces].sort((a, b) => (a.y * 20 + a.x) - (b.y * 20 + b.x));

  for (const p of sortedProvinces) {
    const b = provinceTokenBounds(p.x, p.y);
    const seen = isProvinceSeen(state, p.id);

    if (!seen) {
      // Unseen Province: Raised Volumetric Cumulus Cloud Mass (NOT purple squares)
      paintFogHeightVeil(g, b, p, phase);
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

    // 2. 3D Height Faces (Front-left & Front-right vertical cliffs based on Terrain)
    if (elev > 0) {
      paintTileHeightFace(g, b, p.terrain, pal, phase);
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

    // Top subtle highlight rim along rear two facets
    g.moveTo(wx - hw, cy);
    g.lineTo(wx, cy - hh);
    g.lineTo(wx + hw, cy);
    g.stroke({ width: 1, color: 0xffffff, alpha: 0.22 });

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

      drawMiniatureKeep(g, cx, cy - 2, kit, realmPal, isPlayerHome, phase);
    } else {
      switch (p.node) {
        case "camp": {
          g.poly([cx - 7, cy + 6, cx, cy - 5, cx + 7, cy + 6]);
          g.fill({ color: 0xb91c1c });
          g.poly([cx - 2, cy + 6, cx, cy - 1, cx + 2, cy + 6]);
          g.fill({ color: 0xfde047 });
          g.moveTo(cx - 7, cy - 3); g.lineTo(cx + 7, cy + 5);
          g.moveTo(cx + 7, cy - 3); g.lineTo(cx - 7, cy + 5);
          g.stroke({ width: 0.9, color: 0x78350f, alpha: 0.8 });
          break;
        }
        case "woodcut": {
          g.rect(cx - 7, cy + 1, 14, 4);
          g.fill({ color: 0x78350f });
          g.moveTo(cx - 7, cy + 3); g.lineTo(cx + 7, cy + 3);
          g.stroke({ width: 0.8, color: 0x3f1d0b });
          g.moveTo(cx - 5, cy); g.lineTo(cx + 5, cy - 8);
          g.moveTo(cx + 5, cy); g.lineTo(cx - 5, cy - 8);
          g.stroke({ width: 1.1, color: 0x854d0e });
          g.rect(cx + 3, cy - 9, 2.8, 2.2); g.fill({ color: 0xd1d5db });
          g.rect(cx - 6, cy - 9, 2.8, 2.2); g.fill({ color: 0xd1d5db });
          break;
        }
        case "quarry": {
          g.rect(cx - 6, cy - 2, 9, 7);
          g.fill({ color: 0xa1a1aa });
          g.rect(cx - 6, cy + 1, 9, 4);
          g.fill({ color: 0x71717a });
          g.moveTo(cx + 5, cy + 4); g.lineTo(cx - 2, cy - 7);
          g.stroke({ width: 1.1, color: 0x78350f });
          g.poly([cx - 5, cy - 7, cx - 1, cy - 8, cx + 2, cy - 5]);
          g.stroke({ width: 1.3, color: 0x94a3b8 });
          break;
        }
        case "field": {
          g.poly([cx - 4, cy + 6, cx - 6, cy - 3, cx + 6, cy - 3, cx + 4, cy + 6]);
          g.fill({ color: 0xca8a04 });
          g.rect(cx - 5, cy - 0.5, 10, 2);
          g.fill({ color: 0xdc2626 });
          g.circle(cx - 3, cy - 5, 1.5); g.fill({ color: 0xfef08a });
          g.circle(cx, cy - 6, 1.8); g.fill({ color: 0xfde047 });
          g.circle(cx + 3, cy - 5, 1.5); g.fill({ color: 0xfef08a });
          break;
        }
      }
    }

    // 6. Special Realm Occupant Token Overlays
    if (p.occupantRealmId === "player") {
      const isHome = p.id === state.board.homeProvinceId;
      const cult = culturePalette(sim.playerCultureId ? sim.playerCultureId(state) : undefined);
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

        // Flagpole & royal swallowtail standard
        g.moveTo(cx, cy + 3); g.lineTo(cx, cy - 13);
        g.stroke({ width: 1.3, color: 0x78350f });
        g.circle(cx, cy - 13.5, 1.3); g.fill({ color: 0xfacc15 });

        const flagWave = Math.sin(phase * 4 + p.x * 2) * 2;
        g.poly([
          cx, cy - 13,
          cx + 8 + flagWave, cy - 10,
          cx + 6 + flagWave * 0.7, cy - 7,
          cx + 8 + flagWave, cy - 5,
          cx, cy - 5,
        ]);
        g.fill({ color: playerTabardCol });

        // Small shelter tent
        g.poly([cx - 8, cy + 5, cx - 3, cy, cx + 1, cy + 5]);
        g.fill({ color: 0xb45309 });
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

        // Territory flag
        g.moveTo(cx - 3, cy + 4); g.lineTo(cx - 3, cy - 12);
        g.stroke({ width: 1.2, color: pal.rimColor });
        g.circle(cx - 3, cy - 12.5, 1.2); g.fill({ color: pal.studColor });

        const flagWave = Math.sin(phase * 4 + p.x * 2) * 1.8;
        g.poly([
          cx - 3, cy - 12,
          cx + 5 + flagWave, cy - 9.5,
          cx + 3 + flagWave * 0.6, cy - 7.5,
          cx + 5 + flagWave, cy - 5.5,
          cx - 3, cy - 5.5,
        ]);
        g.fill({ color: pal.pennantColor });

        // Supply crate
        g.rect(cx + 2, cy + 1, 5, 4);
        g.fill({ color: pal.keepWallColor });
        g.stroke({ width: 0.8, color: pal.borderColor });
      }
    }
  }
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

export function paintBoardHighlight(
  g: Graphics,
  bx: number,
  by: number,
  state: GameState | null
): void {
  g.clear();
  const { wx, wy } = boardGridToWorld(bx, by);
  const p = state?.board?.provinces?.find((pr) => pr.x === bx && pr.y === by);
  const seen = (state && p) ? isProvinceSeen(state, p.id) : true;
  const elev = (p && seen) ? terrainElevation(p.terrain) : 4;
  const cy = wy - elev;
  const hw = BOARD_HALF_W;
  const hh = BOARD_HALF_H;

  // 1. Glowing selection border around the isometric diamond
  g.poly([
    wx, cy - hh - 1,
    wx + hw + 1, cy,
    wx, cy + hh + 1,
    wx - hw - 1, cy,
  ]);
  g.stroke({ width: 2, color: 0xfef08a, alpha: 0.95 });

  if (elev > 0) {
    g.moveTo(wx - hw - 1, cy);
    g.lineTo(wx - hw - 1, wy);
    g.lineTo(wx, wy + hh + 1);
    g.lineTo(wx + hw + 1, wy);
    g.lineTo(wx + hw + 1, cy);
    g.stroke({ width: 1.5, color: 0xfef08a, alpha: 0.65 });
  }

  // 2. Information plaque at bottom of diorama table
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

