import type { Graphics } from "pixi.js";
import type { GameState, Province } from "@second-crown/shared";
import { BOARD_W, BOARD_H } from "@second-crown/shared";
import { isProvinceSeen as simIsProvinceSeen, listMarches } from "@second-crown/sim";
import { provinceTokenBounds } from "./camera.js";
import { terrainElevation } from "./tiles.js";
import {
  getNodeStockInfo,
  formatStockBadgeText,
  getPostedGarrison,
  hasProvinceClash,
  hasProvinceIncoming,
  hasProvinceGather,
  realmTokenPalette,
} from "./tokens.js";

// ---------------------------------------------------------------------------
// Province hover tooltip (wave/board-hover)
// A small text card over the hovered province: STOCK, OWNER and STATUS rows in
// 3x5 pixel letters. It sits on its own TOP board layer, above weather, fog,
// roads, marches, keeps, units, piles, camps, effects, the select rim, the hover
// rim, the almanac and the unit labels, so nothing on the board can cover it.
// Steady dark ink plate + pale halo + a status-coloured rim: it reads on snow,
// rain, storm dim, night and the fog veil. Unseen tiles show only "UNSCOUTED"
// (fog stays fog). Render only: reads state, never writes it.
// ---------------------------------------------------------------------------

export const BOARD_HOVER_TIP_INK = 0x0b0f17;
export const BOARD_HOVER_TIP_INK_ALPHA = 0.95;
export const BOARD_HOVER_TIP_HALO = 0xfff7d6;
export const BOARD_HOVER_TIP_HALO_ALPHA = 0.6;
export const BOARD_HOVER_TIP_KEY_COLOR = 0x94a3b8;
export const BOARD_HOVER_TIP_VALUE_COLOR = 0xfaf3e0;
export const BOARD_HOVER_TIP_MUTED_COLOR = 0x9ca3af;
/** Inner padding, row height (5px glyphs) and gap between rows. */
export const BOARD_HOVER_TIP_PAD = 3;
export const BOARD_HOVER_TIP_ROW_H = 5;
export const BOARD_HOVER_TIP_ROW_GAP = 2;
/** Plate bottom sits this far above the tile centre (clears keeps and meeples). */
export const BOARD_HOVER_TIP_LIFT = 26;
/** When flipped below a top-row tile, the plate top sits this far under the tile centre. */
export const BOARD_HOVER_TIP_DROP = 14;
/** Longest value shown (realm names are cut to this). */
export const BOARD_HOVER_TIP_MAX_CHARS = 14;

export type BoardHoverStatus =
  | "unscouted"
  | "clash"
  | "incoming"
  | "marching"
  | "home"
  | "garrison"
  | "gathering"
  | "ruins"
  | "rival"
  | "dry"
  | "open";

export const BOARD_HOVER_STATUS_TEXT: Record<BoardHoverStatus, string> = {
  unscouted: "UNSCOUTED",
  clash: "CLASH",
  incoming: "INCOMING",
  marching: "MARCHING",
  home: "HOME",
  garrison: "GARRISON",
  gathering: "GATHERING",
  ruins: "RUINS",
  rival: "RIVAL HELD",
  dry: "DRY",
  open: "OPEN",
};

/** Status colours: also the plate rim, so the card's edge says the status at a glance. */
export const BOARD_HOVER_STATUS_COLORS: Record<BoardHoverStatus, number> = {
  unscouted: 0xa8a29e,
  clash: 0xfca5a5,
  incoming: 0xfdba74,
  marching: 0xfde68a,
  home: 0xfde047,
  garrison: 0x6ee7b7,
  gathering: 0xfcd34d,
  ruins: 0xd6d3d1,
  rival: 0xf9a8d4,
  dry: 0x94a3b8,
  open: 0x86efac,
};

export const BOARD_HOVER_OWNER_YOU_COLOR = 0xfacc15;

export interface BoardHoverRow {
  key: "STOCK" | "OWNER" | "STATUS";
  value: string;
  color: number;
}

