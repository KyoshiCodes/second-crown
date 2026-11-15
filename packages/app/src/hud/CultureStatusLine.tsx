import React from "react";
import {
  CULTURE_UNITS,
  RESEARCH,
  cottageCultureBonus,
  farmCultureBonus,
  getCulture,
  getUnitType,
  keepVisionCultureBonus,
  playerCultureId,
  playerCultureUnitId,
  quarryCultureBonus,
  unitUnlocked,
  woodCultureBonus,
  type GameState,
} from "@second-crown/sim";
import { CultureCrestPip } from "./CultureCrestPip";
import { CULTURE_UNIQUE_UNITS } from "./CultureUnitChip";
import "./culture-status-line.css";

export interface CultureStatus {
  /** The sim's `playerCultureId`. */
  id: string;
  name: string;
  /** The culture's one rule difference, or null when it changes looks only. */
  bonus: {
    /** The rule in words, with the sim's own number. */
    text: string;
    /** What it adds right now, from the crown's finished buildings. 0 while nothing earns it. */
    now: number;
    /** The same amount in words, or why it is 0. */
    nowText: string;
  } | null;
  /** The unit this culture's halls open (the sim's `playerCultureUnitId`). Other kits never get it. */
  unit: { id: string; name: string; origin: string; blurb: string; open: boolean };
  /**
   * The unit shown beside this culture on the picker (ranger, banner, outrider, warden, lancer).
   * The sim does not tie it to the culture: every crown opens it with a study. Null for the five
   * base cultures.
   */
  paired: { id: string; name: string; study: string; open: boolean } | null;
  bonusText: string;
  unitText: string;
  pairedText: string;
}

function finished(state: GameState, typeId: string): number {
  return state.buildings.filter((b) => b.realmId === "player" && b.typeId === typeId && b.completesAtTick === null)
    .length;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** One rule per culture. Amounts come from the sim's culture bonus functions; nothing is decided here. */
function bonusOf(state: GameState): CultureStatus["bonus"] {
  const perBuilding = (
    each: number,
    typeId: string,
    rule: string,
    one: string,
    many: string,
    unit: string,
  ): CultureStatus["bonus"] => {
    const count = finished(state, typeId);
    const now = each * count;
    return {
      text: `${rule} +${each} ${unit}`,
      now,
      nowText: count > 0 ? `${plural(count, one, many)}: +${now} now` : `no finished ${one} yet`,
    };
  };

  const farm = farmCultureBonus(state, "player");
  if (farm > 0) return perBuilding(farm, "farm", "each finished farm feeds", "farm", "farms", "food per tick");
  const quarry = quarryCultureBonus(state, "player");
  if (quarry > 0) return perBuilding(quarry, "quarry", "each finished quarry cuts", "quarry", "quarries", "stone per tick");
  const wood = woodCultureBonus(state, "player");
  if (wood > 0) {
    return perBuilding(wood, "lumber_camp", "each finished lumber camp fells", "lumber camp", "lumber camps", "wood per tick");
  }
  const cottage = cottageCultureBonus(state, "player");
  if (cottage > 0) return perBuilding(cottage, "cottage", "each finished cottage holds", "cottage", "cottages", "citizen");
  const vision = keepVisionCultureBonus(state, "player");
  if (vision > 0) {
    const hasKeep = finished(state, "keep") > 0;
    return {
      text: `a finished keep sees +${vision} tile farther`,
      now: hasKeep ? vision : 0,
      nowText: hasKeep ? `+${vision} hold vision now` : "no finished keep yet",
    };
  }
  return null;
}

/** Reads the sim's culture helpers and builds the line's text. No rules here. */
export function cultureStatus(state: GameState): CultureStatus {
  const id = playerCultureId(state);
  const def = getCulture(id);
  const bonus = bonusOf(state);

  const unitId = playerCultureUnitId(state);
  const unitDef = getUnitType(unitId);
  const gate = CULTURE_UNITS.find((g) => g.unitId === unitId);
  const unit = {
    id: unitId,
    name: unitDef?.name ?? unitId,
    origin: gate?.origin ?? "",
    blurb: unitDef?.blurb ?? "",
    open: unitUnlocked(state, unitId),
  };

  const pairedId = CULTURE_UNIQUE_UNITS[id];
  const pairedDef = pairedId ? getUnitType(pairedId) : undefined;
  const study = pairedId
    ? Object.values(RESEARCH).find((r) => (r.unlocks as readonly string[]).includes(pairedId))
    : undefined;
  const paired =
    pairedId && pairedDef && study
      ? { id: pairedId, name: pairedDef.name, study: study.name, open: unitUnlocked(state, pairedId) }
      : null;

  return {
    id,
    name: def.name,
    bonus,
    unit,
    paired,
    bonusText: bonus ? `Bonus: ${bonus.text} (${bonus.nowText})` : "Bonus: none, this culture changes looks only",
    unitText: `Special unit: ${unit.name} (${unit.origin} halls only, ${unit.open ? "open on the Army tab" : "locked"})`,
    pairedText: paired
      ? `Picker unit: ${paired.name}, open to every crown after the ${paired.study} study (${
          paired.open ? "studied" : "not studied yet"
        })`
      : "",
  };
}

/**
 * Read-only culture status line for the Kingdom tab and the province inspect card: the current
 * culture, its one bonus, and the unit its halls unlock. It has no button; switching stays on the
 * Kingdom tab's culture line and the Crown tab's picker.
 */
export function CultureStatusLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const c = cultureStatus(state);
  return (
    <div
      className={`sc-culture-status-line${c.bonus ? " has-bonus" : " is-plain"}`}
      data-culture-status={c.id}
      data-culture-unit={c.unit.id}
      data-bonus-now={c.bonus ? c.bonus.now : 0}
    >
      <CultureCrestPip cultureId={c.id} size={14} isSelected className="sc-culture-status-icon" />
      <span className="sc-culture-status-text">
        <span className="sc-culture-status-label">Culture</span> · <strong>{c.name}</strong> ·{" "}
        <span className={`sc-culture-status-bonus${c.bonus && c.bonus.now > 0 ? " is-active" : ""}`}>{c.bonusText}</span>{" "}
        ·{" "}
        <span className={`sc-culture-status-unit${c.unit.open ? " is-open" : ""}`} title={c.unit.blurb || undefined}>
          {c.unitText}
        </span>
        {c.pairedText ? (
          <>
            {" "}
            · <span className="sc-culture-status-paired">{c.pairedText}</span>
          </>
        ) : null}
      </span>
    </div>
  );
}
