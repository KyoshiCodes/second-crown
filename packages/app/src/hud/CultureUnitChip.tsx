import React from "react";
import { cultureUnitGate, getUnitType } from "@second-crown/sim";
import { UnitIcon } from "../UnitIcon";
import "./culture-unit-chip.css";

/**
 * Which existing pixel silhouette a culture unit borrows, and which culture's kit it is drawn in.
 * Presentation only: the sim knows nothing about this table.
 */
const ART: Record<string, { art: string; culture: string; tone: string }> = {
  halberdier: { art: "spearman", culture: "western", tone: "western" },
  cedar_stalker: { art: "skirmisher", culture: "woodland", tone: "cedar" },
  dune_lancer: { art: "cavalry", culture: "desert", tone: "sand" },
  horse_archer: { art: "cavalry", culture: "steppe", tone: "steppe" },
  reef_raider: { art: "spearman", culture: "tide", tone: "islands" },
  ironclad: { art: "knight", culture: "western", tone: "iron" },
};

export function hasCultureUnitChip(typeId: string): boolean {
  return typeId in ART;
}

export interface CultureUnitChipProps {
  typeId: string;
  /** Size in pixels (default: 28) */
  size?: number;
  /** Whether the unit is unlocked and available to drill */
  open?: boolean;
}

/**
 * Army tab chip for the six culture units. Draws the unit in its home kit with a small origin
 * pip in the corner. Strictly pointer-events: none so the card button keeps every click.
 */
export function CultureUnitChip({ typeId, size = 28, open = true }: CultureUnitChipProps) {
  const spec = ART[typeId];
  if (!spec) return null;
  const origin = cultureUnitGate(typeId)?.origin ?? "";
  const name = getUnitType(typeId)?.name ?? typeId;
  return (
    <span
      className={`sc-culture-unit-chip is-${spec.tone} ${open ? "is-open" : "is-locked"}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
      title={open ? `${name} (${origin})` : `${name} (${origin}, locked)`}
      data-culture-unit={typeId}
      data-origin={origin}
      data-open={open}
    >
      <UnitIcon typeId={spec.art} size={size} animated={open} culture={spec.culture} />
      <span className="sc-culture-unit-pip" />
    </span>
  );
}