export interface BoardHoverTooltip {
  provinceId: string;
  seen: boolean;
  status: BoardHoverStatus;
  rim: number;
  rows: BoardHoverRow[];
  /** Tile centre the pointer aims at (board world space, terrain lift applied). */
  anchorX: number;
  anchorY: number;
  /** Plate rect in board world space, after clamping / flipping. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** True when the card sits under the tile (top-row tiles). */
  flipped: boolean;
}

const NODE_STOCK_WORD: Record<string, string> = {
  woodcut: "WOOD",
  quarry: "STONE",
  field: "GRAIN",
};

/** 3x5 pixel font: each row is 3 bits, 4 = left column. Unknown chars draw as blanks. */
export const BOARD_HOVER_GLYPHS_3X5: Record<string, number[]> = {
  "0": [7, 5, 5, 5, 7], "1": [2, 6, 2, 2, 7], "2": [7, 1, 7, 4, 7], "3": [7, 1, 7, 1, 7],
  "4": [5, 5, 7, 1, 1], "5": [7, 4, 7, 1, 7], "6": [7, 4, 7, 5, 7], "7": [7, 1, 1, 1, 1],
  "8": [7, 5, 7, 5, 7], "9": [7, 5, 7, 1, 7],
  A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6],
  E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4], G: [3, 4, 5, 5, 3], H: [5, 5, 7, 5, 5],
  I: [7, 2, 2, 2, 7], J: [1, 1, 1, 5, 2], K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7],
  M: [5, 7, 7, 5, 5], N: [6, 5, 5, 5, 5], O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4],
  Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5], S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2],
  U: [5, 5, 5, 5, 7], V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5],
  Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7],
  "/": [1, 1, 2, 4, 4], "-": [0, 0, 7, 0, 0], "?": [6, 1, 2, 0, 2], ".": [0, 0, 0, 0, 2],
  " ": [0, 0, 0, 0, 0],
};

/** Upper-cases and strips to the glyph set, then cuts to `max` chars. */
export function toHoverText(raw: string, max: number = BOARD_HOVER_TIP_MAX_CHARS): string {
  const clean = String(raw ?? "")
    .toUpperCase()
    .replace(/[_]+/g, " ")
    .split("")
    .filter((ch) => ch in BOARD_HOVER_GLYPHS_3X5)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > max ? clean.slice(0, max) : clean;
}

/** Text width for 3x5 glyphs at 4px per char (3px glyph + 1px gap), no trailing gap. */
export function hoverTextWidth(text: string): number {
  return text.length > 0 ? text.length * 4 - 1 : 0;
}

function isSeen(state: GameState, provinceId: string): boolean {
  const safe = state?.meta
    ? state
    : ({ ...state, meta: { version: 1, seed: 0, tick: 0, lastRealTime: 0, playTimeMs: 0 } } as GameState);
  try {
    return simIsProvinceSeen(safe, provinceId);
  } catch {
    return false;
  }
}

function safeMarches(state: GameState): ReturnType<typeof listMarches> {
  try {
    return listMarches(state);
  } catch {
    return [];
  }
}

/** Which single status the card shows. Most urgent first. Pure. */
export function resolveBoardHoverStatus(state: GameState, p: Province): BoardHoverStatus {
  if (!isSeen(state, p.id)) return "unscouted";
  if (hasProvinceClash(state, p.id)) return "clash";
  if (hasProvinceIncoming(state, p.id)) return "incoming";
  if (safeMarches(state).some((m) => m.toId === p.id)) return "marching";
  if (p.id === state.board?.homeProvinceId) return "home";
  if (getPostedGarrison(state, p.id).posted) return "garrison";
  if (hasProvinceGather(state, p.id)) return "gathering";
  if (p.node === "ruins") return "ruins";
  if (p.occupantRealmId && p.occupantRealmId !== "player" && p.occupantRealmId !== "none") return "rival";
  const info = getNodeStockInfo(state, p.id, p.node);
  if (info.max > 0 && !info.hasStock) return "dry";
  return "open";
}

