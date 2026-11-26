import React from "react";
import { getUnitType, type UnitRole } from "@second-crown/sim";
import "./force-mix-chips.css";

export interface ForceMixPart {
  typeId: string;
  count: number;
  shortName: string;
  role: UnitRole;
}

const SHORT_UNIT_NAME: Record<string, string> = {
  militia: "militia",
  spearman: "spears",
  archer: "archers",
  ranger: "rangers",
  cavalry: "cavalry",
  outrider: "outriders",
  knight: "knights",
  skirmisher: "skirmishers",
  siege: "siege",
  banner: "banners",
  warden: "wardens",
  lancer: "lancers",
  champion: "champions",
};

/** Summarizes non-zero unit types in a column/garrison/gather force, sorted largest-first. */
export function summarizeForceMix(force: Readonly<Record<string, number>> | undefined): ForceMixPart[] {
  if (!force) return [];
  const parts: ForceMixPart[] = [];
  for (const [typeId, rawCount] of Object.entries(force)) {
    if (typeof rawCount !== "number" || !Number.isFinite(rawCount) || rawCount <= 0) continue;
    const count = Math.round(rawCount);
    if (count < 1) continue;
    const def = getUnitType(typeId);
    const shortName = SHORT_UNIT_NAME[typeId] ?? def?.name.toLowerCase() ?? typeId;
    parts.push({
      typeId,
      count,
      shortName,
      role: def?.role ?? "line",
    });
  }
  return parts.sort((a, b) => b.count - a.count || a.typeId.localeCompare(b.typeId));
}

/** True when two or more distinct unit types are present (single-type militia blobs stay quiet). */
export function isMixedForce(force: Readonly<Record<string, number>> | undefined): boolean {
  return summarizeForceMix(force).length >= 2;
}

/** Quiet non-blocking chip/pip group rendered only when a column, gather, or garrison has mixed unit types. */
export function ForceMixChips(props: {
  force?: Readonly<Record<string, number>>;
  returning?: boolean;
  compact?: boolean;
}) {
  const parts = summarizeForceMix(props.force);
  if (parts.length < 2) return null;
  const shown = parts.slice(0, 3);
  const extra = parts.length - shown.length;
  const label = `${props.returning ? "Returning mixed force: " : "Mixed force: "}${parts
    .map((p) => `${p.count} ${p.shortName}`)
    .join(", ")}`;

  return (
    <span
      className={`sc-force-mix${props.returning ? " is-returning" : ""}${props.compact ? " is-compact" : ""}`}
      data-force-mix={parts.map((p) => p.typeId).join(",")}
      data-returning={props.returning ? "true" : undefined}
      aria-label={label}
    >
      {props.returning ? <span className="sc-force-mix-return-mark" aria-hidden="true">↩</span> : null}
      {shown.map((p, idx) => (
        <span key={p.typeId} className={`sc-force-mix-chip role-${p.role}`} data-unit-type={p.typeId}>
          <span
            className={`sc-force-mix-dot role-${p.role}`}
            style={{ animationDelay: `-${(idx * 0.7).toFixed(1)}s` }}
            aria-hidden="true"
          />
          {p.count} {p.shortName}
        </span>
      ))}
      {extra > 0 ? <span className="sc-force-mix-chip is-more">+{extra}</span> : null}
    </span>
  );
}
