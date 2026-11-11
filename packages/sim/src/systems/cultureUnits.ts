import type { GameState } from "@second-crown/shared";
import { listUnitTypes, type UnitType } from "../content/units.js";
import { playerCultureId } from "./culture.js";

/** The five building kits a culture can wear. Mist, glen, salt, fen and peak all build as western. */
export type CultureKitId = "western" | "cedar" | "sand" | "steppe" | "islands";

const KIT_OF: Record<string, CultureKitId> = {
  woodland: "cedar",
  desert: "sand",
  steppe: "steppe",
  tide: "islands",
};

/** Kit for a culture id. Anything unknown builds as western. */
export function cultureKitId(cultureId: string | undefined): CultureKitId {
  return KIT_OF[String(cultureId ?? "")] ?? "western";
}

export function playerCultureKit(state: GameState): CultureKitId {
  return cultureKitId(playerCultureId(state));
}

/** How one culture unit is opened: by the crown's kit, or by a finished study. Exactly one is set. */
export type CultureUnitGate =
  | { unitId: string; origin: string; kit: CultureKitId; research?: undefined }
  | { unitId: string; origin: string; kit?: undefined; research: "fortification" };

/**
 * One unit per culture. Five follow the crown's kit. The Iron March is the rival realm, not a
 * culture a crown can pick, so its ironclad is copied through the Fortification study instead.
 */
export const CULTURE_UNITS: readonly CultureUnitGate[] = [
  { unitId: "halberdier", origin: "Western", kit: "western" },
  { unitId: "cedar_stalker", origin: "Cedar", kit: "cedar" },
  { unitId: "dune_lancer", origin: "Sand", kit: "sand" },
  { unitId: "horse_archer", origin: "Steppe", kit: "steppe" },
  { unitId: "reef_raider", origin: "Islands", kit: "islands" },
  { unitId: "ironclad", origin: "Iron March", research: "fortification" },
];

export function cultureUnitGate(typeId: string): CultureUnitGate | undefined {
  return CULTURE_UNITS.find((g) => g.unitId === typeId);
}

export function isCultureUnit(typeId: string): boolean {
  return cultureUnitGate(typeId) !== undefined;
}

/** The unit a kit opens. */
export function cultureUnitForKit(kit: CultureKitId): string {
  return CULTURE_UNITS.find((g) => g.kit === kit)!.unitId;
}

/** The kit unit the player's crown can train right now. */
export function playerCultureUnitId(state: GameState): string {
  return cultureUnitForKit(playerCultureKit(state));
}

/** False only for another kit's unit. Those never appear on this crown's roster. */
export function unitInRoster(state: GameState, typeId: string): boolean {
  const gate = cultureUnitGate(typeId);
  return !gate || !gate.kit || gate.kit === playerCultureKit(state);
}

/** Every unit this crown can train or unlock: the base roster, its own kit unit, and the ironclad. */
export function listRosterUnitTypes(state: GameState): UnitType[] {
  return listUnitTypes().filter((u) => unitInRoster(state, u.id));
}