function ownerRow(state: GameState, p: Province): BoardHoverRow {
  const occ = p.occupantRealmId;
  if (p.id === state.board?.homeProvinceId || occ === "player") {
    return { key: "OWNER", value: "YOU", color: BOARD_HOVER_OWNER_YOU_COLOR };
  }
  if (!occ || occ === "none") {
    return { key: "OWNER", value: "NONE", color: BOARD_HOVER_TIP_MUTED_COLOR };
  }
  const realm = state.realms?.find((r) => r.id === occ);
  const value = toHoverText(realm?.name || occ) || "RIVAL";
  return { key: "OWNER", value, color: realmTokenPalette(occ).accentColor };
}

function stockRow(state: GameState, p: Province): BoardHoverRow {
  const info = getNodeStockInfo(state, p.id, p.node);
  const ratio = info.max > 0 ? formatStockBadgeText(info.stock, info.max) : null;
  if (!ratio) return { key: "STOCK", value: "-", color: BOARD_HOVER_TIP_MUTED_COLOR };
  const word = NODE_STOCK_WORD[p.node];
  const value = word ? `${ratio} ${word}` : ratio;
  return { key: "STOCK", value, color: info.hasStock ? BOARD_HOVER_TIP_VALUE_COLOR : BOARD_HOVER_TIP_MUTED_COLOR };
}

/** Board extents in world space (from the four corner tiles). */
function boardExtents(): { minX: number; maxX: number; minY: number } {
  const corners = [
    provinceTokenBounds(0, 0),
    provinceTokenBounds(BOARD_W - 1, 0),
    provinceTokenBounds(0, BOARD_H - 1),
    provinceTokenBounds(BOARD_W - 1, BOARD_H - 1),
  ];
  return {
    minX: Math.min(...corners.map((b) => b.x)),
    maxX: Math.max(...corners.map((b) => b.x + b.w)),
    minY: Math.min(...corners.map((b) => b.y)),
  };
}

/** Key column width: the longest key ("STATUS"). */
const KEY_COL_W = hoverTextWidth("STATUS");
/** Pip (3) + gap (2) before the key. */
const PIP_COL_W = 3 + 2;
/** Gap between key and value. */
const KEY_VALUE_GAP = 4;

/**
 * Resolves the tooltip for the province at board grid (bx, by): rows, colours and
 * where the plate sits. Null when there is no state or no province there. Pure.
 */
export function resolveBoardHoverTooltip(
  state: GameState | null | undefined,
  bx: number,
  by: number
): BoardHoverTooltip | null {
  if (!state?.board?.provinces) return null;
  const p = state.board.provinces.find((pr) => pr.x === bx && pr.y === by);
  if (!p) return null;

  const status = resolveBoardHoverStatus(state, p);
  const seen = status !== "unscouted";
  const rim = BOARD_HOVER_STATUS_COLORS[status];
  const statusRow: BoardHoverRow = { key: "STATUS", value: BOARD_HOVER_STATUS_TEXT[status], color: rim };
  const rows: BoardHoverRow[] = seen
    ? [stockRow(state, p), ownerRow(state, p), statusRow]
    : [
        { key: "STOCK", value: "?", color: BOARD_HOVER_TIP_MUTED_COLOR },
        { key: "OWNER", value: "?", color: BOARD_HOVER_TIP_MUTED_COLOR },
        statusRow,
      ];

  const pad = BOARD_HOVER_TIP_PAD;
  const valueW = Math.max(...rows.map((r) => hoverTextWidth(r.value)));
  const w = pad + PIP_COL_W + KEY_COL_W + KEY_VALUE_GAP + valueW + pad;
  const h = pad * 2 + rows.length * BOARD_HOVER_TIP_ROW_H + (rows.length - 1) * BOARD_HOVER_TIP_ROW_GAP;

  const b = provinceTokenBounds(p.x, p.y);
  const anchorX = b.cx;
  const anchorY = b.cy - terrainElevation(p.terrain);

  const ext = boardExtents();
  let x = Math.round(anchorX - w / 2);
  x = Math.max(Math.round(ext.minX), Math.min(Math.round(ext.maxX - w), x));
  let y = Math.round(anchorY - BOARD_HOVER_TIP_LIFT - h);
  let flipped = false;
  if (y < ext.minY - 4) {
    y = Math.round(anchorY + BOARD_HOVER_TIP_DROP);
    flipped = true;
  }

  return { provinceId: p.id, seen, status, rim, rows, anchorX, anchorY, x, y, w, h, flipped };
}

