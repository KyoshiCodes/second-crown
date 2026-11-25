import {
  projectCost,
  type BlockReason,
  type CostProjection,
  type RealmRates,
} from "../projection";

export type LivingBlockerKind = "warehouse" | "prereq" | "busy";
export type LivingBlockerShape = "cap" | "link" | "glass";

export interface LivingBlockerMeta {
  kind: LivingBlockerKind;
  label: string;
  title: string;
  shape: LivingBlockerShape;
}

export const LIVING_BLOCKER_META: Record<LivingBlockerKind, LivingBlockerMeta> = {
  warehouse: {
    kind: "warehouse",
    label: "Cap",
    title: "Warehouse too small",
    shape: "cap",
  },
  prereq: {
    kind: "prereq",
    label: "Prereq",
    title: "Missing prerequisite",
    shape: "link",
  },
  busy: {
    kind: "busy",
    label: "Busy",
    title: "Lectern busy",
    shape: "glass",
  },
};

const LIVING_BLOCKER_SET = new Set<string>(["warehouse", "prereq", "busy"]);

/**
 * Extracts unique non-saving structural/capacity blocker kinds ("warehouse", "prereq", "busy")
 * in order of appearance. Explicitly ignores "stores" (handled by SavingPip) and "keep"/"hall".
 */
export function resolveLivingBlockers(reasons: readonly BlockReason[]): LivingBlockerKind[] {
  const seen = new Set<LivingBlockerKind>();
  const out: LivingBlockerKind[] = [];
  for (const r of reasons) {
    if (!LIVING_BLOCKER_SET.has(r.kind)) continue;
    const kind = r.kind as LivingBlockerKind;
    if (!seen.has(kind)) {
      seen.add(kind);
      out.push(kind);
    }
  }
  return out;
}

/** True when any part of a projected cost exceeds current warehouse capacity. */
export function hasWarehouseBlocker(p: CostProjection): boolean {
  return p.parts.some((x) => x.overCap);
}

/** Projects partial resource cost tables (e.g. building costs), filtering undefined values. */
export function projectPartialCost(
  cost: Partial<Record<string, string | number | undefined>>,
  rates: RealmRates,
): CostProjection {
  const clean: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(cost)) {
    if (v !== undefined) clean[k] = v;
  }
  return projectCost(clean, rates);
}

/** Type guard for negative finite net food rates. */
export function isFoodInDeficit(netFood: number | null | undefined): netFood is number {
  return typeof netFood === "number" && Number.isFinite(netFood) && netFood < 0;
}
