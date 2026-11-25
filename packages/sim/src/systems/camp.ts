import type { GameState, Province } from "@second-crown/shared";
import { CAMP_TIERS, type CampTier, type CampTierId } from "../content/camps.js";

function hash(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

/** Bandit camp or ruin strength. Camps 5–9, ruins 7–11 (light pressure pass); a 5-militia levy still clears camps. */
export function campThreat(state: GameState, p: Province): number {
  if (p.node !== "camp" && p.node !== "ruins") return 0;
  const h = hash(state.meta.seed + p.x * 17 + p.y * 31);
  const base = p.node === "ruins" ? 7 : 5;
  return base + (h % 5);
}

function distHome(state: GameState, p: Province): number {
  const home = state.board.provinces.find((q) => q.id === state.board.homeProvinceId);
  if (!home) return 0;
  return Math.abs(home.x - p.x) + Math.abs(home.y - p.y);
}

/** Broken camps waiting to come back (march.ts respawn list). They keep their site. */
function respawningCampIds(state: GameState): Set<string> {
  const raw = state.flags?.["respawn_json"];
  if (typeof raw !== "string" || !raw) return new Set();
  try {
    const list = JSON.parse(raw) as { id: string; node: string }[];
    return new Set(list.filter((r) => r.node === "camp").map((r) => r.id));
  } catch {
    return new Set();
  }
}

function byDistance(state: GameState, a: Province, b: Province): number {
  return distHome(state, a) - distHome(state, b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/**
 * Which tier a camp is. Pure and deterministic, read from the board:
 * - nearest live camp to home = lean-to (safe starter; the next one takes over when it is flagged)
 * - farthest camp site (live or respawning) = stockade (hard, optional)
 * - all others = the old bandit camp
 */
export function campTierId(state: GameState, p: Province): CampTierId | null {
  if (p.node !== "camp") return null;
  const live = state.board.provinces.filter((q) => q.node === "camp" && !q.occupantRealmId);
  const respawning = respawningCampIds(state);
  const sites = state.board.provinces.filter(
    (q) => (q.node === "camp" && !q.occupantRealmId) || (respawning.has(q.id) && q.node === "none" && !q.occupantRealmId)
  );
  const starter = [...live].sort((a, b) => byDistance(state, a, b))[0];
  if (starter && starter.id === p.id) return "lean_to";
  const far = [...sites].sort((a, b) => byDistance(state, b, a))[0];
  if (far && far.id === p.id && sites.length > 1) return "stockade";
  return "camp";
}

export function campTier(state: GameState, p: Province): CampTier | null {
  const id = campTierId(state, p);
  return id ? CAMP_TIERS[id] : null;
}