/** Adds 3x5 glyph rects for `text` at (x, y); caller fills. */
function addHoverGlyphs(g: Graphics, text: string, x: number, y: number): void {
  let cx = x;
  for (const ch of text) {
    const glyph = BOARD_HOVER_GLYPHS_3X5[ch];
    if (glyph) {
      for (let r = 0; r < 5; r++) {
        const bits = glyph[r];
        for (let col = 0; col < 3; col++) {
          if (bits & (4 >> col)) g.rect(cx + col, y + r, 1, 1);
        }
      }
    }
    cx += 4;
  }
}

/** Draws one tooltip card: pointer, pale halo, ink plate with status rim, then the rows. */
export function drawBoardHoverTooltip(g: Graphics, t: BoardHoverTooltip): void {
  if (!g) return;
  const { x, y, w, h, rim } = t;
  const ax = Math.max(x + 4, Math.min(x + w - 4, Math.round(t.anchorX)));

  // 1. Soft drop shadow
  g.rect(x + 1, y + 1.5, w, h);
  g.fill({ color: 0x000000, alpha: 0.35 });

  // 2. Pointer toward the tile (down from the plate, or up when flipped)
  if (t.flipped) {
    g.poly([ax - 3, y, ax + 3, y, ax, y - 4]);
  } else {
    g.poly([ax - 3, y + h, ax + 3, y + h, ax, y + h + 4]);
  }
  g.fill({ color: BOARD_HOVER_TIP_INK, alpha: BOARD_HOVER_TIP_INK_ALPHA });

  // 3. Pale halo, steady ink plate, status rim
  g.rect(x - 1, y - 1, w + 2, h + 2);
  g.fill({ color: BOARD_HOVER_TIP_HALO, alpha: BOARD_HOVER_TIP_HALO_ALPHA });
  g.rect(x, y, w, h);
  g.fill({ color: BOARD_HOVER_TIP_INK, alpha: BOARD_HOVER_TIP_INK_ALPHA });
  g.stroke({ width: 1, color: rim, alpha: 0.95 });

  // 4. Rows: colour pip, muted key, bright value
  const pad = BOARD_HOVER_TIP_PAD;
  const keyX = x + pad + PIP_COL_W;
  const valueX = keyX + KEY_COL_W + KEY_VALUE_GAP;
  t.rows.forEach((row, i) => {
    const ry = y + pad + i * (BOARD_HOVER_TIP_ROW_H + BOARD_HOVER_TIP_ROW_GAP);
    g.rect(x + pad, ry + 1, 3, 3);
    g.fill({ color: row.color });
    addHoverGlyphs(g, row.key, keyX, ry);
    g.fill({ color: BOARD_HOVER_TIP_KEY_COLOR });
    addHoverGlyphs(g, row.value, valueX, ry);
    g.fill({ color: row.color === BOARD_HOVER_TIP_MUTED_COLOR ? row.color : BOARD_HOVER_TIP_VALUE_COLOR });
  });
}

/**
 * Clears `g` and paints the tooltip for the hovered province, or nothing when
 * `hovered` is null / off the board. Non-interactive.
 */
export function paintBoardHoverTooltip(
  g: Graphics,
  state: GameState | null | undefined,
  hovered: { bx: number; by: number } | null | undefined
): void {
  if (!g) return;
  g.clear();
  if ("eventMode" in g) {
    (g as any).eventMode = "none";
  }
  if (!hovered) return;
  const t = resolveBoardHoverTooltip(state, hovered.bx, hovered.by);
  if (!t) return;
  drawBoardHoverTooltip(g, t);
}
