import {
  MIST_FARM_BONUS,
  GLEN_QUARRY_BONUS,
  SALT_WOOD_BONUS,
  FEN_COTTAGE_BONUS,
  PEAK_KEEP_VISION_BONUS,
  getUnitType,
  cultureUnitForKit,
  cultureKitId,
} from "@second-crown/sim";

/** UI copy for one culture card: its own unit and its one difference. Reads sim numbers; adds no rules. */
export interface CultureLine {
  /** Unit name, or null when the culture has no unit of its own. */
  unit: string | null;
  /** Its one difference, or null when the culture changes looks only. */
  difference: string | null;
}

const UNIT_OF: Record<string, string> = {
  mist: "ranger",
  glen: "banner",
  salt: "outrider",
  fen: "warden",
  peak: "lancer",
};

const DIFFERENCE_OF: Record<string, string> = {
  mist: `Farm +${MIST_FARM_BONUS} food`,
  glen: `Quarry +${GLEN_QUARRY_BONUS} stone`,
  salt: `Lumber camp +${SALT_WOOD_BONUS} wood`,
  fen: `Cottage +${FEN_COTTAGE_BONUS} citizen`,
  peak: `Keep +${PEAK_KEEP_VISION_BONUS} vision`,
};

/** The five base cultures name the unit their kit opens (halberdier, cedar stalker, ...). */
const KIT_UNIT_CULTURES = ["western", "woodland", "desert", "steppe", "tide"];

function unitIdOf(id: string): string | undefined {
  if (UNIT_OF[id]) return UNIT_OF[id];
  return KIT_UNIT_CULTURES.includes(id) ? cultureUnitForKit(cultureKitId(id)) : undefined;
}

/** Sim unit id for a culture's own unit, or null when it has none. */
export function cultureUnitId(id: string): string | null {
  return unitIdOf(id) ?? null;
}

export function cultureLine(id: string): CultureLine {
  const unitId = unitIdOf(id);
  const unit = unitId ? getUnitType(unitId)?.name ?? null : null;
  return { unit, difference: DIFFERENCE_OF[id] ?? null };
}
