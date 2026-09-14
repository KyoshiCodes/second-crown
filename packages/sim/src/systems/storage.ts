import type { GameState } from "@second-crown/shared";
import Decimal from "break_infinity.js";
import { D, toDecimalString } from "../core/decimal.js";
import { countBuilding } from "../content/buildings.js";
import { vaultProtects } from "./vault.js";

const CAPPED_RESOURCES = ["food", "wood", "stone", "gold"] as const;
type CappedResource = (typeof CAPPED_RESOURCES)[number];

/** Base warehouse size before any storage building is finished. */
const BASE_CAP: Record<CappedResource, number> = {
  food: 200,
  wood: 150,
  stone: 150,
  gold: 100,
};

/** Which finished building raises which resource's cap (reuses existing bulk-production buildings). */
const CAP_BUILDING: Record<CappedResource, string> = {
  food: "granary",
  wood: "sawmill",
  stone: "mason",
  gold: "mint",
};

const CAP_PER_BUILDING: Record<CappedResource, number> = {
  food: 300,
  wood: 250,
  stone: 250,
  gold: 150,
};

function isCapped(res: string): res is CappedResource {
  return (CAPPED_RESOURCES as readonly string[]).includes(res);
}

function logisticsBonus(state: GameState): number {
  return Number(state.flags.research_logistics ?? 0) === 1 ? 50 : 0;
}

/** Finite warehouse ceiling for food/wood/stone/gold. Every other resource is uncapped. */
export function storageCap(state: GameState, res: string): number {
  if (!isCapped(res)) return Infinity;
  return BASE_CAP[res] + countBuilding(state, CAP_BUILDING[res]) * CAP_PER_BUILDING[res] + logisticsBonus(state);
}

export type ResourceLedger = {
  have: number;
  cap: number;
  vault: number;
  exposed: number;
  full: boolean;
};

/** Stock / warehouse / raid-safe floor for the HUD. */
export function resourceLedger(state: GameState, res: string): ResourceLedger {
  const have = D(state.resources[res] ?? "0").toNumber();
  const cap = storageCap(state, res);
  const vault = vaultProtects(state, res);
  const exposed = Math.max(0, have - vault);
  const full = Number.isFinite(cap) && have >= cap - 1e-9;
  return { have, cap, vault, exposed, full };
}

/**
 * Adds a gain to a resource, clamping the result at its storage cap so the excess is lost.
 * Non-positive amounts (spending) pass through uncapped.
 */
export function addCapped(state: GameState, res: string, amount: number | string | Decimal): void {
  const gain = D(amount);
  const current = D(state.resources[res] ?? "0");
  if (gain.lte(0)) {
    state.resources[res] = toDecimalString(current.add(gain));
    return;
  }
  const cap = storageCap(state, res);
  const next = current.add(gain);
  state.resources[res] = toDecimalString(Number.isFinite(cap) && next.gt(cap) ? D(cap) : next);
}
