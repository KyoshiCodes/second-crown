import React from "react";
import { RangerChip } from "./RangerChip";
import { BannerChip } from "./BannerChip";
import { OutriderChip } from "./OutriderChip";
import { WardenChip } from "./WardenChip";
import { LancerChip } from "./LancerChip";
import "./culture-unit-chip.css";

export const CULTURE_UNIQUE_UNITS: Record<string, string> = {
  mist: "ranger",
  glen: "banner",
  salt: "outrider",
  fen: "warden",
  peak: "lancer",
};

export const UNIT_TO_CULTURE: Record<string, string> = {
  ranger: "mist",
  banner: "glen",
  outrider: "salt",
  warden: "fen",
  lancer: "peak",
};

export function isCultureUniqueUnit(unitId: string): boolean {
  return unitId in UNIT_TO_CULTURE;
}

export const hasCultureUnitChip = isCultureUniqueUnit;

export function cultureForUniqueUnit(unitId: string): string | null {
  return UNIT_TO_CULTURE[unitId] ?? null;
}

export interface CultureUnitChipProps {
  /** Culture id (e.g. "mist", "glen", "salt", "fen", "peak") */
  cultureId?: string;
  /** Sim unit type id (e.g. "ranger", "banner", "outrider", "warden", "lancer") */
  unitId?: string;
  /** Alias for unitId */
  typeId?: string;
  /** Size in pixels (default: 28) */
  size?: number;
  /** Whether the unit is available / unlocked (default: true) */
  open?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * 28px Living Chip for each culture's unique unit:
 * - Mist Reach: Ranger (peaked cowl hood, composite recurve bow, mist-blue cloak, drifting mist wisps)
 * - Glen Holds: Banner (iron kettle helm, targe shield, tall ash spear, flying heraldic swallowtail pennant)
 * - Salt Reaches: Outrider (galloping scout horse, salt-grey cloak, couched lance, silver dust motes)
 * - Fen Steads: Warden (layered fen-reed cloak, rush fringes, short spear, woven reed boss shield)
 * - Peak Holds: Lancer (barded mountain warhorse, peak-white cloak, full plate, long couched lance, frost motes)
 *
 * Strictly `pointer-events: none !important` to ensure buttons, clicks, and training are never obstructed.
 */
export function CultureUnitChip({
  cultureId,
  unitId,
  typeId,
  size = 28,
  open = true,
  className = "",
  style,
  title,
}: CultureUnitChipProps) {
  const resolvedUnitId = unitId ?? typeId ?? (cultureId ? CULTURE_UNIQUE_UNITS[cultureId] : undefined);
  const resolvedCultureId = cultureId ?? (resolvedUnitId ? UNIT_TO_CULTURE[resolvedUnitId] : undefined);

  if (!resolvedUnitId) return null;

  const defaultTitle =
    resolvedUnitId === "ranger"
      ? "Mist Reach · Ranger"
      : resolvedUnitId === "banner"
        ? "Glen Holds · Banner"
        : resolvedUnitId === "outrider"
          ? "Salt Reaches · Outrider"
          : resolvedUnitId === "warden"
            ? "Fen Steads · Warden"
            : resolvedUnitId === "lancer"
              ? "Peak Holds · Lancer"
              : resolvedUnitId;

  return (
    <span
      className={`sc-culture-unit-chip-container ${open ? "is-open" : "is-locked"} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        pointerEvents: "none",
        userSelect: "none",
        verticalAlign: "middle",
        lineHeight: 1,
        ...style,
      }}
      aria-hidden="true"
      title={title ?? defaultTitle}
      data-culture-unit-chip="true"
      data-unit-culture={resolvedCultureId}
      data-unit={resolvedUnitId}
      data-open={open}
    >
      {resolvedUnitId === "ranger" ? (
        <RangerChip size={size} open={open} title={title ?? defaultTitle} />
      ) : resolvedUnitId === "banner" ? (
        <BannerChip size={size} open={open} title={title ?? defaultTitle} />
      ) : resolvedUnitId === "outrider" ? (
        <OutriderChip size={size} open={open} title={title ?? defaultTitle} />
      ) : resolvedUnitId === "warden" ? (
        <WardenChip size={size} open={open} title={title ?? defaultTitle} />
      ) : resolvedUnitId === "lancer" ? (
        <LancerChip size={size} open={open} title={title ?? defaultTitle} />
      ) : null}
    </span>
  );
}
